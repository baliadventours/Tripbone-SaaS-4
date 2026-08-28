import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Car, Compass, Calendar, Clock, MapPin, Sparkles, ArrowRight, ShieldCheck, UserCheck, Fuel, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useSettings } from '../../lib/SettingsContext';
import { RentalServiceMode } from '../../types';
import { DEFAULT_RENTAL_ZONES } from '../../lib/carRentalService';

export default function DualHeroSearch({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  
  const isRentalModuleActive = settings?.carRentalModule?.enabled ?? true;
  const isHeroTabEnabled = (settings?.carRentalModule?.heroSearchTab ?? true) && isRentalModuleActive;

  const [activeTab, setActiveTab] = useState<'tours' | 'rentals'>('tours');
  
  // Tour search state
  const [tourKeyword, setTourKeyword] = useState('');
  const [isTourFocused, setIsTourFocused] = useState(false);

  // Rental search state
  const [serviceMode, setServiceMode] = useState<RentalServiceMode>('with_driver');
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [pickupTime, setPickupTime] = useState('09:00');
  const [durationType, setDurationType] = useState<'full_day' | 'half_day' | 'hourly' | 'multi_day'>('full_day');
  const [selectedZone, setSelectedZone] = useState('zone-standard');

  const handleTourSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tourKeyword.trim()) {
      params.append('search', tourKeyword.trim());
    }
    navigate(`/tours?${params.toString()}`);
  };

  const handleRentalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.append('mode', serviceMode);
    params.append('duration', durationType);
    params.append('date', pickupDate);
    params.append('time', pickupTime);
    params.append('zone', selectedZone);
    navigate(`/rentals?${params.toString()}`);
  };

  // If Car Rental is disabled, render standard single tour search
  if (!isHeroTabEnabled) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn("w-full relative z-40", className)}
      >
        <form onSubmit={handleTourSubmit} className="w-full">
          <div className={cn(
            "bg-white rounded-full p-2 pl-6 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.12)] border transition-all duration-300 flex items-center gap-3",
            isTourFocused ? "border-primary/40 ring-4 ring-primary/5" : "border-gray-150"
          )}>
            <Search className="h-5 w-5 text-gray-400 shrink-0" />
            <input 
              type="text"
              placeholder="What do you want to experience in Bali?"
              value={tourKeyword}
              onFocus={() => setIsTourFocused(true)}
              onBlur={() => setIsTourFocused(false)}
              onChange={(e) => setTourKeyword(e.target.value)}
              className="flex-1 bg-transparent border-none py-3 text-sm md:text-base font-semibold text-gray-950 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            />
            <button 
              type="submit"
              className="bg-primary hover:bg-orange-700 text-white font-black py-3 px-6 md:px-8 rounded-full shadow-md shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all duration-200 text-xs md:text-sm uppercase tracking-widest flex items-center gap-2"
            >
              <span>Search</span>
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn("w-full relative z-40 max-w-4xl mx-auto", className)}
    >
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setActiveTab('tours')}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-sm",
            activeTab === 'tours'
              ? "bg-primary text-white shadow-primary/20 scale-105"
              : "bg-white/90 hover:bg-white text-gray-700 hover:text-gray-950 backdrop-blur-md border border-gray-200/60"
          )}
        >
          <Compass className="w-4 h-4" />
          <span>Tours & Activities</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rentals')}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-sm relative",
            activeTab === 'rentals'
              ? "bg-gray-900 text-white shadow-gray-900/30 scale-105"
              : "bg-white/90 hover:bg-white text-gray-700 hover:text-gray-950 backdrop-blur-md border border-gray-200/60"
          )}
        >
          <Car className="w-4 h-4 text-orange-400" />
          <span>Car Rental & Chauffeur</span>
          <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'tours' ? (
          <motion.div
            key="tours-search"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <form onSubmit={handleTourSubmit} className="w-full">
              <div className={cn(
                "bg-white rounded-3xl md:rounded-full p-2 pl-6 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.14)] border transition-all duration-300 flex flex-col md:flex-row items-center gap-3",
                isTourFocused ? "border-primary/40 ring-4 ring-primary/5" : "border-gray-150"
              )}>
                <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                  <Search className="h-5 w-5 text-gray-400 shrink-0" />
                  <input 
                    type="text"
                    placeholder="Search destinations, volcano sunrise treks, waterfalls, rafting..."
                    value={tourKeyword}
                    onFocus={() => setIsTourFocused(true)}
                    onBlur={() => setIsTourFocused(false)}
                    onChange={(e) => setTourKeyword(e.target.value)}
                    className="w-full bg-transparent border-none py-3 text-sm md:text-base font-semibold text-gray-950 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full md:w-auto bg-primary hover:bg-orange-700 text-white font-black py-3.5 px-8 rounded-full shadow-md shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all duration-200 text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <span>Explore Tours</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="rentals-search"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-3xl p-4 md:p-5 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.18)] border border-gray-150 text-left"
          >
            {/* Service Mode Selector */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">Service Mode:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setServiceMode('with_driver')}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                    serviceMode === 'with_driver'
                      ? "bg-primary text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>With Driver & Gas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setServiceMode('self_drive')}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                    serviceMode === 'self_drive'
                      ? "bg-primary text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Self-Drive (Car Only)</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleRentalSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              {/* Pickup Date */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Pickup Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Duration / Charter Type */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  {serviceMode === 'self_drive' ? 'Rental Period' : 'Charter Duration'}
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={durationType}
                    onChange={(e: any) => setDurationType(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    {serviceMode === 'with_driver' ? (
                      <>
                        <option value="full_day">Full-Day (10-12 Hours)</option>
                        <option value="half_day">Half-Day (4-6 Hours)</option>
                        <option value="hourly">Hourly City Charter</option>
                        <option value="multi_day">Multi-Day Chauffeur</option>
                      </>
                    ) : (
                      <>
                        <option value="full_day">1 Day (24 Hours)</option>
                        <option value="multi_day">Multi-Day (24h Blocks)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Operational Zone / Destination */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Destination Zone
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    {DEFAULT_RENTAL_ZONES.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name.split(':')[0]} {zone.surcharge > 0 ? `(+$${zone.surcharge})` : '(Included)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Submit CTA */}
              <div>
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-orange-700 text-white font-black py-2.5 px-4 rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 h-[38px]"
                >
                  <Car className="w-4 h-4" />
                  <span>Find Available Cars</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
