import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Check, X, Sparkles, ArrowRight, ShieldCheck, DollarSign, 
  Zap, Calculator, Lock, RefreshCw, Layers, ArrowLeft
} from 'lucide-react';
import { useSettings } from '../lib/SettingsContext';

interface Competitor {
  id: string;
  name: string;
  feeLabel: string;
  avgFeePct: number;
  guestBookingFee: string;
  websiteBuildTime: string;
  whatsAppIntegration: boolean | string;
  reviewSync: boolean | string;
  customDomain: string;
  payoutSpeed: string;
  tagline: string;
  drawbacks: string[];
}

const COMPETITORS: Competitor[] = [
  {
    id: 'bokun',
    name: 'Bókun (TripAdvisor)',
    feeLabel: '1.5% + TripAdvisor Marketplace Fee',
    avgFeePct: 3.5,
    guestBookingFee: '1.5% - 4.0% marketplace cut',
    websiteBuildTime: 'Self-serve template (Basic design)',
    whatsAppIntegration: 'None',
    reviewSync: 'TripAdvisor reviews only',
    customDomain: 'Subdomain or basic custom domain mapping',
    payoutSpeed: '3 - 7 Business Days',
    tagline: 'Heavily biased toward TripAdvisor marketplace listings over your direct brand.',
    drawbacks: [
      'Pushes TripAdvisor marketplace distribution instead of direct website sales',
      'Rigid, outdated website templates that look generic and unoptimized for mobile',
      'No native WhatsApp order dispatches or driver cash-on-delivery tracking',
      'Limited customization for custom experience packages and AI itinerary planners'
    ]
  },
  {
    id: 'fareharbor',
    name: 'FareHarbor',
    feeLabel: '6% + Credit Card Processing',
    avgFeePct: 6.0,
    guestBookingFee: '6.0% added to guest checkout price',
    websiteBuildTime: '3 - 6 Weeks (Requires FareHarbor Lightframe setup)',
    whatsAppIntegration: 'None (Email / SMS only via expensive add-ons)',
    reviewSync: 'Basic static TripAdvisor widget',
    customDomain: 'Embedded iFrame widget on client site',
    payoutSpeed: '2 - 5 Business Days',
    tagline: 'High guest fees and locked-in ecosystem that inflates final checkout price.',
    drawbacks: [
      'Adds hidden 6% fee directly onto your guest checkout, reducing conversion rates',
      'Requires waiting weeks for their internal design team to build or modify your site',
      'No native WhatsApp booking automation or driver pickup coordinate dispatching',
      'No real-time 3-in-1 review synchronization (Google, TripAdvisor, Airbnb)'
    ]
  },
  {
    id: 'rezdy',
    name: 'Rezdy',
    feeLabel: '2% - 6% per online booking + Marketplace fee',
    avgFeePct: 4.5,
    guestBookingFee: '2% - 6% booking engine commission',
    websiteBuildTime: 'Self-serve integration (Requires existing website or basic builder)',
    whatsAppIntegration: 'None',
    reviewSync: 'Basic widget embed',
    customDomain: 'Embedded iframe on client site',
    payoutSpeed: '3 - 5 Business Days',
    tagline: 'High commission cut on direct sales with complex marketplace distribution tiers.',
    drawbacks: [
      'Takes a percentage cut from your own direct website traffic',
      'Requires an existing custom website to embed booking widgets',
      'No built-in WhatsApp automated driver dispatch or pickup drop-pins',
      'No AI-assisted tour copy generator or multi-currency converter'
    ]
  },
  {
    id: 'peek-pro',
    name: 'Peek Pro',
    feeLabel: '5% - 7% per online booking',
    avgFeePct: 6.0,
    guestBookingFee: '6.0% online booking tax',
    websiteBuildTime: '1 - 3 Weeks',
    whatsAppIntegration: 'Limited third-party webhooks',
    reviewSync: 'Native Peek review widget only',
    customDomain: 'iFrame modal overlay on existing site',
    payoutSpeed: '2 - 4 Business Days',
    tagline: 'Costly per-booking fees and expensive enterprise tier locks.',
    drawbacks: [
      'High per-booking commission eats into operator profit margins',
      'Requires manual configuration for multi-supplier or sub-agent channels',
      'Expensive monthly platform fee for white-label branding',
      'No AI-powered tour website generator or instant multi-language translation'
    ]
  },
  {
    id: 'regiondo',
    name: 'Regiondo',
    feeLabel: '4% - 6% per booking + monthly subscription fee',
    avgFeePct: 5.0,
    guestBookingFee: '4% - 6% ticket transaction fee',
    websiteBuildTime: '1 - 2 Weeks',
    whatsAppIntegration: 'None (Email notifications only)',
    reviewSync: 'Basic review widget',
    customDomain: 'Subdomain or iframe widget',
    payoutSpeed: '3 - 7 Business Days',
    tagline: 'Dual penalty: monthly software subscription plus steep transaction fees.',
    drawbacks: [
      'Double charges with both a monthly software fee and per-booking percentages',
      'Complex back-office interface with steep learning curve for staff',
      'No native WhatsApp driver dispatch or instant guest waiver signing',
      'Lacks AI website generation capabilities'
    ]
  },
  {
    id: 'checkfront',
    name: 'Checkfront / Xola',
    feeLabel: '3.5% - 5% per transaction',
    avgFeePct: 4.5,
    guestBookingFee: '3.0% - 5.0% guest fee',
    websiteBuildTime: 'Self-serve integration',
    whatsAppIntegration: 'None',
    reviewSync: 'None (Requires Zapier integration)',
    customDomain: 'Embedded widget or WordPress plugin',
    payoutSpeed: '3 Business Days',
    tagline: 'Complex setup with missing local market features like WhatsApp dispatches.',
    drawbacks: [
      'Requires technical knowledge or WordPress developer to set up booking forms',
      'No built-in AI copy generator or automated multi-currency exchanger',
      'Lacks native driver dispatch console and cash collection logging',
      'Charges extra for advanced reporting and custom domain routing'
    ]
  }
];

export default function SaaSComparison() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { globalBrand } = useSettings();

  // Find competitor matching slug if provided
  const matchedCompetitor = slug
    ? COMPETITORS.find(c => c.id === slug.toLowerCase() || c.name.toLowerCase().includes(slug.toLowerCase()))
    : null;

  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>(
    matchedCompetitor ? matchedCompetitor.id : 'bokun'
  );
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(15000);

  useEffect(() => {
    if (matchedCompetitor) {
      setSelectedCompetitorId(matchedCompetitor.id);
    }
  }, [slug, matchedCompetitor]);

  const brandColor = globalBrand?.brandColor || '#1db3cd';
  const competitor = COMPETITORS.find(c => c.id === selectedCompetitorId) || COMPETITORS[0];

  // ROI Math
  const competitorFeeAmount = (monthlyRevenue * competitor.avgFeePct) / 100;
  const tripboneMonthlyFee = 49; // Fixed monthly price benchmark
  const monthlySavings = Math.max(0, competitorFeeAmount - tripboneMonthlyFee);
  const annualSavings = monthlySavings * 12;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900">
      <Helmet>
        <title>
          {matchedCompetitor 
            ? `Tripbone vs ${matchedCompetitor.name} | Direct Tour Booking Software Comparison` 
            : 'Tripbone vs Legacy Tour Booking Systems | Compare FareHarbor, Peek Pro & Bokun'}
        </title>
        <meta 
          name="description" 
          content={`Compare Tripbone against ${competitor.name}. Save thousands in booking fees with 0% commission option, AI website builder, and WhatsApp automation.`} 
        />
      </Helmet>

      <style>{`
        .text-brand { color: ${brandColor} !important; }
        .bg-brand { background-color: ${brandColor} !important; }
        .border-brand { border-color: ${brandColor} !important; }
        .bg-brand-fade { background-color: ${brandColor}15 !important; }
      `}</style>

      {/* Hero Header */}
      <section className="bg-slate-950 text-white pt-36 sm:pt-40 pb-16 sm:pb-20 px-6 relative overflow-hidden border-b border-slate-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/20 to-emerald-500/15 rounded-full blur-[120px] pointer-events-none -z-0"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          {matchedCompetitor && (
            <div className="mb-6 flex justify-center">
              <Link to="/compare" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-700 transition-all">
                <ArrowLeft className="w-3.5 h-3.5 text-brand" />
                <span>All Platform Comparisons</span>
              </Link>
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-bold text-slate-300 shadow-xs mb-6 backdrop-blur-sm">
            <Layers className="w-4 h-4 text-brand" />
            <span>Honest Side-by-Side Comparison</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
            Tripbone vs <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-[#1db3cd]">{competitor.name}</span>
          </h1>

          <p className="text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Stop losing up to 6% of every booking to legacy booking platforms. Get a modern AI-powered website, 0% commission option, and native WhatsApp booking automation.
          </p>
        </div>
      </section>

      {/* Main Content Body (Light Background matching frontpage body sections) */}
      <div className="py-12 sm:py-16">
        
        {/* Interactive Savings Calculator */}
        <div className="max-w-5xl mx-auto px-6 mb-16">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Annual Commission Savings Calculator</h3>
                <p className="text-xs text-slate-500">See how much money stays in your bank account when switching to Tripbone</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Input Slider */}
              <div className="md:col-span-7 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Your Monthly Direct Booking Sales</label>
                    <span className="text-xl font-black text-slate-900">${monthlyRevenue.toLocaleString()} / mo</span>
                  </div>
                  <input 
                    type="range" 
                    min="2000" 
                    max="100000" 
                    step="1000"
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5">
                    <span>$2,000</span>
                    <span>$25,000</span>
                    <span>$50,000</span>
                    <span>$100,000+</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-600">Comparing against:</span>
                  <div className="flex flex-wrap gap-2">
                    {COMPETITORS.map(comp => (
                      <button
                        key={comp.id}
                        onClick={() => setSelectedCompetitorId(comp.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedCompetitorId === comp.id
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {comp.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Savings Output Box */}
              <div className="md:col-span-5 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-6 text-center relative">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                  Your Estimated Savings
                </span>
                <div className="my-4">
                  <span className="text-4xl md:text-5xl font-black text-emerald-600 tracking-tight">
                    ${Math.round(annualSavings).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 block mt-1">saved every single year</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instead of paying <span className="text-rose-600 font-bold">${Math.round(competitorFeeAmount * 12).toLocaleString()}/yr</span> in fees on {competitor.name}, you pay flat monthly pricing on Tripbone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="max-w-7xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Feature-by-Feature Comparison Matrix</h2>
            <p className="text-slate-600 text-sm">See how Tripbone stacks up directly against traditional tour booking software</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-500 w-1/3">Feature / Capability</th>
                    <th className="py-5 px-6 text-sm font-black text-brand bg-brand-fade border-x border-brand/20 w-1/3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>{globalBrand?.platformName || 'Tripbone'}</span>
                      </div>
                    </th>
                    <th className="py-5 px-6 text-sm font-bold text-slate-800 w-1/3 text-center">
                      {competitor.name}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  
                  {/* Row 1: Booking Commission */}
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      Online Booking Commission
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Direct website booking transaction fees</span>
                    </td>
                    <td className="py-4 px-6 font-black text-emerald-700 bg-brand-fade/30 border-x border-brand/10 text-center">
                      0% Commission Plan Option
                    </td>
                    <td className="py-4 px-6 font-semibold text-rose-600 text-center">
                      {competitor.feeLabel}
                    </td>
                  </tr>

                  {/* Row 2: Website Generation */}
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      Website Launch Speed & AI Builder
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Time required to launch custom storefront</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 bg-brand-fade/30 border-x border-brand/10 text-center">
                      Instant (Under 2 Minutes with AI)
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-center">
                      {competitor.websiteBuildTime}
                    </td>
                  </tr>

                  {/* Row 3: WhatsApp Booking Automation */}
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      Native WhatsApp Booking & Dispatches
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Automated pickup coordinates & driver notifications</span>
                    </td>
                    <td className="py-4 px-6 text-emerald-700 bg-brand-fade/30 border-x border-brand/10 text-center font-bold">
                      <Check className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                      Built-in WhatsApp Dispatch Bot
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-center">
                      <X className="w-5 h-5 mx-auto text-rose-500 mb-1" />
                      {typeof competitor.whatsAppIntegration === 'string' ? competitor.whatsAppIntegration : 'None'}
                    </td>
                  </tr>

                  {/* Row 4: Review Auto-Sync */}
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      3-in-1 Review Auto-Sync
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Google Maps, TripAdvisor & Airbnb 5-star reviews</span>
                    </td>
                    <td className="py-4 px-6 text-emerald-700 bg-brand-fade/30 border-x border-brand/10 text-center font-bold">
                      <Check className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                      Automated 3-Platform Review Sync
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-center">
                      {competitor.reviewSync}
                    </td>
                  </tr>

                  {/* Row 5: Multi-Tenant Custom Domain */}
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      Custom Domain & Full White-Label
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Your domain name with automatic SSL & SEO</span>
                    </td>
                    <td className="py-4 px-6 text-emerald-700 bg-brand-fade/30 border-x border-brand/10 text-center font-bold">
                      Full Native Custom Domain
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-center">
                      {competitor.customDomain}
                    </td>
                  </tr>

                  {/* Row 6: Multi-Currency & Payouts */}
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      Payout Speed & Direct Bank Settlement
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Funds deposited straight into your bank account</span>
                    </td>
                    <td className="py-4 px-6 text-emerald-700 bg-brand-fade/30 border-x border-brand/10 text-center font-bold">
                      Instant Direct Payouts (Stripe / Local QR)
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-center">
                      {competitor.payoutSpeed}
                    </td>
                  </tr>

                  {/* Row 7: Digital Waivers */}
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      Digital Safety Waivers & Equipment Logs
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Mobile waiver signing for high-risk adventure tours</span>
                    </td>
                    <td className="py-4 px-6 text-emerald-700 bg-brand-fade/30 border-x border-brand/10 text-center font-bold">
                      <Check className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                      Included free on all plans
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-center">
                      Usually requires paid 3rd-party integration
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Why Switch Section */}
        <div className="max-w-7xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">4 Big Reasons Tour Operators Make The Switch</h2>
            <p className="text-slate-600 text-sm">Designed specifically for tour guides, DMCs, and adventure activity providers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-6">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. Eliminate High Guest Booking Fees</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Legacy platforms add a 6% fee onto your guest's total price at checkout. On a $500 private tour booking, that adds $30 in unnecessary fees that discourage conversion. With Tripbone, keep 100% of your ticket sales or pass zero commission.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. Instant AI Tour Storefront Builder</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Don't wait 6 weeks for a booking system setup team. Describe your tour in plain English, and our AI engine generates a complete high-converting tour storefront with photo galleries, itineraries, and booking forms instantly.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Automated WhatsApp Dispatch Bot</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                70%+ of modern travelers prefer communicating via WhatsApp rather than checking email. Tripbone sends automated booking vouchers, hotel pickup drop-pins, and driver contact details straight to your guest's WhatsApp.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center mb-6">
                <RefreshCw className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">4. Free White-Glove Migration Guarantee</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Worried about switching systems? Our team will import all your existing tour listings, customer reviews, and pricing rules from FareHarbor, Peek Pro, or Bokun within 24 hours at zero charge.
              </p>
            </div>

          </div>
        </div>

        {/* Switch Guarantee Callout */}
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="bg-slate-900 text-white border border-slate-800 p-10 md:p-14 rounded-3xl shadow-2xl">
            <ShieldCheck className="w-12 h-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-4">Switching Is Fast & Completely Risk-Free</h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              Try Tripbone alongside your current software for 7 days with zero risk. Our migration team handles data transfer so your bookings never miss a beat.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-white font-bold text-sm shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: brandColor }}
              >
                <span>Claim Your 7-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all border border-slate-700"
              >
                Book 1-on-1 Migration Demo
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
