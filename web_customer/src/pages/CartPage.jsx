import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Store,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api';

export default function CartPage() {
  const {
    user,
    language,
    t,
    cart,
    cartLoading,
    refreshCart,
    updateCartItemQuantity,
    clearCart,
    showToast,
  } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      refreshCart();
    }
  }, [user, refreshCart]);

  if (!user) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-extrabold text-stone-900">{t('loginToCheckout')}</h1>
        <p className="text-sm text-stone-600">
          Sign in or create an account to save items to your persistent basket and order from
          neighborhood vendors.
        </p>
        <Link
          to="/auth"
          className="inline-flex min-h-[46px] px-6 items-center rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold"
        >
          {t('signIn')} / {t('register')}
        </Link>
      </div>
    );
  }

  const items = cart.items || [];
  const bill = cart.bill || {};
  const vendor = cart.vendor;

  if (!cartLoading && items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-500 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-extrabold text-stone-900">{t('emptyCartTitle')}</h1>
        <p className="text-sm text-stone-600">{t('emptyCartDesc')}</p>
        <Link
          to="/browse"
          className="inline-flex min-h-[46px] px-6 items-center rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold"
        >
          {t('exploreVendors')}
        </Link>
      </div>
    );
  }

  const acceptPriceChange = async (cartItemId) => {
    try {
      await api.patch(`/cart/items/${cartItemId}`, { acceptCurrentPrice: true });
      await refreshCart();
      showToast('Updated item price acknowledged', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const hasBlockingWarnings =
    (cart.stockWarnings && cart.stockWarnings.length > 0) ||
    (vendor && !vendor.isOnline);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-stone-900">{t('cartTitle')}</h1>
        <button
          type="button"
          onClick={clearCart}
          className="min-h-[40px] px-3 rounded-xl text-xs font-bold text-red-700 hover:bg-red-50 inline-flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Basket</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          {/* Fulfilling Vendor Banner */}
          {vendor && (
            <div className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-stone-500 font-medium">
                    Fulfilled directly by local vendor
                  </div>
                  <Link
                    to={`/vendor/${vendor.id}`}
                    className="font-bold text-stone-900 hover:text-emerald-800"
                  >
                    {vendor.shopName || vendor.name}
                  </Link>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  vendor.isOnline
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {vendor.isOnline ? t('onlineNow') : t('offlineNow')}
              </span>
            </div>
          )}

          {/* Price Change Transparency Banner */}
          {cart.priceChanges?.length > 0 && (
            <div
              role="alert"
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-950"
            >
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Vendor updated prices since you added these items:</span>
              </div>
              {cart.priceChanges.map((pc) => (
                <div key={pc.cartItemId} className="flex items-center justify-between gap-2">
                  <span>
                    <strong>{pc.productName}</strong>: ₹{pc.previousPrice} →{' '}
                    <strong>₹{pc.currentPrice}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => acceptPriceChange(pc.cartItemId)}
                    className="px-2.5 py-1 rounded-lg bg-amber-800 text-white font-bold"
                  >
                    Accept ₹{pc.currentPrice}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Stock Warnings */}
          {cart.stockWarnings?.length > 0 && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1.5 text-xs text-red-900"
            >
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-700" />
                <span>Stock availability changed:</span>
              </div>
              {cart.stockWarnings.map((sw) => (
                <div key={sw.cartItemId} className="flex items-center justify-between gap-2">
                  <span>{sw.reason}</span>
                  <button
                    type="button"
                    onClick={() => updateCartItemQuantity(sw.cartItemId, 0)}
                    className="px-2.5 py-1 rounded-lg bg-red-700 text-white font-bold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Line Items */}
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
            {items.map((item) => {
              const step = item.minOrderQty < 1 ? item.minOrderQty : 1;
              return (
                <div
                  key={item.cartItemId}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <Link
                      to={`/product/${item.productId}`}
                      className="font-bold text-stone-900 hover:text-emerald-800"
                    >
                      {language === 'kn' && item.kannadaName
                        ? item.kannadaName
                        : item.productName}
                    </Link>
                    <div className="text-xs text-stone-500 mt-0.5">
                      ₹{item.unitPrice} / {item.unit} • Stock: {item.availableStock} {item.unit}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="inline-flex items-center rounded-xl border border-stone-300 bg-stone-50">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.productName}`}
                        onClick={() => {
                          const next = Number((item.quantity - step).toFixed(2));
                          updateCartItemQuantity(
                            item.cartItemId,
                            next < item.minOrderQty ? 0 : next
                          );
                        }}
                        className="min-h-[40px] min-w-[38px] flex items-center justify-center text-stone-700 hover:bg-stone-200 rounded-l-xl"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-sm font-bold text-stone-900">
                        {item.quantity} {item.unit}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.productName}`}
                        disabled={item.quantity + step > item.availableStock}
                        onClick={() =>
                          updateCartItemQuantity(
                            item.cartItemId,
                            Number((item.quantity + step).toFixed(2))
                          )
                        }
                        className="min-h-[40px] min-w-[38px] flex items-center justify-center text-stone-700 hover:bg-stone-200 rounded-r-xl disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <div className="font-extrabold text-stone-900">₹{item.totalPrice}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Itemized Bill Summary */}
        <aside className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h2 className="font-extrabold text-base text-stone-900">Bill Summary</h2>

          {bill.freeDeliveryAbove && bill.subtotal < bill.freeDeliveryAbove && (
            <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl">
              Add <strong>₹{(bill.freeDeliveryAbove - bill.subtotal).toFixed(0)}</strong> more for{' '}
              <strong>Free Delivery</strong> from this vendor.
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>{t('itemSubtotal')}</span>
              <span className="font-semibold text-stone-900">₹{bill.subtotal}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>{t('deliveryCharges')}</span>
              <span className="font-semibold text-stone-900">
                {bill.deliveryCharge === 0 ? 'FREE' : `₹${bill.deliveryCharge}`}
              </span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span>-₹{bill.discount}</span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-200 flex justify-between text-base font-extrabold text-stone-900">
              <span>{t('grandTotal')}</span>
              <span>₹{bill.total}</span>
            </div>
          </div>

          {bill.minOrderShortfall > 0 && (
            <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-xl">
              Minimum order for home delivery is ₹{bill.minOrderAmount}. Add ₹
              {bill.minOrderShortfall} more or choose Self-Pickup at checkout.
            </div>
          )}

          {vendor && !vendor.isOnline && (
            <div className="text-xs text-red-800 bg-red-50 border border-red-200 p-3 rounded-xl">
              {vendor.shopName || vendor.name} is currently offline. Please wait until they are
              online to place this order.
            </div>
          )}

          <button
            type="button"
            disabled={hasBlockingWarnings}
            onClick={() => navigate('/checkout')}
            className="w-full min-h-[48px] rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-200 disabled:text-stone-500 text-white font-extrabold text-sm inline-flex items-center justify-center gap-2 transition"
          >
            <span>{t('proceedToCheckout')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </aside>
      </div>
    </div>
  );
}
