import { useState, FormEvent, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Info, Rocket, Check, X, Plus, Minus, ChevronRight, ChevronLeft, ShieldCheck, Mail, Phone, User as UserIcon, CreditCard, Loader2, ChevronDown, Clock, AlertTriangle } from 'lucide-react';
import { Tour, TourPackage, PricingTier, Booking, AddOn } from '../../types';
import { formatPrice, cn } from '../../lib/utils';
import FormattedPrice from '../FormattedPrice';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from '@/src/lib/firebase';
import { getEffectiveCutOffHours, isSlotCutOff, isDateFullyCutOff, formatCutOffNotice, validateBookingCutOff } from '../../lib/cutOffUtils';
import PriceSummaryModal from './PriceSummaryModal';

interface BookingFormProps {
  tour: Tour;
}

type BookingStep = 'package' | 'addons' | 'customer' | 'payment';

export default function BookingForm({ tour }: BookingFormProps) {
  const navigate = useNavigate();
  
  const getDefaultDateString = () => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const year = tmr.getFullYear();
    const month = String(tmr.getMonth() + 1).padStart(2, '0');
    const day = String(tmr.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<string>(() => getDefaultDateString());
  const [selectedTime, setSelectedTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [cutOffError, setCutOffError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Effective cut-off time in hours
  const cutOffHours = useMemo(() => getEffectiveCutOffHours(tour), [tour]);

  const minRequired = useMemo(() => {
    if (!tour || !tour.packages || tour.packages.length === 0) return 1;
    return Math.min(...tour.packages.map(pkg => 
      pkg.tiers && pkg.tiers.length > 0 ? Math.min(...pkg.tiers.map(t => t.minParticipants)) : 1
    ));
  }, [tour]);

  const [adults, setAdults] = useState(Math.max(1, minRequired));
  const [children, setChildren] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showPriceSummary, setShowPriceSummary] = useState(false);
  const [step, setStep] = useState<BookingStep>('package');
  const [isBooking, setIsBooking] = useState(false);

  // Auto select default time slot if available
  useEffect(() => {
    if (tour?.timeSlots && tour.timeSlots.length > 0 && !selectedTime) {
      const validSlot = tour.timeSlots.find(t => !date || !isSlotCutOff(date, t, cutOffHours));
      setSelectedTime(validSlot || tour.timeSlots[0]);
    }
  }, [tour, date, selectedTime, cutOffHours]);

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

  // Selection state
  const [selectedPackage, setSelectedPackage] = useState<TourPackage | null>(() => {
    return tour?.packages && tour.packages.length > 0 ? tour.packages[0] : null;
  });
  const [selectedAddOns, setSelectedAddOns] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [customerData, setCustomerData] = useState({
    fullName: auth.currentUser?.displayName || '',
    email: auth.currentUser?.email || '',
    phone: '',
    specialRequirements: ''
  });

  // Basic package price calculation helper
  const calculatePackagePrice = (pkg: TourPackage) => {
    if (!pkg.tiers || pkg.tiers.length === 0) return 0;
    const totalPax = adults + children;
    const tiers = pkg.tiers;
    const tier = tiers.find(t => totalPax >= t.minParticipants && totalPax <= t.maxParticipants);
    const applicableTier = tier || (totalPax < (tiers[0]?.minParticipants || 0)
                                     ? tiers[0] 
                                     : tiers[tiers.length - 1]);
    
    const adultRate = applicableTier?.adultPrice || 0;
    const childRate = applicableTier?.childPrice || 0;
    return (adultRate * adults) + (childRate * children);
  };

  // Total summary calculation
  const summary = useMemo(() => {
    if (!selectedPackage) return { packageTotal: 0, addonsTotal: 0, grandTotal: 0 };
    
    const packageTotal = calculatePackagePrice(selectedPackage);
    const addonsTotal = selectedAddOns.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
    
    return {
      packageTotal,
      addonsTotal,
      grandTotal: packageTotal + addonsTotal
    };
  }, [selectedPackage, selectedAddOns, adults, children]);

  const toggleAddOn = (addon: AddOn) => {
    const existing = selectedAddOns.find(a => a.id === addon.id);
    if (existing) {
      setSelectedAddOns(selectedAddOns.filter(a => a.id !== addon.id));
    } else {
      const quantity = addon.unit === 'per person' ? (adults + children) : 1;
      setSelectedAddOns([...selectedAddOns, { id: addon.id, name: addon.name, price: addon.price, quantity }]);
    }
  };

  // Starting rate calculation per person
  const startingPrice = useMemo(() => {
    if (tour.discountPrice) return tour.discountPrice;
    if (tour.regularPrice) return tour.regularPrice;
    if (tour.packages && tour.packages.length > 0) {
      const p0 = tour.packages[0];
      if (p0.tiers && p0.tiers.length > 0) return p0.tiers[0].adultPrice;
    }
    return 0;
  }, [tour]);

  const totalGuests = Math.max(1, adults + children);
  const estimatedTotal = startingPrice * totalGuests;

  const handleAvailabilityCheck = (e?: FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setCutOffError(null);

    let targetDate = date;
    if (!targetDate) {
      targetDate = getDefaultDateString();
      setDate(targetDate);
    }

    setIsNavigating(true);

    // Navigate to checkout page where customer picks package and time slot
    const targetTourId = tour.id || (tour as any).slug || (tour as any)._id;
    navigate(`/checkout/${targetTourId}?date=${targetDate}&adults=${adults}&children=${children}`);
  };

  if (!tour.packages || tour.packages.length === 0) {
    return (
      <div className="rounded-[10px] border-2 border-dashed border-gray-200 p-8 text-center text-gray-400">
        <p className="font-bold">No packages available for this tour.</p>
      </div>
    );
  }

  return (
    <>
      {/* Airbnb-style Sleek Booking Card */}
      <div id="package" className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl shadow-neutral-900/[0.04] scroll-mt-[100px] text-left">
        {/* Header: Clean Price & Micro-Trust */}
        <div className="flex items-baseline justify-between mb-5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight font-display">
              <FormattedPrice amount={startingPrice} />
            </span>
            <span className="text-sm font-normal text-neutral-500">/ person</span>
            {tour.discountPrice && tour.regularPrice && (
              <span className="text-xs text-neutral-400 line-through ml-1 font-medium">
                <FormattedPrice amount={tour.regularPrice} />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-neutral-700">
            <ShieldCheck className="w-4 h-4 text-neutral-500" />
            <span>Best price</span>
          </div>
        </div>

        {cutOffError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-medium animate-in fade-in">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              {cutOffError}
            </div>
          </div>
        )}

        <form id="tour-booking-form" onSubmit={handleAvailabilityCheck} className="space-y-4">
          {/* Airbnb Segmented Date & Guests Box (Package & Time chosen on step 2) */}
          <div className="border border-neutral-300 rounded-2xl divide-y divide-neutral-200 bg-white shadow-xs focus-within:ring-2 focus-within:ring-primary transition-all overflow-hidden">
            {/* Date Cell */}
            <div 
              onClick={() => {
                setShowDatePicker(!showDatePicker);
                setShowGuestPicker(false);
              }}
              className="p-3.5 cursor-pointer hover:bg-neutral-50/80 transition-colors flex items-center justify-between"
            >
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 mb-0.5">
                  Date
                </label>
                <div className="text-xs font-bold text-neutral-900 truncate">
                  {date ? new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Add date'}
                </div>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-neutral-400 transition-transform duration-200", showDatePicker && "rotate-180")} />
            </div>

            {/* Guests Cell */}
            <div 
              onClick={() => {
                setShowGuestPicker(!showGuestPicker);
                setShowDatePicker(false);
              }}
              className="p-3.5 cursor-pointer hover:bg-neutral-50/80 transition-colors flex items-center justify-between"
            >
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 mb-0.5">
                  Guests
                </label>
                <div className="text-xs font-bold text-neutral-900">
                  {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'} ({adults} {adults === 1 ? 'adult' : 'adults'}{children > 0 ? `, ${children} ${children === 1 ? 'child' : 'children'}` : ''})
                </div>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-neutral-400 transition-transform duration-200", showGuestPicker && "rotate-180")} />
            </div>
          </div>

          {/* Date Picker Popover */}
          <AnimatePresence>
            {showDatePicker && (
              <motion.div 
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className="bg-white rounded-2xl shadow-2xl border border-neutral-200 p-4 relative z-50 mt-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => {
                    const d = new Date(currentMonth);
                    d.setMonth(d.getMonth() - 1);
                    setCurrentMonth(d);
                  }} className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600 cursor-pointer">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-bold text-neutral-900 text-xs">
                    {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button type="button" onClick={() => {
                    const d = new Date(currentMonth);
                    d.setMonth(d.getMonth() + 1);
                    setCurrentMonth(d);
                  }} className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600 cursor-pointer">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-semibold text-neutral-400 uppercase">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                    const d = i + 1;
                    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
                    const isPast = dateObj < new Date(new Date().setHours(0,0,0,0));
                    const dateString = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                    const isSelected = date === dateString;
                    const isCutOff = isDateFullyCutOff(dateString, tour.timeSlots, cutOffHours);
                    const isDisabled = isPast || isCutOff;

                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={isDisabled}
                        title={isPast ? "Past date" : isCutOff ? `Cut-off reached` : undefined}
                        onClick={() => {
                          setDate(dateString);
                          setCutOffError(null);
                          setShowDatePicker(false);
                        }}
                        className={cn(
                          "aspect-square rounded-full text-xs font-semibold transition-all flex flex-col items-center justify-center cursor-pointer",
                          isSelected 
                            ? "bg-primary text-white font-bold" 
                            : isDisabled 
                              ? "text-neutral-300 cursor-not-allowed line-through decoration-neutral-300" 
                              : "text-neutral-800 hover:bg-neutral-100"
                        )}
                      >
                        <span>{d}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Guest Picker Popover */}
          <AnimatePresence>
            {showGuestPicker && (
              <motion.div 
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className="bg-white rounded-2xl shadow-2xl border border-neutral-200 p-4 space-y-4 relative z-50 mt-1"
              >
                {/* Adults row */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-neutral-900">Adults</span>
                    <span className="text-[11px] text-neutral-500 font-normal">Age 12+</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      disabled={adults <= 1 || (adults + children) <= minRequired}
                      className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-30 disabled:hover:border-neutral-300 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-4 text-center font-bold text-xs text-neutral-900">{adults}</span>
                    <button
                      type="button"
                      disabled={spotsLeft !== null && (adults + children + 1) > spotsLeft}
                      onClick={() => setAdults(adults + 1)}
                      className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-30 disabled:hover:border-neutral-300 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Children row */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                  <div>
                    <span className="block text-xs font-bold text-neutral-900">Children</span>
                    <span className="text-[11px] text-neutral-500 font-normal">Age 3–11</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      disabled={children <= 0 || (adults + children) <= minRequired}
                      className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-30 disabled:hover:border-neutral-300 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-4 text-center font-bold text-xs text-neutral-900">{children}</span>
                    <button
                      type="button"
                      disabled={spotsLeft !== null && (adults + children + 1) > spotsLeft}
                      onClick={() => setChildren(children + 1)}
                      className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-30 disabled:hover:border-neutral-300 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowGuestPicker(false)}
                    className="text-xs font-bold text-neutral-900 underline hover:text-neutral-700 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subtle Cut-off / Cancellation notice */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 pt-1">
            <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>{formatCutOffNotice(cutOffHours)}</span>
          </div>

          {/* Dynamic Admin Brand Styled Reserve Button */}
          <button
            type="button"
            onClick={handleAvailabilityCheck}
            disabled={isSoldOut || (spotsLeft !== null && totalGuests > spotsLeft) || isNavigating}
            className="w-full py-3.5 px-6 rounded-xl bg-primary hover:opacity-95 text-white font-bold text-base shadow-md shadow-primary/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {isNavigating ? (
              <>
                <span>Processing...</span>
                <Loader2 className="h-4 w-4 animate-spin" />
              </>
            ) : isSoldOut ? (
              'Sold out'
            ) : (spotsLeft !== null && totalGuests > spotsLeft) ? (
              'Not enough spots'
            ) : (
              <span>Check availability</span>
            )}
          </button>

          <p className="text-xs text-neutral-500 text-center font-normal">
            You won&apos;t be charged yet
          </p>

          {/* Airbnb-style Itemized Price Breakdown */}
          <div className="pt-4 border-t border-neutral-200 space-y-3 text-xs text-neutral-600">
            <div className="flex justify-between items-center">
              <span className="underline decoration-neutral-300 cursor-pointer" onClick={() => setShowPriceSummary(true)}>
                <FormattedPrice amount={startingPrice} /> × {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
              </span>
              <span className="font-semibold text-neutral-900">
                <FormattedPrice amount={estimatedTotal} />
              </span>
            </div>

            <div className="border-t border-neutral-200 pt-3 flex justify-between items-center font-bold text-sm text-neutral-900">
              <span>Total before taxes</span>
              <span className="text-base font-extrabold font-display">
                <FormattedPrice amount={estimatedTotal} />
              </span>
            </div>
          </div>
        </form>
      </div>

      {/* Price Summary & Breakdown Modal */}
      {tour && (
        <PriceSummaryModal
          isOpen={showPriceSummary}
          onClose={() => setShowPriceSummary(false)}
          tour={tour}
          initialDate={date}
          initialTime={selectedTime}
          initialAdults={adults}
          initialChildren={children}
          initialPackage={selectedPackage}
          onProceed={(d, t, a, c, p) => {
            setDate(d);
            setSelectedTime(t);
            setAdults(a);
            setChildren(c);
            if (p) setSelectedPackage(p);
            handleAvailabilityCheck();
          }}
        />
      )}
    </>
  );
}
