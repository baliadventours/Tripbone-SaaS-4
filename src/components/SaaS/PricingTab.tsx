import React, { useState, useEffect } from 'react';
import { db, collection, getDocs } from '../../lib/firebase';
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackPostHogPricingSelect, trackPostHogBillingIntervalChange } from '../../lib/posthog';

interface PlanData {
  id?: string;
  slug?: string;
  name: string;
  interval?: string;
  price?: number;
  monthlyPrice?: number;
  currency?: string;
  maxTours?: number;
  maxBookings?: number;
  features?: string[];
  popular?: boolean;
  badge?: string;
  isActive?: boolean;
}

const DEFAULT_PLANS: Record<'monthly' | 'annual' | 'lifetime', PlanData[]> = {
  monthly: [
    {
      id: 'starter-monthly',
      slug: 'starter',
      name: 'Starter Operator',
      interval: 'monthly',
      price: 29,
      currency: 'USD',
      maxTours: 10,
      maxBookings: 150,
      badge: 'For Solo Guides',
      features: [
        'AI Website Builder & Custom Domain',
        'Direct Booking Engine (0% Commission)',
        'Stripe, PayPal & Bank Transfer BYOPG',
        'WhatsApp Automated Vouchers',
        'SSL Security & Fast Cloud Hosting'
      ]
    },
    {
      id: 'pro-monthly',
      slug: 'pro',
      name: 'Professional Agency',
      interval: 'monthly',
      price: 79,
      currency: 'USD',
      popular: true,
      badge: 'Most Popular',
      maxTours: 50,
      maxBookings: 1000,
      features: [
        'Everything in Starter +',
        'Gemini AI Tour Studio & SEO Blog Writer',
        'Multi-Gateway (Midtrans, Xendit, Razorpay)',
        'Driver & Tour Guide Dispatch Portal',
        'Real-time Inventory Cut-off Lock',
        'Multilingual Auto-Translation (30+ Languages)',
        'Priority 24/7 Operator Support'
      ]
    },
    {
      id: 'business-monthly',
      slug: 'business',
      name: 'Enterprise Fleet',
      interval: 'monthly',
      price: 199,
      currency: 'USD',
      badge: 'High Volume',
      maxTours: 999999,
      maxBookings: 999999,
      features: [
        'Everything in Professional +',
        'Unlimited Tours & Unlimited Bookings',
        'Multi-Vendor & Sub-Agent Distribution',
        'Custom Webhooks & REST API Access',
        'Dedicated Cloud Architecture & SLA',
        'Personal Account Manager'
      ]
    }
  ],
  annual: [
    {
      id: 'starter-annual',
      slug: 'starter-annual',
      name: 'Starter Operator',
      interval: 'annual',
      price: 23,
      currency: 'USD',
      maxTours: 10,
      maxBookings: 150,
      badge: 'Billed Annually ($276/yr)',
      features: [
        'AI Website Builder & Custom Domain',
        'Direct Booking Engine (0% Commission)',
        'Stripe, PayPal & Bank Transfer BYOPG',
        'WhatsApp Automated Vouchers',
        'SSL Security & Fast Cloud Hosting'
      ]
    },
    {
      id: 'pro-annual',
      slug: 'pro-annual',
      name: 'Professional Agency',
      interval: 'annual',
      price: 63,
      currency: 'USD',
      popular: true,
      badge: 'Save 20% · Best Value',
      maxTours: 50,
      maxBookings: 1000,
      features: [
        'Everything in Starter +',
        'Gemini AI Tour Studio & SEO Blog Writer',
        'Multi-Gateway (Midtrans, Xendit, Razorpay)',
        'Driver & Tour Guide Dispatch Portal',
        'Real-time Inventory Cut-off Lock',
        'Multilingual Auto-Translation (30+ Languages)',
        'Priority 24/7 Operator Support'
      ]
    },
    {
      id: 'business-annual',
      slug: 'business-annual',
      name: 'Enterprise Fleet',
      interval: 'annual',
      price: 159,
      currency: 'USD',
      badge: 'Billed Annually ($1,908/yr)',
      maxTours: 999999,
      maxBookings: 999999,
      features: [
        'Everything in Professional +',
        'Unlimited Tours & Unlimited Bookings',
        'Multi-Vendor & Sub-Agent Distribution',
        'Custom Webhooks & REST API Access',
        'Dedicated Cloud Architecture & SLA',
        'Personal Account Manager'
      ]
    }
  ],
  lifetime: [
    {
      id: 'founder-lifetime',
      slug: 'founder-lifetime',
      name: 'Lifetime Founder',
      interval: 'lifetime',
      price: 499,
      currency: 'USD',
      popular: true,
      badge: 'Limited 50 Licenses Only',
      maxTours: 999999,
      maxBookings: 999999,
      features: [
        'Pay Once · Use Forever (No Monthly Fees)',
        'All Pro & Enterprise Modules Included',
        '0% Commission on All Direct Bookings Forever',
        'Gemini AI Tour Studio & Multi-Gateway BYOPG',
        'Free Future Feature Upgrades Guaranteed',
        'VIP WhatsApp Founder Support Channel'
      ]
    }
  ]
};

export default function PricingTab() {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'monthly' | 'annual' | 'lifetime'>('monthly');

  useEffect(() => {
    async function fetchPlans() {
      try {
        const querySnapshot = await getDocs(collection(db, 'billingPlans'));
        const plansList: PlanData[] = [];
        querySnapshot.forEach((docSnap) => {
          plansList.push({ id: docSnap.id, ...docSnap.data() } as PlanData);
        });
        if (plansList.length > 0) {
          plansList.sort((a, b) => (a.price || a.monthlyPrice || 0) - (b.price || b.monthlyPrice || 0));
          setPlans(plansList);
        } else {
          setPlans([]);
        }
      } catch (err) {
        console.error('Error fetching billing plans:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const handlePeriodChange = (newPeriod: 'monthly' | 'annual' | 'lifetime') => {
    setPeriod(newPeriod);
    trackPostHogBillingIntervalChange({ interval: newPeriod });
  };

  const handleGetNow = (planSlug: string) => {
    const activePlansList = plans.length > 0 ? plans : DEFAULT_PLANS[period];
    const selectedPlan = activePlansList.find(p => p.slug === planSlug || p.id === planSlug);
    
    trackPostHogPricingSelect({
      planSlug,
      planName: selectedPlan?.name,
      period,
      price: selectedPlan?.price || selectedPlan?.monthlyPrice,
      currency: selectedPlan?.currency || 'USD'
    });

    const host = window.location.host;
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    
    let targetUrl = '';
    const isAiStudioPlatform = 
      host.includes('run.app') || 
      host.includes('ai.studio') || 
      host.includes('aistudio.google.com') || 
      host.includes('vercel.app') || 
      host.includes('web.app') || 
      host.includes('firebaseapp.com');

    if (isAiStudioPlatform) {
      targetUrl = `${protocol}//${host}/signup?plan=${planSlug}`;
    } else if (host.includes('localhost') || host.includes('127.0.0.1')) {
      targetUrl = `http://app.localhost${port}/signup?plan=${planSlug}`;
    } else {
      const cleanHost = host.replace(/^(www)\./, '');
      targetUrl = `${protocol}//app.${cleanHost}/signup?plan=${planSlug}`;
    }
    
    window.location.href = targetUrl;
  };

  const currentDisplayPlans = (plans.length > 0 && plans.filter(p => p.interval === period).length > 0)
    ? plans.filter(p => p.interval === period)
    : DEFAULT_PLANS[period];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Tab Selector */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center p-1.5 bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md">
          <button
            onClick={() => handlePeriodChange('monthly')}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              period === 'monthly' 
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>

          <button
            onClick={() => handlePeriodChange('annual')}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              period === 'annual' 
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Annual</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-400/40 text-emerald-300 font-mono font-bold">
              -20% OFF
            </span>
          </button>

          <button
            onClick={() => handlePeriodChange('lifetime')}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              period === 'lifetime' 
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lifetime Deal</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className={`grid grid-cols-1 ${period === 'lifetime' ? 'max-w-xl mx-auto' : 'md:grid-cols-3'} gap-8 items-stretch`}>
        {currentDisplayPlans.map((plan, idx) => {
          const price = plan.price || plan.monthlyPrice || 0;
          const isPopular = plan.popular || idx === 1;

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              key={plan.id || plan.slug}
              className={`relative rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 border ${
                isPopular
                  ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-emerald-500/50 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                  : 'bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Popular / Founder Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono shadow-sm ${
                    isPopular
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-900 text-white'
                  }`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className={`text-xl font-black tracking-tight ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs mt-1 ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                    {period === 'monthly' ? 'Billed monthly · Cancel anytime' : period === 'annual' ? 'Billed annually · 2 months free' : 'One-time payment · Lifetime access'}
                  </p>
                </div>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-slate-200/40">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                      ${price}
                    </span>
                    <span className={`text-sm font-bold ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                      {period === 'lifetime' ? 'USD one-time' : '/ month'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                      0% Booking Commission
                    </span>
                  </div>
                </div>

                {/* Core Capacity */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={isPopular ? 'text-slate-300' : 'text-slate-600'}>Active Tour Packages:</span>
                    <span className={`font-mono font-bold ${isPopular ? 'text-emerald-400' : 'text-slate-900'}`}>
                      {plan.maxTours === 999999 ? 'Unlimited' : `Up to ${plan.maxTours}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={isPopular ? 'text-slate-300' : 'text-slate-600'}>Monthly Bookings:</span>
                    <span className={`font-mono font-bold ${isPopular ? 'text-emerald-400' : 'text-slate-900'}`}>
                      {plan.maxBookings === 999999 ? 'Unlimited' : `Up to ${plan.maxBookings}`}
                    </span>
                  </div>
                </div>

                {/* Feature List */}
                <div className="space-y-3 mb-8">
                  <p className={`text-[10px] font-mono uppercase tracking-wider font-bold ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                    What's Included
                  </p>
                  {plan.features?.map((feature: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isPopular ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span className={`text-xs leading-relaxed ${isPopular ? 'text-slate-300' : 'text-slate-700'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button 
                  onClick={() => handleGetNow(plan.slug || plan.name.toLowerCase().split(' ')[0])}
                  className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    isPopular 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                  }`}
                >
                  <span>{period === 'lifetime' ? 'Claim Lifetime Access' : 'Start 7-Day Free Trial'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className={`text-[10px] text-center mt-2.5 ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                  No credit card required · Instant setup
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trust & Guarantee Reassurance Footer */}
      <div className="mt-14 pt-8 border-t border-slate-200 text-center flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Keep 100% of your earnings · 0% commission on all tiers</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>Switch or cancel your subscription anytime with 1-click</span>
        </div>
      </div>
    </div>
  );
}

