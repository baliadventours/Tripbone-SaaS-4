import { 
  format, addDays, parseISO, isSameDay, addMonths, subMonths, 
  isSameMonth, isToday, startOfMonth, endOfMonth, startOfWeek, 
  endOfWeek, eachDayOfInterval, isBefore 
} from "date-fns";
import { generateTourData } from "../services/geminiService";
import BulkAvailabilityModal from "../components/Admin/BulkAvailabilityModal";
import BookingManagementPanel from "../components/Admin/BookingManager";
import TourListing from "../components/Admin/TourListing";
import AnalyticsManager from "../components/Admin/AnalyticsManager";
import ImportBooking from "../components/Admin/ImportBooking";
import ChannelManager from "../components/Admin/ChannelManager";
import TicketManager from "../components/Admin/TicketManager";
import DisasterRecoveryBackup from "../components/Admin/DisasterRecoveryBackup";
import BookingReports from "../components/Admin/BookingReports";
import PayoutManager from "../components/Admin/PayoutManager";
import ProposalGenerator from "../components/Admin/ProposalGenerator";
import UserManager from "../components/Admin/UserManager";
import PaymentManager from "../components/Admin/PaymentManager";
import WebsiteBuilder from "../components/Admin/WebsiteBuilder";
import GeneralSettings from "../components/Admin/GeneralSettings";
import PopupManager from "../components/Admin/PopupManager";
import CarRentalBookingManager from "../components/Admin/CarRental/CarRentalBookingManager";
import FleetManager from "../components/Admin/CarRental/FleetManager";
import RentalAutomations from "../components/Admin/CarRental/RentalAutomations";
import RentalModuleSettings from "../components/Admin/CarRental/RentalModuleSettings";
import BookingDetailModal from "../components/Admin/BookingDetailModal";
import CreateManualBookingModal from "../components/Admin/CreateManualBookingModal";
import { ReviewManager } from "../components/Admin/BookingTimeManager";
import { BlogManager } from "../components/Admin/PartnerListing";

type MenuId = string;
type Tab = string;
interface AdminProps {
  overrideMenu?: string;
  overrideTab?: string;
  isCentralPortal?: boolean;
}

// Tripbone SaaS Admin Dashboard - Production Clean Build v2.1
import { useState, useEffect, FormEvent, ChangeEvent, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, storage, handleFirestoreError, OperationType, getActiveTenantId } from '../lib/firebase';
import { checkQuota } from '../lib/quotaUtils';
import { signOut } from 'firebase/auth';
import { 
  collection, addDoc, updateDoc, deleteDoc, 
  doc, onSnapshot, serverTimestamp, query, orderBy,
  getDoc, setDoc, getDocs, collectionGroup, where 
} from '@/src/lib/firebase';
import { Tour, TourPackage, PricingTier, AddOn, TransportOption, Coupon, PageContent, ImportantInfoSection, UrgencyPoint, Booking, Review, UserProfile, Guide, BlogPost, CommunicationSettings, SiteSettings, BookingLog, TourLabel, Category, TourType, LocationMeta, Inquiry } from '../types';
import RichTextEditor from '../components/RichTextEditor';
import { sendBookingEmail } from '../lib/emailService';
import { sendWhatsAppNotification, getWhatsAppLink, generateBookingMessage, sendCustomWhatsApp } from '../lib/whatsappService';
import * as LucideIcons from 'lucide-react';
const Icons = LucideIcons;
import { 
  Plus, Edit2, Trash2, Save, X, Check,
  Layout, LayoutTemplate, Image as ImageIcon, DollarSign, Map as MapIcon, 
  Info, List, CheckCircle, ChevronRight, 
  PlusCircle, MinusCircle, MessageCircle, Database,
  Upload, Loader2, BarChart3, FileText, TrendingUp, 
  MessageSquare, Monitor, Users, CreditCard, Settings, Wallet,
  Calendar as CalendarIcon, LayoutGrid, Clock, Briefcase, Star,
  Layers, Users2, ChevronDown, PieChart, Tag, MapPin, Globe,
  ShieldAlert, BookOpen, ShieldCheck, Phone, CheckCheck, Copy,
  Sparkles, Wand2, Lightbulb, LogOut, LifeBuoy,
  Camera, Compass, Waves, Mountain, Sun, Tent,
  Bike, Bus, Car, Plane, Sailboat, Palmtree, Navigation, Activity,
  User, CheckCircle2, AlertCircle, FileCode, Terminal, ChevronLeft,
  Share2, Printer, XCircle, ExternalLink, UserCheck, ArrowRight,
  ArrowLeft, Clock4, Ban, Bot,
  Zap, Send, Mail, Search, Hotel, Bed, Home, Building
} from 'lucide-react';

import { cn, formatPrice } from '../lib/utils';
import { uploadImage } from '../lib/imgbb';
import SimpleAnalyticsDashboard from '../components/Admin/SimpleAnalyticsDashboard';
import LandingPageGenerator from '../components/Admin/LandingPageGenerator';
import { useTenant } from '../lib/TenantContext';
import { useSettings } from '../lib/SettingsContext';
import InvoiceManager from '../components/Admin/Invoice/InvoiceManager';
import WaiverManager from '../components/Admin/Waiver/WaiverManager';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: string[];
}


import { OSMLocationSelector, MetaManager } from "../components/Admin/MetaManager";
import { CouponManager } from "../components/Admin/CouponManager";
import { PageManager } from "../components/Admin/PageManager";
import { BookingTimeManager } from "../components/Admin/BookingTimeManager";
import { UrgencyPointManager, AddOnManager, TransportOptionManager } from "../components/Admin/AddOnManagers";
import { BackupManager } from "../components/Admin/BackupManager";
import { CommunicationManager } from "../components/Admin/CommunicationManager";
import { PartnerListing } from "../components/Admin/PartnerListing";

import { AdminDashboardOverview } from "../components/Admin/AdminDashboardOverview";
import { TourEditorForm } from "../components/Admin/TourEditorForm";


import { CustomDomainSettings } from "../components/Admin/CustomDomainSettings";
import { DeveloperHub } from "../components/Admin/DeveloperHub";
import { BillingView } from "../components/Admin/BillingView";
import { AccessRolesManager } from "../components/Admin/AccessRolesManager";
import { PartnerDetailView } from "../components/Admin/PartnerDetailView";
import { AssignGuideModal } from "../components/Admin/Modals/AssignGuideModal";
import { AdminAiModal } from "../components/Admin/Modals/AdminAiModal";
import { CopyTourModal } from "../components/Admin/Modals/CopyTourModal";
import { MediaGalleryModal } from "../components/Admin/Modals/MediaGalleryModal";



export default function Admin({ overrideMenu, overrideTab, isCentralPortal = false }: AdminProps = {}) {
  const navigate = useNavigate();
  const { tenant, isImpersonating, loading: tenantLoading, stopImpersonation } = useTenant();
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [autoOpenBlogModal, setAutoOpenBlogModal] = useState(false);

  // Client-side image WebP conversion tracker UI notifications
  const [optToast, setOptToast] = useState<{
    originalName: string;
    originalSizeKb: number;
    optimizedSizeKb: number;
    percentSaved: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const handleOptimized = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setOptToast(customEvent.detail);
        // Auto-dismiss after 7 seconds
        setTimeout(() => {
          setOptToast(prev => {
            if (prev?.originalName === customEvent.detail.originalName) {
              return null;
            }
            return prev;
          });
        }, 7000);
      }
    };

    window.addEventListener('image-optimized', handleOptimized);
    return () => {
      window.removeEventListener('image-optimized', handleOptimized);
    };
  }, []);
  const handleLogout = async () => {
    try {
      if (isImpersonating) {
        stopImpersonation();
        return;
      }
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.role === 'admin') {
      alert("For security reasons, admin accounts cannot be deleted directly from the dashboard.");
      return;
    }

    const confirmation = window.confirm(
      `Are you sure you want to delete ${user.displayName || user.email}?\n\n` +
      `This will permanently remove their profile, settings, and partner associations. This action cannot be undone.`
    );

    if (!confirmation) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid));
      alert("User profile deleted successfully.");
    } catch (error) {
      console.error("Error deleting user", error);
      alert("Failed to delete user profile. They may have active associations.");
    }
  };

  const [tours, setTours] = useState<Tour[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tourTypes, setTourTypes] = useState<TourType[]>([]);
  const [locations, setLocations] = useState<LocationMeta[]>([]);
  const [labels, setLabels] = useState<TourLabel[]>([]);
  const [globalAddOns, setGlobalAddOns] = useState<AddOn[]>([]);
  const [globalTransports, setGlobalTransports] = useState<TransportOption[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Reusable Platform-wide Media Gallery Picker state
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [gallerySelected, setGallerySelected] = useState<string[]>([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [galleryCallback, setGalleryCallback] = useState<((urls: string[]) => void) | null>(null);
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryFilterTab, setGalleryFilterTab] = useState('all');

  
  const handleOpenGallery = (target: "cover" | "gallery" | "itinerary", dayIndex?: number) => {
    if (target === "cover") {
      openMediaGallery((urls) => {
        if (urls[0]) setFormData((prev: any) => ({ ...prev, featuredImage: urls[0] }));
      });
    } else if (target === "gallery") {
      openMediaGallery((urls) => {
        setFormData((prev: any) => ({ ...prev, gallery: [...(prev.gallery || []), ...urls] }));
      }, true);
    } else if (target === "itinerary" && dayIndex !== undefined) {
      openMediaGallery((urls) => {
        if (urls[0]) {
          const newItinerary = [...(formData.itinerary || [])];
          if (newItinerary[dayIndex]) {
            newItinerary[dayIndex] = { ...newItinerary[dayIndex], image: urls[0] };
            setFormData((prev: any) => ({ ...prev, itinerary: newItinerary }));
          }
        }
      });
    }
  };

  const openMediaGallery = async (callback: (urls: string[]) => void, multiSelect = false) => {
    setGalleryCallback(() => callback);
    setIsMultiSelect(multiSelect);
    setGallerySelected([]);
    setGallerySearch('');
    setGalleryFilterTab('all');
    setIsGalleryOpen(true);
    setLoadingGallery(true);
    
    try {
      const urlsSet = new Set<string>();
      
      // 1. Scan in-memory Tours
      tours.forEach(t => {
        if (t.featuredImage) urlsSet.add(t.featuredImage);
        if (t.gallery) t.gallery.forEach(url => { if (url) urlsSet.add(url); });
        if (t.itinerary) {
          t.itinerary.forEach(day => {
            if (day.image) urlsSet.add(day.image);
            if (typeof day.pickup === 'object' && day.pickup?.image) {
              urlsSet.add(day.pickup.image);
            }
          });
        }
        if (t.seo?.ogImage) urlsSet.add(t.seo.ogImage);
      });

      // 2. Scan Tour Editor form state (current edit session)
      if (formData?.featuredImage) urlsSet.add(formData.featuredImage);
      if (formData?.gallery) formData.gallery.forEach(url => { if (url) urlsSet.add(url); });
      if (formData?.itinerary) {
        formData.itinerary.forEach(day => {
          if (day.image) urlsSet.add(day.image);
          if (typeof day.pickup === 'object' && day.pickup?.image) {
            urlsSet.add(day.pickup.image);
          }
        });
      }
      if (formData?.seo?.ogImage) urlsSet.add(formData.seo.ogImage);

      // 3. Scan posts from Firestore
      const postsSnap = await getDocs(collection(db, 'posts'));
      postsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.featuredImage) urlsSet.add(data.featuredImage);
        if (data.gallery) {
          (data.gallery as string[]).forEach(url => { if (url) urlsSet.add(url); });
        }
        if (data.seo?.ogImage) urlsSet.add(data.seo.ogImage);
      });

      const cleanUrls = Array.from(urlsSet).filter(url => 
        url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))
      );
      setGalleryUrls(cleanUrls);
    } catch (err) {
      console.error("Error building media gallery list:", err);
    } finally {
      setLoadingGallery(false);
    }
  };

  const filteredGalleryUrls = useMemo(() => {
    let result = galleryUrls;
    
    // 1. Tab filtering
    if (galleryFilterTab === 'unsplash') {
      result = result.filter(url => url.toLowerCase().includes('unsplash') || url.toLowerCase().includes('picsum'));
    } else if (galleryFilterTab === 'imgbb') {
      result = result.filter(url => url.toLowerCase().includes('ibb.co'));
    } else if (galleryFilterTab === 'other') {
      result = result.filter(url => !url.toLowerCase().includes('unsplash') && !url.toLowerCase().includes('picsum') && !url.toLowerCase().includes('ibb.co'));
    }

    // 2. Keyword Search filtering
    if (gallerySearch.trim()) {
      const q = gallerySearch.toLowerCase();
      result = result.filter(url => url.toLowerCase().includes(q));
    }

    return result;
  }, [galleryUrls, galleryFilterTab, gallerySearch]);

  const handleToggleSelectImage = (url: string) => {
    if (isMultiSelect) {
      if (gallerySelected.includes(url)) {
        setGallerySelected(prev => prev.filter(u => u !== url));
      } else {
        setGallerySelected(prev => [...prev, url]);
      }
    } else {
      setGallerySelected([url]);
    }
  };

  const handleConfirmPickImages = () => {
    if (galleryCallback && gallerySelected.length > 0) {
      galleryCallback(gallerySelected);
    }
    setIsGalleryOpen(false);
  };

  const CompanyProfile = ({ userData, isAdminEdit = false }: { userData: UserProfile, isAdminEdit?: boolean }) => {
    const [profile, setProfile] = useState<UserProfile>(userData);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      setProfile(userData);
    }, [userData]);

    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        await updateDoc(doc(db, 'users', profile.uid), {
          companyName: profile.companyName || '',
          publicEmail: profile.publicEmail || '',
          phoneNumber: profile.phoneNumber || '',
          website: profile.website || '',
          instagramUrl: profile.instagramUrl || '',
          facebookUrl: profile.facebookUrl || '',
          twitterUrl: profile.twitterUrl || '',
          tiktokUrl: profile.tiktokUrl || '',
          updatedAt: serverTimestamp()
        });
        alert("Success: Profile updated!");
        if (isAdminEdit && !profile.uid.includes(currentUserProfile?.uid || '')) {
           // If admin is editing a partner, we might want to refresh the selectedPartner
           setSelectedPartner({...profile});
        }
      } catch (err) {
        console.error(err);
        alert("Error: Failed to update profile.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Edit Profile Information</h2>
          <p className="text-gray-500 font-medium tracking-tight">Public brand details and direct contact channels.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-[10px] border border-gray-100 shadow-sm p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Display Name</label>
                <div className="px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold text-gray-500 border border-transparent">
                  {profile.displayName}
                </div>
                <p className="text-[10px] text-gray-400 px-1 mt-1">Primary name is managed by system</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                <div className="px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold text-gray-500 border border-transparent">
                  {profile.email}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Company / Brand Name</label>
                <input
                  type="text"
                  value={profile.companyName || ''}
                  onChange={e => setProfile({...profile, companyName: e.target.value})}
                  className="w-full bg-gray-50 border-gray-100 hover:border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:outline-none"
                  placeholder="Official Brand Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Public / Support Email</label>
                <input
                  type="email"
                  value={profile.publicEmail || ''}
                  onChange={e => setProfile({...profile, publicEmail: e.target.value})}
                  className="w-full bg-gray-50 border-gray-100 hover:border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:outline-none"
                  placeholder="contact@yourcompany.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">WhatsApp / Contact Phone</label>
                <input
                  type="text"
                  value={profile.phoneNumber || ''}
                  onChange={e => setProfile({...profile, phoneNumber: e.target.value})}
                  className="w-full bg-gray-50 border-gray-100 hover:border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:outline-none"
                  placeholder="+62 8..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Official Website</label>
                <input
                  type="url"
                  value={profile.website || ''}
                  onChange={e => setProfile({...profile, website: e.target.value})}
                  className="w-full bg-gray-50 border-gray-100 hover:border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:outline-none"
                  placeholder="https://www.yourwebsite.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Instagram</label>
                <input
                  type="text"
                  value={profile.instagramUrl || ''}
                  onChange={e => setProfile({...profile, instagramUrl: e.target.value})}
                  className="w-full bg-gray-50 border-gray-100 hover:border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:outline-none"
                  placeholder="@handle"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Facebook</label>
                <input
                  type="url"
                  value={profile.facebookUrl || ''}
                  onChange={e => setProfile({...profile, facebookUrl: e.target.value})}
                  className="w-full bg-gray-50 border-gray-100 hover:border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:outline-none"
                  placeholder="URL"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">TikTok</label>
                <input
                  type="text"
                  value={profile.tiktokUrl || ''}
                  onChange={e => setProfile({...profile, tiktokUrl: e.target.value})}
                  className="w-full bg-gray-50 border-gray-100 hover:border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:outline-none"
                  placeholder="@handle"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-12 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    );
  };
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Auto-complete bookings logic: Mark confirmed bookings as completed 1 day after the tour date
  useEffect(() => {
    if (!bookings.length || !currentUserProfile) return;

    // Only Admin can perform bulk auto-completes to avoid client-side update storms
    // But suppliers should also see their bookings auto-complete for their own view
    const now = new Date();
    
    // Find segments that are ready to be marked as completed
    const readyToComplete = bookings.filter(b => {
      if (b.status !== 'confirmed') return false;
      try {
        const tourDate = parseISO(b.date);
        const completionDate = addDays(tourDate, 1);
        return isBefore(completionDate, now);
      } catch (e) {
        return false;
      }
    });

    if (readyToComplete.length > 0) {
      readyToComplete.forEach(async (b) => {
        try {
          await updateDoc(doc(db, 'bookings', b.id), {
            status: 'completed',
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          // Ignore errors if they happen due to permission issues or concurrent updates
        }
      });
    }
  }, [bookings, currentUserProfile]);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [urgencyPoints, setUrgencyPoints] = useState<UrgencyPoint[]>([]);
  
  const [activeMenu, setActiveMenu] = useState<MenuId>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const menu = params.get('menu') as MenuId;
      if (menu) {
        return menu;
      }
    }
    return 'dashboard';
  });
  const [settingsActiveTab, setSettingsActiveTab] = useState<string>('all');
  const [websiteBuilderTab, setWebsiteBuilderTab] = useState<'siteSettings' | 'blocks' | 'tours' | 'menus' | 'pages' | 'designPresets'>('blocks');
  const [autoOpenCreateUser, setAutoOpenCreateUser] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const menu = params.get('menu');
      if (menu === 'tours' || menu === 'all-tours' || menu === 'categories' || menu === 'tour-types' || menu === 'locations' || menu === 'addons' || menu === 'transports' || menu === 'labels' || menu === 'urgency-points') {
        return 'tours-group';
      }
      if (menu === 'bookings' || menu === 'schedule' || menu === 'reports' || menu === 'import-bookings' || menu === 'add-manual-booking') {
        return 'booking-group';
      }
      if (menu === 'car-rental-bookings' || menu === 'car-fleet' || menu === 'car-rental-automations' || menu === 'car-rental-settings') {
        return 'car-rental-group';
      }
      if (menu === 'waivers' || menu === 'channel-manager' || menu === 'invoices' || menu === 'ai-hub' || menu === 'inquiries' || menu === 'guides') {
        return 'operations-group';
      }
      if (menu === 'analytics' || menu === 'analytics-overview' || menu === 'conversion-funnel' || menu === 'google-analytics') {
        return 'analytics-group';
      }
      if (menu === 'coupons' || menu === 'popups-manager') {
        return 'marketing-group';
      }
      if (menu === 'blog' || menu === 'blog-categories') {
        return 'blog-group';
      }
      if (menu === 'pages' || menu === 'landing-page-generator') {
        return 'pages-group';
      }
      if (menu === 'payouts') {
        return 'finance-group';
      }
      if (menu === 'website-builder' || menu?.startsWith('wb-')) {
        return 'website-builder-group';
      }
      if (menu === 'users' || menu === 'access-roles' || menu?.startsWith('users-')) {
        return 'users-group';
      }
      if (menu === 'settings' || menu === 'payments' || menu === 'general-settings' || menu === 'payment-settings' || menu === 'communication' || menu === 'backup' || menu === 'company-info' || menu === 'seo' || menu === 'domain') {
        return 'settings-group';
      }
    }
    return 'tours-group';
  });
  const [tourSupplierFilter, setTourSupplierFilter] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as Tab;
      if (tab) {
        return tab;
      }
    }
    return 'basic';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    if (overrideMenu) {
      setActiveMenu(overrideMenu as MenuId);
      // Expand parents
      const parentMap: Record<string, string> = {
        'bookings': 'booking-group',
        'add-manual-booking': 'booking-group',
        'import-bookings': 'booking-group',
        'schedule': 'booking-group',
        'reports': 'booking-group',
        'all-tours': 'tours-group',
        'tours': 'tours-group',
        'categories': 'tours-group',
        'locations': 'tours-group',
        'labels': 'tours-group',
        'addons': 'tours-group',
        'transports': 'tours-group',
        'urgency-points': 'tours-group',
        'car-rental-bookings': 'car-rental-group',
        'car-rental-automations': 'car-rental-group',
        'car-rental-settings': 'car-rental-group',
        'waivers': 'operations-group',
        'channel-manager': 'operations-group',
        'invoices': 'operations-group',
        'ai-hub': 'operations-group',
        'inquiries': 'operations-group',
        'guides': 'operations-group',
        'analytics-overview': 'analytics-group',
        'conversion-funnel': 'analytics-group',
        'google-analytics': 'analytics-group',
        'coupons': 'marketing-group',
        'popups-manager': 'marketing-group',
        'blog': 'blog-group',
        'blog-categories': 'blog-group',
        'pages': 'pages-group',
        'landing-page-generator': 'pages-group',
        'payouts': 'finance-group',
        'wb-site-settings': 'website-builder-group',
        'wb-blocks': 'website-builder-group',
        'wb-tours': 'website-builder-group',
        'wb-menus': 'website-builder-group',
        'wb-pages': 'website-builder-group',
        'wb-presets': 'website-builder-group',
        'website-builder': 'website-builder-group',
        'users': 'users-group',
        'access-roles': 'users-group',
        'users-admins': 'users-group',
        'users-suppliers': 'users-group',
        'users-agents': 'users-group',
        'users-customers': 'users-group',
        'payment-settings': 'settings-group',
        'company-info': 'settings-group',
        'communication': 'settings-group',
        'seo': 'settings-group',
        'domain': 'settings-group',
        'backup': 'settings-group'
      };
      const parent = parentMap[overrideMenu];
      if (parent) {
        setExpandedMenu(parent);
      }
    }
  }, [overrideMenu]);

  useEffect(() => {
    if (overrideTab) {
      setActiveTab(overrideTab as Tab);
    }
  }, [overrideTab]);

  // --- PROGRESSIVE WEB APP & NOTIFICATION STATES ---
  const [inAppNotifications, setInAppNotifications] = useState<{
    id: number;
    title: string;
    body: string;
    url: string;
    read: boolean;
    createdAt: Date;
  }[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(
    'Notification' in window ? Notification.permission === 'granted' : false
  );
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const isInitialBookingsLoaded = useRef(false);
  const isInitialInquiriesLoaded = useRef(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installment selection: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn("Notifications are not supported in this browser.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermissionGranted(permission === 'granted');
      if (permission === 'granted') {
        triggerPWSNotification(
          "Alerts Enabled!",
          "Excellent! You will now receive high-priority desktop & mobile notifications for booking inquiries."
        );
      }
    } catch (err) {
      console.error("Error setting notification permission:", err);
    }
  };

  const triggerPWSNotification = (title: string, body: string, url: string = '/admin') => {
    // 1. Play alert chime
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio chime autoplay postponed until click gesture:", err);
        });
      }
    } catch (err) {
      console.warn("Audio chime autoplay postponed until click gesture:", err);
    }

    // 2. Dispatch a system notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const brandIcon = siteSettings?.faviconURL || tenant?.favicon || tenant?.logo || '/api/uploads/q08dkhNCIxtWc4kuqnrv';
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: brandIcon,
            badge: brandIcon,
            vibrate: [200, 100, 200],
            data: { url }
          } as any);
        }).catch(() => {
          new Notification(title, { body });
        });
      } else {
        new Notification(title, { body });
      }
    }

    // 3. Keep in-app feed updated
    setInAppNotifications(prev => [
      { id: Date.now(), title, body, url, read: false, createdAt: new Date() },
      ...prev
    ]);
  };

  const [isUploading, setIsUploading] = useState(false);
  const [isAiBuilding, setIsAiBuilding] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedCopySourceTourId, setSelectedCopySourceTourId] = useState('');
  const [copyPackages, setCopyPackages] = useState(true);
  const [copyInclusions, setCopyInclusions] = useState(true);
  const [copyFaqs, setCopyFaqs] = useState(true);
  const [copyImportantInfo, setCopyImportantInfo] = useState(true);
  const [copyHighlights, setCopyHighlights] = useState(false);
  const [copyItinerary, setCopyItinerary] = useState(false);
  const [aiGenMode, setAiGenMode] = useState<'complete' | 'partial'>('complete');
  const [tenantInvoices, setTenantInvoices] = useState<any[]>([]);
  const [commSettings, setCommSettings] = useState<CommunicationSettings | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [tenantData, setTenantData] = useState<any>(null);
  const [selectedPartner, setSelectedPartner] = useState<UserProfile | null>(null);
  
  // Shared Booking State for Detail Modal
  const [globalSelectedBooking, setGlobalSelectedBooking] = useState<Booking | null>(null);
  const [originalBooking, setOriginalBooking] = useState<Booking | null>(null);
  const [isBookingDetailOpen, setIsBookingDetailOpen] = useState(false);
  const [isManualBookingModalOpen, setIsManualBookingModalOpen] = useState(false);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignBooking, setAssignBooking] = useState<Booking | null>(null);
  const [allGuides, setAllGuides] = useState<Guide[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingStates, setLoadingStates] = useState({
    updatingBooking: false,
    deletingBooking: false,
    addingNote: false,
    assigningGuide: false,
    statusUpdating: false,
    sendingWA: false,
  });

  const [formData, setFormData] = useState<Partial<Tour>>({
    title: '',
    slug: '',
    description: '',
    categoryId: '',
    tourTypeId: '',
    locationId: '',
    location: '',
    duration: '',
    regularPrice: 0,
    discountPrice: 0,
    gallery: [],
    featuredImage: '',
    highlights: [],
    inclusions: [],
    exclusions: [],
    itinerary: [],
    infoSections: [],
    languages: [],
    packages: [],
    addOnIds: [],
    transportIds: [],
    meetingPoint: '',
    labelIds: [],
    imageLabelId: '',
    belowTitleLabelId: '',
    priceLabelId: '',
    faqs: [],
    locationMapUrl: '',
    importantInfo: '',
    supplierId: '',
    supplierName: '',
    status: 'draft'
  });

  const [highlightsText, setHighlightsText] = useState('');
  const [inclusionsText, setInclusionsText] = useState('');
  const [exclusionsText, setExclusionsText] = useState('');
  const [languagesText, setLanguagesText] = useState('');
  
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiBuilding(true);
    try {
      const data = await generateTourData(aiPrompt, commSettings?.geminiApiKey);
      if (aiGenMode === 'complete') {
        setFormData(prev => ({
          ...prev,
          title: data.title,
          description: data.description,
          duration: data.duration,
          highlights: data.highlights,
          inclusions: data.inclusions,
          exclusions: data.exclusions,
          itinerary: data.itinerary.map(item => ({
            day: item.day,
            title: item.title,
            description: item.description
          })),
          importantInfo: data.importantInfo || ''
        }));
      } else {
        // partial update: only replace tour description, highlights, inclusions, exclusions
        setFormData(prev => ({
          ...prev,
          description: data.description,
          highlights: data.highlights,
          inclusions: data.inclusions,
          exclusions: data.exclusions,
          importantInfo: data.importantInfo || prev.importantInfo || ''
        }));
      }
      setHighlightsText(data.highlights.join('\n'));
      setInclusionsText(data.inclusions.join('\n'));
      setExclusionsText(data.exclusions.join('\n'));
      setShowAiModal(false);
      setAiPrompt('');
      alert("Success! Tour content generated by AI. Please review and save.");
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      alert(error.message || "Failed to generate tour content. Please try again.");
    } finally {
      setIsAiBuilding(false);
    }
  };

  const handleFastCopyContent = () => {
    if (!selectedCopySourceTourId) {
      alert("Please select a source tour first.");
      return;
    }
    const sourceTour = tours.find(t => t.id === selectedCopySourceTourId);
    if (!sourceTour) {
      alert("Selected source tour not found.");
      return;
    }

    setFormData(prev => {
      const updated = { ...prev };
      
      if (copyPackages && sourceTour.packages) {
        updated.packages = sourceTour.packages.map(pkg => ({
          ...pkg,
          name: pkg.name || ""
        }));
      }
      
      if (copyInclusions) {
        updated.inclusions = [...(sourceTour.inclusions || [])];
        updated.exclusions = [...(sourceTour.exclusions || [])];
        setInclusionsText((sourceTour.inclusions || []).join('\n'));
        setExclusionsText((sourceTour.exclusions || []).join('\n'));
      }
      
      if (copyFaqs) {
        updated.faqs = sourceTour.faqs ? sourceTour.faqs.map(faq => ({ ...faq })) : [];
      }
      
      if (copyImportantInfo) {
        updated.importantInfo = sourceTour.importantInfo || '';
      }
      
      if (copyHighlights && sourceTour.highlights) {
        updated.highlights = [...(sourceTour.highlights || [])];
        setHighlightsText((sourceTour.highlights || []).join('\n'));
      }
      
      if (copyItinerary && sourceTour.itinerary) {
        updated.itinerary = sourceTour.itinerary ? sourceTour.itinerary.map(item => ({ ...item })) : [];
      }
      
      return updated;
    });

    setShowCopyModal(false);
    alert(`Successfully copied selected elements from "${sourceTour.title}"! Remember to save or publish the tour.`);
  };

  const [expandedPackages, setExpandedPackages] = useState<number[]>([]);
  const [expandedItinerary, setExpandedItinerary] = useState<number[]>([]);

  useEffect(() => {
    if (!editingId && formData.title) {
        const generatedSlug = formData.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric except space and dash
            .replace(/\s+/g, '-') // Replace spaces with dashes
            .replace(/-+/g, '-') // Remove consecutive dashes
            .trim();
        setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, editingId]);

  useEffect(() => {
    if (tenantLoading) return;

    if (isImpersonating) {
      setCurrentUserProfile({
        uid: 'superadmin-impersonator',
        email: 'superadmin@tripbone.com',
        role: 'admin',
        displayName: `Super Admin (Impersonating ${tenant?.companyName || tenant?.slug || 'Tenant'})`,
        companyName: tenant?.companyName || tenant?.slug || 'Tenant',
        photoURL: '',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      setIsAuthorized(true);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsAuthorized(false);
        navigate('/login');
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        let snap = await getDoc(userRef);
        
        let userData = snap.data() as UserProfile | undefined;
        const userEmailLower = user.email ? user.email.trim().toLowerCase() : '';

        // Check if there is an existing staff/admin profile by email that needs to be linked/merged
        if ((!userData || userData.role === 'customer') && userEmailLower) {
          try {
            const emailQuery = query(collection(db, 'users'), where('email', '==', user.email));
            const emailSnaps = await getDocs(emailQuery);
            const staffDoc = emailSnaps.docs.find(d => d.id !== user.uid && ['admin', 'staff', 'supplier', 'agent', 'superadmin'].includes(d.data()?.role));
            if (staffDoc) {
              const staffData = staffDoc.data();
              const merged = {
                ...staffData,
                uid: user.uid,
                email: user.email,
                displayName: userData?.displayName || staffData.displayName || user.displayName || 'Staff Member',
                updatedAt: serverTimestamp()
              };
              await setDoc(userRef, merged, { merge: true });
              userData = merged as UserProfile;
              if (staffDoc.id.startsWith('usr_')) {
                try {
                  await deleteDoc(doc(db, 'users', staffDoc.id));
                } catch (delErr) {
                  console.warn("Could not remove placeholder staff doc:", delErr);
                }
              }
            }
          } catch (mergeErr) {
            console.warn("Error auto-merging staff profile in Admin.tsx:", mergeErr);
          }
        }

        let userRole = userData?.role;

        // Auto-upgrade master admin and tenant owner
        const adminEmailRaw = (import.meta.env.VITE_ADMIN_EMAIL || 'baliadventours@gmail.com').trim().toLowerCase();
        const isMasterAdmin = userEmailLower === adminEmailRaw || ['baliadventours@gmail.com', 'admin@tripbone.com', 'kuotabox@gmail.com'].includes(userEmailLower);
        const isTenantOwner = !!(tenant && tenant.adminEmail && userEmailLower === tenant.adminEmail.trim().toLowerCase());

        if ((isMasterAdmin || isTenantOwner) && userRole !== 'admin') {
          const profileData = {
            email: user.email,
            role: 'admin' as const,
            tenantId: tenant?.id || (userData as any)?.tenantId || null,
            updatedAt: serverTimestamp()
          };
          await setDoc(userRef, profileData, { merge: true });
          userRole = 'admin';
          userData = { uid: user.uid, ...(userData || {}), ...profileData } as UserProfile;
        } else if (userData) {
          userData.uid = user.uid;
        }

        if (userRole === 'admin' || userRole === 'staff' || userRole === 'supplier' || userRole === 'agent' || userRole === 'superadmin' || isMasterAdmin || isTenantOwner) {
          setCurrentUserProfile(userData || null);
          setIsAuthorized(true);
        } else {
          console.warn("Unauthorized access attempt to dashboard", user.email);
          setIsAuthorized(false);
          alert("Unauthorized access. Dashboard privileges required.");
          navigate('/');
        }
      } catch (err) {
        console.error("Error verifying admin status:", err);
        setIsAuthorized(false);
        navigate('/');
      }
    });
    return unsubscribe;
  }, [navigate, isImpersonating, tenantLoading, tenant]);

  useEffect(() => {
    if (isAuthorized !== true || !currentUserProfile) return;
    
    const isSupplier = currentUserProfile.role === 'supplier';
    const isAgent = currentUserProfile.role === 'agent';

    // Tours Query
    let toursQuery;
    if (isSupplier) {
      toursQuery = query(collection(db, 'tours'), where('supplierId', '==', currentUserProfile.uid), orderBy('createdAt', 'desc'));
    } else if (isAgent) {
      toursQuery = query(collection(db, 'tours'), where('status', 'in', ['published', 'active']), orderBy('createdAt', 'desc'));
    } else {
      toursQuery = query(collection(db, 'tours'), orderBy('createdAt', 'desc'));
    }
    
    let unsubToursFallback: (() => void) | null = null;
    let unsubBookingsFallback: (() => void) | null = null;
    let unsubGuidesFallback: (() => void) | null = null;

    const unsubscribe = onSnapshot(toursQuery, (snapshot) => {
      setTours(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tour)));
    }, (error) => {
      console.warn("Tours snapshot error:", error);
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.LIST, 'tours');
      }
      // Universal Fallback: query collection without order-by or complex filtering (zero indexes needed!)
      if (unsubToursFallback) unsubToursFallback();
      unsubToursFallback = onSnapshot(collection(db, 'tours'), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Tour));
        // Filter in memory for safety based on role if needed
        let filtered = list;
        if (isSupplier) {
          filtered = list.filter(t => t.supplierId === currentUserProfile.uid);
        } else if (isAgent) {
          filtered = list.filter(t => t.status === 'published' || t.status === 'active');
        }
        // Sort in memory (desc)
        filtered.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        setTours(filtered);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'tours-fallback'));
    });

    // Bookings Query
    let bookingsQuery;
    if (isSupplier) {
      bookingsQuery = query(collection(db, 'bookings'), where('supplierId', '==', currentUserProfile.uid), orderBy('date', 'asc'));
    } else if (isAgent) {
      bookingsQuery = query(collection(db, 'bookings'), where('userId', '==', currentUserProfile.uid), orderBy('date', 'asc'));
    } else {
      bookingsQuery = query(collection(db, 'bookings'), orderBy('date', 'asc'));
    }

    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
      setBookings(data);

      if (isInitialBookingsLoaded.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const booking = change.doc.data() as Booking;
            const tourTitle = booking.tourTitle || "Selected Tour Activity";
            const customerName = booking.customerData?.fullName || "A Customer";
            triggerPWSNotification(
              "New Booking Received!",
              `${customerName} just booked "${tourTitle}". Click to view details.`,
              '/admin'
            );
          }
        });
      } else {
        isInitialBookingsLoaded.current = true;
      }
    }, (error) => {
       console.warn("Bookings snapshot error:", error);
       if (error.code === 'permission-denied') {
         handleFirestoreError(error, OperationType.LIST, 'bookings');
       }
       // Universal Fallback: query collection without order-by or complex filtering (zero indexes needed!)
       if (unsubBookingsFallback) unsubBookingsFallback();
       unsubBookingsFallback = onSnapshot(collection(db, 'bookings'), (snap) => {
         const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
         let filtered = list;
         if (isSupplier) {
           filtered = list.filter(b => b.supplierId === currentUserProfile.uid);
         } else if (isAgent) {
           filtered = list.filter(b => b.userId === currentUserProfile.uid);
         }
         // Sort in memory (asc)
         filtered.sort((a, b) => {
           const tA = a.date ? new Date(a.date).getTime() : 0;
           const tB = b.date ? new Date(b.date).getTime() : 0;
           return tA - tB;
         });
         setBookings(filtered);
       }, (err) => handleFirestoreError(err, OperationType.LIST, 'bookings-fallback'));
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));

    let unsubInquiriesFallback: (() => void) | null = null;
    const unsubscribeInquiries = onSnapshot(query(collection(db, 'inquiries'), orderBy('createdAt', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Inquiry));
      setInquiries(data);

      if (isInitialInquiriesLoaded.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const inquiry = change.doc.data() as Inquiry;
            const tourTitle = inquiry.planTitle || inquiry.summary || "Selected Tour Package";
            const customerName = inquiry.userName || "Interested traveler";
            triggerPWSNotification(
              "💬 New Trip Inquiry!",
              `${customerName} registered interest for "${tourTitle}". Click to open inquiries.`,
              '/admin'
            );
          }
        });
      } else {
        isInitialInquiriesLoaded.current = true;
      }
    }, (error) => {
      console.warn("Inquiries snapshot error:", error);
      if (unsubInquiriesFallback) unsubInquiriesFallback();
      unsubInquiriesFallback = onSnapshot(collection(db, 'inquiries'), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Inquiry));
        // Sort in memory (desc)
        list.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        setInquiries(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'inquiries-fallback'));
    });

    const unsubscribeTypes = onSnapshot(collection(db, 'tourTypes'), (snapshot) => {
      setTourTypes(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TourType)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tourTypes'));

    let unsubscribeUsers = () => {};
    const tenantIdForUsers = getActiveTenantId();
    if (!isSupplier && !isAgent) {
      const userQ = tenantIdForUsers 
          ? query(collection(db, 'users'), where('tenantId', '==', tenantIdForUsers))
          : collection(db, 'users');
      unsubscribeUsers = onSnapshot(userQ, (snapshot) => {
          setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
    }

    const unsubscribeLocations = onSnapshot(collection(db, 'locationMeta'), (snapshot) => {
      setLocations(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LocationMeta)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'locationMeta'));

    const unsubscribeAddOns = onSnapshot(collection(db, 'globalAddOns'), (snapshot) => {
      setGlobalAddOns(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AddOn)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'globalAddOns'));

    const unsubscribeTransports = onSnapshot(collection(db, 'globalTransports'), (snapshot) => {
      setGlobalTransports(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TransportOption)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'globalTransports'));

    const unsubscribeCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      setCoupons(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Coupon)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'coupons'));

    const tenantId = getActiveTenantId();
    const urgencyQuery = tenantId 
      ? query(collection(db, 'urgencyPoints'), where('tenantId', '==', tenantId))
      : collection(db, 'urgencyPoints');

    const unsubscribeUrgency = onSnapshot(urgencyQuery, (snapshot) => {
      const allPoints = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UrgencyPoint));
      const seen = new Set<string>();
      const uniquePoints: UrgencyPoint[] = [];
      for (const pItem of allPoints) {
        const title = (pItem.title || (pItem as any).text || '').trim().toLowerCase();
        if (title && !seen.has(title)) {
          seen.add(title);
          uniquePoints.push(pItem);
        } else if (!title) {
          uniquePoints.push(pItem);
        }
      }
      setUrgencyPoints(uniquePoints);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'urgencyPoints'));

    // Filter guides based on supplierId if the user is a supplier
    let guidesQuery;
    if (isSupplier) {
      guidesQuery = query(collection(db, 'guides'), where('supplierId', '==', currentUserProfile.uid), orderBy('name', 'asc'));
    } else {
      guidesQuery = query(collection(db, 'guides'), orderBy('name', 'asc'));
    }
    
    const unsubscribeGuides = onSnapshot(
      guidesQuery, 
      (snapshot) => {
        setAllGuides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guide)));
      },
      (error) => {
        console.warn("Guides global snapshot error:", error);
        handleFirestoreError(error, OperationType.LIST, 'guides');
        // Universal Fallback: query collection without order-by or complex filtering (zero indexes needed!)
        if (unsubGuidesFallback) unsubGuidesFallback();
        unsubGuidesFallback = onSnapshot(collection(db, 'guides'), (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Guide));
          let filtered = list;
          if (isSupplier) {
            filtered = list.filter(g => g.supplierId === currentUserProfile.uid);
          }
          // Sort in memory (asc)
          filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setAllGuides(filtered);
        });
      }
    );

    const unsubscribeLabels = onSnapshot(collection(db, 'tourLabels'), (snapshot) => {
      setLabels(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TourLabel)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tourLabels'));

    const tenantIdForInvoices = getActiveTenantId();
    let unsubscribeInvoices = () => {};
    if (tenantIdForInvoices) {
      const q = query(collection(db, 'invoices'), where('tenantId', '==', tenantIdForInvoices));
      unsubscribeInvoices = onSnapshot(q, (snapshot) => {
        setTenantInvoices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    const unsubscribeComm = onSnapshot(doc(db, 'communicationSettings', getActiveTenantId() || 'global'), (snap) => {
      if (snap.exists()) {
        setCommSettings(snap.data() as CommunicationSettings);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'communicationSettings/global'));

    const unsubscribeSiteSettings = onSnapshot(doc(db, 'settings', getActiveTenantId() || 'general'), (snap) => {
      if (snap.exists()) {
        setSiteSettings(snap.data() as SiteSettings);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/general'));

    const tenantIdForSubs = getActiveTenantId();
    let unsubscribeTenant = () => {};
    if (tenantIdForSubs) {
      unsubscribeTenant = onSnapshot(doc(db, 'tenants', tenantIdForSubs), (snap) => {
        if (snap.exists()) {
          setTenantData({ id: snap.id, ...snap.data() });
        }
      });
    }

    return () => {
      unsubscribe();
      if (unsubToursFallback) unsubToursFallback();
      if (unsubBookingsFallback) unsubBookingsFallback();
      if (unsubGuidesFallback) unsubGuidesFallback();
      unsubscribeCategories();
      unsubscribeTypes();
      unsubscribeLocations();
      unsubscribeAddOns();
      unsubscribeTransports();
      unsubscribeCoupons();
      unsubscribeUrgency();
      unsubscribeBookings();
      unsubscribeGuides();
      unsubscribeLabels();
      unsubscribeInvoices();
      unsubscribeComm();
      unsubscribeSiteSettings();
      unsubscribeTenant();
      unsubscribeUsers();
    };
  }, [isAuthorized]);

  // Auto-recalculate Price for Admin Manual Updates
  useEffect(() => {
    if (!isEditingTrip || !globalSelectedBooking || tours.length === 0) return;

    const tour = tours.find(t => t.id === globalSelectedBooking.tourId);
    if (!tour) return;

    const pkg = tour.packages.find(p => p.name === globalSelectedBooking.packageName);
    if (!pkg || !pkg.tiers || pkg.tiers.length === 0) return;

    const adults = (globalSelectedBooking.participants?.adults || 0);
    const children = (globalSelectedBooking.participants?.children || 0);

    // Pricing Logic
    const adultTier = pkg.tiers.find(
      (t) => adults >= t.minParticipants && adults <= t.maxParticipants,
    ) || (adults < (pkg.tiers[0]?.minParticipants || 0) ? pkg.tiers[0] : pkg.tiers[pkg.tiers.length - 1]);
    
    const childTier = children > 0 
      ? (pkg.tiers.find((t) => children >= t.minParticipants && children <= t.maxParticipants) || 
         (children < (pkg.tiers[0]?.minParticipants || 0) ? pkg.tiers[0] : pkg.tiers[pkg.tiers.length - 1]))
      : adultTier;

    const adultRate = adultTier?.adultPrice || 0;
    const childRate = childTier?.childPrice || 0;
    
    const packageTotal = (adultRate * adults) + (childRate * children);
    
    // Add-ons total
    const addonsTotal = (globalSelectedBooking.selectedAddOns || []).reduce(
      (sum, addon) => sum + (addon.price * addon.quantity), 
      0
    );

    const newTotal = packageTotal + addonsTotal;

    // Only update if the price has actually changed and it's not a manual override 
    // We check against the current value to avoid infinite loops
    if (newTotal !== globalSelectedBooking.totalAmount) {
      setGlobalSelectedBooking(prev => {
        if (!prev) return null;
        return { ...prev, totalAmount: newTotal };
      });
    }
  }, [
    isEditingTrip,
    globalSelectedBooking?.participants.adults,
    globalSelectedBooking?.participants.children,
    globalSelectedBooking?.packageName,
    JSON.stringify(globalSelectedBooking?.selectedAddOns),
    globalSelectedBooking?.tourId,
    tours
  ]);

  const menuItems = useMemo(() => {
    const isSupplier = currentUserProfile?.role === 'supplier';
    const isAgent = currentUserProfile?.role === 'agent';
    const isStaff = currentUserProfile?.role === 'staff';
    const staffPerms = currentUserProfile?.permissions || {};
    
    interface MenuItem {
      id: string;
      label: string;
      icon?: any;
      hidden?: boolean;
      children?: { id: string; label: string; hidden?: boolean }[];
    }

    const items: MenuItem[] = [
      { 
        id: 'dashboard', 
        label: 'Dashboard', 
        icon: Layout,
      },
      { 
        id: 'booking-group', 
        label: 'Booking', 
        icon: Briefcase,
        hidden: isSupplier ? false : isAgent ? false : (isStaff ? !(staffPerms.bookings ?? true) : false),
        children: [
          { id: 'bookings', label: 'Booking List' },
          { id: 'add-manual-booking', label: 'Create Booking' },
          { id: 'import-bookings', label: 'Import Booking', hidden: isAgent || isSupplier },
          { id: 'schedule', label: 'Calendar Schedule', hidden: isAgent },
          { id: 'reports', label: 'Booking Reports', hidden: isAgent || isSupplier }
        ].filter(c => !c.hidden)
      },
      { 
        id: 'tours-group', 
        label: 'Tours', 
        icon: MapIcon,
        hidden: isAgent ? true : (isStaff ? !(staffPerms.tours ?? true) : false),
        children: [
          { id: 'all-tours', label: 'All Tours' },
          { id: 'tours', label: 'Add Tours' },
          { id: 'categories', label: 'Categories', hidden: isSupplier },
          { id: 'locations', label: 'Destinations', hidden: isSupplier },
          { id: 'labels', label: 'Labels', hidden: isSupplier },
          { id: 'addons', label: 'Add Ons', hidden: isSupplier },
          { id: 'transports', label: 'Transport', hidden: isSupplier },
          { id: 'urgency-points', label: 'Urgency Features', hidden: isSupplier }
        ].filter(c => !c.hidden)
      },
      { 
        id: 'car-rental-group', 
        label: 'Car Rental', 
        icon: Car,
        hidden: isSupplier || isAgent || (isStaff && !(staffPerms.carRental ?? true)),
        children: [
          { id: 'car-rental-bookings', label: 'Rental Booking' },
          { id: 'car-rental-automations', label: 'Booking Automation' },
          { id: 'car-rental-settings', label: 'Setting & Zones' },
        ]
      },
      { 
        id: 'operations-group', 
        label: 'Operations', 
        icon: Layers,
        hidden: isSupplier || isAgent,
        children: [
          { id: 'waivers', label: 'Digital Waivers' },
          { id: 'channel-manager', label: 'Channel Manager (OTAs)' },
          { id: 'invoices', label: 'Invoice & Billing' },
          { id: 'ai-hub', label: 'Proposal Generator' },
          { id: 'inquiries', label: 'Inquiry' },
          { id: 'guides', label: 'Drivers & Guide' },
        ]
      },
      { 
        id: 'analytics-group', 
        label: 'Analytics', 
        icon: BarChart3,
        hidden: isAgent || isSupplier || (isStaff && !staffPerms.analytics),
        children: [
          { id: 'analytics-overview', label: 'Traffic & Visitor' },
          { id: 'conversion-funnel', label: 'Conversion Funnel' },
          { id: 'google-analytics', label: 'GA4 & GTM Tracking' },
        ]
      },
      { 
        id: 'marketing-group', 
        label: 'Marketing', 
        icon: Tag,
        hidden: isSupplier || isAgent || (isStaff && !staffPerms.marketing && !staffPerms.coupons),
        children: [
          { id: 'coupons', label: 'Coupons' },
          { id: 'popups-manager', label: 'Pop Ups' }
        ]
      },
      {
        id: 'reviews',
        label: 'Reviews',
        icon: Star,
        hidden: isSupplier || isAgent || (isStaff && !staffPerms.reviews)
      },
      {
        id: 'tickets',
        label: 'Support & Tickets',
        icon: LifeBuoy,
        hidden: isSupplier || isAgent || (isStaff && !(staffPerms.tickets ?? true))
      },
      { 
        id: 'blog-group', 
        label: 'Blog', 
        icon: FileText,
        hidden: isSupplier || isAgent || (isStaff && !staffPerms.websiteBuilder),
        children: [
          { id: 'blog', label: 'All Blog' },
          { id: 'add-blog-trigger', label: 'Add Blog' },
          { id: 'blog-categories', label: 'Categories' }
        ]
      },
      { 
        id: 'pages-group', 
        label: 'Pages', 
        icon: LayoutTemplate,
        hidden: isSupplier || isAgent || (isStaff && !staffPerms.websiteBuilder),
        children: [
          { id: 'pages', label: 'All Pages' },
          { id: 'add-page-trigger', label: 'Add Pages' },
          { id: 'landing-page-generator', label: 'Landing Page Generator' }
        ]
      },
      { 
        id: 'finance-group', 
        label: 'Finance', 
        icon: Wallet,
        hidden: isSupplier || isAgent || (isStaff && !staffPerms.finance),
        children: [
          { id: 'payouts', label: 'Financial Report' }
        ]
      },
      { 
        id: 'website-builder-group', 
        label: 'Website Builder', 
        icon: LayoutGrid,
        hidden: isSupplier || isAgent || (isStaff && !staffPerms.websiteBuilder),
        children: [
          { id: 'wb-site-settings', label: 'Site Setting (Branding & Style)' },
          { id: 'wb-blocks', label: 'Page Builder' },
          { id: 'wb-tours', label: 'Feature & Favorite Tours' },
          { id: 'wb-menus', label: 'Custom menu' },
          { id: 'wb-pages', label: 'System Page Design' },
          { id: 'wb-presets', label: 'Design Preset (Mobile & Desktop)' }
        ]
      },
      { 
        id: 'users-group', 
        label: 'User Management', 
        icon: Users,
        hidden: isSupplier || isAgent || (isStaff && !staffPerms.userManagement),
        children: [
          { id: 'users', label: 'All Users' },
          { id: 'add-user-trigger', label: 'Add Users' },
          { id: 'access-roles', label: 'Roles & Permissions' }
        ]
      },
      { 
        id: 'settings-group', 
        label: 'Setting', 
        icon: Settings,
        hidden: isSupplier || isAgent || (isStaff && !staffPerms.settings),
        children: [
          { id: 'payment-settings', label: 'Payment Setting' },
          { id: 'company-info', label: 'Company Info' },
          { id: 'communication', label: 'Communication Setting' },
          { id: 'seo', label: 'SEO Setting' },
          { id: 'domain', label: 'Custom Domain' },
          { id: 'backup', label: 'Disaster Recovery & Backup' },
          { id: 'company-profile', label: 'My Company Profile', hidden: !isSupplier && !isAgent }
        ].filter(c => !c.hidden)
      }
    ];

    return items.filter(i => !i.hidden);
  }, [currentUserProfile, inquiries.length]);

  const activeMenuItemLabel = useMemo(() => {
    const labelsMap: Record<string, string> = {
      'dashboard': 'Dashboard Overview',
      'bookings': 'Booking List',
      'add-manual-booking': 'Create Booking',
      'import-bookings': 'Import Booking',
      'schedule': 'Calendar Schedule',
      'reports': 'Booking Reports',
      'all-tours': 'All Tours',
      'tours': 'Add Tours',
      'categories': 'Tour Categories',
      'locations': 'Destinations',
      'labels': 'Tour Labels',
      'addons': 'Tour Add-ons',
      'transports': 'Transport Options',
      'urgency-points': 'Urgency Features',
      'car-rental-bookings': 'Rental Booking',
      'car-rental-automations': 'Booking Automation',
      'car-rental-settings': 'Setting & Zones',
      'car-fleet': 'Rental Fleet & Pricing',
      'waivers': 'Digital Waivers',
      'channel-manager': 'Channel Manager (OTAs)',
      'invoices': 'Invoice & Billing',
      'ai-hub': 'Proposal Generator',
      'inquiries': 'Customer Inquiries',
      'guides': 'Drivers & Guide',
      'analytics': 'Analytics & Growth Hub',
      'analytics-overview': 'Traffic & Visitor',
      'conversion-funnel': 'Conversion Funnel',
      'google-analytics': 'GA4 & GTM Tracking',
      'analytics-integration': 'GA4 & GTM Tracking',
      'coupons': 'Coupons',
      'popups-manager': 'Pop Ups',
      'reviews': 'Customer Reviews',
      'tickets': 'Support & Tickets',
      'blog': 'All Blog Articles',
      'add-blog-trigger': 'Add Blog',
      'blog-categories': 'Blog Categories',
      'pages': 'All Pages',
      'add-page-trigger': 'Add Pages',
      'landing-page-generator': 'Landing Page Generator',
      'payouts': 'Financial Report',
      'website-builder': 'Website Builder',
      'wb-site-settings': 'Site Setting (Branding & Style)',
      'wb-blocks': 'Page Builder',
      'wb-tours': 'Feature & Favorite Tours',
      'wb-menus': 'Custom menu',
      'wb-pages': 'System Page Design',
      'wb-presets': 'Design Preset (Mobile & Desktop)',
      'users': 'All Users',
      'add-user-trigger': 'Add Users',
      'access-roles': 'Roles & Permissions',
      'payment-settings': 'Payment Setting',
      'company-info': 'Company Info',
      'communication': 'Communication Setting',
      'seo': 'SEO Setting',
      'domain': 'Custom Domain',
      'backup': 'Disaster Recovery & Backup',
      'billing': 'Billing & Plans',
      'custom-domain': 'Custom Domain',
      'developer-hub': 'Developer Hub',
      'user-settings': 'User Setting',
    };
    if (labelsMap[activeMenu]) return labelsMap[activeMenu];

    const top = menuItems.find(m => m.id === activeMenu);
    if (top) return top.label;
    const child = menuItems.flatMap(m => m.children || []).find(c => c.id === activeMenu);
    return child?.label || 'Admin Dashboard';
  }, [menuItems, activeMenu]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Icons.Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return null;
  }

  const handleAssignToGuide = async (booking: Booking, guide: Guide) => {
    if (currentUserProfile?.role === 'supplier' && guide.supplierId !== currentUserProfile.uid) {
        alert("Action restricted: You can only assign guides you have created.");
        return;
    }
    if (!booking) return;

    setLoadingStates(prev => ({ ...prev, assigningGuide: true }));
    try {
      const tourDoc = await getDoc(doc(db, 'tours', booking.tourId));
      const tour = tourDoc.exists() ? tourDoc.data() as Tour : null;
      
      const customer: any = booking.customerData || {};
      const pax = booking.participants || { adults: 0, children: 0 };
      
      let message = `*Tour Details Assignment*\n\n`;
      message += `Name of guest: ${customer.fullName || 'N/A'}\n`;
      message += `No of guest: ${pax.adults || 0} Adults, ${pax.children || 0} Children\n`;
      message += `Pick up address: ${customer.pickupAddress || 'N/A'}\n`;
      message += `Guest Whatsapp Number: ${customer.phone || 'N/A'}\n`;
      message += `Tour date: ${booking.date}\n`;
      message += `Tours: ${booking.tourTitle}\n`;
      message += `Package Booked: ${booking.packageName}\n`;
      
      if (booking.selectedAddOns && booking.selectedAddOns.length > 0) {
        message += `\n*Add-ons:*\n`;
        booking.selectedAddOns.forEach(addon => {
          message += `- ${addon.name} (x${addon.quantity})\n`;
        });
      }
      
      if (tour && tour.itinerary && tour.itinerary.length > 0) {
         message += `\n*Itinerary:*\n`;
         tour.itinerary.forEach(item => {
           message += `- ${item.title}\n`;
         });
      }

      const enrichedBookingForWhatsApp = {
        ...booking,
        assignedGuideId: guide.id,
        assignedGuideName: guide.name,
        assignedGuideWhatsapp: guide.whatsapp
      };

      // Send Automated WhatsApp via Whapi to Guide
      try {
        await sendCustomWhatsApp(guide.whatsapp, message, enrichedBookingForWhatsApp, true, false);
        console.log(`[WhatsApp] Auto-sent assignment to guide with Manifest PDF: ${guide.name}`);
      } catch (waErr) {
        console.error('[WhatsApp] Failed to auto-send to guide:', waErr);
      }

      // Send Automated WhatsApp via Whapi to Customer
      try {
        const commSettingsSnap = await getDoc(doc(db, 'communicationSettings', getActiveTenantId() || 'global'));
        const commSettings = commSettingsSnap.exists() ? commSettingsSnap.data() as CommunicationSettings : null;
        
        let customerMsg = `*Guide Assigned*\n\nHello ${customer.fullName || 'Guest'}, we have assigned a guide for your tour "${booking.tourTitle}" on ${booking.date}.\n\n*Your Guide:* ${guide.name}\n*Guide WhatsApp:* ${guide.whatsapp}\n\nOur guide will contact you soon for pickup details. Enjoy your trip!`;
        
        if (commSettings?.whatsappTemplates?.guide_assigned?.enabled) {
          const template = commSettings.whatsappTemplates.guide_assigned.message;
          customerMsg = generateBookingMessage(template, {
            ...booking,
            assignedGuideName: guide.name,
            assignedGuideWhatsapp: guide.whatsapp
          });
        }
        
        await sendCustomWhatsApp(customer.phone || '', customerMsg, enrichedBookingForWhatsApp, false, true);
        console.log(`[WhatsApp] Auto-sent notification to customer with Tour Voucher PDF: ${customer.fullName || 'Guest'}`);
      } catch (waErr) {
        console.error('[WhatsApp] Failed to auto-send to customer:', waErr);
      }

      // Send Email Notification for Guide Assigned
      try {
        await sendBookingEmail('guide_assigned', {
          ...booking,
          assignedGuideName: guide.name,
          assignedGuideWhatsapp: guide.whatsapp
        });
      } catch (emailErr) {
        console.error('Failed to send guide assignment email:', emailErr);
      }

      // Update Booking with assigned guide
      const newLog: BookingLog = {
        timestamp: new Date().toISOString(),
        message: `Guide assigned: ${guide.name} (${guide.whatsapp})`,
        type: 'assignment',
        userName: auth.currentUser?.displayName || auth.currentUser?.email || 'Admin'
      };

      await updateDoc(doc(db, 'bookings', booking.id), {
        assignedGuideId: guide.id,
        assignedGuideName: guide.name,
        assignedGuideWhatsapp: guide.whatsapp,
        updatedAt: serverTimestamp(),
        logs: [
          ...(booking.logs || []),
          newLog
        ]
      });
      setIsAssignOpen(false);
      setAssignBooking(null);
      alert("Success! Guide assigned and WhatsApp notifications sent via API.");
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, 'update' as any, `bookings/${booking?.id}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, assigningGuide: false }));
    }
  };

  const handlePrintManifest = (booking: Booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const primaryColor = siteSettings?.primaryColor || '#10b981';
    const logoUrl = siteSettings?.logoURL || tenant?.logo;
    const siteName = siteSettings?.siteName || tenant?.companyName || 'Tripbone';

    const manifestHtml = `
      <html>
        <head>
          <title>Tour Manifest - ${booking.id.toUpperCase()}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
            
            :root {
              --primary: ${primaryColor};
              --primary-light: ${primaryColor}15;
              --text-main: #1a1a1a;
              --text-muted: #64748b;
              --border-color: #f1f5f9;
            }

            body { 
              font-family: 'Plus Jakarta Sans', sans-serif; 
              color: var(--text-main); 
              line-height: 1.5; 
              padding: 0; 
              margin: 0; 
              background: #fff; 
            }

            .container { 
              max-width: 900px; 
              margin: 20px auto; 
              padding: 40px;
              border: 1px solid var(--border-color);
              border-radius: 24px;
            }

            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              margin-bottom: 40px; 
            }

            .logo-container { 
              display: flex; 
              flex-direction: column;
              gap: 8px;
            }
            
            .logo-img { height: 48px; width: auto; object-fit: contain; }
            .logo-placeholder { 
                background: var(--primary); 
                color: white; 
                padding: 10px 20px; 
                border-radius: 12px; 
                font-weight: 800; 
                font-size: 18px;
                display: block;
            }
            
            .booking-badge {
                background: var(--primary-light);
                color: var(--primary);
                padding: 6px 12px;
                border-radius: 100px;
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .manifest-title-area {
                margin-bottom: 40px;
            }
            .manifest-title-area h1 {
                font-size: 38px;
                font-weight: 800;
                margin: 0;
                letter-spacing: -0.04em;
                color: var(--text-main);
            }
            .manifest-title-area p {
                color: var(--text-muted);
                font-weight: 500;
                margin: 4px 0 0;
                font-size: 16px;
            }

            .main-grid {
                display: grid;
                grid-template-columns: 1.8fr 1.2fr;
                gap: 32px;
            }

            .section { margin-bottom: 24px; }
            .section-label {
                font-size: 10px;
                font-weight: 900;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.12em;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .section-label::after {
                content: '';
                flex: 1;
                height: 1px;
                background: var(--border-color);
            }

            .info-card {
                background: #fcfdfe;
                border: 1px solid var(--border-color);
                border-radius: 16px;
                padding: 20px;
            }

            .data-row {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }
            .data-item .label {
                font-size: 9px;
                font-weight: 700;
                color: var(--text-muted);
                text-transform: uppercase;
                margin-bottom: 2px;
                display: block;
            }
            .data-item .value {
                font-size: 13px;
                font-weight: 700;
                color: var(--text-main);
                display: block;
            }
            .data-item.full { grid-column: span 2; }

            .pax-summary {
                display: flex;
                gap: 12px;
                margin-top: 16px;
            }
            .pax-pill {
                background: #fff;
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 10px 16px;
                flex: 1;
                text-align: center;
            }
            .pax-pill .count {
                font-size: 18px;
                font-weight: 800;
                color: var(--primary);
                display: block;
            }
            .pax-pill .label {
                font-size: 9px;
                font-weight: 700;
                color: var(--text-muted);
                text-transform: uppercase;
            }

            .addon-box {
                border: 1px solid var(--border-color);
                border-radius: 16px;
                overflow: hidden;
            }
            .addon-line {
                display: flex;
                justify-content: space-between;
                padding: 10px 16px;
                background: #fff;
                border-bottom: 1px solid var(--border-color);
            }
            .addon-line:last-child { border-bottom: none; }
            .addon-name { font-weight: 600; font-size: 12px; }
            .addon-qty { font-weight: 800; color: var(--primary); }

            .notes-area {
                background: #fff9eb;
                border-radius: 16px;
                padding: 16px;
                color: #854d0e;
                font-size: 12px;
                font-weight: 600;
                border: 1px solid #fef3c7;
                line-height: 1.5;
            }

            .footer {
                margin-top: 40px;
                padding-top: 24px;
                border-top: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                color: var(--text-muted);
                font-weight: 600;
            }

            @media print {
              body { padding: 0; }
              .container {
                  margin: 0;
                  padding: 10px;
                  border: none;
                  max-width: 100%;
              }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                ${logoUrl ? `<img src="${logoUrl}" class="logo-img" alt="${siteName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ''}
                <span class="logo-placeholder" style="${logoUrl ? 'display:none;' : ''}">${siteName.toUpperCase()}</span>
              </div>
              <div style="text-align: right;">
                <div class="booking-badge">#${booking.id.toUpperCase()}</div>
                <div style="margin-top: 6px; font-size:11px; font-weight:700; color: var(--text-muted);">Booking Reference</div>
              </div>
            </div>

            <div class="manifest-title-area">
              <h1>Tour Manifest</h1>
              <p>Operational summary for on-ground field team</p>
            </div>

            <div class="main-grid">
              <div class="left-col">
                <div class="section">
                  <div class="section-label">General Information</div>
                  <div class="info-card">
                    <div class="data-row">
                      <div class="data-item full">
                        <span class="label">Tour / Activity Name</span>
                        <span class="value" style="font-size: 16px; color: var(--primary);">${booking.tourTitle}</span>
                      </div>
                      <div class="data-item">
                        <span class="label">Package Type</span>
                        <span class="value">${booking.packageName}</span>
                      </div>
                      <div class="data-item">
                        <span class="label">Trip Date</span>
                        <span class="value">${booking.date}</span>
                      </div>
                      <div class="data-item">
                        <span class="label">Meeting / Pickup</span>
                        <span class="value">${booking.time || booking.timeSlot || 'TBA'}</span>
                      </div>
                      <div class="data-item">
                        <span class="label">Status</span>
                        <span class="value" style="text-transform: uppercase;">${booking.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="section">
                  <div class="section-label">Participant Details</div>
                  <div class="info-card">
                    <div class="data-row">
                      <div class="data-item">
                        <span class="label">Guest Name</span>
                        <span class="value">${booking.customerData?.fullName || 'N/A'}</span>
                      </div>
                      <div class="data-item">
                        <span class="label">Nationality</span>
                        <span class="value">${booking.customerData?.nationality || 'N/A'}</span>
                      </div>
                      <div class="data-item">
                        <span class="label">Contact Number</span>
                        <span class="value">${booking.customerData?.phone || 'N/A'}</span>
                      </div>
                      <div class="data-item">
                        <span class="label">Email</span>
                        <span class="value">${booking.customerData?.email || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div class="pax-summary">
                      <div class="pax-pill">
                        <span class="count">${booking.participants?.adults || 0}</span>
                        <span class="label">Adults</span>
                      </div>
                      <div class="pax-pill">
                        <span class="count">${booking.participants?.children || 0}</span>
                        <span class="label">Children</span>
                      </div>
                      <div class="pax-pill" style="background: var(--primary-light); border-color: var(--primary);">
                        <span class="count">${(booking.participants?.adults || 0) + (booking.participants?.children || 0)}</span>
                        <span class="label" style="color: var(--primary);">Total Pax</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="section">
                    <div class="section-label">Pickup & Arrival Info</div>
                    <div class="info-card">
                        <div class="data-item full">
                            <span class="label">Location / Hotel Name</span>
                            <span class="value">${booking.customerData?.pickupAddress || 'No Pickup Requested'}</span>
                        </div>
                    </div>
                </div>
              </div>

              <div class="right-col">
                ${booking.selectedAddOns?.length > 0 ? `
                <div class="section">
                  <div class="section-label">Booked Add-Ons</div>
                  <div class="addon-box">
                    ${booking.selectedAddOns.map(addon => `
                      <div class="addon-line">
                        <span class="addon-name">${addon.name}</span>
                        <span class="addon-qty">x${addon.quantity}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
                ` : ''}

                <div class="section">
                    <div class="section-label">Special Requirements</div>
                    <div class="notes-area">
                        ${booking.customerData?.specialRequirements || 'No special requirements noted for this trip.'}
                    </div>
                </div>

                <div class="section">
                    <div class="section-label">Guide Assignment</div>
                    <div class="info-card" style="padding: 16px;">
                        <span class="label" style="font-size: 9px; margin-bottom: 2px;">Assigned Field Team</span>
                        <span class="value">${booking.assignedGuideName || 'Pending Assignment'}</span>
                        ${booking.assignedGuideWhatsapp ? `<span class="label" style="font-size: 8px; margin-top: 4px;">Contact: ${booking.assignedGuideWhatsapp}</span>` : ''}
                    </div>
                </div>
              </div>
            </div>

            <div class="footer">
              <span>Verified Operational Document • ${siteName}</span>
              <span>Generated: ${new Date().toLocaleString()}</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1200);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(manifestHtml);
    printWindow.document.close();
  };

  const updateBookingStatus = async (id: string, status: 'confirmed' | 'cancelled' | 'pending' | 'review_required' | 'completed') => {
    if (currentUserProfile?.role !== 'admin') {
        alert("Action restricted: Payments and status updates must be processed by the Super Admin.");
        return;
    }
    
    setLoadingStates(prev => ({ ...prev, statusUpdating: true }));
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
      
      // Send Email Notification
      const bookingSnap = await getDoc(doc(db, 'bookings', id));
      if (bookingSnap.exists()) {
         const bookingData = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
         
         const emailPromises: Promise<any>[] = [];

         if (status === 'confirmed') {
           // Customer: Booking Status Changed from Pending to Confirmed
           emailPromises.push(sendBookingEmail('booking_status_confirmed', bookingData));
           // Admin: Booking Confirmed by Admin
           emailPromises.push(sendBookingEmail('admin_booking_confirmed', bookingData));
           // Supplier: Booking Confirmed by Admin
           emailPromises.push(sendBookingEmail('supplier_booking_confirmed', bookingData));
         } else if (status === 'cancelled') {
           // Customer: Booking Canceled (Approved by admin)
           emailPromises.push(sendBookingEmail('booking_cancelled', bookingData));
           // Admin: Booking Canceled Approved
           emailPromises.push(sendBookingEmail('admin_booking_cancellation_approved', bookingData));
           // Supplier: Booking Canceled Approved
           emailPromises.push(sendBookingEmail('supplier_booking_cancellation_approved', bookingData));
         } else if (status === 'completed') {
           // Customer: Tour Completed, Thank you and Review Request
           emailPromises.push(sendBookingEmail('tour_completed_review_request', bookingData));
           // Admin: Booking Completed
           emailPromises.push(sendBookingEmail('admin_booking_completed', bookingData));
           // Supplier: Booking Completed
           emailPromises.push(sendBookingEmail('supplier_booking_completed', bookingData));
         } else if (status === 'review_required') {
           if (bookingData.cancellationRequested) {
             emailPromises.push(sendBookingEmail('booking_cancellation_request', bookingData));
             emailPromises.push(sendBookingEmail('admin_booking_cancellation_request', bookingData));
             emailPromises.push(sendBookingEmail('supplier_booking_cancellation_request', bookingData));
           } else {
             emailPromises.push(sendBookingEmail('booking_change_request', bookingData));
             emailPromises.push(sendBookingEmail('admin_booking_change_request', bookingData));
             emailPromises.push(sendBookingEmail('supplier_booking_change_request', bookingData));
           }
         } else {
           emailPromises.push(sendBookingEmail('booking_status_updated', bookingData));
         }

         await Promise.all(emailPromises).catch(err => console.error("Error sending role-based status emails:", err));
         
         // Trigger WhatsApp
         await sendWhatsAppNotification('booking_status_updated', bookingData);
      }

      alert(`Booking status changed to ${status} successfully and notifications sent!`);
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setLoadingStates(prev => ({ ...prev, statusUpdating: false }));
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (currentUserProfile?.role !== 'admin') {
        alert("Action restricted: Only the Super Admin can delete bookings.");
        return;
    }
    if (confirm("Are you sure you want to PERMANENTLY delete this booking? This action cannot be undone.")) {
      setLoadingStates(prev => ({ ...prev, deletingBooking: true }));
      try {
        await deleteDoc(doc(db, 'bookings', id));
        setIsBookingDetailOpen(false);
        setGlobalSelectedBooking(null);
        alert("Booking deleted successfully!");
      } catch (err) {
        console.error(err);
        alert("Failed to delete booking.");
      } finally {
        setLoadingStates(prev => ({ ...prev, deletingBooking: false }));
      }
    }
  };

  const handleAddInternalNote = async () => {
    if (!newNote.trim() || !globalSelectedBooking) return;
    
    setLoadingStates(prev => ({ ...prev, addingNote: true }));
    const newLog: BookingLog = {
      timestamp: new Date().toISOString(),
      message: newNote,
      type: 'note',
      userName: auth.currentUser?.displayName || auth.currentUser?.email || 'Admin'
    };
    
    const updatedLogs = [...(globalSelectedBooking.logs || []), newLog];
    const updatedBooking = { ...globalSelectedBooking, logs: updatedLogs };
    
    setGlobalSelectedBooking(updatedBooking);
    setNewNote('');
    
    try {
      await updateDoc(doc(db, 'bookings', globalSelectedBooking.id), {
        logs: updatedLogs,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setLoadingStates(prev => ({ ...prev, addingNote: false }));
    }
  };

  const handleSaveBookingChange = async (e: FormEvent) => {
    e.preventDefault();
    if (currentUserProfile?.role !== 'admin') {
        alert("Action restricted: Booking modifications must be processed by the Super Admin.");
        return;
    }
    if (!globalSelectedBooking) return;
    setLoadingStates(prev => ({ ...prev, updatingBooking: true }));
    try {
      const { id, ...data } = globalSelectedBooking;
      
      // Handle Auto-logging of changes
      const newLogs: BookingLog[] = [...(globalSelectedBooking.logs || [])];
      const adminName = auth.currentUser?.displayName || auth.currentUser?.email || 'Admin';
      
      if (originalBooking) {
        if (globalSelectedBooking.status !== originalBooking.status) {
          newLogs.push({
            timestamp: new Date().toISOString(),
            message: `Status changed from ${originalBooking.status} to ${globalSelectedBooking.status}`,
            type: 'status_change',
            userName: adminName
          });
        }
        if (globalSelectedBooking.date !== originalBooking.date) {
            newLogs.push({
              timestamp: new Date().toISOString(),
              message: `Tour date changed from ${originalBooking.date} to ${globalSelectedBooking.date}`,
              type: 'system',
              userName: adminName
            });
        }
        if (globalSelectedBooking.paymentStatus !== originalBooking.paymentStatus) {
            newLogs.push({
              timestamp: new Date().toISOString(),
              message: `Payment status changed from ${originalBooking.paymentStatus} to ${globalSelectedBooking.paymentStatus}`,
              type: 'system',
              userName: adminName
            });
        }
        if (globalSelectedBooking.packageName !== originalBooking.packageName) {
            newLogs.push({
              timestamp: new Date().toISOString(),
              message: `Package changed from ${originalBooking.packageName} to ${globalSelectedBooking.packageName}`,
              type: 'system',
              userName: adminName
            });
        }
        if ((globalSelectedBooking.participants?.adults || 0) !== (originalBooking.participants?.adults || 0) || (globalSelectedBooking.participants?.children || 0) !== (originalBooking.participants?.children || 0)) {
            newLogs.push({
              timestamp: new Date().toISOString(),
              message: `Participants updated: ${(globalSelectedBooking.participants?.adults || 0)}A, ${(globalSelectedBooking.participants?.children || 0)}C`,
              type: 'system',
              userName: adminName
            });
        }
      }

      const finalData = { ...data, logs: newLogs };
      await updateDoc(doc(db, 'bookings', id), finalData as any);
      
      // Determine logical change for specific email branding and send to stakeholders
      const emailPromises: Promise<any>[] = [];
      const updatedBookingWithLogs = { ...globalSelectedBooking, logs: newLogs } as Booking;
      
      if (originalBooking) {
        const statusChanged = globalSelectedBooking.status !== originalBooking.status;
        const dateChanged = globalSelectedBooking.date !== originalBooking.date;
        const participantsChanged = 
          (globalSelectedBooking.participants?.adults || 0) !== (originalBooking.participants?.adults || 0) ||
          (globalSelectedBooking.participants?.children || 0) !== (originalBooking.participants?.children || 0);
        const addOnsChanged = JSON.stringify(globalSelectedBooking.selectedAddOns || []) !== JSON.stringify(originalBooking.selectedAddOns || []);
        
        const isApproved = statusChanged && 
          originalBooking.status === 'review_required' && 
          globalSelectedBooking.status === 'confirmed';

        if (isApproved) {
          // Booking Change Approved
          emailPromises.push(sendBookingEmail('booking_change_approved', updatedBookingWithLogs));
          emailPromises.push(sendBookingEmail('admin_booking_change_approved', updatedBookingWithLogs));
          emailPromises.push(sendBookingEmail('supplier_booking_change_approved', updatedBookingWithLogs));
        } else if (statusChanged) {
          if (globalSelectedBooking.status === 'confirmed') {
            emailPromises.push(sendBookingEmail('booking_status_confirmed', updatedBookingWithLogs));
            emailPromises.push(sendBookingEmail('admin_booking_confirmed', updatedBookingWithLogs));
            emailPromises.push(sendBookingEmail('supplier_booking_confirmed', updatedBookingWithLogs));
          } else if (globalSelectedBooking.status === 'cancelled') {
            emailPromises.push(sendBookingEmail('booking_cancelled', updatedBookingWithLogs));
            emailPromises.push(sendBookingEmail('admin_booking_cancellation_approved', updatedBookingWithLogs));
            emailPromises.push(sendBookingEmail('supplier_booking_cancellation_approved', updatedBookingWithLogs));
          } else if (globalSelectedBooking.status === 'completed') {
            emailPromises.push(sendBookingEmail('tour_completed_review_request', updatedBookingWithLogs));
            emailPromises.push(sendBookingEmail('admin_booking_completed', updatedBookingWithLogs));
            emailPromises.push(sendBookingEmail('supplier_booking_completed', updatedBookingWithLogs));
          } else {
            emailPromises.push(sendBookingEmail('booking_status_updated', updatedBookingWithLogs));
          }
        } else if (dateChanged || participantsChanged || addOnsChanged) {
          // Booking Changed by admin
          emailPromises.push(sendBookingEmail('booking_updated_by_admin', updatedBookingWithLogs));
          emailPromises.push(sendBookingEmail('admin_booking_change_approved', updatedBookingWithLogs));
          emailPromises.push(sendBookingEmail('supplier_booking_change_approved', updatedBookingWithLogs));
        } else if (globalSelectedBooking.paymentStatus !== originalBooking.paymentStatus && globalSelectedBooking.paymentStatus === 'paid') {
          emailPromises.push(sendBookingEmail('booking_payment_received', updatedBookingWithLogs));
        } else {
          // Default fallback
          emailPromises.push(sendBookingEmail('booking_status_updated', updatedBookingWithLogs));
        }
      } else {
        emailPromises.push(sendBookingEmail('booking_status_updated', updatedBookingWithLogs));
      }
      
      // Trigger notifications in the background to ensure instant and ultra-resilient save operations
      Promise.all([
        ...emailPromises,
        sendWhatsAppNotification('booking_status_updated', updatedBookingWithLogs).catch(err => console.error("Error sending WhatsApp save notification:", err))
      ]).catch(err => {
        console.error("Error processing booking save notifications:", err);
      });
      
      alert("Booking updated successfully and notifications sent!");
      setIsBookingDetailOpen(false);

      setOriginalBooking(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `bookings/${globalSelectedBooking?.id}`);
      console.error(err);
      alert("Failed to save booking. " + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoadingStates(prev => ({ ...prev, updatingBooking: false }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (!editingId && currentUserProfile?.role === 'supplier' && tenantData) {
        const quota = await checkQuota(tenantData, 'tours', tours.length);
        if (!quota.allowed) {
          alert(`Tour Quota Exceeded! You have ${tours.length} tours but your ${tenantData.plan || 'Starter'} plan only allows ${quota.maxLimit === 999999 ? 'Unlimited' : quota.maxLimit}. Please upgrade your plan in the Billing & Plans section.`);
          return;
        }
      }

      // Hydrate selected add-ons from global list for frontend snapshots
      const selectedAddOnObjects = globalAddOns.filter(a => formData.addOnIds?.includes(a.id));
      const selectedTransportObjects = globalTransports.filter(t => formData.transportIds?.includes(t.id));

      const isSupplier = currentUserProfile?.role === 'supplier';
      const dataToSave = {
        ...formData,
        ...(isSupplier && {
          supplierId: currentUserProfile.uid,
          supplierName: currentUserProfile.companyName || currentUserProfile.displayName,
          status: editingId ? (formData.status || 'draft') : 'draft'
        }),
        addOns: selectedAddOnObjects, // Full objects for frontend
        transports: selectedTransportObjects, // Full objects for frontend
        highlights: highlightsText.split('\n').filter(line => line.trim() !== ''),
        inclusions: inclusionsText.split('\n').filter(line => line.trim() !== ''),
        exclusions: exclusionsText.split('\n').filter(line => line.trim() !== ''),
        languages: languagesText.split('\n').filter(line => line.trim() !== ''),
        packages: (formData.packages || []).map(pkg => ({
          ...pkg,
          transportIds: pkg.transportIds ?? (formData.transportIds && formData.transportIds.length > 0 ? formData.transportIds : globalTransports.map(gt => gt.id)),
          inclusions: (pkg.inclusions || []).filter(l => l.trim() !== ''),
          exclusions: (pkg.exclusions || []).filter(l => l.trim() !== '')
        })),
        infoSections: (formData.infoSections || []).map(section => ({
          ...section,
          content: Array.isArray(section.content) ? section.content.filter(l => l.trim() !== '') : []
        })),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'tours', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'tours'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        resetForm();
      }
      alert("Success!");
    } catch (error) {
      console.error("Error saving tour", error);
      alert("Error saving tour. Check permissions.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setExpandedPackages([]);
    setExpandedItinerary([]);
    setActiveTab('basic');
    setHighlightsText('');
    setInclusionsText('');
    setExclusionsText('');
    setLanguagesText('');
    setFormData({
      title: '', slug: '', description: '', categoryId: '', tourTypeId: '', locationId: '',
      location: '', duration: '',
      regularPrice: 0, discountPrice: 0, gallery: [], featuredImage: '',
      highlights: [], inclusions: [], exclusions: [], itinerary: [],
      languages: [], packages: [], addOnIds: [], transportIds: [], meetingPoint: '', labelIds: [], 
      imageLabelId: '', belowTitleLabelId: '', priceLabelId: '',
      faqs: [], locationMapUrl: '',
      infoSections: [], importantInfo: '',
      maxCapacity: 0, slotCapacity: 0,
      cutOffHours: 0,
      cutOffNotice: '',
      supplierId: '', supplierName: '', status: 'draft',
      tourDurationType: 'single_day',
      multiDayItinerary: [],
      accommodations: [],
      multiDayGuides: []
    });
  };

  const handleEdit = (tour: Tour) => {
    setEditingId(tour.id);
    setExpandedPackages([]);
    setExpandedItinerary([]);
    setHighlightsText(tour.highlights?.join('\n') || '');
    setInclusionsText(tour.inclusions?.join('\n') || '');
    setExclusionsText(tour.exclusions?.join('\n') || '');
    setLanguagesText(tour.languages?.join('\n') || '');
    setFormData({
      ...formData, // default values
      ...tour,
      tourDurationType: tour.tourDurationType || 'single_day',
      multiDayItinerary: tour.multiDayItinerary || [],
      accommodations: tour.accommodations || [],
      multiDayGuides: tour.multiDayGuides || [],
      gallery: tour.gallery || [],
      highlights: tour.highlights || [],
      inclusions: tour.inclusions || [],
      exclusions: tour.exclusions || [],
      itinerary: tour.itinerary || [],
      packages: tour.packages || [],
      addOns: tour.addOns || [],
      faqs: tour.faqs || [],
      languages: tour.languages || [],
      labelIds: tour.labelIds || [],
      infoSections: tour.infoSections || []
    });
    setActiveTab('basic');
    setActiveMenu('tours');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloneTour = async (tour: Tour) => {
    if (currentUserProfile?.role === 'supplier' && tenantData) {
      const quota = await checkQuota(tenantData, 'tours', tours.length);
      if (!quota.allowed) {
        alert(`Tour Quota Exceeded! You have ${tours.length} tours but your ${tenantData.plan || 'Starter'} plan only allows ${quota.maxLimit === 999999 ? 'Unlimited' : quota.maxLimit}. Please upgrade your plan in the Billing & Plans section.`);
        return;
      }
    }

    if (!confirm(`Clone "${tour.title}"?`)) return;
    try {
      const { id, createdAt, updatedAt, ...clonedData } = tour;
      const newTitle = `${clonedData.title} (Copy)`;
      const newSlug = `${clonedData.slug}-copy-${Math.floor(Math.random() * 1000)}`;
      
      await addDoc(collection(db, 'tours'), {
        ...clonedData,
        title: newTitle,
        slug: newSlug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      alert("Tour cloned successfully!");
    } catch (error) {
      console.error("Error cloning tour", error);
      alert("Failed to clone tour.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this tour?")) {
      await deleteDoc(doc(db, 'tours', id));
    }
  };

  const handleImportTours = async (importedTours: Partial<Tour>[]): Promise<number> => {
    if (!importedTours || importedTours.length === 0) return 0;

    if (currentUserProfile?.role === 'supplier' && tenantData) {
      const quota = await checkQuota(tenantData, 'tours', tours.length + importedTours.length);
      if (!quota.allowed) {
        alert(`Tour Quota Exceeded! Importing ${importedTours.length} tour(s) would exceed your ${tenantData.plan || 'Starter'} plan limit of ${quota.maxLimit === 999999 ? 'Unlimited' : quota.maxLimit}. Current tours: ${tours.length}.`);
        return 0;
      }
    }

    const activeTenantId = getActiveTenantId() || (currentUserProfile as any)?.tenantId || '';
    let count = 0;

    const sanitizeForFirestore = (obj: any): any => {
      if (obj === undefined) return null;
      if (obj === null || typeof obj !== 'object') return obj;
      if (obj.toDate || obj._methodName) return obj;
      if (obj instanceof Date) return obj;
      if (Array.isArray(obj)) {
        return obj.map(sanitizeForFirestore).filter(v => v !== undefined && v !== null);
      }
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          const sanitized = sanitizeForFirestore(value);
          if (sanitized !== undefined) {
            result[key] = sanitized;
          }
        }
      }
      return result;
    };

    for (const rawTour of importedTours) {
      if (!rawTour || !rawTour.title || typeof rawTour.title !== 'string') continue;

      const { id, createdAt, updatedAt, tenantId: oldTenantId, ...cleanTour } = rawTour as any;

      const baseTitle = cleanTour.title.trim();
      const baseSlug = cleanTour.slug ? String(cleanTour.slug).trim() : baseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const uniqueSlug = `${baseSlug}-${randomSuffix}`;

      const rawDiscount = (cleanTour.discountPrice !== undefined && cleanTour.discountPrice !== null && cleanTour.discountPrice !== '')
        ? Number(cleanTour.discountPrice)
        : 0;

      const tourDataToSave = sanitizeForFirestore({
        ...cleanTour,
        title: baseTitle,
        slug: uniqueSlug,
        description: cleanTour.description || '',
        regularPrice: Number(cleanTour.regularPrice) || 0,
        discountPrice: rawDiscount,
        duration: cleanTour.duration || 'Full Day',
        status: cleanTour.status || 'published',
        featuredImage: cleanTour.featuredImage || (cleanTour.gallery && cleanTour.gallery[0]) || '',
        gallery: Array.isArray(cleanTour.gallery) ? cleanTour.gallery : [],
        highlights: Array.isArray(cleanTour.highlights) ? cleanTour.highlights : [],
        inclusions: Array.isArray(cleanTour.inclusions) ? cleanTour.inclusions : [],
        exclusions: Array.isArray(cleanTour.exclusions) ? cleanTour.exclusions : [],
        packages: Array.isArray(cleanTour.packages) ? cleanTour.packages : [],
        itinerary: Array.isArray(cleanTour.itinerary) ? cleanTour.itinerary : [],
        categoryId: cleanTour.categoryId || '',
        locationId: cleanTour.locationId || '',
        tourTypeId: cleanTour.tourTypeId || '',
        supplierId: currentUserProfile?.role === 'supplier' ? currentUserProfile.uid : (cleanTour.supplierId || ''),
        supplierName: currentUserProfile?.role === 'supplier' ? currentUserProfile.displayName : (cleanTour.supplierName || ''),
        tenantId: activeTenantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      try {
        await addDoc(collection(db, 'tours'), tourDataToSave);
        count++;
      } catch (error) {
        console.error("Error importing tour:", error);
        handleFirestoreError(error, OperationType.WRITE, 'tours');
      }
    }

    return count;
  };

  // Helper for adding/removing items in arrays
  const addArrayItem = (field: keyof Tour, defaultValue: any) => {
    const current = Array.isArray(formData[field]) ? (formData[field] as any[]) : [];
    const newList = [...current, defaultValue];
    setFormData({ ...formData, [field]: newList });
    
    // Automatically expand the new item
    if (field === 'packages') {
      setExpandedPackages(prev => [...prev, current.length]);
    } else if (field === 'itinerary') {
      setExpandedItinerary(prev => [...prev, current.length]);
    }
  };

  const updateArrayItem = (field: keyof Tour, index: number, value: any) => {
    const current = Array.isArray(formData[field]) ? [...(formData[field] as any[])] : [];
    current[index] = value;
    setFormData({ ...formData, [field]: current });
  };

  const removeArrayItem = (field: keyof Tour, index: number) => {
    const current = Array.isArray(formData[field]) ? [...(formData[field] as any[])] : [];
    current.splice(index, 1);
    setFormData({ ...formData, [field]: current });

    // Update expanded states
    if (field === 'packages') {
      setExpandedPackages(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    } else if (field === 'itinerary') {
      setExpandedItinerary(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    }
  };

  const handleItineraryImageUpload = async (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      const newItinerary = [...(formData.itinerary || [])];
      newItinerary[index] = { ...newItinerary[index], image: url };
      setFormData({ ...formData, itinerary: newItinerary });
    } catch (error) {
      alert("Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // File Upload to Imgbb (Multi-file Support)
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file as File));
      const urls = await Promise.all(uploadPromises);
      const currentGallery = formData.gallery || [];
      setFormData({ ...formData, gallery: [...currentGallery, ...urls] });
    } catch (error) {
      alert("Upload failed. Make sure your IMGBB API key is correct.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'basic', label: 'Basic Info', icon: Layout },
    { id: 'content', label: 'Highlights', icon: ImageIcon },
    { id: 'inclusions', label: 'Incl/Excl', icon: CheckCircle },
    { id: 'pricing', label: 'Pricing & Pkgs', icon: DollarSign },
    { id: 'itinerary', label: 'Itinerary', icon: MapIcon },
    ...(formData.tourDurationType === 'multi_day' ? [
      { id: 'accommodations' as Tab, label: 'Hotel & Accommodations', icon: Hotel },
      { id: 'guides' as Tab, label: 'Guide Options', icon: UserCheck },
    ] : []),
    { id: 'addOns', label: 'Add-ons', icon: PlusCircle },
    { id: 'info', label: 'Important Info', icon: ShieldAlert },
    { id: 'faq', label: 'Policies & FAQ', icon: Info },
    { id: 'seo', label: 'SEO Settings', icon: Globe },
  ];

  const seedDummyData = async () => {
    // Get the first supplier to assign dummy tours to if exists
    const firstSupplier = users.find(u => u.role === 'supplier');
    const supplierId = firstSupplier?.uid || '';
    const supplierName = firstSupplier ? (firstSupplier.companyName || firstSupplier.displayName) : '';

    const dummyTours: Partial<Tour>[] = [
      {
        title: "Ultimate Bali Adventure: Jungle & Beaches",
        slug: "ultimate-bali-adventure",
        supplierId,
        supplierName,
        status: 'published',
        description: "Experience the best of Bali in this 7-day comprehensive tour. From the lush jungles of Ubud to the pristine beaches of Uluwatu, this tour covers the island's most iconic spots. You'll visit ancient temples, witness traditional kecak dances, and enjoy world-class surf breaks. Our expert local guides will ensure you get an authentic experience away from the crowds.",
        highlights: ["Sunrise hike at Mount Batur", "Ubud Monkey Forest visit", "Tegalalang Rice Terrace tour", "Surfing lessons in Canggu"],
        inclusions: ["6 nights accommodation", "Daily breakfast", "Private transport"],
        exclusions: ["International flights", "Travel insurance", "Personal expenses"],
        itinerary: [
          { day: 1, title: "Arrival in Denpasar", description: "Pick up from airport and check-in at your hotel in Seminyak." },
          { day: 2, title: "Cultural Ubud", description: "Visit the Monkey Forest and Tegalalang Rice Terraces." }
        ],
        importantInfo: "Bring comfortable walking shoes and swimwear.",
        languages: ["English", "Indonesian"],
        location: "Ubud & Seminyak",
        locationMapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1010372!2d114.475!3d-8.45!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd141d3e8101539%3A0x740dfc3444053b6!2sBali!5e0!3m2!1sen!2sid!4v1713480000000!5m2!1sen!2sid",
        duration: "7 Days",
        gallery: ["https://picsum.photos/seed/bali-jungle/1200/800", "https://picsum.photos/seed/bali-beach/1200/800", "https://picsum.photos/seed/bali-temple/1200/800"],
        regularPrice: 1200,
        discountPrice: 999,
        packages: [
          {
            name: "Standard Package",
            inclusions: ["Airport Transfer", "Breakfast"],
            exclusions: ["Lunch", "Dinner"],
            tiers: [{ minParticipants: 1, maxParticipants: 10, adultPrice: 999, childPrice: 799 }]
          }
        ],
        faqs: [{ question: "Is it difficult?", answer: "Moderate fitness required." }]
      },
      {
        title: "Nusa Penida Island Escape",
        slug: "nusa-penida-escape",
        supplierId,
        supplierName,
        status: 'published',
        description: "Rugged Nusa islands adventure.",
        highlights: ["Broken Beach", "Angel Billabong"],
        itinerary: [{ day: 1, title: "Arrival", description: "Boat to Nusa." }],
        location: "Nusa Penida",
        duration: "3 Days",
        gallery: ["https://picsum.photos/seed/nusa1/1200/800"],
        regularPrice: 450,
        packages: [
          {
            name: "Standard",
            inclusions: ["Boat Transfer"],
            exclusions: ["Dinner"],
            tiers: [{ minParticipants: 1, maxParticipants: 10, adultPrice: 450, childPrice: 350 }]
          }
        ]
      }
    ];

    try {
      const activeTenantId = getActiveTenantId() || '';
      for (const tour of dummyTours) {
        await addDoc(collection(db, 'tours'), {
          ...tour,
          tenantId: activeTenantId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      // Seed urgency points if none exist
      if (urgencyPoints.length === 0) {
        const defaultUrgency = [
          { title: "Free Cancellation", description: "Up to 24 hours in advance", icon: "CheckCircle", tenantId: activeTenantId },
          { title: "Instant Confirmation", description: "Receive your voucher immediately", icon: "Clock", tenantId: activeTenantId },
          { title: "No Hidden Fees", description: "All taxes and service fees included", icon: "Calendar", tenantId: activeTenantId }
        ];
        defaultUrgency.forEach(p => addDoc(collection(db, 'urgencyPoints'), p));
      }

      // Seed a sample page if none exist
      const pagesSnap = await getDocs(collection(db, 'pages'));
      if (pagesSnap.empty) {
        await addDoc(collection(db, 'pages'), {
          title: "Terms and Conditions",
          slug: "terms-and-conditions",
          content: "Welcome to Bali Adventours. By booking with us, you agree to...",
          updatedAt: serverTimestamp()
        });
      }
      
      alert("Dummy tours, urgency points, and pages seeded successfully!");
    } catch (error) {
       console.error("Error seeding", error);
       alert("Failed to seed. Make sure you are an admin.");
    }
  };

  const ScheduleCalendar = () => {
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    // Data is managed by parent Admin component
    const loading = false;

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    const getBookingsForDay = (day: Date) => {
      return bookings.filter(b => {
        try {
          const bookingDate = parseISO(b.date);
          return isSameDay(bookingDate, day);
        } catch (e) {
          return false;
        }
      });
    };

    const nextMonth = () => setViewDate(addMonths(viewDate, 1));
    const previousMonth = () => setViewDate(subMonths(viewDate, 1));
    const goToToday = () => {
      setViewDate(new Date());
      setSelectedDate(new Date());
    };

    const selectedDayBookings = getBookingsForDay(selectedDate);
    const totalGuests = selectedDayBookings.reduce((sum, b) => sum + ((b.participants?.adults || 0) + (b.participants?.children || 0)), 0);
    const totalRevenue = selectedDayBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tour Schedule Calendar</h2>
            <p className="text-gray-500 font-medium text-sm">View and manage your tour bookings by date</p>
          </div>
          <button 
            onClick={() => setActiveMenu('bookings')}
            className="px-6 py-3 rounded-xl border-2 border-gray-100 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <Icons.List className="h-4 w-4" /> View All Bookings
          </button>
        </div>

        <div className="bg-white rounded-[10px] border border-gray-100 shadow-sm overflow-hidden p-8">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2">
                 <button onClick={previousMonth} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 group transition-all">
                    <Icons.ChevronLeft className="h-5 w-5 group-hover:text-gray-900" />
                 </button>
                 <h3 className="text-xl font-black text-gray-900 min-w-[160px] text-center">
                    {format(viewDate, 'MMMM yyyy')}
                 </h3>
                 <button onClick={nextMonth} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 group transition-all">
                    <Icons.ChevronRight className="h-5 w-5 group-hover:text-gray-900" />
                 </button>
               </div>
            </div>
            <button 
              onClick={goToToday}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-[0.1em] hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-orange-100"
            >
              <Icons.Calendar className="h-4 w-4" /> Today
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-50 py-4 text-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{day}</span>
              </div>
            ))}
            
            {calendarDays.map((day, idx) => {
              const dayBookings = getBookingsForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const guestsCount = dayBookings.reduce((sum, b) => sum + ((b.participants?.adults || 0) + (b.participants?.children || 0)), 0);

              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[140px] bg-white p-4 transition-all cursor-pointer relative",
                    !isCurrentMonth && "bg-gray-50/30",
                    isSelected && "ring-2 ring-primary ring-inset z-10 bg-orange-50/30"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-sm font-black transition-colors",
                      !isCurrentMonth ? "text-gray-300" : isToday(day) ? "text-primary" : "text-gray-500",
                      isSelected && "text-primary"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayBookings.length > 0 && (
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        dayBookings.some(b => b.status === 'confirmed') ? "bg-orange-500" : "bg-amber-500"
                      )} />
                    )}
                  </div>

                  {dayBookings.length > 0 && isCurrentMonth && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-gray-900 leading-tight">
                        {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                         <Icons.Users className="h-2.5 w-2.5" />
                         {guestsCount} people
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                <p className="text-gray-500 font-bold text-sm">
                  {selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
              <div className="flex items-center gap-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Guests</p>
                    <p className="text-2xl font-black text-gray-900">{totalGuests}</p>
                 </div>
                 <div className="w-px h-10 bg-gray-100" />
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
                    <p className="text-2xl font-black text-primary font-mono">{formatPrice(totalRevenue)}</p>
                 </div>
              </div>
           </div>

           <div className="grid gap-4">
              {selectedDayBookings.map(booking => (
                <div key={booking.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-primary/50 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shrink-0">
                         <Icons.MapPin className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                         <div className="flex items-center gap-3">
                           <h4 className="font-black text-gray-900 text-lg">{booking.tourTitle}</h4>
                           <div className="flex gap-2">
                             <span className={cn(
                               "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                               booking.status === 'confirmed' ? "bg-orange-100 text-orange-700" :
                               booking.status === 'cancelled' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                             )}>
                               {booking.status}
                             </span>
                             {booking.bookingSource && (
                               <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200">
                                 {booking.bookingSource}
                               </span>
                             )}
                           </div>
                         </div>
                         <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-400">Guest:</span>
                               <span className="text-xs font-black text-gray-700">{booking.customerData?.fullName || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-400">Email:</span>
                               <span className="text-xs font-bold text-gray-700">{booking.customerData?.email || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-400">Guests:</span>
                               <span className="text-xs font-black text-gray-700">{(booking.participants?.adults || 0) + (booking.participants?.children || 0)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-400">Total:</span>
                               <span className="text-xs font-black text-primary font-mono">{formatPrice(booking.totalAmount)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-400">Guide:</span>
                               <span className="text-xs font-black text-primary uppercase tracking-tight">{booking.assignedGuideName || 'Not Assigned'}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                   <button 
                     onClick={() => {
                        setGlobalSelectedBooking(booking);
                        setOriginalBooking(booking);
                        setIsBookingDetailOpen(true);
                     }}
                     className="px-6 py-3 rounded-xl border-2 border-gray-50 text-gray-900 font-black text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all self-end md:self-center"
                   >
                     View Details
                   </button>
                </div>
              ))}               {selectedDayBookings.length === 0 && (
                <div className="p-12 text-center bg-gray-50/50 rounded-[10px] border border-gray-100 border-dashed">
                  <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No tours scheduled for this day</p>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  };

  const GuideManager = () => {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [editingGuide, setEditingGuide] = useState<Guide | null>(null);

    useEffect(() => {
      if (!currentUserProfile) return;
      const isSupplier = currentUserProfile.role === 'supplier';
      
      let q;
      if (isSupplier) {
        q = query(collection(db, 'guides'), where('supplierId', '==', currentUserProfile.uid), orderBy('name', 'asc'));
      } else {
        q = query(collection(db, 'guides'), orderBy('name', 'asc'));
      }

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          setGuides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guide)));
          setLoading(false);
        },
        (error) => {
          console.error("Guide fetch error:", error);
          // Fallback if index missing
          if (isSupplier) {
            onSnapshot(query(collection(db, 'guides'), where('supplierId', '==', currentUserProfile.uid)), (snap) => {
               setGuides(snap.docs.map(d => ({ id: d.id, ...d.data() } as Guide)));
            });
          }
          setLoading(false);
        }
      );
      return unsubscribe;
    }, [currentUserProfile?.uid]);

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!currentUserProfile) return;

      try {
        if (editingGuide) {
          await updateDoc(doc(db, 'guides', editingGuide.id), {
            name,
            whatsapp,
          });
          setEditingGuide(null);
        } else {
          await addDoc(collection(db, 'guides'), {
            name,
            whatsapp,
            isActive: true,
            supplierId: currentUserProfile.role === 'supplier' ? currentUserProfile.uid : null,
            createdByAdmin: currentUserProfile.role === 'admin'
          });
        }
        setName('');
        setWhatsapp('');
      } catch (err) {
        handleFirestoreError(err, 'write' as any, editingGuide ? `guides/${editingGuide.id}` : 'guides');
      }
    };

    const toggleActive = async (guide: Guide) => {
      await updateDoc(doc(db, 'guides', guide.id), { isActive: !guide.isActive });
    };

    const handleDelete = async (id: string) => {
      if (confirm("Delete this guide?")) {
        try {
          await deleteDoc(doc(db, 'guides', id));
          alert("Guide deleted successfully");
        } catch (error) {
          console.error("Delete failed", error);
          alert("Failed to delete guide. Check permissions.");
        }
      }
    };

    if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Drivers & Guides</h2>
            <p className="text-gray-500 font-medium text-sm">Manage your field team and their contact details.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name</label>
            <input 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ketut Wijaya"
              className="w-full rounded-xl border border-gray-100 p-4 font-bold text-sm focus:border-primary outline-none transition-all bg-gray-50/50"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">WhatsApp Number</label>
            <input 
              required
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="e.g. 628123456789"
              className="w-full rounded-xl border border-gray-100 p-4 font-bold text-sm focus:border-primary outline-none transition-all bg-gray-50/50"
            />
          </div>
          <div className="flex gap-2 self-end h-[58px]">
            <button type="submit" className="bg-primary text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all">
              {editingGuide ? 'Update' : 'Add'} Driver/Guide
            </button>
            {editingGuide && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingGuide(null);
                  setName('');
                  setWhatsapp('');
                }} 
                className="bg-gray-100 text-gray-500 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map(guide => (
            <div key={guide.id} className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm hover:border-primary/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center text-primary font-black border border-orange-100">
                    {guide.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900">{guide.name}</h4>
                    <a 
                      href={`https://wa.me/${guide.whatsapp}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="h-3 w-3" /> +{guide.whatsapp}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => {
                        setEditingGuide(guide);
                        setName(guide.name);
                        setWhatsapp(guide.whatsapp);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 text-primary hover:bg-orange-50 rounded-lg transition-all"
                      title="Edit"
                   >
                      <Icons.Edit2 className="h-4 w-4" />
                   </button>
                   <button 
                      onClick={() => toggleActive(guide)}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        guide.isActive ? "text-primary bg-orange-50 border border-orange-100" : "text-gray-400 bg-gray-50 border border-gray-100"
                      )}
                      title={guide.isActive ? "Active" : "Inactive"}
                   >
                      <CheckCheck className="h-4 w-4" />
                   </button>
                   <button onClick={() => handleDelete(guide.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="h-4 w-4" />
                   </button>
                </div>
              </div>
            </div>
          ))}
          {guides.length === 0 && (
            <div className="col-span-full p-20 text-center bg-gray-50/50 rounded-[20px] border border-gray-100 border-dashed">
               <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No guides or drivers registered yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const LiveInventoryManager = () => {
    const [selectedTourId, setSelectedTourId] = useState<string>('all');
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [editingCapacityId, setEditingCapacityId] = useState<string | null>(null);
    const [tempCapacity, setTempCapacity] = useState<number>(0);

    useEffect(() => {
      let q = query(collection(db, "inventory"));
      if (selectedTourId !== 'all') {
        q = query(collection(db, "inventory"), where("tourId", "==", selectedTourId));
      }
      
      const unsub = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInventoryItems(items);
      });
      return () => unsub();
    }, [selectedTourId]);

    const filteredInventory = useMemo(() => {
      // Map existing records by tourId + timeSlot
      const inventoryMap = new Map();
      inventoryItems.forEach(item => {
        if (item.date === selectedDate) {
          inventoryMap.set(`${item.tourId}_${item.timeSlot}`, item);
        }
      });

      // Show all tours or selected tour
      const toursToShow = selectedTourId === 'all' ? tours : tours.filter(t => t.id === selectedTourId);
      
      const dayRecords: any[] = [];
      toursToShow.forEach(tour => {
        const slots = tour.timeSlots?.length ? tour.timeSlots : ['daily'];
        slots.forEach(slot => {
          const existing = inventoryMap.get(`${tour.id}_${slot}`);
          if (existing) {
            dayRecords.push(existing);
          } else if (tour.maxCapacity || tour.slotCapacity) {
             dayRecords.push({
               id: `temp_${tour.id}_${slot}`,
               tourId: tour.id,
               date: selectedDate,
               timeSlot: slot,
               bookedCount: 0,
               maxCapacity: (tour.slotCapacity && slot !== 'daily') ? tour.slotCapacity : (tour.maxCapacity || 999),
               isPlaceholder: true
             });
          }
        });
      });

      return dayRecords;
    }, [inventoryItems, selectedDate, selectedTourId, tours]);

    const handleUpdateCapacity = async (item: any) => {
      if (tempCapacity < item.bookedCount) {
        alert("Capacity cannot be less than already booked spots.");
        return;
      }
      
      setLoading(true);
      try {
        const invId = item.isPlaceholder ? `${item.tourId}_${item.date}_${item.timeSlot}` : item.id;
        const invRef = doc(db, 'inventory', invId);
        
        if (item.isPlaceholder) {
          await setDoc(invRef, {
            tourId: item.tourId,
            date: item.date,
            timeSlot: item.timeSlot,
            bookedCount: 0,
            maxCapacity: tempCapacity,
            updatedAt: serverTimestamp()
          });
        } else {
          await updateDoc(invRef, {
            maxCapacity: tempCapacity,
            updatedAt: serverTimestamp()
          });
        }
        setEditingCapacityId(null);
      } catch (err) {
        console.error(err);
        alert("Failed to update capacity.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-8 font-sans">
        <div className="bg-white rounded-[10px] p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
                Live <span className="text-primary tracking-normal">Inventory</span>
              </h2>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <p className="text-sm text-gray-500 font-medium tracking-tight">Real-time occupancy tracking for {selectedDate}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setIsBulkOpen(true)}
                className="px-6 py-3 bg-primary text-white rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-100 flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" /> Bulk Setup
              </button>
              <button 
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                className="px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Today
              </button>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter by Tour</label>
                <select 
                  value={selectedTourId}
                  onChange={(e) => setSelectedTourId(e.target.value)}
                  className="w-full md:w-64 bg-gray-50 border border-gray-100 rounded-[10px] px-4 py-3 text-xs font-bold focus:border-primary focus:bg-white outline-none transition-all appearance-none"
                >
                  <option value="all">All Tours</option>
                  {tours.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">View Date</label>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-gray-50 border border-gray-100 rounded-[10px] px-4 py-3 text-xs font-bold focus:border-primary focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredInventory.map((item) => {
            const tour = tours.find(t => t.id === item.tourId);
            const remaining = Math.max(0, item.maxCapacity - item.bookedCount);
            const percentage = Math.min(100, Math.round((item.bookedCount / item.maxCapacity) * 100));
            
            return (
              <div key={item.id} className={cn(
                "bg-white rounded-[15px] border p-6 shadow-sm hover:shadow-md transition-all group",
                item.isPlaceholder ? "border-gray-50 opacity-80" : "border-orange-100"
              )}>
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform",
                    item.isPlaceholder ? "bg-gray-50 text-gray-400" : "bg-orange-50 text-primary"
                  )}>
                    <Icons.Database className="h-5 w-5" />
                  </div>
                  <div className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                    remaining === 0 ? "bg-red-50 text-red-600 border border-red-100" :
                    remaining <= 5 ? "bg-orange-50 text-orange-600 border border-orange-100" :
                    "bg-orange-50 text-primary border border-orange-100"
                  )}>
                    {remaining === 0 ? 'Sold Out' : `${remaining} Spots Left`}
                  </div>
                </div>

                <h3 className="font-black text-gray-900 leading-tight mb-1 line-clamp-1">{tour?.title || 'Unknown Tour'}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.date}</span>
                  <div className="h-1 w-1 rounded-full bg-gray-200" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.timeSlot}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>{item.isPlaceholder ? 'Available' : 'Occupancy'}</span>
                    {editingCapacityId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          autoFocus
                          value={tempCapacity}
                          onChange={(e) => setTempCapacity(parseInt(e.target.value) || 0)}
                          className="w-16 bg-gray-50 border border-orange-500 rounded px-1 py-0.5 text-center text-xs font-bold outline-none"
                        />
                        <button onClick={() => handleUpdateCapacity(item)} disabled={loading} className="text-orange-500 p-0.5 hover:bg-orange-50 rounded">
                          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        </button>
                        <button onClick={() => setEditingCapacityId(null)} className="text-red-400 p-0.5 hover:bg-red-50 rounded">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => {
                          setTempCapacity(item.maxCapacity);
                          setEditingCapacityId(item.id);
                        }}
                        className="text-gray-900 cursor-pointer hover:bg-gray-50 px-1 rounded transition-colors"
                        title="Click to edit capacity"
                      >
                        {item.bookedCount} / {item.maxCapacity}
                      </div>
                    )}
                  </div>
                  <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000",
                        percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-orange-500" : "bg-primary"
                      )} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                   {item.isPlaceholder ? (
                     <div className="text-[9px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1">
                       <Icons.CheckCircle2 className="h-3 w-3" /> Fully Available
                     </div>
                   ) : (
                     <button 
                       onClick={() => {
                          if (confirm(`Reset inventory for ${tour?.title} on ${item.date}?`)) {
                             updateDoc(doc(db, "inventory", item.id), { bookedCount: 0 });
                          }
                       }}
                       className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
                     >
                       Reset Count
                     </button>
                   )}
                   <div className="text-[9px] font-black text-gray-200 uppercase tracking-widest">
                     ID: {tour?.id?.substring(0, 4)}
                   </div>
                </div>
              </div>
            );
          })}
          
          {filteredInventory.length === 0 && (
            <div className="col-span-full bg-white p-20 rounded-[15px] border border-dashed border-gray-200 text-center">
              <Icons.Database className="h-10 w-10 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No tours found with capacity limits.</p>
              <p className="text-[10px] text-gray-400 mt-1 italic">Set a Daily Capacity in the Pricing tab of a tour to track inventory.</p>
            </div>
          )}
        </div>

        <BulkAvailabilityModal 
          isOpen={isBulkOpen}
          onClose={() => setIsBulkOpen(false)}
          tours={tours}
        />
      </div>
    );

  };

  const BookingManager = ({ initialView }: { initialView?: 'list' | 'daily' | 'calendar' }) => {
    if (Date.now() < 0) console.log(OldBookingManagerReserved);
    return (
      <BookingManagementPanel
        setGlobalSelectedBooking={setGlobalSelectedBooking}
        setOriginalBooking={setOriginalBooking}
        setIsBookingDetailOpen={setIsBookingDetailOpen}
        setAssignBooking={setAssignBooking}
        setIsAssignOpen={setIsAssignOpen}
        handlePrintManifest={handlePrintManifest}
        updateBookingStatus={updateBookingStatus}
        handleDeleteBooking={handleDeleteBooking}
        allGuides={allGuides}
        currentUserProfile={currentUserProfile}
        bookings={bookings}
        initialView={initialView}
        tours={tours}
      />
    );
  };

  const OldBookingManagerReserved = ({ initialView }: { initialView?: 'list' | 'daily' | 'calendar' }) => {
    const [viewMode, setViewMode] = useState<'list' | 'daily' | 'calendar'>(initialView || 'list');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterScheduled, setFilterScheduled] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
      if (initialView) {
        setViewMode(initialView);
      }
    }, [initialView]);

    // Daily dispatch view states
    const [selectedDailyDate, setSelectedDailyDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [dispatchFilter, setDispatchFilter] = useState<string>('all');

    // Calendar view states
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const guides = allGuides;

    const daysAroundSelected = useMemo(() => {
      try {
        const pivotStr = selectedDailyDate || format(new Date(), 'yyyy-MM-dd');
        const pivotDate = parseISO(pivotStr);
        return Array.from({ length: 7 }).map((_, i) => {
          const d = addDays(pivotDate, i - 3);
          const dateStr = format(d, 'yyyy-MM-dd');
          const dayName = format(d, 'EEE');
          const dayNum = format(d, 'd');
          
          const count = bookings
            .filter(b => b.date === dateStr)
            .filter(b => {
              if (currentUserProfile?.role === 'supplier') {
                return b.supplierId === currentUserProfile.uid;
              }
              return true;
            })
            .filter(b => b.status !== 'cancelled').length;
          
          return {
            dateStr,
            dayName,
            dayNum,
            count,
            isCurrent: dateStr === selectedDailyDate,
            isToday: dateStr === format(new Date(), 'yyyy-MM-dd')
          };
        });
      } catch (e) {
        return [];
      }
    }, [selectedDailyDate, bookings, currentUserProfile]);

    const dailyStats = useMemo(() => {
      const activeForDay = bookings
        .filter(b => b.date === selectedDailyDate)
        .filter(b => {
          if (currentUserProfile?.role === 'supplier') {
            return b.supplierId === currentUserProfile.uid;
          }
          return true;
        });
      const total = activeForDay.length;
      const cancelledCount = activeForDay.filter(b => b.status === 'cancelled').length;
      const activeCount = total - cancelledCount;
      
      const totalPax = activeForDay
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + ((b.participants?.adults || 0) + (b.participants?.children || 0)), 0);
        
      const assigned = activeForDay
        .filter(b => b.status !== 'cancelled' && b.assignedGuideId)
        .length;
        
      const unassigned = activeCount - assigned;
      
      return {
        total,
        totalPax,
        assigned,
        activeCount,
        unassigned,
        cancelledCount
      };
    }, [bookings, selectedDailyDate, currentUserProfile]);

    const filteredBookingsForSelectedDay = useMemo(() => {
      const dayBookings = bookings
        .filter(b => b.date === selectedDailyDate)
        .filter(b => {
          if (currentUserProfile?.role === 'supplier') {
            return b.supplierId === currentUserProfile.uid;
          }
          return true;
        });
      
      return dayBookings.filter(b => {
        if (dispatchFilter === 'all') return true;
        if (dispatchFilter === 'unassigned') return b.status !== 'cancelled' && !b.assignedGuideId;
        if (dispatchFilter === 'assigned') return b.status !== 'cancelled' && b.assignedGuideId;
        if (dispatchFilter === 'cancelled') return b.status === 'cancelled';
        return true;
      });
    }, [bookings, selectedDailyDate, dispatchFilter, currentUserProfile]);

    // Calendar Calculations
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    const getBookingsForDay = (day: Date) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return bookings
        .filter(b => b.date === dayStr)
        .filter(b => {
          if (currentUserProfile?.role === 'supplier') {
            return b.supplierId === currentUserProfile.uid;
          }
          return true;
        })
        .filter(b => filterStatus === 'all' || b.status === filterStatus)
        .filter(b => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          const c: any = b.customerData || {};
          return (
            (b.id || '').toLowerCase().includes(q) || 
            (c.fullName || '').toLowerCase().includes(q) || 
            (c.email || '').toLowerCase().includes(q) ||
            (b.tourTitle || '').toLowerCase().includes(q) ||
            (c.phone || '').toLowerCase().includes(q)
          );
        });
    };

    const nextMonth = () => setViewDate(addMonths(viewDate, 1));
    const previousMonth = () => setViewDate(subMonths(viewDate, 1));
    const goToToday = () => {
      setViewDate(new Date());
      setSelectedDate(new Date());
    };

    const selectedDayBookings = getBookingsForDay(selectedDate);
    const totalGuests = selectedDayBookings.reduce((sum, b) => sum + ((b.participants?.adults || 0) + (b.participants?.children || 0)), 0);
    const totalRevenue = selectedDayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const filteredBookings = useMemo(() => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

      return bookings
        .filter(b => {
          if (currentUserProfile?.role === 'supplier') {
            return b.supplierId === currentUserProfile.uid;
          }
          return true;
        })
        .filter(b => filterStatus === 'all' || b.status === filterStatus)
        .filter(b => {
          if (filterScheduled === 'all') return true;
          if (filterScheduled === 'today') return b.date === todayStr;
          if (filterScheduled === 'tomorrow') return b.date === tomorrowStr;
          if (filterScheduled === 'other') return b.date !== todayStr && b.date !== tomorrowStr;
          return true;
        })
        .filter(b => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          const c: any = b.customerData || {};
          return (
            (b.id || '').toLowerCase().includes(q) || 
            (c.fullName || '').toLowerCase().includes(q) || 
            (c.email || '').toLowerCase().includes(q) ||
            (b.tourTitle || '').toLowerCase().includes(q) ||
            (c.phone || '').toLowerCase().includes(q)
          );
        })
        .sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime(); // newest first
        });
    }, [bookings, filterStatus, filterScheduled, searchQuery, currentUserProfile]);

    const handleQuickStatusChange = async (booking: Booking, newStatus: any) => {
      try {
        const newLog: BookingLog = {
          timestamp: new Date().toISOString(),
          message: `Booking Status updated to: ${newStatus.toUpperCase()}`,
          type: 'status_change',
          userName: auth.currentUser?.displayName || auth.currentUser?.email || 'Admin'
        };

        await updateDoc(doc(db, 'bookings', booking.id), {
          status: newStatus,
          updatedAt: serverTimestamp(),
          logs: [...(booking.logs || []), newLog]
        });
        alert(`Status updated to ${newStatus.toUpperCase()}`);
      } catch (err) {
        console.error(err);
        alert("Failed to change status.");
      }
    };

    // Calculate quick stats
    const stats = useMemo(() => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const active = bookings.filter(b => {
        if (currentUserProfile?.role === 'supplier') {
          return b.supplierId === currentUserProfile.uid;
        }
        return true;
      });
      const todayBookings = active.filter(b => b.date === todayStr && b.status !== 'cancelled').length;
      const totalAmount = active.filter(b => b.status === 'confirmed' || b.status === 'completed')
                                .reduce((acc, current) => acc + (current.totalAmount || 0), 0);
      return {
        total: active.length,
        pending: active.filter(b => b.status === 'pending').length,
        today: todayBookings,
        revenue: totalAmount
      };
    }, [bookings, currentUserProfile]);


  
    return (
      <div className="space-y-6 text-gray-850 font-sans">
        
        {/* Simple Top KPI Stat Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Bookings</p>
            <p className="text-xl font-black text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Pending Bookings</p>
            <p className="text-xl font-black text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Active Trips Today</p>
            <p className="text-xl font-black text-primary mt-1">{stats.today}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Settled Revenue</p>
            <p className="text-xl font-black text-primary mt-1">{formatPrice(stats.revenue)}</p>
          </div>
        </div>

        {/* Simplified Header and Filters panel */}
        <div className="bg-white rounded-[12px] p-6 border border-gray-100 shadow-xs space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Booking Management
              </h2>
              <p className="text-xs text-gray-400 font-medium">Simple workspace to manage guest lists, assign guides, and track status.</p>
            </div>

            <div className="flex items-center gap-1 bg-gray-55 p-1 rounded-lg border border-gray-100 self-start xl:self-auto">
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "px-3.5 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer",
                  viewMode === 'list' 
                    ? "bg-white text-primary shadow-xs border border-gray-200" 
                    : "text-gray-400 hover:text-gray-655"
                )}
              >
                <Icons.List className="h-3.5 w-3.5" />
                List View
              </button>
              <button 
                onClick={() => setViewMode('daily')}
                className={cn(
                  "px-3.5 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer",
                  viewMode === 'daily' 
                    ? "bg-white text-primary shadow-xs border border-gray-200" 
                    : "text-gray-400 hover:text-gray-655"
                )}
              >
                <Icons.Clock4 className="h-3.5 w-3.5" />
                Daily/Dispatch
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "px-3.5 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer",
                  viewMode === 'calendar' 
                    ? "bg-white text-primary shadow-xs border border-gray-200" 
                    : "text-gray-400 hover:text-gray-655"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Calendar View
              </button>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search guests, email, or tour..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 bg-gray-55 border border-transparent rounded-[8px] text-xs font-bold focus:border-primary focus:bg-white focus:ring-0 outline-none transition-all shadow-inner"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <Icons.X className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-105">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block font-sans">By Status:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wider outline-none text-gray-700 font-sans"
              >
                <option value="all">All Statuses</option>
                <option value="pending">🟡 Pending</option>
                <option value="review_required">🟣 Review Required</option>
                <option value="confirmed">🟢 Confirmed</option>
                <option value="completed">💙 Completed</option>
                <option value="cancelled">🔴 Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block font-sans">Scheduled:</span>
              <select
                value={filterScheduled}
                onChange={e => setFilterScheduled(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wider outline-none text-gray-700 font-sans"
              >
                <option value="all">All Scheduled</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="other">Other Day</option>
              </select>
            </div>

            <div className="ml-auto text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">
              Showing {filteredBookings.length} bookings
            </div>
          </div>
        </div>
  
        {/* Transparent global backdrop to close any active row dropdown overlay */}
        {openMenuId && (
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(null);
            }} 
          />
        )}

        {viewMode === 'list' && (
          <>
            <div className="hidden lg:block bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden min-h-[300px]">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left font-sans border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[140px]">ID / Date Info</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[160px]">Customer</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[200px]">Tour & Package</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[100px]">Financials</th>
                  {currentUserProfile?.role === 'admin' && (
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[120px]">Supplier</th>
                  )}
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[100px]">Source</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[120px]">Status</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center min-w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBookings.map((booking, idx) => {
                  const isLastRows = idx >= filteredBookings.length - 2 && filteredBookings.length > 2;
                  return (
                    <tr 
                      key={booking.id} 
                      className="hover:bg-gray-50/60 transition-colors cursor-pointer group" 
                      onClick={() => { 
                        setGlobalSelectedBooking(booking); 
                        setOriginalBooking(booking); 
                        setIsBookingDetailOpen(true); 
                      }}
                    >
                      <td className="px-5 py-5 border-r border-gray-50">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[10px] font-black text-primary tracking-tighter uppercase leading-none">#{booking.id.slice(-8)}</span>
                          <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{booking.date}</span>
                          {booking.time && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Icons.Clock className="h-3.5 w-3.5 text-gray-300" />
                              <span className="text-[10px] text-gray-400 font-bold">{booking.time}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-5 border-r border-gray-50">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 group-hover:text-primary transition-colors leading-tight">{booking.customerData?.fullName || 'N/A'}</span>
                          <span className="text-[10px] text-gray-400 font-bold tracking-tight mt-0.5">{booking.customerData?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-5 border-r border-gray-50">
                        <div className="max-w-[220px]">
                          <span className="text-xs font-black text-gray-900 block truncate leading-tight mb-1">{booking.tourTitle}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-primary uppercase tracking-wider">{booking.packageName}</span>
                          </div>
                          {booking.assignedGuideName && (
                            <div className="mt-1 flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-md py-0.5 px-1.5 w-fit">
                              <Icons.User className="h-2.5 w-2.5 text-blue-500" />
                              <span className="text-[8px] font-black text-blue-600 uppercase tracking-wide">
                                {booking.assignedGuideName}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-5 border-r border-gray-50">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 leading-none mb-1">{formatPrice(booking.totalAmount)}</span>
                          <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{(booking.paymentMethod || 'manual').replace('_', ' ')}</span>
                        </div>
                      </td>
                      {currentUserProfile?.role === 'admin' && (
                        <td className="px-5 py-5 border-r border-gray-50">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-blue-600 truncate max-w-[120px]">{booking.supplierName || 'System'}</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Vendor</span>
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-5 border-r border-gray-50">
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-md w-fit mb-0.5 border tracking-[0.05em]",
                            booking.bookingSource === 'Klook' ? "bg-orange-50 text-orange-600 border-orange-100" :
                            booking.bookingSource === 'Viator' ? "bg-yellow-50 text-yellow-600 border-yellow-100" :
                            booking.bookingSource === 'GetYourGuide' ? "bg-red-50 text-red-600 border-red-100" :
                            booking.bookingSource === 'Manual' ? "bg-purple-50 text-purple-600 border-purple-100" :
                            booking.bookedBy?.role === 'agent' ? "bg-blue-50 text-blue-600 border-blue-100" :
                            "bg-orange-50 text-primary border-orange-100"
                          )}>
                            {booking.bookingSource || (booking.bookedBy ? booking.bookedBy.role : 'Direct')}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-5 border-r border-gray-50">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.05em]",
                          booking.status === 'completed' ? "bg-blue-50 text-blue-700 border border-blue-100" :
                          booking.status === 'confirmed' ? "bg-orange-50 text-orange-700 border border-orange-100" :
                          booking.status === 'cancelled' ? "bg-red-50 text-red-700 border-red-100" :
                          booking.status === 'review_required' ? "bg-blue-50 text-blue-700 border border-blue-100 animate-pulse" :
                          "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            booking.status === 'completed' ? "bg-blue-500" :
                            booking.status === 'confirmed' ? "bg-orange-500" :
                            booking.status === 'cancelled' ? "bg-red-500" :
                            booking.status === 'review_required' ? "bg-blue-500" :
                            "bg-amber-500"
                          )} />
                          {booking.status.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-5 py-5 text-center">
                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {/* Primary, clean details callout */}
                            <button
                              onClick={() => {
                                setGlobalSelectedBooking(booking);
                                setOriginalBooking(booking);
                                setIsBookingDetailOpen(true);
                              }}
                              className="p-1.5 hover:bg-gray-100 text-gray-700 hover:text-black border border-gray-200 rounded-lg transition-all"
                              title="Full Details"
                            >
                              <Icons.Eye className="h-4 w-4" />
                            </button>
                            
                            {/* Interactive, premium actions dropdown menu */}
                            <button
                              onClick={() => setOpenMenuId(openMenuId === booking.id ? null : booking.id)}
                              className={cn(
                                "p-1.5 rounded-lg border transition-all text-gray-500 hover:text-black",
                                openMenuId === booking.id ? "bg-gray-100 border-gray-300" : "bg-white border-gray-200 hover:bg-gray-50"
                              )}
                              title="All Contextual Actions"
                            >
                              <Icons.MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>

                          {openMenuId === booking.id && (
                            <div className={cn(
                              "absolute right-0 w-60 rounded-xl bg-white border border-gray-200 shadow-2xl z-50 overflow-visible py-1 text-left animate-in fade-in slide-in-from-top-1 duration-150",
                              isLastRows ? "bottom-full mb-2" : "top-full mt-2"
                            )}>
                              <div className="px-3.5 py-2 text-[8px] font-black text-gray-400 uppercase border-b border-gray-50 tracking-widest flex justify-between items-center bg-gray-50">
                                <span>Ref: #{booking.id.slice(-6).toUpperCase()}</span>
                                <span className="font-bold text-primary">{booking.date}</span>
                              </div>

                              <button
                                onClick={() => {
                                  setGlobalSelectedBooking(booking);
                                  setOriginalBooking(booking);
                                  setIsBookingDetailOpen(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-black flex items-center gap-2.5 font-bold transition-colors"
                              >
                                <Icons.ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                                Edit Booking Details
                              </button>

                              <button
                                onClick={() => {
                                  handlePrintManifest(booking);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-black flex items-center gap-2.5 font-bold transition-colors"
                              >
                                <Icons.Printer className="h-3.5 w-3.5 text-gray-400" />
                                Print Manifest Sheet
                              </button>

                              <button
                                disabled={loadingStates.sendingWA}
                                onClick={async () => {
                                  setOpenMenuId(null);
                                  const template = commSettings?.whatsappTemplates?.booking_confirmation?.message || 
                                    "Hello {{customerName}}, your booking for {{tourTitle}} on {{date}} is confirmed.";
                                  const message = generateBookingMessage(template, booking);
                                  try {
                                    await sendCustomWhatsApp(booking.customerData?.phone || "" || '', message);
                                    alert("Message sent successfully via Whapi!");
                                  } catch (err) {
                                    console.error('[WhatsApp] API Error:', err);
                                    const link = getWhatsAppLink(booking.customerData?.phone || "" || '', message);
                                    window.open(link, '_blank');
                                  }
                                }}
                                className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-black flex items-center gap-2.5 font-bold transition-colors disabled:opacity-50"
                              >
                                <Icons.MessageSquare className="h-3.5 w-3.5 text-orange-500" />
                                Send Guest WhatsApp
                              </button>

                              <button
                                onClick={() => {
                                  setAssignBooking(booking);
                                  setIsAssignOpen(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-black flex items-center gap-2.5 font-bold transition-colors"
                              >
                                <Icons.Share2 className="h-3.5 w-3.5 text-blue-500" />
                                Assign Guide
                              </button>

                              {(booking.status === 'confirmed' || currentUserProfile?.role === 'admin') && (
                                <div className="border-t border-gray-100 my-1" />
                              )}

                              {booking.status === 'confirmed' && (
                                <button
                                  disabled={loadingStates.statusUpdating}
                                  onClick={async () => {
                                    setOpenMenuId(null);
                                    await updateBookingStatus(booking.id, 'completed');
                                  }}
                                  className="w-full px-4 py-1.5 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2.5 font-bold transition-colors disabled:opacity-50"
                                >
                                  {loadingStates.statusUpdating ? <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icons.CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />}
                                  Mark as Completed
                                </button>
                              )}

                              {(currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'staff') && (
                                <>
                                  {booking.status !== 'confirmed' && booking.status !== 'completed' && (
                                    <button 
                                      onClick={async () => {
                                        setOpenMenuId(null);
                                        await updateBookingStatus(booking.id, 'confirmed');
                                      }} 
                                      className="w-full px-4 py-2 text-xs text-primary hover:bg-orange-50 flex items-center gap-2.5 font-bold transition-colors"
                                    >
                                      <Icons.CheckCircle className="h-3.5 w-3.5 text-orange-500" />
                                      Confirm Payment
                                    </button>
                                  )}
                                  
                                  {booking.status !== 'cancelled' && (
                                    <button 
                                      onClick={async () => {
                                        setOpenMenuId(null);
                                        await updateBookingStatus(booking.id, 'cancelled');
                                      }} 
                                      className="w-full px-4 py-2 text-xs text-red-650 hover:bg-red-55 flex items-center gap-2.5 font-bold transition-colors"
                                    >
                                      <Icons.XCircle className="h-3.5 w-3.5 text-red-500" />
                                      Cancel Booking
                                    </button>
                                  )}

                                  {currentUserProfile?.role === 'admin' && (
                                    <button 
                                      onClick={async () => {
                                        setOpenMenuId(null);
                                        if (confirm("Permanently delete this booking record? This structural mutation cannot be undone.")) {
                                          await handleDeleteBooking(booking.id);
                                        }
                                      }} 
                                      className="w-full px-4 py-2 text-xs text-red-705 hover:bg-red-55 flex items-center gap-2.5 font-black transition-colors pt-2 border-t border-gray-100"
                                    >
                                      <Icons.Trash2 className="h-3.5 w-3.5 text-red-600" />
                                      Delete Permanently
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredBookings.length === 0 && (
              <div className="p-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                No bookings found matching current options.
              </div>
            )}
          </div>
        </div>

        {/* Mobile Interface (md and down) - Beautiful Card Layout */}
        <div className="block lg:hidden space-y-4">
          {filteredBookings.map((booking) => (
            <div 
              key={booking.id}
              className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4 relative hover:border-primary transition-all cursor-pointer"
              onClick={() => { 
                setGlobalSelectedBooking(booking); 
                setOriginalBooking(booking); 
                setIsBookingDetailOpen(true); 
              }}
            >
              {/* Mobile Card Header */}
              <div className="flex items-center justify-between border-b border-gray-50 pb-3 mt-0.5">
                <div className="flex flex-col">
                  <span className="font-mono text-xs font-black text-primary tracking-tight leading-none uppercase">#{booking.id.slice(-8)}</span>
                  <span className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                    Source: <span className="text-gray-600 font-black">{booking.bookingSource || 'Direct'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <span className={cn(
                    "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.05em] border-gray-200 border",
                    booking.status === 'completed' ? "bg-blue-50 text-blue-700" :
                    booking.status === 'confirmed' ? "bg-orange-50 text-orange-700" :
                    booking.status === 'cancelled' ? "bg-red-50 text-red-700" :
                    booking.status === 'review_required' ? "bg-blue-50 text-blue-700 animate-pulse" :
                    "bg-amber-50 text-amber-700"
                  )}>
                    {booking.status.replace('_', ' ')}
                  </span>
                  
                  {/* Dropdown triggers for mobile card actions */}
                  <div className="relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === booking.id ? null : booking.id)}
                      className={cn(
                        "p-1.5 rounded-lg border transition-all text-gray-500 hover:text-black",
                        openMenuId === booking.id ? "bg-gray-100 border-gray-300" : "bg-white border-gray-200"
                      )}
                    >
                      <Icons.MoreVertical className="h-4 w-4" />
                    </button>
                    
                    {openMenuId === booking.id && (
                      <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-gray-200 shadow-xl z-50 overflow-hidden py-1 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                        <button
                          onClick={() => {
                            setGlobalSelectedBooking(booking);
                            setOriginalBooking(booking);
                            setIsBookingDetailOpen(true);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-bold transition-colors"
                        >
                          <Icons.ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                          View / Edit Details
                        </button>

                        <button
                          onClick={() => {
                            handlePrintManifest(booking);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-bold transition-colors"
                        >
                          <Icons.Printer className="h-3.5 w-3.5 text-gray-400" />
                          Print Manifest Sheet
                        </button>

                        <button
                          disabled={loadingStates.sendingWA}
                          onClick={async () => {
                            setOpenMenuId(null);
                            const template = commSettings?.whatsappTemplates?.booking_confirmation?.message || 
                              "Hello {{customerName}}, your booking for {{tourTitle}} on {{date}} is confirmed.";
                            const message = generateBookingMessage(template, booking);
                            try {
                              await sendCustomWhatsApp(booking.customerData?.phone || "" || '', message);
                              alert("Message sent successfully!");
                            } catch (err) {
                              const link = getWhatsAppLink(booking.customerData?.phone || "" || '', message);
                              window.open(link, '_blank');
                            }
                          }}
                          className="w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-bold transition-colors"
                        >
                          <Icons.MessageSquare className="h-3.5 w-3.5 text-orange-500" />
                          WhatsApp Customer
                        </button>

                        <button
                          onClick={() => {
                            setAssignBooking(booking);
                            setIsAssignOpen(true);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-bold transition-colors"
                        >
                          <Icons.Share2 className="h-3.5 w-3.5 text-blue-500" />
                          Assign Guide
                        </button>

                        {(booking.status === 'confirmed' || currentUserProfile?.role === 'admin') && (
                          <div className="border-t border-gray-100 my-1" />
                        )}

                        {booking.status === 'confirmed' && (
                          <button
                            onClick={async () => {
                              setOpenMenuId(null);
                              await updateBookingStatus(booking.id, 'completed');
                            }}
                            className="w-full px-4 py-2.5 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2.5 font-bold transition-colors"
                          >
                            <Icons.CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                            Mark as Completed
                          </button>
                        )}

                        {(currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'staff') && (
                          <>
                            {booking.status !== 'confirmed' && booking.status !== 'completed' && (
                              <button 
                                onClick={async () => {
                                  setOpenMenuId(null);
                                  await updateBookingStatus(booking.id, 'confirmed');
                                }} 
                                className="w-full px-4 py-2.5 text-xs text-primary hover:bg-orange-50 flex items-center gap-2.5 font-bold transition-colors"
                              >
                                <Icons.CheckCircle className="h-3.5 w-3.5 text-orange-500" />
                                Confirm Payment
                              </button>
                            )}
                            
                            {booking.status !== 'cancelled' && (
                              <button 
                                onClick={async () => {
                                  setOpenMenuId(null);
                                  await updateBookingStatus(booking.id, 'cancelled');
                                }} 
                                className="w-full px-4 py-2.5 text-xs text-red-650 hover:bg-red-50 flex items-center gap-2.5 font-bold transition-colors"
                              >
                                <Icons.XCircle className="h-3.5 w-3.5 text-red-500" />
                                Cancel Booking
                              </button>
                            )}

                            {currentUserProfile?.role === 'admin' && (
                              <button 
                                onClick={async () => {
                                  setOpenMenuId(null);
                                  if (confirm("Permanently delete this booking record?")) {
                                    await handleDeleteBooking(booking.id);
                                  }
                                }} 
                                className="w-full px-4 py-2.5 text-xs text-red-700 hover:bg-red-55 flex items-center gap-2.5 font-black transition-colors pt-2 border-t border-gray-100"
                              >
                                <Icons.Trash2 className="h-3.5 w-3.5 text-red-600" />
                                Delete Permanently
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Mobile Card Body details */}
              <div className="grid grid-cols-2 gap-3 pb-1 text-left font-sans">
                <div className="col-span-2">
                  <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Tour & Package</h5>
                  <p className="text-xs font-black text-gray-900 mt-0.5 leading-tight">{booking.tourTitle}</p>
                  <p className="text-[10px] font-bold text-primary uppercase mt-0.5">{booking.packageName}</p>
                </div>
                
                <div>
                  <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Customer</h5>
                  <p className="text-xs font-black text-gray-900 mt-0.5 leading-tight truncate">{booking.customerData?.fullName || 'N/A'}</p>
                  <p className="text-[10px] text-gray-400 tracking-tight mt-0.5 truncate">{booking.customerData?.email || 'N/A'}</p>
                </div>

                <div>
                  <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Travel Date</h5>
                  <p className="text-xs font-black text-gray-900 mt-0.5">{booking.date}</p>
                  {booking.time && (
                    <p className="text-[10px] font-bold text-primary">{booking.time}</p>
                  )}
                </div>

                <div>
                  <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Total Charge</h5>
                  <p className="text-sm font-black text-primary mt-0.5">{formatPrice(booking.totalAmount)}</p>
                </div>

                <div>
                  <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Payment Method</h5>
                  <p className="text-[10px] font-black text-gray-400 uppercase mt-1">{(booking.paymentMethod || 'manual').replace('_', ' ')}</p>
                </div>

                {booking.assignedGuideName && (
                  <div className="col-span-2 mt-1 bg-gray-50 border border-gray-100 rounded-lg p-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icons.User className="h-3.5 w-3.5 text-blue-500" />
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Assigned Guide</p>
                        <p className="text-xs font-black text-blue-600 uppercase leading-none mt-1">{booking.assignedGuideName}</p>
                      </div>
                    </div>
                    {booking.assignedGuideWhatsapp && (
                      <span className="text-[10px] font-bold text-primary bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">
                        WA Active
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredBookings.length === 0 && (
            <div className="p-10 text-center text-gray-400 font-bold uppercase text-xs tracking-widest bg-white border border-gray-100 rounded-xl">
              No bookings found for the current options.
            </div>
          )}
        </div>
          </>
        )}

        {viewMode === 'daily' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Real-time Dispatch Date Navigation Console */}
            <div className="bg-white rounded-[12px] p-5 border border-gray-100 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black tracking-widest text-primary uppercase">Active Dispatch Date</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        try {
                          const prev = addDays(parseISO(selectedDailyDate), -1);
                          setSelectedDailyDate(format(prev, 'yyyy-MM-dd'));
                        } catch(e){}
                      }}
                      className="p-1.5 hover:bg-gray-50 border border-gray-100 rounded-lg transition-colors"
                      title="Previous Day"
                    >
                      <Icons.ChevronLeft className="h-4 w-4 text-gray-500" />
                    </button>
                    <h3 className="text-base font-black text-gray-900 tracking-tight select-none">
                      {(() => {
                        try {
                          return format(parseISO(selectedDailyDate), 'EEEE, d MMMM yyyy');
                        } catch (e) {
                          return selectedDailyDate;
                        }
                      })()}
                    </h3>
                    <button 
                      onClick={() => {
                        try {
                          const next = addDays(parseISO(selectedDailyDate), 1);
                          setSelectedDailyDate(format(next, 'yyyy-MM-dd'));
                        } catch(e){}
                      }}
                      className="p-1.5 hover:bg-gray-50 border border-gray-100 rounded-lg transition-colors"
                      title="Next Day"
                    >
                      <Icons.ChevronRight className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <div className="relative">
                    <Icons.CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input 
                      type="date" 
                      value={selectedDailyDate} 
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedDailyDate(e.target.value);
                        }
                      }}
                      className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs font-black uppercase tracking-wider text-gray-700 bg-white focus:outline-none focus:border-primary cursor-pointer shadow-xs min-w-[130px]"
                    />
                  </div>
                  <button 
                    onClick={() => setSelectedDailyDate(format(new Date(), 'yyyy-MM-dd'))}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-600 transition-colors"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Weekly Navigation Strip */}
              <div className="grid grid-cols-7 gap-2">
                {daysAroundSelected.map((day) => (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedDailyDate(day.dateStr)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all relative",
                      day.isCurrent
                        ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
                        : "bg-gray-50/50 hover:bg-gray-50 border-gray-100"
                    )}
                  >
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      day.isCurrent ? "text-primary" : "text-gray-400"
                    )}>
                      {day.dayName}
                    </span>
                    <span className={cn(
                      "text-sm font-black mt-0.5",
                      day.isCurrent ? "text-primary" : "text-gray-800"
                    )}>
                      {day.dayNum}
                    </span>
                    {day.count > 0 && (
                      <span className={cn(
                        "absolute -top-1.5 -right-1 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border",
                        day.isCurrent
                          ? "bg-primary text-white border-white"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      )}>
                        {day.count}
                      </span>
                    )}
                    {day.isToday && !day.isCurrent && (
                      <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Dispatch KPI Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-gray-50 text-gray-500 rounded-lg">
                  <Icons.Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Bookings</h4>
                  <p className="text-lg font-black text-gray-900 leading-none mt-1">{dailyStats.total} Jobs</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-blue-50/70 text-blue-600 rounded-lg">
                  <Icons.Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Active Guest Load</h4>
                  <p className="text-lg font-black text-gray-900 leading-none mt-1">{dailyStats.totalPax} Pax Total</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 text-primary rounded-lg">
                  <Icons.CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Guide Dispatched</h4>
                  <p className="text-lg font-black text-gray-900 leading-none mt-1">{dailyStats.assigned} / {dailyStats.activeCount}</p>
                </div>
              </div>

              {/* Safety Dispatch Alert Card */}
              <div className={cn(
                "p-4 rounded-xl border shadow-xs flex items-center gap-3 transition-colors",
                dailyStats.unassigned > 0 
                  ? "bg-amber-50/50 border-amber-200 text-amber-800" 
                  : (dailyStats.activeCount > 0 
                    ? "bg-orange-50/50 border-orange-100 text-orange-800"
                    : "bg-gray-50 border-gray-100 text-gray-500")
              )}>
                <div className={cn(
                  "p-2.5 rounded-lg",
                  dailyStats.unassigned > 0 ? "bg-amber-100 text-amber-700" : "bg-orange-100/80 text-orange-700"
                )}>
                  {dailyStats.unassigned > 0 ? (
                    <Icons.ShieldAlert className="h-5 w-5 animate-pulse" />
                  ) : (
                    <Icons.ShieldCheck className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Dispatch Safety Check</h4>
                  <p className="text-xs font-bold leading-normal mt-0.5">
                    {dailyStats.unassigned > 0 ? (
                      <span className="text-amber-800 tracking-tight font-black">{dailyStats.unassigned} Needs Guide Assignment!</span>
                    ) : (
                      dailyStats.activeCount > 0 ? (
                        <span className="text-orange-700 tracking-tight font-black">All Bookings Fully Dispatched!</span>
                      ) : (
                        <span className="text-gray-500 font-bold">No active tours on this day</span>
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Dispatch Sub-tabs + Filter Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Bookings', count: dailyStats.total, color: 'text-gray-600 bg-gray-50 border-gray-100' },
                  { id: 'unassigned', label: '⚠️ Unassigned Only', count: dailyStats.unassigned, color: 'text-amber-700 bg-amber-50 border-amber-150', highlight: dailyStats.unassigned > 0 },
                  { id: 'assigned', label: '✅ Scheduled (Assigned)', count: dailyStats.assigned, color: 'text-blue-700 bg-blue-50 border-blue-100' },
                  { id: 'cancelled', label: 'Cancelled Tours', count: dailyStats.cancelledCount, color: 'text-red-700 bg-red-50 border-red-100' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDispatchFilter(tab.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all",
                      dispatchFilter === tab.id
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-white text-gray-500 border-gray-100 hover:text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-[8px] font-black",
                      dispatchFilter === tab.id 
                        ? "bg-white/20 text-white" 
                        : (tab.highlight ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600")
                    )}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest pr-2">
                Showing {filteredBookingsForSelectedDay.length} of {dailyStats.total} Bookings
              </div>
            </div>

            {/* Selected Date Listings Grid */}
            {filteredBookingsForSelectedDay.length === 0 ? (
              <div className="p-20 text-center bg-white border border-gray-100 rounded-[12px] flex flex-col items-center justify-center space-y-3">
                <Icons.Briefcase className="h-8 w-8 text-gray-300" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  No bookings matching current dispatch filter on this day.
                </p>
                <button 
                  onClick={() => setDispatchFilter('all')}
                  className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-primary uppercase border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredBookingsForSelectedDay.map((booking) => (
                  <div 
                    key={booking.id}
                    onClick={() => {
                      setGlobalSelectedBooking(booking);
                      setOriginalBooking(booking);
                      setIsBookingDetailOpen(true);
                    }}
                    className={cn(
                      "bg-white rounded-xl border p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group space-y-4",
                      booking.status === 'cancelled'
                        ? "border-red-100 opacity-75 hover:border-red-300"
                        : (!booking.assignedGuideId 
                          ? "border-amber-200 bg-amber-50/10 hover:border-amber-450" 
                          : "border-gray-100 hover:border-primary")
                    )}
                  >
                    <div className="space-y-3.5">
                      {/* Booking Card Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[10px] font-black text-primary tracking-tighter uppercase leading-none">
                            #{booking.id.slice(-8)}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Icons.Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-[10px] text-gray-400 font-bold">{booking.time || "No set time"}</span>
                          </div>
                        </div>

                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.05em] border",
                          booking.status === 'completed' ? "bg-blue-50 text-blue-700 border-blue-100" :
                          booking.status === 'confirmed' ? "bg-orange-50 text-orange-700 border-orange-100 animate-pulse" :
                          booking.status === 'cancelled' ? "bg-red-50 text-red-700 border-red-100" :
                          booking.status === 'review_required' ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse" :
                          "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {booking.status.replace('_', ' ')}
                        </div>
                      </div>

                      {/* Tour Package Details */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {booking.tourTitle}
                        </h4>
                        <p className="text-[9px] font-black text-primary uppercase tracking-wider">
                          {booking.packageName}
                        </p>
                      </div>

                      {/* Pax & Customer Directory Details */}
                      <div className="bg-gray-50/60 rounded-lg p-2.5 border border-gray-100/60 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Guest Lead</span>
                          <span className="font-black text-gray-800 text-[11px] truncate max-w-[150px]">
                            {booking.customerData?.fullName || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">WhatsApp</span>
                          <span className="font-bold text-gray-600 text-[10px] truncate max-w-[150px]">
                            {booking.customerData?.phone || "No Whatsapp"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Travel Capacity</span>
                          <span className="font-black text-primary text-[11px]">
                            {(booking.participants?.adults || 0) + (booking.participants?.children || 0)} Passengers ({booking.participants?.adults || 0} A, {booking.participants?.children || 0} C)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Interactive Dispatcher (Guide assignment) */}
                    <div className="pt-3.5 border-t border-gray-50 space-y-3">
                      {booking.status !== 'cancelled' ? (
                        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                              Guide / Driver Assigned
                            </label>
                            {booking.assignedGuideId ? (
                              <span className="text-[8px] font-black text-primary uppercase bg-orange-50 border border-orange-100 px-1 py-0.2 rounded">
                                Dispatched
                              </span>
                            ) : (
                              <span className="text-[8px] font-black text-amber-600 uppercase bg-amber-50 border border-amber-100 px-1 py-0.2 rounded">
                                Needs Assignment
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <select
                              value={booking.assignedGuideId || ''}
                              onChange={async (e) => {
                                const val = e.target.value;
                                if (!val) {
                                  try {
                                    await updateDoc(doc(db, 'bookings', booking.id), {
                                      assignedGuideId: null,
                                      assignedGuideName: null,
                                      assignedGuideWhatsapp: null,
                                    });
                                    // Append logging event
                                    const timelineRef = collection(db, 'bookings', booking.id, 'timeline');
                                    await addDoc(timelineRef, {
                                      status: booking.status,
                                      message: `Guide unassigned by scheduler`,
                                      notes: '',
                                      timestamp: new Date(),
                                      userId: currentUserProfile?.uid || 'system',
                                      userName: currentUserProfile?.displayName || 'Admin'
                                    });
                                  } catch(err) {
                                    console.error("Failed to unassign guide", err);
                                  }
                                } else {
                                  const selectedGuide = guides.find(g => g.id === val);
                                  if (selectedGuide) {
                                    await handleAssignToGuide(booking, selectedGuide);
                                  }
                                }
                              }}
                              className={cn(
                                "w-full pl-3 pr-8 py-2 rounded-lg text-xs font-bold outline-none border transition-all appearance-none cursor-pointer bg-no-repeat bg-[right_8px_center]",
                                booking.assignedGuideId 
                                  ? "bg-blue-50/50 text-blue-700 border-blue-200 focus:border-blue-400" 
                                  : "bg-amber-50/50 text-amber-700 border-amber-200 focus:border-amber-400"
                              )}
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234B5563' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`,
                                backgroundSize: '12px'
                              }}
                            >
                              <option value="">-- No Guide / Driver --</option>
                              {guides.map(guide => (
                                <option key={guide.id} value={guide.id}>
                                  {guide.name} {guide.whatsapp ? `(+${guide.whatsapp})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-center text-red-700 text-[10px] font-black uppercase tracking-wider">
                          Booking Cancelled - No Guide Needed
                        </div>
                      )}

                      {/* Price & Contact details footer */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Booked Vol</p>
                          <p className="text-sm font-black text-gray-900 mt-1">{formatPrice(booking.totalAmount)}</p>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setGlobalSelectedBooking(booking);
                            setOriginalBooking(booking);
                            setIsBookingDetailOpen(true);
                          }}
                          className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-150 text-[9px] font-black uppercase tracking-wider rounded-lg text-gray-655 flex items-center gap-1 transition-colors"
                        >
                          Details & Logs
                          <Icons.ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'calendar' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Calendar Grid Section */}
            <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={previousMonth} 
                    className="p-2 hover:bg-gray-50 border border-gray-100 rounded-lg text-gray-500 hover:text-black transition-colors"
                    type="button"
                  >
                    <Icons.ChevronLeft className="h-4 w-4" />
                  </button>
                  <h3 className="text-base font-black text-gray-900 min-w-[140px] text-center uppercase tracking-wider">
                    {format(viewDate, 'MMMM yyyy')}
                  </h3>
                  <button 
                    onClick={nextMonth} 
                    className="p-2 hover:bg-gray-50 border border-gray-100 rounded-lg text-gray-500 hover:text-black transition-colors"
                    type="button"
                  >
                    <Icons.ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <button 
                  onClick={goToToday}
                  className="px-4 py-2 rounded-lg bg-primary text-white font-black text-[10px] uppercase tracking-wider hover:bg-orange-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-orange-100 cursor-pointer"
                  type="button"
                >
                  <Icons.Calendar className="h-3.5 w-3.5" /> Today
                </button>
              </div>

              <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden bg-gray-150 border border-gray-150 shadow-inner">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-gray-50 py-3 text-center">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{day}</span>
                  </div>
                ))}
                
                {calendarDays.map((day, idx) => {
                  const dayBookings = getBookingsForDay(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const guestsCount = dayBookings.reduce((sum, b) => sum + ((b.participants?.adults || 0) + (b.participants?.children || 0)), 0);

                  return (
                    <div 
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "min-h-[105px] bg-white p-2.5 transition-all cursor-pointer relative flex flex-col justify-between hover:bg-primary/[0.02]",
                        !isCurrentMonth && "bg-gray-50/20 text-gray-350",
                        isSelected && "ring-2 ring-primary ring-inset z-10 bg-primary/[0.03]"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span className={cn(
                          "text-xs font-black transition-colors",
                          !isCurrentMonth ? "text-gray-300" : isToday(day) ? "text-primary font-extrabold" : "text-gray-650",
                          isSelected && "text-primary font-black"
                        )}>
                          {format(day, 'd')}
                        </span>
                        {dayBookings.length > 0 && isCurrentMonth && (
                          <span className={cn(
                            "flex h-2 w-2 rounded-full",
                            dayBookings.some(b => b.status === 'pending') ? "bg-amber-500" : "bg-orange-500"
                          )} />
                        )}
                      </div>

                      {dayBookings.length > 0 && isCurrentMonth && (
                        <div className="space-y-0.5">
                          <div className="text-[9px] font-black text-gray-900 leading-none">
                            {dayBookings.length} Job{dayBookings.length > 1 ? 's' : ''}
                          </div>
                          <div className="text-[8px] font-bold text-gray-400 flex items-center gap-0.5">
                            <Icons.Users className="h-2 w-2" />
                            {guestsCount} Pax
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Day KPI + Detail Pane */}
            <div className="space-y-6 flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-gray-905 tracking-tight flex items-center gap-2">
                    <Icons.Calendar className="h-5 w-5 text-primary" />
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-wider">
                    {selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
                <div className="flex items-center gap-6 bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-xs self-start md:self-auto text-xs font-black">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Total Guests</p>
                    <p className="text-base font-black text-gray-950">{totalGuests} Pax</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Day Revenue</p>
                    <p className="text-base font-black text-primary font-mono">{formatPrice(totalRevenue)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {selectedDayBookings.map(booking => (
                  <div 
                    key={booking.id} 
                    onClick={() => {
                        setGlobalSelectedBooking(booking);
                        setOriginalBooking(booking);
                        setIsBookingDetailOpen(true);
                    }}
                    className={cn(
                      "bg-white p-5 rounded-xl border flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group space-y-4",
                      booking.status === 'cancelled'
                        ? "border-red-100 opacity-75 hover:border-red-350"
                        : (!booking.assignedGuideId 
                          ? "border-amber-200 bg-amber-50/10 hover:border-amber-450" 
                          : "border-gray-100 hover:border-primary")
                    )}
                  >
                    <div className="space-y-3.5 flex-1">
                      {/* Booking Card Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[10px] font-black text-primary tracking-tighter uppercase leading-none">
                            #{booking.id.slice(-8)}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Icons.Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-[10px] text-gray-400 font-bold">{booking.time || "No set time"}</span>
                          </div>
                        </div>

                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.05em] border",
                          booking.status === 'completed' ? "bg-blue-50 text-blue-700 border-blue-100" :
                          booking.status === 'confirmed' ? "bg-orange-50 text-orange-700 border-orange-100" :
                          booking.status === 'cancelled' ? "bg-red-50 text-red-700 border-red-100" :
                          "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {booking.status.replace('_', ' ')}
                        </div>
                      </div>

                      {/* Tour Package Details */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {booking.tourTitle}
                        </h4>
                        <p className="text-[9px] font-black text-primary uppercase tracking-wider">
                          {booking.packageName}
                        </p>
                      </div>

                      {/* Guest info card */}
                      <div className="bg-gray-50/60 rounded-lg p-2.5 border border-gray-100/60 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Guest Lead</span>
                          <span className="font-black text-gray-800 text-[11px] truncate max-w-[150px]">
                            {booking.customerData?.fullName || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">WhatsApp</span>
                          <span className="font-bold text-gray-600 text-[10px] truncate max-w-[150px]">
                            {booking.customerData?.phone || "No Whatsapp"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Travel Capacity</span>
                          <span className="font-black text-primary text-[11px]">
                            {(booking.participants?.adults || 0) + (booking.participants?.children || 0)} Passengers ({booking.participants?.adults || 0} A, {booking.participants?.children || 0} C)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Guide Selector */}
                    <div className="pt-3 border-t border-gray-50 space-y-3">
                      {booking.status !== 'cancelled' ? (
                        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                              Guide / Driver Assigned
                            </label>
                            {booking.assignedGuideId ? (
                              <span className="text-[8px] font-black text-primary uppercase bg-orange-50 border border-orange-100 px-1 py-0.2 rounded">
                                Dispatched
                              </span>
                            ) : (
                              <span className="text-[8px] font-black text-amber-600 uppercase bg-amber-50 border border-amber-100 px-1 py-0.2 rounded">
                                Needs Assignment
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <select
                              value={booking.assignedGuideId || ''}
                              onChange={async (e) => {
                                const val = e.target.value;
                                if (!val) {
                                  try {
                                    await updateDoc(doc(db, 'bookings', booking.id), {
                                      assignedGuideId: null,
                                      assignedGuideName: null,
                                      assignedGuideWhatsapp: null,
                                    });
                                    const timelineRef = collection(db, 'bookings', booking.id, 'timeline');
                                    await addDoc(timelineRef, {
                                      status: booking.status,
                                      message: `Guide unassigned by scheduler`,
                                      notes: '',
                                      timestamp: new Date(),
                                      userId: currentUserProfile?.uid || 'system',
                                      userName: currentUserProfile?.displayName || 'Admin'
                                    });
                                  } catch(err) {
                                    console.error(err);
                                  }
                                } else {
                                  const selectedGuide = guides.find(g => g.id === val);
                                  if (selectedGuide) {
                                    await handleAssignToGuide(booking, selectedGuide);
                                  }
                                }
                              }}
                              className={cn(
                                "w-full pl-3 pr-8 py-2 rounded-lg text-xs font-bold outline-none border transition-all appearance-none cursor-pointer bg-no-repeat bg-[right_8px_center]",
                                booking.assignedGuideId 
                                  ? "bg-blue-50/50 text-blue-700 border-blue-200 focus:border-blue-400" 
                                  : "bg-amber-50/50 text-amber-700 border-amber-200 focus:border-amber-400"
                              )}
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234B5563' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`,
                                backgroundSize: '12px'
                              }}
                            >
                              <option value="">-- No Guide / Driver --</option>
                              {guides.map(guide => (
                                <option key={guide.id} value={guide.id}>
                                  {guide.name} {guide.whatsapp ? `(+${guide.whatsapp})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-center text-red-750 text-[10px] font-black uppercase tracking-wider">
                          Booking Cancelled - No Guide Needed
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Booked Vol</p>
                          <p className="text-sm font-black text-gray-900 mt-1">{formatPrice(booking.totalAmount)}</p>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setGlobalSelectedBooking(booking);
                            setOriginalBooking(booking);
                            setIsBookingDetailOpen(true);
                          }}
                          className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-150 text-[9px] font-black uppercase tracking-wider rounded-lg text-gray-655 flex items-center gap-1 transition-colors"
                        >
                          Details & Logs
                          <Icons.ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedDayBookings.length === 0 && (
                  <div className="col-span-full p-12 text-center bg-gray-50/50 rounded-xl border border-gray-150 border-dashed">
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No tours scheduled for this day</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const InquiryManager = () => {
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

    const filteredInquiries = useMemo(() => {
      return inquiries
        .filter(i => filterStatus === 'all' || i.status === filterStatus)
        .filter(i => {
           if (!searchQuery.trim()) return true;
           const q = searchQuery.toLowerCase();
           return (
             i.userName.toLowerCase().includes(q) ||
             i.userEmail.toLowerCase().includes(q) ||
             (i.planTitle || '').toLowerCase().includes(q)
           );
        });
    }, [filterStatus, searchQuery]);

    const updateInquiryStatus = async (id: string, status: Inquiry['status']) => {
      try {
        await updateDoc(doc(db, 'inquiries', id), { 
          status,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to update inquiry status:", err);
        alert("Failed to update status. Check permissions.");
      }
    };

    const handleDeleteInquiry = async (id: string) => {
      if (confirm("Are you sure you want to delete this inquiry?")) {
        try {
          await deleteDoc(doc(db, 'inquiries', id));
        } catch (err) {
          console.error("Failed to delete inquiry:", err);
          alert("Failed to delete inquiry.");
        }
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-[10px] p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Trip Inquiries</h2>
              <p className="text-sm text-gray-500 font-medium">Manage user-generated AI travel plans and follow ups.</p>
            </div>
            <div className="relative flex-1 max-w-md">
              <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                placeholder="Search inquiries..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
            {['all', 'new', 'followed_up', 'converted', 'cancelled'].map(s => (
              <button 
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  filterStatus === s ? "bg-primary text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                )}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Plan Details</th>
                <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInquiries.map(inquiry => (
                <tr key={inquiry.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-gray-900 uppercase">
                        {inquiry.createdAt?.toDate ? format(inquiry.createdAt.toDate(), 'dd MMM yyyy') : 'Recently'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {inquiry.createdAt?.toDate ? format(inquiry.createdAt.toDate(), 'HH:mm') : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">{inquiry.userName}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{inquiry.userEmail}</span>
                      {inquiry.userPhone && <span className="text-[9px] text-primary font-black mt-1">{inquiry.userPhone}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <span className="text-xs font-black text-gray-900 block truncate">{inquiry.planTitle}</span>
                      <p className="text-[10px] text-gray-400 font-medium line-clamp-1 mt-0.5">{inquiry.summary}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      inquiry.status === 'new' ? "bg-blue-50 text-blue-600" :
                      inquiry.status === 'followed_up' ? "bg-amber-50 text-amber-600" :
                      inquiry.status === 'converted' ? "bg-orange-50 text-primary" :
                      "bg-gray-50 text-gray-400"
                    )}>
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        inquiry.status === 'new' ? "bg-blue-500" :
                        inquiry.status === 'followed_up' ? "bg-amber-500" :
                        inquiry.status === 'converted' ? "bg-orange-500" :
                        "bg-gray-500"
                      )} />
                      {inquiry.status.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => setSelectedInquiry(inquiry)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-all"
                        title="View Full Plan"
                      >
                        <Icons.ExternalLink className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={async () => {
                          const msg = `Hello ${inquiry.userName}, I saw your generated trip plan: ${inquiry.planTitle}. I'd love to help you customize it!`;
                          try {
                            await sendCustomWhatsApp(inquiry.userPhone || '', msg);
                            updateInquiryStatus(inquiry.id, 'followed_up');
                            alert("Follow-up message sent successfully via Whapi!");
                          } catch (err) {
                            console.error('[WhatsApp] API Error:', err);
                            const link = getWhatsAppLink(inquiry.userPhone || '', msg);
                            window.open(link, '_blank');
                          }
                        }}
                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                        title="Follow up via WhatsApp API"
                      >
                        <Icons.MessageSquare className="h-4 w-4" />
                      </button>
                      <select 
                        value={inquiry.status}
                        onChange={(e) => updateInquiryStatus(inquiry.id, e.target.value as any)}
                        className="text-[9px] font-black uppercase tracking-widest bg-gray-50 border-none rounded-lg px-2 py-1 outline-none text-gray-500 cursor-pointer"
                      >
                        <option value="new">Mark New</option>
                        <option value="followed_up">Followed Up</option>
                        <option value="converted">Converted</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button 
                        onClick={() => handleDeleteInquiry(inquiry.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Icons.Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInquiries.length === 0 && (
            <div className="p-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest border-t border-gray-50">
              No inquiries found.
            </div>
          )}
        </div>

        {/* Inquiry Detail Modal */}
        <AnimatePresence>
          {selectedInquiry && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedInquiry(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[20px] shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="bg-gray-900 p-8 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                      <Icons.Map className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">{selectedInquiry.planTitle}</h3>
                      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">AI Generated Itinerary Inquery</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedInquiry(null)}
                    className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Icons.X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Customer Profile</h4>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                            <span className="text-xs font-bold text-gray-500">Name</span>
                            <span className="text-sm font-black text-gray-900">{selectedInquiry.userName}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                            <span className="text-xs font-bold text-gray-500">Email</span>
                            <span className="text-sm font-black text-gray-900">{selectedInquiry.userEmail}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-xs font-bold text-gray-500">Phone</span>
                            <span className="text-sm font-black text-primary">{selectedInquiry.userPhone || 'Not Provided'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Trip Preferences</h4>
                        <div className="bg-orange-50/30 rounded-2xl p-6 border border-orange-100/50 grid grid-cols-2 gap-4">
                          {selectedInquiry.formData && Object.entries(selectedInquiry.formData).map(([key, value]) => {
                            if (['name', 'email', 'phone', 'isConsent'].includes(key)) return null;
                            const labels: Record<string, string> = {
                              from: 'Traveling From',
                              tripTiming: 'Trip Timing',
                              duration: 'Duration (Days)',
                              persons: 'Number of People',
                              interests: 'Interests',
                              places: 'Preferred Places',
                              food: 'Food Preferences',
                              hotspots: 'Must Visit',
                              experience: 'Vibe/Experience',
                              hotelType: 'Hotel Style',
                              budget: 'Budget Range'
                            };
                            return (
                              <div key={key} className="space-y-1">
                                <p className="text-[8px] font-black text-primary uppercase tracking-widest leading-none">{labels[key] || key}</p>
                                <p className="text-xs font-extrabold text-gray-900 capitalize">{String(value)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Icons.Sparkles className="h-3 w-3 text-amber-500" />
                        AI Summary
                      </h4>
                      <div className="bg-amber-50/30 rounded-2xl p-6 border border-amber-100/50">
                        <p className="text-sm font-bold text-gray-800 leading-relaxed italic">
                          "{selectedInquiry.summary}"
                        </p>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100 mt-6">
                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Full Itinerary</h4>
                         <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-100 scrollbar-track-transparent">
                            {selectedInquiry.itinerary?.dailyPlans?.map((day: any, idx: number) => (
                              <div key={idx} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-primary/20 transition-colors">
                                <h5 className="text-xs font-black text-gray-900 mb-2 flex items-center gap-2">
                                  <span className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px]">D{day.day}</span>
                                  {day.title}
                                </h5>
                                <div className="space-y-2 ml-7 border-l-2 border-gray-50 pl-4 py-1">
                                   {day.activities?.map((activity: any, aIdx: number) => (
                                     <div key={aIdx} className="space-y-0.5">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{activity.time}</p>
                                        <p className="text-[11px] text-gray-700 font-bold leading-tight">{activity.title}</p>
                                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">{activity.description}</p>
                                     </div>
                                   ))}
                                   {day.accommodationRecommendation && (
                                     <div className="mt-3 p-2 bg-orange-50/50 rounded-lg border border-orange-100/50">
                                       <p className="text-[8px] font-black text-primary uppercase tracking-widest">Recommended Stay</p>
                                       <p className="text-[10px] font-bold text-gray-900">{day.accommodationRecommendation.name}</p>
                                     </div>
                                   )}
                                </div>
                              </div>
                            ))}
                            {!selectedInquiry.itinerary?.dailyPlans && (
                              <p className="text-xs text-gray-400 italic">Itinerary details missing or in legacy format.</p>
                            )}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gray-50 border-t border-gray-100 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inquiry ID:</span>
                    <code className="text-xs font-bold text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-200">
                      {selectedInquiry.id}
                    </code>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setSelectedInquiry(null)}
                      className="px-6 py-3 rounded-xl font-black text-xs text-gray-500 hover:bg-gray-100 transition-all uppercase tracking-widest"
                    >
                      Close Window
                    </button>
                    <button 
                      onClick={async () => {
                        const msg = `Hi ${selectedInquiry.userName}, I'm following up on your ${selectedInquiry.planTitle} trip plan!`;
                        try {
                          await sendCustomWhatsApp(selectedInquiry.userPhone || '', msg);
                          alert("Follow-up sent successfully via Whapi!");
                        } catch (err) {
                          console.error('[WhatsApp] API Error:', err);
                          window.open(getWhatsAppLink(selectedInquiry.userPhone || '', msg), '_blank');
                        }
                      }}
                      className="px-8 py-3 bg-primary text-white rounded-xl font-black text-xs hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 uppercase tracking-widest flex items-center gap-2"
                    >
                      <Icons.Send className="h-4 w-4" /> Send Offer
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={cn("admin-panel flex bg-[#F8FAFC] relative", !isCentralPortal && "min-h-screen")}>
      {/* Mobile Sidebar Backdrop Overlay */}
      {!isCentralPortal && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/30 z-45 transition-opacity backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      {!isCentralPortal && (
        <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-100 transition-all duration-300 shadow-sm",
          isSidebarOpen ? "w-72 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-primary h-10 w-10 rounded-[10px] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-xl tracking-tighter">BA</span>
            </div>
            {isSidebarOpen && (
              <span className="font-black text-gray-900 tracking-tight text-lg truncate uppercase">
                {currentUserProfile?.role === 'admin' ? 'Admin Panel' : 
                 currentUserProfile?.role === 'staff' ? 'Staff Console' :
                 currentUserProfile?.role === 'supplier' ? 'Supplier Portal' : 
                 currentUserProfile?.role === 'agent' ? 'Agent Portal' : 
                 currentUserProfile?.role === 'superadmin' ? 'Superadmin Portal' : 'Admin'}
              </span>
            )}
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4 scrollbar-hide">
            {menuItems.map((item) => {
              const isActive = activeMenu === item.id;
              const isChildActive = item.children?.some(c => {
                if (item.id === 'website-builder-group' && (activeMenu === 'website-builder' || activeMenu.startsWith('wb-'))) return true;
                if (item.id === 'settings-group' && (activeMenu === 'general-settings' || activeMenu === 'payment-settings' || activeMenu === 'communication' || activeMenu === 'backup' || activeMenu === 'domain' || activeMenu === 'company-info' || activeMenu === 'seo')) return true;
                if (item.id === 'booking-group' && (activeMenu === 'bookings' || activeMenu === 'schedule' || activeMenu === 'reports' || activeMenu === 'import-bookings')) return true;
                if (item.id === 'tours-group' && (activeMenu === 'all-tours' || activeMenu === 'tours' || activeMenu === 'categories' || activeMenu === 'locations' || activeMenu === 'labels' || activeMenu === 'addons' || activeMenu === 'transports' || activeMenu === 'urgency-points')) return true;
                if (item.id === 'car-rental-group' && (activeMenu === 'car-rental-bookings' || activeMenu === 'car-fleet' || activeMenu === 'car-rental-automations' || activeMenu === 'car-rental-settings')) return true;
                if (item.id === 'operations-group' && (activeMenu === 'waivers' || activeMenu === 'channel-manager' || activeMenu === 'invoices' || activeMenu === 'ai-hub' || activeMenu === 'inquiries' || activeMenu === 'guides')) return true;
                if (item.id === 'analytics-group' && (activeMenu === 'analytics' || activeMenu === 'analytics-overview' || activeMenu === 'conversion-funnel' || activeMenu === 'google-analytics' || activeMenu === 'analytics-integration')) return true;
                if (item.id === 'marketing-group' && (activeMenu === 'coupons' || activeMenu === 'popups-manager')) return true;
                if (item.id === 'blog-group' && activeMenu === 'blog') return true;
                if (item.id === 'pages-group' && activeMenu === 'pages') return true;
                if (item.id === 'finance-group' && activeMenu === 'payouts') return true;
                if (item.id === 'users-group' && (activeMenu === 'users' || activeMenu === 'access-roles' || activeMenu.startsWith('users-'))) return true;
                return activeMenu === c.id;
              });
              const isExpanded = expandedMenu === item.id;

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                        setSelectedPartner(null);
                        if (item.children) {
                            if (!isSidebarOpen) {
                                setIsSidebarOpen(true);
                                setExpandedMenu(item.id);
                            } else {
                                setExpandedMenu(isExpanded ? null : item.id);
                            }
                        } else {
                            setActiveMenu(item.id as MenuId);
                            setExpandedMenu(null);
                        }
                        if (item.id === 'tours') setActiveTab('basic');
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all group",
                      isActive || isChildActive
                        ? "bg-orange-50 text-primary" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive || isChildActive ? "text-primary" : "text-gray-400 group-hover:text-gray-900")} />
                    {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
                    {isSidebarOpen && item.children && (
                        <ChevronDown className={cn("ml-auto h-4 w-4 opacity-50 transition-transform", isExpanded && "rotate-180")} />
                    )}
                  </button>
                  {isSidebarOpen && isExpanded && item.children && (
                    <div className="ml-9 space-y-1">
                      {item.children.map((child) => {
                        const isChildHighlighted = 
                          activeMenu === child.id || 
                          (activeMenu === 'general-settings' && settingsActiveTab === child.id) ||
                          (activeMenu === 'website-builder' && (
                            (child.id === 'wb-site-settings' && websiteBuilderTab === 'siteSettings') ||
                            (child.id === 'wb-blocks' && websiteBuilderTab === 'blocks') ||
                            (child.id === 'wb-tours' && websiteBuilderTab === 'tours') ||
                            (child.id === 'wb-menus' && websiteBuilderTab === 'menus') ||
                            (child.id === 'wb-pages' && websiteBuilderTab === 'pages') ||
                            (child.id === 'wb-presets' && websiteBuilderTab === 'designPresets')
                          )) ||
                          (activeMenu === 'coupons' && child.id === 'coupons') ||
                          (activeMenu === 'popups-manager' && child.id === 'popups-manager') ||
                          (activeMenu === 'blog' && child.id === 'blog') ||
                          (activeMenu === 'pages' && child.id === 'pages') ||
                          (activeMenu === 'payouts' && child.id === 'payouts') ||
                          (activeMenu === 'users' && child.id === 'users') ||
                          (activeMenu === 'access-roles' && child.id === 'access-roles');

                        return (
                          <button
                            key={child.id}
                            onClick={() => {
                              setSelectedPartner(null);
                              if (child.id === 'wb-site-settings') {
                                  setActiveMenu('website-builder');
                                  setWebsiteBuilderTab('siteSettings');
                              } else if (child.id === 'wb-blocks') {
                                  setActiveMenu('website-builder');
                                  setWebsiteBuilderTab('blocks');
                              } else if (child.id === 'wb-tours') {
                                  setActiveMenu('website-builder');
                                  setWebsiteBuilderTab('tours');
                              } else if (child.id === 'wb-menus') {
                                  setActiveMenu('website-builder');
                                  setWebsiteBuilderTab('menus');
                              } else if (child.id === 'wb-pages') {
                                  setActiveMenu('website-builder');
                                  setWebsiteBuilderTab('pages');
                              } else if (child.id === 'wb-presets') {
                                  setActiveMenu('website-builder');
                                  setWebsiteBuilderTab('designPresets');
                              } else if (child.id === 'company-info' || child.id === 'seo' || child.id === 'domain') {
                                  setActiveMenu('general-settings');
                                  setSettingsActiveTab(child.id);
                              } else if (child.id === 'add-manual-booking') {
                                  setActiveMenu('bookings');
                                  setIsManualBookingModalOpen(true);
                              } else if (child.id === 'tours') {
                                  resetForm();
                                  setActiveMenu('tours');
                              } else if (child.id === 'add-blog-trigger') {
                                  setActiveMenu('blog');
                                  setAutoOpenBlogModal(true);
                              } else if (child.id === 'add-page-trigger') {
                                  setActiveMenu('pages');
                              } else if (child.id === 'landing-page-generator') {
                                  setActiveMenu('pages');
                              } else if (child.id === 'add-user-trigger') {
                                  setActiveMenu('users');
                                  setAutoOpenCreateUser(true);
                              } else if (child.id === 'blog-categories') {
                                  setActiveMenu('blog');
                              } else if (child.id === 'guide-pdf') {
                                  navigate('/panduan');
                              } else if (child.id === 'docs-system') {
                                  navigate('/docs');
                              } else {
                                  setActiveMenu(child.id as MenuId);
                              }
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2 text-xs font-bold transition-colors flex items-center justify-between group/child",
                              isChildHighlighted ? "text-primary bg-orange-50/50 rounded-lg" : "text-gray-400 hover:text-primary"
                            )}
                          >
                            <span>{child.label}</span>
                            {(child as any).count && (
                              <span className="bg-primary text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">
                                {(child as any).count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Other Menu Section */}
            <div className="pt-4 mt-4 border-t border-gray-100 space-y-1">
              {isSidebarOpen && (
                <div className="px-4 py-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Other Menu</p>
                </div>
              )}
              
              {[
                { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
                { id: 'backup', label: 'Disaster Recovery', icon: Database },
                { id: 'custom-domain', label: 'Custom Domain', icon: Globe },
                { id: 'tickets', label: 'Support & Ticket', icon: LifeBuoy },
                { id: 'developer-hub', label: 'Developer Hub', icon: Terminal },
                { id: 'user-settings', label: 'User Setting', icon: User },
                { id: 'logout-trigger', label: 'Log Out', icon: LogOut }
              ].map((item) => {
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'logout-trigger') {
                        handleLogout();
                      } else {
                        setSelectedPartner(null);
                        setActiveMenu(item.id as MenuId);
                        setExpandedMenu(null);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all group text-left",
                      isActive
                        ? "bg-orange-50 text-primary" 
                        : item.id === 'logout-trigger'
                        ? "text-red-500 hover:bg-red-50 hover:text-red-700"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : item.id === 'logout-trigger' ? "text-red-400 group-hover:text-red-700" : "text-gray-400 group-hover:text-gray-900")} />
                    {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </nav>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-6 border-t border-gray-50 text-gray-400 hover:text-gray-900 transition-colors flex justify-center"
          >
            {isSidebarOpen ? <ChevronRight className="h-5 w-5 rotate-180" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
      </aside>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-w-0 overflow-x-hidden",
        !isCentralPortal && "transition-all duration-300 min-h-screen pt-12 md:pt-0 pb-16 md:pb-0",
        !isCentralPortal && (isSidebarOpen ? "md:pl-72" : "md:pl-20")
      )}>
        {/* Dynamic Header */}
        {!isCentralPortal && (
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              {/* Hamburger Toggle on Mobile */}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all focus:outline-none"
              >
                <Icons.Menu className="h-5 w-5" />
              </button>
              <h2 className="text-sm md:text-xl font-black tracking-tight text-gray-900 truncate">
                {activeMenuItemLabel}
              </h2>
           </div>
           <div className="flex items-center gap-2 md:gap-4 shrink-0">
              {/* Unified Notification Center */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all shadow-sm bg-white cursor-pointer"
                  title="Notifications Alert"
                >
                  <Icons.Bell className="h-4 w-4 md:h-5 w-5" />
                  {inAppNotifications.some(n => !n.read) && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                      {inAppNotifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                {/* Notifications Panel Dropdown */}
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                    <div className="absolute right-0 mt-3 w-72 md:w-96 bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 p-4 md:p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 overflow-hidden max-h-[450px] flex flex-col">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                          <Icons.Bell className="h-4 w-4 text-primary animate-bounce" />
                          <h4 className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-wider">Notifications</h4>
                        </div>
                        <div className="flex gap-2">
                          {inAppNotifications.length > 0 && (
                            <button 
                              onClick={() => setInAppNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                              className="text-[9.5px] font-bold text-primary hover:underline"
                            >
                              Mark read
                            </button>
                          )}
                          <button 
                            onClick={() => setInAppNotifications([])}
                            className="text-[9.5px] font-bold text-red-500 hover:underline"
                          >
                            Clear all
                          </button>
                        </div>
                      </div>

                      {/* Permission status prompt inside center */}
                      {!notificationPermissionGranted && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-100/50 rounded-xl text-center">
                          <p className="text-[10px] text-orange-800 font-bold mb-2">Enable Push Alerts for instant booking updates!</p>
                          <button
                            onClick={requestNotificationPermission}
                            className="w-full bg-primary text-white text-[9.5px] font-black uppercase tracking-wider py-1.5 rounded-lg shadow-sm hover:bg-orange-700 transition-all cursor-pointer"
                          >
                            Enable System Notifications
                          </button>
                        </div>
                      )}

                      {/* Notification list */}
                      <div className="mt-3 overflow-y-auto space-y-2.5 max-h-[260px] flex-1 pr-1">
                        {inAppNotifications.length === 0 ? (
                          <div className="py-6 text-center text-gray-400">
                            <Icons.Inbox className="h-8 w-8 mx-auto opacity-40 mb-2" />
                            <p className="text-[10px] font-bold">No notifications yet.</p>
                            <p className="text-[9px] font-medium text-gray-400 mt-0.5">Real-time alerts appear instantly here when clients book!</p>
                          </div>
                        ) : (
                          inAppNotifications.map(notification => (
                            <div 
                              key={notification.id}
                              className={cn(
                                "p-3 rounded-xl border text-left transition-all cursor-pointer",
                                notification.read ? "bg-gray-50/50 border-gray-50" : "bg-orange-50/20 border-orange-100"
                              )}
                              onClick={() => {
                                setInAppNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
                                setActiveMenu(notification.url.includes('inquiries') ? 'inquiries' : 'bookings');
                                setIsNotificationsOpen(false);
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-[11px] font-black text-gray-900 leading-tight">{notification.title}</h5>
                                {!notification.read && <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0 mt-1" />}
                              </div>
                              <p className="text-[10px] text-gray-500 font-semibold mt-1 leading-normal">{notification.body}</p>
                              <span className="text-[8px] text-gray-400 font-bold mt-1.5 block">
                                {new Date(notification.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-red-50 text-red-700 text-xs font-black hover:bg-red-100 transition-all border border-red-100"
                title="Log Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
                <img src={auth.currentUser?.photoURL || ''} className="h-full w-full object-cover" />
              </div>
           </div>
        </header>
        )}

        <div className={isCentralPortal ? "p-0" : "p-4 md:p-8"}>
          {/* Dashboard View */}
          {activeMenu === 'dashboard' && (
            <AdminDashboardOverview
              currentUserProfile={currentUserProfile}
              bookings={bookings}
              tours={tours}
              users={users}
              inquiries={inquiries}
              isInstallable={isInstallable}
              installApp={handleInstallApp}
              setActiveMenu={setActiveMenu}
              setTourSupplierFilter={setTourSupplierFilter}
              handleSeedDummyData={undefined}
            />
          )}

          {/* Tour List View */}
          {activeMenu === 'all-tours' && (
            <div className="space-y-6">
              {tourSupplierFilter && (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center text-primary">
                      <Icons.Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-orange-800 uppercase tracking-widest">Supplier Filter Active</p>
                      <p className="text-sm font-bold text-primary">{users.find(u => u.uid === tourSupplierFilter)?.displayName || 'Unknown Supplier'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setTourSupplierFilter(null)}
                    className="px-4 py-2 bg-white text-primary rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
              <TourListing 
                tours={tourSupplierFilter ? tours.filter(t => t.supplierId === tourSupplierFilter) : tours}
                categories={categories}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleCloneTour={handleCloneTour}
                handleImportTours={handleImportTours}
                resetForm={resetForm}
                setActiveMenu={setActiveMenu}
                currentUserProfile={currentUserProfile}
              />
            </div>
          )}

          {/* Analytics & Conversion Hub */}
          {(activeMenu === 'analytics' || activeMenu === 'analytics-overview') && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <AnalyticsManager initialTab="traffic" bookings={bookings} />
            </div>
          )}
          {activeMenu === 'conversion-funnel' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <AnalyticsManager initialTab="funnel" bookings={bookings} />
            </div>
          )}
          {(activeMenu === 'google-analytics' || activeMenu === 'analytics-integration') && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <AnalyticsManager initialTab="ga4" bookings={bookings} />
            </div>
          )}
          {['categories', 'tour-types', 'locations', 'labels'].includes(activeMenu) && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
               <MetaManager 
                 type={activeMenu as 'categories' | 'tour-types' | 'locations' | 'labels'}
                 items={
                   activeMenu === 'categories' ? categories : 
                   activeMenu === 'tour-types' ? tourTypes : 
                   activeMenu === 'labels' ? labels :
                   locations
                 }
               />
            </div>
          )}
          {activeMenu === 'addons' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <AddOnManager items={globalAddOns} />
             </div>
          )}
          {activeMenu === 'transports' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <TransportOptionManager items={globalTransports} />
             </div>
          )}
          {activeMenu === 'bookings' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <BookingManagementPanel
                setGlobalSelectedBooking={setGlobalSelectedBooking}
                setOriginalBooking={setOriginalBooking}
                setIsBookingDetailOpen={setIsBookingDetailOpen}
                setAssignBooking={setAssignBooking}
                setIsAssignOpen={setIsAssignOpen}
                handlePrintManifest={handlePrintManifest}
                updateBookingStatus={updateBookingStatus}
                handleDeleteBooking={handleDeleteBooking}
                allGuides={allGuides}
                currentUserProfile={currentUserProfile}
                bookings={bookings}
                tours={tours}
              />
            </div>
          )}
          {activeMenu === 'import-bookings' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <ImportBooking 
                onSuccess={() => setActiveMenu('bookings')}
                commSettings={commSettings}
              />
            </div>
          )}
          {activeMenu === 'channel-manager' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <ChannelManager allTours={tours} />
            </div>
          )}
          {activeMenu === 'inquiries' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <InquiryManager />
            </div>
          )}
          {activeMenu === 'tickets' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <TicketManager />
            </div>
          )}
          {activeMenu === 'billing' && (
            <BillingView tenantData={tenantData} setTenantData={setTenantData} />
          )}
          {activeMenu === 'backup' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <DisasterRecoveryBackup
                tours={tours}
                bookings={bookings}
                globalAddOns={globalAddOns}
                globalTransports={globalTransports}
                coupons={coupons}
                onDataRestored={() => {
                  window.location.reload();
                }}
              />
            </div>
          )}
          {activeMenu === 'custom-domain' && (
            <CustomDomainSettings tenantData={tenantData} setTenantData={setTenantData} />
          )}
          {activeMenu === 'developer-hub' && (
            <DeveloperHub tenantId={getActiveTenantId() || ""} />
          )}
          {activeMenu === 'user-settings' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <CompanyProfile userData={currentUserProfile} />
            </div>
          )}
          {activeMenu === 'live-inventory' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
               <LiveInventoryManager />
            </div>
          )}
          {activeMenu === 'guides' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <GuideManager />
            </div>
          )}
          {activeMenu === 'schedule' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <BookingManagementPanel
                setGlobalSelectedBooking={setGlobalSelectedBooking}
                setOriginalBooking={setOriginalBooking}
                setIsBookingDetailOpen={setIsBookingDetailOpen}
                setAssignBooking={setAssignBooking}
                setIsAssignOpen={setIsAssignOpen}
                handlePrintManifest={handlePrintManifest}
                updateBookingStatus={updateBookingStatus}
                handleDeleteBooking={handleDeleteBooking}
                allGuides={allGuides}
                currentUserProfile={currentUserProfile}
                bookings={bookings}
                initialView="calendar"
                tours={tours}
              />
            </div>
          )}
          {activeMenu === 'reports' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
               <BookingReports currentUserProfile={currentUserProfile} />
            </div>
          )}
          {activeMenu === 'payouts' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
               <PayoutManager currentUserProfile={currentUserProfile} />
            </div>
          )}
          {activeMenu === 'coupons' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <CouponManager items={coupons} />
             </div>
          )}
          {activeMenu === 'pages' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <LandingPageGenerator openMediaGallery={openMediaGallery} allTours={tours} />
             </div>
          )}
          {activeMenu === 'blog' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
               <BlogManager 
                 commSettings={commSettings}
                 openMediaGallery={openMediaGallery}
                 autoOpenModal={autoOpenBlogModal}
                 onHandledAutoOpenModal={() => setAutoOpenBlogModal(false)}
               />
            </div>
          )}
          {activeMenu === 'ai-hub' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
               <ProposalGenerator tenantId={tenant?.id} />
            </div>
          )}
          {(['users', 'users-admins', 'users-suppliers', 'users-agents', 'users-customers'] as MenuId[]).includes(activeMenu) && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
               <UserManager 
                 users={users} 
                 setUsers={setUsers} 
                 onDeleteUser={handleDeleteUser} 
                 allTours={tours}
                 resetForm={resetForm}
                 setFormData={setFormData}
                 formData={formData}
                 setActiveMenu={setActiveMenu}
                 initialOpenCreate={autoOpenCreateUser}
                 roleFilter={
                   activeMenu === 'users-admins' ? 'admin' :
                   activeMenu === 'users-suppliers' ? 'supplier' :
                   activeMenu === 'users-agents' ? 'agent' :
                   activeMenu === 'users-customers' ? 'customer' :
                   undefined
                 }
               />
            </div>
          )}
          {activeMenu === 'access-roles' && (
            <AccessRolesManager currentUserProfile={currentUserProfile} />
          )}
          {activeMenu === 'urgency-points' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <UrgencyPointManager items={urgencyPoints} />
             </div>
          )}
          {activeMenu === 'reviews' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <ReviewManager tours={tours} />
            </div>
          )}
          {activeMenu === 'communication' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <CommunicationManager />
            </div>
          )}
          {activeMenu === 'payment-settings' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <PaymentManager />
             </div>
          )}
          {activeMenu === 'company-profile' && currentUserProfile && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <CompanyProfile userData={currentUserProfile} />
             </div>
          )}
          {activeMenu === 'website-builder' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <WebsiteBuilder initialTab={websiteBuilderTab} key={websiteBuilderTab} />
             </div>
          )}
          {activeMenu === 'general-settings' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <GeneralSettings activeTab={settingsActiveTab as any} />
             </div>
          )}
          {activeMenu === 'backup' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <BackupManager />
             </div>
          )}
          {activeMenu === 'popups-manager' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <PopupManager />
             </div>
          )}
          {activeMenu === 'timeslots' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <BookingTimeManager />
             </div>
          )}
          {/* Add/Edit Tour View */}
          {activeMenu === 'tours' && (
            <TourEditorForm
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabs={tabs}
              editingId={editingId}
              setEditingId={setEditingId}
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              resetForm={resetForm}
              setShowAiModal={setShowAiModal}
              setAiGenMode={setAiGenMode}
              setActiveMenu={setActiveMenu}
              setSelectedCopySourceTourId={setSelectedCopySourceTourId}
              setShowCopyModal={setShowCopyModal}
              tours={tours}
              categories={categories}
              tourTypes={tourTypes}
              locations={locations}
              labels={labels}
              globalAddOns={globalAddOns}
              globalTransports={globalTransports}
              allGuides={allGuides}
              currentUserProfile={currentUserProfile}
              loadingStates={loadingStates}
              highlightsText={highlightsText}
              setHighlightsText={setHighlightsText}
              inclusionsText={inclusionsText}
              setInclusionsText={setInclusionsText}
              exclusionsText={exclusionsText}
              setExclusionsText={setExclusionsText}
              expandedPackages={expandedPackages}
              setExpandedPackages={setExpandedPackages}
              expandedItinerary={expandedItinerary}
              setExpandedItinerary={setExpandedItinerary}
              handleFileUpload={handleFileUpload}
              handleItineraryImageUpload={handleItineraryImageUpload}
              handleOpenGallery={handleOpenGallery}
            />
          )}
      {(activeMenu === 'suppliers' || activeMenu === 'agents') && (
        <PartnerDetailView
          selectedPartner={selectedPartner}
          setSelectedPartner={setSelectedPartner}
          activeMenu={activeMenu}
          tours={tours}
          bookings={bookings}
          users={users}
          handleDeleteUser={handleDeleteUser}
          resetForm={resetForm}
          setFormData={setFormData}
          formData={formData}
          setActiveMenu={setActiveMenu}
          setTourSupplierFilter={setTourSupplierFilter}
        />
      )}

      {/* Invoice Generator & Billing */}
      {activeMenu === 'invoices' && (
        <InvoiceManager />
      )}

      {/* Digital Liability Waivers & Safety Kiosk */}
      {activeMenu === 'waivers' && (
        <WaiverManager />
      )}

      {/* Car Rental Booking Management */}
      {activeMenu === 'car-rental-bookings' && (
        <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
          <CarRentalBookingManager allGuides={allGuides} />
        </div>
      )}

      {/* Car Rental Fleet & Pricing Management */}
      {(activeMenu === 'car-fleet' || activeMenu === 'car-rental') && (
        <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
          <FleetManager openMediaGallery={openMediaGallery} />
        </div>
      )}

      {/* Car Rental Customer Booking Automations */}
      {activeMenu === 'car-rental-automations' && (
        <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
          <RentalAutomations />
        </div>
      )}

      {/* Car Rental Module Activation & Settings */}
      {activeMenu === 'car-rental-settings' && (
        <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
          <RentalModuleSettings />
        </div>
      )}

      {/* Other Views Placeholders */}
        {['schedule', 'payments'].includes(activeMenu) && (
           <div className="h-[70vh] flex flex-col items-center justify-center bg-white rounded-[10px] border border-gray-100 border-dashed motion-safe:animate-in motion-safe:fade-in">
              <div className="h-20 w-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                {menuItems.find(m => m.id === activeMenu)?.icon && (
                  (() => {
                    const Icon = menuItems.find(m => m.id === activeMenu)?.icon;
                    return <Icon className="h-10 w-10 text-primary" />;
                  })()
                )}
              </div>
              <h3 className="text-2xl font-black tracking-tight text-gray-900 mb-2">
                {activeMenuItemLabel} Module
              </h3>
              <p className="text-gray-400 font-medium">This professional suite is currently being optimized for your workflow.</p>
           </div>
        )}

        </div>
      </main>

      {/* Global Booking Modals */}
      <AnimatePresence>
        <AssignGuideModal
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          booking={assignBooking}
          allGuides={allGuides}
          bookings={bookings}
          loading={loadingStates.assigningGuide}
          onAssign={handleAssignToGuide}
        />
      </AnimatePresence>
      <BookingDetailModal 
        isOpen={isBookingDetailOpen}
        onClose={() => { setIsBookingDetailOpen(false); setIsEditingTrip(false); }}
        booking={globalSelectedBooking}
        setBooking={setGlobalSelectedBooking}
        isEditingTrip={isEditingTrip}
        setIsEditingTrip={setIsEditingTrip}
        tours={tours}
        newNote={newNote}
        setNewNote={setNewNote}
        handleAddInternalNote={handleAddInternalNote}
        handleSaveBookingChange={handleSaveBookingChange}
        handlePrintManifest={handlePrintManifest}
        handleDeleteBooking={handleDeleteBooking}
        sendBookingEmail={sendBookingEmail}
        formatPrice={formatPrice}
        userRole={currentUserProfile?.role}
        loadingStates={loadingStates}
        updateBookingStatus={updateBookingStatus}
        onAssignGuide={(b) => { setAssignBooking(b); setIsAssignOpen(true); }}
      />

      {/* Global Manual Booking Creation Modal */}
      <CreateManualBookingModal
        isOpen={isManualBookingModalOpen}
        onClose={() => setIsManualBookingModalOpen(false)}
        tours={tours}
        allGuides={allGuides}
        currentUserProfile={currentUserProfile}
      />

      <AnimatePresence>
        <AdminAiModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          isEditing={!!editingId}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          aiGenMode={aiGenMode}
          setAiGenMode={setAiGenMode}
          isAiBuilding={isAiBuilding}
          onGenerate={handleAiGenerate}
        />
        {showCopyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCopyModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] overflow-hidden shadow-2xl z-10"
            >
              <div className="bg-gradient-to-r from-teal-600 to-primary p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <Copy className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight font-sans">Fast Copy Elements</h3>
                    <p className="text-teal-50 font-medium text-xs">Instantly copy components of another tour and save valuable time.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block animate-pulse">Select Source Tour</label>
                  <select
                    value={selectedCopySourceTourId}
                    onChange={(e) => setSelectedCopySourceTourId(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-100 p-4 focus:border-orange-500 focus:outline-none bg-gray-50/50 transition-all font-bold text-sm text-gray-700 cursor-pointer"
                  >
                    <option value="">-- Choose an Existing Tour to Copy From --</option>
                    {tours
                      .filter(t => t.id !== editingId)
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Select Elements to Copy</label>
                  <div className="grid grid-cols-2 gap-3.5">
                    <label className={cn(
                      "flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer select-none transition-all",
                      copyPackages ? "bg-orange-50/40 border-orange-200 text-orange-950" : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    )}>
                      <input 
                        type="checkbox" 
                        checked={copyPackages} 
                        onChange={() => setCopyPackages(!copyPackages)}
                        className="rounded accent-primary"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase">Packages & Pricing</span>
                      </div>
                    </label>

                    <label className={cn(
                      "flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer select-none transition-all",
                      copyInclusions ? "bg-orange-50/40 border-orange-200 text-orange-950" : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    )}>
                      <input 
                        type="checkbox" 
                        checked={copyInclusions} 
                        onChange={() => setCopyInclusions(!copyInclusions)}
                        className="rounded accent-primary"
                      />
                      <span className="text-xs font-black uppercase">Inclusions & Exclusions</span>
                    </label>

                    <label className={cn(
                      "flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer select-none transition-all",
                      copyFaqs ? "bg-orange-50/40 border-orange-200 text-orange-950" : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    )}>
                      <input 
                        type="checkbox" 
                        checked={copyFaqs} 
                        onChange={() => setCopyFaqs(!copyFaqs)}
                        className="rounded accent-primary"
                      />
                      <span className="text-xs font-black uppercase">FAQs & Policies</span>
                    </label>

                    <label className={cn(
                      "flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer select-none transition-all",
                      copyImportantInfo ? "bg-orange-50/40 border-orange-200 text-orange-950" : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    )}>
                      <input 
                        type="checkbox" 
                        checked={copyImportantInfo} 
                        onChange={() => setCopyImportantInfo(!copyImportantInfo)}
                        className="rounded accent-primary"
                      />
                      <span className="text-xs font-black uppercase">Important Info / Terms</span>
                    </label>

                    <label className={cn(
                      "flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer select-none transition-all",
                      copyHighlights ? "bg-orange-50/40 border-orange-200 text-orange-950" : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    )}>
                      <input 
                        type="checkbox" 
                        checked={copyHighlights} 
                        onChange={() => setCopyHighlights(!copyHighlights)}
                        className="rounded accent-primary"
                      />
                      <span className="text-xs font-black uppercase">Highlights</span>
                    </label>

                    <label className={cn(
                      "flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer select-none transition-all",
                      copyItinerary ? "bg-orange-50/40 border-orange-200 text-orange-950" : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    )}>
                      <input 
                        type="checkbox" 
                        checked={copyItinerary} 
                        onChange={() => setCopyItinerary(!copyItinerary)}
                        className="rounded accent-primary"
                      />
                      <span className="text-xs font-black uppercase">Itinerary</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCopyModal(false)}
                    className="flex-1 px-8 py-4 rounded-xl border border-gray-100 font-black text-xs text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedCopySourceTourId}
                    onClick={handleFastCopyContent}
                    className="flex-[2] bg-primary text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                    Copy selected items
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Reusable Platform Media Gallery Modal */}
        <MediaGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          galleryUrls={galleryUrls}
          loadingGallery={loadingGallery}
          gallerySearch={gallerySearch}
          setGallerySearch={setGallerySearch}
          galleryFilterTab={galleryFilterTab}
          setGalleryFilterTab={setGalleryFilterTab}
          gallerySelected={gallerySelected}
          setGallerySelected={setGallerySelected}
          isMultiSelect={isMultiSelect}
          onConfirmSelection={handleConfirmPickImages}
        />
      </AnimatePresence>

      {/* Floating Image Converter Success Status Dashboard */}
      <AnimatePresence>
        {optToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-6 right-6 z-[9999] bg-white border border-gray-100 p-4 rounded-xl shadow-2xl shadow-orange-500/10 max-w-sm w-full font-sans overflow-hidden flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900 tracking-tight">WebP Converter Active</h4>
                  <p className="text-[10px] font-bold text-gray-405 text-primary">Successfully Optimized</p>
                </div>
              </div>
              <button 
                onClick={() => setOptToast(null)}
                className="text-gray-300 hover:text-gray-500 transition-colors p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-2.5 flex flex-col gap-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-gray-500 text-[10px]">
                <span>Original file</span>
                <span className="truncate max-w-[120px] font-semibold" title={optToast.originalName}>{optToast.originalName}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500 text-[10px]">
                <span>Format converted</span>
                <span className="font-extrabold text-primary bg-orange-50 px-1.5 py-0.5 rounded text-[9px] uppercase">webp</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-bold">Size saved</span>
                <span className="text-primary font-black">-{optToast.percentSaved}%</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400">File footprint</span>
                <span className="text-gray-700 font-bold">
                  {optToast.originalSizeKb > 1024 ? `${(optToast.originalSizeKb/1024).toFixed(1)} MB` : `${optToast.originalSizeKb} KB`} → <span className="text-primary font-black">{optToast.optimizedSizeKb > 1024 ? `${(optToast.optimizedSizeKb/1024).toFixed(1)} MB` : `${optToast.optimizedSizeKb} KB`}</span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-gray-400 select-none">
              <Check className="h-3 w-3 text-orange-500" />
              <span>Reduced raw footprint for lightning-fast loads!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}