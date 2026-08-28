import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db, query, collection, where, orderBy, limit, onSnapshot, doc, getDoc, setDoc } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { serverTimestamp } from '@/src/lib/firebase';
import { User, Shield, Leaf, Search, Instagram, Facebook, Twitter, Phone, Mail, HelpCircle, ArrowLeft, MoreHorizontal, Bell, CheckCircle2, Music2, Calendar, UserCircle, Settings, LogOut, ChevronDown, Globe, Sparkles, BookOpen, LayoutGrid, Zap, MessageCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { useSettings } from '../lib/SettingsContext';
import { useTenant } from '../lib/TenantContext';
import CurrencySwitcher from './CurrencySwitcher';
import TopAnnouncementBar from './TopAnnouncementBar';
import { cn, getSafeImageUrl } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const { settings, builderSettings } = useSettings();
  const { tenantId, tenant } = useTenant();
  const siteName = settings?.siteName || tenant?.companyName || 'Tripbone';
  const logoURL = settings?.logoURL || tenant?.logo;
  const [user, setUser] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuLinks = (blockId: string) => {
    const block = builderSettings?.blocks?.find(b => b.id === blockId);
    if (block?.menuId) {
      const menu = builderSettings.menus?.find(m => m.id === block.menuId);
      if (menu && menu.links && menu.links.length > 0) {
        return menu.links;
      }
    }
    // Also check location matching if menuId not explicitly assigned on block
    if (builderSettings?.menus && builderSettings.menus.length > 0) {
      const locTarget = blockId === 'mainNav' ? 'main-nav' : (blockId === 'topNav' ? 'top-nav' : null);
      if (locTarget) {
        const found = builderSettings.menus.find(m => m.location === locTarget);
        if (found && found.links && found.links.length > 0) {
          return found.links;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;
    const params = new URLSearchParams();
    params.append('search', searchKeyword.trim());
    navigate(`/tours?${params.toString()}`);
    setShowSearch(false);
    setSearchKeyword('');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const docRef = doc(db, 'users', authUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // New user registration
          const newProfile: Partial<UserProfile> & { tenantId?: string | null } = {
            uid: authUser.uid,
            email: authUser.email || '',
            displayName: authUser.displayName || '',
            photoURL: authUser.photoURL || '',
            role: 'customer',
            tenantId: tenantId || null,
            createdAt: serverTimestamp(),
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile as UserProfile);
        }
      } else {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Listen for recent bookings to show as notifications
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingNotifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'booking',
          title: `Booking ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`,
          message: `Your booking for ${data.tourTitle} is now ${data.status}.`,
          time: data.createdAt,
          tourId: data.tourId
        };
      });
      
      // Merge with a welcome notification if it's a new session
      const welcome = {
        id: 'welcome',
        type: 'info',
        title: 'Welcome back!',
        message: 'Ready for your next adventure?',
        time: { seconds: Date.now() / 1000 },
      };

      setNotifications([welcome, ...bookingNotifications]);
    });

    return unsubscribe;
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isTourDetail = location.pathname.startsWith('/tour/');
  const isCheckout = location.pathname.startsWith('/checkout');

  // Theme Logic & Preset Resolution
  const topNavBlock = builderSettings?.blocks?.find(b => b.id === 'topNav');
  const mainNavBlock = builderSettings?.blocks?.find(b => b.id === 'mainNav');

  const topNavStyle = (topNavBlock?.design && topNavBlock.design !== 'default') 
    ? topNavBlock.design 
    : (settings?.sectionStyles?.topNav || topNavBlock?.design || 'default');

  const mainNavStyle = (mainNavBlock?.design && mainNavBlock.design !== 'default') 
    ? mainNavBlock.design 
    : (settings?.sectionStyles?.mainNav || mainNavBlock?.design || 'default');

  const renderTopNav = () => {
    if (builderSettings) {
      const topNavBlock = builderSettings.blocks?.find(b => b.id === 'topNav');
      if (topNavBlock && topNavBlock.active === false) {
        return null;
      }
    }
    const topNavLinks = getMenuLinks('topNav');

    switch (topNavStyle) {
      case 'airbnb-classic':
      case 'airbnb-fluid':
        return (
          <div className="bg-white border-b border-gray-100 py-2 hidden md:block">
            <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between text-[11px] font-bold text-gray-500">
              <div className="flex items-center gap-4">
                 <span>Welcome to {siteName}</span>
                 <span className="h-3 w-px bg-gray-200" />
                 <a href={`https://wa.me/${settings?.whatsappNumber?.replace(/\D/g, '')}`} className="hover:text-gray-900 transition-colors">WhatsApp Assistance</a>
              </div>
              <div className="flex items-center gap-5">
                 <CurrencySwitcher variant="minimal" />
                 {topNavLinks ? (
                   topNavLinks.map((link, idx) => (
                     <Link key={idx} to={link.url} className="hover:text-gray-900 transition-colors">{link.label}</Link>
                   ))
                 ) : (
                   <>
                     <Link to="/about" className="hover:text-gray-900 transition-colors">Our Story</Link>
                     <Link to="/contact" className="hover:text-gray-900 transition-colors">Help Center</Link>
                   </>
                 )}
              </div>
            </div>
          </div>
        );

      case 'modern-dark':
      case 'modern-glass':
        return (
          <div className={cn(
            "py-2 hidden md:block backdrop-blur-md",
            topNavStyle === 'modern-dark' ? "bg-gray-950 text-orange-400" : "bg-orange-950/95 text-orange-100"
          )}>
            <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
              <div className="flex items-center gap-6">
                 <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> Adventure Intelligence v2.4</span>
                 <span className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"><Settings className="h-3 w-3" /> System Status</span>
              </div>
              <div className="flex items-center gap-8 opacity-80">
                 <CurrencySwitcher variant="minimal" />
                 {topNavLinks ? (
                   topNavLinks.map((link, idx) => (
                     <Link key={idx} to={link.url} className="px-3 py-1 bg-white/10 rounded-full hover:bg-primary hover:text-white transition-all">{link.label}</Link>
                   ))
                 ) : (
                   <Link to="/planner" className="px-3 py-1 bg-white/10 rounded-full hover:bg-primary hover:text-white transition-all">AI Planner</Link>
                 )}
              </div>
            </div>
          </div>
        );

      case 'minimal-grid':
      case 'minimal-type':
        return (
          <div className="bg-white py-4 border-b border-gray-100 hidden md:block">
            <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between font-mono text-[10px] uppercase tracking-tighter text-gray-400">
               <div className="flex gap-4">
                 <span>T: {settings?.supportPhone}</span>
                 <span>E: {settings?.supportEmail}</span>
               </div>
               <div className="flex gap-4">
                 <span className="text-gray-900 font-bold tracking-[0.2em]">{siteName.toUpperCase()}</span>
                 <CurrencySwitcher variant="minimal" />
                 {topNavLinks && topNavLinks.map((link, idx) => (
                   <Link key={idx} to={link.url} className="text-gray-900 hover:text-primary transition-colors ml-4">{link.label}</Link>
                 ))}
               </div>
            </div>
          </div>
        );

      case 'premium-serif':
      case 'premium-full':
        return (
          <div className={cn(
            "py-3 border-b hidden md:block",
            topNavStyle === 'premium-full' ? "bg-black border-white/5 text-[#d4cfc8]" : "bg-[#fdfcfb] border-[#f3eee9] text-[#80766d]"
          )}>
            <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between font-serif text-[11px] italic tracking-wide">
               <div className="flex items-center gap-6">
                  <span>Concierge Service Active</span>
               </div>
               <div className="flex items-center gap-8 uppercase not-italic font-sans text-[9px] tracking-[.3em] font-black">
                  {topNavLinks ? (
                    topNavLinks.map((link, idx) => (
                      <Link key={idx} to={link.url} className="hover:text-primary transition-colors">{link.label}</Link>
                    ))
                  ) : (
                    <>
                      <Link to="/contact" className="hover:text-primary transition-colors">Inquire</Link>
                      <Link to="/login" className="hover:text-primary transition-colors">Portal</Link>
                    </>
                  )}
                  <CurrencySwitcher variant="minimal" />
               </div>
            </div>
          </div>
        );

      case 'saas-clean':
      case 'saas-dash':
        return (
          <div className="bg-[#fafafa] py-1.5 border-b border-gray-100 hidden md:block">
            <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between text-[11px] font-semibold text-gray-500">
               <div className="flex items-center gap-4">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px]">Build v2024.1</span>
                  <span className="text-gray-400">Environment: Production</span>
               </div>
               <div className="flex items-center gap-6">
                  {topNavLinks ? (
                    topNavLinks.map((link, idx) => (
                      <Link key={idx} to={link.url} className="hover:text-primary transition-colors flex items-center gap-1.5 opacity-60">{link.label}</Link>
                    ))
                  ) : (
                    <>
                      <a href="#" className="hover:text-primary transition-colors flex items-center gap-1.5 opacity-60"><BookOpen className="h-3 w-3" /> Resources</a>
                      <Link to="/contact" className="hover:text-primary transition-colors">Developer Support</Link>
                    </>
                  )}
                  <CurrencySwitcher variant="minimal" />
               </div>
            </div>
          </div>
        );

      case 'emerald-safari':
        return (
          <div className="bg-emerald-950 text-emerald-100 py-2 border-b border-emerald-800/40 hidden md:block">
            <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between text-[11px] font-bold">
               <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 bg-emerald-900/80 text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider">
                    <Phone className="h-3 w-3" /> 24/7 Hotline
                  </span>
                  <span>{settings?.supportPhone || '+62 812 3456 7890'}</span>
               </div>
               <div className="flex items-center gap-6">
                  <a href={`https://wa.me/${settings?.whatsappNumber?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-emerald-300 hover:text-white transition-colors">
                    <MessageCircle className="h-3.5 w-3.5" /> Instant WhatsApp
                  </a>
                  <span className="h-3 w-px bg-emerald-800" />
                  <CurrencySwitcher variant="minimal" />
               </div>
            </div>
          </div>
        );

      case 'tokyo-neon':
        return (
          <div className="bg-slate-950 text-cyan-400 py-2 border-b border-cyan-500/20 hidden md:block">
            <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
               <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE ONLINE BOOKING
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300">Instant Tour Confirmation</span>
               </div>
               <div className="flex items-center gap-6">
                  <span className="text-slate-400">Currency:</span>
                  <CurrencySwitcher variant="minimal" />
                  <Link to="/contact" className="px-3 py-1 bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/30 hover:bg-cyan-500 hover:text-black transition-all">VIP Support</Link>
               </div>
            </div>
          </div>
        );

      case 'sunset-ibiza':
        return (
          <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-purple-700 text-white py-2 hidden md:block shadow-xs">
            <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between text-[11px] font-bold">
               <div className="flex items-center gap-3">
                  <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                    Special Offer
                  </span>
                  <span>Use promo code <strong className="underline decoration-wavy">BALI15</strong> for 15% off all private day tours!</span>
               </div>
               <div className="flex items-center gap-6">
                  <Link to="/tours" className="hover:underline">Explore Offers</Link>
                  <CurrencySwitcher variant="minimal" />
               </div>
            </div>
          </div>
        );

      case 'nordic-clean':
        return (
          <div className="bg-stone-100 text-stone-700 py-2 border-b border-stone-200 hidden md:block">
            <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between text-[11px] font-medium">
               <div className="flex items-center gap-6">
                  <span className="font-bold text-stone-900">{siteName}</span>
                  <span className="text-stone-400">|</span>
                  <span className="text-stone-500">Operating Daily 07:00 - 22:00 WITA</span>
               </div>
               <div className="flex items-center gap-6 text-xs">
                  <a href={`tel:${settings?.supportPhone}`} className="hover:text-stone-900 font-bold">{settings?.supportPhone || '+62 812 3456 7890'}</a>
                  <CurrencySwitcher variant="minimal" />
               </div>
            </div>
          </div>
        );

      case 'royal-gold':
        return (
          <div className="bg-neutral-950 text-amber-300 py-2 border-b border-amber-500/20 hidden md:block">
            <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
               <div className="flex items-center gap-4">
                  <span className="text-amber-400 flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> VIP Concierge & Luxury Chauffeur</span>
               </div>
               <div className="flex items-center gap-6">
                  <a href={`https://wa.me/${settings?.whatsappNumber?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Direct Desk</a>
                  <CurrencySwitcher variant="minimal" />
               </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-900 py-2.5 hidden md:block">
            <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 border-r border-white/10 pr-6">
                  {settings?.instagramUrl && (
                    <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors" aria-label="Instagram">
                      <Instagram className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {settings?.facebookUrl && (
                    <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors" aria-label="Facebook">
                      <Facebook className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {settings?.twitterUrl && (
                    <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors" aria-label="Twitter">
                      <Twitter className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {settings?.tiktokUrl && (
                    <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors" aria-label="TikTok">
                      <Music2 className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <div className="hidden md:flex items-center gap-6">
                  <a href={`tel:${settings?.supportPhone}`} className="flex items-center gap-2 text-[10px] font-bold text-white/60 hover:text-white transition-colors tracking-widest">
                    <Phone className="h-3 w-3 text-primary" /> {settings?.supportPhone || '+62 812 3456 7890'}
                  </a>
                  <a href={`mailto:${settings?.supportEmail}`} className="flex items-center gap-2 text-[10px] font-bold text-white/60 hover:text-white transition-colors tracking-widest">
                    <Mail className="h-3 w-3 text-primary" /> {settings?.supportEmail || 'support@tripbone.com'}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <CurrencySwitcher variant="minimal" />
                {topNavLinks ? (
                  topNavLinks.map((link, idx) => (
                    <Link key={idx} to={link.url} className="flex items-center gap-2 text-[10px] font-black text-white/80 hover:text-white transition-colors tracking-[0.1em]">
                      {link.label}
                    </Link>
                  ))
                ) : (
                  <Link to="/contact" className="flex items-center gap-2 text-[10px] font-black text-white/80 hover:text-white transition-colors tracking-[0.1em]">
                    <HelpCircle className="h-3 w-3" /> Support
                  </Link>
                )}
                {user ? (
                   <button onClick={handleLogout} className="text-[10px] font-black text-white/80 hover:text-red-400 transition-colors tracking-[0.1em] flex items-center gap-2">
                     Logout
                   </button>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link to="/login" className="text-[10px] font-black text-white/80 hover:text-primary transition-colors tracking-[0.1em] flex items-center gap-2">
                      <User className="h-3 w-3" /> Login / Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  const renderMainNav = () => {
    if (builderSettings) {
      const mainNavBlock = builderSettings.blocks?.find(b => b.id === 'mainNav');
      if (mainNavBlock && mainNavBlock.active === false) {
        return null;
      }
    }
    const customLinks = getMenuLinks('mainNav');

    const headerClass = cn(
      "container mx-auto h-20 items-center justify-between px-4 lg:px-8",
      (isTourDetail || isCheckout) ? "hidden md:flex" : "flex"
    );

    switch (mainNavStyle) {
      case 'airbnb-classic':
      case 'airbnb-fluid':
        return (
          <div className={cn(headerClass, "h-24 md:h-28")}>
             <Link to="/" className="flex items-center group">
                {logoURL ? (
                  <img src={getSafeImageUrl(logoURL)} className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" alt={siteName} referrerPolicy="no-referrer" />
                ) : (
                  <img src="/logo.png" className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" alt={siteName} onError={(e) => { e.currentTarget.style.display = 'none'; }} referrerPolicy="no-referrer" />
                )}
             </Link>
             
             <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-full py-2 px-6 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <span className="text-[14px] font-bold text-gray-900 px-4 border-r border-gray-200">Where next?</span>
                <span className="text-[14px] font-bold text-gray-900 px-4 border-r border-gray-200">Dates</span>
                <span className="text-[14px] font-medium text-gray-400 px-4">Group size</span>
                <div className="p-2 bg-primary rounded-full text-white ml-2 group-hover:scale-110 transition-transform">
                   <Search className="h-3 w-3" />
                </div>
             </div>
  
             <div className="flex items-center gap-4">
                {customLinks ? (
                  customLinks.map((link, idx) => (
                    <Link key={idx} to={link.url} className="hidden lg:block text-sm font-bold text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-full transition-colors">{link.label}</Link>
                  ))
                ) : (
                  <Link to="/tours" className="hidden lg:block text-sm font-bold text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-full transition-colors">Experiences</Link>
                )}
                <button className="hidden lg:block text-gray-900 hover:bg-gray-50 p-3 rounded-full transition-colors" aria-label="Language and currency selection"><Globe className="h-4 w-4" /></button>
                {renderActionArea(true)}
             </div>
          </div>
        );

      case 'modern-dark':
      case 'modern-glass':
        const isGlass = mainNavStyle === 'modern-glass';
        return (
          <div className={cn(
             "container mx-auto px-4 lg:px-8 flex items-center justify-between transition-all", 
             isGlass ? "bg-white/10 backdrop-blur-3xl border border-white/5 rounded-3xl mt-4 mx-4 w-auto h-16 shadow-2xl text-white" : "bg-gray-950 text-white border-b border-gray-800 h-20 w-full"
          )}>
             <Link to="/" className="flex items-center gap-3 group">
                {logoURL ? (
                  <img src={getSafeImageUrl(logoURL)} alt={siteName} className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                ) : (
                  <>
                    <div className="h-10 w-10 bg-primary text-white font-black text-xl flex items-center justify-center rounded-xl rotate-3">B</div>
                    <span className="text-xl font-black tracking-tighter hidden sm:block text-white">{siteName || 'ADV.'}</span>
                  </>
                )}
             </Link>
  
             <nav className={cn(
               "hidden lg:flex items-center gap-1 p-1 rounded-2xl border",
               isGlass ? "bg-black/20 border-white/5" : "bg-gray-900 border-gray-800"
             )}>
                {customLinks ? (
                  customLinks.map((link, idx) => (
                    <Link key={idx} to={link.url} className="px-5 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/10">{link.label}</Link>
                  ))
                ) : (
                  <>
                    <Link to="/" className="px-5 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/10">Index</Link>
                    <Link to="/tours" className="px-5 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest bg-primary text-white shadow-sm">Expeditions</Link>
                    <Link to="/planner" className="px-5 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/10">AI Planner</Link>
                    <Link to="/blog" className="px-5 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/10">News</Link>
                  </>
                )}
             </nav>
  
             <div className="flex items-center gap-3">
                <button className={cn(
                   "p-2.5 rounded-xl transition-all hover:scale-105 shadow-xl",
                   isGlass ? "bg-white text-gray-900 shadow-white/5" : "bg-gray-900 text-white"
                )}><Search className="h-4 w-4" /></button>
                {renderActionArea(true)}
             </div>
          </div>
        );

      case 'minimal-grid':
      case 'minimal-type':
        return (
          <div className={cn(headerClass, "border-b border-gray-100 h-24")}>
             <Link to="/" className="flex items-center gap-2 group">
               {logoURL ? (
                 <img src={getSafeImageUrl(logoURL)} alt={siteName} className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
               ) : (
                 <span className="text-3xl font-black text-gray-900 uppercase tracking-tighter hover:tracking-normal transition-all">{siteName || 'BALI'}</span>
               )}
             </Link>
            
            <nav className="hidden lg:flex items-center gap-12 font-mono text-[10px] uppercase tracking-[0.3em] text-gray-400">
               {customLinks ? (
                 customLinks.map((link, idx) => (
                   <Link key={idx} to={link.url} className="hover:text-gray-900 transition-colors">{link.label}</Link>
                 ))
               ) : (
                 <>
                   <Link to="/" className="hover:text-gray-900 transition-colors">Vol 1.0</Link>
                   <Link to="/tours" className="text-gray-900 font-bold border-b border-gray-900">Archive</Link>
                   <Link to="/planner" className="hover:text-gray-900 transition-colors">Tools</Link>
                   <Link to="/contact" className="hover:text-gray-900 transition-colors">Inquire</Link>
                 </>
               )}
            </nav>
  
             <div className="flex items-center gap-8">
                <button className="text-gray-900 hover:scale-110 transition-transform"><Search className="h-4 w-4" /></button>
                {renderActionArea()}
             </div>
          </div>
        );

      case 'premium-serif':
      case 'premium-full':
        const isDark = mainNavStyle === 'premium-full';
        return (
          <div className={cn(headerClass, "h-28", isDark && "text-white")}>
            <div className="flex items-center gap-10">
               <button className={cn("hidden lg:block transition-colors", isDark ? "text-white/20 hover:text-white" : "text-[#80766d] hover:text-[#2d2a26]")}><LayoutGrid className="h-5 w-5" /></button>
               {customLinks ? (
                 <nav className={cn("hidden lg:flex items-center gap-10 font-serif text-[13px] tracking-[0.15em] uppercase", isDark ? "text-white/50" : "text-[#80766d]")}>
                    {customLinks.slice(0, Math.ceil(customLinks.length / 2)).map((link, idx) => (
                      <Link key={idx} to={link.url} className="hover:text-primary transition-colors">{link.label}</Link>
                    ))}
                 </nav>
               ) : (
                 <nav className={cn("hidden lg:flex items-center gap-10 font-serif text-[13px] tracking-[0.15em] uppercase", isDark ? "text-white/50" : "text-[#80766d]")}>
                    <Link to="/tours" className="hover:text-primary transition-colors">Collections</Link>
                    <Link to="/about" className="hover:text-primary transition-colors">Ethos</Link>
                 </nav>
               )}
            </div>
  
            <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center group">
               {logoURL ? (
                 <img src={getSafeImageUrl(logoURL)} alt={siteName} className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
               ) : (
                 <div className="text-center">
                   <span className={cn("block font-serif text-4xl italic leading-none transition-transform group-hover:scale-105", isDark ? "text-white" : "text-gray-900")}>{siteName || 'Bali'}</span>
                   <span className="block text-[8px] font-black tracking-[0.5em] uppercase text-amber-500 mt-2">Private Expeditions</span>
                 </div>
               )}
            </Link>
  
            <div className="flex items-center gap-10">
               {customLinks ? (
                 <nav className={cn("hidden lg:flex items-center gap-10 font-serif text-[13px] tracking-[0.15em] uppercase", isDark ? "text-white/50" : "text-[#80766d]")}>
                    {customLinks.slice(Math.ceil(customLinks.length / 2)).map((link, idx) => (
                      <Link key={idx} to={link.url} className="hover:text-primary transition-colors">{link.label}</Link>
                    ))}
                 </nav>
               ) : (
                 <nav className={cn("hidden lg:flex items-center gap-10 font-serif text-[13px] tracking-[0.15em] uppercase", isDark ? "text-white/50" : "text-[#80766d]")}>
                    <Link to="/blog" className="hover:text-primary transition-colors">Narratives</Link>
                    <Link to="/contact" className="hover:text-primary transition-colors">Concierge</Link>
                 </nav>
               )}
               {renderActionArea()}
            </div>
          </div>
        );

      case 'saas-clean':
      case 'saas-dash':
        return (
          <div className={cn(headerClass, "h-16")}>
            <div className="flex items-center gap-12">
               <Link to="/" className="flex items-center gap-2.5 group">
                  {logoURL ? (
                    <img src={getSafeImageUrl(logoURL)} alt={siteName} className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                  ) : (
                    <>
                      <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20 group-hover:rotate-6 transition-transform"><Zap className="h-5 w-5" /></div>
                      <span className="font-extrabold text-xl tracking-tight text-gray-900">{siteName || 'BaliEngine'}</span>
                    </>
                  )}
               </Link>
               <nav className="hidden lg:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-gray-400">
                  {customLinks ? (
                    customLinks.map((link, idx) => (
                      <Link key={idx} to={link.url} className="hover:text-primary transition-colors">{link.label}</Link>
                    ))
                  ) : (
                    <>
                      <Link to="/tours" className="hover:text-primary transition-colors">Cloud</Link>
                      <Link to="/about" className="hover:text-primary transition-colors">Infrastructure</Link>
                    </>
                  )}
               </nav>
            </div>
  
            <div className="flex items-center gap-4">
               {user ? (
                 <Link to="/customer/dashboard" className="px-5 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl transition-all">Console</Link>
               ) : (
                 <>
                   <Link to="/login" className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 px-4">Sign in</Link>
                   <Link to="/login" className="px-5 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl shadow-primary/10 transition-all">Register</Link>
                 </>
               )}
            </div>
          </div>
        );

      case 'centered-logo':
        return (
          <div className={cn(headerClass, "h-24 md:h-28 border-b border-gray-100 bg-white")}>
             <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-gray-700">
                <Link to="/tours" className="hover:text-primary transition-colors">All Tours</Link>
                <Link to="/planner" className="hover:text-primary transition-colors">AI Trip Planner</Link>
             </nav>

             <Link to="/" className="flex items-center justify-center group">
                {logoURL ? (
                  <img src={getSafeImageUrl(logoURL)} alt={siteName} className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase group-hover:text-primary transition-colors">{siteName}</span>
                )}
             </Link>

             <div className="flex items-center gap-4">
                <CurrencySwitcher variant="minimal" />
                {renderActionArea()}
             </div>
          </div>
        );

      case 'floating-dock':
        return (
          <div className="container mx-auto px-4 py-4 fixed top-2 left-0 right-0 z-50 pointer-events-none">
             <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-2xl border border-gray-200/80 rounded-full px-6 py-3 shadow-2xl flex items-center justify-between pointer-events-auto transition-all hover:border-gray-300">
                <Link to="/" className="flex items-center gap-2 group">
                   {logoURL ? (
                     <img src={getSafeImageUrl(logoURL)} alt={siteName} className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                   ) : (
                     <span className="font-black text-lg text-gray-900 tracking-tight">{siteName}</span>
                   )}
                </Link>

                <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1 rounded-full">
                   {customLinks ? (
                     customLinks.map((link, idx) => (
                       <Link key={idx} to={link.url} className="px-4 py-1.5 rounded-full text-xs font-bold text-gray-700 hover:bg-white hover:shadow-xs transition-all">{link.label}</Link>
                     ))
                   ) : (
                     <>
                       <Link to="/tours" className="px-4 py-1.5 rounded-full text-xs font-bold text-gray-700 hover:bg-white hover:shadow-xs transition-all">Tours</Link>
                       <Link to="/planner" className="px-4 py-1.5 rounded-full text-xs font-bold text-gray-700 hover:bg-white hover:shadow-xs transition-all">AI Planner</Link>
                       <Link to="/contact" className="px-4 py-1.5 rounded-full text-xs font-bold text-gray-700 hover:bg-white hover:shadow-xs transition-all">Contact</Link>
                     </>
                   )}
                </nav>

                <div className="flex items-center gap-3">
                   <CurrencySwitcher variant="minimal" />
                   {renderActionArea(true)}
                </div>
             </div>
          </div>
        );

      case 'split-action':
        return (
          <div className={cn(headerClass, "h-20 bg-gray-900 text-white px-6 md:px-12")}>
             <Link to="/" className="flex items-center gap-3 group">
                {logoURL ? (
                  <img src={getSafeImageUrl(logoURL)} alt={siteName} className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                ) : (
                  <>
                    <div className="w-10 h-10 bg-primary text-white rounded-xl font-black text-xl flex items-center justify-center shadow-lg shadow-primary/30">B</div>
                    <span className="font-extrabold text-xl tracking-tight text-white">{siteName}</span>
                  </>
                )}
             </Link>

             <nav className="hidden lg:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-gray-300">
                <Link to="/tours" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  Tours <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[9px]">Hot</span>
                </Link>
                <Link to="/planner" className="hover:text-primary transition-colors">AI Trip Planner</Link>
                <Link to="/blog" className="hover:text-primary transition-colors">Stories</Link>
             </nav>

             <div className="flex items-center gap-3">
                <Link to="/contact" className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-all">
                   Contact Us
                </Link>
                <Link to="/tours" className="px-5 py-2.5 rounded-xl text-xs font-black bg-primary text-white hover:bg-orange-600 shadow-lg shadow-orange-900/40 transition-all">
                   Book Tour
                </Link>
             </div>
          </div>
        );

      case 'lux-editorial':
        return (
          <div className={cn(headerClass, "h-24 bg-[#FAF8F5] border-b border-[#E8E2D9] px-6 lg:px-12")}>
             <Link to="/" className="flex items-center group">
                {logoURL ? (
                  <img src={getSafeImageUrl(logoURL)} alt={siteName} className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-serif text-3xl italic text-gray-900 tracking-tight">{siteName}</span>
                )}
             </Link>

             <nav className="hidden lg:flex items-center gap-10 font-sans text-[11px] font-black uppercase tracking-[0.25em] text-gray-500">
                <Link to="/tours" className="hover:text-gray-900 transition-colors">Curated Collections</Link>
                <Link to="/about" className="hover:text-gray-900 transition-colors">Our Philosophy</Link>
                <Link to="/contact" className="hover:text-gray-900 transition-colors">Private Concierge</Link>
             </nav>

             <div className="flex items-center gap-4">
                <a href={`https://wa.me/${settings?.whatsappNumber?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-100/80 px-4 py-2 rounded-full border border-amber-200 hover:bg-amber-200 transition-all">
                   <Phone className="w-3.5 h-3.5" /> Direct Concierge
                </a>
                <CurrencySwitcher variant="minimal" />
             </div>
          </div>
        );

      case 'brutalist-bold':
        return (
          <div className={cn(headerClass, "h-20 bg-yellow-400 border-b-4 border-black px-6 lg:px-10")}>
             <Link to="/" className="flex items-center group">
                {logoURL ? (
                  <img src={getSafeImageUrl(logoURL)} alt={siteName} className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-black text-2xl uppercase tracking-tighter text-black hover:skew-x-2 transition-transform">{siteName} ★</span>
                )}
             </Link>

             <nav className="hidden lg:flex items-center gap-8 font-mono text-xs font-black uppercase text-black">
                <Link to="/tours" className="hover:underline underline-offset-4 decoration-2">EXPLORE TOURS</Link>
                <Link to="/planner" className="hover:underline underline-offset-4 decoration-2">AI PLANNER</Link>
                <Link to="/contact" className="hover:underline underline-offset-4 decoration-2">CONTACT</Link>
             </nav>

             <div className="flex items-center gap-4">
                <Link to="/tours" className="px-6 py-2.5 bg-black text-white font-black text-xs uppercase tracking-wider rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   BOOK NOW
                </Link>
             </div>
          </div>
        );

      default:
        return (
          <div className={headerClass}>
            <Link to="/" className="flex items-center gap-2 group">
              {logoURL ? (
                <img 
                  src={getSafeImageUrl(logoURL)} 
                  alt={siteName} 
                  className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
                  loading="eager"
                  width="240"
                  height="80"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <>
                  <div className="relative">
                    <Leaf className="h-9 w-9 text-primary transition-transform group-hover:rotate-12" />
                  </div>
                  <div className="flex flex-col -space-y-1">
                    {siteName ? (
                      siteName.includes(' ') ? (
                        <>
                          <span className="text-xl font-black text-gray-900 leading-tight tracking-tighter">
                            {siteName.split(' ')[0]}
                          </span>
                          <span className="text-xl font-black text-primary leading-tight tracking-tighter">
                            {siteName.split(' ').slice(1).join(' ')}
                          </span>
                        </>
                      ) : siteName.includes('.') ? (
                        <>
                          <span className="text-xl font-black text-gray-900 leading-tight tracking-tighter">
                            {siteName.split('.')[0]}
                          </span>
                          <span className="text-xl font-black text-primary leading-tight tracking-tighter">
                            .{siteName.split('.').slice(1).join('.')}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-black text-gray-900 leading-tight tracking-tighter">
                          {siteName}
                        </span>
                      )
                    ) : (
                      <>
                        <span className="text-xl font-black text-gray-900 leading-tight tracking-tighter">
                          Tripbone
                        </span>
                        <span className="text-xl font-black text-primary leading-tight tracking-tighter">
                          .com
                        </span>
                      </>
                    )}
                  </div>
                </>
              )}
            </Link>
  
            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-5">
              {customLinks ? (
                customLinks.map((link, idx) => (
                  <Link key={idx} to={link.url} className="text-sm font-black text-gray-900 hover:text-primary transition-colors">{link.label}</Link>
                ))
              ) : (
                <>
                  <Link to="/" className="text-sm font-black text-gray-900 hover:text-primary transition-colors">Home</Link>
                  <Link to="/tours" className="text-sm font-black text-gray-900 hover:text-primary transition-colors">Tours</Link>
                  {settings?.carRentalModule?.enabled !== false && (
                    <Link to="/rentals" className="text-sm font-black text-gray-900 hover:text-primary transition-colors">Rentals</Link>
                  )}
                  <Link to="/planner" className="relative text-sm font-black text-primary hover:text-orange-700 transition-colors flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Planner
                    <span className="absolute -top-3 -right-6 bg-orange-500 text-[8px] text-white px-1.5 py-0.5 rounded-full animate-pulse uppercase tracking-widest">New</span>
                  </Link>
                  <Link to="/blog" className="text-sm font-black text-gray-900 hover:text-primary transition-colors">Blog</Link>
                  <Link to="/about" className="text-sm font-black text-gray-900 hover:text-primary transition-colors">About</Link>
                  <Link to="/contact" className="text-sm font-black text-gray-900 hover:text-primary transition-colors">Contact</Link>
                </>
              )}
            </nav>
  
            {/* Action Area */}
            {renderActionArea()}
          </div>
        );
    }
  };

  const renderActionArea = (pills = false) => (
    <div className="flex items-center gap-6">
      <div className="relative" ref={searchRef}>
        <button 
          onClick={() => setShowSearch(!showSearch)}
          aria-label="Toggle search bar"
          className={cn(
            "p-2 rounded-full transition-all",
            showSearch ? "bg-primary text-white" : "text-gray-900 hover:bg-gray-50",
            pills && "bg-white border border-gray-200 shadow-sm"
          )}
        >
          <Search className="h-4 w-4" />
        </button>

        <AnimatePresence>
          {showSearch && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-[280px] md:w-[400px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[110] p-4"
            >
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="flex-1 relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                   <input 
                     autoFocus
                     type="text"
                     placeholder="What do you want to do?"
                     value={searchKeyword}
                     onChange={(e) => setSearchKeyword(e.target.value)}
                     className="w-full bg-gray-50 border-none pl-9 pr-4 py-2.5 rounded-xl text-xs font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                   />
                </div>
                <button 
                  type="submit"
                  className="bg-primary text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-primary/10"
                >
                  Search
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {user && (
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Toggle notifications"
            className={cn(
              "relative p-2 text-gray-900 hover:bg-gray-50 rounded-full transition-colors",
              pills && "bg-white border border-gray-200 shadow-sm"
            )}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100]"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="text-xs font-black text-gray-900 uppercase">Notifications</h4>
                  {notifications.length > 0 && (
                    <span className="text-[10px] font-black text-primary bg-orange-50 px-2 py-0.5 rounded-full">
                      {notifications.length} New
                    </span>
                  )}
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center">
                      <Bell className="h-8 w-8 text-gray-100 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 flex gap-3 cursor-pointer"
                        onClick={() => {
                          if (notif.type === 'booking') navigate('/customer/bookings');
                          setShowNotifications(false);
                        }}
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                          notif.type === 'booking' ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-primary"
                        )}>
                          {notif.type === 'booking' ? <Calendar className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">{notif.title}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{notif.message}</p>
                          <p className="text-[9px] text-gray-300 font-bold uppercase mt-2">
                            {notif.time?.seconds ? new Date(notif.time.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link to="/customer/dashboard" onClick={() => setShowNotifications(false)} className="block p-3 text-center text-[10px] font-black text-gray-400 hover:text-gray-900 bg-gray-50/50 transition-colors uppercase tracking-widest">
                  View all activities
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {profile?.role === 'admin' && (
        <Link to="/admin" className={cn("p-2 text-gray-900 hover:text-amber-600", pills && "bg-white border border-gray-200 shadow-sm rounded-full")}>
          <Shield className="h-4 w-4" />
        </Link>
      )}

      {user ? (
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={cn("flex items-center gap-2 group/user focus:outline-none", pills && "bg-white border border-gray-200 shadow-sm rounded-full p-1.5 px-3")}
          >
            <div className="text-right hidden lg:block mr-1">
              <p className="text-xs font-black text-gray-900 leading-none mb-1 group-hover/user:text-primary transition-colors tracking-tight">
                {profile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'User'}
              </p>
              <p className="text-[9px] text-gray-400 font-bold leading-none tracking-widest uppercase">
                {profile?.role || 'Customer'}
              </p>
            </div>
            <div className="relative">
              <img src={profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName || user?.email}&background=0D9488&color=fff`} alt={user?.displayName} className="h-8 w-8 rounded-full border border-gray-100 object-cover" width="32" height="32" />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-gray-100 hidden md:block">
                <ChevronDown className={cn("h-2.5 w-2.5 text-gray-400 transition-transform", showUserMenu && "rotate-180")} />
              </div>
            </div>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[120]"
              >
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                  <p className="text-xs font-black text-gray-900 truncate">{profile?.displayName || user?.displayName || 'User'}</p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5 font-medium">{user?.email}</p>
                </div>
                
                <div className="p-2">
                  <Link 
                    to="/customer/dashboard" 
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-orange-50 hover:text-primary transition-all"
                  >
                    <Shield className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link 
                    to="/customer/profile" 
                    state={{ tab: 'personal' }}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-orange-50 hover:text-primary transition-all"
                  >
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Link>
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black text-red-500 hover:bg-red-50 transition-all text-left uppercase tracking-widest"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <Link to="/login" className="flex items-center gap-3 group/user">
          <div className="text-right hidden lg:block">
            <p className="text-xs font-black text-gray-900 leading-none mb-1 group-hover/user:text-primary transition-colors tracking-tight">Guest User</p>
            <p className="text-[9px] text-gray-400 font-bold leading-none tracking-widest">Sign In</p>
          </div>
          <div className="h-8 w-8 rounded-full border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-400 group-hover/user:text-primary transition-colors">
            <User className="h-4 w-4" />
          </div>
        </Link>
      )}
    </div>
  );

  return (
    <header className={cn(
      "fixed top-0 z-50 w-full transition-all",
      isCheckout ? "hidden md:block shadow-none" : "shadow-sm md:shadow-none",
      (topNavStyle === 'default' || !topNavStyle) ? "bg-white" : "bg-transparent"
    )}>
      {/* Top Dark Announcement / Header Navigation Bar */}
      <TopAnnouncementBar />

      {/* Conditionally Render Top Nav */}
      {renderTopNav()}

      {/* Conditionally Render Main Nav */}
      <div className={cn(
         "w-full transition-all",
         (mainNavStyle === 'default' || !mainNavStyle) ? "bg-white" : "bg-transparent"
      )}>
        {renderMainNav()}
      </div>

      {/* Mobile-Only Specialized Header (Tour) */}
      {(isTourDetail && !isCheckout) && (
        <div className="md:hidden flex flex-col bg-white px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-bold text-gray-900 tracking-tight text-center flex-1 mx-2">
              {location.pathname.startsWith('/tour/') ? 'Tour Details' : (siteName || 'Tripbone')}
            </h1>
            <button className="p-2 -mr-2 text-gray-600 active:bg-gray-100 rounded-full transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
