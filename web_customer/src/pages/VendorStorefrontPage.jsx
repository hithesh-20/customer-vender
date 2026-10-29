import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Star,
  Truck,
  Store,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { VENDOR_TYPE_LABELS } from '../i18n/translations';
import ProductCard from '../components/ProductCard';

export default function VendorStorefrontPage() {
  const { vendorId } = useParams();
  const { language, t, location } = useApp();

  const [data, setData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('catalog');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStorefront = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (location?.pincode) qs.set('pincode', location.pincode);
      if (location?.city) qs.set('city', location.city);
      if (typeof location?.latitude === 'number') qs.set('lat', String(location.latitude));
      if (typeof location?.longitude === 'number') qs.set('lng', String(location.longitude));

      const res = await api.get(`/users/${vendorId}/storefront?${qs.toString()}`);
      setData(res?.data || null);
    } catch (err) {
      setError(err.message || 'Unable to load vendor storefront.');
    } finally {
      setLoading(false);
    }
  }, [vendorId, location]);

  useEffect(() => {
    loadStorefront();
  }, [loadStorefront]);

  if (loading) {
    return <div className="h-64 rounded-2xl bg-stone-200 animate-pulse" aria-busy="true" />;
  }

  if (error || !data?.vendor) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-red-700">{error || 'Vendor not found'}</p>
        <Link
          to="/browse?tab=vendors"
          className="inline-flex min-h-[44px] px-4 items-center rounded-xl bg-emerald-700 text-white text-sm font-bold"
        >
          Back to Vendors
        </Link>
      </div>
    );
  }

  const { vendor, products = [], reviews = [], serviceability } = data;
  const settings = vendor.settings || {};
  const typeLabel =
    VENDOR_TYPE_LABELS[vendor.vendorType]?.[language] ||
    vendor.vendorType ||
    'Local Vendor';

  const productCategories = [
    'All',
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  const visibleProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      <Link
        to="/browse?tab=vendors"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>All Local Vendors</span>
      </Link>

      {/* Vendor Profile Header */}
      <section className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                {typeLabel}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                  vendor.isOnline
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    vendor.isOnline ? 'bg-emerald-600' : 'bg-stone-500'
                  }`}
                />
                {vendor.isOnline ? t('onlineNow') : t('offlineNow')}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-stone-900">
              {language === 'kn' && vendor.shopNameKannada
                ? vendor.shopNameKannada
                : vendor.shopName || vendor.name}
            </h1>
            {vendor.description && (
              <p className="text-sm text-stone-600 max-w-2xl">{vendor.description}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {vendor.reviewCount > 0 && typeof vendor.rating === 'number' ? (
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-sm font-bold text-emerald-900">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{vendor.rating.toFixed(1)}</span>
                <span className="text-xs font-normal text-stone-600">
                  ({vendor.reviewCount} verified review{vendor.reviewCount === 1 ? '' : 's'})
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold bg-stone-100 text-stone-600 px-3 py-1.5 rounded-xl">
                {t('newVendor')} • No reviews yet
              </span>
            )}

            {vendor.phone && (
              <a
                href={`tel:${vendor.phone}`}
                className="min-h-[40px] px-3.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-800 inline-flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span>Call Vendor ({vendor.phone})</span>
              </a>
            )}
          </div>
        </div>

        {/* Service Area & Delivery Terms */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-stone-100 text-xs">
          <div className="p-3 rounded-2xl bg-stone-50 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <div className="font-bold text-stone-800">Service Area</div>
              <div className="text-stone-600 mt-0.5">
                {[vendor.shopAddress, vendor.serviceArea, vendor.city, vendor.pincode]
                  .filter(Boolean)
                  .join(', ') || 'Local Neighborhood'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <div className="font-bold text-stone-800">Delivery Eligibility</div>
              <div className="text-stone-600 mt-0.5">
                {settings.homeDelivery !== false ? (
                  <>
                    Fee: ₹{settings.deliveryCharge ?? 0}
                    {settings.freeDeliveryAbove
                      ? ` • Free above ₹${settings.freeDeliveryAbove}`
                      : ''}
                    {settings.minOrderAmount > 0
                      ? ` • Min Order ₹${settings.minOrderAmount}`
                      : ''}
                  </>
                ) : (
                  'Home delivery not enabled'
                )}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 flex items-start gap-2.5">
            <Store className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <div className="font-bold text-stone-800">Fulfillment Modes</div>
              <div className="text-stone-600 mt-0.5">
                {[
                  settings.homeDelivery !== false ? 'Home Delivery' : null,
                  settings.pickupAvailable !== false ? 'Self-Pickup' : null,
                ]
                  .filter(Boolean)
                  .join(' & ')}
                {settings.codEnabled !== false ? ' • COD Accepted' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Honest Serviceability & Offline Warnings */}
        {!vendor.isOnline && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 flex items-center gap-2.5 text-xs text-amber-900 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              This vendor is currently offline. You can browse their catalog, and ordering will
              unlock as soon as the vendor goes online.
            </span>
          </div>
        )}

        {serviceability && (
          <div
            className={`rounded-2xl p-3.5 flex items-center gap-2.5 text-xs font-medium border ${
              serviceability.serviceable
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {serviceability.serviceable ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>
              {serviceability.serviceable
                ? `Delivers to your selected location${
                    typeof serviceability.distanceKm === 'number'
                      ? ` (${serviceability.distanceKm} km away)`
                      : ''
                  }${
                    serviceability.estimatedMinutes
                      ? ` • Est. ${serviceability.estimatedMinutes.min}–${serviceability.estimatedMinutes.max} mins`
                      : ''
                  }`
                : serviceability.reason}
            </span>
          </div>
        )}
      </section>

      {/* Catalog / Reviews Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`min-h-[44px] px-4 text-sm font-bold border-b-2 transition ${
            activeTab === 'catalog'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Catalog ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`min-h-[44px] px-4 text-sm font-bold border-b-2 transition ${
            activeTab === 'reviews'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Customer Reviews ({reviews.length})
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <div className="space-y-4">
          {productCategories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {productCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[38px] px-3.5 rounded-full text-xs font-bold border shrink-0 transition ${
                    selectedCategory === cat
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {visibleProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-sm text-stone-500">
              This vendor has not listed active items in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {visibleProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={{ ...prod, vendor }}
                  hideVendorLink
                />
              ))}
            </div>
          )}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-sm text-stone-500">
          No customer reviews yet. Reviews appear only from verified delivered orders.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-stone-900">{rev.customerName}</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {rev.rating}/5
                </span>
              </div>
              {rev.comment && <p className="text-sm text-stone-600">{rev.comment}</p>}
              <div className="text-[11px] text-stone-400">
                {new Date(rev.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
