const express = require('express');
const router = express.Router();
const { Customer } = require('../models');
const { sendSuccess } = require('../utils/response');

const TIERS = [
  { name: 'Bronze', minPoints: 0, rewardRate: '1 pt per ₹25', perks: 'Priority Festival Offers' },
  { name: 'Silver', minPoints: 200, rewardRate: '1.25x pts', perks: 'Free Delivery above ₹250' },
  { name: 'Gold', minPoints: 500, rewardRate: '1.5x pts', perks: 'Free Delivery + Extended Khata Limit' },
  { name: 'Platinum', minPoints: 1000, rewardRate: '2x pts', perks: 'Zero Delivery Fee + VIP Morning Slot' },
];

router.get('/', async (req, res, next) => {
  try {
    const customers = await Customer.findAll({
      where: { vendorId: req.userId, isActive: true },
      order: [['loyaltyPoints', 'DESC']],
    });
    return sendSuccess(res, {
      tiers: TIERS,
      members: customers,
      totalPointsIssued: customers.reduce((s, c) => s + Number(c.loyaltyPoints || 0), 0),
    }, 'Loyalty program summary');
  } catch (error) {
    next(error);
  }
});

router.get('/tiers', (req, res) => sendSuccess(res, TIERS, 'Loyalty tiers'));

module.exports = router;
