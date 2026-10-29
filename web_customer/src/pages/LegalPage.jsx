import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function LegalPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <article className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 text-sm text-stone-700 leading-relaxed">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-emerald-700 shrink-0" />
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900">
              VenderSathi Privacy Policy & Terms of Service
            </h1>
            <p className="text-xs text-stone-500">Effective Date: October 2026</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-stone-900">1. Direct Neighborhood Marketplace</h2>
          <p>
            VenderSathi connects customers directly with independent neighborhood street cart
            sellers, bicycle and two-wheeler vendors, street stalls, and small local grocery shops.
            Product prices, stock quantities, and service areas are set directly by each registered
            vendor.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-stone-900">2. Location & Personal Data Privacy</h2>
          <p>
            Your account name, phone number, and saved delivery addresses are used strictly to
            validate vendor delivery serviceability, fulfill orders, and enable direct order
            coordination with your chosen vendor. Browser GPS coordinates are requested only when
            you explicitly click “Use Current GPS Location” and are never fabricated or shared with
            third-party advertisers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-stone-900">
            3. Transparent Pricing & Payment Integrity
          </h2>
          <p>
            VenderSathi calculates all order totals authoritatively on the server from live vendor
            catalog prices. If a vendor updates an item’s price while it is in your basket,
            VenderSathi notifies you before checkout so your payable total is never silently
            changed. Cash on Delivery (COD) and Pay at Pickup orders remain marked Payment Pending
            until collection is confirmed. Raw card credentials are never stored by VenderSathi.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-stone-900">
            4. Cancellations, Freshness & Issue Resolution
          </h2>
          <p>
            Customers may self-cancel orders while in Placed or Accepted status prior to packing
            and dispatch. For quality or delivery concerns on perishable produce, customers can
            message the vendor directly on the order page or file a tracked ticket in the Help &
            Issue Reporting center.
          </p>
        </section>
      </article>
    </div>
  );
}
