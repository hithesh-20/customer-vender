import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin,
  ShoppingBag,
  Home,
  Search,
  ClipboardList,
  User as UserIcon,
  Store,
  WifiOff,
  X,
  Navigation,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useApp } from '../context/AppContext';
import { api } from '../api';

export default function Layout({ children }) {
  const {
    user,
    language,
    setLanguage,
    t,
    location,
    updateLocation,
    locationModalOpen,
    setLocationModalOpen,
    cartItemCount,
    cart,
    vendorConflictModal,
    setVendorConflictModal,
    addToCart,
    isOnlineNetwork,
    toast,
    setToast,
    showToast,
  } = useApp();

  const routerLocation = useLocation();
  const navigate = useNavigate();

  const [cityInput, setCityInput] = useState(location?.city || '');
  const [pincodeInput, setPincodeInput] = useState(location?.pincode || '');
  const [areaInput, setAreaInput] = useState(location?.area || '');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);

  useEffect(() => {
    if (locationModalOpen) {
      setCityInput(location?.city || '');
      setPincodeInput(location?.pincode || '');
      setAreaInput(location?.area || '');
      setGeoError('');
      if (user) {
        api
          .get('/addresses')
          .then((res) => setSavedAddresses(res?.data || []))
          .catch(() => setSavedAddresses([]));
      }
    }
  }, [locationModalOpen, location, user]);

  const handleManualLocationSave = (e) => {
    e.preventDefault();
    const cleanPin = pincodeInput.trim();
    const cleanCity = cityInput.trim();
    if (cleanPin && !/^[1-9]\d{5}$/.test(cleanPin)) {
      setGeoError('Please enter a valid 6-digit Indian pincode.');
      return;
    }
    if (!cleanPin && !cleanCity) {
      setGeoError('Enter at least a city/town or 6-digit pincode.');
      return;
    }
    updateLocation({
      city: cleanCity || null,
      pincode: cleanPin || null,
      area: areaInput.trim() || null,
      latitude: null,
      longitude: null,
      label: areaInput.trim() || cleanCity || cleanPin,
    });
    setLocationModalOpen(false);
    showToast('Delivery location updated', 'success');
  };

  const handleRequestGps = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Please enter pincode manually.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        updateLocation({
          city: cityInput.trim() || null,
          pincode: pincodeInput.trim() || null,
          area: areaInput.trim() || 'Current GPS Location',
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          label: cityInput.trim()
            ? `${cityInput.trim()} (GPS)`
            : `GPS (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`,
        });
        setLocationModalOpen(false);
        showToast('Current GPS coordinates applied', 'success');
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(
          err.code === 1
            ? 'Location permission was declined. You can enter your city or pincode manually below.'
            : 'Could not detect GPS coordinates right now. Please enter your city or pincode manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const selectSavedAddressForLocation = (addr) => {
    updateLocation({
      addressId: addr.id,
      city: addr.city,
      pincode: addr.pincode,
      area: addr.area,
      latitude: addr.latitude,
      longitude: addr.longitude,
      label: `${addr.label}: ${addr.area}, ${addr.pincode}`,
    });
    setLocationModalOpen(false);
    showToast(`Delivering to ${addr.label} (${addr.area})`, 'success');
  };

  const isActivePath = (path) =>
    path === '/'
      ? routerLocation.pathname === '/'
      : routerLocation.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 pb-20 md:pb-0">
      {/* Offline Connectivity Banner */}
      {!isOnlineNetwork && (
        <div
          role="alert"
          className="bg-amber-700 text-white px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t('offlineBanner')}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" aria-label="VenderSathi Home" className="shrink-0">
              <BrandLogo />
            </Link>

            {/* Location Picker Button */}
            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              aria-label={t('setLocation')}
              className="min-h-[44px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 flex items-center gap-1.5 text-left transition max-w-[180px] sm:max-w-[240px]"
            >
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <div className="truncate">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                  {language === 'kn' ? 'ಸ್ಥಳ' : 'Location'}
                </div>
                <div className="text-xs font-semibold text-stone-800 truncate">
                  {location?.label ||
                    (location?.city && location?.pincode
                      ? `${location.city} ${location.pincode}`
                      : location?.city || location?.pincode || t('locationNotSet'))}
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`min-h-[44px] px-3 inline-flex items-center rounded-lg text-sm font-medium transition ${
                  isActivePath('/')
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {t('home')}
              </Link>
              <Link
                to="/browse"
                className={`min-h-[44px] px-3 inline-flex items-center rounded-lg text-sm font-medium transition ${
                  isActivePath('/browse')
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {t('browse')}
              </Link>
              {user && (
                <Link
                  to="/orders"
                  className={`min-h-[44px] px-3 inline-flex items-center rounded-lg text-sm font-medium transition ${
                    isActivePath('/orders')
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {t('orders')}
                </Link>
              )}
              {user?.role === 'vendor' && (
                <Link
                  to="/vendor-dashboard"
                  className={`min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold transition ${
                    isActivePath('/vendor-dashboard')
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <Store className="w-4 h-4" aria-hidden="true" />
                  <span>{t('vendorConsole')}</span>
                </Link>
              )}
            </nav>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
              aria-label="Switch language between English and Kannada"
              className="min-h-[44px] px-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-xs font-bold text-stone-700 inline-flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>{language === 'en' ? 'ಕನ್ನಡ' : 'EN'}</span>
            </button>

            {/* Cart Link */}
            <Link
              to="/cart"
              aria-label={`${t('cart')} (${cartItemCount} items)`}
              className="min-h-[44px] px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold inline-flex items-center gap-2 transition shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">
                {cartItemCount > 0 ? `₹${cart.bill?.total || 0}` : t('cart')}
              </span>
              {cartItemCount > 0 && (
                <span className="bg-white text-emerald-800 text-xs font-extrabold px-1.5 py-0.5 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Auth / Account */}
            {user ? (
              <Link
                to="/account"
                aria-label={t('account')}
                className="hidden md:inline-flex min-h-[44px] px-3 items-center gap-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-sm font-medium text-stone-800"
              >
                <UserIcon className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span className="max-w-[110px] truncate">{user.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="min-h-[44px] px-3 inline-flex items-center rounded-xl border border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-sm font-semibold"
              >
                {t('signIn')}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-50 max-w-sm bg-stone-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3 text-sm"
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="p-1 text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-5">{children}</main>

      {/* Footer (Desktop) */}
      <footer className="hidden md:block border-t border-stone-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            <strong className="text-stone-800">VenderSathi (ವೆಂಡರ್ ಸಾಥಿ)</strong> — Direct local
            street vendor shopping & neighborhood delivery.
          </div>
          <div className="flex items-center gap-5">
            <Link to="/legal" className="hover:text-emerald-700 underline-offset-2 hover:underline">
              {t('privacyAndTerms')}
            </Link>
            <Link
              to="/account?tab=support"
              className="hover:text-emerald-700 underline-offset-2 hover:underline"
            >
              {t('supportCenter')}
            </Link>
            {!user && (
              <Link
                to="/auth?mode=register&role=vendor"
                className="text-emerald-700 font-semibold hover:underline"
              >
                {t('becomeVendor')}
              </Link>
            )}
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-200 grid grid-cols-5 h-16"
      >
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            isActivePath('/') ? 'text-emerald-700 font-bold' : 'text-stone-500'
          }`}
        >
          <Home className="w-5 h-5" aria-hidden="true" />
          <span>{t('home')}</span>
        </Link>
        <Link
          to="/browse"
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            isActivePath('/browse') ? 'text-emerald-700 font-bold' : 'text-stone-500'
          }`}
        >
          <Search className="w-5 h-5" aria-hidden="true" />
          <span>{t('browse')}</span>
        </Link>
        <Link
          to="/cart"
          className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            isActivePath('/cart') ? 'text-emerald-700 font-bold' : 'text-stone-500'
          }`}
        >
          <ShoppingBag className="w-5 h-5" aria-hidden="true" />
          {cartItemCount > 0 && (
            <span className="absolute top-1.5 right-5 bg-emerald-700 text-white text-[10px] font-bold px-1.5 rounded-full">
              {cartItemCount}
            </span>
          )}
          <span>{t('cart')}</span>
        </Link>
        <Link
          to={user ? '/orders' : '/auth'}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            isActivePath('/orders') ? 'text-emerald-700 font-bold' : 'text-stone-500'
          }`}
        >
          <ClipboardList className="w-5 h-5" aria-hidden="true" />
          <span>{t('orders')}</span>
        </Link>
        <Link
          to={
            user?.role === 'vendor'
              ? '/vendor-dashboard'
              : user
                ? '/account'
                : '/auth'
          }
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            isActivePath('/account') || isActivePath('/vendor-dashboard')
              ? 'text-emerald-700 font-bold'
              : 'text-stone-500'
          }`}
        >
          {user?.role === 'vendor' ? (
            <Store className="w-5 h-5" aria-hidden="true" />
          ) : (
            <UserIcon className="w-5 h-5" aria-hidden="true" />
          )}
          <span>{user?.role === 'vendor' ? t('vendorConsole') : t('account')}</span>
        </Link>
      </nav>

      {/* Location Picker Modal */}
      {locationModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-modal-title"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 id="location-modal-title" className="text-lg font-bold text-stone-900">
                {t('setLocation')}
              </h2>
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                aria-label="Close location modal"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Browser GPS Option */}
            <button
              type="button"
              onClick={handleRequestGps}
              disabled={geoLoading}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <Navigation className="w-4 h-4" aria-hidden="true" />
              <span>{geoLoading ? 'Detecting GPS...' : t('useCurrentLocation')}</span>
            </button>

            {geoError && (
              <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-xl">
                {geoError}
              </p>
            )}

            {/* Saved Addresses Quick Pick */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  {t('savedAddresses')}
                </div>
                <div className="space-y-1.5">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => selectSavedAddressForLocation(addr)}
                      className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition"
                    >
                      <div className="text-xs font-bold text-stone-800">
                        {addr.label} • {addr.area}, {addr.city} ({addr.pincode})
                      </div>
                      <div className="text-xs text-stone-500 truncate">{addr.addressLine1}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Pincode / City Form */}
            <form onSubmit={handleManualLocationSave} className="space-y-3 pt-1 border-t border-stone-100">
              <div className="text-xs font-semibold text-stone-600">{t('enterManually')}</div>
              <div>
                <label htmlFor="loc-city" className="block text-xs font-medium text-stone-700 mb-1">
                  City / Town
                </label>
                <input
                  id="loc-city"
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder={t('cityPlaceholder')}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label htmlFor="loc-pincode" className="block text-xs font-medium text-stone-700 mb-1">
                  Pincode
                </label>
                <input
                  id="loc-pincode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('pincodePlaceholder')}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label htmlFor="loc-area" className="block text-xs font-medium text-stone-700 mb-1">
                  Area / Locality (Optional)
                </label>
                <input
                  id="loc-area"
                  type="text"
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  placeholder={t('areaPlaceholder')}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm"
                >
                  {t('saveLocation')}
                </button>
                {location && (
                  <button
                    type="button"
                    onClick={() => {
                      updateLocation(null);
                      setLocationModalOpen(false);
                    }}
                    className="min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                  >
                    {t('clearLocation')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Vendor Cart Switch Confirmation Modal */}
      {vendorConflictModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-switch-title"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="vendor-switch-title" className="text-base font-bold text-stone-900">
                  Replace basket items from {vendorConflictModal.currentVendorName}?
                </h2>
                <p className="text-sm text-stone-600 mt-1">
                  Each order is fulfilled directly by a single local vendor. Your basket currently
                  has items from <strong>{vendorConflictModal.currentVendorName}</strong>. Would you
                  like to clear it and add <strong>{vendorConflictModal.product.name}</strong> from{' '}
                  <strong>{vendorConflictModal.newVendorName}</strong>?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVendorConflictModal(null)}
                className="min-h-[44px] px-4 rounded-xl border border-stone-300 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                Keep Current Basket
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await addToCart(
                    vendorConflictModal.product,
                    vendorConflictModal.quantity,
                    true
                  );
                  if (res?.requiresAuth) navigate('/auth');
                }}
                className="min-h-[44px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold"
              >
                Replace & Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
