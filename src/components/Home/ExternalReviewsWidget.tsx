import React, { useState } from 'react';
import { useSettings } from '../../lib/SettingsContext';
import { Star, ExternalLink, ShieldCheck, MapPin, Award, Home as AirbnbIcon, MessageSquarePlus, CheckCircle2, X, Send, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from '@/src/lib/firebase';

interface ExternalReviewsWidgetProps {
  onFilterChange?: (platform: string) => void;
  activeFilter?: string;
  className?: string;
}

export default function ExternalReviewsWidget({ onFilterChange, activeFilter = 'all', className = '' }: ExternalReviewsWidgetProps) {
  const { settings } = useSettings();
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'external' | 'direct'>('external');

  // Direct Review Form State
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [nationality, setNationality] = useState('Australia');
  const [platform, setPlatform] = useState<'direct' | 'google' | 'tripadvisor' | 'airbnb'>('google');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Settings & Fallbacks
  const enabled = settings?.externalReviewsEnabled ?? true;
  const googleEnabled = settings?.googleReviewsEnabled ?? true;
  const tripadvisorEnabled = settings?.tripadvisorEnabled ?? true;
  const airbnbEnabled = settings?.airbnbEnabled ?? true;
  const viatorEnabled = settings?.viatorEnabled || Boolean(settings?.viatorUrl && settings.viatorUrl.trim());
  const gygEnabled = settings?.getyourguideEnabled || Boolean(settings?.getyourguideUrl && settings.getyourguideUrl.trim());
  const trustpilotEnabled = settings?.trustpilotEnabled || Boolean(settings?.trustpilotUrl && settings.trustpilotUrl.trim());
  const klookEnabled = settings?.klookEnabled || Boolean(settings?.klookUrl && settings.klookUrl.trim());
  const bookingEnabled = settings?.bookingEnabled || Boolean(settings?.bookingUrl && settings.bookingUrl.trim());
  const customEnabled = settings?.customReviewEnabled || Boolean(settings?.customReviewUrl && settings.customReviewUrl.trim());

  const googleRating = settings?.googleRating ?? 4.9;
  const googleCount = settings?.googleReviewCount ?? 520;
  const googleUrl = settings?.googleReviewUrl || 'https://maps.google.com';

  const taRating = settings?.tripadvisorRating ?? 5.0;
  const taCount = settings?.tripadvisorReviewCount ?? 342;
  const taUrl = settings?.tripadvisorUrl || 'https://www.tripadvisor.com';

  const abRating = settings?.airbnbRating ?? 4.95;
  const abCount = settings?.airbnbReviewCount ?? 185;
  const abUrl = settings?.airbnbUrl || 'https://www.airbnb.com';

  const viatorRating = settings?.viatorRating ?? 4.9;
  const viatorCount = settings?.viatorReviewCount ?? 120;
  const viatorUrl = settings?.viatorUrl || 'https://www.viator.com';

  const gygRating = settings?.getyourguideRating ?? 4.8;
  const gygCount = settings?.getyourguideReviewCount ?? 95;
  const gygUrl = settings?.getyourguideUrl || 'https://www.getyourguide.com';

  const trustpilotRating = settings?.trustpilotRating ?? 4.9;
  const trustpilotCount = settings?.trustpilotReviewCount ?? 150;
  const trustpilotUrl = settings?.trustpilotUrl || 'https://www.trustpilot.com';

  const klookRating = settings?.klookRating ?? 4.9;
  const klookCount = settings?.klookReviewCount ?? 88;
  const klookUrl = settings?.klookUrl || 'https://www.klook.com';

  const bookingRating = settings?.bookingRating ?? 9.6;
  const bookingCount = settings?.bookingReviewCount ?? 210;
  const bookingUrl = settings?.bookingUrl || 'https://www.booking.com';

  const customPlatformName = settings?.customReviewPlatformName || 'Verified Reviews';
  const customRating = settings?.customReviewRating ?? 5.0;
  const customCount = settings?.customReviewCount ?? 50;
  const customUrl = settings?.customReviewUrl || '';

  if (!enabled) return null;

  const handleFilterClick = (filter: string) => {
    if (onFilterChange) {
      onFilterChange(filter);
    }
  };

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !comment.trim()) {
      alert("Please fill in your name and review details.");
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, 'reviews'), {
        userId: 'guest-' + Date.now(),
        userName: guestName.trim(),
        nationality: nationality || 'Verified traveler',
        rating: rating,
        comment: comment.trim(),
        platform: platform,
        status: 'approved',
        createdAt: new Date(),
        isVerified: true
      });

      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowCollectModal(false);
        setGuestName('');
        setComment('');
      }, 2500);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Unable to save review. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className={`w-full my-4 sm:my-8 ${className}`}>
      {/* Top Reputation & Collection Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
          
          {/* Trust Badge Left Column */}
          <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20 shrink-0">
              <Award className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  Multi-Platform Trust Badge
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                Verified Reviews Across Top Booking Channels
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Aggregated ratings from Google Maps, TripAdvisor, and Airbnb listings.
              </p>
            </div>
          </div>

          {/* Platform Badges & Direct Links - Responsive Grid on Mobile */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            {/* Google Reviews Badge */}
            {googleEnabled && (
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (onFilterChange) {
                    handleFilterClick('google');
                  }
                }}
                className={`group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'google'
                    ? 'bg-blue-600/20 border-blue-400/60 text-white shadow-lg'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                }`}
                title="View Google Maps Reviews"
              >
                {/* Google SVG Icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <div className="text-left leading-tight min-w-0">
                  <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs">
                    <span className="truncate">Google</span>
                    <span className="text-amber-400 font-black flex items-center shrink-0">
                      {googleRating.toFixed(1)} <Star className="w-2.5 h-2.5 fill-amber-400 ml-0.5 inline" />
                    </span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                    {googleCount}+ reviews
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-400 ml-auto shrink-0 hidden sm:block" />
              </a>
            )}

            {/* TripAdvisor Badge */}
            {tripadvisorEnabled && (
              <a
                href={taUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (onFilterChange) {
                    handleFilterClick('tripadvisor');
                  }
                }}
                className={`group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'tripadvisor'
                    ? 'bg-emerald-600/20 border-emerald-400/60 text-white shadow-lg'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                }`}
                title="View TripAdvisor Reviews"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] flex items-center justify-center shrink-0">
                  TA
                </div>
                <div className="text-left leading-tight min-w-0">
                  <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs">
                    <span className="truncate">TripAdvisor</span>
                    <span className="text-emerald-400 font-black flex items-center shrink-0">
                      {taRating.toFixed(1)} <Star className="w-2.5 h-2.5 fill-emerald-400 ml-0.5 inline" />
                    </span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                    {taCount}+ awards
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 ml-auto shrink-0 hidden sm:block" />
              </a>
            )}

            {/* Airbnb Badge */}
            {airbnbEnabled && (
              <a
                href={abUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (onFilterChange) {
                    handleFilterClick('airbnb');
                  }
                }}
                className={`group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'airbnb'
                    ? 'bg-rose-600/20 border-rose-400/60 text-white shadow-lg'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                }`}
                title="View Airbnb Reviews"
              >
                <AirbnbIcon className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="text-left leading-tight min-w-0">
                  <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs">
                    <span className="truncate">Airbnb</span>
                    <span className="text-rose-400 font-black flex items-center shrink-0">
                      {abRating.toFixed(1)} <Star className="w-2.5 h-2.5 fill-rose-400 ml-0.5 inline" />
                    </span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                    {abCount}+ ratings
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-rose-400 ml-auto shrink-0 hidden sm:block" />
              </a>
            )}

            {/* Viator Badge */}
            {viatorEnabled && (
              <a
                href={viatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleFilterClick('viator')}
                className={`group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'viator'
                    ? 'bg-amber-600/20 border-amber-400/60 text-white shadow-lg'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                }`}
                title="View Viator Reviews"
              >
                <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center shrink-0">
                  V
                </div>
                <div className="text-left leading-tight min-w-0">
                  <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs">
                    <span className="truncate">Viator</span>
                    <span className="text-amber-400 font-black flex items-center shrink-0">
                      {viatorRating.toFixed(1)} <Star className="w-2.5 h-2.5 fill-amber-400 ml-0.5 inline" />
                    </span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                    {viatorCount}+ reviews
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-400 ml-auto shrink-0 hidden sm:block" />
              </a>
            )}

            {/* GetYourGuide Badge */}
            {gygEnabled && (
              <a
                href={gygUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleFilterClick('getyourguide')}
                className={`group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'getyourguide'
                    ? 'bg-red-600/20 border-red-400/60 text-white shadow-lg'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                }`}
                title="View GetYourGuide Reviews"
              >
                <div className="w-4 h-4 rounded-full bg-red-600 text-white font-black text-[7px] flex items-center justify-center shrink-0">
                  GYG
                </div>
                <div className="text-left leading-tight min-w-0">
                  <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs">
                    <span className="truncate">GetYourGuide</span>
                    <span className="text-red-400 font-black flex items-center shrink-0">
                      {gygRating.toFixed(1)} <Star className="w-2.5 h-2.5 fill-red-400 ml-0.5 inline" />
                    </span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                    {gygCount}+ reviews
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-red-400 ml-auto shrink-0 hidden sm:block" />
              </a>
            )}

            {/* Trustpilot Badge */}
            {trustpilotEnabled && (
              <a
                href={trustpilotUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleFilterClick('trustpilot')}
                className={`group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'trustpilot'
                    ? 'bg-emerald-600/20 border-emerald-400/60 text-white shadow-lg'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                }`}
                title="View Trustpilot Reviews"
              >
                <Star className="w-4 h-4 text-emerald-400 fill-emerald-400 shrink-0" />
                <div className="text-left leading-tight min-w-0">
                  <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs">
                    <span className="truncate">Trustpilot</span>
                    <span className="text-emerald-400 font-black flex items-center shrink-0">
                      {trustpilotRating.toFixed(1)} <Star className="w-2.5 h-2.5 fill-emerald-400 ml-0.5 inline" />
                    </span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                    {trustpilotCount}+ reviews
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 ml-auto shrink-0 hidden sm:block" />
              </a>
            )}

            {/* Klook Badge */}
            {klookEnabled && (
              <a
                href={klookUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleFilterClick('klook')}
                className={`group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'klook'
                    ? 'bg-orange-600/20 border-orange-400/60 text-white shadow-lg'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                }`}
                title="View Klook Reviews"
              >
                <div className="w-4 h-4 rounded-full bg-orange-500 text-white font-black text-[8px] flex items-center justify-center shrink-0">
                  K
                </div>
                <div className="text-left leading-tight min-w-0">
                  <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs">
                    <span className="truncate">Klook</span>
                    <span className="text-orange-400 font-black flex items-center shrink-0">
                      {klookRating.toFixed(1)} <Star className="w-2.5 h-2.5 fill-orange-400 ml-0.5 inline" />
                    </span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                    {klookCount}+ reviews
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-orange-400 ml-auto shrink-0 hidden sm:block" />
              </a>
            )}

            {/* Booking.com Badge */}
            {bookingEnabled && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleFilterClick('booking')}
                className={`group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'booking'
                    ? 'bg-blue-700/20 border-blue-500/60 text-white shadow-lg'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                }`}
                title="View Booking.com Reviews"
              >
                <div className="w-4 h-4 rounded-full bg-blue-700 text-white font-black text-[8px] flex items-center justify-center shrink-0">
                  B.
                </div>
                <div className="text-left leading-tight min-w-0">
                  <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs">
                    <span className="truncate">Booking</span>
                    <span className="text-blue-400 font-black flex items-center shrink-0">
                      {bookingRating.toFixed(1)} <Star className="w-2.5 h-2.5 fill-blue-400 ml-0.5 inline" />
                    </span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                    {bookingCount}+ reviews
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-400 ml-auto shrink-0 hidden sm:block" />
              </a>
            )}

            {/* Custom Review Source Badge */}
            {customEnabled && customUrl && (
              <a
                href={customUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleFilterClick('custom')}
                className={`group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeFilter === 'custom'
                    ? 'bg-amber-600/20 border-amber-400/60 text-white shadow-lg'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                }`}
                title={`View ${customPlatformName}`}
              >
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-left leading-tight min-w-0">
                  <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs">
                    <span className="truncate">{customPlatformName}</span>
                    <span className="text-amber-400 font-black flex items-center shrink-0">
                      {customRating.toFixed(1)} <Star className="w-2.5 h-2.5 fill-amber-400 ml-0.5 inline" />
                    </span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                    {customCount}+ reviews
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-400 ml-auto shrink-0 hidden sm:block" />
              </a>
            )}

            {/* Review Collection Action Button */}
            <button
              onClick={() => setShowCollectModal(true)}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Leave a Review</span>
            </button>
          </div>

        </div>
      </div>

      {/* Write / Submit External Review Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl relative">
            <button
              onClick={() => setShowCollectModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 fill-cyan-400" />
              </div>
              <h3 className="text-xl font-black text-white">Share Your Review</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Leave a review directly on our platform or submit to Google, TripAdvisor, or Airbnb.
              </p>

              {/* Toggle Mode Tabs */}
              <div className="flex bg-slate-800 p-1 rounded-xl max-w-xs mx-auto gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('external')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'external' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  External Platforms
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('direct')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'direct' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Write Direct Review
                </button>
              </div>
            </div>

            {submitted ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-lg font-black text-white">Thank You for Your Feedback!</h4>
                <p className="text-xs text-slate-400">Your review has been collected and published to our frontpage slider.</p>
              </div>
            ) : activeTab === 'external' ? (
              <div className="space-y-3">
                {googleEnabled && (
                  <a
                    href={googleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">Review on Google Maps</h4>
                        <p className="text-xs text-slate-400">Share your experience on our Google Business Profile</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  </a>
                )}

                {tripadvisorEnabled && (
                  <a
                    href={taUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center shrink-0">
                        TA
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">Review on TripAdvisor</h4>
                        <p className="text-xs text-slate-400">Post a review on TripAdvisor Travel Community</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                  </a>
                )}

                {airbnbEnabled && (
                  <a
                    href={abUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                        <AirbnbIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors">Review on Airbnb</h4>
                        <p className="text-xs text-slate-400">Leave feedback on our Airbnb Listing Page</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
                  </a>
                )}

                {viatorEnabled && viatorUrl && (
                  <a
                    href={viatorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center shrink-0">
                        V
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">Review on Viator</h4>
                        <p className="text-xs text-slate-400">Share your experience on Viator Experience Platform</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
                  </a>
                )}

                {gygEnabled && gygUrl && (
                  <a
                    href={gygUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 font-black text-xs flex items-center justify-center shrink-0">
                        GYG
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">Review on GetYourGuide</h4>
                        <p className="text-xs text-slate-400">Review our activities on GetYourGuide</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
                  </a>
                )}

                {trustpilotEnabled && trustpilotUrl && (
                  <a
                    href={trustpilotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">Review on Trustpilot</h4>
                        <p className="text-xs text-slate-400">Post an honest review on Trustpilot Community</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                  </a>
                )}

                {klookEnabled && klookUrl && (
                  <a
                    href={klookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 font-black text-sm flex items-center justify-center shrink-0">
                        K
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors">Review on Klook</h4>
                        <p className="text-xs text-slate-400">Rate your tour & activities on Klook</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-orange-400" />
                  </a>
                )}

                {bookingEnabled && bookingUrl && (
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-700/20 text-blue-400 font-black text-sm flex items-center justify-center shrink-0">
                        B.
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">Review on Booking.com</h4>
                        <p className="text-xs text-slate-400">Submit your verified stay review on Booking.com</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                  </a>
                )}
              </div>
            ) : (
              <form onSubmit={handleDirectSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Platform Tag</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  >
                    <option value="google">Google Maps Review</option>
                    <option value="tripadvisor">TripAdvisor Review</option>
                    <option value="airbnb">Airbnb Review</option>
                    <option value="viator">Viator Review</option>
                    <option value="getyourguide">GetYourGuide Review</option>
                    <option value="trustpilot">Trustpilot Review</option>
                    <option value="klook">Klook Review</option>
                    <option value="booking">Booking.com Review</option>
                    <option value="direct">Direct Website Review</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      placeholder="e.g. Australia, USA, Germany"
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Star Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 cursor-pointer focus:outline-none"
                      >
                        <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Your Review</label>
                  <textarea
                    required
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe your tour experience..."
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Review...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Review Now</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Thank you for helping us deliver unforgettable tour experiences!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
