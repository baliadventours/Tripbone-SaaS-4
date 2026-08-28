import { useState } from 'react';
import { Check, X, MapPin, Clock, Globe, HelpCircle, MessageSquare, Info, ShieldCheck, Calendar, Bed, Hotel, UserCheck, ChevronDown, ChevronUp, Layers, Compass, Sparkles, Navigation } from 'lucide-react';
import { Tour } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../../lib/SettingsContext';
import SmartImage from '../SmartImage';

interface TourInfoProps {
  tour: Tour;
}

export default function TourInfo({ tour }: TourInfoProps) {
  const { settings } = useSettings();
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({ 0: true });
  const [activeDayFilter, setActiveDayFilter] = useState<number | 'all'>('all');

  const toggleDay = (index: number) => {
    setExpandedDays(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const expandAllDays = () => {
    if (!tour.multiDayItinerary) return;
    const allExpanded: Record<number, boolean> = {};
    tour.multiDayItinerary.forEach((_, idx) => {
      allExpanded[idx] = true;
    });
    setExpandedDays(allExpanded);
  };

  const collapseAllDays = () => {
    setExpandedDays({});
  };

  const handleWhatsAppContact = () => {
    if (!settings?.whatsappNumber) return;
    
    // Remove non-numeric characters from the phone number for the wa.me link
    const cleanNumber = settings.whatsappNumber.replace(/\D/g, '');
    const message = encodeURIComponent(`Hi! I'm interested in the "${tour.title}" tour. Can you help me with some questions?`);
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };
  const sections = [
    { id: 'overview', title: 'Tour Overview', content: tour.description },
    { id: 'highlights', title: 'Tour Highlights', items: tour.highlights },
    { id: 'inclusion', title: 'Inclusion & Exclusion', inclusions: tour.inclusions, exclusions: tour.exclusions },
    { id: 'itinerary', title: 'Tour Itinerary', itinerary: tour.itinerary },
    { id: 'info', title: 'Important Information', content: tour.importantInfo },
    { id: 'languages', title: 'Languages', items: tour.languages },
    { id: 'faq', title: 'FAQ', faqs: tour.faqs },
  ];

  return (
    <div className="space-y-12">
      {/* Overview */}
      <section id="overview" className="scroll-mt-[116px]">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Tour Overview</h2>
        <p className="leading-relaxed text-gray-600 whitespace-pre-wrap">{tour.description}</p>
      </section>

      {/* Highlights */}
      <section id="highlights" className="scroll-mt-[116px]">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Tour Highlights</h2>
        <ul className="grid gap-y-2.5 gap-x-6 sm:grid-cols-2">
          {(tour.highlights || []).filter(line => line.trim() !== '').map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-primary mt-0.5 animate-fade-in">
                <Check className="h-3 w-3" />
              </div>
              <span className="text-sm md:text-base text-gray-600 font-medium leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Inclusion & Exclusion */}
      <section id="inclusion" className="scroll-mt-[116px]">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Inclusion & Exclusion</h2>
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Inclusions</h3>
            <ul className="space-y-3">
              {(tour.inclusions || []).filter(line => line.trim() !== '').map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Exclusions</h3>
            <ul className="space-y-3">
              {(tour.exclusions || []).filter(line => line.trim() !== '').map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section id="itinerary" className="scroll-mt-[116px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-100/80 text-primary">
                <Navigation className="h-5 w-5" />
              </span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Tour Itinerary</h2>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {tour.tourDurationType === 'multi_day' 
                ? `${tour.multiDayItinerary?.length || 0}-Day Journey Breakdown & Activities` 
                : 'Step-by-Step Schedule & Experience Timeline'}
            </p>
          </div>

          {tour.tourDurationType === 'multi_day' && tour.multiDayItinerary && tour.multiDayItinerary.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAllDays}
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-primary font-bold text-xs rounded-lg transition-colors border border-orange-100 cursor-pointer"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAllDays}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs rounded-lg transition-colors border border-gray-200 cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* Day Quick Navigation Filter for Multi-day */}
        {tour.tourDurationType === 'multi_day' && tour.multiDayItinerary && tour.multiDayItinerary.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveDayFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap cursor-pointer ${
                activeDayFilter === 'all'
                  ? 'bg-primary text-white shadow-md shadow-orange-200/50 scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Days ({tour.multiDayItinerary.length})
            </button>
            {tour.multiDayItinerary.map((day, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveDayFilter(idx);
                  setExpandedDays(prev => ({ ...prev, [idx]: true }));
                }}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  activeDayFilter === idx
                    ? 'bg-primary text-white shadow-md shadow-orange-200/50 scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Day {day.dayNumber}: {day.title.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {tour.tourDurationType === 'multi_day' && tour.multiDayItinerary && tour.multiDayItinerary.length > 0 ? (
          <div className="space-y-6">
            {tour.multiDayItinerary.map((day, dIdx) => {
              if (activeDayFilter !== 'all' && activeDayFilter !== dIdx) return null;
              const isExpanded = expandedDays[dIdx] ?? true;

              return (
                <div 
                  key={dIdx} 
                  className="border-2 border-orange-100/80 rounded-2xl bg-white shadow-xs overflow-hidden transition-all hover:border-orange-200"
                >
                  {/* Day Header Bar */}
                  <button
                    type="button"
                    onClick={() => toggleDay(dIdx)}
                    className="w-full text-left p-5 md:p-6 bg-gradient-to-r from-orange-50/60 via-white to-white flex items-center justify-between gap-4 cursor-pointer hover:bg-orange-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="px-3 py-1.5 bg-primary text-white font-black rounded-xl text-xs tracking-wider shadow-sm shrink-0">
                        DAY {day.dayNumber}
                      </span>
                      <div>
                        <h3 className="text-lg md:text-xl font-extrabold text-gray-900 leading-tight">{day.title}</h3>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {day.itineraryItems?.length || 0} Scheduled Activities
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-2xs">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </button>

                  {/* Day Content Body */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 pb-6 md:px-8 md:pb-8 space-y-6 border-t border-orange-100/50"
                      >
                        {day.description && (
                          <div className="pt-4">
                            <p className="text-sm text-gray-600 font-medium leading-relaxed bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                              {day.description}
                            </p>
                          </div>
                        )}

                        {/* Day Schedule Items */}
                        <div className="space-y-4 pt-2">
                          <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> Day Schedule Timeline
                          </h4>
                          <div className="space-y-0 relative">
                            {(day.itineraryItems || []).map((item, itemIdx) => (
                              <div key={itemIdx} className="relative pl-8 space-y-3 group pb-8 last:pb-2">
                                {/* Vertical Line */}
                                {itemIdx !== (day.itineraryItems || []).length - 1 && (
                                  <div className="absolute left-[9px] top-5 bottom-0 w-0.5 bg-orange-200 group-hover:bg-primary transition-colors z-0" />
                                )}
                                {/* Timeline Dot */}
                                <div className="absolute left-0 top-1 h-5 w-5 rounded-full bg-white border-4 border-primary shadow-xs group-hover:scale-125 transition-transform z-10" />
                                
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span className="text-xs font-black text-primary bg-orange-50 px-3 py-1 rounded-lg border border-orange-100 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {item.time}
                                  </span>
                                  <h5 className="font-extrabold text-gray-900 text-base">{item.title}</h5>
                                </div>

                                {item.image && (
                                  <div className="max-w-lg aspect-video rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-2xs group-hover:shadow-sm transition-shadow">
                                    <SmartImage src={item.image} alt={item.title} className="group-hover:scale-105 transition-transform duration-300" aspectRatio="auto" />
                                  </div>
                                )}

                                {item.description && (
                                  <p className="text-xs md:text-sm text-gray-600 font-medium leading-relaxed max-w-2xl">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-8 pl-2">
            {(tour.itinerary || []).map((item, idx) => (
              <div key={idx} className="relative group">
                {idx !== (tour.itinerary || []).length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-[-32px] w-0.5 bg-orange-200 group-hover:bg-primary transition-colors" />
                )}
                <div className="flex gap-5">
                  <div className="relative z-10">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-black text-white text-sm shadow-md shadow-orange-200 ring-4 ring-white group-hover:scale-110 transition-transform">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-sm transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="text-base md:text-lg font-black text-gray-900 group-hover:text-primary transition-colors leading-snug">
                        {item.title}
                      </h3>
                      {item.pickup && (
                        <div className="flex items-center gap-1.5 text-primary font-bold text-xs bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 shrink-0 w-fit">
                          <MapPin className="h-3.5 w-3.5" />
                          {typeof item.pickup === 'object' ? (item.pickup as any).description : item.pickup}
                        </div>
                      )}
                    </div>
                    
                    {(item.image || (typeof item.pickup === 'object' && (item.pickup as any)?.image)) && (
                      <div className="w-full max-w-lg aspect-video bg-gray-50 overflow-hidden rounded-xl border border-gray-100">
                        <SmartImage 
                          src={item.image || (typeof item.pickup === 'object' ? (item.pickup as any)?.image : '')} 
                          alt={item.title} 
                          className="group-hover:scale-105 transition-transform duration-300" 
                          aspectRatio="auto"
                        />
                      </div>
                    )}
                    
                    {item.description && (
                      <p className="text-xs md:text-sm leading-relaxed text-gray-600 font-medium">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Accommodations Preview if Multi-Day */}
      {tour.tourDurationType === 'multi_day' && tour.accommodations && tour.accommodations.length > 0 && (
        <section id="accommodations" className="scroll-mt-[116px]">
          <h2 className="mb-6 text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Hotel className="h-6 w-6 text-primary" /> Accommodation Options
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {tour.accommodations.map((acc, idx) => (
              <div key={idx} className="border border-gray-100 rounded-2xl bg-white p-5 shadow-xs space-y-3">
                {acc.image && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                    <SmartImage src={acc.image} alt={acc.name} className="hover:scale-105 transition-transform" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-orange-50 px-2 py-0.5 rounded">
                    {acc.category}
                  </span>
                  <h3 className="font-extrabold text-gray-900 text-lg mt-1">{acc.name}</h3>
                  {acc.description && <p className="text-xs text-gray-500 mt-1">{acc.description}</p>}
                </div>
                {acc.roomTypes && acc.roomTypes.length > 0 && (
                  <div className="pt-2 border-t border-gray-50 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Available Rooms</span>
                    <div className="flex flex-wrap gap-2">
                      {acc.roomTypes.map((rt, rtIdx) => (
                        <span key={rtIdx} className="text-xs bg-gray-50 font-bold text-gray-700 px-2.5 py-1 rounded-lg border border-gray-100">
                          {rt.name} (${rt.price})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Important Information */}
      <section id="info" className="scroll-mt-[116px]">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Info className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Important Information</h2>
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 bg-orange-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 space-y-6">
            {/* Dynamic Info Sections - Forced Single Column */}
            <div className="space-y-6">
              {(tour.infoSections || []).map((section, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-4 bg-primary rounded-full" />
                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-widest">
                      {section.title}
                    </h3>
                  </div>
                  <ul className="space-y-1.5">
                    {(section.content || []).filter(line => line.trim() !== '').map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2.5 group/item">
                        <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-white/10 text-primary group-hover/item:bg-primary group-hover/item:text-white transition-all mt-0.5">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <span className="text-xs md:text-sm text-gray-300 leading-normal font-light group-hover/item:text-white transition-colors">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="space-y-6 pt-5 border-t border-white/10">
              {/* General Info (Legacy support or fallback) */}
              {tour.importantInfo && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-4 bg-primary rounded-full transition-all" />
                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-widest">Policy & Terms</h3>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-xs md:text-sm leading-normal text-gray-400 font-light whitespace-pre-wrap">
                      {tour.importantInfo}
                    </p>
                  </div>
                </div>
              )}

              {/* Languages offered */}
              {tour.languages && tour.languages.length > 0 && (
                <div className="space-y-3">
                   <div className="flex items-center gap-3">
                    <div className="h-1 w-6 bg-primary rounded-full" />
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">Languages Offered</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tour.languages.filter(l => l.trim() !== '').map((lang, idx) => (
                      <span key={idx} className="px-4 py-2 bg-white/5 border border-white/10 font-bold text-white rounded-2xl text-xs md:text-sm hover:border-primary transition-all cursor-default">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section id="map" className="scroll-mt-[116px]">
        <h2 className="mb-6 text-[10px] font-black text-gray-400 tracking-[0.3em] uppercase opacity-50">Location Map</h2>
        <div className="overflow-hidden rounded-[10px] bg-gray-100 ring-1 ring-gray-100 aspect-[21/9] relative shadow-2xl shadow-gray-200/50">
          <iframe 
            src={tour.locationMapUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.9537353153166!3d-37.81033277975171!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0x5045675218ce6e0!2sMelbourne%20VIC%2C%20Australia!5e0!3m2!1sen!2sid!4v1625123456789!5m2!1sen!2sid"}
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy"
            title="Location Map"
          />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-[116px]">
        <h2 className="mb-6 text-2xl font-black text-gray-900 tracking-tight">FAQ</h2>
        <div className="space-y-4">
          {(tour.faqs || []).map((faq, idx) => (
            <div key={idx} className="rounded-[10px] border border-gray-100 bg-white p-5 cursor-default hover:border-orange-100 transition-colors">
              <h3 className="mb-2 font-bold text-gray-900">{faq.question}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Itinerary Cta */}
      <section className="rounded-[10px] bg-primary p-8 text-white">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Need custom itinerary and more questions?</h2>
            <p className="text-orange-100 font-medium">Our experts are here to help you design your perfect trip.</p>
          </div>
          <button 
            onClick={handleWhatsAppContact}
            className="flex items-center gap-2 rounded-[10px] bg-white px-8 py-4 font-bold text-primary transition-all hover:bg-orange-50 active:scale-95 shadow-lg"
          >
            <MessageSquare className="h-5 w-5" /> Contact Experts
          </button>
        </div>
      </section>
    </div>
  );
}
