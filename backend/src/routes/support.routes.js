const express = require('express');
const router = express.Router();
const { SupportTicket, Order } = require('../models');
const { verifyToken } = require('../middleware/auth.middleware');
const { sendSuccess, sendError } = require('../utils/response');

router.use(verifyToken);

// GET /api/v1/support — Fetch authenticated user's support tickets
router.get('/', async (req, res, next) => {
  try {
    const where =
      req.user.role === 'vendor'
        ? { vendorId: req.userId }
        : { userId: req.userId };

    const tickets = await SupportTicket.findAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'status', 'total'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    return sendSuccess(res, tickets, 'Support tickets fetched');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/support — Report an order or account issue
router.post('/', async (req, res, next) => {
  try {
    const {
      orderId,
      category = 'Order Issue',
      subject,
      description,
    } = req.body;

    const validCategories = [
      'Order Issue',
      'Item Quality',
      'Delivery Delay',
      'Payment/Billing',
      'Account Help',
    ];
    if (!validCategories.includes(category)) {
      return sendError(res, 'Invalid support category', 400);
    }
    if (!subject || String(subject).trim().length < 4) {
      return sendError(res, 'Please provide a brief subject (at least 4 characters)', 400);
    }
    if (!description || String(description).trim().length < 10) {
      return sendError(res, 'Please describe the issue (at least 10 characters)', 400);
    }

    let vendorId = null;
    if (orderId) {
      const order = await Order.findByPk(orderId);
      if (!order || (order.customerUserId !== req.userId && order.vendorId !== req.userId)) {
        return sendError(res, 'Order not found for your account', 404);
      }
      vendorId = order.vendorId;
    }

    const ticket = await SupportTicket.create({
      ticketNumber: `SUP-${Date.now().toString().slice(-6)}`,
      userId: req.userId,
      orderId: orderId || null,
      vendorId,
      category,
      subject: String(subject).trim(),
      description: String(description).trim(),
      status: 'Open',
    });

    return sendSuccess(res, ticket, 'Issue reported. Reference ticket created.', 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/support/:id — Update resolution note or status
router.patch('/:id', async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) return sendError(res, 'Support ticket not found', 404);
    if (ticket.userId !== req.userId && ticket.vendorId !== req.userId) {
      return sendError(res, 'Access denied', 403);
    }

    if (req.body.resolutionNote !== undefined) {
      ticket.resolutionNote = String(req.body.resolutionNote).trim();
    }
    if (req.body.status && ['Open', 'In Progress', 'Resolved'].includes(req.body.status)) {
      ticket.status = req.body.status;
    }
    await ticket.save();

    return sendSuccess(res, ticket, 'Support ticket updated');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
