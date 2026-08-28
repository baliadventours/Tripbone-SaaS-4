import { db, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, getActiveTenantId } from './firebase';
import { RentalVehicle, RentalZone, RentalAddOn, RentalBookingDetails, RentalServiceMode, Booking, SiteSettings } from '../types';

export const DEFAULT_RENTAL_ZONES: RentalZone[] = [
  {
    id: 'zone-standard',
    name: 'Zone 1: Standard Tourist Hub (South & Central)',
    description: 'Covers Kuta, Seminyak, Canggu, Sanur, Nusa Dua, Jimbaran, Ubud Central, Denpasar.',
    surcharge: 0,
    coveredAreas: ['Kuta', 'Seminyak', 'Canggu', 'Sanur', 'Nusa Dua', 'Jimbaran', 'Ubud', 'Denpasar'],
    isDefault: true,
  },
  {
    id: 'zone-highlands',
    name: 'Zone 2: Highlands & East Coast (Medium Distance)',
    description: 'Covers Bedugul, Kintamani, Ulun Danu, Padangbai, Candidasa, Lempuyang Temple, Uluwatu tip.',
    surcharge: 15,
    coveredAreas: ['Bedugul', 'Kintamani', 'Candidasa', 'Padangbai', 'Lempuyang', 'Jatiluwih', 'Uluwatu Clifftops'],
  },
  {
    id: 'zone-far-north',
    name: 'Zone 3: Remote North & West Coast (Extended Distance)',
    description: 'Covers Lovina, Singaraja, Amed, Tulamben, Gilimanuk, Pemuteran, Menjangan.',
    surcharge: 30,
    coveredAreas: ['Lovina', 'Singaraja', 'Amed', 'Tulamben', 'Gilimanuk', 'Pemuteran', 'Menjangan National Park'],
  },
];

export const DEFAULT_RENTAL_ADDONS: RentalAddOn[] = [
  {
    id: 'addon-child-seat',
    name: 'Child / Baby Safety Seat',
    price: 6,
    type: 'per_day',
    description: 'ISOFIX European standard baby/toddler safety seat (0-4 yrs).',
    icon: 'Baby',
  },
  {
    id: 'addon-airport-meet',
    name: 'Airport Arrival VIP Meet & Greet',
    price: 10,
    type: 'per_booking',
    description: 'Driver waits at terminal exit gate holding personalized name board + luggage assistance.',
    icon: 'Plane',
  },
  {
    id: 'addon-sim-card',
    name: 'Tourist 4G/5G SIM Card (35GB)',
    price: 15,
    type: 'per_booking',
    description: 'Pre-activated local high-speed tourist SIM card ready upon arrival.',
    icon: 'Wifi',
  },
  {
    id: 'addon-extra-hour',
    name: 'Pre-Booked Extra Driver Overtime (2 Hours)',
    price: 12,
    type: 'per_booking',
    description: 'Discounted rate for extended sunset or night dinner charter.',
    icon: 'Clock',
  },
];

export const DEFAULT_RENTAL_FLEET: RentalVehicle[] = [
  {
    id: 'veh-toyota-avanza',
    name: 'Toyota Avanza Standard MPV',
    model: 'Avanza 1.5 Dual VVT-i',
    brand: 'Toyota',
    category: 'standard_mpv',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80',
    ],
    featuredImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
    passengerCapacity: 6,
    luggageCapacity: 4,
    doors: 5,
    transmission: 'automatic',
    fuelType: 'petrol',
    hasAC: true,
    licensePlate: 'DK 1842 AB',
    year: 2023,
    status: 'available',
    description: 'The undisputed favorite for family day tours, couples, and small groups exploring Bali. Spacious, ice-cold air conditioning, and outstanding fuel efficiency.',
    features: ['Double Blower AC', 'Bluetooth / Audio USB', 'Clean Sanitized Cabin', 'Comprehensive Insurance', 'Child-Seat Friendly'],
    inclusions: ['Clean Vehicle', '24/7 Roadside Support', 'Chauffeur with Fuel (when selected)'],
    exclusions: ['Parking / Toll Fees (self-drive)', 'Driver Overtime past 10h (with driver)'],
    pricing: {
      withDriver: {
        enabled: true,
        halfDayPrice: 35, // 5-6 hours
        fullDayPrice: 48, // 10-12 hours
        hourlyPrice: 10,
        overtimePricePerHour: 5,
      },
      selfDrive: {
        enabled: true,
        dailyPrice: 24, // 24 hours
        depositRequired: 50,
        minimumDays: 1,
      },
    },
    isPopular: true,
    rating: 4.9,
    reviewsCount: 142,
    sortOrder: 1,
  },
  {
    id: 'veh-toyota-innova-zenix',
    name: 'Toyota Innova Zenix Executive',
    model: 'Innova Zenix 2.0 Hybrid/Gasoline',
    brand: 'Toyota',
    category: 'executive',
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
    ],
    featuredImage: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=80',
    passengerCapacity: 7,
    luggageCapacity: 5,
    doors: 5,
    transmission: 'automatic',
    fuelType: 'hybrid',
    hasAC: true,
    licensePlate: 'DK 1999 ZX',
    year: 2024,
    status: 'available',
    description: 'Superior executive comfort with captain seats, whisper-quiet hybrid drive, and ultra-smooth suspension for long trips across Ubud, Kintamani, and Bedugul.',
    features: ['Captain Seat Layout', 'Panoramic Sunroof', 'High-Speed USB-C Chargers', 'Whisper Quiet Hybrid', 'Premium Sound System'],
    inclusions: ['Luxury sanitized vehicle', 'Experienced English Driver (when selected)', 'Full Fuel Tank included'],
    exclusions: ['Personal expenses', 'Toll charges'],
    pricing: {
      withDriver: {
        enabled: true,
        halfDayPrice: 55,
        fullDayPrice: 75,
        hourlyPrice: 15,
        overtimePricePerHour: 8,
      },
      selfDrive: {
        enabled: true,
        dailyPrice: 45,
        depositRequired: 100,
        minimumDays: 2,
      },
    },
    isPopular: true,
    rating: 4.98,
    reviewsCount: 88,
    sortOrder: 2,
  },
  {
    id: 'veh-toyota-alphard-vip',
    name: 'Toyota Alphard VIP Executive Van',
    model: 'Alphard SC / Executive Lounge',
    brand: 'Toyota',
    category: 'luxury_vip',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=80',
    ],
    featuredImage: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
    passengerCapacity: 5,
    luggageCapacity: 4,
    doors: 5,
    transmission: 'automatic',
    fuelType: 'petrol',
    hasAC: true,
    licensePlate: 'DK 1 VIP',
    year: 2023,
    status: 'available',
    description: 'The pinnacle of luxury ground transport in Bali. Reclining ottoman pilot seats, ambient lighting, dual power sliding doors, and discrete uniformed chauffeur.',
    features: ['Ottoman Reclining Pilot Seats', 'Ambient Cabin Mood Lighting', 'Privacy Electric Curtains', 'Dual Climate Zones', 'Chilled Bottled Water & Cold Towels'],
    inclusions: ['Uniformed Executive Chauffeur', 'Fuel for Designated Zone', 'Mineral Water & Refreshments', 'Airport VIP Meet & Greet'],
    exclusions: ['Gratuities'],
    pricing: {
      withDriver: {
        enabled: true,
        halfDayPrice: 120,
        fullDayPrice: 180,
        hourlyPrice: 30,
        overtimePricePerHour: 20,
      },
      selfDrive: {
        enabled: false,
        dailyPrice: 0,
        depositRequired: 0,
        minimumDays: 1,
      },
    },
    isPopular: false,
    rating: 5.0,
    reviewsCount: 39,
    sortOrder: 3,
  },
  {
    id: 'veh-toyota-hiace-premio',
    name: 'Toyota HiAce Premio Minibus (14-Seats)',
    model: 'HiAce Premio 2.8 Turbo Diesel',
    brand: 'Toyota',
    category: 'minibus',
    images: [
      'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80',
    ],
    featuredImage: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1000&q=80',
    passengerCapacity: 14,
    luggageCapacity: 8,
    doors: 4,
    transmission: 'manual',
    fuelType: 'diesel',
    hasAC: true,
    licensePlate: 'DK 7788 HI',
    year: 2023,
    status: 'available',
    description: 'High-roof modern tour bus with individual reclining seats, ceiling AC vents, and cavernous luggage capacity. Perfect for group excursions, wedding parties, and retreats.',
    features: ['14 Individual Reclining Seats', 'Individual AC Vents', 'High Roof Walk-In Cabin', 'Heavy Duty Suspension', 'PA Microphone for Guides'],
    inclusions: ['Licensed Commercial Chauffeur', 'Fuel for Itinerary', 'Clean sanitized coach'],
    exclusions: ['Parking / entrance retributions'],
    pricing: {
      withDriver: {
        enabled: true,
        halfDayPrice: 70,
        fullDayPrice: 95,
        hourlyPrice: 18,
        overtimePricePerHour: 10,
      },
      selfDrive: {
        enabled: false,
        dailyPrice: 0,
        depositRequired: 0,
        minimumDays: 1,
      },
    },
    isPopular: true,
    rating: 4.95,
    reviewsCount: 110,
    sortOrder: 4,
  },
  {
    id: 'veh-honda-brio-compact',
    name: 'Honda Brio Compact City Car',
    model: 'Brio RS 1.2 i-VTEC',
    brand: 'Honda',
    category: 'economy',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
    ],
    featuredImage: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
    passengerCapacity: 4,
    luggageCapacity: 2,
    doors: 5,
    transmission: 'automatic',
    fuelType: 'petrol',
    hasAC: true,
    licensePlate: 'DK 1422 BR',
    year: 2023,
    status: 'available',
    description: 'Ultra-compact, agile, and effortless to park through tight Canggu shortcuts and Seminyak lanes. Top pick for solo explorers and budget couples.',
    features: ['Super Compact Dimensions', 'Touchscreen Apple CarPlay', 'Cold AC', 'Low Fuel Consumption', 'Keyless Push Start'],
    inclusions: ['Vehicle rental', 'Unlimited Mileage in Bali', 'Free delivery in South Bali (2+ days)'],
    exclusions: ['Fuel (Full-to-Full policy)', 'Security deposit'],
    pricing: {
      withDriver: {
        enabled: true,
        halfDayPrice: 30,
        fullDayPrice: 42,
        hourlyPrice: 9,
        overtimePricePerHour: 5,
      },
      selfDrive: {
        enabled: true,
        dailyPrice: 19, // 24-hour rate
        depositRequired: 50,
        minimumDays: 1,
      },
    },
    isPopular: false,
    rating: 4.88,
    reviewsCount: 64,
    sortOrder: 5,
  },
];

/**
 * Sanitize data for Firestore to avoid "Unsupported field value: undefined" errors
 */
export function sanitizeFirestoreData(data: any): any {
  if (data === undefined) return null;
  if (data === null) return null;
  if (typeof data !== 'object') return data;
  if (data instanceof Date) return data;
  // Preserve Firestore FieldValues (serverTimestamp, deleteField, arrayUnion, etc.)
  if (
    data?._methodName || 
    data?.constructor?.name === 'FieldValue' || 
    data?.constructor?.name === 'ServerTimestampTransform' ||
    typeof data?.isEqual === 'function'
  ) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestoreData(item));
  }
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeFirestoreData(value);
    }
  }
  return cleaned;
}

/**
 * Fetch all vehicles for the current active tenant with fallback to pre-seeded fleet
 */
export async function getRentalVehicles(tenantId?: string): Promise<RentalVehicle[]> {
  try {
    const effectiveTenantId = tenantId || getActiveTenantId();
    let q;
    if (effectiveTenantId) {
      q = query(collection(db, 'rental_vehicles'), where('tenantId', '==', effectiveTenantId));
    } else {
      q = query(collection(db, 'rental_vehicles'));
    }
    
    const snap = await getDocs(q);
    if (!snap.empty) {
      const vehicles = snap.docs.map(d => ({ id: d.id, ...d.data() }) as RentalVehicle);
      return vehicles.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
    }

    // Return default fleet
    return DEFAULT_RENTAL_FLEET;
  } catch (error) {
    console.warn('[getRentalVehicles] Fallback to default fleet:', error);
    return DEFAULT_RENTAL_FLEET;
  }
}

/**
 * Fetch vehicle by ID
 */
export async function getRentalVehicleById(id: string): Promise<RentalVehicle | null> {
  try {
    const docRef = doc(db, 'rental_vehicles', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as RentalVehicle;
    }
    const defaultMatch = DEFAULT_RENTAL_FLEET.find(v => v.id === id);
    return defaultMatch || null;
  } catch (error) {
    console.warn('[getRentalVehicleById] error:', error);
    const defaultMatch = DEFAULT_RENTAL_FLEET.find(v => v.id === id);
    return defaultMatch || null;
  }
}

/**
 * Save or update vehicle
 */
export async function saveRentalVehicle(vehicle: Partial<RentalVehicle>, tenantId?: string): Promise<string> {
  const effectiveTenantId = tenantId || getActiveTenantId() || 'general';
  const id = vehicle.id || `veh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, 'rental_vehicles', id);

  const payload: RentalVehicle = {
    id,
    name: vehicle.name || 'Rental Vehicle',
    model: vehicle.model || '',
    brand: vehicle.brand || '',
    category: vehicle.category || 'standard_mpv',
    images: vehicle.images || [],
    featuredImage: vehicle.featuredImage || vehicle.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
    passengerCapacity: Number(vehicle.passengerCapacity) || 5,
    luggageCapacity: Number(vehicle.luggageCapacity) || 3,
    doors: Number(vehicle.doors) || 5,
    transmission: vehicle.transmission || 'automatic',
    fuelType: vehicle.fuelType || 'petrol',
    hasAC: vehicle.hasAC !== false,
    licensePlate: vehicle.licensePlate || '',
    year: Number(vehicle.year) || new Date().getFullYear(),
    status: vehicle.status || 'available',
    description: vehicle.description || '',
    features: vehicle.features || [],
    inclusions: vehicle.inclusions || [],
    exclusions: vehicle.exclusions || [],
    pricing: vehicle.pricing || {
      withDriver: { enabled: true, halfDayPrice: 35, fullDayPrice: 48, hourlyPrice: 10, overtimePricePerHour: 5 },
      selfDrive: { enabled: true, dailyPrice: 25, depositRequired: 50, minimumDays: 1 },
    },
    customZones: vehicle.customZones || [],
    addOns: vehicle.addOns || [],
    rating: Number(vehicle.rating) || 5.0,
    reviewsCount: Number(vehicle.reviewsCount) || 0,
    isPopular: Boolean(vehicle.isPopular),
    sortOrder: Number(vehicle.sortOrder) || 1,
    tenantId: effectiveTenantId,
    updatedAt: serverTimestamp(),
    createdAt: vehicle.createdAt || serverTimestamp(),
  };

  await setDoc(docRef, sanitizeFirestoreData(payload), { merge: true });
  return id;
}

/**
 * Delete a vehicle
 */
export async function deleteRentalVehicle(vehicleId: string): Promise<void> {
  const docRef = doc(db, 'rental_vehicles', vehicleId);
  await deleteDoc(docRef);
}

/**
 * Calculate dynamic quote based on vehicle, duration, mode, zone, and add-ons
 */
export function calculateRentalQuote({
  vehicle,
  serviceMode,
  durationType,
  durationHours = 10,
  durationDays = 1,
  zoneId,
  selectedZone,
  selectedAddOns = [],
  currency = 'USD',
}: {
  vehicle: RentalVehicle;
  serviceMode: RentalServiceMode;
  durationType: 'hourly' | 'half_day' | 'full_day' | 'multi_day';
  durationHours?: number;
  durationDays?: number;
  zoneId?: string;
  selectedZone?: RentalZone | null;
  selectedAddOns?: { id: string; name: string; price: number; quantity?: number; type?: 'per_day' | 'per_booking' }[];
  currency?: string;
}) {
  let baseRate = 0;
  let depositAmount = 0;
  let overtimeRatePerHour = 0;

  if (serviceMode === 'with_driver') {
    const withDriverPricing = vehicle.pricing?.withDriver;
    overtimeRatePerHour = withDriverPricing?.overtimePricePerHour || 5;

    if (durationType === 'hourly') {
      const perHour = withDriverPricing?.hourlyPrice || 10;
      baseRate = perHour * Math.max(1, durationHours);
    } else if (durationType === 'half_day') {
      baseRate = withDriverPricing?.halfDayPrice || 35;
    } else if (durationType === 'full_day') {
      baseRate = withDriverPricing?.fullDayPrice || 48;
    } else if (durationType === 'multi_day') {
      const fullDay = withDriverPricing?.fullDayPrice || 48;
      baseRate = fullDay * Math.max(1, durationDays);
    }
  } else {
    // Self-Drive
    const selfDrivePricing = vehicle.pricing?.selfDrive;
    depositAmount = selfDrivePricing?.depositRequired || 50;
    const dailyPrice = selfDrivePricing?.dailyPrice || 25;
    const days = Math.max(selfDrivePricing?.minimumDays || 1, durationDays);
    baseRate = dailyPrice * days;
  }

  // Zone surcharge (applies primarily to chauffeur charters for distance coverage)
  let zoneSurcharge = 0;
  if (serviceMode === 'with_driver' && selectedZone) {
    zoneSurcharge = Number(selectedZone.surcharge || 0);
  }

  // Add-ons calculation
  const totalAddOns = selectedAddOns.reduce((sum, addon) => {
    const qty = addon.quantity || 1;
    const days = serviceMode === 'self_drive' ? Math.max(1, durationDays) : 1;
    const multiplier = addon.type === 'per_day' ? days : 1;
    return sum + (addon.price * qty * multiplier);
  }, 0);

  const subtotal = baseRate + zoneSurcharge + totalAddOns;
  const grandTotal = subtotal;

  return {
    baseRate,
    zoneSurcharge,
    totalAddOns,
    subtotal,
    grandTotal,
    depositAmount,
    overtimeRatePerHour,
    currency,
  };
}

/**
 * Open WhatsApp with pre-filled rental booking inquiry/reservation
 */
export function openRentalWhatsApp({
  vehicle,
  serviceMode,
  durationType,
  durationDays = 1,
  durationHours = 10,
  pickupDate,
  pickupTime,
  pickupLocation,
  zoneName,
  estimatedTotal,
  currency = 'USD',
  guestName = '',
  supportWhatsapp,
}: {
  vehicle: RentalVehicle;
  serviceMode: RentalServiceMode;
  durationType: string;
  durationDays?: number;
  durationHours?: number;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  zoneName?: string;
  estimatedTotal: number;
  currency?: string;
  guestName?: string;
  supportWhatsapp?: string;
}) {
  const number = (supportWhatsapp || '+6281234567890').replace(/[^0-9]/g, '');
  const modeText = serviceMode === 'with_driver' ? '🚗 With Private Driver & Fuel' : '🔑 Self-Drive (Car Only)';
  const durationText = serviceMode === 'self_drive' 
    ? `${durationDays} Day(s) (24h blocks)` 
    : durationType === 'half_day' ? 'Half-Day Charter (4-6 Hours)' : durationType === 'full_day' ? 'Full-Day Charter (10-12 Hours)' : `${durationHours} Hours Hourly Charter`;

  const msg = `Hello! I would like to reserve a vehicle charter on your website:

🚘 *Vehicle:* ${vehicle.name} (${vehicle.category.toUpperCase()})
📋 *Service Option:* ${modeText}
⏳ *Duration:* ${durationText}
📅 *Pickup Date & Time:* ${pickupDate || 'To be confirmed'} at ${pickupTime || '09:00 AM'}
📍 *Pickup Location / Hotel:* ${pickupLocation || 'Airport / Hotel'}
🗺️ *Destination Zone:* ${zoneName || 'Standard Island Hub'}
💰 *Estimated Rate:* ${currency} ${estimatedTotal}
👤 *Lead Guest:* ${guestName || 'Valued Guest'}

Please check vehicle availability and confirm my reservation. Thank you!`;

  window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank');
}
