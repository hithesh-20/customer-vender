function sendSuccess(res, data = null, message = 'Success', statusCode = 200, extra = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    statusCode,
    ...extra,
  });
}

function sendPaginated(res, items, total, page, limit, message = 'Success', extra = {}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    ...extra,
  });
}

function sendError(res, message = 'An error occurred', statusCode = 400, details = null) {
  const payload = {
    success: false,
    error: message,
    message,
    statusCode,
  };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
}

function getPagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError,
  getPagination,
};
