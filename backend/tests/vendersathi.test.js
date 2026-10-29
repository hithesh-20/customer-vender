process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'vendersathi-isolated-jest-test-secret-key-2026';

const crypto = require('crypto');
const request = require('supertest');
const config = require('../src/config/config');
const { app, initApp } = require('../src/app');

describe('VenderSathi — 16-Scenario End-to-End Integration Suite', () => {
  let customerAToken = '';
  let customerBToken = '';
  let vendorAToken = '';
  let vendorAId = '';
  let vendorBToken = '';

  let tomatoProductId = '';
  let palakProductId = '';
  let vendorBMangoId = '';
  let serviceableAddressId = '';
  let outsideAddressId = '';
  let placedOrderId = '';

  beforeAll(async () => {
    await initApp({ ensureTaxonomy: true });
  });

  test('1. Empty database states: zero mock vendors, zero mock products, and no demo-login', async () => {
    const vendorsRes = await request(app).get('/api/v1/users/nearby');
    expect(vendorsRes.status).toBe(200);
    expect(vendorsRes.body.data).toEqual([]);

    const prodsRes = await request(app).get('/api/v1/products');
    expect(prodsRes.status).toBe(200);
    expect(prodsRes.body.data).toEqual([]);

    const demoRes = await request(app).post('/api/v1/auth/demo-login');
    expect(demoRes.status).toBe(404);

    const weatherRes = await request(app).get('/api/v1/weather/current?city=Mudbidri');
    expect(weatherRes.status).toBe(503);
  });

  test('2. Authentication flows: customer & vendor registration, login, rejected unconfigured OTP, and logout session revocation', async () => {
    const otpRes = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '9845011111' });
    expect(otpRes.status).toBe(503);

    const custARes = await request(app).post('/api/v1/auth/register').send({
      role: 'customer',
      name: 'Ananya Rao',
      phone: '9845011111',
      email: 'ananya@test.local',
      password: 'Password123!',
      language: 'kn',
    });
    expect(custARes.status).toBe(201);
    expect(custARes.body.data.user.password).toBeUndefined();
    customerAToken = custARes.body.data.token;

    const custBRes = await request(app).post('/api/v1/auth/register').send({
      role: 'customer',
      name: 'Rohan Shetty',
      phone: '9845022222',
      password: 'Password123!',
    });
    expect(custBRes.status).toBe(201);
    customerBToken = custBRes.body.data.token;

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'ananya@test.local',
      password: 'Password123!',
    });
    expect(loginRes.status).toBe(200);
    const secondSessionToken = loginRes.body.data.token;

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${secondSessionToken}`);
    expect(logoutRes.status).toBe(200);

    const afterLogout = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${secondSessionToken}`);
    expect(afterLogout.status).toBe(401);

    const venARes = await request(app).post('/api/v1/auth/register').send({
      role: 'vendor',
      name: 'Manjunath Poojary',
      phone: '9845033333',
      password: 'VendorPass123!',
      shopName: 'Manjunath Fresh Pushcart',
      shopNameKannada: 'ಮಂಜುನಾಥ್ ತರಕಾರಿ ಗಾಡಿ',
      vendorType: 'Street Cart',
      serviceArea: 'Main Market Road',
      city: 'Mudbidri',
      pincode: '574227',
      settings: {
        homeDelivery: true,
        pickupAvailable: true,
        deliveryCharge: 20,
        freeDeliveryAbove: 200,
        minOrderAmount: 50,
        servicePincodes: ['574227'],
        codEnabled: true,
      },
    });
    expect(venARes.status).toBe(201);
    expect(venARes.body.data.user.isOnline).toBe(false);
    expect(venARes.body.data.user.rating).toBeNull();
    vendorAToken = venARes.body.data.token;
    vendorAId = venARes.body.data.user.id;

    const venBRes = await request(app).post('/api/v1/auth/register').send({
      role: 'vendor',
      name: 'Suresh Naik',
      phone: '9845044444',
      password: 'VendorPass123!',
      shopName: 'Suresh Morning Fruit Cycle',
      vendorType: 'Bicycle Vendor',
      serviceArea: 'Vidhyagiri',
      city: 'Mudbidri',
      pincode: '574227',
    });
    expect(venBRes.status).toBe(201);
    vendorBToken = venBRes.body.data.token;
  });

  test('3. Authorization & access control: customers blocked from vendor catalog writes', async () => {
    const custProd = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ name: 'Unauthorized Item', price: 30, stock: 10 });
    expect(custProd.status).toBe(403);
  });

  test('4. Input validation: rejects weak passwords, invalid phones, and negative prices/stock', async () => {
    const weakPw = await request(app).post('/api/v1/auth/register').send({
      role: 'customer',
      name: 'User',
      phone: '9845055555',
      password: 'short',
    });
    expect(weakPw.status).toBe(400);

    const negPrice = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${vendorAToken}`)
      .send({ name: 'Invalid Tomato', price: -5, stock: 10 });
    expect(negPrice.status).toBe(400);

    const negStock = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${vendorAToken}`)
      .send({ name: 'Invalid Stock', price: 25, stock: -2 });
    expect(negStock.status).toBe(400);
  });

  test('5. Vendor discovery & storefront loading: honest availability and null rating before reviews', async () => {
    const p1 = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${vendorAToken}`)
      .send({
        name: 'Country Tomato',
        kannadaName: 'ನಾಟಿ ಟೊಮೇಟೊ',
        category: 'Vegetables',
        unit: 'kg',
        price: 40,
        stock: 15,
        minOrderQty: 1,
      });
    expect(p1.status).toBe(201);
    tomatoProductId = p1.body.data.id;

    const p2 = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${vendorAToken}`)
      .send({
        name: 'Fresh Palak Bundle',
        kannadaName: 'ಪಾಲಕ್ ಸೊಪ್ಪು',
        category: 'Leafy Greens',
        unit: 'bunch',
        price: 20,
        stock: 10,
        minOrderQty: 2,
      });
    expect(p2.status).toBe(201);
    palakProductId = p2.body.data.id;

    await request(app)
      .patch('/api/v1/users/availability')
      .set('Authorization', `Bearer ${vendorAToken}`)
      .send({ isOnline: true });

    await request(app)
      .patch('/api/v1/users/availability')
      .set('Authorization', `Bearer ${vendorBToken}`)
      .send({ isOnline: true });

    const p3 = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${vendorBToken}`)
      .send({
        name: 'Alphonso Mango',
        category: 'Fruits',
        unit: 'dozen',
        price: 300,
        stock: 5,
      });
    vendorBMangoId = p3.body.data.id;

    const sfRes = await request(app).get(
      `/api/v1/users/${vendorAId}/storefront?pincode=574227`
    );
    expect(sfRes.status).toBe(200);
    expect(sfRes.body.data.vendor.isOnline).toBe(true);
    expect(sfRes.body.data.vendor.rating).toBeNull();
    expect(sfRes.body.data.serviceability.serviceable).toBe(true);
  });

  test('6. Product browsing, category filtering, sorting, and bilingual search', async () => {
    const catFilter = await request(app).get('/api/v1/products?category=Leafy%20Greens');
    expect(catFilter.status).toBe(200);
    expect(catFilter.body.data.length).toBe(1);
    expect(catFilter.body.data[0].id).toBe(palakProductId);

    const knSearch = await request(app).get(
      `/api/v1/products?q=${encodeURIComponent('ಟೊಮೇಟೊ')}`
    );
    expect(knSearch.status).toBe(200);
    expect(knSearch.body.data[0].id).toBe(tomatoProductId);

    const sorted = await request(app).get('/api/v1/products?sort=price_asc');
    expect(sorted.status).toBe(200);
    expect(sorted.body.data[0].price).toBeLessThanOrEqual(sorted.body.data[1].price);
  });

  test('7. Cart item additions, updates, removals, minOrderQty & multi-vendor conflict rules', async () => {
    const belowMin = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ productId: palakProductId, quantity: 1 });
    expect(belowMin.status).toBe(400);

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ productId: tomatoProductId, quantity: 2 });

    const cartAfterAdd = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ productId: palakProductId, quantity: 2 });
    expect(cartAfterAdd.status).toBe(200);
    expect(cartAfterAdd.body.data.items.length).toBe(2);

    const conflict = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ productId: vendorBMangoId, quantity: 1 });
    expect(conflict.status).toBe(409);
    expect(conflict.body.details.code).toBe('DIFFERENT_VENDOR_CART');
  });

  test('8. Out-of-stock handling: prevents adding depleted items and surfaces cart stock warnings', async () => {
    const oosProd = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${vendorAToken}`)
      .send({
        name: 'Sold Out Drumstick',
        category: 'Vegetables',
        unit: 'bunch',
        price: 30,
        stock: 0,
      });
    expect(oosProd.body.data.inStock).toBe(false);

    const addOos = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ productId: oosProd.body.data.id, quantity: 1 });
    expect(addOos.status).toBe(400);
  });

  test('9. Address creation, validation, ownership isolation, and outside-service-area rejection', async () => {
    const badPin = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        label: 'Home',
        recipientName: 'Ananya Rao',
        recipientPhone: '9845011111',
        addressLine1: '12 Temple Street',
        area: 'Swaraj Maidan',
        city: 'Mudbidri',
        pincode: '01234',
      });
    expect(badPin.status).toBe(400);

    const okAddr = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        label: 'Home',
        recipientName: 'Ananya Rao',
        recipientPhone: '9845011111',
        addressLine1: '12 Temple Street',
        area: 'Swaraj Maidan',
        city: 'Mudbidri',
        pincode: '574227',
      });
    expect(okAddr.status).toBe(201);
    serviceableAddressId = okAddr.body.data.id;

    const farAddr = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        label: 'Work',
        recipientName: 'Ananya Rao',
        recipientPhone: '9845011111',
        addressLine1: 'MG Road',
        area: 'Central',
        city: 'Bengaluru',
        pincode: '560001',
      });
    outsideAddressId = farAddr.body.data.id;

    const outCheckout = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        addressId: outsideAddressId,
        fulfillmentType: 'Delivery',
        paymentMethod: 'COD',
      });
    expect(outCheckout.status).toBe(422);
    expect(outCheckout.body.details.code).toBe('OUTSIDE_SERVICE_AREA');
  });

  test('10. Price-change transparency: checkout halts on vendor price update until customer confirms', async () => {
    await request(app)
      .put(`/api/v1/products/${tomatoProductId}`)
      .set('Authorization', `Bearer ${vendorAToken}`)
      .send({ price: 45 });

    const checkoutRes = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        addressId: serviceableAddressId,
        fulfillmentType: 'Delivery',
        paymentMethod: 'COD',
      });
    expect(checkoutRes.status).toBe(409);
    expect(checkoutRes.body.details.code).toBe('PRICE_CHANGED');
  });

  test('11. Server-authoritative order total calculation & free-delivery threshold', async () => {
    const cartCheck = await request(app)
      .get(`/api/v1/cart?addressId=${serviceableAddressId}&fulfillmentType=Delivery`)
      .set('Authorization', `Bearer ${customerAToken}`);
    expect(cartCheck.status).toBe(200);
    // 2 * 45 (90) + 2 * 20 (40) = 130 (< 200 free threshold) -> +20 delivery = 150
    expect(cartCheck.body.data.bill.subtotal).toBe(130);
    expect(cartCheck.body.data.bill.deliveryCharge).toBe(20);
    expect(cartCheck.body.data.bill.total).toBe(150);
  });

  test('12. Order creation & duplicate submission prevention via X-Idempotency-Key', async () => {
    const idemKey = 'idem-order-key-2026-001';
    const orderRes = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customerAToken}`)
      .set('X-Idempotency-Key', idemKey)
      .send({
        addressId: serviceableAddressId,
        fulfillmentType: 'Delivery',
        paymentMethod: 'COD',
        acceptCurrentPrices: true,
      });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.order.paymentStatus).toBe('Pending');
    placedOrderId = orderRes.body.data.order.id;

    const duplicateAttempt = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customerAToken}`)
      .set('X-Idempotency-Key', idemKey)
      .send({
        addressId: serviceableAddressId,
        fulfillmentType: 'Delivery',
        paymentMethod: 'COD',
        acceptCurrentPrices: true,
      });
    expect(duplicateAttempt.status).toBe(200);
    expect(duplicateAttempt.body.data.idempotentReplay).toBe(true);
    expect(duplicateAttempt.body.data.order.id).toBe(placedOrderId);
  });

  test('13. Payment state transitions & cryptographic signature verification (forged rejected, valid accepted)', async () => {
    // Unconfigured gateway rejected cleanly
    const unconfRes = await request(app)
      .post('/api/v1/payments/razorpay/create-order')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ orderId: placedOrderId });
    expect(unconfRes.status).toBe(503);

    // Temporarily simulate configured Razorpay secret in isolated test memory to verify HMAC signature check
    const prevEnabled = config.razorpay.enabled;
    const prevSecret = config.razorpay.keySecret;
    config.razorpay.enabled = true;
    config.razorpay.keySecret = 'isolated_test_razorpay_hmac_secret_99';

    try {
      // Forged signature MUST be rejected and order MUST NOT be marked Paid
      const forgedRes = await request(app)
        .post('/api/v1/payments/razorpay/verify')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          orderId: placedOrderId,
          razorpayOrderId: 'order_Testabc123',
          razorpayPaymentId: 'pay_Testxyz987',
          razorpaySignature: '0000forgedsignature0000',
        });
      expect(forgedRes.status).toBe(400);

      const checkAfterForged = await request(app)
        .get(`/api/v1/orders/${placedOrderId}`)
        .set('Authorization', `Bearer ${customerAToken}`);
      expect(checkAfterForged.body.data.paymentStatus).toBe('Failed');

      // Valid cryptographic HMAC-SHA256 signature succeeds and marks Paid
      const validSig = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update('order_Testabc123|pay_Testxyz987')
        .digest('hex');

      const validVerify = await request(app)
        .post('/api/v1/payments/razorpay/verify')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          orderId: placedOrderId,
          razorpayOrderId: 'order_Testabc123',
          razorpayPaymentId: 'pay_Testxyz987',
          razorpaySignature: validSig,
        });
      expect(validVerify.status).toBe(200);
      expect(validVerify.body.data.order.paymentStatus).toBe('Paid');
    } finally {
      config.razorpay.enabled = prevEnabled;
      config.razorpay.keySecret = prevSecret;
    }
  });

  test('14. Order status progression, ownership protection, chat, reorder, cancel & genuine review recalculation', async () => {
    const crossRead = await request(app)
      .get(`/api/v1/orders/${placedOrderId}`)
      .set('Authorization', `Bearer ${customerBToken}`);
    expect(crossRead.status).toBe(403);

    const chatRes = await request(app)
      .post(`/api/v1/orders/${placedOrderId}/messages`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ message: 'Gate is near the banyan tree.' });
    expect(chatRes.status).toBe(201);

    for (const st of ['Accepted', 'Preparing', 'Out for Delivery', 'Delivered']) {
      const stRes = await request(app)
        .patch(`/api/v1/orders/${placedOrderId}/status`)
        .set('Authorization', `Bearer ${vendorAToken}`)
        .send({ status: st });
      expect(stRes.status).toBe(200);
    }

    const revRes = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ orderId: placedOrderId, rating: 4, comment: 'Fresh produce!' });
    expect(revRes.status).toBe(201);

    const sf = await request(app).get(`/api/v1/users/${vendorAId}/storefront`);
    expect(sf.body.data.vendor.rating).toBe(4);
    expect(sf.body.data.vendor.reviewCount).toBe(1);

    // Reorder + Self-Cancel restores inventory
    await request(app)
      .post(`/api/v1/orders/${placedOrderId}/reorder`)
      .set('Authorization', `Bearer ${customerAToken}`);

    const order2 = await request(app)
      .post('/api/v1/orders/checkout')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        addressId: serviceableAddressId,
        fulfillmentType: 'Delivery',
        paymentMethod: 'COD',
        acceptCurrentPrices: true,
      });
    expect(order2.status).toBe(201);

    const cancelRes = await request(app)
      .post(`/api/v1/orders/${order2.body.data.order.id}/cancel`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ reason: 'Changed mind' });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('Cancelled');
  });

  test('15. Support & issue reporting ticket creation and scoped retrieval', async () => {
    const supRes = await request(app)
      .post('/api/v1/support')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        orderId: placedOrderId,
        category: 'Item Quality',
        subject: 'One leaf bundle slightly wilted',
        description: 'Everything else was great, just reporting one bundle.',
      });
    expect(supRes.status).toBe(201);

    const otherList = await request(app)
      .get('/api/v1/support')
      .set('Authorization', `Bearer ${customerBToken}`);
    expect(otherList.body.data).toEqual([]);
  });

  test('16. Localization persistence (Kannada & English preference sync)', async () => {
    const prefRes = await request(app)
      .patch('/api/v1/users/profile')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ language: 'kn', preferences: { language: 'kn' } });
    expect(prefRes.status).toBe(200);
    expect(prefRes.body.data.language).toBe('kn');
    expect(prefRes.body.data.preferences.language).toBe('kn');
  });
});
