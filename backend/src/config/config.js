const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const env = process.env.NODE_ENV || 'development';

if (env === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error('❌ Production requires JWT_SECRET of at least 32 characters.');
  process.exit(1);
}

const dbDialect = process.env.DB_DIALECT || 'sqlite';
const defaultStorage = env === 'test'
  ? ':memory:'
  : path.resolve(__dirname, '../../', process.env.DB_STORAGE || './data/vendersathi.sqlite');

function isRealCredential(val) {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  const placeholders = ['your_', 'xxxx', 'placeholder', 'change-this', 'example', 'test_vendorsaathi'];
  return !placeholders.some((p) => trimmed.toLowerCase().includes(p));
}

module.exports = {
  app: {
    name: process.env.APP_NAME || 'VenderSathi',
    description:
      process.env.APP_DESCRIPTION ||
      'Hyperlocal Customer Delivery & Street Vendor Commerce Platform',
    version: process.env.APP_VERSION || '1.0.0',
    environment: env,
  },

  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',

  env,
  isProduction: env === 'production',
  isDevelopment: env === 'development',
  isTest: env === 'test',

  database: {
    dialect: env === 'test' ? 'sqlite' : dbDialect,
    storage: defaultStorage,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'vendersathi',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true',
    dialectOptions:
      process.env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  },

  firebase: {
    enabled:
      isRealCredential(process.env.FIREBASE_PRIVATE_KEY) &&
      isRealCredential(process.env.FIREBASE_CLIENT_EMAIL),
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : null,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || null,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'vendersathi-local-dev-jwt-secret-key-min-32-chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'vendersathi',
    audience: process.env.JWT_AUDIENCE || 'vendersathi-app',
  },

  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    ttl: parseInt(process.env.REDIS_TTL, 10) || 3600,
    prefix: process.env.REDIS_PREFIX || 'vs:',
  },

  corsOptions: {
    origin:
      process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*'
        ? process.env.CORS_ORIGIN.split(',')
        : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Idempotency-Key',
      'X-Device-Type',
      'X-App-Version',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 600,
  },

  razorpay: {
    enabled:
      isRealCredential(process.env.RAZORPAY_KEY_ID) &&
      isRealCredential(process.env.RAZORPAY_KEY_SECRET),
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  twilio: {
    enabled:
      isRealCredential(process.env.TWILIO_ACCOUNT_SID) &&
      isRealCredential(process.env.TWILIO_AUTH_TOKEN) &&
      isRealCredential(process.env.TWILIO_FROM_NUMBER),
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
  },

  weather: {
    enabled: isRealCredential(process.env.WEATHER_API_KEY),
    apiKey: process.env.WEATHER_API_KEY || '',
    baseUrl: process.env.WEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5',
    cacheTtl: parseInt(process.env.WEATHER_CACHE_TTL, 10) || 300,
  },

  googleMaps: {
    enabled: isRealCredential(process.env.GOOGLE_MAPS_API_KEY),
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },

  ai: {
    baseUrl: process.env.AI_API_BASE_URL || 'http://127.0.0.1:5000/api/v1',
    timeout: parseInt(process.env.AI_API_TIMEOUT, 10) || 5000,
  },

  otp: {
    length: 6,
    expiresIn: parseInt(process.env.OTP_EXPIRES_IN, 10) || 300,
    maxAttempts: 5,
  },

  pagination: {
    defaultLimit: 24,
    maxLimit: 100,
  },

  defaults: {
    currency: process.env.DEFAULT_CURRENCY || 'INR',
    language: process.env.DEFAULT_LANGUAGE || 'en',
    timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
  },
};
