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


export { UrgencyPointManager, AddOnManager, TransportOptionManager };
export default AddOnManager;
