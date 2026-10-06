import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Compass, ChevronDown, Sparkles, LayoutTemplate, BriefcaseBusiness, 
  Navigation, ShieldCheck, X, Menu, BookOpen, Store, Building2, HelpCircle, ArrowRight
} from 'lucide-react';
import { useSettings } from '../../lib/SettingsContext';
import { useAuth } from '../../lib/AuthContext';
import TopAnnouncementBar from '../TopAnnouncementBar';
import CustomFooterEmbed from '../CustomFooterEmbed';
import { 
  initPostHog, 
  trackPostHogPageView, 
  trackPostHogMarketingCTA, 
  trackPostHogCookieConsent 
} from '../../lib/posthog';

export default function SaaSLayout() {
  const { settings, globalBrand } = useSettings();
  const { user } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Initialize PostHog for Tripbone.com main site platform
  useEffect(() => {
    initPostHog(null);
  }, []);

  // Track pageviews whenever route changes on main site
  useEffect(() => {
    trackPostHogPageView(location.pathname + location.search, {
      site_section: isHome ? 'marketing_home' : location.pathname.replace('/', '') || 'root',
      platform_scope: 'tripbone_main_site'
    });
  }, [location.pathname, location.search, isHome]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const consent = localStorage.getItem('tripbone-cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => {
        setShowCookieBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('tripbone-cookie-consent', 'accepted');
    setShowCookieBanner(false);
    trackPostHogCookieConsent({ decision: 'accepted' });
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('tripbone-cookie-consent', 'declined');
    setShowCookieBanner(false);
    trackPostHogCookieConsent({ decision: 'declined' });
  };

  const brandColor = globalBrand?.brandColor || '#00aa13';
  const saasFooterEmbed = (
    (globalBrand?.footerEmbedEnabled !== false && globalBrand?.footerEmbedCode) ||
    (settings?.footerEmbedEnabled !== false && settings?.footerEmbedCode)
  )?.trim() || null;

  const handleLoginClick = () => {
    trackPostHogMarketingCTA({
      ctaName: 'Log in',
      location: 'navbar_top',
      destination: '/login',
      section: 'main_header'
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
      window.location.href = '/login';
    } else {
      window.location.href = hostname === 'localhost' 
        ? `http://app.localhost${port}/login` 
        : 'https://app.tripbone.com/login';
    }
  };

  const handleSignupClick = () => {
    trackPostHogMarketingCTA({
      ctaName: 'Start Free Trial',
      location: 'navbar_top',
      destination: '/signup',
      section: 'main_header'
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

  const isTransparent = false;

  return (
    <div className="min-h-screen font-sans selection-brand-color bg-[#f6f8f6] text-[#1a1d1b] overflow-x-hidden relative flex flex-col">
      <style>{`
        .text-brand { color: ${brandColor} !important; }
        .bg-brand { background-color: ${brandColor} !important; }
        .hover\\:text-brand:hover { color: ${brandColor} !important; }
        .hover\\:bg-brand:hover { background-color: ${brandColor} !important; }
        .border-brand { border-color: ${brandColor} !important; }
        .group\\/item:hover .group-hover\\/item\\:text-brand { color: ${brandColor} !important; }
        .selection-brand-color::selection { background-color: ${brandColor} !important; color: white !important; }
      `}</style>
      
      {/* Top Fixed Header with Clean Glassmorphism */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopAnnouncementBar />
        <header className="w-full transition-all duration-300 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-slate-900">
          <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
            
            {/* Logo + Primary Navigation */}
            <div className="flex items-center space-x-10">
              <Link to="/" className="flex items-center space-x-3 cursor-pointer group">
                {globalBrand?.logoUrl || settings?.logoURL ? (
                  <img src={globalBrand?.logoUrl || settings?.logoURL} alt={globalBrand?.platformName || settings?.siteName || "Tripbone"} className="h-8 max-w-[150px] object-contain" />
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                      <Compass className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-black tracking-tight text-slate-950 font-sans">
                        {globalBrand?.platformName || settings?.siteName || "Tripbone"}
                      </span>
                      <span className="text-[10px] tracking-wider font-semibold text-slate-400 uppercase -mt-1 font-mono">
                        Tour OS & Engine
                      </span>
                    </div>
                  </>
                )}
              </Link>

              <nav className="hidden lg:flex items-center space-x-2 text-sm font-medium text-slate-600">
                
                {/* Features Dropdown */}
                <div 
                  className="relative"
                  onMouseEnter={() => setIsFeaturesOpen(true)}
                  onMouseLeave={() => setIsFeaturesOpen(false)}
                >
                  <button className="flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors cursor-pointer hover:text-slate-950 hover:bg-slate-100/80 text-slate-700">
                    <span className="font-semibold text-[13px]">Platform Features</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isFeaturesOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`} />
                  </button>
                  
                  {/* Mega Menu */}
                  <div className={`absolute top-full left-0 w-[620px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-5 grid grid-cols-2 gap-3 transition-all duration-200 origin-top-left text-slate-900 ${isFeaturesOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                    
                    <Link to="/features/ai" className="group/item flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 group-hover/item:bg-emerald-600 group-hover/item:text-white text-emerald-700 transition-colors">
                        <Sparkles className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs mb-0.5 group-hover/item:text-emerald-700 transition-colors">Gemini AI Tour Studio</h4>
                        <p className="text-[11px] text-slate-500 leading-snug">Auto-generate tour itineraries, SEO copy, and multi-language translations.</p>
                      </div>
                    </Link>

                    <Link to="/features/operations" className="group/item flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 group-hover/item:bg-amber-600 group-hover/item:text-white text-amber-700 transition-colors">
                        <Navigation className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs mb-0.5 group-hover/item:text-amber-700 transition-colors">WhatsApp & Driver Dispatch</h4>
                        <p className="text-[11px] text-slate-500 leading-snug">Automated passenger notifications, live pickup GPS pins, and manifests.</p>
                      </div>
                    </Link>

                    <Link to="/features/sales" className="group/item flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover/item:bg-blue-600 group-hover/item:text-white text-blue-700 transition-colors">
                        <BriefcaseBusiness className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs mb-0.5 group-hover/item:text-blue-700 transition-colors">BYOPG Payment Engine</h4>
                        <p className="text-[11px] text-slate-500 leading-snug">Stripe, Midtrans, Xendit, PayPal, & offline transfers direct to your account.</p>
                      </div>
                    </Link>

                    <Link to="/features/design" className="group/item flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0 group-hover/item:bg-purple-600 group-hover/item:text-white text-purple-600 transition-colors">
                        <LayoutTemplate className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs mb-0.5 group-hover/item:text-purple-700 transition-colors">Mobile-First Storefronts</h4>
                        <p className="text-[11px] text-slate-500 leading-snug">JoyTime & modern themes with custom domains and sub-second loading.</p>
                      </div>
                    </Link>

                    <Link to="/features/infrastructure" className="group/item col-span-2 flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors border-t border-slate-100 mt-1 pt-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover/item:bg-slate-900 group-hover/item:text-white text-slate-700 transition-colors">
                        <ShieldCheck className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs mb-0.5 group-hover/item:text-emerald-700 transition-colors">Multi-Role Architecture & 0% Take Rate</h4>
                        <p className="text-[11px] text-slate-500 leading-snug">Admin, Supplier, Agent, and Staff roles with automated settlement logs.</p>
                      </div>
                    </Link>

                  </div>
                </div>

                <Link to="/industries" className="px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors hover:text-slate-950 hover:bg-slate-100/80">Industries</Link>
                <Link to="/compare" className="px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors hover:text-slate-950 hover:bg-slate-100/80">Compare</Link>
                <Link to="/pricing" className="px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors hover:text-slate-950 hover:bg-slate-100/80">Pricing</Link>
                <Link to="/docs" className="px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors hover:text-slate-950 hover:bg-slate-100/80">Academy</Link>
                
                {/* Resources Dropdown */}
                <div 
                  className="relative"
                  onMouseEnter={() => setIsResourcesOpen(true)}
                  onMouseLeave={() => setIsResourcesOpen(false)}
                >
                  <button className="flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors cursor-pointer hover:text-slate-950 hover:bg-slate-100/80 text-slate-700">
                    <span className="font-semibold text-[13px]">Resources</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isResourcesOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`} />
                  </button>

                  <div className={`absolute top-full left-0 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 space-y-1 transition-all duration-200 origin-top-left text-slate-900 ${isResourcesOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                    <Link to="/directory" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-800 hover:text-emerald-700 transition-colors">
                      <Store className="w-4 h-4 text-emerald-600" />
                      <span>Live Client Showcases</span>
                    </Link>
                    <Link to="/blog" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-800 hover:text-emerald-700 transition-colors">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>Operator Playbook & Blog</span>
                    </Link>
                    <Link to="/storyboard" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-800 hover:text-emerald-700 transition-colors">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Pitch Storyboard & Vision</span>
                    </Link>
                    <Link to="/contact" className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-800 hover:text-emerald-700 transition-colors">
                      <HelpCircle className="w-4 h-4 text-emerald-600" />
                      <span>Contact Support</span>
                    </Link>
                  </div>
                </div>

              </nav>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleLoginClick} 
                className="text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer text-slate-700 hover:text-slate-950 hover:bg-slate-100"
              >
                {user ? 'Go to Cockpit' : 'Sign In'}
              </button>

              {!user && (
                <button 
                  onClick={handleSignupClick} 
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4.5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer text-center"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              )}

              {/* Mobile Hamburger Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg transition-colors text-slate-700 hover:bg-slate-100 border border-slate-200"
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>

          {/* Mobile Drawer */}
          {isMobileMenuOpen && (
            <div className="lg:hidden bg-white text-slate-900 border-b border-[#dce1dc] px-6 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl">
              <div className="space-y-1">
                <Link 
                  to="/features/ai" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-[#1a1d1b] hover:bg-[#f1f4f1]"
                >
                  AI Tour Builder
                </Link>
                <Link 
                  to="/industries" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-[#1a1d1b] hover:bg-[#f1f4f1]"
                >
                  Industry Solutions
                </Link>
                <Link 
                  to="/compare" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-[#1a1d1b] hover:bg-[#f1f4f1]"
                >
                  Compare Platforms
                </Link>
                <Link 
                  to="/pricing" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-[#1a1d1b] hover:bg-[#f1f4f1]"
                >
                  Pricing
                </Link>
                <Link 
                  to="/directory" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-[#1a1d1b] hover:bg-[#f1f4f1]"
                >
                  Live Storefront Demos
                </Link>
                <Link 
                  to="/contact" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-[#1a1d1b] hover:bg-[#f1f4f1]"
                >
                  Contact Support
                </Link>
              </div>

              <div className="pt-3 border-t border-[#dce1dc] flex flex-col gap-2">
                <button 
                  onClick={handleSignupClick}
                  className="btn-kelola-primary w-full py-3 rounded-full text-white text-xs font-bold text-center"
                >
                  Start 7-Day Free Trial
                </button>
              </div>
            </div>
          )}

        </header>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full relative">
        <Outlet />
      </main>

      {/* Footer - Sleek Light Modern SaaS (Kelola style) */}
      <footer className="bg-[#e7ebe7] pt-16 pb-12 text-[#4b4f4c] border-t border-[#dce1dc] mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
            
            {/* Column 1: Brand Info */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2.5 mb-5">
                {globalBrand?.logoUrl || settings?.logoURL ? (
                  <img src={globalBrand?.logoUrl || settings?.logoURL} alt={globalBrand?.platformName || settings?.siteName || "Tripbone"} className="h-8 max-w-[140px] object-contain" />
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-[#00aa13] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,170,19,0.3)]">
                      <Compass className="h-4.5 w-4.5 text-white" />
                    </div>
                    <span className="text-xl font-extrabold tracking-tight text-[#1a1d1b]">
                      {globalBrand?.platformName || settings?.siteName || "Tripbone"}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs leading-relaxed mb-5 text-[#6f746f]">
                Your own booking website. Not a widget. Not complicated. Drive direct sales, automate WhatsApp dispatches, and eliminate booking commissions.
              </p>
              <div className="text-xs text-[#4b4f4c] space-y-1.5">
                <p className="flex items-center gap-2">
                  <span className="font-bold text-[#1a1d1b]">Support:</span>
                  <a href="mailto:support@tripbone.com" className="text-[#00790d] hover:underline">support@tripbone.com</a>
                </p>
              </div>
            </div>
            
            {/* Column 2: Industries */}
            <div>
              <h4 className="text-[#1a1d1b] font-bold text-xs mb-4 tracking-wider uppercase">Industries</h4>
              <ul className="space-y-2.5 text-xs text-[#4b4f4c]">
                <li><Link to="/industries/day-tours" className="hover:text-[#00790d] transition-colors">Day Tour Operator</Link></li>
                <li><Link to="/industries/atv-offroad" className="hover:text-[#00790d] transition-colors">ATV Operator</Link></li>
                <li><Link to="/industries/rafting-outdoor" className="hover:text-[#00790d] transition-colors">Rafting Operator</Link></li>
                <li><Link to="/industries/boat-charters" className="hover:text-[#00790d] transition-colors">Boat Charters & Cruises</Link></li>
                <li><Link to="/industries/food-culinary" className="hover:text-[#00790d] transition-colors">Food & Culinary Tours</Link></li>
                <li><Link to="/industries/rentals" className="hover:text-[#00790d] transition-colors">Equipment Rentals</Link></li>
              </ul>
            </div>

            {/* Column 3: Compare Us */}
            <div>
              <h4 className="text-[#1a1d1b] font-bold text-xs mb-4 tracking-wider uppercase">Compare Us</h4>
              <ul className="space-y-2.5 text-xs text-[#4b4f4c]">
                <li><Link to="/compare/bokun" className="hover:text-[#00790d] transition-colors">Tripbone vs Bokun</Link></li>
                <li><Link to="/compare/fareharbor" className="hover:text-[#00790d] transition-colors">Tripbone vs FareHarbor</Link></li>
                <li><Link to="/compare/rezdy" className="hover:text-[#00790d] transition-colors">Tripbone vs Rezdy</Link></li>
                <li><Link to="/compare/peek-pro" className="hover:text-[#00790d] transition-colors">Tripbone vs Peek Pro</Link></li>
                <li><Link to="/compare/regiondo" className="hover:text-[#00790d] transition-colors">Tripbone vs Regiondo</Link></li>
                <li><Link to="/compare/checkfront" className="hover:text-[#00790d] transition-colors">Tripbone vs Checkfront</Link></li>
              </ul>
            </div>

            {/* Column 4: Platform */}
            <div>
              <h4 className="text-[#1a1d1b] font-bold text-xs mb-4 tracking-wider uppercase">Platform & Company</h4>
              <ul className="space-y-2.5 text-xs text-[#4b4f4c]">
                <li><Link to="/features" className="hover:text-[#00790d] transition-colors">Platform Features</Link></li>
                <li><Link to="/pricing" className="hover:text-[#00790d] transition-colors">Pricing & Plans</Link></li>
                <li><Link to="/directory" className="hover:text-[#00790d] transition-colors">Live Store Demos</Link></li>
                <li><Link to="/about" className="hover:text-[#00790d] transition-colors">About Us</Link></li>
                <li><Link to="/blog" className="hover:text-[#00790d] transition-colors">Blog / Guides</Link></li>
                <li><Link to="/contact" className="hover:text-[#00790d] transition-colors">Contact Support</Link></li>
                <li><button onClick={handleLoginClick} className="hover:text-[#00790d] transition-colors cursor-pointer">{user ? 'Dashboard' : 'Log In'}</button></li>
              </ul>
            </div>

            {/* Column 5: Legal */}
            <div>
              <h4 className="text-[#1a1d1b] font-bold text-xs mb-4 tracking-wider uppercase">Legal</h4>
              <ul className="space-y-2.5 text-xs text-[#4b4f4c]">
                <li><Link to="/terms" className="hover:text-[#00790d] transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-[#00790d] transition-colors">Privacy Policy</Link></li>
                <li><Link to="/cookies" className="hover:text-[#00790d] transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>

          </div>

          {saasFooterEmbed && (
            <div className="border-t border-[#dce1dc] pt-6 pb-2 flex justify-center items-center">
              <CustomFooterEmbed html={saasFooterEmbed} />
            </div>
          )}
          
          <div className="border-t border-[#dce1dc] pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#6f746f]">
            <p>&copy; {new Date().getFullYear()} {globalBrand?.platformName || "Tripbone"}. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {globalBrand?.twitterUrl && (
                <a href={globalBrand.twitterUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#1a1d1b] transition-colors">Twitter</a>
              )}
              {globalBrand?.linkedinUrl && (
                <a href={globalBrand.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#1a1d1b] transition-colors">LinkedIn</a>
              )}
              {globalBrand?.facebookUrl && (
                <a href={globalBrand.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#1a1d1b] transition-colors">Facebook</a>
              )}
              {globalBrand?.instagramUrl && (
                <a href={globalBrand.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#1a1d1b] transition-colors">Instagram</a>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md bg-white border border-[#dce1dc] p-5 rounded-3xl shadow-[0_18px_44px_rgba(6,30,10,0.12)] z-[9999]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#1a1d1b] mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00aa13]"></span>
                Cookie Preference
              </h3>
              <p className="text-xs text-[#4b4f4c] leading-relaxed">
                We use cookies to optimize your platform experience, analyze traffic, and support personalized marketing for your tour business. Refer to our <Link to="/cookies" className="underline text-[#00790d] hover:text-[#00aa13]">Cookie Policy</Link>.
              </p>
            </div>
            <button onClick={() => setShowCookieBanner(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2.5 mt-4 justify-end">
            <button 
              onClick={handleDeclineCookies}
              className="px-3.5 py-1.5 text-xs font-bold text-[#6f746f] hover:text-[#1a1d1b] hover:bg-[#f1f4f1] rounded-full transition-all"
            >
              Decline
            </button>
            <button 
              onClick={handleAcceptCookies}
              className="btn-kelola-primary px-4 py-2 text-xs font-bold text-white rounded-full cursor-pointer"
            >
              Accept Cookies
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
