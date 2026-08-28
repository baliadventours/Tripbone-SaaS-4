import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  Users, 
  Briefcase, 
  Fuel, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  UserCheck, 
  Key, 
  Star, 
  Search, 
  SlidersHorizontal, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Clock, 
  Info,
  ChevronRight,
  ArrowUpDown,
  Zap
} from 'lucide-react';
import { RentalVehicle, RentalCategory, RentalServiceMode } from '../types';
import { getRentalVehicles, DEFAULT_RENTAL_ZONES } from '../lib/carRentalService';
import { useSettings } from '../lib/SettingsContext';
import { useTenant } from '../lib/TenantContext';
import FormattedPrice from '../components/FormattedPrice';
import SmartImage from '../components/SmartImage';
import RentalBookingModal from '../components/CarRental/RentalBookingModal';
import RentalVehicleCard from '../components/CarRental/RentalVehicleCard';
import { cn } from '../lib/utils';

export default function CarRentals() {
  const [searchParams] = useSearchParams();
  const { settings } = useSettings();
  const { tenantId, tenant } = useTenant();

  const urlMode = searchParams.get('mode') as RentalServiceMode | null;
  const urlDuration = searchParams.get('duration') as any;
  const urlDate = searchParams.get('date') || '';
  const urlTime = searchParams.get('time') || '09:00';
  const urlZone = searchParams.get('zone') || 'zone-standard';

  const [vehicles, setVehicles] = useState<RentalVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<RentalServiceMode>(urlMode || 'with_driver');
  const [selectedTransmission, setSelectedTransmission] = useState<string>('all');
  const [minPassengers, setMinPassengers] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_low' | 'price_high' | 'capacity'>('recommended');

  // Booking Modal State
  const [bookingVehicle, setBookingVehicle] = useState<RentalVehicle | null>(null);

  useEffect(() => {
    async function loadFleet() {
      try {
        setLoading(true);
        const data = await getRentalVehicles(tenantId);
        setVehicles(data.filter(v => v.status !== 'hidden'));
      } catch (err) {
        console.error('Error loading rental fleet:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFleet();
  }, [tenantId]);

  const categories = [
    { id: 'all', label: 'All Fleet' },
    { id: 'standard_mpv', label: 'Standard MPV' },
    { id: 'executive', label: 'Executive & Hybrid' },
    { id: 'luxury_vip', label: 'Luxury VIP' },
    { id: 'minibus', label: 'Minibus & Van' },
    { id: 'economy', label: 'City Compact' },
  ];

  const filteredFleet = useMemo(() => {
    return vehicles
      .filter(v => {
        if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
        if (selectedTransmission !== 'all' && v.transmission !== selectedTransmission) return false;
        if (minPassengers > 0 && v.passengerCapacity < minPassengers) return false;
        
        // Mode filter: Check if vehicle supports chosen mode
        if (selectedMode === 'with_driver' && !v.pricing.withDriver?.enabled) return false;
        if (selectedMode === 'self_drive' && !v.pricing.selfDrive?.enabled) return false;

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchName = v.name.toLowerCase().includes(term);
          const matchBrand = v.brand.toLowerCase().includes(term);
          const matchModel = v.model.toLowerCase().includes(term);
          const matchDesc = v.description.toLowerCase().includes(term);
          if (!matchName && !matchBrand && !matchModel && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') {
          const priceA = selectedMode === 'with_driver' ? (a.pricing.withDriver?.fullDayPrice || 999) : (a.pricing.selfDrive?.dailyPrice || 999);
          const priceB = selectedMode === 'with_driver' ? (b.pricing.withDriver?.fullDayPrice || 999) : (b.pricing.selfDrive?.dailyPrice || 999);
          return priceA - priceB;
        }
        if (sortBy === 'price_high') {
          const priceA = selectedMode === 'with_driver' ? (a.pricing.withDriver?.fullDayPrice || 0) : (a.pricing.selfDrive?.dailyPrice || 0);
          const priceB = selectedMode === 'with_driver' ? (b.pricing.withDriver?.fullDayPrice || 0) : (b.pricing.selfDrive?.dailyPrice || 0);
          return priceB - priceA;
        }
        if (sortBy === 'capacity') {
          return b.passengerCapacity - a.passengerCapacity;
        }
        return (a.sortOrder || 99) - (b.sortOrder || 99);
      });
  }, [vehicles, selectedCategory, selectedMode, selectedTransmission, minPassengers, searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 text-left">
      {/* Top Banner / Hero Header */}
      <div className="bg-gray-950 text-white pt-12 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-wider border border-orange-500/30">
                <Car className="w-3.5 h-3.5" />
                <span>Verified Private Fleet</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Car Rental & Chauffeur Charters
              </h1>
              <p className="text-sm md:text-base text-gray-300 font-normal leading-relaxed">
                Discover the island in pure comfort. Choose between flexible self-drive rentals or private charters with courteous English-speaking drivers and fuel included.
              </p>
            </div>

            {/* Quick Benefits Badges */}
            <div className="grid grid-cols-2 gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Insurance Included</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-200">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Licensed Drivers</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-200">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Free 24h Cancellation</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-200">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>No Hidden Fees</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        {/* Filter Controls Bar */}
        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-xl shadow-gray-200/50 border border-gray-150 space-y-5">
          {/* Top Row: Service Mode & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Service Mode Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
              <button
                type="button"
                onClick={() => setSelectedMode('with_driver')}
                className={cn(
                  "flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all",
                  selectedMode === 'with_driver'
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-700 hover:text-gray-950"
                )}
              >
                <UserCheck className="w-4 h-4" />
                <span>With Driver & Gas</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode('self_drive')}
                className={cn(
                  "flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all",
                  selectedMode === 'self_drive'
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-700 hover:text-gray-950"
                )}
              >
                <Key className="w-4 h-4" />
                <span>Self-Drive (Car Only)</span>
              </button>
            </div>

            {/* Keyword Search */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search model, brand (e.g. Innova)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Bottom Row: Category Pills & Secondary Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-gray-100">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                    selectedCategory === cat.id
                      ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-3 self-end lg:self-auto">
              <select
                value={selectedTransmission}
                onChange={(e) => setSelectedTransmission(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Transmissions</option>
                <option value="automatic">Automatic Only</option>
                <option value="manual">Manual Only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="recommended">Featured Order</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="capacity">Passenger Capacity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Fleet Grid */}
        <div className="mt-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-96 rounded-3xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : filteredFleet.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-gray-150 shadow-sm">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-black text-gray-900">No matching vehicles found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Try switching between "With Driver" and "Self-Drive" or reset your category filters to view all available cars.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                  setSelectedTransmission('all');
                }}
                className="mt-6 px-6 py-2.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-wider"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFleet.map((vehicle) => (
                <RentalVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  activeMode={selectedMode}
                  onBook={(v, mode) => {
                    setSelectedMode(mode);
                    setBookingVehicle(v);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Transparent Distance Zones Guide */}
        <div className="mt-20 bg-white rounded-3xl p-8 md:p-10 border border-gray-150 shadow-sm">
          <div className="max-w-2xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>Transparent Pricing Zones</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Operational Travel Zones & Fuel Coverage
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              For private chauffeur charters, our base rate covers all central tourist hubs. Extended highland and remote coastal routes carry a modest flat surcharge for fuel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEFAULT_RENTAL_ZONES.map((zone, idx) => (
              <div
                key={zone.id}
                className={cn(
                  "p-6 rounded-2xl border-2 flex flex-col justify-between space-y-4",
                  zone.surcharge === 0 ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200 bg-gray-50/50"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                      Tier 0{idx + 1}
                    </span>
                    {zone.surcharge === 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        Included in Base Rate
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                        +${zone.surcharge} Fuel Surcharge
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-base text-gray-900">
                    {zone.name.split(':')[0]}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {zone.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200/60">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Sample Covered Hubs:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {zone.coveredAreas?.map((area, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] font-medium text-gray-700">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingVehicle && (
        <RentalBookingModal
          isOpen={!!bookingVehicle}
          onClose={() => setBookingVehicle(null)}
          vehicle={bookingVehicle}
          initialMode={selectedMode}
          initialDuration={urlDuration || 'full_day'}
          initialDate={urlDate}
          initialTime={urlTime}
          initialZoneId={urlZone}
        />
      )}
    </div>
  );
}
