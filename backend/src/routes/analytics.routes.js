const express = require('express');
const router = express.Router();
const { Op } = require('../config/database');
const config = require('../config/config');
const { Product, Order, OrderItem, Customer, Udhaar, Route } = require('../models');
const { generateDemandForecast } = require('../utils/demandForecaster');
const { sendSuccess } = require('../utils/response');

router.get('/dashboard', async (req, res, next) => {
  try {
    const vendorId = req.userId;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400 * 1000);

    const [products, orders, customers, udhaars, routes] = await Promise.all([
      Product.findAll({ where: { vendorId, isActive: true } }),
      Order.findAll({
        where: {
          vendorId,
          status: { [Op.ne]: 'Cancelled' },
          orderDate: { [Op.gte]: fourteenDaysAgo },
        },
        include: [{ model: OrderItem, as: 'items' }],
        order: [['orderDate', 'ASC']],
      }),
      Customer.findAll({ where: { vendorId, isActive: true } }),
      Udhaar.findAll({ where: { vendorId } }),
      Route.findAll({ where: { vendorId }, order: [['createdAt', 'DESC']], limit: 5 }),
    ]);

    const todayOrders = orders.filter((o) => new Date(o.orderDate) >= startOfToday);
    const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const todayProfit = todayOrders.reduce((s, o) => s + Number(o.estimatedProfit || 0), 0);
    const activeOrdersCount = orders.filter((o) =>
      ['Pending', 'Accepted', 'Prepared', 'On the Way'].includes(o.status)
    ).length;

    const lowStockProducts = products.filter((p) => Number(p.stock) <= Number(p.minStock || 5));
    const totalInventoryValue = products.reduce(
      (s, p) => s + Number(p.stock || 0) * Number(p.price || 0),
      0
    );

    const totalUdhaarReceivable = udhaars.reduce((s, u) => s + Number(u.remainingAmount || 0), 0);
    const overdueUdhaarCount = udhaars.filter(
      (u) => u.remainingAmount > 0 && ((u.dueDate && new Date(u.dueDate) < now) || u.status === 'Overdue')
    ).length;

    // Build 7-day daily sales & profit series
    const dailyMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, {
        date: key,
        label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        revenue: 0,
        profit: 0,
        orders: 0,
      });
    }

    const categoryRevenueMap = {};
    const productCategoryLookup = new Map(products.map((p) => [p.id, p.category]));

    for (const order of orders) {
      const key = new Date(order.orderDate).toISOString().slice(0, 10);
      if (dailyMap.has(key)) {
        const bucket = dailyMap.get(key);
        bucket.revenue = Number((bucket.revenue + Number(order.total || 0)).toFixed(0));
        bucket.profit = Number((bucket.profit + Number(order.estimatedProfit || 0)).toFixed(0));
        bucket.orders += 1;
      }
      for (const item of order.items || []) {
        const cat = productCategoryLookup.get(item.productId) || 'Groceries';
        categoryRevenueMap[cat] = Number(
          ((categoryRevenueMap[cat] || 0) + Number(item.totalPrice || 0)).toFixed(0)
        );
      }
    }

    const categoryBreakdown = Object.entries(categoryRevenueMap)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    const topProducts = [...products]
      .sort((a, b) => Number(b.totalRevenue || 0) - Number(a.totalRevenue || 0))
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        name: p.name,
        kannadaName: p.kannadaName,
        emoji: p.emoji,
        unit: p.unit,
        stock: p.stock,
        totalSold: p.totalSold,
        totalRevenue: Number(Number(p.totalRevenue || 0).toFixed(0)),
      }));

    const fourteenDayRevenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    const totalFuelSavedInr = routes.reduce((s, r) => s + Number(r.fuelSavedInr || 0), 0);
    const totalKmSaved = routes.reduce((s, r) => s + Number(r.distanceSavedKm || 0), 0);

    return sendSuccess(res, {
      kpis: {
        todayRevenue: Number(todayRevenue.toFixed(0)),
        todayProfit: Number(todayProfit.toFixed(0)),
        todayOrdersCount: todayOrders.length,
        fourteenDayRevenue: Number(fourteenDayRevenue.toFixed(0)),
        activeOrdersCount,
        totalProducts: products.length,
        lowStockCount: lowStockProducts.length,
        totalInventoryValue: Number(totalInventoryValue.toFixed(0)),
        totalCustomers: customers.length,
        totalUdhaarReceivable: Number(totalUdhaarReceivable.toFixed(0)),
        overdueUdhaarCount,
        totalFuelSavedInr: Number(totalFuelSavedInr.toFixed(0)),
        totalKmSaved: Number(totalKmSaved.toFixed(1)),
      },
      salesTrend: Array.from(dailyMap.values()),
      categoryBreakdown,
      topProducts,
      lowStockAlerts: lowStockProducts.slice(0, 6),
      recentRoutes: routes,
    }, 'Dashboard analytics computed');
  } catch (error) {
    next(error);
  }
});

router.get('/demand', async (req, res, next) => {
  try {
    const horizonDays = Math.min(14, Math.max(3, parseInt(req.query.days, 10) || 7));
    const weatherCondition = req.query.weather || 'Pleasant';
    const festivalContext = req.query.festival || 'Deepavali';

    const products = await Product.findAll({
      where: { vendorId: req.userId, isActive: true },
    });

    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400 * 1000);
    const recentOrders = await Order.findAll({
      where: {
        vendorId: req.userId,
        status: { [Op.ne]: 'Cancelled' },
        orderDate: { [Op.gte]: fourteenDaysAgo },
      },
      include: [{ model: OrderItem, as: 'items' }],
    });
    const recentOrderItems = recentOrders.flatMap((o) => o.items || []);

    // Try Python FastAPI ML service first; gracefully fallback to local engine
    let forecastData = null;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const resp = await fetch(`${config.ai.baseUrl}/forecast/demand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: products.map((p) => p.toJSON()),
          recentOrderItems: recentOrderItems.map((i) => i.toJSON()),
          horizonDays,
          weatherCondition,
          festivalContext,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (resp.ok) {
        const json = await resp.json();
        if (json?.data) forecastData = { ...json.data, engine: 'Python scikit-learn Forecast Service' };
      }
    } catch (_) {
      // use local fallback
    }

    if (!forecastData) {
      forecastData = {
        ...generateDemandForecast({
          products,
          recentOrderItems,
          horizonDays,
          weatherCondition,
          festivalContext,
        }),
        engine: 'VendorSaathi Statistical Forecast Engine',
      };
    }

    return sendSuccess(res, forecastData, 'AI demand forecast generated');
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  req.url = '/dashboard';
  return router.handle(req, res, next);
});

module.exports = router;
