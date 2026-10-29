const express = require('express');
const router = express.Router();
const { Op } = require('../config/database');
const config = require('../config/config');
const { Route, Order, Customer } = require('../models');
const { optimizeDeliveryRoute } = require('../utils/routeOptimizer');
const { sendSuccess, sendError } = require('../utils/response');

async function optimizeViaAiOrLocal(payload) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(`${config.ai.baseUrl}/routes/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (resp.ok) {
      const json = await resp.json();
      if (json?.data) return { ...json.data, engine: 'Python FastAPI Mobility Engine' };
    }
  } catch (_) {
    // Graceful fallback to embedded 2-Opt engine
  }
  return { ...optimizeDeliveryRoute(payload), engine: 'Node 2-Opt Mobility Engine' };
}

router.get('/', async (req, res, next) => {
  try {
    const routes = await Route.findAll({
      where: { vendorId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    return sendSuccess(res, routes, 'Routes fetched');
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const route = await Route.findOne({
      where: { id: req.params.id, vendorId: req.userId },
    });
    if (!route) return sendError(res, 'Route not found', 404);
    return sendSuccess(res, route, 'Route details');
  } catch (error) {
    next(error);
  }
});

// POST /optimize (Optimize custom stops or pending orders and optionally persist)
router.post('/optimize', async (req, res, next) => {
  try {
    const {
      name,
      vehicleType = 'Two-Wheeler',
      origin,
      stops = [],
      saveRoute = true,
    } = req.body;

    const shopOrigin = origin || {
      latitude: req.user.latitude || 13.0827,
      longitude: req.user.longitude || 74.9945,
      name: req.user.shopName || req.user.name,
      address: req.user.shopAddress || `${req.user.city || 'Mudbidri'}, Karnataka`,
    };

    const result = await optimizeViaAiOrLocal({
      origin: shopOrigin,
      stops,
      vehicleType,
      returnToOrigin: true,
    });

    let savedRoute = null;
    if (saveRoute && result.stops.length > 0) {
      savedRoute = await Route.create({
        routeNumber: `RTE-${Date.now().toString().slice(-6)}`,
        vendorId: req.userId,
        name: name || `Delivery Run • ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
        status: 'Planned',
        vehicleType,
        startLocation: result.origin,
        stopsData: result.stops,
        totalDistanceKm: result.totalDistanceKm,
        unoptimizedDistanceKm: result.unoptimizedDistanceKm,
        distanceSavedKm: result.distanceSavedKm,
        estimatedMinutes: result.estimatedMinutes,
        fuelCostInr: result.fuelCostInr,
        fuelSavedInr: result.fuelSavedInr,
        estimatedRevenueInr: result.estimatedRevenueInr,
        totalStops: result.stops.length,
        completedStops: result.stops.filter((s) => s.isCompleted).length,
        algorithm: `${result.algorithm} (${result.engine})`,
      });
    }

    return sendSuccess(res, {
      optimization: result,
      route: savedRoute,
    }, 'Delivery route optimized successfully');
  } catch (error) {
    next(error);
  }
});

// POST /from-pending-orders (Build & optimize route directly from active delivery orders)
router.post('/from-pending-orders', async (req, res, next) => {
  try {
    const { vehicleType = 'Two-Wheeler' } = req.body || {};
    const pendingOrders = await Order.findAll({
      where: {
        vendorId: req.userId,
        type: 'Delivery',
        status: { [Op.in]: ['Pending', 'Accepted', 'Prepared', 'On the Way'] },
      },
      include: [{ model: Customer, as: 'customer' }],
    });

    if (pendingOrders.length === 0) {
      return sendError(res, 'No active delivery orders waiting for dispatch', 400);
    }

    const baseLat = req.user.latitude || 13.0827;
    const baseLng = req.user.longitude || 74.9945;

    const stops = pendingOrders.map((order, idx) => {
      const addr = order.deliveryAddress || {};
      const cust = order.customer;
      // Deterministic realistic coastal offset if order had no coordinates
      const angle = (idx * 137.5 * Math.PI) / 180;
      const distDeg = 0.008 + (idx % 5) * 0.005;
      return {
        id: `stop-${order.id.slice(0, 8)}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        name: order.customerName,
        phone: order.customerPhone || cust?.phone || '',
        address: addr.address || cust?.address || `${req.user.city || 'Mudbidri'} Locality`,
        landmark: addr.landmark || cust?.landmark || '',
        latitude: Number(addr.latitude ?? cust?.latitude ?? (baseLat + Math.cos(angle) * distDeg)),
        longitude: Number(addr.longitude ?? cust?.longitude ?? (baseLng + Math.sin(angle) * distDeg)),
        orderAmount: Number(order.total || 0),
        priority: Number(order.total) >= 500 ? 'High' : 'Normal',
        status: 'Pending',
      };
    });

    const shopOrigin = {
      latitude: baseLat,
      longitude: baseLng,
      name: req.user.shopName || req.user.name,
      address: req.user.shopAddress || 'Main Road, Mudbidri',
    };

    const result = await optimizeViaAiOrLocal({
      origin: shopOrigin,
      stops,
      vehicleType,
      returnToOrigin: true,
    });

    const savedRoute = await Route.create({
      routeNumber: `RTE-${Date.now().toString().slice(-6)}`,
      vendorId: req.userId,
      name: `Active Orders Dispatch (${result.stops.length} stops)`,
      status: 'In Progress',
      vehicleType,
      startLocation: result.origin,
      stopsData: result.stops,
      totalDistanceKm: result.totalDistanceKm,
      unoptimizedDistanceKm: result.unoptimizedDistanceKm,
      distanceSavedKm: result.distanceSavedKm,
      estimatedMinutes: result.estimatedMinutes,
      fuelCostInr: result.fuelCostInr,
      fuelSavedInr: result.fuelSavedInr,
      estimatedRevenueInr: result.estimatedRevenueInr,
      totalStops: result.stops.length,
      completedStops: 0,
      algorithm: `${result.algorithm} (${result.engine})`,
    });

    return sendSuccess(res, { optimization: result, route: savedRoute }, 'Dispatch route created from pending orders', 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /:id/stops/:sequence/complete
router.patch('/:id/stops/:sequence/complete', async (req, res, next) => {
  try {
    const route = await Route.findOne({
      where: { id: req.params.id, vendorId: req.userId },
    });
    if (!route) return sendError(res, 'Route not found', 404);

    const seq = parseInt(req.params.sequence, 10);
    const stops = Array.isArray(route.stopsData) ? [...route.stopsData] : [];
    const target = stops.find((s) => Number(s.sequence) === seq);
    if (!target) return sendError(res, 'Stop not found in route', 404);

    target.status = 'Completed';
    target.isCompleted = true;
    target.completedAt = new Date().toISOString();

    if (target.orderId) {
      const order = await Order.findByPk(target.orderId);
      if (order && order.status !== 'Delivered') {
        order.status = 'Delivered';
        order.deliveredAt = new Date();
        await order.save();
      }
    }

    const completedCount = stops.filter((s) => s.isCompleted).length;
    route.stopsData = stops;
    route.completedStops = completedCount;
    route.status = completedCount >= stops.length ? 'Completed' : 'In Progress';
    await route.save();

    return sendSuccess(res, route, `Stop #${seq} (${target.name}) marked delivered`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
