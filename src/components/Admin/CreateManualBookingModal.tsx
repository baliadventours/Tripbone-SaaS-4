import { useState, useEffect, useMemo, FC } from "react";
import { 
  db, 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  serverTimestamp, 
  runTransaction,
  getActiveTenantId 
} from "../../lib/firebase";
import { 
  Tour, 
  TourPackage, 
  Booking, 
  Guide, 
  UserProfile, 
  AddOn, 
  TransportOption 
} from "../../types";
import { formatPrice, cn } from "../../lib/utils";
import { format } from "date-fns";
import { sendBookingEmail } from "../../lib/emailService";
import { sendCustomWhatsApp, generateBookingMessage } from "../../lib/whatsappService";
import { sanitizeFirestoreData } from "../../services/payment/PaymentService";
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  UserCheck, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Send, 
  ShieldCheck, 
  Building, 
  Car, 
  FileText, 
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  DollarSign
} from "lucide-react";

interface CreateManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tours: Tour[];
  allGuides: Guide[];
  currentUserProfile: UserProfile | null;
  onBookingCreated?: (bookingId: string) => void;
}

export const CreateManualBookingModal: FC<CreateManualBookingModalProps> = ({
  isOpen,
  onClose,
  tours = [],
  allGuides = [],
  currentUserProfile,
  onBookingCreated
}) => {
  // Wizard Step Control (1 to 5)
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

  // Step 1: Tour & Schedule
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [travelDate, setTravelDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [timeSlot, setTimeSlot] = useState<string>('08:00');
  const [inventoryData, setInventoryData] = useState<{
    bookedCount: number;
    maxCapacity: number;
    isLoading: boolean;
  }>({
    bookedCount: 0,
    maxCapacity: 50,
    isLoading: false
  });
  const [bypassCapacity, setBypassCapacity] = useState<boolean>(false);

  // Step 2: Package & Guest Count
  const [selectedPackageName, setSelectedPackageName] = useState<string>('');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [infants, setInfants] = useState<number>(0);

  // Step 3: Add-ons & Transports
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [availableTransports, setAvailableTransports] = useState<TransportOption[]>([]);
  const [selectedTransportId, setSelectedTransportId] = useState<string>('');
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [hotelName, setHotelName] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('');

  // Step 4: Customer Contact & Travelers
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [country, setCountry] = useState<string>('Indonesia');
  const [specialRequirements, setSpecialRequirements] = useState<string>('');

  // Step 5: Payment, Source & Operations
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'failed'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash on Arrival');
  const [bookingSource, setBookingSource] = useState<'Walk-in' | 'WhatsApp Direct' | 'Phone / Email' | 'Hotel Concierge' | 'OTA Offline' | 'Travel Agent' | 'Admin Backend'>('Walk-in');
  const [customPriceOverride, setCustomPriceOverride] = useState<boolean>(false);
  const [manualPrice, setManualPrice] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [assignedGuideId, setAssignedGuideId] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [sendEmailVoucher, setSendEmailVoucher] = useState<boolean>(true);
  const [sendWhatsAppAlert, setSendWhatsAppAlert] = useState<boolean>(true);

  // Selected tour helper
  const selectedTour = useMemo(() => {
    return tours.find(t => t.id === selectedTourId) || null;
  }, [tours, selectedTourId]);

  // Load global add-ons and transports from Firestore
  useEffect(() => {
    if (!isOpen) return;
    const fetchGlobals = async () => {
      try {
        const [addOnSnap, transportSnap] = await Promise.all([
          getDocs(collection(db, 'globalAddOns')),
          getDocs(collection(db, 'globalTransports'))
        ]);
        const addOnsList = addOnSnap.docs.map(d => ({ id: d.id, ...d.data() } as AddOn));
        const transportsList = transportSnap.docs.map(d => ({ id: d.id, ...d.data() } as TransportOption));
        setAvailableAddOns(addOnsList);
        setAvailableTransports(transportsList);
      } catch (e) {
        console.error("Error fetching addOns or transports:", e);
      }
    };
    fetchGlobals();
  }, [isOpen]);

  // Available packages for selected tour
  const availablePackages = useMemo(() => {
    if (!selectedTour) return [];
    if (selectedTour.packages && selectedTour.packages.length > 0) {
      return selectedTour.packages;
    }
    return [{
      name: 'Standard Package',
      details: 'Standard tour reservation',
      inclusions: selectedTour.inclusions || [],
      exclusions: selectedTour.exclusions || [],
      tiers: [{
        minParticipants: 1,
        maxParticipants: 99,
        adultPrice: selectedTour.regularPrice || 0,
        childPrice: Math.round((selectedTour.regularPrice || 0) * 0.75)
      }]
    } as TourPackage];
  }, [selectedTour]);

  // Selected package helper
  const selectedPackage = useMemo(() => {
    if (!availablePackages.length) return null;
    return availablePackages.find(p => p.name === selectedPackageName) || availablePackages[0];
  }, [availablePackages, selectedPackageName]);

  // Auto initialize tour, package, timeSlot on open
  useEffect(() => {
    if (isOpen && tours.length > 0 && !selectedTourId) {
      const firstTour = tours[0];
      setSelectedTourId(firstTour.id);
      if (firstTour.packages?.length) {
        setSelectedPackageName(firstTour.packages[0].name);
      }
      if (firstTour.timeSlots?.length) {
        setTimeSlot(firstTour.timeSlots[0]);
      } else {
        setTimeSlot('08:00');
      }
    }
  }, [isOpen, tours, selectedTourId]);

  // Update time slot and package when tour changes
  useEffect(() => {
    if (selectedTour) {
      if (selectedTour.packages?.length) {
        setSelectedPackageName(selectedTour.packages[0].name);
      }
      if (selectedTour.timeSlots?.length) {
        setTimeSlot(selectedTour.timeSlots[0]);
      } else {
        setTimeSlot('08:00');
      }
    }
  }, [selectedTour]);

  // Check live capacity from Firestore Inventory
  useEffect(() => {
    if (!isOpen || !selectedTourId || !travelDate) return;

    let isMounted = true;
    const fetchInventory = async () => {
      setInventoryData(prev => ({ ...prev, isLoading: true }));
      try {
        const slotKey = timeSlot || 'daily';
        const invId = `${selectedTourId}_${travelDate}_${slotKey}`;
        const invDoc = await getDoc(doc(db, 'inventory', invId));
        
        const maxCap = selectedTour?.maxCapacity || selectedTour?.slotCapacity || 50;
        
        if (invDoc.exists()) {
          const data = invDoc.data();
          if (isMounted) {
            setInventoryData({
              bookedCount: Number(data.bookedCount || 0),
              maxCapacity: Number(data.maxCapacity || maxCap),
              isLoading: false
            });
          }
        } else {
          if (isMounted) {
            setInventoryData({
              bookedCount: 0,
              maxCapacity: maxCap,
              isLoading: false
            });
          }
        }
      } catch (err) {
        console.error("Error checking inventory:", err);
        if (isMounted) {
          setInventoryData(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    fetchInventory();
    return () => { isMounted = false; };
  }, [isOpen, selectedTourId, travelDate, timeSlot, selectedTour]);

  // Dynamic Price Calculation
  const priceCalculations = useMemo(() => {
    const totalPax = adults + children;
    let adultRate = selectedTour?.regularPrice || 0;
    let childRate = Math.round((selectedTour?.regularPrice || 0) * 0.75);

    if (selectedPackage && selectedPackage.tiers && selectedPackage.tiers.length > 0) {
      const matchedTier = selectedPackage.tiers.find(
        t => totalPax >= t.minParticipants && (!t.maxParticipants || totalPax <= t.maxParticipants)
      ) || selectedPackage.tiers[0];

      if (matchedTier) {
        adultRate = matchedTier.adultPrice;
        childRate = matchedTier.childPrice || Math.round(matchedTier.adultPrice * 0.75);
      }
    }

    const packageTotal = (adults * adultRate) + (children * childRate);
    const addOnsTotal = selectedAddOns.reduce((acc, a) => acc + (a.price * a.quantity), 0);
    
    let transportPrice = 0;
    if (selectedTransportId) {
      const tr = availableTransports.find(t => t.id === selectedTransportId);
      if (tr) transportPrice = tr.price;
    }

    const subTotal = packageTotal + addOnsTotal + transportPrice;
    const finalTotal = Math.max(0, subTotal - discountAmount);

    return {
      adultRate,
      childRate,
      packageTotal,
      addOnsTotal,
      transportPrice,
      subTotal,
      finalTotal: customPriceOverride ? manualPrice : finalTotal
    };
  }, [
    adults, 
    children, 
    selectedTour, 
    selectedPackage, 
    selectedAddOns, 
    selectedTransportId, 
    availableTransports,
    discountAmount, 
    customPriceOverride, 
    manualPrice
  ]);

  // Toggle AddOn selection
  const handleToggleAddOn = (addon: AddOn) => {
    setSelectedAddOns(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, { id: addon.id, name: addon.name, price: addon.price, quantity: 1 }];
      }
    });
  };

  const handleUpdateAddOnQty = (addonId: string, delta: number) => {
    setSelectedAddOns(prev => prev.map(a => {
      if (a.id === addonId) {
        const newQty = Math.max(1, a.quantity + delta);
        return { ...a, quantity: newQty };
      }
      return a;
    }));
  };

  // Submit Manual Booking
  const handleCreateBooking = async () => {
    if (!selectedTour) {
      alert("Please select a tour experience.");
      setActiveStep(1);
      return;
    }
    if (!fullName.trim()) {
      alert("Please enter customer's full name.");
      setActiveStep(4);
      return;
    }
    if (!travelDate) {
      alert("Please select travel date.");
      setActiveStep(1);
      return;
    }

    const totalPax = adults + children;
    const spotsLeft = inventoryData.maxCapacity - inventoryData.bookedCount;
    if (totalPax > spotsLeft && !bypassCapacity) {
      const proceed = window.confirm(`Only ${spotsLeft} spots available on this date. Would you like to bypass capacity and force this manual booking?`);
      if (!proceed) return;
    }

    setIsSubmitting(true);
    try {
      const tenantId = getActiveTenantId() || 'global';
      const referenceId = `TB-${format(new Date(), 'yyMM')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      const assignedGuide = allGuides.find(g => g.id === assignedGuideId);
      const selectedTransportObj = availableTransports.find(t => t.id === selectedTransportId) || null;

      const newBookingData: Omit<Booking, 'id'> = {
        tourId: selectedTour.id,
        tourTitle: selectedTour.title,
        userId: currentUserProfile?.uid || 'admin-manual',
        tenantId,
        supplierId: selectedTour.supplierId || '',
        supplierName: selectedTour.supplierName || '',
        customerData: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          country: country || 'Indonesia',
          pickupAddress: pickupAddress.trim() || hotelName.trim(),
          specialRequirements: specialRequirements.trim()
        },
        date: travelDate,
        time: pickupTime || timeSlot || '08:00',
        timeSlot: timeSlot || '08:00',
        participants: {
          adults: Number(adults),
          children: Number(children)
        },
        packageName: selectedPackage?.name || 'Standard Package',
        selectedAddOns: selectedAddOns.map(a => ({
          id: a.id,
          name: a.name,
          price: a.price,
          quantity: a.quantity
        })),
        selectedTransport: selectedTransportObj,
        transportTotal: priceCalculations.transportPrice,
        discountAmount: Number(discountAmount || 0),
        totalAmount: Number(priceCalculations.finalTotal || 0),
        status: 'confirmed',
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod,
        paymentId: referenceId,
        bookingSource: bookingSource,
        internalNotes: internalNotes.trim(),
        assignedGuideId: assignedGuide?.id || '',
        assignedGuideName: assignedGuide?.name || '',
        assignedGuideWhatsapp: assignedGuide?.whatsapp || '',
        bookedBy: {
          uid: currentUserProfile?.uid || 'admin',
          name: currentUserProfile?.displayName || 'Admin Console',
          email: currentUserProfile?.email || '',
          role: currentUserProfile?.role || 'admin'
        },
        pricingBreakdown: {
          adultRate: priceCalculations.adultRate,
          childRate: priceCalculations.childRate,
          packageTotal: priceCalculations.packageTotal,
          transportTotal: priceCalculations.transportPrice
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // 1. Transactional Inventory Update (Atomic lock & reservation)
      const slotKey = timeSlot || 'daily';
      const invId = `${selectedTour.id}_${travelDate}_${slotKey}`;
      const invRef = doc(db, 'inventory', invId);

      await runTransaction(db, async (transaction) => {
        const invSnap = await transaction.get(invRef);
        const maxCap = selectedTour?.maxCapacity || selectedTour?.slotCapacity || 50;

        if (!invSnap.exists()) {
          transaction.set(invRef, {
            tourId: selectedTour.id,
            date: travelDate,
            timeSlot: slotKey,
            bookedCount: totalPax,
            maxCapacity: maxCap,
            tenantId,
            updatedAt: serverTimestamp()
          });
        } else {
          const currentBooked = Number(invSnap.data().bookedCount || 0);
          transaction.update(invRef, {
            bookedCount: currentBooked + totalPax,
            updatedAt: serverTimestamp()
          });
        }
      });

      // 2. Save Booking to Firestore (Sanitized)
      const bookingDocRef = doc(collection(db, 'bookings'));
      const sanitized = sanitizeFirestoreData({
        id: bookingDocRef.id,
        ...newBookingData
      });

      await setDoc(bookingDocRef, sanitized);

      const createdBooking: Booking = {
        id: bookingDocRef.id,
        ...newBookingData,
        createdAt: new Date().toISOString()
      };

      // 3. Dispatch Notifications if selected
      if (sendEmailVoucher && email.trim()) {
        try {
          await sendBookingEmail('confirmation', createdBooking);
        } catch (mailErr) {
          console.warn("Could not dispatch email:", mailErr);
        }
      }

      if (sendWhatsAppAlert && phone.trim()) {
        try {
          const defaultTemplate = "Hi {{customerName}}, your booking for {{tourTitle}} on {{date}} at {{time}} is confirmed! Ref ID: {{bookingId}}. See you soon!";
          const msg = generateBookingMessage(defaultTemplate, createdBooking);
          await sendCustomWhatsApp(phone.trim(), msg, createdBooking);
        } catch (waErr) {
          console.warn("Could not trigger WhatsApp:", waErr);
        }
      }

      setSuccessBookingId(bookingDocRef.id);
      if (onBookingCreated) {
        onBookingCreated(bookingDocRef.id);
      }
    } catch (err: any) {
      console.error("Failed to create manual booking:", err);
      alert(`Error creating booking: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleResetAndClose = () => {
    setActiveStep(1);
    setSuccessBookingId(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setPickupAddress('');
    setHotelName('');
    setInternalNotes('');
    setSelectedAddOns([]);
    setSelectedTransportId('');
    setBypassCapacity(false);
    setCustomPriceOverride(false);
    setManualPrice(0);
    setDiscountAmount(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-xs font-sans">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Manual Backend Booking
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white uppercase tracking-wider">
                  Admin Dispatch
                </span>
              </h3>
              <p className="text-xs text-gray-400 font-medium">Create offline, walk-in, concierge, or telephone reservations with real-time inventory sync.</p>
            </div>
          </div>
          <button 
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator Wizard Bar */}
        {!successBookingId && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between overflow-x-auto gap-2 text-xs font-bold">
            {[
              { num: 1, label: 'Tour & Schedule' },
              { num: 2, label: 'Package & Pax' },
              { num: 3, label: 'Add-ons & Pickup' },
              { num: 4, label: 'Customer Details' },
              { num: 5, label: 'Payment & Source' }
            ].map((step) => {
              const isPassed = activeStep > step.num;
              const isCurrent = activeStep === step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setActiveStep(step.num)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer",
                    isCurrent 
                      ? "bg-primary text-white shadow-xs" 
                      : isPassed 
                        ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" 
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <span className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black",
                    isCurrent 
                      ? "bg-white text-primary" 
                      : isPassed 
                        ? "bg-emerald-600 text-white" 
                        : "bg-gray-200 text-gray-600"
                  )}>
                    {isPassed ? "✓" : step.num}
                  </span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {successBookingId ? (
            /* Success View */
            <div className="text-center py-10 space-y-5 max-w-md mx-auto">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900">Manual Booking Created!</h3>
                <p className="text-xs text-gray-500 font-medium">
                  Reservation has been recorded and synced to the database with reference ID:
                </p>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 font-mono text-sm font-black text-gray-800 tracking-wider inline-block">
                  {successBookingId}
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-left space-y-2 text-xs">
                <div className="flex justify-between font-bold text-gray-700">
                  <span>Guest Name:</span>
                  <span className="text-gray-900">{fullName}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-700">
                  <span>Tour Experience:</span>
                  <span className="text-gray-900">{selectedTour?.title}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-700">
                  <span>Travel Date & Time:</span>
                  <span className="text-gray-900">{travelDate} @ {timeSlot}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-700">
                  <span>Total Pax:</span>
                  <span className="text-gray-900">{adults + children} Passengers</span>
                </div>
                <div className="flex justify-between font-bold text-gray-700 border-t border-orange-200/60 pt-2">
                  <span>Total Amount:</span>
                  <span className="text-base font-black text-primary">{formatPrice(priceCalculations.finalTotal)}</span>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            /* Wizard Steps */
            <div>
              {/* STEP 1: Tour & Schedule */}
              {activeStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" /> Step 1: Select Tour Experience & Date
                    </h4>
                    <p className="text-xs text-gray-400 font-medium">Choose the tour activity, departure date, and departure slot.</p>
                  </div>

                  {/* Tour Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Tour Experience <span className="text-red-500">*</span></label>
                    <select
                      value={selectedTourId}
                      onChange={(e) => setSelectedTourId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-xs font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-gray-800"
                    >
                      {tours.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title} - ({formatPrice(t.regularPrice || 0)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date & Time Slot Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Travel Date <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          value={travelDate}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          onChange={(e) => setTravelDate(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-gray-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Departure Time Slot</label>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        {selectedTour?.timeSlots && selectedTour.timeSlots.length > 0 ? (
                          <select
                            value={timeSlot}
                            onChange={(e) => setTimeSlot(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-gray-800"
                          >
                            {selectedTour.timeSlots.map(ts => (
                              <option key={ts} value={ts}>{ts}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={timeSlot}
                            onChange={(e) => setTimeSlot(e.target.value)}
                            placeholder="e.g. 08:00 AM"
                            className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-gray-800"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Inventory Status Box */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs",
                        inventoryData.maxCapacity - inventoryData.bookedCount > 0 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-red-100 text-red-700"
                      )}>
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-gray-900 flex items-center gap-2">
                          Live Availability Status
                          {inventoryData.isLoading && <span className="text-[10px] text-gray-400 font-normal">(Checking inventory...)</span>}
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">
                          Booked: <strong className="text-gray-900">{inventoryData.bookedCount}</strong> / Capacity: <strong className="text-gray-900">{inventoryData.maxCapacity}</strong> spots
                          {" • "}
                          <span className={cn("font-bold", inventoryData.maxCapacity - inventoryData.bookedCount > 0 ? "text-emerald-600" : "text-red-600")}>
                            {Math.max(0, inventoryData.maxCapacity - inventoryData.bookedCount)} spots available
                          </span>
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer self-start sm:self-auto">
                      <input
                        type="checkbox"
                        checked={bypassCapacity}
                        onChange={(e) => setBypassCapacity(e.target.checked)}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>Bypass Capacity Limits (Force Booking)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 2: Package & Guest Count */}
              {activeStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" /> Step 2: Package & Number of Guests
                    </h4>
                    <p className="text-xs text-gray-400 font-medium">Select package variant and adjust guest counts.</p>
                  </div>

                  {/* Package Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availablePackages.map((pkg, idx) => {
                      const isSelected = pkg.name === selectedPackageName;
                      const firstTier = pkg.tiers?.[0];
                      const displayPrice = firstTier ? firstTier.adultPrice : (selectedTour?.regularPrice || 0);

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedPackageName(pkg.name)}
                          className={cn(
                            "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 text-left",
                            isSelected 
                              ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20" 
                              : "border-gray-100 hover:border-gray-200 bg-white"
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-gray-900">{pkg.name}</span>
                              <span className="text-xs font-extrabold text-primary">{formatPrice(displayPrice)}</span>
                            </div>
                            {pkg.details && (
                              <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{pkg.details}</p>
                            )}
                          </div>
                          {pkg.tiers && pkg.tiers.length > 0 && (
                            <div className="text-[10px] text-gray-400 font-semibold bg-gray-50 px-2.5 py-1 rounded-lg">
                              Includes {pkg.tiers.length} tiered rate scales
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Participant Counters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-gray-900 block">Adults (Age 12+)</span>
                        <span className="text-[11px] text-primary font-bold">{formatPrice(priceCalculations.adultRate)}/pax</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="h-8 w-8 rounded-lg bg-white border border-gray-200 font-black text-gray-700 hover:bg-gray-100"
                        >-</button>
                        <span className="w-6 text-center font-black text-sm text-gray-900">{adults}</span>
                        <button
                          type="button"
                          onClick={() => setAdults(adults + 1)}
                          className="h-8 w-8 rounded-lg bg-white border border-gray-200 font-black text-gray-700 hover:bg-gray-100"
                        >+</button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-gray-900 block">Children (Age 3-11)</span>
                        <span className="text-[11px] text-primary font-bold">{formatPrice(priceCalculations.childRate)}/pax</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="h-8 w-8 rounded-lg bg-white border border-gray-200 font-black text-gray-700 hover:bg-gray-100"
                        >-</button>
                        <span className="w-6 text-center font-black text-sm text-gray-900">{children}</span>
                        <button
                          type="button"
                          onClick={() => setChildren(children + 1)}
                          className="h-8 w-8 rounded-lg bg-white border border-gray-200 font-black text-gray-700 hover:bg-gray-100"
                        >+</button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-gray-900 block">Infants (Age 0-2)</span>
                        <span className="text-[11px] text-emerald-600 font-bold">Free (0 IDR)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInfants(Math.max(0, infants - 1))}
                          className="h-8 w-8 rounded-lg bg-white border border-gray-200 font-black text-gray-700 hover:bg-gray-100"
                        >-</button>
                        <span className="w-6 text-center font-black text-sm text-gray-900">{infants}</span>
                        <button
                          type="button"
                          onClick={() => setInfants(infants + 1)}
                          className="h-8 w-8 rounded-lg bg-white border border-gray-200 font-black text-gray-700 hover:bg-gray-100"
                        >+</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Add-ons & Pickup */}
              {activeStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary" /> Step 3: Optional Add-ons & Hotel Pickup
                    </h4>
                    <p className="text-xs text-gray-400 font-medium">Select transport upgrades, optional tour add-ons, and hotel address.</p>
                  </div>

                  {/* Transport Options */}
                  {availableTransports.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700">Transport Option</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div
                          onClick={() => setSelectedTransportId('')}
                          className={cn(
                            "p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-between",
                            !selectedTransportId ? "border-primary bg-primary/5 text-primary" : "border-gray-200 bg-white text-gray-700"
                          )}
                        >
                          <span>Meet at Location (No Pickup)</span>
                          <span className="text-[10px] text-gray-400 font-medium">Free</span>
                        </div>
                        {availableTransports.map((tr) => (
                          <div
                            key={tr.id}
                            onClick={() => setSelectedTransportId(tr.id)}
                            className={cn(
                              "p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-between",
                              selectedTransportId === tr.id ? "border-primary bg-primary/5 text-primary" : "border-gray-200 bg-white text-gray-700"
                            )}
                          >
                            <span>{tr.name}</span>
                            <span className="text-xs font-extrabold">{formatPrice(tr.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hotel & Pickup Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Hotel Name / Resort</label>
                      <input
                        type="text"
                        value={hotelName}
                        onChange={(e) => setHotelName(e.target.value)}
                        placeholder="e.g. Hilton Bali Resort Nusa Dua"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-800 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Exact Pickup Address / Room #</label>
                      <input
                        type="text"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="e.g. Lobby Area, Villa 4B"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-800 outline-none"
                      />
                    </div>
                  </div>

                  {/* Add-ons Grid */}
                  {availableAddOns.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-gray-700">Available Tour Add-ons</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {availableAddOns.map((addon) => {
                          const selected = selectedAddOns.find(a => a.id === addon.id);
                          return (
                            <div
                              key={addon.id}
                              className={cn(
                                "p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all",
                                selected ? "border-primary bg-primary/5" : "border-gray-100 bg-white"
                              )}
                            >
                              <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => handleToggleAddOn(addon)}
                              >
                                <span className="font-bold text-gray-900 block">{addon.name}</span>
                                <span className="text-[11px] text-gray-500 font-medium">
                                  {formatPrice(addon.price)} {addon.unit ? `(${addon.unit})` : ''}
                                </span>
                              </div>
                              {selected && (
                                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-gray-200">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateAddOnQty(addon.id, -1)}
                                    className="h-5 w-5 text-xs font-bold text-gray-700 rounded bg-gray-100"
                                  >-</button>
                                  <span className="w-4 text-center font-bold text-xs">{selected.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateAddOnQty(addon.id, 1)}
                                    className="h-5 w-5 text-xs font-bold text-gray-700 rounded bg-gray-100"
                                  >+</button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Customer Contact Details */}
              {activeStep === 4 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-primary" /> Step 4: Passenger & Contact Information
                    </h4>
                    <p className="text-xs text-gray-400 font-medium">Enter primary guest details for manifest and notifications.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Lead Passenger Full Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-gray-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Email Address (for voucher)</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-gray-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">WhatsApp / Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+62 812 3456 7890"
                          className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-gray-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Country of Origin / Nationality</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. Australia, Germany, Indonesia"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-gray-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Special Requirements & Dietary Notes</label>
                    <textarea
                      rows={2}
                      value={specialRequirements}
                      onChange={(e) => setSpecialRequirements(e.target.value)}
                      placeholder="e.g. Vegetarian lunch, wheelchair access, child booster seat required..."
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-gray-800"
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: Payment, Source & Operations */}
              {activeStep === 5 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" /> Step 5: Payment, Booking Source & Dispatch
                    </h4>
                    <p className="text-xs text-gray-400 font-medium">Define payment records, booking origin channel, and driver assignment.</p>
                  </div>

                  {/* Channel Source & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Booking Source</label>
                      <select
                        value={bookingSource}
                        onChange={(e) => setBookingSource(e.target.value as any)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none text-gray-800"
                      >
                        <option value="Walk-in">🚶 Walk-in Customer</option>
                        <option value="WhatsApp Direct">💬 WhatsApp Direct</option>
                        <option value="Phone / Email">📞 Phone / Email</option>
                        <option value="Hotel Concierge">🏨 Hotel Concierge</option>
                        <option value="OTA Offline">🌐 OTA Offline</option>
                        <option value="Travel Agent">🤝 Travel Agent</option>
                        <option value="Admin Backend">🖥️ Admin Backend</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Payment Status</label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value as any)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none text-gray-800"
                      >
                        <option value="paid">✅ Paid in Full</option>
                        <option value="unpaid">⏳ Unpaid (Pay Later)</option>
                        <option value="deposit_paid">💰 Deposit Paid</option>
                        <option value="refunded">↩️ Refunded</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none text-gray-800"
                      >
                        <option value="Cash on Arrival">💵 Cash on Arrival</option>
                        <option value="Bank Transfer">🏦 Bank Transfer / BCA / Mandiri</option>
                        <option value="Credit Card POS">💳 Credit Card POS Machine</option>
                        <option value="QRIS / E-Wallet">📱 QRIS / GoPay / OVO</option>
                        <option value="PayPal">🅿️ PayPal</option>
                        <option value="Wise">🌐 Wise</option>
                        <option value="Complimentary">🎁 Complimentary</option>
                      </select>
                    </div>
                  </div>

                  {/* Assign Guide & Driver */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Assign Guide / Driver</label>
                      <select
                        value={assignedGuideId}
                        onChange={(e) => setAssignedGuideId(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none text-gray-800"
                      >
                        <option value="">-- Assign Later / Unassigned --</option>
                        {allGuides.map(g => (
                          <option key={g.id} value={g.id}>
                            👤 {g.name} ({g.whatsapp})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Internal Admin Memo</label>
                      <input
                        type="text"
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="e.g. VIP client from partner hotel, free upgrade applied"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-800 outline-none"
                      />
                    </div>
                  </div>

                  {/* Price Summary & Custom Override Box */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                      <span className="text-xs font-black text-gray-800">Financial Breakdown</span>
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPriceOverride}
                          onChange={(e) => {
                            setCustomPriceOverride(e.target.checked);
                            if (e.target.checked) setManualPrice(priceCalculations.finalTotal);
                          }}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span>Custom Price Override</span>
                      </label>
                    </div>

                    {customPriceOverride ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-primary">Custom Agreed Price (IDR)</label>
                        <input
                          type="number"
                          value={manualPrice}
                          onChange={(e) => setManualPrice(Number(e.target.value))}
                          className="w-full bg-white border border-primary rounded-xl px-3.5 py-2.5 text-sm font-black text-primary outline-none"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Package ({adults} Adults + {children} Children):</span>
                          <span className="font-bold text-gray-900">{formatPrice(priceCalculations.packageTotal)}</span>
                        </div>
                        {priceCalculations.transportPrice > 0 && (
                          <div className="flex justify-between text-gray-600">
                            <span>Transport Upgrade:</span>
                            <span className="font-bold text-gray-900">{formatPrice(priceCalculations.transportPrice)}</span>
                          </div>
                        )}
                        {priceCalculations.addOnsTotal > 0 && (
                          <div className="flex justify-between text-gray-600">
                            <span>Add-ons Total:</span>
                            <span className="font-bold text-gray-900">{formatPrice(priceCalculations.addOnsTotal)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-gray-600">Discount Voucher / Promo:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">- IDR</span>
                            <input
                              type="number"
                              value={discountAmount}
                              onChange={(e) => setDiscountAmount(Number(e.target.value))}
                              placeholder="0"
                              className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-right outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
                          <span>Grand Total Due:</span>
                          <span className="text-base text-primary font-black">{formatPrice(priceCalculations.finalTotal)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notification Triggers */}
                  <div className="flex flex-wrap items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendEmailVoucher}
                        onChange={(e) => setSendEmailVoucher(e.target.checked)}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>📧 Dispatch Email Voucher to Guest</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendWhatsAppAlert}
                        onChange={(e) => setSendWhatsAppAlert(e.target.checked)}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>💬 Trigger WhatsApp Confirmation Message</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        {!successBookingId && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div>
              {activeStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Estimated Total</span>
                <span className="text-sm font-black text-primary">{formatPrice(priceCalculations.finalTotal)}</span>
              </div>

              {activeStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm shadow-orange-500/20 active:scale-[0.98]"
                >
                  Next Step <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCreateBooking}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Reserving Spots...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 stroke-[2.5]" /> Confirm & Create Booking
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateManualBookingModal;
