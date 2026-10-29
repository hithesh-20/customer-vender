import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  User as UserIcon,
  MapPin,
  LifeBuoy,
  LogOut,
  Plus,
  Trash2,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppContext';

export default function AccountPage() {
  const { user, setUser, logout, language, setLanguage, t, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState(searchParams.get('tab') || 'profile');

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    orderUpdates: user?.preferences?.orderUpdates !== false,
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState({
    label: 'Home',
    recipientName: user?.name || '',
    recipientPhone: user?.phone || '',
    addressLine1: '',
    area: '',
    landmark: '',
    city: '',
    pincode: '',
  });
  const [showAddrForm, setShowAddrForm] = useState(false);

  // Support tickets
  const [tickets, setTickets] = useState([]);
  const [ticketForm, setTicketForm] = useState({
    orderId: searchParams.get('orderId') || '',
    category: 'Order Issue',
    subject: '',
    description: '',
  });

  const loadAccountExtras = useCallback(async () => {
    if (!user) return;
    try {
      const [addrRes, supRes] = await Promise.all([
        api.get('/addresses'),
        api.get('/support'),
      ]);
      setAddresses(addrRes?.data || []);
      setTickets(supRes?.data || []);
    } catch (_) {
      // handled gracefully
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadAccountExtras();
  }, [user, navigate, loadAccountExtras]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch('/users/profile', {
        name: profileForm.name.trim(),
        email: profileForm.email.trim() || null,
        city: profileForm.city.trim() || null,
        pincode: profileForm.pincode.trim() || null,
        preferences: {
          language,
          orderUpdates: profileForm.orderUpdates,
        },
      });
      if (res?.data) {
        setUser(res.data);
        localStorage.setItem('vs_user', JSON.stringify(res.data));
        showToast('Profile saved', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Could not update profile', 'error');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/auth/password', pwForm);
      setPwForm({ currentPassword: '', newPassword: '' });
      showToast('Password updated', 'success');
    } catch (err) {
      showToast(err.message || 'Password update failed', 'error');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await api.post('/addresses', addrForm);
      setShowAddrForm(false);
      setAddrForm({
        label: 'Home',
        recipientName: user?.name || '',
        recipientPhone: user?.phone || '',
        addressLine1: '',
        area: '',
        landmark: '',
        city: '',
        pincode: '',
      });
      await loadAccountExtras();
      showToast('Address added', 'success');
    } catch (err) {
      showToast(err.message || 'Could not save address', 'error');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await api.patch(`/addresses/${id}/default`);
      await loadAccountExtras();
      showToast('Default address updated', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/addresses/${id}`);
      await loadAccountExtras();
      showToast('Address removed', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/support', {
        orderId: ticketForm.orderId || undefined,
        category: ticketForm.category,
        subject: ticketForm.subject,
        description: ticketForm.description,
      });
      setTicketForm({ orderId: '', category: 'Order Issue', subject: '', description: '' });
      await loadAccountExtras();
      showToast('Support issue submitted', 'success');
    } catch (err) {
      showToast(err.message || 'Could not submit support request', 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">{user.name}</h1>
          <p className="text-xs text-stone-500">
            {user.phone} {user.email ? `• ${user.email}` : ''} • Role: {user.role}
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/');
          }}
          className="min-h-[44px] px-4 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold inline-flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('logout')}</span>
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-stone-200">
        {[
          { id: 'profile', label: 'Profile & Settings', icon: UserIcon },
          { id: 'addresses', label: t('savedAddresses'), icon: MapPin },
          { id: 'support', label: t('supportCenter'), icon: LifeBuoy },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setSearchParams({ tab: item.id }, { replace: true });
              }}
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

      {tab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4"
          >
            <h2 className="font-extrabold text-base text-stone-900">Personal Details</h2>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
              <input
                required
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Email Address</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {t('languageLabel')}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-stone-300 bg-white text-sm"
              >
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={profileForm.orderUpdates}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, orderUpdates: e.target.checked })
                }
                className="rounded text-emerald-700"
              />
              <span>Receive live order status notifications</span>
            </label>
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold"
            >
              Save Profile
            </button>
          </form>

          <div className="space-y-5">
            <form
              onSubmit={handlePasswordChange}
              className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4"
            >
              <h2 className="font-extrabold text-base text-stone-900">Change Password</h2>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Current Password
                </label>
                <input
                  required
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  required
                  minLength={8}
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <button
                type="submit"
                className="min-h-[44px] px-5 rounded-xl border border-stone-300 hover:bg-stone-50 text-sm font-bold text-stone-800"
              >
                Update Password
              </button>
            </form>

            <Link
              to="/legal"
              className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center justify-between hover:border-emerald-400 transition"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <div>
                  <div className="text-sm font-bold text-stone-900">{t('privacyAndTerms')}</div>
                  <div className="text-xs text-stone-500">
                    Data protection, honest billing & user rights
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700">Read →</span>
            </Link>
          </div>
        </div>
      )}

      {tab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-stone-900">{t('savedAddresses')}</h2>
            <button
              type="button"
              onClick={() => setShowAddrForm((v) => !v)}
              className="min-h-[42px] px-4 rounded-xl bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addNewAddress')}</span>
            </button>
          </div>

          {showAddrForm && (
            <form
              onSubmit={handleAddAddress}
              className="bg-white rounded-2xl border border-stone-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
            >
              <div>
                <label className="block font-bold mb-1">Label</label>
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
                <label className="block font-bold mb-1">Recipient Name *</label>
                <input
                  required
                  type="text"
                  value={addrForm.recipientName}
                  onChange={(e) => setAddrForm({ ...addrForm, recipientName: e.target.value })}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">10-Digit Mobile *</label>
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
                <label className="block font-bold mb-1">6-Digit Pincode *</label>
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
                <label className="block font-bold mb-1">House / Street Line *</label>
                <input
                  required
                  type="text"
                  value={addrForm.addressLine1}
                  onChange={(e) => setAddrForm({ ...addrForm, addressLine1: e.target.value })}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Area / Locality *</label>
                <input
                  required
                  type="text"
                  value={addrForm.area}
                  onChange={(e) => setAddrForm({ ...addrForm, area: e.target.value })}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">City / Town *</label>
                <input
                  required
                  type="text"
                  value={addrForm.city}
                  onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="min-h-[42px] px-5 rounded-xl bg-emerald-700 text-white font-bold"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          {addresses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-sm text-stone-500">
              No saved delivery addresses yet. Add your home or work address for quick checkout.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-stone-900">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-stone-700">
                      {addr.recipientName} • {addr.recipientPhone}
                    </div>
                    <div className="text-stone-600">
                      {addr.addressLine1}, {addr.area}, {addr.city} - {addr.pincode}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100 text-xs">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="min-h-[36px] px-3 rounded-lg border border-stone-300 font-bold text-stone-700 hover:bg-stone-50 inline-flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Set Default</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="min-h-[36px] px-3 rounded-lg text-red-700 hover:bg-red-50 font-bold inline-flex items-center gap-1 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'support' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <form
            onSubmit={handleCreateTicket}
            className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3.5"
          >
            <h2 className="font-extrabold text-base text-stone-900">Report an Issue / Get Help</h2>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Issue Category</label>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                className="w-full min-h-[42px] px-3 rounded-xl border border-stone-300 bg-white text-sm"
              >
                <option value="Order Issue">Order Issue</option>
                <option value="Item Quality">Item Quality / Freshness</option>
                <option value="Delivery Delay">Delivery Delay</option>
                <option value="Payment/Billing">Payment / Billing</option>
                <option value="Account Help">Account Help</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Subject *</label>
              <input
                required
                minLength={4}
                type="text"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                placeholder="Brief summary of the issue"
                className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Description *</label>
              <textarea
                required
                minLength={10}
                rows={3}
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="Provide details so the vendor or support team can resolve it..."
                className="w-full p-3 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold"
            >
              Submit Support Ticket
            </button>
          </form>

          <div className="space-y-3">
            <h2 className="font-extrabold text-base text-stone-900">Your Support Tickets</h2>
            {tickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 text-xs text-stone-500">
                You have not reported any support issues.
              </div>
            ) : (
              tickets.map((tk) => (
                <div
                  key={tk.id}
                  className="bg-white rounded-2xl border border-stone-200 p-4 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">
                      {tk.ticketNumber} • {tk.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                      {tk.status}
                    </span>
                  </div>
                  <div className="font-semibold text-stone-800">{tk.subject}</div>
                  <p className="text-stone-600">{tk.description}</p>
                  {tk.resolutionNote && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 mt-1">
                      <strong>Resolution:</strong> {tk.resolutionNote}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
