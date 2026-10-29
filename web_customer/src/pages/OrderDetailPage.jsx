import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Send,
  Star,
  RotateCcw,
  LifeBuoy,
} from 'lucide-react';
import { api, getRealtimeSocket } from '../api';
import { useApp } from '../context/AppContext';
import { STATUS_LABELS } from '../i18n/translations';

const STATUS_STEPS = ['Placed', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered'];

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, language, t, refreshCart, showToast } = useApp();

  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [cancelling, setCancelling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrder = useCallback(async () => {
    setError('');
    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res?.data) {
        setOrder(res.data);
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      setError(err.message || 'Could not load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadOrder();

    const socket = getRealtimeSocket();
    socket.emit('join:order', orderId);

    const onStatus = (payload) => {
      if (payload.orderId === orderId) {
        loadOrder();
      }
    };
    const onPayment = (payload) => {
      if (payload.orderId === orderId) {
        loadOrder();
      }
    };
    const onMessage = (msg) => {
      if (msg.orderId === orderId) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
      }
    };

    socket.on('order:status_updated', onStatus);
    socket.on('order:payment_updated', onPayment);
    socket.on('order:message', onMessage);

    return () => {
      socket.emit('leave:order', orderId);
      socket.off('order:status_updated', onStatus);
      socket.off('order:payment_updated', onPayment);
      socket.off('order:message', onMessage);
    };
  }, [user, orderId, navigate, loadOrder]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setSendingMsg(true);
    try {
      const res = await api.post(`/orders/${orderId}/messages`, {
        message: msgText.trim(),
      });
      if (res?.data) {
        setMessages((prev) =>
          prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]
        );
        setMsgText('');
      }
    } catch (err) {
      showToast(err.message || 'Could not send message', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      await api.post(`/orders/${orderId}/cancel`, {
        reason: 'Cancelled by customer from order screen',
      });
      showToast('Order cancelled and item stock restored', 'info');
      await loadOrder();
    } catch (err) {
      showToast(err.message || 'Cannot cancel order at this stage', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = async () => {
    try {
      await api.post(`/orders/${orderId}/reorder`);
      await refreshCart();
      showToast('Available items added to your basket', 'success');
      navigate('/cart');
    } catch (err) {
      showToast(err.message || 'Could not reorder items', 'error');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        orderId: order.id,
        rating,
        comment: reviewComment,
      });
      showToast('Thank you! Your review has been published.', 'success');
      await loadOrder();
    } catch (err) {
      showToast(err.message || 'Could not submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="h-64 rounded-2xl bg-stone-200 animate-pulse" aria-busy="true" />;
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-red-700">{error || 'Order not found'}</p>
        <Link
          to="/orders"
          className="inline-flex min-h-[44px] px-4 items-center rounded-xl bg-emerald-700 text-white text-sm font-bold"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);
  const isCustomerOwner = order.customerUserId === user?.id;
  const canCustomerCancel =
    isCustomerOwner && ['Placed', 'Accepted'].includes(order.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>All Orders</span>
      </Link>

      {/* Order Header & Status Stepper */}
      <section className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900">
                {order.orderNumber}
              </h1>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  order.status === 'Delivered'
                    ? 'bg-emerald-100 text-emerald-800'
                    : order.status === 'Cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-900'
                }`}
              >
                {STATUS_LABELS[order.status]?.[language] || order.status}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {order.paymentStatus === 'Paid'
                  ? 'Paid'
                  : `Payment Pending (${order.paymentMethod})`}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString()} • {order.type}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {order.vendor?.phone && (
              <a
                href={`tel:${order.vendor.phone}`}
                className="min-h-[42px] px-3.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-800 inline-flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>Call Vendor</span>
              </a>
            )}
            {canCustomerCancel && (
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="min-h-[42px] px-3.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold"
              >
                {cancelling ? 'Cancelling...' : t('cancelOrder')}
              </button>
            )}
          </div>
        </div>

        {/* Honest Status-Based Fulfillment Timeline (No fake GPS tracking map) */}
        {order.status === 'Cancelled' ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-sm text-red-900">
            <XCircle className="w-5 h-5 text-red-700 shrink-0" />
            <div>
              <div className="font-bold">Order Cancelled</div>
              {order.cancellationReason && (
                <div className="text-xs mt-0.5">Reason: {order.cancellationReason}</div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
            {STATUS_STEPS.map((step, idx) => {
              const reached = currentStepIdx >= idx;
              return (
                <div
                  key={step}
                  className={`p-3 rounded-2xl border text-xs ${
                    reached
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {reached ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 shrink-0" />
                    )}
                    <span>{STATUS_LABELS[step]?.[language] || step}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Timestamped Status History */}
        {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
          <div className="pt-3 border-t border-stone-100 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Live Status Log
            </div>
            {order.statusHistory.map((entry, idx) => (
              <div key={idx} className="text-xs text-stone-600 flex flex-wrap gap-2">
                <span className="font-mono text-stone-400">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span className="font-bold text-stone-800">{entry.status}</span>
                {entry.note && <span>— {entry.note}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Itemized Receipt & Address */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h2 className="font-extrabold text-base text-stone-900">Items & Receipt</h2>
          <div className="text-xs text-stone-600">
            Vendor:{' '}
            <Link
              to={`/vendor/${order.vendorId}`}
              className="font-bold text-emerald-800 hover:underline"
            >
              {order.vendor?.shopName || order.vendor?.name}
            </Link>
          </div>

          <div className="divide-y divide-stone-100 text-sm">
            {(order.items || []).map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between gap-2">
                <div>
                  <span className="font-semibold text-stone-900">{item.productName}</span>
                  <span className="text-xs text-stone-500 ml-1.5">
                    ({item.quantity} {item.unit} × ₹{item.unitPrice})
                  </span>
                </div>
                <span className="font-bold text-stone-900">₹{item.totalPrice}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-200 space-y-1.5 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Delivery Charge</span>
              <span>{order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}</span>
            </div>
            <div className="flex justify-between font-extrabold text-base text-stone-900 pt-1 border-t border-stone-100">
              <span>Total</span>
              <span>₹{order.total}</span>
            </div>
          </div>

          {order.deliveryAddress?.addressLine1 && (
            <div className="pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-0.5">
              <div className="font-bold text-stone-800">Delivery Address</div>
              <div>
                {order.deliveryAddress.recipientName} ({order.deliveryAddress.recipientPhone})
              </div>
              <div>
                {order.deliveryAddress.addressLine1}, {order.deliveryAddress.area},{' '}
                {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-stone-100 flex flex-wrap gap-2">
            {isCustomerOwner && (
              <button
                type="button"
                onClick={handleReorder}
                className="min-h-[42px] px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('reorder')}</span>
              </button>
            )}
            <Link
              to={`/account?tab=support&orderId=${order.id}`}
              className="min-h-[42px] px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-700 inline-flex items-center gap-1.5"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>{t('reportIssue')}</span>
            </Link>
          </div>
        </section>

        {/* Real-Time Customer <-> Vendor Order Chat */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <h2 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>{t('messageVendor')}</span>
            </h2>

            <div className="h-56 overflow-y-auto rounded-xl bg-stone-50 border border-stone-200 p-3 space-y-2.5">
              {messages.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-16">
                  Send a direct message to coordinate freshness preferences, landmark directions,
                  or pickup timing.
                </p>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                        mine
                          ? 'ml-auto bg-emerald-700 text-white'
                          : 'bg-white border border-stone-200 text-stone-800'
                      }`}
                    >
                      <div className="font-bold text-[10px] opacity-80">{m.senderName}</div>
                      <div className="mt-0.5">{m.message}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder="Write a message regarding this order..."
              aria-label="Message regarding order"
              className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              disabled={sendingMsg || !msgText.trim()}
              aria-label={t('sendMessage')}
              className="min-h-[44px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-200 text-white font-bold text-xs inline-flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{t('sendMessage')}</span>
            </button>
          </form>
        </section>
      </div>

      {/* Genuine Delivered-Order Review Section */}
      {isCustomerOwner && order.status === 'Delivered' && (
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h2 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{t('rateOrder')}</span>
          </h2>

          {order.review ? (
            <div className="text-sm text-stone-700 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
              You rated this order <strong>{order.review.rating}/5</strong>
              {order.review.comment ? ` — "${order.review.comment}"` : ''}
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-3 max-w-lg">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} out of 5 stars`}
                    className={`min-h-[42px] min-w-[42px] rounded-xl border font-bold text-sm flex items-center justify-center gap-1 ${
                      rating >= star
                        ? 'bg-amber-100 border-amber-400 text-amber-900'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}
                  >
                    {star}★
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share honest feedback about produce freshness and delivery..."
                className="w-full p-3 rounded-xl border border-stone-300 text-sm"
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="min-h-[44px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold"
              >
                {submittingReview ? 'Submitting...' : 'Submit Verified Review'}
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
