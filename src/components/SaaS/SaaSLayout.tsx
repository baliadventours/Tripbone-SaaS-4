import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Compass, ChevronDown, Sparkles, LayoutTemplate, BriefcaseBusiness, 
  Navigation, ShieldCheck, X, Menu, BookOpen, Store, Building2, HelpCircle, ArrowRight
} from 'lucide-react';
import { useSettings } from '../../lib/SettingsContext';
import { useAuth } from '../../lib/AuthContext';
import TopAnnouncementBar from '../TopAnnouncementBar';

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
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('tripbone-cookie-consent', 'declined');
    setShowCookieBanner(false);
  };

  const brandColor = globalBrand?.brandColor || '#1db3cd';

  const handleLoginClick = () => {
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    if (hostname.includes('run.app')) {
      window.location.href = '/login';
    } else {
      window.location.href = hostname === 'localhost' 
        ? `http://app.localhost${port}/login` 
        : 'https://app.tripbone.com/login';
    }
  };

  const handleSignupClick = () => {
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

  const isTransparent = isHome && !scrolled;

  return (
    <div className="min-h-screen font-sans selection-brand-color bg-[#f8fafc] text-slate-900 overflow-x-hidden relative flex flex-col">
      <style>{`
        .text-brand { color: ${brandColor} !important; }
        .bg-brand { background-color: ${brandColor} !important; }
        .hover\\:text-brand:hover { color: ${brandColor} !important; }
        .hover\\:bg-brand:hover { background-color: ${brandColor} !important; }
        .border-brand { border-color: ${brandColor} !important; }
        .group\\/item:hover .group-hover\\/item\\:text-brand { color: ${brandColor} !important; }
        .selection-brand-color::selection { background-color: ${brandColor} !important; color: white !important; }
      `}</style>
      
      {/* Top Fixed Header with Dark Navigation Announcement Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopAnnouncementBar />
        <header className={`w-full transition-all duration-300 ${
          isTransparent 
            ? 'bg-slate-950/40 backdrop-blur-md border-b border-white/10 text-white' 
            : 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.06)] text-slate-900'
        }`}>
          <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
            
            {/* Logo + Primary Navigation */}
            <div className="flex items-center space-x-10">
              <Link to="/" className="flex items-center space-x-2.5 cursor-pointer group">
                {globalBrand?.logoUrl || settings?.logoURL ? (
                  <img src={globalBrand?.logoUrl || settings?.logoURL} alt={globalBrand?.platformName || settings?.siteName || "Tripbone"} className="h-8 max-w-[140px] object-contain" />
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform border border-slate-700/50">
                      <Compass className="h-5 w-5 text-teal-400" />
                    </div>
                    <span className={`text-xl font-black tracking-tight ${isTransparent ? 'text-white' : 'text-slate-900'}`}>
                      {globalBrand?.platformName || settings?.siteName || "Tripbone"}
                    </span>
                  </>
                )}
              </Link>

              <nav className={`hidden lg:flex items-center space-x-1.5 text-sm font-extrabold ${isTransparent ? 'text-slate-100' : 'text-slate-800'}`}>
                
                {/* Features Mega Dropdown */}
                <div 
                  className="relative"
                  onMouseEnter={() => setIsFeaturesOpen(true)}
                  onMouseLeave={() => setIsFeaturesOpen(false)}
                >
                  <button className={`flex items-center space-x-1 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                    isTransparent ? 'hover:text-white hover:bg-white/10' : 'hover:text-brand hover:bg-slate-100/90'
                  }`}>
                    <span>Features</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFeaturesOpen ? 'rotate-180 text-brand' : isTransparent ? 'text-slate-300' : 'text-slate-400'}`} />
                  </button>
                  
                  {/* Mega Menu */}
                  <div className={`absolute top-full left-0 w-[600px] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.22)] border border-slate-200/90 p-5 grid grid-cols-2 gap-3 transition-all duration-200 origin-top-left text-slate-900 ${isFeaturesOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                    
                    <Link to="/features/ai" className="group/item flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center flex-shrink-0 group-hover/item:bg-cyan-100 transition-colors">
                        <Sparkles className="w-4.5 h-4.5 text-cyan-600" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm mb-0.5 group-hover/item:text-brand transition-colors">AI Tour Builder</h4>
                        <p className="text-xs text-slate-500 leading-snug">Auto-generate tour pages, copy, and multi-language translation.</p>
                      </div>
                    </Link>

                    <Link to="/features/operations" className="group/item flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 group-hover/item:bg-orange-100 transition-colors">
                        <Navigation className="w-4.5 h-4.5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm mb-0.5 group-hover/item:text-brand transition-colors">WhatsApp & Dispatches</h4>
                        <p className="text-xs text-slate-500 leading-snug">Automated driver alerts, pickup drop-pins, and manifest logs.</p>
                      </div>
                    </Link>

                    <Link to="/features/sales" className="group/item flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 group-hover/item:bg-emerald-100 transition-colors">
                        <BriefcaseBusiness className="w-4.5 h-4.5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm mb-0.5 group-hover/item:text-brand transition-colors">Integrated Booking Engine</h4>
                        <p className="text-xs text-slate-500 leading-snug">Mobile-first checkout, instant card payments, and deposits.</p>
                      </div>
                    </Link>

                    <Link to="/features/design" className="group/item flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0 group-hover/item:bg-purple-100 transition-colors">
                        <LayoutTemplate className="w-4.5 h-4.5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm mb-0.5 group-hover/item:text-brand transition-colors">High-Converting Layouts</h4>
                        <p className="text-xs text-slate-500 leading-snug">Swiss typography, custom domains, and mobile speed.</p>
                      </div>
                    </Link>

                    <Link to="/features/infrastructure" className="group/item col-span-2 flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors border-t border-slate-100 mt-1 pt-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover/item:bg-slate-200 transition-colors">
                        <ShieldCheck className="w-4.5 h-4.5 text-slate-700" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm mb-0.5 group-hover/item:text-brand transition-colors">Zero Commission Infrastructure</h4>
                        <p className="text-xs text-slate-500 leading-snug">Self-hosted custom domains, role permissions, and zero hidden platform cuts.</p>
                      </div>
                    </Link>

                  </div>
                </div>

                <Link to="/industries" className={`px-4 py-2.5 rounded-xl transition-all ${
                  isTransparent ? 'hover:text-white hover:bg-white/10' : 'hover:text-brand hover:bg-slate-100/90'
                }`}>Industries</Link>
                <Link to="/compare" className={`px-4 py-2.5 rounded-xl transition-all ${
                  isTransparent ? 'hover:text-white hover:bg-white/10' : 'hover:text-brand hover:bg-slate-100/90'
                }`}>Compare</Link>
                <Link to="/pricing" className={`px-4 py-2.5 rounded-xl transition-all ${
                  isTransparent ? 'hover:text-white hover:bg-white/10' : 'hover:text-brand hover:bg-slate-100/90'
                }`}>Pricing</Link>
                
                {/* Resources Dropdown */}
                <div 
                  className="relative"
                  onMouseEnter={() => setIsResourcesOpen(true)}
                  onMouseLeave={() => setIsResourcesOpen(false)}
                >
                  <button className={`flex items-center space-x-1 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                    isTransparent ? 'hover:text-white hover:bg-white/10' : 'hover:text-brand hover:bg-slate-100/90'
                  }`}>
                    <span>Resources</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isResourcesOpen ? 'rotate-180 text-brand' : isTransparent ? 'text-slate-300' : 'text-slate-400'}`} />
                  </button>

                  <div className={`absolute top-full left-0 w-64 bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.22)] border border-slate-200/90 p-2 space-y-1 transition-all duration-200 origin-top-left text-slate-900 ${isResourcesOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                    <Link to="/directory" className="flex items-center space-x-3 px-3.5 py-3 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 hover:text-brand transition-colors">
                      <Store className="w-4 h-4 text-slate-500" />
                      <span>Live Storefront Demos</span>
                    </Link>
                    <Link to="/blog" className="flex items-center space-x-3 px-3.5 py-3 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 hover:text-brand transition-colors">
                      <BookOpen className="w-4 h-4 text-slate-500" />
                      <span>Blog & Operator Guides</span>
                    </Link>
                    <Link to="/about" className="flex items-center space-x-3 px-3.5 py-3 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 hover:text-brand transition-colors">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span>Company & Story</span>
                    </Link>
                    <Link to="/contact" className="flex items-center space-x-3 px-3.5 py-3 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 hover:text-brand transition-colors">
                      <HelpCircle className="w-4 h-4 text-slate-500" />
                      <span>Contact Support</span>
                    </Link>
                  </div>
                </div>

              </nav>
            </div>

            {/* Right CTAs */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleLoginClick} 
                className={`text-sm font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                  isTransparent ? 'text-slate-100 hover:text-white hover:bg-white/10' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {user ? 'Dashboard' : 'Log in'}
              </button>

              {!user && (
                <button 
                  onClick={handleSignupClick} 
                  className="hidden sm:inline-flex items-center gap-2 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-md hover:brightness-110 active:scale-95 cursor-pointer text-center ring-2 ring-white/30"
                  style={{ backgroundColor: brandColor }}
                >
                  <span>Start 7-Day Free Trial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Mobile Hamburger Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2 rounded-xl transition-colors ${
                  isTransparent ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
                }`}
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>

          {/* Mobile Drawer */}
          {isMobileMenuOpen && (
            <div className="lg:hidden bg-white text-slate-900 border-b border-slate-200 px-6 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl">
              <div className="space-y-1">
                <Link 
                  to="/features/ai" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
                >
                  AI Tour Builder
                </Link>
                <Link 
                  to="/industries" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
                >
                  Industry Solutions
                </Link>
                <Link 
                  to="/compare" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
                >
                  Compare Platforms
                </Link>
                <Link 
                  to="/pricing" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
                >
                  Pricing
                </Link>
                <Link 
                  to="/directory" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
                >
                  Live Storefront Demos
                </Link>
                <Link 
                  to="/contact" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
                >
                  Contact Support
                </Link>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <button 
                  onClick={handleSignupClick}
                  className="w-full py-3 rounded-xl text-white text-xs font-black text-center shadow-md"
                  style={{ backgroundColor: brandColor }}
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

      {/* Footer */}
      <footer className="bg-slate-950 pt-20 pb-12 text-slate-400 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
            
            {/* Column 1: Brand Info */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2.5 mb-6">
                {globalBrand?.logoUrl || settings?.logoURL ? (
                  <img src={globalBrand?.logoUrl || settings?.logoURL} alt={globalBrand?.platformName || settings?.siteName || "Tripbone"} className="h-9 max-w-[150px] object-contain" />
                ) : (
                  <>
                    <Compass className="h-8 w-8 text-brand" />
                    <span className="text-2xl font-bold tracking-tight text-white">
                      {globalBrand?.platformName || settings?.siteName || "Tripbone"}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs leading-relaxed mb-6 text-slate-400">
                Your own booking website. Not a widget. Not complicated. Drive direct sales, automate WhatsApp dispatches, and eliminate booking commissions.
              </p>
              <div className="text-xs text-slate-300 space-y-2 mt-4">
                <p className="flex items-center gap-2">
                  <span className="font-bold text-white">Support Email:</span>
                  <a href="mailto:support@tripbone.com" className="text-brand hover:underline">support@tripbone.com</a>
                </p>
              </div>
            </div>
            
            {/* Column 2: Industries */}
            <div>
              <h4 className="text-white font-bold text-sm mb-5 tracking-wide uppercase text-slate-200">Industries</h4>
              <ul className="space-y-3 text-xs">
                <li><Link to="/industries/day-tours" className="hover:text-white transition-colors">Day Tour Operator</Link></li>
                <li><Link to="/industries/atv-offroad" className="hover:text-white transition-colors">ATV Operator</Link></li>
                <li><Link to="/industries/rafting-outdoor" className="hover:text-white transition-colors">Rafting Operator</Link></li>
                <li><Link to="/industries/boat-charters" className="hover:text-white transition-colors">Boat Charters & Cruises</Link></li>
                <li><Link to="/industries/food-culinary" className="hover:text-white transition-colors">Food & Culinary Tours</Link></li>
                <li><Link to="/industries/rentals" className="hover:text-white transition-colors">Equipment Rentals</Link></li>
              </ul>
            </div>

            {/* Column 3: Compare Us */}
            <div>
              <h4 className="text-white font-bold text-sm mb-5 tracking-wide uppercase text-slate-200">Compare Us</h4>
              <ul className="space-y-3 text-xs">
                <li><Link to="/compare/bokun" className="hover:text-white transition-colors">Tripbone vs Bokun</Link></li>
                <li><Link to="/compare/fareharbor" className="hover:text-white transition-colors">Tripbone vs FareHarbor</Link></li>
                <li><Link to="/compare/rezdy" className="hover:text-white transition-colors">Tripbone vs Rezdy</Link></li>
                <li><Link to="/compare/peek-pro" className="hover:text-white transition-colors">Tripbone vs Peek Pro</Link></li>
                <li><Link to="/compare/regiondo" className="hover:text-white transition-colors">Tripbone vs Regiondo</Link></li>
                <li><Link to="/compare/checkfront" className="hover:text-white transition-colors">Tripbone vs Checkfront</Link></li>
              </ul>
            </div>

            {/* Column 4: Platform */}
            <div>
              <h4 className="text-white font-bold text-sm mb-5 tracking-wide uppercase text-slate-200">Platform & Company</h4>
              <ul className="space-y-3 text-xs">
                <li><Link to="/features" className="hover:text-white transition-colors">Platform Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing & Plans</Link></li>
                <li><Link to="/directory" className="hover:text-white transition-colors">Live Store Demos</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog / Guides</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
                <li><button onClick={handleLoginClick} className="hover:text-white transition-colors">{user ? 'Dashboard' : 'Log In'}</button></li>
              </ul>
            </div>

            {/* Column 5: Legal */}
            <div>
              <h4 className="text-white font-bold text-sm mb-5 tracking-wide uppercase text-slate-200">Legal</h4>
              <ul className="space-y-3 text-xs">
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>

          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-xs">&copy; {new Date().getFullYear()} {globalBrand?.platformName || "Tripbone"}. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {globalBrand?.twitterUrl && (
                <a href={globalBrand.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-white transition-colors">Twitter</a>
              )}
              {globalBrand?.linkedinUrl && (
                <a href={globalBrand.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-white transition-colors">LinkedIn</a>
              )}
              {globalBrand?.facebookUrl && (
                <a href={globalBrand.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-white transition-colors">Facebook</a>
              )}
              {globalBrand?.instagramUrl && (
                <a href={globalBrand.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-white transition-colors">Instagram</a>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-2xl z-[9999]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }}></span>
                Cookie Preference
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                We use cookies to optimize your platform experience, analyze traffic, and support personalized marketing for your tour business. Refer to our <Link to="/cookies" className="underline text-brand hover:brightness-115">Cookie Policy</Link>.
              </p>
            </div>
            <button onClick={() => setShowCookieBanner(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2.5 mt-4 justify-end">
            <button 
              onClick={handleDeclineCookies}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
            >
              Decline
            </button>
            <button 
              onClick={handleAcceptCookies}
              className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm hover:opacity-90 transition-all cursor-pointer"
              style={{ backgroundColor: brandColor }}
            >
              Accept Cookies
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
