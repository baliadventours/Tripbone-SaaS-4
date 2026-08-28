import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from '@/src/lib/firebase';
import { Review } from '../../types';
import { Quote, Star, ShieldCheck, CheckCircle2, ExternalLink, Award } from 'lucide-react';
import { useSettings } from '../../lib/SettingsContext';
import ExternalReviewsWidget from './ExternalReviewsWidget';
import ElfsightWidget from './ElfsightWidget';

const DEFAULT_FALLBACK_REVIEWS: Review[] = [
  {
    id: 'fb-1',
    userName: 'Sarah Jenkins',
    nationality: 'Australia',
    rating: 5,
    comment: 'The Mount Batur sunrise trek with Bali Adventours was the absolute highlight of our trip! Our guide Putu was exceptionally knowledgeable and took amazing photos of us at the crater rim.',
    platform: 'google',
    status: 'approved',
    userId: 'guest-1',
    createdAt: new Date()
  },
  {
    id: 'fb-2',
    userName: 'Markus Weber',
    nationality: 'Germany',
    rating: 5,
    comment: 'Seamless organization from hotel pickup to the private boat transfer to Nusa Penida. Professional driver, clean vehicles, and unbeatable local insights.',
    platform: 'tripadvisor',
    status: 'approved',
    userId: 'guest-2',
    createdAt: new Date()
  },
  {
    id: 'fb-3',
    userName: 'Elena Rostova',
    nationality: 'United States',
    rating: 5,
    comment: 'Booked the ATV & Ayung River Rafting combo. Unbelievable adrenaline rush with safety equipment in top condition. Will definitely book again next year!',
    platform: 'airbnb',
    status: 'approved',
    userId: 'guest-3',
    createdAt: new Date()
  },
  {
    id: 'fb-4',
    userName: 'David & Clare Chen',
    nationality: 'Singapore',
    rating: 5,
    comment: 'Tailor-made private tour around Ubud waterfalls and Tegallalang rice terraces. Perfect pace with zero pressure shopping stops. 10/10 service!',
    platform: 'google',
    status: 'approved',
    userId: 'guest-4',
    createdAt: new Date()
  },
  {
    id: 'fb-5',
    userName: 'Liam O\'Connor',
    nationality: 'United Kingdom',
    rating: 5,
    comment: 'From instant WhatsApp booking confirmation to friendly English-speaking driver Made, everything exceeded expectations. High quality service!',
    platform: 'direct',
    status: 'approved',
    userId: 'guest-5',
    createdAt: new Date()
  },
  {
    id: 'fb-6',
    userName: 'Sophie Martin',
    nationality: 'France',
    rating: 5,
    comment: 'Truly authentic Balinese culture and stunning nature views. The itinerary was perfectly timed to avoid peak crowds. Unforgettable!',
    platform: 'tripadvisor',
    status: 'approved',
    userId: 'guest-6',
    createdAt: new Date()
  }
];

interface ReviewSourceTab {
  id: string;
  label: string;
  url?: string;
  rating?: number;
  count?: number;
  icon: React.ReactNode;
}

export default function ReviewSlider() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const { builderSettings, settings } = useSettings();

  const maxDisplay = settings?.maxDisplayReviews ? Number(settings.maxDisplayReviews) : 6;

  useEffect(() => {
    try {
      const q = collection(db, 'reviews');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review));
        const approved = data.filter((r: any) => !r.status || r.status === 'approved');
        const sorted = approved
          .sort((a: any, b: any) => {
            const timeA = a.createdAt?.seconds 
              ? a.createdAt.seconds * 1000 + (a.createdAt.nanoseconds || 0) / 1000000
              : (a.createdAt instanceof Date ? a.createdAt.getTime() : typeof a.createdAt === 'number' ? a.createdAt : 0);
            const timeB = b.createdAt?.seconds 
              ? b.createdAt.seconds * 1000 + (b.createdAt.nanoseconds || 0) / 1000000
              : (b.createdAt instanceof Date ? b.createdAt.getTime() : typeof b.createdAt === 'number' ? b.createdAt : 0);
            return timeB - timeA;
          });
        
        setReviews(sorted);
      }, (err) => {
        console.warn("Reviews onSnapshot notice:", err);
      });
      return unsubscribe;
    } catch (err) {
      console.warn("Error setting up reviews listener:", err);
    }
  }, []);

  const effectiveReviews = reviews.length > 0 ? reviews : DEFAULT_FALLBACK_REVIEWS;

  const filteredReviews = effectiveReviews.filter(r => {
    if (platformFilter === 'all') return true;
    return r.platform === platformFilter;
  });

  const getPlatformLink = (platform?: string): string => {
    switch (platform) {
      case 'google':
        return settings?.googleReviewUrl || 'https://maps.google.com';
      case 'tripadvisor':
        return settings?.tripadvisorUrl || 'https://www.tripadvisor.com';
      case 'airbnb':
        return settings?.airbnbUrl || 'https://www.airbnb.com';
      case 'viator':
        return settings?.viatorUrl || 'https://www.viator.com';
      case 'getyourguide':
        return settings?.getyourguideUrl || 'https://www.getyourguide.com';
      case 'trustpilot':
        return settings?.trustpilotUrl || 'https://www.trustpilot.com';
      case 'klook':
        return settings?.klookUrl || 'https://www.klook.com';
      case 'booking':
        return settings?.bookingUrl || 'https://www.booking.com';
      case 'custom':
        return settings?.customReviewUrl || '';
      default:
        return '';
    }
  };

  // Construct dynamic review source tabs from settings
  const sourceTabs: ReviewSourceTab[] = [
    {
      id: 'all',
      label: 'All Reviews',
      icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
    }
  ];

  if (settings?.googleReviewsEnabled !== false) {
    sourceTabs.push({
      id: 'google',
      label: 'Google Maps',
      url: settings?.googleReviewUrl || 'https://maps.google.com',
      rating: settings?.googleRating ?? 4.9,
      count: settings?.googleReviewCount ?? 520,
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      )
    });
  }

  if (settings?.tripadvisorEnabled !== false) {
    sourceTabs.push({
      id: 'tripadvisor',
      label: 'TripAdvisor',
      url: settings?.tripadvisorUrl || 'https://www.tripadvisor.com',
      rating: settings?.tripadvisorRating ?? 5.0,
      count: settings?.tripadvisorReviewCount ?? 342,
      icon: (
        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[8px] flex items-center justify-center shrink-0">
          TA
        </span>
      )
    });
  }

  if (settings?.airbnbEnabled !== false) {
    sourceTabs.push({
      id: 'airbnb',
      label: 'Airbnb',
      url: settings?.airbnbUrl || 'https://www.airbnb.com',
      rating: settings?.airbnbRating ?? 4.95,
      count: settings?.airbnbReviewCount ?? 185,
      icon: (
        <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white font-black text-[8px] flex items-center justify-center shrink-0">
          ab
        </span>
      )
    });
  }

  if (settings?.viatorEnabled || (settings?.viatorUrl && settings.viatorUrl.trim())) {
    sourceTabs.push({
      id: 'viator',
      label: 'Viator',
      url: settings?.viatorUrl || 'https://www.viator.com',
      rating: settings?.viatorRating ?? 4.9,
      count: settings?.viatorReviewCount ?? 120,
      icon: (
        <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-black text-[8px] flex items-center justify-center shrink-0">
          V
        </span>
      )
    });
  }

  if (settings?.getyourguideEnabled || (settings?.getyourguideUrl && settings.getyourguideUrl.trim())) {
    sourceTabs.push({
      id: 'getyourguide',
      label: 'GetYourGuide',
      url: settings?.getyourguideUrl || 'https://www.getyourguide.com',
      rating: settings?.getyourguideRating ?? 4.8,
      count: settings?.getyourguideReviewCount ?? 95,
      icon: (
        <span className="w-3.5 h-3.5 rounded-full bg-red-600 text-white font-black text-[7px] flex items-center justify-center shrink-0">
          GYG
        </span>
      )
    });
  }

  if (settings?.trustpilotEnabled || (settings?.trustpilotUrl && settings.trustpilotUrl.trim())) {
    sourceTabs.push({
      id: 'trustpilot',
      label: 'Trustpilot',
      url: settings?.trustpilotUrl || 'https://www.trustpilot.com',
      rating: settings?.trustpilotRating ?? 4.9,
      count: settings?.trustpilotReviewCount ?? 150,
      icon: (
        <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
      )
    });
  }

  if (settings?.klookEnabled || (settings?.klookUrl && settings.klookUrl.trim())) {
    sourceTabs.push({
      id: 'klook',
      label: 'Klook',
      url: settings?.klookUrl || 'https://www.klook.com',
      rating: settings?.klookRating ?? 4.9,
      count: settings?.klookReviewCount ?? 88,
      icon: (
        <span className="w-3.5 h-3.5 rounded-full bg-orange-500 text-white font-black text-[8px] flex items-center justify-center shrink-0">
          K
        </span>
      )
    });
  }

  if (settings?.bookingEnabled || (settings?.bookingUrl && settings.bookingUrl.trim())) {
    sourceTabs.push({
      id: 'booking',
      label: 'Booking.com',
      url: settings?.bookingUrl || 'https://www.booking.com',
      rating: settings?.bookingRating ?? 9.6,
      count: settings?.bookingReviewCount ?? 210,
      icon: (
        <span className="w-3.5 h-3.5 rounded-full bg-blue-700 text-white font-black text-[8px] flex items-center justify-center shrink-0">
          B.
        </span>
      )
    });
  }

  if (settings?.customReviewEnabled || (settings?.customReviewUrl && settings.customReviewUrl.trim())) {
    sourceTabs.push({
      id: 'custom',
      label: settings?.customReviewPlatformName || 'Direct Reviews',
      url: settings?.customReviewUrl || '',
      rating: settings?.customReviewRating ?? 5.0,
      count: settings?.customReviewCount ?? 50,
      icon: <Award className="w-3.5 h-3.5 text-amber-500" />
    });
  }

  const renderPlatformBadge = (platform?: string) => {
    const link = getPlatformLink(platform);
    
    const badgeElement = (() => {
      switch (platform) {
        case 'google':
          return (
            <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 group-hover/badge:border-blue-400/60 transition-colors">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Google Maps</span>
              {link && <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/badge:opacity-100" />}
            </span>
          );
        case 'tripadvisor':
          return (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 group-hover/badge:border-emerald-400/60 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 text-slate-900 font-black text-[7px] flex items-center justify-center">TA</span>
              <span>TripAdvisor</span>
              {link && <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/badge:opacity-100" />}
            </span>
          );
        case 'airbnb':
          return (
            <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 group-hover/badge:border-rose-400/60 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 text-white font-black text-[7px] flex items-center justify-center">ab</span>
              <span>Airbnb Guest</span>
              {link && <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/badge:opacity-100" />}
            </span>
          );
        case 'viator':
          return (
            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 group-hover/badge:border-amber-400/60 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 text-slate-950 font-black text-[7px] flex items-center justify-center">V</span>
              <span>Viator</span>
              {link && <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/badge:opacity-100" />}
            </span>
          );
        case 'getyourguide':
          return (
            <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 group-hover/badge:border-red-400/60 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 text-white font-black text-[6px] flex items-center justify-center">GYG</span>
              <span>GetYourGuide</span>
              {link && <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/badge:opacity-100" />}
            </span>
          );
        case 'trustpilot':
          return (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 group-hover/badge:border-emerald-400/60 transition-colors">
              <Star className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
              <span>Trustpilot</span>
              {link && <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/badge:opacity-100" />}
            </span>
          );
        case 'klook':
          return (
            <span className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 group-hover/badge:border-orange-400/60 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 text-white font-black text-[7px] flex items-center justify-center">K</span>
              <span>Klook</span>
              {link && <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/badge:opacity-100" />}
            </span>
          );
        case 'booking':
          return (
            <span className="inline-flex items-center gap-1.5 bg-blue-600/10 text-blue-400 border border-blue-600/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 group-hover/badge:border-blue-400/60 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-700 text-white font-black text-[7px] flex items-center justify-center">B</span>
              <span>Booking.com</span>
              {link && <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/badge:opacity-100" />}
            </span>
          );
        default:
          return (
            <span className="inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0">
              <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" />
              Verified Guest
            </span>
          );
      }
    })();

    if (link) {
      return (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="group/badge inline-block hover:opacity-90 transition-transform active:scale-95"
          title={`Read full reviews on ${platform}`}
        >
          {badgeElement}
        </a>
      );
    }

    return badgeElement;
  };

  const displayList = filteredReviews.length > 0 ? filteredReviews : effectiveReviews;

  return (
    <section id="reviews" className="container mx-auto px-4 py-8 sm:py-16 lg:px-8 max-w-7xl scroll-mt-24">
      <div className="mb-6 sm:mb-8 text-center">
        <span className="text-primary text-xs font-black uppercase tracking-widest mb-2 block">Guest Experiences</span>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          Trusted by Travelers Worldwide
        </h2>
      </div>

      {/* External Review Platforms Badge Bar */}
      <ExternalReviewsWidget
        activeFilter={platformFilter}
        onFilterChange={(filter) => {
          setPlatformFilter(prev => prev === filter ? 'all' : filter);
        }}
      />

      {/* Elfsight Live Widget Embed OR Native Interactive Reviews */}
      {settings?.elfsightEnabled === true && settings?.elfsightEmbedCode?.trim() ? (
        <div className="mb-6 sm:mb-10 w-full">
          <ElfsightWidget embedCode={settings.elfsightEmbedCode} />
        </div>
      ) : (
        <>
          {/* Clickable Review Source Links & Platform Filters */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 flex-wrap">
            {sourceTabs.map((tab) => {
              const isSelected = platformFilter === tab.id;
              const hasUrl = tab.url && tab.url.trim().length > 0;

              if (tab.id === 'all') {
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPlatformFilter('all')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105 ring-2 ring-slate-900/10'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              }

              return (
                <a
                  key={tab.id}
                  href={hasUrl ? tab.url : '#reviews'}
                  target={hasUrl ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    setPlatformFilter(tab.id);
                    if (!hasUrl) {
                      e.preventDefault();
                    }
                  }}
                  className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105 ring-2 ring-slate-900/10'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow'
                  }`}
                  title={hasUrl ? `Open & view ${tab.label} reviews in new tab` : `Filter by ${tab.label}`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.rating !== undefined && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tab.rating.toFixed(1)}★
                    </span>
                  )}
                  {hasUrl && (
                    <ExternalLink className={`w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                      isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    }`} />
                  )}
                </a>
              );
            })}
          </div>

          {/* Reviews Grid & Mobile Carousel */}
          <div className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-6 md:pb-0 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {displayList.slice(0, maxDisplay).map((review) => (
              <div 
                key={review.id} 
                className="w-[280px] sm:w-[320px] md:w-auto shrink-0 snap-center md:snap-align-none bg-gray-950 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl flex flex-col justify-between group hover:-translate-y-1 transition-transform border border-slate-800"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <Quote className="h-16 w-16 text-white" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-1 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3.5 w-3.5 ${i < (review.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-800'}`} 
                        />
                      ))}
                    </div>
                    {renderPlatformBadge(review.platform)}
                  </div>

                  <p className="text-xs sm:text-sm text-white/90 leading-relaxed mb-6 sm:mb-8 line-clamp-4 italic">
                    "{review.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 sm:pt-6 border-t border-white/10 mt-auto">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xs sm:text-sm border border-primary/20 overflow-hidden shrink-0">
                    {review.userPhoto ? (
                      <img src={review.userPhoto} className="w-full h-full object-cover" alt={review.userName} />
                    ) : (
                      review.userName?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-black text-xs sm:text-sm tracking-wider truncate">{review.userName}</h4>
                    <p className="text-gray-400 font-bold text-[9px] sm:text-[10px] tracking-widest truncate">{review.nationality || 'Verified traveler'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

