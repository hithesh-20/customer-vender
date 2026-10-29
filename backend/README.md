# VendorSaathi Backend

## 📋 Overview

This is the **Backend API Server** for **VendorSaathi** - an AI-Driven Voice Commerce & Intelligent Mobility Platform for Vendors. Built with **Node.js**, **Express**, **PostgreSQL**, and **Sequelize ORM**.

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 7+
- npm or yarn

### 2. Installation

```bash
# Clone the repository (if not already cloned)
git clone https://github.com/vendorsaathi/vendorsaathi.git
cd vendor_saathi/backend

# Install dependencies
npm install
```

### 3. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 4. Database Setup

```bash
# Create database (PostgreSQL)
psql -U postgres -c "CREATE DATABASE vendor_saathi;"

# Run migrations
npm run migrate

# Optional: Seed database with sample data
npm run seed
```

### 5. Run the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

**Server will start at:** `http://localhost:3000`

### 6. Test the API

```bash
# Health check
curl http://localhost:3000/api/health

# API documentation (Swagger UI)
# Open in browser: http://localhost:3000/api-docs
```

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── app.js                      # Main application entry point
│   │
│   ├── config/
│   │   ├── config.js               # Application configuration
│   │   ├── database.js             # PostgreSQL database configuration
│   │   ├── firebase.js             # Firebase Admin SDK configuration
│   │   ├── redis.js                # Redis client configuration
│   │   └── migrations/             # Database migrations
│   │       ├── 20261029000000-create-users-table.js
│   │       ├── 20261029000001-create-products-table.js
│   │       ├── 20261029000002-create-orders-table.js
│   │       ├── 20261029000003-create-customers-table.js
│   │       └── 20261029000004-create-payments-table.js
│   │
│   ├── models/                     # Sequelize models
│   │   ├── user.model.js
│   │   ├── product.model.js
│   │   ├── order.model.js
│   │   ├── customer.model.js
│   │   ├── payment.model.js
│   │   ├── udhaar.model.js
│   │   ├── route.model.js
│   │   ├── category.model.js
│   │   └── ...
│   │
│   ├── controllers/                # Route controllers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── product.controller.js
│   │   ├── order.controller.js
│   │   ├── customer.controller.js
│   │   ├── payment.controller.js
│   │   ├── udhaar.controller.js
│   │   ├── route.controller.js
│   │   ├── analytics.controller.js
│   │   ├── voice.controller.js
│   │   ├── weather.controller.js
│   │   ├── loyalty.controller.js
│   │   └── notification.controller.js
│   │
│   ├── routes/                    # API routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── product.routes.js
│   │   ├── order.routes.js
│   │   ├── customer.routes.js
│   │   ├── payment.routes.js
│   │   ├── udhaar.routes.js
│   │   ├── route.routes.js
│   │   ├── analytics.routes.js
│   │   ├── voice.routes.js
│   │   ├── weather.routes.js
│   │   ├── loyalty.routes.js
│   │   ├── notification.routes.js
│   │   └── webhook.routes.js
│   │
│   ├── middleware/                 # Express middleware
│   │   ├── auth.middleware.js      # JWT authentication
│   │   ├── validator.middleware.js # Request validation
│   │   ├── error.middleware.js     # Error handling
│   │   ├── notFound.middleware.js  # 404 handler
│   │   ├── rateLimiter.middleware.js # Rate limiting
│   │   └── upload.middleware.js    # File upload handling
│   │
│   ├── services/                   # Business logic services
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── product.service.js
│   │   ├── order.service.js
│   │   ├── payment.service.js
│   │   ├── udhaar.service.js
│   │   ├── route.service.js
│   │   ├── analytics.service.js
│   │   ├── notification.service.js
│   │   ├── sms.service.js
│   │   ├── email.service.js
│   │   └── ai.service.js
│   │
│   ├── utils/                      # Utility functions
│   │   ├── logger.js              # Winston logger
│   │   ├── response.js            # API response helper
│   │   ├── pagination.js          # Pagination helper
│   │   ├── validation.js          # Validation rules
│   │   ├── geocoding.js           # Address to coordinates
│   │   ├── routeOptimizer.js      # Route optimization algorithm
│   │   └── demandForecaster.js    # Demand forecasting
│   │
│   ├── validators/                # Request validators
│   │   ├── auth.validator.js
│   │   ├── user.validator.js
│   │   ├── product.validator.js
│   │   ├── order.validator.js
│   │   └── common.validator.js
│   │
│   └── scripts/                   # Utility scripts
│       ├── seed.js                # Database seeding
│       ├── migrate.js             # Migration runner
│       └── generate-docs.js       # API documentation generator
│
├── package.json
├── Dockerfile
├── .env.example
├── .dockerignore
└── README.md
```

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with phone/password |
| POST | `/auth/register` | Register new vendor |
| POST | `/auth/login-otp` | Login with OTP |
| POST | `/auth/verify-otp` | Verify OTP |
| POST | `/auth/refresh` | Refresh JWT token |
| POST | `/auth/logout` | Logout |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users (Admin) |
| GET | `/users/me` | Get current user |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create user (Admin) |
| PUT | `/users/:id` | Update user |
| PATCH | `/users/profile` | Update profile |
| PATCH | `/users/password` | Change password |
| DELETE | `/users/:id` | Delete user (Admin) |
| GET | `/users/nearby` | Get nearby vendors |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products |
| GET | `/products/me` | List my products |
| GET | `/products/:id` | Get product by ID |
| GET | `/products/search` | Search products |
| GET | `/products/categories` | Get all categories |
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product |
| PATCH | `/products/:id/stock` | Update stock |
| DELETE | `/products/:id` | Delete product |
| POST | `/products/barcode` | Generate barcode |
| GET | `/products/low-stock` | Get low stock products |
| GET | `/products/featured` | Get featured products |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List all orders |
| GET | `/orders/me` | List my orders |
| GET | `/orders/:id` | Get order by ID |
| GET | `/orders/customer/:customerId` | Get orders by customer |
| POST | `/orders` | Create order |
| PUT | `/orders/:id` | Update order |
| PATCH | `/orders/:id/status` | Update order status |
| DELETE | `/orders/:id` | Delete order |
| GET | `/orders/today` | Get today's orders |
| GET | `/orders/pending` | Get pending orders |
| GET | `/orders/delivered` | Get delivered orders |
| POST | `/orders/:id/cancel` | Cancel order |
| POST | `/orders/:id/accept` | Accept order |
| POST | `/orders/:id/dispatch` | Dispatch order |
| POST | `/orders/:id/deliver` | Mark as delivered |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List all customers |
| GET | `/customers/me` | List my customers |
| GET | `/customers/:id` | Get customer by ID |
| GET | `/customers/search` | Search customers |
| POST | `/customers` | Create customer |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Delete customer |
| GET | `/customers/loyalty/:id` | Get customer loyalty |
| POST | `/customers/loyalty/:id/redeem` | Redeem loyalty points |
| GET | `/customers/top` | Get top customers |
| GET | `/customers/recent` | Get recent customers |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payments` | List all payments |
| GET | `/payments/me` | List my payments |
| GET | `/payments/:id` | Get payment by ID |
| POST | `/payments` | Create payment |
| PUT | `/payments/:id` | Update payment |
| DELETE | `/payments/:id` | Delete payment |
| GET | `/payments/order/:orderId` | Get payments by order |
| GET | `/payments/customer/:customerId` | Get payments by customer |
| POST | `/payments/process` | Process payment |
| POST | `/payments/refund` | Process refund |
| GET | `/payments/methods` | Get payment methods |
| GET | `/payments/summary` | Get payment summary |

### Udhaar (Credit)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/udhaar` | List all udhaar |
| GET | `/udhaar/me` | List my udhaar |
| GET | `/udhaar/:id` | Get udhaar by ID |
| POST | `/udhaar` | Create udhaar |
| PUT | `/udhaar/:id` | Update udhaar |
| DELETE | `/udhaar/:id` | Delete udhaar |
| GET | `/udhaar/customer/:customerId` | Get udhaar by customer |
| POST | `/udhaar/:id/payment` | Add udhaar payment |
| GET | `/udhaar/summary` | Get udhaar summary |
| GET | `/udhaar/overdue` | Get overdue udhaar |
| GET | `/udhaar/statement/:customerId` | Get udhaar statement |

### Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/routes` | List all routes |
| GET | `/routes/me` | List my routes |
| GET | `/routes/:id` | Get route by ID |
| POST | `/routes` | Create route |
| PUT | `/routes/:id` | Update route |
| DELETE | `/routes/:id` | Delete route |
| POST | `/routes/optimize` | Optimize route |
| GET | `/routes/current` | Get current route |
| GET | `/routes/history` | Get route history |
| POST | `/routes/:id/start` | Start route |
| POST | `/routes/:id/complete` | Complete route |
| POST | `/routes/:id/next-stop` | Move to next stop |
| GET | `/routes/:id/track` | Track route |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics` | Get business analytics |
| GET | `/analytics/sales` | Get sales analytics |
| GET | `/analytics/revenue` | Get revenue analytics |
| GET | `/analytics/profit` | Get profit analytics |
| GET | `/analytics/products` | Get product analytics |
| GET | `/analytics/customers` | Get customer analytics |
| GET | `/analytics/demand` | Get demand forecast |
| GET | `/analytics/orders` | Get order analytics |
| GET | `/analytics/payments` | Get payment analytics |
| GET | `/analytics/udhaar` | Get udhaar analytics |
| GET | `/analytics/routes` | Get route analytics |
| GET | `/analytics/dashboard` | Get dashboard data |
| GET | `/analytics/compare` | Compare periods |

### Voice
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/voice/recognize` | Recognize voice command |
| POST | `/voice/synthesize` | Synthesize speech |
| GET | `/voice/commands` | Get voice commands |
| POST | `/voice/commands` | Add voice command |
| DELETE | `/voice/commands/:id` | Delete voice command |
| GET | `/voice/settings` | Get voice settings |
| PUT | `/voice/settings` | Update voice settings |

### Weather
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/weather/current` | Get current weather |
| GET | `/weather/forecast` | Get weather forecast |
| GET | `/weather/alerts` | Get weather alerts |

### Loyalty
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/loyalty` | Get loyalty program info |
| GET | `/loyalty/points` | Get loyalty points |
| POST | `/loyalty/redeem` | Redeem loyalty points |
| GET | `/loyalty/tiers` | Get loyalty tiers |
| GET | `/loyalty/transactions` | Get loyalty transactions |
| POST | `/loyalty/adjust` | Adjust loyalty points (Admin) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications |
| GET | `/notifications/:id` | Get notification by ID |
| POST | `/notifications` | Create notification |
| PUT | `/notifications/:id` | Update notification |
| DELETE | `/notifications/:id` | Delete notification |
| POST | `/notifications/mark-read` | Mark as read |
| POST | `/notifications/mark-all-read` | Mark all as read |
| POST | `/notifications/send` | Send notification |
| POST | `/notifications/send-all` | Send to all users |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | Get settings |
| GET | `/settings/voice` | Get voice settings |
| PUT | `/settings/voice` | Update voice settings |
| GET | `/settings/location` | Get location settings |
| PUT | `/settings/location` | Update location settings |
| GET | `/settings/notifications` | Get notification settings |
| PUT | `/settings/notifications` | Update notification settings |
| GET | `/settings/business` | Get business settings |
| PUT | `/settings/business` | Update business settings |

### Health & Version
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/version` | Get API version |

---

## 🔐 Authentication

### JWT Authentication

All protected endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your_token>
```

### Token Structure

```json
{
  "id": "user-uuid",
  "uid": "firebase-uid",
  "phone": "user-phone",
  "email": "user-email",
  "name": "user-name",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Login Flow

1. **Login with phone/password:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"phone": "9876543210", "password": "password123"}'
   ```

2. **Login with OTP:**
   ```bash
   # Request OTP
   curl -X POST http://localhost:3000/api/v1/auth/login-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "9876543210"}'
   
   # Verify OTP
   curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "9876543210", "otp": "123456"}'
   ```

3. **Use the token:**
   ```bash
   curl -X GET http://localhost:3000/api/v1/users/me \
     -H "Authorization: Bearer your_jwt_token"
   ```

---

## 📦 Request & Response Format

### Request Headers

```
Content-Type: application/json
Authorization: Bearer <token>
X-Device-Type: Android/iOS/Web
X-App-Version: 1.0.0
```

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "statusCode": 200
}
```

### Error Response

```json
{
  "success": false,
  "error": "Validation error",
  "message": "Phone number is required",
  "statusCode": 400,
  "details": {
    "phone": "Phone number is required"
  }
}
```

---

## 🎯 Pagination

All list endpoints support pagination:

```
GET /api/v1/products?page=1&limit=20&sort=name&order=asc
```

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔍 Filtering & Sorting

### Filtering

```
GET /api/v1/products?category=Groceries&inStock=true
```

### Sorting

```
GET /api/v1/products?sort=price&order=desc
```

### Search

```
GET /api/v1/products/search?q=rice
```

---

## 📁 File Upload

### Upload Image

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: multipart/form-data" \
  -F "name=Product Name" \
  -F "price=100" \
  -F "image=@/path/to/image.jpg"
```

### Upload Multiple Files

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: multipart/form-data" \
  -F "name=Product Name" \
  -F "images[]=@/path/to/image1.jpg" \
  -F "images[]=@/path/to/image2.jpg"
```

---

## 🚀 Deployment

### Docker

```bash
# Build and run with Docker
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Manual Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Start the server
pm2 start src/app.js --name vendor_saathi_backend

# View logs
pm2 logs vendor_saathi_backend

# Stop server
pm2 stop vendor_saathi_backend

# Restart server
pm2 restart vendor_saathi_backend
```

### Environment Variables (Production)

```bash
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=vendorsaathi
DB_USER=db_user
DB_PASSWORD=db_password
JWT_SECRET=your-super-secret-key
FIREBASE_PROJECT_ID=your-project-id
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

---

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm run test:watch
```

---

## 📊 API Documentation

### Swagger UI

Access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

### OpenAPI Spec

Download the OpenAPI specification:
```
http://localhost:3000/api-docs/json
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Run lint: `npm run lint`
6. Submit a pull request

---

## 📜 License

MIT License - Feel free to use and modify for your projects!

---

## 📞 Support

For issues, questions, or feedback:
- GitHub Issues: [https://github.com/vendorsaathi/vendorsaathi-backend/issues](https://github.com/vendorsaathi/vendorsaathi-backend/issues)
- Email: support@vendorsaathi.com

---

**Made with ❤️ for Indian Vendors** 🇮🇳
