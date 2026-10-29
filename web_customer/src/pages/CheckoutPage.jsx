import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Truck,
  Store,
  CreditCard,
  Banknote,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppContext';

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function CheckoutPage() {
  const { user, t, cart, refreshCart, capabilities, showToast } = useApp();
  const navigate = useNavigate();

  const [fulfillmentType, setFulfillmentType] = useState('Delivery');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [addrForm, setAddrForm] = useState({
    label: 'Home',
    recipientName: user?.name || '',
    recipientPhone: user?.phone || '',
    addressLine1: '',
    area: '',
    landmark: '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    deliveryInstructions: '',
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [priceConfirmNeeded, setPriceConfirmNeeded] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/addresses');
      const list = res?.data || [];
      setAddresses(list);
      if (list.length > 0 && !selectedAddressId) {
        const def = list.find((a) => a.isDefault) || list[0];
        setSelectedAddressId(def.id);
      } else if (list.length === 0) {
        setShowAddressForm(true);
      }
    } catch (_) {
      // handled gracefully
    }
  }, [user, selectedAddressId]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadAddresses();
  }, [user, navigate, loadAddresses]);

  // Re-evaluate cart bill & serviceability whenever fulfillmentType or selectedAddressId changes
  useEffect(() => {
    if (user) {
      refreshCart({
        fulfillmentType,
        addressId: fulfillmentType === 'Delivery' ? selectedAddressId : undefined,
      });
    }
  }, [user, fulfillmentType, selectedAddressId, refreshCart]);

  useEffect(() => {
    if (fulfillmentType === 'Pickup') {
      setPaymentMethod('PAY_AT_PICKUP');
    } else {
      setPaymentMethod('COD');
    }
    setIdempotencyKey(createIdempotencyKey());
  }, [fulfillmentType]);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    setCheckoutError('');
    try {
      const res = await api.post('/addresses', {
        ...addrForm,
        isDefault: addresses.length === 0,
      });
      if (res?.data) {
        const nextList = [res.data, ...addresses];
        setAddresses(nextList);
        setSelectedAddressId(res.data.id);
        setShowAddressForm(false);
        showToast('Delivery address saved', 'success');
      }
    } catch (err) {
      setCheckoutError(err.message || 'Could not save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async (acceptCurrentPrices = false) => {
    setCheckoutError('');
    if (fulfillmentType === 'Delivery' && !selectedAddressId) {
      setCheckoutError('Please add or select a delivery address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(
        '/orders/checkout',
        {
          addressId: fulfillmentType === 'Delivery' ? selectedAddressId : null,
          fulfillmentType,
          paymentMethod,
          notes,
          expectedTotal: acceptCurrentPrices ? undefined : cart.bill?.total,
          acceptCurrentPrices,
          idempotencyKey,
        },
        { 'X-Idempotency-Key': idempotencyKey }
      );

      const createdOrder = res?.data?.order;
      await refreshCart();

      if (res?.data?.requiresOnlinePayment && createdOrder) {
        // Trigger genuine Razorpay gateway order creation
        try {
          await api.post('/payments/razorpay/create-order', {
            orderId: createdOrder.id,
          });
          showToast('Order created — complete online payment verification on order screen', 'info');
        } catch (payErr) {
          showToast(
            payErr.message || 'Order saved with Pending payment; you can retry on order details.',
            'warning'
          );
        }
      } else {
        showToast(`Order ${createdOrder?.orderNumber} placed!`, 'success');
      }

      navigate(`/orders/${createdOrder.id}`);
    } catch (err) {
      if (
        err.statusCode === 409 &&
        (err.details?.code === 'PRICE_CHANGED' || err.details?.code === 'TOTAL_MISMATCH')
      ) {
        await refreshCart({
          fulfillmentType,
          addressId: fulfillmentType === 'Delivery' ? selectedAddressId : undefined,
        });
        setPriceConfirmNeeded(true);
        setIdempotencyKey(createIdempotencyKey());
        setCheckoutError(err.message);
      } else {
        setCheckoutError(err.message || 'Order could not be completed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const items = cart.items || [];
  const vendor = cart.vendor;
  const bill = cart.bill || {};
  const serviceability = cart.serviceability;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center max-w-md mx-auto space-y-4">
        <h1 className="text-lg font-extrabold text-stone-900">Your basket is empty</h1>
        <Link
          to="/browse"
          className="inline-flex min-h-[44px] px-5 items-center rounded-xl bg-emerald-700 text-white text-sm font-bold"
        >
          Browse Local Vendors
        </Link>
      </div>
    );
  }

  const vendorAllowsDelivery = vendor?.settings?.homeDelivery !== false;
  const vendorAllowsPickup = vendor?.settings?.pickupAvailable !== false;
  const canPlace =
    vendor?.isOnline &&
    (fulfillmentType !== 'Delivery' || Boolean(selectedAddressId)) &&
    (!serviceability || serviceability.serviceable) &&
    !(fulfillmentType === 'Delivery' && bill.minOrderShortfall > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-stone-900">{t('checkoutTitle')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-5">
          {/* Step 1: Fulfillment Mode */}
          <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
            <h2 className="font-bold text-stone-900 text-base">{t('fulfillmentMethod')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!vendorAllowsDelivery}
                onClick={() => setFulfillmentType('Delivery')}
                className={`min-h-[56px] p-3.5 rounded-xl border-2 text-left flex items-center gap-3 transition ${
                  fulfillmentType === 'Delivery'
                    ? 'border-emerald-700 bg-emerald-50/60'
                    : 'border-stone-200 hover:border-stone-300'
                } disabled:opacity-40`}
              >
                <Truck className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-stone-900">{t('homeDelivery')}</div>
                  <div className="text-xs text-stone-500">
                    {vendorAllowsDelivery ? 'Delivered to your doorstep' : 'Not offered by vendor'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={!vendorAllowsPickup}
                onClick={() => setFulfillmentType('Pickup')}
                className={`min-h-[56px] p-3.5 rounded-xl border-2 text-left flex items-center gap-3 transition ${
                  fulfillmentType === 'Pickup'
                    ? 'border-emerald-700 bg-emerald-50/60'
                    : 'border-stone-200 hover:border-stone-300'
                } disabled:opacity-40`}
              >
                <Store className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-stone-900">{t('selfPickup')}</div>
                  <div className="text-xs text-stone-500">
                    {vendorAllowsPickup ? 'Zero delivery fee' : 'Not offered by vendor'}
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* Step 2: Delivery Address or Pickup Location */}
          {fulfillmentType === 'Delivery' ? (
            <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-stone-900 text-base">{t('selectAddress')}</h2>
                <button
                  type="button"
                  onClick={() => setShowAddressForm((v) => !v)}
                  className="min-h-[38px] px-3 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('addNewAddress')}</span>
                </button>
              </div>

              {addresses.length > 0 && (
                <div className="space-y-2.5">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`block p-3.5 rounded-xl border-2 cursor-pointer transition ${
                        selectedAddressId === addr.id
                          ? 'border-emerald-700 bg-emerald-50/40'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="deliveryAddress"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 text-emerald-700 focus:ring-emerald-600"
                        />
                        <div className="text-xs space-y-0.5">
                          <div className="font-bold text-sm text-stone-900">
                            {addr.label} • {addr.recipientName} ({addr.recipientPhone})
                          </div>
                          <div className="text-stone-600">
                            {addr.addressLine1}, {addr.area}, {addr.city} - {addr.pincode}
                          </div>
                          {addr.landmark && (
                            <div className="text-stone-500">Landmark: {addr.landmark}</div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {serviceability && !serviceability.serviceable && (
                <div
                  role="alert"
                  className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-900 flex items-center gap-2 font-medium"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{serviceability.reason}</span>
                </div>
              )}

              {serviceability && serviceability.serviceable && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Address is within vendor’s delivery area
                    {typeof serviceability.distanceKm === 'number'
                      ? ` (${serviceability.distanceKm} km)`
                      : ''}
                    .
                  </span>
                </div>
              )}

              {showAddressForm && (
                <form
                  onSubmit={handleSaveAddress}
                  className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
                >
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Label</label>
                    <select
                      value={addrForm.label}
                      onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                      className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300 bg-white"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Recipient Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={addrForm.recipientName}
                      onChange={(e) => setAddrForm({ ...addrForm, recipientName: e.target.value })}
                      className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      10-Digit Mobile *
                    </label>
                    <input
                      required
                      type="tel"
                      maxLength={10}
                      value={addrForm.recipientPhone}
                      onChange={(e) =>
                        setAddrForm({
                          ...addrForm,
                          recipientPhone: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      6-Digit Pincode *
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={6}
                      value={addrForm.pincode}
                      onChange={(e) =>
                        setAddrForm({ ...addrForm, pincode: e.target.value.replace(/\D/g, '') })
                      }
                      className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">
                      House / Door No. & Street *
                    </label>
                    <input
                      required
                      type="text"
                      value={addrForm.addressLine1}
                      onChange={(e) => setAddrForm({ ...addrForm, addressLine1: e.target.value })}
                      className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Locality / Area *
                    </label>
                    <input
                      required
                      type="text"
                      value={addrForm.area}
                      onChange={(e) => setAddrForm({ ...addrForm, area: e.target.value })}
                      className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">City / Town *</label>
                    <input
                      required
                      type="text"
                      value={addrForm.city}
                      onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                      className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="min-h-[42px] px-4 rounded-xl border border-stone-300 font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="min-h-[42px] px-5 rounded-xl bg-emerald-700 text-white font-bold"
                    >
                      {savingAddress ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          ) : (
            <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2">
              <h2 className="font-bold text-stone-900 text-base">Vendor Pickup Location</h2>
              <div className="flex items-start gap-2.5 text-sm text-stone-700">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
                <div>
                  <div className="font-bold">{vendor?.shopName || vendor?.name}</div>
                  <div className="text-xs text-stone-500">
                    {[vendor?.shopAddress, vendor?.serviceArea, vendor?.city, vendor?.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 3: Honest Payment Method Selection */}
          <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
            <h2 className="font-bold text-stone-900 text-base">{t('paymentMethod')}</h2>

            {fulfillmentType === 'Delivery' ? (
              <label
                className={`block p-3.5 rounded-xl border-2 cursor-pointer ${
                  paymentMethod === 'COD'
                    ? 'border-emerald-700 bg-emerald-50/40'
                    : 'border-stone-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="text-emerald-700"
                  />
                  <Banknote className="w-5 h-5 text-emerald-700" />
                  <div>
                    <div className="text-sm font-bold text-stone-900">{t('codLabel')}</div>
                    <div className="text-xs text-stone-500">
                      Order stays marked Payment Pending until the vendor confirms cash/UPI receipt
                      upon delivery.
                    </div>
                  </div>
                </div>
              </label>
            ) : (
              <label
                className={`block p-3.5 rounded-xl border-2 cursor-pointer ${
                  paymentMethod === 'PAY_AT_PICKUP'
                    ? 'border-emerald-700 bg-emerald-50/40'
                    : 'border-stone-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'PAY_AT_PICKUP'}
                    onChange={() => setPaymentMethod('PAY_AT_PICKUP')}
                    className="text-emerald-700"
                  />
                  <Banknote className="w-5 h-5 text-emerald-700" />
                  <div>
                    <div className="text-sm font-bold text-stone-900">{t('payAtPickupLabel')}</div>
                    <div className="text-xs text-stone-500">
                      Pay directly at the cart/shop when collecting your order.
                    </div>
                  </div>
                </div>
              </label>
            )}

            {/* Online Payment Option — Honestly reflects real Razorpay configuration */}
            <label
              className={`block p-3.5 rounded-xl border-2 ${
                !capabilities.onlinePaymentsEnabled
                  ? 'border-stone-200 bg-stone-50 opacity-75 cursor-not-allowed'
                  : paymentMethod === 'ONLINE'
                    ? 'border-emerald-700 bg-emerald-50/40 cursor-pointer'
                    : 'border-stone-200 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  disabled={!capabilities.onlinePaymentsEnabled}
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                  className="text-emerald-700"
                />
                <CreditCard className="w-5 h-5 text-stone-600" />
                <div>
                  <div className="text-sm font-bold text-stone-900">
                    {t('onlinePaymentLabel')}
                  </div>
                  <div className="text-xs text-stone-500">
                    {capabilities.onlinePaymentsEnabled
                      ? 'Verified server-side via Razorpay HMAC signature.'
                      : t('onlinePaymentUnavailable')}
                  </div>
                </div>
              </div>
            </label>

            <div className="pt-2">
              <label
                htmlFor="order-notes"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Special Notes for Vendor (Optional)
              </label>
              <textarea
                id="order-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Medium ripe tomatoes, call at gate..."
                className="w-full p-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </section>
        </div>

        {/* Final Authoritative Summary */}
        <aside className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h2 className="font-extrabold text-base text-stone-900">Order Summary</h2>
          <div className="text-xs text-stone-500">
            Vendor: <strong className="text-stone-800">{vendor?.shopName || vendor?.name}</strong>
          </div>

          <div className="divide-y divide-stone-100 max-h-52 overflow-y-auto text-xs">
            {items.map((i) => (
              <div key={i.cartItemId} className="py-2 flex justify-between gap-2">
                <span>
                  {i.productName} × {i.quantity} {i.unit}
                </span>
                <span className="font-bold text-stone-900">₹{i.totalPrice}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-200 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>{t('itemSubtotal')}</span>
              <span>₹{bill.subtotal}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>{t('deliveryCharges')}</span>
              <span>{bill.deliveryCharge === 0 ? 'FREE' : `₹${bill.deliveryCharge}`}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between text-base font-extrabold text-stone-900">
              <span>{t('grandTotal')}</span>
              <span>₹{bill.total}</span>
            </div>
          </div>

          {checkoutError && (
            <div
              role="alert"
              className="text-xs text-red-800 bg-red-50 border border-red-200 p-3 rounded-xl space-y-2"
            >
              <p>{checkoutError}</p>
              {priceConfirmNeeded && (
                <button
                  type="button"
                  onClick={() => {
                    setPriceConfirmNeeded(false);
                    handlePlaceOrder(true);
                  }}
                  className="w-full min-h-[40px] rounded-lg bg-amber-700 text-white font-bold"
                >
                  Confirm Updated Total (₹{bill.total}) & Place Order
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={!canPlace || submitting}
            onClick={() => handlePlaceOrder(false)}
            className="w-full min-h-[48px] rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-200 disabled:text-stone-500 text-white font-extrabold text-sm transition"
          >
            {submitting ? t('placingOrder') : `${t('placeOrder')} • ₹${bill.total}`}
          </button>
        </aside>
      </div>
    </div>
  );
}
