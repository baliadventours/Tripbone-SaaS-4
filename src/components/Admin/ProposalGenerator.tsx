import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, serverTimestamp, setDoc, getDoc, auth, getActiveTenantId } from '../../lib/firebase';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  X, 
  FileText, 
  Send, 
  Printer, 
  Copy, 
  DollarSign, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Users, 
  Calendar, 
  Percent, 
  Calculator, 
  Building2, 
  Car, 
  Ticket as TicketIcon, 
  Utensils, 
  Compass, 
  Check, 
  ChevronRight, 
  Loader2,
  Package,
  Share2,
  Tag,
  Clock,
  ArrowRight,
  GripVertical,
  Sliders,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Image as ImageIcon,
  MapPin,
  HelpCircle,
  Eye,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Hotel,
  XCircle,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { ProposalEditorPane } from './proposal/ProposalEditorPane';
import { ProposalPreviewPane } from './proposal/ProposalPreviewPane';
import { IncomingLeadsModal } from './proposal/IncomingLeadsModal';
import { ImportTourModal } from './proposal/ImportTourModal';

export interface InventoryItem {
  id: string;
  name: string;
  type: 'Attraction' | 'Transportation' | 'Accommodation' | 'Meal' | 'Other' | string;
  price: number;
  adultPrice?: number;
  childPrice?: number;
  priceType: 'Per person' | 'Per car' | 'Per room' | 'Per day' | 'Flat rate' | string;
  description?: string;
  createdAt?: any;
}

export interface ProposalLineItem {
  inventoryId?: string;
  name: string;
  type: string;
  price: number;
  adultPrice?: number;
  childPrice?: number;
  priceType: string;
  quantity: number;
  subtotal: number;
  day: number;
  description?: string;
}

export function getItemDescription(item: { name: string; type?: string; description?: string }): string {
  if (item.description && item.description.trim().length > 5) {
    return item.description;
  }
  
  const nameLower = (item.name || '').toLowerCase();
  const typeLower = (item.type || '').toLowerCase();

  if (nameLower.includes('bebek tepi sawah') || nameLower.includes('lunch') || typeLower.includes('meal')) {
    return 'A delicious dining experience featuring authentic local delicacies and scenic views';
  }
  if (nameLower.includes('airport transfer') || nameLower.includes('transportation') || typeLower.includes('transportation')) {
    return 'Comfortable vehicle charter with dedicated AC car, fuel, and driver included';
  }
  if (nameLower.includes('hotel') || nameLower.includes('resort') || typeLower.includes('accommodation')) {
    return 'Luxurious resort stay surrounded by lush tropical landscapes';
  }
  if (nameLower.includes('lempuyang') || nameLower.includes('temple') || typeLower.includes('attraction')) {
    return 'Popular cultural attraction entry ticket with priority access';
  }
  if (typeLower.includes('other')) {
    return 'Licensed tour guide and expert service for personalized commentary';
  }

  return 'Premium included logistics service for a seamless travel experience';
}

export function toRoman(num: number): string {
  const lookup: Record<string, number> = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let roman = '';
  let n = num;
  for (const i in lookup) {
    while (n >= lookup[i]) {
      roman += i;
      n -= lookup[i];
    }
  }
  return roman || String(num);
}

export const getCategoryKey = (type?: string): 'Attraction' | 'Transportation' | 'Accommodation' | 'Meal' | 'Other' => {
  const safeType = (type || '').toLowerCase();
  if (['attraction', 'ticket', 'sightseeing', 'tour', 'itinerary', 'entry', 'activity'].some(k => safeType.includes(k))) return 'Attraction';
  if (['transportation', 'transport', 'car', 'boat', 'transfer', 'driver', 'flight', 'vehicle'].some(k => safeType.includes(k))) return 'Transportation';
  if (['accommodation', 'hotel', 'villa', 'resort', 'stay', 'room'].some(k => safeType.includes(k))) return 'Accommodation';
  if (['meal', 'food', 'dining', 'restaurant', 'breakfast', 'lunch', 'dinner'].some(k => safeType.includes(k))) return 'Meal';
  return 'Other';
};

export const CATEGORY_SECTIONS = [
  { 
    id: 'Attraction', 
    label: 'Attraction', 
    icon: Compass, 
    color: 'orange',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
  },
  { 
    id: 'Transportation', 
    label: 'Transportation', 
    icon: Car, 
    color: 'blue',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
  },
  { 
    id: 'Accommodation', 
    label: 'Accommodation', 
    icon: Hotel, 
    color: 'purple',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
  },
  { 
    id: 'Meal', 
    label: 'Meal', 
    icon: Utensils, 
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  },
  { 
    id: 'Other', 
    label: 'Other', 
    icon: Package, 
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
] as const;

export const getCategoryBadgeClass = (type?: string) => {
  const key = getCategoryKey(type);
  switch (key) {
    case 'Attraction': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
    case 'Transportation': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'Accommodation': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'Meal': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'Other': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
  }
};

export const getCategoryIcon = (type?: string) => {
  const key = getCategoryKey(type);
  switch (key) {
    case 'Attraction': return <Compass className="w-3.5 h-3.5 mr-1" />;
    case 'Transportation': return <Car className="w-3.5 h-3.5 mr-1" />;
    case 'Accommodation': return <Hotel className="w-3.5 h-3.5 mr-1" />;
    case 'Meal': return <Utensils className="w-3.5 h-3.5 mr-1" />;
    case 'Other': return <Package className="w-3.5 h-3.5 mr-1" />;
    default: return <Package className="w-3.5 h-3.5 mr-1" />;
  }
};

export interface ItineraryDayNarrative {
  dayNumber: number;
  title: string;
  summary: string;
  activities: string[];
}

export function formatPaxBreakdown(adults?: number, children?: number, fallbackPax?: number): string {
  const a = Number(adults ?? 0);
  const c = Number(children ?? 0);
  if (a > 0 || c > 0) {
    const adultStr = `${a} Adult${a !== 1 ? 's' : ''}`;
    if (c > 0) {
      return `${adultStr}, ${c} Child${c !== 1 ? 'ren' : ''}`;
    }
    return adultStr;
  }
  const fallback = Number(fallbackPax ?? 1);
  return `${fallback} Guest${fallback !== 1 ? 's' : ''}`;
}

export interface Proposal {
  id?: string;
  proposalTitle: string;
  guestName: string;
  email: string;
  phone: string;
  nationality: string;
  paxCount: number;
  adultsCount?: number;
  childrenCount?: number;
  paxBreakdown?: string;
  durationDays: number;
  marginPercentage: number;
  baseSubtotal: number;
  adultsSubtotal?: number;
  childrenSubtotal?: number;
  marginAmount: number;
  totalPrice: number;
  isCustomPriceEnabled?: boolean;
  customTotalPrice?: number | string;
  currency: string;
  selectedItems: ProposalLineItem[];
  lineItems?: ProposalLineItem[];
  companyName?: string;
  companyLogo?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyWebsite?: string;
  welcomeMessage: string;
  itineraryNarrative: ItineraryDayNarrative[];
  inclusions: string[];
  exclusions: string[];
  termsAndConditions: string[];
  importantTips: string[];
  closingNotes: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Confirmed';
  createdAt?: any;
}

// Preset Global Master Data
const PRESET_INCLUSIONS = [
  "Private Deluxe AC Vehicle with Professional Driver",
  "Licensed English-Speaking Local Tour Guide",
  "All Attraction & Temple Entrance Tickets",
  "Complimentary Daily Cold Mineral Water & Refreshments",
  "Door-to-Door Hotel Pickup and Drop-off",
  "Authentic Buffet / Set Lunch as Detailed in Itinerary",
  "Government Taxes, Service Charges & Toll Fees",
  "Parking Fees & Highway Charges Included"
];

const PRESET_EXCLUSIONS = [
  "International & Domestic Airfare Tickets",
  "Personal Expenses, Shopping & Tipping",
  "Gratuities for Driver and Tour Guide",
  "Personal Travel, Health & Medical Insurance",
  "Alcoholic Beverages & Soft Drinks during Meals",
  "Hotel Accommodation (Unless Explicitly Specified)"
];

const PRESET_TERMS = [
  "50% deposit required upon confirmation to lock reservations.",
  "Remaining 50% balance payable on Day 1 upon arrival.",
  "Cancellations 7+ days prior receive a 100% deposit refund.",
  "Cancellations within 48 hours are non-refundable due to vendor locks.",
  "Itinerary subject to minor adjustments based on weather and traffic.",
  "Quoted prices in IDR/USD are valid for 30 days from proposal date."
];

export const INC_EXC_CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'Transportation', label: '🚗 Transport & Vehicles' },
  { id: 'Admissions & Tickets', label: '🎫 Admissions & Tickets' },
  { id: 'Meals & Refreshments', label: '🍽️ Meals & Refreshments' },
  { id: 'Guiding & Staff', label: '👨‍✈️ Guiding & Staff' },
  { id: 'Accommodations', label: '🏨 Accommodations' },
  { id: 'Fees & Taxes', label: '🏷️ Fees & Taxes' },
  { id: 'Insurance & Personal', label: '🛡️ Insurance & Personal' },
  { id: 'General & Services', label: '📋 General & Services' },
];

export function detectIncExcCategory(text: string): string {
  const lower = (text || '').toLowerCase();
  if (lower.includes('car') || lower.includes('vehicle') || lower.includes('transfer') || lower.includes('flight') || lower.includes('transport') || lower.includes('pickup') || lower.includes('driver')) return 'Transportation';
  if (lower.includes('ticket') || lower.includes('entrance') || lower.includes('temple') || lower.includes('show') || lower.includes('attraction')) return 'Admissions & Tickets';
  if (lower.includes('lunch') || lower.includes('dinner') || lower.includes('meal') || lower.includes('water') || lower.includes('food') || lower.includes('beverage') || lower.includes('drink') || lower.includes('alcoholic')) return 'Meals & Refreshments';
  if (lower.includes('guide') || lower.includes('staff') || lower.includes('coordinator') || lower.includes('gratuities') || lower.includes('tipping')) return 'Guiding & Staff';
  if (lower.includes('hotel') || lower.includes('resort') || lower.includes('room') || lower.includes('stay') || lower.includes('villa') || lower.includes('accommodation')) return 'Accommodations';
  if (lower.includes('tax') || lower.includes('toll') || lower.includes('fee') || lower.includes('parking') || lower.includes('service') || lower.includes('deposit') || lower.includes('refund')) return 'Fees & Taxes';
  if (lower.includes('insurance') || lower.includes('personal') || lower.includes('souvenir') || lower.includes('shopping') || lower.includes('health') || lower.includes('medical')) return 'Insurance & Personal';
  return 'General & Services';
}

export function getIncExcCategoryBadgeClass(category: string): string {
  switch (category) {
    case 'Transportation':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'Admissions & Tickets':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'Meals & Refreshments':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'Guiding & Staff':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'Accommodations':
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    case 'Fees & Taxes':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    case 'Insurance & Personal':
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
}

interface ProposalGeneratorProps {
  isDarkMode?: boolean;
  tenantId?: string;
  initialLead?: any | null;
  onClearInitialLead?: () => void;
}

export default function ProposalGenerator({ 
  isDarkMode = false, 
  tenantId, 
  initialLead, 
  onClearInitialLead 
}: ProposalGeneratorProps) {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'inventory' | 'inclusions_exclusions' | 'history'>('create');

  // Incoming Leads from AI Trip Planner
  const [incomingLeads, setIncomingLeads] = useState<any[]>([]);
  const [isLeadsDrawerOpen, setIsLeadsDrawerOpen] = useState<boolean>(false);
  const [linkedInquiryId, setLinkedInquiryId] = useState<string | null>(null);

  // Published Tours from Catalog for Quick Import
  const [availableTours, setAvailableTours] = useState<any[]>([]);
  const [isTourModalOpen, setIsTourModalOpen] = useState<boolean>(false);
  const [tourSearch, setTourSearch] = useState<string>('');

  // Mobile studio view switcher
  const [mobileStudioTab, setMobileStudioTab] = useState<'editor' | 'preview'>('editor');

  // Inline custom stop adder state per day
  const [inlineStopInput, setInlineStopInput] = useState<{ [day: number]: { name: string; type: string; price: number } }>({});
  const [editingDayTitles, setEditingDayTitles] = useState<{ [day: number]: string }>({});

  // Inclusions, Exclusions & Terms Manager State
  const [incExcManagerTab, setIncExcManagerTab] = useState<'inclusions' | 'exclusions' | 'terms'>('inclusions');
  const [incExcSearch, setIncExcSearch] = useState('');
  const [incExcCategoryFilter, setIncExcCategoryFilter] = useState('all');
  const [isIncExcModalOpen, setIsIncExcModalOpen] = useState(false);
  const [editingIncExcItem, setEditingIncExcItem] = useState<{
    type: 'inclusions' | 'exclusions' | 'terms';
    index?: number;
    text: string;
  } | null>(null);

  // Company / Tenant Branding Information State
  const [companyName, setCompanyName] = useState('Smart Bali Tours & Travel');
  const [companyLogo, setCompanyLogo] = useState('https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=200&q=80');
  const [companyEmail, setCompanyEmail] = useState('info@smartbalitours.com');
  const [companyPhone, setCompanyPhone] = useState('+62 812-3456-7890');
  const [companyAddress, setCompanyAddress] = useState('Jl. Sunset Road No. 88, Seminyak, Kuta, Bali 80361');
  const [companyWebsite, setCompanyWebsite] = useState('www.smartbalitours.com');
  const [showBrandConfig, setShowBrandConfig] = useState(false);

  // Inventory state
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [inventorySortMethod, setInventorySortMethod] = useState<'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'type'>('default');

  // Inventory Modal state
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<Partial<InventoryItem> | null>(null);
  const [isSavingInventory, setIsSavingInventory] = useState(false);

  // Proposal Form state
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [paxCount, setPaxCount] = useState<number>(2);

  useEffect(() => {
    setPaxCount((adultsCount || 0) + (childrenCount || 0));
  }, [adultsCount, childrenCount]);

  const [durationDays, setDurationDays] = useState<number>(3);
  const [marginPercentage, setMarginPercentage] = useState<number>(15);
  const [currency, setCurrency] = useState('IDR');
  const [specialNotes, setSpecialNotes] = useState('');

  // Manual Total Price Override State
  const [isCustomPriceEnabled, setIsCustomPriceEnabled] = useState<boolean>(false);
  const [customTotalPrice, setCustomTotalPrice] = useState<number | string>('');

  // Itinerary Line Items (Day assigned)
  const [selectedLineItems, setSelectedLineItems] = useState<ProposalLineItem[]>([]);

  // Master Data Banks for Inclusions, Exclusions & Terms
  const [masterInclusions, setMasterInclusions] = useState<string[]>([...PRESET_INCLUSIONS]);
  const [masterExclusions, setMasterExclusions] = useState<string[]>([...PRESET_EXCLUSIONS]);
  const [masterTerms, setMasterTerms] = useState<string[]>([...PRESET_TERMS]);
  const [newMasterInclusionInput, setNewMasterInclusionInput] = useState('');
  const [newMasterExclusionInput, setNewMasterExclusionInput] = useState('');

  // Bank Picker Modal State for Inclusions, Exclusions & Terms
  const [bankPickerModal, setBankPickerModal] = useState<'inclusions' | 'exclusions' | 'terms' | null>(null);
  const [bankPickerSearch, setBankPickerSearch] = useState('');
  const [bankPickerCustomInput, setBankPickerCustomInput] = useState('');

  // Brand config saving state
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [brandSaveSuccess, setBrandSaveSuccess] = useState(false);

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [customerEmailInput, setCustomerEmailInput] = useState('');
  const [emailSubjectInput, setEmailSubjectInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Inventory / Attraction Picker Modal State
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  const [targetPickerDay, setTargetPickerDay] = useState<number>(1);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategoryFilter, setPickerCategoryFilter] = useState<string>('all');
  const [pickedNotification, setPickedNotification] = useState<string | null>(null);

  // Catalog Sub-tab State
  const [catalogSubTab, setCatalogSubTab] = useState<'inventory' | 'inclusions' | 'exclusions'>('inventory');

  // Unified Drag State across 6 categories
  const [draggedCatalogItem, setDraggedCatalogItem] = useState<{
    kind: 'inventory' | 'inclusion' | 'exclusion';
    data: InventoryItem | string;
  } | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<{ 
    day: number; 
    target: 'Attraction' | 'Transportation' | 'Accommodation' | 'Meal' | 'Other' | string
  } | null>(null);

  // Legacy Drag State compatibility
  const [draggedInventoryItem, setDraggedInventoryItem] = useState<InventoryItem | null>(null);
  const [activeDropDay, setActiveDropDay] = useState<number | null>(null);

  // Category Expand / Collapse Box State for Inventory Catalog Sidebar
  const [collapsedCatalogCategories, setCollapsedCatalogCategories] = useState<Record<string, boolean>>({
    itinerary: false,
    transport: false,
    accommodation: false,
    food: false,
    inclusion: false,
    exclusion: false,
  });

  // Category Expand / Collapse Box State for Day-by-Day Builder
  const [collapsedDaySections, setCollapsedDaySections] = useState<Record<string, boolean>>({});

  const toggleCatalogCategoryCollapse = (catId: string) => {
    setCollapsedCatalogCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const expandAllCatalogCategories = () => {
    setCollapsedCatalogCategories({
      itinerary: false,
      transport: false,
      accommodation: false,
      food: false,
      inclusion: false,
      exclusion: false,
    });
  };

  const collapseAllCatalogCategories = () => {
    setCollapsedCatalogCategories({
      itinerary: true,
      transport: true,
      accommodation: true,
      food: true,
      inclusion: true,
      exclusion: true,
    });
  };

  const toggleDaySectionCollapse = (dayNum: number, sectionId: string) => {
    const key = `d${dayNum}-${sectionId}`;
    setCollapsedDaySections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Collapse / Expand Day State for Builder & Document Preview
  const [collapsedBuilderDays, setCollapsedBuilderDays] = useState<Record<number, boolean>>({});
  const [collapsedDocDays, setCollapsedDocDays] = useState<Record<number, boolean>>({});

  const toggleBuilderDayCollapse = (dayNum: number) => {
    setCollapsedBuilderDays(prev => ({ ...prev, [dayNum]: !prev[dayNum] }));
  };

  const expandAllBuilderDays = () => {
    setCollapsedBuilderDays({});
  };

  const collapseAllBuilderDays = () => {
    const allCollapsed: Record<number, boolean> = {};
    for (let i = 1; i <= durationDays; i++) {
      allCollapsed[i] = true;
    }
    setCollapsedBuilderDays(allCollapsed);
  };

  const toggleDocDayCollapse = (dayNum: number) => {
    setCollapsedDocDays(prev => ({ ...prev, [dayNum]: !prev[dayNum] }));
  };

  const expandAllDocDays = () => {
    setCollapsedDocDays({});
  };

  const collapseAllDocDays = () => {
    if (!generatedProposal) return;
    const allCollapsed: Record<number, boolean> = {};
    generatedProposal.itineraryNarrative.forEach(day => {
      allCollapsed[day.dayNumber] = true;
    });
    setCollapsedDocDays(allCollapsed);
  };

  // Inclusions, Exclusions, Terms Selected State
  const [selectedInclusions, setSelectedInclusions] = useState<string[]>([...PRESET_INCLUSIONS.slice(0, 5)]);
  const [selectedExclusions, setSelectedExclusions] = useState<string[]>([...PRESET_EXCLUSIONS.slice(0, 4)]);
  const [selectedTerms, setSelectedTerms] = useState<string[]>([...PRESET_TERMS.slice(0, 5)]);

  // Custom Input States for Inclusions / Exclusions / Terms
  const [customInclusionInput, setCustomInclusionInput] = useState('');
  const [customExclusionInput, setCustomExclusionInput] = useState('');
  const [customTermsInput, setCustomTermsInput] = useState('');

  // AI Generation & Output state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState<Proposal | null>(null);
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [copiedProposalLink, setCopiedProposalLink] = useState(false);
  const [savedProposals, setSavedProposals] = useState<Proposal[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSavingProposal, setIsSavingProposal] = useState(false);

  // Live Revision / Editing View Mode
  const [previewViewMode, setPreviewViewMode] = useState<'document' | 'revise'>('document');

  // Load Inventory from Firestore
  useEffect(() => {
    const defaultSeedItems: InventoryItem[] = [
      { id: 'seed-1', name: 'Lempuyang Temple Entrance Ticket', type: 'Attraction', price: 100000, adultPrice: 100000, childPrice: 50000, priceType: 'Per person', description: 'Spiritual temple entry ticket featuring the iconic Gates of Heaven photo spot' },
      { id: 'seed-2', name: 'Avanza MPV Private Car Charter', type: 'Transportation', price: 600000, adultPrice: 600000, childPrice: 0, priceType: 'Per car', description: 'Private AC vehicle charter with dedicated driver, petrol, and parking included' },
      { id: 'seed-3', name: 'Maya Ubud Resort & Spa (Deluxe Room)', type: 'Accommodation', price: 1200000, adultPrice: 1200000, childPrice: 0, priceType: 'Per room', description: 'Luxurious resort stay surrounded by lush tropical valley greenery' },
      { id: 'seed-4', name: 'Lunch at Bebek Tepi Sawah', type: 'Meal', price: 150000, adultPrice: 150000, childPrice: 90000, priceType: 'Per person', description: 'A delicious lunch served in a traditional restaurant with rice terrace view' },
      { id: 'seed-5', name: 'Private Licensed English Tour Guide', type: 'Other', price: 400000, adultPrice: 400000, childPrice: 0, priceType: 'Per day', description: 'Licensed English-speaking local expert guide for personalized cultural commentary' },
      { id: 'seed-6', name: 'Traditional Balinese Barong Dance Ticket', type: 'Attraction', price: 150000, adultPrice: 150000, childPrice: 75000, priceType: 'Per person', description: 'Traditional Balinese cultural performance ticket showcasing local mythology and music' },
      { id: 'seed-7', name: 'Airport Transfer (Private AC Van)', type: 'Transportation', price: 350000, adultPrice: 350000, childPrice: 0, priceType: 'Per car', description: 'Comfortable transfer to the airport with AC car' }
    ];

    let unsubscribe = () => {};
    try {
      const invRef = collection(db, 'inventory_items');
      unsubscribe = onSnapshot(invRef, (snapshot) => {
        if (!snapshot || snapshot.empty) {
          setInventoryList(defaultSeedItems);
          setLoadingInventory(false);
          return;
        }

        const items = snapshot.docs.map(docSnap => {
          const d = docSnap.data();
          const adultP = Number(d.adultPrice ?? d.price) || 0;
          const childP = Number(d.childPrice) || 0;
          return {
            id: docSnap.id,
            name: d.name || 'Untitled Item',
            type: getCategoryKey(d.type),
            price: adultP,
            adultPrice: adultP,
            childPrice: childP,
            priceType: d.priceType || 'Per person',
            description: d.description || ''
          };
        }) as InventoryItem[];

        setInventoryList(items);
        setLoadingInventory(false);
      }, (err) => {
        console.error("Error loading inventory items, falling back to seed:", err);
        setInventoryList(defaultSeedItems);
        setLoadingInventory(false);
      });
    } catch (e) {
      console.error("Error subscribing to inventory snapshot:", e);
      setInventoryList(defaultSeedItems);
      setLoadingInventory(false);
    }

    return () => {
      try { unsubscribe(); } catch (_) {}
    };
  }, []);

  // Load Saved Proposals from Firestore
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const propRef = collection(db, 'proposals');
      unsubscribe = onSnapshot(propRef, (snapshot) => {
        if (!snapshot) return;
        const proposals = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          proposalTitle: docSnap.data().proposalTitle || 'Saved Proposal',
          guestName: docSnap.data().guestName || 'Guest',
          paxCount: docSnap.data().paxCount || 1,
          durationDays: docSnap.data().durationDays || 1,
          totalPrice: docSnap.data().totalPrice || 0,
          currency: docSnap.data().currency || 'IDR',
          ...docSnap.data()
        })) as Proposal[];

        setSavedProposals(proposals);
      }, (err) => {
        console.error("Error loading proposals:", err);
      });
    } catch (e) {
      console.error("Error subscribing to proposals snapshot:", e);
    }

    return () => {
      try { unsubscribe(); } catch (_) {}
    };
  }, []);

  // Live sync master inclusions/exclusions/terms from Firestore preset_data
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const presetRef = doc(db, 'settings', 'preset_data');
      unsubscribe = onSnapshot(presetRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.inclusions) && data.inclusions.length > 0) {
            setMasterInclusions(data.inclusions);
          }
          if (Array.isArray(data.exclusions) && data.exclusions.length > 0) {
            setMasterExclusions(data.exclusions);
          }
          if (Array.isArray(data.terms) && data.terms.length > 0) {
            setMasterTerms(data.terms);
          }
        }
      }, (err) => {
        console.warn("Preset data live fetch notice:", err);
      });
    } catch (e) {
      console.warn("Error setting preset_data listener:", e);
    }
    return () => { try { unsubscribe(); } catch (_) {} };
  }, []);

  // Live sync incoming inquiries from AI Trip Planner
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const inqRef = collection(db, 'inquiries');
      unsubscribe = onSnapshot(inqRef, (snap) => {
        if (!snap) return;
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a: any, b: any) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return tB - tA;
        });
        setIncomingLeads(list);
      }, (err) => {
        console.warn("Inquiries listener notice:", err);
      });
    } catch (e) {
      console.warn("Error setting inquiries listener:", e);
    }
    return () => { try { unsubscribe(); } catch (_) {} };
  }, []);

  // Live sync published tours from catalog
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const tourRef = collection(db, 'tours');
      unsubscribe = onSnapshot(tourRef, (snap) => {
        if (!snap) return;
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAvailableTours(list);
      }, (err) => {
        console.warn("Tours listener notice:", err);
      });
    } catch (e) {
      console.warn("Error setting tours listener:", e);
    }
    return () => { try { unsubscribe(); } catch (_) {} };
  }, []);

  // Load Lead into Proposal Workflow
  const handleLoadInquiryLead = (inq: any) => {
    setGuestName(inq.userName || 'Valued Guest');
    setEmail(inq.userEmail || '');
    setPhone(inq.userPhone || '');

    // Parse pax count
    let adults = 2;
    let children = 0;
    const personVal = String(inq.formData?.persons || '');
    if (personVal.includes('Just me') || personVal.includes('1 Person')) {
      adults = 1;
    } else {
      const match = personVal.match(/\d+/);
      if (match) adults = parseInt(match[0], 10) || 2;
    }
    setAdultsCount(adults);
    setChildrenCount(children);
    setPaxCount(adults + children);

    // Parse duration
    let days = 3;
    const rawDays = inq.itinerary?.dailyPlans || inq.itinerary?.days || [];
    if (rawDays.length > 0) {
      days = rawDays.length;
    } else if (inq.formData?.duration) {
      days = parseInt(inq.formData.duration, 10) || 3;
    }
    setDurationDays(Math.max(1, Math.min(30, days)));

    // Extract activities and build line items & narrative
    const newLineItems: ProposalLineItem[] = [];
    const narrative: ItineraryDayNarrative[] = [];
    const newTitles: { [day: number]: string } = {};

    rawDays.forEach((d: any, idx: number) => {
      const dayNum = d.day || idx + 1;
      const dayTitle = d.title || d.dayTitle || `Day ${dayNum}: Exploration`;
      newTitles[dayNum] = dayTitle;
      const acts = d.activities || [];

      narrative.push({
        dayNumber: dayNum,
        title: dayTitle,
        summary: acts.map((a: any) => `${a.time ? a.time + ' - ' : ''}${a.title || a.name}`).join('. ') || `Day program highlights for ${dayTitle}`,
        activities: acts.map((a: any) => a.title || a.name || 'Activity')
      });

      acts.forEach((act: any) => {
        const actTitle = act.title || act.name || 'Activity';
        const isTransport = actTitle.toLowerCase().includes('pickup') || actTitle.toLowerCase().includes('transfer') || actTitle.toLowerCase().includes('drive') || actTitle.toLowerCase().includes('car');
        const isMeal = actTitle.toLowerCase().includes('lunch') || actTitle.toLowerCase().includes('dinner') || actTitle.toLowerCase().includes('breakfast') || actTitle.toLowerCase().includes('culinary');
        const isStay = actTitle.toLowerCase().includes('hotel') || actTitle.toLowerCase().includes('resort') || actTitle.toLowerCase().includes('check-in') || actTitle.toLowerCase().includes('villa');
        const type = isTransport ? 'Transportation' : isMeal ? 'Meal' : isStay ? 'Accommodation' : 'Attraction';

        newLineItems.push({
          inventoryId: `lead_${dayNum}_${Math.random().toString(36).substring(2, 7)}`,
          name: actTitle,
          type,
          price: 0,
          adultPrice: 0,
          childPrice: 0,
          priceType: 'Per person',
          quantity: 1,
          subtotal: 0,
          day: dayNum,
          description: act.description || act.location || ''
        });
      });
    });

    if (newLineItems.length > 0) {
      setSelectedLineItems(newLineItems);
    }
    setEditingDayTitles(newTitles);

    // Capture guest preferences into specialNotes
    const prefList = [
      inq.summary ? `Visitor Trip Summary: ${inq.summary}` : '',
      inq.formData?.interests ? `Interests: ${inq.formData.interests}` : '',
      inq.formData?.experience || inq.formData?.vibe ? `Vibe: ${inq.formData.experience || inq.formData.vibe}` : '',
      inq.formData?.budget ? `Budget Range: ${inq.formData.budget}` : '',
      inq.formData?.hotelType ? `Hotel Preference: ${inq.formData.hotelType}` : '',
      inq.formData?.from ? `Traveling From: ${inq.formData.from}` : ''
    ].filter(Boolean);

    setSpecialNotes(prefList.join('\n'));
    setLinkedInquiryId(inq.id);

    // Build draft proposal object for instant preview
    const fullProposal: Proposal = {
      proposalTitle: inq.planTitle || `Custom Tour Proposal for ${inq.userName || 'Guest'}`,
      guestName: inq.userName || 'Valued Guest',
      email: inq.userEmail || '',
      phone: inq.userPhone || '',
      nationality: '',
      paxCount: adults + children,
      adultsCount: adults,
      childrenCount: children,
      paxBreakdown: formatPaxBreakdown(adults, children),
      durationDays: days,
      marginPercentage: 15,
      baseSubtotal: 0,
      adultsSubtotal: 0,
      childrenSubtotal: 0,
      marginAmount: 0,
      totalPrice: 0,
      isCustomPriceEnabled: false,
      customTotalPrice: '',
      currency,
      selectedItems: newLineItems,
      companyName,
      companyLogo,
      companyEmail,
      companyPhone,
      companyAddress,
      companyWebsite,
      welcomeMessage: inq.summary 
        ? `Dear ${inq.userName || 'Guest'}, thank you for crafting your vacation on our website's AI Trip Planner! We are thrilled to present this customized official proposal based on your exact itinerary.`
        : `Dear ${inq.userName || 'Guest'}, we are delighted to share your tailored travel proposal with dedicated vehicles, licensed guides, and curated experiences.`,
      itineraryNarrative: narrative.length > 0 ? narrative : Array.from({ length: days }, (_, i) => ({
        dayNumber: i + 1,
        title: `Day ${i + 1}: Highlights & Exploration`,
        summary: `Custom exploration and private touring program.`,
        activities: []
      })),
      inclusions: PRESET_INCLUSIONS.slice(0, 6),
      exclusions: PRESET_EXCLUSIONS.slice(0, 4),
      termsAndConditions: masterTerms.slice(0, 5),
      importantTips: [
        "Private AC vehicle with dedicated driver-guide included throughout.",
        "Pickup and drop-off coordinated directly via WhatsApp prior to tour dates.",
        "Comfortable clothing, walking shoes, and sunglasses recommended."
      ],
      closingNotes: `We look forward to hosting you! Reach out to us via WhatsApp (${companyPhone}) with any questions or custom tweaks.`,
      status: 'Draft'
    };

    setGeneratedProposal(fullProposal);
    setIsLeadsDrawerOpen(false);
    onClearInitialLead?.();
    setPickedNotification(`Loaded travel plan from ${inq.userName || 'Guest'}!`);
    setTimeout(() => setPickedNotification(null), 3500);
  };

  // Import Existing Tour from Catalog
  const handleImportTour = (tour: any) => {
    const days = Math.max(1, (tour.itinerary?.length || 1));
    setDurationDays(days);
    const tourTitle = tour.title || 'Tour Package';
    setGuestName(guestName || 'Valued Guest');

    const narrative: ItineraryDayNarrative[] = (tour.itinerary || []).map((d: any, idx: number) => ({
      dayNumber: d.day || idx + 1,
      title: d.title || `Day ${d.day || idx + 1}`,
      summary: d.description || '',
      activities: [d.title || `Day ${d.day} Program`]
    }));

    const newTitles: { [day: number]: string } = {};
    (tour.itinerary || []).forEach((d: any, idx: number) => {
      newTitles[d.day || idx + 1] = d.title || `Day ${d.day || idx + 1}`;
    });
    setEditingDayTitles(newTitles);

    const lineItems: ProposalLineItem[] = (tour.itinerary || []).map((d: any, idx: number) => ({
      inventoryId: `tour_${d.day || idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
      name: d.title || `Day ${d.day || idx + 1} Program`,
      type: 'Attraction',
      price: tour.price ? Math.round(tour.price / days) : 0,
      adultPrice: tour.price ? Math.round(tour.price / days) : 0,
      childPrice: 0,
      priceType: 'Per person',
      quantity: 1,
      subtotal: tour.price ? Math.round(tour.price / days) * paxCount : 0,
      day: d.day || idx + 1,
      description: d.description || ''
    }));

    setSelectedLineItems(lineItems);
    if (Array.isArray(tour.inclusions) && tour.inclusions.length > 0) {
      setSelectedInclusions(tour.inclusions);
    }
    if (Array.isArray(tour.exclusions) && tour.exclusions.length > 0) {
      setSelectedExclusions(tour.exclusions);
    }

    setSpecialNotes(tour.description || '');

    const draft: Proposal = {
      proposalTitle: `Official Proposal: ${tourTitle}`,
      guestName: guestName || 'Valued Guest',
      email,
      phone,
      nationality,
      paxCount,
      adultsCount,
      childrenCount,
      paxBreakdown: formatPaxBreakdown(adultsCount, childrenCount),
      durationDays: days,
      marginPercentage,
      baseSubtotal,
      adultsSubtotal: pricingBreakdown.adultsSubtotal,
      childrenSubtotal: pricingBreakdown.childrenSubtotal,
      marginAmount,
      totalPrice,
      isCustomPriceEnabled,
      customTotalPrice,
      currency,
      selectedItems: lineItems,
      companyName,
      companyLogo,
      companyEmail,
      companyPhone,
      companyAddress,
      companyWebsite,
      welcomeMessage: `Dear ${guestName || 'Guest'}, thank you for your interest in our "${tourTitle}". We have tailored this proposal for your group.`,
      itineraryNarrative: narrative.length > 0 ? narrative : Array.from({ length: days }, (_, i) => ({
        dayNumber: i + 1,
        title: `Day ${i + 1}: Exploration`,
        summary: '',
        activities: []
      })),
      inclusions: tour.inclusions || selectedInclusions,
      exclusions: tour.exclusions || selectedExclusions,
      termsAndConditions: masterTerms.slice(0, 5),
      importantTips: [
        "Private AC vehicle with dedicated driver-guide included throughout.",
        "Pickup and drop-off coordinated directly via WhatsApp.",
        "Comfortable clothing, walking shoes, and sunglasses recommended."
      ],
      closingNotes: `We look forward to hosting you! Reach out to us anytime on WhatsApp (${companyPhone}) to confirm your booking.`,
      status: 'Draft'
    };

    setGeneratedProposal(draft);
    setIsTourModalOpen(false);
    setPickedNotification(`Loaded tour "${tourTitle}" into proposal!`);
    setTimeout(() => setPickedNotification(null), 3000);
  };

  // Handle initialLead passed from parent (e.g., Inquiries table in Admin.tsx)
  useEffect(() => {
    if (initialLead) {
      handleLoadInquiryLead(initialLead);
      setActiveSubTab('create');
    }
  }, [initialLead]);

  // Quick Add Custom Stop directly into Day
  const handleQuickAddCustomStop = (day: number, name: string, type: string, price: number = 0) => {
    const p = Number(price) || 0;
    const newItem: ProposalLineItem = {
      inventoryId: `custom_${day}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      type: getCategoryKey(type),
      price: p,
      adultPrice: p,
      childPrice: 0,
      priceType: 'Per person',
      quantity: 1,
      subtotal: p * paxCount,
      day,
      description: `Custom ${type.toLowerCase()} stop`
    };

    setSelectedLineItems(prev => [...prev, newItem]);
    setPickedNotification(`Added "${name}" to Day ${day}`);
    setTimeout(() => setPickedNotification(null), 2000);
  };

  // Manager Helper Handlers for Inclusions, Exclusions & Terms
  const handleOpenAddIncExc = (type: 'inclusions' | 'exclusions' | 'terms') => {
    setEditingIncExcItem({ type, text: '' });
    setIsIncExcModalOpen(true);
  };

  const handleOpenEditIncExc = (type: 'inclusions' | 'exclusions' | 'terms', index: number, currentText: string) => {
    setEditingIncExcItem({ type, index, text: currentText });
    setIsIncExcModalOpen(true);
  };

  const handleSaveIncExcModal = () => {
    if (!editingIncExcItem || !editingIncExcItem.text.trim()) {
      alert("Please enter valid item text.");
      return;
    }

    const { type, index, text } = editingIncExcItem;
    const cleanText = text.trim();

    let list = type === 'inclusions' 
      ? [...masterInclusions] 
      : type === 'exclusions' 
      ? [...masterExclusions] 
      : [...masterTerms];

    if (index !== undefined && index >= 0 && index < list.length) {
      const oldText = list[index];
      list[index] = cleanText;
      if (type === 'inclusions') {
        setSelectedInclusions(prev => prev.map(item => item === oldText ? cleanText : item));
      } else if (type === 'exclusions') {
        setSelectedExclusions(prev => prev.map(item => item === oldText ? cleanText : item));
      } else if (type === 'terms') {
        setSelectedTerms(prev => prev.map(item => item === oldText ? cleanText : item));
      }
    } else {
      if (!list.includes(cleanText)) {
        list.push(cleanText);
      }
      if (type === 'inclusions' && !selectedInclusions.includes(cleanText)) {
        setSelectedInclusions(prev => [...prev, cleanText]);
      } else if (type === 'exclusions' && !selectedExclusions.includes(cleanText)) {
        setSelectedExclusions(prev => [...prev, cleanText]);
      } else if (type === 'terms' && !selectedTerms.includes(cleanText)) {
        setSelectedTerms(prev => [...prev, cleanText]);
      }
    }

    if (type === 'inclusions') setMasterInclusions(list);
    else if (type === 'exclusions') setMasterExclusions(list);
    else setMasterTerms(list);

    savePresetData(type, list);
    setIsIncExcModalOpen(false);
    setEditingIncExcItem(null);
  };

  const handleMoveIncExcItem = (type: 'inclusions' | 'exclusions' | 'terms', index: number, direction: 'up' | 'down') => {
    let list = type === 'inclusions' ? [...masterInclusions] : type === 'exclusions' ? [...masterExclusions] : [...masterTerms];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    if (type === 'inclusions') setMasterInclusions(list);
    else if (type === 'exclusions') setMasterExclusions(list);
    else setMasterTerms(list);

    savePresetData(type, list);
  };

  const handleDeleteIncExcItem = (type: 'inclusions' | 'exclusions' | 'terms', index: number) => {
    let list = type === 'inclusions' ? [...masterInclusions] : type === 'exclusions' ? [...masterExclusions] : [...masterTerms];
    const itemToDelete = list[index];

    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}: "${itemToDelete}"?`)) return;

    const updated = list.filter((_, i) => i !== index);

    if (type === 'inclusions') {
      setMasterInclusions(updated);
      setSelectedInclusions(prev => prev.filter(i => i !== itemToDelete));
    } else if (type === 'exclusions') {
      setMasterExclusions(updated);
      setSelectedExclusions(prev => prev.filter(i => i !== itemToDelete));
    } else {
      setMasterTerms(updated);
      setSelectedTerms(prev => prev.filter(i => i !== itemToDelete));
    }

    savePresetData(type, updated);
  };

  const handleResetToDefaults = (type: 'inclusions' | 'exclusions' | 'terms') => {
    if (!window.confirm(`Reset all ${type} back to default factory list? This will overwrite custom edits.`)) return;

    let defaults = type === 'inclusions' ? [...PRESET_INCLUSIONS] : type === 'exclusions' ? [...PRESET_EXCLUSIONS] : [...PRESET_TERMS];

    if (type === 'inclusions') {
      setMasterInclusions(defaults);
      setSelectedInclusions(defaults.slice(0, 5));
    } else if (type === 'exclusions') {
      setMasterExclusions(defaults);
      setSelectedExclusions(defaults.slice(0, 4));
    } else {
      setMasterTerms(defaults);
      setSelectedTerms(defaults.slice(0, 5));
    }

    savePresetData(type, defaults);
  };

  const currentIncExcList = useMemo(() => {
    if (incExcManagerTab === 'inclusions') return masterInclusions;
    if (incExcManagerTab === 'exclusions') return masterExclusions;
    return masterTerms;
  }, [incExcManagerTab, masterInclusions, masterExclusions, masterTerms]);

  const filteredIncExcItems = useMemo(() => {
    return currentIncExcList.map((text, originalIndex) => ({
      text,
      originalIndex,
      category: detectIncExcCategory(text)
    })).filter(item => {
      const searchLower = incExcSearch.toLowerCase().trim();
      const matchesSearch = !searchLower || item.text.toLowerCase().includes(searchLower) || item.category.toLowerCase().includes(searchLower);
      const matchesCategory = incExcCategoryFilter === 'all' || item.category === incExcCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [currentIncExcList, incExcSearch, incExcCategoryFilter]);

  // Filtered and sorted inventory list
  const filteredInventory = useMemo(() => {
    const filtered = (inventoryList || []).filter(item => {
      if (!item) return false;
      const typeStr = (item.type || 'Extra').toLowerCase();
      const catKey = getCategoryKey(item.type).toLowerCase();
      const nameStr = (item.name || '').toLowerCase();
      const descStr = (item.description || '').toLowerCase();
      
      const matchesCategory = inventoryCategoryFilter === 'all' || 
        typeStr === inventoryCategoryFilter.toLowerCase() || 
        catKey === inventoryCategoryFilter.toLowerCase();
      
      const searchLower = inventorySearch.toLowerCase().trim();
      const matchesSearch = !searchLower || nameStr.includes(searchLower) || descStr.includes(searchLower) || typeStr.includes(searchLower);
      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (inventorySortMethod === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (inventorySortMethod === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (inventorySortMethod === 'price-asc') {
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      }
      if (inventorySortMethod === 'price-desc') {
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      }
      if (inventorySortMethod === 'type') {
        return (a.type || '').localeCompare(b.type || '');
      }
      return 0; // default category grouping
    });
  }, [inventoryList, inventoryCategoryFilter, inventorySearch, inventorySortMethod]);

  // Detailed Pricing Calculations (Adults Subtotal, Children Subtotal, Base Subtotal, Margin, Custom Override)
  const pricingBreakdown = useMemo(() => {
    let adultsSubtotal = 0;
    let childrenSubtotal = 0;

    selectedLineItems.forEach(item => {
      const adultP = Number(item.adultPrice ?? item.price ?? 0);
      const childP = Number(item.childPrice ?? 0);
      const qty = Number(item.quantity || 1);

      if (item.priceType === 'Per person') {
        adultsSubtotal += qty * (adultsCount || 0) * adultP;
        childrenSubtotal += qty * (childrenCount || 0) * childP;
      } else {
        adultsSubtotal += qty * adultP;
      }
    });

    const baseSubtotal = adultsSubtotal + childrenSubtotal;
    const marginAmount = (baseSubtotal * (marginPercentage || 0)) / 100;
    const calculatedTotalPrice = baseSubtotal + marginAmount;

    let finalTotalPrice = calculatedTotalPrice;
    if (isCustomPriceEnabled && customTotalPrice !== '' && !isNaN(Number(customTotalPrice))) {
      finalTotalPrice = Number(customTotalPrice);
    }

    return {
      adultsSubtotal,
      childrenSubtotal,
      baseSubtotal,
      marginAmount,
      calculatedTotalPrice,
      finalTotalPrice
    };
  }, [selectedLineItems, adultsCount, childrenCount, marginPercentage, isCustomPriceEnabled, customTotalPrice]);

  const baseSubtotal = pricingBreakdown.baseSubtotal;
  const marginAmount = pricingBreakdown.marginAmount;
  const totalPrice = pricingBreakdown.finalTotalPrice;

  // Real-time Dynamic Proposal Document Builder for Live Studio Preview
  const buildProposalFromCurrentState = (): Proposal => {
    const currentNarrative: ItineraryDayNarrative[] = Array.from({ length: durationDays }, (_, idx) => {
      const dayNum = idx + 1;
      const itemsForDay = selectedLineItems.filter(i => i.day === dayNum);
      const existing = generatedProposal?.itineraryNarrative?.find(n => n.dayNumber === dayNum);
      const dayTitle = editingDayTitles[dayNum] || existing?.title || `Day ${dayNum}: Exploration & Activities`;
      return {
        dayNumber: dayNum,
        title: dayTitle,
        summary: existing?.summary || (itemsForDay.length > 0 ? itemsForDay.map(i => i.name).join(' • ') : 'Personalized private tour schedule and sightseeing program'),
        activities: itemsForDay.map(i => i.name)
      };
    });

    return {
      proposalTitle: generatedProposal?.proposalTitle || `Custom Tour Proposal for ${guestName || 'Valued Guest'}`,
      guestName: guestName || 'Valued Guest',
      email,
      phone,
      nationality,
      paxCount,
      adultsCount,
      childrenCount,
      paxBreakdown: formatPaxBreakdown(adultsCount, childrenCount),
      durationDays,
      marginPercentage,
      baseSubtotal,
      adultsSubtotal: pricingBreakdown.adultsSubtotal,
      childrenSubtotal: pricingBreakdown.childrenSubtotal,
      marginAmount,
      totalPrice,
      isCustomPriceEnabled,
      customTotalPrice,
      currency,
      selectedItems: selectedLineItems,
      companyName,
      companyLogo,
      companyEmail,
      companyPhone,
      companyAddress,
      companyWebsite,
      welcomeMessage: generatedProposal?.welcomeMessage || `Dear ${guestName || 'Valued Guest'}, thank you for contacting us! We are delighted to present your tailored itinerary designed specifically for your travel dates and group preferences.`,
      itineraryNarrative: generatedProposal?.itineraryNarrative || currentNarrative,
      inclusions: selectedInclusions.length > 0 ? selectedInclusions : PRESET_INCLUSIONS.slice(0, 6),
      exclusions: selectedExclusions.length > 0 ? selectedExclusions : PRESET_EXCLUSIONS.slice(0, 4),
      termsAndConditions: selectedTerms.length > 0 ? selectedTerms : masterTerms.slice(0, 5),
      importantTips: generatedProposal?.importantTips || [
        "Private AC vehicle with dedicated driver-guide included throughout.",
        "Comfortable clothing, walking shoes, and sunglasses recommended.",
        "Pick-up timings confirmed directly via WhatsApp prior to tour dates."
      ],
      closingNotes: generatedProposal?.closingNotes || `We look forward to creating unforgettable memories with you! Reach out to us anytime on WhatsApp (${companyPhone}) to confirm your booking or request adjustments.`,
      status: 'Draft'
    };
  };

  const activeProposalDoc = generatedProposal || buildProposalFromCurrentState();

  // Inventory Item Management Functions
  const handleOpenAddInventory = () => {
    setEditingInventoryItem({
      name: '',
      type: 'Attraction',
      price: 100000,
      adultPrice: 100000,
      childPrice: 50000,
      priceType: 'Per person',
      description: ''
    });
    setIsInventoryModalOpen(true);
  };

  const handleEditInventory = (item: InventoryItem) => {
    setEditingInventoryItem({
      ...item,
      type: getCategoryKey(item.type),
      adultPrice: item.adultPrice ?? item.price ?? 0,
      childPrice: item.childPrice ?? 0
    });
    setIsInventoryModalOpen(true);
  };

  const handleDeleteInventory = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this inventory item?")) return;
    try {
      await deleteDoc(doc(db, 'inventory_items', id));
    } catch (err: any) {
      alert("Error deleting inventory item: " + err.message);
    }
  };

  const handleSaveInventoryItem = async () => {
    if (!editingInventoryItem?.name?.trim()) {
      alert("Please enter an item name.");
      return;
    }

    setIsSavingInventory(true);
    try {
      const adultPrice = Number(editingInventoryItem.adultPrice ?? editingInventoryItem.price) >= 0 
        ? Number(editingInventoryItem.adultPrice ?? editingInventoryItem.price) 
        : 0;
      const childPrice = Number(editingInventoryItem.childPrice) >= 0 
        ? Number(editingInventoryItem.childPrice) 
        : 0;

      const data = {
        name: editingInventoryItem.name.trim(),
        type: getCategoryKey(editingInventoryItem.type || 'Attraction'),
        price: adultPrice,
        adultPrice: adultPrice,
        childPrice: childPrice,
        priceType: editingInventoryItem.priceType || 'Per person',
        description: editingInventoryItem.description || ''
      };

      if (editingInventoryItem.id) {
        await setDoc(doc(db, 'inventory_items', editingInventoryItem.id), data, { merge: true });
      } else {
        await addDoc(collection(db, 'inventory_items'), {
          ...data,
          createdAt: serverTimestamp()
        });
      }

      setIsInventoryModalOpen(false);
      setEditingInventoryItem(null);
    } catch (err: any) {
      alert("Failed to save inventory item: " + err.message);
    } finally {
      setIsSavingInventory(false);
    }
  };

  // Brand configuration save handler
  const handleSaveBrandConfig = async () => {
    setIsSavingBrand(true);
    setBrandSaveSuccess(false);
    try {
      const config = {
        companyName,
        companyLogo,
        companyEmail,
        companyPhone,
        companyAddress,
        companyWebsite,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('brand_config', JSON.stringify(config));
      await setDoc(doc(db, 'settings', 'brand_config'), config, { merge: true });
      setBrandSaveSuccess(true);
      setTimeout(() => setBrandSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error saving brand config:", err);
      // Fallback to local persistence
      setBrandSaveSuccess(true);
      setTimeout(() => setBrandSaveSuccess(false), 4000);
    } finally {
      setIsSavingBrand(false);
    }
  };

  // Preset Data Persistence Helper
  const savePresetData = async (type: 'inclusions' | 'exclusions' | 'terms', newList: string[]) => {
    try {
      localStorage.setItem(`preset_${type}`, JSON.stringify(newList));
      await setDoc(doc(db, 'settings', 'preset_data'), {
        [type]: newList,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("Notice saving preset data:", err);
    }
  };

  // Master Data Banks Handlers
  const handleAddMasterInclusion = () => {
    if (!newMasterInclusionInput.trim()) return;
    const text = newMasterInclusionInput.trim();
    const updated = masterInclusions.includes(text) ? masterInclusions : [...masterInclusions, text];
    setMasterInclusions(updated);
    if (!selectedInclusions.includes(text)) {
      setSelectedInclusions(prev => [...prev, text]);
    }
    setNewMasterInclusionInput('');
    savePresetData('inclusions', updated);
  };

  const handleEditPresetInclusion = (index: number, newText: string) => {
    const oldText = masterInclusions[index];
    const updated = [...masterInclusions];
    updated[index] = newText;
    setMasterInclusions(updated);
    setSelectedInclusions(prev => prev.map(item => item === oldText ? newText : item));
    savePresetData('inclusions', updated);
  };

  const handleDeletePresetInclusion = (index: number) => {
    const itemToDelete = masterInclusions[index];
    const updated = masterInclusions.filter((_, i) => i !== index);
    setMasterInclusions(updated);
    setSelectedInclusions(prev => prev.filter(item => item !== itemToDelete));
    savePresetData('inclusions', updated);
  };

  const handleDeleteMasterInclusion = (text: string) => {
    const updated = masterInclusions.filter(item => item !== text);
    setMasterInclusions(updated);
    setSelectedInclusions(prev => prev.filter(item => item !== text));
    savePresetData('inclusions', updated);
  };

  const handleAddMasterExclusion = () => {
    if (!newMasterExclusionInput.trim()) return;
    const text = newMasterExclusionInput.trim();
    const updated = masterExclusions.includes(text) ? masterExclusions : [...masterExclusions, text];
    setMasterExclusions(updated);
    if (!selectedExclusions.includes(text)) {
      setSelectedExclusions(prev => [...prev, text]);
    }
    setNewMasterExclusionInput('');
    savePresetData('exclusions', updated);
  };

  const handleEditPresetExclusion = (index: number, newText: string) => {
    const oldText = masterExclusions[index];
    const updated = [...masterExclusions];
    updated[index] = newText;
    setMasterExclusions(updated);
    setSelectedExclusions(prev => prev.map(item => item === oldText ? newText : item));
    savePresetData('exclusions', updated);
  };

  const handleDeletePresetExclusion = (index: number) => {
    const itemToDelete = masterExclusions[index];
    const updated = masterExclusions.filter((_, i) => i !== index);
    setMasterExclusions(updated);
    setSelectedExclusions(prev => prev.filter(item => item !== itemToDelete));
    savePresetData('exclusions', updated);
  };

  const handleDeleteMasterExclusion = (text: string) => {
    const updated = masterExclusions.filter(item => item !== text);
    setMasterExclusions(updated);
    setSelectedExclusions(prev => prev.filter(item => item !== text));
    savePresetData('exclusions', updated);
  };

  const handleEditPresetTerm = (index: number, newText: string) => {
    const oldText = masterTerms[index];
    const updated = [...masterTerms];
    updated[index] = newText;
    setMasterTerms(updated);
    setSelectedTerms(prev => prev.map(item => item === oldText ? newText : item));
    savePresetData('terms', updated);
  };

  const handleDeletePresetTerm = (index: number) => {
    const itemToDelete = masterTerms[index];
    const updated = masterTerms.filter((_, i) => i !== index);
    setMasterTerms(updated);
    setSelectedTerms(prev => prev.filter(item => item !== itemToDelete));
    savePresetData('terms', updated);
  };

  // Assign item to Day handler (Click or Drag & Drop)
  const addItemToDay = (inv: InventoryItem, targetDay: number) => {
    let defaultQty = 1;
    const adultP = inv.adultPrice ?? inv.price ?? 0;
    const childP = inv.childPrice ?? 0;

    let subtotal = 0;
    if (inv.priceType === 'Per person') {
      defaultQty = 1;
      subtotal = (adultsCount * adultP) + (childrenCount * childP);
    } else {
      subtotal = defaultQty * adultP;
    }

    const newLineItem: ProposalLineItem = {
      inventoryId: inv.id,
      name: inv.name,
      type: getCategoryKey(inv.type),
      price: adultP,
      adultPrice: adultP,
      childPrice: childP,
      priceType: inv.priceType,
      quantity: defaultQty,
      subtotal: subtotal,
      day: targetDay,
      description: inv.description || getItemDescription(inv)
    };

    setSelectedLineItems(prev => [...prev, newLineItem]);
  };

  const handleOpenPickerModal = (dayNum: number) => {
    setTargetPickerDay(dayNum);
    setPickerSearch('');
    setPickerCategoryFilter('all');
    setIsPickerModalOpen(true);
  };

  const handlePickItem = (inv: InventoryItem) => {
    addItemToDay(inv, targetPickerDay);
    setPickedNotification(`Added "${inv.name}" to Day ${targetPickerDay}`);
    setTimeout(() => {
      setPickedNotification(null);
    }, 2000);
  };

  const handleMoveItemInDay = (globalIndex: number, direction: 'up' | 'down') => {
    const currentItem = selectedLineItems[globalIndex];
    if (!currentItem) return;

    const sameDayIndices: number[] = [];
    selectedLineItems.forEach((item, idx) => {
      if (item.day === currentItem.day) {
        sameDayIndices.push(idx);
      }
    });

    const positionInDay = sameDayIndices.indexOf(globalIndex);
    if (positionInDay === -1) return;

    const targetDayPos = direction === 'up' ? positionInDay - 1 : positionInDay + 1;
    if (targetDayPos < 0 || targetDayPos >= sameDayIndices.length) return;

    const targetGlobalIndex = sameDayIndices[targetDayPos];

    const updated = [...selectedLineItems];
    const temp = updated[globalIndex];
    updated[globalIndex] = updated[targetGlobalIndex];
    updated[targetGlobalIndex] = temp;
    setSelectedLineItems(updated);
  };

  const handleMoveDay = (dayNum: number, direction: 'up' | 'down') => {
    const targetDayNum = direction === 'up' ? dayNum - 1 : dayNum + 1;
    if (targetDayNum < 1 || targetDayNum > durationDays) return;

    setSelectedLineItems(prev => prev.map(item => {
      if (item.day === dayNum) return { ...item, day: targetDayNum };
      if (item.day === targetDayNum) return { ...item, day: dayNum };
      return item;
    }));


  };

  // Drag & drop handlers
  const handleDragStartItem = (inv: InventoryItem) => {
    setDraggedInventoryItem(inv);
    setDraggedCatalogItem({ kind: 'inventory', data: inv });
  };

  const handleDragStartInclusion = (text: string) => {
    setDraggedCatalogItem({ kind: 'inclusion', data: text });
  };

  const handleDragStartExclusion = (text: string) => {
    setDraggedCatalogItem({ kind: 'exclusion', data: text });
  };

  const handleDropToDayZone = (
    e: React.DragEvent, 
    targetDay: number, 
    targetZone: 'Attraction' | 'Transportation' | 'Accommodation' | 'Meal' | 'Other' | string
  ) => {
    e.preventDefault();
    setActiveDropZone(null);
    setActiveDropDay(null);

    // If drag source exists
    if (draggedCatalogItem) {
      if (draggedCatalogItem.kind === 'inventory') {
        addItemToDay(draggedCatalogItem.data as InventoryItem, targetDay);
      } else if (typeof draggedCatalogItem.data === 'string') {
        setSelectedInclusions(prev => [...prev, draggedCatalogItem.data as string]);
      }
      setDraggedCatalogItem(null);
      setDraggedInventoryItem(null);
      return;
    }

    if (draggedInventoryItem) {
      addItemToDay(draggedInventoryItem, targetDay);
      setDraggedInventoryItem(null);
    }
  };

  const handleDropToDay = (e: React.DragEvent, targetDay: number) => {
    handleDropToDayZone(e, targetDay, 'Attraction');
  };

  const handleRemoveLineItem = (index: number) => {
    setSelectedLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLineItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    setSelectedLineItems(prev => prev.map((item, i) => {
      if (i === index) {
        const adultP = item.adultPrice ?? item.price ?? 0;
        const childP = item.childPrice ?? 0;
        const subtotal = item.priceType === 'Per person' 
          ? newQty * ((adultsCount * adultP) + (childrenCount * childP))
          : newQty * adultP;

        return {
          ...item,
          quantity: newQty,
          subtotal: subtotal
        };
      }
      return item;
    }));
  };

  // Toggle inclusion preset
  const toggleInclusionPreset = (text: string) => {
    setSelectedInclusions(prev => 
      prev.includes(text) ? prev.filter(t => t !== text) : [...prev, text]
    );
  };

  const handleAddCustomInclusion = () => {
    if (!customInclusionInput.trim()) return;
    const text = customInclusionInput.trim();
    if (!selectedInclusions.includes(text)) {
      setSelectedInclusions(prev => [...prev, text]);
    }
    if (!masterInclusions.includes(text)) {
      setMasterInclusions(prev => [...prev, text]);
    }
    setCustomInclusionInput('');
  };

  // Toggle exclusion preset
  const toggleExclusionPreset = (text: string) => {
    setSelectedExclusions(prev => 
      prev.includes(text) ? prev.filter(t => t !== text) : [...prev, text]
    );
  };

  const handleAddCustomExclusion = () => {
    if (!customExclusionInput.trim()) return;
    const text = customExclusionInput.trim();
    if (!selectedExclusions.includes(text)) {
      setSelectedExclusions(prev => [...prev, text]);
    }
    if (!masterExclusions.includes(text)) {
      setMasterExclusions(prev => [...prev, text]);
    }
    setCustomExclusionInput('');
  };

  // Toggle terms preset
  const toggleTermsPreset = (text: string) => {
    setSelectedTerms(prev => 
      prev.includes(text) ? prev.filter(t => t !== text) : [...prev, text]
    );
  };

  const handleAddCustomTerms = () => {
    if (!customTermsInput.trim()) return;
    if (!selectedTerms.includes(customTermsInput.trim())) {
      setSelectedTerms(prev => [...prev, customTermsInput.trim()]);
    }
    setCustomTermsInput('');
  };

  // AI Proposal Generation Call
  const handleGenerateAIProposal = async () => {
    if (!guestName.trim()) {
      alert("Please enter the Guest Name.");
      return;
    }
    if (selectedLineItems.length === 0) {
      alert("Please add at least 1 inventory/logistic item to the proposal.");
      return;
    }

    setIsGeneratingAI(true);
    setGeneratedProposal(null);

    try {
      const response = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName,
          email,
          phone,
          nationality,
          paxCount,
          durationDays,
          selectedItems: selectedLineItems,
          marginPercentage,
          baseSubtotal,
          marginAmount,
          totalPrice,
          currency,
          specialNotes,
          companyName: companyName || 'Tripbone Tour Operations',
          tenantId
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to generate proposal.");
      }

      const proposalData = resData.data;

      // Group activities and narratives per day
      const itineraryNarrativeObj: ItineraryDayNarrative[] = proposalData.itineraryNarrative || Array.from({ length: durationDays }, (_, idx) => ({
        dayNumber: idx + 1,
        title: `Day ${idx + 1}: Highlights & Exploration`,
        summary: `Full day of personalized activities and tour logistics.`,
        activities: selectedLineItems.filter(i => i.day === idx + 1).map(i => i.name)
      }));

      // Map AI-generated item descriptions onto selected items if returned
      const aiItemDescriptions: Record<string, string> = {};
      if (Array.isArray(proposalData.itemDescriptions)) {
        proposalData.itemDescriptions.forEach((descObj: any) => {
          if (descObj.itemName && descObj.aiDescription) {
            aiItemDescriptions[descObj.itemName.toLowerCase().trim()] = descObj.aiDescription;
          }
        });
      }

      const updatedLineItems = selectedLineItems.map(item => {
        const matchAiDesc = aiItemDescriptions[item.name.toLowerCase().trim()];
        return {
          ...item,
          description: matchAiDesc || item.description || getItemDescription(item)
        };
      });

      const fullProposalObj: Proposal = {
        proposalTitle: proposalData.proposalTitle || `Custom Tour Proposal for ${guestName}`,
        guestName,
        email,
        phone,
        nationality,
        paxCount,
        adultsCount,
        childrenCount,
        paxBreakdown: formatPaxBreakdown(adultsCount, childrenCount),
        durationDays,
        marginPercentage,
        baseSubtotal,
        adultsSubtotal: pricingBreakdown.adultsSubtotal,
        childrenSubtotal: pricingBreakdown.childrenSubtotal,
        marginAmount,
        totalPrice,
        isCustomPriceEnabled,
        customTotalPrice,
        currency,
        selectedItems: updatedLineItems,
        companyName,
        companyLogo,
        companyEmail,
        companyPhone,
        companyAddress,
        companyWebsite,
        welcomeMessage: proposalData.welcomeMessage || `Dear ${guestName}, thank you for choosing us! We are thrilled to present your personalized holiday itinerary.`,
        itineraryNarrative: itineraryNarrativeObj,
        inclusions: selectedInclusions.length > 0 ? selectedInclusions : (proposalData.inclusions || []),
        exclusions: selectedExclusions.length > 0 ? selectedExclusions : (proposalData.exclusions || []),
        termsAndConditions: selectedTerms.length > 0 ? selectedTerms : masterTerms,
        importantTips: proposalData.importantTips || ["Comfortable walking shoes recommended", "Please bring a camera and light clothing"],
        closingNotes: proposalData.closingNotes || "We look forward to hosting you in Bali! Please contact us to confirm your travel dates.",
        status: 'Draft'
      };

      setGeneratedProposal(fullProposalObj);
      setPreviewViewMode('document');
    } catch (err: any) {
      console.error("AI Proposal Generation Error:", err);
      alert("Error generating proposal: " + (err.message || 'Unknown error'));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Save proposal to Firestore
  const handleSaveProposalToDb = async (): Promise<string | null> => {
    const docToSave = activeProposalDoc;
    setIsSavingProposal(true);
    try {
      const docRef = await addDoc(collection(db, 'proposals'), {
        ...docToSave,
        companyName,
        companyLogo,
        companyEmail,
        companyPhone,
        companyAddress,
        companyWebsite,
        createdAt: serverTimestamp()
      });
      const newId = docRef.id;
      setActiveProposalId(newId);
      setGeneratedProposal(prev => ({ ...(prev || docToSave), id: newId }));

      // If linked to an incoming lead from AI Trip Planner, mark inquiry updated
      if (linkedInquiryId) {
        try {
          await updateDoc(doc(db, 'inquiries', linkedInquiryId), {
            status: 'proposal_sent',
            proposalId: newId,
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          console.warn("Notice updating linked inquiry:", e);
        }
      }

      setPickedNotification("Proposal saved to history successfully!");
      setTimeout(() => setPickedNotification(null), 3000);
      return newId;
    } catch (err: any) {
      alert("Failed to save proposal: " + err.message);
      return null;
    } finally {
      setIsSavingProposal(false);
    }
  };

  // WhatsApp Message Generator
  const handleCopyWhatsAppMessage = () => {
    const p = activeProposalDoc;

    let text = `✨ *${p.proposalTitle}* ✨\n\n`;
    text += `${p.welcomeMessage}\n\n`;
    text += `👥 *Pax:* ${formatPaxBreakdown(p.adultsCount || p.paxCount, p.childrenCount)}\n\n`;

    text += `📌 *Day by day Itinerary:*\n`;
    p.itineraryNarrative.forEach(day => {
      const dayLogistics = p.selectedItems.filter(i => i.day === day.dayNumber);
      const dayItineraryItems = dayLogistics.filter(i => getCategoryKey(i.type) === 'Attraction');
      const dayTransportItems = dayLogistics.filter(i => getCategoryKey(i.type) === 'Transportation');
      const dayAccommodationItems = dayLogistics.filter(i => getCategoryKey(i.type) === 'Accommodation');
      const dayDiningItems = dayLogistics.filter(i => getCategoryKey(i.type) === 'Meal');
      const dayOtherItems = dayLogistics.filter(i => getCategoryKey(i.type) === 'Other');

      text += `\n*Day ${toRoman(day.dayNumber)}: ${day.title}*\n`;
      if (day.summary) {
        text += `${day.summary}\n`;
      }

      text += `Attraction:\n` + (dayItineraryItems.length > 0 ? dayItineraryItems.map(i => `- ${i.name}`).join('\n') : `-`) + `\n`;
      text += `Transportation:\n` + (dayTransportItems.length > 0 ? dayTransportItems.map(i => `- ${i.name}`).join('\n') : `-`) + `\n`;
      text += `Accommodation:\n` + (dayAccommodationItems.length > 0 ? dayAccommodationItems.map(i => `- ${i.name}`).join('\n') : `-`) + `\n`;
      text += `Meal:\n` + (dayDiningItems.length > 0 ? dayDiningItems.map(i => `- ${i.name}`).join('\n') : `-`) + `\n`;
      if (dayOtherItems.length > 0) {
        text += `Other:\n` + dayOtherItems.map(i => `- ${i.name}`).join('\n') + `\n`;
      }
    });

    text += `\n*What is included:*\n` + p.inclusions.map(i => `- ${i}`).join('\n') + `\n`;
    text += `\n*What's not included:*\n` + p.exclusions.map(i => `- ${i}`).join('\n') + `\n`;

    if (p.termsAndConditions && p.termsAndConditions.length > 0) {
      text += `\n*Terms & Conditions:*\n` + p.termsAndConditions.map(t => `- ${t}`).join('\n') + `\n`;
    }

    text += `\n💰 *Total Package Investment:* ${p.currency} ${Number(p.totalPrice).toLocaleString()}\n`;
    text += `Contact *${companyName}* (${companyPhone} | ${companyEmail}) to book! 🌴`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Direct WhatsApp Share
  const handleDirectWhatsAppShare = () => {
    handleCopyWhatsAppMessage();
    const p = activeProposalDoc;
    const cleanPhone = (p.phone || phone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}` : `https://wa.me/`;
    window.open(url, '_blank');
  };

  // Print PDF Trigger
  const handlePrintDocument = () => {
    window.print();
  };

  // Load saved proposal from history with full backward compatibility & normalization to new style
  const handleLoadProposal = (p: Proposal) => {
    const normalizedProposal: Proposal = {
      ...p,
      proposalTitle: p.proposalTitle || `Custom Tour Proposal for ${p.guestName || 'Guest'}`,
      guestName: p.guestName || guestName || 'Valued Guest',
      email: p.email || email,
      phone: p.phone || phone,
      nationality: p.nationality || nationality,
      paxCount: p.paxCount || paxCount || 2,
      durationDays: p.durationDays || durationDays || 3,
      totalPrice: p.totalPrice || totalPrice || 0,
      currency: p.currency || currency || 'IDR',
      selectedItems: p.selectedItems || p.lineItems || selectedLineItems,
      companyName: p.companyName || companyName,
      companyLogo: p.companyLogo || companyLogo,
      companyEmail: p.companyEmail || companyEmail,
      companyPhone: p.companyPhone || companyPhone,
      companyAddress: p.companyAddress || companyAddress,
      companyWebsite: p.companyWebsite || companyWebsite,
      welcomeMessage: p.welcomeMessage || `Dear ${p.guestName || 'Guest'}, thank you for choosing us! We are thrilled to present your personalized island itinerary.`,
      itineraryNarrative: (p.itineraryNarrative && p.itineraryNarrative.length > 0)
        ? p.itineraryNarrative
        : Array.from({ length: p.durationDays || 3 }, (_, idx) => {
            const dayItems = (p.selectedItems || p.lineItems || []).filter((i: any) => i.day === idx + 1);
            return {
              dayNumber: idx + 1,
              title: `Day ${idx + 1}: Custom Tour Highlights`,
              summary: dayItems.length > 0 
                ? `Exploration featuring ${dayItems.map((i: any) => i.name).join(', ')}.`
                : `Full day of personalized activities and tour logistics.`,
              activities: dayItems.map((i: any) => i.name)
            };
          }),
      inclusions: (p.inclusions && p.inclusions.length > 0) ? p.inclusions : masterInclusions,
      exclusions: (p.exclusions && p.exclusions.length > 0) ? p.exclusions : masterExclusions,
      termsAndConditions: (p.termsAndConditions && p.termsAndConditions.length > 0) ? p.termsAndConditions : masterTerms,
      closingNotes: p.closingNotes || "We look forward to hosting you in Bali!"
    };

    setGeneratedProposal(normalizedProposal);
    setActiveProposalId(p.id || null);

    // Populate builder inputs so user can modify or generate variations
    if (p.guestName) setGuestName(p.guestName);
    if (p.email) setEmail(p.email);
    if (p.phone) setPhone(p.phone);
    if (p.nationality) setNationality(p.nationality);
    if (p.paxCount) setPaxCount(p.paxCount);
    if (p.durationDays) setDurationDays(p.durationDays);
    if (p.selectedItems || p.lineItems) setSelectedLineItems(p.selectedItems || p.lineItems || []);
    if (p.inclusions) setSelectedInclusions(p.inclusions);
    if (p.exclusions) setSelectedExclusions(p.exclusions);
    if (p.termsAndConditions) setSelectedTerms(p.termsAndConditions);

    setActiveSubTab('create');
    setPreviewViewMode('document');
  };

  // Send proposal via Email Server API handler
  const handleSendProposalEmail = async () => {
    if (!customerEmailInput.trim()) {
      alert("Please enter recipient customer email address.");
      return;
    }
    setIsSendingEmail(true);
    try {
      let currentId = activeProposalId || generatedProposal?.id;

      // Ensure proposal is saved in Firestore so it gets a unique ID before emailing
      if (!currentId && generatedProposal) {
        try {
          const docRef = await addDoc(collection(db, 'proposals'), {
            ...generatedProposal,
            companyName,
            companyLogo,
            companyEmail,
            companyPhone,
            companyAddress,
            companyWebsite,
            createdAt: serverTimestamp()
          });
          currentId = docRef.id;
          setActiveProposalId(currentId);
          setGeneratedProposal(prev => prev ? { ...prev, id: currentId } : null);
        } catch (saveErr) {
          console.warn("Pre-email proposal save skipped:", saveErr);
        }
      }

      const proposalUrl = currentId ? `${window.location.origin}/proposal/${currentId}` : undefined;

      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      const activeTenantId = getActiveTenantId();

      const res = await fetch('/api/send-proposal-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          to: customerEmailInput.trim(),
          proposal: { ...generatedProposal, id: currentId },
          proposalId: currentId,
          proposalUrl,
          origin: window.location.origin,
          companyName,
          companyEmail,
          companyPhone,
          companyWebsite,
          tenantId: activeTenantId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send email');
      }
      alert(`Success! Official tour proposal with interactive web link has been dispatched to ${customerEmailInput.trim()}`);
      setIsEmailModalOpen(false);
    } catch (err: any) {
      console.error("Email send error:", err);
      const subject = encodeURIComponent(emailSubjectInput || `Official Tour Proposal: ${generatedProposal?.proposalTitle}`);
      const link = activeProposalId || generatedProposal?.id ? `\n\nInteractive Proposal Web Link: ${window.location.origin}/proposal/${activeProposalId || generatedProposal?.id}` : '';
      const body = encodeURIComponent(`Dear ${generatedProposal?.guestName},\n\nPlease review your official tour proposal from ${companyName}.${link}\n\nTotal Package: ${generatedProposal?.currency} ${generatedProposal?.totalPrice?.toLocaleString()}\n\nBest regards,\n${companyName}\n${companyEmail}`);
      if (window.confirm(`Server notice: ${err.message}. Would you like to launch your mail client instead?`)) {
        window.open(`mailto:${customerEmailInput.trim()}?subject=${subject}&body=${body}`, '_blank');
        setIsEmailModalOpen(false);
      }
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Printable Area CSS rules */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            font-size: 12px !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .print-page-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Top Banner & Header */}
      <div className="no-print p-6 md:p-8 rounded-3xl border shadow-sm relative overflow-hidden transition-all bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-gray-200 dark:border-slate-800 dark:bg-[#111928] text-gray-900 dark:text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1.5">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Smart Proposal & Itinerary Builder</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Interactive Proposal Generator
            </h1>
            <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              Drag & drop logistics items into day itineraries, manage inclusions, exclusions & terms, generate AI narrative proposals, and print print-ready PDFs.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowBrandConfig(!showBrandConfig)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-orange-500" />
              <span>Branding Config</span>
            </button>

            <div className="flex items-center p-1.5 rounded-2xl bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
              <button
                onClick={() => setActiveSubTab('create')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  activeSubTab === 'create'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Build Proposal</span>
              </button>

              <button
                onClick={() => setActiveSubTab('inventory')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  activeSubTab === 'inventory'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Inventory Catalog ({inventoryList.length})</span>
              </button>

              <button
                onClick={() => setActiveSubTab('inclusions_exclusions')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  activeSubTab === 'inclusions_exclusions'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Inclusions & Exclusions ({masterInclusions.length + masterExclusions.length})</span>
              </button>

              <button
                onClick={() => setActiveSubTab('history')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  activeSubTab === 'history'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>History ({savedProposals.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Company Branding Settings Expandable Bar */}
        {showBrandConfig && (
          <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Company Name</label>
              <input 
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Company Logo URL</label>
              <input 
                type="text"
                value={companyLogo}
                onChange={(e) => setCompanyLogo(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Contact Email</label>
              <input 
                type="text"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Phone / WhatsApp</label>
              <input 
                type="text"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Company Address</label>
              <input 
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Website URL</label>
              <input 
                type="text"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                {brandSaveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 animate-in fade-in">
                    <Check className="w-4 h-4" />
                    <span>Brand configuration saved successfully!</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveBrandConfig}
                disabled={isSavingBrand}
                className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-all flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSavingBrand ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Save Brand Configuration</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: 60-SECOND PROPOSAL STUDIO */}
      {activeSubTab === 'create' && (
        <div className="space-y-6">
          {/* Mobile Tab Switcher */}
          <div className="flex lg:hidden items-center p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMobileStudioTab('editor')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mobileStudioTab === 'editor'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📝 Proposal Builder
            </button>
            <button
              type="button"
              onClick={() => setMobileStudioTab('preview')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mobileStudioTab === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              👁️ Live Document Preview ({currency} {Number(totalPrice).toLocaleString()})
            </button>
          </div>

          {/* Split-Screen Studio Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Fast Action Editor Pane */}
            <div className={`lg:col-span-6 xl:col-span-5 ${mobileStudioTab === 'preview' ? 'hidden lg:block' : ''}`}>
              <ProposalEditorPane
                guestName={guestName}
                setGuestName={setGuestName}
                email={email}
                setEmail={setEmail}
                phone={phone}
                setPhone={setPhone}
                nationality={nationality}
                setNationality={setNationality}
                adultsCount={adultsCount}
                setAdultsCount={setAdultsCount}
                childrenCount={childrenCount}
                setChildrenCount={setChildrenCount}
                durationDays={durationDays}
                setDurationDays={setDurationDays}
                currency={currency}
                setCurrency={setCurrency}
                marginPercentage={marginPercentage}
                setMarginPercentage={setMarginPercentage}
                isCustomPriceEnabled={isCustomPriceEnabled}
                setIsCustomPriceEnabled={setIsCustomPriceEnabled}
                customTotalPrice={customTotalPrice}
                setCustomTotalPrice={setCustomTotalPrice}
                specialNotes={specialNotes}
                setSpecialNotes={setSpecialNotes}
                selectedLineItems={selectedLineItems}
                setSelectedLineItems={setSelectedLineItems}
                selectedInclusions={selectedInclusions}
                setSelectedInclusions={setSelectedInclusions}
                selectedExclusions={selectedExclusions}
                setSelectedExclusions={setSelectedExclusions}
                masterInclusions={masterInclusions}
                masterExclusions={masterExclusions}
                pricingBreakdown={pricingBreakdown}
                editingDayTitles={editingDayTitles}
                setEditingDayTitles={setEditingDayTitles}
                inlineStopInput={inlineStopInput}
                setInlineStopInput={setInlineStopInput}
                onQuickAddCustomStop={handleQuickAddCustomStop}
                onMoveItemInDay={handleMoveItemInDay}
                onRemoveLineItem={handleRemoveLineItem}
                onOpenCatalogPicker={handleOpenPickerModal}
                onGenerateAIProposal={handleGenerateAIProposal}
                isGeneratingAI={isGeneratingAI}
                incomingLeadsCount={incomingLeads.length}
                onOpenIncomingLeads={() => setIsLeadsDrawerOpen(true)}
                onOpenTourCatalog={() => setIsTourModalOpen(true)}
                linkedInquiryId={linkedInquiryId}
                onUnlinkInquiry={() => setLinkedInquiryId(null)}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Right Column: Live Document Preview Pane */}
            <div className={`lg:col-span-6 xl:col-span-7 ${mobileStudioTab === 'editor' ? 'hidden lg:block' : ''}`}>
              <ProposalPreviewPane
                proposal={activeProposalDoc}
                isSaving={isSavingProposal}
                onSave={handleSaveProposalToDb}
                onDirectWhatsApp={handleDirectWhatsAppShare}
                onOpenEmailModal={() => {
                  setCustomerEmailInput(email || '');
                  setIsEmailModalOpen(true);
                }}
                onPrint={handlePrintDocument}
                copySuccess={copySuccess}
                activeProposalId={activeProposalId}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INVENTORY MANAGEMENT CATALOG */}
      {activeSubTab === 'inventory' && (
        <div className="p-6 rounded-3xl border shadow-xs space-y-6 bg-white dark:bg-[#111928] border-gray-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">Master Logistics Inventory</h2>
              <p className="text-xs text-gray-500">Manage entrance tickets, transport car charters, hotel stays, food & guide rates with search, categories & sorting</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddInventory}
              className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 flex items-center space-x-1.5 cursor-pointer shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Inventory Item</span>
            </button>
          </div>

          {/* Search, Sorting & Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-gray-200/80 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search Box */}
              <div className="md:col-span-7 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search inventory by name, type, or details..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border focus:outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-orange-500' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500'
                  }`}
                />
              </div>

              {/* Sorting Selector Dropdown */}
              <div className="md:col-span-5 relative">
                <select
                  value={inventorySortMethod}
                  onChange={(e) => setInventorySortMethod(e.target.value as any)}
                  className={`w-full px-3.5 py-2 text-xs font-bold rounded-xl border cursor-pointer focus:outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-orange-500' 
                      : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                  }`}
                >
                  <option value="default">Sort: Default (Category Order)</option>
                  <option value="name-asc">Sort: Name (A → Z)</option>
                  <option value="name-desc">Sort: Name (Z → A)</option>
                  <option value="price-asc">Sort: Price (Low → High)</option>
                  <option value="price-desc">Sort: Price (High → Low)</option>
                  <option value="type">Sort: Type / Category</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none pt-1 border-t border-gray-200/60 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">Categories:</span>
              <button
                type="button"
                onClick={() => setInventoryCategoryFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all ${
                  inventoryCategoryFilter === 'all'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : isDarkMode 
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                      : 'bg-white text-slate-700 border border-gray-200 hover:bg-slate-100'
                }`}
              >
                All Items ({inventoryList.length})
              </button>
              {CATEGORY_SECTIONS.map(cat => {
                const countInCat = inventoryList.filter(i => getCategoryKey(i.type) === cat.id).length;
                return (
                  <button
                    key={`inv-tab-cat-${cat.id}`}
                    type="button"
                    onClick={() => setInventoryCategoryFilter(cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                      inventoryCategoryFilter === cat.id
                        ? 'bg-orange-600 text-white shadow-xs'
                        : isDarkMode 
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                          : 'bg-white text-slate-700 border border-gray-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      inventoryCategoryFilter === cat.id ? 'bg-orange-700 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300'
                    }`}>
                      {countInCat}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
            <span>Showing <strong className="text-gray-900 dark:text-white">{filteredInventory.length}</strong> of {inventoryList.length} total inventory items</span>
            {(inventorySearch || inventoryCategoryFilter !== 'all' || inventorySortMethod !== 'default') && (
              <button
                type="button"
                onClick={() => {
                  setInventorySearch('');
                  setInventoryCategoryFilter('all');
                  setInventorySortMethod('default');
                }}
                className="text-orange-600 hover:underline cursor-pointer text-xs font-bold"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Inventory Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInventory.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                No inventory items match the selected category or search query.
              </div>
            ) : (
              filteredInventory.map(item => {
                const adultP = Number(item.adultPrice ?? item.price ?? 0);
                const childP = Number(item.childPrice ?? 0);

                return (
                  <div
                    key={`cat-list-${item.id}`}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md ${
                      isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/50 border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border flex items-center space-x-1 ${getCategoryBadgeClass(item.type)}`}>
                          {getCategoryIcon(item.type)}
                          <span>{item.type}</span>
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {item.priceType}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white leading-snug">{item.name}</h3>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description || getItemDescription(item)}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-200/60 dark:border-slate-800">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/10">
                          <span className="block text-[9px] font-bold text-gray-400 uppercase">Adult Rate</span>
                          <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                            {currency} {adultP.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10">
                          <span className="block text-[9px] font-bold text-gray-400 uppercase">Child Rate</span>
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                            {childP > 0 ? `${currency} ${childP.toLocaleString()}` : 'Free / N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-1 pt-1">
                        <button
                          type="button"
                          onClick={() => handleEditInventory(item)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          title="Edit Item"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInventory(item.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: GLOBAL INCLUSIONS & EXCLUSIONS MANAGER */}
      {activeSubTab === 'inclusions_exclusions' && (
        <div className="p-6 rounded-3xl border shadow-xs space-y-6 bg-white dark:bg-[#111928] border-gray-200 dark:border-slate-800">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span>Global Inclusions, Exclusions & Terms Manager</span>
              </h2>
              <p className="text-xs text-gray-500">
                Manage master inclusions, exclusions, terms and conditions used across all proposal templates and day-by-day itineraries.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => handleResetToDefaults(incExcManagerTab)}
                className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                title="Reset current list to default presets"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddIncExc(incExcManagerTab)}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-md transition-colors ${
                  incExcManagerTab === 'inclusions' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : incExcManagerTab === 'exclusions' 
                    ? 'bg-rose-600 hover:bg-rose-700' 
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add New {incExcManagerTab === 'inclusions' ? 'Inclusion' : incExcManagerTab === 'exclusions' ? 'Exclusion' : 'Term'}</span>
              </button>
            </div>
          </div>

          {/* Section / Bank Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => { setIncExcManagerTab('inclusions'); setIncExcCategoryFilter('all'); }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                incExcManagerTab === 'inclusions'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50 border-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl ${incExcManagerTab === 'inclusions' ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-slate-800 text-gray-500'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black">Inclusions Bank</h3>
                  <p className="text-[10px] opacity-75">What is covered in package</p>
                </div>
              </div>
              <span className="text-lg font-black">{masterInclusions.length}</span>
            </button>

            <button
              type="button"
              onClick={() => { setIncExcManagerTab('exclusions'); setIncExcCategoryFilter('all'); }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                incExcManagerTab === 'exclusions'
                  ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400 shadow-xs'
                  : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50 border-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl ${incExcManagerTab === 'exclusions' ? 'bg-rose-600 text-white' : 'bg-gray-200 dark:bg-slate-800 text-gray-500'}`}>
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black">Exclusions Bank</h3>
                  <p className="text-[10px] opacity-75">What client pays separately</p>
                </div>
              </div>
              <span className="text-lg font-black">{masterExclusions.length}</span>
            </button>

            <button
              type="button"
              onClick={() => { setIncExcManagerTab('terms'); setIncExcCategoryFilter('all'); }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                incExcManagerTab === 'terms'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 shadow-xs'
                  : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50 border-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl ${incExcManagerTab === 'terms' ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-slate-800 text-gray-500'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black">Terms & Conditions</h3>
                  <p className="text-[10px] opacity-75">Deposit & cancellation rules</p>
                </div>
              </div>
              <span className="text-lg font-black">{masterTerms.length}</span>
            </button>
          </div>

          {/* Search & Category Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-gray-200/80 dark:border-slate-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${incExcManagerTab}...`}
                value={incExcSearch}
                onChange={(e) => setIncExcSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border focus:outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-orange-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500'
                }`}
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none pt-1 border-t border-gray-200/60 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">Filter Tag:</span>
              {INC_EXC_CATEGORIES.map(cat => (
                <button
                  key={`inc-cat-pill-${cat.id}`}
                  type="button"
                  onClick={() => setIncExcCategoryFilter(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all ${
                    incExcCategoryFilter === cat.id
                      ? 'bg-orange-600 text-white shadow-xs'
                      : isDarkMode 
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                        : 'bg-white text-slate-700 border border-gray-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            {filteredIncExcItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                No items found matching search filter in {incExcManagerTab}.
              </div>
            ) : (
              filteredIncExcItems.map((item) => {
                const isSelectedInProposal = 
                  incExcManagerTab === 'inclusions' ? selectedInclusions.includes(item.text) :
                  incExcManagerTab === 'exclusions' ? selectedExclusions.includes(item.text) :
                  selectedTerms.includes(item.text);

                return (
                  <div
                    key={`mgr-item-${item.originalIndex}`}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-xs hover:border-orange-500/50 ${
                      isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/70 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <span className="text-xs font-black text-gray-400 shrink-0 w-6 text-center">
                        #{item.originalIndex + 1}
                      </span>

                      {/* Move Up / Down Buttons */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveIncExcItem(incExcManagerTab, item.originalIndex, 'up')}
                          disabled={item.originalIndex === 0}
                          className={`p-1 rounded-lg border text-xs ${
                            item.originalIndex === 0
                              ? 'opacity-30 cursor-not-allowed border-gray-200 dark:border-slate-800 text-gray-400'
                              : 'border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 cursor-pointer'
                          }`}
                          title="Move Up in Master List"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveIncExcItem(incExcManagerTab, item.originalIndex, 'down')}
                          disabled={item.originalIndex === currentIncExcList.length - 1}
                          className={`p-1 rounded-lg border text-xs ${
                            item.originalIndex === currentIncExcList.length - 1
                              ? 'opacity-30 cursor-not-allowed border-gray-200 dark:border-slate-800 text-gray-400'
                              : 'border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 cursor-pointer'
                          }`}
                          title="Move Down in Master List"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Category Badge */}
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border shrink-0 ${getIncExcCategoryBadgeClass(item.category)}`}>
                        {item.category}
                      </span>

                      {/* Text */}
                      <p className="text-xs font-semibold text-gray-900 dark:text-white leading-relaxed min-w-0 flex-1">
                        {item.text}
                      </p>
                    </div>

                    {/* Status Badge & Action Controls */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {isSelectedInProposal && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Active in Proposal
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditIncExc(incExcManagerTab, item.originalIndex, item.text)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        title="Edit Item"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteIncExcItem(incExcManagerTab, item.originalIndex)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SAVED PROPOSALS HISTORY */}
      {activeSubTab === 'history' && (
        <div className="p-6 rounded-3xl border shadow-xs space-y-6 bg-white dark:bg-[#111928] border-gray-200 dark:border-slate-800">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white">Saved Proposals History</h2>
            <p className="text-xs text-gray-500">View and reload previously generated client proposals</p>
          </div>

          <div className="space-y-3">
            {savedProposals.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No saved proposals yet. Generate and save a proposal to see it here.
              </div>
            ) : (
              savedProposals.map((p) => (
                <div
                  key={`prop-hist-${p.id}`}
                  className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.proposalTitle}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Guest: <span className="font-bold text-gray-700 dark:text-gray-300">{p.guestName}</span> • {p.paxCount} Pax • {p.durationDays} Days
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                      {p.currency} {Number(p.totalPrice).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleLoadProposal(p)}
                      className="px-3 py-1.5 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 cursor-pointer"
                    >
                      Load & View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Inventory Item Create/Edit Modal */}
      {isInventoryModalOpen && editingInventoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                {editingInventoryItem.id ? 'Edit Inventory Item' : 'New Inventory Item'}
              </h3>
              <button onClick={() => setIsInventoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Lempuyang Entrance Ticket"
                  value={editingInventoryItem.name || ''}
                  onChange={(e) => setEditingInventoryItem({ ...editingInventoryItem, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                  <select
                    value={editingInventoryItem.type || 'Attraction'}
                    onChange={(e) => setEditingInventoryItem({ ...editingInventoryItem, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer"
                  >
                    <option value="Attraction">Attraction</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Meal">Meal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Price Unit</label>
                  <select
                    value={editingInventoryItem.priceType || 'Per person'}
                    onChange={(e) => setEditingInventoryItem({ ...editingInventoryItem, priceType: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer"
                  >
                    <option value="Per person">Per person</option>
                    <option value="Per car">Per car</option>
                    <option value="Per room">Per room</option>
                    <option value="Per day">Per day</option>
                    <option value="Flat rate">Flat rate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Adult Price ({currency}) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editingInventoryItem.adultPrice !== undefined ? editingInventoryItem.adultPrice : (editingInventoryItem.price !== undefined ? editingInventoryItem.price : '')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const parsed = parseFloat(raw);
                      const val = raw === '' ? 0 : (isNaN(parsed) ? 0 : parsed);
                      setEditingInventoryItem({
                        ...editingInventoryItem,
                        price: val,
                        adultPrice: val
                      });
                    }}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Children Price ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editingInventoryItem.childPrice !== undefined ? editingInventoryItem.childPrice : ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const parsed = parseFloat(raw);
                      setEditingInventoryItem({
                        ...editingInventoryItem,
                        childPrice: raw === '' ? 0 : (isNaN(parsed) ? 0 : parsed)
                      });
                    }}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Additional logistics notes..."
                  value={editingInventoryItem.description || ''}
                  onChange={(e) => setEditingInventoryItem({ ...editingInventoryItem, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsInventoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveInventoryItem}
                disabled={isSavingInventory}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 flex items-center space-x-1 cursor-pointer"
              >
                {isSavingInventory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Item</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Proposal Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                  Send Proposal via Email Server
                </h3>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Customer Recipient Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. guest@example.com"
                  value={customerEmailInput}
                  onChange={(e) => setCustomerEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubjectInput}
                  onChange={(e) => setEmailSubjectInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs space-y-1">
                <p className="font-bold text-indigo-900 dark:text-indigo-200">Email Delivery Details:</p>
                <p className="text-indigo-700 dark:text-indigo-300">
                  • Recipient: <strong>{customerEmailInput || 'Not specified'}</strong>
                </p>
                <p className="text-indigo-700 dark:text-indigo-300">
                  • Sender Agency: <strong>{companyName} ({companyEmail})</strong>
                </p>
                <p className="text-indigo-700 dark:text-indigo-300">
                  • Sends full HTML proposal & attaches a direct link to the interactive web proposal.
                </p>
              </div>

              {(activeProposalId || generatedProposal?.id) && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-700 dark:text-amber-400 flex items-center space-x-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Interactive Web Link Attached</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const pId = activeProposalId || generatedProposal?.id;
                        if (pId) {
                          navigator.clipboard.writeText(`${window.location.origin}/proposal/${pId}`);
                          setCopiedProposalLink(true);
                          setTimeout(() => setCopiedProposalLink(false), 2000);
                        }
                      }}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedProposalLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px] truncate bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-700">
                    {`${window.location.origin}/proposal/${activeProposalId || generatedProposal?.id}`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendProposalEmail}
                disabled={isSendingEmail || !customerEmailInput.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 flex items-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending via Email Server...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Email Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* INVENTORY / ATTRACTION PICKER MODAL */}
      {isPickerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-4xl max-h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
            isDarkMode ? 'bg-[#111928] border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-orange-500 text-white rounded-2xl shadow-sm">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black flex items-center space-x-2">
                    <span>Pick Attraction / Item for Day {targetPickerDay}</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select items from inventory by clicking the (+) Add button below
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPickerModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toast Notification inside Modal */}
            {pickedNotification && (
              <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center space-x-2 shrink-0 animate-in slide-in-from-top duration-150">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pickedNotification}</span>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 space-y-3 shrink-0 bg-white dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search attractions, transport, hotels..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className={`w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPickerModalOpen(false);
                      handleOpenAddInventory();
                    }}
                    className="px-3 py-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Inventory Item</span>
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                <button
                  type="button"
                  onClick={() => setPickerCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all ${
                    pickerCategoryFilter === 'all'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Items ({inventoryList.length})
                </button>
                {CATEGORY_SECTIONS.map(cat => (
                  <button
                    key={`picker-cat-${cat.id}`}
                    type="button"
                    onClick={() => setPickerCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all ${
                      pickerCategoryFilter === cat.id
                        ? 'bg-orange-600 text-white shadow-xs'
                        : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Items List Grid */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {(() => {
                const filtered = inventoryList.filter(item => {
                  const matchesSearch = !pickerSearch || item.name.toLowerCase().includes(pickerSearch.toLowerCase()) || (item.type || '').toLowerCase().includes(pickerSearch.toLowerCase());
                  const matchesCat = pickerCategoryFilter === 'all' || getCategoryKey(item.type) === pickerCategoryFilter;
                  return matchesSearch && matchesCat;
                });

                if (loadingInventory) {
                  return (
                    <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                      <span>Loading inventory catalog...</span>
                    </div>
                  );
                }

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center space-y-3">
                      <Package className="w-10 h-10 mx-auto text-gray-400 opacity-50" />
                      <p className="text-xs font-medium text-gray-500">No matching inventory items found.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPickerModalOpen(false);
                          handleOpenAddInventory();
                        }}
                        className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Item</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map(item => {
                      const addedCount = selectedLineItems.filter(i => i.day === targetPickerDay && i.inventoryId === item.id).length;

                      return (
                        <div
                          key={`modal-item-${item.id}`}
                          className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                            addedCount > 0 
                              ? 'border-orange-500/50 bg-orange-500/5 dark:bg-orange-500/10' 
                              : isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getCategoryBadgeClass(item.type)}`}>
                                {item.type}
                              </span>
                              {addedCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-500 text-white">
                                  {addedCount} on Day {targetPickerDay}
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {item.name}
                            </h4>

                            {item.description && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                                {item.description}
                              </p>
                            )}

                            <p className="text-xs font-extrabold text-orange-600 dark:text-orange-400 pt-0.5">
                              {currency} {Number(item.price).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">/ {item.priceType}</span>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handlePickItem(item)}
                            className="px-3.5 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-black text-xs flex items-center space-x-1 cursor-pointer shadow-sm active:scale-95 transition-all shrink-0 mt-1"
                            title={`Add ${item.name} to Day ${targetPickerDay}`}
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-gray-500">
                Items on Day {targetPickerDay}: {selectedLineItems.filter(i => i.day === targetPickerDay).length} item(s)
              </span>
              <button
                type="button"
                onClick={() => setIsPickerModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Done Picking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INCLUSIONS / EXCLUSIONS / TERMS EDIT MODAL */}
      {isIncExcModalOpen && editingIncExcItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
            isDarkMode ? 'bg-[#111928] border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold flex items-center space-x-2">
                <span>
                  {editingIncExcItem.index !== undefined ? 'Edit' : 'Add New'} {editingIncExcItem.type === 'inclusions' ? 'Inclusion' : editingIncExcItem.type === 'exclusions' ? 'Exclusion' : 'Term & Condition'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsIncExcModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Item Text / Description *
                </label>
                <textarea
                  rows={3}
                  value={editingIncExcItem.text}
                  onChange={(e) => setEditingIncExcItem({ ...editingIncExcItem, text: e.target.value })}
                  placeholder={`Enter ${editingIncExcItem.type} details...`}
                  className={`w-full p-3 text-xs font-medium rounded-xl border focus:outline-none focus:border-orange-500 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              {editingIncExcItem.text && (
                <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 text-xs flex items-center justify-between">
                  <span className="text-gray-500 font-bold">Auto-Detected Category Tag:</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getIncExcCategoryBadgeClass(detectIncExcCategory(editingIncExcItem.text))}`}>
                    {detectIncExcCategory(editingIncExcItem.text)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsIncExcModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveIncExcModal}
                className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 shadow-sm cursor-pointer"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}
      {/* BANK ITEM PICKER MODAL (FOR INCLUSIONS, EXCLUSIONS & TERMS) */}
      {bankPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
            isDarkMode ? 'bg-[#111928] border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-xl text-white font-black text-xs ${
                  bankPickerModal === 'inclusions' ? 'bg-emerald-600' : bankPickerModal === 'exclusions' ? 'bg-rose-600' : 'bg-amber-600'
                }`}>
                  Bank Picker
                </div>
                <div>
                  <h3 className="text-sm font-extrabold capitalize">
                    Pick or Add {bankPickerModal}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Select items from your master bank to include in this proposal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBankPickerModal(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Custom Input */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${bankPickerModal} bank...`}
                  value={bankPickerSearch}
                  onChange={(e) => setBankPickerSearch(e.target.value)}
                  className={`w-full pl-9 pr-3.5 py-2 text-xs font-semibold rounded-xl border focus:outline-none ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              {/* Add Custom Directly to Selected & Master Bank */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder={`Type custom ${bankPickerModal} item...`}
                  value={bankPickerCustomInput}
                  onChange={(e) => setBankPickerCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && bankPickerCustomInput.trim()) {
                      const val = bankPickerCustomInput.trim();
                      if (bankPickerModal === 'inclusions') {
                        if (!selectedInclusions.includes(val)) setSelectedInclusions(prev => [...prev, val]);
                        if (!masterInclusions.includes(val)) setMasterInclusions(prev => [...prev, val]);
                      } else if (bankPickerModal === 'exclusions') {
                        if (!selectedExclusions.includes(val)) setSelectedExclusions(prev => [...prev, val]);
                        if (!masterExclusions.includes(val)) setMasterExclusions(prev => [...prev, val]);
                      } else if (bankPickerModal === 'terms') {
                        if (!selectedTerms.includes(val)) setSelectedTerms(prev => [...prev, val]);
                        if (!masterTerms.includes(val)) setMasterTerms(prev => [...prev, val]);
                      }
                      setBankPickerCustomInput('');
                    }
                  }}
                  className={`flex-1 px-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!bankPickerCustomInput.trim()) return;
                    const val = bankPickerCustomInput.trim();
                    if (bankPickerModal === 'inclusions') {
                      if (!selectedInclusions.includes(val)) setSelectedInclusions(prev => [...prev, val]);
                      if (!masterInclusions.includes(val)) setMasterInclusions(prev => [...prev, val]);
                    } else if (bankPickerModal === 'exclusions') {
                      if (!selectedExclusions.includes(val)) setSelectedExclusions(prev => [...prev, val]);
                      if (!masterExclusions.includes(val)) setMasterExclusions(prev => [...prev, val]);
                    } else if (bankPickerModal === 'terms') {
                      if (!selectedTerms.includes(val)) setSelectedTerms(prev => [...prev, val]);
                      if (!masterTerms.includes(val)) setMasterTerms(prev => [...prev, val]);
                    }
                    setBankPickerCustomInput('');
                  }}
                  className={`px-4 py-2 rounded-xl text-white font-bold text-xs cursor-pointer ${
                    bankPickerModal === 'inclusions' ? 'bg-emerald-600 hover:bg-emerald-700' : bankPickerModal === 'exclusions' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Add Custom
                </button>
              </div>
            </div>

            {/* Modal Items List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {(() => {
                const list = bankPickerModal === 'inclusions' ? masterInclusions : bankPickerModal === 'exclusions' ? masterExclusions : masterTerms;
                const activeSelected = bankPickerModal === 'inclusions' ? selectedInclusions : bankPickerModal === 'exclusions' ? selectedExclusions : selectedTerms;
                const filtered = list.filter(item => item.toLowerCase().includes(bankPickerSearch.toLowerCase().trim()));

                if (filtered.length === 0) {
                  return <p className="text-xs text-gray-400 italic text-center py-6">No matching items found in bank.</p>;
                }

                return filtered.map((item, idx) => {
                  const isSelected = activeSelected.includes(item);
                  return (
                    <div
                      key={`bank-item-${idx}`}
                      onClick={() => {
                        if (bankPickerModal === 'inclusions') toggleInclusionPreset(item);
                        else if (bankPickerModal === 'exclusions') toggleExclusionPreset(item);
                        else if (bankPickerModal === 'terms') toggleTermsPreset(item);
                      }}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? bankPickerModal === 'inclusions'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                            : bankPickerModal === 'exclusions'
                            ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 font-bold'
                            : 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                          : isDarkMode ? 'bg-slate-900 border-slate-800 text-gray-300 hover:border-gray-600' : 'bg-slate-50 border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xs">{item}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${
                        isSelected ? 'bg-white/80 dark:bg-black/30 shadow-xs' : 'text-gray-400'
                      }`}>
                        {isSelected ? '✓ Selected' : '+ Select'}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-gray-500">
                Selected: {(bankPickerModal === 'inclusions' ? selectedInclusions : bankPickerModal === 'exclusions' ? selectedExclusions : selectedTerms).length} item(s)
              </span>
              <button
                type="button"
                onClick={() => setBankPickerModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Leads from AI Trip Planner Modal */}
      <IncomingLeadsModal
        isOpen={isLeadsDrawerOpen}
        onClose={() => setIsLeadsDrawerOpen(false)}
        leads={incomingLeads}
        onSelectLead={handleLoadInquiryLead}
        linkedInquiryId={linkedInquiryId}
        isDarkMode={isDarkMode}
      />

      {/* Import Tour from Catalog Modal */}
      <ImportTourModal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        tours={availableTours}
        onSelectTour={handleImportTour}
        currency={currency}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
