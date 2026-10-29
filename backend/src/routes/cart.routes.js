const express = require('express');
const router = express.Router();
const { Cart, CartItem, Product, User, Address } = require('../models');
const { verifyToken } = require('../middleware/auth.middleware');
const {
  evaluateServiceability,
  calculateOrderTotals,
} = require('../utils/checkoutCalculator');
const { sendSuccess, sendError } = require('../utils/response');

router.use(verifyToken);

async function buildCartResponse(userId, query = {}) {
  let cart = await Cart.findOne({
    where: { userId },
    include: [
      {
        model: User,
        as: 'vendor',
      },
      {
        model: CartItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }],
      },
    ],
  });

  if (!cart) {
    cart = await Cart.create({ userId, vendorId: null });
    cart.items = [];
    cart.vendor = null;
  }

  const rawItems = cart.items || [];
  if (rawItems.length === 0) {
    if (cart.vendorId) {
      cart.vendorId = null;
      await cart.save();
    }
    return {
      id: cart.id,
      vendor: null,
      items: [],
      priceChanges: [],
      stockWarnings: [],
      bill: {
        subtotal: 0,
        discount: 0,
        tax: 0,
        deliveryCharge: 0,
        total: 0,
        minOrderAmount: 0,
        minOrderShortfall: 0,
        freeDeliveryAbove: null,
      },
      serviceability: null,
    };
  }

  const vendor = cart.vendor || (cart.vendorId ? await User.findByPk(cart.vendorId) : null);
  const fulfillmentType = query.fulfillmentType === 'Pickup' ? 'Pickup' : 'Delivery';

  const priceChanges = [];
  const stockWarnings = [];
  const validLineItems = [];

  for (const item of rawItems) {
    const product = item.product;
    if (!product || !product.isActive) {
      stockWarnings.push({
        cartItemId: item.id,
        productId: item.productId,
        reason: 'Item is no longer available from this vendor.',
      });
      continue;
    }

    if (Number(product.price) !== Number(item.unitPriceSnapshot)) {
      priceChanges.push({
        cartItemId: item.id,
        productId: product.id,
        productName: product.name,
        previousPrice: Number(item.unitPriceSnapshot),
        currentPrice: Number(product.price),
      });
    }

    if (!product.inStock || Number(product.stock) < Number(item.quantity)) {
      stockWarnings.push({
        cartItemId: item.id,
        productId: product.id,
        productName: product.name,
        requestedQuantity: Number(item.quantity),
        availableStock: Number(product.stock),
        reason:
          Number(product.stock) <= 0
            ? `${product.name} is currently out of stock.`
            : `Only ${product.stock} ${product.unit} of ${product.name} left in stock.`,
      });
    }

    validLineItems.push({
      cartItemId: item.id,
      product,
      quantity: Number(item.quantity),
      unitPriceSnapshot: Number(item.unitPriceSnapshot),
    });
  }

  const bill = calculateOrderTotals({
    vendor,
    lineItems: validLineItems,
    fulfillmentType,
  });

  // Attach cartItemId onto each item
  const items = bill.items.map((computed, idx) => ({
    ...computed,
    cartItemId: validLineItems[idx].cartItemId,
    unitPriceSnapshot: validLineItems[idx].unitPriceSnapshot,
  }));

  let serviceability = null;
  if (vendor) {
    let location = null;
    if (query.addressId) {
      const addr = await Address.findOne({ where: { id: query.addressId, userId } });
      if (addr) location = addr;
    } else if (query.pincode || query.city || (query.lat && query.lng)) {
      location = {
        pincode: query.pincode || null,
        city: query.city || null,
        latitude: query.lat ? Number(query.lat) : null,
        longitude: query.lng ? Number(query.lng) : null,
      };
    }
    if (location || fulfillmentType === 'Pickup') {
      serviceability = evaluateServiceability(vendor, location || {}, fulfillmentType);
    }
  }

  return {
    id: cart.id,
    notes: cart.notes || '',
    vendor: vendor ? vendor.toPublicVendorJSON() : null,
    items,
    priceChanges,
    stockWarnings,
    bill: {
      subtotal: bill.subtotal,
      discount: bill.discount,
      tax: bill.tax,
      deliveryCharge: bill.deliveryCharge,
      total: bill.total,
      minOrderAmount: bill.minOrderAmount,
      minOrderShortfall: bill.minOrderShortfall,
      freeDeliveryAbove: bill.freeDeliveryAbove,
    },
    serviceability,
  };
}

// GET /api/v1/cart — Get persistent cart with live stock/price checks
router.get('/', async (req, res, next) => {
  try {
    const data = await buildCartResponse(req.userId, req.query);
    return sendSuccess(res, data, 'Cart loaded');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/cart/items — Add or update item in cart (single-vendor clarity enforced)
router.post('/items', async (req, res, next) => {
  try {
    const { productId, quantity, replaceVendorCart = false } = req.body;
    if (!productId) {
      return sendError(res, 'productId is required', 400);
    }

    const product = await Product.findOne({
      where: { id: productId, isActive: true },
      include: [{ model: User, as: 'vendor' }],
    });
    if (!product || !product.vendor || !product.vendor.isActive) {
      return sendError(res, 'Product or vendor is unavailable', 404);
    }

    const requestedQty =
      quantity !== undefined ? Number(quantity) : Number(product.minOrderQty || 1);
    if (Number.isNaN(requestedQty) || requestedQty <= 0) {
      return sendError(res, 'Quantity must be greater than zero', 400);
    }

    const minQty = Number(product.minOrderQty || 1);
    if (requestedQty < minQty) {
      return sendError(
        res,
        `Minimum order quantity for ${product.name} is ${minQty} ${product.unit}`,
        400
      );
    }
    if (product.maxOrderQty && requestedQty > Number(product.maxOrderQty)) {
      return sendError(
        res,
        `Maximum order quantity for ${product.name} is ${product.maxOrderQty} ${product.unit}`,
        400
      );
    }
    if (!product.inStock || Number(product.stock) < requestedQty) {
      return sendError(
        res,
        Number(product.stock) <= 0
          ? `${product.name} is out of stock`
          : `Only ${product.stock} ${product.unit} available in stock`,
        400
      );
    }

    let cart = await Cart.findOne({
      where: { userId: req.userId },
      include: [{ model: CartItem, as: 'items' }],
    });

    if (!cart) {
      cart = await Cart.create({ userId: req.userId, vendorId: product.vendorId });
      cart.items = [];
    }

    // Check single-vendor rule
    if (
      cart.vendorId &&
      cart.vendorId !== product.vendorId &&
      Array.isArray(cart.items) &&
      cart.items.length > 0
    ) {
      if (!replaceVendorCart) {
        const currentVendor = await User.findByPk(cart.vendorId);
        return sendError(
          res,
          `Your cart currently contains items from ${currentVendor?.shopName || 'another vendor'}. Clear cart and switch to ${product.vendor.shopName || product.vendor.name}?`,
          409,
          {
            code: 'DIFFERENT_VENDOR_CART',
            currentVendorId: cart.vendorId,
            currentVendorName: currentVendor?.shopName || currentVendor?.name || 'Current Vendor',
            newVendorId: product.vendorId,
            newVendorName: product.vendor.shopName || product.vendor.name,
          }
        );
      }
      await CartItem.destroy({ where: { cartId: cart.id } });
    }

    cart.vendorId = product.vendorId;
    await cart.save();

    const existingItem = await CartItem.findOne({
      where: { cartId: cart.id, productId: product.id },
    });

    if (existingItem) {
      existingItem.quantity = Number(requestedQty.toFixed(2));
      existingItem.unitPriceSnapshot = Number(product.price);
      await existingItem.save();
    } else {
      await CartItem.create({
        cartId: cart.id,
        productId: product.id,
        quantity: Number(requestedQty.toFixed(2)),
        unitPriceSnapshot: Number(product.price),
      });
    }

    const updated = await buildCartResponse(req.userId, req.query);
    return sendSuccess(res, updated, 'Cart updated');
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/cart/items/:itemId — Update cart item quantity or acknowledge price update
router.patch('/items/:itemId', async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.userId } });
    if (!cart) return sendError(res, 'Cart is empty', 404);

    const cartItem = await CartItem.findOne({
      where: { id: req.params.itemId, cartId: cart.id },
      include: [{ model: Product, as: 'product' }],
    });
    if (!cartItem) return sendError(res, 'Item not found in cart', 404);

    const { quantity, acceptCurrentPrice } = req.body;
    if (quantity !== undefined) {
      const numQty = Number(quantity);
      if (Number.isNaN(numQty)) return sendError(res, 'Invalid quantity', 400);

      if (numQty <= 0) {
        await cartItem.destroy();
        const updated = await buildCartResponse(req.userId, req.query);
        return sendSuccess(res, updated, 'Item removed from cart');
      }

      const product = cartItem.product;
      if (!product || !product.isActive) {
        return sendError(res, 'Product is no longer available', 400);
      }
      const minQty = Number(product.minOrderQty || 1);
      if (numQty < minQty) {
        return sendError(
          res,
          `Minimum order quantity for ${product.name} is ${minQty} ${product.unit}`,
          400
        );
      }
      if (Number(product.stock) < numQty) {
        return sendError(
          res,
          `Only ${product.stock} ${product.unit} available in stock`,
          400
        );
      }

      cartItem.quantity = Number(numQty.toFixed(2));
      cartItem.unitPriceSnapshot = Number(product.price);
      await cartItem.save();
    } else if (acceptCurrentPrice && cartItem.product) {
      cartItem.unitPriceSnapshot = Number(cartItem.product.price);
      await cartItem.save();
    }

    const updated = await buildCartResponse(req.userId, req.query);
    return sendSuccess(res, updated, 'Cart item updated');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/cart/items/:itemId — Remove single item
router.delete('/items/:itemId', async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.userId } });
    if (!cart) return sendError(res, 'Cart not found', 404);

    await CartItem.destroy({
      where: { id: req.params.itemId, cartId: cart.id },
    });

    const remaining = await CartItem.count({ where: { cartId: cart.id } });
    if (remaining === 0) {
      cart.vendorId = null;
      await cart.save();
    }

    const updated = await buildCartResponse(req.userId, req.query);
    return sendSuccess(res, updated, 'Item removed');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/cart — Clear entire cart
router.delete('/', async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.userId } });
    if (cart) {
      await CartItem.destroy({ where: { cartId: cart.id } });
      cart.vendorId = null;
      cart.notes = null;
      await cart.save();
    }
    const updated = await buildCartResponse(req.userId, req.query);
    return sendSuccess(res, updated, 'Cart cleared');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
