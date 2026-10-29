const express = require('express');
const router = express.Router();
const { Address } = require('../models');
const { verifyToken } = require('../middleware/auth.middleware');
const { sendSuccess, sendError } = require('../utils/response');

router.use(verifyToken);

// GET /api/v1/addresses — List authenticated user's saved addresses
router.get('/', async (req, res, next) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.userId },
      order: [
        ['isDefault', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
    });
    return sendSuccess(res, addresses, 'Saved addresses fetched');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/addresses — Add new delivery address
router.post('/', async (req, res, next) => {
  try {
    const {
      label = 'Home',
      recipientName,
      recipientPhone,
      addressLine1,
      addressLine2,
      landmark,
      area,
      city,
      state = 'Karnataka',
      pincode,
      latitude,
      longitude,
      deliveryInstructions,
      isDefault,
    } = req.body;

    if (!['Home', 'Work', 'Other'].includes(label)) {
      return sendError(res, 'Address label must be Home, Work, or Other', 400);
    }
    if (!recipientName || String(recipientName).trim().length < 2) {
      return sendError(res, 'Recipient name is required', 400);
    }
    const cleanPhone = String(recipientPhone || '').replace(/[\s\-+]/g, '').replace(/^91(?=\d{10}$)/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return sendError(res, 'Valid 10-digit recipient mobile number is required', 400);
    }
    if (!addressLine1 || String(addressLine1).trim().length < 3) {
      return sendError(res, 'House / street address line is required', 400);
    }
    if (!area || String(area).trim().length < 2) {
      return sendError(res, 'Area / locality is required', 400);
    }
    if (!city || String(city).trim().length < 2) {
      return sendError(res, 'City / town is required', 400);
    }
    const cleanPin = String(pincode || '').trim();
    if (!/^[1-9]\d{5}$/.test(cleanPin)) {
      return sendError(res, 'Valid 6-digit pincode is required', 400);
    }

    const existingCount = await Address.count({ where: { userId: req.userId } });
    const shouldBeDefault = existingCount === 0 || Boolean(isDefault);

    if (shouldBeDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.userId } });
    }

    const parsedLat =
      latitude !== undefined && latitude !== null && latitude !== '' ? Number(latitude) : null;
    const parsedLng =
      longitude !== undefined && longitude !== null && longitude !== '' ? Number(longitude) : null;

    const address = await Address.create({
      userId: req.userId,
      label,
      recipientName: String(recipientName).trim(),
      recipientPhone: cleanPhone,
      addressLine1: String(addressLine1).trim(),
      addressLine2: addressLine2 ? String(addressLine2).trim() : null,
      landmark: landmark ? String(landmark).trim() : null,
      area: String(area).trim(),
      city: String(city).trim(),
      state: String(state || 'Karnataka').trim(),
      pincode: cleanPin,
      latitude: parsedLat !== null && !Number.isNaN(parsedLat) ? parsedLat : null,
      longitude: parsedLng !== null && !Number.isNaN(parsedLng) ? parsedLng : null,
      deliveryInstructions: deliveryInstructions ? String(deliveryInstructions).trim() : null,
      isDefault: shouldBeDefault,
    });

    return sendSuccess(res, address, 'Delivery address saved', 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/addresses/:id — Edit saved address (strictly owner-scoped)
router.put('/:id', async (req, res, next) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!address) return sendError(res, 'Address not found', 404);

    if (req.body.pincode !== undefined && !/^[1-9]\d{5}$/.test(String(req.body.pincode).trim())) {
      return sendError(res, 'Valid 6-digit pincode is required', 400);
    }
    if (req.body.recipientPhone !== undefined) {
      const cleanPhone = String(req.body.recipientPhone)
        .replace(/[\s\-+]/g, '')
        .replace(/^91(?=\d{10}$)/, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return sendError(res, 'Valid 10-digit mobile number is required', 400);
      }
      address.recipientPhone = cleanPhone;
    }

    const editable = [
      'label',
      'recipientName',
      'addressLine1',
      'addressLine2',
      'landmark',
      'area',
      'city',
      'state',
      'pincode',
      'latitude',
      'longitude',
      'deliveryInstructions',
    ];
    for (const key of editable) {
      if (req.body[key] !== undefined) {
        address[key] = req.body[key];
      }
    }

    if (req.body.isDefault === true) {
      await Address.update({ isDefault: false }, { where: { userId: req.userId } });
      address.isDefault = true;
    }

    await address.save();
    return sendSuccess(res, address, 'Address updated');
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/addresses/:id/default — Mark as default address
router.patch('/:id/default', async (req, res, next) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!address) return sendError(res, 'Address not found', 404);

    await Address.update({ isDefault: false }, { where: { userId: req.userId } });
    address.isDefault = true;
    await address.save();

    return sendSuccess(res, address, 'Default delivery address updated');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/addresses/:id — Remove address
router.delete('/:id', async (req, res, next) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!address) return sendError(res, 'Address not found', 404);

    const wasDefault = address.isDefault;
    await address.destroy();

    if (wasDefault) {
      const nextAddr = await Address.findOne({
        where: { userId: req.userId },
        order: [['updatedAt', 'DESC']],
      });
      if (nextAddr) {
        nextAddr.isDefault = true;
        await nextAddr.save();
      }
    }

    return sendSuccess(res, { id: req.params.id }, 'Address deleted');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
