import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  Users,
  Check,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Info,
  ChevronRight,
  Plus,
  Minus,
  CheckCircle2,
  Lock,
  Tag
} from 'lucide-react';
import { Tour, TourPackage } from '../../types';
import FormattedPrice from '../FormattedPrice';
import { cn } from '../../lib/utils';
import { getEffectiveCutOffHours, isSlotCutOff, validateBookingCutOff } from '../../lib/cutOffUtils';
import SmartImage from '../SmartImage';

interface PriceSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  initialDate?: string;
  initialTime?: string;
  initialAdults?: number;
  initialChildren?: number;
  initialPackage?: TourPackage | null;
  onProceed?: (date: string, time: string, adults: number, children: number, selectedPkg: TourPackage | null) => void;
}

export default function PriceSummaryModal({
  isOpen,
  onClose,
  tour,
  initialDate,
  initialTime,
  initialAdults = 2,
  initialChildren = 0,
  initialPackage,
  onProceed
}: PriceSummaryModalProps) {
  const getDefaultDateString = () => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const y = tmr.getFullYear();
    const m = String(tmr.getMonth() + 1).padStart(2, '0');
    const d = String(tmr.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [date, setDate] = useState<string>(initialDate || getDefaultDateString());
  const [selectedTime, setSelectedTime] = useState<string>(initialTime || '');
  const [adults, setAdults] = useState<number>(initialAdults || 2);
  const [children, setChildren] = useState<number>(initialChildren || 0);

  const [selectedPackage, setSelectedPackage] = useState<TourPackage | null>(() => {
    if (initialPackage) return initialPackage;
    if (tour?.packages && tour.packages.length > 0) return tour.packages[0];
    return null;
  });

  const cutOffHours = useMemo(() => getEffectiveCutOffHours(tour), [tour]);

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialDate) setDate(initialDate);
      if (initialTime) setSelectedTime(initialTime);
      if (initialAdults !== undefined && initialAdults > 0) setAdults(initialAdults);
      if (initialChildren !== undefined) setChildren(initialChildren);
      if (initialPackage) setSelectedPackage(initialPackage);
      else if (tour?.packages && tour.packages.length > 0) setSelectedPackage(tour.packages[0]);
    }
  }, [isOpen, initialDate, initialTime, initialAdults, initialChildren, initialPackage, tour]);

  // Ensure selected time is valid
  useEffect(() => {
    if (tour?.timeSlots && tour.timeSlots.length > 0 && !selectedTime) {
      const validSlot = tour.timeSlots.find(t => !date || !isSlotCutOff(date, t, cutOffHours));
      setSelectedTime(validSlot || tour.timeSlots[0]);
    }
  }, [tour, date, selectedTime, cutOffHours]);

  // Calculate pricing breakdown
  const pricingBreakdown = useMemo(() => {
    const totalPax = Math.max(1, adults + children);
    let adultRate = tour.discountPrice || tour.regularPrice || 0;
    let childRate = tour.childPrice !== undefined ? tour.childPrice : adultRate * 0.7;

    if (selectedPackage && selectedPackage.tiers && selectedPackage.tiers.length > 0) {
      const tiers = selectedPackage.tiers;
      const matchedTier = tiers.find(t => totalPax >= t.minParticipants && totalPax <= t.maxParticipants);
      const activeTier = matchedTier || (totalPax < (tiers[0]?.minParticipants || 0) ? tiers[0] : tiers[tiers.length - 1]);
      if (activeTier) {
        adultRate = activeTier.adultPrice;
        childRate = activeTier.childPrice !== undefined ? activeTier.childPrice : activeTier.adultPrice * 0.7;
      }
    }

    const adultsTotal = adultRate * adults;
    const childrenTotal = childRate * children;
    const grandTotal = adultsTotal + childrenTotal;

    return {
      adultRate,
      childRate,
      adultsTotal,
      childrenTotal,
      grandTotal,
      totalPax
    };
  }, [tour, selectedPackage, adults, children]);

  const handleConfirmAndProceed = () => {
    onClose();
    if (onProceed) {
      onProceed(date, selectedTime, adults, children, selectedPackage);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal / Bottom Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 text-slate-900 font-sans"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight leading-none">
                    Price Summary & Breakdown
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Transparent, all-inclusive pricing with zero hidden fees
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close summary modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="p-5 overflow-y-auto space-y-5 text-left flex-1">
              {/* Tour Header Card */}
              <div className="flex gap-3.5 items-center p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div className="h-16 w-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 relative">
                  <SmartImage
                    src={tour.featuredImage || (tour.images && tour.images[0]) || ''}
                    alt={tour.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block mb-1">
                    {(() => {
                      const cat = tour.category || (tour as any).categoryName || tour.categoryId;
                      if (!cat || /^[A-Za-z0-9_-]{12,}$/.test(cat) || cat.includes('-fallback')) {
                        return 'Tour Expedition';
                      }
                      return cat;
                    })()}
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-900 truncate leading-snug">
                    {tour.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                    {date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-primary" /> {date}
                      </span>
                    )}
                    {selectedTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-primary" /> {selectedTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Package Switcher if multiple packages */}
              {tour.packages && tour.packages.length > 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                    Selected Package
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {tour.packages.map((pkg, idx) => {
                      const isSelected = selectedPackage?.name === pkg.name;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPackage(pkg)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer text-xs",
                            isSelected
                              ? "border-primary bg-orange-50/50 ring-1 ring-primary/30"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                              isSelected ? "border-primary bg-primary" : "border-slate-300"
                            )}>
                              {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="font-bold text-slate-900">{pkg.name}</span>
                          </div>
                          <span className="font-black text-primary">
                            <FormattedPrice amount={pkg.tiers?.[0]?.adultPrice || tour.discountPrice || tour.regularPrice} />
                            <span className="text-[10px] text-slate-400 font-normal"> / pax</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Traveler Quick Controls */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Travelers Count
                  </span>
                  <span className="text-xs font-extrabold text-slate-700">
                    {adults + children} Total Guests
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Adults */}
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Adults</p>
                      <p className="text-[10px] text-slate-400">Age 12+</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAdults(prev => Math.max(1, prev - 1))}
                        disabled={adults <= 1}
                        className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-black text-sm text-slate-900 w-4 text-center">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults(prev => prev + 1)}
                        className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center hover:bg-orange-600 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Children</p>
                      <p className="text-[10px] text-slate-400">Age 3-11</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChildren(prev => Math.max(0, prev - 1))}
                        disabled={children <= 0}
                        className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-black text-sm text-slate-900 w-4 text-center">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren(prev => prev + 1)}
                        className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center hover:bg-orange-600 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itemized Calculation */}
              <div className="space-y-2.5 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">
                    {adults}x Adult ({adults > 1 ? 'Travelers' : 'Traveler'}) @ <FormattedPrice amount={pricingBreakdown.adultRate} />
                  </span>
                  <span className="font-black text-slate-900">
                    <FormattedPrice amount={pricingBreakdown.adultsTotal} />
                  </span>
                </div>

                {children > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-medium">
                      {children}x Child @ <FormattedPrice amount={pricingBreakdown.childRate} />
                    </span>
                    <span className="font-black text-slate-900">
                      <FormattedPrice amount={pricingBreakdown.childrenTotal} />
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-emerald-600 font-bold">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Taxes & Service Fees
                  </span>
                  <span>Included ($0.00)</span>
                </div>

                <div className="flex justify-between items-center text-emerald-600 font-bold">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Free Cancellation
                  </span>
                  <span>Up to 24h Before</span>
                </div>
              </div>

              {/* Inclusions Highlights */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1.5">
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> What's Included In This Price
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-emerald-900/80 font-medium">
                  <div className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-600 shrink-0" /> English Speaking Guide
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-600 shrink-0" /> All Entrance & Permits
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-600 shrink-0" /> Instant Mobile Confirmation
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-600 shrink-0" /> Full Passenger Insurance
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Total Payable
                </span>
                <span className="text-2xl font-black text-slate-900 font-display">
                  <FormattedPrice amount={pricingBreakdown.grandTotal} />
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirmAndProceed}
                className="flex-1 max-w-[240px] bg-primary hover:bg-orange-600 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider py-4 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Book</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
