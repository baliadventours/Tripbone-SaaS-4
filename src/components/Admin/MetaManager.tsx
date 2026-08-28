interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: string[];
}
import * as LucideIcons from 'lucide-react';
import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  db, auth, storage, handleFirestoreError, OperationType, getActiveTenantId 
} from "../../lib/firebase";
import { 
  collection, addDoc, updateDoc, deleteDoc, 
  doc, onSnapshot, serverTimestamp, query, orderBy,
  getDoc, setDoc, getDocs, collectionGroup, where 
} from "@/src/lib/firebase";
import { 
  Tour, TourPackage, PricingTier, AddOn, TransportOption, Coupon, PageContent, 
  ImportantInfoSection, UrgencyPoint, Booking, Review, UserProfile, Guide, 
  BlogPost, CommunicationSettings, SiteSettings, BookingLog, TourLabel, 
  Category, TourType, LocationMeta, Inquiry 
} from "../../types";
import RichTextEditor from "../RichTextEditor";
import { sendBookingEmail } from "../../lib/emailService";
import { sendWhatsAppNotification, getWhatsAppLink, generateBookingMessage, sendCustomWhatsApp } from "../../lib/whatsappService";
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
} from "lucide-react";
import { cn, formatPrice } from "../../lib/utils";
import { uploadImage } from "../../lib/imgbb";


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

import { generateTourData, GeneratedTour, generateBlogPostData, GeneratedBlogPost } from '../../services/geminiService';
import { COUNTRIES, TIME_SLOTS } from '../../constants';
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

import GeneralSettings from './GeneralSettings';
import WebsiteBuilder from './WebsiteBuilder';
import PopupManager from './PopupManager';
import TourListing from './TourListing';
import BookingDetailModal from './BookingDetailModal';
import BookingManagementPanel from './BookingManager';
import StatsDashboard from './StatsDashboard';
import BookingReports from './BookingReports';
import PayoutManager from './PayoutManager';
import BulkAvailabilityModal from './BulkAvailabilityModal';
import ImportBooking from './ImportBooking';
import TicketManager from './TicketManager';
// GoogleAnalytics
import AIHubManager from './AIHubManager';
import ProposalGenerator from './ProposalGenerator';
import UserManager from './UserManager';
import PaymentManager from './PaymentManager';
import ChannelManager from './ChannelManager';
import WebhookLogInspector from './WebhookLogInspector';
import DisasterRecoveryBackup from './DisasterRecoveryBackup';
import ConversionFunnelTracker from './ConversionFunnelTracker';
import AnalyticsManager from './AnalyticsManager';
import CreateManualBookingModal from './CreateManualBookingModal';
import FleetManager from './CarRental/FleetManager';
import RentalModuleSettings from './CarRental/RentalModuleSettings';
import CarRentalBookingManager from './CarRental/CarRentalBookingManager';
import RentalAutomations from './CarRental/RentalAutomations';

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


export { OSMLocationSelector, MetaManager };
export default MetaManager;
