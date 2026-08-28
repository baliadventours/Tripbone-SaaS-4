import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Car, 
  Users, 
  Briefcase, 
  Fuel, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  UserCheck, 
  Key, 
  Star, 
  ChevronRight,
  Zap,
  Clock,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { RentalVehicle, RentalCategory, RentalServiceMode } from '../../types';
import { getRentalVehicles } from '../../lib/carRentalService';
import { useSettings } from '../../lib/SettingsContext';
import { useTenant } from '../../lib/TenantContext';
import RentalBookingModal from '../CarRental/RentalBookingModal';
import RentalVehicleCard from '../CarRental/RentalVehicleCard';
import { cn } from '../../lib/utils';

export default function CarRentalShowcase() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { tenantId } = useTenant();

  const [vehicles, setVehicles] = useState<RentalVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeMode, setActiveMode] = useState<RentalServiceMode>('with_driver');

  // Selected vehicle for booking modal
  const [bookingVehicle, setBookingVehicle] = useState<RentalVehicle | null>(null);

  const isModuleEnabled = settings?.carRentalModule?.enabled ?? true;
  const isHomepageShowcaseEnabled = (settings?.carRentalModule?.showOnHomepage ?? true) && isModuleEnabled;

  const sectionTitle = settings?.carRentalModule?.moduleTitle || "Private Car Rentals & Chauffeur Charters";
  const sectionSubtitle = settings?.carRentalModule?.moduleSubtitle || "Explore Bali at your own pace with clean modern fleet vehicles and licensed private drivers.";

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

  const categories = useMemo(() => {
    const list: { id: string; label: string }[] = [
      { id: 'all', label: 'All Fleet' },
      { id: 'standard_mpv', label: 'Family MPV' },
      { id: 'executive', label: 'Executive' },
      { id: 'luxury_vip', label: 'Luxury VIP' },
      { id: 'minibus', label: 'Minibus / Van' },
      { id: 'economy', label: 'City Compact' },
    ];
    return list;
  }, []);

  const filteredVehicles = useMemo(() => {
    let list = vehicles;
    if (selectedCategory !== 'all') {
      list = list.filter(v => v.category === selectedCategory);
    }
    return list;
  }, [vehicles, selectedCategory]);

  if (!isHomepageShowcaseEnabled) return null;

  return (
    <section id="car-rental-showcase" className="py-16 md:py-24 bg-gradient-to-b from-gray-50/70 via-white to-gray-50/40 relative overflow-hidden border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider mb-3">
              <Car className="w-3.5 h-3.5" />
              <span>Chauffeur & Fleet Rental</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              {sectionTitle}
            </h2>
            <p className="text-sm md:text-base text-gray-600 mt-2 font-medium">
              {sectionSubtitle}
            </p>
          </div>

          {/* Service Mode Toggle Switcher */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveMode('with_driver')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer",
                activeMode === 'with_driver'
                  ? "bg-white text-gray-950 shadow-sm ring-1 ring-black/5"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <UserCheck className="w-4 h-4 text-primary" />
              <span>With Driver & Gas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('self_drive')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer",
                activeMode === 'self_drive'
                  ? "bg-white text-gray-950 shadow-sm ring-1 ring-black/5"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Key className="w-4 h-4 text-primary" />
              <span>Self-Drive (Car Only)</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8 text-left">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 border cursor-pointer",
                selectedCategory === cat.id
                  ? "bg-gray-900 text-white border-gray-900 shadow-md shadow-gray-900/10"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Fleet Display Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 rounded-3xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-150 shadow-xs">
            <Car className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No vehicles found in this category</h3>
            <p className="text-xs text-gray-500 mt-1">Please choose another category or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <RentalVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                activeMode={activeMode}
                onBook={(v, mode) => {
                  setActiveMode(mode);
                  setBookingVehicle(v);
                }}
              />
            ))}
          </div>
        )}

        {/* Value Prop Highlights Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white rounded-3xl border border-gray-150 shadow-xs text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-900">Full Insurance</h4>
              <p className="text-[11px] text-gray-500 font-medium">Collision & liability protected</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-primary flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-900">Licensed Drivers</h4>
              <p className="text-[11px] text-gray-500 font-medium">Friendly & English-fluent</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-900">Free Cancellation</h4>
              <p className="text-[11px] text-gray-500 font-medium">Up to 24 hours prior</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-900">Clean Sanitized</h4>
              <p className="text-[11px] text-gray-500 font-medium">Fresh cabin & AC checked</p>
            </div>
          </div>
        </div>

        {/* View All Fleet Footer CTA */}
        <div className="mt-8 text-center">
          <Link
            to="/rentals"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gray-950 hover:bg-gray-800 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-gray-950/10 hover:shadow-gray-950/20 active:scale-95"
          >
            <span>View All Fleet & Custom Charters</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingVehicle && (
        <RentalBookingModal
          isOpen={!!bookingVehicle}
          onClose={() => setBookingVehicle(null)}
          vehicle={bookingVehicle}
          initialMode={activeMode}
        />
      )}
    </section>
  );
}

