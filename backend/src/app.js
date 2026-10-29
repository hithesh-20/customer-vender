const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { Server: SocketIOServer } = require('socket.io');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/config');
const { testConnection, syncModels } = require('./config/database');
const cache = require('./config/redis');
require('./config/firebase');
const logger = require('./utils/logger');
const { verifyToken } = require('./middleware/auth.middleware');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const { Category, Order } = require('./models');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const addressRoutes = require('./routes/address.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const reviewRoutes = require('./routes/review.routes');
const supportRoutes = require('./routes/support.routes');
const customerRoutes = require('./routes/customer.routes');
const udhaarRoutes = require('./routes/udhaar.routes');
const routeRoutes = require('./routes/route.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const voiceRoutes = require('./routes/voice.routes');
const weatherRoutes = require('./routes/weather.routes');
const loyaltyRoutes = require('./routes/loyalty.routes');
const notificationRoutes = require('./routes/notification.routes');
const settingsRoutes = require('./routes/settings.routes');
const webhookRoutes = require('./routes/webhook.routes');

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

app.set('io', io);
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);
app.use(cors(config.corsOptions));
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

if (!config.isTest) {
  app.use(
    morgan('short', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
});

app.use('/api', apiLimiter);

// OpenAPI 3.0 Spec
const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'VenderSathi API',
    version: config.app.version,
    description:
      'VenderSathi Hyperlocal Customer Delivery & Street Vendor Commerce REST API',
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Healthcheck
const healthHandler = async (req, res) => {
  res.json({
    success: true,
    service: 'vendersathi-backend',
    version: config.app.version,
    environment: config.env,
    database: config.database.dialect,
    cacheBackend: config.redis.enabled ? 'redis' : 'memory',
    integrations: {
      onlinePayments: config.razorpay.enabled,
      smsOtp: config.twilio.enabled,
      weather: config.weather.enabled,
      liveMaps: config.googleMaps.enabled,
    },
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/api/v1/health', healthHandler);

const apiV1 = express.Router();

// Public & Self-Guarded Routes
apiV1.use('/auth', authRoutes);
apiV1.use('/users', userRoutes);
apiV1.use('/vendors', userRoutes);
apiV1.use('/products', productRoutes);
apiV1.use('/addresses', addressRoutes);
apiV1.use('/cart', cartRoutes);
apiV1.use('/orders', orderRoutes);
apiV1.use('/payments', paymentRoutes);
apiV1.use('/reviews', reviewRoutes);
apiV1.use('/support', supportRoutes);
apiV1.use('/weather', weatherRoutes);
apiV1.use('/webhooks', webhookRoutes);

// Authenticated Routes
apiV1.use('/notifications', verifyToken, notificationRoutes);
apiV1.use('/settings', verifyToken, settingsRoutes);
apiV1.use('/customers', verifyToken, customerRoutes);
apiV1.use('/udhaars', verifyToken, udhaarRoutes);
apiV1.use('/routes', verifyToken, routeRoutes);
apiV1.use('/analytics', verifyToken, analyticsRoutes);
apiV1.use('/voice', verifyToken, voiceRoutes);
apiV1.use('/loyalty', verifyToken, loyaltyRoutes);

app.use('/api/v1', apiV1);

// Socket.io Real-time Order Status & Messaging (JWT-verified rooms)
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
    } catch (_) {
      // unauthenticated socket cannot join private user/order rooms
    }
  }
  next();
});

io.on('connection', (socket) => {
  if (socket.userId) {
    if (socket.userRole === 'vendor') {
      socket.join(`vendor:${socket.userId}`);
    } else {
      socket.join(`customer:${socket.userId}`);
    }
  }

  socket.on('join:order', async (orderId) => {
    if (!socket.userId || !orderId) return;
    try {
      const order = await Order.findByPk(orderId);
      if (
        order &&
        (order.customerUserId === socket.userId || order.vendorId === socket.userId)
      ) {
        socket.join(`order:${orderId}`);
      }
    } catch (_) {
      // ignore invalid order join
    }
  });

  socket.on('leave:order', (orderId) => {
    if (orderId) socket.leave(`order:${orderId}`);
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function ensureCategoryTaxonomy() {
  const existingCount = await Category.count();
  if (existingCount === 0) {
    await Category.bulkCreate(Category.DEFAULT_TAXONOMY);
  }
}

async function initApp({ ensureTaxonomy = true } = {}) {
  await testConnection();
  await cache.initRedis();
  await syncModels({ force: false, alter: false });
  if (ensureTaxonomy) {
    await ensureCategoryTaxonomy();
  }
  return { app, server, io };
}

if (require.main === module) {
  initApp({ ensureTaxonomy: true })
    .then(() => {
      server.listen(config.port, config.host, () => {
        logger.info(
          `🚀 VenderSathi Backend running at http://${config.host}:${config.port} (${config.env})`
        );
      });
    })
    .catch((err) => {
      logger.error(`Fatal startup error: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { app, server, io, initApp };
