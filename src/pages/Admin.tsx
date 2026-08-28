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

const OSMLocationSelector = ({ onLocationSelect }: { onLocationSelect: (url: string) => void }) => {
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocation = async (text: string) => {
    if (text.length < 3) return;
    setLoading(true);
    setIsOpen(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('OSM Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (queryText) searchLocation(queryText);
    }, 500);
    return () => clearTimeout(timer);
  }, [queryText]);

  const selectPlace = (place: NominatimResult) => {
    const { lat, lon, boundingbox } = place;
    // OSM Embed URL format using bounding box
    const bbox = `${boundingbox[2]},${boundingbox[0]},${boundingbox[3]},${boundingbox[1]}`;
    const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
    onLocationSelect(embedUrl);
    setQueryText(place.display_name);
    setIsOpen(false);
  };

  return (
    <div className="relative group" ref={dropdownRef}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
        <Search className="h-4 w-4" />
      </div>
      <input 
        value={queryText}
        onChange={(e) => setQueryText(e.target.value)}
        onFocus={() => queryText && setIsOpen(true)}
        className="w-full rounded-2xl border-2 border-orange-100 bg-orange-50/10 pl-11 pr-10 py-4 font-bold text-sm focus:border-primary focus:bg-white focus:outline-none transition-all shadow-sm"
        placeholder="Find location on OpenStreetMap..."
      />
      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {results.map((result) => (
            <button
              key={result.place_id}
              type="button"
              onClick={() => selectPlace(result)}
              className="w-full text-left px-5 py-4 hover:bg-gray-50 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0"
            >
              <MapPin className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-900 line-clamp-1">{result.display_name}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">OpenStreetMap Result</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

import { generateTourData, GeneratedTour, generateBlogPostData, GeneratedBlogPost } from '../services/geminiService';
import { COUNTRIES, TIME_SLOTS } from '../constants';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  addDays,
  isBefore,
  subMonths, 
  isToday,
  parseISO 
} from 'date-fns';

import GeneralSettings from '../components/Admin/GeneralSettings';
import WebsiteBuilder from '../components/Admin/WebsiteBuilder';
import PopupManager from '../components/Admin/PopupManager';
import TourListing from '../components/Admin/TourListing';
import BookingDetailModal from '../components/Admin/BookingDetailModal';
import BookingManagementPanel from '../components/Admin/BookingManager';
import StatsDashboard from '../components/Admin/StatsDashboard';
import BookingReports from '../components/Admin/BookingReports';
import PayoutManager from '../components/Admin/PayoutManager';
import BulkAvailabilityModal from '../components/Admin/BulkAvailabilityModal';
import ImportBooking from '../components/Admin/ImportBooking';
import TicketManager from '../components/Admin/TicketManager';
import GoogleAnalytics from './Dashboard/GoogleAnalytics';
import AIHubManager from '../components/Admin/AIHubManager';
import ProposalGenerator from '../components/Admin/ProposalGenerator';
import UserManager from '../components/Admin/UserManager';
import PaymentManager from '../components/Admin/PaymentManager';
import ChannelManager from '../components/Admin/ChannelManager';
import WebhookLogInspector from '../components/Admin/WebhookLogInspector';
import DisasterRecoveryBackup from '../components/Admin/DisasterRecoveryBackup';
import ConversionFunnelTracker from '../components/Admin/ConversionFunnelTracker';
import AnalyticsManager from '../components/Admin/AnalyticsManager';
import CreateManualBookingModal from '../components/Admin/CreateManualBookingModal';
import FleetManager from '../components/Admin/CarRental/FleetManager';
import RentalModuleSettings from '../components/Admin/CarRental/RentalModuleSettings';
import CarRentalBookingManager from '../components/Admin/CarRental/CarRentalBookingManager';
import RentalAutomations from '../components/Admin/CarRental/RentalAutomations';

type MenuId = 'dashboard' | 'tours' | 'all-tours' | 'categories' | 'tour-types' | 'locations' | 'addons' | 'transports' | 'coupons' | 'schedule' | 'blog' | 'ai-hub' | 'analytics' | 'analytics-overview' | 'analytics-integration' | 'google-analytics' | 'reviews' | 'communication' | 'payments' | 'settings' | 'users' | 'users-admins' | 'users-suppliers' | 'users-agents' | 'users-customers' | 'payment-settings' | 'pages' | 'urgency-points' | 'timeslots' | 'bookings' | 'channel-manager' | 'import-bookings' | 'guides' | 'overview' | 'inventory' | 'operations' | 'content' | 'settings-group' | 'general-settings' | 'popups-manager' | 'labels' | 'partners' | 'suppliers' | 'agents' | 'company-profile' | 'access-roles' | 'reports' | 'payouts' | 'live-inventory' | 'backup' | 'inquiries' | 'tickets' | 'billing' | 'custom-domain' | 'developer-hub' | 'user-settings' | 'logout-trigger' | 'website-builder' | 'conversion-funnel' | 'invoices' | 'waivers' | 'car-rental' | 'car-rental-bookings' | 'car-fleet' | 'car-rental-automations' | 'car-rental-settings';
type Tab = 'basic' | 'content' | 'inclusions' | 'pricing' | 'itinerary' | 'accommodations' | 'guides' | 'addOns' | 'transports' | 'faq' | 'info' | 'seo';

const MetaManager = ({ type, items }: { type: 'categories' | 'tour-types' | 'locations' | 'labels', items: (Category | TourType | LocationMeta | TourLabel)[] }) => {
  const [newValue, setNewValue] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [newColor, setNewColor] = useState('#10b981');
  const [newFeaturedImage, setNewFeaturedImage] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  
  const collectionName = type === 'categories' ? 'categories' : type === 'tour-types' ? 'tourTypes' : type === 'labels' ? 'tourLabels' : 'locationMeta';
  const label = type === 'categories' ? 'Category' : type === 'tour-types' ? 'Tour Type' : type === 'labels' ? 'Label' : 'Location';

  const PRESET_ICONS = [
    'Tag', 'Globe', 'MapPin', 'Camera', 'Compass', 'Waves', 'Mountain', 'Sun', 'Tent', 
    'Bike', 'Bus', 'Car', 'Plane', 'Sailboat', 'Palmtree', 'Navigation', 'Activity'
  ];

  const PRESET_COLORS = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280', '#06b6d4', '#f97316'
  ];

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    try {
      const data = { 
        name: newValue,
        ...(type === 'categories' && { icon: newIcon }),
        ...(type === 'labels' && { color: newColor }),
        ...(type === 'locations' && { 
          featuredImage: newFeaturedImage,
          description: newDescription
        })
      };

      if (editingItem) {
        await updateDoc(doc(db, collectionName, editingItem.id), data);
        alert(`Success: ${label} updated!`);
      } else {
        await addDoc(collection(db, collectionName), data);
        alert(`Success: ${label} created!`);
      }
      
      setNewValue('');
      setNewIcon('');
      setNewColor('#10b981');
      setNewFeaturedImage('');
      setNewDescription('');
      setIsAdding(false);
      setEditingItem(null);
    } catch (error) {
      console.error(`Error saving ${label}`, error);
      alert(`Error: Failed to save ${label}. Check permissions.`);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setNewIcon(url);
    } catch (error) {
      console.error("Upload error", error);
      alert("Failed to upload icon");
    } finally {
      setUploading(false);
    }
  };

  const handleLocationImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setNewFeaturedImage(url);
    } catch (error) {
      console.error("Upload error", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete this ${label}?`)) {
      await deleteDoc(doc(db, collectionName, id));
    }
  };

  const startEdit = (item: any) => {
    setEditingItem(item);
    setNewValue(item.name);
    setNewIcon(item.icon || '');
    setNewFeaturedImage(item.featuredImage || item.image || item.imageUrl || '');
    setNewDescription(item.description || '');
    setIsAdding(true);
  };

  const IconDisplay = ({ icon, className }: { icon?: string, className?: string }) => {
    if (!icon) {
       if (type === 'categories') return <Tag className={cn("h-5 w-5", className)} />;
       if (type === 'tour-types') return <Globe className={cn("h-5 w-5", className)} />;
       return <MapPin className={cn("h-5 w-5", className)} />;
    }
    
    if (icon.startsWith('http')) {
      return <img src={icon} className={cn("h-5 w-5 object-contain", className)} referrerPolicy="no-referrer" />;
    }
    
    const IconComponent = (LucideIcons as any)[icon] || (type === 'categories' ? LucideIcons.Tag : type === 'tour-types' ? LucideIcons.Globe : LucideIcons.MapPin);
    return <IconComponent className={cn("h-5 w-5", className)} />;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">{label} Management</h2>
          <p className="text-gray-500 font-medium">Add and organize your {label.toLowerCase()} descriptors.</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingItem(null);
            setNewValue('');
            setNewIcon('');
            setNewFeaturedImage('');
            setNewDescription('');
          }}
          className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-orange-200"
        >
          <Plus className="h-4 w-4" /> Add New {label}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-white p-8 rounded-[10px] border-2 border-primary border-dashed flex flex-col gap-6 motion-safe:animate-in motion-safe:slide-in-from-top-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">
              {editingItem ? `Editing ${label}: ${editingItem.name}` : `Add New ${label}`}
            </h3>
          </div>
          <div className="flex gap-4 items-center">
            <input 
              autoFocus
              required
              placeholder={`Enter ${label.toLowerCase()} name...`}
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              className="flex-1 rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all font-bold"
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-white px-8 py-4 rounded-[10px] font-black text-xs shadow-xl active:scale-95 transition-all">
                {editingItem ? 'Update' : 'Save'} {label}
              </button>
              <button type="button" onClick={() => {
                setIsAdding(false);
                setEditingItem(null);
              }} className="text-gray-400 font-bold px-4">Cancel</button>
            </div>
          </div>

          {type === 'categories' && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Category Icon</p>
              
              <div className="flex flex-wrap gap-2">
                {PRESET_ICONS.map(iconName => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setNewIcon(iconName)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all",
                      newIcon === iconName ? "bg-primary border-primary text-white shadow-lg shadow-orange-100" : "bg-gray-50 border-gray-50 text-gray-400 hover:border-orange-200"
                    )}
                  >
                    <IconDisplay icon={iconName} />
                  </button>
                ))}
                
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    id="icon-upload"
                  />
                  <label 
                    htmlFor="icon-upload"
                    className={cn(
                      "flex items-center justify-center p-3 rounded-[10px] border-2 border-dashed transition-all cursor-pointer h-[46px] w-[46px]",
                      newIcon.startsWith('http') ? "bg-primary border-primary text-white shadow-lg shadow-orange-100" : "border-gray-200 text-gray-400 hover:border-primary hover:text-primary"
                    )}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </label>
                </div>
              </div>

              {newIcon.startsWith('http') && (
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-[10px] border border-orange-100">
                  <img src={newIcon} className="h-8 w-8 object-contain" referrerPolicy="no-referrer" />
                  <p className="text-xs font-bold text-gray-600">Custom image uploaded</p>
                  <button type="button" onClick={() => setNewIcon('')} className="ml-auto text-red-500 font-bold text-xs">Remove</button>
                </div>
              )}
            </div>
          )}

          {type === 'locations' && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Featured Image</label>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <input
                    type="text"
                    placeholder="Image URL or upload path (e.g. https://...)"
                    value={newFeaturedImage}
                    onChange={e => setNewFeaturedImage(e.target.value)}
                    className="flex-1 w-full rounded-[10px] border-2 border-gray-100 p-3 focus:border-primary focus:outline-none text-xs font-medium"
                  />
                  <div className="relative shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLocationImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      id="location-image-upload"
                    />
                    <label 
                      htmlFor="location-image-upload"
                      className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-[10px] text-xs font-bold cursor-pointer transition-colors"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      <span>Upload Image</span>
                    </label>
                  </div>
                </div>
                {newFeaturedImage && (
                  <div className="mt-3 relative w-32 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                    <img 
                      src={newFeaturedImage.startsWith('api/') ? '/' + newFeaturedImage : newFeaturedImage} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                    <button
                      type="button"
                      onClick={() => setNewFeaturedImage('')}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Location Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe this destination, highlights, climate, or why travelers should visit..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full rounded-[10px] border-2 border-gray-100 p-3 focus:border-primary focus:outline-none text-xs font-medium"
                />
              </div>
            </div>
          )}
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => {
          let locImage = (item as any).featuredImage || (item as any).image || (item as any).imageUrl;
          if (locImage && locImage.startsWith('api/')) {
            locImage = '/' + locImage;
          }
          const locDesc = (item as any).description;
          return (
            <div key={item.id} className="bg-white p-6 rounded-[10px] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-primary transition-all">
              <div className="flex items-start gap-4 mb-4">
                {type === 'locations' && locImage ? (
                  <img src={locImage} className="h-16 w-16 rounded-[12px] object-cover shrink-0 border border-gray-100 shadow-sm" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-12 w-12 bg-orange-50 rounded-[10px] flex items-center justify-center text-primary transition-transform group-hover:scale-110 shrink-0">
                    <IconDisplay icon={(item as any).icon} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-gray-900 tracking-tight text-base truncate">{item.name}</h4>
                  {type === 'locations' && locDesc && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 font-medium">{locDesc}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 pt-3 border-t border-gray-50">
                <button 
                  onClick={() => startEdit(item)}
                  className="p-2 text-gray-400 hover:text-primary transition-colors bg-gray-50 rounded-lg"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-gray-300 hover:text-red-600 transition-colors bg-gray-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CouponManager = ({ items }: { items: Coupon[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<Partial<Coupon>>({ 
    code: '', 
    discountType: 'percentage', 
    discountValue: 0, 
    minBookingValue: 0, 
    isActive: true 
  });

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.code?.trim()) return;
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'coupons', editingItem.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        alert("Success: Coupon updated!");
      } else {
        await addDoc(collection(db, 'coupons'), { 
          ...formData,
          createdAt: serverTimestamp()
        });
        alert("Success: Coupon created!");
      }
      setFormData({ code: '', discountType: 'percentage', discountValue: 0, minBookingValue: 0, isActive: true });
      setIsAdding(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error saving Coupon", error);
      alert("Error: Failed to save Coupon.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete this Coupon?`)) {
      await deleteDoc(doc(db, 'coupons', id));
    }
  };

  const startEdit = (coupon: Coupon) => {
    setEditingItem(coupon);
    setFormData(coupon);
    setIsAdding(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Coupons</h2>
          <p className="text-gray-500 font-medium">Create and manage discount codes for your tours.</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingItem(null);
            setFormData({ code: '', discountType: 'percentage', discountValue: 0, minBookingValue: 0, isActive: true });
          }}
          className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-orange-200"
        >
          <Plus className="h-4 w-4" /> Add New Coupon
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-white p-8 rounded-[10px] border border-gray-100 space-y-6 motion-safe:animate-in motion-safe:slide-in-from-top-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">
              {editingItem ? `Editing Coupon: ${editingItem.code}` : 'Create New Coupon'}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Coupon Code</label>
              <input 
                required
                placeholder="e.g. SUMMER25"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Discount Type</label>
              <select 
                value={formData.discountType}
                onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none bg-white font-bold"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Discount Value</label>
              <input 
                required
                type="number"
                value={formData.discountValue}
                onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Min. Booking ($)</label>
              <input 
                required
                type="number"
                value={formData.minBookingValue}
                onChange={e => setFormData({ ...formData, minBookingValue: Number(e.target.value) })}
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-gray-50">
             <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 font-bold px-4">Cancel</button>
             <button type="submit" className="bg-primary text-white px-10 py-4 rounded-[10px] font-bold text-sm tracking-wide shadow-xl active:scale-95 transition-all">Create Coupon</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-[10px] border border-gray-100 shadow-sm flex flex-col gap-4 group hover:border-primary transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center text-primary">
                  <Tag className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-bold text-gray-900 text-lg tracking-tight block">{item.code}</span>
                  <span className="text-sm font-semibold text-primary">
                    {item.discountType === 'percentage' ? `${item.discountValue}% Off` : `$${item.discountValue} Off`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => startEdit(item)}
                  className="p-2 text-gray-400 hover:text-primary transition-colors bg-gray-50 rounded-lg"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors bg-gray-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Min. Spend: ${item.minBookingValue}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PageManager = () => {
    const [pages, setPages] = useState<PageContent[]>([]);
    const [editingPage, setEditingPage] = useState<Partial<PageContent> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'pages'), (snapshot) => {
            setPages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PageContent)));
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingPage?.title || !editingPage?.slug) return;

        try {
            const pageData = {
                title: editingPage.title,
                slug: editingPage.slug.toLowerCase().replace(/ /g, '-'),
                content: editingPage.content || '',
                seo: editingPage.seo || { title: '', description: '' },
                updatedAt: serverTimestamp()
            };

            if (editingPage.id) {
                await updateDoc(doc(db, 'pages', editingPage.id), pageData);
            } else {
                await addDoc(collection(db, 'pages'), pageData);
            }
            setEditingPage(null);
            alert("Page saved successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to save page.");
        }
    };

    if (loading) return (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Static Pages</h2>
                    <p className="text-gray-500 font-medium">Manage your Terms and Conditions, Privacy Policy, and other content pages.</p>
                </div>
                <button 
                  onClick={() => setEditingPage({ title: '', slug: '', content: '' })}
                  className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-orange-200"
                >
                  <Plus className="h-4 w-4" /> Create New Page
                </button>
            </div>

            {editingPage && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="bg-white rounded-[20px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">
                                {editingPage.id ? 'Edit Page' : 'New Page'}
                            </h3>
                            <button onClick={() => setEditingPage(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500">Page Title</label>
                                    <input 
                                      required
                                      value={editingPage.title}
                                      onChange={e => setEditingPage({ ...editingPage, title: e.target.value })}
                                      className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none font-bold"
                                      placeholder="e.g. Terms and Conditions"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500">URL Slug</label>
                                    <input 
                                      required
                                      value={editingPage.slug}
                                      onChange={e => setEditingPage({ ...editingPage, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                      className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none font-bold text-gray-500"
                                      placeholder="e.g. terms-and-conditions"
                                      disabled={!!editingPage.id}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500">Page Content (HTML/Markdown supported)</label>
                                <textarea 
                                  required
                                  rows={10}
                                  value={editingPage.content}
                                  onChange={e => setEditingPage({ ...editingPage, content: e.target.value })}
                                  className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none font-medium min-h-[200px]"
                                  placeholder="Paste your page content here..."
                                />
                            </div>

                            <div className="pt-6 border-t border-gray-100 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icons.Share2 className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">SEO Settings (Custom Meta)</h4>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Meta Title</label>
                                        <input 
                                            value={editingPage.seo?.title || ''}
                                            onChange={e => setEditingPage({ ...editingPage, seo: { ...editingPage.seo, title: e.target.value } })}
                                            className="w-full rounded-[8px] border border-gray-100 p-3 text-sm focus:border-primary outline-none"
                                            placeholder="SEO Browser Title"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Meta Description</label>
                                        <textarea 
                                            value={editingPage.seo?.description || ''}
                                            onChange={e => setEditingPage({ ...editingPage, seo: { ...editingPage.seo, description: e.target.value } })}
                                            className="w-full rounded-[8px] border border-gray-100 p-3 text-sm focus:border-primary outline-none"
                                            rows={2}
                                            placeholder="Short SEO description..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setEditingPage(null)} className="px-8 py-4 font-bold text-gray-400">Cancel</button>
                                <button type="submit" className="bg-primary text-white px-12 py-4 rounded-[10px] font-bold text-sm tracking-wide shadow-xl active:scale-95 transition-all">
                                    {editingPage.id ? 'Save Changes' : 'Create Page'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages.map(page => (
                    <div key={page.id} className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm transition-all hover:border-primary group hover:shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-14 w-14 rounded-[10px] bg-orange-50 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                                <FileText className="h-7 w-7" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingPage(page)} className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-gray-50 rounded-lg"><Edit2 className="h-5 w-5" /></button>
                                <button 
                                  onClick={async () => {
                                    if (confirm("Delete this page?")) await deleteDoc(doc(db, 'pages', page.id));
                                  }}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2 group-hover:text-primary transition-colors">{page.title}</h3>
                        <p className="text-sm font-semibold text-primary tracking-tight mb-4">/{page.slug}</p>
                        <p className="text-xs text-gray-500 line-clamp-3 font-medium leading-relaxed">
                            {(page.content || '').replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BookingTimeManager = () => {
    const [slots, setSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'settings', 'timeslots_' + (getActiveTenantId() || 'global')), (snap) => {
            if (snap.exists()) {
                setSlots(snap.data().slots || []);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const toggleSlot = async (time: string) => {
        const newSlots = slots.includes(time) 
            ? slots.filter(s => s !== time) 
            : [...slots, time].sort();
        
        try {
            await setDoc(doc(db, 'settings', 'timeslots_' + (getActiveTenantId() || 'global')), { slots: newSlots });
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Global Time Slots</h2>
                <p className="text-gray-500 font-medium">Configure the default available 30-minute intervals for your tours.</p>
            </div>

            <div className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-[10px] border border-primary/10">
                    <div className="h-10 w-10 bg-primary text-white rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Default Availability</p>
                        <p className="text-xs text-gray-500 font-medium">Selected slots will be available for customers at checkout by default.</p>
                    </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {TIME_SLOTS.map(time => {
                        const isSelected = slots.includes(time);
                        return (
                            <button
                                key={time}
                                onClick={() => toggleSlot(time)}
                                className={cn(
                                    "py-3 rounded-xl text-xs font-bold transition-all border-2",
                                    isSelected 
                                        ? "bg-primary text-white border-primary shadow-lg shadow-orange-100" 
                                        : "bg-white text-gray-400 border-gray-50 hover:border-orange-200"
                                )}
                            >
                                {time}
                            </button>
                        );
                    })}
                </div>

                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {slots.length} Active Slots Selected
                    </p>
                    <button 
                        onClick={async () => {
                            if(confirm("Clear all slots?")) await setDoc(doc(db, 'settings', 'timeslots_' + (getActiveTenantId() || 'global')), { slots: [] });
                        }}
                        className="text-xs font-bold text-red-500 hover:underline"
                    >
                        Clear All
                    </button>
                </div>
            </div>
        </div>
    );
};

  const ReviewManager = ({ tours }: { tours: Tour[] }) => {
    const { settings } = useSettings();
    const [localSettings, setLocalSettings] = useState<Partial<SiteSettings>>({});
    const [savingSettings, setSavingSettings] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
    const [deletingBulk, setDeletingBulk] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showSourceSettings, setShowSourceSettings] = useState(false);
    const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
    const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
      if (settings) {
        setLocalSettings(settings);
      }
    }, [settings]);

    const handleSyncExternalReviews = async (platformName: 'google' | 'tripadvisor' | 'airbnb' | 'all') => {
      setSyncingPlatform(platformName);
      setSyncSuccessMsg(null);
      
      try {
        let targetUrl = '';
        if (platformName === 'google') targetUrl = localSettings?.googleReviewUrl || '';
        else if (platformName === 'tripadvisor') targetUrl = localSettings?.tripadvisorUrl || '';
        else if (platformName === 'airbnb') targetUrl = localSettings?.airbnbUrl || '';

        const tenantId = getActiveTenantId();
        const response = await fetch('/api/gemini/fetch-external-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: platformName,
            url: targetUrl,
            tenantId: tenantId || 'global'
          })
        });

        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.reviews)) {
          throw new Error(data.error || 'Failed to fetch reviews from external server');
        }

        const newFetchedReviews = data.reviews;

        for (const rev of newFetchedReviews) {
          await addDoc(collection(db, 'reviews'), {
            userId: 'ext-' + (rev.platform || platformName) + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            userName: rev.userName || 'Verified Guest',
            nationality: rev.nationality || 'Global Traveler',
            rating: rev.rating || 5,
            comment: rev.comment || '',
            platform: rev.platform || platformName,
            status: 'approved',
            createdAt: new Date(),
            isVerified: true
          });
        }

        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const fetched: Review[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Review));
        setReviews(fetched);

        setSyncingPlatform(null);
        setSyncSuccessMsg(`Successfully collected ${newFetchedReviews.length} real verified review(s) from ${platformName === 'all' ? 'all external review links' : platformName} into tenant showcase!`);
        setTimeout(() => setSyncSuccessMsg(null), 6000);
      } catch (err: any) {
        console.error("Error syncing external reviews:", err);
        setSyncingPlatform(null);
        alert(`Unable to sync reviews automatically: ${err.message || 'Please check network connection.'}`);
      }
    };

    const handleUpdateSetting = async (field: string, value: any) => {
      const updated = { ...localSettings, [field]: value };
      setLocalSettings(updated);
      try {
        setSavingSettings(true);
        const tenantId = getActiveTenantId();
        await setDoc(doc(db, 'settings', tenantId || 'general'), { [field]: value }, { merge: true });
        setSavingSettings(false);
      } catch (err) {
        console.error("Error saving setting:", err);
        setSavingSettings(false);
      }
    };
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [newReview, setNewReview] = useState<Partial<Review>>({
      rating: 5,
      userName: '',
      nationality: 'Australia',
      title: '',
      comment: '',
      userPhoto: '',
      images: [],
      tourDate: new Date().toISOString().split('T')[0],
      status: 'approved'
    });
    const [targetTourId, setTargetTourId] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);

    useEffect(() => {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      let unsubFallback: (() => void) | null = null;
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          setReviews(snapshot.docs.map(doc => ({ 
            id: doc.id, 
            refPath: doc.ref.path, // Store the path for easier matching
            ...doc.data() 
          } as any)));
          setLoading(false);
        },
        (error) => {
          console.error("Reviews snapshot error:", error);
          if (unsubFallback) unsubFallback();
          unsubFallback = onSnapshot(collection(db, 'reviews'), (snap) => {
            const list = snap.docs.map(doc => ({
              id: doc.id,
              refPath: doc.ref.path,
              ...doc.data()
            } as any));
            // Sort in memory (desc)
            list.sort((a, b) => {
              const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tB - tA;
            });
            setReviews(list);
          });
          setLoading(false);
        }
      );
      return () => {
        unsubscribe();
        if (unsubFallback) unsubFallback();
      };
    }, []);

    const handleCreateReview = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!targetTourId || !newReview.userName || !newReview.comment) {
        alert("Please fill in all required fields.");
        return;
      }

      try {
        const tour = tours.find(t => t.id === targetTourId);
        const reviewData = {
          ...newReview,
          tourId: targetTourId,
          tourTitle: tour?.title || 'Tour',
          status: 'approved',
          isVerified: true,
          label: 'Verified Guest',
          createdAt: serverTimestamp(),
          userId: auth.currentUser?.uid || 'admin'
        };

        await addDoc(collection(db, 'reviews'), reviewData);

        // Recalculate rating
        const reviewsSnap = await getDocs(query(collection(db, 'reviews'), where('tourId', '==', targetTourId), where('status', '==', 'approved')));
        const approvedReviews = reviewsSnap.docs.map(d => d.data() as Review);
        const count = approvedReviews.length;
        const avg = count > 0 
          ? parseFloat((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
          : 0;
            
        await updateDoc(doc(db, 'tours', targetTourId), {
          rating: avg,
          reviewsCount: count
        });

        alert("Review created successfully!");
        setShowAddForm(false);
        setNewReview({
          rating: 5,
          userName: '',
          nationality: 'Australia',
          title: '',
          comment: '',
          userPhoto: '',
          images: [],
          tourDate: new Date().toISOString().split('T')[0],
          status: 'approved'
        });
        setTargetTourId('');
      } catch (err) {
        console.error(err);
        alert("Error creating review");
      }
    };

    const handleDelete = async (review: any) => {
      if (confirm(`Delete review from ${review.userName}?`)) {
        try {
          const docRef = doc(db, review.refPath);
          const tourId = review.tourId;
          
          await deleteDoc(docRef);
          
          // Recalculate tour average rating
          if (tourId) {
            const reviewsSnap = await getDocs(query(collection(db, 'reviews'), where('tourId', '==', tourId), where('status', '==', 'approved')));
            const approvedReviews = reviewsSnap.docs.map(d => d.data() as Review);
            
            const count = approvedReviews.length;
            const avg = count > 0 
              ? parseFloat((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
              : 0;
              
            await updateDoc(doc(db, 'tours', tourId), {
              rating: avg,
              reviewsCount: count
            });
          }
          alert("Review deleted.");
        } catch (error) {
          console.error("Error deleting", error);
        }
      }
    };

    const handleDeleteSelected = async () => {
      if (selectedReviewIds.length === 0) return;
      if (!confirm(`Are you sure you want to permanently delete ${selectedReviewIds.length} selected review(s)?`)) return;

      try {
        setDeletingBulk(true);
        const toDelete = reviews.filter(r => selectedReviewIds.includes(r.id));
        for (const r of toDelete) {
          const docRef = (r as any).refPath ? doc(db, (r as any).refPath) : doc(db, 'reviews', r.id);
          await deleteDoc(docRef);
        }
        setSelectedReviewIds([]);
        setSyncSuccessMsg(`Successfully deleted ${toDelete.length} selected review(s)!`);
        setTimeout(() => setSyncSuccessMsg(null), 5000);
      } catch (err) {
        console.error("Bulk delete error:", err);
        alert("Error deleting selected reviews. Please try again.");
      } finally {
        setDeletingBulk(false);
      }
    };

    const handleClearAllExternalReviews = async () => {
      const extList = reviews.filter(r => r.platform || (r as any).userId?.startsWith('ext-') || (r as any).userId?.includes('-sync-'));
      if (extList.length === 0) {
        alert("No external/imported reviews found to delete.");
        return;
      }

      if (!confirm(`Are you sure you want to delete all ${extList.length} imported external reviews? This will immediately remove them from the website.`)) return;

      try {
        setDeletingBulk(true);
        for (const r of extList) {
          const docRef = (r as any).refPath ? doc(db, (r as any).refPath) : doc(db, 'reviews', r.id);
          await deleteDoc(docRef);
        }
        setSelectedReviewIds(prev => prev.filter(id => !extList.some(r => r.id === id)));
        setSyncSuccessMsg(`Successfully deleted all ${extList.length} imported external review(s)!`);
        setTimeout(() => setSyncSuccessMsg(null), 5000);
      } catch (err) {
        console.error("Clear external reviews error:", err);
        alert("Error clearing external reviews.");
      } finally {
        setDeletingBulk(false);
      }
    };

    const handleModerate = async (review: any, status: 'approved' | 'rejected') => {
      try {
        const docRef = doc(db, review.refPath);
        await updateDoc(docRef, { status });
        
        // Recalculate tour average rating
        const tourId = review.tourId;
        if (tourId) {
          const reviewsSnap = await getDocs(query(collection(db, 'reviews'), where('tourId', '==', tourId), where('status', '==', 'approved')));
          const approvedReviews = reviewsSnap.docs.map(d => d.data() as Review);
          
          const count = approvedReviews.length;
          const avg = count > 0 
            ? parseFloat((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
            : 0;
            
          await updateDoc(doc(db, 'tours', tourId), {
            rating: avg,
            reviewsCount: count
          });
        }
        
        alert(`Review ${status}!`);
      } catch (error) {
        console.error("Error moderating", error);
      }
    };

    if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;

    return (
      <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Guest Reviews</h2>
          <p className="text-gray-500 font-medium text-sm">Monitor and moderate all client feedback across all tours.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           {/* View Switcher */}
           <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
             <button 
               onClick={() => setViewMode('list')}
               className={cn(
                 "p-2 rounded-lg transition-all",
                 viewMode === 'list' ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
               )}
               title="List View"
             >
               <Icons.List className="h-4 w-4" />
             </button>
             <button 
               onClick={() => setViewMode('grid')}
               className={cn(
                 "p-2 rounded-lg transition-all",
                 viewMode === 'grid' ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
               )}
               title="Grid View"
             >
               <Icons.LayoutGrid className="h-4 w-4" />
             </button>
           </div>

           <button 
             onClick={() => setShowSourceSettings(!showSourceSettings)}
             className="bg-slate-900 text-white px-5 py-3 rounded-[10px] font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all border border-slate-700 cursor-pointer"
           >
             <Icons.Award className="h-4 w-4 text-amber-400" />
             {showSourceSettings ? 'Hide Review Config' : 'External Review Widget & Links'}
           </button>

           <button 
             onClick={() => setShowAddForm(!showAddForm)}
             className="bg-primary text-white px-6 py-3 rounded-[10px] font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all cursor-pointer"
           >
             {showAddForm ? <Icons.X className="h-4 w-4" /> : <Icons.Plus className="h-4 w-4" />}
             {showAddForm ? 'Cancel' : 'Write Review'}
           </button>
           <div className="flex items-center gap-4 bg-orange-50 px-6 py-3 rounded-[10px] border border-orange-100">
              <div className="flex flex-col items-center">
                 <span className="text-xl font-black text-primary">{reviews.filter(r => (r as any).status === 'approved').length}</span>
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Approved</span>
              </div>
              <div className="w-px h-6 bg-orange-100" />
              <div className="flex flex-col items-center">
                 <span className="text-xl font-black text-amber-500">{reviews.filter(r => !(r as any).status || (r as any).status === 'pending').length}</span>
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Pending</span>
              </div>
           </div>
        </div>
      </div>

        {showSourceSettings && (
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6 motion-safe:animate-in motion-safe:fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Icons.Award className="h-4 w-4 text-amber-400" />
                  Elfsight / Trustmary Style External Review Widget & Source Links
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Paste your review listing links from Google Maps, TripAdvisor, or Airbnb to collect and automatically display real verified reviews on your website.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSyncExternalReviews('all')}
                  disabled={syncingPlatform !== null || deletingBulk}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {syncingPlatform === 'all' ? (
                    <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Icons.RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Auto-Sync All Review Links
                </button>

                <button
                  type="button"
                  onClick={handleClearAllExternalReviews}
                  disabled={deletingBulk || syncingPlatform !== null}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {deletingBulk ? <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icons.Trash2 className="h-3.5 w-3.5 text-red-400" />}
                  Clear All Imported Reviews
                </button>

                <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Widget Status</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings?.externalReviewsEnabled ?? true}
                      onChange={(e) => handleUpdateSetting('externalReviewsEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {syncSuccessMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <Icons.CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                {syncSuccessMsg}
              </div>
            )}

            {/* Elfsight Live Review Widget Integration Card */}
            <div className="bg-slate-950 p-5 rounded-xl border border-amber-500/30 shadow-lg space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
                    ES
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      Elfsight Review Widget Code Integration
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                        Supports Airbnb, Google & TripAdvisor
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Paste your widget HTML embed code or App ID from Elfsight to display live customer reviews on your website.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={localSettings?.elfsightEnabled ?? true}
                    onChange={(e) => handleUpdateSetting('elfsightEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Elfsight Widget Embed Code or App ID
                </label>
                <textarea
                  rows={2}
                  value={localSettings?.elfsightEmbedCode ?? ''}
                  onChange={(e) => handleUpdateSetting('elfsightEmbedCode', e.target.value)}
                  placeholder={`Paste Elfsight code snippet e.g.:\n<script src="https://static.elfsight.com/platform/platform.js" async></script>\n<div class="elfsight-app-12345678-abcd-1234-abcd-1234567890ab" data-elfsight-app-lazy></div>`}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-mono bg-slate-900 border border-slate-700 text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-y"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>Paste full Elfsight HTML code or class (e.g., <code className="text-slate-400">elfsight-app-xxxx</code>).</span>
                  {localSettings?.elfsightEmbedCode && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Icons.CheckCircle2 className="h-3 w-3" /> Elfsight Code Loaded
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Widget Display Limit Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <Icons.Sliders className="h-4 w-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Maximum Reviews Displayed on Website</span>
                  <span className="text-[10px] text-slate-400 block">Limit the number of reviews shown in the website review showcase section</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Display Limit:</label>
                <select
                  value={localSettings?.maxDisplayReviews ?? 6}
                  onChange={(e) => handleUpdateSetting('maxDisplayReviews', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 text-amber-400 font-bold text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                >
                  <option value={3}>3 Reviews (Compact)</option>
                  <option value={6}>6 Reviews (Standard - 2 rows)</option>
                  <option value={9}>9 Reviews (3 rows)</option>
                  <option value={12}>12 Reviews (4 rows)</option>
                  <option value={18}>18 Reviews (Extended)</option>
                  <option value={999}>Show All Reviews</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-900">
              {/* Google Maps Card */}
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span className="font-bold text-xs">Google Maps Reviews</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings?.googleReviewsEnabled ?? true}
                      onChange={(e) => handleUpdateSetting('googleReviewsEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Google Maps Review Link</label>
                  <input
                    type="text"
                    value={localSettings?.googleReviewUrl ?? 'https://maps.app.goo.gl/2pB62e6cRxkjJevL6'}
                    onChange={(e) => handleUpdateSetting('googleReviewUrl', e.target.value)}
                    placeholder="https://maps.app.goo.gl/2pB62e6cRxkjJevL6"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      max="5"
                      min="1"
                      value={localSettings?.googleRating ?? 4.9}
                      onChange={(e) => handleUpdateSetting('googleRating', parseFloat(e.target.value) || 4.9)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Count</label>
                    <input
                      type="number"
                      value={localSettings?.googleReviewCount ?? 520}
                      onChange={(e) => handleUpdateSetting('googleReviewCount', parseInt(e.target.value, 10) || 520)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSyncExternalReviews('google')}
                  disabled={syncingPlatform !== null}
                  className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {syncingPlatform === 'google' ? <Icons.Loader2 className="h-3 w-3 animate-spin" /> : <Icons.Download className="h-3 w-3" />}
                  Fetch & Sync Google Reviews
                </button>
              </div>

              {/* TripAdvisor Card */}
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] flex items-center justify-center shrink-0">TA</span>
                    <span className="font-bold text-xs">TripAdvisor Reviews</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings?.tripadvisorEnabled ?? true}
                      onChange={(e) => handleUpdateSetting('tripadvisorEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TripAdvisor Listing Link</label>
                  <input
                    type="text"
                    value={localSettings?.tripadvisorUrl ?? 'https://www.tripadvisor.com/Attraction_Review-g297694-d7939737-Reviews-Bali_Adventours-Denpasar_Bali.html'}
                    onChange={(e) => handleUpdateSetting('tripadvisorUrl', e.target.value)}
                    placeholder="https://www.tripadvisor.com/Attraction_Review-g297694-d7939737-Reviews-Bali_Adventours-Denpasar_Bali.html"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      max="5"
                      min="1"
                      value={localSettings?.tripadvisorRating ?? 5.0}
                      onChange={(e) => handleUpdateSetting('tripadvisorRating', parseFloat(e.target.value) || 5.0)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Count</label>
                    <input
                      type="number"
                      value={localSettings?.tripadvisorReviewCount ?? 342}
                      onChange={(e) => handleUpdateSetting('tripadvisorReviewCount', parseInt(e.target.value, 10) || 342)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSyncExternalReviews('tripadvisor')}
                  disabled={syncingPlatform !== null}
                  className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {syncingPlatform === 'tripadvisor' ? <Icons.Loader2 className="h-3 w-3 animate-spin" /> : <Icons.Download className="h-3 w-3" />}
                  Fetch & Sync TripAdvisor Reviews
                </button>
              </div>

              {/* Airbnb Card */}
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center shrink-0">ab</span>
                    <span className="font-bold text-xs">Airbnb Reviews</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings?.airbnbEnabled ?? true}
                      onChange={(e) => handleUpdateSetting('airbnbEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Airbnb Host Listing Link</label>
                  <input
                    type="text"
                    value={localSettings?.airbnbUrl ?? 'https://www.airbnb.com/experiences/4127629'}
                    onChange={(e) => handleUpdateSetting('airbnbUrl', e.target.value)}
                    placeholder="https://www.airbnb.com/experiences/4127629"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      max="5"
                      min="1"
                      value={localSettings?.airbnbRating ?? 4.95}
                      onChange={(e) => handleUpdateSetting('airbnbRating', parseFloat(e.target.value) || 4.95)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Count</label>
                    <input
                      type="number"
                      value={localSettings?.airbnbReviewCount ?? 185}
                      onChange={(e) => handleUpdateSetting('airbnbReviewCount', parseInt(e.target.value, 10) || 185)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSyncExternalReviews('airbnb')}
                  disabled={syncingPlatform !== null}
                  className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {syncingPlatform === 'airbnb' ? <Icons.Loader2 className="h-3 w-3 animate-spin" /> : <Icons.Download className="h-3 w-3" />}
                  Fetch & Sync Airbnb Reviews
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleCreateReview} className="bg-white p-8 rounded-[10px] border border-orange-100 shadow-sm space-y-6 motion-safe:animate-in motion-safe:fade-in">
             <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Create Professional Admin Review</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Origin</label>
                   <select 
                     value={newReview.platform || 'direct'}
                     onChange={e => setNewReview({...newReview, platform: e.target.value as any})}
                     className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                   >
                     <option value="direct">Direct Website</option>
                     <option value="google">Google Maps</option>
                     <option value="tripadvisor">TripAdvisor</option>
                     <option value="airbnb">Airbnb</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Tour</label>
                   <select 
                     value={targetTourId}
                     onChange={e => setTargetTourId(e.target.value)}
                     className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                   >
                     <option value="">Select Tour...</option>
                     {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Guest Name</label>
                   <input 
                     type="text" 
                     value={newReview.userName}
                     onChange={e => setNewReview({...newReview, userName: e.target.value})}
                     className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                     placeholder="John Doe"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nationality</label>
                   <select 
                     value={newReview.nationality}
                     onChange={e => setNewReview({...newReview, nationality: e.target.value})}
                     className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                   >
                     {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Guest Avatar</label>
                   <div className="flex items-center gap-4">
                     <div className="h-14 w-14 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                       {newReview.userPhoto ? (
                         <img src={newReview.userPhoto} className="h-full w-full object-cover" />
                       ) : (
                         <Icons.User className="h-6 w-6 text-gray-300" />
                       )}
                     </div>
                     <div className="flex-1">
                       <label className="relative cursor-pointer bg-white border-2 border-gray-100 px-4 py-2 rounded-lg text-[10px] font-bold text-gray-600 hover:border-primary transition-all inline-block">
                         {uploadingAvatar ? (
                           <div className="flex items-center gap-2">
                             <Icons.Loader2 className="h-3 w-3 animate-spin" />
                             Uploading...
                           </div>
                         ) : 'Choose Photo'}
                         <input 
                           type="file" 
                           className="hidden" 
                           accept="image/*"
                           onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               try {
                                 setUploadingAvatar(true);
                                 const url = await uploadImage(file);
                                 setNewReview({...newReview, userPhoto: url});
                               } catch (err) {
                                 alert("Upload failed");
                               } finally {
                                 setUploadingAvatar(false);
                               }
                             }
                           }}
                         />
                       </label>
                       {newReview.userPhoto && (
                         <button 
                           type="button" 
                           onClick={() => setNewReview({...newReview, userPhoto: ''})}
                           className="ml-2 text-[10px] font-bold text-red-500 underline"
                         >
                           Remove
                         </button>
                       )}
                     </div>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating</label>
                   <input 
                     type="number" 
                     min="1" max="5"
                     value={newReview.rating}
                     onChange={e => setNewReview({...newReview, rating: parseInt(e.target.value)})}
                     className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tour Date</label>
                   <input 
                     type="date" 
                     value={newReview.tourDate}
                     onChange={e => setNewReview({...newReview, tourDate: e.target.value})}
                     className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                   />
                </div>
             </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Review Headline / Highlight</label>
              <input 
                type="text" 
                value={newReview.title || ''}
                onChange={e => setNewReview({...newReview, title: e.target.value})}
                className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                placeholder="e.g. Unforgettable Sunrise Experience!"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Comment</label>
              <textarea 
                value={newReview.comment}
                onChange={e => setNewReview({...newReview, comment: e.target.value})}
                className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all h-32"
                placeholder="Write the review content here..."
              />
            </div>

             <div className="space-y-4 pt-4 border-t border-gray-50">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Experience Photos (Optional)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {(newReview.images || []).map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                      <img src={img} className="h-full w-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setNewReview({ ...newReview, images: newReview.images?.filter((_, i) => i !== idx) })}
                        className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Icons.X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-orange-50/10 transition-all">
                    {uploadingImages ? (
                      <Icons.Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      <>
                        <Icons.Camera className="h-6 w-6 text-gray-300" />
                        <span className="text-[8px] font-black text-gray-400 uppercase">Add Photo</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          try {
                            setUploadingImages(true);
                            const urls = await Promise.all(files.map(f => uploadImage(f)));
                            setNewReview({ ...newReview, images: [...(newReview.images || []), ...urls] });
                          } catch (err) {
                            alert("Upload failed");
                          } finally {
                            setUploadingImages(false);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
             </div>

             <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
                Publish Verified Review
             </button>
          </form>
        )}

        {/* Bulk Action Toolbar */}
        {reviews.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={reviews.length > 0 && selectedReviewIds.length === reviews.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedReviewIds(reviews.map(r => r.id));
                    } else {
                      setSelectedReviewIds([]);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                Select All ({reviews.length})
              </label>

              {selectedReviewIds.length > 0 && (
                <span className="text-xs font-black text-primary bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                  {selectedReviewIds.length} Selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {selectedReviewIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deletingBulk}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  {deletingBulk ? <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icons.Trash2 className="h-3.5 w-3.5" />}
                  Delete Selected ({selectedReviewIds.length})
                </button>
              )}

              <button
                onClick={handleClearAllExternalReviews}
                disabled={deletingBulk}
                className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Icons.Trash2 className="h-3.5 w-3.5" />
                Clear External Reviews
              </button>
            </div>
          </div>
        )}

        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
        )}>
          {reviews.map(review => {
            const status = (review as any).status || 'pending';
            const isSelected = selectedReviewIds.includes(review.id);
            return (
              <div key={review.id} className={cn(
                "bg-white p-8 rounded-[10px] border shadow-sm flex flex-col gap-6 group transition-all relative",
                viewMode === 'list' ? "md:flex-row md:items-start" : "flex-col",
                status === 'approved' ? "border-orange-100" : status === 'rejected' ? "border-red-100 opacity-60" : "border-amber-200 bg-amber-50/10",
                isSelected && "ring-2 ring-primary border-primary bg-orange-50/10"
              )}>
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReviewIds(prev => [...prev, review.id]);
                      } else {
                        setSelectedReviewIds(prev => prev.filter(id => id !== review.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className={cn(
                  "h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden mt-4 md:mt-0",
                  viewMode === 'grid' && "mx-auto"
                )}>
                  {review.userPhoto ? (
                    <img src={review.userPhoto} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-2xl font-black text-primary">{review.userName.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className={cn(
                    "flex flex-col justify-between gap-4",
                    viewMode === 'list' ? "md:flex-row md:items-center" : "items-center text-center"
                  )}>
                    <div className="flex-1">
                      <div className={cn(
                        "flex items-center gap-3",
                        viewMode === 'grid' && "justify-center"
                      )}>
                        <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                           {review.userName}
                           {review.nationality && (
                             <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                               <Icons.Globe className="h-2.5 w-2.5" /> {review.nationality}
                             </span>
                           )}
                           {review.platform && (
                             <span className={cn(
                               "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1",
                               review.platform === 'google' ? "bg-blue-100 text-blue-700 border border-blue-200" :
                               review.platform === 'tripadvisor' ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                               review.platform === 'airbnb' ? "bg-rose-100 text-rose-700 border border-rose-200" :
                               "bg-purple-100 text-purple-700 border border-purple-200"
                             )}>
                               {review.platform}
                             </span>
                           )}
                        </h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                          status === 'approved' ? "bg-orange-100 text-orange-700" : 
                          status === 'rejected' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {status}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs font-bold text-gray-400 flex flex-wrap items-center gap-2 mt-0.5",
                        viewMode === 'grid' && "justify-center"
                      )}>
                         <span className="flex items-center gap-2"><Icons.Calendar className="h-3 w-3" /> Traveled on {review.tourDate || 'Unknown Date'}</span>
                         {review.tourTitle && <span className="text-primary">â€¢ Experience: {review.tourTitle}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Icons.Star key={s} className={cn("h-4 w-4", review.rating >= s ? "fill-current" : "text-gray-200")} />
                      ))}
                    </div>
                  </div>
                  <div className={cn(
                    "space-y-2",
                    viewMode === 'grid' && "text-center"
                  )}>
                     {review.title && <h4 className={cn("font-black text-gray-900", viewMode === 'list' ? "border-l-4 border-primary pl-3" : "text-lg")}>{review.title}</h4>}
                     <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">{review.comment}</p>
                  </div>
                  
                  {((review as any).images && (review as any).images.length > 0) ? (
                    <div className={cn(
                      "flex flex-wrap gap-2 mt-4",
                      viewMode === 'grid' && "justify-center"
                    )}>
                      {(review as any).images.map((img: string, idx: number) => (
                        <div key={idx} className="h-16 w-16 rounded-lg overflow-hidden border border-gray-100 shadow-sm cursor-zoom-in" onClick={() => window.open(img, '_blank')}>
                           <img src={img} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  ) : review.image && (
                    <div className={cn(
                      "mt-4 rounded-xl overflow-hidden border border-gray-100 h-24 w-40 shadow-sm cursor-zoom-in",
                      viewMode === 'grid' && "mx-auto"
                    )} onClick={() => window.open(review.image, '_blank')}>
                       <img src={review.image} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  
                  <div className="pt-6 border-t border-gray-50 flex items-center justify-end gap-3 flex-wrap">
                    {status !== 'approved' && (
                      <button 
                        onClick={() => handleModerate(review, 'approved')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                    )}
                    {status !== 'rejected' && (
                      <button 
                        onClick={() => handleModerate(review, 'rejected')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(review)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {reviews.length === 0 && (
            <div className="p-20 text-center text-gray-400 bg-white rounded-[10px] border border-gray-100 border-dashed">
               No reviews collected yet.
            </div>
          )}
        </div>
      </div>
    );
  };  const LegacyUserManager = ({ users, setUsers, onDeleteUser, roleFilter, allTours = [], resetForm, setFormData, formData, setActiveMenu }: { 
    users: UserProfile[], 
    setUsers: (u: UserProfile[]) => void, 
    onDeleteUser: (u: UserProfile) => void, 
    roleFilter?: UserProfile['role'], 
    allTours?: Tour[],
    resetForm: () => void,
    setFormData: (f: any) => void,
    formData: any,
    setActiveMenu: (m: any) => void
  }) => {
    const [loading, setLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [isAddingPartner, setIsAddingPartner] = useState(false);
    const [newPartner, setNewPartner] = useState<Partial<UserProfile>>({
      role: roleFilter || 'supplier',
      status: 'active',
      displayName: '',
      email: '',
      companyName: '',
      commissionRate: 10,
      discountRate: 15
    });

    // Update newPartner role if roleFilter changes
    useEffect(() => {
      if (roleFilter) {
        setNewPartner(prev => ({ ...prev, role: roleFilter }));
      }
    }, [roleFilter]);

    useEffect(() => {
      const tenantId = getActiveTenantId();
      const q = tenantId 
        ? query(collection(db, 'users'), where('tenantId', '==', tenantId))
        : query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let list = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        list.sort((a: any, b: any) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setUsers(list);
        setLoading(false);
      });
      return unsubscribe;
    }, []);

    const filteredUsers = useMemo(() => {
      if (!roleFilter) return users;
      return users.filter(u => u.role === roleFilter);
    }, [users, roleFilter]);

    const handleCreatePartner = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPartner.email || !newPartner.displayName) {
        alert("Email and Name are required");
        return;
      }
      
      const tempId = `u_${Math.random().toString(36).substr(2, 9)}`;
      console.log("[Admin] Attempting to create user:", {
        email: newPartner.email,
        role: newPartner.role,
        currentUser: auth.currentUser?.email,
        authUid: auth.currentUser?.uid,
        tempId
      });
      
      setLoading(true);
      try {
        const partnerData = {
          ...newPartner,
          uid: tempId,
          photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(newPartner.displayName || '')}&background=random`,
          tenantId: getActiveTenantId(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        console.log("[Admin] Target path: users/" + tempId);
        await setDoc(doc(db, 'users', tempId), partnerData);
        console.log("[Admin] User created successfully");
        
        setIsAddingPartner(false);
        setNewPartner({
          role: roleFilter || 'supplier',
          status: 'active',
          displayName: '',
          email: '',
          companyName: '',
          commissionRate: 10,
          discountRate: 15
        });
        alert(`${newPartner.role?.charAt(0).toUpperCase()}${newPartner.role?.slice(1)} account created! Note: They still need to sign up with this email to access their dashboard.`);
      } catch (error: any) {
        console.error("Error creating user", error);
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.WRITE, `users/${tempId}`);
        }
        alert("Failed to create user. " + (error.message || ""));
      } finally {
        setLoading(false);
      }
    };
;

    const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      try {
        await updateDoc(doc(db, 'users', editingUser.uid), {
          role: editingUser.role,
          status: editingUser.status || 'active',
          commissionRate: Number(editingUser.commissionRate || 0),
          discountRate: Number(editingUser.discountRate || 0),
          companyName: editingUser.companyName || '',
          publicEmail: editingUser.publicEmail || '',
          taxId: editingUser.taxId || '',
          phoneNumber: editingUser.phoneNumber || '',
          website: editingUser.website || '',
          instagramUrl: editingUser.instagramUrl || '',
          facebookUrl: editingUser.facebookUrl || '',
          twitterUrl: editingUser.twitterUrl || '',
          tiktokUrl: editingUser.tiktokUrl || '',
          payoutMethod: editingUser.payoutMethod || null,
          updatedAt: serverTimestamp()
        });
        setEditingUser(null);
        alert("User updated successfully!");
      } catch (error) {
        console.error("Error updating user", error);
        alert("Failed to update user.");
      }
    };

    const handleDeleteUserLocal = async (user: UserProfile) => {
      setLoading(true);
      await onDeleteUser(user);
      setLoading(false);
    };

    if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;

    const roleName = roleFilter ? roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1) : 'System';

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{roleName} Users</h2>
            <p className="text-gray-500 font-medium">Manage permissions, roles, and financial terms.</p>
          </div>
          <button 
            onClick={() => setIsAddingPartner(true)}
            className="px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all flex items-center gap-2"
          >
            <Icons.PlusCircle className="h-4 w-4" /> Add New {roleFilter || 'User'}
          </button>
        </div>

        <div className="bg-white rounded-[10px] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                {roleFilter === 'supplier' && (
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Tours</th>
                )}
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Commission/Discount</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map(u => (
                <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <img src={u.photoURL} className="h-10 w-10 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                       <div>
                         <p className="text-sm font-black text-gray-900">{u.displayName}</p>
                         <p className="text-[10px] font-bold text-gray-400 tracking-tight">{u.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={cn(
                       "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                       u.role === 'admin' ? "bg-red-50 text-red-600" :
                       u.role === 'supplier' ? "bg-purple-50 text-purple-600" :
                       u.role === 'agent' ? "bg-blue-50 text-blue-600" :
                       "bg-gray-100 text-gray-500"
                     )}>
                       {u.role}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5">
                       <div className={cn(
                         "h-1.5 w-1.5 rounded-full",
                         u.status === 'active' || !u.status ? "bg-orange-500" :
                         u.status === 'pending' ? "bg-amber-500" : "bg-red-500"
                       )} />
                       <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest">
                         {u.status || 'active'}
                       </span>
                     </div>
                  </td>
                  {roleFilter === 'supplier' && (
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {allTours.filter(t => t.supplierId === u.uid).map(t => (
                          <button
                            key={t.id}
                            onClick={() => window.open(`/tours/${t.slug}`, '_blank')}
                            className="bg-gray-100 text-[9px] font-black uppercase text-gray-500 px-2 py-1 rounded-md hover:bg-primary/10 hover:text-primary transition-all whitespace-nowrap"
                            title={t.title}
                          >
                            {t.title}
                          </button>
                        ))}
                        {allTours.filter(t => t.supplierId === u.uid).length === 0 && (
                          <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-xl border border-dashed border-gray-200 w-full">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight">No Tours Assigned</span>
                            <button 
                              onClick={() => {
                                resetForm();
                                setFormData({ ...formData, supplierId: u.uid, supplierName: u.companyName || u.displayName });
                                setActiveMenu('tours');
                              }}
                              className="text-[9px] font-bold text-primary hover:underline mt-0.5"
                            >
                              + Create First Tour
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 text-xs font-black text-gray-900">
                    {u.role === 'supplier' ? `${u.commissionRate || 0}% Fee` : 
                     u.role === 'agent' ? `${u.discountRate || 0}% Disc` : 
                     '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <div className="flex justify-end gap-2">
                       <button 
                         onClick={() => setEditingUser(u)}
                         className="p-2 text-gray-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-all"
                         title="Edit User"
                       >
                          <Icons.Settings className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => handleDeleteUserLocal(u)}
                         className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                         title="Delete User"
                       >
                          <Icons.Trash2 className="h-4 w-4" />
                       </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add New Partner Modal */}
        <AnimatePresence>
          {isAddingPartner && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddingPartner(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-8 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Create New {roleFilter ? roleName : 'User'}</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Manual account setup</p>
                  </div>
                  <button onClick={() => setIsAddingPartner(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                    <Icons.X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-8 pt-6 space-y-8 overflow-y-auto custom-scrollbar flex-grow">
                  <form onSubmit={handleCreatePartner} id="create-partner-form" className="space-y-6">
                    {!roleFilter && (
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">User Role</label>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {(['admin', 'supplier', 'agent', 'customer'] as UserProfile['role'][]).map(r => (
                              <button 
                                key={r}
                                type="button" 
                                onClick={() => setNewPartner({...newPartner, role: r})}
                                className={cn(
                                  "p-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest", 
                                  newPartner.role === r 
                                    ? "border-primary bg-orange-50 text-orange-700" 
                                    : "border-gray-50 text-gray-400"
                                )}>
                                 {r}
                              </button>
                            ))}
                         </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name / Contact Person</label>
                        <input
                          required
                          type="text"
                          value={newPartner.displayName}
                          onChange={(e) => setNewPartner({...newPartner, displayName: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email (Primary for notifications)</label>
                        <input
                          required
                          type="email"
                          value={newPartner.email}
                          onChange={(e) => setNewPartner({...newPartner, email: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                          placeholder="partner@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Company Name</label>
                        <input
                          type="text"
                          value={newPartner.companyName}
                          onChange={(e) => setNewPartner({...newPartner, companyName: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                          placeholder="e.g. Bali Tours Ltd."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                          {newPartner.role === 'supplier' ? 'Commission Fee (%)' : 'Wholesale Discount (%)'}
                        </label>
                        <input
                          type="number"
                          value={newPartner.role === 'supplier' ? newPartner.commissionRate : newPartner.discountRate}
                          onChange={(e) => setNewPartner({
                            ...newPartner, 
                            [newPartner.role === 'supplier' ? 'commissionRate' : 'discountRate']: Number(e.target.value)
                          })}
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Account Status</label>
                        <div className="flex h-11 items-center px-4 bg-gray-50 rounded-2xl">
                           <span className="text-xs font-bold text-gray-900">Active</span>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 flex-shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingPartner(false)}
                    className="flex-1 py-4 bg-white text-gray-500 border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all font-sans"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    form="create-partner-form"
                    disabled={loading}
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 disabled:opacity-50 font-sans"
                  >
                    {loading ? "Creating..." : "Save Partner Profile"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* User Edit Modal */}
        <AnimatePresence>
          {editingUser && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingUser(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-8 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <img src={editingUser.photoURL} className="h-12 w-12 rounded-full border-2 border-primary/10" referrerPolicy="no-referrer" />
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">Edit Profile</h3>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{editingUser.displayName}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                    <Icons.X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-8 pt-6 space-y-8 overflow-y-auto custom-scrollbar flex-grow">
                  <form onSubmit={handleSaveUser} id="edit-user-form" className="space-y-6 pb-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Access Role</label>
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="customer">Customer</option>
                          <option value="agent">Agent (Wholesale)</option>
                          <option value="supplier">Supplier (Vendor)</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Account Status</label>
                        <select
                          value={editingUser.status || 'active'}
                          onChange={(e) => setEditingUser({...editingUser, status: e.target.value as any})}
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending Approval</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </div>

                    {editingUser.role === 'supplier' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-purple-50/50 p-6 rounded-3xl border border-purple-100">
                        <div className="flex items-center gap-3 mb-2">
                          <Icons.Store className="h-5 w-5 text-purple-600" />
                          <h4 className="text-sm font-black text-purple-900 uppercase tracking-tight">Supplier Configuration</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">Platform Commission (%)</label>
                            <input
                              type="number"
                              value={editingUser.commissionRate}
                              onChange={(e) => setEditingUser({...editingUser, commissionRate: Number(e.target.value)})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                              placeholder="e.g. 15"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">Company Name</label>
                            <input
                              type="text"
                              value={editingUser.companyName}
                              onChange={(e) => setEditingUser({...editingUser, companyName: e.target.value})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                                placeholder="Legal Entity Name"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">Public / Support Email</label>
                            <input
                              type="email"
                              value={editingUser.publicEmail}
                              onChange={(e) => setEditingUser({...editingUser, publicEmail: e.target.value})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                              placeholder="For guest contact"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">WhatsApp / Phone</label>
                            <input
                              type="text"
                              value={editingUser.phoneNumber}
                              onChange={(e) => setEditingUser({...editingUser, phoneNumber: e.target.value})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                              placeholder="+62..."
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">Website</label>
                            <input
                              type="url"
                              value={editingUser.website}
                              onChange={(e) => setEditingUser({...editingUser, website: e.target.value})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                              placeholder="https://..."
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">Instagram</label>
                            <input
                              type="text"
                              value={editingUser.instagramUrl}
                              onChange={(e) => setEditingUser({...editingUser, instagramUrl: e.target.value})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                              placeholder="@handle or URL"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">Facebook</label>
                            <input
                              type="text"
                              value={editingUser.facebookUrl}
                              onChange={(e) => setEditingUser({...editingUser, facebookUrl: e.target.value})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                              placeholder="URL"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-purple-100">
                          <div className="flex items-center gap-3 mb-4">
                            <Icons.Wallet className="h-4 w-4 text-purple-600" />
                            <h5 className="text-[10px] font-black text-purple-900 uppercase tracking-widest">Payout Settings</h5>
                          </div>
                          
                          <div className="space-y-4">
                            <select
                              value={editingUser.payoutMethod?.type || 'bank_transfer'}
                              onChange={(e) => setEditingUser({
                                ...editingUser, 
                                payoutMethod: { 
                                  ...(editingUser.payoutMethod || { type: 'bank_transfer' }), 
                                  type: e.target.value as any 
                                }
                              })}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                            >
                              <option value="bank_transfer">Bank Transfer</option>
                              <option value="paypal">PayPal</option>
                              <option value="other">Other Method</option>
                            </select>

                            {(!editingUser.payoutMethod || editingUser.payoutMethod.type === 'bank_transfer') && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Bank Name</label>
                                  <input 
                                    type="text" 
                                    value={editingUser.payoutMethod?.bankName || ''}
                                    onChange={(e) => setEditingUser({
                                      ...editingUser,
                                      payoutMethod: { ...editingUser.payoutMethod!, type: 'bank_transfer', bankName: e.target.value }
                                    })}
                                    className="w-full bg-white border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Account Number</label>
                                  <input 
                                    type="text" 
                                    value={editingUser.payoutMethod?.accountNumber || ''}
                                    onChange={(e) => setEditingUser({
                                      ...editingUser,
                                      payoutMethod: { ...editingUser.payoutMethod!, type: 'bank_transfer', accountNumber: e.target.value }
                                    })}
                                    className="w-full bg-white border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                                  />
                                </div>
                                <div className="space-y-1 col-span-2">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Account Holder</label>
                                  <input 
                                    type="text" 
                                    value={editingUser.payoutMethod?.accountHolder || ''}
                                    onChange={(e) => setEditingUser({
                                      ...editingUser,
                                      payoutMethod: { ...editingUser.payoutMethod!, type: 'bank_transfer', accountHolder: e.target.value }
                                    })}
                                    className="w-full bg-white border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                                  />
                                </div>
                              </div>
                            )}

                            {editingUser.payoutMethod?.type === 'paypal' && (
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">PayPal Email</label>
                                <input 
                                  type="email" 
                                  value={editingUser.payoutMethod?.paypalEmail || ''}
                                  onChange={(e) => setEditingUser({
                                    ...editingUser,
                                    payoutMethod: { ...editingUser.payoutMethod!, type: 'paypal', paypalEmail: e.target.value }
                                  })}
                                  className="w-full bg-white border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                                />
                              </div>
                            )}

                            {editingUser.payoutMethod?.type === 'other' && (
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Payout Details</label>
                                <textarea 
                                  rows={2}
                                  value={editingUser.payoutMethod?.details || ''}
                                  onChange={(e) => setEditingUser({
                                    ...editingUser,
                                    payoutMethod: { ...editingUser.payoutMethod!, type: 'other', details: e.target.value }
                                  })}
                                  className="w-full bg-white border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {editingUser.role === 'agent' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                          <Icons.BadgePercent className="h-5 w-5 text-blue-600" />
                          <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Agent Configuration</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">Base Discount (%)</label>
                            <input
                              type="number"
                              value={editingUser.discountRate}
                              onChange={(e) => setEditingUser({...editingUser, discountRate: Number(e.target.value)})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-200"
                              placeholder="e.g. 10"
                            />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">Company / Branch</label>
                             <input
                               type="text"
                               value={editingUser.companyName}
                               onChange={(e) => setEditingUser({...editingUser, companyName: e.target.value})}
                               className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-200"
                               placeholder="Agency Name"
                             />
                           </div>
                        </div>
                      </motion.div>
                    )}

                  </form>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 flex-shrink-0">
                  <button
                    type="submit"
                    form="edit-user-form"
                    className="flex-1 bg-gray-900 text-white rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-gray-200 hover:bg-black transition-all active:scale-95 font-sans"
                  >
                    Commit Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 bg-white text-gray-500 border border-gray-200 rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all active:scale-95 font-sans"
                  >
                    Discard
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const LegacyPaymentManager = () => {
  const [settings, setSettings] = useState({
    paypalClientId: '',
    paypalSecret: '',
    paypalSandboxClientId: '',
    paypalSandboxSecret: '',
    paypalMode: 'sandbox' as 'live' | 'sandbox',
    isPaypalEnabled: false,
    creditCardEnabled: false,
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    swiftCode: '',
    bankInstructions: '',
    isPayOnArrivalEnabled: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'payment_' + (getActiveTenantId() || 'global'));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (err) {
        console.error("Error fetching settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'payment_' + (getActiveTenantId() || 'global')), settings);
      alert("Success: Payment configuration saved!");
    } catch (err) {
      console.error(err);
      alert("Error: Failed to save configuration. Check permissions.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">Loading encrypted settings...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Payment Gateways</h2>
        <p className="text-gray-500 font-medium">Configure secure customer checkout and automated payouts.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white p-10 rounded-[10px] border border-gray-100 shadow-sm space-y-10">
            <div className="space-y-8">
              {/* PayPal Header Toggle */}
              <div className="flex items-center justify-between p-6 bg-orange-50/30 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-orange-100">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900">PayPal Express Checkout</h4>
                    <p className="text-xs text-primary font-bold mt-0.5">Primary Gateway</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setSettings({...settings, paypalMode: 'sandbox'})}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                        settings.paypalMode === 'sandbox' 
                          ? "bg-white text-orange-600 shadow-sm" 
                          : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({...settings, paypalMode: 'live'})}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                        settings.paypalMode === 'live' 
                          ? "bg-white text-primary shadow-sm" 
                          : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      Live
                    </button>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={settings.isPaypalEnabled}
                      onChange={e => setSettings({...settings, isPaypalEnabled: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Client ID Section */}
              <div className={cn("space-y-6 transition-all duration-500", !settings.isPaypalEnabled && "opacity-40 grayscale pointer-events-none")}>
                {settings.paypalMode === 'live' ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary tracking-widest uppercase flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                        Live PayPal Client ID
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <CreditCard className="h-4 w-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                        <input 
                          type="text"
                          placeholder="Enter your Production Client ID"
                          value={settings.paypalClientId}
                          onChange={e => setSettings({...settings, paypalClientId: e.target.value})}
                          className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 pl-12 focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-mono text-sm tracking-tight"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Live Client Secret (Optional)</label>
                      <input 
                        type="password"
                        placeholder="Required for some advanced features"
                        value={settings.paypalSecret || ''}
                        onChange={e => setSettings({...settings, paypalSecret: e.target.value})}
                        className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-mono text-sm tracking-tight"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-orange-600 tracking-widest uppercase flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        Sandbox PayPal Client ID
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Icons.Terminal className="h-4 w-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                        <input 
                          type="text"
                          placeholder="Enter your Sandbox Client ID"
                          value={settings.paypalSandboxClientId || ''}
                          onChange={e => setSettings({...settings, paypalSandboxClientId: e.target.value})}
                          className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 pl-12 focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-mono text-sm tracking-tight"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Sandbox Client Secret (Optional)</label>
                      <input 
                        type="password"
                        placeholder="Enter your Sandbox Client Secret"
                        value={settings.paypalSandboxSecret || ''}
                        onChange={e => setSettings({...settings, paypalSandboxSecret: e.target.value})}
                        className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-mono text-sm tracking-tight"
                      />
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 rounded-xl flex gap-3 text-gray-400">
                  <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <p className="text-[10px] leading-relaxed font-medium capitalize">
                    {settings.paypalMode === 'live' ? (
                      <>Retrieve your <span className="text-gray-900 font-bold">Live Credentials</span> from the <a href="https://developer.paypal.com/dashboard/applications/live" target="_blank" className="text-primary underline font-black">Production Dashboard</a>.</>
                    ) : (
                      <>
                        Test transactions using your <span className="text-gray-900 font-bold">Sandbox Credentials</span>. 
                        <br />
                        <span className="text-orange-600 font-black mt-1 block">Important: Log in with a "Personal" buyer account from <a href="https://developer.paypal.com/dashboard/accounts" target="_blank" className="underline">PayPal Accounts</a>. You cannot pay using your Business/Merchant account.</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Advanced CC Toggle */}
              <div className={cn("pt-6 border-t border-gray-50 transition-all duration-500", !settings.isPaypalEnabled && "opacity-0 invisible h-0 overflow-hidden")}>
                <label className="flex items-center gap-4 cursor-pointer group p-4 hover:bg-gray-50 rounded-xl transition-all">
                  <div className={cn(
                    "h-6 w-6 rounded border-2 flex items-center justify-center transition-all",
                    settings.creditCardEnabled ? "bg-primary border-primary text-white" : "border-gray-200"
                  )}>
                    {settings.creditCardEnabled && <Check className="h-4 w-4" />}
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.creditCardEnabled}
                    onChange={e => setSettings({...settings, creditCardEnabled: e.target.checked})}
                    className="hidden"
                  />
                  <div>
                    <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">Direct Card Entry</span>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Allow customers to pay via card without leaving checkout</p>
                  </div>
                </label>
              </div>

              {/* Bank Transfer Settings */}
              <div className="pt-8 border-t border-gray-50 space-y-6">
                <div>
                  <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <Database className="h-4 w-4 text-secondary" /> Manual Bank Transfer Details
                  </h4>
                  <p className="text-[10px] text-gray-400 font-medium">These details will be shown to customers who choose manual bank transfer.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Bank Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Bank Central Asia (BCA)"
                      value={settings.bankName || ''}
                      onChange={e => setSettings({...settings, bankName: e.target.value})}
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Account Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. 1234567890"
                      value={settings.accountNumber || ''}
                      onChange={e => setSettings({...settings, accountNumber: e.target.value})}
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">SWIFT Code</label>
                    <input 
                      type="text"
                      placeholder="e.g. BCACIDJA"
                      value={settings.swiftCode || ''}
                      onChange={e => setSettings({...settings, swiftCode: e.target.value})}
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Account Holder Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. PT Bali Adventours"
                    value={settings.accountHolder || ''}
                    onChange={e => setSettings({...settings, accountHolder: e.target.value})}
                    className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Payment Instructions</label>
                  <textarea 
                    rows={3}
                    placeholder="e.g. Please include your Booking ID as the reference number."
                    value={settings.bankInstructions || ''}
                    onChange={e => setSettings({...settings, bankInstructions: e.target.value})}
                    className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                  />
                </div>
              </div>

              {/* Pay on Arrival Settings */}
              <div className="pt-8 border-t border-gray-50 space-y-6">
                <div className="flex items-center justify-between p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-gray-900">Pay on Arrival (Cash)</h4>
                      <p className="text-xs text-emerald-600 font-bold mt-0.5">Toggle cash payment availability at checkout</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={settings.isPayOnArrivalEnabled ?? true}
                      onChange={e => setSettings({...settings, isPayOnArrivalEnabled: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary text-white py-5 rounded-[10px] font-bold text-sm tracking-wide shadow-2xl shadow-orange-100 hover:bg-orange-700 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Save className="h-4 w-4" /> Save Global Configuration
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-[10px] p-8 text-white relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 h-40 w-40 bg-white/5 rounded-full blur-3xl" />
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
              <Star className="h-5 w-5 text-amber-400 fill-current" /> Security Note
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed font-medium relative z-10">
              Clients never store sensitive payment data. We strictly use modern redirect or component-based methods ensuring 
              <span className="text-white font-bold ml-1">PCI-DSS compliance</span> at all times.
            </p>
          </div>

          <div className="rounded-[10px] border border-gray-100 p-8 space-y-4">
            <h4 className="text-xs font-black text-gray-900 tracking-widest uppercase">Transaction Preview</h4>
            <div className="p-4 rounded-xl bg-gray-50 space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-400">
                <span>Fee (2.9% + $0.30)</span>
                <span>-$3.20</span>
              </div>
              <div className="flex justify-between text-xs font-black text-primary border-t border-gray-100 pt-2">
                <span>Next Payout Deposit</span>
                <span>$96.80</span>
              </div>
            </div>
            <p className="text-[9px] text-gray-400">Estimated for a $100.00 booking through PayPal Express.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const UrgencyPointManager = ({ items }: { items: UrgencyPoint[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<UrgencyPoint>>({ 
    title: '', 
    description: '',
    icon: 'ShieldCheck'
  });

  const icons = [
    { name: 'ShieldCheck', icon: ShieldCheck },
    { name: 'Calendar', icon: CalendarIcon },
    { name: 'Info', icon: Info },
    { name: 'CreditCard', icon: CreditCard },
    { name: 'Clock', icon: Clock },
    { name: 'MapPin', icon: MapPin },
    { name: 'CheckCircle', icon: CheckCircle },
    { name: 'MessageSquare', icon: MessageSquare }
  ];

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;
    try {
      await addDoc(collection(db, 'urgencyPoints'), {
        ...formData,
        tenantId: getActiveTenantId() || ''
      });
      setFormData({ title: '', description: '', icon: 'ShieldCheck' });
      setIsAdding(false);
      alert("Success: Urgency Point created!");
    } catch (error) {
      console.error("Error saving Urgency Point", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete this Urgency Point?`)) {
      await deleteDoc(doc(db, 'urgencyPoints', id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Urgency Points</h2>
          <p className="text-gray-500 font-medium text-sm">Key trust features and urgency highlights shown on tour pages.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-200 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" /> Add New Point
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-8 rounded-[10px] border border-gray-100 space-y-6 motion-safe:animate-in motion-safe:slide-in-from-top-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Feature Title</label>
              <input 
                required 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold" 
                placeholder="e.g. Free Cancellation"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Short Description</label>
              <input 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold" 
                placeholder="e.g. Up to 24 hours before"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Visual Icon</label>
              <div className="flex flex-wrap gap-2">
                {icons.map(ic => (
                  <button 
                    key={ic.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: ic.name })}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all",
                      formData.icon === ic.name ? "bg-primary text-white border-primary shadow-lg shadow-orange-100" : "bg-white text-gray-400 border-gray-50 hover:border-orange-200"
                    )}
                  >
                    <ic.icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 font-bold text-gray-400 text-sm">Cancel</button>
            <button type="submit" className="bg-primary text-white px-10 py-4 rounded-xl font-bold text-sm tracking-wide shadow-xl active:scale-95 transition-all">Save Urgency Point</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => {
          const IconComp = icons.find(ic => ic.name === item.icon)?.icon || ShieldCheck;
          return (
            <div key={item.id} className="bg-white p-6 rounded-[10px] border border-gray-100 shadow-sm flex items-start justify-between group hover:border-primary transition-all">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
                  <IconComp className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 tracking-tight text-lg mb-1 truncate">{item.title || (item as any).text || 'Unnamed Feature'}</h3>
                  <p className="text-gray-500 text-xs font-medium leading-relaxed">{item.description || 'No description available.'}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(item.id)} 
                className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AddOnManager = ({ items }: { items: AddOn[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<AddOn>>({ name: '', description: '', price: 0, unit: 'per person' });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    try {
      await addDoc(collection(db, 'globalAddOns'), { ...formData, price: Number(formData.price) });
      setFormData({ name: '', description: '', price: 0, unit: 'per person' });
      setIsAdding(false);
      alert("Success: Add-on created!");
    } catch (error) {
      console.error("Error saving Add-on", error);
      alert("Error: Failed to save Add-on. Check permissions.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete this Add-on?`)) {
      await deleteDoc(doc(db, 'globalAddOns', id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Global Add-ons</h2>
          <p className="text-gray-500 font-medium">Create add-ons once and pick them for any tour.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-orange-200"
        >
          <Plus className="h-4 w-4" /> Add New Add-on
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-8 rounded-[10px] border-2 border-primary border-dashed space-y-4 motion-safe:animate-in motion-safe:slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-gray-500">Add-on Name</label>
              <input 
                required
                placeholder="e.g. Airport Transfer"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400">Price ($)</label>
              <input 
                required
                type="number"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400">Unit</label>
              <select 
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none bg-white font-bold"
              >
                <option value="per person">Per Person</option>
                <option value="per booking">Per Booking</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400">Description</label>
            <textarea 
              placeholder="Detailed description of the service..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
             <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 font-bold px-4">Cancel</button>
             <button type="submit" className="bg-primary text-white px-10 py-4 rounded-[10px] font-bold text-sm tracking-wide shadow-xl">Create Add-on</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-[10px] border border-gray-100 shadow-sm flex flex-col gap-4 group hover:border-primary transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-orange-50 rounded-[10px] flex items-center justify-center text-primary">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-extrabold text-gray-900 tracking-tight block">{item.name || (item as any).title || 'Unnamed Add-on'}</span>
                  <span className="text-[10px] font-black text-primary">{formatPrice(item.price)} / {item.unit || 'per person'}</span>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(item.id)}
                className="p-2 text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            {item.description && (
              <p className="text-xs text-gray-500 font-medium border-t border-gray-50 pt-3">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TransportOptionManager = ({ items }: { items: TransportOption[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<TransportOption>>({
    name: '',
    type: 'meet',
    carType: '',
    price: 0,
    priceType: 'per_person',
    description: '',
    maxCapacity: undefined
  });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    try {
      await addDoc(collection(db, 'globalTransports'), {
        ...formData,
        price: Number(formData.price),
        maxCapacity: formData.maxCapacity ? Number(formData.maxCapacity) : null
      });
      setFormData({
        name: '',
        type: 'meet',
        carType: '',
        price: 0,
        priceType: 'per_person',
        description: '',
        maxCapacity: undefined
      });
      setIsAdding(false);
      alert("Success: Transport Option created!");
    } catch (error) {
      console.error("Error saving Transport Option", error);
      alert("Error: Failed to save Transport Option.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete this Transport Option?`)) {
      try {
        await deleteDoc(doc(db, 'globalTransports', id));
      } catch (error) {
        console.error("Error deleting Transport Option", error);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Global Transports</h2>
          <p className="text-gray-500 font-medium">Create transfer and pickup options to link with your tours.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-orange-200"
        >
          <Plus className="h-4 w-4" /> Add New Option
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-8 rounded-[10px] border-2 border-primary border-dashed space-y-6 motion-safe:animate-in motion-safe:slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Option Name</label>
              <input 
                required
                placeholder="e.g. SHARED TRANSFER (Toyota Commuter)"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Transfer Type</label>
              <select 
                value={formData.type}
                onChange={e => {
                  const val = e.target.value as any;
                  setFormData({ 
                    ...formData, 
                    type: val,
                    price: val === 'meet' ? 0 : formData.price 
                  });
                }}
                className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none bg-white font-bold"
              >
                <option value="meet">Meet on location</option>
                <option value="shared">Shared transfer</option>
                <option value="private">Private transfer</option>
              </select>
            </div>
          </div>

          {formData.type !== 'meet' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500">Type of Car / Vehicle</label>
                <input 
                  placeholder="e.g. SUV, Luxury Coach, Mini-bus"
                  value={formData.carType}
                  onChange={e => setFormData({ ...formData, carType: e.target.value })}
                  className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500">Max Capacity (pax)</label>
                <input 
                  type="number"
                  placeholder="e.g. 5, 10, 40"
                  value={formData.maxCapacity || ''}
                  onChange={e => setFormData({ ...formData, maxCapacity: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500">Price ($)</label>
                <input 
                  required
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500">Pricing Basis</label>
                <select 
                  value={formData.priceType}
                  onChange={e => setFormData({ ...formData, priceType: e.target.value as any })}
                  className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none bg-white font-bold"
                >
                  <option value="per_person">Per Person</option>
                  <option value="per_car">Per Vehicle/Car</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">Description</label>
            <textarea 
              placeholder="e.g. Comfortable air-conditioned pickup from major city hotels."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
             <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 font-bold px-4">Cancel</button>
             <button type="submit" className="bg-primary text-white px-10 py-4 rounded-[10px] font-bold text-sm tracking-wide shadow-xl">Create Option</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-[10px] border border-gray-100 shadow-sm flex flex-col justify-between gap-4 group hover:border-primary transition-all">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-50 rounded-[10px] flex items-center justify-center text-primary">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-gray-900 tracking-tight block leading-snug">{item.name}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mt-0.5">
                      Type: {item.type === 'meet' ? 'Meet on Location' : item.type === 'shared' ? 'Shared Transfer' : 'Private Transfer'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              {(item.carType || (item.maxCapacity !== undefined && item.maxCapacity !== null)) && (
                <div className="mt-3 text-xs font-semibold text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                  {item.carType && (
                    <span>Vehicle: <span className="font-extrabold text-gray-700">{item.carType}</span></span>
                  )}
                  {item.maxCapacity !== undefined && item.maxCapacity !== null && (
                    <span>Max Capacity: <span className="font-extrabold text-gray-700">{item.maxCapacity} pax</span></span>
                  )}
                </div>
              )}

              {item.description && (
                <p className="text-xs text-gray-500 font-medium border-t border-gray-50 pt-3 mt-3">{item.description}</p>
              )}
            </div>

            <div className="border-t border-gray-50 pt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase">Rate</span>
              <span className="text-sm font-black text-primary">
                {item.type === 'meet' ? 'Free' : `${formatPrice(item.price)} / ${item.priceType === 'per_person' ? 'person' : 'vehicle'}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const COLLECTION_METADATA = [
  { id: 'tours', name: 'Tours', desc: 'Tour products, rates, and configurations', category: 'Pillars', icon: Compass },
  { id: 'bookings', name: 'Bookings', desc: 'Customer reservations, tickets, status', category: 'Pillars', icon: Briefcase },
  { id: 'users', name: 'Users & Roles', desc: 'Administrative and partner profiles', category: 'Pillars', icon: Users },
  { id: 'coupons', name: 'Coupons', desc: 'Discount vouchers and codes', category: 'Finance', icon: Tag },
  { id: 'inventory', name: 'Inventory Slots', desc: 'Schedules and pricing templates', category: 'Pillars', icon: CalendarIcon },
  { id: 'guides', name: 'Guides', desc: 'Tour guide logs and register', category: 'Pillars', icon: UserCheck },
  { id: 'reviews', name: 'Reviews', desc: 'Customer testimonials and feedback stars', category: 'Quality', icon: Star },
  { id: 'categories', name: 'Categories', desc: 'Tour categorization groups', category: 'Settings', icon: LayoutGrid },
  { id: 'locationMeta', name: 'Locations', desc: 'Tour regional descriptors', category: 'Settings', icon: MapPin },
  { id: 'tourTypes', name: 'Tour Types', desc: 'Activity tags and categories', category: 'Settings', icon: Layers },
  { id: 'tourLabels', name: 'Labels', desc: 'Badge highlights like "Best Seller"', category: 'Settings', icon: Tag },
  { id: 'urgencyPoints', name: 'Urgency Flashers', desc: 'Urgency counts and details', category: 'Settings', icon: Zap },
  { id: 'popups', name: 'Popups', desc: 'Notification modals and alerts', category: 'Quality', icon: Monitor },
  { id: 'pages', name: 'Pages', desc: 'Custom policy and info web pages', category: 'Content', icon: FileCode },
  { id: 'posts', name: 'Blog Posts', desc: 'Blog news and write-ups', category: 'Content', icon: BookOpen },
  { id: 'globalAddOns', name: 'Add-ons', desc: 'Optional booking supplements', category: 'Settings', icon: PlusCircle },
  { id: 'globalTransports', name: 'Transports', desc: 'Global transport options', category: 'Settings', icon: Car },
  { id: 'payouts', name: 'Payouts', desc: 'Finance splits and transaction receipts', category: 'Finance', icon: Wallet },
  { id: 'partnerSettings', name: 'Profiles & Partners', desc: 'Agent and supplier settings', category: 'Settings', icon: Users2 },
  { id: 'communicationSettings', name: 'Templates', desc: 'Automated email & WhatsApp script blocks', category: 'Settings', icon: MessageSquare },
  { id: 'generalSettings', name: 'Settings', desc: 'Currency configurations, headers, setups', category: 'Settings', icon: Settings }
];

const BackupManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Partial backup states
  const [backupMode, setBackupMode] = useState<'full' | 'selective'>('full');
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    COLLECTION_METADATA.map(c => c.id)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Selective Restore states
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<any | null>(null);
  const [restoreCollections, setRestoreCollections] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Toggle collection selection for backup
  const toggleCollection = (id: string) => {
    if (selectedCollections.includes(id)) {
      setSelectedCollections(selectedCollections.filter(c => c !== id));
    } else {
      setSelectedCollections([...selectedCollections, id]);
    }
  };

  const selectAllCollections = () => {
    setSelectedCollections(COLLECTION_METADATA.map(c => c.id));
  };

  const clearAllCollections = () => {
    setSelectedCollections([]);
  };

  // Filter collections for dynamic UI
  const filteredCollections = useMemo(() => {
    return COLLECTION_METADATA.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'all' || c.category.toLowerCase() === activeTab.toLowerCase();
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab]);

  const handleBackup = async (format: 'json' | 'csv' = 'json') => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    const user = auth.currentUser;
    if (!user) {
      setError('No authenticated user found. Please log in again.');
      setIsLoading(false);
      return;
    }

    if (format === 'json' && backupMode === 'selective' && selectedCollections.length === 0) {
      setError('Please select at least one collection to back up.');
      setIsLoading(false);
      return;
    }
    
    try {
      const token = await user.getIdToken();
      
      // Determine what to backup. CSV specializes in bookings. Partial backup requests specified collections.
      const colParam = format === 'csv' 
        ? 'bookings' 
        : (backupMode === 'full' ? '' : selectedCollections.join(','));

      const response = await fetch(`/api/admin/backup${colParam ? `?collections=${colParam}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Backup failed');
      }
      const fullData = await response.json();
      
      let finalBlob: Blob;
      let filename: string;

      if (format === 'csv') {
        // For CSV, we'll specialize in Bookings as it's the most requested
        const bookings = fullData.data.bookings || [];
        if (bookings.length === 0) {
          setSuccess(null);
          setError('No bookings found in the database to export to CSV.');
          setIsLoading(false);
          return;
        }

        const headers = [
          'ID', 'Reference', 'Date', 'Tour', 'Customer Name', 'Customer Email', 'Phone', 
          'Status', 'Total Amount', 'Supplier Name', 'Payment Method'
        ];
        
        const rows = bookings.map((b: any) => [
          b.id,
          b.reference || b.id?.substring(0, 8).toUpperCase(),
          b.date,
          `"${(b.tourTitle || 'N/A').replace(/"/g, '""')}"`,
          `"${(b.customerData?.fullName || 'N/A').replace(/"/g, '""')}"`,
          b.customerData?.email || 'N/A',
          `'${b.customerData?.phone || ''}`, // Force string in Excel
          b.status,
          b.totalAmount,
          `"${(b.supplierName || 'System').replace(/"/g, '""')}"`,
          b.paymentMethod || 'manual'
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map((r: any) => r.join(','))
        ].join('\n');

        finalBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        filename = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        finalBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const prefix = backupMode === 'selective' ? 'partial' : 'full';
        filename = `${prefix}-backup-${new Date().toISOString().split('T')[0]}.json`;
      }

      const url = window.URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess(`${format.toUpperCase()} Backup downloaded successfully!`);
    } catch (err: any) {
      setError(err.message || 'Backup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const processSelectedFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Please upload a valid JSON backup file.');
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.data) {
        throw new Error('Invalid backup file format. Missing "data" layer.');
      }

      setRestoreFile(file);
      setParsedBackup(parsed);

      const cols = Object.keys(parsed.data).filter(col => {
        return Array.isArray(parsed.data[col]) && parsed.data[col].length > 0;
      });

      setRestoreCollections(cols); // Select all found collections by default
      setSuccess(`Backup file "${file.name}" parsed successfully! Select collections below to restore.`);
      setError(null);
    } catch (err: any) {
      setError(`Failed to read the backup: ${err.message}`);
      setSuccess(null);
      setRestoreFile(null);
      setParsedBackup(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
    e.target.value = '';
  };

  const executeRestore = async () => {
    if (!parsedBackup || !restoreFile) return;

    if (restoreCollections.length === 0) {
      setError('Please select at least one collection to restore.');
      return;
    }

    if (!window.confirm(`WARNING: This will overwrite or merge data in the selected collections (${restoreCollections.join(', ')}). Are you absolutely sure you want to proceed?`)) {
      return;
    }

    setRestoreLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user found. Please login again.');
      
      const filteredData: Record<string, any[]> = {};
      for (const col of restoreCollections) {
        if (parsedBackup.data[col]) {
          filteredData[col] = parsedBackup.data[col];
        }
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: filteredData })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Restore failed');
      }

      const statsMsg = Object.entries(result.stats || {})
        .map(([col, cnt]) => `${COLLECTION_METADATA.find(c => c.id === col)?.name || col}: ${cnt} items`)
        .join(', ');
      
      setSuccess(`Restore completed successfully! Restored details: ${statsMsg}`);
      setRestoreFile(null);
      setParsedBackup(null);
    } catch (err: any) {
      setError(err.message || 'Restore failed');
    } finally {
      setRestoreLoading(false);
    }
  };

  const toggleRestoreCollection = (id: string) => {
    if (restoreCollections.includes(id)) {
      setRestoreCollections(restoreCollections.filter(c => c !== id));
    } else {
      setRestoreCollections([...restoreCollections, id]);
    }
  };

  const categories = ['all', 'Pillars', 'Settings', 'Finance', 'Content', 'Quality'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">System Backup & Restore</h2>
        <p className="text-gray-500 font-medium">Backup your site data or restore specific sections with complete precision.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Backup Selection & Operations */}
        <div className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-6 xl:col-span-8">
          <div className="flex items-center gap-4 p-6 bg-orange-50 rounded-[10px] border border-orange-100 text-orange-800">
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
              <Compass className="h-6 w-6" />
            </div>
            <div className="flex-grow">
              <h4 className="font-black text-lg">System Export Options</h4>
              <p className="text-sm font-medium opacity-80">Export all site variables, tours, metadata or configure partial downloads.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
              <button
                onClick={() => setBackupMode('full')}
                className={cn(
                  "px-4 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all",
                  backupMode === 'full' 
                    ? "bg-white text-gray-900 shadow-sm border border-gray-100" 
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                Full Backup
              </button>
              <button
                onClick={() => setBackupMode('selective')}
                className={cn(
                  "px-4 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all",
                  backupMode === 'selective' 
                    ? "bg-white text-primary shadow-sm border border-gray-100" 
                    : "text-gray-500 hover:text-primary"
                )}
              >
                Partial Backup
              </button>
            </div>

            {backupMode === 'selective' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllCollections}
                  className="text-[10px] font-black uppercase text-gray-500 hover:text-gray-900 tracking-widest bg-gray-50 px-3 py-2 rounded-lg border border-gray-100"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAllCollections}
                  className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500 tracking-widest bg-gray-50 px-3 py-2 rounded-lg border border-gray-100"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {backupMode === 'selective' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search database collections..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 placeholder-gray-400 font-medium text-sm rounded-xl border-2 border-gray-100 focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={cn(
                        "whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all capitalize border",
                        activeTab === cat 
                          ? "bg-primary/5 text-primary border-primary/20" 
                          : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredCollections.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-100 text-gray-400 font-bold text-sm">
                  No collections match your criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
                  {filteredCollections.map(col => {
                    const IconComp = col.icon;
                    const isSelected = selectedCollections.includes(col.id);
                    return (
                      <div
                        key={col.id}
                        onClick={() => toggleCollection(col.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all cursor-pointer flex gap-3.5 items-start group relative",
                          isSelected 
                            ? "bg-orange-50/40 border-primary shadow-sm" 
                            : "bg-white border-gray-100 hover:border-gray-200"
                        )}
                      >
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border",
                          isSelected 
                            ? "bg-primary text-white border-primary" 
                            : "bg-gray-50 text-gray-400 border-gray-100 group-hover:bg-gray-100 group-hover:text-gray-600"
                        )}>
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div className="flex-grow min-w-0 pr-6">
                          <span className="font-extrabold text-gray-900 tracking-tight text-sm block">{col.name}</span>
                          <span className="text-[10px] font-mono text-gray-400 tracking-tight block mt-0.5">{col.id}</span>
                          <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1.5 line-clamp-2">{col.desc}</p>
                        </div>
                        <div className="absolute top-4 right-4 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0">
                          {isSelected && <Check className="h-3 w-3 text-primary stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-3.5 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-3">
                <ShieldCheck className="h-4.5 w-4.5 text-primary stroke-[2.5] shrink-0" />
                <span className="text-xs text-gray-600 font-bold">
                  {selectedCollections.length} of {COLLECTION_METADATA.length} collections selected for backup. ({COLLECTION_METADATA.length - selectedCollections.length} will be omitted).
                </span>
              </div>
            </div>
          )}

            <div className="border-t border-gray-50 pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <p className="text-xs text-gray-500 font-bold max-w-md">
                {backupMode === 'full' 
                  ? "A Full Backup is highly recommended before performing system imports, running major schema adjustments, or changing system pricing guides." 
                  : `Exporting a partial backup with ${selectedCollections.length} target collections.`}
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleBackup('json')}
                  disabled={isLoading || restoreLoading}
                  className="bg-primary text-white px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-50 disabled:opacity-50 flex items-center justify-center gap-3 flex-grow sm:flex-grow-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Working...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" /> Export JSON
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleBackup('csv')}
                  disabled={isLoading || restoreLoading}
                  className="bg-blue-600 text-white px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-50 disabled:opacity-50 flex items-center justify-center gap-3 flex-grow sm:flex-grow-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Working...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" /> Export Bookings CSV
                    </>
                  )}
                </button>
              </div>
            </div>
        </div>

        {/* Restore Column */}
        <div className="space-y-8 xl:col-span-4">
          {/* Main Restore Upload View */}
          <div className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-6 flex flex-col">
            <div className="flex items-center gap-4 p-6 bg-amber-50 rounded-[10px] border border-amber-100 text-amber-800">
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-black text-lg">Selective Restore</h4>
                <p className="text-sm font-medium opacity-80">Upload a JSON backup file to browse and import select data blocks.</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 font-medium">
              Upload a previously exported JSON backup file. You can preview the records inside the file and selectively choose which collections to restore into the database.
            </p>

            {/* Draggable upload box */}
            {!parsedBackup ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4.5 text-center transition-all bg-gray-50/50 cursor-pointer hover:bg-gray-50 hover:border-amber-400 group relative min-h-[220px]",
                  isDragging ? "border-amber-500 bg-amber-50/30 ring-4 ring-amber-500/10" : "border-gray-200"
                )}
              >
                <input 
                  type="file" 
                  accept=".json" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleFileChange}
                  disabled={isLoading || restoreLoading}
                />
                <div className="h-14 w-14 bg-amber-100/50 text-amber-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-extrabold text-gray-800 text-sm block">Drag & Drop backup file</span>
                  <span className="text-xs text-gray-400 font-bold mt-1 block">or <span className="text-amber-500 font-extrabold group-hover:underline">browse files</span> on your computer</span>
                </div>
                <span className="text-[10px] font-mono text-gray-300">Supported formats: .json</span>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-extrabold text-gray-800 text-sm block truncate">{restoreFile?.name}</span>
                    <span className="text-[10px] font-mono text-gray-400 block mt-0.5">Size: {(restoreFile?.size || 0) > 1024 * 1024 ? `${((restoreFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB` : `${((restoreFile?.size || 0) / 1024).toFixed(1)} KB`}</span>
                  </div>
                  <button
                    onClick={() => {
                      setRestoreFile(null);
                      setParsedBackup(null);
                      setError(null);
                    }}
                    className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-800 transition-all rounded-lg shrink-0"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Preview Backup Contents</span>
                    <p className="text-xs text-gray-400 font-medium mt-1">Select the collections you wish to restore into the database.</p>
                  </div>

                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {Object.keys(parsedBackup.data || {}).map(colId => {
                      const colItems = parsedBackup.data[colId];
                      if (!Array.isArray(colItems) || colItems.length === 0) return null;
                      
                      const colMeta = COLLECTION_METADATA.find(c => c.id === colId);
                      const isSelected = restoreCollections.includes(colId);
                      
                      return (
                        <div
                          key={colId}
                          onClick={() => toggleRestoreCollection(colId)}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between",
                            isSelected 
                              ? "bg-amber-50/30 border-amber-500/80" 
                              : "bg-white border-gray-100 hover:border-gray-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded-md flex items-center justify-center shrink-0 border",
                              isSelected ? "bg-amber-500 text-white border-amber-500" : "bg-gray-50 text-gray-400 border-gray-100"
                            )}>
                              {colMeta ? <colMeta.icon className="h-4.5 w-4.5" /> : <Database className="h-4.5 w-4.5" />}
                            </div>
                            <div>
                              <span className="font-extrabold text-sm text-gray-800">{colMeta?.name || colId}</span>
                              <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{colItems.length} records detected</span>
                            </div>
                          </div>
                          
                          <div className={cn(
                            "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected ? "border-amber-500/80 bg-amber-500" : "border-gray-200"
                          )}>
                            {isSelected && <Check className="h-3 w-3 text-white stroke-[3.5]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400">
                      {restoreCollections.length} collections selected
                    </span>
                    <button
                      type="button"
                      onClick={executeRestore}
                      disabled={restoreLoading || restoreCollections.length === 0}
                      className="bg-amber-500 text-white px-5 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {restoreLoading ? (
                        <>
                          <Icons.Loader2 className="h-3 w-3 animate-spin" /> Restoring...
                        </>
                      ) : (
                        <>
                          <Icons.RefreshCw className="h-3 w-3" /> Commit Restore
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {(error || success) && (
        <div className={cn(
          "p-5 rounded-xl border-2 font-bold text-sm leading-relaxed shadow-sm",
          error ? "bg-red-50 border-red-200 text-red-600" : "bg-orange-50 border-orange-200 text-primary"
        )}>
          {error || success}
        </div>
      )}
    </div>
  );
};

const CommunicationManager = () => {
  const [settings, setSettings] = useState<CommunicationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{success: boolean, message: string} | null>(null);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<{success: boolean, message: string} | null>(null);
  const [testWhatsAppLoading, setTestWhatsAppLoading] = useState(false);
  const [testWhatsAppStatus, setTestWhatsAppStatus] = useState<{success: boolean, message: string} | null>(null);

  // WABA Custom Tester State
  const [wabaTestPhone, setWabaTestPhone] = useState('');
  const [wabaTestMode, setWabaTestMode] = useState<'template' | 'text'>('template');
  const [wabaTestTemplateName, setWabaTestTemplateName] = useState('');
  const [wabaTestLanguage, setWabaTestLanguage] = useState('id');
  const [wabaTestBody, setWabaTestBody] = useState('This is a custom test message sent from the Bali AdvenTours admin panel playground.');

  // WhatsApp Session Management
  const [waSessionStatus, setWaSessionStatus] = useState<any>(null);
  const [waSessionLoading, setWaSessionLoading] = useState(false);
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waActionMessage, setWaActionMessage] = useState<string | null>(null);

  // Email Diagnostic Logs
  const [diagnosticLogs, setDiagnosticLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchDiagnosticLogs = async () => {
    setLogsLoading(true);
    try {
      const q = query(collection(db, 'email_logs'), orderBy('createdAt', 'desc'));
      const logSnap = await getDocs(q);
      const logs = logSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDiagnosticLogs(logs.slice(0, 25)); // Use slice for safe client-side paging limit
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const MERGE_TAGS = [
    { tag: '{{customerName}}', description: 'Full name of the customer' },
    { tag: '{{tourTitle}}', description: 'Name of the tour booked' },
    { tag: '{{bookingId}}', description: 'Unique booking reference ID' },
    { tag: '{{date}}', description: 'Date of the tour' },
    { tag: '{{time}}', description: 'Time or time slot of the tour' },
    { tag: '{{guests}}', description: 'Number of guests (Adults + Children)' },
    { tag: '{{totalAmount}}', description: 'Total price of the booking' },
    { tag: '{{paymentMethod}}', description: 'The payment method used' },
    { tag: '{{pickupAddress}}', description: 'Pickup location address' },
    { tag: '{{status}}', description: 'Current status of the booking' },
    { tag: '{{paymentInstructions}}', description: 'Bank details (only for pending email)' },
    { tag: '{{supportPhone}}', description: 'Your company support phone' },
    { tag: '{{whatsappLink}}', description: 'Direct link to chat with support' },
    { tag: '{{guideName}}', description: "Assigned guide's name" },
    { tag: '{{guideWhatsapp}}', description: "Assigned guide's WhatsApp number" },
    { tag: '{{bookingDate}}', description: 'The date of the tour' },
    { tag: '{{customer_name}}', description: 'Full name of the customer' },
    { tag: '{{tour_title}}', description: 'Name of the tour booked' },
    { tag: '{{booking_date}}', description: 'The date of the tour' },
    { tag: '{{guide_name}}', description: "Assigned guide's name" },
    { tag: '{{guide_whatsapp}}', description: "Assigned guide's WhatsApp number" },
  ];

  const handleWhatsAppTemplateChange = (type: keyof CommunicationSettings['whatsappTemplates'], field: 'message' | 'enabled', value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      whatsappTemplates: {
        ...settings.whatsappTemplates,
        [type]: {
          ...settings.whatsappTemplates[type],
          [field]: value
        }
      }
    });
  };

  const handleSendTestWhatsApp = async () => {
    if (!settings) return;
    if (!settings.adminNotificationPhone) {
      setTestWhatsAppStatus({ success: false, message: 'Please set an Admin Notification Phone number first in the fields below.' });
      return;
    }
    setTestWhatsAppLoading(true);
    setTestWhatsAppStatus(null);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const currentProvider = settings.whatsappProvider || 'openwa';
      
      const bodyData: any = {
        receiver: settings.adminNotificationPhone,
        customMessage: `*WhatsApp Test Message*\n\nThis is a diagnostic connection test notification from your Bali AdvenTours admin panel.\n\nProvider: ${currentProvider.toUpperCase()}\nTime: ${new Date().toLocaleString()}`,
        type: 'test',
        provider: currentProvider,
        tenantId: getActiveTenantId(),
      };

      if (currentProvider === 'waba') {
        bodyData.wabaAccessToken = settings.wabaAccessToken;
        bodyData.wabaPhoneNumberId = settings.wabaPhoneNumberId;
        bodyData.wabaTemplateName = settings.wabaTemplateName;
        bodyData.wabaLanguageCode = settings.wabaLanguageCode || 'en';
      } else {
        bodyData.token = settings.openwaApiKey;
        bodyData.baseUrl = settings.openwaBaseUrl || 'https://openwa-dashboard-production-b24e.up.railway.app';
        bodyData.sessionId = settings.openwaSessionId;
      }

      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify(bodyData)
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setTestWhatsAppStatus({ 
          success: true, 
          message: `Test message successfully sent via ${currentProvider.toUpperCase()}! Please check your phone for the receipt.` 
        });
      } else {
        let errorMsg = data.error || 'Failed to send WhatsApp message.';
        // Clean up HTML error messages from nginx or other proxies
        if (errorMsg.includes('<html') || errorMsg.includes('<!DOCTYPE')) {
          errorMsg = 'Received an HTML error page. This usually means the API Base URL is incorrect or the endpoint does not exist (404/405).';
        }
        setTestWhatsAppStatus({ success: false, message: errorMsg });
      }
    } catch (error: any) {
      setTestWhatsAppStatus({ success: false, message: error.message || 'An unexpected error occurred.' });
    } finally {
      setTestWhatsAppLoading(false);
    }
  };

  const handleSendWabaPlayground = async () => {
    if (!settings) return;
    const phoneToUse = wabaTestPhone.trim() || settings.adminNotificationPhone;
    if (!phoneToUse) {
      setTestWhatsAppStatus({ success: false, message: 'Please specify a recipient phone number first.' });
      return;
    }
    setTestWhatsAppLoading(true);
    setTestWhatsAppStatus(null);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      
      const bodyData: any = {
        receiver: phoneToUse,
        type: 'custom_waba_test',
        provider: 'waba',
        wabaAccessToken: settings.wabaAccessToken,
        wabaPhoneNumberId: settings.wabaPhoneNumberId,
        customMessage: wabaTestBody.trim(),
        tenantId: getActiveTenantId()
      };

      if (wabaTestMode === 'template') {
        bodyData.wabaTemplateName = wabaTestTemplateName.trim() || settings.wabaTemplateName || 'booking_confirmation';
        bodyData.wabaLanguageCode = wabaTestLanguage.trim() || settings.wabaLanguageCode || 'id';
      }

      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify(bodyData)
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setTestWhatsAppStatus({ 
          success: true, 
          message: `WABA test message successfully sent to ${phoneToUse}! Mode: ${wabaTestMode.toUpperCase()}.` 
        });
      } else {
        setTestWhatsAppStatus({ success: false, message: data.error || 'WABA test message failed to send.' });
      }
    } catch (error: any) {
      setTestWhatsAppStatus({ success: false, message: error.message || 'An unexpected error occurred.' });
    } finally {
      setTestWhatsAppLoading(false);
    }
  };

  const handleFetchWhatsAppQR = async () => {
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';
      const res = await fetch('/api/whatsapp-qr', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await res.json();
      if (data.success && data.data?.qrCode) {
        setWaQrCode(data.data.qrCode);
      } else if (data.error) {
        console.warn('QR code fetch failed:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch QR:', err);
    }
  };

  const handleCheckWhatsAppStatus = async () => {
    setWaSessionLoading(true);
    setWaActionMessage(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';
      const res = await fetch('/api/whatsapp-status', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setWaSessionStatus(data.data);
        if (data.data?.status === 'qr_ready') {
          await handleFetchWhatsAppQR();
        } else {
          setWaQrCode(null);
        }
      } else {
        setWaActionMessage(`Error: ${data.error}`);
        setWaSessionStatus({ status: 'failed', error: data.error });
      }
    } catch (err: any) {
      setWaActionMessage(`Error: ${err.message}`);
    } finally {
      setWaSessionLoading(false);
    }
  };

  const handleStartWhatsAppSession = async () => {
    setWaSessionLoading(true);
    setWaActionMessage("Starting session, please wait...");
    setWaQrCode(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';
      const res = await fetch('/api/whatsapp-start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setWaActionMessage("Session initialization requested successfully. Checking status...");
        setTimeout(() => {
          handleCheckWhatsAppStatus();
        }, 1500);
      } else {
        setWaActionMessage(`Failed to start session: ${data.error}`);
      }
    } catch (err: any) {
      setWaActionMessage(`Error: ${err.message}`);
    } finally {
      setWaSessionLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!settings) return;
    setTestEmailLoading(true);
    setTestEmailStatus(null);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          to: settings.adminNotificationEmail,
          subject: 'Test Email - Bali AdvenTours',
          tenantId: getActiveTenantId() || 'global',
          html: `<div style="font-family: sans-serif; padding: 20px; border: 2px solid #0d9488; border-radius: 10px;">
            <h2 style="color: #0d9488;">Email Configuration Test</h2>
            <p>Success! This is a test email from your <strong>Bali AdvenTours</strong> website.</p>
            <p><strong>Provider used:</strong> ${settings.emailProvider.toUpperCase()}</p>
            <p>If you're seeing this, your transactional emails are now working correctly.</p>
            <hr />
            <small>Sent at: ${new Date().toLocaleString()}</small>
          </div>`,
          type: 'test'
        })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { success: false, error: text || 'Server returned an invalid response (500).' };
      }

      if (response.ok && data.success) {
        if (data.skipped) {
          setTestEmailStatus({ 
            success: false, 
            message: `Email was NOT sent because the active provider is configured as 'none' or 'Disabled'. Please select your provider (e.g., Mailjet, Resend, etc.), fill in the credentials, and click 'Save settings' at the bottom of the page before sending a test.`
          });
        } else {
          setTestEmailStatus({ success: true, message: 'Test email sent successfully! Please check your inbox (' + settings.adminNotificationEmail + ').' });
        }
      } else {
        // If it's a known server error string masquerading as HTML
        const displayError = data.error?.includes('A server error occurred') 
          ? 'The Vercel Server crashed while trying to load the email handler. This usually means a missing environment variable or configuration file.'
          : (data.error || 'Failed to send test email.');
          
        setTestEmailStatus({ success: false, message: displayError });
      }
    } catch (error: any) {
      setTestEmailStatus({ success: false, message: error.message || 'An unexpected error occurred.' });
    } finally {
      setTestEmailLoading(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const defaults: CommunicationSettings = {
        id: 'settings',
        emailProvider: 'none',
        senderEmail: 'booking@tripbone.com',
        senderName: 'Tripbone Bookings',
        adminNotificationEmail: import.meta.env.VITE_ADMIN_EMAIL || 'baliadventours@gmail.com',
        adminNotificationPhone: '+10000000000',
        whatsappEnabled: false,
        whatsappProvider: 'openwa',
        wabaAccessToken: '',
        wabaPhoneNumberId: '',
        wabaTemplateName: '',
        wabaLanguageCode: 'id',
        wabaVerifyToken: 'baliadventours',
        geminiApiKey: '',
        imgbbApiKey: '',
        whatsappTemplates: {
          booking_confirmation: {
            message: "Halo {{customerName}}, booking anda untuk {{tourTitle}} pada tanggal {{date}} telah dikonfirmasi. Booking ID: {{bookingId}}",
            enabled: true
          },
          booking_status_updated: {
            message: "Halo {{customerName}}, status booking anda {{bookingId}} telah diperbarui menjadi: {{status}}",
            enabled: true
          },
          admin_notification: {
            message: "New Booking Alert! {{customerName}} booked {{tourTitle}} for {{date}}. Total: {{totalAmount}}",
            enabled: true
          },
          guide_assigned: {
            message: "*Guide Assigned*\n\nHello {{customer_name}}, we have assigned a guide for your tour \"{{tour_title}}\" on {{booking_date}}.\n\n*Your Guide:* {{guide_name}}\n*Guide WhatsApp:* {{guide_whatsapp}}\n\nOur guide will contact you soon for pickup details. Enjoy your trip!",
            enabled: true
          }
        },
        templates: {} as any
      };

      try {
        const docRef = doc(db, 'communicationSettings', getActiveTenantId() || 'global');
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data() as any;
          // Merge templates specifically to ensure new ones are added
          setSettings({ 
            ...defaults, 
            ...data,
            whatsappTemplates: {
              ...defaults.whatsappTemplates,
              ...(data.whatsappTemplates || {})
            }
          });
        } else {
          try {
            await setDoc(docRef, defaults);
          } catch (e) {
            console.warn('Could not auto-create communication settings doc:', e);
          }
          setSettings(defaults);
        }
      } catch (err: any) {
        console.error('Error fetching communication settings:', err);
        setSettings(defaults);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchDiagnosticLogs();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await setDoc(doc(db, 'communicationSettings', getActiveTenantId() || 'global'), settings);
      setSaveStatus({ success: true, message: "Settings saved successfully!" });
      setTimeout(() => setSaveStatus(null), 6000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus({ success: false, message: `Error saving settings: ${err.message || err}` });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;
  if (!settings) return null;

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Communication Settings</h2>
        <p className="text-gray-500 font-medium">Configure how you communicate with your guests via email.</p>
      </div>

      {/* Email Testing Tool (Fixed Position) */}
      <div className="bg-primary rounded-[10px] p-8 shadow-2xl shadow-primary/20 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Icons.Zap className="h-48 w-48 rotate-12" />
        </div>
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
             <div className="flex items-center gap-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Diagnostic tool</span>
                <span className="h-1.5 w-1.5 bg-orange-300 rounded-full animate-pulse"></span>
             </div>
             <h3 className="text-3xl font-black tracking-tight">Email Connection Tester</h3>
             <p className="text-orange-50 text-sm font-medium">Verify your Gmail or SMTP settings instantly without making a real booking. We will send a test email to <strong>{settings.adminNotificationEmail}</strong>.</p>
          </div>
          <button 
            type="button" 
            onClick={handleSendTestEmail}
            disabled={testEmailLoading || settings.emailProvider === 'none'}
            className="bg-white text-primary px-10 py-5 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shrink-0"
          >
            {testEmailLoading ? <Icons.Loader2 className="h-5 w-5 animate-spin" /> : <Icons.Send className="h-5 w-5" />}
            {testEmailLoading ? 'Running test...' : 'Send Test mail'}
          </button>
        </div>

        {testEmailStatus && (
           <div className={`mt-8 p-6 rounded-2xl border-2 animate-in fade-in zoom-in duration-300 ${testEmailStatus.success ? 'bg-white/10 border-white/20 text-white' : 'bg-red-500/20 border-red-500/30 text-white'}`}>
             <div className="flex items-start gap-4">
                {testEmailStatus.success ? <Icons.CheckCircle2 className="h-8 w-8 text-white shrink-0" /> : <Icons.AlertCircle className="h-8 w-8 text-white shrink-0" />}
                <div className="space-y-1">
                   <p className="text-lg font-black tracking-tight">{testEmailStatus.success ? 'System Online!' : 'Connection Refused'}</p>
                   <p className="text-sm font-medium opacity-90">{testEmailStatus.message}</p>
                   {!testEmailStatus.success && (
                      <div className="mt-4 bg-black/20 p-4 rounded-xl text-xs font-mono leading-relaxed border border-white/10">
                         <span className="font-black text-white underline mb-1 block">QUICK FIX FOR GMAIL:</span>
                         1. Ensure <a href="https://myaccount.google.com/security" target="_blank" className="underline font-bold">2-Step Verification</a> is ON.<br/>
                         2. Generate a 16-character <strong>App Password</strong>.<br/>
                         3. Use that code instead of your regular password.
                      </div>
                   )}
                </div>
             </div>
           </div>
        )}
      </div>

      {/* WhatsApp Testing Tool */}
      <div className="bg-[#075E54] rounded-[10px] p-8 shadow-2xl shadow-[#075E54]/20 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Icons.Phone className="h-48 w-48 rotate-12" />
        </div>
        
        {settings.whatsappProvider === 'waba' ? (
          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">WABA Play Area</span>
              <span className="h-1.5 w-1.5 bg-orange-400 rounded-full animate-pulse"></span>
            </div>
            
            <div>
              <h3 className="text-3xl font-black tracking-tight">WABA Direct Dispatch Tester</h3>
              <p className="text-orange-50 text-sm font-medium mt-1">
                Trigger and monitor custom Meta WABA notifications directly. Perfect for testing templates or session-based messaging.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-black/15 p-6 rounded-2xl border border-white/10 mt-4 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-orange-200 tracking-wider">Recipient Phone Number</label>
                <input
                  type="text"
                  value={wabaTestPhone}
                  onChange={e => setWabaTestPhone(e.target.value)}
                  placeholder={settings.adminNotificationPhone || 'e.g. +62812345678'}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm focus:bg-white/15 focus:outline-none focus:border-orange-400 transition-all font-mono placeholder:text-white/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-orange-200 tracking-wider">Message Mode</label>
                <select
                  value={wabaTestMode}
                  onChange={e => setWabaTestMode(e.target.value as 'template' | 'text')}
                  className="w-full rounded-xl bg-[#075E54] border border-white/20 px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-all text-white font-bold cursor-pointer font-sans"
                >
                  <option value="template">Template Message (Meta Approved Template)</option>
                  <option value="text">Standard Text Message (Requires Open Session)</option>
                </select>
              </div>

              {wabaTestMode === 'template' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-orange-200 tracking-wider">Template Name</label>
                  <input
                    type="text"
                    value={wabaTestTemplateName}
                    onChange={e => setWabaTestTemplateName(e.target.value)}
                    placeholder={settings.wabaTemplateName || 'e.g. booking_confirmation'}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm focus:bg-white/15 focus:outline-none focus:border-orange-400 transition-all font-mono placeholder:text-white/30 text-white"
                  />
                </div>
              )}

              {wabaTestMode === 'template' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-orange-200 tracking-wider">Template Language Code</label>
                  <input
                    type="text"
                    value={wabaTestLanguage}
                    onChange={e => setWabaTestLanguage(e.target.value)}
                    placeholder={settings.wabaLanguageCode || 'id'}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm focus:bg-white/15 focus:outline-none focus:border-orange-400 transition-all font-mono placeholder:text-white/30 text-white"
                  />
                </div>
              )}

              <div className="col-span-full space-y-2">
                <label className="text-[10px] font-black uppercase text-orange-200 tracking-wider">
                  {wabaTestMode === 'template' 
                    ? 'Template Parameters (Body Variable 1)' 
                    : 'Standard Message Text'}
                </label>
                <textarea
                  rows={3}
                  value={wabaTestBody}
                  onChange={e => setWabaTestBody(e.target.value)}
                  placeholder="Enter the body message or the template custom string..."
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm focus:bg-white/15 focus:outline-none focus:border-orange-400 transition-all placeholder:text-white/30 text-white"
                />
                <p className="text-[10px] text-orange-200/70 font-medium">
                  {wabaTestMode === 'template' 
                    ? 'Note: Meta approved templates usually expect dynamic parameters. We will map this message to {{1}}.' 
                    : 'Note: Meta requires that standard text messages be sent only when there is an active customer-initiated chat window open within 24 hours.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={handleSendWabaPlayground}
                disabled={testWhatsAppLoading || !settings.whatsappEnabled}
                className="bg-white text-[#075E54] px-10 py-4 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 cursor-pointer"
              >
                {testWhatsAppLoading ? <Icons.Loader2 className="h-5 w-5 animate-spin" /> : <Icons.MessageSquare className="h-5 w-5" />}
                {testWhatsAppLoading ? 'Dispatched...' : 'Trigger WABA Dispatch'}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 max-w-xl">
               <div className="flex items-center gap-3">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">WhatsApp diagnostic</span>
                  <span className="h-1.5 w-1.5 bg-orange-400 rounded-full animate-pulse"></span>
               </div>
               <h3 className="text-3xl font-black tracking-tight">WhatsApp Connection Tester</h3>
               <p className="text-orange-50 text-sm font-medium">Verify your OpenWA configuration instantly. We will send a test message to <strong>{settings.adminNotificationPhone || 'No number set'}</strong>.</p>
            </div>
            <button 
              type="button" 
              onClick={handleSendTestWhatsApp}
              disabled={testWhatsAppLoading || !settings.whatsappEnabled}
              className="bg-white text-[#075E54] px-10 py-5 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shrink-0"
            >
              {testWhatsAppLoading ? <Icons.Loader2 className="h-5 w-5 animate-spin" /> : <Icons.MessageSquare className="h-5 w-5" />}
              {testWhatsAppLoading ? 'Sending...' : 'Send Test WhatsApp'}
            </button>
          </div>
        )}

        {testWhatsAppStatus && (
           <div className={`mt-8 p-6 rounded-2xl border-2 animate-in fade-in zoom-in duration-300 ${testWhatsAppStatus.success ? 'bg-white/10 border-white/20 text-white' : 'bg-red-500/20 border-red-500/30 text-white'}`}>
             <div className="flex items-start gap-4 text-left">
                {testWhatsAppStatus.success ? <Icons.CheckCircle2 className="h-8 w-8 text-white shrink-0" /> : <Icons.AlertCircle className="h-8 w-8 text-white shrink-0" />}
                <div className="space-y-1">
                   <p className="text-lg font-black tracking-tight">{testWhatsAppStatus.success ? 'WhatsApp Online!' : 'Send Failed'}</p>
                   <p className="text-sm font-medium opacity-90">{testWhatsAppStatus.message}</p>
                   {!testWhatsAppStatus.success && settings.whatsappProvider !== 'waba' && (
                      <div className="mt-4 bg-black/20 p-4 rounded-xl text-xs font-mono leading-relaxed border border-white/10 opacity-90 text-left">
                         <span className="font-black text-white underline mb-1 block">QUICK FIX:</span>
                         1. Ensure <strong>OpenWA Base URL</strong> and <strong>Session Name</strong> ({settings.openwaSessionId || 'baliadventours'}) are correct.<br/>
                         2. Verify your <strong>OpenWA API Key</strong>.<br/>
                         3. <strong>SESSION NOT RUNNING:</strong> Use the live controls below to start the WhatsApp session and generate your authentication QR code.
                      </div>
                   )}
                   {!testWhatsAppStatus.success && settings.whatsappProvider === 'waba' && (
                      <div className="mt-4 bg-black/20 p-4 rounded-xl text-xs font-mono leading-relaxed border border-white/10 opacity-90 text-left">
                         <span className="font-black text-white underline mb-1 block">QUICK FIX FOR WABA:</span>
                         1. Ensure <strong>WABA Access Token</strong> and <strong>Phone Number ID</strong> are correct in communication settings.<br/>
                         2. Double check if your recipient phone number is fully formatted with country code (e.g., 628123456789).<br/>
                         3. If sending in Template Mode, confirm the template name and language code exist and are approved in Meta WhatsApp Manager.<br/>
                         4. In Non-Template Mode, ensure the recipient has initiated contact within the last 24 hours.
                      </div>
                   )}
                </div>
             </div>
           </div>
        )}

        {/* Real-time Session Connector */}
        {settings.whatsappProvider !== 'waba' && (
          <div className="mt-8 pt-8 border-t border-white/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 text-left">
                <h4 className="text-lg font-bold flex items-center gap-2">
                  <Icons.Settings className="h-5 w-5" />
                  Live Session Control
                </h4>
                <p className="text-xs text-orange-100">
                  Manage the active WhatsApp connection state on your gateway dynamically.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCheckWhatsAppStatus}
                  disabled={waSessionLoading}
                  className="bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/25 text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {waSessionLoading ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <Icons.RefreshCw className="h-4 w-4" />}
                  Check Connection Status
                </button>
                <button
                  type="button"
                  onClick={handleStartWhatsAppSession}
                  disabled={waSessionLoading}
                  className="bg-orange-500 hover:bg-primary border border-orange-400 text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Icons.Play className="h-4 w-4 fill-current" />
                  Initialize/Start Session
                </button>
              </div>
            </div>

            {waActionMessage && (
              <div className="mt-4 text-xs font-mono bg-black/30 p-3 rounded-lg text-orange-300 text-left">
                {waActionMessage}
              </div>
            )}

            {waSessionStatus && (
              <div className="mt-6 bg-white/10 border border-white/15 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300 text-left">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-250">Session ID</span>
                  <p className="font-mono text-sm font-bold">{waSessionStatus.name || settings.openwaSessionId || 'baliadventours'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-250">Connection State</span>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      waSessionStatus.status === 'ready' ? 'bg-orange-400 animate-pulse' :
                      waSessionStatus.status === 'qr_ready' ? 'bg-yellow-400 animate-pulse' :
                      waSessionStatus.status === 'initializing' || waSessionStatus.status === 'authenticating' ? 'bg-indigo-400 animate-pulse' : 'bg-red-450'
                    }`}></span>
                    <p className="font-bold uppercase tracking-wider text-sm">{waSessionStatus.status || 'UNKNOWN'}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-250">Linked Phone</span>
                  <p className="text-sm font-bold">{waSessionStatus.phone ? `+${waSessionStatus.phone}` : 'Not linked'}</p>
                </div>
              </div>
            )}

            {waQrCode && (
              <div className="mt-6 flex flex-col items-center bg-white text-gray-900 p-6 rounded-2xl max-w-sm mx-auto shadow-xl border border-white/20 animate-in zoom-in duration-300">
                <span className="text-xs font-black text-[#075E54] uppercase tracking-widest mb-3">Scan this QR Code via WhatsApp</span>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <img src={waQrCode} alt="WhatsApp QR Code" className="w-[200px] h-[200px]" referrerPolicy="no-referrer" />
                </div>
                <p className="text-[10px] text-gray-500 text-center font-medium mt-3 leading-relaxed">
                  Open WhatsApp on your phone, navigate to Linked Devices, and scan the QR code to authenticate the <strong>{settings.openwaSessionId || 'baliadventours'}</strong> session.
                </p>
                <button
                  type="button"
                  onClick={handleCheckWhatsAppStatus}
                  className="mt-4 w-full bg-[#075E54] hover:bg-[#128C7E] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                >
                  I Scanned It! Verify Connection
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-12">
        {saveStatus && (
          <div className={`p-5 rounded-xl border-2 ${saveStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'} flex items-start gap-4 font-bold text-sm animate-in fade-in duration-200`}>
            {saveStatus.success ? <Icons.CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" /> : <Icons.AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />}
            <div className="space-y-1">
              <p className="font-black">{saveStatus.success ? 'Success!' : 'Error Saving Settings'}</p>
              <p className="font-medium text-xs opacity-90">{saveStatus.message}</p>
            </div>
          </div>
        )}
        <section className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                    <Icons.Sparkles className="h-5 w-5" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">AI Intelligence (Google Gemini)</h3>
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Gemini API Key</label>
                     <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Securely Stored</span>
                   </div>
                   <input 
                     type="password"
                     value={settings.geminiApiKey || ''}
                     onChange={e => setSettings({ ...settings, geminiApiKey: e.target.value })}
                     placeholder="Enter your Google AI Studio API Key"
                     className="w-full rounded-[10px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-mono"
                   />
                   <p className="text-[10px] text-gray-400 font-medium">This key powers the AI Tour Builder. You can get a free key from Google AI Studio.</p>
                 </div>
               </div>
               
               <div className="bg-indigo-50/30 p-6 rounded-xl border border-indigo-100">
                 <div className="flex gap-4">
                   <Icons.Lightbulb className="h-6 w-6 text-indigo-600 shrink-0" />
                   <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 text-sm">How it works</h4>
                      <p className="text-xs text-gray-600 font-medium leading-relaxed">
                         The API key is used to communicate with Gemini 1.5 Flash. 
                         It's stored in your secure database and used whenever you click "AI Magic Builder".
                      </p>
                      <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 mt-2 hover:underline"
                      >
                        Get Key Here <Icons.Globe className="h-3 w-3" />
                      </a>
                   </div>
                 </div>
               </div>
            </div>
         </section>

        <section className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                    <Icons.Image className="h-5 w-5" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">Image Hosting (ImgBB)</h3>
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest">ImgBB API Key</label>
                     <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Securely Stored</span>
                   </div>
                   <input 
                     type="password"
                     value={settings.imgbbApiKey || ''}
                     onChange={e => setSettings({ ...settings, imgbbApiKey: e.target.value })}
                     placeholder="Enter your ImgBB API Key"
                     className="w-full rounded-[10px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-mono"
                   />
                   <p className="text-[10px] text-gray-400 font-medium">This key is used for secure multi-tenant image uploads, converting and compressing client images into WebP files automatically.</p>
                 </div>
               </div>
               
               <div className="bg-indigo-50/30 p-6 rounded-xl border border-indigo-100">
                 <div className="flex gap-4">
                   <Icons.Lightbulb className="h-6 w-6 text-indigo-600 shrink-0" />
                   <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 text-sm">How it works</h4>
                      <p className="text-xs text-gray-600 font-medium leading-relaxed">
                         Images uploaded via the tour manager, blogs, or settings are automatically converted and optimized to WebP format inside the browser, and then securely hosted via your private ImgBB storage using your individual API Key.
                      </p>
                      <a 
                        href="https://api.imgbb.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 mt-2 hover:underline"
                      >
                        Get Key Here <Icons.Globe className="h-3 w-3" />
                      </a>
                   </div>
                 </div>
               </div>
            </div>
         </section>

        <section className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-8">
           <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center text-primary">
                 <Icons.Mail className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Email Provider</h3>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Provider</label>
                 <select 
                   value={settings.emailProvider}
                   onChange={e => setSettings({ ...settings, emailProvider: e.target.value as any })}
                   className="w-full rounded-[10px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold appearance-none bg-white"
                 >
                   <option value="none">Disabled (No Emails)</option>
                   <option value="resend">Resend (Recommended)</option>
                   <option value="sendgrid">SendGrid</option>
                    <option value="brevo">Brevo (Sendinblue)</option>
                    <option value="gmail">Gmail SMTP (Direct Method)</option>
                     <option value="enginemailer">Enginemailer</option>
                     <option value="mailjet">Mailjet</option>
                 </select>
              </div>

              {settings.emailProvider === 'gmail' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Gmail Address</label>
                    <input 
                      type="email"
                      value={settings.gmailUser || ''}
                      onChange={e => setSettings({ ...settings, gmailUser: e.target.value })}
                      placeholder="baliadventours@gmail.com"
                      className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Google App Password</label>
                    <input 
                      type="password"
                      value={settings.gmailAppPassword || ''}
                      onChange={e => setSettings({ ...settings, gmailAppPassword: e.target.value })}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3 bg-secondary/5 p-6 rounded-xl border border-secondary/20">
                    <div className="flex gap-4">
                      <Icons.Info className="h-6 w-6 text-secondary shrink-0" />
                      <div className="space-y-2">
                         <h4 className="font-bold text-gray-900 text-sm underline">How to get a Google App Password?</h4>
                         <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4 font-medium leading-relaxed">
                            <li>Turn on <strong>2-Step Verification</strong> in your Google Account settings.</li>
                            <li>Search for "App Passwords" in your account search bar.</li>
                            <li>Select "Mail" and "Other (Custom name)" and type "Bali Website".</li>
                            <li>Copy the 16-character code and paste it here.</li>
                         </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {settings.emailProvider !== 'none' && settings.emailProvider !== 'gmail' && settings.emailProvider !== 'mailjet' && (
                <div className="space-y-2 lg:col-span-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest">API Key</label>
                     <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Env Vars Supported</span>
                   </div>
                   <input 
                     type="password"
                     value={settings.emailApiKey || ''}
                     onChange={e => setSettings({ ...settings, emailApiKey: e.target.value })}
                     placeholder={
                       settings.emailProvider === "enginemailer"
                         ? "Enter your Enginemailer API key or use ENGINEMAILER_API_KEY env var"
                         : `Enter your ${settings.emailProvider} API key or use BREVO_API_KEY env var`
                     }
                     className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                   />
                   <p className="text-[10px] text-gray-400 font-medium">Use the "Settings" menu to add your API key securely as an environment variable.</p>
                </div>
              )}

              {settings.emailProvider === 'mailjet' && (
                <>
                  <div className="space-y-2">
                     <div className="flex justify-between items-center">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-mono">Mailjet API Key (Public)</label>
                       <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Or use Env Vars</span>
                     </div>
                     <input 
                       type="text"
                       value={settings.emailApiKey?.includes(':') ? settings.emailApiKey.split(':')[0] : (settings.emailApiKey || '')}
                       onChange={e => {
                         const currentSecret = settings.emailApiKey?.includes(':') ? settings.emailApiKey.split(':')[1] : '';
                         setSettings({ ...settings, emailApiKey: `${e.target.value.trim()}:${currentSecret}` });
                       }}
                       placeholder="Enter Mailjet Public API Key"
                       className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-mono">Mailjet API Secret (Private)</label>
                     <input 
                       type="password"
                       value={settings.emailApiKey?.includes(':') ? settings.emailApiKey.split(':')[1] : ''}
                       onChange={e => {
                         const currentKey = settings.emailApiKey?.includes(':') ? settings.emailApiKey.split(':')[0] : (settings.emailApiKey || '');
                         setSettings({ ...settings, emailApiKey: `${currentKey}:${e.target.value.trim()}` });
                       }}
                       placeholder="Enter Mailjet Private Secret Key"
                       className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                     />
                  </div>
                </>
              )}

              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Sender Email</label>
                 <input 
                   required
                   type="email"
                   value={settings.senderEmail}
                   onChange={e => setSettings({ ...settings, senderEmail: e.target.value })}
                   className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Sender Name</label>
                 <input 
                   required
                   value={settings.senderName}
                   onChange={e => setSettings({ ...settings, senderName: e.target.value })}
                   className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Admin Notification Email</label>
                 <input 
                   required
                   type="email"
                   value={settings.adminNotificationEmail}
                   onChange={e => setSettings({ ...settings, adminNotificationEmail: e.target.value })}
                   className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                 />
              </div>
           </div>
        </section>

        <section className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-8">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center text-[#075E54]">
                   <Icons.Phone className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">WhatsApp Automation</h3>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.whatsappEnabled} 
                    onChange={e => setSettings({ ...settings, whatsappEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-primary rounded-full relative transition-all after:content-[''] after:absolute after:h-5 after:w-5 after:bg-white after:rounded-full after:top-0.5 after:left-0.5 peer-checked:after:left-5.5 after:transition-all"></div>
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Master Switch</span>
                </label>
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest">WhatsApp Gateway Provider</label>
                   <select 
                     value={settings.whatsappProvider || 'openwa'}
                     onChange={e => setSettings({ ...settings, whatsappProvider: e.target.value as 'openwa' | 'waba' })}
                     className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold cursor-pointer"
                   >
                     <option value="openwa">OpenWA (Self-hosted / REST Gateway)</option>
                     <option value="waba">WABA (WhatsApp Business Platform / Cloud API)</option>
                   </select>
                   <p className="text-[10px] text-gray-400 font-medium">Choose between your own self-hosted OpenWA instance or official Meta Cloud API.</p>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Admin Notification Phone</label>
                   <input 
                     type="text"
                     value={settings.adminNotificationPhone || ''}
                     onChange={e => setSettings({ ...settings, adminNotificationPhone: e.target.value })}
                     placeholder="+628xxx"
                     className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                   />
                   <p className="text-[10px] text-gray-400 font-medium">Phone number that will receive new booking alerts.</p>
                 </div>

                 {(settings.whatsappProvider === 'waba') ? (
                   <>
                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">WABA Access Token</label>
                       <input 
                         type="password"
                         value={settings.wabaAccessToken || ''}
                         onChange={e => setSettings({ ...settings, wabaAccessToken: e.target.value })}
                         placeholder="Meta System User token"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                       <p className="text-[10px] text-gray-400 font-medium">System User token with whatsapp_business_messaging permissions.</p>
                     </div>

                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">WABA Phone Number ID</label>
                       <input 
                         type="text"
                         value={settings.wabaPhoneNumberId || ''}
                         onChange={e => setSettings({ ...settings, wabaPhoneNumberId: e.target.value })}
                         placeholder="e.g. 104847294829"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                       <p className="text-[10px] text-gray-400 font-medium">The Phone Number ID displayed in your Facebook App Developer console.</p>
                     </div>

                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Default Template Name (Optional)</label>
                       <input 
                         type="text"
                         value={settings.wabaTemplateName || ''}
                         onChange={e => setSettings({ ...settings, wabaTemplateName: e.target.value })}
                         placeholder="e.g. booking_confirmation"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                       <p className="text-[10px] text-gray-400 font-medium">If empty, standard text messages are used. If specified, WABA template message is triggered.</p>
                     </div>

                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Template Language Code</label>
                       <input 
                         type="text"
                         value={settings.wabaLanguageCode || 'id'}
                         onChange={e => setSettings({ ...settings, wabaLanguageCode: e.target.value })}
                         placeholder="e.g. id, en"
                          className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">WABA Webhook Verify Token</label>
                        <input 
                          type="text"
                          value={settings.wabaVerifyToken || 'baliadventours'}
                          onChange={e => setSettings({ ...settings, wabaVerifyToken: e.target.value })}
                          placeholder="e.g. baliadventours"
                          className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                        />
                        <p className="text-[10px] text-gray-400 font-medium">Configure this string as the Verification Token in your Meta Developer App Webhook settings.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Template Language Code</label>
                        <input 
                          type="text"
                          value={settings.wabaLanguageCode || 'id'}
                          onChange={e => setSettings({ ...settings, wabaLanguageCode: e.target.value })}
                          placeholder="e.g. id, en"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">OpenWA API Key</label>
                       <input 
                         type="password"
                         value={settings.openwaApiKey || ''}
                         onChange={e => setSettings({ ...settings, openwaApiKey: e.target.value })}
                         placeholder="Enter your OpenWA API key"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                       <p className="text-[10px] text-gray-400 font-medium">Get this from your OpenWA Dashboard.</p>
                     </div>

                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">OpenWA Session Name</label>
                       <input 
                         type="text"
                         value={settings.openwaSessionId || ''}
                         onChange={e => setSettings({ ...settings, openwaSessionId: e.target.value })}
                         placeholder="e.g. baliadventours"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                       <p className="text-[10px] text-gray-400 font-medium">Required for multi-session dashboards. Tip: If the name doesn't work, try using just the number (e.g. 62812...).</p>
                     </div>

                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">OpenWA Base URL</label>
                       <input 
                         type="text"
                         value={settings.openwaBaseUrl || ''}
                         onChange={e => setSettings({ ...settings, openwaBaseUrl: e.target.value })}
                         placeholder="https://your-openwa-instance.railway.app"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                       <p className="text-[10px] text-gray-400 font-medium">The URL of your OpenWA instance.</p>
                     </div>
                   </>
                 )}
               </div>
               
               {settings.whatsappProvider === 'waba' ? (
                 <div className="bg-[#E7F3FF] p-6 rounded-xl border border-blue-100 flex flex-col justify-between">
                   <div className="flex gap-4">
                     <Icons.ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
                     <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 text-sm">WABA Cloud API Active</h4>
                        <p className="text-xs text-gray-600 font-medium leading-relaxed">
                           System uses <strong>WhatsApp Business Platform (Cloud API)</strong> from Meta to deliver transaction notifications.
                        </p>
                        <div className="mt-4 p-4 bg-white/50 rounded-lg border border-blue-100/20">
                           <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">Configuration Guide</p>
                           <ul className="text-[9px] text-gray-500 list-disc pl-4 space-y-1">
                             <li>Create a Meta Developer app and set up <strong>WhatsApp</strong> product.</li>
                             <li className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/50 my-2 space-y-1">
                               <p className="font-bold text-blue-800 text-[10px] uppercase">Webhook Configuration (Copy these to Meta App):</p>
                               <div className="space-y-1 text-left">
                                 <div>
                                   <span className="font-semibold text-gray-700 block">Callback URL:</span>
                                   <div className="flex items-center gap-1.5 mt-0.5">
                                     <code className="bg-white px-2 py-1 rounded border text-[10px] font-mono select-all flex-1 break-all text-blue-900 font-bold">
                                       {typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '/api/whatsapp/webhook'}
                                     </code>
                                     <button
                                       type="button"
                                       onClick={() => {
                                         const url = typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '/api/whatsapp/webhook';
                                         navigator.clipboard.writeText(url);
                                         alert('Callback URL copied to clipboard!');
                                       }}
                                       className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                     >
                                       Copy
                                     </button>
                                   </div>
                                 </div>
                                 <div className="pt-1">
                                   <span className="font-semibold text-gray-700 block">Verify Token:</span>
                                   <div className="flex items-center gap-1.5 mt-0.5">
                                     <code className="bg-white px-2 py-1 rounded border text-[10px] font-mono select-all flex-1 text-blue-900 font-bold">
                                       {settings.wabaVerifyToken || 'baliadventours'}
                                     </code>
                                     <button
                                       type="button"
                                       onClick={() => {
                                         navigator.clipboard.writeText(settings.wabaVerifyToken || 'baliadventours');
                                         alert('Verify Token copied to clipboard!');
                                       }}
                                       className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                     >
                                       Copy
                                     </button>
                                   </div>
                                 </div>
                               </div>
                             </li>
                             <li>Obtain a Permanent <strong>System User Access Token</strong> with <code>whatsapp_business_messaging</code> permission.</li>
                             <li>Configure your WABA <strong>Phone Number ID</strong> (found in Meta Developer Portal).</li>
                             <li>
                               <strong>Pro Tip:</strong> Create a template on Meta Manager with a single body parameter <code>{"{{1}}"}</code>. The system will automatically inject the full booking details into it for 100% dynamic notifications!
                             </li>
                           </ul>
                        </div>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 flex flex-col justify-between">
                   <div className="flex gap-4">
                     <Icons.ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                     <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 text-sm">OpenWA API Connected</h4>
                        <p className="text-xs text-gray-600 font-medium leading-relaxed">
                           System uses your custom <strong>OpenWA</strong> server to send notifications. Ideal for advanced self-hosted instance configurations.
                        </p>
                        <div className="mt-4 p-4 bg-white/50 rounded-lg border border-orange-100/20">
                           <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Configuration Needed</p>
                           <ul className="text-[9px] text-gray-500 list-disc pl-4 space-y-1">
                             <li>Get your <strong>API Key</strong> from your <a href="https://openwa-dashboard-production-b24e.up.railway.app/message-tester" target="_blank" className="underline font-bold">OpenWA Dashboard</a>.</li>
                             <li>Configure the Session ID and verify your server is scanning and active.</li>
                             <li>Ensure the <strong>Base URL</strong> matches your hosted OpenWA instance.</li>
                           </ul>
                        </div>
                     </div>
                   </div>
                 </div>
               )}
            </div>

           <div className="space-y-6 pt-4">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Automation Templates</h4>
              
              <div className="grid grid-cols-1 gap-4">
                {settings.whatsappTemplates && Object.keys(settings.whatsappTemplates).map((key) => {
                   const template = settings.whatsappTemplates[key as keyof typeof settings.whatsappTemplates];
                   return (
                     <div key={key} className="bg-gray-50/50 rounded-xl p-6 border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={template?.enabled}
                                onChange={e => {
                                   const next = { ...settings };
                                   next.whatsappTemplates[key as keyof typeof settings.whatsappTemplates].enabled = e.target.checked;
                                   setSettings(next);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4 bg-gray-200 peer-checked:bg-[#0668E1] rounded-full relative transition-all after:content-[''] after:absolute after:h-3 after:w-3 after:bg-white after:rounded-full after:top-0.5 after:left-0.5 peer-checked:after:left-4 after:transition-all"></div>
                           </label>
                        </div>
                        <textarea 
                           rows={3}
                           value={template?.message}
                           onChange={e => {
                              const next = { ...settings };
                              next.whatsappTemplates[key as keyof typeof settings.whatsappTemplates].message = e.target.value;
                              setSettings(next);
                           }}
                           className="w-full bg-white rounded-xl border-2 border-gray-100 p-4 text-sm font-medium focus:border-[#0668E1] transition-all focus:outline-none" 
                        />
                     </div>
                   )
                })}
              </div>
           </div>
        </section>

        <section className="bg-white p-10 rounded-[10px] border border-gray-100 shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <Icons.FileCode className="h-40 w-40" />
           </div>
           
           <div className="relative space-y-8">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                   <Icons.FileCode className="h-8 w-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">Email Content Engine</h3>
                   <p className="text-sm font-medium text-gray-500">Email templates are now strictly managed via source code for maximum reliability.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                       <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                          <Icons.Search className="h-4 w-4 text-primary" />
                          Where to edit content?
                       </h4>
                       <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                          To update the subject line or body of any automated email, you must modify the following file in your project directory:
                       </p>
                       <code className="block p-4 bg-gray-900 text-orange-400 font-mono text-xs rounded-xl border border-gray-700 shadow-lg">
                          /src/services/emailTemplates.ts
                       </code>
                       <div className="flex items-center gap-2 text-[10px] text-amber-600 font-black uppercase bg-amber-50 p-3 rounded-lg border border-amber-100">
                          <Icons.AlertCircle className="h-4 w-4" />
                          Database Overrides are now Disabled
                       </div>
                    </div>
                    
                    <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 space-y-3">
                       <h4 className="text-sm font-black text-orange-900 uppercase tracking-widest">Available Merge Tags</h4>
                       <div className="grid grid-cols-2 gap-2">
                          {MERGE_TAGS.slice(0, 8).map(tag => (
                             <div key={tag.tag} className="bg-white/60 p-2 rounded-lg text-[10px] font-bold text-gray-700 border border-orange-200">
                                {tag.tag}
                             </div>
                          ))}
                          <div className="bg-primary text-white p-2 rounded-lg text-[10px] font-black text-center uppercase">
                             + Many More
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden group shadow-2xl">
                       <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 bg-primary/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                       <div className="relative space-y-6">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                                <Icons.Terminal className="h-5 w-5 text-white" />
                             </div>
                             <p className="text-sm font-black uppercase tracking-widest">Developer Mode Active</p>
                          </div>
                          <p className="text-sm text-gray-300 font-medium leading-relaxed">
                            "By moving templates to the code, your emails are now version-controlled and faster to load. No more sync issues between database and code."
                          </p>
                          <div className="pt-4 flex items-center gap-3">
                             <div className="h-1 w-12 bg-primary rounded-full"></div>
                             <span className="text-[10px] font-black tracking-widest uppercase text-gray-400">Bali AdvenTours System</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        <div className="flex justify-end pt-8 border-t border-gray-100">
           <button 
             type="submit" 
             disabled={isSaving}
             className="bg-primary text-white px-12 py-4 rounded-xl font-black text-sm tracking-widest uppercase shadow-xl hover:bg-orange-700 transition-all flex items-center gap-2"
           >
             {isSaving ? <Icons.Loader2 className="animate-spin h-5 w-5" /> : <Icons.Save className="h-5 w-5" />}
             Save Communication Settings
           </button>
        </div>
      </form>

      {/* NEW: Real-time Email Trace & Diagnostic Console */}
      <div className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-6 mt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-700">
              <Icons.Terminal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Email Trace & Log Analyzer</h3>
              <p className="text-xs text-gray-500 font-medium">Investigate real-time email triggers, supplier alerts, and trace failure points instantly.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchDiagnosticLogs}
            disabled={logsLoading}
            className="bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 border border-gray-100 disabled:opacity-55"
          >
            {logsLoading ? <Icons.Loader2 className="h-4 w-4 animate-spin text-gray-500" /> : <Icons.RefreshCw className="h-4 w-4" />}
            Refresh Trace Logs
          </button>
        </div>

        {logsLoading && diagnosticLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
            <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-wider">Fetching live channel records...</p>
          </div>
        ) : diagnosticLogs.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-200">
            <Icons.MailCheck className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold">No dispatch histories logged yet.</p>
            <p className="text-xs text-gray-450 mt-1">Try triggering a "Send Test mail" above to populate the local tracker.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden border border-gray-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 uppercase tracking-widest text-[9px] font-black border-b border-gray-100">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Trigger / Email Type</th>
                    <th className="p-4">Recipient (To)</th>
                    <th className="p-4">Mailer Provider</th>
                    <th className="p-4">Delivery Status</th>
                    <th className="p-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {diagnosticLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const dateDisplay = log.createdAt?.seconds 
                      ? new Date(log.createdAt.seconds * 1000).toLocaleString() 
                      : (log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Just now');

                    return (
                      <>
                        <tr 
                          key={log.id} 
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="hover:bg-gray-50/50 cursor-pointer transition-colors duration-150"
                        >
                          <td className="p-4 font-mono text-gray-500">{dateDisplay}</td>
                          <td className="p-4 font-bold text-gray-900">
                            <span className="font-mono bg-gray-105 px-2 py-0.5 rounded text-gray-700 font-medium">
                              {log.type}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600 font-medium break-all max-w-[200px]">{log.to}</td>
                          <td className="p-4 font-mono text-gray-500 uppercase">{log.provider || 'N/A'}</td>
                          <td className="p-4">
                            {log.status === 'success' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                Delivered
                              </span>
                            )}
                            {log.status === 'skipped' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                Skipped
                              </span>
                            )}
                            {log.status === 'failed' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-750 border border-rose-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                Def refused
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              className="text-primary hover:text-emerald-750 font-black uppercase tracking-wider text-[10px] hover:underline"
                            >
                              {isExpanded ? 'Collapse' : 'Analyze'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gray-50/70">
                            <td colSpan={6} className="p-6 border-b border-gray-100">
                              <div className="bg-gray-950 text-gray-200 p-6 rounded-2xl font-mono text-xs space-y-4 shadow-inner max-w-full overflow-x-auto relative leading-relaxed">
                                <span className="absolute top-4 right-4 text-[10px] font-bold text-gray-550 border border-gray-800 px-2 py-0.5 rounded">
                                  ID: {log.id}
                                </span>
                                <div>
                                  <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">SUBJECT LINE</p>
                                  <p className="text-white font-bold">{log.subject || 'N/A'}</p>
                                </div>
                                {log.bookingId && (
                                  <div>
                                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">BOOKING REFERENCE</p>
                                    <p className="text-orange-400 font-bold">#{log.bookingId.toUpperCase()}</p>
                                  </div>
                                )}
                                {log.reason && (
                                  <div>
                                    <p className="text-gray-550 text-[10px] uppercase font-black tracking-widest">DECISION REASON</p>
                                    <p className={`${log.status === 'failed' ? 'text-rose-400' : 'text-amber-400'} font-bold`}>
                                      {log.reason}
                                    </p>
                                  </div>
                                )}
                                {log.errorDetails && (
                                  <div>
                                    <p className="text-rose-405 text-[10px] uppercase font-black tracking-widest mb-1.5">STACK TRACE / DETAILS</p>
                                    <pre className="bg-black/40 p-4 border border-rose-950/20 rounded-xl text-rose-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                                      {log.errorDetails}
                                    </pre>
                                  </div>
                                )}
                                <div className="pt-2 flex items-center gap-1.5 text-gray-500 text-[10px]">
                                  <Icons.Info className="h-3.5 w-3.5 text-gray-500" />
                                  Email processed at container server node and logged atomically to Firebase.
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              Showing the latest 25 delivery trace attempts. Expand any trace log to review complete payload details and connection stack traces.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const PartnerListing = ({ 
  type, 
  users, 
  onSelect,
  onDelete,
  onViewTours,
  allTours = [],
  resetForm,
  setFormData,
  formData,
  setActiveMenu
}: { 
  type: 'supplier' | 'agent', 
  users: UserProfile[], 
  onSelect: (user: UserProfile) => void,
  onDelete: (user: UserProfile) => void,
  onViewTours?: (user: UserProfile) => void,
  allTours?: Tour[],
  resetForm: () => void,
  setFormData: (f: any) => void,
  formData: any,
  setActiveMenu: (m: any) => void
}) => {
  const filteredUsers = users.filter(u => u.role === type);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
          {type === 'supplier' ? 'Official Suppliers' : 'Travel Agents'}
        </h2>
        <p className="text-gray-500 font-medium">
          {type === 'supplier' ? 'Manage your product providers and their tour inventory.' : 'Manage affiliated agents and their booking performance.'}
        </p>
      </div>

      <div className="bg-white rounded-[10px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Name / Company</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
              {type === 'supplier' && (
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Tours</th>
              )}
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                {type === 'supplier' ? 'Commission Rate' : 'Agent Discount'}
              </th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.map(u => (
              <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={u.photoURL} className="h-10 w-10 rounded-full border border-gray-100" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-sm font-black text-gray-900">{u.displayName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{u.companyName || 'Individual'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-gray-600">{u.email}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{u.phoneNumber || 'No Phone'}</p>
                </td>
                {type === 'supplier' && (
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {allTours.filter(t => t.supplierId === u.uid).map(t => (
                        <button
                          key={t.id}
                          onClick={() => window.open(`/tours/${t.slug}`, '_blank')}
                          className="bg-gray-100 text-[9px] font-black uppercase text-gray-500 px-2 py-1 rounded-md hover:bg-primary/10 hover:text-primary transition-all whitespace-nowrap"
                          title={t.title}
                        >
                          {t.title}
                        </button>
                      ))}
                      {allTours.filter(t => t.supplierId === u.uid).length === 0 && (
                        <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">No Tours Assigned</span>
                          <button 
                            onClick={() => {
                              resetForm();
                              setFormData({ ...formData, supplierId: u.uid, supplierName: u.companyName || u.displayName });
                              setActiveMenu('tours');
                            }}
                            className="text-[9px] font-bold text-primary hover:underline mt-1"
                          >
                            + Create First Tour
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <span className="text-sm font-black text-primary">
                    {type === 'supplier' ? `${u.commissionRate || 10}%` : `${u.discountRate || 0}%`}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onSelect(u)}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="View Details"
                    >
                      <Icons.Eye className="h-4 w-4" />
                    </button>
                    {type === 'supplier' && onViewTours && (
                      <button 
                        onClick={() => onViewTours(u)}
                        className="p-2 text-primary hover:bg-orange-50 rounded-lg transition-all"
                        title="View Tours"
                      >
                        <Icons.Compass className="h-4 w-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => onDelete(u)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Partner"
                    >
                      <Icons.Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                  No {type}s found in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface BlogManagerProps {
  commSettings?: any;
  openMediaGallery: (callback: (urls: string[]) => void, multiSelect?: boolean) => void;
  autoOpenModal?: boolean;
  onHandledAutoOpenModal?: () => void;
}

const BlogManager: React.FC<BlogManagerProps> = ({
  commSettings,
  openMediaGallery,
  autoOpenModal,
  onHandledAutoOpenModal
}) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isUploadingBlogImage, setIsUploadingBlogImage] = useState(false);

  useEffect(() => {
    if (autoOpenModal) {
      setEditingPost({ status: 'draft', tags: [] });
      setIsModalOpen(true);
      if (onHandledAutoOpenModal) {
        onHandledAutoOpenModal();
      }
    }
  }, [autoOpenModal, onHandledAutoOpenModal]);

  const handleGenerateBlog = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const genData = await generateBlogPostData(aiPrompt, commSettings?.geminiApiKey);
      setEditingPost(prev => ({
        ...prev,
        title: genData.title,
        excerpt: genData.excerpt,
        content: genData.content,
        category: genData.category,
        tags: genData.tags,
        slug: genData.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      }));
      setIsAiModalOpen(false);
      setAiPrompt('');
      alert("Success! AI has generated the blog post content.");
    } catch (err: any) {
      alert(err.message || "Failed to generate blog post.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const tenantId = getActiveTenantId();
    const q = tenantId 
      ? query(collection(db, 'posts'), where('tenantId', '==', tenantId))
      : query(collection(db, 'posts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
      list.sort((a, b) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
        const tB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
        return tB - tA;
      });
      setPosts(list);
      setLoading(false);
    }, (error) => {
      console.error("Posts fetch error:", error);
      alert(`Posts fetch error: ${error.message}`);
      setLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleBlogFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBlogImage(true);
    try {
      const url = await uploadImage(file);
      setEditingPost(prev => prev ? { ...prev, featuredImage: url } : { featuredImage: url, status: 'draft', tags: [] });
    } catch (err: any) {
      console.error("Blog image upload failed:", err);
      alert("Image upload failed: " + (err.message || err));
    } finally {
      setIsUploadingBlogImage(false);
      e.target.value = '';
    }
  };

  const handleSavePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPost?.title || !editingPost?.slug) return;

    const { id, ...restData } = editingPost as any;
    const currentTenantId = getActiveTenantId();
    const postData = {
      ...restData,
      tenantId: restData.tenantId || currentTenantId,
      featuredImage: editingPost.featuredImage || '',
      seo: restData.seo || { title: '', description: '' },
      updatedAt: serverTimestamp(),
    };

    if (!postData.createdAt) {
      postData.createdAt = serverTimestamp();
    }

    const cleanUndefined = (obj: any): any => {
      if (obj === undefined) return null;
      if (typeof obj !== 'object' || obj === null) return obj;
      if (obj.toDate || obj._methodName) return obj; // Firebase timestamp or FieldValue
      if (Array.isArray(obj)) return obj.map(cleanUndefined).filter(v => v !== null);
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) {
          result[k] = cleanUndefined(v);
        }
      }
      return result;
    };
    const cleanPostData = cleanUndefined(postData);

    try {
      if (editingPost.id) {
        await updateDoc(doc(db, 'posts', editingPost.id), cleanPostData);
      } else {
        await addDoc(collection(db, 'posts'), cleanPostData);
      }
      setIsModalOpen(false);
      setEditingPost(null);
      alert("Success: Blog post saved!");
    } catch (err: any) {
      console.error("Error saving post:", err);
      alert("Failed to save post: " + (err.message || err));
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm("Delete this post?")) {
      await deleteDoc(doc(db, 'posts', id));
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Blog Articles</h2>
          <p className="text-gray-500 font-medium text-sm">Create and manage your stories and news.</p>
        </div>
        <button 
          onClick={() => { setEditingPost({ status: 'draft', tags: [] }); setIsModalOpen(true); }}
          className="bg-primary text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <Icons.Plus className="h-4 w-4" /> New Article
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-[10px] border border-gray-100 shadow-sm overflow-hidden group">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={post.featuredImage || 'https://picsum.photos/seed/blog/800/600'} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => { setEditingPost(post); setIsModalOpen(true); }} className="p-2 bg-white/90 backdrop-blur rounded-lg text-blue-600 shadow-lg">
                  <Icons.Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDeletePost(post.id)} className="p-2 bg-white/90 backdrop-blur rounded-lg text-red-600 shadow-lg">
                  <Icons.Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4">
                <span className={cn(
                  "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                  post.status === 'published' ? "bg-orange-500 text-white" : "bg-amber-500 text-white"
                )}>
                  {post.status}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{post.category}</span>
              </div>
              <h3 className="font-black text-gray-900 line-clamp-1 mb-2">{post.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">{post.excerpt}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-8 space-y-6 scrollbar-hide"
            >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-black text-gray-900">{editingPost?.id ? 'Edit Article' : 'New Article'}</h3>
                    {!editingPost?.id && (
                      <button
                        type="button"
                        onClick={() => setIsAiModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all border border-primary/20"
                      >
                        <Sparkles className="h-3 w-3" /> AI Write
                      </button>
                    )}
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                    <Icons.X className="h-6 w-6" />
                  </button>
                </div>

              <form onSubmit={handleSavePost} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Title</label>
                    <input 
                      required
                      value={editingPost?.title || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setEditingPost(prev => prev ? { 
                          ...prev, 
                          title: val, 
                          slug: val
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/-+/g, '-') 
                        } : {
                          title: val,
                          slug: val
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '-').replace(/-+/g, '-'),
                          status: 'draft',
                          tags: []
                        });
                      }}
                      placeholder="Article Title"
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Slug</label>
                    <input 
                      required
                      value={editingPost?.slug || ''}
                      onChange={e => setEditingPost(prev => prev ? { ...prev, slug: e.target.value } : { slug: e.target.value, status: 'draft', tags: [] })}
                      placeholder="url-slug"
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Category</label>
                    <input 
                      value={editingPost?.category || ''}
                      onChange={e => setEditingPost(prev => prev ? { ...prev, category: e.target.value } : { category: e.target.value, status: 'draft', tags: [] })}
                      placeholder="e.g. Travel Tips"
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Author</label>
                    <input 
                      value={editingPost?.author || ''}
                      onChange={e => setEditingPost(prev => prev ? { ...prev, author: e.target.value } : { author: e.target.value, status: 'draft', tags: [] })}
                      placeholder="Author Name"
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Status</label>
                    <select 
                      value={editingPost?.status || 'draft'}
                      onChange={e => {
                        const val = e.target.value as any;
                        setEditingPost(prev => prev ? { ...prev, status: val, publishedAt: val === 'published' ? (prev.publishedAt || serverTimestamp()) : null } : { status: val, tags: [] });
                      }}
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all appearance-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                {/* Refactored Featured Image Upload & Management Section */}
                <div className="space-y-4 bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      Featured Image
                    </label>
                    {editingPost?.featuredImage && (
                      <button
                        type="button"
                        onClick={() => setEditingPost(prev => prev ? { ...prev, featuredImage: '' } : prev)}
                        className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-all"
                      >
                        <Icons.X className="h-3 w-3" /> Remove Image
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4 aspect-video bg-white border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden relative group flex items-center justify-center shadow-inner">
                      {editingPost?.featuredImage ? (
                        <>
                          <img 
                            src={editingPost.featuredImage} 
                            alt="Article Featured" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <label className="cursor-pointer bg-white text-gray-900 text-xs font-black px-3 py-1.5 rounded-lg shadow-md hover:bg-gray-100 transition-all flex items-center gap-1">
                              <Icons.Upload className="h-3.5 w-3.5 text-primary" />
                              Change
                              <input 
                                type="file"
                                accept="image/*"
                                onChange={handleBlogFileUpload}
                                className="hidden"
                                disabled={isUploadingBlogImage}
                              />
                            </label>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-[11px] font-bold text-gray-400">No image selected</p>
                        </div>
                      )}

                      {isUploadingBlogImage && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
                          <Icons.Loader2 className="h-6 w-6 text-primary animate-spin" />
                          <span className="text-[11px] font-black text-gray-700 uppercase tracking-wider">Uploading Image...</span>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-8 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className={`cursor-pointer px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-sm ${
                          isUploadingBlogImage 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-primary text-white hover:bg-orange-600'
                        }`}>
                          {isUploadingBlogImage ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <Icons.Upload className="h-4 w-4" />}
                          {isUploadingBlogImage ? 'Uploading...' : 'Upload Image File'}
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={handleBlogFileUpload}
                            className="hidden"
                            disabled={isUploadingBlogImage}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            openMediaGallery((urls) => {
                              if (urls[0]) {
                                setEditingPost(prev => prev ? { ...prev, featuredImage: urls[0] } : { featuredImage: urls[0], status: 'draft', tags: [] });
                              }
                            }, false);
                          }}
                          className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-sm"
                        >
                          <ImageIcon className="h-4 w-4 text-blue-600" />
                          Pick from Gallery
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Or Paste Image Web URL</label>
                        <input 
                          value={editingPost?.featuredImage || ''}
                          onChange={e => setEditingPost(prev => prev ? { ...prev, featuredImage: e.target.value } : { featuredImage: e.target.value, status: 'draft', tags: [] })}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full rounded-xl border border-gray-200 bg-white p-3 font-medium text-xs focus:border-primary focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tags (Comma separated)</label>
                  <input 
                    value={editingPost?.tags?.join(', ') || ''}
                    onChange={e => setEditingPost(prev => prev ? { ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean), status: 'draft' })}
                    placeholder="e.g. Travel, Bali, Adventure"
                    className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Short Excerpt</label>
                  <textarea 
                    rows={2}
                    value={editingPost?.excerpt || ''}
                    onChange={e => setEditingPost(prev => prev ? { ...prev, excerpt: e.target.value } : { excerpt: e.target.value, status: 'draft', tags: [] })}
                    placeholder="Brief summary for archive page..."
                    className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-medium text-sm focus:border-primary focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Content</label>
                  <RichTextEditor 
                    content={editingPost?.content || ''}
                    onChange={(html) => setEditingPost(prev => prev ? { ...prev, content: html } : { content: html, status: 'draft', tags: [] })}
                    placeholder="Start writing your article..."
                  />
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                      <Icons.Share2 className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">SEO Settings (Custom Meta)</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Meta Title</label>
                          <input 
                              value={editingPost?.seo?.title || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setEditingPost(prev => prev ? { ...prev, seo: { ...prev.seo, title: val } } : { seo: { title: val, description: '' }, status: 'draft', tags: [] });
                              }}
                              className="w-full rounded-[8px] border border-gray-100 p-3 text-sm focus:border-primary outline-none"
                              placeholder="SEO Browser Title"
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Meta Description</label>
                          <textarea 
                              value={editingPost?.seo?.description || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setEditingPost(prev => prev ? { ...prev, seo: { ...prev.seo, description: val } } : { seo: { description: val, title: '' }, status: 'draft', tags: [] });
                              }}
                              className="w-full rounded-[8px] border border-gray-100 p-3 text-sm focus:border-primary outline-none"
                              rows={2}
                              placeholder="Short SEO description..."
                          />
                      </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-100">
                  Save Article
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">AI Magic Writer</h3>
                </div>
                <button onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                  <Icons.X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Tell the AI what you want to write about. Be specific for better results (e.g., "Write a guide about the best waterfalls in Ubud for 2024").
                </p>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your article ideas..."
                  className="w-full h-32 rounded-2xl border-2 border-gray-50 bg-gray-50/50 p-4 font-medium text-sm focus:border-primary focus:bg-white outline-none transition-all resize-none"
                  disabled={isGenerating}
                />
                
                <button 
                  onClick={handleGenerateBlog}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="w-full bg-primary text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" /> Generate Magic Content
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AdminProps {
  overrideMenu?: string;
  overrideTab?: string;
  isCentralPortal?: boolean;
}

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
  const [expandedMenu, setExpandedMenu] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const menu = params.get('menu');
      if (menu === 'tours' || menu === 'categories' || menu === 'tour-types' || menu === 'locations' || menu === 'addons' || menu === 'transports' || menu === 'labels') {
        return 'tours';
      }
      if (menu === 'bookings' || menu === 'channel-manager' || menu === 'schedule' || menu === 'operation' || menu === 'inventory' || menu === 'import-bookings' || menu === 'timeslots') {
        return 'bookings';
      }
      if (menu === 'settings' || menu === 'payments' || menu === 'general-settings' || menu === 'payment-settings' || menu === 'communication') {
        return 'settings-group';
      }
    }
    return 'tours';
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
        'tours': 'tours',
        'categories': 'tours',
        'tour-types': 'tours',
        'locations': 'tours',
        'addons': 'tours',
        'transports': 'tours',
        'coupons': 'tours',
        'urgency-points': 'tours',
        'timeslots': 'tours',
        'labels': 'tours',
        'blog': 'blog',
        'pages': 'pages',
        'content': 'pages',
        'users-admins': 'partners',
        'users-suppliers': 'partners',
        'users-agents': 'partners',
        'users-customers': 'partners',
        'guides': 'partners',
        'communication': 'settings-group',
        'payments': 'settings-group',
        'settings': 'settings-group',
        'payment-settings': 'settings-group'
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
        const snap = await getDoc(userRef);
        
        let userData = snap.data() as UserProfile | undefined;
        let userRole = userData?.role;

        // Auto-upgrade master admin and tenant owner
        const userEmailLower = user.email ? user.email.trim().toLowerCase() : '';
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

        if (userRole === 'admin' || userRole === 'supplier' || userRole === 'agent') {
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
              "ðŸ’¬ New Trip Inquiry!",
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
        children: [
          { id: 'bookings', label: 'Booking List' },
          { id: 'add-manual-booking', label: '+ Create Booking' },
          { id: 'waivers', label: 'Digital Waivers & Safety' },
          { id: 'invoices', label: 'Invoices & Billing' },
          { id: 'conversion-funnel', label: 'Conversion Funnel & Drop-off', hidden: isAgent },
          { id: 'guides', label: 'Drivers & Guides' },
          { id: 'channel-manager', label: 'Channel Manager (OTAs)', hidden: isAgent || isSupplier },
          { id: 'import-bookings', label: 'Import Booking', hidden: isAgent || isSupplier },
          { id: 'schedule', label: 'Calendar', hidden: isAgent },
          { id: 'reports', label: 'Booking Reports', hidden: isAgent || isSupplier }
        ].filter(c => !c.hidden)
      },
      { 
        id: 'analytics-group', 
        label: 'Analytics', 
        icon: BarChart3,
        hidden: isAgent,
        children: [
          { id: 'analytics-overview', label: 'Traffic & Visitors', hidden: false },
          { id: 'conversion-funnel', label: 'Conversion Funnel', hidden: false },
          { id: 'google-analytics', label: 'GA4 & GTM Tracking', hidden: false },
        ].filter(c => !c.hidden)
      },
      { 
        id: 'tours-group', 
        label: 'Tours', 
        icon: MapIcon,
        hidden: isAgent,
        children: [
          { id: 'tours', label: 'Add Tour' },
          { id: 'all-tours', label: 'All Tours' },
          { id: 'categories', label: 'Categories', hidden: isSupplier },
          { id: 'locations', label: 'Destination', hidden: isSupplier },
          { id: 'labels', label: 'Labels', hidden: isSupplier },
          { id: 'addons', label: 'Add Ons', hidden: isSupplier },
          { id: 'transports', label: 'Transport', hidden: isSupplier },
          { id: 'guides', label: 'Drivers & Guides' },
          { id: 'urgency-points', label: 'Urgency Features', hidden: isSupplier }
        ].filter(c => !c.hidden)
      },
      { 
        id: 'car-rental-group', 
        label: 'Car Rental', 
        icon: Car,
        hidden: isSupplier || isAgent,
        children: [
          { id: 'car-rental-bookings', label: 'Rental Bookings' },
          { id: 'car-fleet', label: 'Fleet & Pricing' },
          { id: 'car-rental-automations', label: 'Booking Automations' },
          { id: 'car-rental-settings', label: 'Module Settings & Zones' },
        ]
      },
      { 
        id: 'inquiry-group', 
        label: 'Inquiry', 
        icon: MessageSquare,
        hidden: isAgent || isSupplier,
        children: [
          { id: 'inquiries', label: 'Incoming Inquiry' },
          { id: 'ai-hub', label: 'Proposal Generator' }
        ]
      },
      { 
        id: 'coupons-group', 
        label: 'Coupons', 
        icon: Tag,
        hidden: isSupplier || isAgent,
        children: [
          { id: 'add-coupon-trigger', label: 'Add Coupon' },
          { id: 'coupons', label: 'All Coupons' }
        ]
      },
      {
        id: 'tickets',
        label: 'Support & Tickets',
        icon: LifeBuoy,
        hidden: isSupplier || isAgent
      },
      { 
        id: 'blog-group', 
        label: 'Blog', 
        icon: FileText,
        hidden: isSupplier || isAgent,
        children: [
          { id: 'add-blog-trigger', label: 'Add Blog' },
          { id: 'blog', label: 'All Blog' },
          { id: 'blog-categories', label: 'Categories' }
        ]
      },
      { 
        id: 'pages-group', 
        label: 'Pages', 
        icon: Layers,
        hidden: isSupplier || isAgent,
        children: [
          { id: 'add-page-trigger', label: 'Add Page' },
          { id: 'pages', label: 'All Pages' }
        ]
      },
      { 
        id: 'popups-group', 
        label: 'Pop Ups', 
        icon: Sparkles,
        hidden: isSupplier || isAgent,
        children: [
          { id: 'add-popup-trigger', label: 'Add Pop up' },
          { id: 'popups-manager', label: 'All Pop Ups' }
        ]
      },
      {
        id: 'reviews',
        label: 'Reviews',
        icon: Star,
        hidden: isSupplier || isAgent
      },
      {
        id: 'guides',
        label: 'Drivers & Guides',
        icon: UserCheck,
        hidden: isAgent
      },
      {
        id: 'users',
        label: 'User Management',
        icon: Users,
        hidden: isSupplier || isAgent
      },
      {
        id: 'website-builder',
        label: 'Website Builder',
        icon: LayoutTemplate,
        hidden: isSupplier || isAgent
      },
      {
        id: 'payouts',
        label: 'Finance Report',
        icon: Wallet,
        hidden: isSupplier || isAgent
      },
      { 
        id: 'settings-group', 
        label: 'Setting', 
        icon: Settings,
        children: [
          { id: 'analytics-integration', label: 'Analytics Integration' },
          { id: 'backup', label: 'Disaster Recovery & Backup', hidden: isSupplier || isAgent },
          { id: 'company-info', label: 'Company Info', hidden: isSupplier || isAgent },
          { id: 'seo', label: 'SEO Setting', hidden: isSupplier || isAgent },
          { id: 'payment-settings', label: 'Payment Setting', hidden: isSupplier || isAgent },
          { id: 'communication', label: 'Communication Setting', hidden: isSupplier || isAgent },
          { id: 'website', label: 'Website Setting', hidden: isSupplier || isAgent },
          { id: 'domain', label: 'Custom Domain', hidden: isSupplier || isAgent },
          { id: 'docs-system', label: 'Docs System (docs.tripbone.com)' },
          { id: 'guide-pdf', label: 'Panduan Website (PDF)' },
          { id: 'company-profile', label: 'My Company Profile', hidden: !isSupplier && !isAgent },
        ].filter(c => !c.hidden)
      }
    ];

    return items.filter(i => !i.hidden);
  }, [currentUserProfile, inquiries.length]);

  const activeMenuItemLabel = useMemo(() => {
    const labelsMap: Record<string, string> = {
      'billing': 'Billing & Plans',
      'custom-domain': 'Custom Domain Configuration',
      'tickets': 'Support & Tickets',
      'developer-hub': 'Developer Hub',
      'user-settings': 'User Profile Setting',
      'backup': 'Disaster Recovery & 1-Click Backup',
      'analytics': 'Analytics & Growth Hub',
      'analytics-overview': 'Traffic & Visitor Insights',
      'conversion-funnel': 'Checkout Conversion Funnel & Drop-off Tracker',
      'invoices': 'Invoice Generator & Billing',
      'waivers': 'Digital Liability Waivers & Safety Kiosk',
      'google-analytics': 'Google Analytics 4 & GTM Tracking',
      'analytics-integration': 'Google Analytics 4 & GTM Tracking',
      'car-rental-bookings': 'Car Rental & Charter Bookings',
      'car-fleet': 'Car Rental Fleet & Pricing Management',
      'car-rental-automations': 'Car Rental Customer Booking Automations',
      'car-rental-settings': 'Car Rental Module Settings & Pricing Zones',
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
              <span>Verified Operational Document â€¢ ${siteName}</span>
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
                <option value="pending">ðŸŸ¡ Pending</option>
                <option value="review_required">ðŸŸ£ Review Required</option>
                <option value="confirmed">ðŸŸ¢ Confirmed</option>
                <option value="completed">ðŸ’™ Completed</option>
                <option value="cancelled">ðŸ”´ Cancelled</option>
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

                              {currentUserProfile?.role === 'admin' && (
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
                            onxœì}ÝrÜH–Þý>E6w¦«¸Ã*þKj®H›jus-©å¦zÆ¶B1*€,¬P… %²†ÃßøÂ7ö½Ãvø)ü<~û|Nþ ™‰üC±Ô­žfíN‹…2™'OžßïœeéøÃñmT.gcÒß$Ç'äöˆóS&Õ÷ódö*™-Îãþl‘e›ÿìy$ºŽÒŠ,æqT%_çù‡tvuQEÕ¢ìØ·ao‘Þ8ŸÎ³¤Jâž§Å»;çÏã,*Ë×Ñ49Þ¸\Â Éüfp@æËÁÞðTÉM5¸)Ù¿£l‘íìIþ1)ŽFWìÊá¹Ì’’VÉ´Œ“Y•ä*šÓ.ó<˜g1©ŠhV¦UšÏã<Ë‹rÃ1®ç˜ŸžóY9<›$ãgi1Î’=ù=&ƒ}èùšþ·øáÎÎÙv7ü**>¨$gbrw?Ý-ª*ŸÙ[Ü¼ûëo·ãEQÀTýX&Å›"¿L³äÙ°È³„“^OÓY|ù%é»†à~›[A0%¥ò¶3w™S lÝ|‡ ,_ÿtlˆç6BòÙY÷ýƒŸö~‚÷‘˜€VïîüïÙaCÍ‹tËf?å°G®>ÍŽÂ›\ðÓÞYÎU×¿µðsÆæš¼‰–Sx)ey7~6Ýìm…ÍÆI–ýVÈ¿~ÛŸŸü‹$<:”Ž¼ð‹Óþ¿ {6Ð@¢§3Lø¬‹æÝçcQ®H’+dzIúœÕö7Þ$Å4šÁÒfK'xÖj’–â4"E2Î‹øÙÆæfÐa¤>‰fq–<§ÍñÉ–H=„º=wø©¿#í?ÞÑiÿÐKûY4þÐ&~2¯{0}EœƒJüqUDËÁ.©sØ>
æÛâm•·˜E÷sÐ®`«D$:pÓsÀ®xêèÔzF<ÝŽÓæçŒÏXî7^6^Ô¾Þnÿy•@ø6QÄÀ$bÜU”f%ù§m}O¡Ey®Š4&ø$ƒ( ieŸÌGƒ]¶"YrY1Â)b6#×Z„vå<šö7Ãí“CùnÚÇ»¯æ7ïêÄ«”ö€ÀóyRŒ£2Aªãn\§@'oóEA¾a`ü!ºJžnO]Î[=Â2v÷t7­;@YÅØU•^Mª“ú ¯ Ï·i•%wO·çÝ½ÛÝiÞž=²ìÖ¼ëZêlÎÞ›2wg!'ã*}òå8[”U>MŠO¸Ðçb6Dš¤1ïöyTEÏ†È4±ò·¿‘ÞëíÓ^÷uRß·~K6 >*ï8’)lAÏ øêý2«ìø#H0ÚõîiFPr´M³¡RX,«œÜu7É;5µí#oþe#¯¢ŒœM¢¢+§­ÎW©ã2‡#²zS¤ã¤ß01èîtš/fÕægHš\»#¯’j’ÇæC!g—0=»09ý†ÓÒ.YtÛ‚\±ˆ²Þæ°HæÐTÒïý¹êéuœ±ša¨éÕ,‰¿]À[Re¡zû‘J‡M@Ö£oŠ“Ótq°²1ÈRÙÑÏ þ+ðªôr9%Õu’ÌŒGu{ fÑrÉÌ&1ÑmT÷µ¯Ù(ÏN«’ß)_(BWÊÂA¬Ý8dmölú§Ú,ŸÕÄh%£#° ŽŸÌ}ýiUe4Ÿ»ÌO‘;J8Š]J%Y~‰4=Ôtðx<­¤EÈŸNÉé¸J?&Ö©Á±Þ_8oÝk¸¯uiSyêö2Í`¿$1×+Ëa–Ì®ª	µÕî´ç[ßy°ËvØœò§Òr3ïUeQ¦î²ÂÅ¸žÀ&öñŽ›¬5õ¯s¡`#Ãmð_Ê$!ÜMò9ê”åÐ37ÍÔ´~“µ0ÙJqû1M®_å17oÇ ]-[ö5}Ú`ýÇÉ`9xD¢b•Ò¹Œbúo¼("ªïßQ_µª’(Páäy
íTã	••ÈëèczEDkd‰w]ÏÒ‡QO¹˜Ûw»{¸]æƒCÛ*”“(Î¯ñ€ïÐf²FöŒÿAeŽLã#úw‘_ãß.öOÙøÃHìXÐ4?1Ð]³âççÂ2¡«YU&Mw¾º6öv’™UV¯5¬¶‚ùì_¼‚Ë…geEæEò‘“(ŽŸGË²?Š29¿ø¾_&Y2®¸
¤¯»¹E»N³T™TúS}&ö±g–ð¼z5ˆãÞ¦£­;2Æiî'›·6SˆÕM¨ò1àîµÉ*\Œ	¶ÖV¨›o¼·KóE	t±4ßêYÎ&ÉÇ"Ÿ½Dû‡"¹€Ür ñ_—Ôâ6;=ì·6ÄY·UÃÒtQFT†°“·ýûRe‘T‹bFÙ¸È±÷|¶HL^Á‡ i¹œœ¦UÈ Z:Z¶‘èfßbÉ%cÿsØü3XïÐÍ¿úÞÇ^þ~÷þkœÃ{îûèû$ßmö³–£·Çå ¬¢¢Âãž~‹Un>Œµ6‹$‹ð8µ|j"Zã¨ÀoòÓÑ¤ E…JÍe5Ø'UK½½Gtá2»–ôBKí¬}ÓÙ|QÙö^µœC÷heÚ°Ýò1Ýëø¶µ}¬žØÏTI`C'ž©dX¡Í¦ÒŽÜ|Ì¸#µVài![/|rZö—t6Ýž¶éÚº¬Mc–ÖRµ´{™åQ¾¨²t–0M—]âÝ
©”‡2‡¯yJÉ™‹¾Ð÷4®AFÜG!Ñ¼›tcU|¼\ãänþyMÎþ¦ÎEÍ‹!/Å´
TÙ"2@_<l/QËÊ°J˜(ágªæMù6#“»ÍÎô\î-ƒCëOIò![ÊšÖEU¤óîþ¬ÇV±þ^¡<¥“)Vy8æý>\§Ëo4Ì±÷3NÊ‡dyŒR£7×L!4&5â%§ÛñÌf¨ÑÔA£þÇ¿2÷p£øÚS½DYFêcËÒ=¾EZž1»€•©=#¨sF°-øRÍVP ï²Äí{¿ôm˜ï®íÖ«å‹Û¸ –£JSp]KÓiç–UØ$ãd*®œõ˜µ¼£Uw`¤¸¤6H‹œc7±užÕ›Áëxõ'÷xõÅ´û›Ó‡Çè]!'&ëžÔJøÁ,Õ‚Ö€ŠX°gÊ©ÂYÿî‰FQ(°¢à*¶6(±{øW¶3¬3º·µÝÍ†(›ÙWl‰´‹ñHTO0Mx±µc_cy¡ìñmÈ¼Ñ´¤§$®ý*©v±­×>Êáà™Â:_Ãÿ&Ì$æU^\« m±wÛì¶ c·y·,§ô(k,sÿæÍ9¹XLéXÈ¯½ÖRíß%åôHQÉ®¤¯ÌvéµÖBé\ÚÍIg1¿¢ükT·öì¡ìT•NEu”9³ŠÆt®¯‹4¹¤g‚¢‹¢uh\l›viõÛe5¯B;6BqcÇÓíÉA ã¤Y«ÑËä*£æŒF-™/ûŽüK>*ÃCdÌ²ççD4Ü#ºýxGó!†Ñz\Ë_ÍpCþ·´ö¿Ì£øg$›7ÑÍÿJ¸OäÓø[JñXƒ÷?S¢ÎëúÀI~&
®ó;²M”ë” Ï¨Tq_’Âãô"ºL*é<=Í’¢bÑž^…Ø(On˜éÑK›A[F”&b1SDÅ`Ã‚01šŽ`05o
viOÈ|ì+Šñ¦VŽHß<ý¶nEÇõ&‘z–ä«
¡(š­=­Z‹7µL¢iÈÒ%”UvØÎ&iÝ¾òÄïª³ügùHž¸aû‰:MÓa–´o]£°ý16t1I“,fäÞfCµK¾ÈÊÄ"øn"qøû /”Õ¹¢[—þW³Î*èët`‚µ™#H®WLA˜q„6U§ëÚÚ"ê-®;9›ùPÙoÓßy$qÉÂµ‹ÞÂ`¾/œÊ›•2”}£sûkÙ^¬Ù1®7;Í¹™¼ Mn)gÎq¿ŠmTµR/üÆÉëœ°×%ä^’|Æ’j@õ ‹ÊÙñ@4\j)œ§‹8­šòb1T :“?4ì
D¼Y’yOÕ`
Zg?{ãgö‰$ïíw‘÷:ö\Ñ<4óö‰“4>"½(Ëz[$‹FIßdâƒËÔ rDta€Cî×ì0Öã¯GîLÇC³¥¡üŸÿö?ÿïÿþ¯äÇ†™|?Ë–ÆA5Ïk#«Ï1"	ªd±{¸mN`f¸-íÒïzÓü÷ÿD.pÓ.2h /bI7¯`yªëññ‹yœ…_½SÛäd6;×¦Í˜×¹~Ž2<mT"á¬I³äcÂolH­½gNØ«;Uàáa‡úS`;¿Ï¾—EöØ­î}³ÆN×ÎÅÁb·{+ïGƒ!Ù;†ùXVØ–³ÅçUaO«ÇˆÎÜ˜»Euë.˜õ¸\N(P*¿[—;–W¦Œl6³w_+{è³f†·÷v¤Õ²F8Pý›­¹™KºÒH÷f³zKIa‡§ûvØÐA™÷3?·ÒÜôc³cJˆy:/Œžã‹I~)Æ­îyÑ8s—<ÀûŽä—Ä`®­.ôˆ¾XTòË$”¿Eë¹.é„•£·E\ƒ•IF)çqÏážiSl´}9-äO@{"­õ¾%ÊÈ¬„×k.ZËñòSdH7"T^0ÂÖF–¶‡íQÅf{4‹÷\¤ ‘ÕšbUZ^ŒÐŒVOœpÔvàK@dŠi²Ï@q-¸À¯o+;¯1l8“:åõQ)N©=r“I_÷éQoÑ=û’
Oœ„ìŽÍ.>5A"”-€HèÛ,E™Ÿ†`\C°‡"½JgQÖá‘ó’ßüœæ²#\D¿*¬r– ¸°Ó¾•žÑèl˜¡¡r+]õcôËe§i¬ÇÉh±mWÐÅ¼æjVÉAƒ•9VaeœÒƒ"““ºJ+¿êÈÛæ÷}°ì/ŒIbçéEAcÂ•M¼»;ê8Ø‡fËn3˜³€©Š°VÙ%\¢´ä´ì;rñ0æÄÊ¬òß%ÒNÛ8oëeÕüLÑ–ýWƒù‡òìi>Ëœ¼F¬š¬`dæFÇ ñó–¦"ž8q—Ü§°I
sÝ8(_Y®Û÷1^90ZÙ:çvtÉü¦fÄÿíodä`…¿o8u1gîYK€¹eB¡HÀ5ÓëµO»9ŸÓ©d¬Þíw“é{<’…_6(tL!¦ÍÆ¢V@;êÜO‡§¹•t—‰ÁÇ¤91:÷Ý@±¾¹eF5Ø(GB÷N0•*¹þs‘üe‘MWµeM7º)†¶nïØ¥]ûÙå
ùja¶òû}[Èù£ã” x5­†<·‚ôÔvJ°äÏK.Ì*$kÄø5„(ºÝ¡í)f›æ_ÎæP‚Öl7À9Žé5»¬ø¯¡)þm5Dw˜…ŒWÆÞqŒØ—˜ï <ù’Ôò6×¸ÊaàÝICŠu~¤Ã?˜Ó=Ð©·Ö4ÕÀ‹y„Ö™«KÄÁiµ¼ÍKÇÒò8¢ãˆ¼¦Q6Ò·É“ZéÝ¥câÐ? ÒßÐô”Cšžâ	‚ÑŠî!ùÎÿÏñ( Åé|¾òÒÕ¦ˆ&ÏEÐWn>Á¨ .¥	àŒßöòqH©³ˆ)kØ€Š×‚í?ßrI>E•ŽSè¡*Ÿ£x‘U%.ØÎ&ù±Ü5ž¤Y\ÀDÒû06°,Õàøëßz¾#§[Är›Òò93«ª‚îA)~@ãox ÙÀ‚£Qÿ,"cHªÏb,¢:ÆbÓzHµŒÆÍû4BLî8-½|„¬]gh†ÓÕO5–ÉÆ2?è)Ÿ¿)òyÄÒÐúnÁrj=m:µÖ‡käìŒðð™mò¼€E/ˆð\»‡¸MÇÈAu;’kÅxûf¥k6ës(îÐ.ÓS÷„ää+"Eçø^ÁË}<Ý§‚éH*âT;¢­©­6,úª‰»ZÇ„¸RŸÍ«[z{ýË÷Ÿg”Ûh9§‡Ÿ&Éœ'ûRÍÅ‡DÀÈ1Q3ÇÃ ”¿€{Ã ‘}pÍGÆ	žû1þoª´ð}Z-Á(o6Kˆ6µG‘¢]V ëÃH÷x\ˆw]š¸ÂX'd{›€À›Ìb’åWWhCN>ú÷û0j@ó êæ?$—@pž!ãie_¸.ž
AmÇ[eÄ%å•º_Nvli&¦Ð™&e	êøù‰SR”ÖhIJqUüÚÞ,¯L¯ú ¾3yŠTÐ¤ÿ>¼(“)ØT³^‡rrY‚¬<l’Ñµ©Qô.g,s—6~JË¬‘rkP˜¢c(Œ\ó,Â#yÑßx¥VåõZ’+\Ú-‚Â{ÏI28üBÈv“@
aTvÌ†T/ÓYÜ¿B&û‡ÚE‘•†ù®Òjè|É¨ôìt}›Ó„ò²¥Žv]Sæ¹ÃS(ÐëÚ|j¤û£ŠÁ
woÇ"AT1Ðà×IT zÀîÒ<±#t\Šn¢˜ˆïh&õŸAœú3Öß;ì³‚ƒT|—Ä¶Ó+±GÕo	8…^=°dÃèŸ£VŽË®Þê‹;h}5 ¼eTÿ/3 	?í@Ž½¢Ë>e,Qd}Äù‰ŽR¼²]~¼úÃÍ4ÛúýþüIàÏYyÜ›TÕüh{ûúúzx½?Ì‹«mx›¼¹‡A6Ùq	¡GÐ›ñu~sÜÛ!;dï þ¿ƒ+òÉqï÷{û_>Ú—Pyª&Ç½½Þï÷¿þ@èŸˆŸÇÑü¸GÛ“/ÿ+Y}=>î½ÚýŠ|•“Çø¿Ùf­áàà¯Í€s«™–‹ô¯0+=¦ò±tÏfõ	÷O 'z76NŒjÒTÅÁàé6»Ñ×Þ-g§ØrÅ8¬9¨Å<ÐBŸÃp!Š×üªŠÁp†f}ñåZàÞ>#?õÿð;íêÝæOä(@¨GÅ$ll0AM;Œ¯ßßÙkéß0Òö-(ñÞš?±ímháÔ
G¤?Í)ÜbÑD\ˆ°v‰2Q#u(æîÉ±–Æ¡>ÄQG¯?Wu©Ë<¯ÖóYœž>Ÿ¼.DlŠÔP&Ëfý¹9oÚ9n½\E`weØúºO_¬ƒ¿¾‘ntŸ[[¡[[9ž®~¼kT]ý`ÇØ:öq$ZÌ(ß[	ß¬cZ….%2¿µÒn—²_.¢.Ú/ÉË¼Å-xdÑ)è<×PI^ä(ò•.Z Þtv¯Ü£ýî ìsðÈOŠÙ-*Yü³ƒ¬Ïí…æFš¾ÌàïIÇÈ±aÐÓøh>xÒ«[Î5 êžŽÀ º€\‡!#Î9ªò+Ø™„¦š'°Þ«’Y$Å¦Xj—™w0e¯Žm„þlÙ¯NÐ×ÎXÏüò qÆòUì(/ñ£´û­V[¤'Á3›“tÍ`ÈaD‚àÂ¿±Áw¦~@@ŠÇUþ6§`cþlŽƒ–iÅœ¨%—Ù­§°^~ö±)Ã‘)U;`Iî9ÕncZ(÷BºpnÄqa.Mƒ‹h;õ¤“x˜¿¥t~#çèGK-9Y6Èa}.¥³™‘Ü¾ë],fâ›ÿy»HðŸ?Ñ,áÞÛÉÿyQ¤øÏETõXî.‚Ø¹Oîé9	n_æ^6ˆi³wsE……"E,!ÓÁ¡–Þ­e¡½Ý"i|cU˜mn«1ŽÉURIi?ÐÅž5Éàìé´¬SþŽñLhKÂÆ¯Ìb¼h‚£Rþ\7C¿±†¦øç¢ˆ;š¹Â»’bËo5M
[¿\L·Ëù†?1Þ¦?òä8Cq6·à?ÿlRèxu Ê‹57ŠgGÁ¢ÙV/ƒéµšqB=ñŒŸ w=¤òfƒAÍ(ÎL"áÓJO’0v1ª~ÏeÛþB#×åðÒ=9_xÿpÇÑ’D°ØÅîÝS |Ù—t†YÅGÚ@÷-¨ßVk³UI
ž£ú.»KÈVm«…`àh5}AžÉÐ¶û,Ÿ›Ã2ôj—õŠˆ&š¨Ø¸œKØZÄvÃ,ÞÚ‚'ŸË¦”÷ôbwì½;läVæC<¡™£ï¶)ÚµbX mO€¶¯%áŠÂ±º­úòˆË|šôGÈhFJò†À½M-ëBé:t{h6ï\6_yc›At=Sn³ Øq§ÌÏùDÓÏIÚ~;
3j~ë]XŸ^Ùóz
:/µÂ¼Ôg›k¬}ÓGX¡””½yn·’ @q4?•¿Â†,ayÆ ºÜÝÐX‚ZXR8ã?pû–òÚ—‹=¦ÛFý5r³˜†BÍvHÌÃ‚Y·2j.­‹aú© îò‡†,ôÖµ§¨i#ÞZÅº±"­Éf‰iFÜæ,Ü|ï¸‡F<+|¦Ž{2ùºº3>’DÔ›Á!Óíº ÛZjŠÍ•-bÎEV ÝLqkôMGŒ£2ïM32N[:vXû@;¹¥Î-Ö,å¥¶²åV›¾69×hQ@Ééb3K}óŠ¼õŒ}\ØKî†N«" b®»æP¤sÍ;³zÝuºŒ»Ù}VF1±´Cpr  Iv‡è=|›+ù5)¼Di³¿ …\Á­hêÓü:qDlPnøyÀÑpDlB ø<À‰<À‰xæüNäNÄ'ò ˆ< xÈ> x(¿þ½!x0°‰tv™“±¹GÝÖ`Ç`Gû÷_;âÃ`Ç¯zù ;þn ;Xâ3¸ävmÑ„Êñ€Éñ€Éñ€É¡09ô	yÀä0~09þÞ09p5p5~µ¸ØøyÀÎxÀÎxÀÎxÀÎhMËvÆvÆ¯;ÃXvéW…ñ ñ !à/à/>øgÈ6/—hImÑÌö ml\^ìîé…?øpÇSÝ”Þ£rbµ8Á;$G2-œ¬"xnÏRqð.ñ³1¬ê6¤ëtûÞÑQ¦žÏ°^ÍòU4±· uT[e·¼cõ÷.˜Å™ÃéÂ{xfQ&ø%y
ò)LÉ	/œøÏr#%èJãÉ¿]$ÍÄ­.šïrý^ë9FZ| [rŠ)¿¦_#£&¯“>þWäÄ²&E9Avgš”ìñWÉ4ï«A»<k67ÖS;dmôS¼[ž/„o†TŽ"’oÛ4·¤Ôê)ÍÚævÚßÜ£Bn¬0cöv·QžÊ_æ×Iq4«7æœàt(l;ê£Ãt6Î@êý¿lÂ»™úf
ì®ÃSýt8Ï¢–aæçMûÓò£Ò{{ÑÝV›NS	€Y|9¡ˆu#Ü ¥ÁoÕFC~ë»»Ð{¯P‰jp¶•k*êa<Z“eÉ¢mdMÄ§Œ')àd|+l€ýÍÖë×&1¢ÛÄìx²´}NÜKñ®-\Ù(KŠÊð*#g“Î^àŠÓ´,S<Æ6š1±¥Q&ŸY›ž'%(öªaò•Æ­À#þú§EB–ù‚”þÇu4«p`1m“1\þVÏ66å¹Ð]l­Øs®µ’éÍ2ÍŽ‰æãâCjÏ°aŽÕG¤mŒgêÜj{Ùš\'‚ OTšcvŒäÉÔÁºSöt4'“rót²×:Î÷@@°jZ®^}¾cØG:'õñt{²×êÌ¨´¨¸;,ò;‰ÓÅtã„²Ôx>¸Jf	J8=ÇQ`ˆ	rÃ’ÀÇ²¦e1/‡-ÁÁ$
Xü†<ŒžGMÛ2—<Ùa,·€˜Fœ_Vƒ JÆ¶÷È€ÊÆ"Ž-éŽåãÖ~šÎæ‹ª­LÑ Ô	ÈXIq¼ÁÇQo¿ápØ½¹QFâïm‰´ñS&5,E}{_u@Z%CLØŽwwÐx|ÀúZPL¨Êðœ¡yDëWK2ªªÔ¢P©˜A›l,zQlFÅ­ õ™ÙƒöçuÍY¤šlÁ/:ºÜ;*ú %×ø#ã$þóbŽ_Öà«–N Ã0tJ“¥ÎªƒSC]i\xDVû¥s±-Þ3(T7[ºJÕÕ3Ùc[¢dÉÍømø)l T¯5—–*ÝÞF­™0åÐù£ÆÍªç¦ Q'ÄÐ“¨+Ô zUÑÄÌöÎféÜˆaÇF'v4/õ ‹§Õ$‰â[«
mèõÑ"|)Ê€Ÿ´ yÛš}äÒÛÅÒð„~â§ÛÕäçëQjüy{}§0·ü¼=³½úsö©â„Òhã àZ¡	~Zòx)¶#ô4Xþ‡™Ù#Ä€®ISF.4
£ã÷Ã”â²-ºYdk—tHÝ‰­šÎaÎ~¯bãœÛ¬?.	ÕjX7G´¹òO$¹ÒjÄ«§d\$Ló{ê0na88šCë~G‘bÒ@V¢Gé‡É$[Z=Kîˆ¶ÕRê>Ýû}÷ÝÑtÊÞl°Ò+9lU‹³Óë¿5¹ÜáÙL'õ¬³Ž'©qÅ<J¹jòt£<ð†f|ù¥àÐª%|A­öÄ :Ââ|"R`˜#©;OÑÄY‘ý!MAmTó-µÁûg]g¦ÃÊÙq»8õ•¢î¹\Lqyì~·ŸyÚ] !¹´ûØ×®‚VÖÍù"‚-î¢ž3ÉpŒj“5qö‘+«ÔÔš¬}9ÊÑwn·QãÌÉ·54‘­Q«Þbö³Ù“º¤OoLèª^ÓÿâÏ…­‘3Ù·ãÂtnË¾Î¦¤%°^¹àðnÕ±„fÿ"'°0&%y½þvÄSnÎBŒ#GC÷6éîÊq§CGªHßN³Pó©ðL8Þøcš\“ÈÊPm²Ýîp63›á770™³({™Î4ø¸7mÀç­^î6ðÆ^0×Ã´¼"Çä§ïØ}äwmÁh‹œ“2ºF§PImŸ­ÐŒgê‘ôPsÆÉyëR~LÐr?I²9õJ°¼Êô¯	._üäŠšð',0?E™Ìb¦^‹„Ò~[ˆ¢n´-|UOŒ‡Á	Öot2ÍvçiKø/èƒÅ\ÄËãaÜ‹ñ¾#«]’i„y¥óô‹w(‰ÕÏÒþ¨ž—Þ;1=ïÉé›sò^=ê…ÔKdd’!ASäiÑ’ø}æú:Åùõ0Ç lf÷Ï 6Ì>¸'ÖÎ?6&ÖÒ	ëå$/„—B,+-œõ•¹Ê+F9YDE²f¶ÂB	ìl…;Ô“Í>ÓGù¶”êv ºzO‰ŽB§Á=Ar$%GŠÙÕ\Š÷Ê_V ?ŽEU£{AtB'Xñ¼N®ý±¬ÚÓCÚ8yÁ¿çªE¦“3ñg÷F„ûúñ…Ýv•=¾t‰àV‘?öUùƒ…åJ\ƒÇé®Î2Ø`Wfo‹¨T]¼÷å%Ò¶Qµ÷ IUõ½Q÷ƒ|É`=u‡Ìµ²Òf^…vC¼V]¹÷Æ?×¾Yè ˆ`èö9J3£{}Xj>3s àWyeJVþÓSVÞêM‘€,1V'P3ÌØ4GÂ ÓÐl”ßÞ
Ô¾#˜óÖ¹Ê«k)·í¶oKnÒÊ×”¬•¤7À¹(¢ÿ`‡ü­.;ïÑ¨šâ‚U­¨Ö	‹‡(7˜¯ùõÐbPNõ]å×Thpœ:Ð–Á>‡Ê,–Xð^|øÕ–4[þ»g˜ejù³»Ò“»ôIãƒb²;÷hr1r' 3ÏÜ°¿&pÔî|œ¼o{Ô,Æ={†Ò3ª©·Õu½‰ŸA{ÄÀy,àHh
ÄÆ5ì $OSN
C&_dH‚AÛôôd°‹z÷@®[±×œ!4<ÇGúŠ6¬ú›&í:=—-£¹:°'0®'Ö“Ã4íB*1 …ë!HJÐÑÆ‰ÎÉ®‡›ö´žÐenA?='ßÖ:ïy•âŸ0Ù8¤¤°…/w÷H9+ñ,ñQ©n©n§FãF4TÅë%ºZêaÏï<‘K¢ý;u`ŒV­ƒæe<ú«æUK$>Çi©!ÒàÏqÒô(*™™=”Fæi¬ 3S»¹m†D$¶ŸpÈƒ @¬j¼öA»@x"»§Ï
V§°6
o	\©‘‰»`‚ø²X^)údoê^4§'J#Cóñ	ÞŽÒÙÓi`nLÚ]W¸•Ïpj©/õçœÛçí'œÜµO 5Õ­u…{Ë<iðu^!'Áš¸·6(açŸ+¥ÁÓ ´]‚‚j[Ù™•ÖæÉí}?m±0XH+°ç”UÙ§µŽŒ‚xˆ¨Q~?úWømŠJoßvë&«qøîC²Üb&¢÷¡˜Øð®‡©âè5Kpëá…ÿHË3 ïÞû&ºh²€P
2j#ÚYyD~HÆ0kO›š°EŽ½ˆ!—E>="=†ˆyÑ/à‚/}'oÓ)ÜOŸ¢`ß¼ŠÖðØsþ'éc-ÉMï£@™%¼3<ùz^U’_’7I>Ïï£ÔÌ‰ÅEàásñ·¿Cô|â#ŒàŸßÐKÞ'/ó<†ç^À?ònñ>7É«ržÓa¾ŽJþ˜‚Tê}*¹©I±xîé(Ùþ¦¾Òe’½]ÎñÙïðorpÞçF‹ø*©à¡¯éäÜ¬nP‰;7A;kY6Ÿ¦ð*üçÎ${ú êi+†™@?w‚ü-Û‘È0Þãqƒô$É[G$Î¿D”/Ô"…ÆÑ<­¢,ý+ö{A·|Ÿ§>té=éµÄšO»ªX`Û+b~® j¬õìVï‹öÏ³pæQñ!K´*sR1)HÄ‘Šü‹Ã²Î«ý06Å5²÷$®ñÝ’°ìA%Þ'R1BÌi¢fS¤ä±sën´Nt˜f÷Oø!ÎÍ?Î£=‹f—áYØ©“|F€Ôv·€fÝSÂ^
D‰£i™0/ª±/T“t¦|…ZÒ‡›pÄr"•Y_ïT¼×³aBÕ#]Êguê#ô¼ÒbÔˆŒˆT»‚Ô)XYõÅ4eß,ê¾”Ö¤¬+-M'Ãä°S )ÌýÞ
ÜJêPW™D…Bþª²ÅwW4ù2"ß8yŽõD‡îrå-¢ÀG*w)†úM¶'‡lÙ{dŠÈ[|³ÆDP×wÏXYˆÄ!F«ô#P@"è–_Äw¤^ù%(cFÁÈ_UiÐFÜ…7	S¸xKZ‘'L"rdWg~¬ØÆÅÙbèœßïÛ»M}¨GS[Î¶f À°Ç 6!#è0œ ‘|HaüÃ)rœO§yLµ1T$§S¬QJu3O¹hylzd<‚«ÏP£õ«A…?œP×'ÊoœÔo‹vQYÑ]‚Ç!ï—–üôà™~†6÷Iè#„w4¢Dxúºý"è”!Å*¶b/6®°˜ã9Q¤‹ÙÉâL–\Eã%O`jgë·ÞÒñ’÷Ô†‚õÍ¥Â¨M$Y[|Þd¿ãùþf[}gÂÒ*)"œäüù‘3™lœÇI¨)úÑÎŽRXK,i±8áR°×”hí…Øqãìæ 5­‡ÓåïŽ[»—OWŽ{Ô*¨¬¯±²“•èµš`5$_;1‡d[“³,‡&þDƒ}-káŒDœÅ° w5ä=%¿³{Ò¶ÈyoÊ!G¯-æÐ‹‚o?Õ„&4ñ®øv_t»5¶Ýí\	ˆ»nE¥¯‹¾¦Ht9^\Cš–  sÛ~³—«ñI„Ò§ðlO=ýq{KŠrèõ_RÝ“î¦·NÛ¸ÆÄ™Åªn[šúÛ÷——IÑyŸw+˜Ýß©¿Ù~Qâ--±“f8@ÅªnÈ«ÛˆÄ ÇaÂCgÓü_<yqúâì=©+•l‘/ÒòÝeQö&/²|v2 ]…€&¡ƒ@_å£4KÈ,á(*È×<ª‘|D’EK)ôÖÔtZò'£TþôZÞíƒè\~¸e¥
$ë)ñ‘ˆõSÂ7ëˆÌ}å<8”)™‡%:"5k;nƒ
Œs"&ÃóîÒ«F%âÿC{àZR¤|
ª>xÂ¡îè&¬AÛˆ¥mSá¦£ãµUKÉ¨T×ç¢ñ?Þ#ŒÔÍ`‡bÙ\c8ó@¾Î"3ã#õÞºéz¡NÔ·ŽMXº§—Ý’xY˜ˆ.~åu¶^{¦Øxm^Ö°L³Ë£=u›µ*Hoœ|}j’e\çÖ±Ÿ,c	WcH;WMÁB*Æ­©°H‡+‡Ø¤%E€œXqòùRè¨ÍrÝ•0ˆ,M
ÚÖÿBØ[¥½è
Ýõt`ø—Ô/ƒÒPj¯‹	=I¾2‹Lq~¦ªvn¶lñStA8cýn§ÉlqŽôÉ,ŽHªF1“	—i‰è3±ˆ	µW%¯àq:ø h$ºì!;Ãªõ³ôfQHðÙ°Ì§Iln1^‚·ÍW/©*DPHŒ’«6”KäÌâÖžAÕÜÇZ†;ºàwtny”åWŽfñçÎmÎ ]c¥¿wo5Ÿ/æÎfÙS†#ìkŸÿ¨526L» ¢on`Û ýíèŸmúÓžµ†Hžöh‡€®·%AMâ°ë’Rü&** Y\l{¢^#±u|i²PXáî!u‚ZB’¾~îiY9yž®¦Ôj¾¡‡g4(
n`—½/`00ÓšŒëM•¿Ÿû:×_Ã³æö±¶v,Å"‡}Xïm4ê÷F &ŽmJ¡EñƒS¹¶ÕSá‰Å}]&ÒJ†ìeÅL'‚kËÇˆu^Ü %ÖÇ@uÙ•,ÉÚNolÎh×²X€Ø
‡Ó•/îXíÊ:øªü
Ñ’BZ¸QõÈíPmyÐW¤1pu¯}1ñä†ej÷¦°8·mÿéÙ$ùXä³çùuk§‚\-×Ì*¼ý-ùt¢kŽ‚
l‘#¼ü`÷‰k²Œkí²ÞWé6ðí[>µlðñ‡¹Ý*Í3™~²-rêû–8£jÅ.{œvÚãÃCV~ÐñTß+Ïá´ˆ/5«SºhCÏ»»ò¶\S“ôºµHE¹vs\ÂëÖ“àÚ	É®ckªàfhV“ìZBUó	ˆÌt	KâCå01·O0X¾bŸîRûˆÊ”È€º°^À; †)ìÔå ]æ­]&ôŸëdì„ÆoÇù4•+¡.R„¸î½÷uÅŠ9Ö5aß51‡UwTåƒRË‘Î—¶³šøZàòEïWH*Šc¤§Œ‡$ê­ôRuyÙÐ—9/_Ñny‘šo.ÔZßGÈZ!¯€ÆØê1¾âOÆ7æ=Ýkæƒ³.½bªÚ
3_óÁ{„ê¿÷c ¡	 ®ö×ð]ú{.;¾2Ýû½gÛ÷òè{£ÅæW]T4ï]å´‚Æ'\Wëh}ÅÁ<¾ì}}L¯hõ¡m”½ÑìÇù¸ðzÊ»Ç‡ƒûî>±õHCT_µ^OùÏN•zÛˆìð¾!¸¢…
í‡= 
Ð6oñ]ƒx«iXŽˆ5ƒòÕ†õs¼uFC¤2žpJÑºœÝ2òÀTÃ1Q
§Ò5B³SX
¹ƒ…Ýe w44NÉÚg²/d-d.œ³ïCs$ÄØ’a¬Á8†û÷j=ÞéUFÑ«ø}5MAeÿ‹„Ç+`;´mSÞÂÔ™¼`×3ý¾$C‡bË›m­k‰5‘^Í|ÃöÌó¬¯‡þÎïÚ®,‚u­z£4Ëhê#KÆÄ”8v…|I‘8i±©1¦<žIœVgQ“»6›ÍÁËÐ²*¢µçi•Èõ06xÍ²nTG8öÖ\å VXD£,(‡<×YƒX•ÔÕZ:Y‚™“u;èYËà&ä-ý­nêez™|½È—ŽÖâäc’å°ŠƒÉb$¿°¸N¾£×Yƒo±Ù,ÊÒLµ&Ô4ˆ.=Âžº=zÑÞ*ù¢ªe¯¦±—ùù~!½h~_[Çé{«meg›Sw©áŠä>^–MZ›+—pÄ í^Òìš’Wê®ð¯nÏïdË7Oìgcod0¯-~ý¦wÍ¸zsBj¨†í°×Ÿ­õ¿	‘Ü «¿kþ”y2úÄìüúÜv±¬µu1ÌP,”25èÂžë‹(Óü­j§ZÜ‘„ÑŽ.ÇÙ˜T!5¸H¦OgÈÏ³Ú‘b¨E-òûjg†CyŸÀÛÔ˜}©”xºMÃÙÌ±q¯@!g@4^ÓÈ¯OQB±±J"ƒaˆ×ƒ&6æFÔ
kØœ1~Ñ÷&Ç6b¹¼Ý=ŒZ›cTÝ|4Ø}D¿pÛ:ûè·"åð¹lðxîEöe6[=+Íìá¼<_Î¢i:&ß%fÈ’½'xSGÙCrÐ
qKZø£÷%$µ':öä46ƒ"¡z@Ï|2Œ_0u8@_o'¬š,‚3ô]4-
¬sý6¿ºÊsçÑ§ºäÇ¿×žÇ1¨3àÓÌPcP;…Ô­ïÍm`õ$eŒgý 2(>‹$Ló^ÖçÊÂyMåX¿cL'T´¢"¶B	E™›¶ ÞÈÃ»ö’­jå[Ûº]aÑ­MÉÒ¬‰¤öã,½L“˜¼Î Ó1K’<cíhÍR¿ÕT*Ð*¹›èRî¾ÔÙºhRÃ¡D*…ö[Ý[Ò’ŸŒÍÑÿ@*uD²Šœ#L+oGN1	¤}·Ñ¶À¨þëÐŽûÇu·o ºìéìt>WºgÁŒ3\Ž/fÃxì¦Ã‰¯FuÞ­¾;<$ƒ·ý³–lwÚ&6'^{øGJÒÃÔ«Ü²þ8ˆï`¾ÈµíL3ÃëÞ+sÃ°m2›ÕÎh"©Í.`wª4Bc‡És8ÍbŒioO*"µvm%Ÿ†!`ê Ð K…maž¦`Å­Õ:ªÉˆEAP™Ç{Œ¾zÔì2ßÅ]nï 9s~¼#aÑœ”A]&G‚2@&“/_‚˜¡_+³”^ Æ¥õ½¾2‡98léý…õ¼]—7@JÛ7K2n@›°£Ãóéæ>ŠßAÌíVkœ8Á€ÌØ17e}»êZL§ÅÆ‰B”p?¬¡-ÙÔ=]&–ÂáóOLàù­n}¥ØÇ°![ýöçEòÅ©52µþ-‡³-‚¬íˆBƒÚéÇ[hWýÀÔÒP¸k”ðÜ>%ŸC…ÖæÀñºçÎëþðùOB&?hêß½÷ÌgàlªV£ ÙtÏåY–DYæ^n¤{`~â1÷Máe‰¢'/7;¯ðÔÁl±±M­ùb&MwÓÜ· ®U,BÑŽiúØWÜ¦N,OIÔ”ê\¸Ù¨……·ÿDAA¤“of´@ø›E9aR#:›á¦n†F2Ä‹ü”_x€BâÜj
/’¿,’²zmœë`úæö_—ïU!~W	!
Æ+Je´ZåÊß«„÷>â«rAÃ)T¹íÓí,ÝwÚ|tá‘diY96qè‰Y5ŒÌ7—söÕr&vNä(ÇYÈJÉ<s‡dêØåà‘½®Œ ™‰1ç³Q~c(¶@¦7ìEüõƒ!óÈ0A 9(•™"Ù/“ DSÓÅ‘šT#¬(|ûCeªb`%‰`;E5ÓÈàxNŠ„\OTìR˜Î’2/÷pËLXÛµ¢z b‰L¸^À0=yÚô¡®B¹YoÀnÇ B6æ*Ú?/š!7ãñEù…b¨ÊWRzM@k¬ú³·Ó>¿Ü‚X °RÇÐfÒI8	ÿ¶xðî&±Þx¶–ô%9O•¶EÖÄ2÷ê*R½ML•m¾bžl—°^§Šìms¯ÓÊ®öÁö/*£9;YÑäÈ‘ì¬ºše§L¾€³9Te>¶#Ln»	hé×’=PR±ÉŠV˜Ñ\@Æ‚ë´W&Ó”	y0	‚¹˜F™>KX´-ÙŒ8õÄR9½î­vX³=$®m–\cØN¢n¢1¬ÈÝ§Õæ°Ê_æX ë-œ>ÒÙËR‚Ê ø–`sÓ~.YÅ •°Ë~Ü¶]ß¤Ù„ïš¥ÊÑ%NÿŒ¿:üžNÑ„Èît-€•™eåƒëFUøMís…Û½y¼Q€w‡G"©(Ó´4:ü×(‰µ7?³Ê•Ó£tFåÞ½™Ä¬þ¡V­0.%¢¡zw‡Ù'õºM²³kE³u£ÊèvFGa´§é” b||ìd(Á@<Î'y•ÿøÃKÂt§¾5×ÎrZNb@ôŒŽ´–[J½<œzj›+²²¢ãöè^ßg(N1¦6Û>Ù¸“;¤žä¨œŒr?¤µÂUõæVÏ ‹ÅÝ=ÍÊ‹û_ž¬Çp<Ê+alƒÔ¹Qa€†éßE~Mé¹£?ºîÁÈÃ&»ÆZpÐý{ÿ&«±¬,’Šå 	†Lùæ&/¨Cïy³v&¨ü¬Ÿrïf}(*RæH Én`øp)ëv‡‡
>ïÆÉs„ÅŠ"Þs6NÈ—#N¹~9™õ–Å¬dÚ ¾Lä!ˆ±Å:ÕglK3‡ÌôH9¥ìŽ›ÃZ`„“Í†En¨üHO>œ	kË#3ªE«Ë,‚Qµ]l®{†¿Ä½ÁmN¬·]têèfW°‹²aºBÿ9¾Ýšøw|Kÿ¹#Àßè?wMI^Q»þ¼#¸™Ž­,zqÿv93ú1IÃÃú4Û§}®Ê#àtÚ÷þû(/³8ÓÅ
›’P \I…÷)™?qO‚¶´ &ru°ûtÎ÷$ëv½ÛJ-(ªWzqEÍ`¥ìþµášíÕQ—bßŒÌ€\b4ÌÀ÷ôZª,00¼L‰BhÍÀVúÔ³À{jeÊ} Íù˜£ÈKçh¹Ë2jtv;õAHô Ý×ßö›?tÐ‡o©g•©â
´]‹+íš¼AxËÖW°…Ž_×P|×ÔzëS`•ÊÙì··Jƒð)p{…÷Âyªý1šDÜ,bazíËA¦ý½¤DÅÀ¢	š3ÞTµ	¦AìDE6¡@ðœ<É-"ˆÔügCü†-"ã¬’Y4«ž9:¸,ÐçDÀãé|î©ùÂGl²ŽS7Ò6³¢hçí¶¨eà4ÆÐrÛÓ¸6¤ŸÆðÀ$Aûy&,ÔqZ€ª”a*#žäð*<Ì]sE4‡}Ÿ_^ÒÐÆË´(+Qt_zpÍÑ“Çìò~'@ÀúÜàôÓ|Ea9<Ö›¶§¯Þ¡MF¡49ét‡àîN`ŒËdËC![JnBe7«¦xÍºá´{ÖJì‚?%#¤c÷¢ycÜëj7ªd«¶¶å9CBÈÉã„iÇI˜!2ÂÉKQäuÙ¯Q¶¨/ú·0Ñ/wôSÌe²agNM¾uÓ­ÀfU®çr vâj^ÎSx´œS¢Mv°»k•ò³Û¯Q¥¤ÛO9Å\…ÂåÇN±Wâp—=(Òg-d*ùƒ‚é4Ä}Ø‰–»’h‚ôú!ë`1Ã)NR:äa;”£Ì’ëžÝö^Ð{é”)•H˜Çr¼v¸÷’Ð$9]·ñ„|K†[Oûn"ø70qDæëÃIe	Ûíâ/‹¨XmOÓ  â¬Âdfqæu”9Å'¥XsÕrc2®‡¼o“‡°1ZMø\LÌgÁÅ8:Ó'=iç‹bžÕ›š«³kÙ×{·R¿—ïSÝ ±Æµ›×É5yôqoauí’jcžû¥…ÕŸcÿ„Š+ï©ƒßÂþùumŸß¬R%Çs~v
Ö÷WyíƒºÝ94j¬‡•‹c. ãês\ý+`ËtÎŽ‡_ã ïÏA ù…)\T´böâŸ‰Ì¿‰ÓJx??©‡{v‘GÂzüÔ›¬©¼-Õá>4”á¾÷“j|ÿFwØ[ 4-ýÑèý»ëfžåEB…¢ÏãyŠþ®(úšÅQq®R}RÁhù =E?¯PDá‘¯Fx@ÐÓšÂœ4ÖclõˆlÅÝjÌfÀUób.Õ|y·3ÜÙO¸_z|Ä¼<dÍµnˆål’ÀÖPa£aïÀ­èHGþá|VÑ`ž‰‘‚ÂšOçfú÷èñf1®ìÙ*öð°ðÀ&¦LM É`—~÷€±‹]Î/vµÃm/‰p‘5B'ùNAÏZ'-¸óƒyæƒ‡ŸÒÄƒÆ%:¹ó5˜2ái¥H.Cñ&
ZoÌò¸äö9:¼/áÖqšP;(#'Œ:žh	Õž®í2Ç
È*boÎ!²NÜB»Mi×šwÔŒ$»òœÉFÕ¢ØL·Äi9Ï¢&ÐíeNG5¹Íì¹S°­qo6${YryžV™jµÀWÃ«½;r:¦8÷«¾\ªˆùÇ@v[àâ‹/ûjfE'²õ 61NŽ|\Š@ð'<€2}Ê4‰sÿiU%Èô%hšG¤Æ¨»¬ 'ÚÎ€YòzÛ”Â^ç" ÷¼#Vuú;_E.¶|3Òì®dbË¢hßí2L4”^èÆeÌ«MGHhã¦‰øqM¤àOý5ÿæVß×¤·«È,‡BâàA­,¼UEŸ¸’ròš`Ú–ÎÌO
ºìD$™8ª¢’ûd@&ºkñ¶µ»×,øØì&/Kª¤Nüá¢ÍiQä×|g"äP}ìºl—Ì©6$Ïú³|ÜI>æÔU[*æö?‘‹ñ$‰Y3­µäŠ­ûu©Û-(EŸ ØwS:†m3R·ì–Lêm<°Ak­3kQòÔÃ¥<ò´å?o¦ HMû˜™Påq´¤IU>Íqã¸¥MŸõÈkŒU«úHr¨î.CI£î$IÏ‘aE0[0Ð†U=ayLhúmÕ¯Q16·Ho	ŸÁ«Wƒ8öÅˆÆ¦MSQ?–¥ÒänÇfC:-aË6AxJîçc4D`9êœdog°rmz¿áÐÂ¢ú`œ° bu¼¨Œ/“ú@lJÎ1æ”W¾ÎY"k3+Òv¡°Ý¯c…hSÇÙ~cZn‡¯ÀIã›M?~(é³Ú8ñÍ]‹?®„'0§¸+I½´Jo«žµtu>Z¯ÞÉœÖ¥õvAÀ`õgƒB…(8!Bš÷ÉMºÜ†¹wu•ðpjÒ7°R gw§c(€ÄW£ìÆÁ§ŸÍ»ÐY†Ï­u¨½·ß??ý÷aáí÷¯œ–ù„ØTß¬£!v$b¶L©Ç±,´*Öö¯˜"éÉbŽU½åÈY^P(ëaÙ¡³blIuÛžQ%Æ­×Û§wäÿüÇÿç¨¸}U:NAL­ÊgÃØ]UâÍÀÐÿ@,wÕ5åé}wäMtÓá%ÃW½ÃÖäZ!ÔQ_NŸh8Ì˜)hF1jB×-Ì°š<y+%jéUžß~}ÚëB6ø–Á	–TKˆ»ÖŒ˜%Œ+píBnsƒÞm:°ËV5 |"mj‚xù–ÓÔíÙ\³Âå”²?•õ:K	9EÙØ‰O‘òÄE­[mqL$¢êè³ÃxÄ Ý„è‚P5ÜD°$ÅÜ¾;ØÙ"á‡[ä+ø÷üûþ=Ä¿áOÙoñ÷C^îq’g€Ü)Éœ-‰­J‚°+¢Ù~âiæ"&QÖþgRVK¹%“)åˆüô»ÛÉÝï"w~Ãaö„ [ìnï¹‘!àÏ½`1°I‹ÆÒÁµo_­R'®ja.ü2¡m3­u–_Ñœün:Xp.>x§ÁÏàWáŒÄ²Z|¤µ%|ð9%8K‰ºye¨¸¥†Zÿ%šÚÅOþe|ëódì¹uøIëõÏ"&ÆÍ™\V¶%tÄ{J¼Éç‹,*ü¦6›9é@¶±º2CÄ–Y:NúÀm÷7ƒÅËA<ÖÅb:.žrUëUmPIñð
žMŠå³á»÷F,I¡é²x¨¶Û!•c&‚ÎUË‚tˆà¸ô3´M£q<S6¸øDþ$½‹ÓâxTC¨Ø¼PG£†€ß?ÆÎéWÏ½§MØÍ‚|g¦â^€JTzT=g†²í`SHcE¡ñÔžëŸ®î1k¶L'×™ÃL¯àë2XUá2 â©®4Ä ó’êLC_rjòkY„ ¾“°\Ýˆ¯í2‰Ø„€}A-áax~Aõcèi+ÑŸW§
Âý­6j~ZÀ›åö°:|2×
	WÕ²½h5±UU­Ý9|eÍÞ–jï8 7kYNŒ)9°Ùafó'3sx™ÎâþùÞb¸à¥Úä¸Ù.ûqöa†EÅ#/âÚðƒ‹c·ùõÛÖ€YÍy_ùÉ«_•ÃP¯@ÛÖ"T2Y—³Ôú4ñZóÌ²âZì•ókc™¶Ðí.œXd†Xï©Õ†„Äª1¯gì7áÕ«p™ª¡€W8·R9bèA ºÊ´kówû>%‡ùVÿ¶Ý÷<Áøq'ûf»÷,çCÜ^_°=q>ç¥Í²Æ¸k.µŸ* åy1Å:XüÏö]Šxr|«|5Ì[+°É›¬?·ÝùØ¬Í`äK¬H„N‹­}·éGh¿u†ŠG)Ú­õ×îÄÝ5¡ûØÎÚO¨^¿7KeÇ‚G°¡£ìm4:ÆRé——éxÃˆc0ÇÒ¬éÓ2®çNËÙ,É: ¿ì¤°á®cNZ”t•çWY2%(u¯€ù¯‡¦®¢ƒuÌÝ»^ÃE{[„Îªåœ}Ër^Bˆ~Á2âeï}S´¨™ÒÏhÚÈÓWI‰)k†ørÇò>ŠJ"Où›2øµ™úÍƒA¦ Rê±1d¤µo¥ŸI§š¥:€þ¸<@vÈ¾Å/Oó7€'Ù_äÈôTýÖí[ï~?&Å1Ü¶®ó‹ì¾8þ~Vï<¶²WY>Š2úK{§u}k*õ¡ð¹½ù[1°ïçø¸qê{î?u–üçÃCžr3{õ)I´"ºIû–NÇˆŒãªŽ©¢â˜ñ£÷}‘^¥Àìå§µkÆçÎKþësàxi†uÞè³†ëfù±,Ó«™Ü«rÅÒ'»Gê¬¹`“€ßpÆÂd¦— 	X¹Ø~’••åCa%'ŽoÝ2}ýr†‹í'AûúvZâÏuÉÒÄtZ»t©Ö¯÷c²)U9ŸãncÚ_•ö	–Ï.Ä|˜q>
”X%éÛzgwôb0eÌòsšÝ364ÁÆ°ß*¥SîIVM¡ÊÏç•êR¼òýÞ$ð‰ñþÅÞï-Òz^o”fì‡ÏéõÌI0“½–Ys?¼BXc Û8ùš½2ù’\,Få¸H©œót{²gè¶mLUK8ˆrÈZ=2iGË4Ì³¨¢X×yñÎ"©Ò¤Ø"|îILÏér‹&H°"YäUd¬Ó`òbµŠàLSº*°æÃYTÄ¥!»Æ›(d¨cò9ßÏõÿHrö×Yá>="@vØ¼æ´ÇÕ«b±SHxõížÌÆ¦Sa"V:ó›Á-bVÏë4¶::n_EÕd8Mg}˜å-B¿ÑÇX@ß°Mà-ŒÂbjFgÌ¿Î*©^'Å¼sSªQLkøÂá†Šww k˜”	»-Êh3‡+53Z”éÚá#Á6¾¢ŸÍMòOxþÅ0Þ»ßÈb‹3¢cý2#/pq [&œ¼wÚÈ®ì™UÛäö^K×ÛÝé­eñz‡«5¤,Œ†¶Òûq–¥SØÅqws­ÑÃ¤ó‰ëvyÔ‰^kO$
ô[ÊÞÖŽÒ¨æÐ‰ÌºÈ°^ê0Bà"Õ„F>ìYyÏb@¥ÙëÎ}8Ÿôóé<3É–RÔÎÎ(šŽóH…\×Uç®â×Eò÷§ù½_ÛA¥­Æ/tV­ï°ZÇiµ·µc8¯FÞö9Y|·î|â3ë·»‰N®u\Ï“I†u¥±¤Ýj=gW2MŠ(‹Åñ%¾ZO°ÝÆ˜¼{°µw°·Å-ˆ„Y$óô9ð›fz×Àrz»Ã½ß÷VÜaÆ‹]Í"ü¸…:‘KäKò&Z¢‰|—–UJƒ	ñ$lÅŒ&‚]†ôqÎÒÊÓð%%¬‹Å835Ú9{©§™ä´	r¦aø°’µØCZTµ¿ñCRiòMzŒÚ“q4@²$¾JŠáp¸á /t³/kø·b7’B]Ñà¶Lz{,>‚~ïô’¾‹mÞœ@½]²Sk¦sã.°ü´¢•©Û,­É–n§WZe^Öä$Qk&ßMà´ëIb¾Åö¡~²*<Ys gÉñ¬˜k€A­X ùcžŽÂ ížnW“U[fs‡¹O;§SÄj¼OÌó»z¤ÉžgFÜ|æm~w¬>Dã"ªQ/åÑ Á£;dIøœÜÉµLxåkª‚ÕøAkážV@Øyv‡Êñíá6;
B&f¼ÎIÊû…M ‡Å^:>qÏCŠÕFMóÑ ­|ßªà¹h³Ã4Vs¿”š¬4|›ÕyÓ”ª¸5”Fì’Ì,G¡Ÿ‹ÎÄý:ÁŽ·Ìg·™è£ÖÑ‰ö6ë·‰èžÝEÓê^½…¤Åib.…\¿óÍ7¯ŸŸ¿þ¶ÇAc"ä^5ø?ûVðÇ/Ìr>¨Þý¯ßœž?½³bŸœmÀßëìY•”U=emýAâHkàG»ñ'#³»îA³2—ö'¨¼ý…·Ÿžç×³Œ!%FWpˆÉõ;Áƒ@ŽûÉWø‚~ä—‚5iÕüm¥•Ô²„$ÇÉþì0)®ù„,:ÏŒoß%9Ji&¤		!ïâ §Ç¬UXÜ¦Òâz²“lÒ,ÕÅŠtŒtdóÀÛƒ+ÌjÔí;³…–¤1hÆÂX¶EfÐ\¸`È›,šÁUÐÆxùw_Á7IÇh¾œ“*G—7`0t_‚tP$¨s_Ñ˜—;3èïX1±Õ½¿‘®¶†ðUkÈóxß§çäj3L(iÖ#s 6ÎÕ½Í¯´zÞmwMQ0Ä{Sˆ)2gJ¢÷Õ©ˆm—IÓõ7õ5ÃÌËË1ë|Kô}úærÍ^½v˜5|8\ÊüÃ•3’-¦å‹J$Ç«gme–ó,­ú½AoóÝÎ{ÕJÏCèXŸ²ˆÚ9JéÖK…;Öº£ B0žÙž!.œKA¢AZàÖÕ:åD¿kfº©5¿§eàîÔ.Ä¹¯™WìBzuÏzgeƒvæyÛÔS=°ˆŒ§b€§ù*8IR$`î66ðLSôÈ# ˆ·ÂmçÔáœ€®ƒÅƒe X{‘Fm6»Í{K%#%KÉEUÇ| ‡tO!_ºOÅ‡ÉÁ½Bî8ØŽ„2Â;³m[$'‹H:Uí$ÛdŠnìÚ®=9p©án~aÔÇµ19òl7ÄF€ä§%
ñq³]ëR¨Q¹œI<0ôeŠvÿJI¿å×ú´\„ÃýB4àG¾å&ÏoŠ"/Žë„œ?'³¼âæ</?9Üw¹íªXúGz¥?ÏÇýÿ7ÂL7:bêwÞ‚ÃÏÆ#~Ü W@»‚3¼*	¹ó¾W&þßÿø/ÿ™r#Øð@Z1=ëA…¨wå?yšºÃ¬°ñ„ô“æ7š-ýK‚4gÉ0Á5ÁçGË‘e\ ÔÊæ`ƒü@Ã)SÑUâ®ã×;×@n7šj
’Š´Ö~Òt8ÖåƒÝ3‘
²m]¢[å9¨
ìì$«Ø[µ‰™jÆªWChZ°Å¥:N7§ÉQ9•(I3¾‚‡ÒO,½I&ìŸ\Ú™[Gtpo#õÝ^é>0ÒK·¢äaÚóÏ)Hþ9)%,ù	Å´Z~MGØšWBQXJ’œô¨¥@Zîm’é‚­gÆùbžÏhvý£}G>C½å‡Ývx†ÚÏÃëtÂâP¤®AÚÏ#ãÉ×âI÷Ìÿ¡Ü Î§Q:ûœÈäSçRœ1Õõ9}qòÙÜ·Þ\
Ú*K¥À"åãe¯$l¦©æ'+þV&ÅGZlnû¢¤—//1å‰zc—dTˆ'ñë2æ‹Š¦[ ÄFñ‘’Inà½Rè!	Ï»XgÔ ŸÅóÙ‡°køùÝÿ÷rÚÛŠrúpž0÷6QM™¾n­UmŸ`=§Åœ¨Tüã/-B[Ä€ÙRÔ¬è‹4ÉbûŠšVÆ_;ÄYa¬º@ñ;V˜Cÿ¯ô*}V×éjSÅ´= ÙvI/Xñß™R¸q2©ªyy´½€{šÒ-ãVør·á¤ßq2$ìŽÌ‡±,Àènàc”-®Q²¸±ãC±t6
àEI8ë’Ú0\ý›%×¼c’«—jH‡ãS<«o^$±Wúï3Ð†Ã!þ-,•¬“#©¿;oí¿ú”÷lØãÕj¸;MµRS6Ø}/(ÜL
BÚeorT Ú“¿pÆ±½g¨Ž7Á™’¥³„œs¼’ÃŸâ³`0	z½¶ƒ%úþö…Î†õØÂ¬>;¬Ù6ù.…˜$ä ü$šëÃ&-ÿàŽŒÕd(ÀÎb¦	ý‡!ÌíyüëcøD¯ç<ëDì†¶y™TãI¿·ÍÓm6åÛQu+`ò§I5ÉÑÕñæû‹·=ñŒ±ù@ï¶¼Ì QizÐD„ðnL&ßþ×2ÇôNá­ó"ý+^]òë$*ô³Ò	»ûÉæ‘?èí;"ÿrñýëaYáM/—ý[.ŠÀ¾ä#Š0š†‰æB(š-5Ðà¨êåÂpbü›¨Þ¾AÐbÓ¯Ûff Z#åE”fÌ4À'gÃ]‚}Ö³u:àüS¨2žö|Uß‡¤8ÒDÇ’]fúC+‰%s–ñ…]ÉF¿Omï;"Y”ÑÇD¨TÐêezåå¬k0ø!ìæv›ÁåS»“‘Ïƒ‰Œ'¶éxÛÏm— zxFgŽG±¯Ñ
öÿ  ÿÿì}ëvG’æÿ~Š4×k‚c¼K2[$‡¦d™3¢¤¥éÞ•5V(Õ* ÐU‘4‡çÌìý·¿öìSìóÌì+lDdfUÖ%o HÑ²êt[P—¬ÌÈ¸ÇêZï–æJ(Ä
˜ÁÙäT,r}Ùã^Ò÷+a¥î;¼âV7j¾Wñš=lMÀò€ö¸aËô}íLÉÂhYÁŽŠÎ„LaO^œ`®N‚ÙLÁßÐÂ¦2úÛèè`´ÂúZ5„fëµ„ýdºv%¾’Äª±½ºkñPœ$ÐÕ ˆžJ°‹`ôf>~œ&Ÿ(¥¬ó,y’ãj™á3z éÇËì0N&ý³dö2{šo¸½¹Ì@ëè.™°‰«:}¸{¸Lª&£¤øÓx=”8ƒ[!ŒP=‰\±Yn#Ÿ|Ý˜ÓÎ‡dI"7¥\£&gO¸6Ýáç†¾J4ÛÈ˜±7	ÜíèûW´og»ã›7Ïg»sBº%·ÍšFî‘H^@YÏƒ,<s¤ù\`:/ŽŸÎž*ÕE¨]\\Ì~ß¢›|iþgÔ¢ðà^=ÌÝO¤¾­ôG—]sy(¥7€4z³gwóé¶êÏ‡Sþq=•Gf«-§Ô°@2îá¼Ò„m;çöéø€½&ãVHùo>èÂÿ6Öáó¤ßM,¥í¬³ŸAiXúJÃ³rSö²%Ùh9Ø´éç˜‰:ß'T«Q”ç#ØQòƒAÅvU§[š6ËL}€ÂØÚ‘w—jWÏü‚#Î}JÚîP¶šRˆ­hR¬V–{õ/1k‘<œu2ÀøÑ!†-«#z z`ÌÏ·ù“}òµeõeiT!ÎØÉÉsv¦97ÒÂÌÞ·Dó¼VûV	/ìý”†`ƒ …°’†£ðs˜ž‡ùbÆžŽzéÕ8§Áˆ<w,åà¨|dùKw˜¹ÁºÙ&7þhqØ{»ë'zÓëeó	ÿÏ«8D»‚“#ÁÉÿH[þ,J³Üê«²ûM^ {ÌáŽœç:×ùÕuÎ¹¢ðžïóv¿½GèÄxûúè0Ž“Œ@É³¯.ÌÍ»Ï]õ ;xÇÍî9Ëêñ×îOãƒF
Ä»4+Qèœ,úá:è±,¦â3E±ÃU«¬Ûíþ2zRÊnWí`¡Æe/ÿù:·âc§É88G7k×žQÆ@õ·=VQ¸ÈÇ:2ŠV•ÃdWaŽî³(cÃ(“þ/£ãàco—’]õèœ„Œ,(Î¯pDyÂÚ¬{F©i«z8ž+I£”KCUá¸24Î¡†Ám\u? ^M µišãª](=«'ë™–&§±?Œá¤lqrÑŠçL•j?‡ñv;'°s†ÀÓ `s¨\›?’‘.‘Å+Ó(«g™M›i„ów¥½¸–nD•“ºt#B–ÇLöõ×çéæ›)ÊŒV•AS¦ú°)ežk¥OˆVÖÆ¯×ŸìB©në…½u¯²ÙØ³›.Ã¾˜¡pqKüyly,)‰B#*<ácìa÷‡;ºÁ¿ÔÙ˜ç‚¼>E(9qMP¢ 9XÄ¥No×å¿ð™ßœçÌôû`€A%bk,9£,ººBbû5¶E 1›œ®ÒñÝoÑîµÄ¿øeßšç²ÿ…Ì*0ƒ.°Íõ$'¼ÔôðM(­ºÐfEÂ?èáI6¡?rPb3¶ýŸÿñ?×·ñúliÊu™RË±~é™Ùß—H„+ƒÉé)³¿„`Äîß±“`Ô?M.ç›Ú_F¤1écx•-ð¼Bx9Ž’àõÓ“7XD„è/¤É(úM„¬E¾üÁ6ÀÕ°i‡€éÙO¡œ‚†‘Uó;ú*Üjr½ÝÁéÔÎyFL=Z\ºC0aá±Qg:õÕÍ%»ÁæŠ‡ÃkË7«€8<‡¸²ªCWnÖñý6º‹@ Í‹ú{T½ÂÜàŠ£èãÞÑÙm:?ëŒƒ•LNã¨‡$®sòënªµŽScÁ9Bèa>ÓÂ¶¦z ÑÁ¯Ò£tãh#9³]g¯%P
	g¥ d_Ž@ êO…Æañýöº%©›ÝÅö±I÷~dE/ì¬-³õt"H«aò+÷Aþõo>@5Z*>yõµ´™"
€qF‰ÞP«Ê­§Ä×LS%:©£>°a/º¯¡<}Z#nc$i·GãÓ$HûÝ‹xÓqçVÈì´«g›ª; ¤%ë%ã(ì›=n¦lÌª_m«
\Á«Ú¬·g®è°Òá¦OÎlàªèÆfˆ&ã+-]˜³+õú¦!BJ€¾a/óß“#ýÜüq7½ 2'™‰-˜ÑÛÍ²7¶š;QÜ•B+¦õwJ›€_¸[q…¦ÅPõóy¹ígg±¢ò!f»¬cEß†êžÆäÆùñ
Ð4¯KØ§ùç7ÇÏ©8V\ed¦
ckl*Œ»äÓØ-ÿ³O!_ÅC<Å·Æ'øíÇ‹_Ã’ÍÎ¸â°¢Þ©¿Sâ'×¦­ˆuv‚ˆ‹g‚³0¾2exÒV3¼V+QÆÒæBYLñü–$Ctoü°ý;ýu9Îµ¢ÑBÊÄø$ç˜;èúØaämE
QJÑãSJ
G`Hbô]"(ð|øýSÈO ºê>ùéúØã0×[°¼ØAL<_¥Œm.Xª¶1"ÞV˜PWMzRˆÃÉ:¯Òjœ.‘WK¨îux–†ÙàðBƒqÊ^'q,õ&]dNOa³7 (ñDÏv4ÊÆ`"Á¢î7öÓBï“Ñy$žð<9/ŸÑÐô£<‚E8~°ÃIÃøÑ‹ñô2Žãpö¦£>MG9¨@Û¥jíÆ¦H@”žµXA{ljZUâçw{¤I5ôînÁÆ§Åþ*+8Ìiñ1™,~3³© æ5cé¨O;ÄùY˜" Š»Fzm%àQAŠ\]ß¦äÛîv-ý–;Çözo_?Ÿ¦åŽ.:nhMâQhWÎ«Š æ±â–,ç}xŠ&ÙÑèß½|sPìí×-ý	;2èƒ#ã4l'ulXDAÕ³\«–’#Z/²'ÅàÈÐ(I‡ÌøŸ®?`™7£¤7é€_ÝmÍWwd‰îŸ°Šg‡}{]GZÂ@ÞÍŸ~–lðFG “þV€¡î°É(úû¯á§ü×~x´þ'åe‘ø«—ˆkqÄ`ÂÒ[†pþÊcæÌcdëIüÆýíÇ`¤‹}«ÞÒËÊe~üo/_=û’ØŒœåI^–ÆJÖ~‡|F]#£`Û’á¬îÈ<…áG}Rwª—Å×ˆªX¼ìŸNò4BfR95£/WÄCî¯X¿ôEO2òŒðšàûŠÆôç`t%Œe†ãÄèÝë¦%ÝèÞæ9hÀÃˆ>Á]“ôêM{Œªû‘Ù1e(5”jÏ·åY™÷è-Sêâ|^.ëÂþ$ïÓë‰NÉÇE~Ù+LøklpØ„Ï(ó…ãŸ†}qÝîµî—&×3_¦sA¬^]û®õº£Lüú„°^ŽÃ]Ûò}ëõYÔ§V¾Ñ<“Ÿ£<¬ü¢y(Žý8|•‚äÉŒÎ@!Ø½nù²y%GMCáYÒ»×-_êžùýañr-_6¯â˜žTüÙ‚TÚàf­®qÊj4Š0yûìí.ô‚8õƒ7‡	Îu¶Ý˜†„Ïz6c±_ó¡¹ÎÿŒjC2¹gñŠÆ$ÙîÝÌƒ€ãm™‡Ï7¨jà¨äLÕS"7\XÞKÞ*m?ç?þ{àí÷')K€ç‡ý(xì*L¯v¯ëßÜ O{£r‹Y'ç4NÎïÕ¦ø$	¡©›÷’áPâç …”ŸZ ‡ùl^„Æ
¿ã¤Ä 8ÄG~ÕöœÑÏ$ŽúÕkyL åpý&³ ÎÂ¦÷~¶½D÷,›X\šŒ“,ˆK"—& „RÝ§A~/ÞyGV¢Ìñ?V‚>&%—Ÿ³	:žª§œ‡˜N|æ…œxÊ{ŒBã4õß½WšÄ—ó»tŸæ¥~‡ÐËj…ÿ´e< 9¾å§È¿ÚÎJF\·ÂªÚ~ÓvE15Ï@LîÑ’w¯‹?[N¿pSSùÐrêYqÞ™þ¤L†ƒq!¹Z\|le‡?EqŽïÝæ6h3ßúcû°ñÏE¶ã~qI¬x½üäuAÜô|üÓëâr'àõò“æè1:‹Fa¿ùã¼ÙEÑWpAî•Þ¦Ï#Ž„tª	wž&3\8”³¡¶w™ÆïÈ3Ø{IÊ/ÂçôHg,M×/LRO`£üjeÛV ©Ç®ÀÀëƒf¤Éç4êbš~ƒù› d]«>Ðéƒ•u|/øO}uõµ@sC9À¤‚êhÁ`Ý*BÈl'Ø7/Eƒ`³ï0fíe&ÊcÝ
N°ŒyåMàz¤ØV²/kDÆa:Œ¨U%¯q
ƒÞ€ä"%1Þ&ˆ#ER„¼%*þˆÐšLÛ0T9Á´‹ìt‡- ”Š²œ”2PŠ¬×QÌª²e¿¨x‡58†ýBj…‹@Û³Rª,Q(b‡Ù&ÅŸ°˜DÐD@Ã…—ÞþD¸×ÑP1âJÜ`¤ùˆ´R—ng¼RôžíñåvƒŸ"Ð°{Q3îÂ|›&ˆ¯ò¨ç8ŠC0²&#xúŽ…Ã ŠË©°Þâ½å+¸;QŸÕ‰­²W|¦=)[1¼ˆûÇ4
Ï0fçEÚãI:ŽÉÁ?*.¾¹-Úãqž¢g.è ±M°u k®ážÜ²X|¹~Û„ÜÎa_`V¸]Ë=hH”A:Br,äÛõh±ÀÞø„/QVŸß+š~“Ÿž´zO>-,^/R&“pÃ‹ŽOãIIÅôA¡aú|[|2‰½Ñ›b?Î¨g9Ã¤J?êëÁ®å…OßíÚ'ñÇ‚ä{Á88â(\Œ•¿îÊ)°Ž>ëÙ€Ò›Ý®?èî×É!€ŒHRPßïý
sx2'eo¦\š§SP²!kTùjËçÛ¢e‹`GP6æ•›ÈŽW‘}zðbxpF=Ú%U¢Œ‚êN·xbò±àˆßáFòÖwŠŒyÄÂQU	>!íÊŽõQ6ˆaàs eÃï¢ízºÌ"rÕš•j¬ËúuøFq¸ÙPikTMÝ/3Î*Ÿ­¦X£`ì ²:E9ZËºNp–›SÓì¦õL­ì ôÆÑô¸…e–vi§ÚZdW“v‘!Tmç‡0”‡FÛ¹r³]9ÕÞ1Z=j¥¿d'ÅFÅ…WÚÐäµz˜Q=éú•ZDNp¨­B¦EÖr©ë
–Bœ\:EÒ4¹xM¸íÿŽëj©aªœëH.÷ªB3ðU2øU`ëmð½½â²,{×i%ïn¬6 ]Þ#ú#L>2õ€‡*sÕñ2»±ÕÊP>†W»×ãèÆS¢ }Ó;ŠÜy§.rPpè·úª¤\S¹»@îq&<š®±ë†ö`?KN\Âé†Ö“ôÏòkB./J°n˜6‹Ng×äÔå+|4:KÚ`ª<Ði]]z´”é¾5€&#m¾HrPžO¸ÿ‰" ,HC™#_±³nÑE9AU«Ø|EH	õ±ŒØ)*sŸ G;áŠÜGgAÀÑ÷èÚ‰z>’%A0ì¼£sÄ|šCêlJ‡xýØ}KñxËG}Mj™-å§ÙS8¸¶~ŸBd_Óä[ç¦„ïü%ÅyŸ^¹â&O*­Hu7%‡N…	šwbaÑ¹"­F|×fúÛýšY2ä}çç"<M/\9DØÄøžÑÂ_øè~äƒ›õ]yat|_	Ÿ'3Å2óLdU¼	N)»„¾;_¡$2{ž˜“ñ=›ˆiPsb ãd<g+ÜßèûnN/šGÃ0‹“{§°ˆ¼ì70¼)ßtõØA¿¿ú´åŒB+ä‘¬æ¥4§Õ‚û$ÉN>µ¿ü]1@às[—›MÊ6aJ–Ð&žŠi(^¹B—mX…z¬§FEŸ@f#¡¬FE|¤üãøteÆtº‚ÝpI>^ˆ%:-Ÿ¯Ã(¹Hƒv£ôƒÕ1^JðÅp´,ê-.ý¿FŠÒ;êwFðhøîæ¦îD”øH~@r†9Ê¥õ™}ÊQ :PkïZ‚js–•æëÂÒÍÞ÷¸Ø }ÜFx	“ÏÐ$‡@‘äàÍØH¸Ñ3JQ;‹˜ñ¢€Æ¡¿Fõž¨Èa¢¨é¦J2¨©/‰Þ¡Ÿ’‹ƒˆ§Sc—gÍ}n4°_uìœ™H«½Ñ±Îm%ö3\WuêWÐX\{·9\5fø	,÷Gt%hR®+ààˆ½	g‰aIfXq¸,øá88zLh{mËäBôFø"¼ê
—K7ó]-óv«ÑLòs˜)Ý“8$ÁˆgyÍšÆ‡¢,YS—hŸì2÷ºá¼’ùU^«›®:®P¹nÊRÔûuw†1:n²Þï¯ºÙ>ÄèxÌ„lñší†{³Ý­i…†r]AàI¼·Õmm‡âZ6p­ÍÞ°_ª!CPi+ï€Sà³džlËt5©¶ãäm×“˜ ¾Ðb­Ð™¸ÂNr š+ÞN,ÃNÍc`tbÔ¿œgÿ¯,µ‹bªtmë}¥?ÖK£B’>ºPÄ(¸5ý¼’“$è’²óàT„=à/£´æˆ‰‘°±MWa*¢:—w£¾N$òîl†€Š­1ãñþc'7‚ûäw3Åôt<U<þcX¢ªäÃš(Ðz—ð@69È†‚j!9½ªxƒëÔ…o¡‹m[×"¯P¬º%þ¢S?Y-S 4lwÜaJÏÕ‡MhRm˜¾{Ð“pÍê#=þ(ká¡åaL'ª©FíE®ñý·àËåœ
DO¢z¹9DGð4{´5\÷ÆÖ ÖBÖ)¤š‰ig,À¡
€0!T‡$ÎX4Â~^`ÚãÆN9gÞèjbŸÀv´¶w5²	—½ïl› ¦.@ðN@ûé…¨±·h²„ŠY•|L¦5Œü™H3íLÑü™gû ¿›	E‘«¢A5·™[5ÜB½Á ¦Æ\lÕbž„ÙGP2Ø‰ètWÓc\”¡±ÍŠW1)<³„snoóQh*ÒÆóÐW0¿Š@­ÜšàM(þn­»ß/ì‘	"Ý×ÚÆº€n‹²Ó.¹Í\ÆA™‚ù( ŽÊÇÂ…®‹÷î
£Â:fÄK¥„me »ÒÑ¦[šT®xp]£’hT–+VÍ•Z:"á‹!›¢q¡Y´ÝúkVWÇ¢®[§lgm•džay$7a„×˜Z†+^ä‰ÚŒ½B#RŠÊµ§?±–¹’ò•!rÌÊú:ª;­Ã—ªO1šÊoZ”OÅG?ƒ‡ƒðSšŒ¹yÒ¤Ñ‚‚¥JY•¶<úy4ÉÌFrá²9Æ8Ç|#N¿y“—_"÷¶ÿý!õ'Áy×(ØB<ö±tb%OVNSF¡•‚) Ð„ïó0ˆñÓ¦ÜÖÕ³äþ/Nlç1ëÜ]¢pXb(×j½îLªƒ•ÙŠÍ¢ð‡GïEÒ´ŸÂäTa¼.[·–Êœ)3Í¤„©œ E`ñsæjÿÆ,5GPêûÂ^Í1ósm3cîÝÝíb$²_a-¥³7©{W¤(šÈ–ÙÑ¨¯>½ìÅËì§ƒ/€$fD¨À{’| ”xg¹õ•nK]œ6ÿ­dOí?Û…DÍ[v1«/|o›Xtsf”Ã¯™üÜ½¹WÕ!ÈÛªU@\—d.¯$¼MRØ'œŠ
öô"ã<Áð¦¿0›û{¢J…?¨*õÂÞu}€Ø7âIœå‹ñ9ÿÞ˜N1a`…yÅåà0¸D¿ñ#î7.½  d¶yá¾¤™$£“Éé0*€ÿø§jˆI#Ü¢ûáúZÙô¿)BùÇ -÷#†¥é¢’Ñ´Ýjˆˆ$·@´øù·žO!:LÛŠCö$¸bŸ2v<‰ó?dŒuàGí>šF‹
ÞxV·i+·€*,Ë•ØÁ°!V®Ù5ß¢!=§joUµ”4¯Þd
t'uÌMWw²’ŸÈÆ ˆg®ÝÒ¦n\þ¼½•{œ>0´Ÿ¢Œ‹¨|ë+ý +?¢1J³!R}ó78cZœ.zÞcnä°aÉ®·ÅÜÂ	M[^‚?u®Y·Û•Lw™¦C.Gš_Ìh§ý
S±¨õ±âárXP3tÔÔF¯¶~'µÚ6î9ðt
Su»«¼=È¢o´§/#ª lhóûLèÓëÝµõ÷æâ¯òÞ«LˆmÕþçc©JÊè©þqÚå70†“I­PP))Ô
³¢]ÛC…¡dÆú©sÖ:(ÿ˜A)ExF‘¾§m$‚ã´”§Hµú‰d,¤s’b=S¢€hb#:¶BÇ4¹Œ„Xê—ÊG,l¤|÷¯l¢õx|(Pœ…Å
¿ˆŸ‹](jæm²‹ãB÷(yqŽA’‡1BÉp,—Ûã6‹ÉA±Öáqé
Þ½Â2­Êf~›úG¾"R>ßDyZ´K&Z·jÆú¿(mÃkÇˆ'$˜Ê·»vÏ»`Å{“&c*ü§	É7iøQ¿•DG×’½àÐõÌô ÍÝëÐÆ ñF;,ìæAzæ]z#c–ËÖ4ëÒRâx[¢åj©µõauk²i>lû©¥zhŸjº,&ÇÝ×fMC¡SÑè„l’¸[VREcˆì£¨Ó’Då:2f,5ˆÊÒ"Vdbel—Ã³uÏ¢Q¿3Á+'Ø”f»JvæîŸŒÕèØr2«ºõìrêÛÁŽ°"¯Å•ÝwêÉº¢ä¿C›!ëö£˜}±„5èyã§ˆ
WÜ™CØÐwüÎÇïi¹åe’MýPÙçÙüe2c±UL*Ž¹úþq2&ß{/’b±Îàä½|éñ*?Ë|«kI×ˆf,)»d$Ððó3÷=Ã! w™n¡mÛÄšÆXŸÊÈpWÞHîÀ?¹@#\›)ý†u®Cù‹/^²§ÇGÏoÌ†2Îi´‰`ò0É2|ç˜¦‡´±Jt‡~£gl-W,íóÕ›êJ•4™èÊ;µ+m“'Œ«Ð	ˆQ‹Û&ý?ÿ×ÿþÿ÷°¿p`Àö½hrÈÔƒw””X–]ø=Dívó(ÉB©c¢¥ö#Ë¾1¿œ	^Ö`s4dœó”öÓê£'ñäœuÞ¾~¾t·Jé)è£+¹ÐGWþFú(|öÑG3ú<ÔQ¼O]ü‚-ý<¹ÓÃ ;KÝ4¤ÁwVÉ¾_=_f‹+‹K÷NaURÛ¼uW3­¶WéÌ17eWËQfµæ¾îÍñuÿ|¦ýsgy0Æ¾œ`ßËÈ¿"­–[ƒf4ÝÊÃƒnè^? GW°¨P÷Þ&0ÌU{ ÈXØ{%ÿtÑCë·	©ÿÜ„ÿÁ8bÏwêcÒÃÂå>LqyþrÛö^‹¿ì7±©ÄÓ¤X´§ò9ÐŸãÞÈØ LCj)0ˆÎ1qèS”Eú{åÆ/»GsŽ	P†ï×y"y3f/Éñ	î·¿¿õ}kzÁ[Zöbˆ1¾buãŒcŒ"öcÐ?—“k,œ)†~ŠOÁ:fðPïiß˜Î6KÄ<>WÔ-ªÑNñ5q_žV›A¯7ì12—cK…ßì¥weÑÙ2C-VˆzÍ£~¶_väÂwZ¢èS•ª
f[$ÐQ´ÊÎ·×ÔjŽÍ[)]#ÍìÈãñË¢Lž&—æHX£8År:Þ4ì+X;ƒÿþïŒ:Ð¹úS;¡%KYŒ€×¶öÑ§Ú>ôÝ{›kˆßb^Ñ]
q/^Öþèðˆe†¯ò–>Hº(öàöôª¶çY~^]e‡q¤\ŸF¸³SrøŒ2ÐÃ‡ ôj¸úR¼Gè0¨±ì²k&gfG¾ïm´ôñM}NÌ€å…ÅŠÀž9Ÿó‡“™Å‰BŒ¯ö3[\´ªv{¸0¹ Ð•þ-çø?{¢žQýÙáö6üT/çE{…bT³ù·Í¬ÍôZ3W—™o‚ƒKmÃ7¡,Æ_?¯£îk@xTÖ¾iŠñ#7·ø
¦(o©gR=‹©ø‡ÖÅ~oUnŠÄ†í+4õ€šö@ÊÐ‡m«UFƒã§Û½³-ÝÏš9ÚLõ,€ev…­Š¯ÙiÑŠî·TO¼±T^Ä­Å*Õá›¢«BÑŠÃÑy> ¶±fš‹¯ºš!Q§_$œ¹g¬—†bï^¡ùY‚J¨ÒÖé<ÿ3“º°01à„ ßgY24t*k·VZ²†±ÔiØVïT)ªÑ;Ç[ó(<EŽ¼é½'{UÈSÐû·\]!M÷Þ¦Å½7çp¸ÁâØ®V¼±#¤å›ºGÇÍ’¦îf©ÈkŒa-z…ÉbK½³W
³x]6•Ü¸ù¦cL~¥p¹
î"ôQ²ä¬ÒeÉÅê«¯´ð$9ÐE¸ŒÖo<:4™ü;ïGÔ-yîÔío¾¦";×Ø¸ý×møu6Ï¸Ûà+´ÀnV½¹n?õÎ_wÞ××<cºnÁ¿‹¼å)bŠOÂ<ˆb0wž'<WÆV7÷Ôå·§“þ2%0»Ç¶c1ØyÄ·å½~·ËþùÊwCY¢TåÎ	j›×Q¬²-öM2wºê‹1Ïƒ®ä½þ0tåÎ	«1U­Y"˜¢»û)òI¢—–8áz‰·„õu·ÕVB$F)Ê6—"Ýév¢ˆÐp.ñ³tåqó"ªóSÕ<äÛiâ‰j\ÞL¬ž)‘ù?@Ñe†ï2ÞX[Ø±Ây­Q(•3[O®gÇÓ”SfŠkÓjgÝ§H/Ž¬Fšš{Ükæ+kÝíyoþÏtòÛ?·~zlöTb5Ý¬ÒwóÔÑ„Àà¥Æ4x[ãDÂ|BÎŽžHÜ¦¥—FdÙ™ž`­8oTéžë*ŸÀ(N±†3"Ô{’{è+UTs†ZÖèÐQÕl¨h?ªºÑ#+ºËõ›£ã§¿ž<ùæ„t!D,°yìé«nf`® éðü¥Š¸pª¨ÃÑj~v!WŒd‡²dbørYþµgTk–‘4ã¿ï¤s–é«÷]PöòÎ­Ê8/íqjÍ+Ú¢­Y‰ÅZÖt¿9‡^¨ð2®‚çZpWc'z¡À±ð0zÏ,òÏ¶›ìº­Mˆ5?6aA·¦’*;E·HeWÈì)R[·X’ªj¡Ð’Hw >±vCŒ6d'[­0>‘[Ã³kù…ðßDÍÝá$_yyv&„VhB´ŸNÌÎÒlÎ[»­SÓ9èÂV7Ø4:êižLùÕŽ4ˆØ¸&½šä bÏš¼Å ÇîMrxÑŸ±jÁ­ßï±5ÃvØgÄ´aã«$Ù·­·¿°Ó~9'>n	lõhD±Ø*;	[Aä$¹8OG¨kõ[Ûbñ…˜*ßüÖ”µûÏ ïæ ¯W ´“wæ k.Ø“`´|bÖû!v£›P—ó,O†aÊ{žƒôL.Àf$ÄÊðYåvyMo8ÊÐÇ®’	Ÿà„~ø÷I€w6ûC»?6Íáh–á¶D„ìS8ˆ€}ã7£>*Yg\ŽCîkÍŒ0°:p°¡¯¨ÓV¦mÂ1×J/w8ßz‘De°ö*0mwLjva“š0?ïÌzOœƒ¶6`ê.COüÒÂ2÷³ï°5vcÖªÊ{m0Úâåµî×nÕ¯Ýr¿öAýÚî×®7½î1ê1lÖY¯MÛ†Çø·É»lPD¹üä|›‡ò6›õÛ<´¼Ó{îÓ&ê´Ç‡]l9éÜ¦[ò Š-ñÛÝ®óžSdÏS‡cÍ,ð4\Ðt¹DG»j¿4:Thm?Ï;V1½¿ÏÖ–(áV}YëÍ¼ÛaáãpÓvÓèaÍ4Ú¨›FòYJÏ
©ä[jYSž…$XÞ¢Á¼¬¦“9óÁ%«Á ýI|‹‚•ë¥ì%ÌXŠ«Ü¢.Éôú"j™×—lõm_#u×»Û3gDÕ”ý‡ðb‚‰˜E©éwh:Mî—ì*stÎêF<5Sô0í.XÃàr¸¿å¬zÜ¼Î4æ•ÍUa¸ÇA> ÙrÙY[f xfáÑ(ïÔà¾È\6cà¡³·Ànl¥Hòª¤=¸Ý%ï2Ïl3a}Ãt…9êãV	±°·Æv±Iin@g2¦úÛBÇGÝ\_ß@32šßÙ6,¦àP7¬ó’ÂA|W›ßgš(Æ>×ÄJõÎsL¬¼ûíU"Íà6`AŽL²ynúF#°V¹ó†P7•A}Ôu¥áÇ|¶éó­e õÑG$Ì	+º†`ûöJ#8 @,X&§Ýêýã­dBŠ¢ ±Ð¦$l¯a(ÙÕ38{F[³ÿŠ²0{‡Až'é•µ“€%;º±Å}MÈ™›¶¸Û=ÌB«*óê×í$1×s D¹L¶äâk1WQÈ“²z8µ•Üåžš»Üã¹Ë½Zî²!ÀaÊL¾Ó\Mesc?ó&mÄïÀûÎ‡´Ë»ýAI›/‘•¬å<qªÎT«TsªÎ¿<ª–éíì¿'£¹S¶L!Ÿe—wûƒR6_"+eËyR x¼kMæMÙþyEÚÂÓÔr©VF
Œ×ihÞÝ’sŸ&ÙîõÝÌU4ê†@¾a£E™Q	}p
U¶HÒ×QN#;_I%Ó\â‘ž_ÞÌc›ÝŸüüV‹ÂÜv®úe‘ ]?Gçƒ˜ª&Øwì<=„!º5uë]†£Ü³­Û£;hëvë{Ï;åñóà
·sW3e]:/DÀØ£|ËvWÄlÛŸö÷#§ýý¯Ð)Ë‚^ŠñÞp8ŽÃì»ÿ²¾öç“Éã?ýh4‚‘"zÛ „Gôôó«4ú„_ŽlÊÙÔÎÅ¼7pg?W®«»ok«±õ;Ûö”¿eè©¬E¹µô]ûÎfÖµéÁnãã¡ù$ƒêÍAÔöô9Ç’1¦íehÓ½‘õËdÇw³ÓÕá‡`ÊfUÐë…ã|w€>VÿÁâÌÇv?°%]€¼;èO0†·ã8	,½;”I(:¯G¸éWÖXdåWðW-i¼c?Ê(g÷:Êø@k˜¾ä‡Ôª¡àOW²žZ\í¢)
³ª0D[I¤RRMu±ËXÊwÊÎ' ¦Ìâ£V'ˆíƒ4?Ãt£MœH‰š£‰“ö˜_Ûr¶­21qé‹ð‚ï±Ìè
·E5-YÿúëÄÚ^]vÃ‰^‰ÝÉ8Wçét&iœyd„ðtÉ¸”Ôðsñ•bxU±÷áùÙÕÇqX;ð{{ö23vŸ§s!œËk3m3Ñ¢M¿Éè„Ê+¾in0íÐ<…h¾ÙH®Ø<†k_aÒÖOØÄ\¬†aWX:.Náœ·rlT96ýªZ•üOAûd•ãöXf‘eƒˆªÀ¬ßÊ¶8ßqh.44à–zªthTCA‚HíMÍÍ¥8gA6…b%ûû3‹FÜ¼à²¡	ž—ÊâéuårËê[6«XSRnñÊòõB6,×±U«=Ž†`p§½Ýk˜®Ä 3,T‰–tZ¡Ú&§åk/º “xßH_%À¯vFÉŠüÊBäM2kè´-ƒÞÇÕ-UO i[áW~[Û¸âkV&0iZ{mšsùíÒD>ieÌ'³¬Bå;Hâ)e¬ÂeeÂØ:kÉ’úA2ÞjóÒ2D^Pô6tÁ@[’§Ä­Ákè°®é4ÊÎX”/b2ÌA.¾°N‹K6?Ñuá•	~xÖŠá0¹å,yÐÊâ¢U˜óƒ#¤@G°i:‹‚S/"ƒ¶ßàæÆþâ:rÄþP$	*´éIx›‡U¦à@|vÚ{ÖcnËkt£*+tl•ÐíÐ®z†š'èŽígÑÑšn9®—}ˆ„ËøÜÎÙã“<HÛ
¥ÀJW„fi•NSbu2^¯']Â{o+Xòô¤¸øR8^ÿðÔ\[ð,NNC­±Ð!,}ç	»°÷S†ì8³'º	1q*äðu_/ñcM‹í8—3eH†”…Ã¨­ˆï$ÒÞÀ,óòäXžÌ}T	zC«_!zÆð4ì¿Mc«¼pˆÂÃv˜¼§Q<˜‘ž-™I‚ã`ÓoÕßåˆ?´ÛÖl†š˜Ü¡Ì0.‡IM"1¾bç³œã)gHQ"âo§+÷a¦ž~æ4Å;$&|§øìíëç þÏRœPÚgn6VóÒò|œí¬®^\\tÑƒ‘Ñ,‚}ÖMÒóÕðrœ¤ù*ŸÐA>Œ÷®x<táoNxóéÕ fŸ„ÃÏÒ>Šï€d”T´£œ¦Ó˜Žrã{à;ÂõÃæì;öô²øàã‹Š«ïa˜O/£góT ‘Ò-Â0Ç€S5E·àÚºôÂ­T@Î+«7·0 N¬Zâ€‚”á”;ª\ç”k¦ëž ‘äWìéß'Ñ!kEx19³Œ'Ã>ÃRÝFœU”äâÆ2T)9šÀS¶õ|b^Á¾YÉ_šo·Cþµ½Â¥î	Ñ‡—ÓýÓËùý«0Íˆ¶Ÿ^¢81÷g -M@ …Zïö-P;Òï¦q›Ôîôu{FBZc˜ÌMÀùÙžÒm}ã3d±hñ„	E Ä°­qµI¡¬¾¸íD{›rüD4þãˆäôEäÅOlÚñ!úÇO’8Ò“è|Ôêj!'Ëy\ÖW7Ø
©~1.ñ}!ÑòªõFËÊ¦À»–õYr›úzžOàmùÌZ‹„Üuvõ¾;ì½Q 7gÍ]”Ÿ¯-LýHKºôà¢öxî€í3¨ö­?ù[¤Óï¹LwjæY¢”»ÙÌÑ?ÖŽk¤¥ŠY›û~ªÜøþn¨,ì%£¾aK•'Ü—M5Ð~)dEVÂªNÎÖ“îJ®–û›žüè¶ÔwLŠÀø}÷m†ø?UþIÅWì0à!\íJÎ‚ï¶}›º´©Ö½¾Õ‡Á¥|ÛFwßæÊM§ÚäóØâºÌÊ>&BÒèú3AÊ·;š(üÌb­)Ã4ô¬ËÑíü&ÉÁ<ÂÚuÐçÇv•°Th>öƒ+­‡ø.Ê–>Û.=Œ“ÞÇ-Ý6-ˆLBµ×¼žM»î±i6qþ»V½ë×m;¯mÛRá^TuŸq<dßýk±<L°zá’½‚qabë” –t{p~Ùóüy­jVæþTX°Ç(Äôé‘ïlJ˜¿Õ¬Û ßWSÆb8‹Ëìšƒ˜å‚%[Ø«(ãJ¿ó{÷~™•.9þy†9¼´ó+Ôo0ôßó¯}§p ‡ƒ4ÄSh`xŒú ”¥ÌÊ×<a1CD©yw¾®WŠàÙaë$äßýI,•ûµeÖDq_~d7˜£kL¹qÈhæ)°¥—¨Â"¼˜ÆçË™L‘/"ÿ2$²ûdæ“l_ÁBšÃ!˜~.hÖ6åëL“ê±®óJk;A»"ÿuüñÈê¨¹diðR$¥âÉ7mÖ´²šÛF_m!"J{Œg¥ÖÓXkL]Kãbá¸¿WsÂÀ`¯âJÕx+w¬U–”Ô(o·o¦}›ÇÚLØ|z	û&]rH6ü„¿á¿JãZá}þ­lB@xú™§äã)œ$ÞÏ€Æí˜@d‚&ÖÜÉ	ž:„¬¯Á†\_S±|¬í@T	U¥¾ÐWÈ€ÝW×¥¹Â¬Ä@Ö²EP3Uv«€\$][Çem\ÏÚãì{¶nÏðuHž£ÓœÎbT/g…áÕÎ£¸ûðv„ö%þpcJéª½:Ü‡D%FXŠí|·vÿÆ¶¼y“ò…µ)Lš¿QE]³@•iÞU¼ÞM¡p5~¢èÓ:&>£jFIÏøGfÏv¯i‚zR‡¤r’s:Ç‰Cmús(ÍÌÉfåÍœ³ýñðÌü¦£”"nM±Š#ìfy2~•&ãàœ²Ÿ:N‰Ýtˆò²¬ºþ«çl—‘ÁJúW¡?|[lâÖ9LÆWKØïxÚoa$í’Lë4Ô®/YÙÊÛWoÜÍÆ0‡aGrÊeÒåÛ¹O‹©U°xÔNã¥Üòéåýµ*‚”ö¤	
m`$?ìóß
{†-qe ?¾w}®¥IJqTt¯JNðV¡ÁW¸_]©¯ÖÛyV}ðƒºKí.ââI‰át©#£}Œ¤\µ(6äšÎ¯w-¡“ïž{´²…f5‡b4“ŒüóLT‚i›UÁ¯¶U»1/úàE·B oÒ lÜ	‰xèkUàø’”´Ä¿bµË1ƒðSšŒž$£š&¿€7½€ÿW\e¡èOäŠEÇZ
/[UlÐÁÒ$Ç˜ìú#¬H´Õ:96YÐ©fÖëS?^yÄæœ¥J•9Vm„’“ø[°ŸC,à7àlëFoï¢¿Ö·!¹ÛH
.ùõ–Èˆ_Í‰œH¼“¯2;6GyˆÐB¡F9^V‹*8ëƒBç…í]=)ÞYk™ìeë¥Ç²x¨³"ä*kæ«Ó’—=çžêÑ’tÅ ½d•›¤q÷u÷=áz¶ÊŽFyšÜÉFQ´ëò˜ÿŽ,‚ÐM)ò|}3âç°#Øi…g¨¯ÄÁˆ£|&gaPÌ ãp–º¦ò˜ç^u:Í®øày…0™96µå(î;Gua–€¥r×ùÔš¾[ën„Ã÷Àzdz7Î‹«ÒËŠ›Âˆ›  -s‘±Eþ™;16:·H£+G™3‹rdPöìƒû¢ "ènÏfªº‰±ïÙA¿OÔèÄBnÙ®Ô×l7SËö‚E(Æi3åÄŒš2„Vy¥TpÕMòAX…'SŠf-Nw$ôÇyêìçÇ× /(¶LöìÄWÁåãÕ|0—Û—ó¼Ý²Öùvi^7<DÆ2ÏúÜÎu\3¼+P˜+5ž&ýŠöZûWLüaí¡^?”è%	àŸÀäíYÍ±¥Å½ž4P‡ok¢áîK„ÏêkÉã&RÍwô…G%OÐ÷b	n³Ü­ILL›ê1µá BÆsEn·*ÔÝã%Å!oõià½T8I5ô]ž¢ÿcíš@C})^Ú#¾"gKFi´^6Õ}÷HkÎPûÝºfQä-8Ù3ž´éæ}p-G–%Îÿ26lUýÒ7l]yÿºa¿nØß×†-mÍ/|¯ªFõs›nlyoÓfî×êsÍ7jéúÂ7ªêîúºQ½7j½|×¡ª÷KÜ¬^‰?Å1MPqLéF.[Ûf2=/'B_÷&çßÓöù9Qâð#Q Òãhd©ñ#zŸÔ¸âŸýéî´clÉ›ß]vn1<r^ßyOÌK´UåÊ?®§Kåy4MŸÓƒ|ˆL›f0ƒÿ^‹€ç“l`…«lÛ‘‰4óE~VÚDTìS‚6»¬]qŠCènXRÖ-«E¢u÷oI4ê,þ2ZtÜ$Sëp>Œ[-Ò¬ª\$@r>`w~>EF«c¿ñmâL†=ÛwIˆ³JOˆíµÕM‡Ê!æ¤Müì›V‹àwŸ7íóÉHt«³ëÕu«–…É÷z«ªõÓ_ÆVÐÒ£Dê{¼Y=dÍ9Ïpâ¸‚Ê“êyÏ9hR10¢Â„Kâ’ì7Ä›¹\¤ÁØ¹fÕµ&Ì9²v·ÌÍü_í5¥&•Xë\+]<#Ø‡õ†~j»sö¨GÁ(kOÙjé»]ÔŽêjöZiØ¹v”™ª9«²Ha
{‡Éè,:Ÿ¤!;“SÐº
ø‘˜±àSÅ”Æ‚ø"”:ˆ ¢3Ä±çLÓµÂÒ#‡wÚd_¢>%'FmóQpÍFõ²ãè¹Åç¸ž‘è¨y5|„”ÂÃ­kÞïü@ÒV[>Y»Š¤¯&®wsiõ™àèµµÉ }ã›¶“ey¼RúÞ@Å¤òøê¦RüôÝ—’x~8®Š+¨¼§ã¦ôñdüÞ6õœŒ‹¾$ˆ} ßÍéøÓ{ý…æNò~¹ìÖóP_å½mH¦>ãb·þY)e¥#Ì®¿êÍÚÍ¨Zó‡·“?•…½m²°Ù)Âú9ë™¢[¶}YéÌ§Êmd~ñ*œÝ–O^%×ïÊ*p7„â'Ô=Ç×Â¡zl‡3u$Ü“}ÇÄOK#×õj#×j#×MgÐÝˆ1c5Ÿ¦hJ¢,|<£Â§írõ«ý}ÔüÐ:žsÐyÞú¡!Ùv–oj;Û>Æ²ÆX<Áùíhë.¯W†' ÃÀüb\3ùäq½¥Ï×±œIïhà¾næ%–VŸà3ú„¦E‹àýˆJCìÚc–éžÞñP¯fIP™7ß`¦g(sJõŽÀ*Zýq5ì®›Ýã#º$•ÌCéã‡²g›M”UGÍêÆZÍ9QUøjM/Z!ð6ÖÖjrX6(~(/P:ûxµt<<c·n2@«ö;OAWÇü%u¥ÏÑÁ·6­Å ù”8q5J*aãÄ²©à,ú-¹3J\å¸VÆüÝw¢gX­9kgÿ›åiò1\y·ù]‡¾©^Då¢)®©»ójêßeVÛºqôUHºœƒ08;æôOn(¡ð9êˆÅãÐN9¸ÑÃÏ‹íX´R_^ŒJ…aàøY7ì?ÿãÿh.Áv«xæ‡o	…4à9© ª`/£péæƒ/¸£ÉU.ñ¦ ïK</p¯“wN,q|>b}:*óM:¬Ð=’ï§º°÷"Ñ;°ÏvÙ+Ø#@ª½ÂãÂ!‹Fø¯jèÃÑ¤ë¸ÊîÞ|Ãtií´Q·îK¡±1›ynŠŠ+kwÓ0ÃÖ˜ÇÁ8£¾¬.ž	¸UÇGæÊs\Èçí6¼Yè¼]Xp£`¡‹§ñëðdç.[íPË×ý_VY}÷o¿dï¿_Z=÷¹°‘Þ îTŽ±K_uäS7WÅô{>Â=ù½÷ù¿ïÖÞ£lõzSq»7VcR¿å2Üy©øvõßÞý’ý²²ÜÝùóûïÿ]ùûÛÕs~f’¿ãjàyw3fe´Þc¶¨§¸'ú«hÔx¬F1=Ótu.®u­‹ë‘ÞÅ•z
Úê®–nS¾­’¡—Ôñðoñ¼Ä”Ö­é·Šþâ×Á	ÙhÆ=Ø–»5Èyå;qU²Oï£áøàÿÈƒ‡^p„¾Jx['ÙÑ$e?†0§Ÿƒ
{:BIÛóÖðEþÊ§|•°y–Xp6YÍêñÏØ.nx¬Š©Ý
sßG-T>óæ—Ñ·×Ê¯7ØN1 ÛÍ¯v¨ù®Ë/œÒš6Mi³š×dëíR+¢’!.SŸòé¬VÏ_Åþ30¯gIrûBêy¿OžEjÞÎêêÞ¢ŒÇÝó$éžÇ«ÎHWåQåY´_?ËŠâmq,ùâV&KüJÜJýñ+ÇúÊ±¦9Ýãd§U¾Yê4;]·Th‚™oÇŒz±“0ýöMÚYí•yÛ*šìÈi”Ïg ´­‰3-ùÄÚýÒAg‡@>ÄP
P'/–yEÅ2|Ž<esQ(à¦¥R-w–i.ñaßg`T¿=ô—Ù!ˆÅóÉ2¬õ0]—Ù?O°™ËìŸ¢ái <o™½˜d{2Ÿ‚QŸ=	Gã RY® £*ÍÌüÀQ’ÜGŽUZ¨Õ±P=Â]sG-­®ç)’dÁØ}ÓñåÜYÔ4ÙÎ'”·|%Iñ7}šß[E‚ÏçNjö)Ž˜éÉ¯Õ›ÚºK:}Ý”ß”1Â$Æ†—Wì(§A Ê7Ái‹¼¾zØ¤`P$Ï_Äè`™<“LÒ'ÕŸÒ#¿¡ÈÑ$Î£_û?¹é¾Ô¶¶œ:þi’çðO»1¯Œ»Z‡Lj*8@j„Ú-õ²’x‰NÚ—ˆ–°Z+§W+¸hÿ³=
¯ôM4%†@ÀØ
³\Xd²°f;¬l¶Sü¸/óÈ€Ï¯-ñ~9ÔVC6ÎÌziD‘"ü‚Kê'§˜o…MÛ¹±h¶Aà¨Ø½æK³½ôI«úýª£X]¹ÒuÛ#¾î2‹Œ8Œe¯Æè¦ÍÂ¤–¢]£3»Âª-e÷Æ:Šk%KÅÒX¾°GÞ¯†êû3SÓ 1jtgì_ò”²KbŠQµ=cdêÍh”HóêË8M’MKOFÒœî¨+cX_‹Úôc¦MÁ\î¦%£SªÍ5NMx«µ„ÒIiqS”¦nÄHƒ%æN­Qð|[¾s+ÆëoÌËš¿i);œ».:÷\,V—m¸fˆ¥l2µæº> ÇT«•a_G‡3æÔÝÐWÈIhÚ6bªÂQ1û³>XNµwìÛ%.;Sß.Ìj¹¹ÖÜÌ³ÿ×ívÿÒr¯Þ_–ýdËº¶ŽÆÄ—L¿Ü]Ç/7¸¿Šg	™;ßvÈÉû4úÄì;ö$ÊÈ¦¿Z²Q¼ð•bÃº¡mÞŸ
‹¾®7›ÃÛíÓtöÔå!fz¡›P* ä”á›¥#º~ê©ÞÊT*U|6­Á²áÌk¬ó™#Saczã0Í‘ERÒ*9ZWÀn½›}­­â§ëq!˜	¸´[h».³½¢¯	Bô ¯˜¢QÅ<*@@Š%³*pœ<\°•Ý,ýþ²cßÓkv6×ØÁ1ráD~žœžÚ÷5?$ '(É×Ø„ãüBÉéßÂ¥	+?íW”ºÊUÜQìÜåÆO8º=vâx>úgD¯©€·¿¾YªyHêìËm®ÎmMŸ”P£é‡bå	¿Æ¢Í°Áó$ý»Óí!P]¬ln° !5òì™‘4Œ•hõÝÝ‚Hƒû¹ÑÚFú]¸F®Ñhä›³n"iÉ]ºÂyè\¶É;GGÃs–¥=!µùóøãªM>8ý2âÃ\!µ ]Å£™Yáê·bt»GÊëËœfI<6²¬6F>ˆšÕ­²Jj­ò\¥TJ¤øÚîª˜"¿uäÖp[g,¬LÆáè8ìGÁ3H àu0™9› 6:ctù»µ÷KS\Þ’Â2-S¯¾,¾zÌáÓfÚabnj`iJò³M¦ºŠ‘êáŸ÷×øf
-³³ ÎBï:T¿ª¶ójó¢ï â·,töÃ5Ooqó­èImaGÄ¿Ñ~cb¯ùÜÍ3SvÔKÚòì}Së§Aåu	=yXz•-¨{±³ˆâk&áòq^v<¹}ÕkŽšÜ…½VÏM1ÃÞÓæ“åõØmÝÃZ éTaOr’l%˜‘ºŒ¬ÈOš^¡ÍZiBÂ—ìp¬2€ÞùÄûo Ì½$2»ßŽã$pMEÓjŠ÷¢Û´n†*¡rÚ¬·QkCTëÃRŠ
Š4ì·dHÊZVÒâ‹™J+žiÑƒü‹¶Å„kJ†«€+wîgH—_´³(öí2 ¬Av5ê1é÷±<±Ç f)ãçl¿ú„¿ÐFE¯ŸNKËÓ«©®SJáE‚‹ BH¤â¨|Dþ/ƒÇ-)Ž³ªŽsVï­â8êW±UgvÂ4ŽÃ2Í;?@=ÀûAR2#foaºÑÝ¾2ì=Û&s¸4«©·ÛÅ³˜ÆSpUÙWr5Â¿á_pýùÓá³ÚàÛk53{½‘lS|]uKß…–{çöx¡ßºMî[rÔœøH“Þ`Ã]¾?€­F/ïpè5Zw¸™Or±wÊÙ*;åÌ¡­=ž 7_Á‹Ù§œfþ±Þã ±'%t.§ñê¸Q	uþeäì"BgN 1´¶±î \í³Ã’Õ
©Ô%ç0hÇÂU^°óÀ…û©ùj.™Ã¥Ó'Bã‰NBK˜P4¼¨€›#ƒµ("Œ/‰ãÓ ÅøYÙc{Í©Å!Ê1Uò~n.™êùÌª¤rK ûSä¬¾¡ÊÖë¾S5Ž±ö˜+Á&•iØ’n
îWÉ?‡së¡VŠç9UißÝU¤töi‘‡~¼/%^ê×ëò«©v«¦Z!#ªÖÏý¶2æêÛôõI†ŸÏô‹îAÐrr‡A?%´çØÓ-²6°§¬q-ÄB|Å|~Á!>o6ApéÕ¥Hìó’è|’&ãÕib{ó	íY#{íeèÈ˜1æW(T†.z£l¨Y«M÷HY\åÍkæ)h_Á;'Ã²Ä¸¼&~š  ª½ÒäÁ9øÔÃ"ïŸÆÙæVù‡Þgb|]ê~[f*‡ú4JÚô:Úl*Ú<5´Y´;ÕÏ<Õ³é´3?°++œÑ7<7t!?v3Ç,â#Ú‡“Ü¢‚¢uÿ q×Îk€F‡ƒ$¯Ï¤ûb<Hò„ DÐ‘QÖœ~1Žä©OÐÕp];ÀÈì("Çˆî±r› "»Ã¢·Œ´ÔoÏŽ0R.èX‰rUõ8#­ØXù1ŽIÖZ¿LÏa-~ÑAx&ð7À*¾lK•GÃë»†c`
Yoö'qÈ°²Š³ˆL[¦mØ…ÆIwqVSxÖ¼#"¯„N$ý¹o¨a·^K|ÉË®z1ÂÍðžŒå{¶n»H9Á•ð¸ÇònñôÅ#ñ_þÏ¿âùŽøå?ü÷¿âÿºh(÷‘ïVúNþ
[O ‚)¿½ù ¿/(Ù?‰Ùë˜”1Ð©ä,›`$°ÃÞù6Ü'ÜMaÓûôš§ æ(KiC»•®~föf‡×ê~°][ƒã±^°eTX3Û”àqM[î½öhgmm±Ä’}$ƒœQJ-F¯NPåQï¿›®Ö_©×³õnÈV0#ë±éi4ë§í H
:f–Oë“
”“f@KrV´¤ŽE.qð$ØIË¸Žú—Ž Jüäª/Ñ›$¢W6$¥ôÚè
óoW¯EDŸZfŽ !Üë·nÃ¨+û²i½†ðÅ‰ÎkNF™¾cõUá¢v¦jf!.¦ƒÈ¶;¨¶`Ôæ¢ßîwqÁe_=wû÷ÆÊ®ô[DM³î¬ûÒ!]ÜòßŠïáÖä©}­Åv°? ¢$TT6/ßÐîn±:>ê¹lT]WÓ‹=­):®à†–@yôm/Tøð‡Áå
F35¬Ï ;a7P:–»÷)÷ô÷ÕiÓA^¶Î¯ËÁ¶¤B±	b[þÛ!+QéŽjíÂe0lNHG^(Gfj,‘3R ÍseËÆ³£Í=‡G—FÆî—ç†"]‘&/aµ?Eá…ªG—»(lÙm<¯mÃL„Š¬qNhó”7·$m\e1}î¾35]O:¸éz9®‡!Ä¨ª¼ §‘ZØ”3M´iÆú0lr+
×ê?€²4Ù‰ôùEj\‘Ì™}óòâ÷kuŽ!;Öÿÿ  ÿÿì}ëvÛF²îÿýžìˆš¡¨»b+²¼dùï±cÅ–'s–“=IˆÄ˜$8 hI£­µæ×y€½ßà<Æyœy’SÕ è R–cÖÄ"	4ªêº|U%¹ÆÕðÒb=6è:[tƒ ÜÒTH¥+£‰Ge^ïªn—kM‰á;ÐÈ«*Ž–¢_8ý¦#9VªŽ‡Åî'ÁãžèÑ†V/¹&,é@ô»Æ2ÒmØÔAÇ‰%uƒºMr.}ö	nì0DÝ9wº±•:Û·ŠXÀV9|ê]WèZÑrÐªR¶þëò½(SeE¬ÙUe@—À}k(¿VÙ¬Š‡UK15,×¤˜*Ë¿'WÝN\Š²G}«µŠ´ñŒÏ^€Ûi-MÊËÃG\È¨JÚ™zL‡üÀ‰1WÕo;\þÖwB°ÃWÿ,ïìq½o³,IÍOÀ‡¢‘ní¶“{Q7É\Í­ÝŸ‹ŸüÓô¼Ð·Å»t?PÕÈH½ŒRyÕ/Ì]=|™»¡‹‘¿SîæS«ªYöÑÅ±´—ÝÃŽ:Ö;o•ì,dó„
}îTÅ»)*5òÅú‘wÂ¾¥óIˆ;ˆÏ…~°¸ƒ¿4‡$úc
}ò¥éyÎœéí:
¹-ËÓ·—dÍ–~šÝ^2ÊktÇõrÈÇ’ñhÜAwÉm‰š¯np#—pqÜ’ˆ\¶¬û6{¦ëßú¾žòË·µ 7ºQÖqÍ$jX•2äÄ°ŽÔ²M†uÊ/º›ù»U›k!Ùë¨gì¨¯¤±ãF9$K—oÅM–"ãðð“sRŽe½áoM²á±lé†G­Ä]6eÙ$	öÍ‚g¬«„&OU*a¤ÍÁGÖuäáû3B­ü]]°~Üõx¼fÒI†åþÉ®–Š²uäâýWLy»aÆÛ­HÎâFK“žxÔ’ yÞ^ýûÜª(Åã6Ä)õå#6•ÚÜ‹EaØ³–ÎnÕN«MP·+IÙ2ÞŠa‰6Õ.„^åSX±kŠ3Þº¨Qq¾–¨wÕ£S­5³ë¥s/s¿ð¡Ž[n!nêôí5€õgGöŸö°=Ï/Â<¼[ó»òŽ+…lÑ6·´Ý‘Pø6Pýq “I•¢E‡Ú‚S·Y¯Ã`žÅˆÖÛ²·>³M×Wëþ3	JÚryM¶áÙ.Ã¬km)jndªb'b©¾@Z<a£E‚z
á¡h/4Ò›Gc¬†IAæ›úÏVž?g›ˆŽ–“DzÔïÇ“I< IŸ©gþh \ô%/´f^hHòuRCY¿¸oÔ×EÞP/YºÐüÐ£ÁÖ½ º$„7CæÓq4‰PQ^;U·SÒ~¦q’¥òçh7ê°ÖvðïQ”ô¦½U–.šÄñteFd˜Z:K¢><ç=I …'WHUpAÜœ<©ÞÜ#sg³ÌÉh°O~…aþúõÌ.ìNãóöêµ3ÿ±çcÔdW8™8s §Á$ôÊ•ÌAxŽkæ`"¡bî»gú%]˜$S×å¯›¿vÄƒ¼"‡ä-»Ò¡Tßînh ƒnà¢év[ÅížÆó^åvu·sÜí®'|Ê2T—ó)~¿iŸ:±n‹·œª“tŠ?uPù'ÂÉÝh€ƒ°Ë’Šhs°yôOS¬ÓØéÀ/3»E%Z¤cs1ëUDö Çaß½âáM|aBˆßr¢£–ðjàÈ…U\:üëŽ´7•bŒ*(—7Äi—÷èå€´u	(L@ºxIÉ3Ñ¨¥Õ”¢¸™îÇéªÅµÖ!ÿã`ý^sªjrå¸áTkmÒÁ]àMúoÃA^Ì‘Õ¿çiØ:”>øw°Î¸z± vµJw3¨¶¾ë÷­÷A·QÞ·ºjµbUÁ¯P€ê‹í£'Á8"Œ;ÜƒHÒõ@·ë­üd9ÒÚ_^3·	d)bÚËÿ}'Eµ¬áSFíîå¸¹TVú’ë°÷`ÃGB˜d¢øk$>5òÑËéŠä¼¡F ycÄÝ§F
—ãç[0š"—›$_³GŒ/*S-¹"åÆÇg$¡yšZ‡ÀLVenGcÄm¤PMÑÜvñ‹´Ö@fÞ3óå†(ÉÏ.É,¹ó·¾#Þ° Ëçõœ`!F/&fîO¨d=ˆ¤¦uŒ"é“(šÃ"óY/é.ª‹*j„&Z–rí/Oj£—¤U{âJL(À-ŽÜ"yk‘½zñ¸ÉÀäÜ´@¿Ü»áƒ‹ðÀöù2L=viÀ,7Ü5‚Ù-Ak³hm¸ÛÒ8ÕfV\ÖÈ¤6mHž0	S¯Ë¦
L
È®l}_®om¨ˆ•2’Å7ó	l5«Øm$=ÉKÌ¼£~E/\™ŸDZ Ëø;Z0ôI#õÊ™{‚*/îp£‡–:F¦(§Ûû$47Ÿ)Ñ’¼ôßðp¹­ï9¥¦Â_Ôçx)˜Künñ[ÍJÒNâ! 5{ÇUµ€ü6ù5>70â
´Ã	–lÍÊp`Øúx<–]¼év,kRR6%‡¡øúóÖo¢’Ã{È[Jñ¦ªsoË+¶u…ˆ2—rp~Û¡LR¿N^Åq|€rÉ&I¯Ø.×¿Ñ:ÕRc>P‰j5ÚõªÔä—Ñs[Õ^(áty­¾Z'µN¸Ä¨Wò…¾¿ÀK©ør3£º×|¨Jý‚’½ÇÍ¯øÀ	5·^ª¿Ü$„‡‡¯™T<å°~kU^L~Áóµ­¾5ÊzmîÂ‡gÙÚæÀÄù#@ÿ;úÿºNGªRHÈ¡)­lï›¤Vó½J2TƒùÌ5$n&i–'kêJ®Î‚$Ÿã k«’gm£II‰%H ¥Ê …Ôh,‡fãµ=Uý\U%î_ªEïúF.´Á#„ûe£&·^ê•ºñIw6Sº9˜,;ìó&_ªÉa"Õ‹å-3S—:!edò$¶OJKD¶Ú'ž­'X´7í¥w+/óÅCýžù˜Czò—<Ìšy˜Ñtã:i˜´/'}5ä¨ÞsÄR,#	óixMCžÐ<w¢¯™ôG1(¶,‹ÆŒûå0žPI»‰ÐYÍîK—NFÅº>œn7ÍR½¹Gš%›ÿ-é@5S-‘ì“•gÓá8JGÎTGn mÔË <Iâ³0MáC0&¯`„i
ÔÇïIÞÍÂ ‡1ÉŠuäÏŸD(	 ]!ÿù~¤2©´ôÔA“¯Ü„ÕT¹¹™{Ë)Åw˜ðO'¤§sG¹¸tA)…»^!ßEt3h” ³TDa¾³ygÆ,³q#uäsñÒùŠ
þñ"L&Á´Cþ#€oÂÔ™óÀ½lŒd„°üL½¨Ö4^1©ó:Ò>°”þb3¼ùŒ’t_"¸OŸ¯mV¸ÿ³ø•"2BÒþzuÑ<íç%¯çWøÕË-~™uq.êûÏºôJIãº+¬|·Û­ªº”Å‰›«VhªX—’ê´Z½Íü6‡ lš vÏ¨2Câ‡8£À‰zTÝ{†¯XÕŸƒ@œf4wlÌ]!Ñ´?žc}·l0T if’ÿ#ž;6&e£‘Û¹O­¬|†^«õ6œ:ÛÍ²›­.O.8³Å*»‹äk/Å#ëm î.ªµÔÇ?Ì2ÁiBûE(>W|âà}&Ç£Ìâ"õãLbä¾Ô¼O}ÈÆÁ	Ù)#%â³³0Ñzw-Q#EiÈ©NÈÁ`‚ýiU!¿ƒÁ›;Yû±rs ë8A1„Õ¢Õòw¨J~ê¦kNù.ßx„LuŽÿw¤R,w89kSê#a‚•Ls÷”Í’4:÷`"{6†²
3»>r0ÚñŠÀð0J¡}d˜«Ç8îÁž^¡ÄƒõÑŽí¶Ž¨JždÃvŠÖ!ÏeA!à÷
>¨5ã°èÞŽéDÑYÔ§ºC³  E¿ÓúSgêfÙ·:Vj˜ª¶éJQÖ¤žUxNàhàK”²Õ¡ŠIÇ‘^ÒÇ]®j¥lÄn4°ìíI˜Í“©ðL—Áºû³‚qüfFÏ>;™U¢áó Õ=±_Êiž³Q¤EtZì¥	ÃHšl¬*‰XhçPjëAÚÉ¯u>€PÃWb_<ßÂÔ¹«þÔ†oå4ÂB×1“µYQ¡éŒ1ótg…Ñâe>&"” „±¼§¬om´à´4*¨PRö—-Î
’q p×e¹4¾9±™ÈÝTòWãÞÒTë¼S^æa±ÄÊŠWVpõÚu%ÝÔ•ªŒ#jR(÷K7,Ì·Š½oí|u_Óé´7ÔtuEOV68Iø—§4•ÁŠÆ1ÎÆ iK÷Vvö+'AF=Ï|ç >ÏÕk²NølæÓ(ó›ÏB»ËuØO0G—©îº¾p±*—æ¥¨–ÈL2ÙHSm³‡Uc«ÉþV&Mí¼öSÊ„¢t†WwÉÉ8DÿGU&5! ©£F%´·×átÞmf3ëWøæXªSäìô\ßÊÉòK¿X:–Kç8Hî‰#Qâ7À)a†P™T\Èq<=‹†ó$X†å#É„ß”jKD–ÅCÌ’£¤Ž~‰Ü5rÛ¶ÑUÛª¿s8{p¢&	S)Æ‹-%¨î­–AŽsl2~&‘õö(ËféãýŸ×^ÿðŸ?§¿üqu}h½X¹^šJ—~ÕÃš6ÅðxM?Â l°Çì_¬ë±ïš<¿ž5µWf‘„ÔmžÏ£C­æß®ÿç‡ŸÓŸ×:Ýýï~ùãI½>dgfÀ€m˜¼þî.³Î$
w
9à”IEÅ/ ãÊ\)A6Ô!@{ÊÍPRöŒåmaûƒ×Áì$šµÈ\yµCñŸ†gÁ|œ•$ÂÓ0L-o—–k:!Ü•/ß™ lˆe	3'QÕ£ËV­ÃSP<^ñb‚„2„_%_¨réÕ ÔiÍzñ4$O@ê“™3‰ƒÇ—d¦ušõ3ûrG„
jxÇ#Æ=›ž0ÚüEô¾"“_¿¾s¿þyúõ•ôëõ¯d?0÷}<Ò}Ü™>ÕÈ“ÉQ[À'*rAè4Õ¨SÙ¡3ô83åì‚Åm1Ý=ž~Ç¨Ž€dM	À’9šîþûëë¸_7˜ÍºÃ8îÇëÓ×[Çv|ÚyòãÎ“á³½šœNiw‰ŒÎÕ‡»Îçb¦”Ç!ˆ|Î¥<.ÿø…ÏËÇÍøÜù»;AÅÎó§hÐZÑÔ¤è£;žšÀVdŒp¡A’A”^"h#†wž‚y&)9…Ô Ö_¥?ÏÖ‚kvŒI»õæ|ZXP­Un¨¬v†=DàÍQC{=OhÈ˜½Äæv²­™žø®WÛ†,ÃÛˆú¶%üdÍ£>¹ÓCüd·õÉn5â#?íçúd#>Ù£=ò*ÜËˆO^·ñK´çK´çK´£=Ùâ"=þhÒD€Iy*+VxØ'0D~ÞFÔ‰£°|îBÄ¼˜³5× Ë•çI® 	‚Ê*°2)xõõÿtš_ËñWøOé âÏ}²ò)E@~+×¿z™øÃ$eä7Ë7ÊÜOîUÿw0Hör‚S¦y9=‹=ÃcœzcŸ¡ì Qc½¸|ÈÊÈ+¡§— œ£>[íw,(Y·ˆ€âá®}€šòÁû’ÖO£ C»ëI3í¸uLûáxÌ¨'1èÔ—ðu˜õàPë0œSRìƒÁà(§{	/¯MÉM,ÕJ‡\1‹“¶õE¥<Ñãðá‹xRƒ¥ùR$W½ÇÃÊKåê©9ŸÂLÐÎÊšømKùæKaxKÎlïê¬äl›ÛUòËzÌÒ¼95vHêŸä–“ºÑNÐ û?lîZÂIy™BWÿ	ãáUû-'áô739ÓE±)¦¦;¼é…”6µ­O›ªh‹f«Äª64KòHŒ2…k¥Ð‹«n;‹Æýš¡(?¿uÕm­JrÇåÜ3ÍÙ¯›ù¡¦ÓNÃsAÒ•'™Þýj¥?¤r†Så‡ŽØšú.Ïz_y¾¥dÐæ~K+ÅM‰S³Iåš‡Æ%­u]×ixó–Ywƒa™Ö@Úo`UpÃ&p*:¬CÏ,yÑÏÅÁ¬wÝ®‹Fg0€Íoþ×æÆwìï-éïmŽyœñéžÓRú¯Ø…»\cZcµôU÷op‡öÊÏÓläÊ‚¼§²"WUiÑMgã(ãÿ;`CÈé”Í‚ZË‹M²DŒÙWFÓþ ø/Vë€D+bCqXÔÌªü°åpL¼Eáxp4“LÇ,á–š\i/ª±55~I®ŠˆaY¾þS.(ìÐ<ßòNU[|~ô£§Çã,øûoÙáqC§Æó$ü;fé/ÉQú^ôØÉÞîÙXB¥AÕk ¯ŒyþÎ'Ã ¿ÎÁ>¢ÍaV}JÇ™<âBJšÝÌC¦NP‚.Ð=à®'ÞÀgñ˜:4A9@E:Å¯üò7Ô:d¾.ò9“IJÚO£Q\t+^ŠSúöl[¹¢ð½§X!ÌØä(8›N/`SÜµ]ïã:_±™	Ç.õ4:«Z”t9›z#\5º|]7·¡¸vG[é–º¾2Ù[†BŠ{ÉàÏ9s·*|dgeY^¼Ø½eª[Ìà<³û^Üþ²3·ÏŒó3—¯ì–½eŠ	ù”i÷êxugÌi±Ù,®Â\Õóõ2%ãù´?Ê«ÿ<ö´‚tºBXžEû´bÍ"ÕÖ²bq”g²K¥B¡Á,ÔÅ…ÓÛÏ'¿ãÔl9%IÏ;³²`k€('”¹kæé]b>–/J÷Õlëù¯ê°áOIÄ"ÜXN„’Q˜„þ(¦m»ÈGbX¦¥ßSv&Æ}cV~UážŒvSª8
L4Æ$rf¥üáÑEâ×çñ)™»“È®#A!Êþ®"­³ÈÝRòºˆBTei`Yžbtx_Œb[ÐJXN¿nÆknèµ)ùeÒð> Q é63rÚÎÝµz÷ ”®=éy[Ö†ÌnælžÞm(œ^/Ï[›Ž¾k³7°·yÚ}	(€·•ý­óŠÙne¯Ÿî³é?XnýCäyñ>f/l	é“‹ëqð¶hÕ]„ƒÖá1M¯ˆþ äs‰É!A’bæË¶ê'pa‡zÞaG‘1yc{â¸xÞƒSL}êz”Ì¶÷}P67^a«Ï›õ‰jqeM•[nRh7›ûÃbê°½´:R•aªZ€ùòR“‡doÜt„ «Ó:‹ˆÚVÊ9:1ÛWî›!ÚvoÃºÛÛ{€º}yNFÙ§Vžëbj0ê>Q¾ÃQ]l[®À`5‘~ñv—Ú¸9Ä&^!ÎnŸ¼.¼ú£ ˜¸ÁâvqIûßëK%š—# *E‘%1°¹$9`¼'JƒÍ%‹×þŽµB£V…é›‹kÉç%’vÒ0]vŠöØŒÅÂ}Ê»"ôÓù„ß%¢JX¦óq–’6J™M.fRK?ø&
åbƒwFZµÿ^žÃL—µ¥~äãßkˆ{ý¦7Vê1ïã?~¤Jþf›Á—Ù<Õ™O“ß·µPþ‚÷YœwI”ûæy9Á2Ûmnßœ$á§(<÷ˆôê,jfD³;ê±;\tý€H€Å´²µO0ËXlÕ®ÂŽ‘«³1Xà£h0§å¨^:J¢éÇ5G?)±b<dëõØšÑMŸ.šÝ™ÏiÒW¹]ÜÁ‘éG•ãFìŸ¸÷7\Ã>®€#°ˆGž…I&,øÿ¨5×ÄWîfÌÁ8ƒ}åÙA9®+Ý—Yé\Ù
ÝÈ¯¦=;½.¹.æ‘[ÈÜ,Œ ª^Ö(Ä§½tYëä¼ü@ee
ã«êÒÞø¸]¦ínïòÒæ!âh
{ÉõpÓÉ­ï ƒÜŠ²Ë55W|»©†Šñj,oÄùøx?ÇÁ@“gQJ[vr¨Wq§?‹ÆÎvzû=‡3àˆ‰dýîŠ;H/§}Ò½J7àÁ¢58/¹â~Nw?lxÄh‰ÎÀ®+V½îkû°ß™RQA˜^pDˆ4ÂGˆÝuîMŠ—£ût×þïIŸ–lƒüó]”‚a’µ[œ0ÏhÀ±Ûò½¥ÇYîsÜu}¬Œ]0³ZFâ†òü¦¹ÖzEcm“øVÝÒ5)QM{“ÊÔ:d’þýÛW¤®F×ÆÅÞ6X^«Îœt?£Õú…ªáÑqiŠÎ/5õ~<åZ”ó|›m†JÔG2¶¥ŽG·Œ{P°i!Ú
!gdûJÿþ¬OvxÁÅððï©‡G	5v¢0<µqTÑÂ2Ú Ã%€°ëÝŠ×{ô9 nø)FS»rcÎ
Ö’²:XÒ€!·(xaÏÄ‡ØÐˆ—ßÑXªM»ð±˜,¯Èƒ†¹Zl*õªy¾j­Ý	Wa¬¸+€KÝ]2	.ÖÎ×lM½¼ÂÌ[D¶Ý‰Í@-€ŒWZíÂvätéÒŸÿõÏÿçu¢1µ¥uˆ^ôÖî&mƒãùn85ü´rmÝÎA£]]ý·[Ö¬$%”‹jI.\XfõuènÃOfV›)ZV^Ëãg§”f•kÿõÏÿÉ‹ìuà†Ý¦e2½$=ÁV5jîûD%W~{«3ÆJOánä1Q¿Yï•§QJ]K×ƒyvIâ3òýuçQ6b!û`ü«BÓÐ}xÒ#
§}„Ûa†¢q‰ê–ïX@,9â‰^ÕTª
ä)[{ ¤PVGT¢«ÔQsjs‹^¦D¤óÞ$Ò¶õ`å´„Ê†~Å-D¥îTd=À%Ÿ@Þ²–]¾Íy‹fÜ†ªi?íƒµöpWHíñPüe+(§}«ï‚O¡Æ`ð\ÃcõÖ—XŸmåýÉÓ£ÓgäôÍû·´ŽÕÉû'¯^¾ûž}¡ë:¨×4$t°Ž¼$W:Iù(}(()îl¦ã^Ö7ähˆ á×Áô›	þYàU›-+V]âh1~]º‚œ[þ5À¡Ò•‚¯L¾ËC]¥¼~ÝIdSxº²Ö?ÝÊ¨oW5æwêMÛS°R4:žï¦ß t\ž)gªp§1i4‹¹ÎŽ’$>ž•c‹ä¸'t^1y¥Hñš´ìb$¬½¯Á[žºXîª/ùð5rÎè±Ä¤–žÔÂo |6ºÛúbáaL±ú®ºDØ˜ugC+!›„s²ùsªNëÉ`Ÿþ¯
ÿ®ÐR¾?ôªÙÃEO´^—¤Q	t(qSw6Š³øýÛW×êco!iÀô‰h;å¦NÙVÐ‹Y½«çFÎmÖ2×¨½è@ŒÛur{+ëÈ+9ÿÀjLZ€Œ:ì‰ÙvlÁÆºM«ý©Í„Æ•9!ÂRòµü(I<Õa…×'e –MÑÚ‡}ü–c\hŒ`?ÓOßZŠ½Zq0•Æi­l›}`3¡}A¥¥×ÿ`„ƒêY½ÃÁQ*~üK>&¬hfÛx*?³½Ú!+¯á ƒ¹„ƒ•y?ý8Ï§+æb¡ZŽ <tž3V.ÍvL…‰§$oAµ2œÅ>Îåëë kv ÿö0z#Ò´»~ëÃ¸á&u#ûò¶Vïd„NÍ;¶|3œÔs”Ôzý!¦Õ¸Ò`6»™Õ~[«úÈ3*2ïØÊöã	ŒIw±²Çì+‚ßÝ`uëZ½6ƒŠ‹­7”ÃÇíÖ¼¯À´/-M‡ü5JŸ1ÛlŸ|U­èÜ…UZíg]‹ïÜ¥0­û1nÇ{HcÛeÍ¨î†lÎô2ïÔZ*$.ÆÙ«Œª(·Çóã†YVÐD…W~s^ùsž“wY€­%a×Ã_rjç­¿°U;LþqmÚ…Ò}b“å]˜´ìÒõpi^µùAáR6¹{=×Ê»åÜBlrZ$ÀŽçâïé$‰)(aFú+¶Æ5‰Ò£Á$šâ³<ºÊ’yxm‘©¶ÂG6¸ÑÚ2eÑ_ˆn4ç[ä‡V}­jÕŽa}|¬t­&ãŸ¨Õ¬ ¸µP÷fê¦*¡u¤M•¼9GeýÞ)i_Ñ°ƒhB·d]±d/t	Ëk;9$ÞÝ/ÄÑ)Ð±ô>­#ÖÒoøÀ~ý°½Ñ!»«¬u:º­¥OªÓfc°:öŽQÊïè Ø¼4îòJ—½«ÊYkØµþÍyÈƒæ~º:C˜X˜\RØ\”2=Ñû³YY(i)û><@€¥'¬u1tŒ<íß);dà’°r¸¾)ì3SÔ!ä¦š¯Íæ2æÍ,kOÇ³-IÓÓ%Ÿê[*+M–CŽ2õ¦ÿ©˜Sóëæ>Çœ{¿÷)ƒ	hØ­XlåIã$pÃêñ?…°ï¡¸îuQºGûUÃ§(oW|˜F;¿öžoZõ$Õå¹XN”¥§Äúbeº˜Ï ‘kò¯þ_°xÄw3 ©¨‘¥»Á€¦¥ÁŽ¼±zMN‚‹Z¯+Îõ°|›)¯ÔmªX ŠFÁ7º»R0éÙS0qç©ÃuÓøynqOÐ·vÌh¼|¶Ý@ìAr<bÜöÚNÂ„º÷§ýLÂ,‰ú–åì6ÂÜÑ Ó«¹v ^ÿ° W«,-j¬øIÀZmÊ¬À¿ÍÖáiœcògÄ"ß MÚ–&¦Çë¡ïcq¨“è{¦Ý'+Ñ½µß“-Àý|w]5m¯ˆ¹èq™ÁFã½\ÃÁÊj7	s˜P;è÷;¤ÇjýöûäpI†«wDs; C=Ä± ¤Ô“¼„‘òhHÐEw"Š¸@ª£Cî¹ð¦@vï€÷Ã¥B¢ó!)ßMND!-$ÜóðN4¤Çv1ö³ ™Rµ™îí”6}ŸaßçìêjóùSE(bºp1ù[f,÷I~Xsow'EÔÔ½í^À±§îõ¾y‚¯°ãfíÚ²t *\faÐÌ-úíóh
z fS¿³ùÌË•_E¥ª¡EÕ-O¸‘U½å#Èôºµ±˜â.‚ûí¥+Çñd¥)Žß‚E±’cˆ‘Cé7þj¶~ž½Ó{šš¨.Ÿ5Næ¬ÑGÀŸ¯ÿ}aÀÎHlqTc²G9&´½‚6]©—þsž7-•ˆLCUr¿-ÑWƒè.´¤ÝžWƒžžÕ5½RŒfhÕ’BÐJúÎ×æ‘Z´¬–0–Þ!5C›;Ä%˜<ÒŽ¸¨)PŽÞâFg1š€]* <¾b!›µÖ¨žGe{ÕHÝ-c¤=ëpÖÔÍ¾ÚÄ†`4²ëÐ_l>¬Jk Ëú‘îFïèà‰ûµÊ'óÈ[òhK^ê½½.µ	÷»Yz
U;šÍ–½ìeÜÍ(Üú£	ˆó•|È^¦Ù­A, ÏÅp!¼UQ®\Ë¨×\,W6œnßœ´´êFíŒâ°ÑßsXSBAQec!»N±ÌÂÔÚÔ¦ÒWÕ`â§žzR¦.š¶veÉYz,+Üû<ai¥RH‰ê­®è?•ã)#SÄ,•)VsòS8#ƒY‚é`²O˜;R^Û$äÉ÷®ò?ËçHéùôîâCù¼³ü¤3ÃŠ¢NÇ*>–Ï§ˆ¸£àÕ¹¡ø§ˆÄ²çÌÕ2§‘¿j‘“’¡ Ô¾FA0+•s+EKà\>z…ú³b¶Kô«Ð–š
÷rú)Žú!a=¤²sâžDã1Ò—”
W¦ªˆ]––Š§ðáX>]RLH½éÓh¡ÓúUô¢q”]’Ÿ>Iáæï‚³¾øS§m38gW”'ÀrÜÿ8HÈ[ }˜N2 Ë7íÉZB/\nµò>CÙøxö8üiÄã±¼˜ã.bAü© 	-„!­ÑóqfðjÐŸh^«J¶$.Ö^ªÍ–,–Ò•1y+KHŸQ¬[<§´ù{ztUþ¦Á*²ªê0º ¹£9|ÊiÏ6šŠ+îÙ±“£ö¢¼ŽóqH³¿?Ñ1P„YF=ß~‹’òÓïÎŠ°‡ÊÃoQÞd# ÜkRrR”R3â¯>¬¤}PÏ`ø•Y™—šsüK—wµJ%.¬¶©6høðíÆ§Ñ/5jÖÌ[U•Jÿ•¯f$W¦¾…ˆÃ­}˜¶¨th{æÆ¨lÏW°¨sì‡1“é =Á=ÒX´DZàÇÝ¨$«7ÚmK¥:VûÝðä©w?}Ñ´$ÌæÉ”yöõÐÌrL^7Îõj»fªhÂzV“)Zï©ÕÛdÈC•X—èV]½ær£2­j6©³%1s­·O±fÆl†úœA6¥s¤sø¶?OÖ¶¢àŽY+ÞçaÇçqòó°+/JK%£AJµ
&AT¤£Dx1Ž{²†‚±,Ž Æ<í‡Å]®¢ôžb8}Û’g@?‰‘JôZ	Dðh¢îÝ?°ŸôÆ/nfª-cwqüÒk‰¦`èãGWW"é|Ÿlh´]ö„Êi›ÕÓÂL“°Uµ·_J‹Ô>ƒµ+„î¨ô)hw}>i’x†áë¤â)_o²2´œ<L÷aÇw•ø%›¯õò½.GD8hÉ§É º1lÕ£X¥¬’÷[¹KÖ+5]DN&E]Ùƒz-©[‡ŒU’õiéÂ©ãGIf±#¹>¬[¤ý‹¦”®¡È‚w•ŠóËUþh·,.™éO2ÄÃ‚)VÛÁŠD4cÀRÑÈ§( ÂwÈ„£ãe=h‘´@C%£™¢ÒÅ%kF?CŸUÚOâñ¸Êàf¡Ý=„ÝC1·l²†M™mÉ :ÇI.QZ‚|Dr E
ê;ƒOhwà^—‰Ùp@ïÈÁô–]†¨0\Fbt«—Å4ûÚ|ùUåzÃÍñÓŸaÃ Kf°¢9yõ;]`‹+z§§ÃáIAËb%LžÊA”=˜Ò£«ò; óëÆÂbâ#¼KöÐð™®´iÀ£2ãÔÓ˜^ÙVV¯Ã^ÖS_EwmGçÈ×ZÇXp†•]w·v±¤½Ö\8¢è1iUKÊçz½¨³——ÃÆ>O|¬%Õ1¹¶4˜â ÎuùJé«ÝEåÚÞ<cª4‚½4	ÑäGù(ªî,{Ç-UJJ
!l)ÙÐXŒÐŽ‘`‰Ô…u¦¸ûe„¾”ˆ]î³¤lã}ì-‚®lÏ–¡ÀìLt}¶…rµ–ÎÀ*E$ó>éS8­‹m`Ž²ö†%üâ´FÔüJfº0FÊO»8I…ô;•]ï1i•^´Ò›I›aQ¨Ã¾MWÅ*ydSTD¾GQ`S>B¹xnoH[³ç©ü¢O;VâëîV“t±Pj°¢¢ù~|Å7*r
Ù¥îè&Eo$—´ÿÈ—ÿœWYVõê+Í‹óOû+Êz4KP¥áùk—d#p©±¯yºO‚©qžrzbýâ
š®*´¤«ÊM¬ ¡
a‰_æîž*ÀÛ'é‡˜{˜¨Ã1€9ô]=}œCë…½«øK+Îñ½ÁµqÀ55Vè‚zDŠ(JÑþBíQ9¿,æˆ:aœ†B'¼bæ[ånÅ}Ç~æw,0›ÿ ÉÜ@ —zlDT”Zœc=§Âß/ìgGòmñ©¤Ê˜/ÕËßçfÚÀá4<ÿ!FïÿCûñcñwñ;W¨ƒ—HvÓ`ÌNÕ~]¾
ë‹òG…ù?”¯<I¢)Fj¢3 Uq•òeù
vÎ—^ó¥üÌSñ*(øŸ\ý¦8WBÙ?’3_Š30†þ6ãŽË|ˆûæÀ„Ç¥:mŠ¦òHU\¤)|’Ïçµè]i¾”)ž™<T´ Ý÷
Â?’­øá»Š3!&2±¯ë<”°îsÉQyŒõÚ0”ÃøSrXÒ_BvºUâ9®ždåc:oý5×žž´±Òü×êëÓ½Òê*Y|´é(>?ŠØÕõÈnÞÜ#{×²¨HDOæÑxÀ]Ôˆ/)–¨™ƒ–µbºwÖg•:Š¾Ùò]¸Žä¯Õ/Ru!½îætØÊ}ØóHÞö–âhãmá
n=¯­\ózí\ázñÕkig¼þG<ÕzÙÖ^›$k›{ðO†ÿP2Ø¾ë©^&×o¼ SÍ*ØÎíbb[
˜Î„7’ã0õuþÚ€iæòvuCv­Ã£—´üÈüaÔ7—oÕ(§ìéh{Ð·Y;â^ÈÂi(›;ä<\×C™@ËÜ§lê.ß €ç a5fá&{%	C‹Êf¯ë¹~§äÞØF®¡ÿMû(à`›Ì2'ä%¨aÌ«]hcïË¼	²v¬ûñžÞ‚ª6 eê	ÈöÚd<¿˜#L'MÉûÞ|@X·Ü1NÃa0†ÿÁŸoÐv&°da´éÇð»Àºu@È¥O8òe<`Ÿ¡ß´K¾§=`Â!ƒŒ¼ŠûÁ'¸’p|ÅÀÐ²‰7¨
"¶‚ú',zPñ&v¨‚ñ+ÚjW)ƒÃ 
äõì!»çÝ
ªpú®ïVj4—ah&î]ÌZnÊ³9.¾
ñ0ËÎW(ªzóqÏU™ èqjÊx4µ3'Ùèœ5E#þD<æþ½Dž ïs.=fûFŸÑÛcv&•œxeQí?ÉÖi´œ•Å°ÆAè>!s¶í’Ÿ¨hgï™¶,éÇggaˆ,¬f´$“Êý)ECº“ÙxX|0)üÛ¥Œ­Ï€mÓ/ÀÅÀ_ÈË˜X ü¤,HÇ	æ8nõYÓ”O°ñ{±Õ\Ë‡ùRr"Cõ•Ë‚ývÕó×ŒcéàùÇ°rƒùlç19Eym>#ß§¨ÄÂZuëÎ¶!n½ê¥*Z}˜SžÙ^ÞÕåH×Îr16{nšãÒ’ûH•ŽƒæækhmóìU}dËþòÍ]hØá×ÐN“ˆÁ“à´WhÅ „ÙšÐþ‘,Qe[’Ã5KúVB ì¥[CZxÿä¸ªø%¥M8“A©YÎ¦¥ ?=Xx‹wíQ åìµh°u`ã[2‹·áy‚sàåÉ›éX§¶ááJz¹rÄ$Ft½ý–è1¦/‰Ç1_ Lj½5"ÆzÍ(><ìîªÝs„gN"šeÌW‘cŽxÃë…„ùbS"µyëH-Ý:Ì’ G‡„Åß¨Ád˜ß%Ô[˜|‚QÂžë{èÇ`ß´g,c•^0 †µJk–†²ûtv‚Pá¢$¤ÜHˆÆ‡„£é±Ÿí"G­-ªQÁ¤FpÝí°~}XÝë&1ãˆZa´Îì¥sN¦@Zã^W]MkX˜ÙDžIÊ½“Fë®œÐét_²£4×µMM?`é™î~¿euç"-ñ¾³D¡‘•¡xü<«GàèYè˜BÌ´¯ÒR‡¾öË@pËWÂîîf BÛ†eÎ_PE\×3àÇÊoåÃ–ÒÇOßÚ·¥y-æÁå|˜-$¾¶`é=•Ûÿ9#L1½ÑëU_‚¹>ûvPvcäuÂár7V·k¶Ž5>,…{m ÷Òº‹(	Ê“|©ug¬¯Jbâ,ÿ,dßH½È:Žg—_BYªèÏ×äKìêóÇ®€Ô67j°`_D@kY¼–Öæ#Æ>_}‰o5Žo!sÜ­Ø7`cm>‡M…Ð)>ÓDç´V¨‹ÒÈ®&Òuc¿œ¦Y@³Éút@o‰§xÔ¹ƒiLó@©ÚjtŠ}x1$@‡Y4	ï~øK…ZŽÓ.Wfs±y^Ê;X¿>Û^mÑ*V^ÅÑXØ 8æKCƒ.ÂóÎ0ÂM#>ö€ÏŽð‘Põb>~PIB]Tm ï¯@Ä¬:[èVëpmâ8Eû‘<†ï)‹3n|˜¬­¬³kš)Eöô©RŸžD“û´MPxÖ`Æ^«_<ë)Ckós"¢áÑ3Ä6},N®ýA¯ñ1õ÷ß/$f}cO;gS!]Å¶ñª³}»»ë2°8•Vé„.ñ¡Ê¼Xc-Ï´Ü
N„‹ç±š6±¾“ûï$¼´R¡{7o,«85-ìv+Î?SV9±â šÎæ™ÙÆœÄýQØÿØ‹/,9"ô4èåÇ¯T*I¼
éz,]ÙþJÇË½Üâoë£ž'Òã—M:Wm	’^åÑ3g%¬·È	$/ÅrƒÆ–œÑî+³¼Ì½¨¿Sv) >Ã×2–)>ß.ÓÔ#é•úø`oh}ÏÉüyð÷ß+ã£×'m¼Š5þu—ÉùùÑT’Çcåáo›Œ_‚› Õ‹¥‚§ô¬¬A™-_ÎÅ¶üÕ]&õ|¢´T4Yg5¿Óÿ}ñý’{± õi½¸–zñù.Sy1Ëß4eçýß)açÏß@†‹K¹üï2Uç“ô"jÝOµà¥fð™e&Ï²4à¬5Þ±ãÎ"7š:eÚp¯ëøª¶³]Æs`Ì/<f¨¤ß¨ãÃF÷á8¹ØÑÜM_ÔÙñô|ñ&ÙdkÑÓ2¡
ë oÃ9],²šaÒ6¡u}	/ì[IZ¦Hþ£(§Xà°yÿ‹*è‹0Jk«•µ‹8ìRÌÁæî-!Ì·sBvšcJµ|y½‡Xæ×@æø>D@–Bý|Õ½°yóHø*š¢aL¦ŸMû&”Dž„¥‘æ²r®Å“ÔtC›ð{±GPÈ*è–‘Ëö¡+ùf(k¥Ý_ÿâ+-RÕóQî±é÷x9	†aµ41Å|Èë±Tøp¡¤f-u©(Ø
)È	wjüœ4ÚŽ²«å©(µIêù³‹ÙóS¿¡9bv}!ÉÚ òˆEL'BÏ£¹(H4¡!ªù˜Pk%‰ÓËk©ÝiãÀCzèõ(\bj7J·wóÞˆ	¸uò.’þ–í4¦â¡P†íåÍw«ú¼*yûôï$>çŒµ­¤ŠÁ°ÉÄÒÌ*;È`ŸãäR=7óG×I9¬CI(î6×·ÈZQhë’~Q-‹µ³aJŸeö·Å,ÀAôF’Î'L)‹¼û
óÓSjt»ö|ì!cI6€?dç…|YSœŽoûF¬<Æ{– ‘‹y’ÕÒ]"u…:k4ìÃ{G—÷ÏÌl¯ù[êXT/WR.XµÞ‚6ÏÙEå^:ÿ™)¥úê¶ÇÁfói
T‘Žðïh2ìõðŠ–[ù…Ás‚ž cOlóIkc°ž çYm¶ #Öè4èáo\\V$¼m–7……$½‚Çœý6,=Í‚G3^ 2ßrõP¦Ó=áösÔù$FÇa¥*i¥Âö·æü¶š•cÍ`- ¨¹KÍ½‹*Pä‚ž¸ƒÃcÓâ>©JéìB—vmÝf#Ê	ÝFŸç¡^íDPÜmX«íê“D€Dy µ‹Giç•2¢Ñu`¥§Li™™p$ šÀ–T3…ûµS^
|™ß'ãRH¿u/ÜÊ9­Nw?Ác5Uy¥Ëˆ¨—I&\þOz¬ÖŒï;14´c•M’µ­ü!
)-ai®Ž`¯Š!n^Òˆ[‡§À4:@s&)t»48ŒQ›E=…éÁ$À2‹\ƒ9‹’4k@$>PAE¦“ýâã6²}ñqÇbóëëˆ÷Ùö<[:Û…ôò™<"¹"Æ¾)ÚáXú†6ŽŠóùÓ[vºeÃlÕwµEâOãá;8ál)½ÓyúµØtd¬ÃžkìA:Ã\ú÷y¨M_ËNžRèŽ•Šç\¼SIÛœ³
”óÖÝcÛÛ‰ôÞ¬§±M½´‘czÌñ.—]Ã‹zðô)fÖTTKÂ»sÔ­–ÍøK4Q&C’&}F&`¥fZ-U°QåŠë¯qïoøÂú8;¥1óÒonì‹_RÀéŸ¸M´€®ÏÂ$	
ý¹|ÔšÆkâ+kÖ`…ÝÝ¤föÖî(³ãL§ŸÚ›v:äâÍ’ú‡š¾vgÅgûû¶­uÚKSq•¯vc
FÙÇ§ÑXÝ®}Îã!Éi€pzý2§—-GSg>ÓcÜmt…­Ò,‰?†k¶qÆUsÜž›ctu=Ü-µ÷ÒÙ-¸$5­–¢6F±˜²bËP&ÉÌ"&=V‹ÒÎÇYÄ]É
û‹¶Òe‰++¶‚-»»XüÍjÅÛ®ÕåÇds·S™úBµþ
/júÑ.Ýa£Cé†Í3áÕMã\ÊY¯*vdæ	»iÏNCúÂL	þâÐy¶x¿Æ-îÂÇZT%J”ãX¹Ÿ}ó`Wbøõ‡>Åê›ÈVûºcêÐ£A¢I©“ãÈþìÔvðì‚é~Ã”
DvQ°`JcSZ,)6‚5h~ºâøfÍØP^cC?c\ul6ªö\Í/­8}C™ë(z§ïr<»Âžá¥Wuk¢ï€amá›œ…©lo€¬±ÀžYnù ‰TGŒžòÍúªl*0;øZ#©äm¿.ÈæêÊ5cÃå4Ëo“v@§Wi%µé)oì­_x¦	lÉJ‡LâÎ,ÕÏ2x¬Wâî»¡¢í»ýÔw­d 4ê¯ñ,ÇÓ³(™`ÜŽÚ˜©ÏËzÀ^–A]T‰® •è7˜RÉ2½QM™÷0µ\´M’@—{›p"ñ}¥´?ÿ…n5ã8 éËÌo¯–×çÝ¼ßÓ”°.äiŽzqüúºÆ³ì4ÆÚe’c€ÄÀwU¨J£b Ä(—
–ÈS­øQÁNqU­@[ücíÃC8~±†ÔDÚ»Ä2FEà¬BÜ“¦aÝç *îÕ¡ÍÜÕÒC”(ÉUØ¸¬ èÝßÍ¹¬Y¦ìªká´b•îÑú¸rÍbH¦ ¾	ë1ÚñÖ329¥T®ÿ)ìHŒH[Îc§×íÍj¶ÜÚ-­gs$«KòFô‹Öú|}”UÕÞpAÑžÂ4Z@ùár‡}9tVòbùÇI
Œ†‰Í¥Q5æ	\ÒKoÍXùLSY(}FQ4UFëO¡¡I<ý˜ÐÖŠ¸¤I”£cTªo¾9aÃql!cÔA+zv2Ÿb¨K±›[yŠŠ—-n5æûF7æ÷Â1®ßëç 'É[XŸç´³F(ë¼—¨¨R*¿+%åµ ‰TÏ[\‡½Ùh´6»È-ÂM-tf!í¯µf½éž\z$&ZeÈ]•…”ÚH®…ë“Ãn^ƒë_>EÙiH¿´Sâs`:xˆ8›a±zk×À‘ÖS³™TÙýO=rH67¶vÀ*ýõë«¶á¤u<eµ›ÅÏQ9jo®^“×O~®1\rMþôä×kò¯ÿóß5Þ4˜Ø®ì³TÏò›¦z›§Ùêö¤™ºû„^‘Ê÷©h^9Xu H‰sÕCãŸ§V”D¸]=ãÓ~æ}?Ip^Ð%mu@“r°v†6 –Ó¯tËTY½qãê·˜³úÝ¿]ÿÛÿ  ÿÿ AÕl}