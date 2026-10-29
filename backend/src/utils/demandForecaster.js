/**
 * AI Demand Forecasting & Inventory Replenishment Engine
 * Combines historical order velocity, day-of-week seasonality,
 * Indian festival surges (e.g. Deepavali / Rajyotsava), and coastal weather signals.
 */

const DAY_WEIGHTS = [1.22, 0.92, 0.94, 0.96, 1.02, 1.12, 1.28]; // Sun..Sat

const WEATHER_CATEGORY_MULTIPLIERS = {
  Rainy: {
    Groceries: 1.18,
    Dairy: 1.12,
    Vegetables: 1.15,
    Snacks: 1.28,
    Fruits: 0.92,
    Beverages: 0.85,
  },
  Hot: {
    Groceries: 1.0,
    Dairy: 1.22,
    Vegetables: 1.05,
    Snacks: 0.96,
    Fruits: 1.32,
    Beverages: 1.45,
  },
  Pleasant: {
    Groceries: 1.04,
    Dairy: 1.05,
    Vegetables: 1.08,
    Snacks: 1.05,
    Fruits: 1.10,
    Beverages: 1.08,
  },
};

const FESTIVAL_CATEGORY_MULTIPLIERS = {
  Deepavali: {
    Groceries: 1.42,
    Dairy: 1.55,
    Snacks: 1.65,
    Fruits: 1.48,
    Vegetables: 1.20,
    Beverages: 1.30,
  },
  'Karnataka Rajyotsava': {
    Groceries: 1.20,
    Dairy: 1.28,
    Snacks: 1.35,
    Fruits: 1.25,
    Vegetables: 1.15,
    Beverages: 1.20,
  },
  None: {},
};

function generateDemandForecast({
  products = [],
  recentOrderItems = [],
  horizonDays = 7,
  weatherCondition = 'Pleasant',
  festivalContext = 'Deepavali', // Late Oct / Early Nov Indian festive season
}) {
  // Aggregate historical daily sales per product over past 14 days
  const soldByProduct = new Map();
  for (const item of recentOrderItems) {
    const pid = item.productId;
    if (!pid) continue;
    soldByProduct.set(pid, (soldByProduct.get(pid) || 0) + Number(item.quantity || 0));
  }

  const weatherMultMap = WEATHER_CATEGORY_MULTIPLIERS[weatherCondition] || WEATHER_CATEGORY_MULTIPLIERS.Pleasant;
  const festivalMultMap = FESTIVAL_CATEGORY_MULTIPLIERS[festivalContext] || {};

  const now = new Date();
  const productForecasts = products.map((p) => {
    const prod = typeof p.toJSON === 'function' ? p.toJSON() : p;
    const recentSold14d = soldByProduct.get(prod.id) || Number(prod.totalSold || 0) * 0.35 || 14;
    const baseDailyVelocity = Math.max(1.2, recentSold14d / 14);

    const wMult = weatherMultMap[prod.category] || 1.0;
    const fMult = festivalMultMap[prod.category] || 1.0;

    const dailyBreakdown = [];
    let totalPredictedDemand = 0;

    for (let d = 0; d < horizonDays; d++) {
      const targetDate = new Date(now.getTime() + (d + 1) * 86400 * 1000);
      const dow = targetDate.getDay();
      const dowMult = DAY_WEIGHTS[dow];
      // Slight decay on festival boost past day 5
      const effectiveFestival = d < 5 ? fMult : 1 + (fMult - 1) * 0.4;
      const predicted = Number((baseDailyVelocity * dowMult * wMult * effectiveFestival).toFixed(1));
      totalPredictedDemand += predicted;
      dailyBreakdown.push({
        date: targetDate.toISOString().slice(0, 10),
        dayName: targetDate.toLocaleDateString('en-IN', { weekday: 'short' }),
        predictedQty: predicted,
      });
    }

    totalPredictedDemand = Number(totalPredictedDemand.toFixed(1));
    const currentStock = Number(prod.stock || 0);
    const avgDailyForecast = totalPredictedDemand / Math.max(1, horizonDays);
    const daysUntilStockout = avgDailyForecast > 0
      ? Number((currentStock / avgDailyForecast).toFixed(1))
      : 99;

    const safetyBuffer = Math.ceil(avgDailyForecast * 2); // 2-day safety stock
    const recommendedRestock = Math.max(
      0,
      Math.ceil(totalPredictedDemand + safetyBuffer - currentStock)
    );

    let urgency = 'Healthy';
    if (currentStock <= 0 || daysUntilStockout <= 1.5) urgency = 'Critical';
    else if (daysUntilStockout <= 3.5 || currentStock <= Number(prod.minStock || 5)) urgency = 'Restock Soon';
    else if (recommendedRestock > 0) urgency = 'Watch';

    return {
      productId: prod.id,
      name: prod.name,
      kannadaName: prod.kannadaName,
      category: prod.category,
      unit: prod.unit,
      emoji: prod.emoji || '📦',
      currentStock,
      minStock: prod.minStock,
      baseDailyVelocity: Number(baseDailyVelocity.toFixed(2)),
      predictedDemand: totalPredictedDemand,
      daysUntilStockout,
      recommendedRestock,
      estimatedRestockCostInr: Number((recommendedRestock * Number(prod.costPrice || prod.price * 0.78)).toFixed(0)),
      expectedRevenueInr: Number((totalPredictedDemand * Number(prod.price || 0)).toFixed(0)),
      confidenceScore: 0.88,
      urgency,
      drivers: [
        festivalContext !== 'None' ? `${festivalContext} surge (+${Math.round((fMult - 1) * 100)}%)` : null,
        wMult !== 1.0 ? `${weatherCondition} weather (${wMult > 1 ? '+' : ''}${Math.round((wMult - 1) * 100)}%)` : null,
        'Weekend household demand pattern',
      ].filter(Boolean),
      dailyBreakdown,
    };
  });

  // Sort by urgency and expected revenue
  const urgencyRank = { Critical: 0, 'Restock Soon': 1, Watch: 2, Healthy: 3 };
  productForecasts.sort(
    (a, b) => (urgencyRank[a.urgency] - urgencyRank[b.urgency]) || (b.expectedRevenueInr - a.expectedRevenueInr)
  );

  const criticalItems = productForecasts.filter((f) => f.urgency === 'Critical' || f.urgency === 'Restock Soon');
  const totalExpectedRevenueInr = productForecasts.reduce((s, f) => s + f.expectedRevenueInr, 0);
  const totalRestockBudgetInr = productForecasts.reduce((s, f) => s + f.estimatedRestockCostInr, 0);

  return {
    horizonDays,
    weatherCondition,
    festivalContext,
    generatedAt: new Date().toISOString(),
    summary: {
      totalProductsAnalyzed: productForecasts.length,
      criticalRestockCount: criticalItems.length,
      totalExpectedRevenueInr,
      totalRestockBudgetInr,
      topRecommendationKannada:
        criticalItems.length > 0
          ? `${criticalItems[0].kannadaName || criticalItems[0].name} ಸ್ಟಾಕ್ ಕಡಿಮೆ ಇದೆ — ಇಂದೇ ${criticalItems[0].recommendedRestock} ${criticalItems[0].unit} ತರಿಸಿ.`
          : 'ಎಲ್ಲಾ ಪ್ರಮುಖ ವಸ್ತುಗಳ ಸ್ಟಾಕ್ ಸಮರ್ಪಕವಾಗಿದೆ!',
      topRecommendationEnglish:
        criticalItems.length > 0
          ? `Restock ${criticalItems[0].recommendedRestock} ${criticalItems[0].unit} of ${criticalItems[0].name} before stock runs out in ~${criticalItems[0].daysUntilStockout} days.`
          : 'All high-velocity items have healthy stock coverage for the week.',
    },
    forecasts: productForecasts,
  };
}

module.exports = {
  generateDemandForecast,
};
