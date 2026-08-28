import React from 'react';
import { BriefcaseBusiness, Users, Zap, TrendingUp, CreditCard, Star, DollarSign, Globe2, BarChart3, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SalesFeatures() {
  return (
    <div className="pt-20 bg-white">
      {/* Hero Section */}
      <section className="py-24 px-6 relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-emerald-300 mb-8 backdrop-blur-md">
            <BriefcaseBusiness className="w-4 h-4" />
            <span>Sales & Booking Engine</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            Maximize Conversion & Revenue.
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12">
            Dynamic tiered pricing, multi-currency support, fee-free payment gateways, TripAdvisor/Google reviews integration, and native analytics.
          </p>
          <img 
            src="https://i.ibb.co.com/MqFL4jW/image.png" 
            alt="CRM Interface" 
            className="rounded-[2rem] border border-white/10 shadow-2xl mx-auto max-w-5xl w-full object-cover"
          />
        </div>
      </section>

      {/* Feature 1: Dynamic Pricing & Multi Packages */}
      <section className="py-24 px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="font-mono text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">[ YIELD PRICING ENGINE ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">Dynamic Tiered & Multi-Package Pricing</h2>
            <p className="text-lg text-slate-600 mb-8">
              Maximize profit per booking. Create custom tour packages (Standard, Deluxe, VIP) with granular pricing tiers for Adults, Children, and Infants. Set optional add-ons, seasonal rates, and deposit options.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-700 font-medium"><TrendingUp className="w-5 h-5 text-emerald-500" /> Multi Package Options: Standard, Deluxe, Private VIP</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Users className="w-5 h-5 text-emerald-500" /> Multi Tier Rates: Adult, Child, and Infant pricing tiers</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Zap className="w-5 h-5 text-emerald-500" /> Add-on Upsells: Equipment rentals, hotel transfers, lunch upgrades</li>
            </ul>
          </motion.div>
          <div className="relative">
            <img src="https://i.ibb.co.com/V0PsRmTM/image.png" alt="Pricing Engine" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full" />
          </div>
        </div>
      </section>

      {/* Feature 2: Integrated Payment Gateways & Multi Currency */}
      <section className="py-24 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <img src="https://i.ibb.co.com/kVMfQVSV/image.png" alt="Checkout Funnel" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full max-w-sm mx-auto object-cover" />
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
            <div className="font-mono text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">[ GLOBAL PAYMENT GATEWAYS ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">Multi Currency & Integrated Payments</h2>
            <p className="text-lg text-slate-600 mb-8">
              Accept money globally with zero platform commission fees. Integrate directly with Stripe and PayPal, accept bank transfers, or enable cash on arrival. International guests see real-time currency conversion into their home currency.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-700 font-medium"><CreditCard className="w-5 h-5 text-emerald-500" /> Stripe, PayPal, Manual Wire Transfer, & Cash on Arrival</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Globe2 className="w-5 h-5 text-emerald-500" /> Multi Currency Engine: USD, EUR, AUD, GBP, IDR, SGD & more</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><DollarSign className="w-5 h-5 text-emerald-500" /> Direct-to-bank payouts with 0% platform transaction fees</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Feature 3: Integrated TripAdvisor, Google & Airbnb Reviews */}
      <section className="py-24 px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="font-mono text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">[ SOCIAL PROOF INTEGRATION ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">TripAdvisor, Google & Airbnb Reviews</h2>
            <p className="text-lg text-slate-600 mb-8">
              Build instant trust with first-time website visitors. Sync and display authentic 5-star reviews directly from TripAdvisor, Google Business Profile, and Airbnb onto your storefront and tour checkout pages.
            </p>
            <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" /> Auto Review Collector
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Send post-tour WhatsApp review invitations automatically. New reviews publish instantly to your website to build social proof.
              </p>
            </div>
          </motion.div>
          <div className="relative">
            <img src="https://i.ibb.co.com/4nrMycfc/IMG-2453.png" alt="Reviews & Social Proof" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full max-w-sm mx-auto object-cover" />
          </div>
        </div>
      </section>

      {/* Feature 4: Analytics Engine */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <img src="https://i.ibb.co.com/MqFL4jW/image.png" alt="Analytics Dashboard" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full object-cover" />
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
            <div className="font-mono text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">[ DATA & METRICS ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">Google Analytics & Self-Hosted Analytics</h2>
            <p className="text-lg text-slate-600 mb-8">
              Understand where your guests come from and which tours generate the highest return. Tripbone integrates natively with Google Analytics 4 while providing a lightweight self-hosted privacy analytics dashboard inside your admin area.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-700 font-medium"><BarChart3 className="w-5 h-5 text-emerald-500" /> Real-time pageview logs, source attribution, & conversion metrics</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Integrated Google Analytics 4 event tracking for booking checkouts</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><TrendingUp className="w-5 h-5 text-emerald-500" /> Revenue breakdown reports by tour package and traffic channel</li>
            </ul>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
