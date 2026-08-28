import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Tour, Category, Review, BlogPost, SiteSettings } from '../../types';
import { WebsiteBuilderSettings } from '../Admin/WebsiteBuilder';
import { useCurrency } from '../../lib/CurrencyContext';
import { cn } from '../../lib/utils';
import SmartImage from '../SmartImage';
import CarRentalShowcase from './CarRentalShowcase';

export interface MobileHomePresetsProps {
  preset?: string;
  tours: Tour[];
  filteredTours: Tour[];
  favoriteTours: Tour[];
  categories: Category[];
  reviews: Review[];
  posts: BlogPost[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  loading: boolean;
  settings: SiteSettings | null;
  builderSettings: WebsiteBuilderSettings | null;
  onOpenCategoriesModal: () => void;
  heroSlides?: any[];
}

export default function MobileHomePresets({
  preset = 'klook-explorer',
  tours,
  filteredTours,
  favoriteTours,
  categories,
  reviews,
  posts,
  selectedCategory,
  onSelectCategory,
  loading,
  settings,
  builderSettings,
  onOpenCategoriesModal,
  heroSlides = []
}: MobileHomePresetsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/tours?search=${encodeURIComponent(searchTerm)}`);
  };

  const activePreset = (settings?.mobilePreset || builderSettings?.mobilePreset || preset || 'klook-explorer');

  // Common Tour Price Resolver
  const getTourPrice = (tour: Tour) => {
    const rawPrice = tour.discountPrice || tour.regularPrice || (tour as any).price || 0;
    return formatPrice(rawPrice);
  };

  const getOriginalPrice = (tour: Tour) => {
    if (tour.discountPrice && tour.regularPrice && tour.regularPrice > tour.discountPrice) {
      return formatPrice(tour.regularPrice);
    }
    return null;
  };

  const getCategoryIcon = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('water') || lower.includes('rafting') || lower.includes('beach') || lower.includes('dive')) return LucideIcons.Waves;
    if (lower.includes('atv') || lower.includes('quad') || lower.includes('adventure') || lower.includes('offroad')) return LucideIcons.Bike;
    if (lower.includes('volcano') || lower.includes('hiking') || lower.includes('trek') || lower.includes('mountain')) return LucideIcons.Mountain;
    if (lower.includes('culture') || lower.includes('temple') || lower.includes('history') || lower.includes('art')) return LucideIcons.Compass;
    if (lower.includes('car') || lower.includes('transfer') || lower.includes('driver')) return LucideIcons.Car;
    if (lower.includes('food') || lower.includes('culinary') || lower.includes('cooking')) return LucideIcons.Utensils;
    if (lower.includes('spa') || lower.includes('wellness') || lower.includes('massage')) return LucideIcons.Sparkles;
    return LucideIcons.MapPin;
  };

  // Safe fallback reviews if empty
  const displayReviews = reviews.length > 0 ? reviews.slice(0, 4) : [
    {
      id: 'rev-1',
      author: 'Sarah Jenkins',
      rating: 5,
      comment: 'The private driver and sunrise trek were absolutely world-class! Seamless booking on mobile.',
      country: 'Australia',
      date: 'Yesterday'
    },
    {
      id: 'rev-2',
      author: 'Markus Weber',
      rating: 5,
      comment: 'Flawless WhatsApp coordination, clean air-conditioned vehicles, and top-tier guides.',
      country: 'Germany',
      date: '3 days ago'
    }
  ];

  // Safe fallback blog posts
  const displayPosts = posts.length > 0 ? posts.slice(0, 4) : [
    {
      id: 'post-1',
      title: 'Top 10 Hidden Waterfalls in Northern Bali You Must Visit',
      excerpt: 'Escape the tourist crowds and explore pristine emerald pools and sacred cascades.',
      slug: 'hidden-waterfalls-bali',
      category: 'Insider Guides',
      readTime: '4 min read',
      featuredImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'post-2',
      title: 'The Ultimate Guide to Renting a Private Driver in Bali',
      excerpt: 'Everything you need to know about day charter rates, routes, and custom itineraries.',
      slug: 'bali-private-driver-guide',
      category: 'Travel Tips',
      readTime: '5 min read',
      featuredImage: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80'
    }
  ];

  // Helper for 2-column tour card (Klook Style)
  const renderKlookTwoColumnCard = (tour: Tour) => {
    const origPrice = getOriginalPrice(tour);
    const hasDiscount = !!origPrice;
    return (
      <Link
        key={tour.id}
        to={`/tours/${tour.slug || tour.id}`}
        className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <SmartImage
            src={tour.featuredImage || (tour.gallery?.[0] || (tour as any).images?.[0]) || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80'}
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            aspectRatio="auto"
            width={240}
            quality={75}
          />
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
              SALE
            </span>
          )}
          <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
            <LucideIcons.MapPin className="w-2.5 h-2.5 text-orange-400" />
            <span className="truncate max-w-[80px]">{tour.location || 'Bali'}</span>
          </span>
        </div>
        <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5 text-left">
          <div>
            <span className="text-[9px] font-black text-orange-500 uppercase tracking-wider block">
              {(tour as any).categoryName || (tour as any).category || tour.categoryId || 'Activity'}
            </span>
            <h4 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {tour.title}
            </h4>
          </div>
          <div className="pt-1 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <LucideIcons.Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-black text-gray-800">
                {tour.rating ? tour.rating.toFixed(1) : '4.9'}
              </span>
              <span className="text-[9px] text-gray-400">
                ({(tour.reviewsCount || (tour as any).reviewCount) || 120})
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            {origPrice && (
              <span className="text-[9px] text-gray-400 line-through">
                {origPrice}
              </span>
            )}
            <span className="text-xs font-black text-gray-900">
              {getTourPrice(tour)}
            </span>
            <span className="text-[8px] text-gray-500">/pax</span>
          </div>
        </div>
      </Link>
    );
  };

  // Helper for Horizontal Slider Card
  const renderHorizontalTourCard = (tour: Tour, badgeText?: string, badgeColor = 'bg-primary') => {
    return (
      <Link
        key={tour.id}
        to={`/tours/${tour.slug || tour.id}`}
        className="w-[78vw] max-w-[280px] shrink-0 snap-start bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm block text-left group"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          <SmartImage
            src={tour.featuredImage || (tour.gallery?.[0] || (tour as any).images?.[0]) || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=500&q=80'}
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            aspectRatio="auto"
            width={320}
            quality={75}
          />
          {badgeText && (
            <div className="absolute top-2.5 left-2.5">
              <span className={cn("px-2 py-0.5 text-white rounded-md text-[9px] font-black uppercase tracking-wider shadow-xs", badgeColor)}>
                {badgeText}
              </span>
            </div>
          )}
          <div className="absolute bottom-2.5 right-2.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[10px] font-black flex items-center gap-1">
            <LucideIcons.Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{tour.rating ? tour.rating.toFixed(1) : '4.9'}</span>
          </div>
        </div>
        <div className="p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
            <LucideIcons.Clock className="w-3 h-3 text-primary" />
            <span>{tour.duration || 'Full Day'}</span>
            <span>•</span>
            <LucideIcons.MapPin className="w-3 h-3 text-primary" />
            <span className="truncate max-w-[110px]">{tour.location || 'Bali'}</span>
          </div>
          <h4 className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors leading-snug line-clamp-2">
            {tour.title}
          </h4>
          <div className="pt-2 flex items-center justify-between border-t border-gray-50">
            <div>
              <span className="text-[9px] text-gray-400 font-medium block">Starting from</span>
              <span className="text-sm font-black text-primary">{getTourPrice(tour)}</span>
            </div>
            <span className="px-3 py-1.5 bg-primary/10 text-primary font-black text-[10px] uppercase tracking-wider rounded-lg">
              Book
            </span>
          </div>
        </div>
      </Link>
    );
  };

  /* =========================================================================
     PRESET 1: KLOOK EXPLORER (Requested 2-column grid for Featured & Favs)
     ========================================================================= */
  if (activePreset === 'klook-explorer') {
    return (
      <div className="bg-[#f8f9fa] pb-12 space-y-6">
        {/* Klook Header Bar */}
        <div className="bg-white px-4 pt-3 pb-4 border-b border-gray-100 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                K
              </span>
              <div>
                <span className="text-sm font-black text-gray-900 tracking-tight block leading-none">
                  {settings?.siteName || 'Tripbone'}
                </span>
                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">
                  Verified Local Partner
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onOpenCategoriesModal}
                className="p-2 rounded-xl bg-gray-50 text-gray-600 border border-gray-100 text-xs font-bold flex items-center gap-1"
              >
                <LucideIcons.LayoutGrid className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-[10px]">Filter</span>
              </button>
            </div>
          </div>

          {/* Search Pill */}
          <form onSubmit={handleSearch} className="relative">
            <LucideIcons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tours, ATV, car rental, tickets..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-xs"
            >
              <LucideIcons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* 1. Hero / Promo Flash Banner */}
        <div className="px-4">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="space-y-1 max-w-[70%]">
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-xs rounded text-[9px] font-black uppercase tracking-wider">
                  Instant Confirmation
                </span>
                <h3 className="text-base font-black leading-tight drop-shadow-xs">
                  Discover Best Bali Adventures
                </h3>
                <p className="text-[10px] text-orange-100 font-medium">
                  Free cancellation · English speaking guides · Best price
                </p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                <LucideIcons.Zap className="w-6 h-6 text-amber-200 fill-amber-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Category Icons Row */}
        <div className="px-4">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => onSelectCategory('all')}
              className={cn(
                "flex flex-col items-center gap-1.5 shrink-0 p-2 rounded-xl transition-all",
                selectedCategory === 'all' ? "text-orange-600 font-black" : "text-gray-500 font-medium"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-transform",
                selectedCategory === 'all' ? "bg-orange-500 text-white scale-105" : "bg-white text-gray-700 border border-gray-100"
              )}>
                <LucideIcons.Compass className="w-5 h-5" />
              </div>
              <span className="text-[10px] whitespace-nowrap">All Tours</span>
            </button>

            {categories.slice(0, 6).map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 shrink-0 p-2 rounded-xl transition-all",
                    isActive ? "text-orange-600 font-black" : "text-gray-500 font-medium"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-transform",
                    isActive ? "bg-orange-500 text-white scale-105" : "bg-white text-gray-700 border border-gray-100"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] whitespace-nowrap">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. FEATURED TOURS: 2-COLUMN GRID (Klook Signature Layout) */}
        <div className="px-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 bg-orange-500 rounded-full" />
              <h3 className="text-base font-black text-gray-900 tracking-tight">
                Featured Tours
              </h3>
            </div>
            <Link to="/tours" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-0.5">
              View All <LucideIcons.ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filteredTours.slice(0, 6).map(tour => renderKlookTwoColumnCard(tour))}
          </div>
        </div>

        {/* 3. CAR RENTAL & PRIVATE DRIVER SHOWCASE CARD */}
        <div className="px-4">
          <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <LucideIcons.Car className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900">Bali Private Car & Chauffeur</h4>
                  <p className="text-[10px] text-gray-500 font-medium">Custom 10-Hour Charter with English Driver</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[9px] font-bold">
                Available
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100 text-center">
              <div className="space-y-0.5">
                <span className="text-[9px] text-gray-400 block font-medium">Capacity</span>
                <span className="text-[11px] font-bold text-gray-800">4-7 Seats</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-gray-400 block font-medium">Petrol & Toll</span>
                <span className="text-[11px] font-bold text-gray-800">Included</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-gray-400 block font-medium">Rate / Day</span>
                <span className="text-[11px] font-black text-orange-600">{formatPrice(45)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Link
                to="/car-rental"
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-xs text-center shadow-sm hover:bg-orange-600 transition-colors"
              >
                Book Private Chauffeur
              </Link>
              <a
                href={`https://wa.me/${(settings?.whatsappNumber || '+6281234567890').replace(/[^0-9]/g, '')}?text=Hi,%20I%20would%20like%20to%20inquire%20about%20Bali%20Private%20Car%20Rental`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl"
              >
                <LucideIcons.MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* 4. GUEST FAVORITES: 2-COLUMN GRID (Klook Signature Layout) */}
        <div className="px-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 bg-amber-500 rounded-full" />
              <h3 className="text-base font-black text-gray-900 tracking-tight">
                Guest Favorites
              </h3>
            </div>
            <Link to="/tours?sort=rating" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-0.5">
              View All <LucideIcons.ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {favoriteTours.slice(0, 6).map(tour => renderKlookTwoColumnCard(tour))}
          </div>
        </div>

        {/* 5. REVIEW SUMMARY (Klook Style Satisfaction Widget) */}
        <div className="px-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-base">
                  4.9
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <LucideIcons.Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold">
                    Superb · 1,480+ verified guest reviews
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[9px] font-black uppercase">
                Top Rated
              </span>
            </div>

            {/* Traveler Quote snippet */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">
                  {((displayReviews[0] as any)?.userName || (displayReviews[0] as any)?.author) || 'Verified Traveler'}
                </span>
                <span className="text-[9px] text-gray-400">
                  {((displayReviews[0] as any)?.nationality || (displayReviews[0] as any)?.country) || 'Verified Guest'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 italic leading-relaxed line-clamp-2">
                "{displayReviews[0]?.comment || 'Everything was perfectly organized from start to finish. Friendly driver and breathtaking viewpoints!'}"
              </p>
            </div>
          </div>
        </div>

        {/* 6. BLOG / INSPIRATION CARD */}
        <div className="px-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 bg-blue-500 rounded-full" />
              <h3 className="text-base font-black text-gray-900 tracking-tight">
                Bali Travel Insights
              </h3>
            </div>
            <Link to="/blog" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-0.5">
              Articles <LucideIcons.ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {displayPosts.slice(0, 2).map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs block text-left group"
              >
                <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                  <SmartImage
                    src={post.featuredImage || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80'}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    aspectRatio="auto"
                    width={200}
                    quality={75}
                  />
                </div>
                <div className="p-2.5 space-y-1">
                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-wider block">
                    {post.category || 'Guide'}
                  </span>
                  <h5 className="text-[11px] font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors">
                    {post.title}
                  </h5>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer Quick Contact Bar */}
        <div className="px-4 pt-4 border-t border-gray-200 text-center space-y-2">
          <p className="text-[10px] text-gray-400">
            © {new Date().getFullYear()} {settings?.siteName || 'Tripbone'}. Official Licensed Operator.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 font-medium">
            <Link to="/about" className="hover:text-orange-500">About Us</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-orange-500">Support Desk</Link>
            <span>•</span>
            <Link to="/legal/terms" className="hover:text-orange-500">Terms</Link>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     PRESET 2: GETYOURGUIDE ACTIVITY
     ========================================================================= */
  if (activePreset === 'getyourguide-activity') {
    return (
      <div className="bg-white pb-12 space-y-7">
        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs">
              GYG
            </span>
            <span className="font-extrabold text-sm text-gray-900">{settings?.siteName || 'Tripbone'}</span>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
            {tours.length}+ Activities
          </span>
        </div>

        {/* 1. Hero & Search */}
        <div className="px-4 space-y-3">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight text-left">
            Unforgettable things to do in Bali
          </h2>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by activity, destination..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
            <LucideIcons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
          </form>
        </div>

        {/* 2. Featured Tours (Vertical Detailed List) */}
        <div className="px-4 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900">Recommended Activities</h3>
            <Link to="/tours" className="text-xs font-bold text-blue-600">See all</Link>
          </div>
          <div className="space-y-3">
            {filteredTours.slice(0, 4).map((tour) => (
              <Link
                key={tour.id}
                to={`/tours/${tour.slug || tour.id}`}
                className="flex gap-3 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-xs hover:border-blue-200 transition-all"
              >
                <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-gray-100 relative">
                  <SmartImage
                    src={tour.featuredImage || (tour.gallery?.[0] || (tour as any).images?.[0]) || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=300&q=80'}
                    alt={tour.title}
                    className="w-full h-full object-cover"
                    aspectRatio="auto"
                    width={180}
                    quality={75}
                  />
                  <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                    Top Pick
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                      <LucideIcons.Clock className="w-3 h-3 text-blue-600" />
                      <span>{tour.duration || 'Full day'}</span>
                      <span>•</span>
                      <span>Free Cancellation</span>
                    </div>
                    <h4 className="text-xs font-black text-gray-900 line-clamp-2 leading-snug">
                      {tour.title}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <LucideIcons.Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-black text-gray-800">{tour.rating ? tour.rating.toFixed(1) : '4.9'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 block">From</span>
                      <span className="text-xs font-black text-blue-600">{getTourPrice(tour)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Car Rental Banner */}
        <div className="px-4">
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-between text-left">
            <div className="space-y-1 max-w-[65%]">
              <span className="text-[9px] font-black text-blue-600 uppercase">Private Transportation</span>
              <h4 className="text-xs font-black text-gray-900">Custom Bali Chauffeur Charter</h4>
              <p className="text-[10px] text-gray-500">Full day air-conditioned private vehicle.</p>
            </div>
            <Link to="/car-rental" className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs">
              Explore
            </Link>
          </div>
        </div>

        {/* 4. Guest Favorites (Horizontal Carousel) */}
        <div className="space-y-3 text-left">
          <div className="px-4 flex justify-between items-center">
            <h3 className="text-base font-black text-gray-900">Top Rated Experiences</h3>
            <Link to="/tours?sort=rating" className="text-xs font-bold text-blue-600">See all</Link>
          </div>
          <div className="flex overflow-x-auto gap-3 px-4 no-scrollbar">
            {favoriteTours.slice(0, 5).map(tour => renderHorizontalTourCard(tour, 'Bestseller', 'bg-blue-600'))}
          </div>
        </div>

        {/* 5. Review Summary */}
        <div className="px-4">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left space-y-2">
            <div className="flex items-center gap-2">
              <LucideIcons.CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-black text-gray-900">98% Verified Guest Satisfaction</span>
            </div>
            <p className="text-xs text-gray-500">
              Thousands of international travelers trust us for authentic Balinese journeys.
            </p>
          </div>
        </div>

        {/* 6. Blog Card */}
        <div className="px-4 space-y-3 text-left">
          <h3 className="text-base font-black text-gray-900">Travel Guides & Tips</h3>
          <div className="grid grid-cols-2 gap-3">
            {displayPosts.slice(0, 2).map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="rounded-xl overflow-hidden border border-gray-100 block">
                <div className="aspect-[16/10] bg-gray-100">
                  <SmartImage src={post.featuredImage || ''} alt={post.title} className="w-full h-full object-cover" aspectRatio="auto" width={180} quality={75} />
                </div>
                <div className="p-2 space-y-1">
                  <h5 className="text-[11px] font-bold text-gray-900 line-clamp-2">{post.title}</h5>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {settings?.siteName}. Powered by Tripbone SaaS.
        </div>
      </div>
    );
  }

  /* =========================================================================
     PRESET 3: AIRBNB EXPERIENCES (Photo-First & Authentic)
     ========================================================================= */
  if (activePreset === 'airbnb-experiences') {
    return (
      <div className="bg-white pb-12 space-y-8 text-left">
        {/* Header Search Capsule */}
        <div className="px-4 pt-3 sticky top-0 bg-white/95 backdrop-blur-md z-30 pb-2 border-b border-gray-100">
          <form onSubmit={handleSearch} className="flex items-center gap-3 p-3 bg-white rounded-full border border-gray-200 shadow-md">
            <LucideIcons.Search className="w-4 h-4 text-rose-500 ml-1" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Where in Bali? · Any day · Add guests"
              className="flex-1 text-xs font-bold text-gray-900 focus:outline-none placeholder:text-gray-400"
            />
            <div className="p-1.5 bg-rose-500 text-white rounded-full">
              <LucideIcons.SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
          </form>
        </div>

        {/* 1. Hero Cover */}
        <div className="px-4">
          <div className="relative rounded-3xl overflow-hidden aspect-[16/9] bg-gray-900">
            <SmartImage
              src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80"
              alt="Bali Experiences"
              className="w-full h-full object-cover opacity-80"
              aspectRatio="auto"
              width={600}
              quality={80}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Authentic Host Experiences</span>
              <h2 className="text-xl font-black">Immerse in Genuine Balinese Living</h2>
            </div>
          </div>
        </div>

        {/* 2. Featured Tours (Airbnb Soft Photo Scroll) */}
        <div className="space-y-3">
          <div className="px-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-gray-900">Top-rated Experiences</h3>
            <Link to="/tours" className="text-xs font-bold text-gray-900 underline">Show all</Link>
          </div>
          <div className="flex overflow-x-auto gap-4 px-4 no-scrollbar">
            {filteredTours.slice(0, 5).map((tour) => (
              <Link key={tour.id} to={`/tours/${tour.slug || tour.id}`} className="w-[72vw] shrink-0 block group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 relative mb-2">
                  <SmartImage src={tour.featuredImage || ''} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" aspectRatio="auto" width={300} quality={75} />
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-white/90 backdrop-blur-xs text-gray-900 rounded-full text-[9px] font-black uppercase">
                    Guest favorite
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-900">
                    <LucideIcons.Star className="w-3 h-3 text-rose-500 fill-rose-500" />
                    <span>{tour.rating ? tour.rating.toFixed(1) : '4.95'}</span>
                    <span className="text-gray-400">({(tour.reviewsCount || (tour as any).reviewCount) || 98})</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{tour.title}</h4>
                  <p className="text-xs font-black text-gray-900">From {getTourPrice(tour)} <span className="font-normal text-gray-500">/ person</span></p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Car Rental Showcase */}
        <div className="px-4">
          <div className="rounded-3xl border border-gray-200 p-5 space-y-3 bg-stone-50">
            <span className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Private Chauffeur</span>
            <h4 className="text-base font-black text-gray-900">Travel at Your Own Rhythm</h4>
            <p className="text-xs text-gray-600 leading-relaxed">Book a certified local Balinese private driver with modern air-conditioned MPVs.</p>
            <Link to="/car-rental" className="inline-block px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold">
              View Fleet & Rates
            </Link>
          </div>
        </div>

        {/* 4. Guest Favorites (2-Column) */}
        <div className="px-4 space-y-3">
          <h3 className="text-lg font-black text-gray-900">Beloved by Travelers</h3>
          <div className="grid grid-cols-2 gap-3">
            {favoriteTours.slice(0, 4).map(tour => renderKlookTwoColumnCard(tour))}
          </div>
        </div>

        {/* 5. Review Summary */}
        <div className="px-4">
          <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-2">
            <h4 className="text-sm font-black text-gray-900">"The highlight of our honeymoon"</h4>
            <p className="text-xs text-gray-600 italic">"Our guide was so warm and knowledgeable. We felt safe, respected, and truly immersed in Bali."</p>
            <span className="text-[10px] font-bold text-gray-400 block">— Jessica & Liam, United Kingdom</span>
          </div>
        </div>

        {/* 6. Blog Card */}
        <div className="px-4 space-y-3">
          <h3 className="text-lg font-black text-gray-900">Stories from Bali</h3>
          <div className="space-y-2">
            {displayPosts.slice(0, 2).map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="flex gap-3 items-center p-2 rounded-xl border border-gray-100">
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  <SmartImage src={p.featuredImage || ''} alt={p.title} className="w-full h-full object-cover" aspectRatio="auto" width={100} quality={75} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900 line-clamp-1">{p.title}</h5>
                  <span className="text-[9px] text-gray-400">{p.readTime || '3 min read'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {settings?.siteName || 'Tripbone'}.
        </div>
      </div>
    );
  }

  /* =========================================================================
     PRESET 4: VIATOR CLASSIC
     ========================================================================= */
  if (activePreset === 'viator-classic') {
    return (
      <div className="bg-[#f2f4f5] pb-12 space-y-6 text-left">
        {/* Header */}
        <div className="bg-[#004f44] text-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-black tracking-tight">{settings?.siteName || 'Tripbone'}</h1>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">Viator Standard</span>
          </div>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="What do you want to explore?"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white text-gray-900 text-xs font-bold focus:outline-none"
            />
            <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#004f44]" />
          </form>
        </div>

        {/* 1. Hero & Trust */}
        <div className="px-4">
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LucideIcons.ShieldCheck className="w-5 h-5 text-[#004f44]" />
              <span className="text-xs font-bold text-gray-800">Reserve Now & Pay Later</span>
            </div>
            <span className="text-[10px] font-black text-[#004f44]">Free Cancellation</span>
          </div>
        </div>

        {/* 2. Featured Tours (Likely to Sell Out Badge) */}
        <div className="px-4 space-y-3">
          <h3 className="text-base font-black text-gray-900">Featured Bali Day Trips</h3>
          <div className="grid grid-cols-2 gap-3">
            {filteredTours.slice(0, 6).map(tour => (
              <Link key={tour.id} to={`/tours/${tour.slug || tour.id}`} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-xs block group">
                <div className="aspect-[4/3] bg-gray-100 relative">
                  <SmartImage src={tour.featuredImage || ''} alt={tour.title} className="w-full h-full object-cover" aspectRatio="auto" width={220} quality={75} />
                  <span className="absolute top-2 left-2 bg-[#d93b3b] text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                    Likely to Sell Out
                  </span>
                </div>
                <div className="p-2.5 space-y-1">
                  <h4 className="text-xs font-bold text-gray-900 line-clamp-2 group-hover:text-[#004f44]">{tour.title}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-gray-600 font-bold">
                    <LucideIcons.Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{tour.rating ? tour.rating.toFixed(1) : '4.9'}</span>
                  </div>
                  <p className="text-xs font-black text-gray-900">{getTourPrice(tour)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Car Rental Card */}
        <div className="px-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
            <h4 className="text-xs font-black text-gray-900">Airport Transfer & Private Transport</h4>
            <p className="text-[11px] text-gray-500">Direct pickup at Denpasar DPS airport with name sign.</p>
            <Link to="/car-rental" className="block text-center py-2 bg-[#004f44] text-white text-xs font-bold rounded-lg">
              Book Transfer
            </Link>
          </div>
        </div>

        {/* 4. Guest Favorites */}
        <div className="px-4 space-y-3">
          <h3 className="text-base font-black text-gray-900">Top Rated Experiences</h3>
          <div className="grid grid-cols-2 gap-3">
            {favoriteTours.slice(0, 4).map(tour => renderKlookTwoColumnCard(tour))}
          </div>
        </div>

        {/* 5. Review Summary */}
        <div className="px-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 text-center space-y-1">
            <span className="text-xl font-black text-[#004f44]">4.9 / 5.0</span>
            <p className="text-xs text-gray-600 font-bold">Over 2,500 5-Star Reviews on Tripadvisor & Viator</p>
          </div>
        </div>

        {/* 6. Blog */}
        <div className="px-4 space-y-3">
          <h3 className="text-base font-black text-gray-900">Bali Travel Guides</h3>
          <div className="space-y-2">
            {displayPosts.slice(0, 2).map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="block p-3 bg-white rounded-xl border border-gray-200">
                <h5 className="text-xs font-bold text-gray-900">{p.title}</h5>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pt-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {settings?.siteName}.
        </div>
      </div>
    );
  }

  /* =========================================================================
     PRESET 5: TRIPADVISOR WANDERER
     ========================================================================= */
  if (activePreset === 'tripadvisor-wanderer') {
    return (
      <div className="bg-white pb-12 space-y-6 text-left">
        {/* Tripadvisor Green Header */}
        <div className="px-4 pt-3 pb-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#00aa6c] flex items-center justify-center text-white font-black text-sm">
              🦉
            </span>
            <span className="font-black text-sm text-gray-900">{settings?.siteName || 'Tripbone'}</span>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 bg-[#00aa6c]/10 text-[#00aa6c] rounded-full">
            Travelers' Choice 2025
          </span>
        </div>

        {/* 1. Hero & Search */}
        <div className="px-4 space-y-3">
          <h2 className="text-xl font-black text-gray-900">Explore Bali with Top-Ranked Local Guides</h2>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Find tours, drivers, activities..."
              className="w-full pl-10 pr-3 py-2.5 rounded-full border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#00aa6c]"
            />
            <LucideIcons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </form>
        </div>

        {/* 2. Featured Tours (Green Bubble Rating) */}
        <div className="px-4 space-y-3">
          <h3 className="text-base font-black text-gray-900">Top Things to Do</h3>
          <div className="grid grid-cols-2 gap-3">
            {filteredTours.slice(0, 6).map(tour => (
              <Link key={tour.id} to={`/tours/${tour.slug || tour.id}`} className="rounded-2xl border border-gray-100 overflow-hidden shadow-xs block group">
                <div className="aspect-[4/3] bg-gray-100 relative">
                  <SmartImage src={tour.featuredImage || ''} alt={tour.title} className="w-full h-full object-cover" aspectRatio="auto" width={220} quality={75} />
                  <span className="absolute top-2 left-2 bg-[#00aa6c] text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                    #1 in Bali
                  </span>
                </div>
                <div className="p-2.5 space-y-1">
                  <h4 className="text-xs font-bold text-gray-900 line-clamp-2 group-hover:text-[#00aa6c]">{tour.title}</h4>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00aa6c]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00aa6c]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00aa6c]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00aa6c]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00aa6c]" />
                    <span className="text-[10px] text-gray-500 font-bold ml-1">{(tour.reviewsCount || (tour as any).reviewCount) || 340}</span>
                  </div>
                  <p className="text-xs font-black text-gray-900">{getTourPrice(tour)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Car Rental Showcase */}
        <div className="px-4">
          <div className="p-4 rounded-2xl bg-[#00aa6c]/5 border border-[#00aa6c]/20 space-y-2">
            <h4 className="text-xs font-black text-gray-900">Bali Chauffeur & Private Day Hire</h4>
            <p className="text-[11px] text-gray-600">Rated Excellent by 1,200+ international vacationers.</p>
            <Link to="/car-rental" className="inline-block px-3 py-1.5 bg-[#00aa6c] text-white rounded-lg text-xs font-bold">
              Check Driver Availability
            </Link>
          </div>
        </div>

        {/* 4. Guest Favorites */}
        <div className="px-4 space-y-3">
          <h3 className="text-base font-black text-gray-900">Travelers' Choice Winners</h3>
          <div className="grid grid-cols-2 gap-3">
            {favoriteTours.slice(0, 4).map(tour => renderKlookTwoColumnCard(tour))}
          </div>
        </div>

        {/* 5. Review Breakdown */}
        <div className="px-4">
          <div className="p-4 rounded-2xl border border-gray-100 space-y-2 bg-gray-50">
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>Service & Hospitality</span>
              <span className="text-[#00aa6c]">5.0 / 5.0</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>Vehicle Cleanliness & Safety</span>
              <span className="text-[#00aa6c]">4.9 / 5.0</span>
            </div>
          </div>
        </div>

        {/* 6. Blog */}
        <div className="px-4 space-y-3">
          <h3 className="text-base font-black text-gray-900">Forum & Travel Inspiration</h3>
          <div className="grid grid-cols-2 gap-3">
            {displayPosts.slice(0, 2).map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="rounded-xl border border-gray-100 overflow-hidden block">
                <div className="aspect-[16/10] bg-gray-100">
                  <SmartImage src={p.featuredImage || ''} alt={p.title} className="w-full h-full object-cover" aspectRatio="auto" width={180} quality={75} />
                </div>
                <div className="p-2">
                  <h5 className="text-[11px] font-bold text-gray-900 line-clamp-1">{p.title}</h5>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pt-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {settings?.siteName}.
        </div>
      </div>
    );
  }

  /* =========================================================================
     PRESET 6: LUXURY CONCIERGE (Obsidian & Champagne Gold)
     ========================================================================= */
  if (activePreset === 'luxury-concierge') {
    return (
      <div className="bg-[#0b0f19] text-white pb-12 space-y-8 text-left font-serif">
        {/* Luxury Gold Header */}
        <div className="px-4 pt-4 pb-3 border-b border-amber-500/20 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase tracking-[0.3em] text-amber-400 block font-sans font-bold">The Luxury Collection</span>
            <h1 className="text-base font-black tracking-wider text-white font-serif">{settings?.siteName || 'Tripbone'}</h1>
          </div>
          <span className="text-[10px] font-sans font-bold px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
            VIP Desk
          </span>
        </div>

        {/* 1. Hero & Search */}
        <div className="px-4 space-y-3 font-sans">
          <p className="text-xs text-amber-200/70 uppercase tracking-widest font-medium">Bespoke Journeys · Private Concierge</p>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search private bespoke expeditions..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-amber-500/30 text-xs font-medium text-white focus:outline-none focus:border-amber-400"
            />
            <LucideIcons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
          </form>
        </div>

        {/* 2. Featured Tours (VIP Luxury Cards) */}
        <div className="px-4 space-y-4 font-sans">
          <h3 className="text-base font-bold text-amber-300 font-serif tracking-wide">Signature Private Itineraries</h3>
          <div className="space-y-4">
            {filteredTours.slice(0, 3).map(tour => (
              <Link key={tour.id} to={`/tours/${tour.slug || tour.id}`} className="block rounded-2xl overflow-hidden border border-amber-500/20 bg-white/5 group">
                <div className="aspect-[16/9] bg-gray-900 relative">
                  <SmartImage src={tour.featuredImage || ''} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" aspectRatio="auto" width={500} quality={80} />
                  <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md border border-amber-500/30 text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Exclusive Access
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-bold text-white font-serif group-hover:text-amber-300 transition-colors">{tour.title}</h4>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
                    <span className="text-amber-400 font-bold">Private Journey</span>
                    <span className="text-sm font-black text-amber-300">{getTourPrice(tour)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Luxury Chauffeur Fleet Card */}
        <div className="px-4 font-sans">
          <div className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent space-y-3">
            <span className="text-[9px] uppercase tracking-widest text-amber-400 font-black">Executive Chauffeur</span>
            <h4 className="text-sm font-bold text-white font-serif">Toyota Alphard & Mercedes V-Class</h4>
            <p className="text-xs text-gray-300">White-glove private airport & island charter with suited concierge drivers.</p>
            <Link to="/car-rental" className="inline-block px-4 py-2 bg-amber-500 text-black font-black text-xs rounded-xl">
              Reserve Executive Chauffeur
            </Link>
          </div>
        </div>

        {/* 4. Guest Favorites (2-Column) */}
        <div className="px-4 space-y-3 font-sans">
          <h3 className="text-base font-bold text-amber-300 font-serif">Curated Masterpieces</h3>
          <div className="grid grid-cols-2 gap-3">
            {favoriteTours.slice(0, 4).map(tour => renderKlookTwoColumnCard(tour))}
          </div>
        </div>

        {/* 5. VIP Review */}
        <div className="px-4 font-sans">
          <div className="p-4 rounded-2xl border border-amber-500/20 bg-white/5 space-y-2">
            <div className="flex gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => <LucideIcons.Star key={i} className="w-3 h-3 fill-amber-400" />)}
            </div>
            <p className="text-xs text-gray-300 italic font-serif leading-relaxed">
              "The utmost discretion, impeccable comfort, and private temple access before any crowds arrived."
            </p>
            <span className="text-[10px] text-amber-400 font-bold block">— Verified Diplomatic Guest</span>
          </div>
        </div>

        {/* 6. Blog */}
        <div className="px-4 space-y-3 font-sans">
          <h3 className="text-base font-bold text-amber-300 font-serif">The Balinese Journal</h3>
          <div className="grid grid-cols-2 gap-3">
            {displayPosts.slice(0, 2).map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="rounded-xl border border-white/10 overflow-hidden block bg-white/5">
                <div className="aspect-[16/10] bg-gray-800">
                  <SmartImage src={p.featuredImage || ''} alt={p.title} className="w-full h-full object-cover" aspectRatio="auto" width={180} quality={75} />
                </div>
                <div className="p-2">
                  <h5 className="text-[11px] font-bold text-white line-clamp-1">{p.title}</h5>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pt-4 text-center text-xs text-gray-500 font-sans">
          © {new Date().getFullYear()} {settings?.siteName}. High Luxury Division.
        </div>
      </div>
    );
  }

  /* =========================================================================
     PRESET 7: BOUTIQUE MINIMALIST (Clean Scandinavian Monochrome)
     ========================================================================= */
  if (activePreset === 'boutique-minimalist') {
    return (
      <div className="bg-white text-gray-900 pb-12 space-y-7 text-left font-sans">
        {/* Minimal Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-black tracking-widest uppercase">{settings?.siteName || 'Tripbone'}</span>
          <span className="text-[10px] text-gray-400 font-mono">EDITION 2025</span>
        </div>

        {/* 1. Hero & Search */}
        <div className="px-5 space-y-3">
          <h2 className="text-2xl font-light tracking-tight text-gray-900 leading-tight">
            Curated Bali expeditions for discerning travelers.
          </h2>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search catalog..."
              className="w-full py-2.5 px-0 border-b border-gray-300 text-xs font-medium focus:outline-none focus:border-black transition-colors"
            />
            <LucideIcons.ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </form>
        </div>

        {/* 2. Featured Tours (Numbered Minimalist Cards) */}
        <div className="px-5 space-y-4">
          <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
            <span className="text-xs font-mono text-gray-400">01 / FEATURED</span>
            <Link to="/tours" className="text-xs font-bold text-gray-900 hover:underline">All</Link>
          </div>
          <div className="space-y-4">
            {filteredTours.slice(0, 3).map((tour, idx) => (
              <Link key={tour.id} to={`/tours/${tour.slug || tour.id}`} className="block group">
                <div className="aspect-[16/10] rounded-xl overflow-hidden bg-gray-50 mb-2">
                  <SmartImage src={tour.featuredImage || ''} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" aspectRatio="auto" width={400} quality={75} />
                </div>
                <div className="flex justify-between items-baseline">
                  <h4 className="text-xs font-bold text-gray-900">{tour.title}</h4>
                  <span className="text-xs font-mono font-bold">{getTourPrice(tour)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Car Rental */}
        <div className="px-5">
          <div className="border border-gray-200 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-mono text-gray-400">02 / MOBILITY</span>
            <h4 className="text-xs font-bold text-gray-900">Private Vehicle Charter</h4>
            <p className="text-xs text-gray-500">Dedicated local driver for up to 10 hours.</p>
            <Link to="/car-rental" className="inline-block text-xs font-bold underline mt-1">Book Chauffeur</Link>
          </div>
        </div>

        {/* 4. Guest Favorites (2-Column) */}
        <div className="px-5 space-y-3">
          <span className="text-[10px] font-mono text-gray-400">03 / POPULAR</span>
          <div className="grid grid-cols-2 gap-3">
            {favoriteTours.slice(0, 4).map(tour => renderKlookTwoColumnCard(tour))}
          </div>
        </div>

        {/* 5. Review */}
        <div className="px-5">
          <blockquote className="text-xs text-gray-600 border-l-2 border-black pl-3 italic">
            "{displayReviews[0]?.comment || 'Exceptional attention to detail and calm, knowledgeable drivers.'}"
          </blockquote>
        </div>

        {/* 6. Blog */}
        <div className="px-5 space-y-3">
          <span className="text-[10px] font-mono text-gray-400">04 / ESSAYS</span>
          <div className="space-y-2">
            {displayPosts.slice(0, 2).map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="block border-b border-gray-100 pb-2">
                <h5 className="text-xs font-bold text-gray-900">{p.title}</h5>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pt-4 text-center text-xs text-gray-400 font-mono">
          © {new Date().getFullYear()} {settings?.siteName}.
        </div>
      </div>
    );
  }

  /* =========================================================================
     PRESET 8: NORDIC ADVENTURE (Forest Green & Trail Badges)
     ========================================================================= */
  if (activePreset === 'nordic-adventure') {
    return (
      <div className="bg-[#14241d] text-[#e8f1ec] pb-12 space-y-6 text-left">
        {/* Header */}
        <div className="px-4 pt-3 pb-3 border-b border-emerald-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LucideIcons.Compass className="w-5 h-5 text-emerald-400" />
            <span className="font-black text-sm text-white">{settings?.siteName || 'Tripbone'}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-800 text-emerald-200 rounded">
            Alpine & Trail
          </span>
        </div>

        {/* 1. Hero & Search */}
        <div className="px-4 space-y-3">
          <h2 className="text-xl font-black text-white">Rugged Expeditions & Mountain Treks</h2>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search volcanoes, ATV trails, rafting..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#1d352b] border border-emerald-700/50 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
            />
            <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
          </form>
        </div>

        {/* 2. Featured Tours */}
        <div className="px-4 space-y-3">
          <h3 className="text-base font-black text-emerald-300">Active Expeditions</h3>
          <div className="grid grid-cols-2 gap-3">
            {filteredTours.slice(0, 6).map(tour => (
              <Link key={tour.id} to={`/tours/${tour.slug || tour.id}`} className="rounded-2xl border border-emerald-800/40 bg-[#1a3026] overflow-hidden block">
                <div className="aspect-[4/3] bg-emerald-950 relative">
                  <SmartImage src={tour.featuredImage || ''} alt={tour.title} className="w-full h-full object-cover opacity-90" aspectRatio="auto" width={220} quality={75} />
                  <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                    Trail Verified
                  </span>
                </div>
                <div className="p-2.5 space-y-1">
                  <h4 className="text-xs font-bold text-white line-clamp-2">{tour.title}</h4>
                  <p className="text-xs font-black text-emerald-300">{getTourPrice(tour)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. 4x4 Transport */}
        <div className="px-4">
          <div className="p-4 rounded-2xl bg-[#1d352b] border border-emerald-700/50 space-y-2">
            <h4 className="text-xs font-black text-white">4x4 Jeep & Transport Fleet</h4>
            <p className="text-xs text-emerald-200/80">Black lava caldera & mountain sunrise transfers.</p>
            <Link to="/car-rental" className="inline-block px-3 py-1.5 bg-emerald-500 text-[#14241d] font-black text-xs rounded-lg">
              Book Expedition Vehicle
            </Link>
          </div>
        </div>

        {/* 4. Guest Favorites (2-Column) */}
        <div className="px-4 space-y-3">
          <h3 className="text-base font-black text-emerald-300">Adventurer Favorites</h3>
          <div className="grid grid-cols-2 gap-3">
            {favoriteTours.slice(0, 4).map(tour => renderKlookTwoColumnCard(tour))}
          </div>
        </div>

        {/* 5. Review */}
        <div className="px-4">
          <div className="p-3 bg-[#1d352b] rounded-xl border border-emerald-800/60 text-xs text-emerald-200">
            "Mount Batur sunrise with hot springs was the most memorable morning of our lives."
          </div>
        </div>

        {/* 6. Blog */}
        <div className="px-4 space-y-3">
          <h3 className="text-base font-black text-emerald-300">Field Guides & Gear Lists</h3>
          <div className="grid grid-cols-2 gap-3">
            {displayPosts.slice(0, 2).map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="rounded-xl border border-emerald-800/40 overflow-hidden block bg-[#1a3026]">
                <div className="aspect-[16/10] bg-emerald-950">
                  <SmartImage src={p.featuredImage || ''} alt={p.title} className="w-full h-full object-cover" aspectRatio="auto" width={180} quality={75} />
                </div>
                <div className="p-2">
                  <h5 className="text-[11px] font-bold text-white line-clamp-1">{p.title}</h5>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pt-4 text-center text-xs text-emerald-400/50">
          © {new Date().getFullYear()} {settings?.siteName}. Nordic Expedition Engine.
        </div>
      </div>
    );
  }

  /* =========================================================================
     PRESET 9: TOKYO CYBER / URBAN NEON (Slate & Cyan)
     ========================================================================= */
  if (activePreset === 'tokyo-cyber') {
    return (
      <div className="bg-[#0f172a] text-slate-100 pb-12 space-y-6 text-left">
        {/* Header */}
        <div className="px-4 pt-3 pb-3 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono font-black text-sm text-cyan-400">{settings?.siteName || 'Tripbone'}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded">
            ⚡ LIVE SYNC
          </span>
        </div>

        {/* 1. Hero & Search */}
        <div className="px-4 space-y-3">
          <h2 className="text-xl font-black text-white">Instant QR Passes & Direct Bookings</h2>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search adventures..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
          </form>
        </div>

        {/* 2. Featured Tours */}
        <div className="px-4 space-y-3">
          <h3 className="text-base font-black text-cyan-400 font-mono">⚡ FEATURED EXPERIENCES</h3>
          <div className="grid grid-cols-2 gap-3">
            {filteredTours.slice(0, 6).map(tour => (
              <Link key={tour.id} to={`/tours/${tour.slug || tour.id}`} className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden block">
                <div className="aspect-[4/3] bg-slate-950 relative">
                  <SmartImage src={tour.featuredImage || ''} alt={tour.title} className="w-full h-full object-cover" aspectRatio="auto" width={220} quality={75} />
                  <span className="absolute top-2 left-2 bg-cyan-500 text-black text-[8px] font-mono font-black px-1.5 py-0.5 rounded">
                    INSTANT PASS
                  </span>
                </div>
                <div className="p-2.5 space-y-1">
                  <h4 className="text-xs font-bold text-white line-clamp-2">{tour.title}</h4>
                  <p className="text-xs font-mono font-black text-cyan-400">{getTourPrice(tour)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Smart Fleet */}
        <div className="px-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-2">
            <h4 className="text-xs font-mono font-black text-cyan-400">SMART VAN & CHAUFFEUR</h4>
            <p className="text-xs text-slate-400">Real-time GPS tracking and instant WhatsApp dispatch.</p>
            <Link to="/car-rental" className="inline-block px-3 py-1.5 bg-cyan-400 text-slate-950 font-black text-xs rounded-lg">
              Book Smart Transport
            </Link>
          </div>
        </div>

        {/* 4. Guest Favorites (2-Column) */}
        <div className="px-4 space-y-3">
          <h3 className="text-base font-black text-cyan-400 font-mono">★ TOP RATED</h3>
          <div className="grid grid-cols-2 gap-3">
            {favoriteTours.slice(0, 4).map(tour => renderKlookTwoColumnCard(tour))}
          </div>
        </div>

        {/* 5. Review */}
        <div className="px-4">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono">
            [99.4% Uptime · 4.98 Rating · Instant Digital Voucher]
          </div>
        </div>

        {/* 6. Blog */}
        <div className="px-4 space-y-3">
          <h3 className="text-base font-black text-cyan-400 font-mono">INTEL & LOGS</h3>
          <div className="grid grid-cols-2 gap-3">
            {displayPosts.slice(0, 2).map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="rounded-xl border border-slate-800 overflow-hidden block bg-slate-900">
                <div className="aspect-[16/10] bg-slate-950">
                  <SmartImage src={p.featuredImage || ''} alt={p.title} className="w-full h-full object-cover" aspectRatio="auto" width={180} quality={75} />
                </div>
                <div className="p-2">
                  <h5 className="text-[11px] font-bold text-white line-clamp-1">{p.title}</h5>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pt-4 text-center text-xs text-slate-500 font-mono">
          © {new Date().getFullYear()} {settings?.siteName}.
        </div>
      </div>
    );
  }

  /* =========================================================================
     PRESET 10: ISLAND BREEZE (Tropical Resort & Turquoise Sunset)
     ========================================================================= */
  return (
    <div className="bg-[#f0fdfa] pb-12 space-y-6 text-left">
      {/* Tropical Header */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 text-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LucideIcons.Palmtree className="w-5 h-5 text-amber-300" />
            <h1 className="text-base font-black tracking-tight">{settings?.siteName || 'Tripbone'}</h1>
          </div>
          <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
            Bali Paradise
          </span>
        </div>
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search beaches, islands, secret coves..."
            className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-white text-gray-900 text-xs font-bold focus:outline-none"
          />
          <LucideIcons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
        </form>
      </div>

      {/* 1. Hero Promo */}
      <div className="px-4">
        <div className="p-4 rounded-2xl bg-white border border-teal-100 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase text-teal-600">Island Escape</span>
            <h4 className="text-xs font-black text-gray-900">Nusa Penida & Gili Speedboats</h4>
          </div>
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-black">
            From $35
          </span>
        </div>
      </div>

      {/* 2. Featured Tours (2-Column Grid) */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-gray-900">Tropical Highlights</h3>
          <Link to="/tours" className="text-xs font-bold text-teal-600">See All</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filteredTours.slice(0, 6).map(tour => renderKlookTwoColumnCard(tour))}
        </div>
      </div>

      {/* 3. Car Rental */}
      <div className="px-4">
        <div className="p-4 rounded-2xl bg-teal-600 text-white space-y-2 shadow-sm">
          <h4 className="text-xs font-black">Bali Private Chauffeur & Island Tour</h4>
          <p className="text-[11px] text-teal-100">Cool air-conditioned vans with friendly local Balinese driver.</p>
          <Link to="/car-rental" className="inline-block px-3 py-1.5 bg-amber-400 text-gray-900 font-black text-xs rounded-xl">
            Book Island Driver
          </Link>
        </div>
      </div>

      {/* 4. Guest Favorites (2-Column Grid) */}
      <div className="px-4 space-y-3">
        <h3 className="text-base font-black text-gray-900">Sun & Sea Favorites</h3>
        <div className="grid grid-cols-2 gap-3">
          {favoriteTours.slice(0, 4).map(tour => renderKlookTwoColumnCard(tour))}
        </div>
      </div>

      {/* 5. Review Summary */}
      <div className="px-4">
        <div className="p-4 rounded-2xl bg-white border border-teal-100 space-y-1">
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => <LucideIcons.Star key={i} className="w-3 h-3 fill-amber-400" />)}
          </div>
          <p className="text-xs text-gray-600 italic">"The snorkeling with turtles was magical. Our driver Ketut was so helpful and kind!"</p>
        </div>
      </div>

      {/* 6. Blog */}
      <div className="px-4 space-y-3">
        <h3 className="text-base font-black text-gray-900">Island Secrets & Guides</h3>
        <div className="grid grid-cols-2 gap-3">
          {displayPosts.slice(0, 2).map(p => (
            <Link key={p.id} to={`/blog/${p.slug}`} className="rounded-xl border border-teal-100 overflow-hidden block bg-white">
              <div className="aspect-[16/10] bg-gray-100">
                <SmartImage src={p.featuredImage || ''} alt={p.title} className="w-full h-full object-cover" aspectRatio="auto" width={180} quality={75} />
              </div>
              <div className="p-2">
                <h5 className="text-[11px] font-bold text-gray-900 line-clamp-1">{p.title}</h5>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pt-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} {settings?.siteName}. Tropical Island Operator.
      </div>
    </div>
  );
}
