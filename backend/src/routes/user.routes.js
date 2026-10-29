const express = require('express');
const router = express.Router();
const { Op } = require('../config/database');
const { User, Product, Category, Review } = require('../models');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { evaluateServiceability } = require('../utils/checkoutCalculator');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/v1/users/nearby & /api/v1/vendors — Public vendor discovery
router.get('/nearby', async (req, res, next) => {
  try {
    const lat = req.query.lat !== undefined && req.query.lat !== '' ? Number(req.query.lat) : null;
    const lng = req.query.lng !== undefined && req.query.lng !== '' ? Number(req.query.lng) : null;
    const pincode = req.query.pincode ? String(req.query.pincode).trim() : null;
    const city = req.query.city ? String(req.query.city).trim() : null;
    const vendorType = req.query.vendorType ? String(req.query.vendorType).trim() : null;
    const onlineOnly = req.query.onlineOnly === 'true';
    const q = (req.query.q || '').trim();

    const where = { role: 'vendor', isActive: true };
    if (vendorType && vendorType !== 'All') {
      where.vendorType = vendorType;
    }
    if (onlineOnly) {
      where.isOnline = true;
    }
    if (q) {
      where[Op.or] = [
        { shopName: { [Op.like]: `%${q}%` } },
        { shopNameKannada: { [Op.like]: `%${q}%` } },
        { name: { [Op.like]: `%${q}%` } },
        { serviceArea: { [Op.like]: `%${q}%` } },
        { city: { [Op.like]: `%${q}%` } },
        { businessCategory: { [Op.like]: `%${q}%` } },
      ];
    }

    const vendors = await User.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'products',
          where: { isActive: true },
          required: false,
          attributes: ['id', 'category', 'inStock', 'price'],
        },
      ],
      order: [
        ['isOnline', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
    });

    const hasLocationContext =
      (typeof lat === 'number' && !Number.isNaN(lat) && typeof lng === 'number' && !Number.isNaN(lng)) ||
      Boolean(pincode) ||
      Boolean(city);

    const location = {
      latitude: typeof lat === 'number' && !Number.isNaN(lat) ? lat : null,
      longitude: typeof lng === 'number' && !Number.isNaN(lng) ? lng : null,
      pincode,
      city,
    };

    const enriched = vendors.map((vendor) => {
      const publicVendor = vendor.toPublicVendorJSON();
      const activeProducts = vendor.products || [];
      const categories = [...new Set(activeProducts.map((p) => p.category).filter(Boolean))];
      const inStockCount = activeProducts.filter((p) => p.inStock).length;

      const serviceCheck = hasLocationContext
        ? evaluateServiceability(vendor, location, 'Delivery')
        : { serviceable: true, reason: null, distanceKm: null, estimatedMinutes: null };

      return {
        ...publicVendor,
        productCount: activeProducts.length,
        inStockCount,
        categories,
        distanceKm: serviceCheck.distanceKm,
        serviceable: serviceCheck.serviceable,
        serviceabilityNote: serviceCheck.reason,
        estimatedDeliveryMinutes: serviceCheck.estimatedMinutes,
      };
    });

    // Filter to serviceable only if requested explicitly
    const filtered =
      req.query.serviceableOnly === 'true' && hasLocationContext
        ? enriched.filter((v) => v.serviceable)
        : enriched;

    // Sort: online first, then serviceable, then nearest distance when available
    filtered.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      if (a.serviceable !== b.serviceable) return a.serviceable ? -1 : 1;
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      return 0;
    });

    return sendSuccess(res, filtered, 'Vendors fetched');
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/:id/storefront — Vendor storefront with products, categories & genuine reviews
router.get('/:id/storefront', async (req, res, next) => {
  try {
    const vendor = await User.findOne({
      where: { id: req.params.id, role: 'vendor', isActive: true },
    });
    if (!vendor) return sendError(res, 'Vendor not found', 404);

    const products = await Product.findAll({
      where: { vendorId: vendor.id, isActive: true },
      order: [
        ['inStock', 'DESC'],
        ['category', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });

    const reviews = await Review.findAll({
      where: { vendorId: vendor.id },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    const lat = req.query.lat !== undefined && req.query.lat !== '' ? Number(req.query.lat) : null;
    const lng = req.query.lng !== undefined && req.query.lng !== '' ? Number(req.query.lng) : null;
    const pincode = req.query.pincode ? String(req.query.pincode).trim() : null;
    const city = req.query.city ? String(req.query.city).trim() : null;

    const hasLoc =
      (typeof lat === 'number' && !Number.isNaN(lat) && typeof lng === 'number' && !Number.isNaN(lng)) ||
      Boolean(pincode) ||
      Boolean(city);

    const serviceability = hasLoc
      ? evaluateServiceability(vendor, { latitude: lat, longitude: lng, pincode, city }, 'Delivery')
      : null;

    return sendSuccess(
      res,
      {
        vendor: vendor.toPublicVendorJSON(),
        serviceability,
        products,
        categories,
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          customerName: r.customer?.name || 'Verified Customer',
          createdAt: r.createdAt,
        })),
      },
      'Vendor storefront loaded'
    );
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/me
router.get('/me', verifyToken, async (req, res) => {
  return sendSuccess(res, req.user.toSafeJSON(), 'Current user profile');
});

// PATCH /api/v1/users/profile — Update authenticated user or vendor profile
router.patch('/profile', verifyToken, async (req, res, next) => {
  try {
    const commonAllowed = ['name', 'email', 'language', 'city', 'state', 'pincode', 'preferences'];
    const vendorAllowed = [
      'shopName',
      'shopNameKannada',
      'vendorType',
      'businessCategory',
      'description',
      'serviceArea',
      'shopAddress',
      'latitude',
      'longitude',
      'upiId',
      'gstin',
      'isOnline',
      'settings',
    ];

    if (req.body.email) {
      const cleanEmail = String(req.body.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return sendError(res, 'Invalid email address', 400);
      }
      const conflict = await User.findOne({
        where: { email: cleanEmail, id: { [Op.ne]: req.user.id } },
      });
      if (conflict) {
        return sendError(res, 'Email is already in use by another account', 409);
      }
      req.user.email = cleanEmail;
    }

    for (const key of commonAllowed) {
      if (key !== 'email' && req.body[key] !== undefined) {
        if (key === 'preferences') {
          req.user.preferences = { ...(req.user.preferences || {}), ...req.body.preferences };
        } else {
          req.user[key] = req.body[key];
        }
      }
    }

    if (req.user.role === 'vendor') {
      if (req.body.vendorType && !User.VALID_VENDOR_TYPES.includes(req.body.vendorType)) {
        return sendError(res, 'Invalid vendor type', 400);
      }
      for (const key of vendorAllowed) {
        if (req.body[key] !== undefined) {
          if (key === 'settings') {
            req.user.settings = { ...(req.user.settings || {}), ...req.body.settings };
          } else if (key === 'isOnline') {
            req.user.isOnline = Boolean(req.body.isOnline);
            if (req.user.isOnline) {
              req.user.lastOnlineAt = new Date();
            }
          } else {
            req.user[key] = req.body[key];
          }
        }
      }
    }

    await req.user.save();
    return sendSuccess(res, req.user.toSafeJSON(), 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/users/availability — Explicit vendor online/offline toggle
router.patch('/availability', verifyToken, requireRole('vendor'), async (req, res, next) => {
  try {
    if (typeof req.body.isOnline !== 'boolean') {
      return sendError(res, 'Boolean isOnline field is required', 400);
    }
    req.user.isOnline = req.body.isOnline;
    if (req.user.isOnline) {
      req.user.lastOnlineAt = new Date();
    }
    await req.user.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('vendor:availability', {
        vendorId: req.user.id,
        isOnline: req.user.isOnline,
        lastOnlineAt: req.user.lastOnlineAt,
      });
    }

    return sendSuccess(
      res,
      { isOnline: req.user.isOnline, lastOnlineAt: req.user.lastOnlineAt },
      req.user.isOnline ? 'You are now online and accepting orders' : 'You are now offline'
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
