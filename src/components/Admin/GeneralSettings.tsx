import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, getDocs, limit, query } from '@/src/lib/firebase';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { SiteSettings, Booking, Payout } from '../../types';
import { uploadImage } from '../../lib/imgbb';
import { useTenant } from '../../lib/TenantContext';
import { 
  Save, 
  Globe, 
  Palette, 
  Mail, 
  Phone, 
  MapPin,
  Type, 
  Search, 
  Image as ImageIcon,
  Loader2,
  Check,
  Video,
  Instagram,
  Facebook,
  Twitter,
  Music2,
  Database,
  Bot,
  Layout,
  Zap,
  LayoutGrid,
  CreditCard,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Info,
  Star,
  ShieldCheck,
  Award
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { updateTenantGA, extractMeasurementId } from '../../lib/googleAnalytics';

const TOP_NAV_OPTIONS = [
  { id: 'default', name: 'Classic Dark Bar (Phone, Support Email, Currency)', category: 'TopBar' },
  { id: 'airbnb-classic', name: 'Airbnb White Bar (Welcome, WhatsApp assistance)', category: 'TopBar' },
  { id: 'emerald-safari', name: 'Emerald Tropical Bar (24/7 Hotline badge, WhatsApp)', category: 'TopBar' },
  { id: 'tokyo-neon', name: 'Cyberpunk Slate Bar (Live booking status, System status)', category: 'TopBar' },
  { id: 'sunset-ibiza', name: 'Gradient Sunset Bar (Promo discount banner)', category: 'TopBar' },
  { id: 'nordic-clean', name: 'Nordic Stone Grey Bar (Operating hours, Phone)', category: 'TopBar' },
  { id: 'royal-gold', name: 'Royal Black & Gold Bar (VIP Concierge)', category: 'TopBar' },
  { id: 'modern-dark', name: 'Modern Dark Bar (Adventure intelligence)', category: 'TopBar' },
  { id: 'modern-glass', name: 'Glassmorphism Bar (AI Planner CTA)', category: 'TopBar' },
  { id: 'minimal-type', name: 'Editorial Typographic Bar (Monospace contact details)', category: 'TopBar' },
  { id: 'saas-clean', name: 'SaaS Minimal Bar (Build version tag)', category: 'TopBar' },
];

const MAIN_NAV_OPTIONS = [
  { id: 'default', name: 'Standard Responsive Navigation (Logo, Links, Search, CTA)', category: 'MainNav' },
  { id: 'airbnb-classic', name: 'Airbnb Floating Search Pill Header ("Where next?")', category: 'MainNav' },
  { id: 'centered-logo', name: 'Centered Brand Logo Header (Left categories, Centered logo)', category: 'MainNav' },
  { id: 'floating-dock', name: 'Apple Floating Capsule Island (Floats centered with blur)', category: 'MainNav' },
  { id: 'split-action', name: 'Split Action Header (Brand left, Badge links, Dual CTAs)', category: 'MainNav' },
  { id: 'lux-editorial', name: 'High-End Editorial Serif Header (Serif logo, Concierge button)', category: 'MainNav' },
  { id: 'brutalist-bold', name: 'High-Contrast Brutalist Header (Yellow canvas, Thick black border)', category: 'MainNav' },
  { id: 'modern-glass', name: 'Glassmorphism Capsule Nav (Dark backdrop blur)', category: 'MainNav' },
  { id: 'minimal-type', name: 'Editorial Typographic Header (Monospace typography)', category: 'MainNav' },
  { id: 'saas-clean', name: 'SaaS Engine Header (Compact logo, Console button)', category: 'MainNav' },
];

const THEME_OPTIONS = [
  { id: 'slideshow-atv', name: 'Cinematic Multi-Image Slideshow Hero', category: 'Slideshow' },
  { id: 'airbnb-classic', name: 'Airbnb Split Search & Gallery Hero', category: 'Airbnb' },
  { id: 'youtube-video', name: 'Full Video Background Hero', category: 'Video' },
  { id: 'split-media-right', name: 'Split Content & Glass Media Card Hero', category: 'Modern Split' },
  { id: 'centered-overlay', name: 'Luxury Centered Cover & Search Overlay', category: 'Centered' },
  { id: 'bento-grid-hero', name: 'Bento Showcase Grid Hero', category: 'Bento UI' },
  { id: 'floating-card-hero', name: 'Floating Island Booking Card Hero', category: 'Floating Card' },
  { id: 'modern-glass', name: 'Glassmorphism Cyber Slate Hero', category: 'Dark Mode' },
  { id: 'minimal-type', name: 'Editorial Typographic Hero', category: 'Minimalist' },
];

const SECTIONS = [
  { id: 'topNav', name: 'Top Navigation' },
  { id: 'mainNav', name: 'Main Navigation' },
  { id: 'hero', name: 'Hero Section' },
  { id: 'featuredTours', name: 'Featured Tours' },
  { id: 'guestFavorites', name: 'Guest Favorites' },
  { id: 'reviews', name: 'Reviews' },
  { id: 'inspiration', name: 'Travel Inspiration' },
  { id: 'footer', name: 'Footer' },
  { id: 'aboutPage', name: 'About Us Page' },
  { id: 'contactPage', name: 'Contact Page' },
  { id: 'blogPage', name: 'Blog Page' },
];

export default function GeneralSettings({ activeTab = 'all' }: { activeTab?: 'company-info' | 'seo' | 'website' | 'domain' | 'builder' | 'all' }) {
  const { tenantId, tenant } = useTenant();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [initialCustomDomain, setInitialCustomDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingHeroMultiple, setUploadingHeroMultiple] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [showDomainCopied, setShowDomainCopied] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    domain: string;
    isSubdomain: boolean;
    verified: boolean;
    cnameRecords: string[];
    aRecords: string[];
    dnsError: string | null;
    expectedCname: string;
    expectedA: string;
    checkedAt: string;
    isSandboxEnvironment?: boolean;
  } | null>(null);

  const handleVerifyDomain = async () => {
    if (!settings?.customDomain) return;
    setVerifyingDomain(true);
    setVerificationResult(null);
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch(`/api/tenant/verify-domain?domain=${encodeURIComponent(settings.customDomain)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setVerificationResult(data);
    } catch (err: any) {
      console.error("DNS verification check failed", err);
    } finally {
      setVerifyingDomain(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setShowDomainCopied(label);
    setTimeout(() => setShowDomainCopied(null), 2000);
  };

  const defaultSettings: SiteSettings = {
    siteName: tenant?.companyName || 'Tripbone',
    siteDescription: tenant?.companyName ? `Premium Tours & Adventure Experiences with ${tenant.companyName}` : 'Premium Tours & Adventure Experiences',
    siteKeywords: 'tours, adventure, travel, booking, vacation',
    supportEmail: tenant?.email || 'support@tripbone.com',
    supportPhone: tenant?.phone || '+62 812-3456-7890',
    whatsappNumber: tenant?.phone || '+62 812-3456-7890',
    logoURL: tenant?.logo || '',
    faviconURL: tenant?.favicon || '',
    heroImage: '',
    officeAddress: tenant?.address || 'Jl. Raya Ubud, Gianyar, Bali, Indonesia 80571',
    primaryColor: tenant?.primaryColor || '#00A651',
    secondaryColor: tenant?.secondaryColor || '#ffffff',
    bodyFont: 'Inter',
    headingFont: 'Space Grotesk',
    currency: 'USD',
    customDomain: tenant?.customDomain || '',
    brandingPreset: 'default'
  };

  useEffect(() => {
    async function fetchSettings() {
      const docRef = doc(db, 'settings', tenantId || 'general');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as SiteSettings;
        setSettings({ ...defaultSettings, ...data });
        setInitialCustomDomain(data.customDomain || '');
      } else {
        setSettings(defaultSettings);
      }
      setLoading(false);
    }
    fetchSettings();
  }, [tenantId, tenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    try {
      const settingsId = tenantId || 'general';
      await setDoc(doc(db, 'settings', settingsId), settings);

      // Sync GA4 settings live for this tenant
      let cleanGaId = (settings.gaMeasurementId || '').trim().toUpperCase();
      const cleanGaScript = (settings.gaCustomScript || '').trim();
      
      if (!cleanGaId && cleanGaScript) {
        cleanGaId = extractMeasurementId(cleanGaScript);
      }

      updateTenantGA(tenantId, cleanGaId, cleanGaScript);

      // Handle Vercel Custom Domain APIs if it changed
      if (tenantId && settings.customDomain !== initialCustomDomain) {
        // If there was an old domain, remove it first
        if (initialCustomDomain) {
          try {
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
            await fetch(`/api/tenant/remove-domain?domain=${encodeURIComponent(initialCustomDomain)}`, { 
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } catch (e) {
            console.error("Failed to remove old domain", e);
          }
        }
        
        // If a new domain was added
        if (settings.customDomain) {
          try {
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
            await fetch(`/api/tenant/add-domain`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ domain: settings.customDomain })
            });
          } catch (e) {
            console.error("Failed to add new domain", e);
          }
        }
        setInitialCustomDomain(settings.customDomain || '');
      }

      // Sync customDomain to tenant document
      if (tenantId) {
        await setDoc(doc(db, 'tenants', tenantId), {
          customDomain: settings.customDomain || '',
          updatedAt: new Date()
        }, { merge: true });
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSeedData = async () => {
    setSaving(true);
    try {
      // 1. Get first tour for reference
      const toursSnap = await getDocs(query(collection(db, 'tours'), limit(1)));
      if (toursSnap.empty) {
        alert("Please create at least one tour before seeding!");
        return;
      }
      const tour = { id: toursSnap.docs[0].id, ...toursSnap.docs[0].data() } as any;
      const effectiveMax = tour.maxCapacity || 20;

      const dummyBookings: Partial<Booking>[] = Array.from({ length: 5 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        return {
          tourId: tour.id,
          tourTitle: tour.title,
          supplierId: tour.supplierId || '',
          packageName: tour.packages?.[0]?.name || 'Standard',
          date: dateStr,
          time: '08:30 AM',
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentMethod: 'paypal',
          totalAmount: 150 + (i * 20),
          customerData: {
            fullName: `Test Customer ${i + 1}`,
            email: `test${i + 1}@example.com`,
            phone: `+62812345678${i}`,
            nationality: 'Australia'
          },
          participants: { adults: 2, children: 1 },
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
          payoutStatus: 'pending',
          logs: []
        };
      });

      for (const booking of dummyBookings) {
        await addDoc(collection(db, 'bookings'), booking);
        
        // --- Create Inventory for the booking ---
        const inventoryId = `${tour.id}_${booking.date}_08:30 AM`;
        await setDoc(doc(db, 'inventory', inventoryId), {
          tourId: tour.id,
          date: booking.date,
          timeSlot: '08:30 AM',
          bookedCount: 3, // 2 adults + 1 child from dummy booking
          maxCapacity: effectiveMax,
          updatedAt: serverTimestamp()
        });
      }

      // 3. Create a dummy payout
      const dummyPayout: Partial<Payout> = {
        supplierId: tour.supplierId || 'direct',
        supplierName: tour.supplierName || 'Test Supplier',
        amount: 450.00,
        currency: 'USD',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        bookingIds: [],
        payoutMethod: { 
          type: 'bank_transfer', 
          bankName: 'BCA', 
          accountNumber: '12345678', 
          accountHolder: 'Test Supplier' 
        }
      };
      await addDoc(collection(db, 'payouts'), dummyPayout);

      alert("Successfully seeded 5 bookings and 1 pending payout!");
    } catch (e: any) {
      console.error(e);
      try {
        handleFirestoreError(e, OperationType.CREATE, 'seeding');
      } catch (err: any) {
        alert("Failed to seed data: " + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'company-info':
        return { title: 'Company Information', subtitle: 'Manage company name, contacts, and social media handles' };
      case 'seo':
        return { title: 'SEO Settings', subtitle: 'Optimize search engine metadata for higher rank and click rates' };
      case 'website':
        return { title: 'Website Branding & Styles', subtitle: 'Manage colors, fonts, slideshows, and custom assets' };
      case 'domain':
        return { title: 'Custom Domain Settings', subtitle: 'Configure and point your own branded custom domain' };
      case 'builder':
        return { title: 'Website Section Builder', subtitle: 'Dynamically customize and design individual home sections' };
      default:
        return { title: 'General Site Settings', subtitle: 'Configure global branding and meta settings' };
    }
  };
  const headerInfo = getHeaderInfo();

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{headerInfo.title}</h2>
          <p className="text-gray-500">{headerInfo.subtitle}</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-[10px] font-bold text-sm hover:brightness-90 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {message && (
        <div className={cn(
          "p-4 rounded-[12px] flex items-center gap-3",
          message.type === 'success' ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
        )}>
          {message.type === 'success' ? <Check className="h-5 w-5" /> : <Loader2 className="h-5 w-5" />}
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8", activeTab !== 'all' && "md:grid-cols-1 max-w-3xl mx-auto")}>
        {/* Basic Info */}
        {(activeTab === 'all' || activeTab === 'company-info' || activeTab === 'website' || activeTab === 'domain') && (
          <div className="space-y-6 bg-white p-6 rounded-[24px] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {activeTab === 'domain' ? 'Custom Domain Connection' : 'Branding & Info'}
            </h3>
            <div className="space-y-4">
              {(activeTab === 'all' || activeTab === 'company-info' || activeTab === 'website') && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Site Name</label>
                    <input 
                      type="text" 
                      value={settings?.siteName}
                      onChange={(e) => setSettings(s => s ? {...s, siteName: e.target.value} : null)}
                      className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center justify-between">
                      <span>Primary Destination / Region</span>
                      <span className="text-[10px] text-gray-400 font-normal lowercase">(e.g. Lombok, Tokyo, Bali)</span>
                    </label>
                    <input 
                      type="text" 
                      value={settings?.destinationRegion || ''}
                      onChange={(e) => setSettings(s => s ? {...s, destinationRegion: e.target.value} : null)}
                      placeholder="e.g. Lombok, Tokyo, Bali, Paris"
                      className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}
            {(activeTab === 'all' || activeTab === 'domain') && tenantId && (
              <div className="space-y-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                    <span>Custom Domain</span>
                    <span className="text-[10px] text-gray-400 font-mono font-normal tracking-normal">(e.g. tours.yourcompany.com)</span>
                  </label>
                  <input 
                    type="text" 
                    value={settings?.customDomain || ''}
                    onChange={(e) => {
                      setSettings(s => s ? {...s, customDomain: e.target.value} : null);
                      setVerificationResult(null);
                    }}
                    placeholder="tours.yourcompany.com"
                    className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary font-mono placeholder-gray-400"
                  />
                </div>

                {settings?.customDomain && (
                  <div className="bg-gray-50/70 border border-gray-100 p-4 rounded-[18px] space-y-3.5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 text-primary" />
                        DNS Routing Guide
                      </span>
                      <a 
                        href="https://dnschecker.org" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] text-gray-400 hover:text-primary flex items-center gap-0.5 transition-colors font-medium"
                      >
                        <span>DNS Lookup Tool</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed">
                      To point your custom domain <code className="bg-gray-100 px-1 py-0.5 rounded text-primary font-mono text-[11px]">{settings.customDomain}</code> to Tripbone, add the following DNS record in your domain registrar's panel (GoDaddy, Namecheap, Cloudflare, etc.):
                    </p>

                    {(() => {
                      const cleanDomain = settings.customDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
                      const isSub = cleanDomain.split('.').length > 2;
                      const recordType = isSub ? 'CNAME' : 'A';
                      const recordHost = isSub ? cleanDomain.split('.')[0] : '@';
                      const recordValue = isSub ? 'cname.vercel-dns.com' : '76.76.21.21';

                      return (
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-1 bg-gray-100/50 p-2 rounded-[12px] text-[11px] font-mono border border-gray-150">
                            <div>
                              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-0.5">Type</div>
                              <div className="bg-white px-2 py-1 rounded-[6px] text-gray-800 font-bold border border-gray-100 text-center">{recordType}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-0.5 font-sans">Host</div>
                              <div className="bg-white px-2 py-1 rounded-[6px] text-gray-800 font-bold border border-gray-100 flex items-center justify-between gap-1 group">
                                <span className="truncate">{recordHost}</span>
                                <button 
                                  type="button"
                                  onClick={() => copyToClipboard(recordHost, 'host')}
                                  className="text-gray-400 hover:text-primary transition-colors shrink-0"
                                  title="Copy Host"
                                >
                                  {showDomainCopied === 'host' ? (
                                    <span className="text-[8px] text-primary font-bold font-sans">Copied!</span>
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-0.5 font-sans">Points To</div>
                              <div className="bg-white px-2 py-1 rounded-[6px] text-gray-800 font-bold border border-gray-100 flex items-center justify-between gap-1 group">
                                <span className="truncate">{recordValue}</span>
                                <button 
                                  type="button"
                                  onClick={() => copyToClipboard(recordValue, 'value')}
                                  className="text-gray-400 hover:text-primary transition-colors shrink-0"
                                  title="Copy Value"
                                >
                                  {showDomainCopied === 'value' ? (
                                    <span className="text-[8px] text-primary font-bold font-sans">Copied!</span>
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {!isSub && (
                            <div className="p-2 bg-amber-50 border border-amber-100/70 rounded-[10px] text-[10px] text-amber-700 flex items-start gap-1.5 leading-normal">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <p>
                                <strong>Apex Domain Warning:</strong> Since you are using a root domain, we also recommend adding a CNAME record with Host <code className="bg-amber-100/50 px-1 rounded font-bold">www</code> pointing to <code className="bg-amber-100/50 px-1 rounded font-bold">cname.vercel-dns.com</code>.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="pt-1.5 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={handleVerifyDomain}
                        disabled={verifyingDomain}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50 border border-gray-200/80 rounded-[12px] text-xs font-bold transition duration-150 shadow-sm cursor-pointer"
                      >
                        {verifyingDomain ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            <span>Querying Nameservers...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
                            <span>Verify Connection Status</span>
                          </>
                        )}
                      </button>

                      {verificationResult && (
                        <div className={cn(
                          "p-3 rounded-[12px] border text-xs transition-all space-y-2",
                          verificationResult.verified 
                            ? "bg-emerald-50/70 border-emerald-100 text-emerald-800"
                            : "bg-orange-50/70 border-orange-100 text-orange-800"
                        )}>
                          <div className="flex items-center gap-1.5 font-bold">
                            {verificationResult.verified ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-orange-600 shrink-0" />
                            )}
                            <span>
                              {verificationResult.verified 
                                ? "DNS Connection Status: Active" 
                                : "DNS Propagation Pending"}
                            </span>
                          </div>

                          <p className="text-[11px] leading-relaxed opacity-90">
                            {verificationResult.verified ? (
                              verificationResult.isSandboxEnvironment ? (
                                "Sandbox Simulation verified connection successfully! Custom domain routing is ready."
                              ) : (
                                "Your domain DNS records match Tripbone requirements. Custom domain is active."
                              )
                            ) : (
                              "We checked, but the DNS changes haven't propagated yet or don't match. DNS updates typically take 15 minutes to 4 hours, but can sometimes take up to 24 hours."
                            )}
                          </p>

                          <div className="bg-black/5 p-2 rounded-[8px] font-mono text-[9px] text-gray-600 space-y-1">
                            <div>Clean Domain: {verificationResult.domain}</div>
                            {verificationResult.isSubdomain ? (
                              <div>CNAME Records Found: {verificationResult.cnameRecords.length > 0 ? verificationResult.cnameRecords.join(', ') : 'None'}</div>
                            ) : (
                              <div>A Records Found: {verificationResult.aRecords.length > 0 ? verificationResult.aRecords.join(', ') : 'None'}</div>
                            )}
                            <div>Expected: {verificationResult.isSubdomain ? verificationResult.expectedCname : verificationResult.expectedA}</div>
                            {verificationResult.dnsError && <div className="text-red-500">Lookup Error: {verificationResult.dnsError}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {(activeTab === 'all' || activeTab === 'company-info' || activeTab === 'website') && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Logo</label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-1 h-16 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
                      {settings?.logoURL ? (
                        <img src={settings.logoURL} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">No Logo</span>
                      )}
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <div className="relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                          type="text" 
                          value={settings?.logoURL || ''}
                          onChange={(e) => setSettings(s => s ? {...s, logoURL: e.target.value} : null)}
                          className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-28 py-3 text-sm focus:ring-2 focus:ring-primary"
                          placeholder="https://example.com/logo.png"
                        />
                        <label className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1">
                          {uploadingLogo ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                          <span>Upload</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingLogo(true);
                              try {
                                const url = await uploadImage(file);
                                setSettings(s => s ? {...s, logoURL: url} : null);
                              } catch (err) {
                                console.error(err);
                                alert("Failed to upload logo image");
                              } finally {
                                setUploadingLogo(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Favicon</label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-1 h-16 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
                      {settings?.faviconURL ? (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <img src={settings.faviconURL} alt="Favicon Preview" className="h-8 w-8 object-contain rounded" />
                          <span className="text-[9px] text-gray-400 font-mono font-medium">16x16 / 32x32</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">No Favicon</span>
                      )}
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <div className="relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                          type="text" 
                          value={settings?.faviconURL || ''}
                          onChange={(e) => setSettings(s => s ? {...s, faviconURL: e.target.value} : null)}
                          className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-28 py-3 text-sm focus:ring-2 focus:ring-primary"
                          placeholder="https://example.com/favicon.ico"
                        />
                        <label className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1">
                          {uploadingFavicon ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                          <span>Upload</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingFavicon(true);
                              try {
                                const url = await uploadImage(file);
                                setSettings(s => s ? {...s, faviconURL: url} : null);
                              } catch (err) {
                                console.error(err);
                                alert("Failed to upload favicon image");
                              } finally {
                                setUploadingFavicon(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'website') && (
              <div className="space-y-6 border border-slate-200/80 rounded-[24px] p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-cyan-500" />
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Top Dark Navigation & Announcement Bar</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Manage promotional messages, announcements, or updates displayed at the top bar across your website.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings?.topBarEnabled ?? false}
                      onChange={(e) => setSettings(s => s ? { ...s, topBarEnabled: e.target.checked } : null)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Badge / Tagline</label>
                    <input
                      type="text"
                      value={settings?.topBarBadge ?? ''}
                      onChange={(e) => setSettings(s => s ? { ...s, topBarBadge: e.target.value } : null)}
                      placeholder="e.g. PROMO 🚀, SPECIAL OFFER, LIMITED DEAL"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 bg-gray-50 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">CTA Link Text</label>
                    <input
                      type="text"
                      value={settings?.topBarLinkText ?? ''}
                      onChange={(e) => setSettings(s => s ? { ...s, topBarLinkText: e.target.value } : null)}
                      placeholder="e.g. Book Now, View Deals, Contact Us"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 bg-gray-50 text-gray-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Announcement / Promotional Message</label>
                    <input
                      type="text"
                      value={settings?.topBarText ?? ''}
                      onChange={(e) => setSettings(s => s ? { ...s, topBarText: e.target.value } : null)}
                      placeholder="e.g. Save 15% on all Mount Batur & Ubud tours this week!"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 bg-gray-50 text-gray-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">CTA Redirect URL / Link</label>
                    <input
                      type="text"
                      value={settings?.topBarLink ?? ''}
                      onChange={(e) => setSettings(s => s ? { ...s, topBarLink: e.target.value } : null)}
                      placeholder="e.g. /tours, /contact, or WhatsApp link"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 bg-gray-50 text-gray-900"
                    />
                  </div>
                </div>

                {/* Dark Live Preview */}
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-2">Live Dark Top Bar Preview</span>
                  <div className="bg-slate-950 text-slate-200 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 overflow-hidden truncate">
                      {settings?.topBarBadge && (
                        <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0">
                          {settings.topBarBadge}
                        </span>
                      )}
                      <span className="truncate">{settings?.topBarText || 'Your announcement message preview...'}</span>
                    </div>
                    {settings?.topBarLinkText && (
                      <span className="font-bold text-cyan-400 underline ml-2 flex-shrink-0">{settings.topBarLinkText} &rarr;</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'website') && (
              <div className="space-y-6 border border-slate-200/80 rounded-[24px] p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-500" />
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Tripadvisor, Google Maps & Airbnb Review Collection & Widgets</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Activate/deactivate external review collection widgets and display multi-platform ratings on your frontpage.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings?.externalReviewsEnabled ?? true}
                      onChange={(e) => setSettings(s => s ? { ...s, externalReviewsEnabled: e.target.checked } : null)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Google Maps Card */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span className="font-bold text-xs text-gray-900">Google Maps Reviews</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.googleReviewsEnabled ?? true}
                          onChange={(e) => setSettings(s => s ? { ...s, googleReviewsEnabled: e.target.checked } : null)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Google Maps Review Link</label>
                      <input
                        type="text"
                        value={settings?.googleReviewUrl ?? ''}
                        onChange={(e) => setSettings(s => s ? { ...s, googleReviewUrl: e.target.value } : null)}
                        placeholder="https://maps.google.com/..."
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Rating</label>
                        <input
                          type="number"
                          step="0.1"
                          max="5"
                          min="1"
                          value={settings?.googleRating ?? 4.9}
                          onChange={(e) => setSettings(s => s ? { ...s, googleRating: parseFloat(e.target.value) || 4.9 } : null)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-blue-200 text-gray-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Count</label>
                        <input
                          type="number"
                          value={settings?.googleReviewCount ?? 520}
                          onChange={(e) => setSettings(s => s ? { ...s, googleReviewCount: parseInt(e.target.value, 10) || 520 } : null)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-blue-200 text-gray-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* TripAdvisor Card */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-900 font-black text-[9px] flex items-center justify-center shrink-0">TA</span>
                        <span className="font-bold text-xs text-gray-900">TripAdvisor Reviews</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.tripadvisorEnabled ?? true}
                          onChange={(e) => setSettings(s => s ? { ...s, tripadvisorEnabled: e.target.checked } : null)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">TripAdvisor Listing Link</label>
                      <input
                        type="text"
                        value={settings?.tripadvisorUrl ?? ''}
                        onChange={(e) => setSettings(s => s ? { ...s, tripadvisorUrl: e.target.value } : null)}
                        placeholder="https://www.tripadvisor.com/..."
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-gray-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Rating</label>
                        <input
                          type="number"
                          step="0.1"
                          max="5"
                          min="1"
                          value={settings?.tripadvisorRating ?? 5.0}
                          onChange={(e) => setSettings(s => s ? { ...s, tripadvisorRating: parseFloat(e.target.value) || 5.0 } : null)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-emerald-200 text-gray-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Count</label>
                        <input
                          type="number"
                          value={settings?.tripadvisorReviewCount ?? 342}
                          onChange={(e) => setSettings(s => s ? { ...s, tripadvisorReviewCount: parseInt(e.target.value, 10) || 342 } : null)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-emerald-200 text-gray-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Airbnb Card */}
                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center shrink-0">ab</span>
                        <span className="font-bold text-xs text-gray-900">Airbnb Reviews</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.airbnbEnabled ?? true}
                          onChange={(e) => setSettings(s => s ? { ...s, airbnbEnabled: e.target.checked } : null)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Airbnb Host Listing Link</label>
                      <input
                        type="text"
                        value={settings?.airbnbUrl ?? ''}
                        onChange={(e) => setSettings(s => s ? { ...s, airbnbUrl: e.target.value } : null)}
                        placeholder="https://www.airbnb.com/..."
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-gray-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Rating</label>
                        <input
                          type="number"
                          step="0.1"
                          max="5"
                          min="1"
                          value={settings?.airbnbRating ?? 4.95}
                          onChange={(e) => setSettings(s => s ? { ...s, airbnbRating: parseFloat(e.target.value) || 4.95 } : null)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-rose-200 text-gray-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Count</label>
                        <input
                          type="number"
                          value={settings?.airbnbReviewCount ?? 185}
                          onChange={(e) => setSettings(s => s ? { ...s, airbnbReviewCount: parseInt(e.target.value, 10) || 185 } : null)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-rose-200 text-gray-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Changes will instantly reflect on your tenant website frontpage review section.
                  </p>
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'website') && (
              <div className="space-y-4 border border-gray-100 rounded-[20px] p-6 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider pl-1">Hero Gallery & Slideshow Images</h3>
                  <p className="text-[11px] text-gray-400 font-medium pl-1 mt-0.5">
                    Upload or paste URLs for images used in your homepage Hero Slideshow or Airbnb Split Search & Gallery masonry grid.
                  </p>
                </div>
                <label className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm shadow-primary/15 self-end sm:self-auto">
                  {uploadingHeroMultiple ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  <span>Upload Image(s)</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    className="hidden" 
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      setUploadingHeroMultiple(true);
                      try {
                        const urls: string[] = [];
                        for (let i = 0; i < files.length; i++) {
                          const url = await uploadImage(files[i]);
                          urls.push(url);
                        }
                        setSettings(s => {
                          if (!s) return null;
                          const currentImages = s.heroImages || (s.heroImage ? [s.heroImage] : []);
                          const updatedImages = [...currentImages, ...urls];
                          return {
                            ...s,
                            heroImages: updatedImages,
                            heroImage: updatedImages[0] || ''
                          };
                        });
                      } catch (err) {
                        console.error(err);
                        alert("Failed to upload slideshow images");
                      } finally {
                        setUploadingHeroMultiple(false);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Add URL Row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full bg-white border border-gray-150 rounded-[12px] pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Paste external image URL (e.g. https://example.com/banner.jpg)"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newImageUrl.trim()) return;
                    setSettings(s => {
                      if (!s) return null;
                      const currentImages = s.heroImages || (s.heroImage ? [s.heroImage] : []);
                      const updatedImages = [...currentImages, newImageUrl.trim()];
                      return {
                        ...s,
                        heroImages: updatedImages,
                        heroImage: updatedImages[0] || ''
                      };
                    });
                    setNewImageUrl('');
                  }}
                  className="px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-[12px] text-xs font-bold transition-all flex items-center gap-1 flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add URL</span>
                </button>
              </div>

              {/* Grid of images */}
              {settings?.heroImages && settings.heroImages.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 mt-4">
                  {settings.heroImages.map((img, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-3 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow w-full">
                      {/* Thumbnail */}
                      <div className="h-16 w-24 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center self-center sm:self-auto">
                        <img src={img} alt={`Slide ${idx + 1}`} className="h-full w-full object-cover" />
                      </div>
                      
                      {/* URL text input */}
                      <div className="flex-1 min-w-0 w-full">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Slide {idx + 1} Image URL</span>
                        <input
                          type="text"
                          value={img}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings(s => {
                              if (!s) return null;
                              const updated = [...(s.heroImages || [])];
                              updated[idx] = val;
                              return {
                                ...s,
                                heroImages: updated,
                                heroImage: updated[0] || ''
                              };
                            });
                          }}
                          className="w-full bg-gray-50 border-none rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary truncate"
                        />
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto mt-2 sm:mt-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            if (idx === 0) return;
                            setSettings(s => {
                              if (!s) return null;
                              const updated = [...(s.heroImages || [])];
                              const temp = updated[idx];
                              updated[idx] = updated[idx - 1];
                              updated[idx - 1] = temp;
                              return {
                                ...s,
                                heroImages: updated,
                                heroImage: updated[0] || ''
                              };
                            });
                          }}
                          className="p-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-30 text-gray-600 rounded-lg transition-colors"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === (settings.heroImages?.length || 0) - 1}
                          onClick={() => {
                            if (idx === (settings.heroImages?.length || 0) - 1) return;
                            setSettings(s => {
                              if (!s) return null;
                              const updated = [...(s.heroImages || [])];
                              const temp = updated[idx];
                              updated[idx] = updated[idx + 1];
                              updated[idx + 1] = temp;
                              return {
                                ...s,
                                heroImages: updated,
                                heroImage: updated[0] || ''
                              };
                            });
                          }}
                          className="p-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-30 text-gray-600 rounded-lg transition-colors"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSettings(s => {
                              if (!s) return null;
                              const updated = (s.heroImages || []).filter((_, i) => i !== idx);
                              return {
                                ...s,
                                heroImages: updated,
                                heroImage: updated[0] || ''
                              };
                            });
                          }}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors ml-2"
                          title="Remove Image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                settings?.heroImage ? (
                  <div className="flex items-center gap-4 bg-white p-3 border border-gray-100 rounded-xl">
                    <div className="h-16 w-24 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img src={settings.heroImage} alt="Single Hero" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Primary Hero Image (Migrate to slideshow)</span>
                      <p className="text-xs text-gray-600 truncate">{settings.heroImage}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSettings(s => {
                          if (!s) return null;
                          return {
                            ...s,
                            heroImages: [s.heroImage || ''],
                          };
                        });
                      }}
                      className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Convert to Slideshow
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-[15px] py-8 text-center text-gray-400">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs font-bold uppercase tracking-wider">No Custom Slideshow Images</p>
                    <p className="text-[10px] text-gray-400 mt-1 px-4">Upload or paste image URLs to replace the default home page slideshow slides.</p>
                  </div>
                )
              )}
            </div>
          )}
            {(activeTab === 'all' || activeTab === 'company-info') && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Office Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.officeAddress}
                    onChange={(e) => setSettings(s => s ? {...s, officeAddress: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="Jl. Raya Ubud, Bali..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

        {/* Contact Info */}
        {(activeTab === 'all' || activeTab === 'company-info') && (
          <div className="space-y-6 bg-white p-6 rounded-[24px] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Support & Integration
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Support Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="email" 
                    value={settings?.supportEmail}
                    onChange={(e) => setSettings(s => s ? {...s, supportEmail: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Support Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.supportPhone}
                    onChange={(e) => setSettings(s => s ? {...s, supportPhone: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">WhatsApp Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.whatsappNumber}
                    onChange={(e) => setSettings(s => s ? {...s, whatsappNumber: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="+62..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visuals */}
        {(activeTab === 'all' || activeTab === 'website') && (
          <div className="space-y-6 bg-white p-6 rounded-[24px] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Visual Identity & Design Presets
            </h3>

            {/* Visual Branding & Layout Presets Selector */}
            <div className="space-y-3 pb-6 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                  Layout & Design Preset
                </label>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Tenant Customization Engine
                </span>
              </div>
              <p className="text-xs text-gray-400 pl-1 mb-2">
                Instantly launch a world-class digital brand layout with curated fonts, spacings, and styles, or select Custom to define your own style guidelines.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                  {
                    id: 'default',
                    name: 'Custom / Classic',
                    desc: 'Your custom primary/secondary colors and custom Google Fonts selections.',
                    badge: 'Fully Custom',
                    colorClass: 'from-[#FF7A00] to-[#1F3B1F]',
                    fontLabel: 'Plus Jakarta Sans'
                  },
                  {
                    id: 'swiss-minimalist',
                    name: 'Sleek Monochrome',
                    desc: 'Pure crisp white canvas, obsidian accents, floating cards, and pill buttons.',
                    badge: 'Airbnb Modern',
                    colorClass: 'from-[#0f172a] to-[#ffffff]',
                    fontLabel: 'Inter + Inter'
                  },
                  {
                    id: 'tech-dark',
                    name: 'Midnight Slate',
                    desc: 'Deep slate charcoal dark mode with clean borders, emerald accents, and high legibility.',
                    badge: 'Sleek Dark Mode',
                    colorClass: 'from-[#10b981] to-[#0f172a]',
                    fontLabel: 'Jakarta + Inter'
                  },
                  {
                    id: 'elegant-editorial',
                    name: 'Boutique Luxe',
                    desc: 'Warm off-white background, terracotta accents, subtle card borders, and editorial serifs.',
                    badge: 'Luxury Editorial',
                    colorClass: 'from-[#c2410c] to-[#faf9f5]',
                    fontLabel: 'Playfair + Jakarta'
                  },
                  {
                    id: 'nordic-forest',
                    name: 'Nordic Sanctuary',
                    desc: 'Deep forest sage green, crisp slate background, and smooth 16px card silhouettes.',
                    badge: 'Clean Eco',
                    colorClass: 'from-[#065f46] to-[#f8fafc]',
                    fontLabel: 'Outfit + Jakarta'
                  },
                  {
                    id: 'retro-adventure',
                    name: 'Urban Wanderlust',
                    desc: 'Warm golden amber, oat neutral background, minimalist line borders, and pill controls.',
                    badge: 'Modern Oat',
                    colorClass: 'from-[#d97706] to-[#fafaf9]',
                    fontLabel: 'Jakarta + Jakarta'
                  },
                  {
                    id: 'tokyo-neon',
                    name: 'Tokyo Minimal Dark',
                    desc: 'Sleek obsidian dark canvas with rose accent lines, clean dark cards, and modern layout.',
                    badge: 'Shinjuku Minimal',
                    colorClass: 'from-[#f43f5e] to-[#09090b]',
                    fontLabel: 'Jakarta + Inter'
                  },
                  {
                    id: 'mediterranean-breeze',
                    name: 'Mediterranean Azure',
                    desc: 'Marine azure blue, ice sea foam background, floating white cards, and pill buttons.',
                    badge: 'Coastal Minimal',
                    colorClass: 'from-[#0284c7] to-[#f0f9ff]',
                    fontLabel: 'Outfit + Jakarta'
                  },
                  {
                    id: 'brutalist-mono',
                    name: 'Monochrome Studio',
                    desc: 'Architectural precision with stark black and white geometry, clean lines, and minimal elevation.',
                    badge: 'Studio Linear',
                    colorClass: 'from-[#000000] to-[#ffffff]',
                    fontLabel: 'Jakarta + Inter'
                  },
                  {
                    id: 'royal-safari',
                    name: 'Regal Wilderness',
                    desc: 'Warm bronze gold details over a sleek dark charcoal canvas with refined serif headings.',
                    badge: 'Regal Dark',
                    colorClass: 'from-[#d97706] to-[#0b0f19]',
                    fontLabel: 'Cormorant + Jakarta'
                  },
                  {
                    id: 'zen-oasis',
                    name: 'Zen Botanical',
                    desc: 'Serene soft emerald, light botanical green borders, spacious canvas, and pill buttons.',
                    badge: 'Botanical Peace',
                    colorClass: 'from-[#059669] to-[#fafcfa]',
                    fontLabel: 'Outfit + Inter'
                  },
                  {
                    id: 'alpine-chalet',
                    name: 'Alpine Resort',
                    desc: 'Copper chestnut accents, warm stone canvas, sleek card borders, and modern rounded controls.',
                    badge: 'Warm Stone',
                    colorClass: 'from-[#9a3412] to-[#faf8f5]',
                    fontLabel: 'Outfit + Jakarta'
                  },
                  {
                    id: 'sunset-ibiza',
                    name: 'Ibiza Riviera Coral',
                    desc: 'Airbnb Coral `#FF385C`, warm off-white canvas, soft pill buttons, and subtle rounded cards.',
                    badge: 'Airbnb Coral',
                    colorClass: 'from-[#ff385c] to-[#fffdfb]',
                    fontLabel: 'Jakarta + Jakarta'
                  }
                ].map((preset) => {
                  const isSelected = (settings?.brandingPreset || 'default') === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSettings(s => s ? { ...s, brandingPreset: preset.id as any } : null)}
                      className={cn(
                        "flex flex-col text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden group min-h-[190px]",
                        isSelected 
                          ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-md" 
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                      )}
                    >
                      {/* Gradient Accent Pill */}
                      <div className="flex items-center justify-between w-full mb-3 gap-2">
                        <span className={cn(
                          "text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md truncate max-w-[110px]",
                          isSelected ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                        )}>
                          {preset.badge}
                        </span>
                        
                        {/* Circle Theme Color Preview */}
                        <div className={cn(
                          "h-4 w-4 rounded-full bg-gradient-to-br shadow-inner shrink-0",
                          preset.colorClass
                        )} />
                      </div>

                      <h4 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {preset.name}
                      </h4>
                      <p className="text-xs text-gray-500 leading-snug flex-1 mb-3 line-clamp-3">
                        {preset.desc}
                      </p>

                      <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-2 w-full flex items-center justify-between gap-1 mt-auto shrink-0">
                        <span className="shrink-0 font-medium">Typography:</span>
                        <span className="font-bold text-gray-700 truncate">{preset.fontLabel}</span>
                      </div>

                      {/* Selected Indicator Checkmark */}
                      {isSelected && (
                        <div className="absolute right-2 top-2 bg-emerald-600 text-white p-0.5 rounded-full z-10 shadow-sm">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual Style Overrides (Collapsible or labeled appropriately if not using preset) */}
            <div className={cn(
              "space-y-6 transition-all duration-300",
              (settings?.brandingPreset || 'default') !== 'default' && "opacity-40 pointer-events-none filter grayscale"
            )}>
              <div className="flex items-center justify-between pl-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Manual Custom Style Overrides
                </span>
                {(settings?.brandingPreset || 'default') !== 'default' && (
                  <span className="text-[10px] font-semibold text-gray-400 italic">
                    (Disabled while a design preset is active)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={settings?.primaryColor}
                    onChange={(e) => setSettings(s => s ? {...s, primaryColor: e.target.value} : null)}
                    className="h-10 w-10 p-0 border-none bg-transparent cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={settings?.primaryColor}
                    onChange={(e) => setSettings(s => s ? {...s, primaryColor: e.target.value} : null)}
                    className="flex-1 bg-gray-50 border-none rounded-[12px] px-4 py-2.5 text-xs font-mono uppercase focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={settings?.secondaryColor}
                    onChange={(e) => setSettings(s => s ? {...s, secondaryColor: e.target.value} : null)}
                    className="h-10 w-10 p-0 border-none bg-transparent cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={settings?.secondaryColor}
                    onChange={(e) => setSettings(s => s ? {...s, secondaryColor: e.target.value} : null)}
                    className="flex-1 bg-gray-50 border-none rounded-[12px] px-4 py-2.5 text-xs font-mono uppercase focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Heading Font (Google Font)</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.headingFont}
                    onChange={(e) => setSettings(s => s ? {...s, headingFont: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="Space Grotesk"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Body Font (Google Font)</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.bodyFont}
                    onChange={(e) => setSettings(s => s ? {...s, bodyFont: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="Inter"
                  />
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Hero Section */}
        {(activeTab === 'all' || activeTab === 'website') && (
          <div className="space-y-6 bg-white p-6 rounded-[24px] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Hero Content
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Hero Title</label>
                <input 
                  type="text" 
                  value={settings?.heroTitle || ''}
                  onChange={(e) => setSettings(s => s ? {...s, heroTitle: e.target.value} : null)}
                  className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Discover Balinese Wonders"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Hero Subtitle / Badge</label>
                <input 
                  type="text" 
                  value={settings?.heroSubtitle || ''}
                  onChange={(e) => setSettings(s => s ? {...s, heroSubtitle: e.target.value} : null)}
                  className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                  placeholder="e.g. WELCOME TO TRIPBONE"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Hero Description</label>
                <textarea 
                  value={settings?.heroDescription || ''}
                  onChange={(e) => setSettings(s => s ? {...s, heroDescription: e.target.value} : null)}
                  className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary min-h-[80px]"
                  placeholder="e.g. Curated expeditions and private custom adventures..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Hero YouTube URL</label>
                <div className="relative">
                  <Video className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.heroYoutubeUrl || ''}
                    onChange={(e) => setSettings(s => s ? {...s, heroYoutubeUrl: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium pl-1 italic">
                  If provided, this video will replace the static hero image on the home page.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SEO & Social */}
        {(activeTab === 'all' || activeTab === 'seo') && (
          <div className="space-y-6 bg-white p-6 rounded-[24px] border border-gray-100 col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              SEO & Generative Engine Optimization (GEO)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Default Meta Title</label>
                  <input 
                    type="text" 
                    value={settings?.metaTitle || ''}
                    onChange={(e) => setSettings(s => s ? {...s, metaTitle: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Best Adventure Tours in Bali"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Home Title Format</label>
                  <input 
                    type="text" 
                    value={settings?.homeTitleFormat || '{{siteName}} - Adventure Tours in Bali'}
                    onChange={(e) => setSettings(s => s ? {...s, homeTitleFormat: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary font-mono"
                    placeholder="{{siteName}} - Your Slogan"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Page Title Format</label>
                  <input 
                    type="text" 
                    value={settings?.pageTitleFormat || '{{title}} | {{siteName}}'}
                    onChange={(e) => setSettings(s => s ? {...s, pageTitleFormat: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary font-mono"
                    placeholder="{{title}} | {{siteName}}"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Tour Title Format</label>
                  <input 
                    type="text" 
                    value={settings?.tourTitleFormat || '{{title}} | {{siteName}}'}
                    onChange={(e) => setSettings(s => s ? {...s, tourTitleFormat: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary font-mono"
                    placeholder="{{title}} | {{siteName}}"
                  />
                  <p className="text-[10px] text-gray-400 font-medium pl-1 italic">Use {"{{title}}"} and {"{{siteName}}"} placeholders.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Blog Title Format</label>
                  <input 
                    type="text" 
                    value={settings?.blogTitleFormat || '{{title}} - {{siteName}}'}
                    onChange={(e) => setSettings(s => s ? {...s, blogTitleFormat: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary font-mono"
                    placeholder="{{title}} - {{siteName}}"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Global Meta Description</label>
                  <textarea 
                    rows={4}
                    value={settings?.siteDescription}
                    onChange={(e) => setSettings(s => s ? {...s, siteDescription: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="Describe your travel agency for search engines and AI crawlers..."
                  />
                  <p className="text-[10px] text-gray-400 font-medium pl-1">Optimal length: 110-160 characters for standard SEO.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Keywords</label>
                  <input 
                    type="text" 
                    value={settings?.siteKeywords}
                    onChange={(e) => setSettings(s => s ? {...s, siteKeywords: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="adventure, bali, tour, trekking..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Default Social Sharing (OG) Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={settings?.ogImage || ''}
                      onChange={(e) => setSettings(s => s ? {...s, ogImage: e.target.value} : null)}
                      className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com/social-preview.jpg"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium pl-1 italic">This image appears when your site is shared on WhatsApp, Facebook, or Twitter.</p>
                </div>
                
                <div className="pt-4 px-4 py-3 bg-orange-50/50 rounded-[16px] border border-orange-100/50">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Bot className="h-5 w-5 text-primary" />
                        <div>
                          <span className="block text-sm font-bold text-gray-900">AI Crawler Visibility</span>
                          <span className="block text-[10px] text-gray-500">Allow GPTBot, ChatGPT, and other AI models to index your site for GEO.</span>
                        </div>
                     </div>
                     <button 
                      type="button"
                      onClick={() => setSettings(s => s ? {...s, allowAICrawlers: !s.allowAICrawlers} : null)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        settings?.allowAICrawlers ? "bg-primary" : "bg-gray-200"
                      )}
                     >
                       <span className={cn(
                         "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                         settings?.allowAICrawlers ? "translate-x-6" : "translate-x-1"
                       )} />
                     </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Analytics, Tag Manager & Google Ads Conversion Tracking Box */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="p-6 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/40 rounded-[20px] border border-orange-100 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-orange-500 text-white rounded-xl shadow-xs">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900">Google Tag Manager, GA4 & Google Ads Tracking</h4>
                      <p className="text-xs text-gray-500 font-medium">Automatic pageviews, e-commerce transactions & Google Ads conversion tracking</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-100 rounded-full self-start sm:self-auto">
                    Multi-Tag Tracking Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-700 block mb-1">
                      Google Tag Manager ID
                    </label>
                    <input 
                      type="text" 
                      value={settings?.gtmId || ''}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().trim();
                        setSettings(s => s ? {...s, gtmId: val} : null);
                      }}
                      placeholder="e.g. GTM-XXXXXXX"
                      className="w-full bg-white border border-gray-200 rounded-[12px] px-3.5 py-2.5 text-xs font-mono font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Google Tag Manager container ID (starts with GTM-)</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-700 block mb-1">
                      Google Ads ID (Conversion ID)
                    </label>
                    <input 
                      type="text" 
                      value={settings?.googleAdsId || ''}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().trim();
                        setSettings(s => s ? {...s, googleAdsId: val} : null);
                      }}
                      placeholder="e.g. AW-123456789"
                      className="w-full bg-white border border-gray-200 rounded-[12px] px-3.5 py-2.5 text-xs font-mono font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Google Ads account tracking ID (starts with AW-)</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-700 block mb-1">
                      Google Ads Conversion Label
                    </label>
                    <input 
                      type="text" 
                      value={settings?.googleAdsConversionLabel || ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setSettings(s => s ? {...s, googleAdsConversionLabel: val} : null);
                      }}
                      placeholder="e.g. AbCdEfGhIjKlMnOp"
                      className="w-full bg-white border border-gray-200 rounded-[12px] px-3.5 py-2.5 text-xs font-mono font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Optional purchase/lead conversion label from Google Ads</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-700 block mb-1">
                      GA4 Measurement ID
                    </label>
                    <input 
                      type="text" 
                      value={settings?.gaMeasurementId || ''}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().trim();
                        setSettings(s => s ? {...s, gaMeasurementId: val} : null);
                      }}
                      placeholder="e.g. G-XXXXXXXXXX"
                      className="w-full bg-white border border-gray-200 rounded-[12px] px-3.5 py-2.5 text-xs font-mono font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Found in GA4 &gt; Data Streams (starts with G-)</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-700 block mb-1">
                      Custom Head Scripts (&lt;head&gt;)
                    </label>
                    <textarea 
                      rows={2}
                      value={settings?.gaCustomScript || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettings(s => s ? {...s, gaCustomScript: val} : null);
                      }}
                      placeholder={`<!-- Custom head scripts (Meta Pixel, etc.) -->`}
                      className="w-full bg-white border border-gray-200 rounded-[12px] px-3.5 py-2 text-[10px] font-mono text-gray-800 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-700 block mb-1">
                      Custom Body Noscript (&lt;body&gt;)
                    </label>
                    <textarea 
                      rows={2}
                      value={settings?.gtmBodyScript || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettings(s => s ? {...s, gtmBodyScript: val} : null);
                      }}
                      placeholder={`<!-- Custom body noscript iframe -->`}
                      className="w-full bg-white border border-gray-200 rounded-[12px] px-3.5 py-2 text-[10px] font-mono text-gray-800 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social Media Links */}
        {(activeTab === 'all' || activeTab === 'company-info') && (
          <div className="space-y-6 bg-white p-6 rounded-[24px] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Social Media Links
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Instagram URL</label>
                <div className="relative">
                  <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.instagramUrl || ''}
                    onChange={(e) => setSettings(s => s ? {...s, instagramUrl: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Facebook URL</label>
                <div className="relative">
                  <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.facebookUrl || ''}
                    onChange={(e) => setSettings(s => s ? {...s, facebookUrl: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Twitter URL</label>
                <div className="relative">
                  <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.twitterUrl || ''}
                    onChange={(e) => setSettings(s => s ? {...s, twitterUrl: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="https://twitter.com/..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">TikTok URL</label>
                <div className="relative">
                  <Music2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.tiktokUrl || ''}
                    onChange={(e) => setSettings(s => s ? {...s, tiktokUrl: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="https://tiktok.com/@..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Theme Customization Section */}
      {(activeTab === 'all' || activeTab === 'builder') && (
        <div id="theme-customization" className="space-y-8 bg-orange-900 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Palette className="h-64 w-64" />
          </div>
          
          <div className="relative space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <Sparkles className="h-8 w-8 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Theme & Design System</h3>
                  <p className="text-orange-100/60 font-medium">Choose between default design or combine multiple custom styles.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
                <span className={cn(
                  "text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer",
                  settings?.themeMode !== 'custom' ? "bg-orange-500 text-white shadow-lg" : "text-white/40 hover:text-white"
                )} onClick={() => setSettings(s => s ? {...s, themeMode: 'default'} : null)}>
                  DEFAULT
                </span>
                <span className={cn(
                  "text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer",
                  settings?.themeMode === 'custom' ? "bg-orange-500 text-white shadow-lg" : "text-white/40 hover:text-white"
                )} onClick={() => setSettings(s => s ? {...s, themeMode: 'custom'} : null)}>
                  CUSTOM
                </span>
              </div>
            </div>

            {settings?.themeMode === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {SECTIONS.map(section => (
                  <div key={section.id} className="space-y-3 bg-white/5 p-5 rounded-[24px] border border-white/10 hover:border-orange-400/30 transition-all">
                    <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest block pl-1">
                      {section.name}
                    </label>
                    <select
                      value={settings?.sectionStyles?.[section.id as keyof typeof settings.sectionStyles] || ''}
                      onChange={(e) => {
                        const newStyles = { ...(settings?.sectionStyles || {}) };
                        (newStyles as any)[section.id] = e.target.value;
                        setSettings(s => s ? {...s, sectionStyles: newStyles} : null);
                      }}
                      className="w-full bg-orange-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none"
                    >
                      <option value="" className="bg-orange-900 text-white/50">Current Default Style</option>
                      {(section.id === 'topNav' ? TOP_NAV_OPTIONS : section.id === 'mainNav' ? MAIN_NAV_OPTIONS : THEME_OPTIONS).map(opt => (
                        <option key={opt.id} value={opt.id} className="bg-orange-900 text-white">
                          [{opt.category}] {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {settings?.themeMode === 'default' && (
              <div className="p-10 bg-white/5 border-2 border-dashed border-white/10 rounded-[32px] text-center">
                <p className="text-orange-100/40 font-bold">The site is currently using the standard design layout.</p>
                <button 
                  type="button"
                  onClick={() => setSettings(s => s ? {...s, themeMode: 'custom'} : null)}
                  className="mt-4 text-orange-400 font-black text-xs uppercase tracking-widest hover:text-white transition-colors"
                >
                  Switch to Custom Builder →
                </button>
              </div>
            )}
          </div>
        </div>
      )}


    </form>
  );
}
