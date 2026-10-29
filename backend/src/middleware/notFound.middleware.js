function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
}

module.exports = notFoundHandler;
