/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import Footer from './components/Footer';
import { SettingsProvider, useSettings } from './lib/SettingsContext';
import { CurrencyProvider } from './lib/CurrencyContext';
import { AuthProvider } from './lib/AuthContext';
import { TenantProvider, useTenant } from './lib/TenantContext';
import GlobalPopup from './components/GlobalPopup';
import MobileNav from './components/MobileNav';
import { cn } from './lib/utils';
import Loader from './components/Loader';
import { ShieldAlert, Globe } from 'lucide-react';
import { initGA, trackGAPageview } from './lib/googleAnalytics';
import { logSimplePageView } from './lib/simpleAnalytics';
import ChunkErrorBoundary from './components/ChunkErrorBoundary';
import { lazyWithRetry } from './lib/lazyWithRetry';

// Critical pages imported directly for instant load
import Home from './pages/Home';

import ImpersonateBar from './components/ImpersonateBar';

// Lazy load non-critical pages with auto-recovery for stale builds / 404 chunks
const Tours = lazyWithRetry(() => import('./pages/Tours'));
const TourDetail = lazyWithRetry(() => import('./pages/TourDetail'));
const Admin = lazyWithRetry(() => import('./pages/Admin'));
const Checkout = lazyWithRetry(() => import('./pages/Checkout'));
const BookingSuccess = lazyWithRetry(() => import('./pages/BookingSuccess'));
const BookingTracker = lazyWithRetry(() => import('./pages/BookingTracker'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const About = lazyWithRetry(() => import('./pages/About'));
const Destinations = lazyWithRetry(() => import('./pages/Destinations'));
const BlogArchive = lazyWithRetry(() => import('./pages/BlogArchive'));
const BlogPostDetail = lazyWithRetry(() => import('./pages/BlogPostDetail'));
const CarRentals = lazyWithRetry(() => import('./pages/CarRentals'));
const Auth = lazyWithRetry(() => import('./pages/Auth'));
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword'));
const PriceList = lazyWithRetry(() => import('./pages/PriceList'));
const DashboardLayout = lazyWithRetry(() => import('./pages/Dashboard/DashboardLayout'));
const Overview = lazyWithRetry(() => import('./pages/Dashboard/Overview'));
const Bookings = lazyWithRetry(() => import('./pages/Dashboard/Bookings'));
const Wishlist = lazyWithRetry(() => import('./pages/Dashboard/Wishlist'));
const Profile = lazyWithRetry(() => import('./pages/Dashboard/Profile'));
const MyPlans = lazyWithRetry(() => import('./pages/Dashboard/MyPlans'));
const Tickets = lazyWithRetry(() => import('./pages/Dashboard/Tickets'));
const GoogleAnalytics = lazyWithRetry(() => import('./pages/Dashboard/GoogleAnalytics'));
const AIPlanner = lazyWithRetry(() => import('./pages/AIPlanner'));
const AIHub = lazyWithRetry(() => import('./pages/AIHub'));
const Terms = lazyWithRetry(() => import('./pages/Terms'));
const Privacy = lazyWithRetry(() => import('./pages/Privacy'));
const CustomPageView = lazyWithRetry(() => import('./pages/CustomPageView'));
const ProposalView = lazyWithRetry(() => import('./pages/ProposalView'));
const WaiverSigningPage = lazyWithRetry(() => import('./pages/WaiverSigningPage'));

const SaaSHome = lazyWithRetry(() => import('./pages/SaaSHome'));
const SaaSSuperAdmin = lazyWithRetry(() => import('./pages/SaaSSuperAdmin'));
const ForbiddenSuperAdmin = lazyWithRetry(() => import('./components/Admin/ForbiddenSuperAdmin'));
const SaaSMarketing = lazyWithRetry(() => import('./pages/SaaSMarketing'));
const SaaSShowcase = lazyWithRetry(() => import('./pages/SaaSShowcase'));
const SaaSLayout = lazyWithRetry(() => import('./components/SaaS/SaaSLayout'));
const SaaSFeatures = lazyWithRetry(() => import('./pages/SaaSFeatures'));
const AIFeatures = lazyWithRetry(() => import('./pages/SaaSFeatures/AIFeatures'));
const OperationsFeatures = lazyWithRetry(() => import('./pages/SaaSFeatures/OperationsFeatures'));
const SalesFeatures = lazyWithRetry(() => import('./pages/SaaSFeatures/SalesFeatures'));
const DesignFeatures = lazyWithRetry(() => import('./pages/SaaSFeatures/DesignFeatures'));
const InfrastructureFeatures = lazyWithRetry(() => import('./pages/SaaSFeatures/InfrastructureFeatures'));
const SaaSPricing = lazyWithRetry(() => import('./pages/SaaSPricing'));
const SaaSIndustries = lazyWithRetry(() => import('./pages/SaaSIndustries'));
const SaaSComparison = lazyWithRetry(() => import('./pages/SaaSComparison'));
const SaaSAbout = lazyWithRetry(() => import('./pages/SaaSAbout'));
const SaaSContact = lazyWithRetry(() => import('./pages/SaaSContact'));
const SaaSTerms = lazyWithRetry(() => import('./pages/SaaSTerms'));
const SaaSPrivacy = lazyWithRetry(() => import('./pages/SaaSPrivacy'));
const SaasCookies = lazyWithRetry(() => import('./pages/SaasCookies'));
const AppSumoRedeem = lazyWithRetry(() => import('./pages/AppSumoRedeem'));
const GuideView = lazyWithRetry(() => import('./pages/GuideView'));
const DocsPage = lazyWithRetry(() => import('./pages/DocsPage'));

// Lazy load non-critical components
import { useTenantSEO } from './hooks/useTenantSEO';

const Chatbot = lazyWithRetry(() => import('./components/Chatbot'));

function AppContent() {
  const { isMaster, isAppGate, tenant, tenantId, loading: tenantLoading, setPreviewTenant, isImpersonating } = useTenant();
  const { settings, loading: settingsLoading } = useSettings();
  const location = useLocation();

  // Dynamically update document metadata based on tenant data
  useTenantSEO();

  const isAdmin = location.pathname.startsWith('/admin');
  const isSupplier = location.pathname.startsWith('/supplier');
  const isAgent = location.pathname.startsWith('/agent');
  const isAuth = location.pathname === '/login' || location.pathname === '/forgot-password';
  const isDashboard = location.pathname.startsWith('/customer');
  const isCheckout = location.pathname.startsWith('/checkout');
  const isTourDetail = location.pathname.startsWith('/tour/');

  // Dynamic Tenant Branding Styles Override
  useEffect(() => {
    if (!isMaster && tenant) {
      const root = document.documentElement;
      if (tenant.primaryColor) {
        root.style.setProperty('--primary-color', tenant.primaryColor);
      }
      if (tenant.secondaryColor) {
        root.style.setProperty('--secondary-color', tenant.secondaryColor);
      }
    } else {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', '#FF7A00');
      root.style.setProperty('--secondary-color', '#1F3B1F');
    }
  }, [isMaster, tenant]);

  // Track Google Analytics pageviews on route modifications
  useEffect(() => {
    if (!tenantLoading) {
      initGA(tenantId);
    }
  }, [tenantId, tenantLoading]);

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    trackGAPageview(fullPath);
    logSimplePageView(fullPath);
  }, [location.pathname, location.search]);

  // Prevent mobile zooming (pinch zoom & double tap auto-zoom)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        const target = e.target as HTMLElement;
        const isInteractive = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'SELECT' || 
          target.isContentEditable ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('.interactive');
        
        if (!isInteractive) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    };

    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('gesturestart', handleGestureStart, { passive: false });
    document.addEventListener('gesturechange', handleGestureStart, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('gesturestart', handleGestureStart);
      document.removeEventListener('gesturechange', handleGestureStart);
    };
  }, []);
  
  const isProposal = location.pathname.startsWith('/proposal/');
  const isWaiver = location.pathname.startsWith('/waiver') || location.pathname.startsWith('/sign-waiver');

  // Hide main nav components on certain pages
  const hideMainLayout = isAdmin || isSupplier || isAgent || isAuth || isProposal || isWaiver;
  const hideMobileNav = hideMainLayout || isTourDetail || isCheckout;
  const hideFooter = hideMainLayout || isDashboard;

  if (tenantLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader />
      </div>
    );
  }

  const isDocsSubdomain = typeof window !== 'undefined' && window.location.hostname.toLowerCase().startsWith('docs.');

  if (isMaster) {
    if (isDocsSubdomain) {
      return (
        <div className="flex min-h-screen flex-col font-sans antialiased text-gray-100 bg-[#0f172a] w-full max-w-full overflow-x-hidden">
          {isImpersonating && <ImpersonateBar />}
          <ChunkErrorBoundary>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/" element={<DocsPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/docs/:slug" element={<DocsPage />} />
                <Route path="/:slug" element={<DocsPage />} />
                <Route path="*" element={<DocsPage />} />
              </Routes>
            </Suspense>
          </ChunkErrorBoundary>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col font-sans antialiased text-gray-100 bg-[#070b13] w-full max-w-full overflow-x-hidden">
        {isImpersonating && <ImpersonateBar />}
        <ChunkErrorBoundary>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/admin/*" element={<SaaSSuperAdmin />} />
              <Route path="/superadmin/*" element={<SaaSSuperAdmin />} />
              <Route path="/login" element={<SaaSHome />} />
              <Route path="/signup" element={<SaaSHome />} />
              <Route path="/redeem" element={<AppSumoRedeem />} />
              <Route path="/appsumo" element={<AppSumoRedeem />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/docs/:slug" element={<DocsPage />} />
              
              {/* SaaS App Gate (Legacy Mode) */}
              {isAppGate && (
                <>
                  <Route path="/" element={<SaaSHome />} />
                  <Route path="*" element={<SaaSHome />} />
                </>
              )}

              {/* SaaS Marketing Site (Wrapped with Global Header/Footer Layout) */}
              {!isAppGate && (
                <Route element={<SaaSLayout />}>
                  <Route path="/" element={<SaaSMarketing />} />
                  <Route path="/directory" element={<SaaSShowcase />} />
                  <Route path="/features" element={<SaaSFeatures />} />
                  <Route path="/features/ai" element={<AIFeatures />} />
                  <Route path="/features/operations" element={<OperationsFeatures />} />
                  <Route path="/features/sales" element={<SalesFeatures />} />
                  <Route path="/features/design" element={<DesignFeatures />} />
                  <Route path="/features/infrastructure" element={<InfrastructureFeatures />} />
                  
                  <Route path="/industries" element={<SaaSIndustries />} />
                  <Route path="/industries/:slug" element={<SaaSIndustries />} />
                  <Route path="/compare" element={<SaaSComparison />} />
                  <Route path="/compare/:slug" element={<SaaSComparison />} />
                  <Route path="/comparisons" element={<SaaSComparison />} />

                  <Route path="/pricing" element={<SaaSPricing />} />
                  <Route path="/about" element={<SaaSAbout />} />
                  <Route path="/contact" element={<SaaSContact />} />
                  <Route path="/blog" element={<BlogArchive />} />
                  <Route path="/blog/:slug" element={<BlogPostDetail />} />
                  <Route path="/docs" element={<DocsPage />} />
                  <Route path="/docs/:slug" element={<DocsPage />} />
                  <Route path="/terms" element={<SaaSTerms />} />
                  <Route path="/privacy" element={<SaaSPrivacy />} />
                  <Route path="/cookies" element={<SaasCookies />} />
                  <Route path="*" element={<SaaSMarketing />} />
                </Route>
              )}
            </Routes>
          </Suspense>
        </ChunkErrorBoundary>
      </div>
    );
  }

  // Enforce Trial, Inactive, Suspended states
  const getDynamicStatus = (t: any): 'trial' | 'active' | 'inactive' | 'suspended' => {
    if (t.status === 'suspended') return 'suspended';
    
    const now = new Date();
    const createdDate = new Date(t.createdAt || Date.now());
    const trialEndsDate = t.trialEnds ? new Date(t.trialEnds) : new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    if (t.status === 'trial' || !t.status || t.status === 'pending') {
      if (now <= trialEndsDate) {
        return 'trial';
      }
      
      const gracePeriodEndsDate = new Date(trialEndsDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (now <= gracePeriodEndsDate) {
        return 'inactive';
      }
      
      return 'suspended';
    }
    
    if (t.status === 'inactive') {
      const gracePeriodEndsDate = new Date(trialEndsDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (now <= gracePeriodEndsDate) {
        return 'inactive';
      }
      return 'suspended';
    }
    
    return 'active';
  };

  const dynamicStatus = !isMaster && tenant ? getDynamicStatus(tenant) : 'active';

  // Handle non-existent tenant (e.g., test123.tripbone.com or sample123.tripbone.com)
  if (!isMaster && !tenant) {
    return (
      <div className="min-h-screen bg-[#070b13] text-gray-100 flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
        <div className="max-w-md w-full bg-[#0b0f19] border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            <Globe className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">Workspace Not Found</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The travel workspace at <span className="font-mono text-cyan-400">{window.location.hostname}</span> is not registered or may have been deleted.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2.5">
            <a
              href="https://tripbone.com"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition"
            >
              Go to Tripbone SaaS
            </a>
            <a
              href="https://tripbone.com/signup"
              className="w-full py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:text-white hover:bg-slate-700 transition border border-slate-700/60"
            >
              Create Your Own Website
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Completely block visitor access if suspended
  if (!isMaster && tenant && dynamicStatus === 'suspended') {
    return (
      <div className="min-h-screen bg-[#070b13] text-gray-100 flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
        <div className="max-w-md w-full bg-[#0b0f19] border border-red-500/20 p-8 rounded-2xl shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase">Workspace Suspended</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            This page is suspended. Please contact administrator.
          </p>
          <div className="pt-4 border-t border-gray-850">
            <p className="text-[10px] text-gray-500 font-mono">
              Workspace: {tenant.companyName} ({tenant.slug})
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isInactive = !isMaster && tenant && dynamicStatus === 'inactive';

  return (
    <div className={cn(
      "flex min-h-screen flex-col font-sans antialiased text-gray-900 bg-white w-full max-w-full",
      !isTourDetail && "overflow-x-hidden",
      !hideMobileNav && "pb-[72px] md:pb-0"
    )}>
      {isImpersonating && <ImpersonateBar />}
      {isInactive && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-center py-2.5 px-4 text-xs font-bold flex items-center justify-center space-x-2 z-[9999] relative shadow-md">
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-black">Notice</span>
          <span>Subscription payment is required to activate this workspace. Your free trial period has expired, but your site remains active. Please update your billing details.</span>
        </div>
      )}
      {!hideMainLayout && <div className="no-print"><Header /></div>}
      <main className={cn(
        "flex-1",
        !hideMainLayout && !isDashboard && (
          isCheckout ? "md:pt-[120px]" : 
          isTourDetail ? "pt-16 md:pt-[120px]" : 
          "pt-[80px] md:pt-[120px]"
        )
      )}>
        <ChunkErrorBoundary>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/login" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/customer" element={<DashboardLayout />}>
                <Route path="dashboard" element={<Overview />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="my-plans" element={<MyPlans />} />
                <Route path="profile" element={<Profile />} />
                <Route path="tickets" element={<Tickets />} />
                <Route path="google-analytics" element={<GoogleAnalytics />} />
              </Route>
              <Route path="/" element={<Home />} />
              <Route path="/tours" element={<Tours />} />
              <Route path="/rentals" element={<CarRentals />} />
              <Route path="/car-rental" element={<CarRentals />} />
              <Route path="/blog" element={<BlogArchive />} />
              <Route path="/blog/:slug" element={<BlogPostDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/panduan" element={<GuideView />} />
              <Route path="/guide" element={<GuideView />} />
              <Route path="/admin/guide" element={<GuideView />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/docs/:slug" element={<DocsPage />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/page/:slug" element={<CustomPageView />} />
              <Route path="/landing/:slug" element={<CustomPageView />} />
              <Route path="/planner" element={<AIPlanner />} />
              <Route path="/proposal/:id" element={<ProposalView />} />
              <Route path="/ai-hub" element={<AIHub />} />
              <Route path="/price-list" element={<PriceList />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/tour/:slug" element={<TourDetail />} />
              <Route path="/checkout/:tourId" element={<Checkout />} />
              <Route path="/superadmin/*" element={<ForbiddenSuperAdmin />} />
              <Route path="/admin/*" element={<Admin />} />
              <Route path="/supplier/*" element={<Admin />} />
              <Route path="/agent/*" element={<Admin />} />
              <Route path="/track-booking" element={<BookingTracker />} />
              <Route path="/waiver" element={<WaiverSigningPage />} />
              <Route path="/waiver/:bookingId" element={<WaiverSigningPage />} />
              <Route path="/sign-waiver/:templateId" element={<WaiverSigningPage />} />
              <Route path="/booking-success/:id" element={<BookingSuccess />} />
              <Route path="/booking-confirmation/:id" element={<BookingSuccess />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </ChunkErrorBoundary>
      </main>
      {!hideFooter && <div className="no-print"><Footer /></div>}
      {!hideMobileNav && <div className="no-print"><MobileNav /></div>}
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <Router>
        <TenantProvider>
          <SettingsProvider>
            <AuthProvider>
              <CurrencyProvider>
                <ScrollToTop />
                <GlobalPopup />
                <AppContent />
              </CurrencyProvider>
            </AuthProvider>
          </SettingsProvider>
        </TenantProvider>
      </Router>
    </HelmetProvider>
  );
}
