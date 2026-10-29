import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Store,
  Leaf,
  Carrot,
  Apple,
  Flame,
  Wheat,
  Droplets,
  Sparkles,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import VendorCard from '../components/VendorCard';
import ProductCard from '../components/ProductCard';

const CATEGORY_ICON_MAP = {
  carrot: Carrot,
  apple: Apple,
  leaf: Leaf,
  flame: Flame,
  wheat: Wheat,
  droplet: Droplets,
  sparkles: Sparkles,
};

export default function HomePage() {
  const { language, t, location, setLocationModalOpen, user } = useApp();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHomeData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const locParams = new URLSearchParams();
      if (location?.pincode) locParams.set('pincode', location.pincode);
      if (location?.city) locParams.set('city', location.city);
      if (typeof location?.latitude === 'number') locParams.set('lat', String(location.latitude));
      if (typeof location?.longitude === 'number') locParams.set('lng', String(location.longitude));

      const prodParams = new URLSearchParams();
      prodParams.set('limit', '24');
      if (location?.city) prodParams.set('city', location.city);
      if (location?.pincode) prodParams.set('pincode', location.pincode);

      const [catRes, vendorRes, prodRes] = await Promise.all([
        api.get('/products/categories'),
        api.get(`/users/nearby?${locParams.toString()}`),
        api.get(`/products?${prodParams.toString()}`),
      ]);

      setCategories(catRes?.data || []);
      setVendors(vendorRes?.data || []);
      setProducts(prodRes?.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load nearby vendors and items.');
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : '/browse');
  };

  const onlineVendors = vendors.filter((v) => v.isOnline && v.serviceable !== false);
  const availableTodayProducts = products.filter(
    (p) => p.inStock && p.vendor?.isOnline
  );
  const freshProduce = products.filter((p) =>
    ['Vegetables', 'Fruits', 'Leafy Greens'].includes(p.category)
  );
  const dailyEssentials = products.filter(
    (p) => !['Vegetables', 'Fruits', 'Leafy Greens'].includes(p.category)
  );

  return (
    <div className="space-y-8">
      {/* Welcome / Onboarding & Search Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-stone-900 text-white p-5 sm:p-8 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-emerald-700/70 text-emerald-100 border border-emerald-500/40 px-3 py-1 rounded-full">
            <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
            {t('welcomeBadge')}
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            {t('welcomeTitle')}
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            {t('welcomeSubtitle')}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-1 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search
                className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label={t('searchPlaceholder')}
                placeholder={t('searchPlaceholder')}
                className="w-full min-h-[48px] pl-11 pr-4 rounded-2xl bg-white text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              type="submit"
              className="min-h-[48px] px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-sm transition"
            >
              {t('browse')}
            </button>
          </form>

          {/* Quick Location & Partner Links */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="min-h-[40px] px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold inline-flex items-center gap-1.5 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>
                {location
                  ? `Delivering near: ${location.label || location.city || location.pincode}`
                  : t('setLocation')}
              </span>
            </button>

            {!user && (
              <Link
                to="/auth?mode=register&role=vendor"
                className="min-h-[40px] px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-semibold inline-flex items-center gap-1.5 transition"
              >
                <Store className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('becomeVendor')}</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Error State with Retry */}
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-sm font-bold text-red-900">Could not load marketplace data</h2>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadHomeData}
            className="min-h-[44px] px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>{t('retry')}</span>
          </button>
        </div>
      )}

      {/* Categories Section */}
      <section aria-labelledby="categories-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="categories-heading" className="text-lg font-extrabold text-stone-900">
            {t('categoriesTitle')}
          </h2>
          <Link
            to="/browse"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
          >
            <span>{t('viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {categories.map((cat) => {
            const IconComp = CATEGORY_ICON_MAP[cat.icon] || Leaf;
            return (
              <Link
                key={cat.id || cat.slug}
                to={`/browse?category=${encodeURIComponent(cat.name)}`}
                className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-500 hover:shadow-sm p-3.5 flex flex-col items-start justify-between gap-2 transition min-h-[96px]"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: cat.color || '#15803D' }}
                >
                  <IconComp className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 leading-tight">
                    {language === 'kn' && cat.kannadaName ? cat.kannadaName : cat.name}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {cat.inStockCount || 0} {language === 'kn' ? 'ಲಭ್ಯ' : 'in stock'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-44 rounded-2xl bg-stone-200/70 animate-pulse border border-stone-200"
            />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        /* Honest Zero-Vendor Empty State */
        <section className="bg-white rounded-3xl border border-stone-200 p-8 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <Store className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-extrabold text-stone-900">{t('noVendorsYetTitle')}</h2>
          <p className="text-sm text-stone-600 leading-relaxed">{t('noVendorsYetDesc')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {location && (
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="min-h-[44px] px-4 rounded-xl border border-stone-300 hover:bg-stone-100 text-sm font-semibold text-stone-800"
              >
                Change Location Filter
              </button>
            )}
            <Link
              to={
                user?.role === 'vendor'
                  ? '/vendor-dashboard'
                  : '/auth?mode=register&role=vendor'
              }
              className="min-h-[44px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold inline-flex items-center gap-2"
            >
              <Store className="w-4 h-4" aria-hidden="true" />
              <span>
                {user?.role === 'vendor' ? 'Open Vendor Hub' : t('becomeVendor')}
              </span>
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Available Today Near You */}
          {availableTodayProducts.length > 0 && (
            <section aria-labelledby="available-today-heading" className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    id="available-today-heading"
                    className="text-lg font-extrabold text-stone-900"
                  >
                    {t('availableTodayTitle')}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Live stock from {onlineVendors.length} online neighborhood vendor
                    {onlineVendors.length === 1 ? '' : 's'}
                  </p>
                </div>
                <Link
                  to="/browse?inStock=true&onlineOnly=true"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                >
                  <span>{t('viewAll')}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {availableTodayProducts.slice(0, 8).map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </section>
          )}

          {/* Nearby Local Vendors */}
          <section aria-labelledby="nearby-vendors-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 id="nearby-vendors-heading" className="text-lg font-extrabold text-stone-900">
                {t('nearbyVendorsTitle')}
              </h2>
              <Link
                to="/browse?tab=vendors"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
              >
                <span>{t('viewAll')}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.slice(0, 6).map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          </section>

          {/* Fresh Vegetables, Fruits & Leafy Greens */}
          {freshProduce.length > 0 && (
            <section aria-labelledby="fresh-produce-heading" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 id="fresh-produce-heading" className="text-lg font-extrabold text-stone-900">
                  {t('freshProduceTitle')}
                </h2>
                <Link
                  to="/browse?category=Vegetables"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                >
                  <span>{t('viewAll')}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {freshProduce.slice(0, 8).map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </section>
          )}

          {/* Spices & Daily Essentials */}
          {dailyEssentials.length > 0 && (
            <section aria-labelledby="daily-essentials-heading" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2
                  id="daily-essentials-heading"
                  className="text-lg font-extrabold text-stone-900"
                >
                  {t('dailyEssentialsTitle')}
                </h2>
                <Link
                  to="/browse?category=Grocery%20Essentials"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                >
                  <span>{t('viewAll')}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {dailyEssentials.slice(0, 8).map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
