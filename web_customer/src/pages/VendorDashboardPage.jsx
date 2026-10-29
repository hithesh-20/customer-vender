import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Power,
  Plus,
  Package,
  ClipboardList,
  Settings,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { api, getRealtimeSocket } from '../api';
import { useApp } from '../context/AppContext';

const UNITS = ['kg', '500 g', '250 g', '100 g', 'bunch', 'packet', 'piece', 'dozen', 'liter'];

export default function VendorDashboardPage() {
  const { user, setUser, showToast } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState('orders');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [prodForm, setProdForm] = useState({
    name: '',
    kannadaName: '',
    category: 'Vegetables',
    unit: 'kg',
    price: '',
    mrp: '',
    stock: '20',
    minOrderQty: '1',
    description: '',
  });
  const [showProdForm, setShowProdForm] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    homeDelivery: user?.settings?.homeDelivery !== false,
    pickupAvailable: user?.settings?.pickupAvailable !== false,
    deliveryRadiusKm: user?.settings?.deliveryRadiusKm ?? 5,
    deliveryCharge: user?.settings?.deliveryCharge ?? 20,
    freeDeliveryAbove: user?.settings?.freeDeliveryAbove ?? 300,
    minOrderAmount: user?.settings?.minOrderAmount ?? 0,
    estimatedPrepMinutes: user?.settings?.estimatedPrepMinutes ?? 15,
    servicePincodes: (user?.settings?.servicePincodes || []).join(', '),
    codEnabled: user?.settings?.codEnabled !== false,
  });

  const loadVendorWorkspace = useCallback(async () => {
    if (!user || user.role !== 'vendor') return;
    setLoading(true);
    try {
      const [prodRes, catRes, ordRes] = await Promise.all([
        api.get('/products/me'),
        api.get('/products/categories'),
        api.get('/orders?limit=50'),
      ]);
      setProducts(prodRes?.data || []);
      setCategories(catRes?.data || []);
      setOrders(ordRes?.data || []);
    } catch (err) {
      showToast(err.message || 'Could not load vendor workspace', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (user.role !== 'vendor') {
      navigate('/');
      return;
    }
    loadVendorWorkspace();

    const socket = getRealtimeSocket();
    const onNewOrder = () => {
      showToast('New customer order received!', 'success');
      loadVendorWorkspace();
    };
    socket.on('order:created', onNewOrder);
    socket.on('order:status_updated', loadVendorWorkspace);
    return () => {
      socket.off('order:created', onNewOrder);
      socket.off('order:status_updated', loadVendorWorkspace);
    };
  }, [user, navigate, loadVendorWorkspace, showToast]);

  const toggleOnline = async () => {
    try {
      const nextState = !user.isOnline;
      const res = await api.patch('/users/availability', { isOnline: nextState });
      const updatedUser = { ...user, isOnline: res.data.isOnline };
      setUser(updatedUser);
      localStorage.setItem('vs_user', JSON.stringify(updatedUser));
      showToast(
        nextState ? 'You are now ONLINE to nearby customers' : 'You are now OFFLINE',
        'success'
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        ...prodForm,
        price: Number(prodForm.price),
        mrp: prodForm.mrp ? Number(prodForm.mrp) : null,
        stock: Number(prodForm.stock),
        minOrderQty: Number(prodForm.minOrderQty || 1),
      });
      setShowProdForm(false);
      setProdForm({
        name: '',
        kannadaName: '',
        category: 'Vegetables',
        unit: 'kg',
        price: '',
        mrp: '',
        stock: '20',
        minOrderQty: '1',
        description: '',
      });
      await loadVendorWorkspace();
      showToast('Product added to your live storefront', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleQuickStock = async (prodId, newStock) => {
    try {
      await api.patch(`/products/${prodId}/stock`, { stock: Number(newStock) });
      await loadVendorWorkspace();
      showToast('Stock updated', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      await loadVendorWorkspace();
      showToast(`Order marked ${status}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleMarkPaid = async (orderId) => {
    try {
      await api.post(`/payments/${orderId}/mark-collected`, {
        notes: 'Cash/UPI collected on handover',
      });
      await loadVendorWorkspace();
      showToast('Payment collection confirmed', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const pincodes = settingsForm.servicePincodes
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      const res = await api.patch('/users/profile', {
        settings: {
          homeDelivery: settingsForm.homeDelivery,
          pickupAvailable: settingsForm.pickupAvailable,
          deliveryRadiusKm: Number(settingsForm.deliveryRadiusKm),
          deliveryCharge: Number(settingsForm.deliveryCharge),
          freeDeliveryAbove: Number(settingsForm.freeDeliveryAbove),
          minOrderAmount: Number(settingsForm.minOrderAmount),
          estimatedPrepMinutes: settingsForm.estimatedPrepMinutes
            ? Number(settingsForm.estimatedPrepMinutes)
            : null,
          servicePincodes: pincodes,
          codEnabled: settingsForm.codEnabled,
        },
      });
      if (res?.data) {
        setUser(res.data);
        localStorage.setItem('vs_user', JSON.stringify(res.data));
        showToast('Delivery & storefront settings saved', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!user || user.role !== 'vendor') return null;

  return (
    <div className="space-y-6">
      {/* Vendor Top Status Bar */}
      <section className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Vendor Partner Hub • {user.vendorType || 'Street Cart'}
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 mt-0.5">
            {user.shopName || user.name}
          </h1>
          <p className="text-xs text-stone-500">
            {[user.serviceArea, user.city, user.pincode].filter(Boolean).join(' • ')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/vendor/${user.id}`}
            className="min-h-[44px] px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-700 inline-flex items-center gap-1.5"
          >
            <span>Preview Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={toggleOnline}
            className={`min-h-[44px] px-5 rounded-xl font-extrabold text-sm inline-flex items-center gap-2 transition ${
              user.isOnline
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-stone-800 hover:bg-stone-900 text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{user.isOnline ? 'Online (Click to Go Offline)' : 'Offline (Go Online)'}</span>
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto">
        {[
          { id: 'orders', label: `Customer Orders (${orders.length})`, icon: ClipboardList },
          { id: 'catalog', label: `My Products (${products.length})`, icon: Package },
          { id: 'settings', label: 'Delivery & Service Area', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`min-h-[44px] px-4 text-sm font-bold border-b-2 inline-flex items-center gap-2 shrink-0 ${
                tab === item.id
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="h-44 rounded-2xl bg-stone-200 animate-pulse" />
      ) : tab === 'orders' ? (
        <div className="space-y-3.5">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center space-y-2">
              <h2 className="font-bold text-stone-900">No customer orders yet</h2>
              <p className="text-xs text-stone-500">
                Make sure you have added products in “My Products” and switched your status to
                Online.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-base text-stone-900">
                      {order.orderNumber}
                    </span>
                    <span className="ml-2 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      {order.status}
                    </span>
                    <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                      {order.paymentStatus} ({order.paymentMethod})
                    </span>
                  </div>
                  <div className="font-extrabold text-base text-stone-900">₹{order.total}</div>
                </div>

                <div className="text-xs text-stone-600">
                  Customer: <strong>{order.customerName}</strong> ({order.customerPhone}) •{' '}
                  {order.type}
                  {order.deliveryAddress?.addressLine1 &&
                    ` • ${order.deliveryAddress.addressLine1}, ${order.deliveryAddress.area} (${order.deliveryAddress.pincode})`}
                </div>

                <div className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl">
                  {(order.items || [])
                    .map((i) => `${i.productName} × ${i.quantity} ${i.unit} (₹${i.totalPrice})`)
                    .join(' • ')}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {order.status === 'Placed' && (
                    <button
                      type="button"
                      onClick={() => handleOrderStatus(order.id, 'Accepted')}
                      className="min-h-[40px] px-4 rounded-xl bg-emerald-700 text-white text-xs font-bold"
                    >
                      Accept Order
                    </button>
                  )}
                  {order.status === 'Accepted' && (
                    <button
                      type="button"
                      onClick={() => handleOrderStatus(order.id, 'Preparing')}
                      className="min-h-[40px] px-4 rounded-xl bg-amber-600 text-white text-xs font-bold"
                    >
                      Start Packing
                    </button>
                  )}
                  {order.status === 'Preparing' && (
                    <button
                      type="button"
                      onClick={() => handleOrderStatus(order.id, 'Out for Delivery')}
                      className="min-h-[40px] px-4 rounded-xl bg-blue-700 text-white text-xs font-bold"
                    >
                      Mark Out for Delivery
                    </button>
                  )}
                  {(order.status === 'Out for Delivery' ||
                    (order.type === 'Pickup' && order.status === 'Preparing')) && (
                    <button
                      type="button"
                      onClick={() => handleOrderStatus(order.id, 'Delivered')}
                      className="min-h-[40px] px-4 rounded-xl bg-emerald-700 text-white text-xs font-bold"
                    >
                      Mark Delivered
                    </button>
                  )}

                  {order.paymentStatus !== 'Paid' && order.status !== 'Cancelled' && (
                    <button
                      type="button"
                      onClick={() => handleMarkPaid(order.id)}
                      className="min-h-[40px] px-3.5 rounded-xl border border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-xs font-bold inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Cash/UPI Collected</span>
                    </button>
                  )}

                  <Link
                    to={`/orders/${order.id}`}
                    className="min-h-[40px] px-3.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 inline-flex items-center ml-auto"
                  >
                    Open Chat & Timeline →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      ) : tab === 'catalog' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-base text-stone-900">Your Produce & Grocery Catalog</h2>
            <button
              type="button"
              onClick={() => setShowProdForm((v) => !v)}
              className="min-h-[42px] px-4 rounded-xl bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>

          {showProdForm && (
            <form
              onSubmit={handleCreateProduct}
              className="bg-white rounded-2xl border border-stone-200 p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
            >
              <div>
                <label className="block font-bold mb-1">Product Name (English) *</label>
                <input
                  required
                  type="text"
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="e.g., Fresh Country Tomato"
                  className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Kannada Name (ಕನ್ನಡ ಹೆಸರು)</label>
                <input
                  type="text"
                  value={prodForm.kannadaName}
                  onChange={(e) => setProdForm({ ...prodForm, kannadaName: e.target.value })}
                  placeholder="ನಾಟಿ ಟೊಮೇಟೊ"
                  className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Category *</label>
                <select
                  value={prodForm.category}
                  onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Unit *</label>
                <select
                  value={prodForm.unit}
                  onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300 bg-white"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Selling Price (₹ per unit) *</label>
                <input
                  required
                  type="number"
                  step="0.5"
                  min="1"
                  value={prodForm.price}
                  onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Available Stock *</label>
                <input
                  required
                  type="number"
                  step="0.5"
                  min="0"
                  value={prodForm.stock}
                  onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Min Order Qty *</label>
                <input
                  required
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={prodForm.minOrderQty}
                  onChange={(e) => setProdForm({ ...prodForm, minOrderQty: e.target.value })}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  placeholder="Harvested this morning..."
                  className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="min-h-[42px] px-5 rounded-xl bg-emerald-700 text-white font-bold"
                >
                  Publish Item
                </button>
              </div>
            </form>
          )}

          {products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-sm text-stone-500">
              Your catalog is empty. Click “Add Product” to list today’s fresh items.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2.5 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-stone-900">{p.name}</div>
                      {p.kannadaName && <div className="text-stone-500">{p.kannadaName}</div>}
                    </div>
                    <span className="font-extrabold text-sm text-emerald-800">
                      ₹{p.price}/{p.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <span>
                      Stock: <strong>{p.stock}</strong> {p.unit}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickStock(p.id, Number(p.stock) + 5)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStock(p.id, 0)}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-bold"
                      >
                        Mark 0
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white rounded-2xl border border-stone-200 p-6 max-w-2xl space-y-4 text-xs"
        >
          <h2 className="font-extrabold text-base text-stone-900">
            Delivery Fees, Service Pincodes & Fulfillment
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 font-bold text-stone-800">
              <input
                type="checkbox"
                checked={settingsForm.homeDelivery}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, homeDelivery: e.target.checked })
                }
                className="rounded text-emerald-700"
              />
              <span>Offer Home Delivery</span>
            </label>
            <label className="flex items-center gap-2 font-bold text-stone-800">
              <input
                type="checkbox"
                checked={settingsForm.pickupAvailable}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, pickupAvailable: e.target.checked })
                }
                className="rounded text-emerald-700"
              />
              <span>Allow Self-Pickup</span>
            </label>
            <div>
              <label className="block font-bold mb-1">Delivery Charge (₹)</label>
              <input
                type="number"
                min="0"
                value={settingsForm.deliveryCharge}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, deliveryCharge: e.target.value })
                }
                className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Free Delivery Above (₹)</label>
              <input
                type="number"
                min="0"
                value={settingsForm.freeDeliveryAbove}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, freeDeliveryAbove: e.target.value })
                }
                className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Minimum Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={settingsForm.minOrderAmount}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, minOrderAmount: e.target.value })
                }
                className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Estimated Prep Time (Minutes)</label>
              <input
                type="number"
                min="5"
                value={settingsForm.estimatedPrepMinutes}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, estimatedPrepMinutes: e.target.value })
                }
                className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold mb-1">
                Serviceable Pincodes (comma-separated)
              </label>
              <input
                type="text"
                value={settingsForm.servicePincodes}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, servicePincodes: e.target.value })
                }
                placeholder="574227, 574197"
                className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
              />
            </div>
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-5 rounded-xl bg-emerald-700 text-white font-bold text-sm"
          >
            Save Delivery Settings
          </button>
        </form>
      )}
    </div>
  );
}
