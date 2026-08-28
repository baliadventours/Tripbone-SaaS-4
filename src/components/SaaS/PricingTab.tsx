import React, { useState, useEffect } from 'react';
import { db, collection, getDocs } from '../../lib/firebase';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PricingTab() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'monthly' | 'annual' | 'lifetime'>('monthly');

  useEffect(() => {
    async function fetchPlans() {
      try {
        const querySnapshot = await getDocs(collection(db, 'billingPlans'));
        const plansList: any[] = [];
        querySnapshot.forEach((docSnap) => {
          plansList.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Sort by price
        plansList.sort((a, b) => (a.price || a.monthlyPrice || 0) - (b.price || b.monthlyPrice || 0));
        setPlans(plansList);
      } catch (err) {
        console.error('Error fetching billing plans:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const handleGetNow = (planSlug: string) => {
    const host = window.location.host;
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    
    let targetUrl = '';
    if (host.includes('run.app')) {
      targetUrl = `${protocol}//${host}/signup?plan=${planSlug}`;
    } else if (host.includes('localhost') || host.includes('127.0.0.1')) {
      targetUrl = `http://app.localhost${port}/signup?plan=${planSlug}`;
    } else {
      const cleanHost = host.replace(/^(www)\./, '');
      targetUrl = `${protocol}//app.${cleanHost}/signup?plan=${planSlug}`;
    }
    
    window.location.href = targetUrl;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        {/* Tab Selector */}
        <div className="inline-flex items-center p-1 bg-white rounded-full border border-slate-200 shadow-sm">
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-8 py-3 rounded-full text-sm font-semibold tracking-wider transition-all duration-300 ${
              period === 'monthly' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            MONTHLY
          </button>
          <button
            onClick={() => setPeriod('annual')}
            className={`px-8 py-3 rounded-full text-sm font-semibold tracking-wider transition-all duration-300 ${
              period === 'annual' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            ANNUAL
          </button>
          <button
            onClick={() => setPeriod('lifetime')}
            className={`px-8 py-3 rounded-full text-sm font-semibold tracking-wider transition-all duration-300 ${
              period === 'lifetime' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            LIFETIME
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        {plans
          .filter(p => p.isActive && p.interval === period)
          .sort((a, b) => (a.price || 0) - (b.price || 0))
          .map((plan, idx) => {

          let price = plan.price || 0;
          let paymentText = period === 'monthly' ? 'MONTHLY PAYMENT' : period === 'annual' ? 'YEARLY PAYMENT' : 'ONE-TIME PAYMENT';

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              key={plan.id || plan.slug}
              className="bg-white rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group border border-slate-200"
            >
              <h3 className={`text-2xl font-bold mb-1 ${idx === 1 || idx === 2 ? (idx === 1 ? 'text-[#1db3cd]' : 'text-[#7ec200]') : 'text-[#1db3cd]'}`}>
                {plan.name}
              </h3>
              <p className="text-xs text-gray-900 uppercase tracking-wider font-bold mb-8">{period}</p>
              
              <div className="h-6">
                {/* Reserved for cross price if needed */}
              </div>
              
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-black text-gray-900">{price}</span>
                <span className="text-lg font-bold text-gray-900">.00 USD</span>
              </div>
              <p className="text-xs text-gray-400 font-semibold mb-8 uppercase tracking-wide">{paymentText}</p>

              <button 
                onClick={() => handleGetNow(plan.slug || plan.name.toLowerCase().split(' ')[0])}
                className={`w-full py-4 rounded-full font-bold transition-all mb-8 flex items-center justify-center gap-2 text-white ${
                idx === 1 
                  ? 'bg-[#1db3cd] hover:bg-[#189bb3]' 
                  : (idx === 2 ? 'bg-[#7ec200] hover:bg-[#6ba500]' : 'bg-[#1db3cd] hover:bg-[#189bb3]')
              }`}>
                GET NOW <ArrowRightIcon />
              </button>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className={`w-5 h-5 shrink-0 ${idx === 1 || idx === 2 ? (idx === 1 ? 'text-[#1db3cd]' : 'text-[#7ec200]') : 'text-[#1db3cd]'}`} />
                  <span className="text-sm text-gray-700">Up to <strong className="text-gray-900 font-bold">{plan.maxTours === 999999 ? 'Unlimited' : plan.maxTours}</strong> Tours</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className={`w-5 h-5 shrink-0 ${idx === 1 || idx === 2 ? (idx === 1 ? 'text-[#1db3cd]' : 'text-[#7ec200]') : 'text-[#1db3cd]'}`} />
                  <span className="text-sm text-gray-700">Up to <strong className="text-gray-900 font-bold">{plan.maxBookings === 999999 ? 'Unlimited' : plan.maxBookings}</strong> Bookings / Mo</span>
                </div>
                {plan.features?.map((feature: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${idx === 1 || idx === 2 ? (idx === 1 ? 'text-[#1db3cd]' : 'text-[#7ec200]') : 'text-[#1db3cd]'}`} />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="text-center mt-12 flex items-center justify-center gap-2">
        <p className="text-sm text-gray-400 font-medium">
          Prices are final. No setup fees or other hidden charges!
        </p>
        <button className="text-sm text-[#1db3cd] hover:underline font-medium">
          Can I, later on, upgrade to a larger Lifetime Plan?
        </button>
      </div>


    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  );
}
