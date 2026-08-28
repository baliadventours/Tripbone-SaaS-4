import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Briefcase, 
  Fuel, 
  Sparkles, 
  Check, 
  UserCheck, 
  Key, 
  Star, 
  ChevronRight,
  ChevronLeft,
  Zap,
  Wind,
  ShieldCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { RentalVehicle, RentalServiceMode } from '../../types';
import FormattedPrice from '../FormattedPrice';
import SmartImage from '../SmartImage';
import { cn } from '../../lib/utils';

interface RentalVehicleCardProps {
  vehicle: RentalVehicle;
  activeMode?: RentalServiceMode;
  onBook: (vehicle: RentalVehicle, mode: RentalServiceMode) => void;
  className?: string;
}

export default function RentalVehicleCard({
  vehicle,
  activeMode = 'with_driver',
  onBook,
  className,
}: RentalVehicleCardProps) {
  const [localMode, setLocalMode] = useState<RentalServiceMode>(activeMode);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  // Sync mode if parent activeMode changes
  React.useEffect(() => {
    setLocalMode(activeMode);
  }, [activeMode]);

  const allPhotos = React.useMemo(() => {
    const list = [
      ...(vehicle.featuredImage ? [vehicle.featuredImage] : []),
      ...(vehicle.images || [])
    ];
    // De-duplicate URLs
    return Array.from(new Set(list));
  }, [vehicle.featuredImage, vehicle.images]);

  const hasMultiplePhotos = allPhotos.length > 1;

  const withDriverPricing = vehicle.pricing?.withDriver;
  const selfDrivePricing = vehicle.pricing?.selfDrive;

  const isWithDriverAvailable = withDriverPricing?.enabled !== false;
  const isSelfDriveAvailable = selfDrivePricing?.enabled === true;

  // Selected mode fallback
  const effectiveMode: RentalServiceMode = 
    localMode === 'self_drive' && !isSelfDriveAvailable
      ? 'with_driver'
      : localMode === 'with_driver' && !isWithDriverAvailable
      ? 'self_drive'
      : localMode;

  const displayRate = effectiveMode === 'with_driver'
    ? (withDriverPricing?.fullDayPrice || withDriverPricing?.halfDayPrice || 48)
    : (selfDrivePricing?.dailyPrice || 25);

  const durationText = effectiveMode === 'with_driver'
    ? (withDriverPricing?.fullDayPrice ? '/ 10h Day' : '/ Half Day')
    : '/ 24h Day';

  const categoryLabelMap: Record<string, string> = {
    standard_mpv: 'Family MPV',
    executive: 'Executive',
    luxury_vip: 'Luxury VIP',
    minibus: 'Minibus / Van',
    economy: 'City Compact',
  };

  const categoryBadge = categoryLabelMap[vehicle.category] || vehicle.category.replace('_', ' ');

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIdx(prev => (prev === 0 ? allPhotos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIdx(prev => (prev === allPhotos.length - 1 ? 0 : prev + 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group bg-white rounded-3xl overflow-hidden border border-gray-200/90 hover:border-primary/40 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 flex flex-col justify-between relative",
        className
      )}
    >
      <div>
        {/* Visual Showcase Header / Multi-Photo Carousel */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-900 select-none">
          <SmartImage
            src={allPhotos[currentPhotoIdx] || vehicle.featuredImage}
            alt={`${vehicle.name} - Photo ${currentPhotoIdx + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Gradient Scrim for Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 pointer-events-none" />

          {/* Top Left Badges */}
          <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5 z-10">
            <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider border border-white/10 shadow-xs">
              {categoryBadge}
            </span>
            {vehicle.isPopular && (
              <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-primary/30">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Top Pick</span>
              </span>
            )}
          </div>

          {/* Top Right Rating Badge */}
          <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-md text-gray-950 text-xs font-black flex items-center gap-1 shadow-md border border-white/40 z-10">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{Number(vehicle.rating || 5.0).toFixed(1)}</span>
            <span className="text-[10px] text-gray-500 font-medium">({vehicle.reviewsCount || 48})</span>
          </div>

          {/* Photo Carousel Controls (shown if multiple photos) */}
          {hasMultiplePhotos && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                aria-label="Next photo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Dot Indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 px-2 py-1 rounded-full bg-black/40 backdrop-blur-xs">
                {allPhotos.map((_, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhotoIdx(pIdx);
                    }}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200",
                      currentPhotoIdx === pIdx ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                    )}
                    aria-label={`Go to photo ${pIdx + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Bottom Vehicle Identity overlay inside hero container */}
          <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-end justify-between pointer-events-none">
            <div className="text-white drop-shadow-sm">
              <span className="text-[11px] font-bold text-gray-200 tracking-wide block uppercase">
                {vehicle.brand} • {vehicle.year || new Date().getFullYear()}
              </span>
            </div>
            {vehicle.hasAC && (
              <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 border border-white/20">
                <Wind className="w-3 h-3 text-cyan-300" />
                <span>Cold AC</span>
              </span>
            )}
          </div>
        </div>

        {/* Card Body Content */}
        <div className="p-5 space-y-4 text-left">
          {/* Vehicle Title & Model */}
          <div>
            <h3 className="font-black text-lg text-gray-900 group-hover:text-primary transition-colors leading-snug">
              {vehicle.name}
            </h3>
            {vehicle.model && vehicle.model !== vehicle.name && (
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Trim: {vehicle.model}
              </p>
            )}
          </div>

          {/* 4-Item Key Specs Matrix */}
          <div className="grid grid-cols-4 gap-1.5 p-2.5 rounded-2xl bg-gray-50/90 border border-gray-150 text-center">
            <div className="flex flex-col items-center justify-center p-1">
              <Users className="w-4 h-4 text-gray-500 mb-1" />
              <span className="text-[11px] font-black text-gray-900">{vehicle.passengerCapacity}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase">Seats</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1 border-l border-gray-200">
              <Briefcase className="w-4 h-4 text-gray-500 mb-1" />
              <span className="text-[11px] font-black text-gray-900">{vehicle.luggageCapacity}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase">Bags</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1 border-l border-gray-200">
              <Zap className="w-4 h-4 text-gray-500 mb-1" />
              <span className="text-[11px] font-black text-gray-900 capitalize truncate max-w-[54px]">
                {vehicle.transmission === 'automatic' ? 'Auto' : 'Manual'}
              </span>
              <span className="text-[9px] font-bold text-gray-500 uppercase">Gear</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1 border-l border-gray-200">
              <Fuel className="w-4 h-4 text-gray-500 mb-1" />
              <span className="text-[11px] font-black text-gray-900 capitalize truncate max-w-[54px]">
                {vehicle.fuelType || 'Petrol'}
              </span>
              <span className="text-[9px] font-bold text-gray-500 uppercase">Fuel</span>
            </div>
          </div>

          {/* Service Mode Selector / Comparison (if both available) */}
          {isWithDriverAvailable && isSelfDriveAvailable && (
            <div className="flex items-center gap-1 p-1 bg-gray-100/90 rounded-xl border border-gray-200 text-xs">
              <button
                type="button"
                onClick={() => setLocalMode('with_driver')}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1",
                  effectiveMode === 'with_driver'
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <UserCheck className="w-3 h-3 text-primary" />
                <span>With Driver</span>
              </button>
              <button
                type="button"
                onClick={() => setLocalMode('self_drive')}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1",
                  effectiveMode === 'self_drive'
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <Key className="w-3 h-3 text-primary" />
                <span>Self-Drive</span>
              </button>
            </div>
          )}

          {/* Inclusions Pill Highlights */}
          <div className="space-y-1.5 min-h-[58px]">
            {effectiveMode === 'with_driver' ? (
              <>
                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0" />
                  <span className="truncate">English-speaking Chauffeur & Petrol included</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0" />
                  <span className="truncate">Hotel pickup, drop-off & custom itinerary</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0" />
                  <span className="truncate">Zero security deposit required</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0" />
                  <span className="truncate">24 Hours Self-Drive Rental (Unlimited KM)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0" />
                  <span className="truncate">Comprehensive collision damage insurance</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0" />
                  <span className="truncate">Free island hotel delivery available</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Pricing & Book Now Button */}
      <div className="p-5 pt-0">
        <div className="pt-3.5 border-t border-gray-150 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 block">
              {effectiveMode === 'with_driver' ? 'Chauffeur Charter' : 'Self-Drive Hire'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-gray-950 tracking-tight">
                <FormattedPrice amount={displayRate} />
              </span>
              <span className="text-[11px] font-bold text-gray-500">
                {durationText}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onBook(vehicle, effectiveMode)}
            className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-orange-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all shrink-0 cursor-pointer"
          >
            <span>Book Car</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
