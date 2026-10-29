import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Store, User as UserIcon, Lock, Phone, Mail } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import BrandLogo from '../components/BrandLogo';

const VENDOR_TYPES = [
  'Street Cart',
  'Bicycle Vendor',
  'Motorcycle Vendor',
  'Street Stall',
  'Neighborhood Shop',
];

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, handleAuthSuccess, capabilities, showToast } = useApp();

  const [mode, setMode] = useState(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [role, setRole] = useState(
    searchParams.get('role') === 'vendor' ? 'vendor' : 'customer'
  );

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [regForm, setRegForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    shopName: '',
    shopNameKannada: '',
    vendorType: 'Street Cart',
    serviceArea: '',
    shopAddress: '',
    city: '',
    pincode: '',
    deliveryCharge: '20',
    minOrderAmount: '0',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      navigate(user.role === 'vendor' ? '/vendor-dashboard' : '/');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', {
        identifier: identifier.trim(),
        password,
      });
      if (res?.data) {
        handleAuthSuccess(res.data);
        showToast(`Welcome back, ${res.data.user.name}!`, 'success');
        navigate(res.data.user.role === 'vendor' ? '/vendor-dashboard' : '/');
      }
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        role,
        name: regForm.name.trim(),
        phone: regForm.phone.trim(),
        email: regForm.email.trim() || undefined,
        password: regForm.password,
      };

      if (role === 'vendor') {
        payload.shopName = regForm.shopName.trim();
        payload.shopNameKannada = regForm.shopNameKannada.trim() || undefined;
        payload.vendorType = regForm.vendorType;
        payload.serviceArea = regForm.serviceArea.trim();
        payload.shopAddress = regForm.shopAddress.trim();
        payload.city = regForm.city.trim();
        payload.pincode = regForm.pincode.trim();
        payload.settings = {
          homeDelivery: true,
          pickupAvailable: true,
          deliveryCharge: Number(regForm.deliveryCharge || 0),
          minOrderAmount: Number(regForm.minOrderAmount || 0),
          servicePincodes: regForm.pincode.trim() ? [regForm.pincode.trim()] : [],
          codEnabled: true,
        };
      }

      const res = await api.post('/auth/register', payload);
      if (res?.data) {
        handleAuthSuccess(res.data);
        showToast('Account created successfully!', 'success');
        navigate(res.data.user.role === 'vendor' ? '/vendor-dashboard' : '/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-4">
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandLogo />
          </div>
          <p className="text-xs text-stone-500">
            Secure neighborhood shopping & local street vendor delivery
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 rounded-2xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`min-h-[44px] rounded-xl text-sm font-bold transition ${
              mode === 'login' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`min-h-[44px] rounded-xl text-sm font-bold transition ${
              mode === 'register' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-600'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="text-xs text-red-800 bg-red-50 border border-red-200 p-3.5 rounded-xl font-medium"
          >
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-id"
                className="block text-xs font-bold text-stone-700 mb-1.5"
              >
                Mobile Number or Email Address
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-id"
                  required
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="10-digit mobile or email@domain.com"
                  className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-pw"
                className="block text-xs font-bold text-stone-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-pw"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {!capabilities.smsOtpEnabled && (
              <p className="text-[11px] text-stone-500">
                Authenticated via encrypted password session. (SMS OTP activates automatically when
                Twilio credentials are configured on the server.)
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm transition"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Customer vs Vendor Role Selector */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`min-h-[52px] p-3 rounded-xl border-2 flex items-center gap-2 text-left ${
                  role === 'customer'
                    ? 'border-emerald-700 bg-emerald-50/50 text-emerald-950'
                    : 'border-stone-200 text-stone-600'
                }`}
              >
                <UserIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold">Customer</div>
                  <div className="text-[10px] opacity-75">Shop & get delivery</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('vendor')}
                className={`min-h-[52px] p-3 rounded-xl border-2 flex items-center gap-2 text-left ${
                  role === 'vendor'
                    ? 'border-amber-600 bg-amber-50/60 text-amber-950'
                    : 'border-stone-200 text-stone-600'
                }`}
              >
                <Store className="w-4 h-4 text-amber-700 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold">Local Vendor</div>
                  <div className="text-[10px] opacity-75">Sell fresh produce</div>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  10-Digit Mobile *
                </label>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  value={regForm.phone}
                  onChange={(e) =>
                    setRegForm({ ...regForm, phone: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="98XXXXXXXX"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Password (min 8 chars) *
                </label>
                <input
                  required
                  minLength={8}
                  type="password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
            </div>

            {role === 'vendor' && (
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                  Street Vendor / Local Shop Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Cart / Shop Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={regForm.shopName}
                      onChange={(e) => setRegForm({ ...regForm, shopName: e.target.value })}
                      placeholder="e.g., Sri Ganesh Fresh Cart"
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Kannada Name (ಕನ್ನಡ ಹೆಸರು)
                    </label>
                    <input
                      type="text"
                      value={regForm.shopNameKannada}
                      onChange={(e) =>
                        setRegForm({ ...regForm, shopNameKannada: e.target.value })
                      }
                      placeholder="ಐಚ್ಛಿಕ ಕನ್ನಡ ಹೆಸರು"
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Vendor Type *
                    </label>
                    <select
                      value={regForm.vendorType}
                      onChange={(e) => setRegForm({ ...regForm, vendorType: e.target.value })}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-stone-300 bg-white text-sm"
                    >
                      {VENDOR_TYPES.map((vt) => (
                        <option key={vt} value={vt}>
                          {vt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Service Locality / Area *
                    </label>
                    <input
                      required
                      type="text"
                      value={regForm.serviceArea}
                      onChange={(e) => setRegForm({ ...regForm, serviceArea: e.target.value })}
                      placeholder="Neighborhoods covered"
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      City / Town *
                    </label>
                    <input
                      required
                      type="text"
                      value={regForm.city}
                      onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                      placeholder="City / Town"
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      6-Digit Pincode *
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={6}
                      value={regForm.pincode}
                      onChange={(e) =>
                        setRegForm({ ...regForm, pincode: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="574227"
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm transition"
            >
              {submitting
                ? 'Creating Account...'
                : role === 'vendor'
                  ? 'Register Vendor Account'
                  : 'Create Customer Account'}
            </button>

            <p className="text-[11px] text-center text-stone-500">
              By registering, you agree to VenderSathi’s{' '}
              <Link to="/legal" className="text-emerald-700 underline">
                Privacy Policy & Terms of Service
              </Link>
              .
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
