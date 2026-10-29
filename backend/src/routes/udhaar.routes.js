const express = require('express');
const router = express.Router();
const { Udhaar, Customer, Payment, Order } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

router.get('/', async (req, res, next) => {
  try {
    const where = { vendorId: req.userId };
    if (req.query.status && req.query.status !== 'All') {
      where.status = req.query.status;
    }
    const udhaars = await Udhaar.findAll({
      where,
      order: [['updatedAt', 'DESC']],
    });
    return sendSuccess(res, udhaars, 'Udhaar khata entries fetched');
  } catch (error) {
    next(error);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    const udhaars = await Udhaar.findAll({ where: { vendorId: req.userId } });
    let totalCreditGiven = 0;
    let totalRecovered = 0;
    let totalReceivable = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    for (const u of udhaars) {
      totalCreditGiven += Number(u.totalAmount || 0);
      totalRecovered += Number(u.paidAmount || 0);
      totalReceivable += Number(u.remainingAmount || 0);
      const isOverdue = u.remainingAmount > 0 && u.dueDate && new Date(u.dueDate) < new Date();
      if (isOverdue || u.status === 'Overdue') {
        overdueCount += 1;
        overdueAmount += Number(u.remainingAmount || 0);
      }
    }

    return sendSuccess(res, {
      totalEntries: udhaars.length,
      totalCreditGiven: Number(totalCreditGiven.toFixed(2)),
      totalRecovered: Number(totalRecovered.toFixed(2)),
      totalReceivable: Number(totalReceivable.toFixed(2)),
      overdueCount,
      overdueAmount: Number(overdueAmount.toFixed(2)),
    }, 'Udhaar summary fetched');
  } catch (error) {
    next(error);
  }
});

router.get('/overdue', async (req, res, next) => {
  try {
    const udhaars = await Udhaar.findAll({ where: { vendorId: req.userId } });
    const overdue = udhaars.filter(
      (u) => u.remainingAmount > 0 && ((u.dueDate && new Date(u.dueDate) < new Date()) || u.status === 'Overdue')
    );
    return sendSuccess(res, overdue, 'Overdue udhaar entries fetched');
  } catch (error) {
    next(error);
  }
});

// POST / (Create new Udhaar / Credit entry)
router.post('/', async (req, res, next) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      amount,
      totalAmount,
      dueDays = 14,
      dueDate,
      description = 'Store credit purchase',
    } = req.body;

    const creditVal = Number(totalAmount ?? amount);
    if (!creditVal || creditVal <= 0) {
      return sendError(res, 'Valid credit amount is required', 400);
    }

    let customer = null;
    if (customerId) {
      customer = await Customer.findOne({ where: { id: customerId, vendorId: req.userId } });
    } else if (customerPhone) {
      const cleanPhone = String(customerPhone).replace(/\D/g, '').slice(-10);
      customer = await Customer.findOne({ where: { phone: cleanPhone, vendorId: req.userId } });
      if (!customer && customerName && cleanPhone.length === 10) {
        customer = await Customer.create({
          vendorId: req.userId,
          name: customerName,
          phone: cleanPhone,
        });
      }
    }

    const resolvedName = customer?.name || customerName;
    const resolvedPhone = customer?.phone || String(customerPhone || '9000000000').replace(/\D/g, '').slice(-10);
    if (!resolvedName) {
      return sendError(res, 'Customer name is required', 400);
    }

    const computedDue = dueDate
      ? new Date(dueDate)
      : new Date(Date.now() + Number(dueDays) * 86400 * 1000);

    const udhaar = await Udhaar.create({
      udhaarNumber: `UDH-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 89)}`,
      vendorId: req.userId,
      customerId: customer?.id || null,
      customerName: resolvedName,
      customerPhone: resolvedPhone || '9000000000',
      totalAmount: creditVal,
      paidAmount: 0,
      remainingAmount: creditVal,
      dueDate: computedDue,
      description,
      repaymentHistory: [],
    });

    if (customer) {
      customer.udhaarBalance = Number((Number(customer.udhaarBalance || 0) + creditVal).toFixed(2));
      await customer.save();
    }

    return sendSuccess(res, udhaar, 'Udhaar recorded in digital khata', 201);
  } catch (error) {
    next(error);
  }
});

// POST /:id/payment (Record partial or full repayment)
router.post('/:id/payment', async (req, res, next) => {
  try {
    const udhaar = await Udhaar.findOne({
      where: { id: req.params.id, vendorId: req.userId },
    });
    if (!udhaar) return sendError(res, 'Udhaar entry not found', 404);

    const payAmt = Number(req.body.amount);
    const paymentMethod = req.body.paymentMethod || 'UPI';
    const note = req.body.note || 'Udhaar repayment';

    if (!payAmt || payAmt <= 0) {
      return sendError(res, 'Valid repayment amount required', 400);
    }

    const applied = Math.min(Number(udhaar.remainingAmount), payAmt);
    udhaar.paidAmount = Number((Number(udhaar.paidAmount || 0) + applied).toFixed(2));
    const history = Array.isArray(udhaar.repaymentHistory) ? [...udhaar.repaymentHistory] : [];
    history.unshift({
      date: new Date().toISOString(),
      amount: applied,
      paymentMethod,
      note,
    });
    udhaar.repaymentHistory = history;
    await udhaar.save();

    if (udhaar.customerId) {
      const customer = await Customer.findByPk(udhaar.customerId);
      if (customer) {
        customer.udhaarBalance = Math.max(
          0,
          Number((Number(customer.udhaarBalance || 0) - applied).toFixed(2))
        );
        await customer.save();
      }
    }

    if (udhaar.orderId) {
      const order = await Order.findByPk(udhaar.orderId);
      if (order) {
        order.paidAmount = Number((Number(order.paidAmount || 0) + applied).toFixed(2));
        order.dueAmount = Math.max(0, Number((Number(order.total) - order.paidAmount).toFixed(2)));
        order.paymentStatus = order.dueAmount <= 0.01 ? 'Paid' : 'Partial';
        await order.save();
      }
    }

    await Payment.create({
      paymentNumber: `PAY-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 89)}`,
      vendorId: req.userId,
      udhaarId: udhaar.id,
      orderId: udhaar.orderId,
      customerId: udhaar.customerId,
      customerName: udhaar.customerName,
      amount: applied,
      paymentMethod,
      paymentGateway: paymentMethod === 'UPI' ? 'UPI QR / Intent' : paymentMethod,
      status: 'Completed',
      notes: `Udhaar recovery (${udhaar.udhaarNumber})`,
    });

    return sendSuccess(res, udhaar, `Recorded ₹${applied} repayment`);
  } catch (error) {
    next(error);
  }
});

// GET /:id/reminder (Generate WhatsApp & SMS bilingual reminder)
router.get('/:id/reminder', async (req, res, next) => {
  try {
    const udhaar = await Udhaar.findOne({
      where: { id: req.params.id, vendorId: req.userId },
    });
    if (!udhaar) return sendError(res, 'Udhaar entry not found', 404);

    const shopName = req.user.shopName || req.user.name;
    const upi = req.user.upiId || `${req.user.phone}@upi`;
    const kannadaMsg = `ನಮಸ್ಕಾರ ${udhaar.customerName} ಅವರೇ, ${shopName} ಅಂಗಡಿಯಲ್ಲಿ ನಿಮ್ಮ ಬಾಕಿ ಮೊತ್ತ ₹${udhaar.remainingAmount} ಇದೆ (${udhaar.udhaarNumber}). ದಯವಿಟ್ಟು UPI (${upi}) ಮೂಲಕ ಪಾವತಿಸಿ. ಧನ್ಯವಾದಗಳು! 🙏`;
    const englishMsg = `Hello ${udhaar.customerName}, friendly reminder from ${shopName}: your pending khata balance is ₹${udhaar.remainingAmount} (Ref: ${udhaar.udhaarNumber}). You can pay easily via UPI: ${upi}. Thank you!`;

    const fullText = `${kannadaMsg}\n\n${englishMsg}`;
    const phoneDigits = String(udhaar.customerPhone || '').replace(/\D/g, '').slice(-10);
    const whatsappUrl = `https://wa.me/91${phoneDigits}?text=${encodeURIComponent(fullText)}`;

    return sendSuccess(res, {
      udhaarId: udhaar.id,
      customerName: udhaar.customerName,
      customerPhone: phoneDigits,
      kannadaMessage: kannadaMsg,
      englishMessage: englishMsg,
      whatsappUrl,
    }, 'Payment reminder generated');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
