const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('../config/database');
const router = express.Router();
const config = require('../config/config');
const cache = require('../config/redis');
const { User } = require('../models');
const { verifyToken, revokeToken } = require('../middleware/auth.middleware');
const { sendSuccess, sendError } = require('../utils/response');

function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[\s\-+]/g, '').replace(/^91(?=\d{10}$)/, '');
}

function generateTokens(user) {
  const payload = { id: user.id, phone: user.phone, role: user.role };
  const token = jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh', jti: crypto.randomUUID() },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
  return { token, refreshToken };
}

// GET /api/v1/auth/capabilities — honest report of active authentication methods
router.get('/capabilities', (req, res) => {
  const methods = ['phone_password', 'email_password'];
  if (config.twilio.enabled) {
    methods.push('sms_otp');
  }
  return sendSuccess(
    res,
    {
      methods,
      smsOtpEnabled: config.twilio.enabled,
      onlinePaymentsEnabled: config.razorpay.enabled,
      liveMapsEnabled: config.googleMaps.enabled,
    },
    'Platform capabilities'
  );
});

// POST /api/v1/auth/register — Customer or Vendor account registration
router.post('/register', async (req, res, next) => {
  try {
    const {
      role = 'customer',
      name,
      phone,
      email,
      password,
      language = 'en',
      // Vendor-specific optional fields
      shopName,
      shopNameKannada,
      vendorType,
      businessCategory,
      description,
      serviceArea,
      shopAddress,
      city,
      state,
      pincode,
      latitude,
      longitude,
      upiId,
      settings,
    } = req.body;

    if (!['customer', 'vendor'].includes(role)) {
      return sendError(res, 'Account role must be customer or vendor', 400);
    }

    const cleanName = name ? String(name).trim() : '';
    if (cleanName.length < 2) {
      return sendError(res, 'Full name (at least 2 characters) is required', 400);
    }

    const cleanPhone = normalizePhone(phone);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return sendError(res, 'Valid 10-digit Indian mobile number is required', 400);
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return sendError(res, 'Please enter a valid email address', 400);
    }

    if (!password || String(password).length < 8) {
      return sendError(res, 'Password must be at least 8 characters long', 400);
    }

    if (role === 'vendor') {
      if (!shopName || String(shopName).trim().length < 2) {
        return sendError(res, 'Vendor shop or cart name is required', 400);
      }
      if (vendorType && !User.VALID_VENDOR_TYPES.includes(vendorType)) {
        return sendError(
          res,
          `Vendor type must be one of: ${User.VALID_VENDOR_TYPES.join(', ')}`,
          400
        );
      }
      if (!city || !pincode || !/^[1-9]\d{5}$/.test(String(pincode).trim())) {
        return sendError(
          res,
          'Vendor city and valid 6-digit pincode are required for serviceability',
          400
        );
      }
    }

    const conflictWhere = [{ phone: cleanPhone }];
    if (cleanEmail) conflictWhere.push({ email: cleanEmail });

    const existing = await User.findOne({ where: { [Op.or]: conflictWhere } });
    if (existing) {
      if (existing.phone === cleanPhone) {
        return sendError(res, 'An account with this mobile number already exists', 409);
      }
      return sendError(res, 'An account with this email address already exists', 409);
    }

    const parsedLat =
      latitude !== undefined && latitude !== null && latitude !== ''
        ? Number(latitude)
        : null;
    const parsedLng =
      longitude !== undefined && longitude !== null && longitude !== ''
        ? Number(longitude)
        : null;

    if (
      (parsedLat !== null && (Number.isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) ||
      (parsedLng !== null && (Number.isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180))
    ) {
      return sendError(res, 'Invalid geographic coordinates supplied', 400);
    }

    const defaultSettings = {
      homeDelivery: true,
      pickupAvailable: true,
      deliveryRadiusKm: 5,
      servicePincodes: pincode ? [String(pincode).trim()] : [],
      minOrderAmount: 0,
      deliveryCharge: 20,
      freeDeliveryAbove: 300,
      estimatedPrepMinutes: null,
      operatingHours: null,
      codEnabled: true,
      onlinePaymentEnabled: false,
    };

    const user = await User.create({
      role,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      password: String(password),
      language: language === 'kn' ? 'kn' : 'en',
      shopName: role === 'vendor' ? String(shopName).trim() : null,
      shopNameKannada: role === 'vendor' && shopNameKannada ? String(shopNameKannada).trim() : null,
      vendorType: role === 'vendor' ? vendorType || 'Street Cart' : null,
      businessCategory: role === 'vendor' ? businessCategory || 'Vegetables & Fruits' : null,
      description: role === 'vendor' && description ? String(description).trim() : null,
      serviceArea: role === 'vendor' && serviceArea ? String(serviceArea).trim() : null,
      shopAddress: role === 'vendor' && shopAddress ? String(shopAddress).trim() : null,
      city: city ? String(city).trim() : null,
      state: state ? String(state).trim() : 'Karnataka',
      pincode: pincode ? String(pincode).trim() : null,
      latitude: parsedLat,
      longitude: parsedLng,
      upiId: role === 'vendor' && upiId ? String(upiId).trim() : null,
      isOnline: false,
      rating: null,
      reviewCount: 0,
      preferences: {
        language: language === 'kn' ? 'kn' : 'en',
        orderUpdates: true,
        supportUpdates: true,
      },
      settings: role === 'vendor' ? { ...defaultSettings, ...(settings || {}) } : defaultSettings,
    });

    const tokens = generateTokens(user);
    return sendSuccess(
      res,
      { user: user.toSafeJSON(), ...tokens },
      'Account created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/login — Authenticate with mobile number or email + password
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, phone, email, password } = req.body;
    const rawId = identifier || phone || email;

    if (!rawId || !password) {
      return sendError(res, 'Phone number or email and password are required', 400);
    }

    const trimmed = String(rawId).trim();
    let user = null;

    if (trimmed.includes('@')) {
      user = await User.findOne({ where: { email: trimmed.toLowerCase() } });
    } else {
      const cleanPhone = normalizePhone(trimmed);
      user = await User.findOne({ where: { phone: cleanPhone } });
    }

    if (!user || !user.isActive) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const valid = await user.comparePassword(String(password));
    if (!valid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const tokens = generateTokens(user);
    return sendSuccess(res, { user: user.toSafeJSON(), ...tokens }, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/send-otp — Only active when real SMS provider credentials exist
router.post('/send-otp', async (req, res, next) => {
  try {
    if (!config.twilio.enabled) {
      return sendError(
        res,
        'SMS OTP login requires Twilio credentials to be configured. Please sign in using your mobile number or email and password.',
        503,
        { code: 'SMS_PROVIDER_NOT_CONFIGURED' }
      );
    }

    const cleanPhone = normalizePhone(req.body.phone);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return sendError(res, 'Valid 10-digit Indian mobile number is required', 400);
    }

    const otp = String(crypto.randomInt(100000, 999999));
    await cache.setEx(`otp:${cleanPhone}`, { otp, attempts: 0 }, config.otp.expiresIn);

    // Dispatch via real Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: `+91${cleanPhone}`,
      From: config.twilio.fromNumber,
      Body: `Your VenderSathi verification code is ${otp}. Valid for 5 minutes.`,
    });

    const resp = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.twilio.accountSid}:${config.twilio.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!resp.ok) {
      return sendError(res, 'Failed to dispatch SMS verification code via provider', 502);
    }

    return sendSuccess(
      res,
      { phone: cleanPhone, expiresIn: config.otp.expiresIn },
      'Verification code sent via SMS'
    );
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', async (req, res, next) => {
  try {
    if (!config.twilio.enabled) {
      return sendError(res, 'SMS OTP verification is not configured', 503);
    }

    const cleanPhone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || '').trim();
    if (!cleanPhone || !/^\d{6}$/.test(otp)) {
      return sendError(res, 'Phone number and 6-digit OTP are required', 400);
    }

    const cached = await cache.get(`otp:${cleanPhone}`);
    if (!cached || cached.otp !== otp) {
      return sendError(res, 'Invalid or expired OTP', 401);
    }

    await cache.del(`otp:${cleanPhone}`);
    const user = await User.findOne({ where: { phone: cleanPhone } });
    if (!user || !user.isActive) {
      return sendError(res, 'No active account found for this phone number. Please register first.', 404);
    }

    const tokens = generateTokens(user);
    return sendSuccess(res, { user: user.toSafeJSON(), ...tokens }, 'OTP verified');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 'Refresh token required', 400);

    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    if (decoded.type !== 'refresh') {
      return sendError(res, 'Invalid refresh token', 401);
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) return sendError(res, 'Invalid account', 401);

    const tokens = generateTokens(user);
    return sendSuccess(res, tokens, 'Session refreshed');
  } catch (_) {
    return sendError(res, 'Invalid or expired refresh token', 401);
  }
});

// POST /api/v1/auth/logout — Revokes current session token
router.post('/logout', verifyToken, async (req, res, next) => {
  try {
    await revokeToken(req.rawToken);
    if (req.body?.refreshToken) {
      await revokeToken(req.body.refreshToken);
    }
    return sendSuccess(res, { loggedOut: true }, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/auth/me
router.get('/me', verifyToken, async (req, res) => {
  return sendSuccess(res, req.user.toSafeJSON(), 'Authenticated user profile');
});

// PATCH /api/v1/auth/password
router.patch('/password', verifyToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || String(newPassword).length < 8) {
      return sendError(
        res,
        'Current password and a new password of at least 8 characters are required',
        400
      );
    }
    const valid = await req.user.comparePassword(String(currentPassword));
    if (!valid) {
      return sendError(res, 'Current password is incorrect', 401);
    }
    req.user.password = String(newPassword);
    await req.user.save();
    return sendSuccess(res, { updated: true }, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
