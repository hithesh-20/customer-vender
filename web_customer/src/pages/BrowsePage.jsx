import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import VendorCard from '../components/VendorCard';

const VENDOR_TYPES = [
  'All',
  'Street Cart',
  'Bicycle Vendor',
  'Motorcycle Vendor',
  'Street Stall',
  'Neighborhood Shop',
];

export default function BrowsePage() {
  const { language, t, location } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'vendors' ? 'vendors' : 'products'
  );
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'All'
  );
  const [vendorType, setVendorType] = useState(searchParams.get('vendorType') || 'All');
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true');
  const [onlineOnly, setOnlineOnly] = useState(searchParams.get('onlineOnly') === 'true');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/products/categories')
      .then((res) => setCategories(res?.data || []))
      .catch(() => {});
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const prodQs = new URLSearchParams();
      if (q.trim()) prodQs.set('q', q.trim());
      if (selectedCategory !== 'All') prodQs.set('category', selectedCategory);
      if (vendorType !== 'All') prodQs.set('vendorType', vendorType);
      if (inStockOnly) prodQs.set('inStock', 'true');
      if (onlineOnly) prodQs.set('onlineVendorsOnly', 'true');
      if (maxPrice) prodQs.set('maxPrice', maxPrice);
      if (sort !== 'latest') prodQs.set('sort', sort);
      if (location?.city) prodQs.set('city', location.city);
      if (location?.pincode) prodQs.set('pincode', location.pincode);
      prodQs.set('limit', '60');

      const vendorQs = new URLSearchParams();
      if (q.trim()) vendorQs.set('q', q.trim());
      if (vendorType !== 'All') vendorQs.set('vendorType', vendorType);
      if (onlineOnly) vendorQs.set('onlineOnly', 'true');
      if (location?.city) vendorQs.set('city', location.city);
      if (location?.pincode) vendorQs.set('pincode', location.pincode);
      if (typeof location?.latitude === 'number') vendorQs.set('lat', String(location.latitude));
      if (typeof location?.longitude === 'number') vendorQs.set('lng', String(location.longitude));

      const [prodRes, vendorRes] = await Promise.all([
        api.get(`/products?${prodQs.toString()}`),
        api.get(`/users/nearby?${vendorQs.toString()}`),
      ]);

      setProducts(prodRes?.data || []);
      setVendors(vendorRes?.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load search results.');
    } finally {
      setLoading(false);
    }
  }, [q, selectedCategory, vendorType, inStockOnly, onlineOnly, maxPrice, sort, location]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const syncQuery = (overrides = {}) => {
    const next = new URLSearchParams();
    const state = {
      tab: activeTab,
      q,
      category: selectedCategory,
      vendorType,
      inStock: inStockOnly,
      onlineOnly,
      maxPrice,
      sort,
      ...overrides,
    };
    if (state.tab === 'vendors') next.set('tab', 'vendors');
    if (state.q) next.set('q', state.q);
    if (state.category && state.category !== 'All') next.set('category', state.category);
    if (state.vendorType && state.vendorType !== 'All') next.set('vendorType', state.vendorType);
    if (state.inStock) next.set('inStock', 'true');
    if (state.onlineOnly) next.set('onlineOnly', 'true');
    if (state.maxPrice) next.set('maxPrice', state.maxPrice);
    if (state.sort && state.sort !== 'latest') next.set('sort', state.sort);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-5">
      {/* Search & Mode Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                syncQuery({ q: e.target.value });
              }}
              aria-label={t('searchPlaceholder')}
              placeholder={t('searchPlaceholder')}
              className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="inline-flex rounded-xl bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('products');
                syncQuery({ tab: 'products' });
              }}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-bold transition ${
                activeTab === 'products'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-stone-600'
              }`}
            >
              Items ({products.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('vendors');
                syncQuery({ tab: 'vendors' });
              }}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-bold transition ${
                activeTab === 'vendors'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-stone-600'
              }`}
            >
              Vendors ({vendors.length})
            </button>
          </div>
        </div>

        {/* Category Filter Strip */}
        {activeTab === 'products' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                syncQuery({ category: 'All' });
              }}
              className={`min-h-[38px] px-3.5 rounded-full text-xs font-bold shrink-0 border transition ${
                selectedCategory === 'All'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id || cat.slug}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.name);
                  syncQuery({ category: cat.name });
                }}
                className={`min-h-[38px] px-3.5 rounded-full text-xs font-bold shrink-0 border transition ${
                  selectedCategory === cat.name
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {language === 'kn' && cat.kannadaName ? cat.kannadaName : cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-stone-100 text-xs">
          <div className="inline-flex items-center gap-1.5 font-semibold text-stone-600">
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Filters:</span>
          </div>

          <select
            aria-label="Filter by vendor type"
            value={vendorType}
            onChange={(e) => {
              setVendorType(e.target.value);
              syncQuery({ vendorType: e.target.value });
            }}
            className="min-h-[40px] px-3 rounded-xl border border-stone-300 bg-white text-stone-800 font-medium"
          >
            {VENDOR_TYPES.map((vt) => (
              <option key={vt} value={vt}>
                {vt === 'All' ? 'All Vendor Types' : vt}
              </option>
            ))}
          </select>

          <label className="min-h-[40px] px-3 rounded-xl border border-stone-300 inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => {
                setOnlineOnly(e.target.checked);
                syncQuery({ onlineOnly: e.target.checked });
              }}
              className="rounded text-emerald-700 focus:ring-emerald-600"
            />
            <span className="font-medium text-stone-800">Online Vendors Only</span>
          </label>

          {activeTab === 'products' && (
            <>
              <label className="min-h-[40px] px-3 rounded-xl border border-stone-300 inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    syncQuery({ inStock: e.target.checked });
                  }}
                  className="rounded text-emerald-700 focus:ring-emerald-600"
                />
                <span className="font-medium text-stone-800">In Stock Only</span>
              </label>

              <input
                type="number"
                min="1"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  syncQuery({ maxPrice: e.target.value });
                }}
                aria-label="Maximum price in Rupees"
                placeholder="Max ₹ Price"
                className="min-h-[40px] w-28 px-3 rounded-xl border border-stone-300 text-stone-800"
              />

              <select
                aria-label="Sort items"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  syncQuery({ sort: e.target.value });
                }}
                className="min-h-[40px] px-3 rounded-xl border border-stone-300 bg-white text-stone-800 font-medium ml-auto"
              >
                <option value="latest">Sort: Latest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm text-red-800">{error}</span>
          <button
            type="button"
            onClick={fetchResults}
            className="min-h-[40px] px-3.5 rounded-xl bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('retry')}</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-stone-200/70 animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'products' ? (
        products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center space-y-2">
            <h2 className="text-lg font-bold text-stone-900">{t('noProductsYetTitle')}</h2>
            <p className="text-sm text-stone-500 max-w-md mx-auto">{t('noProductsYetDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )
      ) : vendors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center space-y-2">
          <h2 className="text-lg font-bold text-stone-900">{t('noVendorsYetTitle')}</h2>
          <p className="text-sm text-stone-500 max-w-md mx-auto">{t('noVendorsYetDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
}
