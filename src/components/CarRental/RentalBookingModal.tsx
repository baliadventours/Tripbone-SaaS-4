import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Car, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  Check, 
  UserCheck, 
  Key, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Plus, 
  Minus, 
  CreditCard, 
  MessageCircle, 
  Info, 
  Fuel, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  User, 
  Plane,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { RentalVehicle, RentalZone, RentalServiceMode, RentalAddOn, Booking } from '../../types';
import { DEFAULT_RENTAL_ZONES, DEFAULT_RENTAL_ADDONS, calculateRentalQuote, openRentalWhatsApp, sanitizeFirestoreData } from '../../lib/carRentalService';
import { useSettings } from '../../lib/SettingsContext';
import { useTenant } from '../../lib/TenantContext';
import FormattedPrice from '../FormattedPrice';
import { db, collection, addDoc, serverTimestamp, getActiveTenantId } from '../../lib/firebase';
import { sendCustomWhatsApp } from '../../lib/whatsappService';
import { cn } from '../../lib/utils';

interface RentalBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: RentalVehicle | null;
  initialMode?: RentalServiceMode;
  initialDuration?: 'hourly' | 'half_day' | 'full_day' | 'multi_day';
  initialDate?: string;
  initialTime?: string;
  initialZoneId?: string;
}

export default function RentalBookingModal({
  isOpen,
  onClose,
  vehicle,
  initialMode = 'with_driver',
  initialDuration = 'full_day',
  initialDate,
  initialTime = '09:00',
  initialZoneId = 'zone-standard',
}: RentalBookingModalProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { tenantId, tenant } = useTenant();

  const [serviceMode, setServiceMode] = useState<RentalServiceMode>(() => {
    if (vehicle && !vehicle.pricing.withDriver?.enabled && vehicle.pricing.selfDrive?.enabled) {
      return 'self_drive';
    }
    return initialMode;
  });

  const [durationType, setDurationType] = useState<'hourly' | 'half_day' | 'full_day' | 'multi_day'>(initialDuration);
  const [durationHours, setDurationHours] = useState(10);
  const [durationDays, setDurationDays] = useState(1);
  const [selectedZoneId, setSelectedZoneId] = useState(initialZoneId);

  const [pickupDate, setPickupDate] = useState(() => {
    if (initialDate) return initialDate;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [pickupTime, setPickupTime] = useState(initialTime);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [flightNumber, setFlightNumber] = useState('');

  // Guest details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Selected add-ons
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const zones = useMemo(() => {
    return vehicle?.customZones && vehicle.customZones.length > 0 
      ? vehicle.customZones 
      : (settings?.carRentalModule?.zones || DEFAULT_RENTAL_ZONES);
  }, [vehicle, settings]);

  const addOns = useMemo(() => {
    return vehicle?.addOns && vehicle.addOns.length > 0 
      ? vehicle.addOns 
      : (settings?.carRentalModule?.globalAddOns || DEFAULT_RENTAL_ADDONS);
  }, [vehicle, settings]);

  const selectedZone = useMemo(() => {
    return zones.find(z => z.id === selectedZoneId) || zones[0] || null;
  }, [zones, selectedZoneId]);

  const chosenAddOnsList = useMemo(() => {
    return addOns.filter(a => selectedAddOnIds.includes(a.id));
  }, [addOns, selectedAddOnIds]);

  const quote = useMemo(() => {
    if (!vehicle) return null;
    return calculateRentalQuote({
      vehicle,
      serviceMode,
      durationType,
      durationHours,
      durationDays,
      selectedZone,
      selectedAddOns: chosenAddOnsList,
      currency: settings?.currency || 'USD',
    });
  }, [vehicle, serviceMode, durationType, durationHours, durationDays, selectedZone, chosenAddOnsList, settings]);

  if (!isOpen || !vehicle || !quote) return null;

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleWhatsAppInquiry = () => {
    openRentalWhatsApp({
      vehicle,
      serviceMode,
      durationType,
      durationDays,
      durationHours,
      pickupDate,
      pickupTime,
      pickupLocation,
      zoneName: selectedZone?.name,
      estimatedTotal: quote.grandTotal,
      currency: settings?.currency || 'USD',
      guestName,
      supportWhatsapp: settings?.whatsappNumber || tenant?.phone,
    });
  };

  const handleOnlineBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorMessage('Please enter the lead driver / guest name.');
      return;
    }
    if (!guestPhone.trim() && !guestEmail.trim()) {
      setErrorMessage('Please provide either WhatsApp phone number or email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const effectiveTenantId = tenantId || getActiveTenantId() || 'general';
      const bookingCode = `RN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const bookingPayload: Partial<Booking> = {
        tourId: vehicle.id,
        tourTitle: `${vehicle.name} (${serviceMode === 'with_driver' ? 'Chauffeur Charter' : 'Self-Drive'})`,
        bookingType: 'rental',
        customerData: {
          fullName: guestName,
          email: guestEmail || 'customer@guest.com',
          phone: guestPhone,
          pickupAddress: pickupLocation || 'Bali Area Hotel / Airport',
          specialRequirements: `Flight: ${flightNumber || 'None'} | Notes: ${specialRequests || 'Standard'}`,
        },
        date: pickupDate,
        timeSlot: pickupTime,
        status: 'pending',
        paymentStatus: 'pending',
        participants: {
          adults: vehicle.passengerCapacity,
          children: 0,
        },
        totalAmount: quote.grandTotal,
        paymentMethod: 'deposit_or_arrival',
        bookingSource: 'Direct',
        tenantId: effectiveTenantId,
        rentalDetails: {
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          vehicleCategory: vehicle.category,
          vehicleImage: vehicle.featuredImage,
          serviceMode,
          durationType,
          durationHours,
          durationDays,
          pickupDate,
          pickupTime,
          pickupLocation,
          dropoffLocation,
          flightNumber,
          zoneId: selectedZone?.id,
          zoneName: selectedZone?.name,
          zoneSurcharge: quote.zoneSurcharge,
          baseRate: quote.baseRate,
          selectedAddOns: chosenAddOnsList.map(a => ({ id: a.id, name: a.name, price: a.price })),
          addOnsTotal: quote.totalAddOns,
          securityDeposit: quote.depositAmount,
          overtimeRatePerHour: quote.overtimeRatePerHour,
          notes: specialRequests,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), sanitizeFirestoreData(bookingPayload));
      
      // Auto trigger WhatsApp confirmation if phone exists
      if (guestPhone) {
        try {
          await sendCustomWhatsApp(
            guestPhone,
            `Hi ${guestName}, your vehicle reservation for ${vehicle.name} has been received! Ref: ${bookingCode}. Our transport coordinator will contact you shortly.`
          );
        } catch (e) {}
      }

      onClose();
      navigate(`/booking-confirmation/${docRef.id}`);
    } catch (err: any) {
      console.error('[RentalBooking Error]:', err);
      setErrorMessage(err?.message || 'Failed to submit vehicle reservation. Please try WhatsApp booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 my-8 text-left max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 leading-tight">
                  Reserve {vehicle.name}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {vehicle.category.toUpperCase()} • {vehicle.passengerCapacity} Passengers • {vehicle.transmission.toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            {/* Top Vehicle Quick Summary */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-orange-50/50 border border-orange-100/80 p-4 rounded-2xl">
              <img
                src={vehicle.featuredImage}
                alt={vehicle.name}
                className="w-24 h-20 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] font-black uppercase text-gray-800">
                    {vehicle.brand} {vehicle.model}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-800 text-[10px] font-bold">
                    ✓ Verified Fleet Vehicle
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {vehicle.description}
                </p>
              </div>
            </div>

            {/* Service Mode Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                1. Select Service Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicle.pricing.withDriver?.enabled && (
                  <button
                    type="button"
                    onClick={() => setServiceMode('with_driver')}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5",
                      serviceMode === 'with_driver'
                        ? "border-primary bg-primary/5 text-gray-900 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    )}
                  >
                    <div className={cn(
                      "p-2.5 rounded-xl shrink-0",
                      serviceMode === 'with_driver' ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                    )}>
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-black text-sm">
                        <span>With Private Driver & Fuel</span>
                        <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Includes English-speaking driver, vehicle, petrol for itinerary, and zero security deposit required.
                      </p>
                    </div>
                  </button>
                )}

                {vehicle.pricing.selfDrive?.enabled && (
                  <button
                    type="button"
                    onClick={() => setServiceMode('self_drive')}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5",
                      serviceMode === 'self_drive'
                        ? "border-primary bg-primary/5 text-gray-900 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    )}
                  >
                    <div className={cn(
                      "p-2.5 rounded-xl shrink-0",
                      serviceMode === 'self_drive' ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                    )}>
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-sm">
                        Self-Drive (Car Only)
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Rent vehicle only (24h blocks). Requires valid driver's license/IDP + refundable security deposit.
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Duration / Time Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                2. Charter Duration & Time
              </label>

              {serviceMode === 'with_driver' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setDurationType('full_day')}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all",
                      durationType === 'full_day'
                        ? "border-primary bg-primary text-white font-black shadow-sm"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold"
                    )}
                  >
                    <div className="text-xs">Full-Day (10h)</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Recommended</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDurationType('half_day')}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all",
                      durationType === 'half_day'
                        ? "border-primary bg-primary text-white font-black shadow-sm"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold"
                    )}
                  >
                    <div className="text-xs">Half-Day (5-6h)</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Short Trip</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDurationType('hourly')}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all",
                      durationType === 'hourly'
                        ? "border-primary bg-primary text-white font-black shadow-sm"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold"
                    )}
                  >
                    <div className="text-xs">Hourly Charter</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Custom Hours</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDurationType('multi_day')}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all",
                      durationType === 'multi_day'
                        ? "border-primary bg-primary text-white font-black shadow-sm"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold"
                    )}
                  >
                    <div className="text-xs">Multi-Day</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Consecutive Days</div>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-700">Rental Duration (Days):</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDurationDays(Math.max(1, durationDays - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-800 font-black flex items-center justify-center hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-black text-sm w-10 text-center">{durationDays} Day{durationDays > 1 ? 's' : ''}</span>
                    <button
                      type="button"
                      onClick={() => setDurationDays(durationDays + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-800 font-black flex items-center justify-center hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Hourly Counter if Hourly Selected */}
              {serviceMode === 'with_driver' && durationType === 'hourly' && (
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-700">Select Hours:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDurationHours(Math.max(3, durationHours - 1))}
                      className="w-7 h-7 rounded-lg bg-white border text-gray-800 font-black flex items-center justify-center hover:bg-gray-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-sm w-8 text-center">{durationHours}h</span>
                    <button
                      type="button"
                      onClick={() => setDurationHours(durationHours + 1)}
                      className="w-7 h-7 rounded-lg bg-white border text-gray-800 font-black flex items-center justify-center hover:bg-gray-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] text-gray-500">(Min. 3 hours)</span>
                </div>
              )}

              {/* Multi-Day Counter if Multi-Day Selected */}
              {serviceMode === 'with_driver' && durationType === 'multi_day' && (
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-700">Number of Days:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDurationDays(Math.max(2, durationDays - 1))}
                      className="w-7 h-7 rounded-lg bg-white border text-gray-800 font-black flex items-center justify-center hover:bg-gray-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-sm w-8 text-center">{durationDays}</span>
                    <button
                      type="button"
                      onClick={() => setDurationDays(durationDays + 1)}
                      className="w-7 h-7 rounded-lg bg-white border text-gray-800 font-black flex items-center justify-center hover:bg-gray-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Destination / Distance Zone Selection (For Chauffeur) */}
            {serviceMode === 'with_driver' && (
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                  3. Travel Area / Distance Zone
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {zones.map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setSelectedZoneId(zone.id)}
                      className={cn(
                        "p-3 rounded-2xl border-2 text-left transition-all",
                        selectedZoneId === zone.id
                          ? "border-primary bg-primary/5 text-gray-900 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{zone.name.split(':')[0]}</span>
                        {zone.surcharge > 0 ? (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            +${zone.surcharge}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-green-100 text-green-800">
                            Base Included
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {zone.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pickup Itinerary Info */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                4. Schedule & Pickup Location
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Pickup Date</label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Pickup Time</label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Pickup Hotel / Address</label>
                  <input
                    type="text"
                    placeholder="e.g. W Bali Seminyak / Airport Terminal"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Optional Add-Ons */}
            {addOns.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                  5. Optional Add-ons & Equipment
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {addOns.map((addon) => {
                    const isSelected = selectedAddOnIds.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddOn(addon.id)}
                        className={cn(
                          "p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center border transition-all",
                            isSelected ? "bg-primary border-primary text-white" : "border-gray-300 bg-white"
                          )}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900">{addon.name}</div>
                            {addon.description && (
                              <p className="text-[10px] text-gray-500 line-clamp-1">{addon.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-xs font-black text-primary shrink-0 ml-2">
                          +<FormattedPrice amount={addon.price} /> {addon.type === 'per_day' ? '/ day' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lead Guest Contact Form */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                6. Lead Driver / Guest Details
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Johnathan Smith"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">WhatsApp Phone *</label>
                  <input
                    type="tel"
                    placeholder="e.g. +61 412 345 678"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Bottom Footer Price Breakdown & Actions */}
          <div className="p-5 border-t border-gray-100 bg-gray-50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                Estimated Rate ({serviceMode === 'with_driver' ? 'Chauffeur Charter' : 'Self-Drive'})
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary">
                  <FormattedPrice amount={quote.grandTotal} />
                </span>
                {quote.zoneSurcharge > 0 && (
                  <span className="text-[11px] text-gray-500 font-medium">
                    (Includes ${quote.zoneSurcharge} zone fee)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleWhatsAppInquiry}
                className="flex-1 sm:flex-none px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Inquiry</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleOnlineBooking}
                className="flex-1 sm:flex-none px-6 py-3 bg-primary hover:bg-orange-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Reserve Vehicle</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
