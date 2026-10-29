const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const cache = require('../config/redis');
const { User } = require('../models');
const { sendError } = require('../utils/response');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function revokeToken(token) {
  if (!token) return;
  await cache.setEx(`revoked:${hashToken(token)}`, { revokedAt: Date.now() }, 7 * 86400);
}

async function isTokenRevoked(token) {
  const entry = await cache.get(`revoked:${hashToken(token)}`);
  return Boolean(entry);
}

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    if (await isTokenRevoked(token)) {
      return sendError(res, 'Session has been logged out. Please log in again.', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.type === 'refresh') {
      return sendError(res, 'Access token required', 401);
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return sendError(res, 'Invalid or inactive account', 401);
    }

    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    req.rawToken = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid authentication token', 401);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required account role: ${roles.join(' or ')}`,
        403
      );
    }
    next();
  };
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (token && !(await isTokenRevoked(token))) {
      const decoded = jwt.verify(token, config.jwt.secret);
      if (decoded.type !== 'refresh') {
        const user = await User.findByPk(decoded.id);
        if (user && user.isActive) {
          req.user = user;
          req.userId = user.id;
          req.userRole = user.role;
          req.rawToken = token;
        }
      }
    }
  } catch (_) {
    // ignore invalid optional token
  }
  next();
}

module.exports = {
  verifyToken,
  requireRole,
  optionalAuth,
  revokeToken,
};
