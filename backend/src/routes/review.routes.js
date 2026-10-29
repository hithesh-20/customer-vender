const express = require('express');
const router = express.Router();
const { Review, Order, User } = require('../models');
const { verifyToken } = require('../middleware/auth.middleware');
const { sendSuccess, sendError } = require('../utils/response');

async function recalculateVendorRating(vendorId) {
  const reviews = await Review.findAll({
    where: { vendorId },
    attributes: ['rating'],
  });
  const vendor = await User.findByPk(vendorId);
  if (!vendor) return;

  if (reviews.length === 0) {
    vendor.rating = null;
    vendor.reviewCount = 0;
  } else {
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
    vendor.rating = Number((sum / reviews.length).toFixed(1));
    vendor.reviewCount = reviews.length;
  }
  await vendor.save();
}

// GET /api/v1/reviews/vendor/:vendorId — Public genuine reviews for a vendor
router.get('/vendor/:vendorId', async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: { vendorId: req.params.vendorId },
      include: [{ model: User, as: 'customer', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
    return sendSuccess(
      res,
      reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        customerName: r.customer?.name || 'Verified Customer',
        createdAt: r.createdAt,
      })),
      'Vendor reviews fetched'
    );
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/reviews — Submit a genuine review for a delivered order
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!orderId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return sendError(res, 'orderId and an integer rating from 1 to 5 are required', 400);
    }

    const order = await Order.findByPk(orderId);
    if (!order) return sendError(res, 'Order not found', 404);
    if (order.customerUserId !== req.userId) {
      return sendError(res, 'You can only review your own orders', 403);
    }
    if (order.status !== 'Delivered') {
      return sendError(res, 'Reviews can only be submitted after an order is Delivered', 400);
    }

    const existing = await Review.findOne({ where: { orderId: order.id } });
    if (existing) {
      return sendError(res, 'You have already submitted a review for this order', 409);
    }

    const review = await Review.create({
      orderId: order.id,
      customerUserId: req.userId,
      vendorId: order.vendorId,
      rating: numericRating,
      comment: comment ? String(comment).trim() : null,
    });

    await recalculateVendorRating(order.vendorId);

    return sendSuccess(res, review, 'Thank you! Your review has been published.', 201);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
