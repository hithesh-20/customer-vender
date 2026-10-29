const express = require('express');
const router = express.Router();
const { Op } = require('../config/database');
const { Notification } = require('../models');
const { sendSuccess } = require('../utils/response');

router.get('/', async (req, res, next) => {
  try {
    const items = await Notification.findAll({
      where: {
        [Op.or]: [{ userId: req.userId }, { vendorId: req.userId }],
      },
      order: [['createdAt', 'DESC']],
      limit: 40,
    });
    const unreadCount = items.filter((n) => !n.isRead).length;
    return sendSuccess(res, { notifications: items, unreadCount }, 'Notifications fetched');
  } catch (error) {
    next(error);
  }
});

router.post('/mark-all-read', async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      {
        where: {
          [Op.or]: [{ userId: req.userId }, { vendorId: req.userId }],
          isRead: false,
        },
      }
    );
    return sendSuccess(res, { ok: true }, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
