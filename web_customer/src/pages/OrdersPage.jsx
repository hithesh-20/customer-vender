import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowRight, RefreshCw, RotateCcw } from 'lucide-react';
import { api, getRealtimeSocket } from '../api';
import { useApp } from '../context/AppContext';
import { STATUS_LABELS } from '../i18n/translations';

export default function OrdersPage() {
  const { user, language, t, refreshCart, showToast } = useApp();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/orders?scope=customer&limit=50');
      setOrders(res?.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadOrders();

    const socket = getRealtimeSocket();
    const handleUpdate = () => loadOrders();
    socket.on('order:status_updated', handleUpdate);
    socket.on('order:payment_updated', handleUpdate);
    return () => {
      socket.off('order:status_updated', handleUpdate);
      socket.off('order:payment_updated', handleUpdate);
    };
  }, [user, navigate, loadOrders]);

  const handleReorder = async (orderId) => {
    try {
      const res = await api.post(`/orders/${orderId}/reorder`);
      await refreshCart();
      const skipped = res?.data?.skippedItems?.length || 0;
      showToast(
        skipped > 0
          ? `Available items added to basket (${skipped} unavailable skipped)`
          : 'Items added to your basket at current vendor prices',
        'success'
      );
      navigate('/cart');
    } catch (err) {
      showToast(err.message || 'Could not reorder items', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-stone-900">{t('myOrdersTitle')}</h1>
        <button
          type="button"
          onClick={loadOrders}
          className="min-h-[40px] px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 p-4 rounded-2xl text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 rounded-2xl bg-stone-200 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-500 flex items-center justify-center mx-auto">
            <ClipboardList className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-extrabold text-stone-900">{t('noOrdersTitle')}</h2>
          <p className="text-sm text-stone-600">{t('noOrdersDesc')}</p>
          <Link
            to="/browse"
            className="inline-flex min-h-[44px] px-5 items-center rounded-xl bg-emerald-700 text-white text-sm font-bold"
          >
            {t('exploreVendors')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {orders.map((order) => {
            const statusText =
              STATUS_LABELS[order.status]?.[language] || order.status;
            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-stone-900">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        order.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {statusText}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        order.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {order.paymentStatus === 'Paid'
                        ? t('paymentPaid')
                        : `${t('paymentPending')} (${order.paymentMethod})`}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-stone-800">
                    {order.vendor?.shopName || order.vendor?.name || 'Local Vendor'} • ₹
                    {order.total}
                  </div>
                  <div className="text-xs text-stone-500">
                    {(order.items || [])
                      .map((i) => `${i.productName} (${i.quantity} ${i.unit})`)
                      .join(', ')}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReorder(order.id)}
                    className="min-h-[42px] px-3.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-700 inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reorder</span>
                  </button>
                  <Link
                    to={`/orders/${order.id}`}
                    className="min-h-[42px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <span>Track & Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
