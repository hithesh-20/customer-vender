import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Plus, Minus, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppContext';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { language, t, cart, addToCart, updateCartItemQuantity } = useApp();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${productId}`)
      .then((res) => setProduct(res?.data || null))
      .catch((err) => setError(err.message || 'Product not found'))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return <div className="h-64 rounded-2xl bg-stone-200 animate-pulse" aria-busy="true" />;
  }

  if (error || !product) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-red-700">{error || 'Product not found'}</p>
        <Link
          to="/browse"
          className="inline-flex min-h-[44px] px-4 items-center rounded-xl bg-emerald-700 text-white text-sm font-bold"
        >
          Browse Items
        </Link>
      </div>
    );
  }

  const cartItem = (cart.items || []).find((i) => i.productId === product.id);
  const minQty = Number(product.minOrderQty || 1);
  const step = minQty < 1 ? minQty : 1;
  const vendorOnline = product.vendor ? Boolean(product.vendor.isOnline) : true;
  const canPurchase = Boolean(product.inStock && Number(product.stock) >= minQty && vendorOnline);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-stone-100 text-stone-700">
            {product.category}
          </span>
          {product.inStock ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {product.stock} {product.unit} {t('inStock')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-800 bg-red-50 px-3 py-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />
              {t('outOfStock')}
            </span>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            {language === 'kn' && product.kannadaName ? product.kannadaName : product.name}
          </h1>
          {product.kannadaName && language === 'en' && (
            <p className="text-base text-stone-500 mt-0.5">{product.kannadaName}</p>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-stone-900">₹{product.price}</span>
          <span className="text-sm font-semibold text-stone-500">per {product.unit}</span>
          {product.mrp && Number(product.mrp) > Number(product.price) && (
            <span className="text-sm text-stone-400 line-through ml-2">MRP ₹{product.mrp}</span>
          )}
        </div>

        {product.description && (
          <p className="text-sm text-stone-600 leading-relaxed">{product.description}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-stone-50">
            <div className="text-stone-500">Selling Unit</div>
            <div className="font-bold text-stone-900 mt-0.5">{product.unit}</div>
          </div>
          <div className="p-3 rounded-xl bg-stone-50">
            <div className="text-stone-500">Minimum Order</div>
            <div className="font-bold text-stone-900 mt-0.5">
              {minQty} {product.unit}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-stone-50">
            <div className="text-stone-500">Freshness</div>
            <div className="font-bold text-stone-900 mt-0.5">
              {product.perishable ? 'Fresh Daily Produce' : 'Packaged / Dry Staple'}
            </div>
          </div>
        </div>

        {product.vendor && (
          <Link
            to={`/vendor/${product.vendor.id}`}
            className="p-4 rounded-2xl border border-stone-200 hover:border-emerald-400 flex items-center justify-between gap-3 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-900">
                  {product.vendor.shopName || product.vendor.name}
                </div>
                <div className="text-xs text-stone-500">
                  {product.vendor.vendorType || 'Local Vendor'} •{' '}
                  {product.vendor.isOnline ? 'Online Now' : 'Currently Offline'}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700">Visit Storefront →</span>
          </Link>
        )}

        <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-4">
          {cartItem ? (
            <div className="inline-flex items-center rounded-2xl border-2 border-emerald-700 bg-emerald-50">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => {
                  const next = Number((cartItem.quantity - step).toFixed(2));
                  updateCartItemQuantity(cartItem.cartItemId, next < minQty ? 0 : next);
                }}
                className="min-h-[48px] min-w-[48px] flex items-center justify-center text-emerald-900"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 text-base font-extrabold text-emerald-950">
                {cartItem.quantity} {product.unit}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={cartItem.quantity + step > Number(product.stock)}
                onClick={() =>
                  updateCartItemQuantity(
                    cartItem.cartItemId,
                    Number((cartItem.quantity + step).toFixed(2))
                  )
                }
                className="min-h-[48px] min-w-[48px] flex items-center justify-center text-emerald-900 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!canPurchase}
              onClick={async () => {
                const res = await addToCart(product, minQty);
                if (res?.requiresAuth) navigate('/auth');
              }}
              className="min-h-[48px] px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-200 disabled:text-stone-500 text-white font-extrabold text-sm inline-flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>
                {!product.inStock
                  ? t('outOfStock')
                  : !vendorOnline
                    ? 'Vendor Currently Offline'
                    : `Add ${minQty} ${product.unit} to Basket`}
              </span>
            </button>
          )}

          {cartItem && (
            <Link
              to="/cart"
              className="min-h-[48px] px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm inline-flex items-center"
            >
              Go to Basket →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
