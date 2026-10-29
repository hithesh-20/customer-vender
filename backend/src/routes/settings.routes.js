const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/response');

router.get('/', async (req, res) => {
  return sendSuccess(res, {
    preferences: req.user.preferences,
    settings: req.user.settings,
  }, 'Settings fetched');
});

router.put('/', async (req, res, next) => {
  try {
    if (req.body.preferences) {
      req.user.preferences = { ...(req.user.preferences || {}), ...req.body.preferences };
    }
    if (req.body.settings) {
      req.user.settings = { ...(req.user.settings || {}), ...req.body.settings };
    }
    await req.user.save();
    return sendSuccess(res, {
      preferences: req.user.preferences,
      settings: req.user.settings,
    }, 'Settings saved');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
