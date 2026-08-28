export interface MultiDayItineraryItem {
  id?: string;
  time: string; // e.g. "08:00"
  title: string; // e.g. "Pick up at airport"
  image?: string; // Image URL
  description?: string; // Activity description
}

export interface MultiDayItineraryDay {
  dayNumber: number; // 1, 2, 3...
  title: string; // e.g. "Day I: Arrival & Airport Pick Up"
  description?: string; // Day one overview description
  itineraryItems: MultiDayItineraryItem[];
}

export interface RoomTypeOption {
  id: string;
  name: string; // e.g. "Single", "Double", "Private", "Suite"
  price: number; // Room type price rate
  description?: string;
}

export interface AccommodationOption {
  id: string;
  category: 'Resort' | 'Villa' | 'Airbnb' | 'Hotel' | string; // Accommodation type category
  name: string; // Hotel / Resort Name e.g. "Hilton Bali"
  image?: string;
  description?: string;
  roomTypes: RoomTypeOption[];
}

export interface MultiDayGuideOption {
  id: string;
  language: string; // e.g. "English", "Spanish"
  price: number; // Guide price rate
  description?: string;
}

export interface PricingTier {
  minParticipants: number;
  maxParticipants: number;
  adultPrice: number;
  childPrice: number;
}

export interface TourPackage {
  name: string;
  details?: string; // Made optional
  inclusions: string[];
  exclusions: string[];
  meetingPoint?: string; // New: map embed URL or address
  meetingPointType?: 'Meeting Point' | 'Pick up Location'; // New: selection
  pickupAreas?: string; // Covered pickup areas served (e.g. Ubud, Canggu, Seminyak)
  tiers: PricingTier[];
  transportIds?: string[]; // Global transports available for this package
}

export interface AddOn {
  id: string;
  name: string;
  description?: string; // New field
  price: number;
  unit: 'per person' | 'per booking';
}

export interface TransportOption {
  id: string;
  name: string;
  type: 'meet' | 'shared' | 'private';
  carType?: string;
  price: number;
  priceType: 'per_car' | 'per_person';
  description?: string;
  maxCapacity?: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string; // New: image URL or icon identifier
}

export interface TourType {
  id: string;
  name: string;
}

export interface LocationMeta {
  id: string;
  name: string;
  featuredImage?: string;
  image?: string;
  imageUrl?: string;
  description?: string;
}

export interface ImportantInfoSection {
  title: string;
  content: string[];
}

// ----------------------------------------------------
// Car Rental & Chauffeur Charter Module Types
// ----------------------------------------------------

export type RentalCategory = 
  | 'economy' 
  | 'standard_mpv' 
  | 'executive' 
  | 'luxury_vip' 
  | 'minibus' 
  | 'suv' 
  | 'convertible' 
  | 'van'
  | string;

export type RentalTransmission = 'automatic' | 'manual';
export type RentalFuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric';
export type RentalServiceMode = 'self_drive' | 'with_driver';

export interface RentalZone {
  id: string;
  name: string; // e.g. "Standard Zone (South & Central)", "Highlands & East Coast", "Far North / Extended"
  description: string;
  surcharge: number; // Flat fee added for distance coverage
  coveredAreas?: string[]; // e.g. ["Kuta", "Seminyak", "Sanur", "Ubud", "Canggu"]
  isDefault?: boolean;
}

export interface RentalAddOn {
  id: string;
  name: string;
  price: number;
  type: 'per_day' | 'per_booking';
  description?: string;
  icon?: string;
}

export interface RentalPricingConfig {
  withDriver?: {
    enabled: boolean;
    halfDayPrice?: number; // 4-6 hours rate
    fullDayPrice?: number; // 10-12 hours rate
    hourlyPrice?: number; // hourly charter rate
    overtimePricePerHour?: number; // overtime charge per hr
  };
  selfDrive?: {
    enabled: boolean;
    dailyPrice?: number; // 24h daily rate
    depositRequired?: number; // Refundable security deposit
    minimumDays?: number; // Minimum days requirement (default 1)
  };
}

export interface RentalVehicle {
  id: string;
  name: string; // e.g. "Toyota Avanza MPV"
  model: string; // e.g. "Avanza 1.5 Veloz"
  brand: string; // e.g. "Toyota"
  category: RentalCategory;
  images: string[];
  featuredImage: string;
  passengerCapacity: number;
  luggageCapacity: number;
  doors: number;
  transmission: RentalTransmission;
  fuelType: RentalFuelType;
  hasAC: boolean;
  licensePlate?: string;
  year?: number;
  status: 'available' | 'maintenance' | 'booked' | 'hidden';
  description: string;
  features: string[]; // e.g. ["Bluetooth", "Air Conditioning", "USB Charger", "Comprehensive Insurance"]
  inclusions: string[]; // e.g. ["English-speaking Driver", "Fuel & Petrol", "Parking Fees"]
  exclusions: string[]; // e.g. ["Toll Fees", "Entrance Tickets", "Overtime past 10h"]
  pricing: RentalPricingConfig;
  customZones?: RentalZone[];
  addOns?: RentalAddOn[];
  rating?: number;
  reviewsCount?: number;
  isPopular?: boolean;
  sortOrder?: number;
  tenantId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface RentalAutomationsConfig {
  enabled: boolean;
  bookingConfirmationWhatsApp: {
    enabled: boolean;
    template: string;
  };
  driverDispatchWhatsApp: {
    enabled: boolean;
    template: string;
  };
  preTripReminderWhatsApp: {
    enabled: boolean;
    template: string;
    sendHoursBefore?: number;
  };
  postTripReviewWhatsApp: {
    enabled: boolean;
    template: string;
  };
  emailConfirmation?: {
    enabled: boolean;
    subject: string;
    template: string;
  };
}

export interface CarRentalModuleSettings {
  enabled: boolean; // Master module toggle
  showOnHomepage: boolean; // Show fleet showcase section on homepage
  heroSearchTab: boolean; // Show dual tab search form on hero
  moduleTitle?: string; // e.g. "Private Car Rentals & Chauffeur Charters"
  moduleSubtitle?: string; // e.g. "Explore the island in comfort with vetted modern vehicles and professional private drivers."
  defaultDepositPercentage?: number;
  depositPolicy?: string;
  driverInclusionNote?: string;
  selfDriveRequirementNote?: string;
  zones?: RentalZone[];
  globalAddOns?: RentalAddOn[];
  automations?: RentalAutomationsConfig;
}

export interface RentalBookingDetails {
  vehicleId: string;
  vehicleName: string;
  vehicleCategory: string;
  vehicleImage?: string;
  serviceMode: RentalServiceMode; // 'self_drive' | 'with_driver'
  durationType: 'hourly' | 'half_day' | 'full_day' | 'multi_day';
  durationHours?: number;
  durationDays?: number;
  pickupDate: string;
  pickupTime: string;
  dropoffDate?: string;
  dropoffTime?: string;
  pickupLocation: string;
  dropoffLocation?: string;
  flightNumber?: string;
  zoneId?: string;
  zoneName?: string;
  zoneSurcharge?: number;
  baseRate: number;
  selectedAddOns?: { id: string; name: string; price: number; quantity?: number }[];
  addOnsTotal?: number;
  securityDeposit?: number;
  overtimeRatePerHour?: number;
  notes?: string;

  // Operational Dispatch & Driver Tracking
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedVehiclePlate?: string;
  dispatchNotifiedAt?: string;

  // Handover, Mileage, Fuel & Deposit Inspection
  depositStatus?: 'pending' | 'received' | 'refunded' | 'forfeited';
  depositPaidAmount?: number;
  balanceDue?: number;
  odometerStart?: number;
  odometerEnd?: number;
  fuelStart?: string;
  fuelEnd?: string;
  inspectionNotes?: string;
}

export interface TourLabel {
  id: string;
  name: string;
  color?: string; // Optional: background color for the badge
}

export interface Tour {
  id: string;
  slug: string; // Added slug field
  title: string;
  description: string;
  seo?: {
    title: string;
    description: string;
    keywords?: string;
    ogImage?: string;
  };
  categoryId?: string;
  tourTypeId?: string;
  locationId?: string;
  labelIds?: string[]; // Selection from global labels
  imageLabelId?: string; // New field for placement
  belowTitleLabelId?: string; // New field for placement
  priceLabelId?: string; // New field for placement
  highlights: string[];
  inclusions: string[]; // Global inclusions
  exclusions: string[]; // Global exclusions
  itinerary: {
    day: number;
    title: string;
    description: string;
    pickup?: {
      description: string;
      image?: string;
    };
    image?: string;
  }[];
  importantInfo?: string;
  infoSections?: ImportantInfoSection[]; // Dynamic sections: What to Bring, Before you go, etc.
  languages: string[];
  location: string; // Keep as backup or display string
  locationMapUrl: string;
  duration: string;
  gallery: string[];
  featuredImage?: string; // New field
  regularPrice: number; // For display on cards/grid
  discountPrice?: number;
  packages: TourPackage[];
  addOnIds?: string[]; // Selection from global add-ons
  addOns?: AddOn[]; // Kept for backward compatibility or snapshots
  transportIds?: string[]; // Selection from global transports
  tourDurationType?: 'single_day' | 'multi_day'; // Toggle single vs multi day tour
  multiDayItinerary?: MultiDayItineraryDay[]; // Detailed multi-day itinerary with time slots
  accommodations?: AccommodationOption[]; // Accommodations / Hotels with room types & prices
  multiDayGuides?: MultiDayGuideOption[]; // Multi-day guide options with prices
  meetingPoint?: string; // Tour level meeting point
  pickupAreas?: string; // Tour level pickup areas served
  faqs: {
    question: string;
    answer: string;
  }[];
  timeSlots?: string[]; // Available times e.g. ["08:00", "08:30"]
  cutOffHours?: number; // Cut-off time in hours before departure (e.g. 0 for instant, 2, 12, 24, 48)
  cutOffNotice?: string; // Optional custom operational notice
  maxCapacity?: number; // Maximum participants per day/tour
  slotCapacity?: number; // Optional: Maximum participants per specific time slot if different from daily
  urgencyPointIds?: string[]; // Global urgency points
  rating?: number; // New field for aggregated rating
  reviewsCount?: number; // New field for review count
  isPopular?: boolean; // New field for display badges
  supplierId?: string; // ID of the supplier who owns this tour
  supplierName?: string; // Cache supplier name
  supplierEmail?: string; // Cache supplier email
  vendorEmail?: string; // Legacy field for vendor email
  vendor?: string; // Legacy field for vendor name
  businessName?: string; // Legacy field for business name
  status: 'published' | 'pending' | 'draft' | 'rejected'; // Status for supplier submission
  createdAt: any;
  updatedAt: any;
}

export interface UrgencyPoint {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
}

export interface Review {
  id: string;
  tourId?: string; // New: reference back to tour
  tourTitle?: string; // New: cache for display
  userId: string;
  userName: string;
  userPhoto?: string;
  nationality?: string;
  tourDate?: string;
  rating: number;
  title?: string;
  comment: string;
  image?: string;
  images?: string[]; // New: support for multiple images
  status: 'pending' | 'approved' | 'rejected'; // New moderation status
  platform?: 'direct' | 'google' | 'tripadvisor' | 'airbnb';
  externalUrl?: string;
  createdAt: any;
}

export interface PaymentSettings {
  // PayPal Settings
  paypalClientId: string;
  paypalSecret?: string;
  paypalSandboxClientId?: string;
  paypalSandboxSecret?: string;
  paypalMode: 'live' | 'sandbox';
  isPaypalEnabled: boolean;
  creditCardEnabled: boolean;

  // Stripe Settings
  isStripeEnabled?: boolean;
  stripeMode?: 'live' | 'test';
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  stripeTestPublishableKey?: string;
  stripeTestSecretKey?: string;
  stripeWebhookSecret?: string;

  // Midtrans Settings (Indonesia Gateways & QRIS)
  isMidtransEnabled?: boolean;
  midtransEnvironment?: 'sandbox' | 'production';
  midtransMerchantId?: string;
  midtransClientKey?: string;
  midtransServerKey?: string;
  midtransSnapUrl?: string;
  midtransPaymentMethods?: string[];

  // Bank Transfer Settings
  isBankTransferEnabled?: boolean;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  swiftCode?: string;
  bankInstructions: string;

  // Wise Settings
  isWiseEnabled?: boolean;
  wiseApiToken?: string;
  wiseProfileId?: string;
  wiseWebhookSecret?: string;

  // Pay on Arrival (Cash) Settings
  isPayOnArrivalEnabled?: boolean;
  payOnArrivalInstructions?: string;
  providerConfigs?: Record<string, any>;
}

export interface BookingLog {
  timestamp: string;
  message: string;
  type: 'status_change' | 'note' | 'system' | 'assignment';
  userName?: string;
}

export interface Booking {
  id: string;
  tourId: string;
  tourTitle: string;
  userId: string;
  supplierId?: string; // Reference to the product owner
  supplierName?: string; // Cache supplier name for easy display
  supplierEmail?: string; // Cache supplier email for reliable notifications
  customerData: {
    fullName: string;
    email: string;
    phone: string;
    country?: string; // New field
    nationality?: string;
    pickupAddress?: string; // New field
    specialRequirements?: string;
  };
  date: string;
  time?: string;
  timeSlot?: string; // New field for selected time slot
  participants: {
    adults: number;
    children: number;
  };
  packageName: string;
  selectedAddOns: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  addOns?: { name: string; price: number }[]; // Snapshot fields
  couponCode?: string;
  discountAmount?: number;
  agentDiscount?: number; // Discount applied for agents
  merchantFee?: number; // Fee deducted for the platform from supplier
  supplierEarnings?: number; // Final payout to supplier
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'review_required' | 'completed';
  cancellationRequested?: boolean;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed'; // New field
  paymentId: string | null;
  paymentToken?: string; // New field for manual tokens
  tenantId?: string; // Multi-tenancy reference
  bookingSource: 'Direct' | 'Klook' | 'Viator' | 'GetYourGuide' | 'Manual' | 'Agent' | string; // Source of the booking
  selectedTransport?: TransportOption | null; // Transport selection for booking
  selectedAccommodation?: {
    accommodationId: string;
    accommodationName: string;
    category: string;
    roomTypeId: string;
    roomTypeName: string;
    price: number;
  } | null;
  selectedGuideOption?: {
    guideId: string;
    language: string;
    price: number;
  } | null;
  transportTotal?: number; // Total price calculated for transport option
  internalNotes?: string; // New field for admin notes
  logs?: BookingLog[]; // New: activity logs
  assignedGuideId?: string; // New field for guide assignment
  assignedGuideName?: string; // Cache name for easy display
  assignedGuideWhatsapp?: string; // New: cache whatsapp for easy contact
  bookedBy?: {
    uid: string;
    name: string;
    email: string;
    role: string;
  };
  pricingBreakdown?: {
    adultRate: number;
    childRate: number;
    packageTotal: number;
    transportTotal?: number;
  };
  proposedUpdate?: any;
  payoutId?: string | null; // ID of the payout document this booking is linked to
  payoutStatus?: 'pending' | 'queued' | 'paid'; // Status in the payout lifecycle
  bookingType?: 'tour' | 'rental'; // Service classification
  rentalDetails?: RentalBookingDetails; // Rental details if bookingType is 'rental'
  waiverStatus?: 'pending' | 'signed' | 'exempt'; // Digital waiver completion status
  signedWaiverId?: string; // Reference to signed waiver document
  waiverSignedAt?: string; // Timestamp when waiver was signed
  waiverSignedCount?: number; // Number of participants signed under this waiver
  invoiceId?: string; // Linked invoice ID if invoiced
  invoiceNumber?: string; // Linked invoice number
  createdAt: any;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'superadmin' | 'admin' | 'staff' | 'customer' | 'supplier' | 'agent';
  status: 'active' | 'pending' | 'suspended';
  commissionRate?: number; // For suppliers (percentage 0-100)
  discountRate?: number; // For agents (percentage 0-100)
  companyName?: string;
  publicEmail?: string;
  taxId?: string;
  phoneNumber?: string;
  website?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  country?: string;
  dateOfBirth?: string;
  bio?: string;
  wishlist?: string[];
  payoutMethod?: PayoutMethod;
  createdAt: any;
  updatedAt?: any;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minBookingValue: number;
  expiryDate?: string;
  isActive: boolean;
}

export interface Guide {
  id: string;
  name: string;
  whatsapp: string;
  isActive: boolean;
  supplierId?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string; // Markdown / HTML supported
  excerpt: string;
  featuredImage?: string;
  coverImage?: string;
  category: string;
  tags: string[];
  author: string;
  readTime?: string;
  seo?: {
    title: string;
    description: string;
    keywords?: string;
    ogImage?: string;
  };
  status: 'draft' | 'published' | 'active';
  publishedAt?: any;
  createdAt: any;
  updatedAt?: any;
}

export interface EmailTemplate {
  subject: string;
  body: string; // HTML supported with placeholders like {{customerName}}, {{bookingId}}, etc.
  enabled: boolean;
}

export interface WhatsAppTemplate {
  message: string; // Placeholders supported like {{customerName}}, {{bookingId}}, etc.
  enabled: boolean;
}

export interface CommunicationSettings {
  id: 'settings';
  emailProvider: 'resend' | 'sendgrid' | 'brevo' | 'smtp' | 'gmail' | 'none' | 'enginemailer' | 'mailjet';
  emailApiKey?: string;
  gmailUser?: string;
  gmailAppPassword?: string;
  smtpSettings?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
  };
  senderEmail: string;
  senderName: string;
  adminNotificationEmail: string; // Where admin receives alerts
  adminNotificationPhone?: string; // Where admin receives WA alerts
  openwaApiKey?: string; // New: OpenWA API Key
  openwaBaseUrl?: string; // New: OpenWA Dashboard URL
  openwaSessionId?: string; // New: OpenWA Session Name
  whatsappProvider?: 'openwa' | 'waba'; // Provider select option
  wabaAccessToken?: string; // WABA Access Token
  wabaPhoneNumberId?: string; // WABA Phone Number ID
  wabaTemplateName?: string; // Default template name for confirmations
  wabaLanguageCode?: string; // Default language code (e.g., en, id)
  wabaVerifyToken?: string; // Verification token for Meta Webhook
  geminiApiKey?: string;
  imgbbApiKey?: string;
  whatsappEnabled: boolean;
  whatsappTemplates: {
    booking_confirmation: WhatsAppTemplate;
    booking_status_updated: WhatsAppTemplate;
    admin_notification: WhatsAppTemplate;
    guide_assigned?: WhatsAppTemplate;
    payment_link?: WhatsAppTemplate;
  };
  templates: {
    booking_pending: EmailTemplate;
    booking_confirmed: EmailTemplate;
    booking_cancelled: EmailTemplate;
    booking_changed: EmailTemplate;
    booking_status_updated: EmailTemplate;
    payment_received: EmailTemplate;
    payment_failed: EmailTemplate;
    review_request: EmailTemplate;
    guide_assigned: EmailTemplate;
    admin_new_booking: EmailTemplate;
    booking_updated_by_admin?: EmailTemplate;
  };
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  metaTitle?: string;
  metaDescription?: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  logoURL: string;
  faviconURL: string;
  officeAddress: string;
  primaryColor: string;
  secondaryColor: string;
  bodyFont: string;
  headingFont: string;
  currency: string;
  defaultCutOffHours?: number; // Default booking cut-off in hours (e.g. 12 or 24)
  destinationRegion?: string;
  customDomain?: string;
  heroYoutubeUrl?: string;
  heroImage?: string;
  heroImages?: string[];
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  // Top Announcement & Header Navigation Bar Settings
  topBarEnabled?: boolean;
  topBarBadge?: string;
  topBarText?: string;
  topBarLink?: string;
  topBarLinkText?: string;

  // External Reviews Collection Settings (TripAdvisor, Google Maps, Airbnb, Viator, GetYourGuide, Trustpilot, Klook, Booking.com, Custom)
  externalReviewsEnabled?: boolean;
  googleReviewsEnabled?: boolean;
  googlePlaceId?: string;
  googleReviewUrl?: string;
  googleRating?: number;
  googleReviewCount?: number;

  tripadvisorEnabled?: boolean;
  tripadvisorUrl?: string;
  tripadvisorRating?: number;
  tripadvisorReviewCount?: number;

  airbnbEnabled?: boolean;
  airbnbUrl?: string;
  airbnbRating?: number;
  airbnbReviewCount?: number;

  viatorEnabled?: boolean;
  viatorUrl?: string;
  viatorRating?: number;
  viatorReviewCount?: number;

  getyourguideEnabled?: boolean;
  getyourguideUrl?: string;
  getyourguideRating?: number;
  getyourguideReviewCount?: number;

  trustpilotEnabled?: boolean;
  trustpilotUrl?: string;
  trustpilotRating?: number;
  trustpilotReviewCount?: number;

  klookEnabled?: boolean;
  klookUrl?: string;
  klookRating?: number;
  klookReviewCount?: number;

  bookingEnabled?: boolean;
  bookingUrl?: string;
  bookingRating?: number;
  bookingReviewCount?: number;

  customReviewEnabled?: boolean;
  customReviewPlatformName?: string;
  customReviewUrl?: string;
  customReviewRating?: number;
  customReviewCount?: number;

  maxDisplayReviews?: number;

  // Elfsight Integration
  elfsightEnabled?: boolean;
  elfsightEmbedCode?: string;

  // SEO & AI Crawler & Analytics & Conversion Tracking Settings
  gaMeasurementId?: string;
  gtmId?: string;
  googleAdsId?: string;
  googleAdsConversionLabel?: string;
  gaCustomScript?: string;
  gtmBodyScript?: string;
  homeTitleFormat?: string; // e.g. "{{siteName}} - Best Bali Tours"
  pageTitleFormat?: string; // e.g. "{{title}} | {{siteName}}"
  tourTitleFormat?: string; // e.g. "{{title}} | {{siteName}}"
  blogTitleFormat?: string; // e.g. "{{title}} - {{siteName}}"
  ogImage?: string;
  allowAICrawlers?: boolean;
  sitemapUrl?: string;
  // Theme Settings
  themeMode?: 'default' | 'custom';
  carRentalModule?: CarRentalModuleSettings;
  brandingPreset?: 'default' | 'swiss-minimalist' | 'tech-dark' | 'elegant-editorial' | 'nordic-forest' | 'retro-adventure' | 'tokyo-neon' | 'mediterranean-breeze' | 'brutalist-mono' | 'royal-safari' | 'zen-oasis' | 'alpine-chalet' | 'sunset-ibiza';
  mobilePreset?: 'klook-explorer' | 'getyourguide-activity' | 'airbnb-experiences' | 'viator-classic' | 'tripadvisor-wanderer' | 'luxury-concierge' | 'boutique-minimalist' | 'nordic-adventure' | 'tokyo-cyber' | 'island-breeze' | 'default';
  mobileHookTitle?: string; // e.g. "Book Your Bali Tour"
  mobileHookSubtitle?: string; // e.g. "Verified Local Partner"
  sectionStyles?: {
    topNav?: string;
    mainNav?: string;
    hero?: string;
    featuredTours?: string;
    guestFavorites?: string;
    reviews?: string;
    inspiration?: string;
    footer?: string;
    aboutPage?: string;
    contactPage?: string;
    blogPage?: string;
  };
}

export interface Popup {
  id: string;
  title: string;
  content: string;
  imageURL?: string;
  ctaText?: string;
  ctaLink?: string;
  isActive: boolean;
  displayDelay: number;
  type: 'newsletter' | 'promotion' | 'info';
  updatedAt: any;
}

export interface Inventory {
  id: string; // tourId_date_timeSlot
  tourId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // "daily" or specific time
  bookedCount: number;
  maxCapacity: number;
  updatedAt: any;
}

export interface Inquiry {
  id: string;
  userId?: string | null;
  userName: string;
  userEmail: string;
  userPhone?: string;
  planTitle: string;
  summary: string;
  itinerary: any;
  formData: any;
  status: 'new' | 'followed_up' | 'converted' | 'cancelled';
  createdAt: any;
}

export interface PayoutMethod {
  type: 'bank_transfer' | 'paypal' | 'other';
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  paypalEmail?: string;
  details?: string;
}

export interface Payout {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  payoutMethod: PayoutMethod;
  bookingIds: string[];
  referenceNumber?: string;
  notes?: string;
  processedAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: 'customer' | 'admin';
  text: string;
  timestamp: any;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'Booking' | 'Tour Details' | 'Payment' | 'Feedback' | 'General Inquiry';
  status: 'open' | 'replied' | 'pending' | 'closed';
  messages: TicketMessage[];
  createdAt: any;
  updatedAt: any;
  type: 'web';
}

export interface Tenant {
  id: string;
  companyName: string;
  slug: string;
  isSaaS?: boolean;
  customDomain?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  currency?: string;
  language?: string;
  timezone?: string;
  email?: string;
  phone?: string;
  address?: string;
  plan: 'starter' | 'professional' | 'business' | 'agency' | 'enterprise' | string;
  billingInterval?: 'monthly' | 'annual' | 'lifetime';
  status: 'active' | 'pending' | 'suspended' | 'trial' | 'inactive';
  trialEnds?: any;
  subscriptionId?: string;
  adminEmail?: string;
  emailVerified?: boolean;
  manualPaymentPending?: boolean;
  manualPaymentInvoiceNo?: string;
  manualPaymentDate?: string;
  manualPaymentNotes?: string;
  manualPaymentFileName?: string;
  createdAt: any;
  updatedAt: any;
}

export interface PageContent {
  id?: string;
  title: string;
  slug: string;
  content?: string;
  isLandingPage?: boolean;
  sections?: LandingPageSection[];
  seo?: {
    title: string;
    description: string;
  };
  updatedAt?: any;
}

export interface LandingPageFeatureItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface LandingPageSection {
  id: string;
  type: 'hero' | 'intro' | 'tours' | 'features' | 'reviews' | 'contact';
  enabled: boolean;
  
  // Hero section
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroCtaText?: string;
  heroCtaLink?: string;
  heroOverlay?: 'none' | 'light' | 'medium' | 'dark' | 'gradient';

  // Intro paragraph section
  introTitle?: string;
  introContent?: string;

  // Selected Tours section (columns layout)
  toursTitle?: string;
  toursSubtitle?: string;
  selectedTourIds?: string[];
  toursColumns?: 2 | 3 | 4;

  // Features list section (Why book with us)
  featuresTitle?: string;
  featuresSubtitle?: string;
  features?: LandingPageFeatureItem[];

  // Review list section (Elfsight embed)
  reviewsTitle?: string;
  reviewsSubtitle?: string;
  reviewsEmbedCode?: string;

  // Contact Information & Maps embed section
  contactTitle?: string;
  contactSubtitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  contactWhatsapp?: string;
  contactMapEmbedUrl?: string;
}

export interface InvoiceLineItem {
  id: string;
  type: 'tour_package' | 'addon' | 'transport' | 'custom_service';
  title: string;
  description?: string;
  tourId?: string;
  tourTitle?: string;
  packageName?: string;
  paxAdults?: number;
  paxChildren?: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoicePaymentButton {
  enabled: boolean;
  label: string;
  url: string;
  description?: string;
}

export interface InvoiceBankDetails {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  swiftCode?: string;
  branch?: string;
  qrisUrl?: string;
  paypalEmail?: string;
  instructions?: string;
}

export interface InvoiceCustomerInfo {
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  company?: string;
  country?: string;
  passportOrTaxId?: string;
}

export interface InvoiceAuditLog {
  id: string;
  action: 'created' | 'updated' | 'sent_email' | 'sent_whatsapp' | 'marked_paid' | 'cancelled' | 'payment_link_clicked';
  timestamp: string;
  actorName?: string;
  notes?: string;
}

export interface TenantInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName?: string;
  tenantLogo?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  tenantAddress?: string;
  tenantWebsite?: string;
  tenantTaxId?: string;

  // Customer
  customer: InvoiceCustomerInfo;

  // Dates & Currency
  issueDate: string;
  dueDate: string;
  currency: string;
  status: 'draft' | 'unpaid' | 'paid' | 'overdue' | 'cancelled';

  // Line items
  items: InvoiceLineItem[];

  // Price calculations
  subtotal: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount: number;
  taxRate?: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount?: number;
  balanceDue?: number;

  // Payment button & bank instructions
  paymentButton: InvoicePaymentButton;
  bankDetails?: InvoiceBankDetails;
  paymentInstructions?: string;

  // Notes & terms
  notes?: string;
  terms?: string;

  // Metadata & Audit
  createdById?: string;
  createdByName?: string;
  createdAt: any;
  updatedAt: any;
  sentAt?: any;
  paidAt?: any;
  bookingId?: string;
  auditLogs?: InvoiceAuditLog[];
}

export type ActivityWaiverType = 'adventure' | 'water_sports' | 'trekking' | 'sightseeing' | 'transport' | 'custom';

export interface WaiverTemplate {
  id: string;
  tenantId: string;
  title: string;
  activityType: ActivityWaiverType;
  description?: string;
  termsContent: string;
  isDefault?: boolean;
  active: boolean;

  // Requirement toggles
  requirePassportId: boolean;
  requireEmergencyContact: boolean;
  requireMedicalChecklist: boolean;
  requireMinorParentSignature: boolean;
  requirePhotoVideoConsent: boolean;

  // Custom medical declaration questions
  medicalQuestions?: string[];

  // Tour associations
  appliedTourIds?: string[];

  createdAt: any;
  updatedAt: any;
}

export interface WaiverParticipant {
  fullName: string;
  passportOrId?: string;
  dateOfBirth?: string;
  ageGroup: 'adult' | 'child' | 'infant';
  isMinor?: boolean;
  parentGuardianName?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string[];
  medicalNotes?: string;
}

export interface SignedWaiver {
  id: string;
  tenantId: string;
  bookingId?: string;
  bookingCode?: string;
  tourId?: string;
  tourTitle?: string;
  tourDate?: string;
  templateId: string;
  templateTitle: string;
  activityType?: ActivityWaiverType;

  // Primary Signer
  signerName: string;
  signerEmail: string;
  signerPhone: string;
  signerCountry?: string;

  // Participants & minors covered
  participants: WaiverParticipant[];

  // Declarations & Consents
  termsAccepted: boolean;
  medicalDeclared: boolean;
  photoConsentAccepted: boolean;
  minorConsentAccepted?: boolean;

  // Digital signature & security audit
  signatureDataUrl: string;
  signedAt: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'valid' | 'revoked';

  notes?: string;
  createdAt: any;
  updatedAt?: any;
}

