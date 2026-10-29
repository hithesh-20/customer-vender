import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ProductCard({ product, hideVendorLink = false }) {
  const { language, t, cart, addToCart, updateCartItemQuantity } = useApp();
  const navigate = useNavigate();

  const cartItem = (cart.items || []).find((i) => i.productId === product.id);
  const minQty = Number(product.minOrderQty || 1);
  const step = minQty < 1 ? minQty : 1;
  const vendorOnline = product.vendor ? Boolean(product.vendor.isOnline) : true;
  const canPurchase = Boolean(product.inStock && Number(product.stock) >= minQty && vendorOnline);

  const handleAdd = async () => {
    const res = await addToCart(product, minQty);
    if (res?.requiresAuth) {
      navigate('/auth');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col justify-between gap-3 hover:border-emerald-300 transition">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
            {product.category}
          </span>
          {!product.inStock ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700">
              {t('outOfStock')}
            </span>
          ) : !vendorOnline ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-200 text-stone-600">
              Vendor Offline
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800">
              {product.stock} {product.unit} left
            </span>
          )}
        </div>

        <Link to={`/product/${product.id}`} className="block group">
          <h3 className="font-bold text-stone-900 group-hover:text-emerald-800 leading-snug">
            {language === 'kn' && product.kannadaName ? product.kannadaName : product.name}
          </h3>
          {product.kannadaName && language === 'en' && (
            <p className="text-xs text-stone-500">{product.kannadaName}</p>
          )}
        </Link>

        {!hideVendorLink && product.vendor && (
          <Link
            to={`/vendor/${product.vendor.id}`}
            className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-emerald-700"
          >
            <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {product.vendor.shopName || product.vendor.name}
            </span>
          </Link>
        )}
      </div>

      <div className="pt-2 border-t border-stone-100 flex items-end justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-stone-900">₹{product.price}</span>
            <span className="text-xs text-stone-500 font-medium">/ {product.unit}</span>
          </div>
          {product.mrp && Number(product.mrp) > Number(product.price) && (
            <div className="text-[11px] text-stone-400 line-through">MRP ₹{product.mrp}</div>
          )}
          {minQty !== 1 && (
            <div className="text-[11px] text-stone-500">
              {t('minQty')}: {minQty} {product.unit}
            </div>
          )}
        </div>

        {cartItem ? (
          <div className="inline-flex items-center rounded-xl border-2 border-emerald-700 bg-emerald-50 overflow-hidden">
            <button
              type="button"
              aria-label={`Decrease quantity of ${product.name}`}
              onClick={() => {
                const nextQty = Number((cartItem.quantity - step).toFixed(2));
                updateCartItemQuantity(
                  cartItem.cartItemId,
                  nextQty < minQty ? 0 : nextQty
                );
              }}
              className="min-h-[42px] min-w-[38px] flex items-center justify-center text-emerald-800 hover:bg-emerald-100"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-extrabold text-emerald-900 min-w-[36px] text-center">
              {cartItem.quantity}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${product.name}`}
              disabled={cartItem.quantity + step > Number(product.stock)}
              onClick={() =>
                updateCartItemQuantity(
                  cartItem.cartItemId,
                  Number((cartItem.quantity + step).toFixed(2))
                )
              }
              className="min-h-[42px] min-w-[38px] flex items-center justify-center text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!canPurchase}
            onClick={handleAdd}
            aria-label={`Add ${product.name} to basket`}
            className="min-h-[44px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-200 disabled:text-stone-500 text-white text-sm font-bold inline-flex items-center gap-1 transition"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{t('addToCart')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
