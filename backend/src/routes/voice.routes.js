const express = require('express');
const router = express.Router();
const { Op } = require('../config/database');
const {
  Product,
  Customer,
  Order,
  Udhaar,
  VoiceCommand,
} = require('../models');
const { parseVoiceCommand } = require('../utils/voiceNlp');
const { createOrderTransaction } = require('./order.routes');
const { generateDemandForecast } = require('../utils/demandForecaster');
const { sendSuccess, sendError } = require('../utils/response');

const SUPPORTED_VOICE_TEMPLATES = [
  {
    intent: 'CREATE_VOICE_ORDER',
    kannada: '2 ಕೆಜಿ ಟೊಮ್ಯಾಟೋ ಬಿಲ್ ಮಾಡಿ',
    english: 'Bill 2 kg Tomatoes',
    description: 'Creates an instant walk-in POS bill & deducts stock',
  },
  {
    intent: 'ADD_STOCK',
    kannada: '15 ಕೆಜಿ ಬಾಸ್ಮತಿ ಅಕ್ಕಿ ಸ್ಟಾಕ್ ಸೇರಿಸಿ',
    english: 'Add 15 kg Basmati Rice stock',
    description: 'Adds new incoming inventory directly to your catalog',
  },
  {
    intent: 'SHOW_SALES',
    kannada: 'ಇಂದಿನ ಮಾರಾಟ ವರದಿ ತೋರಿಸಿ',
    english: "Show today's sales report",
    description: "Speaks today's total sales, profit, and order count",
  },
  {
    intent: 'LOW_STOCK_REPORT',
    kannada: 'ಕಡಿಮೆ ಸ್ಟಾಕ್ ಇರುವ ವಸ್ತುಗಳು ಯಾವುವು?',
    english: 'Which items are low on stock?',
    description: 'Lists items below minimum threshold needing restock',
  },
  {
    intent: 'ADD_UDHAAR',
    kannada: 'ರವಿ ಅವರಿಗೆ 350 ರೂಪಾಯಿ ಉದಾರ್ ಸೇರಿಸಿ',
    english: 'Add 350 rupees udhaar for Ravi',
    description: 'Records credit entry in customer Digital Khata',
  },
  {
    intent: 'SHOW_UDHAAR',
    kannada: 'ಒಟ್ಟು ಉದಾರ್ ಬಾಕಿ ಎಷ್ಟಿದೆ?',
    english: 'How much total udhaar is pending?',
    description: 'Summarizes total customer credit receivable',
  },
  {
    intent: 'DEMAND_FORECAST',
    kannada: 'ದೀಪಾವಳಿ ಬೇಡಿಕೆ ಮುನ್ಸೂಚನೆ ಹೇಳಿ',
    english: 'Predict Deepavali demand forecast',
    description: 'Runs AI demand prediction for top items',
  },
];

router.get('/commands', async (req, res, next) => {
  try {
    const history = await VoiceCommand.findAll({
      where: { vendorId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    return sendSuccess(res, {
      templates: SUPPORTED_VOICE_TEMPLATES,
      history,
    }, 'Voice commands & history fetched');
  } catch (error) {
    next(error);
  }
});

// POST /recognize & /execute (Parses & executes real voice commerce actions!)
async function handleVoiceExecution(req, res, next) {
  try {
    const { transcript, text, execute = true } = req.body;
    const spokenText = String(transcript || text || '').trim();
    if (!spokenText) {
      return sendError(res, 'Voice transcript text is required', 400);
    }

    const [products, customers] = await Promise.all([
      Product.findAll({ where: { vendorId: req.userId, isActive: true } }),
      Customer.findAll({ where: { vendorId: req.userId, isActive: true } }),
    ]);

    const parsed = parseVoiceCommand(spokenText, { products, customers });
    let responseKannada = '';
    let responseEnglish = '';
    let actionResult = null;
    let navigateTo = null;

    if (execute) {
      switch (parsed.intent) {
        case 'SHOW_SALES': {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const todayOrders = await Order.findAll({
            where: {
              vendorId: req.userId,
              status: { [Op.ne]: 'Cancelled' },
              orderDate: { [Op.gte]: startOfToday },
            },
          });
          const rev = Math.round(todayOrders.reduce((s, o) => s + Number(o.total || 0), 0));
          const profit = Math.round(todayOrders.reduce((s, o) => s + Number(o.estimatedProfit || 0), 0));
          responseKannada = `ಇಂದು ಒಟ್ಟು ${todayOrders.length} ಆರ್ಡರ್‌ಗಳಿಂದ ₹${rev} ಮಾರಾಟವಾಗಿದೆ ಮತ್ತು ಅಂದಾಜು ಲಾಭ ₹${profit}.`;
          responseEnglish = `Today you completed ${todayOrders.length} orders with ₹${rev} in revenue and ₹${profit} estimated profit.`;
          actionResult = { todayOrders: todayOrders.length, todayRevenue: rev, todayProfit: profit };
          navigateTo = 'dashboard';
          break;
        }

        case 'CHECK_STOCK': {
          const prod = products.find((p) => p.id === parsed.entities.productId);
          if (prod) {
            responseKannada = `${prod.kannadaName || prod.name} ಸ್ಟಾಕ್‌ನಲ್ಲಿ ${prod.stock} ${prod.unit} ಲಭ್ಯವಿದೆ. ಬೆಲೆ ಪ್ರತಿ ${prod.unit} ಗೆ ₹${prod.price}.`;
            responseEnglish = `${prod.name} has ${prod.stock} ${prod.unit} in stock at ₹${prod.price} per ${prod.unit}.`;
            actionResult = { product: prod };
          } else {
            const totalItems = products.length;
            responseKannada = `ನಿಮ್ಮ ಅಂಗಡಿಯಲ್ಲಿ ಒಟ್ಟು ${totalItems} ಸಕ್ರಿಯ ಉತ್ಪನ್ನಗಳಿವೆ.`;
            responseEnglish = `Your catalog currently has ${totalItems} active products.`;
          }
          navigateTo = 'inventory';
          break;
        }

        case 'LOW_STOCK_REPORT': {
          const low = products.filter((p) => Number(p.stock) <= Number(p.minStock || 5));
          if (low.length === 0) {
            responseKannada = 'ಶುಭ ಸುದ್ದಿ! ಯಾವುದೇ ಉತ್ಪನ್ನದ ಸ್ಟಾಕ್ ಕಡಿಮೆ ಇಲ್ಲ.';
            responseEnglish = 'Great news! No products are currently below minimum stock.';
          } else {
            const namesKn = low.slice(0, 3).map((p) => `${p.kannadaName || p.name} (${p.stock} ${p.unit})`).join(', ');
            const namesEn = low.slice(0, 3).map((p) => `${p.name} (${p.stock} ${p.unit})`).join(', ');
            responseKannada = `${low.length} ವಸ್ತುಗಳ ಸ್ಟಾಕ್ ಕಡಿಮೆ ಇದೆ: ${namesKn}. ತಕ್ಷಣ ತರಿಸಿ.`;
            responseEnglish = `${low.length} items are low on stock: ${namesEn}.`;
          }
          actionResult = { lowStockCount: low.length, items: low.slice(0, 5) };
          navigateTo = 'inventory';
          break;
        }

        case 'ADD_STOCK': {
          const prod = products.find((p) => p.id === parsed.entities.productId);
          const qty = Number(parsed.entities.quantity || 5);
          if (prod) {
            prod.stock = Number((Number(prod.stock) + qty).toFixed(2));
            await prod.save();
            responseKannada = `${prod.kannadaName || prod.name} ಸ್ಟಾಕ್‌ಗೆ ${qty} ${prod.unit} ಸೇರಿಸಲಾಗಿದೆ. ಹೊಸ ಸ್ಟಾಕ್: ${prod.stock} ${prod.unit}.`;
            responseEnglish = `Added ${qty} ${prod.unit} to ${prod.name}. Updated stock is ${prod.stock} ${prod.unit}.`;
            actionResult = { updatedProduct: prod, addedQty: qty };
            navigateTo = 'inventory';
          } else {
            responseKannada = 'ಕ್ಷಮಿಸಿ, ಆ ಉತ್ಪನ್ನ ಕ್ಯಾಟಲಾಗ್‌ನಲ್ಲಿ ಕಂಡುಬಂದಿಲ್ಲ.';
            responseEnglish = 'Could not match that product in your inventory catalog.';
          }
          break;
        }

        case 'CREATE_VOICE_ORDER': {
          const prod = products.find((p) => p.id === parsed.entities.productId);
          const qty = Number(parsed.entities.quantity || 1);
          if (prod && Number(prod.stock) >= qty) {
            const io = req.app.get('io');
            const order = await createOrderTransaction({
              vendorId: req.userId,
              customerId: parsed.entities.customerId,
              customerName: parsed.entities.customerName || 'Voice Walk-in Customer',
              items: [{ productId: prod.id, quantity: qty, unitPrice: prod.price }],
              type: 'Walk-in',
              source: 'voice',
              paymentMethod: 'Cash',
              io,
            });
            responseKannada = `ಬಿಲ್ ಸಿದ್ಧವಾಗಿದೆ! ${qty} ${prod.unit} ${prod.kannadaName || prod.name} — ಒಟ್ಟು ಮೊತ್ತ ₹${order.total} (${order.orderNumber}).`;
            responseEnglish = `Voice bill created! ${qty} ${prod.unit} ${prod.name} — Total ₹${order.total} (${order.orderNumber}).`;
            actionResult = { order };
            navigateTo = 'orders';
          } else if (prod) {
            responseKannada = `${prod.kannadaName || prod.name} ಸ್ಟಾಕ್ ಸಾಕಾಗುತ್ತಿಲ್ಲ (ಲಭ್ಯ: ${prod.stock} ${prod.unit}).`;
            responseEnglish = `Insufficient stock for ${prod.name} (Available: ${prod.stock} ${prod.unit}).`;
          } else {
            responseKannada = 'ಬಿಲ್ ಮಾಡಲು ಉತ್ಪನ್ನದ ಹೆಸರು ಮತ್ತು ಪ್ರಮಾಣ ಹೇಳಿ.';
            responseEnglish = 'Please mention the product name and quantity to generate a bill.';
          }
          break;
        }

        case 'ADD_UDHAAR': {
          const amt = Number(parsed.entities.amount || 100);
          const cust = customers.find((c) => c.id === parsed.entities.customerId) || customers[0];
          const cName = parsed.entities.customerName || cust?.name || 'Customer';
          const cPhone = cust?.phone || '9000000099';

          const udhaar = await Udhaar.create({
            udhaarNumber: `UDH-${Date.now().toString().slice(-6)}`,
            vendorId: req.userId,
            customerId: cust?.id || null,
            customerName: cName,
            customerPhone: cPhone,
            totalAmount: amt,
            paidAmount: 0,
            remainingAmount: amt,
            dueDate: new Date(Date.now() + 14 * 86400 * 1000),
            description: `Recorded via Voice Assistant ("${spokenText}")`,
          });

          if (cust) {
            cust.udhaarBalance = Number((Number(cust.udhaarBalance || 0) + amt).toFixed(2));
            await cust.save();
          }

          responseKannada = `${cName} ಅವರ ಖಾತಾದಲ್ಲಿ ₹${amt} ಉದಾರ್ ನಮೂದಿಸಲಾಗಿದೆ.`;
          responseEnglish = `Recorded ₹${amt} Udhaar credit in ${cName}'s digital khata.`;
          actionResult = { udhaar };
          navigateTo = 'udhaar';
          break;
        }

        case 'SHOW_UDHAAR': {
          const udhaars = await Udhaar.findAll({ where: { vendorId: req.userId } });
          const pending = Math.round(udhaars.reduce((s, u) => s + Number(u.remainingAmount || 0), 0));
          const activeCount = udhaars.filter((u) => Number(u.remainingAmount) > 0).length;
          responseKannada = `${activeCount} ಗ್ರಾಹಕರಿಂದ ಒಟ್ಟು ₹${pending} ಉದಾರ್ ಬರಬೇಕಾಗಿದೆ.`;
          responseEnglish = `You have ₹${pending} in pending Udhaar receivable across ${activeCount} credit entries.`;
          actionResult = { pendingUdhaarInr: pending, activeEntries: activeCount };
          navigateTo = 'udhaar';
          break;
        }

        case 'OPTIMIZE_ROUTE': {
          responseKannada = 'ಡೆಲಿವರಿ ಮಾರ್ಗ ಆಪ್ಟಿಮೈಸರ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ. ಕಡಿಮೆ ಇಂಧನ ವೆಚ್ಚದ ದಾರಿ ಸಿದ್ಧವಾಗಿದೆ!';
          responseEnglish = 'Opening Intelligent Route Optimizer with 2-Opt shortest delivery sequence.';
          navigateTo = 'routes';
          break;
        }

        case 'DEMAND_FORECAST': {
          const forecast = generateDemandForecast({ products, horizonDays: 7 });
          responseKannada = forecast.summary.topRecommendationKannada;
          responseEnglish = forecast.summary.topRecommendationEnglish;
          actionResult = { summary: forecast.summary };
          navigateTo = 'ai';
          break;
        }

        default: {
          responseKannada = 'ನಮಸ್ಕಾರ! ನೀವು ಮಾರಾಟ ವರದಿ, ಬಿಲ್ ರಚನೆ, ಸ್ಟಾಕ್ ಸೇರ್ಪಡೆ ಅಥವಾ ಉದಾರ್ ಖಾತಾ ಬಗ್ಗೆ ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಹೇಳಬಹುದು.';
          responseEnglish = 'Namaskara! Ask me to bill items, add stock, check today’s sales, record Udhaar, or optimize your delivery route.';
        }
      }
    }

    const saved = await VoiceCommand.create({
      vendorId: req.userId,
      transcript: spokenText,
      language: parsed.language,
      intent: parsed.intent,
      confidence: parsed.confidence,
      entities: parsed.entities,
      responseText: responseEnglish,
      responseKannada,
      executedAction: actionResult || {},
    });

    return sendSuccess(res, {
      id: saved.id,
      ...parsed,
      responseKannada,
      responseEnglish,
      actionResult,
      navigateTo,
    }, 'Voice command processed');
  } catch (error) {
    next(error);
  }
}

router.post('/recognize', handleVoiceExecution);
router.post('/execute', handleVoiceExecution);

module.exports = router;
