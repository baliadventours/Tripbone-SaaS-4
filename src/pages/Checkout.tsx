import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType, getActiveTenantId } from "../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  limit,
  getDocs,
  runTransaction,
  onSnapshot,
} from '@/src/lib/firebase';
import { Tour, TourPackage, Booking, AddOn, TransportOption, Coupon, UserProfile } from "../types";
import { useTenant } from "../lib/TenantContext";
import { getEffectiveCutOffHours, isSlotCutOff, isDateFullyCutOff, formatCutOffNotice, validateBookingCutOff } from "../lib/cutOffUtils";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Receipt,
  Check,
  Clock,
  Info,
  ShieldCheck,
  CreditCard,
  Wallet,
  Banknote,
  DollarSign,
  QrCode,
  Zap,
  Loader2,
  ArrowLeft,
  Calendar,
  Users,
  Baby,
  MapPin,
  Star,
  Plus,
  Minus,
  Tag,
  Database,
  ChevronLeft,
  Car,
  Bus,
  Hotel,
  Bed,
  UserCheck,
  Building2,
  X,
  Edit2,
  AlertCircle,
  Copy,
  Globe,
} from "lucide-react";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { PayPalV6Container } from "../components/Payment/PayPalV6Container";
import { cn, parseMeetingPoint } from "../lib/utils";
import FormattedPrice from "../components/FormattedPrice";
import SmartImage from "../components/SmartImage";
import { useCurrency } from "../lib/CurrencyContext";
import { motion, AnimatePresence } from "motion/react";
import { sendBookingEmail } from "../lib/emailService";
import { sendWhatsAppNotification } from "../lib/whatsappService";
import { PaymentService, sanitizeFirestoreData } from "../services/payment/PaymentService";
import { 
  trackGABeginCheckout, 
  trackGAAddShippingInfo, 
  trackGAAddPaymentInfo, 
  trackGASelectPromotion 
} from "../lib/googleAnalytics";
import { trackPostHogBeginCheckout } from "../lib/posthog";

type CheckoutStep = "selection" | "customer" | "payment";
type PaymentMethod = "stripe" | "midtrans" | "xendit" | "razorpay" | "adyen" | "wise" | "card" | "paypal" | "bank_transfer" | "pay_on_arrival";

interface CountryWithPhoneCode {
  name: string;
  dialCode: string;
}

const COUNTRIES_WITH_CODES: CountryWithPhoneCode[] = [
  { name: "Indonesia", dialCode: "+62" },
  { name: "Australia", dialCode: "+61" },
  { name: "United States", dialCode: "+1" },
  { name: "United Kingdom", dialCode: "+44" },
  { name: "Singapore", dialCode: "+65" },
  { name: "Malaysia", dialCode: "+60" },
  { name: "Germany", dialCode: "+49" },
  { name: "France", dialCode: "+33" },
  { name: "Japan", dialCode: "+81" },
  { name: "India", dialCode: "+91" },
  { name: "Netherlands", dialCode: "+31" },
  { name: "New Zealand", dialCode: "+64" },
  { name: "Canada", dialCode: "+1" },
  { name: "South Korea", dialCode: "+82" },
  { name: "China", dialCode: "+86" },
  { name: "Russia", dialCode: "+7" },
  { name: "Afghanistan", dialCode: "+93" },
  { name: "Albania", dialCode: "+355" },
  { name: "Algeria", dialCode: "+213" },
  { name: "Andorra", dialCode: "+376" },
  { name: "Angola", dialCode: "+244" },
  { name: "Argentina", dialCode: "+54" },
  { name: "Armenia", dialCode: "+374" },
  { name: "Austria", dialCode: "+43" },
  { name: "Azerbaijan", dialCode: "+994" },
  { name: "Bahamas", dialCode: "+1" },
  { name: "Bahrain", dialCode: "+973" },
  { name: "Bangladesh", dialCode: "+880" },
  { name: "Belarus", dialCode: "+375" },
  { name: "Belgium", dialCode: "+32" },
  { name: "Belize", dialCode: "+501" },
  { name: "Benin", dialCode: "+229" },
  { name: "Bhutan", dialCode: "+975" },
  { name: "Bolivia", dialCode: "+591" },
  { name: "Bosnia and Herzegovina", dialCode: "+387" },
  { name: "Botswana", dialCode: "+267" },
  { name: "Brazil", dialCode: "+55" },
  { name: "Brunei", dialCode: "+673" },
  { name: "Bulgaria", dialCode: "+359" },
  { name: "Cambodia", dialCode: "+855" },
  { name: "Cameroon", dialCode: "+237" },
  { name: "Chile", dialCode: "+56" },
  { name: "Colombia", dialCode: "+57" },
  { name: "Costa Rica", dialCode: "+506" },
  { name: "Croatia", dialCode: "+385" },
  { name: "Cuba", dialCode: "+53" },
  { name: "Cyprus", dialCode: "+357" },
  { name: "Czech Republic", dialCode: "+420" },
  { name: "Denmark", dialCode: "+45" },
  { name: "Ecuador", dialCode: "+593" },
  { name: "Egypt", dialCode: "+20" },
  { name: "El Salvador", dialCode: "+503" },
  { name: "Estonia", dialCode: "+372" },
  { name: "Ethiopia", dialCode: "+251" },
  { name: "Fiji", dialCode: "+679" },
  { name: "Finland", dialCode: "+358" },
  { name: "Georgia", dialCode: "+995" },
  { name: "Ghana", dialCode: "+233" },
  { name: "Greece", dialCode: "+30" },
  { name: "Guatemala", dialCode: "+502" },
  { name: "Honduras", dialCode: "+504" },
  { name: "Hong Kong", dialCode: "+852" },
  { name: "Hungary", dialCode: "+36" },
  { name: "Iceland", dialCode: "+354" },
  { name: "Iran", dialCode: "+98" },
  { name: "Iraq", dialCode: "+964" },
  { name: "Ireland", dialCode: "+353" },
  { name: "Israel", dialCode: "+972" },
  { name: "Italy", dialCode: "+39" },
  { name: "Jamaica", dialCode: "+1" },
  { name: "Jordan", dialCode: "+962" },
  { name: "Kazakhstan", dialCode: "+7" },
  { name: "Kenya", dialCode: "+254" },
  { name: "Kuwait", dialCode: "+965" },
  { name: "Laos", dialCode: "+856" },
  { name: "Latvia", dialCode: "+371" },
  { name: "Lebanon", dialCode: "+961" },
  { name: "Lithuania", dialCode: "+370" },
  { name: "Luxembourg", dialCode: "+352" },
  { name: "Macau", dialCode: "+853" },
  { name: "Macedonia", dialCode: "+389" },
  { name: "Madagascar", dialCode: "+261" },
  { name: "Maldives", dialCode: "+960" },
  { name: "Malta", dialCode: "+356" },
  { name: "Mauritius", dialCode: "+230" },
  { name: "Mexico", dialCode: "+52" },
  { name: "Moldova", dialCode: "+373" },
  { name: "Monaco", dialCode: "+377" },
  { name: "Mongolia", dialCode: "+976" },
  { name: "Montenegro", dialCode: "+382" },
  { name: "Morocco", dialCode: "+212" },
  { name: "Myanmar", dialCode: "+95" },
  { name: "Nepal", dialCode: "+977" },
  { name: "Nicaragua", dialCode: "+505" },
  { name: "Nigeria", dialCode: "+234" },
  { name: "Norway", dialCode: "+47" },
  { name: "Oman", dialCode: "+968" },
  { name: "Pakistan", dialCode: "+92" },
  { name: "Palestine", dialCode: "+970" },
  { name: "Panama", dialCode: "+507" },
  { name: "Paraguay", dialCode: "+595" },
  { name: "Peru", dialCode: "+51" },
  { name: "Philippines", dialCode: "+63" },
  { name: "Poland", dialCode: "+48" },
  { name: "Portugal", dialCode: "+351" },
  { name: "Qatar", dialCode: "+974" },
  { name: "Romania", dialCode: "+40" },
  { name: "Saudi Arabia", dialCode: "+966" },
  { name: "Senegal", dialCode: "+221" },
  { name: "Serbia", dialCode: "+381" },
  { name: "Slovakia", dialCode: "+421" },
  { name: "Slovenia", dialCode: "+386" },
  { name: "South Africa", dialCode: "+27" },
  { name: "Spain", dialCode: "+34" },
  { name: "Sri Lanka", dialCode: "+94" },
  { name: "Sweden", dialCode: "+46" },
  { name: "Switzerland", dialCode: "+41" },
  { name: "Taiwan", dialCode: "+886" },
  { name: "Thailand", dialCode: "+66" },
  { name: "Turkey", dialCode: "+90" },
  { name: "Ukraine", dialCode: "+380" },
  { name: "United Arab Emirates", dialCode: "+971" },
  { name: "Uruguay", dialCode: "+598" },
  { name: "Uzbekistan", dialCode: "+998" },
  { name: "Venezuela", dialCode: "+58" },
  { name: "Vietnam", dialCode: "+84" },
  { name: "Zimbabwe", dialCode: "+263" },
  { name: "Other", dialCode: "" }
];

export const getInternationalPhoneNumber = (phone: string, countryName: string): string => {
  if (!phone) return "";
  const cleanedPhone = phone.trim();
  
  // Find country dial code
  const country = COUNTRIES_WITH_CODES.find(c => c.name === countryName);
  if (!country || !country.dialCode) {
    if (cleanedPhone.startsWith("+")) return cleanedPhone;
    return cleanedPhone;
  }
  
  const dialCode = country.dialCode;
  const cleanDial = dialCode.replace(/\D/g, "");
  const cleanPhone = cleanedPhone.replace(/\D/g, "");
  
  if (cleanPhone.startsWith(cleanDial)) {
    return `+${cleanPhone}`;
  }
  
  if (cleanPhone.startsWith("0")) {
    return `+${cleanDial}${cleanPhone.substring(1)}`;
  }
  
  return `+${cleanDial}${cleanPhone}`;
};

export default function Checkout() {
  const { tourId } = useParams();
  const { tenantId } = useTenant();
  const { formatPrice, selectedCurrency, rates } = useCurrency();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tour, setTour] = useState<Tour | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<CheckoutStep>((searchParams.get("step") as CheckoutStep) || "selection");
  const [isBooking, setIsBooking] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Sync step to URL
  useEffect(() => {
    const currentStep = searchParams.get("step") || "selection";
    if (currentStep !== step) {
      setStep(currentStep as CheckoutStep);
    }
  }, [searchParams]);

  const validateStep = (currentStep: CheckoutStep): { isValid: boolean; error: string | null } => {
    if (currentStep === "selection") {
      if (!date) return { isValid: false, error: "Please select a date" };
      
      // Cut-off time validation
      const cutOffCheck = validateBookingCutOff(tour, date, selectedTime);
      if (!cutOffCheck.isValid) {
        return { isValid: false, error: cutOffCheck.error || "The booking cut-off time for this departure has passed. Please choose another date or time." };
      }

      if (!selectedPackage) return { isValid: false, error: "Please select a tour package" };
      if (availableTransports.length > 0 && !selectedTransport) return { isValid: false, error: "Please select a transport / pick-up option" };
      if (selectedTransport && selectedTransport.maxCapacity && (adults + children) > selectedTransport.maxCapacity) {
        return { isValid: false, error: `The selected transport option (${selectedTransport.name}) only accommodates up to ${selectedTransport.maxCapacity} passengers. Please select a larger option.` };
      }
      if (tour?.timeSlots?.length && !selectedTime) return { isValid: false, error: "Please select a time slot" };
      if (adults + children === 0) return { isValid: false, error: "Please add at least one traveler" };
      if (selectedPackage && selectedPackage.tiers && selectedPackage.tiers.length > 0) {
        const minRequired = Math.min(...selectedPackage.tiers.map(t => t.minParticipants));
        const totalPax = adults + children;
        if (totalPax < minRequired) {
          return { isValid: false, error: `Minimum participants required for ${selectedPackage.name} is ${minRequired} people. Your current selection is ${totalPax} traveler(s).` };
        }
      }
      if (spotsLeft !== null && (adults + children) > spotsLeft) return { isValid: false, error: "Not enough spots available for this selection" };
      if ((selectedTransportType === 'shared' || selectedTransportType === 'private') && !customerData.pickupAddress.trim()) {
        return { isValid: false, error: "Please enter your hotel name and address for pickup arrangement" };
      }
    }

    if (currentStep === "customer") {
      const { fullName, email, phone, nationality } = customerData;
      if (!fullName.trim()) return { isValid: false, error: "Full name is required" };
      if (!email.trim()) return { isValid: false, error: "Email is required" };
      if (!phone.trim()) return { isValid: false, error: "Phone number is required" };
      if (!nationality.trim()) return { isValid: false, error: "Nationality is required" };
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email.trim() && !emailRegex.test(email)) return { isValid: false, error: "Invalid email format" };
    }

    return { isValid: true, error: null };
  };

  const updateStep = (newStep: CheckoutStep) => {
    // Determine the direction
    const steps: CheckoutStep[] = ["selection", "customer", "payment"];
    const currentIndex = steps.indexOf(step);
    const targetIndex = steps.indexOf(newStep);

    // If moving forward, validate current step
    if (targetIndex > currentIndex) {
      const validation = validateStep(step);
      if (!validation.isValid) {
        setValidationErrors([validation.error!]);
        alert(validation.error);
        
        // Find the element to scroll to
        let elementId = "";
        if (validation.error?.includes("date")) elementId = "date-picker-mobile";
        if (validation.error?.includes("package")) elementId = "package-selection";
        if (validation.error?.includes("time")) elementId = "time-selection";
        if (validation.error?.includes("traveler")) elementId = "traveler-selection-mobile";
        
        const element = elementId ? document.getElementById(elementId) : null;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
    }

    setStep(newStep);
    setValidationErrors([]);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("step", newStep);
    navigate({ search: newParams.toString() }, { replace: false });
    window.scrollTo(0, 0);

    if (tour) {
      try {
        if (newStep === "customer") {
          trackGAAddShippingInfo({
            tourTitle: tour.title,
            totalAmount: summary?.amountToPay || summary?.grandTotal || 0,
            currency: selectedCurrency || "USD",
            shippingTier: selectedTransport?.name || selectedTransportType || "Standard Pickup",
            itemsCount: (adults || 0) + (children || 0) || 1
          });
        } else if (newStep === "payment") {
          trackGABeginCheckout({
            tourTitle: tour.title,
            tourId: tour.id,
            totalAmount: summary?.amountToPay || summary?.grandTotal || 0,
            participants: (adults || 0) + (children || 0) || 1,
            currency: selectedCurrency || "USD"
          });
          trackPostHogBeginCheckout({
            tourId: tour.id,
            tourTitle: tour.title,
            totalPrice: summary?.amountToPay || summary?.grandTotal || 0,
            currency: selectedCurrency || "USD",
            paxCount: (adults || 0) + (children || 0) || 1,
            step: 3
          });
        }
      } catch (trackErr) {
        console.warn("[Analytics] Checkout tracking notice:", trackErr);
      }
    }
  };

  const validateCustomerData = () => {
    const { fullName, email, phone, nationality } = customerData;
    if (!fullName.trim() || !email.trim() || !phone.trim() || !nationality.trim()) {
      alert("Full Name, Email Address, Nationality, and Phone Number are mandatory fields.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  // URL Params
  const dateFromUrl = searchParams.get("date") || "";
  const adultsFromUrl = parseInt(searchParams.get("adults") || "1");
  const childrenFromUrl = parseInt(searchParams.get("children") || "0");
  const timeFromUrl = searchParams.get("time") || "";

  // Local State
  const [date, setDate] = useState(dateFromUrl);
  const [adults, setAdults] = useState(adultsFromUrl);
  const [children, setChildren] = useState(childrenFromUrl);
  const [selectedTime, setSelectedTime] = useState(timeFromUrl);

  useEffect(() => {
    if (!selectedTime && tour?.timeSlots && tour.timeSlots.length > 0) {
      setSelectedTime(tour.timeSlots[0]);
    }
  }, [tour, selectedTime]);
  const [showDetailsText, setShowDetailsText] = useState<Record<string, boolean>>({});

  const toggleDetailsText = (packageName: string) => {
    setShowDetailsText(prev => ({
      ...prev,
      [packageName]: !prev[packageName]
    }));
  };
  const [selectedPackage, setSelectedPackage] = useState<TourPackage | null>(
    null,
  );
  const [selectedTransport, setSelectedTransport] = useState<TransportOption | null>(null);
  const [selectedTransportType, setSelectedTransportType] = useState<'meet' | 'shared' | 'private' | null>(null);
  const [globalTransports, setGlobalTransports] = useState<TransportOption[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState<{
    accommodationId: string;
    accommodationName: string;
    category: string;
    roomTypeId: string;
    roomTypeName: string;
    price: number;
  } | null>(null);
  const [selectedGuideOption, setSelectedGuideOption] = useState<{
    guideId: string;
    language: string;
    price: number;
  } | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<
    { id: string; name: string; price: number; quantity: number }[]
  >([]);
  const [customerData, setCustomerData] = useState({
    fullName: auth.currentUser?.displayName || "",
    email: auth.currentUser?.email || "",
    phone: "",
    nationality: "",
    pickupAddress: "",
    specialRequirements: "",
  });

  const setCustomerDataFromBooking = (data: Booking['customerData']) => {
    setCustomerData({
      fullName: data.fullName || "",
      email: data.email || "",
      phone: data.phone || "",
      nationality: data.nationality || "",
      pickupAddress: data.pickupAddress || "",
      specialRequirements: data.specialRequirements || "",
    });
  };

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);
  const [expandedTransport, setExpandedTransport] = useState<string | null>('meet');
  const [showSidebarEdit, setShowSidebarEdit] = useState(false);
  const [pricingTiersExpanded, setPricingTiersExpanded] = useState<string | null>(null);
  const [expandedAddOn, setExpandedAddOn] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [showMobileGuestPicker, setShowMobileGuestPicker] = useState(false);
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!showDatePicker) return;
    const handleScroll = () => {
      setShowDatePicker(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showDatePicker]);

  const getPackagePricePerPerson = (pkg: TourPackage) => {
    if (!pkg) return 0;
    if (pkg.tiers && pkg.tiers.length > 0) {
      const totalPax = Math.max(1, (adults || 1) + (children || 0));
      const tier = pkg.tiers.find(t => totalPax >= t.minParticipants && totalPax <= t.maxParticipants);
      const applicable = tier || pkg.tiers[0];
      return applicable?.adultPrice || pkg.tiers[0]?.adultPrice || 0;
    }
    return (pkg as any).regularPrice || tour?.discountPrice || tour?.regularPrice || 0;
  };

  // Inventory tracking
  const [currentInventory, setCurrentInventory] = useState<{ bookedCount: number; max: number } | null>(null);

  useEffect(() => {
    if (!tour || !date) {
      setCurrentInventory(null);
      return;
    }
    const inventoryId = `${tour.id}_${date}_${selectedTime || 'daily'}`;
    const unsub = onSnapshot(doc(db, "inventory", inventoryId), (snapshot) => {
       if (snapshot.exists()) {
          const data = snapshot.data();
          setCurrentInventory({ bookedCount: data.bookedCount, max: data.maxCapacity });
       } else {
          setCurrentInventory({ 
            bookedCount: 0, 
            max: (tour.slotCapacity && selectedTime) ? tour.slotCapacity : (tour.maxCapacity || 999) 
          });
       }
    });
    return () => unsub();
  }, [tour, date, selectedTime]);

  const spotsLeft = currentInventory ? Math.max(0, currentInventory.max - currentInventory.bookedCount) : null;
  const isSoldOut = spotsLeft !== null && spotsLeft <= 0;
  const isLowCapacity = spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 5;

  const minRequired = useMemo(() => {
    if (selectedPackage && selectedPackage.tiers && selectedPackage.tiers.length > 0) {
      return Math.min(...selectedPackage.tiers.map(t => t.minParticipants));
    }
    if (tour?.packages && tour.packages.length > 0) {
      return Math.min(...tour.packages.map(pkg => 
        pkg.tiers && pkg.tiers.length > 0 ? Math.min(...pkg.tiers.map(t => t.minParticipants)) : 1
      ));
    }
    return 1;
  }, [selectedPackage, tour]);

  useEffect(() => {
    if ((adults + children) < minRequired) {
      if (adults < minRequired) {
        setAdults(Math.max(adults, minRequired - children));
      }
    }
  }, [minRequired, adults, children]);

  const isUnderMinParticipants = useMemo(() => {
    return (adults + children) < minRequired;
  }, [adults, children, minRequired]);

  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<React.ReactNode>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<{
    paypalClientId?: string;
    paypalSandboxClientId?: string;
    paypalMode?: 'live' | 'sandbox';
    isPaypalEnabled?: boolean;
    creditCardEnabled?: boolean;
    isStripeEnabled?: boolean;
    isMidtransEnabled?: boolean;
    isXenditEnabled?: boolean;
    isRazorpayEnabled?: boolean;
    isAdyenEnabled?: boolean;
    isWiseEnabled?: boolean;
    wiseApiToken?: string;
    wiseProfileId?: string;
    isBankTransferEnabled?: boolean;
    isPayOnArrivalEnabled?: boolean;
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    accountHolder?: string;
    bankInstructions?: string;
    providerConfigs?: Record<string, any>;
  } | null>(null);
  const [paypalErrorMessage, setPaypalErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const activeId = tenantId || getActiveTenantId() || "global";
        
        // 1. Try secure public endpoint first (never contains secret keys)
        try {
          const apiRes = await fetch(`/api/payment/public-config/${encodeURIComponent(activeId)}`);
          if (apiRes.ok) {
            const json = await apiRes.json();
            if (json?.config) {
              setPaymentSettings(json.config);
              return;
            }
          }
        } catch (apiErr) {
          console.warn("Public payment config API endpoint fallback:", apiErr);
        }

        // 2. Try sanitized public Firestore document
        const publicDocRef = doc(db, "paymentSettings_public", activeId);
        let docSnap = await getDoc(publicDocRef);
        
        // 3. Fallback to primary paymentSettings or legacy settings
        if (!docSnap.exists()) {
          const docRef = doc(db, "paymentSettings", activeId);
          docSnap = await getDoc(docRef);
        }
        if (!docSnap.exists()) {
          const legacyRef = doc(db, "settings", "payment_" + activeId);
          docSnap = await getDoc(legacyRef);
        }
        if (docSnap.exists()) {
          const settings = docSnap.data() as any;
          const paypalCfg = settings?.providerConfigs?.paypal;
          const resolvedClientId = (settings.paypalClientId || paypalCfg?.publicKey || paypalCfg?.apiKey || "").trim();
          const resolvedSandboxClientId = (settings.paypalSandboxClientId || (paypalCfg?.mode === 'sandbox' ? paypalCfg?.publicKey : '') || "").trim();
          const resolvedMode = settings.paypalMode || paypalCfg?.mode || settings.mode || "live";
          const resolvedEnabled = settings.isPaypalEnabled ?? paypalCfg?.enabled ?? false;

          setPaymentSettings({
            ...settings,
            paypalClientId: resolvedClientId,
            paypalSandboxClientId: resolvedSandboxClientId,
            paypalMode: resolvedMode,
            isPaypalEnabled: resolvedEnabled
          });
        }
      } catch (err) {
        console.error("Error fetching payment settings", err);
      }
    };
    fetchSettings();
  }, [tenantId]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile({ uid: userDoc.id, ...userDoc.data() } as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile", error);
        }
      } else {
        setUserProfile(null);
      }
    };
    fetchUserProfile();
  }, [auth.currentUser]);

  useEffect(() => {
    const fetchTourAndBooking = async () => {
      const bId = searchParams.get("bookingId");
      let tourToFetchId = tourId;

      try {
        if (bId) {
          const bookingSnap = await getDoc(doc(db, "bookings", bId));
          if (bookingSnap.exists()) {
            const bData = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
            setExistingBooking(bData);
            tourToFetchId = bData.tourId;
            
            // Set initial state from booking
            setDate(bData.date);
            setAdults((bData.participants?.adults || 0));
            setChildren((bData.participants?.children || 0));
            setSelectedTime(bData.time || "");
            setCustomerDataFromBooking(bData.customerData);
            setSelectedAddOns(bData.selectedAddOns || []);
            if (bData.selectedAccommodation) {
              setSelectedAccommodation(bData.selectedAccommodation);
            }
            if (bData.selectedGuideOption) {
              setSelectedGuideOption(bData.selectedGuideOption);
            }
            
            // If it's an upgrade, we might want to jump directly to payment or customer details
            if (searchParams.get("upgrade") === "true") {
               setStep("payment");
            }
          }
        }

        if (!tourToFetchId) return;
        const docRef = doc(db, "tours", tourToFetchId);
        let docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          // Fallback: try fetching by slug
          const qSnap = await getDocs(query(collection(db, "tours"), where("slug", "==", tourToFetchId), limit(1)));
          if (!qSnap.empty) {
            docSnap = qSnap.docs[0];
          }
        }

        if (docSnap.exists()) {
          const tourData = { id: docSnap.id, ...docSnap.data() } as Tour;
           setTour(tourData);
           if (!selectedTime && tourData.timeSlots && tourData.timeSlots.length > 0) {
             setSelectedTime(tourData.timeSlots[0]);
           }

           // Auto select multi day default options if not already set
           if (tourData.tourDurationType === 'multi_day') {
             if (tourData.accommodations && tourData.accommodations.length > 0) {
               const firstAcc = tourData.accommodations[0];
               const firstRoom = firstAcc.roomTypes && firstAcc.roomTypes.length > 0 ? firstAcc.roomTypes[0] : null;
               setSelectedAccommodation(prev => prev || {
                 accommodationId: firstAcc.id,
                 accommodationName: firstAcc.name,
                 category: firstAcc.category,
                 roomTypeId: firstRoom?.id || '',
                 roomTypeName: firstRoom?.name || 'Standard',
                 price: firstRoom?.price || 0
               });
             }
             if (tourData.multiDayGuides && tourData.multiDayGuides.length > 0) {
               const firstGuide = tourData.multiDayGuides[0];
               setSelectedGuideOption(prev => prev || {
                 guideId: firstGuide.id,
                 language: firstGuide.language,
                 price: firstGuide.price || 0
               });
             }
           }
          
          if (existingBooking) {
            const pkg = tourData.packages?.find(p => p.name === existingBooking.packageName);
            if (pkg) {
              setSelectedPackage(pkg);
              setExpandedPackage(pkg.name);
            } else if (tourData.packages && tourData.packages.length > 0) {
              setSelectedPackage(tourData.packages[0]);
              setExpandedPackage(tourData.packages[0].name);
            }
            if (existingBooking.selectedAccommodation) {
              setSelectedAccommodation(existingBooking.selectedAccommodation);
            }
            if (existingBooking.selectedGuideOption) {
              setSelectedGuideOption(existingBooking.selectedGuideOption);
            }
          } else if (tourData.packages && tourData.packages.length > 0) {
            const pkgParam = searchParams.get("package");
            const matchedPkg = pkgParam 
              ? tourData.packages.find(p => 
                  p.name.toLowerCase() === pkgParam.toLowerCase() || 
                  p.name.toLowerCase() === decodeURIComponent(pkgParam).toLowerCase()
                ) 
              : null;
            const targetPkg = matchedPkg || tourData.packages[0];
            setSelectedPackage(targetPkg);
            setExpandedPackage(targetPkg?.name || null);
          } else {
            // Tour has no explicit packages array; fallback to standard tour package
            const defaultPkg: TourPackage = {
              name: "Standard Package",
              details: tourData.description || "",
              inclusions: tourData.inclusions || [],
              exclusions: tourData.exclusions || [],
              meetingPoint: tourData.meetingPoint || "",
              meetingPointType: "Meeting Point",
              tiers: [{
                minParticipants: 1,
                maxParticipants: 999,
                adultPrice: tourData.discountPrice || tourData.regularPrice || 0,
                childPrice: Math.round((tourData.discountPrice || tourData.regularPrice || 0) * 0.75)
              }]
            };
            setSelectedPackage(defaultPkg);
            setExpandedPackage(defaultPkg.name);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTourAndBooking();
  }, [tourId, searchParams]);

  useEffect(() => {
    const fetchTransports = async () => {
      try {
        const snap = await getDocs(collection(db, "globalTransports"));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as TransportOption));
        setGlobalTransports(list);
      } catch (error) {
        console.error("Error loading global transports:", error);
      }
    };
    fetchTransports();
  }, []);

  const availableTransports = useMemo(() => {
    const activePackage = selectedPackage || (tour?.packages && tour.packages.length > 0 ? tour.packages[0] : null);

    if (activePackage && Array.isArray(activePackage.transportIds)) {
      return globalTransports.filter(t => activePackage.transportIds!.includes(t.id));
    }
    if (tour?.transportIds && Array.isArray(tour.transportIds) && tour.transportIds.length > 0) {
      return globalTransports.filter(t => tour.transportIds.includes(t.id));
    }
    return globalTransports;
  }, [tour, selectedPackage, globalTransports]);

  // Synchronize and auto-select transport based on available transports and group size
  useEffect(() => {
    if (availableTransports.length === 0) return;

    const totalParticipants = adults + children;

    // If no transport is currently selected or selected transport is not in availableTransports, choose a default one
    if (!selectedTransport || !availableTransports.some(t => t.id === selectedTransport.id)) {
      const meetOpt = availableTransports.find(t => t.type === 'meet');
      const sharedOpt = availableTransports.find(t => t.type === 'shared');
      const privateOpt = availableTransports.find(t => t.type === 'private');
      const defaultOpt = meetOpt || sharedOpt || privateOpt || availableTransports[0];
      
      setSelectedTransport(defaultOpt);
      setSelectedTransportType(defaultOpt.type);
      
      // If the default is meet, sync the pickup address to the meeting point
      if (defaultOpt.type === 'meet') {
        setCustomerData(prev => ({
          ...prev,
          pickupAddress: selectedPackage?.meetingPoint || tour?.meetingPoint || "Meet directly at our adventure basecamp."
        }));
      }
      return;
    }

    // Set high-level transport type state if it differs from current selected transport type
    if (selectedTransportType !== selectedTransport.type) {
      setSelectedTransportType(selectedTransport.type);
    }

    // If the selected transport has a capacity limit and passenger count exceeds it:
    if (
      selectedTransport.maxCapacity !== undefined &&
      selectedTransport.maxCapacity !== null &&
      totalParticipants > selectedTransport.maxCapacity
    ) {
      // Find a suitable transport within the same category first (e.g. larger private car)
      const suitableSameType = availableTransports.filter(t => 
        t.type === selectedTransport.type && 
        (t.maxCapacity === undefined || t.maxCapacity === null || totalParticipants <= t.maxCapacity)
      );

      if (suitableSameType.length > 0) {
        setSelectedTransport(suitableSameType[0]);
      } else {
        // Fall back to any transport option that can accommodate this number of participants
        const suitableTransports = availableTransports.filter(t => 
          t.maxCapacity === undefined || 
          t.maxCapacity === null || 
          totalParticipants <= t.maxCapacity
        );

        if (suitableTransports.length > 0) {
          setSelectedTransport(suitableTransports[0]);
        } else {
          // If no transport option is large enough, fallback to the one with the maximum capacity
          const sortedByCapacity = [...availableTransports].sort((a, b) => 
            (b.maxCapacity || 0) - (a.maxCapacity || 0)
          );
          setSelectedTransport(sortedByCapacity[0]);
        }
      }
    }
  }, [availableTransports, selectedTransport, selectedTransportType, adults, children, selectedPackage?.meetingPoint, tour?.meetingPoint]);

  // Sync pickup address whenever selectedPackage or tour meeting point changes and Own Transport is active
  useEffect(() => {
    if (selectedTransportType === 'meet') {
      const activeMp = selectedPackage?.meetingPoint || tour?.meetingPoint || "Meet directly at our adventure basecamp.";
      setCustomerData(prev => {
        if (prev.pickupAddress !== activeMp) {
          return { ...prev, pickupAddress: activeMp };
        }
        return prev;
      });
    }
  }, [selectedPackage?.meetingPoint, tour?.meetingPoint, selectedTransportType]);

  const applicableTier = useMemo(() => {
    const pkg = selectedPackage || (tour?.packages && tour.packages.length > 0 ? tour.packages[0] : null);
    if (!pkg) return null;
    
    if (!pkg.tiers || pkg.tiers.length === 0) {
      const basePrice = (pkg as any).price || (pkg as any).regularPrice || (pkg as any).adultPrice || tour?.discountPrice || tour?.regularPrice || 0;
      return {
        minParticipants: 1,
        maxParticipants: 999,
        adultPrice: basePrice,
        childPrice: (pkg as any).childPrice || Math.round(basePrice * 0.75)
      };
    }
    
    const tiers = [...pkg.tiers].sort((a, b) => a.minParticipants - b.minParticipants);
    const totalPax = Math.max(1, adults + children);
    const count = adults > 0 ? adults : totalPax;
    
    const findTier = tiers.find(
      (t) => (count >= t.minParticipants && count <= t.maxParticipants) ||
             (totalPax >= t.minParticipants && totalPax <= t.maxParticipants)
    );
    return findTier || (count < tiers[0].minParticipants ? tiers[0] : tiers[tiers.length - 1]);
  }, [selectedPackage, tour, adults, children]);

  const getLowestAdultPrice = (pkg: TourPackage) => {
    if (!pkg) return tour?.discountPrice || tour?.regularPrice || 0;
    if (!pkg.tiers || pkg.tiers.length === 0) {
      return (pkg as any).price || (pkg as any).regularPrice || (pkg as any).adultPrice || tour?.discountPrice || tour?.regularPrice || 0;
    }
    return Math.min(...pkg.tiers.map(t => t.adultPrice));
  };

  const calculatePackagePrice = (pkg: TourPackage | null | undefined) => {
    if (!pkg) {
      const basePrice = tour?.discountPrice || tour?.regularPrice || 0;
      return (basePrice * adults) + (Math.round(basePrice * 0.75) * children);
    }
    
    if (!pkg.tiers || pkg.tiers.length === 0) {
      const fallbackPrice = (pkg as any).price || (pkg as any).regularPrice || (pkg as any).adultPrice || tour?.discountPrice || tour?.regularPrice || 0;
      const childPrice = (pkg as any).childPrice || Math.round(fallbackPrice * 0.75);
      return (fallbackPrice * adults) + (childPrice * children);
    }
    
    const tiers = [...pkg.tiers].sort((a, b) => a.minParticipants - b.minParticipants);
    const totalPax = Math.max(1, adults + children);
    
    // Calculate adult rate based on adults count or group tier
    const adultTier = tiers.find(
      (t) => (adults >= t.minParticipants && adults <= t.maxParticipants) ||
             (totalPax >= t.minParticipants && totalPax <= t.maxParticipants)
    ) || (adults < tiers[0].minParticipants ? tiers[0] : tiers[tiers.length - 1]);
    
    // Calculate child rate based on children count or group tier
    const childTier = children > 0 
      ? (tiers.find((t) => (children >= t.minParticipants && children <= t.maxParticipants) ||
                           (totalPax >= t.minParticipants && totalPax <= t.maxParticipants)) || 
         (children < tiers[0].minParticipants ? tiers[0] : tiers[tiers.length - 1]))
      : adultTier;

    const adultRate = adultTier?.adultPrice ?? ((pkg as any).price || tour?.discountPrice || tour?.regularPrice || 0);
    const childRate = childTier?.childPrice ?? Math.round(adultRate * 0.75);
    
    return (adultRate * adults) + (childRate * children);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const q = query(
        collection(db, "coupons"),
        where("code", "==", couponInput.toUpperCase()),
        where("isActive", "==", true),
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setCouponError("Invalid or expired coupon code");
        setAppliedCoupon(null);
      } else {
        const coupon = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
        } as Coupon;
        // Basic min value check
        const activePkg = selectedPackage || (tour?.packages && tour.packages.length > 0 ? tour.packages[0] : null);
        const packageTotal = calculatePackagePrice(activePkg);
        if (packageTotal < (coupon.minBookingValue || 0)) {
          setCouponError(
            <span>Min booking value for this coupon is <FormattedPrice amount={coupon.minBookingValue || 0} /></span>
          );
          setAppliedCoupon(null);
        } else {
          setAppliedCoupon(coupon);
          setCouponInput("");
          try {
            const discVal = coupon.discountType === 'percentage' ? (packageTotal * (coupon.discountValue / 100)) : coupon.discountValue;
            trackGASelectPromotion(coupon.code || couponInput, discVal);
          } catch (e) {
            console.warn('[Analytics] Coupon tracking notice:', e);
          }
        }
      }
    } catch (error) {
      setCouponError("Failed to validate coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const summary = useMemo(() => {
    const activePackage = selectedPackage || (tour?.packages && tour.packages.length > 0 ? tour.packages[0] : null);
    const packageTotal = calculatePackagePrice(activePackage);
    const addonsTotal = selectedAddOns.reduce(
      (sum, addon) => sum + (addon.price || 0) * (addon.quantity || 1),
      0,
    );

    const accommodationTotal = selectedAccommodation ? (selectedAccommodation.price || 0) : 0;
    const guideTotal = selectedGuideOption ? (selectedGuideOption.price || 0) : 0;

    let transportTotal = 0;
    if (selectedTransport && selectedTransport.type !== "meet") {
      if (selectedTransport.priceType === "per_person") {
        transportTotal = (selectedTransport.price || 0) * (adults + children);
      } else {
        transportTotal = selectedTransport.price || 0;
      }
    }

    let discount = 0;
    let agentDiscount = 0;

    const baseForDiscount = packageTotal + accommodationTotal + guideTotal;

    if (userProfile?.role === "agent" && userProfile.discountRate) {
      agentDiscount = (baseForDiscount * userProfile.discountRate) / 100;
      discount = agentDiscount;
    } else if (appliedCoupon) {
      if (appliedCoupon.discountType === "percentage") {
        discount = (baseForDiscount * appliedCoupon.discountValue) / 100;
      } else {
        discount = appliedCoupon.discountValue;
      }
    } else if (existingBooking?.discountAmount) {
      // Keep existing discount if applicable
      discount = existingBooking.discountAmount;
    }

    const grandTotal = Math.max(0, packageTotal + accommodationTotal + guideTotal + addonsTotal + transportTotal - discount);
    const amountPaid = (existingBooking?.proposedUpdate?.oldTotal !== undefined) 
      ? existingBooking.proposedUpdate.oldTotal 
      : (existingBooking?.totalAmount || 0);

    const amountToPay = existingBooking ? Math.max(0, grandTotal - amountPaid) : grandTotal;

    return {
      packageTotal,
      accommodationTotal,
      guideTotal,
      transportTotal,
      addonsTotal,
      discount,
      agentDiscount,
      grandTotal,
      amountToPay,
      amountPaid
    };
  }, [selectedPackage, tour, selectedAccommodation, selectedGuideOption, selectedAddOns, selectedTransport, adults, children, appliedCoupon, existingBooking, userProfile]);

const days = useMemo(() => {
  const arr = [];
  const start = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    arr.push(d);
  }
  return arr;
}, []);

const activePaypalCurrency = useMemo(() => {
  return ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CNY', 'SGD', 'CHF'].includes(selectedCurrency) ? selectedCurrency : "USD";
}, [selectedCurrency]);

const activePaypalAmount = useMemo(() => {
  return activePaypalCurrency === "USD" 
    ? summary.amountToPay 
    : summary.amountToPay * (rates[activePaypalCurrency] || 1);
}, [activePaypalCurrency, summary.amountToPay, rates]);

const safeDescription = useMemo(() => {
  const tourTitle = tour?.title || "Tour Booking";
  const packageName = selectedPackage?.name || "Package";
  return `${tourTitle} - ${packageName}`.substring(0, 120);
}, [tour?.title, selectedPackage?.name]);

const toggleAddOn = (addon: AddOn) => {
    const existing = selectedAddOns.find((a) => a.id === addon.id);
    if (existing) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.id !== addon.id));
    } else {
      const quantity = addon.unit === "per person" ? adults + children : 1;
      setSelectedAddOns([
        ...selectedAddOns,
        { id: addon.id, name: addon.name, price: addon.price, quantity },
      ]);
    }
  };

  const updateAddOnQuantity = (addonId: string, delta: number) => {
    setSelectedAddOns(prev => prev.map(a => {
      if (a.id === addonId) {
        return { ...a, quantity: Math.max(1, a.quantity + delta) };
      }
      return a;
    }));
  };

  const handlePayPalApprove = async (data: any, actions: any) => {
    try {
      const details = await actions.order.capture();
      await handleFinalBooking(details.id);
    } catch (err) {
      console.error("PayPal capture error:", err);
      alert("Payment captured but booking failed to finalize. Our team will contact you.");
    }
  };

  const handleFinalBooking = async (paymentId?: string) => {
    if (!selectedPackage || !date) return;
    setIsBooking(true);
    try {
      const isUpgrade = !!existingBooking;
      
      let merchantFee = 0;
      let supplierEarnings = 0;
      let supplierEmail = "";

      if (tour?.supplierId) {
        // Fetch supplier's commission rate and email
        try {
          const supplierDoc = await getDoc(doc(db, "users", tour.supplierId));
          if (supplierDoc.exists()) {
            const supplierData = supplierDoc.data() as UserProfile;
            const commissionRate = supplierData.commissionRate || 10; // Default 10% if not set
            merchantFee = (summary.grandTotal * commissionRate) / 100;
            supplierEarnings = summary.grandTotal - merchantFee;
            supplierEmail = supplierData.email || supplierData.publicEmail || "";
          }
        } catch (err) {
          console.error("Error fetching supplier data", err);
          // Fallback to default
          merchantFee = (summary.grandTotal * 10) / 100;
          supplierEarnings = summary.grandTotal - merchantFee;
        }
      }

      // Final fallback for supplier email from tour document cache
      if (!supplierEmail && tour) {
        supplierEmail = (tour as any).supplierEmail || (tour as any).vendorEmail || "";
      }

      const customerEmailNormalized = customerData.email.trim().toLowerCase();

      // --- Quota Check for Supplier ---
      if (tour?.supplierId) {
        try {
          const { checkQuota } = await import('../lib/quotaUtils');
          const supplierDoc = await getDoc(doc(db, "users", tour.supplierId));
          if (supplierDoc.exists()) {
            const supplierData = supplierDoc.data();
            const quota = await checkQuota(supplierData, 'bookings');
            if (!quota.allowed) {
              alert(`Booking Failed: The tour operator has reached their booking limit for the current billing period.`);
              setIsBooking(false);
              return;
            }
          }
        } catch (err) {
          console.error("Quota check failed", err);
        }
      }
      
      // --- START: AUTOMATED CAPACITY CHECK ---
      const totalParticipants = adults + children;
      const effectiveMaxCapacity = (tour?.slotCapacity && selectedTime) ? tour.slotCapacity : (tour?.maxCapacity || 999);
      
      if (tour?.maxCapacity || tour?.slotCapacity) {
        try {
          const inventoryId = `${tour.id}_${date}_${selectedTime || 'daily'}`;
          const inventoryRef = doc(db, "inventory", inventoryId);
          
          await runTransaction(db, async (transaction) => {
            let invDoc;
            try {
              invDoc = await transaction.get(inventoryRef);
            } catch (err) {
              handleFirestoreError(err, OperationType.GET, `inventory/${inventoryId}`);
              throw err;
            }

            let currentBooked = 0;
            if (invDoc.exists()) {
              currentBooked = invDoc.data().bookedCount;
            }
            
            if (currentBooked + totalParticipants > effectiveMaxCapacity) {
              throw new Error(`Insufficient capacity. Only ${effectiveMaxCapacity - currentBooked} spots left for this selection.`);
            }
            
            try {
              if (invDoc.exists()) {
                transaction.update(inventoryRef, {
                  bookedCount: currentBooked + totalParticipants,
                  updatedAt: serverTimestamp()
                });
              } else {
                transaction.set(inventoryRef, {
                  tourId: tour.id,
                  date,
                  timeSlot: selectedTime || 'daily',
                  bookedCount: totalParticipants,
                  maxCapacity: effectiveMaxCapacity,
                  updatedAt: serverTimestamp()
                });
              }
            } catch (err) {
              handleFirestoreError(err, invDoc.exists() ? OperationType.UPDATE : OperationType.CREATE, `inventory/${inventoryId}`);
              throw err;
            }
          });
        } catch (err: any) {
          console.error("Availability error:", err);
          alert(err.message || "Could not verify availability. Please try again.");
          setIsBooking(false);
          return;
        }
      }
      // --- END: AUTOMATED CAPACITY CHECK ---

      const activeTenant = (tour as any)?.tenantId || tenantId || getActiveTenantId() || 'global';
      const bookingData: any = {
        tenantId: activeTenant,
        tenantSlug: (tour as any)?.tenantSlug || '',
        tenantName: (tour as any)?.tenantName || '',
        tourId: tour?.id,
        tourTitle: tour?.title,
        userId: auth.currentUser?.uid || "anonymous",
        supplierId: tour?.supplierId || null,
        supplierName: tour?.supplierName || tour?.vendor || tour?.businessName || '',
        supplierEmail,
        customerData: {
          ...customerData,
          pickupAddress: selectedTransportType === 'meet' 
            ? (selectedPackage?.meetingPoint || tour?.meetingPoint || customerData.pickupAddress || "Meet directly at our adventure basecamp.") 
            : customerData.pickupAddress,
          phone: getInternationalPhoneNumber(customerData.phone, customerData.nationality),
          email: customerEmailNormalized
        },
        date,
        participants: { adults, children },
        time: selectedTime,
        packageName: selectedPackage.name,
        selectedTransport: selectedTransport ? {
          id: selectedTransport.id,
          name: selectedTransport.name,
          type: selectedTransport.type,
          price: selectedTransport.price,
          priceType: selectedTransport.priceType,
          carType: selectedTransport.carType || ""
        } : null,
        selectedAccommodation: selectedAccommodation ? {
          accommodationId: selectedAccommodation.accommodationId,
          accommodationName: selectedAccommodation.accommodationName,
          category: selectedAccommodation.category,
          roomTypeId: selectedAccommodation.roomTypeId,
          roomTypeName: selectedAccommodation.roomTypeName,
          price: selectedAccommodation.price
        } : null,
        selectedGuideOption: selectedGuideOption ? {
          guideId: selectedGuideOption.guideId,
          language: selectedGuideOption.language,
          price: selectedGuideOption.price
        } : null,
        transportTotal: summary.transportTotal,
        selectedAddOns,
        totalAmount: summary.grandTotal,
        couponCode: appliedCoupon?.code || existingBooking?.couponCode || "",
        discountAmount: summary.discount,
        agentDiscount: summary.agentDiscount,
        merchantFee,
        supplierEarnings,
        bookedBy: userProfile ? {
          uid: userProfile.uid,
          name: userProfile.displayName,
          email: userProfile.email,
          role: userProfile.role
        } : {
          uid: 'anonymous',
          name: customerData.fullName,
          email: customerData.email,
          role: 'customer'
        },
        status: (summary.grandTotal <= 0 || Boolean(paymentId)) 
          ? "confirmed" 
          : ((paymentMethod === 'bank_transfer' || paymentMethod === 'pay_on_arrival' || paymentMethod === 'wise') ? 'pending' : 'pending'),
        updatedAt: serverTimestamp(),
        paymentId: paymentId || existingBooking?.paymentId || null,
        paymentMethod,
        paymentStatus: (summary.grandTotal <= 0 || Boolean(paymentId)) 
          ? 'paid' 
          : ((paymentMethod === 'bank_transfer' || paymentMethod === 'pay_on_arrival' || paymentMethod === 'wise') ? 'pending' : 'pending'),
        payoutStatus: 'pending',
        pricingBreakdown: {
          adultRate: applicableTier?.adultPrice || 0,
          childRate: applicableTier?.childPrice || 0,
          packageTotal: summary.packageTotal,
          transportTotal: summary.transportTotal
        }
      };

      let finalBookingId = "";

      if (isUpgrade && existingBooking) {
        try {
          await updateDoc(doc(db, "bookings", existingBooking.id), sanitizeFirestoreData(bookingData));
          finalBookingId = existingBooking.id;
        } catch (err) {
          handleFirestoreError(err, 'update' as any, `bookings/${existingBooking.id}`);
        }
        
        const finalBooking = { id: finalBookingId, ...bookingData } as Booking;
        
        // Dispatch notifications in the background so they do not block instant checkout completion UX
        Promise.all([
          sendBookingEmail('booking_changed', finalBooking, { upgraded: true, upgradePaid: true }),
          sendBookingEmail('admin_new_booking', finalBooking, { note: "UPGRADE PAID via " + paymentMethod }),
          sendWhatsAppNotification('booking_status_updated', finalBooking)
        ]).catch((err) => {
          console.error("Upgrade notification error:", err);
        });
        
        navigate(`/booking-success/${finalBookingId}`);
        return;
      }

      // Generate a clean, shortened 8-character capitalized booking ID
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let generatedId = '';
      for (let i = 0; i < 8; i++) {
        generatedId += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      try {
        await setDoc(doc(db, "bookings", generatedId), { ...sanitizeFirestoreData(bookingData), createdAt: serverTimestamp() });
        finalBookingId = generatedId;
      } catch (err) {
        handleFirestoreError(err, 'create' as any, 'bookings');
      }

      const newBooking = { id: finalBookingId, ...bookingData } as Booking;
      
      // Send Email & WhatsApp Notifications in the background so the user is not held back on payment completion UX
      const templateType = (paymentMethod === 'bank_transfer' || paymentMethod === 'pay_on_arrival' || paymentMethod === 'wise') ? 'booking_pending' : 'booking_confirmed';
      Promise.all([
        sendBookingEmail(templateType, newBooking).catch(err => console.error("Send Customer Email Error:", err)),
        sendBookingEmail('admin_new_booking', newBooking).catch(err => console.error("Send Admin New Booking Email Error:", err)),
        // Notify Supplier if it's not an admin tour or if we have a supplier email
        ((newBooking.supplierId && newBooking.supplierId !== 'admin') || (newBooking.supplierEmail && newBooking.supplierEmail !== ''))
          ? sendBookingEmail('supplier_new_booking', newBooking).catch(err => console.error("Send Supplier Email Error:", err))
          : Promise.resolve(),
        // Trigger WhatsApp Notifications
        (paymentMethod !== 'bank_transfer' && paymentMethod !== 'pay_on_arrival' && paymentMethod !== 'wise')
          ? sendWhatsAppNotification('booking_confirmation', newBooking).catch(err => console.error("Send Customer WhatsApp Error:", err))
          : Promise.resolve(),
        sendWhatsAppNotification('admin_notification', newBooking).catch(err => console.error("Send Admin WhatsApp Error:", err))
      ]).catch((err) => {
        console.error("Booking notification error:", err);
      });
      
      // Trigger online payment gateway checkout session if applicable
      if (['stripe', 'midtrans', 'xendit', 'razorpay', 'adyen', 'wise'].includes(paymentMethod)) {
        try {
          const checkoutRes = await PaymentService.createCheckoutForBooking(
            {
              id: finalBookingId,
              tourTitle: tour?.title || 'Tour Booking',
              customerData: {
                fullName: customerData.fullName,
                email: customerEmailNormalized,
                phone: customerData.phone,
              },
              totalAmount: summary.grandTotal,
              currency: 'USD',
            },
            tenantId || 'global',
            window.location.origin,
            paymentMethod as any
          );
          if (checkoutRes.checkoutUrl) {
            window.location.href = checkoutRes.checkoutUrl;
            return;
          }
        } catch (checkoutErr) {
          console.error("Online gateway checkout creation error:", checkoutErr);
        }
      }

      navigate(`/booking-success/${finalBookingId}`);
    } catch (error: any) {
      console.error("Booking failed", error);
      let errorMessage = error?.message || (typeof error === 'string' ? error : "Unknown error");
      
      // Try to parse JSON error from handleFirestoreError
      try {
        if (errorMessage.startsWith('{') && errorMessage.endsWith('}')) {
          const parsed = JSON.parse(errorMessage);
          if (parsed.error) {
            errorMessage = parsed.error;
            if (errorMessage.includes('Missing or insufficient permissions')) {
              errorMessage = "Permission Denied: You do not have authorization to create this booking or inventory is restricted.";
            }
          }
        }
      } catch (e) {
        // Not JSON, keep original
      }
      
      alert(`Booking Failed: ${errorMessage}`);
    } finally {
      setIsBooking(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  if (!tour)
    return (
      <div className="p-20 text-center text-red-500 font-bold">
        Tour not found
      </div>
    );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans pb-28 text-left">
        {/* Mobile Header */}
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-50 px-4 py-3.5 flex items-center justify-between shadow-xs">
          <button
            onClick={() => {
              if (step === 'selection') navigate(-1);
              else if (step === 'customer') updateStep('selection');
              else if (step === 'payment') updateStep('customer');
            }}
            className="p-2 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="text-center min-w-0 px-2 flex-1">
            <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider block">
              {step === 'selection' && 'Step 1 of 3 • Options'}
              {step === 'customer' && 'Step 2 of 3 • Details'}
              {step === 'payment' && 'Step 3 of 3 • Payment'}
            </span>
            <h1 className="text-xs font-bold text-neutral-900 truncate max-w-[220px] mx-auto">
              {tour.title}
            </h1>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-neutral-100 h-1">
          <div
            className="bg-primary h-1 transition-all duration-300"
            style={{
              width:
                step === 'selection' ? '33.3%' :
                step === 'customer' ? '66.6%' : '100%'
            }}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-5">
          {/* STEP 1: Options (Date & Guests quick summary + Package + Transport + Add-ons) */}
          {step === 'selection' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Clean Airbnb Date & Travelers Modifier Card (Pre-filled, tap to edit) */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Your Trip Schedule</span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="h-3 w-3 text-emerald-600" /> Confirmed
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Date Selector Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileDatePicker(!showMobileDatePicker);
                      setShowMobileGuestPicker(false);
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      showMobileDatePicker ? "border-neutral-900 bg-neutral-50/50" : "border-neutral-200 bg-white hover:border-neutral-300"
                    )}
                  >
                    <span className="text-[9px] font-bold uppercase text-neutral-400 block tracking-wider">Dates</span>
                    <span className="text-xs font-bold text-neutral-900 block truncate mt-0.5">
                      {date 
                        ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : "Select Date"}
                      {selectedTime && ` • ${selectedTime}`}
                    </span>
                  </button>

                  {/* Guests Selector Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileGuestPicker(!showMobileGuestPicker);
                      setShowMobileDatePicker(false);
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      showMobileGuestPicker ? "border-neutral-900 bg-neutral-50/50" : "border-neutral-200 bg-white hover:border-neutral-300"
                    )}
                  >
                    <span className="text-[9px] font-bold uppercase text-neutral-400 block tracking-wider">Travelers</span>
                    <span className="text-xs font-bold text-neutral-900 block truncate mt-0.5">
                      {adults + children} Guest{(adults + children) > 1 ? 's' : ''}
                    </span>
                  </button>
                </div>

                {/* Collapsible Date Picker */}
                <AnimatePresence>
                  {showMobileDatePicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-2 border-t border-neutral-100"
                    >
                      <div className="bg-neutral-50/80 p-3 rounded-xl border border-neutral-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              const newM = new Date(currentMonth);
                              newM.setMonth(newM.getMonth() - 1);
                              const today = new Date();
                              if (newM.getFullYear() > today.getFullYear() || (newM.getFullYear() === today.getFullYear() && newM.getMonth() >= today.getMonth())) {
                                setCurrentMonth(newM);
                              }
                            }}
                            className="p-1 rounded bg-white text-neutral-700 border border-neutral-200 cursor-pointer"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <span className="font-bold text-xs text-neutral-900 uppercase">
                            {currentMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newM = new Date(currentMonth);
                              newM.setMonth(newM.getMonth() + 1);
                              setCurrentMonth(newM);
                            }}
                            className="p-1 rounded bg-white text-neutral-700 border border-neutral-200 cursor-pointer"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] text-neutral-400 uppercase">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {(() => {
                            const year = currentMonth.getFullYear();
                            const month = currentMonth.getMonth();
                            const firstDay = new Date(year, month, 1).getDay();
                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                            const today = new Date(); today.setHours(0,0,0,0);
                            const cells = [];
                            for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} />);
                            for (let d = 1; d <= daysInMonth; d++) {
                              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                              const isPast = new Date(year, month, d) < today;
                              const isSelected = date === dateStr;
                              cells.push(
                                <button
                                  key={d}
                                  type="button"
                                  disabled={isPast}
                                  onClick={() => {
                                    setDate(dateStr);
                                    setShowMobileDatePicker(false);
                                  }}
                                  className={cn(
                                    "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer",
                                    isSelected ? "bg-neutral-900 text-white" : isPast ? "text-neutral-300 line-through opacity-40 cursor-not-allowed" : "text-neutral-800 bg-white border border-neutral-200 hover:border-neutral-900"
                                  )}
                                >
                                  {d}
                                </button>
                              );
                            }
                            return cells;
                          })()}
                        </div>

                        {/* Preferred Departure Time Slots */}
                        {tour.timeSlots && tour.timeSlots.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-neutral-200">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Departure Time</span>
                            <div className="grid grid-cols-3 gap-1.5">
                              {tour.timeSlots.map(time => (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => setSelectedTime(time)}
                                  className={cn(
                                    "py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                                    selectedTime === time ? "bg-neutral-900 text-white border-neutral-900" : "bg-white border-neutral-200 text-neutral-700"
                                  )}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsible Guest Picker */}
                <AnimatePresence>
                  {showMobileGuestPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-2 border-t border-neutral-100"
                    >
                      <div className="bg-neutral-50/80 p-3 rounded-xl border border-neutral-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-neutral-900 block">Adults</span>
                            <span className="text-[10px] text-neutral-400">Age 12+</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAdults(Math.max(1, adults - 1))}
                              disabled={adults <= 1 || (adults + children) <= minRequired}
                              className="h-7 w-7 rounded-lg border border-neutral-300 bg-white font-bold text-xs disabled:opacity-30 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{adults}</span>
                            <button
                              type="button"
                              onClick={() => setAdults(adults + 1)}
                              className="h-7 w-7 rounded-lg border border-neutral-300 bg-white font-bold text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                          <div>
                            <span className="text-xs font-bold text-neutral-900 block">Children</span>
                            <span className="text-[10px] text-neutral-400">Age 2-11</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setChildren(Math.max(0, children - 1))}
                              disabled={children <= 0 || (adults + children) <= minRequired}
                              className="h-7 w-7 rounded-lg border border-neutral-300 bg-white font-bold text-xs disabled:opacity-30 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{children}</span>
                            <button
                              type="button"
                              onClick={() => setChildren(children + 1)}
                              className="h-7 w-7 rounded-lg border border-neutral-300 bg-white font-bold text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Package Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-neutral-900">Select Package</h2>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                    {tour.packages.length} Option{tour.packages.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3">
                  {tour.packages.map((pkg, idx) => {
                    const isSelected = selectedPackage?.name === pkg.name;
                    const isExpanded = expandedPackage === pkg.name;
                    const pkgTotal = calculatePackagePrice(pkg);
                    const minReq = pkg.tiers && pkg.tiers.length > 0 ? Math.min(...pkg.tiers.map(t => t.minParticipants)) : 1;
                    const isUnderMin = (adults + children) < minReq;

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "border rounded-2xl overflow-hidden bg-white transition-all",
                          isSelected ? "border-2 border-neutral-900 shadow-sm" : "border-neutral-200 hover:border-neutral-300"
                        )}
                      >
                        {/* Collapsed Header */}
                        <div
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedPackage(null);
                            } else {
                              setSelectedPackage(pkg);
                              setExpandedPackage(pkg.name);
                            }
                          }}
                          className="flex items-center justify-between p-4 cursor-pointer bg-white hover:bg-neutral-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                              isSelected ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
                            )}>
                              {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                            </div>
                            <h3 className="font-bold text-sm text-neutral-900 leading-snug">{pkg.name}</h3>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="font-bold text-neutral-900 text-sm">
                                <FormattedPrice amount={getPackagePricePerPerson(pkg)} />
                              </span>
                              <span className="text-[10px] text-neutral-400 block font-normal">/ person</span>
                            </div>
                            <div className="p-1 rounded-full text-neutral-400">
                              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 space-y-3.5 text-xs text-left">
                            {isUnderMin && (
                              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-left">
                                <p className="text-xs font-bold text-rose-700">Requirement Notice</p>
                                <p className="text-[11px] text-rose-600 font-medium mt-0.5">
                                  Requires at least <span className="font-bold underline">{minReq} travelers</span>. Currently: {adults + children} pax.
                                </p>
                              </div>
                            )}

                            {(pkg.details || (pkg as any).description) && (
                              <p className="text-neutral-600 font-medium leading-relaxed bg-white p-3 rounded-xl border border-neutral-200">
                                {pkg.details || (pkg as any).description}
                              </p>
                            )}

                            {/* Free Cancellation Guarantee */}
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 p-2.5 rounded-xl text-emerald-800 text-[11px] font-medium">
                              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span>Free cancellation before travel date</span>
                            </div>

                            {/* Inclusions */}
                            {pkg.inclusions && pkg.inclusions.filter(Boolean).length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="font-bold text-neutral-900 uppercase tracking-wider text-[10px] block">Inclusions:</span>
                                <ul className="space-y-1">
                                  {pkg.inclusions.filter(Boolean).map((inc, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-neutral-700 text-xs">
                                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                      <span>{inc}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Preferred Departure Time slot selector inside package details */}
                            {tour.timeSlots && tour.timeSlots.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-neutral-200">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-neutral-900 uppercase tracking-wider text-[10px] block">Select Departure Time:</span>
                                  {selectedTime && <span className="text-[10px] font-bold text-primary">{selectedTime}</span>}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {tour.timeSlots.map(time => (
                                    <button
                                      key={time}
                                      type="button"
                                      onClick={() => {
                                        setSelectedTime(time);
                                        setSelectedPackage(pkg);
                                      }}
                                      className={cn(
                                        "px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer",
                                        selectedTime === time
                                          ? "bg-primary border-primary text-white shadow-xs shadow-primary/20"
                                          : "bg-white border-neutral-300 text-neutral-700 hover:border-neutral-900"
                                      )}
                                    >
                                      {time}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Select Package Action */}
                            <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-3">
                              <div>
                                <span className="text-[10px] text-neutral-400 font-medium block uppercase">Calculated Total</span>
                                <span className="font-bold text-base text-neutral-900">
                                  <FormattedPrice amount={pkgTotal} />
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPackage(pkg);
                                  setExpandedPackage(pkg.name);
                                }}
                                className={cn(
                                  "px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs",
                                  isSelected ? "bg-primary text-white shadow-xs shadow-primary/20" : "bg-white border border-neutral-300 text-neutral-800 hover:border-neutral-900"
                                )}
                              >
                                {isSelected ? 'Selected' : 'Select Package'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transportation Selection */}
              {availableTransports.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4 text-left">
                  <div className="flex items-center gap-2 text-neutral-900 font-bold text-base">
                    <Car className="h-5 w-5 text-neutral-700" />
                    <h2>Transportation Option</h2>
                  </div>

                  <div className="space-y-2.5">
                    {availableTransports.some(t => t.type === 'meet') && (
                      <div
                        onClick={() => {
                          setSelectedTransportType('meet');
                          const opt = availableTransports.find(t => t.type === 'meet');
                          if (opt) setSelectedTransport(opt);
                          setCustomerData(prev => ({
                            ...prev,
                            pickupAddress: selectedPackage?.meetingPoint || tour?.meetingPoint || "Meet directly at our adventure basecamp."
                          }));
                        }}
                        className={cn(
                          "p-3.5 rounded-xl border transition-all cursor-pointer bg-white flex items-center justify-between",
                          selectedTransportType === 'meet' ? "border-2 border-neutral-900 bg-neutral-50/50 shadow-xs" : "border-neutral-200 hover:border-neutral-300"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                            selectedTransportType === 'meet' ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
                          )}>
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-neutral-900 text-xs">Own Transport</h3>
                            <p className="text-[10px] text-neutral-400">Self-arrival to location</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Free</span>
                      </div>
                    )}

                    {availableTransports.some(t => t.type === 'shared') && (() => {
                      const sOpt = availableTransports.find(t => t.type === 'shared');
                      return (
                        <div
                          onClick={() => {
                            setSelectedTransportType('shared');
                            if (sOpt) setSelectedTransport(sOpt);
                          }}
                          className={cn(
                            "p-3.5 rounded-xl border transition-all cursor-pointer bg-white flex items-center justify-between",
                            selectedTransportType === 'shared' ? "border-2 border-neutral-900 bg-neutral-50/50 shadow-xs" : "border-neutral-200 hover:border-neutral-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                              selectedTransportType === 'shared' ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
                            )}>
                              <Bus className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-bold text-neutral-900 text-xs">Shared Transfer</h3>
                              <p className="text-[10px] text-neutral-400">Hotel shuttle pickup</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-neutral-900">
                            {sOpt ? <FormattedPrice amount={sOpt.price} /> : "Available"}/pax
                          </span>
                        </div>
                      );
                    })()}

                    {availableTransports.some(t => t.type === 'private') && (() => {
                      const pOpts = availableTransports.filter(t => t.type === 'private');
                      const totalPax = adults + children;
                      const matching = pOpts.filter(t => t.maxCapacity === undefined || t.maxCapacity === null || totalPax <= t.maxCapacity);
                      const lowest = matching.length > 0 ? Math.min(...matching.map(c => c.price)) : 0;

                      return (
                        <div
                          onClick={() => {
                            setSelectedTransportType('private');
                            const best = matching[0] || pOpts[0];
                            if (best) setSelectedTransport(best);
                          }}
                          className={cn(
                            "p-3.5 rounded-xl border transition-all cursor-pointer bg-white flex items-center justify-between",
                            selectedTransportType === 'private' ? "border-2 border-neutral-900 bg-neutral-50/50 shadow-xs" : "border-neutral-200 hover:border-neutral-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                              selectedTransportType === 'private' ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
                            )}>
                              <Car className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-bold text-neutral-900 text-xs">Private Transfer</h3>
                              <p className="text-[10px] text-neutral-400">Dedicated private car</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-neutral-900">
                            {lowest > 0 ? <>From <FormattedPrice amount={lowest} />/car</> : "Available"}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Pickup Hotel input */}
                  {selectedTransportType !== 'meet' && (
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-left">
                      <label className="text-xs font-bold text-neutral-800 block">
                        Hotel Name & Address for Pickup
                      </label>
                      <textarea
                        rows={2}
                        value={customerData.pickupAddress}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, pickupAddress: e.target.value }))}
                        placeholder="Enter your hotel name or villa address..."
                        className="w-full text-xs p-3 border border-neutral-200 rounded-xl bg-white focus:border-neutral-900 focus:outline-none transition-all font-medium"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Add-on Extras */}
              {tour.addOns && tour.addOns.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3.5 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-900 font-bold text-base">
                      <Plus className="h-5 w-5 text-neutral-700" />
                      <h2>Add-on Extras</h2>
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Optional</span>
                  </div>

                  <div className="space-y-2.5">
                    {tour.addOns.map(addon => {
                      const existing = selectedAddOns.find(a => a.id === addon.id);
                      const qty = existing ? existing.quantity : 0;

                      return (
                        <div key={addon.id} className="p-3 rounded-xl border border-neutral-200 flex items-center justify-between bg-white">
                          <div>
                            <span className="font-bold text-xs text-neutral-900 block">{addon.name}</span>
                            <span className="text-[10px] text-neutral-500 font-medium">
                              <FormattedPrice amount={addon.price} /> {addon.unit ? `/ ${addon.unit}` : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => toggleAddOn(addon)}
                                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                + Add
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateAddOnQuantity(addon.id, -1)}
                                  className="h-7 w-7 rounded-full border border-neutral-300 flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-neutral-100"
                                >
                                  -
                                </button>
                                <span className="font-bold text-xs w-4 text-center">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => updateAddOnQuantity(addon.id, 1)}
                                  className="h-7 w-7 rounded-full border border-neutral-300 flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-neutral-100"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Customer Contact Details */}
          {step === 'customer' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200 text-left">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4 text-xs">
                <div>
                  <h2 className="font-bold text-base text-neutral-900">Lead Traveler Information</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">We will send confirmation and vouchers to these contact details.</p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={customerData.fullName}
                      onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                      placeholder="e.g. Sarah Connor"
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-medium focus:border-neutral-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                      placeholder="sarah@example.com"
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-medium focus:border-neutral-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Phone Number (with WhatsApp) *</label>
                    <input
                      type="tel"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-medium focus:border-neutral-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Nationality / Country of Residence *</label>
                    <input
                      type="text"
                      value={customerData.nationality}
                      onChange={(e) => setCustomerData({ ...customerData, nationality: e.target.value })}
                      placeholder="e.g. Australia, United States, Germany..."
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-medium focus:border-neutral-900 focus:outline-none"
                    />
                  </div>

                  {selectedTransportType !== 'meet' && (
                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">Hotel Pickup Address</label>
                      <input
                        type="text"
                        value={customerData.pickupAddress}
                        onChange={(e) => setCustomerData({ ...customerData, pickupAddress: e.target.value })}
                        placeholder="Hotel name or villa street address"
                        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-medium focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Special Requirements (Optional)</label>
                    <textarea
                      rows={2}
                      value={customerData.specialRequirements}
                      onChange={(e) => setCustomerData({ ...customerData, specialRequirements: e.target.value })}
                      placeholder="Dietary requirements, physical limitations, infant seat, etc."
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-medium focus:border-neutral-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Payment & Confirmation */}
          {step === 'payment' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200 text-left">
              {/* Payment Methods */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4 text-xs">
                <h2 className="font-bold text-base text-neutral-900">Select Payment Method</h2>

                <div className="space-y-2.5">
                  {[
                    { id: 'card', name: 'Credit / Debit Card', desc: 'Secure online payment via Stripe' },
                    { id: 'paypal', name: 'PayPal', desc: 'Pay with PayPal balance or linked card' },
                    { id: 'bank_transfer', name: 'Bank Transfer / QRIS', desc: 'Instant virtual account or QR payment' },
                    { id: 'pay_on_arrival', name: 'Pay on Arrival', desc: 'Cash or card at start of tour' },
                  ].map(pm => (
                    <div
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={cn(
                        "p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                        paymentMethod === pm.id ? "border-2 border-neutral-900 bg-neutral-50/50" : "border-neutral-200 hover:border-neutral-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                          paymentMethod === pm.id ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
                        )}>
                          {paymentMethod === pm.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-neutral-900 block">{pm.name}</span>
                          <span className="text-[10px] text-neutral-400 font-medium">{pm.desc}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary & Coupon Card */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3.5 text-xs">
                <h3 className="font-bold text-neutral-900 text-sm">Price Breakdown</h3>

                <div className="space-y-2 text-neutral-600">
                  <div className="flex justify-between">
                    <span>{selectedPackage?.name} ({adults} adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} child` : ''}):</span>
                    <span className="font-bold text-neutral-900"><FormattedPrice amount={summary.packageTotal} /></span>
                  </div>
                  {summary.transportTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Transport ({selectedTransport?.name}):</span>
                      <span className="font-bold text-neutral-900"><FormattedPrice amount={summary.transportTotal} /></span>
                    </div>
                  )}
                  {summary.addonsTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Add-ons:</span>
                      <span className="font-bold text-neutral-900"><FormattedPrice amount={summary.addonsTotal} /></span>
                    </div>
                  )}
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Coupon Discount:</span>
                      <span>-<FormattedPrice amount={summary.discount} /></span>
                    </div>
                  )}
                </div>

                {/* Coupon Code Input */}
                <div className="pt-3 border-t border-neutral-100 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl font-bold uppercase text-xs focus:outline-none focus:border-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponInput}
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs cursor-pointer hover:opacity-90 disabled:opacity-40"
                    >
                      {isValidatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-rose-600 font-bold">{couponError}</p>}
                  {appliedCoupon && (
                    <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-[11px] font-bold flex justify-between items-center border border-emerald-200">
                      <span>Coupon: {appliedCoupon.code}</span>
                      <button type="button" onClick={() => setAppliedCoupon(null)} className="text-rose-600 font-bold underline">Remove</button>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-100 flex justify-between items-baseline">
                  <span className="font-bold text-neutral-900 text-sm">Total (USD):</span>
                  <span className="font-black text-xl text-neutral-900"><FormattedPrice amount={summary.grandTotal} /></span>
                </div>

                {/* Terms Agreement */}
                <div className="pt-3 border-t border-neutral-100 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="termsCheckMobile"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="h-4 w-4 rounded text-primary border-neutral-300 focus:ring-primary mt-0.5"
                  />
                  <label htmlFor="termsCheckMobile" className="text-[11px] text-neutral-600 font-normal leading-snug">
                    I agree to the <a href="/terms" className="underline font-bold text-neutral-900">Terms & Conditions</a> and understand the free cancellation policy.
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Mobile Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.06)]">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowMobileSummary(true)}
              className="text-left cursor-pointer group hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                <span>Total</span>
                <span className="text-neutral-900 font-bold flex items-center gap-0.5 underline">
                  Summary <ChevronUp className="h-3 w-3" />
                </span>
              </div>
              <span className="font-bold text-lg text-neutral-900 block leading-tight">
                <FormattedPrice amount={summary.grandTotal} />
              </span>
            </button>

            {step === 'selection' && (
              <button
                type="button"
                onClick={() => updateStep('customer')}
                disabled={!selectedPackage}
                className="px-6 py-3 bg-primary hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer"
              >
                Continue to Details
              </button>
            )}

            {step === 'customer' && (
              <button
                type="button"
                onClick={() => updateStep('payment')}
                className="px-6 py-3 bg-primary hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer"
              >
                Continue to Payment
              </button>
            )}

            {step === 'payment' && (
              <button
                type="button"
                onClick={() => handleFinalBooking()}
                disabled={isBooking || !agreedToTerms}
                className="px-6 py-3 bg-primary hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm and Pay'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20 text-left">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 md:top-[116px] z-40">
        <div className="container mx-auto px-4 lg:px-8 py-3.5 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (step === 'selection') navigate(-1);
                else {
                  const steps: CheckoutStep[] = ["selection", "customer", "payment"];
                  const prevStep = steps[steps.indexOf(step) - 1];
                  updateStep(prevStep);
                }
              }}
              className="p-2 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-neutral-900 tracking-tight">
              Confirm and pay
            </h1>
          </div>
          
          <div className="flex gap-2 md:gap-3 items-center">
            {[
              { id: "selection", label: "1. Options" },
              { id: "customer", label: "2. Details" },
              { id: "payment", label: "3. Payment" },
            ].map((s, i) => {
              const steps: CheckoutStep[] = ["selection", "customer", "payment"];
              const currentIndex = steps.indexOf(step);
              const isPast = i < currentIndex;
              const isCurrent = i === currentIndex;
              
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-semibold transition-all px-2.5 py-1 rounded-full",
                      isCurrent 
                        ? "bg-primary text-white font-bold shadow-xs shadow-primary/20" 
                        : isPast 
                          ? "text-neutral-900 font-medium" 
                          : "text-neutral-400",
                    )}
                  >
                    {s.label}
                  </span>
                  {i < 2 && <span className="text-neutral-300 text-xs">/</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 lg:px-8 py-8 md:py-10">
        <div className="grid lg:grid-cols-3 gap-10 items-start">
          {/* Left Column: Flow */}
          <div className="lg:col-span-2 space-y-10 pb-32 md:pb-0 overflow-x-hidden">
            {/* Step 1: Selection (Packages & Add-ons) */}
            {step === "selection" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3">
                {/* Package Selection */}
                <section id="package-selection" className="space-y-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                      Select your package
                    </h2>
                    <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
                      Select the best option tailored for your adventure.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {tour.packages.map((pkg, idx) => {
                      const isSelected = selectedPackage?.name === pkg.name;
                      const isExpanded = expandedPackage === pkg.name;
                      const price = calculatePackagePrice(pkg);

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "border rounded-2xl transition-all overflow-hidden bg-white shadow-xs",
                            isSelected
                              ? "border-2 border-neutral-900 shadow-sm"
                              : "border-neutral-300 hover:border-neutral-400",
                          )}
                        >
                          {/* Collapsed Header */}
                          <div
                            onClick={() => {
                              if (isExpanded) {
                                setExpandedPackage(null);
                              } else {
                                setSelectedPackage(pkg);
                                setExpandedPackage(pkg.name);
                              }
                            }}
                            className="flex items-center justify-between p-4 md:p-5 cursor-pointer bg-white hover:bg-neutral-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-3.5">
                              <div
                                className={cn(
                                  "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                                  isSelected
                                    ? "border-neutral-900 bg-neutral-900"
                                    : "border-neutral-300 bg-white",
                                )}
                              >
                                {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                              </div>
                              <h3 className="font-bold text-neutral-900 text-sm md:text-base leading-snug">
                                {pkg.name}
                              </h3>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="font-bold text-neutral-900 text-sm md:text-base">
                                  <FormattedPrice amount={getPackagePricePerPerson(pkg)} />
                                </span>
                                <span className="text-[11px] text-neutral-500 font-normal ml-1">/ person</span>
                              </div>
                              <div className="p-1 rounded-full text-neutral-400">
                                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                onClick={(e) => e.stopPropagation()}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-neutral-200 bg-neutral-50/50"
                              >
                                <div className="p-5 md:p-6 space-y-5 text-left">
                                  {/* Minimum participants restriction warning */}
                                  {(() => {
                                    const minRequired = pkg.tiers && pkg.tiers.length > 0 ? Math.min(...pkg.tiers.map(t => t.minParticipants)) : 1;
                                    const totalPax = adults + children;
                                    if (totalPax < minRequired) {
                                      return (
                                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-left">
                                          <div className="flex items-start gap-2.5">
                                            <Info className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                            <div>
                                              <p className="text-xs font-bold text-rose-700">Minimum travelers required</p>
                                              <p className="text-xs text-rose-600 mt-0.5 leading-relaxed">
                                                This package requires at least {minRequired} travelers. You currently have {totalPax} traveler(s).
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}

                                  {/* Preferred Departure time slots */}
                                  {tour.timeSlots && tour.timeSlots.length > 0 && (
                                    <div className="space-y-2 text-left mb-4">
                                      <p className="text-[11px] font-bold uppercase text-neutral-500 tracking-wider">Departure Time:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {tour.timeSlots.map(time => (
                                          <button
                                            key={time}
                                            type="button"
                                            onClick={() => setSelectedTime(time)}
                                            className={cn(
                                              "px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer focus:outline-none",
                                              selectedTime === time
                                                ? "bg-primary border-primary text-white shadow-xs shadow-primary/20"
                                                : "bg-white border-neutral-300 text-neutral-700 hover:border-neutral-900"
                                            )}
                                          >
                                            {time}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Trust guarantee highlights matching Airbnb clean style */}
                                  <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3.5 space-y-2 text-left mb-5">
                                    <div className="flex items-start gap-2.5 text-xs font-medium text-emerald-900">
                                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                      <span>
                                        <strong className="font-bold">Free cancellation</strong> before {selectedTime || '7:00 AM'} on {date ? new Date(new Date(date).getTime() - 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'tomorrow'} (local time)
                                      </span>
                                    </div>
                                  </div>

                                  {/* Dynamic Group Rates Section */}
                                  {pkg.tiers && pkg.tiers.length > 0 && (
                                    <div className="space-y-2 mt-4">
                                       <div className="flex items-center justify-between text-left">
                                          <div className="flex items-center gap-1.5">
                                             <h4 className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">Dynamic Group Rates</h4>
                                          </div>
                                          <span className="text-[10px] font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded font-mono">
                                             Active: {adults} pax
                                          </span>
                                       </div>
                                       
                                       <div className="w-full">
                                          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
                                             {pkg.tiers.map((tier, tIdx) => {
                                                const count = adults;
                                                const isActive = count >= tier.minParticipants && count <= tier.maxParticipants;
                                                return (
                                                   <div 
                                                      key={tIdx} 
                                                      className={cn(
                                                         "flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors",
                                                         isActive 
                                                           ? "bg-neutral-100/70 text-neutral-900 font-semibold" 
                                                           : "text-neutral-600 hover:bg-neutral-50"
                                                      )}
                                                   >
                                                      <div className="flex items-center gap-2">
                                                         <span className={cn("text-xs", isActive ? "font-bold text-neutral-900" : "text-neutral-600")}>
                                                            {tier.maxParticipants >= 99 
                                                              ? `${tier.minParticipants}+ people` 
                                                              : tier.minParticipants === tier.maxParticipants 
                                                                ? `${tier.minParticipants} person`
                                                                : `${tier.minParticipants}-${tier.maxParticipants} people`
                                                            }
                                                         </span>
                                                         {isActive && (
                                                            <span className="text-[8px] font-bold text-neutral-900 bg-neutral-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                               Active
                                                            </span>
                                                         )}
                                                      </div>
                                                      
                                                      <div className="flex items-center gap-4 text-neutral-600">
                                                         <div className="flex items-center gap-1">
                                                            <span className="text-[10px] text-neutral-400 font-normal">Adult:</span>
                                                            <span className={cn("font-bold text-xs", isActive ? "text-neutral-900" : "text-neutral-700")}>
                                                               <FormattedPrice amount={tier.adultPrice} />
                                                            </span>
                                                         </div>
                                                         <div className="flex items-center gap-1">
                                                            <span className="text-[10px] text-neutral-400 font-normal">Child:</span>
                                                            <span className={cn("font-bold text-xs", isActive ? "text-neutral-900" : "text-neutral-600")}>
                                                               <FormattedPrice amount={tier.childPrice} />
                                                            </span>
                                                         </div>
                                                      </div>
                                                   </div>
                                                );
                                             })}
                                          </div>
                                       </div>
                                    </div>
                                  )}

                                  {/* Inclusions and Exclusions split layout */}
                                  <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-neutral-200">
                                    {pkg.inclusions && pkg.inclusions.filter(Boolean).length > 0 && (
                                      <div className="space-y-3 text-left">
                                        <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                                          <Check className="h-4 w-4 text-emerald-600" />
                                          What's Included
                                        </h4>
                                        <ul className="space-y-1.5">
                                          {pkg.inclusions.filter(Boolean).map((inc, i) => (
                                            <li key={i} className="text-xs text-neutral-700 flex items-start gap-2">
                                              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 mt-1.5 shrink-0" />
                                              <span className="leading-relaxed font-medium">{inc}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {pkg.exclusions && pkg.exclusions.filter(Boolean).length > 0 && (
                                      <div className="space-y-3 text-left">
                                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                                          <X className="h-4 w-4 text-neutral-400" />
                                          What's Excluded
                                        </h4>
                                        <ul className="space-y-1.5">
                                          {pkg.exclusions.filter(Boolean).map((exc, i) => (
                                            <li key={i} className="text-xs text-neutral-400 flex items-start gap-2">
                                              <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 mt-1.5 shrink-0" />
                                              <span className="leading-relaxed line-through decoration-neutral-300 font-normal">{exc}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>

                                  {/* Booking Total Rate summary */}
                                  <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                    <div className="text-left w-full">
                                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Estimated Package Cost</span>
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-neutral-900 tracking-tight">
                                          <FormattedPrice amount={price} />
                                        </span>
                                        <span className="text-[11px] text-neutral-500 font-normal">all inclusive group rate</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Multi-day Accommodations Selection */}
                {tour?.tourDurationType === 'multi_day' && tour.accommodations && tour.accommodations.length > 0 && (
                  <section id="accommodation-selection" className="space-y-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                        <Hotel className="h-5 w-5 text-neutral-700" /> Select Hotel & Accommodation
                      </h2>
                      <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
                        Choose your preferred hotel category and room arrangement for this multi-day journey.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {tour.accommodations.map((acc) => {
                        const isAccSelected = selectedAccommodation?.accommodationId === acc.id;
                        return (
                          <div
                            key={acc.id}
                            className={cn(
                              "border rounded-2xl p-5 bg-white space-y-4 transition-all relative flex flex-col justify-between",
                              isAccSelected ? "border-2 border-neutral-900 shadow-sm" : "border-neutral-200 hover:border-neutral-300"
                            )}
                          >
                            <div className="space-y-3">
                              {acc.image && (
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-neutral-100">
                                  <SmartImage src={acc.image} alt={acc.name} aspectRatio="auto" />
                                </div>
                              )}
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded-full inline-block">
                                  {acc.category}
                                </span>
                                <h3 className="font-bold text-neutral-900 text-base leading-tight">{acc.name}</h3>
                                {acc.description && (
                                  <p className="text-xs text-neutral-500 font-normal leading-relaxed">{acc.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Room Options */}
                            {acc.roomTypes && acc.roomTypes.length > 0 && (
                              <div className="pt-3 border-t border-neutral-100 space-y-2 mt-2">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Select Room Type</span>
                                <div className="space-y-2">
                                  {acc.roomTypes.map((rt) => {
                                    const isRoomSelected = isAccSelected && selectedAccommodation?.roomTypeId === rt.id;
                                    return (
                                      <button
                                        key={rt.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedAccommodation({
                                            accommodationId: acc.id,
                                            accommodationName: acc.name,
                                            category: acc.category,
                                            roomTypeId: rt.id,
                                            roomTypeName: rt.name,
                                            price: rt.price
                                          });
                                        }}
                                        className={cn(
                                          "w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer",
                                          isRoomSelected ? "bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs" : "bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800"
                                        )}
                                      >
                                        <div>
                                          <p className="text-xs font-bold leading-tight">{rt.name}</p>
                                          {rt.description && (
                                            <p className={cn("text-[10px] mt-0.5 font-normal", isRoomSelected ? "text-neutral-300" : "text-neutral-400")}>
                                              {rt.description}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className={cn("text-xs font-bold", isRoomSelected ? "text-white" : "text-neutral-900")}>
                                            +<FormattedPrice amount={rt.price} />
                                          </span>
                                          {isRoomSelected && <Check className="h-4 w-4 text-white shrink-0" />}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Multi-day Guide Language Selection */}
                {tour?.tourDurationType === 'multi_day' && tour.multiDayGuides && tour.multiDayGuides.length > 0 && (
                  <section id="guide-selection" className="space-y-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-neutral-700" /> Select Tour Guide Language
                      </h2>
                      <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
                        Choose the language spoken by your dedicated tour guide throughout the trip.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {tour.multiDayGuides.map((guide) => {
                        const isSelected = selectedGuideOption?.guideId === guide.id;
                        return (
                          <button
                            key={guide.id}
                            type="button"
                            onClick={() => {
                              setSelectedGuideOption({
                                guideId: guide.id,
                                language: guide.language,
                                price: guide.price || 0
                              });
                            }}
                            className={cn(
                              "p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 relative",
                              isSelected ? "border-2 border-neutral-900 bg-neutral-50/50 shadow-xs" : "border-neutral-200 bg-white hover:border-neutral-300"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-xs font-bold text-neutral-900 block">{guide.language} Guide</span>
                                {guide.description && (
                                  <p className="text-[11px] text-neutral-500 font-normal mt-1 leading-snug">{guide.description}</p>
                                )}
                              </div>
                              {isSelected && (
                                <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                </div>
                              )}
                            </div>
                            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-bold">
                              <span className="text-neutral-400 uppercase text-[9px] tracking-wider">Language Fee</span>
                              <span className="text-neutral-900">
                                {guide.price === 0 ? "Included (Free)" : <span>+<FormattedPrice amount={guide.price} /></span>}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                 {/* Transport / Pick Up Option Selection */}
                {availableTransports.length > 0 && (
                  <section id="transport-selection" className="space-y-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                        <Car className="h-5 w-5 text-neutral-700" /> Transportation Options
                      </h2>
                      <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
                        Select your preferred transfer or meeting arrangement for <span className="text-neutral-900 font-bold">{adults + children}</span> traveler(s).
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* 1. Own Transport Option */}
                      {availableTransports.some(t => t.type === 'meet') && (() => {
                        const isSelected = selectedTransportType === 'meet';
                        const isExpanded = expandedTransport === 'meet';
                        const activeMpText = selectedPackage?.meetingPoint || tour?.meetingPoint;
                        const mp = parseMeetingPoint(activeMpText, selectedPackage?.name || tour?.title);

                        return (
                          <div
                            className={cn(
                              "border rounded-2xl transition-all overflow-hidden bg-white shadow-xs",
                              isSelected
                                ? "border-2 border-neutral-900 shadow-sm"
                                : "border-neutral-200 hover:border-neutral-300"
                            )}
                          >
                            {/* Header */}
                            <div
                              onClick={() => {
                                setSelectedTransportType('meet');
                                const opt = availableTransports.find(t => t.type === 'meet');
                                if (opt) setSelectedTransport(opt);
                                setCustomerData(prev => ({
                                  ...prev,
                                  pickupAddress: selectedPackage?.meetingPoint || tour?.meetingPoint || "Meet directly at our adventure basecamp."
                                }));
                                setExpandedTransport(isExpanded ? null : 'meet');
                              }}
                              className="flex items-center justify-between p-4 md:p-5 cursor-pointer bg-white hover:bg-neutral-50/50 transition-colors"
                            >
                              <div className="flex items-center gap-3.5">
                                <div
                                  className={cn(
                                    "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                                    isSelected ? "border-neutral-900 bg-neutral-900" : "border-neutral-300 bg-white"
                                  )}
                                >
                                  {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                    isSelected ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
                                  )}>
                                    <MapPin className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-neutral-900 text-sm md:text-base leading-snug">
                                      Own Transport
                                    </h3>
                                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                                      Self-Arrival / Basecamp
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-bold text-emerald-700 text-xs md:text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                  Free
                                </span>
                                <div className="p-1 rounded-full text-neutral-400">
                                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                                </div>
                              </div>
                            </div>

                            {/* Expanded Body */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden border-t border-neutral-200 bg-neutral-50/50"
                                >
                                  <div className="p-5 space-y-4 text-left">
                                    <p className="text-xs text-neutral-600 font-normal leading-relaxed">
                                      Come directly to our operation basecamp or meeting point on your own. No pickup service is included.
                                    </p>
                                    <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-2">
                                      <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider block">Meeting Point Location:</span>
                                      <p className="text-sm font-bold text-neutral-900">{mp.venue}</p>
                                      {mp.address && mp.address !== mp.venue && (
                                        <p className="text-xs text-neutral-600 font-medium">{mp.address}</p>
                                      )}
                                      {mp.url && (
                                        <a
                                          href={mp.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs font-bold text-neutral-900 underline hover:text-neutral-600 block pt-1"
                                        >
                                          Open Google Maps Location →
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })()}

                      {/* 2. Shared Transfer Option */}
                      {availableTransports.some(t => t.type === 'shared') && (() => {
                        const sOpt = availableTransports.find(t => t.type === 'shared');
                        const isSelected = selectedTransportType === 'shared';
                        const isExpanded = expandedTransport === 'shared';
                        const rateText = sOpt ? `${formatPrice(sOpt.price)}/person` : "Available";

                        return (
                          <div
                            className={cn(
                              "border rounded-2xl transition-all overflow-hidden bg-white shadow-xs",
                              isSelected
                                ? "border-2 border-neutral-900 shadow-sm"
                                : "border-neutral-200 hover:border-neutral-300"
                            )}
                          >
                            {/* Header */}
                            <div
                              onClick={() => {
                                setSelectedTransportType('shared');
                                if (sOpt) setSelectedTransport(sOpt);
                                setCustomerData(prev => {
                                  const activeMp = selectedPackage?.meetingPoint || tour?.meetingPoint || "Meet directly at our adventure basecamp.";
                                  const isMeetingPoint = prev.pickupAddress === activeMp || prev.pickupAddress === tour?.meetingPoint || prev.pickupAddress === "Meet directly at our adventure basecamp.";
                                  return {
                                    ...prev,
                                    pickupAddress: isMeetingPoint ? "" : prev.pickupAddress
                                  };
                                });
                                setExpandedTransport(isExpanded ? null : 'shared');
                              }}
                              className="flex items-center justify-between p-4 md:p-5 cursor-pointer bg-white hover:bg-neutral-50/50 transition-colors"
                            >
                              <div className="flex items-center gap-3.5">
                                <div
                                  className={cn(
                                    "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                                    isSelected ? "border-neutral-900 bg-neutral-900" : "border-neutral-300 bg-white"
                                  )}
                                >
                                  {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                    isSelected ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
                                  )}>
                                    <Bus className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-neutral-900 text-sm md:text-base leading-snug">
                                      Shared Shuttle Transfer
                                    </h3>
                                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                                      Shared Pickup & Drop-off
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-bold text-neutral-900 text-xs md:text-sm">
                                  {rateText}
                                </span>
                                <div className="p-1 rounded-full text-neutral-400">
                                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                                </div>
                              </div>
                            </div>

                            {/* Expanded Body */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden border-t border-neutral-200 bg-neutral-50/50"
                                >
                                  <div className="p-5 space-y-4 text-left">
                                    <p className="text-xs text-neutral-600 font-normal leading-relaxed">
                                      Pickup & drop-off shared with other travelers going to the same tour. Pickup schedule will be confirmed based on your hotel area.
                                    </p>
                                    {(selectedPackage?.pickupAreas || tour?.pickupAreas) && (
                                      <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-3.5 text-xs text-neutral-700 font-medium">
                                        <span className="text-[10px] font-bold text-neutral-900 uppercase tracking-wider block mb-1">Served Areas:</span>
                                        {selectedPackage?.pickupAreas || tour?.pickupAreas}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })()}

                      {/* 3. Private Transfer Option */}
                      {availableTransports.some(t => t.type === 'private') && (() => {
                        const pOpts = availableTransports.filter(t => t.type === 'private');
                        const totalParticipants = adults + children;
                        const matchingCars = pOpts.filter(t => t.maxCapacity === undefined || t.maxCapacity === null || totalParticipants <= t.maxCapacity);
                        const lowestPrice = matchingCars.length > 0 
                          ? Math.min(...matchingCars.map(c => c.price)) 
                          : pOpts.length > 0 ? Math.min(...pOpts.map(c => c.price)) : 0;
                        const isSelected = selectedTransportType === 'private';
                        const isExpanded = expandedTransport === 'private';
                        const rateText = lowestPrice > 0 ? `From ${formatPrice(lowestPrice)}/car` : "Available";

                        return (
                          <div
                            className={cn(
                              "border rounded-2xl transition-all overflow-hidden bg-white shadow-xs",
                              isSelected
                                ? "border-2 border-neutral-900 shadow-sm"
                                : "border-neutral-200 hover:border-neutral-300"
                            )}
                          >
                            {/* Header */}
                            <div
                              onClick={() => {
                                setSelectedTransportType('private');
                                const bestPrivateOpt = matchingCars[0] || pOpts[0];
                                if (bestPrivateOpt) setSelectedTransport(bestPrivateOpt);
                                setCustomerData(prev => {
                                  const activeMp = selectedPackage?.meetingPoint || tour?.meetingPoint || "Meet directly at our adventure basecamp.";
                                  const isMeetingPoint = prev.pickupAddress === activeMp || prev.pickupAddress === tour?.meetingPoint || prev.pickupAddress === "Meet directly at our adventure basecamp.";
                                  return {
                                    ...prev,
                                    pickupAddress: isMeetingPoint ? "" : prev.pickupAddress
                                  };
                                });
                                setExpandedTransport(isExpanded ? null : 'private');
                              }}
                              className="flex items-center justify-between p-4 md:p-5 cursor-pointer bg-white hover:bg-neutral-50/50 transition-colors"
                            >
                              <div className="flex items-center gap-3.5">
                                <div
                                  className={cn(
                                    "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                                    isSelected ? "border-neutral-900 bg-neutral-900" : "border-neutral-300 bg-white"
                                  )}
                                >
                                  {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                    isSelected ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
                                  )}>
                                    <Car className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-neutral-900 text-sm md:text-base leading-snug">
                                      Private Transfer
                                    </h3>
                                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                                      Dedicated Vehicle & Driver
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-bold text-neutral-900 text-xs md:text-sm">
                                  {rateText}
                                </span>
                                <div className="p-1 rounded-full text-neutral-400">
                                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                                </div>
                              </div>
                            </div>

                            {/* Expanded Body */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden border-t border-neutral-200 bg-neutral-50/50"
                                >
                                  <div className="p-5 space-y-4 text-left">
                                    <p className="text-xs text-neutral-600 font-normal leading-relaxed">
                                      Air-conditioned vehicle with professional driver exclusively for your group. Select your preferred vehicle below:
                                    </p>

                                    {(selectedPackage?.pickupAreas || tour?.pickupAreas) && (
                                      <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-700 font-medium mb-3">
                                        <span className="text-[10px] font-bold text-neutral-900 uppercase tracking-wider block mb-0.5">Served Areas:</span>
                                        {selectedPackage?.pickupAreas || tour?.pickupAreas}
                                      </div>
                                    )}

                                    {/* Vehicle Selection Grid */}
                                    <div className="grid sm:grid-cols-2 gap-3 pt-2">
                                      {pOpts.map((t, idx) => {
                                        const isCarSelected = selectedTransport?.id === t.id;
                                        const hasCapacity = t.maxCapacity === undefined || t.maxCapacity === null || totalParticipants <= t.maxCapacity;

                                        if (!hasCapacity) return null;

                                        return (
                                          <button
                                            key={t.id || idx}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedTransport(t);
                                            }}
                                            className={cn(
                                              "border rounded-xl p-3.5 transition-all bg-white cursor-pointer flex flex-col justify-between gap-2 text-left",
                                              isCarSelected
                                                ? "border-2 border-neutral-900 bg-neutral-50/50 shadow-xs"
                                                : "border-neutral-200 hover:border-neutral-300"
                                            )}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <Car className={cn("h-4 w-4", isCarSelected ? "text-neutral-900" : "text-neutral-400")} />
                                                <span className="font-bold text-neutral-900 text-xs">{t.name}</span>
                                              </div>
                                              {isCarSelected && <Check className="h-4 w-4 text-neutral-900 shrink-0" />}
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-medium border-t border-neutral-100 pt-2">
                                              <span className="text-neutral-400">Cap: {t.maxCapacity} pax</span>
                                              <span className="text-neutral-900 font-bold"><FormattedPrice amount={t.price} /> / car</span>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Hotel Address Input Form for Shared and Private Transfer */}
                    {(selectedTransportType === 'shared' || selectedTransportType === 'private') && (
                      <div className="bg-white border border-neutral-200 rounded-2xl p-6 mt-4 space-y-3 animate-in fade-in duration-200 text-left">
                        <label className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-neutral-700" />
                          Hotel Name & Address (For Pickup) <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <p className="text-xs text-neutral-500 font-normal">
                          Please enter the complete name of your hotel, resort, or villa, and its address for our driver to pick you up.
                        </p>
                        <textarea
                          required
                          rows={3}
                          value={customerData.pickupAddress}
                          onChange={(e) =>
                            setCustomerData({
                              ...customerData,
                              pickupAddress: e.target.value,
                            })
                          }
                          placeholder="e.g. Ayana Resort Bali, Jl. Karang Mas Sejahtera, Jimbaran"
                          className="w-full rounded-xl border border-neutral-200 p-3.5 focus:border-neutral-900 focus:outline-none bg-white font-medium transition-all text-sm"
                        />
                        {!customerData.pickupAddress.trim() && (
                          <p className="text-[11px] text-rose-500 font-bold">
                            ⚠️ Hotel address is required to arrange your pickup.
                          </p>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {/* Add-on Selection */}
                <section className="space-y-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                      Enhance Your Trip
                    </h2>
                    <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
                      Add optional extras to customize your experience.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Explicit "None" Option for Add-ons */}
                    <div
                      onClick={() => setSelectedAddOns([])}
                      className={cn(
                        "border rounded-2xl p-4 transition-all bg-white relative cursor-pointer",
                        selectedAddOns.length === 0
                          ? "border-2 border-neutral-900 bg-neutral-50/50 shadow-xs"
                          : "border-neutral-200 hover:border-neutral-300",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center shrink-0",
                          selectedAddOns.length === 0
                            ? "bg-neutral-900 border-neutral-900 text-white"
                            : "border-neutral-300",
                        )}>
                          {selectedAddOns.length === 0 && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-neutral-900 text-sm">No Add-ons</h4>
                          <p className="text-[11px] text-neutral-400 font-normal">Continue with tour package only</p>
                        </div>
                      </div>
                    </div>

                    {tour.addOns?.map((addon, idx) => {
                      const isSelected = !!selectedAddOns.find(
                        (a) => a.id === addon.id,
                      );
                      const isExpanded = expandedAddOn === addon.id;

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "border rounded-2xl p-4 transition-all bg-white relative",
                            isSelected
                              ? "border-2 border-neutral-900 bg-neutral-50/50 shadow-xs"
                              : "border-neutral-200 hover:border-neutral-300",
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <button
                                onClick={() => toggleAddOn(addon)}
                                className={cn(
                                  "h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center mt-0.5 shrink-0",
                                  isSelected
                                    ? "bg-neutral-900 border-neutral-900 text-white"
                                    : "border-neutral-300",
                                )}
                              >
                                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                              </button>
                              <div>
                                <h4 className="font-bold text-neutral-900 text-sm">
                                  {addon.name}
                                </h4>
                                <p className="text-xs font-bold text-neutral-700 mt-0.5">
                                  <FormattedPrice amount={addon.price} /> / {addon.unit}
                                </p>
                                
                                {isSelected && (
                                  <div className="mt-3 flex items-center gap-3 p-1.5 bg-white rounded-lg border border-neutral-200 w-fit">
                                    <span className="text-[11px] font-medium text-neutral-500 ml-1">Qty:</span>
                                    <div className="flex items-center gap-2">
                                      <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); updateAddOnQuantity(addon.id, -1); }}
                                        className="h-6 w-6 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700 hover:bg-neutral-200"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <span className="text-xs font-bold text-neutral-900 w-4 text-center">
                                        {selectedAddOns.find(a => a.id === addon.id)?.quantity}
                                      </span>
                                      <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); updateAddOnQuantity(addon.id, 1); }}
                                        className="h-6 w-6 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700 hover:bg-neutral-200"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                setExpandedAddOn(isExpanded ? null : addon.id)
                              }
                              className="text-neutral-400 hover:text-neutral-700 transition-colors p-1"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </div>

                          <AnimatePresence>
                            {isExpanded && addon.description && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{
                                  height: "auto",
                                  opacity: 1,
                                  marginTop: 10,
                                }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                className="overflow-hidden"
                              >
                                <p className="text-xs text-neutral-600 font-normal leading-relaxed bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                                  {addon.description}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <div className="pt-6 hidden md:flex flex-col items-end gap-3">
                  {(spotsLeft !== null && (adults + children) > spotsLeft) && (
                    <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">
                      <Info className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Capacity Exceeded: Only {spotsLeft} spots remaining
                      </span>
                    </div>
                  )}
                  {isUnderMinParticipants && (
                    <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">
                      <Info className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Fewer than minimum participants required for selected package
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => updateStep("customer")}
                    disabled={isSoldOut || (spotsLeft !== null && (adults + children) > spotsLeft) || isUnderMinParticipants}
                    className="bg-primary hover:opacity-90 text-white px-10 py-4 rounded-xl font-bold text-sm shadow-md shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSoldOut ? 'Sold Out' : (spotsLeft !== null && (adults + children) > spotsLeft) ? 'Not Enough Spots' : 
                     isUnderMinParticipants ? 'Under Min Travelers' : 'Continue to Guest Details'} <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Customer Info */}
            {step === "customer" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 text-left">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                    Traveler details
                  </h2>
                  <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
                    Please provide your contact information for booking confirmation and tickets.
                  </p>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-xs space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={customerData.fullName}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          fullName: e.target.value,
                        })
                      }
                      placeholder="e.g. John Doe"
                      className="w-full rounded-xl border border-neutral-200 p-3.5 focus:border-neutral-900 focus:outline-none bg-white font-medium transition-all text-sm"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-700">
                        Email Address *
                      </label>
                      <input
                        required
                        type="email"
                        value={customerData.email}
                        onChange={(e) =>
                          setCustomerData({
                            ...customerData,
                            email: e.target.value,
                          })
                        }
                        placeholder="john@example.com"
                        className="w-full rounded-xl border border-neutral-200 p-3.5 focus:border-neutral-900 focus:outline-none bg-white font-medium transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-700">
                        Nationality *
                      </label>
                      <select
                        required
                        value={customerData.nationality}
                        onChange={(e) =>
                          setCustomerData({
                            ...customerData,
                            nationality: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-neutral-200 p-3.5 focus:border-neutral-900 focus:outline-none bg-white font-medium transition-all text-sm"
                      >
                        <option value="">Select Country</option>
                        {COUNTRIES_WITH_CODES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} {c.dialCode ? `(${c.dialCode})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-neutral-700">
                        Phone Number (WhatsApp) *
                      </label>
                      <input
                        required
                        type="tel"
                        value={customerData.phone}
                        onChange={(e) =>
                          setCustomerData({
                            ...customerData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="e.g. +1 555 123 4567"
                        className="w-full rounded-xl border border-neutral-200 p-3.5 focus:border-neutral-900 focus:outline-none bg-white font-medium transition-all text-sm"
                      />
                      {customerData.phone && customerData.nationality && (
                        <p className="text-[11px] text-neutral-500 font-normal pt-0.5">
                          Formatted for mobile vouchers: <span className="font-mono font-semibold text-neutral-900">{getInternationalPhoneNumber(customerData.phone, customerData.nationality)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-neutral-700">
                      Special Requests / Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={customerData.specialRequirements}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          specialRequirements: e.target.value,
                        })
                      }
                      placeholder="Dietary requirements, accessibility needs, or notes for the guide..."
                      className="w-full rounded-xl border border-neutral-200 p-3.5 focus:border-neutral-900 focus:outline-none bg-white font-medium transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="hidden md:flex justify-between items-center pt-2">
                  <button
                    onClick={() => updateStep("selection")}
                    className="text-neutral-600 font-semibold text-sm hover:text-neutral-900 transition-colors cursor-pointer"
                  >
                    ← Back to Options
                  </button>
                  <button
                    onClick={() => {
                      if (validateCustomerData()) {
                        updateStep("payment");
                      }
                    }}
                    className="bg-primary hover:opacity-90 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    Continue to Payment <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === "payment" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                      Choose how to pay
                    </h2>
                    <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
                      All transactions are secure and encrypted.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/80 self-start sm:self-auto">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>256-Bit SSL Encrypted</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: "stripe",
                      label: "Credit / Debit Card (Stripe)",
                      tag: "Instant",
                      icon: CreditCard,
                      enabled: paymentSettings?.isStripeEnabled ?? (paymentSettings?.providerConfigs?.stripe?.enabled ?? false),
                    },
                    {
                      id: "midtrans",
                      label: "QRIS / GoPay / Indo Banks",
                      tag: "IDR Instant",
                      icon: QrCode,
                      enabled: paymentSettings?.isMidtransEnabled ?? (paymentSettings?.providerConfigs?.midtrans?.enabled ?? false),
                    },
                    {
                      id: "xendit",
                      label: "E-Wallets & Virtual Accounts",
                      tag: "Instant",
                      icon: Zap,
                      enabled: paymentSettings?.isXenditEnabled ?? (paymentSettings?.providerConfigs?.xendit?.enabled ?? false),
                    },
                    {
                      id: "razorpay",
                      label: "UPI / NetBanking / Cards",
                      tag: "UPI / INR",
                      icon: CreditCard,
                      enabled: paymentSettings?.isRazorpayEnabled ?? (paymentSettings?.providerConfigs?.razorpay?.enabled ?? false),
                    },
                    {
                      id: "adyen",
                      label: "Global Cards (Adyen)",
                      tag: "Global",
                      icon: CreditCard,
                      enabled: paymentSettings?.isAdyenEnabled ?? (paymentSettings?.providerConfigs?.adyen?.enabled ?? false),
                    },
                    {
                      id: "wise",
                      label: "Wise (TransferWise)",
                      tag: "Low Fee",
                      icon: Globe,
                      enabled: paymentSettings?.isWiseEnabled ?? (paymentSettings?.providerConfigs?.wise?.enabled ?? false),
                    },
                    {
                      id: "paypal",
                      label: "PayPal Account",
                      tag: "Popular",
                      icon: Wallet,
                      enabled: paymentSettings?.isPaypalEnabled ?? (paymentSettings?.providerConfigs?.paypal?.enabled ?? true),
                    },
                    {
                      id: "card",
                      label: "Credit Card (PayPal)",
                      tag: "Major Cards",
                      icon: CreditCard,
                      enabled: paymentSettings?.creditCardEnabled ?? (paymentSettings?.providerConfigs?.paypal?.enabled ?? true),
                    },
                    {
                      id: "bank_transfer",
                      label: "Manual Bank Transfer",
                      tag: "Direct",
                      icon: Banknote,
                      enabled: paymentSettings?.isBankTransferEnabled ?? (paymentSettings?.providerConfigs?.bank_transfer?.enabled ?? true),
                    },
                    {
                      id: "pay_on_arrival",
                      label: "Cash on Arrival",
                      tag: "Pay Later",
                      icon: DollarSign,
                      enabled: paymentSettings?.isPayOnArrivalEnabled ?? (paymentSettings?.providerConfigs?.pay_on_arrival?.enabled ?? true),
                    },
                  ]
                    .filter((m) => m.enabled)
                    .map((method) => {
                      const isSelected = paymentMethod === method.id;
                      return (
                        <div
                          key={method.id}
                          onClick={() => {
                            setPaymentMethod(method.id as PaymentMethod);
                            try {
                              trackGAAddPaymentInfo({
                                tourTitle: tour?.title || 'Tour Booking',
                                totalAmount: summary?.amountToPay || summary?.grandTotal || 0,
                                paymentType: method.label || method.id,
                                currency: selectedCurrency || 'USD'
                              });
                            } catch (e) {
                              console.warn('[Analytics] Payment selection notice:', e);
                            }
                          }}
                          className={cn(
                            "p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none",
                            isSelected
                              ? "border-2 border-neutral-900 bg-neutral-50/50 shadow-xs"
                              : "border-neutral-200 bg-white hover:border-neutral-300",
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                isSelected
                                  ? "bg-neutral-900 text-white"
                                  : "bg-neutral-100 text-neutral-600",
                              )}
                            >
                              <method.icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs sm:text-sm text-neutral-900 truncate leading-snug">
                                {method.label}
                              </p>
                              {method.tag && (
                                <span className={cn(
                                  "text-[10px] font-medium",
                                  isSelected ? "text-neutral-900 font-semibold" : "text-neutral-400"
                                )}>
                                  {method.tag}
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            className={cn(
                              "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                              isSelected
                                ? "border-neutral-900 bg-neutral-900"
                                : "border-neutral-300 bg-white",
                            )}
                          >
                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {paymentMethod === "pay_on_arrival" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-200 space-y-3"
                  >
                    <div className="flex items-center gap-3 text-emerald-950">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-emerald-800" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-emerald-950">
                          Cash on Arrival
                        </h4>
                        <p className="text-xs text-emerald-700 font-normal">
                          Pay directly to our guide or driver on the tour date
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-emerald-900 font-normal leading-relaxed bg-white p-3 rounded-lg border border-emerald-100">
                      Please prepare <span className="font-bold text-neutral-900">{formatPrice(summary.grandTotal)}</span> in cash (IDR or USD equivalent) on the day of your tour. Your reservation will be registered and confirmed immediately.
                    </div>
                  </motion.div>
                )}

                {paymentMethod === "wise" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 space-y-4"
                  >
                    <div className="flex items-center gap-3 text-neutral-900">
                      <div className="h-8 w-8 rounded-lg bg-neutral-200 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-neutral-800" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900">
                          Wise (TransferWise) Bank Transfer
                        </h4>
                        <p className="text-xs text-neutral-500 font-normal">
                          Real mid-market exchange rate & low transfer fees
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-0.5 bg-white p-3 rounded-xl border border-neutral-200">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Payment Destination
                        </span>
                        <p className="font-bold text-neutral-900 text-xs sm:text-sm">
                          {paymentSettings?.bankName || "Wise Account"} ({paymentSettings?.accountHolder || "Bali Adventours"})
                        </p>
                      </div>
                      <div className="space-y-0.5 bg-white p-3 rounded-xl border border-neutral-200">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Amount To Transfer
                        </span>
                        <p className="font-bold text-base text-neutral-900">
                          <FormattedPrice amount={summary.amountToPay} />
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {paymentMethod === "bank_transfer" && paymentSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 space-y-4"
                  >
                    <div className="flex items-center gap-3 text-neutral-900">
                      <div className="h-8 w-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center">
                        <Banknote className="h-4 w-4 text-neutral-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900">
                          Direct Bank Transfer
                        </h4>
                        <p className="text-xs text-neutral-500 font-normal">
                          Deposit directly to our merchant bank account
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-0.5 bg-white p-3 rounded-xl border border-neutral-200">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Bank Name
                        </span>
                        <p className="font-bold text-neutral-900 text-xs sm:text-sm">
                          {paymentSettings.bankName || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-0.5 bg-white p-3 rounded-xl border border-neutral-200">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Account Number
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs sm:text-sm text-neutral-900">
                            {paymentSettings.accountNumber || "N/A"}
                          </span>
                          {paymentSettings.accountNumber && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(paymentSettings.accountNumber);
                                alert("Account number copied to clipboard!");
                              }}
                              className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Copy className="h-2.5 w-2.5" /> Copy
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-neutral-200 shadow-xs cursor-pointer hover:bg-neutral-50/50 transition-colors" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                    <button
                      type="button"
                      className={cn(
                        "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                        agreedToTerms ? "bg-neutral-900 border-neutral-900 text-white" : "border-neutral-300"
                      )}
                    >
                      {agreedToTerms && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </button>
                    <p className="text-xs text-neutral-600 font-normal">
                      By continuing, I agree to the <Link to="/pages/terms-and-conditions" className="text-neutral-900 font-semibold underline hover:text-neutral-700" target="_blank">Terms & Conditions</Link> and Cancellation Policy.
                    </p>
                  </div>

                  <div className="hidden md:flex justify-between items-center pt-2">
                    <button
                      onClick={() => updateStep("customer")}
                      className="text-neutral-600 font-semibold text-sm hover:text-neutral-900 transition-colors cursor-pointer"
                    >
                      ← Back to Details
                    </button>
                  </div>

                  {paymentMethod === "bank_transfer" ||
                  paymentMethod === "pay_on_arrival" ||
                  paymentMethod === "wise" ||
                  paymentMethod === "stripe" ||
                  paymentMethod === "midtrans" ||
                  paymentMethod === "xendit" ||
                  paymentMethod === "razorpay" ||
                  paymentMethod === "adyen" ||
                  summary.grandTotal <= 0 ? (
                    <div className="hidden md:flex justify-end">
                      <button
                        onClick={() => handleFinalBooking()}
                        disabled={isBooking || !agreedToTerms}
                        className="w-full sm:w-auto bg-primary hover:opacity-90 text-white px-12 py-4 rounded-xl font-bold text-sm shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isBooking ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            {paymentMethod === "stripe" && "Pay with Credit Card (Stripe)"}
                            {paymentMethod === "midtrans" && "Pay with Midtrans (QRIS/E-Wallet)"}
                            {paymentMethod === "xendit" && "Pay with Xendit (E-Wallet/VA)"}
                            {paymentMethod === "razorpay" && "Pay with Razorpay (UPI/Card)"}
                            {paymentMethod === "adyen" && "Pay with Adyen"}
                            {paymentMethod === "wise" && "Complete Wise Booking"}
                            {(paymentMethod === "bank_transfer" || paymentMethod === "pay_on_arrival" || summary.grandTotal <= 0) && "Confirm and Pay"}
                            <Check className="h-4 w-4 stroke-[3]" />
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className={cn("w-full relative z-0 min-h-[150px] flex flex-col transition-opacity", !agreedToTerms && "opacity-50 pointer-events-none")}>
                      {!agreedToTerms && (
                        <p className="text-xs font-semibold text-amber-700 tracking-tight mb-3">
                          Please agree to Terms & Conditions above
                        </p>
                      )}

                      <PayPalV6Container
                        tenantId={tenantId || getActiveTenantId() || "global"}
                        clientId={paymentSettings?.paypalClientId || ""}
                        sandboxClientId={paymentSettings?.paypalSandboxClientId || ""}
                        mode={paymentSettings?.paypalMode || "live"}
                        amount={activePaypalAmount}
                        currency={activePaypalCurrency}
                        description={safeDescription}
                        bookingId={existingBooking?.id || `bk_${Date.now()}`}
                        agreedToTerms={agreedToTerms}
                        onSuccess={async (orderId, captureId) => {
                          await handleFinalBooking(captureId || orderId);
                        }}
                        onError={(err) => {
                          console.warn("[PayPal Error]", err);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Airbnb Style Checkout Summary Sidebar */}
          <div className="hidden md:block md:col-span-1 text-left">
            <div className="sticky top-28 space-y-6">
              {/* Main Summary Card */}
              <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xl shadow-neutral-900/[0.04] space-y-5">
                {/* Header: Tour thumbnail + Title */}
                <div className="flex gap-4 items-start pb-5 border-b border-neutral-100">
                  <img
                    src={tour.gallery?.[0] || tour.featuredImage || ""}
                    alt={tour.title}
                    className="h-20 w-20 object-cover rounded-xl shrink-0 border border-neutral-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                      <span>Experience</span>
                      {tour.rating && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-neutral-900 font-bold">
                            <Star className="h-3 w-3 fill-neutral-900 text-neutral-900" />
                            {tour.rating}
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="text-neutral-900 font-bold text-sm leading-snug line-clamp-2">
                      {tour.title}
                    </h3>
                  </div>
                </div>

                {/* Free Cancellation Banner */}
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-200/60">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Free cancellation before travel date</span>
                </div>

                {/* Date & Guests Selector Box */}
                <div className="border border-neutral-200 rounded-2xl p-3.5 space-y-3 bg-neutral-50/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider block">Dates & Time</span>
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select Date'}
                        {selectedTime && ` • ${selectedTime}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSidebarEdit(!showSidebarEdit)}
                      className="text-xs font-bold text-neutral-900 underline hover:text-neutral-600 cursor-pointer shrink-0"
                    >
                      {showSidebarEdit ? "Done" : "Edit"}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-neutral-200/80 flex items-center justify-between">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider block">Guests</span>
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {adults + children} guest{adults + children > 1 ? 's' : ''} ({adults} Adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''})
                      </p>
                    </div>
                  </div>

                  {/* Collapsible Sidebar Date & Participant Editor */}
                  <AnimatePresence>
                    {showSidebarEdit && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-3 border-t border-neutral-200 space-y-3"
                      >
                        {/* Mini Calendar */}
                        <div className="space-y-1 text-left">
                          <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newM = new Date(currentMonth);
                                  newM.setMonth(newM.getMonth() - 1);
                                  setCurrentMonth(newM);
                                }}
                                className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                              <span className="font-bold text-[11px] text-neutral-900 uppercase tracking-wider">
                                {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newM = new Date(currentMonth);
                                  newM.setMonth(newM.getMonth() + 1);
                                  setCurrentMonth(newM);
                                }}
                                className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] text-neutral-400 uppercase py-0.5">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {(() => {
                                const year = currentMonth.getFullYear();
                                const month = currentMonth.getMonth();
                                const firstDay = new Date(year, month, 1).getDay();
                                const daysInMonth = new Date(year, month + 1, 0).getDate();
                                const today = new Date(); today.setHours(0,0,0,0);
                                const cells = [];
                                for (let i = 0; i < firstDay; i++) cells.push(<div key={`sb-empty-${i}`} />);
                                for (let d = 1; d <= daysInMonth; d++) {
                                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                  const isPast = new Date(year, month, d) < today;
                                  const isSelected = date === dateStr;
                                  cells.push(
                                    <button
                                      key={`sb-${d}`}
                                      type="button"
                                      disabled={isPast}
                                      onClick={() => setDate(dateStr)}
                                      className={cn(
                                        "h-6 w-full rounded flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer",
                                        isSelected ? "bg-neutral-900 text-white shadow-xs" : isPast ? "text-neutral-300 opacity-40 line-through cursor-not-allowed" : "text-neutral-800 bg-neutral-50 hover:bg-neutral-100"
                                      )}
                                    >
                                      {d}
                                    </button>
                                  );
                                }
                                return cells;
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Travelers Adjuster */}
                        <div className="space-y-1.5 pt-2 border-t border-neutral-200 text-left">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                            Adjust Guests
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Adults */}
                            <div className="bg-white p-2 rounded-xl border border-neutral-200 flex items-center justify-between">
                              <div>
                                <p className="text-[9px] font-bold text-neutral-400 uppercase">Adults</p>
                                <p className="text-xs font-bold text-neutral-900">{adults}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={adults <= 1 || (adults + children) <= minRequired}
                                  onClick={() => setAdults(Math.max(1, adults - 1))}
                                  className="h-6 w-6 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-xs disabled:opacity-30 cursor-pointer"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (spotsLeft !== null && (adults + children + 1) > spotsLeft) {
                                      alert(`Only ${spotsLeft} spots available.`);
                                      return;
                                    }
                                    setAdults(adults + 1);
                                  }}
                                  className="h-6 w-6 rounded-md bg-neutral-900 text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Children */}
                            <div className="bg-white p-2 rounded-xl border border-neutral-200 flex items-center justify-between">
                              <div>
                                <p className="text-[9px] font-bold text-neutral-400 uppercase">Children</p>
                                <p className="text-xs font-bold text-neutral-900">{children}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={children <= 0 || (adults + children) <= minRequired}
                                  onClick={() => setChildren(Math.max(0, children - 1))}
                                  className="h-6 w-6 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-xs disabled:opacity-30 cursor-pointer"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (spotsLeft !== null && (adults + children + 1) > spotsLeft) {
                                      alert(`Only ${spotsLeft} spots available.`);
                                      return;
                                    }
                                    setChildren(children + 1);
                                  }}
                                  className="h-6 w-6 rounded-md bg-neutral-900 text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Price Breakdown: Airbnb Underlined Clean Rows */}
                <div className="space-y-3 pt-3 border-t border-neutral-100 text-sm">
                  <h4 className="font-bold text-neutral-900 text-sm">Price details</h4>

                  <div className="space-y-2 text-neutral-600 text-xs">
                    {adults > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="underline decoration-neutral-300">
                          <FormattedPrice amount={applicableTier?.adultPrice || 0} /> × {adults} adult{adults > 1 ? 's' : ''}
                        </span>
                        <span className="font-semibold text-neutral-900">
                          <FormattedPrice amount={(applicableTier?.adultPrice || 0) * adults} />
                        </span>
                      </div>
                    )}

                    {children > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="underline decoration-neutral-300">
                          <FormattedPrice amount={applicableTier?.childPrice || 0} /> × {children} child{children > 1 ? 'ren' : ''}
                        </span>
                        <span className="font-semibold text-neutral-900">
                          <FormattedPrice amount={(applicableTier?.childPrice || 0) * children} />
                        </span>
                      </div>
                    )}

                    {summary.transportTotal > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="underline decoration-neutral-300">Transport ({selectedTransport?.name})</span>
                        <span className="font-semibold text-neutral-900">
                          <FormattedPrice amount={summary.transportTotal} />
                        </span>
                      </div>
                    )}

                    {summary.addonsTotal > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="underline decoration-neutral-300">Add-on extras</span>
                        <span className="font-semibold text-neutral-900">
                          <FormattedPrice amount={summary.addonsTotal} />
                        </span>
                      </div>
                    )}

                    {summary.discount > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 font-semibold">
                        <span>Coupon discount</span>
                        <span>-<FormattedPrice amount={summary.discount} /></span>
                      </div>
                    )}
                  </div>

                  {/* Coupon Code Row */}
                  <div className="pt-3 border-t border-neutral-100">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{appliedCoupon.code} Applied</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAppliedCoupon(null)}
                          className="text-[11px] font-bold text-rose-600 underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Coupon code"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="flex-1 rounded-xl border border-neutral-200 bg-white p-2.5 focus:border-neutral-900 focus:outline-none font-bold text-xs uppercase"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={isValidatingCoupon || !couponInput}
                          className="bg-primary text-white px-3.5 py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer shadow-xs shadow-primary/20"
                        >
                          {isValidatingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                        </button>
                      </div>
                    )}
                    {couponError && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 pl-1">
                        {couponError}
                      </p>
                    )}
                  </div>

                  {/* Total Line */}
                  <div className="pt-4 border-t border-neutral-200 flex justify-between items-baseline">
                    <span className="font-bold text-base text-neutral-900">Total (USD)</span>
                    <span className="font-black text-2xl text-neutral-900">
                      <FormattedPrice amount={summary.grandTotal} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Booking Bar */}
      <AnimatePresence>
        {showMobileSummary && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-[60] bg-black/60 md:hidden"
            onClick={() => setShowMobileSummary(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Booking Summary</h3>
                <button onClick={() => setShowMobileSummary(false)} className="text-gray-400 hover:text-gray-900">
                  <Plus className="h-6 w-6 rotate-45" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-16 w-16 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Date</p>
                    <p className="font-extrabold text-gray-900">{date || 'Select a date'}</p>
                    {selectedTime && (
                      <p className="text-xs font-bold text-primary mt-0.5 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> {selectedTime}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-16 w-16 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Travelers</p>
                    <p className="font-extrabold text-gray-900">{adults} Adults {children > 0 && `, ${children} Children`}</p>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="space-y-4">
                  {/* Package Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-bold">{adults}x Adults {applicableTier ? <span>@ <FormattedPrice amount={applicableTier.adultPrice} /></span> : ''}</span>
                      <span className="font-black text-gray-900"><FormattedPrice amount={adults * (applicableTier?.adultPrice || 0)} /></span>
                    </div>
                    {children > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-bold">{children}x Children {applicableTier ? <span>@ <FormattedPrice amount={applicableTier.childPrice} /></span> : ''}</span>
                        <span className="font-black text-gray-900"><FormattedPrice amount={children * (applicableTier?.childPrice || 0)} /></span>
                      </div>
                    )}
                  </div>

                  {/* Accommodation breakdown */}
                  {selectedAccommodation && (
                    <div className="space-y-1 pt-2 border-t border-gray-50 flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-bold flex items-center gap-1">
                        <Hotel className="h-4 w-4 text-primary" /> {selectedAccommodation.accommodationName} ({selectedAccommodation.roomTypeName})
                      </span>
                      <span className="font-black text-gray-900"><FormattedPrice amount={summary.accommodationTotal} /></span>
                    </div>
                  )}

                  {/* Guide breakdown */}
                  {selectedGuideOption && (
                    <div className="space-y-1 pt-2 border-t border-gray-50 flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-bold flex items-center gap-1">
                        <UserCheck className="h-4 w-4 text-primary" /> {selectedGuideOption.language} Guide
                      </span>
                      <span className="font-black text-gray-900">{summary.guideTotal === 0 ? 'Included' : <FormattedPrice amount={summary.guideTotal} />}</span>
                    </div>
                  )}

                  {/* Transport selection breakdown */}
                  {selectedTransport && (
                    <div className="space-y-2 pt-2 border-t border-gray-50 flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-bold flex items-center gap-1">
                        <Car className="h-4 w-4 text-primary animate-pulse" /> {selectedTransport.name} ({selectedTransport.type === 'meet' ? 'Meet on location' : selectedTransport.carType || selectedTransport.type})
                      </span>
                      <span className="font-black text-gray-900">
                        {selectedTransport.type === 'meet' ? 'Free' : <FormattedPrice amount={summary.transportTotal} />}
                      </span>
                    </div>
                  )}

                  {/* Add-ons breakdown */}
                  {selectedAddOns.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-50">
                      {selectedAddOns.map((addon) => (
                        <div key={addon.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-bold">
                            {addon.name} {addon.quantity}x <FormattedPrice amount={addon.price} />
                          </span>
                          <span className="font-black text-gray-900"><FormattedPrice amount={addon.price * addon.quantity} /></span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Coupon Discount */}
                  {summary.discount > 0 && (
                    <div className="flex justify-between items-center text-sm text-primary pt-2 border-t border-gray-50">
                      <span className="font-bold flex items-center gap-2">
                        <Tag className="h-4 w-4" /> Coupon Discount {appliedCoupon ? `"${appliedCoupon.code}"` : ''}
                      </span>
                      <span className="font-black">-<FormattedPrice amount={summary.discount} /></span>
                    </div>
                  )}

                  {/* Coupon Input for Mobile Modal */}
                  {!appliedCoupon && (
                    <div className="pt-4 border-t border-gray-50">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Coupon Code"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3 focus:border-primary focus:outline-none font-bold text-xs"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={isValidatingCoupon || !couponInput}
                          className="bg-gray-900 text-white px-4 py-3 rounded-xl font-bold text-[10px] hover:bg-black transition-all disabled:opacity-50"
                        >
                          {isValidatingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 pl-1">
                          {couponError}
                        </p>
                      )}
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex items-center justify-between bg-orange-50 p-3 rounded-xl border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-bold text-primary">{appliedCoupon.code} Applied</span>
                      </div>
                      <button
                        onClick={() => setAppliedCoupon(null)}
                        className="text-[10px] font-bold text-primary"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-lg font-black text-gray-900">Total Price</span>
                    <span className="text-3xl font-black text-secondary"><FormattedPrice amount={summary.grandTotal} /></span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Rocket(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-4 5-4" />
      <path d="M12 15v5s3.03-.55 5-2c2.2-1.62 4-5 4-5" />
      <line x1="11.5" y1="15.5" x2="15.5" y2="11.5" />
    </svg>
  );
}
