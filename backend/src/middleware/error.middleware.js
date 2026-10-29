const logger = require('../utils/logger');

function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
}

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${statusCode}: ${message}`, {
      stack: err.stack,
    });
  }

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const details = (err.errors || []).reduce((acc, item) => {
      acc[item.path] = item.message;
      return acc;
    }, {});
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: err.errors?.[0]?.message || message,
      statusCode: 400,
      details,
    });
  }

  return res.status(statusCode).json({
    success: false,
    error: message,
    message,
    statusCode,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
