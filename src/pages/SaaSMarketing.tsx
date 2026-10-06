import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../lib/SettingsContext';
import { cn } from '../lib/utils';
import { 
  Compass, ArrowRight, Play, Sparkles, 
  MessageCircle, Users, Check, Globe, 
  DollarSign, Activity, ChevronRight, Layout, 
  Map, CreditCard, Mail, FileText, BarChart, 
  X, ChevronDown, ChevronUp, Layers, ExternalLink,
  Rocket, Zap, Smartphone, Bot, TrendingUp, Star,
  CheckCircle2, ShieldAlert, Database, Triangle,
  Search, Bell, MapPin, Filter, ChevronLeft, Clock
} from 'lucide-react';
import { 
  trackPostHogMarketingCTA, 
  trackPostHogDemoModalOpen, 
  trackPostHogDemoLeadSubmit, 
  trackPostHogShowcaseClick 
} from '../lib/posthog';
import { CountryPhoneInput, CountryPhoneValue } from '../components/UI/CountryPhoneInput';
import { detectUserCountry } from '../lib/countryPhoneData';

export default function SaaSMarketing() {
  const { settings, globalBrand } = useSettings();
  const navigate = useNavigate();

  // FAQ & Showcase States
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showcases, setShowcases] = useState<any[]>([]);
  const [loadingShowcases, setLoadingShowcases] = useState(true);

  // Interactive Hero Operator Sandbox States
  const [heroTab, setHeroTab] = useState<'booking' | 'cockpit' | 'ai-studio'>('booking');
  const [sandboxGuests, setSandboxGuests] = useState<number>(2);
  const [sandboxPackageId, setSandboxPackageId] = useState<'vip' | 'standard'>('vip');
  const [sandboxBooked, setSandboxBooked] = useState<boolean>(false);
  const [sandboxDispatchSent, setSandboxDispatchSent] = useState<boolean>(false);
  const [sandboxAiPrompt, setSandboxAiPrompt] = useState<string>('Sunset Catamaran & Reef Snorkeling with Private Chef Dinner');
  const [sandboxAiGenerating, setSandboxAiGenerating] = useState<boolean>(false);
  const [sandboxAiGenerated, setSandboxAiGenerated] = useState<boolean>(false);

  // Phase 2: Interactive BYOPG ROI Calculator States
  const [calcMonthlyRevenue, setCalcMonthlyRevenue] = useState<number>(20000);
  const [calcOtaCutPercentage, setCalcOtaCutPercentage] = useState<number>(20);
  const [activeGatewayTab, setActiveGatewayTab] = useState<'stripe' | 'midtrans' | 'xendit' | 'paypal' | 'manual'>('stripe');

  const handleSimulateAiGeneration = () => {
    setSandboxAiGenerating(true);
    setSandboxAiGenerated(false);
    setTimeout(() => {
      setSandboxAiGenerating(false);
      setSandboxAiGenerated(true);
    }, 1200);
  };

  // Watch Demo Modal state
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoLead, setDemoLead] = useState({ 
    name: '', 
    email: '', 
    companyName: '',
    monthlyBookings: '10-50'
  });
  const [demoPhoneData, setDemoPhoneData] = useState<CountryPhoneValue>(() => {
    const detected = detectUserCountry();
    return {
      phone: '',
      rawPhone: '',
      whatsapp: '',
      isSameAsWhatsapp: true,
      country: detected.name,
      countryCode: detected.code,
      dialCode: detected.dialCode
    };
  });
  const [submittingLead, setSubmittingLead] = useState(false);

  const handleWatchDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoLead.name || !demoLead.email) return;
    setSubmittingLead(true);
    try {
      trackPostHogDemoLeadSubmit({
        name: demoLead.name,
        email: demoLead.email,
        phone: demoPhoneData.phone,
        country: demoPhoneData.country,
        companyName: demoLead.companyName,
        source: 'main_hero_modal'
      });
      await addDoc(collection(db, 'demoLeads'), {
        name: demoLead.name.trim(),
        email: demoLead.email.trim(),
        phone: demoPhoneData.phone || '',
        whatsapp: demoPhoneData.whatsapp || demoPhoneData.phone || '',
        country: demoPhoneData.country || 'Unknown',
        countryCode: demoPhoneData.countryCode || '',
        dialCode: demoPhoneData.dialCode || '',
        companyName: demoLead.companyName.trim() || 'Pending Workspace',
        monthlyBookings: demoLead.monthlyBookings || '10-50',
        status: 'new', // Funnel stages: new -> contacted -> demo_given -> trial_started -> converted
        source: 'marketing_demo_modal',
        createdAt: new Date().toISOString()
      });
      // Redirect to demo site
      window.location.href = "https://demo.tripbone.com";
    } catch (err) {
      console.error("Error saving lead:", err);
      // Fallback redirect anyway
      window.location.href = "https://demo.tripbone.com";
    } finally {
      setSubmittingLead(false);
      setShowDemoModal(false);
    }
  };

  const brandColor = globalBrand?.brandColor || '#1db3cd';

  // Hero Wix-Style Showcase Slideshow Images
  const heroSlideshowImages = [
    {
      url: 'https://i.ibb.co.com/8hnJ2jy/Bali-Gorilla-ATV-Adventure-Adventure-Tours-in-Bali-07-25-2026-10-30-PM-optimized.webp',
      title: 'Bali Gorilla ATV Adventure',
      domain: 'baligorillaatv.com',
      prompt: 'Create an adventure tour operator site for Bali Gorilla ATV with instant booking & galleries'
    },
    {
      url: 'https://i.ibb.co.com/pvDvGrRL/Tripbone-com-Advanced-Tour-Booking-Platform-07-25-2026-10-27-PM-optimized.webp',
      title: 'Tripbone OS Dashboard',
      domain: 'app.tripbone.com',
      prompt: 'Show live booking calendar, ticket generator, multi-currency checkout & revenue analytics'
    },
    {
      url: 'https://i.ibb.co.com/MDVb2D4B/Book-Tour-and-Adventures-in-Bali-07-25-2026-10-28-PM-optimized.webp',
      title: 'Bali Adventure Portal',
      domain: 'balitoursportal.com',
      prompt: 'Design an interactive tour discovery platform with smart search filters and instant quotes'
    },
    {
      url: 'https://i.ibb.co.com/PzbSvVB4/Book-Bali-Adventure-Activities-and-Tours-in-Bali-Bali-Dream-Trip-07-25-2026-10-29-PM-optimized.webp',
      title: 'Bali Dream Trip',
      domain: 'balidreamtrip.com',
      prompt: 'Build a private island hopping & custom luxury boat charter booking site'
    },
    {
      url: 'https://i.ibb.co.com/p6cD32cZ/Book-Tour-and-Adventours-in-Bali-Bali-Blissful-Tours-07-25-2026-10-31-PM-optimized.webp',
      title: 'Bali Blissful Tours',
      domain: 'baliblissfultours.com',
      prompt: 'Craft an eco-tourism and wellness retreat booking site with automated driver dispatch'
    },
    {
      url: 'https://i.ibb.co.com/F4QLxZZ1/Bali-Adventours-Discover-Authentic-Bali-Experiences-07-25-2026-10-30-PM-optimized.webp',
      title: 'Bali Adventours',
      domain: 'baliadventours.com',
      prompt: 'Generate an authentic Balinese expedition portal with hand-vetted local guides'
    },
    {
      url: 'https://i.ibb.co.com/fYYSHPsS/Smart-Bali-Tours-Tours-Adventure-in-Bali-07-25-2026-10-28-PM-optimized.webp',
      title: 'Smart Bali Tours',
      domain: 'smartbalitours.com',
      prompt: 'Create an AI-personalized itinerary generator with instant WhatsApp booking integration'
    }
  ];

  const [activeSlide, setActiveSlide] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlideshowImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHovered, heroSlideshowImages.length]);

  const handleGetStarted = () => {
    trackPostHogMarketingCTA({
      ctaName: 'Start Saving Today',
      location: 'bottom_comparison_banner',
      destination: '/signup',
      section: 'savings_calculator'
    });
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const isAiStudioPlatform = 
      hostname.includes('run.app') || 
      hostname.includes('ai.studio') || 
      hostname.includes('aistudio.google.com') || 
      hostname.includes('vercel.app') || 
      hostname.includes('web.app') || 
      hostname.includes('firebaseapp.com');

    if (isAiStudioPlatform) {
      window.location.href = '/signup';
    } else {
      window.location.href = hostname === 'localhost' 
        ? `http://app.localhost${port}/signup` 
        : 'https://app.tripbone.com/signup';
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Load live showcases from Firestore
  useEffect(() => {
    async function loadShowcases() {
      try {
        const snap = await getDocs(collection(db, 'clientShowcase'));
        const list: any[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        list.sort((a, b) => {
          const wA = a.weight || 0;
          const wB = b.weight || 0;
          if (wA !== wB) return wB - wA;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        setShowcases(list);
      } catch (err) {
        console.error('Error loading showcases on homepage:', err);
      } finally {
        setLoadingShowcases(false);
      }
    }
    loadShowcases();
  }, []);

  // FAQ contents as structured in the wireframe
  const faqs = [
    { 
      q: "Do I need technical skills to use Tripbone?", 
      a: "No, Tripbone is built for non-technical tour operators. AI handles everything — website creation, content writing, and setup." 
    },
    { 
      q: "How long does it take to launch?", 
      a: "Less than 2 minutes. Our AI website generator builds and provisions your entire site instantly." 
    },
    { 
      q: "Can I use my own domain?", 
      a: "Yes, you can easily map your custom domain (e.g., mytours.com) to your Tripbone site." 
    },
    { 
      q: "What payment methods does Tripbone support?", 
      a: "We support Stripe, PayPal, and offline/bank transfers out of the box." 
    },
    { 
      q: "Is there a free trial available?", 
      a: "Yes, we offer a 7-day free trial so you can experience everything Tripbone has to offer before committing." 
    }
  ];

  return (
    <>
      <Helmet>
        <title>Tripbone - Tour Operator Booking & Management System</title>
        <meta name="description" content="Tripbone is an AI-powered SaaS platform for tour operators to generate fully automated tour websites with instant booking systems and WhatsApp automation." />
        <meta name="keywords" content="tour operator software, travel saas, custom booking engine, ai website builder" />
      </Helmet>

      <style>{`
        .text-brand { color: ${brandColor} !important; }
        .bg-brand { background-color: ${brandColor} !important; }
        .border-brand { border-color: ${brandColor} !important; }
        .hover\\:text-brand:hover { color: ${brandColor} !important; }
        .hover\\:bg-brand:hover { background-color: ${brandColor} !important; }
        .bg-brand-fade { background-color: ${brandColor}15 !important; }
      `}</style>

      <div className="bg-[#f8fafc] min-h-screen text-slate-900 font-sans antialiased">
        {/* --- 1. HERO SECTION & INTERACTIVE OPERATOR SANDBOX --- */}
        <section 
          id="hero" 
          className="pt-24 pb-20 sm:pt-32 sm:pb-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white border-b border-slate-800/80"
        >
          {/* Subtle Ambient Radial Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-0"></div>
          <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-0"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#334155_0.75px,transparent_0.75px)] [background-size:28px_28px] opacity-25 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left Column: Hero Content & CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-7 space-y-6 text-left"
              >
                {/* Pill: Website & Booking Engine */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono uppercase tracking-widest font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Website & Booking Engine</span>
                </div>

                {/* Headline */}
                <h1 
                  className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-white"
                  style={{ textWrap: 'balance' }}
                >
                  Build your AI powered tour website{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                    in 2 minutes.
                  </span>
                </h1>

                {/* Body Copy / Subheadline */}
                <p 
                  className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl"
                  style={{ textWrap: 'balance' }}
                >
                  Build tours with AI, answer guests with AI, and plan trips with AI. Automate WhatsApp, send proposals, import your OTA listings, and get paid through your own payment gateway. Zero commission.
                </p>

                {/* CTA Action Buttons */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      onClick={() => {
                        trackPostHogMarketingCTA({
                          ctaName: 'Build my site in 2 minutes (Hero)',
                          location: 'hero_top',
                          destination: '/signup',
                          section: 'hero'
                        });
                        navigate('/signup');
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Build my site in 2 minutes*</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => {
                        trackPostHogDemoModalOpen({ source: 'hero_top_button' });
                        setShowDemoModal(true);
                      }}
                      className="bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold text-sm sm:text-base px-6 py-4 rounded-xl border border-slate-700/70 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Play className="h-4 w-4 text-emerald-400 fill-current" />
                      <span>See a live demo</span>
                    </button>
                  </div>

                  {/* Footnote / Asterisk explanation */}
                  <p className="text-[11px] font-medium text-slate-400 font-mono">
                    *) 7 Day Trial No Credit Card Required
                  </p>
                </div>

                {/* Trust line */}
                <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-2 text-xs text-slate-300 font-medium pt-2 border-t border-slate-800/80">
                  <span className="text-emerald-400 font-bold">0% commission</span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span>No credit card</span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span>Your data stays yours</span>
                </div>
              </motion.div>

              {/* Right Column: iPhone 17 Pro Max Mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-5 flex flex-col items-center justify-center relative"
              >
                {/* Ambient Glow Backdrop */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/25 via-teal-500/15 to-transparent rounded-full blur-[100px] pointer-events-none -z-0"></div>
                
                {/* iPhone Flat Mockup */}
                <div className="relative z-10 w-full max-w-[320px] sm:max-w-[360px] mx-auto flex flex-col items-center group">
                  <img 
                    src="https://i.ibb.co.com/200fvQDY/iphone-17-pro-max-flat-mockup.png" 
                    alt="Tripbone Mobile Tour Website on iPhone 17 Pro Max" 
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[580px] object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.9)] group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  
                  {/* Floating Mobile Feature Badge */}
                  <div className="mt-4 bg-slate-950/90 border border-emerald-500/40 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-emerald-400 shadow-xl flex items-center gap-2 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>100% Mobile Guest Checkout</span>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* --- 2. LOGO CLOUD & BYOPG INTEGRATIONS MARQUEE --- */}
        <section id="logos" className="py-12 bg-white border-y border-slate-200 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-mono uppercase tracking-widest font-bold mb-6">
              <span>Powered by Tech You Use Everyday</span>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6">
              
              {/* Stripe */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/20 transition-all cursor-pointer group shadow-2xs">
                <img 
                  src="https://i.ibb.co.com/gb6tFnrN/stripe.jpg" 
                  alt="Stripe" 
                  referrerPolicy="no-referrer"
                  className="h-5 w-auto object-contain mix-blend-multiply rounded-xs"
                />
                <span className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight">Stripe</span>
                <span className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded">0% Cut</span>
              </div>

              {/* PayPal */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/20 transition-all cursor-pointer group shadow-2xs">
                <img 
                  src="https://i.ibb.co.com/20D5cDRw/paypal.png" 
                  alt="PayPal" 
                  referrerPolicy="no-referrer"
                  className="h-5 w-auto object-contain"
                />
                <span className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight">PayPal</span>
              </div>

              {/* Midtrans & Xendit */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/20 transition-all cursor-pointer group shadow-2xs">
                <div className="w-5 h-5 rounded bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">M</div>
                <span className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight">Midtrans & Xendit</span>
                <span className="text-[9px] font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">QRIS / VA</span>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/20 transition-all cursor-pointer group shadow-2xs">
                <img 
                  src="https://i.ibb.co.com/7dXQmL8M/Whats-App-Logo-wine.png" 
                  alt="WhatsApp" 
                  referrerPolicy="no-referrer"
                  className="h-5 w-auto object-contain"
                />
                <span className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight">WhatsApp API</span>
              </div>

              {/* Firebase */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/20 transition-all cursor-pointer group shadow-2xs">
                <img 
                  src="https://i.ibb.co.com/s9YgF0yS/firebase.png" 
                  alt="Firebase" 
                  referrerPolicy="no-referrer"
                  className="h-5 w-auto object-contain"
                />
                <span className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight">Google Firebase</span>
              </div>

              {/* Gemini AI */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/20 transition-all cursor-pointer group shadow-2xs">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight">Gemini 2.5 Flash</span>
              </div>

              {/* Resend */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/20 transition-all cursor-pointer group shadow-2xs">
                <Mail className="w-4 h-4 text-slate-700" />
                <span className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight">Resend Mail</span>
              </div>

            </div>
          </div>
        </section>

        {/* --- 2.5 INTERACTIVE BYOPG & ZERO-COMMISSION ROI CALCULATOR (LIGHT BACKGROUND DESIGN) --- */}
        <section id="calculator" className="py-20 md:py-28 bg-slate-50 text-slate-900 relative overflow-hidden border-b border-slate-200">
          {/* Subtle Ambient Lighting */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[140px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold uppercase tracking-wider">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero-Commission ROI Calculator</span>
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Stop Giving Away 20–25% <br className="hidden sm:block" />of Every Tour You Sell
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                Connect your own payment gateway with Tripbone BYOPG. Your money goes directly from your customer into your bank account. Tripbone takes 0% platform commission.
              </p>
            </div>

            {/* Interactive Calculator Box */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left: Interactive Controls */}
                <div className="lg:col-span-6 space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Monthly Direct Tour Sales Volume
                      </label>
                      <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 tabular-nums">
                        ${calcMonthlyRevenue.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ mo</span>
                      </span>
                    </div>

                    <input 
                      type="range" 
                      min="2000" 
                      max="100000" 
                      step="1000"
                      value={calcMonthlyRevenue}
                      onChange={(e) => setCalcMonthlyRevenue(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />

                    <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1.5">
                      <span>$2,000 / mo</span>
                      <span>$50,000 / mo</span>
                      <span>$100,000 / mo</span>
                    </div>
                  </div>

                  {/* OTA Comparison Cut Selector */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                      Standard OTA Commission Rate Avoided
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { rate: 18, label: '18% (GetYourGuide)' },
                        { rate: 20, label: '20% (Viator / Tripadvisor)' },
                        { rate: 25, label: '25% (High Tier OTA)' }
                      ].map((ota) => (
                        <button
                          key={ota.rate}
                          onClick={() => setCalcOtaCutPercentage(ota.rate)}
                          className={cn(
                            "p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold",
                            calcOtaCutPercentage === ota.rate
                              ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                          )}
                        >
                          <div>{ota.rate}% Cut</div>
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">{ota.label.split(' ')[1]}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Gateway Selector */}
                  <div className="pt-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                      Select Your Preferred Payment Gateway (BYOPG)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'stripe', name: 'Stripe', sub: 'Cards & Apple Pay' },
                        { id: 'midtrans', name: 'Midtrans', sub: 'QRIS & VA' },
                        { id: 'xendit', name: 'Xendit', sub: 'SE Asia & Wallets' },
                        { id: 'paypal', name: 'PayPal', sub: 'Global Express' }
                      ].map((gw) => (
                        <button
                          key={gw.id}
                          onClick={() => setActiveGatewayTab(gw.id as any)}
                          className={cn(
                            "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                            activeGatewayTab === gw.id
                              ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                          )}
                        >
                          <div className="text-xs font-bold text-slate-900">{gw.name}</div>
                          <div className="text-[10px] text-slate-500">{gw.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Savings Breakdown Display */}
                <div className="lg:col-span-6 bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Annual Revenue Impact</span>
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                      100% DIRECT PAYOUTS
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm text-slate-400">
                      <span>OTA Middleman Cut ({calcOtaCutPercentage}%):</span>
                      <span className="text-rose-400 font-mono font-bold line-through">
                        -${((calcMonthlyRevenue * (calcOtaCutPercentage / 100)) * 12).toLocaleString()} / yr
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-slate-400">
                      <span>Tripbone Platform Commission:</span>
                      <span className="text-emerald-400 font-mono font-black">
                        $0.00 (0.0%)
                      </span>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                      <div>
                        <span className="text-base font-bold text-white block">Money Kept in Your Bank Account</span>
                        <span className="text-xs text-slate-400">Pure profit saved every year with Tripbone</span>
                      </div>
                      <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tabular-nums">
                        +${((calcMonthlyRevenue * (calcOtaCutPercentage / 100)) * 12).toLocaleString()}
                        <span className="text-xs text-slate-400 font-normal"> / yr</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGetStarted}
                    className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <span>Start Keeping 100% of Your Revenue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* --- 3. REFINED & REDESIGNED SIMPLE ONBOARDING STEPS (4 MODERN CLEAN STEPS) --- */}
        <section id="how-it-works" className="py-24 md:py-32 bg-white text-slate-900 relative overflow-hidden border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-wider uppercase font-mono">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero-Friction Launch</span>
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Go Live in 4 Simple Steps
              </h2>
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
                Zero coding or technical setup required. Our hybrid AI website engine handles the entire build process automatically in under 2 minutes.
              </p>
            </div>

            {/* Step Cards Grid */}
            <div className="relative">
              
              {/* Desktop Connecting Progress Line */}
              <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-[2px] bg-slate-200 z-0">
                <div className="h-full w-full bg-gradient-to-r from-emerald-500/40 via-teal-500/40 to-emerald-500/40"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                
                {[
                  { 
                    num: "1", 
                    stepTag: "01",
                    title: "Create Account", 
                    desc: "Sign up free in seconds. No credit card required, zero commitment.",
                    icon: Rocket,
                    eta: "Instant"
                  },
                  { 
                    num: "2", 
                    stepTag: "02",
                    title: "Tell Us Your Company", 
                    desc: "Enter your tour company name, destination, and sample packages.",
                    icon: Compass,
                    eta: "~30 sec"
                  },
                  { 
                    num: "3", 
                    stepTag: "03",
                    title: "Provisioning in 2 Minutes", 
                    desc: "AI builds your custom website, booking engine, and SEO pages automatically.",
                    icon: Zap,
                    eta: "~2 mins"
                  },
                  { 
                    num: "4", 
                    stepTag: "04",
                    title: "Website Live", 
                    desc: "Connect your payment gateway, start taking bookings, and keep 100% of revenue.",
                    icon: CheckCircle2,
                    eta: "Ready"
                  }
                ].map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.08 }}
                      className="group relative bg-slate-50/80 hover:bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-slate-200/40"
                    >
                      <div>
                        {/* Step Number & Icon Header */}
                        <div className="flex items-center justify-between mb-5">
                          <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 duration-200">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span className="text-xl font-black text-slate-300 font-mono group-hover:text-emerald-600 transition-colors">
                            {item.stepTag}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-slate-900 mb-2 tracking-tight group-hover:text-emerald-700 transition-colors">
                          {item.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {item.desc}
                        </p>
                      </div>

                      {/* Step Tag Footer */}
                      <div className="pt-4 mt-5 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>STEP {item.num} OF 4</span>
                        <span className="font-semibold text-emerald-600">{item.eta}</span>
                      </div>
                    </motion.div>
                  );
                })}

              </div>

            </div>

            {/* Bottom Callout Bar */}
            <div className="mt-16 text-center">
              <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-200 px-8 py-4 rounded-2xl shadow-sm">
                <span className="text-sm font-semibold text-slate-800">
                  Ready to launch your tour website today?
                </span>
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* --- 4. EVERYTHING YOU NEED TO RUN YOUR TOUR BUSINESS (Features Grid - BENTO STYLE) --- */}
        <section id="features" className="py-20 md:py-28 bg-[#f8fafc] text-slate-900 relative overflow-hidden border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full mb-3 inline-block font-mono">
                COMPLETE TOUR OPERATOR OS
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                Everything You Need to Run <br />Your Tour Business
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Purpose-built modules that eliminate fragmented software, automate manual admin work, and maximize direct bookings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {[
                { 
                  icon: Layout, 
                  title: "AI Website Builder", 
                  desc: "Generate your branded multi-page tour website in under 2 minutes with zero code." 
                },
                { 
                  icon: Map, 
                  title: "Gemini Tour Studio", 
                  desc: "Create high-converting itinerary pages with AI copy, inclusions, and highlights." 
                },
                { 
                  icon: Sparkles, 
                  title: "Direct Booking Engine", 
                  desc: "Real-time calendar scheduling, departure slots, and instant automated voucher generation." 
                },
                { 
                  icon: CreditCard, 
                  title: "Universal BYOPG", 
                  desc: "Direct integration with Stripe, Midtrans, Xendit, Razorpay, and PayPal with 0% cut." 
                },
                { 
                  icon: MessageCircle, 
                  title: "WhatsApp Automation", 
                  desc: "Auto-deliver PDF tickets, driver pickup contact cards, and review links via WhatsApp." 
                },
                { 
                  icon: Mail, 
                  title: "Email Notifications", 
                  desc: "Automated booking confirmations, reminder flows, and branded receipts via Resend." 
                },
                { 
                  icon: FileText, 
                  title: "AI SEO Engine", 
                  desc: "AI writes high-ranking travel blogs and destination guides to attract organic search traffic." 
                },
                { 
                  icon: BarChart, 
                  title: "Operations Cockpit", 
                  desc: "Track net revenue, passenger manifest, driver dispatches, and inventory cut-off locks." 
                },
              ].map((feature, i) => (
                <div key={i} className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 hover:border-emerald-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* --- 5. THE SMARTER ALTERNATIVE (Traditional vs Tripbone) --- */}
        <section className="py-24 md:py-32 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full mb-4 inline-block font-mono">
                WHY CHOOSE TRIPBONE
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                The Smarter Alternative
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              
              {/* Left Column: Traditional */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm relative overflow-hidden">
                <span className="absolute top-5 right-6 text-xs font-mono font-bold text-slate-400">TRADITIONAL WAY</span>
                <h3 className="text-2xl font-black text-slate-600 mb-8 pb-4 border-b border-slate-200 flex items-center gap-2">
                  <X className="w-6 h-6 text-rose-500" />
                  <span>Fragmented Tools & OTAs</span>
                </h3>
                <ul className="space-y-6">
                  {[
                    "Pay 20% to 25% commission on every booking to OTAs",
                    "Hire expensive developers ($3,000+) to build WordPress sites",
                    "Patch together 8+ separate plugins, hosting & SSL certs",
                    "Manual WhatsApp messaging & driver assignment spreadsheets",
                    "Delayed OTA payouts held for 30–60 days",
                    "Zero direct customer relationship or retargeting data"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-sm font-medium text-slate-600">
                      <X className="w-5 h-5 text-rose-500 mr-3.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Column: Tripbone High-Contrast Executive Dark Card */}
              <div className="bg-slate-950 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl border border-emerald-500/40 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                <span className="absolute top-5 right-6 text-xs font-mono font-bold text-emerald-400">TRIPBONE SAAS</span>
                <h3 className="text-2xl font-black text-emerald-400 mb-8 pb-4 border-b border-slate-800 flex items-center gap-2">
                  <Check className="w-6 h-6 text-emerald-400" />
                  <span>The Tripbone Platform</span>
                </h3>
                <ul className="space-y-6 relative z-10">
                  {[
                    "0% booking commission — keep 100% of your earnings",
                    "AI generates your complete website and tour catalog in 2 minutes",
                    "Universal BYOPG: Direct payouts to your bank via Stripe/Midtrans",
                    "Automated WhatsApp tickets and real-time driver dispatching",
                    "Custom domain with automated cloud hosting and SSL included",
                    "Own your customer list, reviews, and repeat booking engine"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-sm font-bold text-white">
                      <Check className="w-5 h-5 text-emerald-400 mr-3.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>
        </section>

        {/* --- 6. BUILT DIFFERENT / THREE SUPERPOWERS (High-Fidelity Bento Grid) --- */}
        <section className="py-24 md:py-32 bg-[#f8fafc] border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full mb-4 inline-block font-mono">
                COMPETITIVE ADVANTAGE
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Three Superpowers Built for <br />Tour & Activity Leaders
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Column 1: Setup & AI */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-xl transition-all">
                <div>
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center mb-6 text-emerald-600 shadow-2xs">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">Instant AI Co-Pilot</h3>
                  <p className="text-slate-600 text-xs leading-relaxed mb-6">
                    Gemini AI writes full tour itineraries, generates SEO blog posts, and translates your site into 30+ languages in seconds.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Live website in under 2 minutes",
                      "Zero coding or design skills needed",
                      "Custom business domain included"
                    ].map((li, idx) => (
                      <li key={idx} className="flex items-center text-xs font-bold text-slate-900">
                        <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                        <span>{li}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Visual simulator mockup inside column */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[10px] font-mono text-slate-200">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> GEMINI AI STUDIO
                    </span>
                    <span className="text-[9px] bg-emerald-950 border border-emerald-500/40 px-1.5 py-0.5 rounded text-emerald-300 font-mono">2.5 Flash</span>
                  </div>
                  <p className="text-slate-400">Prompt: "Mt Batur sunrise jeep tour"</p>
                  <div className="mt-2 text-white bg-slate-900 p-2.5 rounded border border-slate-800 space-y-1">
                    <p className="font-bold text-emerald-400">✨ Generated Tour Product</p>
                    <p className="text-[9px] text-slate-300">✓ Real-time Slot Picker Enabled</p>
                    <p className="text-[9px] text-slate-300">✓ Multi-tier Pricing Configured</p>
                  </div>
                </div>
              </div>

              {/* Column 2: Built to Convert */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-xl transition-all">
                <div>
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center mb-6 text-emerald-600 shadow-2xs">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">Mobile-First Checkout</h3>
                  <p className="text-slate-600 text-xs leading-relaxed mb-6">
                    78% of travelers book tours directly on smartphones. Your Tripbone storefront behaves with native mobile speed.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Sub-second page load speeds",
                      "Apple Pay, Google Pay & QRIS ready",
                      "One-touch instant voucher pass"
                    ].map((li, idx) => (
                      <li key={idx} className="flex items-center text-xs font-bold text-slate-900">
                        <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                        <span>{li}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Visual simulator mockup inside column */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-2xs">
                  <div className="bg-white rounded-lg p-3 border border-slate-200 text-[10px] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-900">Instant Express Checkout</span>
                      <span className="font-bold text-emerald-600 font-mono">$120.00 USD</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full w-full"></div>
                    <div className="h-2 bg-slate-100 rounded-full w-2/3"></div>
                    <div className="w-full py-2 bg-slate-900 text-white font-black text-[10px] rounded-lg text-center">
                      Pay with Apple Pay
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Autopilot Operations */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-xl transition-all">
                <div>
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center mb-6 text-emerald-600 shadow-2xs">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">Autopilot Operations</h3>
                  <p className="text-slate-600 text-xs leading-relaxed mb-6">
                    Connect customers and drivers automatically on WhatsApp. Zero manual data entry, zero lost vouchers.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Automated WhatsApp ticket dispatch",
                      "Automated Google Review requests",
                      "Real-time driver pickup cards"
                    ].map((li, idx) => (
                      <li key={idx} className="flex items-center text-xs font-bold text-slate-900">
                        <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                        <span>{li}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Visual simulator mockup inside column */}
                <div className="bg-slate-950 text-slate-200 rounded-xl p-4 text-[10px] font-mono space-y-2 border border-slate-800">
                  <div className="flex justify-between pb-1 border-b border-slate-800">
                    <span className="text-emerald-400 font-bold">💬 WhatsApp Flow</span>
                    <span className="text-emerald-400">active</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded text-slate-300 border border-slate-800">
                    <p className="text-white font-bold">1. Customer Books</p>
                    <p className="text-[9px] text-slate-400">→ WhatsApp PDF ticket sent instantly</p>
                  </div>
                  <div className="bg-slate-900 p-2 rounded text-slate-300 border border-slate-800">
                    <p className="text-white font-bold">2. Morning of Tour (07:00 AM)</p>
                    <p className="text-[9px] text-slate-400">→ Driver assigned & location card pinned</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* --- 7. SITES POWERED BY TRIPBONE (Verified Showcase List) --- */}
        <section id="showcases" className="py-24 md:py-32 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            
            <div className="text-center max-w-2xl mx-auto mb-20">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full mb-4 inline-block font-mono">
                LIVE PRODUCTION EXAMPLES
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Sites Powered by Tripbone
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Explore real tour operators worldwide powering their entire direct booking engine with Tripbone.
              </p>
            </div>

            {/* Showcase Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {showcases.length > 0 ? (
                showcases.slice(0, 3).map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    key={item.id} 
                    className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white group hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Browser mockup header */}
                      <div className="w-full h-9 bg-slate-100 border-b border-slate-200 flex items-center px-4 justify-between z-10 relative">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 truncate max-w-[150px]">
                          {item.url ? item.url.replace(/^https?:\/\//i, '') : 'client-site'}
                        </span>
                        <div className="w-4"></div>
                      </div>
                      <div className="relative h-[220px] w-full overflow-hidden bg-slate-100">
                        {item.screenshotUrl ? (
                          <img 
                            src={item.screenshotUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                            <Layers className="w-10 h-10 stroke-1 text-slate-400" />
                            <span className="text-[10px] font-mono mt-2 uppercase tracking-widest font-black text-slate-400">Live Partner</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6 text-left">
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                            {item.title}
                          </h3>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                        </div>
                        <p className="text-xs text-slate-500 font-mono mb-2">
                          {item.location || 'Global Operations'} • {item.category || 'Tours & Excursions'}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {item.description || 'Verified Tripbone partner website.'}
                        </p>
                      </div>
                    </div>
                    <div className="px-6 pb-6 text-left">
                      <a 
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-slate-800 hover:text-emerald-600 inline-flex items-center space-x-1.5 border border-slate-200 bg-slate-50 px-4 py-2 rounded-xl hover:border-emerald-500/40 hover:bg-emerald-50/50 transition-all cursor-pointer"
                      >
                        <span>Visit Live Site</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                ))
              ) : (
                /* Static High-End Mock showcases */
                [
                  { 
                    title: "Bali Adventure Tours", 
                    location: "Bali, Indonesia",
                    category: "Adventure & Rafting",
                    desc: "Direct booking platform for white water rafting, ATV rides, and volcano sunrise trekking.",
                    img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80"
                  },
                  { 
                    title: "Patagonia Expeditions", 
                    location: "Argentina",
                    category: "Hiking & Glaciers",
                    desc: "Multi-day trekking guides featuring customizable itineraries and fast digital checkouts.",
                    img: "https://images.unsplash.com/photo-1517022812141-23620dba5c23?auto=format&fit=crop&w=600&q=80"
                  },
                  { 
                    title: "Sahara Desert Trips", 
                    location: "Morocco",
                    category: "Desert & Culture",
                    desc: "Luxury desert glamping and camel trek portal featuring multilingual customer booking flows.",
                    img: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80"
                  }
                ].map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white group hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Browser toolbar header */}
                      <div className="w-full h-9 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-1.5 z-10 relative">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      </div>
                      <div className="relative h-[220px] w-full overflow-hidden bg-slate-100">
                        <img 
                          src={item.img} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      </div>
                      <div className="p-6 text-left">
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                            {item.title}
                          </h3>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                        </div>
                        <p className="text-xs text-slate-500 font-mono mb-2">
                          {item.location} • {item.category}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <div className="px-6 pb-6 text-left">
                      <span className="text-xs font-bold text-slate-800 hover:text-emerald-600 inline-flex items-center space-x-1.5 border border-slate-200 bg-slate-50 px-4 py-2 rounded-xl hover:border-emerald-500/40 hover:bg-emerald-50/50 transition-all cursor-pointer">
                        <span>Visit Live Site</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="mt-16 text-center">
              <Link
                to="/directory"
                className="bg-slate-900 hover:bg-slate-800 inline-flex items-center space-x-2.5 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Explore Operator Directory</span>
                <Globe className="w-4 h-4 text-white" />
              </Link>
            </div>

          </div>
        </section>

        {/* --- 8. SAVE THOUSANDS / ONE PLATFORM INSTEAD --- */}
        <section className="py-24 md:py-32 bg-[#f8fafc] border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left text panel */}
              <div className="lg:col-span-5 text-left space-y-6">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full inline-block font-mono">
                  ALL-IN-ONE COST REPLACEMENT
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  One platform.<br />
                  Instead of paying<br />
                  for all of these.
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed max-w-md">
                  Stop juggling 8+ disjointed tools, plugins, and freelance maintenance fees. Tripbone consolidates your entire operational stack.
                </p>
                <div className="pt-2">
                  <button 
                    onClick={handleGetStarted} 
                    className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 text-white text-xs uppercase tracking-wider font-black rounded-xl shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    Start Saving $8,000+/Year
                  </button>
                </div>
              </div>

              {/* Right pricing grids */}
              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { tool: "Custom Website Dev", price: "$2,500+" },
                    { tool: "WordPress Maintenance", price: "$3,000/yr" },
                    { tool: "Booking Engine Plugin", price: "$499/yr" },
                    { tool: "Fast Cloud Hosting & SSL", price: "$300/yr" },
                    { tool: "AI Copywriter & SEO Tool", price: "$480/yr" },
                    { tool: "Email Marketing Software", price: "$360/yr" },
                    { tool: "WhatsApp Notification Gateway", price: "$300/yr" },
                    { tool: "Customer & Driver CRM", price: "$600/yr" }
                  ].map((item, i) => (
                    <div key={i} className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl flex items-center justify-between shadow-2xs hover:border-emerald-500/40 transition-colors">
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-slate-900">{item.tool}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Standard separate cost</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-black font-mono text-rose-500 line-through decoration-2">
                          {item.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* --- 10. FREQUENTLY ASKED QUESTIONS --- */}
        <section className="py-24 md:py-32 bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-6">
            
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full mb-4 inline-block font-mono">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Everything you need to know
              </h2>
            </div>

            {/* FAQ Accordion list */}
            <div className="space-y-3.5">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:border-emerald-500/40 transition-all duration-200">
                  <button 
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-4.5 text-left flex justify-between items-center focus:outline-none cursor-pointer hover:bg-slate-100/60"
                  >
                    <span className="font-bold text-sm sm:text-base text-slate-900 pr-4">{faq.q}</span>
                    {openFaq === idx 
                      ? <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" /> 
                      : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    }
                  </button>
                  <div className={`px-6 overflow-hidden transition-all duration-300 ${
                    openFaq === idx ? 'max-h-[200px] pb-5 border-t border-slate-200 pt-3' : 'max-h-0'
                  }`}>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* --- 11. FINAL CTA BLOCK --- */}
        <section className="py-20 md:py-28 bg-[#f8fafc] text-center px-6">
          <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-8 sm:p-14 space-y-6 relative overflow-hidden text-white">
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none"></div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Setup in 2 Minutes</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Ready to elevate your <br />tour business?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Join forward-thinking tour operators worldwide running direct bookings with zero commissions, BYOPG payouts, and automated WhatsApp dispatches.
            </p>
            
            {/* CTA controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
              <button 
                onClick={() => navigate('/signup')} 
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                Start 7-Day Free Trial
              </button>
              <button 
                onClick={() => setShowDemoModal(true)} 
                className="w-full sm:w-auto px-7 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Watch Interactive Demo
              </button>
            </div>

            {/* Trial terms list */}
            <p className="text-[11px] text-slate-400 font-mono pt-1">
              No credit card required · Free 7-day trial · Cancel anytime
            </p>
          </div>
        </section>

      </div>

      {/* Lead Capture Modal for Watch Demo */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 overflow-hidden"
            >
              <button 
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative text-center mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                  Unlock Free Access to the Demo
                </h3>
                <p className="text-slate-500 text-xs mt-1.5">
                  See how Tripbone generates complete multi-tenant websites in under 2 minutes.
                </p>
              </div>

              <form onSubmit={handleWatchDemoSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto px-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. John Doe"
                    value={demoLead.name}
                    onChange={(e) => setDemoLead({ ...demoLead, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-lg text-xs transition-all outline-none text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Business / Agency Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bali Gorilla Adventure"
                    value={demoLead.companyName}
                    onChange={(e) => setDemoLead({ ...demoLead, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-lg text-xs transition-all outline-none text-slate-900 font-medium"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Work Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="john@example.com"
                    value={demoLead.email}
                    onChange={(e) => setDemoLead({ ...demoLead, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-lg text-xs transition-all outline-none text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">WhatsApp / Phone Number</label>
                  <CountryPhoneInput 
                    value={demoPhoneData}
                    onChange={setDemoPhoneData}
                    theme="light"
                    showWhatsappToggle={false}
                    className="border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Monthly Booking Volume</label>
                  <select
                    value={demoLead.monthlyBookings}
                    onChange={(e) => setDemoLead({ ...demoLead, monthlyBookings: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none text-slate-900 font-medium"
                  >
                    <option value="1-20">Just starting out (1-20 bookings/mo)</option>
                    <option value="20-100">Growing operator (20-100 bookings/mo)</option>
                    <option value="100-500">Established agency (100-500 bookings/mo)</option>
                    <option value="500+">High volume / Enterprise (500+ bookings/mo)</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={submittingLead}
                  className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingLead ? (
                    <span>Redirecting to Demo...</span>
                  ) : (
                    <>
                      <span>Watch Interactive Demo</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
              
              <p className="text-center text-[10px] text-slate-400 mt-3 font-mono">
                Instant access · We respect your privacy
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

