const express = require('express');
const router = express.Router();
const config = require('../config/config');
const {
  sequelize,
  Order,
  OrderItem,
  OrderMessage,
  Product,
  Customer,
  User,
  Address,
  Cart,
  CartItem,
  Review,
  Notification,
} = require('../models');
const { verifyToken } = require('../middleware/auth.middleware');
const {
  evaluateServiceability,
  calculateOrderTotals,
} = require('../utils/checkoutCalculator');
const { sendSuccess, sendPaginated, sendError, getPagination } = require('../utils/response');

function makeOrderNumber() {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randPart = Math.floor(10000 + Math.random() * 90000);
  return `VS-${datePart}-${randPart}`;
}

function canAccessOrder(order, user) {
  if (!order || !user) return false;
  if (order.customerUserId && order.customerUserId === user.id) return true;
  if (order.vendorId && order.vendorId === user.id) return true;
  return false;
}

router.use(verifyToken);

// POST /api/v1/orders/checkout — Customer checkout with idempotency, live validation & authoritative totals
router.post('/checkout', async (req, res, next) => {
  const idempotencyKey =
    (req.headers['x-idempotency-key'] || req.body.idempotencyKey || '').toString().trim() || null;

  if (idempotencyKey) {
    const existingOrder = await Order.findOne({
      where: { idempotencyKey, customerUserId: req.userId },
      include: [
        { model: OrderItem, as: 'items' },
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'name', 'shopName', 'shopNameKannada', 'phone', 'vendorType', 'shopAddress', 'city', 'pincode'],
        },
      ],
    });
    if (existingOrder) {
      return sendSuccess(
        res,
        { order: existingOrder, idempotentReplay: true },
        'Order already placed (duplicate submission prevented)',
        200
      );
    }
  }

  const t = await sequelize.transaction();
  try {
    const {
      addressId,
      fulfillmentType = 'Delivery',
      paymentMethod = 'COD',
      notes,
      expectedTotal,
      acceptCurrentPrices = false,
    } = req.body;

    if (!['Delivery', 'Pickup'].includes(fulfillmentType)) {
      await t.rollback();
      return sendError(res, 'Fulfillment type must be Delivery or Pickup', 400);
    }

    const cart = await Cart.findOne({
      where: { userId: req.userId },
      include: [{ model: CartItem, as: 'items' }],
      transaction: t,
    });

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0 || !cart.vendorId) {
      await t.rollback();
      return sendError(res, 'Your cart is empty. Add items before checking out.', 400);
    }

    const vendor = await User.findOne({
      where: { id: cart.vendorId, role: 'vendor', isActive: true },
      transaction: t,
    });
    if (!vendor) {
      await t.rollback();
      return sendError(res, 'Selected vendor is no longer active', 404);
    }

    if (!vendor.isOnline) {
      await t.rollback();
      return sendError(
        res,
        `${vendor.shopName || vendor.name} is currently offline and not accepting orders right now.`,
        409,
        { code: 'VENDOR_OFFLINE' }
      );
    }

    // Validate delivery address when Delivery is chosen
    let deliverySnapshot = { fulfillmentType };
    let locationForCheck = {};

    if (fulfillmentType === 'Delivery') {
      if (!addressId) {
        await t.rollback();
        return sendError(res, 'Please select a delivery address', 400);
      }
      const address = await Address.findOne({
        where: { id: addressId, userId: req.userId },
        transaction: t,
      });
      if (!address) {
        await t.rollback();
        return sendError(res, 'Selected delivery address was not found', 404);
      }
      locationForCheck = address;
      deliverySnapshot = {
        id: address.id,
        label: address.label,
        recipientName: address.recipientName,
        recipientPhone: address.recipientPhone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        landmark: address.landmark,
        area: address.area,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        latitude: address.latitude,
        longitude: address.longitude,
        deliveryInstructions: address.deliveryInstructions,
      };
    }

    const serviceCheck = evaluateServiceability(vendor, locationForCheck, fulfillmentType);
    if (!serviceCheck.serviceable) {
      await t.rollback();
      return sendError(res, serviceCheck.reason || 'Address is outside vendor service area', 422, {
        code: 'OUTSIDE_SERVICE_AREA',
      });
    }

    // Validate payment method honesty
    if (paymentMethod === 'ONLINE') {
      if (!config.razorpay.enabled) {
        await t.rollback();
        return sendError(
          res,
          'Online payment gateway is not configured on this server. Please select Cash on Delivery or Pay at Pickup.',
          503,
          { code: 'PAYMENT_GATEWAY_NOT_CONFIGURED' }
        );
      }
    } else if (paymentMethod === 'COD') {
      if (fulfillmentType !== 'Delivery') {
        await t.rollback();
        return sendError(res, 'Use Pay at Pickup for self-pickup orders', 400);
      }
      if (vendor.settings?.codEnabled === false) {
        await t.rollback();
        return sendError(res, 'Cash on Delivery is not enabled by this vendor', 400);
      }
    } else if (paymentMethod === 'PAY_AT_PICKUP') {
      if (fulfillmentType !== 'Pickup') {
        await t.rollback();
        return sendError(res, 'Pay at Pickup is only valid for self-pickup orders', 400);
      }
    } else {
      await t.rollback();
      return sendError(res, 'Unsupported payment method', 400);
    }

    // Validate each product's live stock, minOrderQty & price changes
    const lineItems = [];
    const priceChanges = [];

    for (const cartItem of cart.items) {
      const product = await Product.findOne({
        where: { id: cartItem.productId, vendorId: vendor.id, isActive: true },
        transaction: t,
      });

      if (!product) {
        await t.rollback();
        return sendError(
          res,
          'One or more items in your cart are no longer available. Please review your cart.',
          409,
          { code: 'PRODUCT_UNAVAILABLE', productId: cartItem.productId }
        );
      }

      const qty = Number(cartItem.quantity);
      const minQty = Number(product.minOrderQty || 1);
      if (qty < minQty) {
        await t.rollback();
        return sendError(
          res,
          `Minimum order quantity for ${product.name} is ${minQty} ${product.unit}`,
          400
        );
      }

      if (!product.inStock || Number(product.stock) < qty) {
        await t.rollback();
        return sendError(
          res,
          Number(product.stock) <= 0
            ? `${product.name} just went out of stock.`
            : `Only ${product.stock} ${product.unit} of ${product.name} remaining in stock.`,
          409,
          {
            code: 'INSUFFICIENT_STOCK',
            productId: product.id,
            availableStock: Number(product.stock),
          }
        );
      }

      if (
        !acceptCurrentPrices &&
        Number(product.price) !== Number(cartItem.unitPriceSnapshot)
      ) {
        priceChanges.push({
          productId: product.id,
          productName: product.name,
          previousPrice: Number(cartItem.unitPriceSnapshot),
          currentPrice: Number(product.price),
        });
      }

      lineItems.push({ product, quantity: qty });
    }

    if (priceChanges.length > 0) {
      await t.rollback();
      return sendError(
        res,
        'Item prices were updated by the vendor. Please review the updated total before placing your order.',
        409,
        { code: 'PRICE_CHANGED', priceChanges }
      );
    }

    const bill = calculateOrderTotals({ vendor, lineItems, fulfillmentType });

    if (bill.minOrderShortfall > 0) {
      await t.rollback();
      return sendError(
        res,
        `Minimum order amount for delivery from ${vendor.shopName || vendor.name} is ₹${bill.minOrderAmount}. Add ₹${bill.minOrderShortfall} more.`,
        400,
        { code: 'MIN_ORDER_NOT_MET', minOrderAmount: bill.minOrderAmount, shortfall: bill.minOrderShortfall }
      );
    }

    if (
      expectedTotal !== undefined &&
      expectedTotal !== null &&
      Math.abs(Number(expectedTotal) - bill.total) > 0.01
    ) {
      await t.rollback();
      return sendError(
        res,
        `Order total changed to ₹${bill.total}. Please review the updated bill before confirming.`,
        409,
        { code: 'TOTAL_MISMATCH', serverTotal: bill.total }
      );
    }

    // Deduct stock atomically
    for (const { product, quantity } of lineItems) {
      product.stock = Number((Number(product.stock) - Number(quantity)).toFixed(2));
      product.totalSold = Number((Number(product.totalSold || 0) + Number(quantity)).toFixed(2));
      await product.save({ transaction: t });
    }

    const customerPhone =
      fulfillmentType === 'Delivery'
        ? deliverySnapshot.recipientPhone
        : req.user.phone;
    const customerName =
      fulfillmentType === 'Delivery'
        ? deliverySnapshot.recipientName
        : req.user.name;

    // Never mark Paid without verified payment confirmation!
    const order = await Order.create(
      {
        orderNumber: makeOrderNumber(),
        idempotencyKey,
        vendorId: vendor.id,
        customerUserId: req.userId,
        customerName,
        customerPhone,
        status: 'Placed',
        type: fulfillmentType,
        source: 'customer_app',
        subtotal: bill.subtotal,
        discount: bill.discount,
        tax: bill.tax,
        deliveryCharge: bill.deliveryCharge,
        total: bill.total,
        estimatedProfit: bill.estimatedProfit,
        paidAmount: 0,
        dueAmount: bill.total,
        paymentMethod,
        paymentStatus: 'Pending',
        isUdhaar: false,
        deliveryAddress: {
          ...deliverySnapshot,
          distanceKm: serviceCheck.distanceKm,
          estimatedDeliveryMinutes: serviceCheck.estimatedMinutes,
        },
        notes: notes ? String(notes).trim() : null,
        statusHistory: [
          {
            status: 'Placed',
            timestamp: new Date().toISOString(),
            actorRole: 'customer',
            note:
              paymentMethod === 'ONLINE'
                ? 'Order created; awaiting online payment verification'
                : `Order placed (${paymentMethod === 'COD' ? 'Cash on Delivery' : 'Pay at Pickup'})`,
          },
        ],
      },
      { transaction: t }
    );

    for (const item of bill.items) {
      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          kannadaName: item.kannadaName,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          totalPrice: item.totalPrice,
        },
        { transaction: t }
      );
    }

    // Clear cart after order creation
    await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });
    cart.vendorId = null;
    cart.notes = null;
    await cart.save({ transaction: t });

    vendor.totalOrders = Number(vendor.totalOrders || 0) + 1;
    await vendor.save({ transaction: t });

    await Notification.create(
      {
        userId: vendor.id,
        vendorId: vendor.id,
        type: 'order',
        title: `New Order ${order.orderNumber}`,
        kannadaTitle: `ಹೊಸ ಆರ್ಡರ್ ${order.orderNumber}`,
        body: `${customerName} placed an order of ₹${bill.total} (${fulfillmentType}).`,
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
      },
      { transaction: t }
    );

    await t.commit();

    const fullOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'items' },
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'name', 'shopName', 'shopNameKannada', 'phone', 'vendorType', 'shopAddress', 'city', 'pincode'],
        },
      ],
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`vendor:${vendor.id}`).emit('order:created', fullOrder);
      io.to(`customer:${req.userId}`).emit('order:created', fullOrder);
    }

    return sendSuccess(
      res,
      {
        order: fullOrder,
        requiresOnlinePayment: paymentMethod === 'ONLINE',
      },
      'Order placed successfully',
      201
    );
  } catch (error) {
    await t.rollback();
    next(error);
  }
});

// POST /api/v1/orders — Vendor walk-in POS order creation (for vendor role)
router.post('/', async (req, res, next) => {
  if (req.user.role === 'customer') {
    return sendError(res, 'Customers must use /api/v1/orders/checkout to place orders', 403);
  }

  const t = await sequelize.transaction();
  try {
    const {
      items = [],
      customerName = 'Walk-in Customer',
      customerPhone,
      paymentMethod = 'Cash',
      paymentCollected = false,
      notes,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return sendError(res, 'Order must contain at least one item', 400);
    }

    const lineItems = [];
    for (const raw of items) {
      const product = await Product.findOne({
        where: { id: raw.productId, vendorId: req.userId, isActive: true },
        transaction: t,
      });
      if (!product) {
        await t.rollback();
        return sendError(res, 'Product not found in your catalog', 404);
      }
      const qty = Number(raw.quantity || 1);
      if (qty <= 0 || Number(product.stock) < qty) {
        await t.rollback();
        return sendError(res, `Insufficient stock for ${product.name}`, 400);
      }
      product.stock = Number((Number(product.stock) - qty).toFixed(2));
      await product.save({ transaction: t });
      lineItems.push({ product, quantity: qty });
    }

    const bill = calculateOrderTotals({
      vendor: req.user,
      lineItems,
      fulfillmentType: 'Pickup',
    });

    const isPaid = Boolean(paymentCollected) && paymentMethod !== 'Udhaar';
    const order = await Order.create(
      {
        orderNumber: makeOrderNumber(),
        vendorId: req.userId,
        customerName: String(customerName).trim(),
        customerPhone: customerPhone ? String(customerPhone).trim() : null,
        status: 'Delivered',
        type: 'Walk-in',
        source: 'pos',
        subtotal: bill.subtotal,
        total: bill.total,
        estimatedProfit: bill.estimatedProfit,
        paidAmount: isPaid ? bill.total : 0,
        dueAmount: isPaid ? 0 : bill.total,
        paymentMethod,
        paymentStatus: isPaid ? 'Paid' : 'Pending',
        deliveredAt: new Date(),
        notes: notes || null,
        statusHistory: [
          {
            status: 'Delivered',
            timestamp: new Date().toISOString(),
            actorRole: 'vendor',
            note: 'Walk-in POS sale recorded by vendor',
          },
        ],
      },
      { transaction: t }
    );

    for (const item of bill.items) {
      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          kannadaName: item.kannadaName,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          totalPrice: item.totalPrice,
        },
        { transaction: t }
      );
    }

    await t.commit();
    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }],
    });
    return sendSuccess(res, fullOrder, 'POS order recorded', 201);
  } catch (error) {
    await t.rollback();
    next(error);
  }
});

// GET /api/v1/orders — Strictly scoped order history (Customer sees own orders; Vendor sees vendor orders)
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const where = {};

    if (req.user.role === 'vendor' && req.query.scope !== 'customer') {
      where.vendorId = req.userId;
    } else {
      where.customerUserId = req.userId;
    }

    if (req.query.status && req.query.status !== 'All') {
      where.status = req.query.status;
    }
    if (req.query.paymentStatus && req.query.paymentStatus !== 'All') {
      where.paymentStatus = req.query.paymentStatus;
    }

    const { rows, count } = await Order.findAndCountAll({
      where,
      include: [
        { model: OrderItem, as: 'items' },
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'name', 'shopName', 'shopNameKannada', 'phone', 'vendorType', 'shopAddress', 'city', 'pincode', 'isOnline'],
        },
        { model: Review, as: 'review' },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return sendPaginated(res, rows, count, page, limit, 'Orders fetched');
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/:id — Strictly authorized order detail & tracking
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: OrderItem, as: 'items' },
        {
          model: User,
          as: 'vendor',
          attributes: [
            'id',
            'name',
            'shopName',
            'shopNameKannada',
            'phone',
            'vendorType',
            'serviceArea',
            'shopAddress',
            'city',
            'pincode',
            'isOnline',
          ],
        },
        { model: Review, as: 'review' },
        {
          model: OrderMessage,
          as: 'messages',
          separate: true,
          order: [['createdAt', 'ASC']],
        },
      ],
    });

    if (!order) return sendError(res, 'Order not found', 404);
    if (!canAccessOrder(order, req.user)) {
      return sendError(res, 'You do not have permission to view this order', 403);
    }

    return sendSuccess(res, order, 'Order details fetched');
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/orders/:id/status — Vendor updates order fulfillment status
router.patch('/:id/status', async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { status, note } = req.body;
    if (!Order.VALID_ORDER_STATUSES.includes(status)) {
      await t.rollback();
      return sendError(
        res,
        `Status must be one of: ${Order.VALID_ORDER_STATUSES.join(', ')}`,
        400
      );
    }

    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t,
    });
    if (!order) {
      await t.rollback();
      return sendError(res, 'Order not found', 404);
    }
    if (order.vendorId !== req.userId) {
      await t.rollback();
      return sendError(res, 'Only the assigned vendor can update order status', 403);
    }
    if (order.status === 'Cancelled' || order.status === 'Delivered') {
      await t.rollback();
      return sendError(res, `Order is already ${order.status} and cannot be changed`, 400);
    }

    // Restore stock if vendor cancels
    if (status === 'Cancelled') {
      for (const item of order.items || []) {
        if (item.productId) {
          const prod = await Product.findByPk(item.productId, { transaction: t });
          if (prod) {
            prod.stock = Number((Number(prod.stock) + Number(item.quantity)).toFixed(2));
            await prod.save({ transaction: t });
          }
        }
      }
      order.cancelledBy = 'vendor';
      order.cancellationReason = note ? String(note).trim() : 'Cancelled by vendor';
    }

    if (status === 'Delivered') {
      order.deliveredAt = new Date();
    }

    order.status = status;
    const history = Array.isArray(order.statusHistory) ? [...order.statusHistory] : [];
    history.push({
      status,
      timestamp: new Date().toISOString(),
      actorRole: 'vendor',
      note: note ? String(note).trim() : `Status updated to ${status}`,
    });
    order.statusHistory = history;
    await order.save({ transaction: t });

    if (order.customerUserId) {
      await Notification.create(
        {
          userId: order.customerUserId,
          vendorId: order.vendorId,
          type: 'order',
          title: `Order ${order.orderNumber}: ${status}`,
          body: note
            ? `${status} — ${note}`
            : `Your order status is now ${status}.`,
          metadata: { orderId: order.id, status },
        },
        { transaction: t }
      );
    }

    await t.commit();

    const io = req.app.get('io');
    if (io) {
      const payload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusHistory: order.statusHistory,
        deliveredAt: order.deliveredAt,
      };
      io.to(`order:${order.id}`).emit('order:status_updated', payload);
      if (order.customerUserId) {
        io.to(`customer:${order.customerUserId}`).emit('order:status_updated', payload);
      }
      io.to(`vendor:${order.vendorId}`).emit('order:status_updated', payload);
    }

    return sendSuccess(res, order, `Order marked as ${status}`);
  } catch (error) {
    await t.rollback();
    next(error);
  }
});

// POST /api/v1/orders/:id/cancel — Customer or Vendor cancels order where allowed
router.post('/:id/cancel', async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t,
    });
    if (!order) {
      await t.rollback();
      return sendError(res, 'Order not found', 404);
    }
    if (!canAccessOrder(order, req.user)) {
      await t.rollback();
      return sendError(res, 'You do not have permission to cancel this order', 403);
    }

    const isCustomer = order.customerUserId === req.userId && req.user.role === 'customer';
    if (isCustomer && !['Placed', 'Accepted'].includes(order.status)) {
      await t.rollback();
      return sendError(
        res,
        `Orders in '${order.status}' status can no longer be self-cancelled. Please message or call the vendor.`,
        400
      );
    }
    if (['Delivered', 'Cancelled'].includes(order.status)) {
      await t.rollback();
      return sendError(res, `Order is already ${order.status}`, 400);
    }

    const reason = req.body.reason
      ? String(req.body.reason).trim()
      : isCustomer
        ? 'Cancelled by customer'
        : 'Cancelled by vendor';

    // Restore deducted inventory
    for (const item of order.items || []) {
      if (item.productId) {
        const prod = await Product.findByPk(item.productId, { transaction: t });
        if (prod) {
          prod.stock = Number((Number(prod.stock) + Number(item.quantity)).toFixed(2));
          await prod.save({ transaction: t });
        }
      }
    }

    order.status = 'Cancelled';
    order.cancelledBy = isCustomer ? 'customer' : 'vendor';
    order.cancellationReason = reason;
    const history = Array.isArray(order.statusHistory) ? [...order.statusHistory] : [];
    history.push({
      status: 'Cancelled',
      timestamp: new Date().toISOString(),
      actorRole: isCustomer ? 'customer' : 'vendor',
      note: reason,
    });
    order.statusHistory = history;
    await order.save({ transaction: t });

    await t.commit();

    const io = req.app.get('io');
    if (io) {
      const payload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: 'Cancelled',
        cancellationReason: reason,
        statusHistory: order.statusHistory,
      };
      io.to(`order:${order.id}`).emit('order:status_updated', payload);
      io.to(`vendor:${order.vendorId}`).emit('order:status_updated', payload);
      if (order.customerUserId) {
        io.to(`customer:${order.customerUserId}`).emit('order:status_updated', payload);
      }
    }

    return sendSuccess(res, order, 'Order cancelled and stock restored');
  } catch (error) {
    await t.rollback();
    next(error);
  }
});

// POST /api/v1/orders/:id/reorder — Re-add available items from a past order with current live prices
router.post('/:id/reorder', async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }],
    });
    if (!order) return sendError(res, 'Order not found', 404);
    if (order.customerUserId !== req.userId) {
      return sendError(res, 'You can only reorder from your own past orders', 403);
    }

    const vendor = await User.findOne({
      where: { id: order.vendorId, role: 'vendor', isActive: true },
    });
    if (!vendor) {
      return sendError(res, 'This vendor is no longer active on VenderSathi', 409);
    }

    let cart = await Cart.findOne({ where: { userId: req.userId } });
    if (!cart) {
      cart = await Cart.create({ userId: req.userId, vendorId: vendor.id });
    } else {
      await CartItem.destroy({ where: { cartId: cart.id } });
      cart.vendorId = vendor.id;
      await cart.save();
    }

    const addedItems = [];
    const skippedItems = [];
    const priceUpdates = [];

    for (const oldItem of order.items || []) {
      const product = oldItem.productId
        ? await Product.findOne({
            where: { id: oldItem.productId, vendorId: vendor.id, isActive: true },
          })
        : null;

      if (!product || !product.inStock) {
        skippedItems.push({
          productName: oldItem.productName,
          reason: !product ? 'No longer listed' : 'Currently out of stock',
        });
        continue;
      }

      const qty = Math.min(Number(oldItem.quantity), Number(product.stock));
      if (qty < Number(product.minOrderQty || 1)) {
        skippedItems.push({
          productName: product.name,
          reason: `Insufficient stock (minimum ${product.minOrderQty} ${product.unit})`,
        });
        continue;
      }

      if (Number(product.price) !== Number(oldItem.unitPrice)) {
        priceUpdates.push({
          productName: product.name,
          previousPrice: Number(oldItem.unitPrice),
          currentPrice: Number(product.price),
        });
      }

      await CartItem.create({
        cartId: cart.id,
        productId: product.id,
        quantity: Number(qty.toFixed(2)),
        unitPriceSnapshot: Number(product.price),
      });
      addedItems.push({ productName: product.name, quantity: qty, currentPrice: product.price });
    }

    if (addedItems.length === 0) {
      cart.vendorId = null;
      await cart.save();
      return sendError(
        res,
        'None of the items from this past order are currently in stock.',
        409,
        { skippedItems }
      );
    }

    return sendSuccess(
      res,
      {
        vendorId: vendor.id,
        vendorOnline: vendor.isOnline,
        addedItems,
        skippedItems,
        priceUpdates,
      },
      'Available items added to your cart at current vendor prices'
    );
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/:id/messages — Fetch order communication messages
router.get('/:id/messages', async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return sendError(res, 'Order not found', 404);
    if (!canAccessOrder(order, req.user)) {
      return sendError(res, 'Access denied', 403);
    }

    const messages = await OrderMessage.findAll({
      where: { orderId: order.id },
      order: [['createdAt', 'ASC']],
    });
    return sendSuccess(res, messages, 'Order messages fetched');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/orders/:id/messages — Send message between customer & vendor on an order
router.post('/:id/messages', async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return sendError(res, 'Order not found', 404);
    if (!canAccessOrder(order, req.user)) {
      return sendError(res, 'Access denied', 403);
    }

    const text = (req.body.message || '').toString().trim();
    if (!text || text.length > 1000) {
      return sendError(res, 'Message must be between 1 and 1000 characters', 400);
    }

    const senderRole = order.vendorId === req.userId ? 'vendor' : 'customer';
    const msg = await OrderMessage.create({
      orderId: order.id,
      senderId: req.userId,
      senderRole,
      senderName: senderRole === 'vendor' ? req.user.shopName || req.user.name : req.user.name,
      message: text,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`order:${order.id}`).emit('order:message', msg);
      if (senderRole === 'customer') {
        io.to(`vendor:${order.vendorId}`).emit('order:message', msg);
      } else if (order.customerUserId) {
        io.to(`customer:${order.customerUserId}`).emit('order:message', msg);
      }
    }

    return sendSuccess(res, msg, 'Message sent', 201);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
