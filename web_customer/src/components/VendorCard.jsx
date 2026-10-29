import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Truck, Store, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VENDOR_TYPE_LABELS } from '../i18n/translations';

export default function VendorCard({ vendor }) {
  const { language, t } = useApp();
  const typeLabel =
    VENDOR_TYPE_LABELS[vendor.vendorType]?.[language] ||
    vendor.vendorType ||
    'Local Vendor';

  const settings = vendor.settings || {};
  const hasGenuineRating = vendor.reviewCount > 0 && typeof vendor.rating === 'number';

  return (
    <Link
      to={`/vendor/${vendor.id}`}
      className="group block bg-white rounded-2xl border border-stone-200 hover:border-emerald-400 hover:shadow-md transition p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
              {typeLabel}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                vendor.isOnline
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  vendor.isOnline ? 'bg-emerald-600' : 'bg-stone-500'
                }`}
              />
              {vendor.isOnline ? t('onlineNow') : t('offlineNow')}
            </span>
          </div>

          <h3 className="mt-2 font-bold text-base text-stone-900 group-hover:text-emerald-800 truncate">
            {language === 'kn' && vendor.shopNameKannada
              ? vendor.shopNameKannada
              : vendor.shopName || vendor.name}
          </h3>
          {vendor.shopNameKannada && language === 'en' && (
            <p className="text-xs text-stone-500 truncate">{vendor.shopNameKannada}</p>
          )}
        </div>

        {/* Genuine Rating Only */}
        <div className="shrink-0 text-right">
          {hasGenuineRating ? (
            <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-900 px-2 py-1 rounded-lg text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
              <span>{vendor.rating.toFixed(1)}</span>
              <span className="text-stone-500 font-normal">({vendor.reviewCount})</span>
            </div>
          ) : (
            <span className="inline-block text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded-lg">
              {t('newVendor')}
            </span>
          )}
        </div>
      </div>

      {/* Location & Service Area */}
      <div className="flex items-center gap-1.5 text-xs text-stone-600">
        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
        <span className="truncate">
          {[vendor.serviceArea, vendor.city, vendor.pincode].filter(Boolean).join(' • ') ||
            'Neighborhood Seller'}
        </span>
        {typeof vendor.distanceKm === 'number' && (
          <span className="ml-auto shrink-0 font-semibold text-stone-700">
            {vendor.distanceKm} km
          </span>
        )}
      </div>

      {/* Categories offered */}
      {Array.isArray(vendor.categories) && vendor.categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {vendor.categories.slice(0, 4).map((cat) => (
            <span
              key={cat}
              className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Delivery & Fulfillment Info */}
      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
        <div className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
          {settings.homeDelivery !== false ? (
            <span>
              {settings.deliveryCharge === 0
                ? 'Free Delivery'
                : `₹${settings.deliveryCharge ?? 0} ${t('deliveryFee')}`}
              {settings.freeDeliveryAbove
                ? ` (${t('freeDeliveryAbove')} ₹${settings.freeDeliveryAbove})`
                : ''}
            </span>
          ) : (
            <span>Self-Pickup Only</span>
          )}
        </div>

        {typeof vendor.inStockCount === 'number' && (
          <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            {vendor.inStockCount} {language === 'kn' ? 'ಲಭ್ಯ' : 'items live'}
          </span>
        )}
      </div>

      {vendor.serviceable === false && vendor.serviceabilityNote && (
        <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
          {vendor.serviceabilityNote}
        </div>
      )}
    </Link>
  );
}
