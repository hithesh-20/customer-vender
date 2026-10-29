import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  api,
  getStoredToken,
  setStoredSession,
  clearStoredSession,
  connectRealtimeSocket,
  disconnectRealtimeSocket,
} from '../api';
import { translations } from '../i18n/translations';

const AppContext = createContext(null);

function loadInitialLocation() {
  try {
    const raw = localStorage.getItem('vs_location');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.pincode || parsed.city || parsed.latitude !== null)) {
      return parsed;
    }
  } catch (_) {
    // ignore corrupt localStorage
  }
  return null;
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('vs_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(Boolean(getStoredToken()));
  const [language, setLanguageState] = useState(
    () => localStorage.getItem('vs_lang') || 'en'
  );
  const [location, setLocationState] = useState(loadInitialLocation);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const [capabilities, setCapabilities] = useState({
    smsOtpEnabled: false,
    onlinePaymentsEnabled: false,
    liveMapsEnabled: false,
  });

  const [cart, setCart] = useState({
    items: [],
    vendor: null,
    bill: { subtotal: 0, deliveryCharge: 0, total: 0, minOrderShortfall: 0 },
    priceChanges: [],
    stockWarnings: [],
  });
  const [cartLoading, setCartLoading] = useState(false);
  const [vendorConflictModal, setVendorConflictModal] = useState(null);

  const [isOnlineNetwork, setIsOnlineNetwork] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast((prev) => (prev && Date.now() - prev.id >= 3800 ? null : prev));
    }, 4000);
  }, []);

  const setLanguage = useCallback(
    async (lang) => {
      const next = lang === 'kn' ? 'kn' : 'en';
      setLanguageState(next);
      localStorage.setItem('vs_lang', next);
      document.documentElement.lang = next;
      if (getStoredToken()) {
        try {
          await api.patch('/users/profile', {
            language: next,
            preferences: { language: next },
          });
        } catch (_) {
          // non-blocking preference sync
        }
      }
    },
    []
  );

  const updateLocation = useCallback((loc) => {
    if (!loc) {
      localStorage.removeItem('vs_location');
      setLocationState(null);
      return;
    }
    localStorage.setItem('vs_location', JSON.stringify(loc));
    setLocationState(loc);
  }, []);

  const t = useCallback(
    (key) => translations[language]?.[key] || translations.en[key] || key,
    [language]
  );

  // Network connectivity listener
  useEffect(() => {
    const onOnline = () => setIsOnlineNetwork(true);
    const onOffline = () => setIsOnlineNetwork(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Fetch capabilities
  useEffect(() => {
    api
      .get('/auth/capabilities')
      .then((res) => {
        if (res?.data) setCapabilities(res.data);
      })
      .catch(() => {});
  }, []);

  // Fetch persistent cart
  const refreshCart = useCallback(
    async (extraQuery = {}) => {
      if (!getStoredToken()) {
        setCart({
          items: [],
          vendor: null,
          bill: { subtotal: 0, deliveryCharge: 0, total: 0, minOrderShortfall: 0 },
          priceChanges: [],
          stockWarnings: [],
        });
        return;
      }
      setCartLoading(true);
      try {
        const params = new URLSearchParams();
        if (extraQuery.fulfillmentType) params.set('fulfillmentType', extraQuery.fulfillmentType);
        if (extraQuery.addressId) params.set('addressId', extraQuery.addressId);
        else if (location) {
          if (location.pincode) params.set('pincode', location.pincode);
          if (location.city) params.set('city', location.city);
          if (typeof location.latitude === 'number') params.set('lat', String(location.latitude));
          if (typeof location.longitude === 'number') params.set('lng', String(location.longitude));
        }
        const qs = params.toString() ? `?${params.toString()}` : '';
        const res = await api.get(`/cart${qs}`);
        if (res?.data) setCart(res.data);
      } catch (_) {
        // handled quietly on background refresh
      } finally {
        setCartLoading(false);
      }
    },
    [location]
  );

  // Validate session on mount
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        if (res?.data) {
          setUser(res.data);
          localStorage.setItem('vs_user', JSON.stringify(res.data));
          if (res.data.language) {
            setLanguageState(res.data.language);
            localStorage.setItem('vs_lang', res.data.language);
          }
          connectRealtimeSocket();
          refreshCart();
        }
      })
      .catch(() => {
        clearStoredSession();
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, [refreshCart]);

  const handleAuthSuccess = useCallback(
    (authPayload) => {
      setStoredSession(authPayload.token, authPayload.refreshToken, authPayload.user);
      setUser(authPayload.user);
      connectRealtimeSocket();
      refreshCart();
    },
    [refreshCart]
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('vs_refresh_token');
      await api.post('/auth/logout', { refreshToken });
    } catch (_) {
      // proceed with client cleanup even if network fails
    } finally {
      clearStoredSession();
      disconnectRealtimeSocket();
      setUser(null);
      setCart({
        items: [],
        vendor: null,
        bill: { subtotal: 0, deliveryCharge: 0, total: 0, minOrderShortfall: 0 },
        priceChanges: [],
        stockWarnings: [],
      });
      showToast('Signed out successfully', 'info');
    }
  }, [showToast]);

  const addToCart = useCallback(
    async (product, quantity, replaceVendorCart = false) => {
      if (!user) {
        showToast('Please sign in to add items to your basket', 'warning');
        return { requiresAuth: true };
      }
      try {
        const res = await api.post('/cart/items', {
          productId: product.id,
          quantity: quantity ?? product.minOrderQty ?? 1,
          replaceVendorCart,
        });
        if (res?.data) {
          setCart(res.data);
          setVendorConflictModal(null);
          showToast(`${product.name} added to basket`, 'success');
        }
        return { ok: true };
      } catch (err) {
        if (err.statusCode === 409 && err.details?.code === 'DIFFERENT_VENDOR_CART') {
          setVendorConflictModal({
            product,
            quantity: quantity ?? product.minOrderQty ?? 1,
            currentVendorName: err.details.currentVendorName,
            newVendorName: err.details.newVendorName,
          });
          return { conflict: true };
        }
        showToast(err.message || 'Could not update cart', 'error');
        return { error: err.message };
      }
    },
    [user, showToast]
  );

  const updateCartItemQuantity = useCallback(
    async (cartItemId, quantity) => {
      try {
        if (quantity <= 0) {
          const res = await api.delete(`/cart/items/${cartItemId}`);
          if (res?.data) setCart(res.data);
          return;
        }
        const res = await api.patch(`/cart/items/${cartItemId}`, { quantity });
        if (res?.data) setCart(res.data);
      } catch (err) {
        showToast(err.message || 'Could not update quantity', 'error');
      }
    },
    [showToast]
  );

  const clearCart = useCallback(async () => {
    try {
      const res = await api.delete('/cart');
      if (res?.data) setCart(res.data);
    } catch (err) {
      showToast(err.message || 'Could not clear cart', 'error');
    }
  }, [showToast]);

  const cartItemCount = (cart.items || []).reduce((acc, i) => acc + 1, 0);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        authLoading,
        handleAuthSuccess,
        logout,
        language,
        setLanguage,
        t,
        location,
        updateLocation,
        locationModalOpen,
        setLocationModalOpen,
        capabilities,
        cart,
        cartLoading,
        cartItemCount,
        refreshCart,
        addToCart,
        updateCartItemQuantity,
        clearCart,
        vendorConflictModal,
        setVendorConflictModal,
        isOnlineNetwork,
        toast,
        setToast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
