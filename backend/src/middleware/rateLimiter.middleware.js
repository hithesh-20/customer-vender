const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.isTest ? 10000 : config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    statusCode: 429,
  },
});

module.exports = rateLimiter;
