const express = require('express');
const router = express.Router();
const { Op } = require('../config/database');
const { Customer, Order, Udhaar } = require('../models');
const { optionalAuth, verifyToken } = require('../middleware/auth.middleware');
const { sendSuccess, sendError } = require('../utils/response');

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const where = { isActive: true };
    if (req.userId) where.vendorId = req.userId;

    const q = (req.query.q || '').trim();
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { kannadaName: { [Op.like]: `%${q}%` } },
        { phone: { [Op.like]: `%${q}%` } },
        { city: { [Op.like]: `%${q}%` } },
      ];
    }

    const customers = await Customer.findAll({
      where,
      order: [['totalSpent', 'DESC']],
    });
    return sendSuccess(res, customers, 'Customers fetched');
  } catch (error) {
    next(error);
  }
});

router.get('/top', verifyToken, async (req, res, next) => {
  try {
    const customers = await Customer.findAll({
      where: { vendorId: req.userId, isActive: true },
      order: [['totalSpent', 'DESC']],
      limit: 10,
    });
    return sendSuccess(res, customers, 'Top customers fetched');
  } catch (error) {
    next(error);
  }
});

router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, vendorId: req.userId },
      include: [
        { model: Order, as: 'orders', limit: 15, order: [['orderDate', 'DESC']] },
        { model: Udhaar, as: 'udhaars', limit: 15, order: [['createdAt', 'DESC']] },
      ],
    });
    if (!customer) return sendError(res, 'Customer not found', 404);
    return sendSuccess(res, customer, 'Customer details fetched');
  } catch (error) {
    next(error);
  }
});

router.post('/', verifyToken, async (req, res, next) => {
  try {
    const {
      name,
      kannadaName,
      phone,
      email,
      address,
      landmark,
      city = 'Mudbidri',
      pincode = '574227',
      latitude,
      longitude,
      creditLimit = 5000,
      notes,
    } = req.body;

    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    if (!name || cleanPhone.length < 10) {
      return sendError(res, 'Customer name and 10-digit phone number are required', 400);
    }

    const customer = await Customer.create({
      vendorId: req.userId,
      name,
      kannadaName,
      phone: cleanPhone,
      email,
      address,
      landmark,
      city,
      pincode,
      latitude: latitude ?? 13.0827 + (Math.random() - 0.5) * 0.03,
      longitude: longitude ?? 74.9945 + (Math.random() - 0.5) * 0.03,
      creditLimit: Number(creditLimit),
      notes,
    });

    return sendSuccess(res, customer, 'Customer added successfully', 201);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, vendorId: req.userId },
    });
    if (!customer) return sendError(res, 'Customer not found', 404);

    const editable = [
      'name', 'kannadaName', 'phone', 'email', 'address', 'landmark',
      'city', 'pincode', 'latitude', 'longitude', 'creditLimit', 'notes',
    ];
    for (const f of editable) {
      if (req.body[f] !== undefined) customer[f] = req.body[f];
    }
    await customer.save();
    return sendSuccess(res, customer, 'Customer updated');
  } catch (error) {
    next(error);
  }
});

router.post('/:id/redeem', verifyToken, async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, vendorId: req.userId },
    });
    if (!customer) return sendError(res, 'Customer not found', 404);

    const points = parseInt(req.body.points, 10) || 0;
    if (points <= 0 || points > customer.loyaltyPoints) {
      return sendError(res, 'Invalid or insufficient loyalty points', 400);
    }
    customer.loyaltyPoints -= points;
    await customer.save();
    return sendSuccess(res, {
      customer,
      discountValueInr: points,
    }, `Redeemed ${points} points (₹${points} discount)`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
