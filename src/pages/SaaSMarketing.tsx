import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../lib/SettingsContext';
import { 
  Compass, ArrowRight, Play, Sparkles, 
  MessageCircle, Users, Check, Globe, 
  DollarSign, Activity, ChevronRight, Layout, 
  Map, CreditCard, Mail, FileText, BarChart, 
  X, ChevronDown, ChevronUp, Layers, ExternalLink,
  Rocket, Zap, Smartphone, Bot, TrendingUp, Star,
  CheckCircle2, ShieldAlert, Database, Triangle,
  Search, Bell, MapPin, Filter, ChevronLeft
} from 'lucide-react';

export default function SaaSMarketing() {
  const { settings, globalBrand } = useSettings();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showcases, setShowcases] = useState<any[]>([]);
  const [loadingShowcases, setLoadingShowcases] = useState(true);

  // Watch Demo Modal state
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoLead, setDemoLead] = useState({ name: '', email: '' });
  const [submittingLead, setSubmittingLead] = useState(false);

  const handleWatchDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoLead.name || !demoLead.email) return;
    setSubmittingLead(true);
    try {
      await addDoc(collection(db, 'demoLeads'), {
        name: demoLead.name,
        email: demoLead.email,
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
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    if (hostname.includes('run.app')) {
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

      <div className="bg-white min-h-screen">
        {/* --- 1. HERO SECTION (WIX.COM MODEL - PREMIUM DARK) --- */}
        <section 
          id="hero" 
          className="pt-28 pb-20 sm:pt-36 sm:pb-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-950 text-white border-b border-slate-800/80"
        >
          {/* Ambient glowing radial light flares */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/20 to-emerald-500/15 rounded-full blur-[120px] pointer-events-none -z-0"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

          <div className="max-w-6xl mx-auto text-center relative z-10 space-y-8">
            
            {/* Giant Wix-Style Centered Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-white max-w-5xl mx-auto"
            >
              Your Own Booking Website. <br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                Not a Widget. Not Complicated.
              </span>
            </motion.h1>

            {/* Centered Bullet/Badge Value Prop Line */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-slate-300 font-semibold text-sm sm:text-lg max-w-4xl mx-auto leading-relaxed bg-slate-900/60 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-slate-800/80 shadow-inner"
            >
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Sparkles className="w-4 h-4 text-cyan-400 inline" /> Live in 2 minutes
              </span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="text-emerald-300 font-bold">Zero commission or booking fees</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="text-slate-200">No technical skill needed</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="text-sky-300 font-bold">AI builds your tours in under 5 minutes</span>
            </motion.div>

            {/* Centered CTA Button Group */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
            >
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-base sm:text-lg px-9 py-4 rounded-full shadow-2xl shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.98] group"
              >
                <span>Try it Free</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => setShowDemoModal(true)}
                className="w-full sm:w-auto bg-slate-800/90 hover:bg-slate-700/90 text-white font-bold text-base sm:text-lg px-8 py-4 rounded-full border border-slate-700 shadow-sm flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:border-slate-600 hover:scale-[1.03] active:scale-[0.98] group"
              >
                <div className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                  <Play className="h-3 w-3 fill-current ml-0.5" />
                </div>
                <span>Try Demo</span>
              </button>
            </motion.div>

            <p className="text-xs font-semibold text-slate-400 pt-1">
              7 Days Free. No credit card required.
            </p>

            {/* --- WIX-STYLE HORIZONTAL SLIDESHOW SHOWCASE --- */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pt-8 relative max-w-6xl mx-auto"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              
              {/* SLIDESHOW STAGE CONTAINER */}
              <div className="relative flex items-center justify-center min-h-[320px] sm:min-h-[460px] md:min-h-[520px] overflow-visible px-2">
                
                {/* 1. PREVIOUS SLIDE (LEFT BACKGROUND RECTANGLE) */}
                <div 
                  onClick={() => setActiveSlide((activeSlide - 1 + heroSlideshowImages.length) % heroSlideshowImages.length)}
                  className="absolute left-2 sm:left-4 md:left-8 top-12 sm:top-16 z-10 w-[38%] sm:w-[35%] opacity-40 hover:opacity-80 scale-90 blur-[1px] hover:blur-0 rounded-2xl shadow-2xl border border-slate-800 bg-slate-900 overflow-hidden cursor-pointer transition-all duration-500 transform -rotate-3 hover:scale-95"
                >
                  <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                    <span className="text-[9px] font-mono text-slate-400 truncate ml-2">
                      {heroSlideshowImages[(activeSlide - 1 + heroSlideshowImages.length) % heroSlideshowImages.length].domain}
                    </span>
                  </div>
                  <img 
                    src={heroSlideshowImages[(activeSlide - 1 + heroSlideshowImages.length) % heroSlideshowImages.length].url} 
                    alt="Previous slide" 
                    className="w-full h-auto object-cover object-top opacity-80"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* 2. NEXT SLIDE (RIGHT BACKGROUND RECTANGLE) */}
                <div 
                  onClick={() => setActiveSlide((activeSlide + 1) % heroSlideshowImages.length)}
                  className="absolute right-2 sm:right-4 md:right-8 top-12 sm:top-16 z-10 w-[38%] sm:w-[35%] opacity-40 hover:opacity-80 scale-90 blur-[1px] hover:blur-0 rounded-2xl shadow-2xl border border-slate-800 bg-slate-900 overflow-hidden cursor-pointer transition-all duration-500 transform rotate-3 hover:scale-95"
                >
                  <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                    <span className="text-[9px] font-mono text-slate-400 truncate ml-2">
                      {heroSlideshowImages[(activeSlide + 1) % heroSlideshowImages.length].domain}
                    </span>
                  </div>
                  <img 
                    src={heroSlideshowImages[(activeSlide + 1) % heroSlideshowImages.length].url} 
                    alt="Next slide" 
                    className="w-full h-auto object-cover object-top opacity-80"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* 3. CENTER ACTIVE SLIDE (WIX HERO FOCAL WINDOW) */}
                <div className="relative z-20 w-[82%] sm:w-[75%] md:w-[70%] bg-slate-900 rounded-2xl shadow-[0_30px_90px_-15px_rgba(0,0,0,0.8)] border border-slate-700/80 overflow-hidden text-left transition-all duration-500 transform">
                  
                  {/* Browser Chrome Navbar */}
                  <div className="bg-slate-900/95 backdrop-blur-md px-3.5 sm:px-5 py-2.5 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    </div>

                    <div className="bg-slate-800/90 text-slate-300 text-[10px] sm:text-xs font-mono px-3.5 py-1 rounded-md border border-slate-700/80 flex items-center gap-2 shadow-inner">
                      <span className="text-emerald-400">🔒</span>
                      <span className="font-semibold text-white">
                        {heroSlideshowImages[activeSlide].domain}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        LIVE DEMO
                      </span>
                    </div>
                  </div>

                  {/* Active Screenshot Frame */}
                  <div className="relative overflow-hidden bg-slate-950 min-h-[220px] sm:min-h-[340px]">
                    <AnimatePresence mode="wait">
                      <motion.img 
                        key={activeSlide}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.4 }}
                        src={heroSlideshowImages[activeSlide].url} 
                        alt={heroSlideshowImages[activeSlide].title} 
                        className="w-full h-auto object-cover object-top block"
                        referrerPolicy="no-referrer"
                      />
                    </AnimatePresence>

                    {/* WIX-STYLE FLOATING AI CHAT PROMPT OVERLAY */}
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={`prompt-${activeSlide}`}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="absolute right-3 sm:right-6 bottom-3 sm:bottom-6 z-30 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 sm:p-4 max-w-[240px] sm:max-w-[300px] text-slate-900 hidden xs:block"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                            ✨
                          </div>
                          <span className="font-extrabold text-xs text-slate-900">Ask Aria AI</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Ready</span>
                        </div>
                      </div>

                      <p className="text-[10px] sm:text-xs text-slate-700 font-medium leading-snug bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 mb-2.5">
                        "{heroSlideshowImages[activeSlide].prompt}"
                      </p>

                      <div className="bg-slate-100 rounded-full px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Generating layout...</span>
                        <div className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[9px]">
                          ↑
                        </div>
                      </div>
                    </motion.div>

                  </div>

                </div>

                {/* SLIDESHOW NAVIGATION ARROWS */}
                <button 
                  onClick={() => setActiveSlide((activeSlide - 1 + heroSlideshowImages.length) % heroSlideshowImages.length)}
                  className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-slate-800 p-2.5 sm:p-3 rounded-full shadow-lg border border-slate-200/80 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  title="Previous Site"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                <button 
                  onClick={() => setActiveSlide((activeSlide + 1) % heroSlideshowImages.length)}
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-slate-800 p-2.5 sm:p-3 rounded-full shadow-lg border border-slate-200/80 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  title="Next Site"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

              </div>

              {/* SLIDESHOW DOTS SELECTOR BELOW CAROUSEL */}
              <div className="pt-6 flex flex-col items-center gap-3">
                {/* Dot Indicators */}
                <div className="flex items-center gap-1.5">
                  {heroSlideshowImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        activeSlide === idx ? 'w-6 bg-slate-900' : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
              </div>

            </motion.div>

          </div>
        </section>

        {/* --- 2. LOGO CLOUD (POWERED BY THE STACK YOU TRUST) --- */}
        <section id="logos" className="py-12 bg-slate-50/70 border-y border-slate-200/50 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">
              POWERED BY THE STACK YOU TRUST
            </p>

            <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 md:gap-16">
              
              {/* Firebase */}
              <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-all cursor-pointer hover:scale-105 group">
                <img 
                  src="https://i.ibb.co.com/s9YgF0yS/firebase.png" 
                  alt="Firebase" 
                  referrerPolicy="no-referrer"
                  className="h-6 sm:h-7 w-auto object-contain"
                />
                <span className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">Firebase</span>
              </div>

              {/* Stripe */}
              <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-all cursor-pointer hover:scale-105 group">
                <img 
                  src="https://i.ibb.co.com/gb6tFnrN/stripe.jpg" 
                  alt="Stripe" 
                  referrerPolicy="no-referrer"
                  className="h-6 sm:h-7 w-auto object-contain mix-blend-multiply rounded-xs"
                />
                <span className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">Stripe</span>
              </div>

              {/* PayPal */}
              <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-all cursor-pointer hover:scale-105 group">
                <img 
                  src="https://i.ibb.co.com/20D5cDRw/paypal.png" 
                  alt="PayPal" 
                  referrerPolicy="no-referrer"
                  className="h-6 sm:h-7 w-auto object-contain"
                />
                <span className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">PayPal</span>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-all cursor-pointer hover:scale-105 group">
                <img 
                  src="https://i.ibb.co.com/7dXQmL8M/Whats-App-Logo-wine.png" 
                  alt="WhatsApp" 
                  referrerPolicy="no-referrer"
                  className="h-6 sm:h-7 w-auto object-contain"
                />
                <span className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">WhatsApp</span>
              </div>

              {/* Vercel */}
              <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-all cursor-pointer hover:scale-105 group">
                <img 
                  src="https://i.ibb.co.com/bjDj8TGh/vercel.jpg" 
                  alt="Vercel" 
                  referrerPolicy="no-referrer"
                  className="h-5 sm:h-6 w-auto object-contain mix-blend-multiply rounded-xs"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.insertAdjacentHTML('beforebegin', '<svg class="h-5 w-auto fill-slate-900 mr-1" viewBox="0 0 76 65"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/></svg>');
                    }
                  }}
                />
                <span className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">Vercel</span>
              </div>

              {/* Resend */}
              <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-all cursor-pointer hover:scale-105 group">
                <img 
                  src="https://i.ibb.co.com/27pGFXpW/Resend.jpg" 
                  alt="Resend" 
                  referrerPolicy="no-referrer"
                  className="h-5 sm:h-6 w-auto object-contain mix-blend-multiply rounded-xs"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.insertAdjacentHTML('beforebegin', '<svg class="h-5 w-auto fill-slate-900 mr-1" viewBox="0 0 24 24"><path d="M2 5.5A2.5 2.5 0 014.5 3h15A2.5 2.5 0 0122 5.5v13a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 012 18.5v-13zm2.5-.5a1 1 0 00-1 1v.793l8.5 5.312 8.5-5.312V6a1 1 0 00-1-1h-15zm16 3.528l-7.97 4.981a1 1 0 01-1.06 0L3.5 8.528V18.5a1 1 0 001 1h15a1 1 0 001-1V8.528z"/></svg>');
                    }
                  }}
                />
                <span className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">Resend</span>
              </div>

            </div>
          </div>
        </section>

        {/* --- 3. REFINED & REDESIGNED SIMPLE ONBOARDING STEPS --- */}
        <section id="how-it-works" className="py-24 md:py-32 bg-slate-50 text-slate-900 relative overflow-hidden border-b border-slate-200/80">
          {/* Subtle Ambient Background Lighting */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-black tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Simple Onboarding</span>
              </span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Go Live in Just 5 Simple Steps
              </h2>
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
                Zero coding or technical setup required. Our hybrid AI website engine handles the entire build process automatically in under 2 minutes.
              </p>
            </div>

            {/* Step Progress Bar & Connected Timeline Cards */}
            <div className="relative">
              
              {/* Desktop Connecting Progress Line */}
              <div className="hidden lg:block absolute top-[52px] left-[8%] right-[8%] h-[3px] bg-slate-200 rounded-full z-0">
                <div className="h-full w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full opacity-60"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-4 relative z-10">
                
                {[
                  { 
                    num: "1", 
                    stepTag: "01",
                    title: "Create Account", 
                    desc: "Sign up free in seconds with no credit card required.",
                    icon: Rocket,
                    color: "text-blue-600",
                    glow: "group-hover:border-blue-500/50 group-hover:shadow-blue-500/10",
                    badgeBg: "bg-blue-50 text-blue-600 border-blue-200"
                  },
                  { 
                    num: "2", 
                    stepTag: "02",
                    title: "Tell Us About You", 
                    desc: "Describe your destination, tour packages, and brand vibe.",
                    icon: Compass,
                    color: "text-indigo-600",
                    glow: "group-hover:border-indigo-500/50 group-hover:shadow-indigo-500/10",
                    badgeBg: "bg-indigo-50 text-indigo-600 border-indigo-200"
                  },
                  { 
                    num: "3", 
                    stepTag: "03",
                    title: "AI Provisioning", 
                    desc: "Full website layout, pages, and booking system generated in 2 minutes.",
                    icon: Zap,
                    color: "text-amber-600",
                    glow: "group-hover:border-amber-500/50 group-hover:shadow-amber-500/10",
                    badgeBg: "bg-amber-50 text-amber-600 border-amber-200"
                  },
                  { 
                    num: "4", 
                    stepTag: "04",
                    title: "Connect Domain", 
                    desc: "Link your custom business domain with automated SSL.",
                    icon: Globe,
                    color: "text-cyan-600",
                    glow: "group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/10",
                    badgeBg: "bg-cyan-50 text-cyan-600 border-cyan-200"
                  },
                  { 
                    num: "5", 
                    stepTag: "05",
                    title: "Start Taking Bookings", 
                    desc: "Accept instant credit card payments & send automated WhatsApp vouchers.",
                    icon: CheckCircle2,
                    color: "text-emerald-600",
                    glow: "group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/10",
                    badgeBg: "bg-emerald-50 text-emerald-600 border-emerald-200"
                  }
                ].map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className={`group relative bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${item.glow}`}
                    >
                      <div>
                        {/* Circle Step Number Indicator Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className={`w-12 h-12 rounded-2xl ${item.badgeBg} border flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 duration-300 shadow-xs`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span className="text-2xl font-black text-slate-300 font-mono group-hover:text-slate-500 transition-colors">
                            {item.stepTag}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {item.desc}
                        </p>
                      </div>

                      {/* Step Tag Footer */}
                      <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>STEP {item.num} OF 5</span>
                        <span className={`font-bold ${item.color}`}>Ready in 2m</span>
                      </div>
                    </motion.div>
                  );
                })}

              </div>

            </div>

            {/* Bottom Callout Bar */}
            <div className="mt-16 text-center">
              <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white border border-slate-200 px-8 py-4 rounded-full shadow-lg">
                <span className="text-sm font-medium text-slate-700">
                  Ready to launch your tour website today?
                </span>
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-sm px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* --- 4. EVERYTHING YOU NEED TO RUN YOUR TOUR BUSINESS (Features Grid - DARK THEME) --- */}
        <section id="features" className="py-24 md:py-32 bg-slate-900 text-white relative overflow-hidden border-y border-slate-800">
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1.5 rounded-full mb-4 inline-block">
                ALL-IN-ONE PLATFORM
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                Everything You Need to Run <br />Your Tour Business
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  icon: Layout, 
                  color: "text-cyan-400", 
                  bg: "bg-cyan-500/10 border border-cyan-500/20", 
                  title: "AI Website Builder", 
                  desc: "Generate your complete website in minutes with zero code." 
                },
                { 
                  icon: Map, 
                  color: "text-indigo-400", 
                  bg: "bg-indigo-500/10 border border-indigo-500/20", 
                  title: "AI Tour Creator", 
                  desc: "Create professional tour pages instantly with AI-generated content." 
                },
                { 
                  icon: Sparkles, 
                  color: "text-amber-400", 
                  bg: "bg-amber-500/10 border border-amber-500/20", 
                  title: "Booking Engine", 
                  desc: "Online bookings with real-time availability management." 
                },
                { 
                  icon: CreditCard, 
                  color: "text-emerald-400", 
                  bg: "bg-emerald-500/10 border border-emerald-500/20", 
                  title: "Online Payments", 
                  desc: "Stripe, PayPal, Bank Transfer and more payment options." 
                },
                { 
                  icon: MessageCircle, 
                  color: "text-emerald-400", 
                  bg: "bg-emerald-500/10 border border-emerald-500/20", 
                  title: "WhatsApp Automation", 
                  desc: "Automatically notify customers and deliver tickets via WhatsApp." 
                },
                { 
                  icon: Mail, 
                  color: "text-rose-400", 
                  bg: "bg-rose-500/10 border border-rose-500/20", 
                  title: "Email Automation", 
                  desc: "Booking confirmations and reminders sent automatically." 
                },
                { 
                  icon: FileText, 
                  color: "text-purple-400", 
                  bg: "bg-purple-500/10 border border-purple-500/20", 
                  title: "SEO Content Generator", 
                  desc: "AI writes SEO blogs that attract organic traffic automatically." 
                },
                { 
                  icon: BarChart, 
                  color: "text-sky-400", 
                  bg: "bg-sky-500/10 border border-sky-500/20", 
                  title: "Dashboard & Reports", 
                  desc: "Track bookings, revenue and customers in one place." 
                },
              ].map((feature, i) => (
                <div key={i} className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700/80 shadow-md hover:shadow-2xl hover:border-slate-600 hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* --- 5. THE SMARTER ALTERNATIVE (Traditional vs Tripbone) --- */}
        <section className="py-24 md:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full mb-4 inline-block">
                WHY CHOOSE TRIPBONE
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                The Smarter Alternative
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              
              {/* Left Column: Traditional */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 md:p-12 shadow-sm relative overflow-hidden">
                <span className="absolute top-4 right-4 text-xs font-mono font-bold text-slate-300">TRADITIONAL WAY</span>
                <h3 className="text-2xl font-black text-slate-400 mb-8 pb-4 border-b border-slate-200/60 flex items-center gap-2">
                  <X className="w-6 h-6 text-red-500" />
                  <span>Traditional Approach</span>
                </h3>
                <ul className="space-y-6">
                  {[
                    "Build your own website",
                    "Install & configure plugins",
                    "Configure hosting separately",
                    "Hire expensive developers",
                    "Learn WordPress / tech stack",
                    "Spend days or weeks setting up"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-sm font-semibold text-slate-600">
                      <X className="w-5 h-5 text-red-400 mr-3.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Column: Tripbone */}
              <div className="bg-slate-900 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#1db3cd]/10 rounded-full blur-[80px] pointer-events-none"></div>
                <span className="absolute top-4 right-4 text-xs font-mono font-bold text-slate-700">MODERN STACK</span>
                <h3 className="text-2xl font-black text-[#1db3cd] mb-8 pb-4 border-b border-slate-800 flex items-center gap-2">
                  <Check className="w-6 h-6 text-[#05c46b]" />
                  <span>Tripbone</span>
                </h3>
                <ul className="space-y-6 relative z-10">
                  {[
                    "AI builds your entire site in 2 mins",
                    "Zero tech skills required",
                    "Hosting & domain included",
                    "Built-in booking & payments",
                    "Automated WhatsApp & Email",
                    "Live and selling in minutes"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-sm font-bold text-white">
                      <Check className="w-5 h-5 text-[#05c46b] mr-3.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>
        </section>

        {/* --- 6. BUILT DIFFERENT / THREE SUPERPOWERS (High-Fidelity Interaction Bento Grid) --- */}
        <section className="py-24 md:py-32 bg-slate-50/50 border-t border-slate-200/50">
          <div className="max-w-7xl mx-auto px-6">
            
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-xs font-black text-[#1db3cd] uppercase tracking-widest bg-cyan-50 border border-cyan-200/50 px-3.5 py-1.5 rounded-full mb-4 inline-block">
                BUILT DIFFERENT
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Everything you need to <br />dominate your market
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Column 1: Setup & AI */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                    <Zap className="w-6 h-6 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">Instant Setup & AI</h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-6">
                    AI writes your tours, generates SEO blog posts, and translates your site into 30+ languages automatically.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Live in 2 minutes",
                      "Zero tech skills required",
                      "Connect your own domain"
                    ].map((li, idx) => (
                      <li key={idx} className="flex items-center text-xs font-bold text-slate-700">
                        <Check className="w-4 h-4 text-[#05c46b] mr-2" />
                        <span>{li}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Visual simulator mockup inside column */}
                <div className="bg-slate-900 rounded-2xl p-4 text-[10px] font-mono text-slate-300">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                    <span className="text-[9px] text-[#1db3cd] font-bold">🤖 TRIPBONE CO-PILOT</span>
                    <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">active</span>
                  </div>
                  <p className="text-slate-400">Prompt: "Mt Batur sunrise jeep tour"</p>
                  <div className="mt-2 text-white bg-slate-850 p-2 rounded border border-slate-800 space-y-1">
                    <p className="font-extrabold text-[#05c46b]">✨ Completed Site Structure</p>
                    <p className="text-[9px] text-slate-400">✓ Booking Flow Map Added</p>
                    <p className="text-[9px] text-slate-400">✓ 4.9 Star Reviews Generated</p>
                  </div>
                </div>
              </div>

              {/* Column 2: Built to Convert */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                    <Smartphone className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">Built to Convert</h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-6">
                    70% of bookings happen on phones. Your Tripbone site looks and feels like a native mobile app out of the box.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Mobile-first app design",
                      "Gorgeous design capabilities",
                      "Lightning-fast SEO architecture"
                    ].map((li, idx) => (
                      <li key={idx} className="flex items-center text-xs font-bold text-slate-700">
                        <Check className="w-4 h-4 text-[#05c46b] mr-2" />
                        <span>{li}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Visual simulator mockup inside column */}
                <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200">
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-150 text-[10px] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-900">Confirm Booking</span>
                      <span className="font-bold text-[#05c46b]">$120 USD</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded w-full"></div>
                    <div className="h-2 bg-slate-100 rounded w-2/3"></div>
                    <button className="w-full py-2 bg-slate-900 text-white font-extrabold text-[10px] rounded-lg">
                      Pay Securely
                    </button>
                  </div>
                </div>
              </div>

              {/* Column 3: Autopilot Operations */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                    <MessageCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">Autopilot Operations</h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-6">
                    Automate your entire back-office. Engage customers directly where they already are with native WhatsApp automation.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "WhatsApp ticket delivery",
                      "Automated review requests",
                      "Easy package & tiered pricing"
                    ].map((li, idx) => (
                      <li key={idx} className="flex items-center text-xs font-bold text-slate-700">
                        <Check className="w-4 h-4 text-[#05c46b] mr-2" />
                        <span>{li}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Visual simulator mockup inside column */}
                <div className="bg-slate-950 text-slate-300 rounded-2xl p-4 text-[10px] font-mono space-y-2">
                  <div className="flex justify-between pb-1 border-b border-slate-800">
                    <span className="text-[#05c46b] font-bold">💬 WhatsApp Flow</span>
                    <span className="text-slate-500">active</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded text-slate-400">
                    <p className="text-white font-bold">1. Customer Books</p>
                    <p className="text-[9px]">→ WhatsApp trigger sent instantly</p>
                  </div>
                  <div className="bg-slate-900 p-2 rounded text-slate-400">
                    <p className="text-white font-bold">2. Day of Tour (7:00 AM)</p>
                    <p className="text-[9px]">→ Driver contact card shared</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* --- 7. SITES POWERED BY TRIPBONE (Live Showcase list from Firestore) --- */}
        <section id="showcases" className="py-24 md:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            
            <div className="text-center max-w-2xl mx-auto mb-20">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full mb-4 inline-block">
                LIVE EXAMPLES
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Sites Powered by Tripbone
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Explore how tour operators are transforming their digital presence and driving more sales.
              </p>
            </div>

            {/* Showcase Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {showcases.length > 0 ? (
                // Show maximum of 3 elegant showcases on the landing page
                showcases.slice(0, 3).map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    key={item.id} 
                    className="rounded-2xl overflow-hidden shadow-lg border border-slate-200/70 bg-white group hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Browser mockup header */}
                      <div className="w-full h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 justify-between z-10 relative">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 truncate max-w-[150px]">
                          {item.url ? item.url.replace(/^https?:\/\//i, '') : 'client-site'}
                        </span>
                        <div className="w-4"></div>
                      </div>
                      <div className="relative h-[220px] w-full overflow-hidden bg-slate-50">
                        {item.screenshotUrl ? (
                          <img 
                            src={item.screenshotUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-350 bg-slate-50">
                            <Layers className="w-12 h-12 stroke-1 text-slate-400" />
                            <span className="text-[10px] font-mono mt-2 uppercase tracking-widest font-black text-slate-400">Preview Pending</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6 text-left">
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-[#1db3cd] transition-colors truncate">
                            {item.title}
                          </h3>
                          <CheckCircle2 className="w-4 h-4 text-[#05c46b] fill-green-50" />
                        </div>
                        <p className="text-xs text-slate-400 font-mono mb-2">
                          {item.location || 'Global Operations'} • {item.category || 'Tours & Excursions'}
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {item.description || 'Verified Tripbone partner website.'}
                        </p>
                      </div>
                    </div>
                    <div className="px-6 pb-6 text-left">
                      <a 
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-slate-700 hover:text-[#1db3cd] inline-flex items-center space-x-1.5 border border-slate-250 px-3.5 py-1.5 rounded-lg hover:border-cyan-100 hover:bg-cyan-50/20 transition-all cursor-pointer"
                      >
                        <span>Visit Live Site</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                ))
              ) : (
                /* Static High-End Mock showcases from wireframe */
                [
                  { 
                    title: "Bali Adventure Tours", 
                    location: "Bali, Indonesia",
                    category: "Adventure & Trekking",
                    desc: "Premium booking platform for white water rafting, ATV rides, and volcano hikes with real-time digital ticket generation.",
                    img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80"
                  },
                  { 
                    title: "Patagonia Expeditions", 
                    location: "Argentina",
                    category: "Hiking & Wildlife",
                    desc: "Specialist trekking guides featuring customizable multi-day trekking itineraries and fast client registration maps.",
                    img: "https://images.unsplash.com/photo-1517022812141-23620dba5c23?auto=format&fit=crop&w=600&q=80"
                  },
                  { 
                    title: "Sahara Desert Trips", 
                    location: "Morocco",
                    category: "Desert & Culture",
                    desc: "Multi-supplier custom itinerary luxury desert glamping portal featuring native multilingual booking flows.",
                    img: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80"
                  }
                ].map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white group hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Browser toolbar header */}
                      <div className="w-full h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-1.5 z-10 relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
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
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-[#1db3cd] transition-colors truncate">
                            {item.title}
                          </h3>
                          <CheckCircle2 className="w-4 h-4 text-[#05c46b] fill-green-50" />
                        </div>
                        <p className="text-xs text-slate-400 font-mono mb-2">
                          {item.location} • {item.category}
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <div className="px-6 pb-6 text-left">
                      <span className="text-xs font-bold text-slate-700 hover:text-[#1db3cd] inline-flex items-center space-x-1.5 border border-slate-250 px-3.5 py-1.5 rounded-lg hover:border-cyan-100 hover:bg-cyan-50/20 transition-all cursor-pointer">
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
                className="inline-flex items-center space-x-2.5 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
              >
                <span>See More Sites</span>
                <Globe className="w-5 h-5 text-indigo-400" />
              </Link>
            </div>

          </div>
        </section>

        {/* --- 8. SAVE THOUSANDS / ONE PLATFORM INSTEAD --- */}
        <section className="py-24 md:py-32 bg-slate-50/50 border-y border-slate-200/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left text panel */}
              <div className="lg:col-span-5 text-left space-y-6">
                <span className="text-xs font-black text-[#1db3cd] uppercase tracking-widest bg-cyan-50 border border-cyan-200/50 px-3.5 py-1.5 rounded-full inline-block">
                  SAVE THOUSANDS
                </span>
                <h2 className="text-4.5xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  One platform.<br />
                  Instead of paying<br />
                  for all of these.
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                  Use one platform instead of managing 8+ different tools, subscriptions, and external contractor invoices.
                </p>
                <div className="pt-4">
                  <button 
                    onClick={handleGetStarted} 
                    className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-base font-bold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    Start Saving Today
                  </button>
                </div>
              </div>

              {/* Right pricing grids */}
              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { tool: "Website Designer", price: "$2,500+" },
                    { tool: "WordPress Dev", price: "$3,000+" },
                    { tool: "Booking Plugin", price: "$499/yr" },
                    { tool: "Hosting", price: "$300/yr" },
                    { tool: "SEO Plugin", price: "$199/yr" },
                    { tool: "Email Software", price: "$300/yr" },
                    { tool: "WhatsApp Tool", price: "$240/yr" },
                    { tool: "CRM", price: "$600/yr" }
                  ].map((item, i) => (
                    <div key={i} className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-900">{item.tool}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Standard alternative cost</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-red-500 line-through decoration-2">
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
        <section className="py-24 md:py-32 bg-slate-50/50 border-t border-slate-200/40">
          <div className="max-w-3xl mx-auto px-6">
            
            <div className="text-center mb-16">
              <span className="text-xs font-black text-[#1db3cd] uppercase tracking-widest bg-cyan-50 border border-cyan-200/50 px-3.5 py-1.5 rounded-full mb-4 inline-block">
                FAQ
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            {/* FAQ Accordion list */}
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
                  <button 
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none cursor-pointer hover:bg-slate-50/50"
                  >
                    <span className="font-extrabold text-base md:text-lg text-slate-900 pr-4">{faq.q}</span>
                    {openFaq === idx 
                      ? <ChevronUp className="w-5 h-5 text-[#1db3cd] shrink-0" /> 
                      : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    }
                  </button>
                  <div className={`px-6 overflow-hidden transition-all duration-300 ${
                    openFaq === idx ? 'max-h-[200px] pb-6 border-t border-slate-100 pt-4' : 'max-h-0'
                  }`}>
                    <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* --- 11. FINAL CTA BLOCK --- */}
        <section className="py-24 md:py-32 bg-slate-950 text-white relative overflow-hidden text-center px-6">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at center, ${brandColor}25, transparent 70%)` }} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#05c46b]/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[100px] pointer-events-none mix-blend-screen" style={{ backgroundColor: `${brandColor}05` }} />
          
          <div className="max-w-4xl mx-auto relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Ready to elevate your <br />tour business?
            </h2>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Join thousands of tour operators who have transformed their business with Tripbone. Start your free trial today.
            </p>
            
            {/* CTA controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-4">
              <button 
                onClick={() => navigate('/pricing')} 
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-950 text-base font-extrabold rounded-xl shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                Try it Free
              </button>
              <button 
                onClick={() => setShowDemoModal(true)} 
                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-slate-750 hover:bg-slate-900 text-white text-base font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Watch Demo
              </button>
            </div>

            {/* Trial terms list */}
            <p className="text-xs text-slate-500 font-medium">
              No credit card required • Free 7-day trial • Cancel anytime
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] pointer-events-none" style={{ backgroundColor: `${brandColor}20` }} />
              
              <button 
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative text-center mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                  Unlock Free Access to the Demo
                </h3>
                <p className="text-slate-500 text-sm mt-1.5">
                  Enter your info to watch how Tripbone builds and manages websites in under 2 minutes.
                </p>
              </div>

              <form onSubmit={handleWatchDemoSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. John Doe"
                    value={demoLead.name}
                    onChange={(e) => setDemoLead({ ...demoLead, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded-xl text-sm transition-all outline-none text-slate-900 font-medium"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Work Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="john@example.com"
                    value={demoLead.email}
                    onChange={(e) => setDemoLead({ ...demoLead, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded-xl text-sm transition-all outline-none text-slate-900 font-medium"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={submittingLead}
                  className="w-full mt-6 py-3.5 text-white font-extrabold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center"
                  style={{ backgroundColor: brandColor }}
                >
                  {submittingLead ? (
                    <span>Saving and Redirecting...</span>
                  ) : (
                    <>
                      <span>Watch Demo Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
              
              <p className="text-center text-[10px] text-slate-400 mt-4 leading-relaxed">
                By clicking "Watch Demo", you agree to receive platform trial notifications. We never share your data.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
