const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const config = require('../config/config');
const { Payment, Order } = require('../models');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { sendSuccess, sendPaginated, sendError, getPagination } = require('../utils/response');

function makePaymentNumber() {
  return `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
}

// GET /api/v1/payments/methods — Public/authenticated honest payment capability report
router.get('/methods', (req, res) => {
  return sendSuccess(
    res,
    {
      onlineGatewayConfigured: config.razorpay.enabled,
      gatewayProvider: config.razorpay.enabled ? 'Razorpay' : null,
      razorpayKeyId: config.razorpay.enabled ? config.razorpay.keyId : null,
      supportedOfflineMethods: ['COD', 'PAY_AT_PICKUP'],
    },
    'Payment methods configuration'
  );
});

router.use(verifyToken);

// GET /api/v1/payments — Scoped payment history
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const where =
      req.user.role === 'vendor'
        ? { vendorId: req.userId }
        : { customerUserId: req.userId };

    if (req.query.status) where.status = req.query.status;

    const { rows, count } = await Payment.findAndCountAll({
      where,
      order: [['paymentDate', 'DESC']],
      limit,
      offset,
    });
    return sendPaginated(res, rows, count, page, limit, 'Payments fetched');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/payments/razorpay/create-order — Creates a genuine Razorpay gateway order ONLY when configured
router.post('/razorpay/create-order', async (req, res, next) => {
  try {
    if (!config.razorpay.enabled) {
      return sendError(
        res,
        'Online payment gateway credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured.',
        503,
        { code: 'PAYMENT_GATEWAY_NOT_CONFIGURED' }
      );
    }

    const { orderId } = req.body;
    if (!orderId) return sendError(res, 'orderId is required', 400);

    const order = await Order.findByPk(orderId);
    if (!order) return sendError(res, 'Order not found', 404);
    if (order.customerUserId !== req.userId) {
      return sendError(res, 'You are not authorized to pay for this order', 403);
    }
    if (order.paymentStatus === 'Paid') {
      return sendError(res, 'This order is already paid', 409);
    }
    if (order.status === 'Cancelled') {
      return sendError(res, 'Cannot pay for a cancelled order', 400);
    }

    const amountPaise = Math.round(Number(order.total) * 100);
    const authHeader = Buffer.from(
      `${config.razorpay.keyId}:${config.razorpay.keySecret}`
    ).toString('base64');

    const gatewayResp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: { orderId: order.id, orderNumber: order.orderNumber },
      }),
    });

    if (!gatewayResp.ok) {
      const errBody = await gatewayResp.text();
      return sendError(res, 'Payment gateway order creation failed', 502, {
        gatewayResponse: errBody,
      });
    }

    const gatewayOrder = await gatewayResp.json();

    const payment = await Payment.create({
      paymentNumber: makePaymentNumber(),
      vendorId: order.vendorId,
      customerUserId: req.userId,
      orderId: order.id,
      customerName: order.customerName,
      amount: order.total,
      currency: 'INR',
      paymentMethod: 'ONLINE',
      paymentGateway: 'Razorpay',
      gatewayOrderId: gatewayOrder.id,
      status: 'Pending',
    });

    return sendSuccess(
      res,
      {
        paymentId: payment.id,
        gatewayOrderId: gatewayOrder.id,
        amount: amountPaise,
        currency: 'INR',
        keyId: config.razorpay.keyId,
      },
      'Payment gateway order created',
      201
    );
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/payments/razorpay/verify — Strictly verifies HMAC-SHA256 signature before marking Paid
router.post('/razorpay/verify', async (req, res, next) => {
  try {
    if (!config.razorpay.enabled) {
      return sendError(res, 'Online payment gateway is not configured', 503);
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return sendError(
        res,
        'orderId, razorpayOrderId, razorpayPaymentId, and razorpaySignature are all required',
        400
      );
    }

    const order = await Order.findByPk(orderId);
    if (!order) return sendError(res, 'Order not found', 404);
    if (order.customerUserId !== req.userId) {
      return sendError(res, 'Not authorized for this order', 403);
    }

    const expectedSig = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const sigBuffer = Buffer.from(String(razorpaySignature), 'utf8');
    const expectedBuffer = Buffer.from(expectedSig, 'utf8');
    const isValid =
      sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    let payment = await Payment.findOne({
      where: { orderId: order.id, gatewayOrderId: razorpayOrderId },
    });

    if (!isValid) {
      if (payment) {
        payment.status = 'Failed';
        payment.failureReason = 'Invalid gateway payment signature';
        await payment.save();
      } else {
        await Payment.create({
          paymentNumber: makePaymentNumber(),
          vendorId: order.vendorId,
          customerUserId: req.userId,
          orderId: order.id,
          customerName: order.customerName,
          amount: order.total,
          paymentMethod: 'ONLINE',
          paymentGateway: 'Razorpay',
          gatewayOrderId: razorpayOrderId,
          transactionId: razorpayPaymentId,
          status: 'Failed',
          failureReason: 'Invalid gateway payment signature',
        });
      }
      order.paymentStatus = 'Failed';
      await order.save();

      return sendError(
        res,
        'Payment verification failed: invalid signature. Order remains unpaid; you may retry or switch to Cash on Delivery.',
        400,
        { code: 'PAYMENT_VERIFICATION_FAILED' }
      );
    }

    if (payment) {
      payment.status = 'Completed';
      payment.transactionId = razorpayPaymentId;
      payment.paymentDate = new Date();
      await payment.save();
    } else {
      payment = await Payment.create({
        paymentNumber: makePaymentNumber(),
        vendorId: order.vendorId,
        customerUserId: req.userId,
        orderId: order.id,
        customerName: order.customerName,
        amount: order.total,
        paymentMethod: 'ONLINE',
        paymentGateway: 'Razorpay',
        gatewayOrderId: razorpayOrderId,
        transactionId: razorpayPaymentId,
        status: 'Completed',
      });
    }

    order.paymentStatus = 'Paid';
    order.paidAmount = order.total;
    order.dueAmount = 0;
    const history = Array.isArray(order.statusHistory) ? [...order.statusHistory] : [];
    history.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      actorRole: 'customer',
      note: `Online payment verified (${razorpayPaymentId})`,
    });
    order.statusHistory = history;
    await order.save();

    return sendSuccess(res, { verified: true, payment, order }, 'Payment verified');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/payments/:orderId/mark-collected — Vendor confirms COD / Pickup cash collection
router.post('/:orderId/mark-collected', requireRole('vendor'), async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId);
    if (!order) return sendError(res, 'Order not found', 404);
    if (order.vendorId !== req.userId) {
      return sendError(res, 'Only the order vendor can confirm payment collection', 403);
    }
    if (order.paymentStatus === 'Paid') {
      return sendError(res, 'Order payment has already been collected', 409);
    }

    const payment = await Payment.create({
      paymentNumber: makePaymentNumber(),
      vendorId: req.userId,
      customerUserId: order.customerUserId,
      orderId: order.id,
      customerName: order.customerName,
      amount: order.total,
      paymentMethod: order.paymentMethod,
      paymentGateway: order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Direct Handover',
      status: 'Completed',
      notes: req.body.notes ? String(req.body.notes).trim() : 'Confirmed collected by vendor',
    });

    order.paymentStatus = 'Paid';
    order.paidAmount = order.total;
    order.dueAmount = 0;
    const history = Array.isArray(order.statusHistory) ? [...order.statusHistory] : [];
    history.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      actorRole: 'vendor',
      note: 'Payment collection confirmed by vendor',
    });
    order.statusHistory = history;
    await order.save();

    req.user.totalRevenue = Number((Number(req.user.totalRevenue || 0) + Number(order.total)).toFixed(2));
    await req.user.save();

    const io = req.app.get('io');
    if (io && order.customerUserId) {
      io.to(`customer:${order.customerUserId}`).emit('order:payment_updated', {
        orderId: order.id,
        paymentStatus: 'Paid',
      });
      io.to(`order:${order.id}`).emit('order:payment_updated', {
        orderId: order.id,
        paymentStatus: 'Paid',
      });
    }

    return sendSuccess(res, { order, payment }, 'Payment marked as collected');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
