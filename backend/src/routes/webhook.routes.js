const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const config = require('../config/config');
const logger = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/response');

router.post('/razorpay', async (req, res) => {
  if (!config.razorpay.webhookSecret) {
    return sendError(res, 'Razorpay webhook secret is not configured', 503);
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return sendError(res, 'Missing webhook signature', 401);
  }

  const payloadString = JSON.stringify(req.body || {});
  const expected = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(payloadString)
    .digest('hex');

  const sigBuf = Buffer.from(String(signature), 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return sendError(res, 'Invalid webhook signature', 401);
  }

  const event = req.body?.event || 'unknown';
  logger.info(`Verified Razorpay webhook event: ${event}`);
  return sendSuccess(res, { received: true, event }, 'Webhook verified and processed');
});

module.exports = router;
