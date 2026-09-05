import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Tour, Category, Review, BlogPost, SiteSettings } from '../../types';
import { WebsiteBuilderSettings } from '../Admin/WebsiteBuilder';
import { useCurrency } from '../../lib/CurrencyContext';
import { cn } from '../../lib/utils';
import SmartImage from '../SmartImage';

export interface JoyTimeMobilePresetProps {
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

interface JoyTimePromoItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  promoCode: string;
  buttonText?: string;
  image: string;
  link: string;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
  gradientDirection?: string;
  overlayOpacity?: number;
}

export default function JoyTimeMobilePreset({
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
}: JoyTimeMobilePresetProps) {
  const navigate = useNavigate();
  const { formatPrice, selectedCurrency } = useCurrency();

  // Internal state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [isServiceSheetOpen, setIsServiceSheetOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'home' | 'product' | 'blog'>('home');
  const [sortOption, setSortOption] = useState<'popular' | 'rating' | 'price-asc' | 'price-desc'>('popular');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState('all');
  const [promoSlideIndex, setPromoSlideIndex] = useState(0);

  // JoyTime customization settings from tenant
  const joytimeCustomization = settings?.joytimeCustomization;
  const primaryColor = joytimeCustomization?.primaryColor || '#0284c7';
  const secondaryColor = joytimeCustomization?.secondaryColor || '#0369a1';
  const accentColor = joytimeCustomization?.accentColor || '#f59e0b';
  const headerBgColor = joytimeCustomization?.headerBgColor || '#ffffff';

  // Multi-Banner display options
  const bannerLayout = joytimeCustomization?.bannerLayout || 'slider';
  const bannerAutoplay = joytimeCustomization?.bannerAutoplay !== false;
  const bannerInterval = joytimeCustomization?.bannerAutoplayInterval || 4500;
  const showBannerDots = joytimeCustomization?.showBannerDots !== false;
  const showBannerCounter = joytimeCustomization?.showBannerCounter ?? true;

  // Touch swipe and hover state for banner slider
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isBannerHovered, setIsBannerHovered] = useState(false);

  // Global event listeners for bottom navigation actions
  useEffect(() => {
    const handleToggleService = () => {
      setIsServiceSheetOpen(prev => !prev);
    };
    const handleScrollPromo = () => {
      const promoEl = document.getElementById('joytime-promotion-section');
      if (promoEl) {
        promoEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/tours');
      }
    };
    window.addEventListener('service-sheet:toggle', handleToggleService);
    window.addEventListener('promotion:scroll', handleScrollPromo);
    return () => {
      window.removeEventListener('service-sheet:toggle', handleToggleService);
      window.removeEventListener('promotion:scroll', handleScrollPromo);
    };
  }, [navigate]);

  // Favorites state synced with localStorage
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tripbone_favorite_tours');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Recently viewed tours from localStorage
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recently_viewed_tours');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (tourId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavoriteIds(prev => {
      const next = prev.includes(tourId) ? prev.filter(id => id !== tourId) : [...prev, tourId];
      try {
        localStorage.setItem('tripbone_favorite_tours', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  const recordRecentlyViewed = (tourId: string) => {
    setRecentlyViewedIds(prev => {
      const filtered = prev.filter(id => id !== tourId);
      const next = [tourId, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('recently_viewed_tours', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // Pricing Helpers
  const getTourPrice = (tour: Tour) => {
    const rawPrice = tour.discountPrice || tour.regularPrice || (tour as any).price || 0;
    return formatPrice(rawPrice);
  };

  const getSecondaryPrice = (tour: Tour) => {
    const rawPrice = tour.discountPrice || tour.regularPrice || (tour as any).price || 0;
    // If main currency is not USD, provide estimated USD reference matching reference screenshot
    if (selectedCurrency !== 'USD' && rawPrice > 0) {
      const usdApprox = selectedCurrency === 'IDR' ? Math.round(rawPrice / 16000) : selectedCurrency === 'VND' ? Math.round(rawPrice / 25000) : null;
      if (usdApprox !== null && usdApprox > 0) {
        return `~ USD ${usdApprox}`;
      }
    }
    return null;
  };

  const getOriginalPrice = (tour: Tour) => {
    if (tour.discountPrice && tour.regularPrice && tour.regularPrice > tour.discountPrice) {
      return formatPrice(tour.regularPrice);
    }
    return null;
  };

  // Category Map & Name Resolver
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(categories)) {
      categories.forEach((c: any) => {
        if (c.id && c.name) map.set(c.id, c.name);
        if (c.slug && c.name) map.set(c.slug, c.name);
      });
    }
    return map;
  }, [categories]);

  const getCategoryName = (tour: Tour): string => {
    if ((tour as any).categoryName && !/^[A-Za-z0-9_-]{12,}$/.test((tour as any).categoryName)) {
      return (tour as any).categoryName;
    }
    const catId = tour.categoryId || (tour as any).category;
    if (!catId) return 'Tour';
    if (categoryMap.has(catId)) return categoryMap.get(catId)!;
    const found = categories.find((c: any) => c.id === catId || c.slug === catId || c.name?.toLowerCase() === catId?.toLowerCase());
    if (found && found.name) return found.name;
    return 'Experience';
  };

  // Dynamic Distinct Locations extracted from real database tours
  const dynamicLocations = useMemo(() => {
    const locs = new Set<string>();
    tours.forEach(t => {
      if (t.location && t.location.trim()) {
        const cleanLoc = t.location.trim().split(',')[0].trim();
        if (cleanLoc.length > 1) locs.add(cleanLoc);
      }
    });
    return Array.from(locs).slice(0, 6);
  }, [tours]);

  // Top Trends Tours (sorted by booked count or rating popularity)
  const topTrendsTours = useMemo(() => {
    let list = [...tours];
    if (selectedLocation !== 'all') {
      list = list.filter(t => t.location?.toLowerCase().includes(selectedLocation.toLowerCase()));
    }
    return list.sort((a, b) => {
      const countA = (a as any).bookedCount || ((a.rating || 4.8) * 120);
      const countB = (b as any).bookedCount || ((b.rating || 4.8) * 120);
      return countB - countA;
    });
  }, [tours, selectedLocation]);

  // Recently Viewed Tours data
  const recentlyViewedTours = useMemo(() => {
    if (recentlyViewedIds.length > 0) {
      const matched = recentlyViewedIds
        .map(id => tours.find(t => t.id === id || t.slug === id))
        .filter(Boolean) as Tour[];
      if (matched.length > 0) return matched;
    }
    // Fallback to top rated favorites if user hasn't visited any yet
    return (favoriteTours && favoriteTours.length > 0 ? favoriteTours : tours).slice(0, 4);
  }, [tours, recentlyViewedIds, favoriteTours]);

  // Dynamic Ideal Destinations computed from real tours
  const destinationBento = useMemo(() => {
    const map = new Map<string, { name: string; count: number; image: string }>();
    tours.forEach(t => {
      const loc = t.location?.trim().split(',')[0].trim();
      if (!loc) return;
      if (!map.has(loc)) {
        map.set(loc, {
          name: loc,
          count: 1,
          image: t.featuredImage || t.gallery?.[0] || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80'
        });
      } else {
        const item = map.get(loc)!;
        item.count += 1;
        if (!item.image && t.featuredImage) item.image = t.featuredImage;
      }
    });
    return Array.from(map.values()).slice(0, 4);
  }, [tours]);

  // Real Promotional Banners from database (joytimeCustomization, heroSlides or discounted tours)
  const promoBanners: JoyTimePromoItem[] = useMemo(() => {
    // 0. Tenant custom JoyTime banners
    if (joytimeCustomization?.banners && joytimeCustomization.banners.length > 0) {
      return joytimeCustomization.banners.map((slide, idx) => ({
        id: slide.id || `custom-slide-${idx}`,
        badge: slide.badge || 'Travel like a VIP',
        title: slide.title || 'SPECIAL COMBO OFFER',
        subtitle: slide.subtitle || 'Fast Track, Chauffeur & Island Tour',
        promoCode: slide.promoCode || 'COMBO25',
        buttonText: slide.buttonText || 'Book Now',
        image: slide.image || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
        link: slide.link || '/tours',
        gradientFrom: slide.gradientFrom,
        gradientVia: slide.gradientVia,
        gradientTo: slide.gradientTo,
        gradientDirection: slide.gradientDirection,
        overlayOpacity: slide.overlayOpacity
      }));
    }
    // 1. If builder/settings has heroSlides
    if (heroSlides && heroSlides.length > 0) {
      return heroSlides.map((slide, idx) => ({
        id: `slide-${idx}`,
        badge: 'Travel like a VIP',
        title: slide.title || 'SPECIAL COMBO OFFER',
        subtitle: slide.subtitle || 'Fast Track, Chauffeur & Island Tour',
        promoCode: 'COMBO25',
        image: slide.imageUrl || slide.image,
        link: slide.link || '/tours'
      }));
    }
    // 2. Real discounted tours from database
    const discounted = tours.filter(t => t.discountPrice && t.regularPrice && t.regularPrice > t.discountPrice);
    if (discounted.length > 0) {
      return discounted.slice(0, 3).map((tour, idx) => {
        const discountPct = Math.round(((tour.regularPrice! - tour.discountPrice!) / tour.regularPrice!) * 100);
        return {
          id: tour.id,
          badge: 'Travel like a VIP',
          title: `${discountPct}% OFF COMBO`,
          subtitle: tour.title,
          promoCode: 'COMBO25',
          image: tour.featuredImage || tour.gallery?.[0] || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
          link: `/tour/${tour.slug || tour.id}`
        };
      });
    }
    // 3. Fallback to top rated tour
    const topTour = tours[0];
    return [
      {
        id: 'promo-default',
        badge: 'Travel like a VIP',
        title: '25% OFF COMBO',
        subtitle: topTour?.title || 'Fast Track + Shuttle + Private Island Tour',
        promoCode: 'COMBO25',
        image: topTour?.featuredImage || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
        link: topTour ? `/tour/${topTour.slug || topTour.id}` : '/tours'
      }
    ];
  }, [heroSlides, tours, joytimeCustomization]);

  // Auto-play timer for multi-banner slider
  useEffect(() => {
    if (!bannerAutoplay || isBannerHovered || promoBanners.length <= 1 || bannerLayout !== 'slider') return;
    const timer = setInterval(() => {
      setPromoSlideIndex(prev => (prev + 1) % promoBanners.length);
    }, bannerInterval);
    return () => clearInterval(timer);
  }, [bannerAutoplay, isBannerHovered, promoBanners.length, bannerInterval, bannerLayout]);

  // Touch swipe handlers for smooth mobile sliding
  const handleBannerTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleBannerTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleBannerTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      // Swiped left -> next slide
      setPromoSlideIndex(prev => (prev + 1) % promoBanners.length);
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev slide
      setPromoSlideIndex(prev => (prev - 1 + promoBanners.length) % promoBanners.length);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Helper for computing linear gradient per slide
  const getBannerGradient = (slide: JoyTimePromoItem) => {
    const dir = slide.gradientDirection || 'to-r';
    const angleMap: Record<string, string> = {
      'to-r': 'to right',
      'to-br': 'to bottom right',
      'to-b': 'to bottom',
      'to-tr': 'to top right',
      'to-l': 'to left'
    };
    const angle = angleMap[dir] || 'to right';
    const from = slide.gradientFrom || primaryColor;
    const via = slide.gradientVia ? `, ${slide.gradientVia}` : '';
    const to = slide.gradientTo || secondaryColor;
    return `linear-gradient(${angle}, ${from}${via}, ${to})`;
  };

  // Homepage Reviews Section Settings & Data
  const showReviewsSection = joytimeCustomization?.showReviewsSection !== false;
  const reviewsTitle = joytimeCustomization?.reviewsTitle || 'Traveler Reviews & Experiences';
  const reviewsSubtitle = joytimeCustomization?.reviewsSubtitle || 'Real reviews from verified adventurers';
  const reviewsBgStyle = joytimeCustomization?.reviewsBgStyle || 'subtle-slate';

  const reviewsThemeConfig = useMemo(() => {
    switch (reviewsBgStyle) {
      case 'soft-sky':
        return {
          wrapper: 'bg-gradient-to-b from-sky-50 via-sky-50/70 to-blue-50/50 border-y border-sky-200/70 shadow-2xs',
          title: 'text-sky-950',
          subtitle: 'text-sky-700/80',
          ratingBadge: 'bg-white/90 border border-sky-200 text-sky-900 shadow-2xs',
          card: 'bg-white border border-sky-100 shadow-[0_2px_10px_rgba(3,105,161,0.04)] hover:shadow-md text-slate-800',
          cardDivider: 'border-slate-100',
          cardMeta: 'text-slate-400',
          isDark: false
        };
      case 'warm-cream':
        return {
          wrapper: 'bg-[#faf6f0] border-y border-amber-200/70 shadow-2xs',
          title: 'text-amber-950',
          subtitle: 'text-amber-800/80',
          ratingBadge: 'bg-white/90 border border-amber-200 text-amber-900 shadow-2xs',
          card: 'bg-white border border-amber-100 shadow-[0_2px_10px_rgba(180,83,9,0.04)] hover:shadow-md text-slate-800',
          cardDivider: 'border-amber-50',
          cardMeta: 'text-amber-800/60',
          isDark: false
        };
      case 'dark-luxury':
        return {
          wrapper: 'bg-slate-900 border-y border-slate-800 shadow-md',
          title: 'text-white',
          subtitle: 'text-slate-300',
          ratingBadge: 'bg-slate-800 border border-slate-700 text-amber-300',
          card: 'bg-slate-800/95 border border-slate-700 shadow-md text-slate-100',
          cardDivider: 'border-slate-700/80',
          cardMeta: 'text-slate-400',
          isDark: true
        };
      case 'pure-white':
        return {
          wrapper: 'bg-white border-y border-gray-100 shadow-2xs',
          title: 'text-gray-900',
          subtitle: 'text-gray-500',
          ratingBadge: 'bg-amber-50 border border-amber-200/60 text-amber-900',
          card: 'bg-gray-50/70 border border-gray-200/80 shadow-xs hover:shadow-md text-slate-800',
          cardDivider: 'border-gray-100',
          cardMeta: 'text-gray-400',
          isDark: false
        };
      case 'subtle-slate':
      default:
        return {
          wrapper: 'bg-slate-100/90 border-y border-slate-200/80 shadow-2xs',
          title: 'text-slate-900',
          subtitle: 'text-slate-500',
          ratingBadge: 'bg-white border border-slate-200/80 text-slate-900 shadow-2xs',
          card: 'bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md text-slate-800',
          cardDivider: 'border-slate-100',
          cardMeta: 'text-slate-400',
          isDark: false
        };
    }
  }, [reviewsBgStyle]);

  const displayReviews = useMemo(() => {
    const approved = reviews.filter(r => r.status === 'approved' || !r.status);
    if (approved.length > 0) return approved;
    return [
      {
        id: 'rev-sample-1',
        userId: 'u1',
        userName: 'Sarah Jenkins',
        userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        nationality: 'Australia',
        tourTitle: tours[0]?.title || 'Nusa Penida Island Tour',
        rating: 5,
        title: 'Unbelievable Experience!',
        comment: 'Best tour ever! The private chauffeur was punctual, friendly, and took the most incredible photos. Booking through mobile was seamless.',
        platform: 'tripadvisor',
        createdAt: '2 days ago'
      },
      {
        id: 'rev-sample-2',
        userId: 'u2',
        userName: 'Marcus Lindqvist',
        userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        nationality: 'Sweden',
        tourTitle: tours[1]?.title || 'Mount Batur Sunrise Trek',
        rating: 5,
        title: 'Highlight of our trip',
        comment: 'Everything went like clockwork. The guide was knowledgeable and the views were breathtaking. 10/10 recommend!',
        platform: 'google',
        createdAt: '1 week ago'
      },
      {
        id: 'rev-sample-3',
        userId: 'u3',
        userName: 'Aiko Tanaka',
        userPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        nationality: 'Japan',
        tourTitle: tours[2]?.title || 'Ubud Waterfall & Rice Terraces',
        rating: 5,
        title: 'Super smooth booking',
        comment: 'We got our mobile voucher immediately on WhatsApp and the driver was ready at the lobby on time. Fantastic hospitality!',
        platform: 'direct',
        createdAt: '2 weeks ago'
      }
    ] as Review[];
  }, [reviews, tours]);

  // Homepage Blog Section Settings & Data
  const showBlogSection = joytimeCustomization?.showBlogSection !== false;
  const blogTitle = joytimeCustomization?.blogTitle || 'Travel Guides & Stories';
  const blogSubtitle = joytimeCustomization?.blogSubtitle || 'Insider tips, curated itineraries & packing guides';
  const blogBgStyle = joytimeCustomization?.blogBgStyle || 'transparent';

  const blogThemeConfig = useMemo(() => {
    switch (blogBgStyle) {
      case 'subtle-slate':
        return {
          wrapper: 'bg-slate-100/90 py-5 my-1 border-y border-slate-200/80 shadow-2xs',
          title: 'text-slate-900',
          subtitle: 'text-slate-500',
          card: 'bg-white border-slate-200/80',
          isDark: false
        };
      case 'soft-sky':
        return {
          wrapper: 'bg-gradient-to-b from-sky-50 via-sky-50/70 to-blue-50/50 py-5 my-1 border-y border-sky-200/70 shadow-2xs',
          title: 'text-sky-950',
          subtitle: 'text-sky-700/80',
          card: 'bg-white border-sky-100',
          isDark: false
        };
      case 'warm-cream':
        return {
          wrapper: 'bg-[#faf6f0] py-5 my-1 border-y border-amber-200/70 shadow-2xs',
          title: 'text-amber-950',
          subtitle: 'text-amber-800/80',
          card: 'bg-white border-amber-100',
          isDark: false
        };
      case 'pure-white':
        return {
          wrapper: 'bg-white py-5 my-1 border-y border-gray-100 shadow-2xs',
          title: 'text-gray-900',
          subtitle: 'text-gray-500',
          card: 'bg-gray-50/70 border-gray-200/80',
          isDark: false
        };
      case 'transparent':
      default:
        return {
          wrapper: '',
          title: 'text-gray-900',
          subtitle: 'text-gray-500',
          card: 'bg-white border-gray-100',
          isDark: false
        };
    }
  }, [blogBgStyle]);

  const displayPosts = useMemo(() => {
    const published = posts.filter(p => p.status === 'published' || p.status === 'active' || !p.status);
    if (published.length > 0) return published;
    return [
      {
        id: 'sample-post-1',
        title: 'Top 7 Hidden Beaches & Secret Coves You Must Visit',
        slug: 'hidden-beaches-secret-coves',
        excerpt: 'Discover tranquil shores away from the crowds, pristine coral reefs, and picturesque sunset viewpoints.',
        coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        category: 'Travel Guide',
        author: 'Tripbone Concierge',
        readTime: '4 min read',
        status: 'published'
      },
      {
        id: 'sample-post-2',
        title: 'Ultimate First-Timer Guide: Currency, SIM Cards & Transport',
        slug: 'first-timer-guide-currency-transport',
        excerpt: 'Everything you need to know before landing: airport fast-track, hassle-free private drivers, and etiquette.',
        coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
        category: 'Tips & Hacks',
        author: 'Local Guide Team',
        readTime: '5 min read',
        status: 'published'
      },
      {
        id: 'sample-post-3',
        title: 'Best Coffee Plantations, Jungle Swings & Waterfalls',
        slug: 'coffee-plantations-waterfalls',
        excerpt: 'Experience authentic roast tastings, sacred temple springs, and majestic highland panoramic views.',
        coverImage: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80',
        category: 'Experiences',
        author: 'Adventure Desk',
        readTime: '3 min read',
        status: 'published'
      }
    ] as BlogPost[];
  }, [posts]);

  // Search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/tours?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  // Category Icon resolver for JoyTime circular buttons
  const getCategoryIconComponent = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('food') || lower.includes('f&b') || lower.includes('culinary') || lower.includes('eat') || lower.includes('dinner') || lower.includes('restaurant')) return LucideIcons.Utensils;
    if (lower.includes('spa') || lower.includes('wellness') || lower.includes('massage') || lower.includes('relax')) return LucideIcons.Sparkles;
    if (lower.includes('souvenir') || lower.includes('gift') || lower.includes('shop') || lower.includes('market') || lower.includes('craft')) return LucideIcons.Gift;
    if (lower.includes('car') || lower.includes('driver') || lower.includes('transport') || lower.includes('van') || lower.includes('transfer')) return LucideIcons.Car;
    if (lower.includes('water') || lower.includes('beach') || lower.includes('sea') || lower.includes('dive') || lower.includes('snorkel') || lower.includes('boat')) return LucideIcons.Waves;
    if (lower.includes('adventure') || lower.includes('atv') || lower.includes('bike') || lower.includes('quad')) return LucideIcons.Bike;
    if (lower.includes('volcano') || lower.includes('mountain') || lower.includes('trek') || lower.includes('hike')) return LucideIcons.Mountain;
    if (lower.includes('culture') || lower.includes('temple') || lower.includes('heritage')) return LucideIcons.Compass;
    if (lower.includes('sim') || lower.includes('wifi')) return LucideIcons.Wifi;
    if (lower.includes('ticket') || lower.includes('pass')) return LucideIcons.Ticket;
    return LucideIcons.Palmtree;
  };

  // Pastel Color Cycle for Circular Category Icons
  const pastelColors = [
    { bg: 'bg-[#EBF7FC]', text: 'text-[#0284C7]', ring: 'ring-[#BAE6FD]' },
    { bg: 'bg-[#FFF7ED]', text: 'text-[#EA580C]', ring: 'ring-[#FFEDD5]' },
    { bg: 'bg-[#FDF2F8]', text: 'text-[#DB2777]', ring: 'ring-[#FCE7F3]' },
    { bg: 'bg-[#F0FDF4]', text: 'text-[#16A34A]', ring: 'ring-[#DCFCE7]' },
    { bg: 'bg-[#FAF5FF]', text: 'text-[#9333EA]', ring: 'ring-[#F3E8FF]' },
    { bg: 'bg-[#FEFCE8]', text: 'text-[#CA8A04]', ring: 'ring-[#FEF08A]' },
  ];

  // Top 4 Real Categories for Quick Strip
  const quickCategories = useMemo(() => {
    return categories.slice(0, 4);
  }, [categories]);

  // Distinct Blog Categories for Blog Sub-View
  const blogCategories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [posts]);

  // Filtered Blog Posts
  const filteredPosts = useMemo(() => {
    if (blogCategoryFilter === 'all') return posts;
    return posts.filter(p => p.category === blogCategoryFilter);
  }, [posts, blogCategoryFilter]);

  // Render 2-Column Product Card (Strictly Styled per Reference Screenshots)
  const renderProductCard = (tour: Tour, rankIndex?: number) => {
    const isFav = favoriteIds.includes(tour.id);
    const origPrice = getOriginalPrice(tour);
    const secPrice = getSecondaryPrice(tour);
    const bookedCount = (tour as any).bookedCount || Math.floor(((tour.rating || 4.9) * 160) + ((rankIndex || 0) * 23));

    return (
      <Link
        key={tour.id}
        to={`/tour/${tour.slug || tour.id}`}
        onClick={() => recordRecentlyViewed(tour.id)}
        className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer text-left relative"
      >
        {/* Card Photo & Top Badges */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <SmartImage
            src={tour.featuredImage || (tour.gallery?.[0] || (tour as any).images?.[0]) || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80'}
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            aspectRatio="auto"
            width={240}
            quality={75}
          />

          {/* Ranking Crown Badge (Screenshot Style: Gold/Bronze badge on top left) */}
          {typeof rankIndex === 'number' && (
            <div className={cn(
              "absolute top-2 left-2 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm text-[10px] font-black tracking-wider text-white",
              rankIndex === 0 ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900" :
              rankIndex === 1 ? "bg-gradient-to-r from-orange-500 to-amber-500" :
              rankIndex === 2 ? "bg-gradient-to-r from-rose-500 to-pink-500" :
              "bg-black/60 backdrop-blur-xs"
            )}>
              <LucideIcons.Crown className={cn("w-3 h-3", rankIndex === 0 ? "fill-slate-900" : "fill-white")} />
              <span>{rankIndex + 1}</span>
            </div>
          )}

          {/* Favorite Heart Button (Top Right Frosted Circle) */}
          <button
            type="button"
            onClick={(e) => toggleFavorite(tour.id, e)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center shadow-xs hover:bg-white transition-all cursor-pointer z-10"
            aria-label="Save to favorites"
          >
            <LucideIcons.Heart
              className={cn(
                "w-3.5 h-3.5 transition-colors",
                isFav ? "fill-rose-500 text-rose-500" : "text-gray-600"
              )}
            />
          </button>
        </div>

        {/* Card Body Details */}
        <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
          <div className="space-y-1">
            {/* Title (2-Line Clamped) */}
            <h4 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-sky-600 transition-colors">
              {tour.title}
            </h4>

            {/* Category & Location Subtext (Soft Blue / Slate) */}
            <p className="text-[10px] font-medium text-sky-700/80 line-clamp-1">
              {tour.location || 'Bali'} • {getCategoryName(tour)}
            </p>
          </div>

          {/* Social Proof: Booked Count on Left, Star Rating on Right */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-[10px]">
            <span className="font-semibold text-gray-500">
              {bookedCount} Booked
            </span>
            <div className="flex items-center gap-1 font-bold text-gray-800">
              <LucideIcons.Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{(tour.rating || 4.9).toFixed(1)}</span>
            </div>
          </div>

          {/* Pricing Row (Dual-Currency when applicable) */}
          <div className="pt-0.5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-[10px] font-medium text-gray-500">From</span>
              <span className="text-xs font-black text-gray-900">
                {getTourPrice(tour)}
              </span>
              {origPrice && (
                <span className="text-[9px] text-gray-400 line-through">
                  {origPrice}
                </span>
              )}
            </div>
            {secPrice && (
              <p className="text-[9px] font-medium text-gray-400 leading-tight">
                {secPrice}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  /* =========================================================================
     SUB-VIEW: DEDICATED BLOG SCREEN (IMG_3853.png)
     ========================================================================= */
  if (activeSubView === 'blog') {
    return (
      <div className="bg-[#f8fafc] min-h-screen pb-24 text-left">
        {/* Blog Screen Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center justify-between shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSubView('home')}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 cursor-pointer"
          >
            <LucideIcons.ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-black text-gray-900">Blog</h2>
          <div className="w-8" />
        </div>

        {/* Blog Segmented Category Pills */}
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setBlogCategoryFilter('all')}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
              blogCategoryFilter === 'all'
                ? "bg-sky-50 text-sky-600 border border-sky-200 shadow-2xs"
                : "bg-gray-50 text-gray-600 border border-gray-200/80"
            )}
          >
            Latest News
          </button>
          {blogCategories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setBlogCategoryFilter(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                blogCategoryFilter === cat
                  ? "bg-sky-50 text-sky-600 border border-sky-200 shadow-2xs"
                  : "bg-gray-50 text-gray-600 border border-gray-200/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Blog Posts Vertical List */}
        <div className="px-4 py-4 space-y-3">
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <Link
                key={post.id}
                to={`/blog/${post.slug || post.id}`}
                className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex gap-3 group hover:border-sky-200 transition-all cursor-pointer"
              >
                {/* Left Thumbnail */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <SmartImage
                    src={post.featuredImage || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=300&q=80'}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    aspectRatio="auto"
                    width={150}
                    quality={75}
                  />
                </div>

                {/* Right Details */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="text-xs font-black text-gray-900 line-clamp-2 leading-snug group-hover:text-sky-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                      {post.excerpt || (post as any).description || 'Discover insider travel guides, best local spots, and secret tips.'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-gray-400 font-medium">
                      {(post as any).date || (post as any).createdAt ? new Date((post as any).date || (post as any).createdAt).toLocaleDateString('en-GB') : 'Verified Article'}
                    </span>
                    <span className="text-sky-600 font-bold flex items-center gap-1">
                      View detail <LucideIcons.ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl p-6 border border-gray-100">
              <LucideIcons.BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-500">No blog posts found in this category.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================================
     SUB-VIEW: DEDICATED PRODUCT CATALOG SCREEN (IMG_3851.png)
     ========================================================================= */
  if (activeSubView === 'product') {
    return (
      <div className="bg-[#f8fafc] min-h-screen pb-24 text-left">
        {/* Product Screen Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSubView('home')}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 cursor-pointer"
          >
            <LucideIcons.ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-black text-gray-900">Product</h2>
          <Link
            to="/checkout"
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 cursor-pointer relative"
          >
            <LucideIcons.ShoppingCart className="w-4 h-4" />
            {favoriteIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                {favoriteIds.length}
              </span>
            )}
          </Link>
        </div>

        {/* Filter and Count Bar */}
        <div className="px-4 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsServiceSheetOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5"
            >
              <LucideIcons.Filter className="w-3 h-3" />
              <span>(1)</span>
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold flex items-center gap-1">
              Tour
              <LucideIcons.X className="w-3 h-3 cursor-pointer" onClick={() => onSelectCategory('all')} />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-500">
              {filteredTours.length} results found
            </span>
            <select
              value={sortOption}
              onChange={(e: any) => setSortOption(e.target.value)}
              className="text-xs font-bold text-gray-700 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="popular">Select ▾</option>
              <option value="rating">Top Rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {filteredTours.map((tour, idx) => renderProductCard(tour, idx))}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     PRIMARY VIEW: JOYTIME SUPER-APP MOBILE HOME (IMG_3849.png & IMG_3850.png)
     ========================================================================= */
  const activePromo = promoBanners[promoSlideIndex % promoBanners.length];

  const activePromoGradient = useMemo(() => {
    if (!activePromo) return `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`;
    const dir = activePromo.gradientDirection || 'to-r';
    const angleMap: Record<string, string> = {
      'to-r': 'to right',
      'to-br': 'to bottom right',
      'to-b': 'to bottom',
      'to-tr': 'to top right',
      'to-l': 'to left'
    };
    const angle = angleMap[dir] || 'to right';
    const from = activePromo.gradientFrom || primaryColor;
    const via = activePromo.gradientVia ? `, ${activePromo.gradientVia}` : '';
    const to = activePromo.gradientTo || secondaryColor;
    return `linear-gradient(${angle}, ${from}${via}, ${to})`;
  }, [activePromo, primaryColor, secondaryColor]);

  return (
    <div className="bg-[#f8fafc] pb-24 space-y-5 text-left relative">
      {/* 1. JOYTIME HEADER BAR (IMG_3849.png) */}
      <div 
        className="px-4 pt-3.5 pb-3 border-b border-gray-100 sticky top-0 z-30 shadow-xs transition-colors"
        style={{ backgroundColor: headerBgColor }}
      >
        <div className="flex items-center gap-2.5">
          {/* Logo / Brand Mark */}
          <Link to="/" className="shrink-0 flex items-center">
            {settings?.logoURL ? (
              <img
                src={settings.logoURL}
                alt={settings?.siteName || 'Tripbone'}
                className="h-8 max-w-[90px] object-contain"
              />
            ) : (
              <div 
                className="px-2 py-1 rounded-xl text-white font-black text-xs tracking-tight shadow-xs flex items-center gap-1"
                style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
              >
                <span>JOY</span>
                <span className="bg-amber-400 text-slate-900 px-1 rounded text-[10px]">TIME</span>
              </div>
            )}
          </Link>

          {/* Rounded Pill Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <LucideIcons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Places to go, Things to do..."
              className="w-full pl-9 pr-4 py-2 bg-gray-100/90 border border-gray-200/60 rounded-full text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-inner"
            />
          </form>

          {/* Right Action Icons: Shopping Cart & Notification Bell */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              to="/checkout"
              className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200/60 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors relative cursor-pointer"
              aria-label="Shopping Cart"
            >
              <LucideIcons.ShoppingCart className="w-4 h-4 text-gray-600" />
              {favoriteIds.length > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-4 h-4 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {favoriteIds.length}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200/60 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <LucideIcons.Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>
          </div>
        </div>

        {/* Slide-Down Notifications Dropdown */}
        {isNotificationsOpen && (
          <div className="mt-3 p-3 bg-sky-50/80 border border-sky-200/70 rounded-2xl space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-sky-900">
              <span className="flex items-center gap-1.5">
                <LucideIcons.Sparkles className="w-3.5 h-3.5 text-sky-600" />
                Latest Announcements
              </span>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <LucideIcons.X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 text-[11px] text-sky-800">
              <div className="p-2 bg-white rounded-xl shadow-2xs border border-sky-100 flex items-start gap-2">
                <LucideIcons.Tag className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900">25% OFF Combo Promo Live!</p>
                  <p className="text-gray-500 text-[10px]">Use code COMBO25 at checkout on selected activities.</p>
                </div>
              </div>
              <div className="p-2 bg-white rounded-xl shadow-2xs border border-sky-100 flex items-start gap-2">
                <LucideIcons.Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900">Verified Local Partner Guarantee</p>
                  <p className="text-gray-500 text-[10px]">Instant confirmation & WhatsApp concierge coordination included.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. CIRCULAR CATEGORY QUICK NAVIGATION STRIP (IMG_3849.png) */}
      <div className="px-4">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
          {quickCategories.map((cat, idx) => {
            const Icon = getCategoryIconComponent(cat.name);
            const color = pastelColors[idx % pastelColors.length];
            const isSelected = selectedCategory === cat.id || selectedCategory === cat.slug;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id);
                  navigate(`/tours?category=${encodeURIComponent(cat.slug || cat.id)}`);
                }}
                className="flex flex-col items-center gap-1.5 min-w-[58px] cursor-pointer group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-2xs group-hover:scale-105",
                  color.bg,
                  color.text,
                  isSelected && "ring-2 ring-sky-500 shadow-sm"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-700 tracking-tight truncate max-w-[62px]">
                  {cat.name}
                </span>
              </button>
            );
          })}

          {/* "All" Category Circular Button (Opens Service Bottom Sheet) */}
          <button
            type="button"
            onClick={() => setIsServiceSheetOpen(true)}
            className="flex flex-col items-center gap-1.5 min-w-[58px] cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center transition-all shadow-2xs group-hover:scale-105">
              <LucideIcons.LayoutGrid className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-gray-700 tracking-tight">
              All
            </span>
          </button>
        </div>
      </div>

      {/* 3. PROMOTION MULTI-BANNER SLIDER SECTION */}
      <div id="joytime-promotion-section" className="px-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-black text-gray-900">Promotion</h3>
            {promoBanners.length > 1 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {promoBanners.length} Deals
              </span>
            )}
          </div>
          <Link
            to="/tours"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
          >
            View All
          </Link>
        </div>

        {/* LAYOUT OPTION A: Full-Width Swipeable Slider (Default) */}
        {bannerLayout === 'slider' && (
          <div 
            className="relative rounded-2xl overflow-hidden shadow-md group select-none"
            onTouchStart={handleBannerTouchStart}
            onTouchMove={handleBannerTouchMove}
            onTouchEnd={handleBannerTouchEnd}
            onMouseEnter={() => setIsBannerHovered(true)}
            onMouseLeave={() => setIsBannerHovered(false)}
          >
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${(promoSlideIndex % promoBanners.length) * 100}%)` }}
            >
              {promoBanners.map((slide, idx) => (
                <div 
                  key={slide.id || idx}
                  className="w-full shrink-0 relative text-white min-h-[145px] flex flex-col justify-between"
                  style={{ background: getBannerGradient(slide) }}
                >
                  {/* Background overlay image */}
                  <div 
                    className="absolute inset-0 mix-blend-overlay pointer-events-none"
                    style={{ opacity: (slide.overlayOpacity ?? 25) / 100 }}
                  >
                    <SmartImage
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                      aspectRatio="auto"
                      width={600}
                      quality={75}
                    />
                  </div>

                  <Link
                    to={slide.link}
                    className="relative z-10 p-5 flex flex-col justify-between h-full min-h-[145px] block cursor-pointer"
                  >
                    <div className="space-y-1 max-w-[85%]">
                      <span 
                        className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block"
                        style={{ color: accentColor, backgroundColor: 'rgba(0,0,0,0.25)' }}
                      >
                        {slide.badge}
                      </span>
                      <h4 className="text-lg font-black tracking-tight leading-tight text-white drop-shadow-xs">
                        {slide.title}
                      </h4>
                      <p className="text-[10px] text-white/90 font-semibold line-clamp-1">
                        {slide.subtitle}
                      </p>
                    </div>

                    <div className="pt-3 flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black tracking-wider text-amber-200 border border-white/25">
                        CODE: {slide.promoCode}
                      </span>
                      <span className="text-xs font-black text-white flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                        {slide.buttonText || 'Book Now'} <LucideIcons.ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Slide counter pill (Top-Right) */}
            {showBannerCounter && promoBanners.length > 1 && (
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-black text-white/95 border border-white/20 z-20 pointer-events-none">
                {(promoSlideIndex % promoBanners.length) + 1} / {promoBanners.length}
              </div>
            )}

            {/* Subtle Prev/Next Click Chevrons */}
            {promoBanners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setPromoSlideIndex(prev => (prev - 1 + promoBanners.length) % promoBanners.length);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/25 backdrop-blur-xs text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                  aria-label="Previous Slide"
                >
                  <LucideIcons.ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setPromoSlideIndex(prev => (prev + 1) % promoBanners.length);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/25 backdrop-blur-xs text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                  aria-label="Next Slide"
                >
                  <LucideIcons.ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Dots Indicator (Bottom-Right) */}
            {showBannerDots && promoBanners.length > 1 && (
              <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5 z-20">
                {promoBanners.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPromoSlideIndex(i)}
                    className={cn(
                      "h-1.5 transition-all rounded-full cursor-pointer",
                      promoSlideIndex % promoBanners.length === i ? "w-4 bg-white" : "w-1.5 bg-white/45"
                    )}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* LAYOUT OPTION B: Peek Carousel (Native horizontal swipe with edge peek) */}
        {bannerLayout === 'carousel-peek' && (
          <div className="overflow-x-auto snap-x snap-mandatory no-scrollbar flex gap-3 pb-1 -mx-4 px-4">
            {promoBanners.map((slide, idx) => (
              <div
                key={slide.id || idx}
                className="snap-center shrink-0 w-[86%] rounded-2xl overflow-hidden shadow-md relative min-h-[145px] text-white"
                style={{ background: getBannerGradient(slide) }}
              >
                <div 
                  className="absolute inset-0 mix-blend-overlay pointer-events-none"
                  style={{ opacity: (slide.overlayOpacity ?? 25) / 100 }}
                >
                  <SmartImage
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    aspectRatio="auto"
                    width={500}
                    quality={75}
                  />
                </div>
                <Link
                  to={slide.link}
                  className="relative z-10 p-5 flex flex-col justify-between h-full min-h-[145px] block cursor-pointer"
                >
                  <div className="space-y-1">
                    <span 
                      className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block"
                      style={{ color: accentColor, backgroundColor: 'rgba(0,0,0,0.25)' }}
                    >
                      {slide.badge}
                    </span>
                    <h4 className="text-lg font-black tracking-tight leading-tight text-white drop-shadow-xs">
                      {slide.title}
                    </h4>
                    <p className="text-[10px] text-white/90 font-semibold line-clamp-1">
                      {slide.subtitle}
                    </p>
                  </div>
                  <div className="pt-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black tracking-wider text-amber-200 border border-white/25">
                      CODE: {slide.promoCode}
                    </span>
                    <span className="text-xs font-black text-white flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                      {slide.buttonText || 'Book Now'} <LucideIcons.ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* LAYOUT OPTION C: Multi-Card Horizontal Scroll */}
        {bannerLayout === 'multi-scroll' && (
          <div className="overflow-x-auto snap-x no-scrollbar flex gap-3 pb-1 -mx-4 px-4">
            {promoBanners.map((slide, idx) => (
              <div
                key={slide.id || idx}
                className="snap-start shrink-0 w-[260px] rounded-2xl overflow-hidden shadow-xs relative min-h-[140px] text-white"
                style={{ background: getBannerGradient(slide) }}
              >
                <div 
                  className="absolute inset-0 mix-blend-overlay pointer-events-none"
                  style={{ opacity: (slide.overlayOpacity ?? 25) / 100 }}
                >
                  <SmartImage
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    aspectRatio="auto"
                    width={400}
                    quality={75}
                  />
                </div>
                <Link
                  to={slide.link}
                  className="relative z-10 p-4 flex flex-col justify-between h-full min-h-[140px] block cursor-pointer"
                >
                  <div className="space-y-1">
                    <span 
                      className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block"
                      style={{ color: accentColor, backgroundColor: 'rgba(0,0,0,0.25)' }}
                    >
                      {slide.badge}
                    </span>
                    <h4 className="text-base font-black tracking-tight leading-tight text-white drop-shadow-xs">
                      {slide.title}
                    </h4>
                    <p className="text-[10px] text-white/90 font-medium line-clamp-1">
                      {slide.subtitle}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-black text-amber-200">
                      {slide.promoCode}
                    </span>
                    <span className="text-[11px] font-black text-white flex items-center gap-0.5">
                      {slide.buttonText || 'Book'} <LucideIcons.ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* LAYOUT OPTION D: Stacked Vertical Cards */}
        {bannerLayout === 'stacked' && (
          <div className="space-y-3">
            {promoBanners.map((slide, idx) => (
              <div
                key={slide.id || idx}
                className="rounded-2xl overflow-hidden shadow-md relative min-h-[140px] text-white"
                style={{ background: getBannerGradient(slide) }}
              >
                <div 
                  className="absolute inset-0 mix-blend-overlay pointer-events-none"
                  style={{ opacity: (slide.overlayOpacity ?? 25) / 100 }}
                >
                  <SmartImage
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    aspectRatio="auto"
                    width={600}
                    quality={75}
                  />
                </div>
                <Link
                  to={slide.link}
                  className="relative z-10 p-5 flex flex-col justify-between min-h-[140px] block cursor-pointer"
                >
                  <div className="space-y-1">
                    <span 
                      className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block"
                      style={{ color: accentColor, backgroundColor: 'rgba(0,0,0,0.25)' }}
                    >
                      {slide.badge}
                    </span>
                    <h4 className="text-lg font-black tracking-tight leading-tight text-white drop-shadow-xs">
                      {slide.title}
                    </h4>
                    <p className="text-[10px] text-white/90 font-semibold line-clamp-1">
                      {slide.subtitle}
                    </p>
                  </div>
                  <div className="pt-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black tracking-wider text-amber-200 border border-white/25">
                      CODE: {slide.promoCode}
                    </span>
                    <span className="text-xs font-black text-white flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                      {slide.buttonText || 'Book Now'} <LucideIcons.ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. TOP TRENDS SECTION (IMG_3849.png) */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-gray-900">Top Trends</h3>
          <button
            type="button"
            onClick={() => setActiveSubView('product')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5 cursor-pointer"
          >
            View All
          </button>
        </div>

        {/* Dynamic Location Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setSelectedLocation('all')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
              selectedLocation === 'all'
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Top Trends
          </button>
          {dynamicLocations.map(loc => (
            <button
              key={loc}
              type="button"
              onClick={() => setSelectedLocation(loc)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                selectedLocation === loc
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {loc}
            </button>
          ))}
        </div>

        {/* 2-Column Product Grid with Crown Badges */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {topTrendsTours.slice(0, 4).map((tour, idx) => renderProductCard(tour, idx))}
        </div>
      </div>

      {/* 5. RECENTLY VIEWED SECTION (IMG_3850.png) */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-gray-900">Recently Viewed</h3>
          <Link
            to="/tours"
            className="text-xs font-bold text-sky-600 hover:text-sky-700"
          >
            Explore
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {recentlyViewedTours.slice(0, 2).map((tour, idx) => renderProductCard(tour))}
        </div>
      </div>

      {/* 6. IDEAL DESTINATION BENTO GRID (IMG_3850.png) */}
      {destinationBento.length >= 2 && (
        <div className="px-4 space-y-3">
          <h3 className="text-base font-black text-gray-900">Ideal Destination</h3>
          
          <div className="grid grid-cols-2 gap-2.5 h-[240px]">
            {/* Left Tall Card */}
            {destinationBento[0] && (
              <Link
                to={`/tours?location=${encodeURIComponent(destinationBento[0].name)}`}
                className="relative rounded-2xl overflow-hidden group shadow-xs block h-full w-full cursor-pointer isolate"
              >
                <div className="absolute inset-0">
                  <SmartImage
                    src={destinationBento[0].image}
                    alt={destinationBento[0].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    containerClassName="w-full h-full"
                    aspectRatio="auto"
                    width={400}
                    quality={75}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white z-10 pointer-events-none">
                  <div className="flex items-center gap-1 text-xs font-black">
                    <LucideIcons.MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{destinationBento[0].name}</span>
                  </div>
                  <p className="text-[10px] text-gray-200 font-medium pl-4.5">
                    {destinationBento[0].count} Experiences
                  </p>
                </div>
              </Link>
            )}

            {/* Right Stacked 2 Cards */}
            <div className="flex flex-col gap-2.5 h-full min-h-0">
              {destinationBento.slice(1, 3).map((dest) => (
                <Link
                  key={dest.name}
                  to={`/tours?location=${encodeURIComponent(dest.name)}`}
                  className="relative flex-1 min-h-0 rounded-2xl overflow-hidden group shadow-xs block cursor-pointer isolate"
                >
                  <div className="absolute inset-0">
                    <SmartImage
                      src={dest.image}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      containerClassName="w-full h-full"
                      aspectRatio="auto"
                      width={300}
                      quality={75}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white z-10 pointer-events-none">
                    <div className="flex items-center gap-1 text-[11px] font-black">
                      <LucideIcons.MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{dest.name}</span>
                    </div>
                    <p className="text-[9px] text-gray-200 font-medium pl-4">
                      {dest.count} Experiences
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. CUSTOMER REVIEWS & SOCIAL PROOF SECTION */}
      {showReviewsSection && displayReviews.length > 0 && (
        <div 
          id="joytime-reviews-section" 
          className={cn(
            "py-5.5 my-1.5 transition-colors",
            reviewsThemeConfig.wrapper
          )}
        >
          <div className="px-4 space-y-3.5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-0.5 max-w-[70%]">
                <h3 className={cn("text-base font-black leading-tight", reviewsThemeConfig.title)}>
                  {reviewsTitle}
                </h3>
                <p className={cn("text-[11px] font-medium line-clamp-1", reviewsThemeConfig.subtitle)}>
                  {reviewsSubtitle}
                </p>
              </div>
              <div className={cn("flex items-center gap-1 px-2.5 py-1 rounded-xl shrink-0", reviewsThemeConfig.ratingBadge)}>
                <LucideIcons.Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-black">4.9</span>
                <span className="text-[10px] opacity-75 font-bold">/ 5.0</span>
              </div>
            </div>

            {/* Horizontal Snap-X Review Cards Carousel */}
            <div className="overflow-x-auto snap-x no-scrollbar flex gap-3 pb-2 -mx-4 px-4">
              {displayReviews.map((rev, idx) => {
                const platformLabel = rev.platform === 'google' ? 'Google Review' : rev.platform === 'tripadvisor' ? 'TripAdvisor' : 'Verified Booking';
                const reviewerInitials = rev.userName?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'TR';

                return (
                  <div
                    key={rev.id || idx}
                    className={cn(
                      "snap-start shrink-0 w-[280px] rounded-2xl p-4 transition-all flex flex-col justify-between text-left space-y-3",
                      reviewsThemeConfig.card
                    )}
                  >
                    <div className="space-y-2.5">
                      {/* Reviewer Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {rev.userPhoto ? (
                            <img
                              src={rev.userPhoto}
                              alt={rev.userName}
                              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-gray-100"
                            />
                          ) : (
                            <div 
                              className="w-8 h-8 rounded-full text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {reviewerInitials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className={cn("text-xs font-black truncate leading-tight", reviewsThemeConfig.isDark ? "text-white" : "text-gray-900")}>
                              {rev.userName}
                            </p>
                            <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 leading-tight mt-0.5">
                              <LucideIcons.Check className="w-2.5 h-2.5 stroke-[3]" /> Verified Traveler
                            </p>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <LucideIcons.Star
                              key={s}
                              className={cn(
                                "w-3 h-3",
                                s <= (rev.rating || 5)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Booked Experience Tag */}
                      {rev.tourTitle && (
                        <div className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold truncate",
                          reviewsThemeConfig.isDark ? "bg-slate-700/80 border border-slate-600 text-sky-300" : "bg-sky-50/70 border border-sky-100 text-sky-800"
                        )}>
                          <LucideIcons.Compass className="w-3 h-3 text-sky-500 shrink-0" />
                          <span className="truncate">{rev.tourTitle}</span>
                        </div>
                      )}

                      {/* Review Text */}
                      <p className={cn("text-[11px] font-medium leading-relaxed italic line-clamp-3", reviewsThemeConfig.isDark ? "text-slate-200" : "text-gray-700")}>
                        "{rev.comment}"
                      </p>
                    </div>

                    {/* Card Bottom Meta */}
                    <div className={cn("pt-2 border-t flex items-center justify-between text-[10px] font-semibold", reviewsThemeConfig.cardDivider, reviewsThemeConfig.cardMeta)}>
                      <span className="flex items-center gap-1">
                        <LucideIcons.ShieldCheck className="w-3 h-3 text-emerald-500" />
                        {platformLabel}
                      </span>
                      <span>{rev.createdAt ? (typeof rev.createdAt === 'string' ? rev.createdAt : 'Recent') : 'Verified'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 8. TRAVEL GUIDES & BLOG STORIES SECTION */}
      {showBlogSection && displayPosts.length > 0 && (
        <div 
          id="joytime-blog-section" 
          className={cn(
            "transition-colors",
            blogThemeConfig.wrapper ? blogThemeConfig.wrapper : "px-4 space-y-3"
          )}
        >
          <div className={blogThemeConfig.wrapper ? "px-4 space-y-3" : "space-y-3"}>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-0.5 max-w-[70%]">
                <h3 className={cn("text-base font-black leading-tight", blogThemeConfig.title)}>
                  {blogTitle}
                </h3>
                <p className={cn("text-[11px] font-medium line-clamp-1", blogThemeConfig.subtitle)}>
                  {blogSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubView('blog')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5 shrink-0 cursor-pointer pt-0.5"
              >
                View All <LucideIcons.ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Horizontal Snap-X Blog Cards Carousel */}
            <div className="overflow-x-auto snap-x no-scrollbar flex gap-3.5 pb-2 -mx-4 px-4">
              {displayPosts.map((post, idx) => (
                <Link
                  key={post.id || idx}
                  to={`/blog/${post.slug || post.id}`}
                  className={cn(
                    "snap-start shrink-0 w-[260px] rounded-2xl overflow-hidden border shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer text-left",
                    blogThemeConfig.card
                  )}
                >
                {/* 16:9 Thumbnail with Overlay Pill */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                  <SmartImage
                    src={post.coverImage || post.featuredImage || (post as any).image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80'}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    aspectRatio="auto"
                    width={260}
                    quality={75}
                  />
                  {/* Category Pill */}
                  <div className="absolute top-2.5 left-2.5">
                    <span 
                      className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-white shadow-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {post.category || 'Travel Guide'}
                    </span>
                  </div>
                  {/* Read time */}
                  <div className="absolute bottom-2 right-2.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold flex items-center gap-1">
                    <LucideIcons.Clock className="w-2.5 h-2.5" />
                    <span>{(post as any).readTime || '4 min read'}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gray-900 leading-snug line-clamp-2 group-hover:text-sky-600 transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-2">
                      {post.excerpt || (post.content ? post.content.substring(0, 80) + '...' : '')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {post.author || 'Local Guide Team'}
                    </span>
                    <span className="text-[11px] font-bold text-sky-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Read <LucideIcons.ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* 9. FLOATING MASCOT CHAT BUBBLE WIDGET (IMG_3849.png & IMG_3850.png) */}
      <button
        type="button"
        onClick={() => {
          if (settings?.whatsappNumber) {
            const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${cleanNumber}?text=Hi%2C%20I%20have%20an%20inquiry%20about%20your%20tours`, '_blank');
          } else {
            window.dispatchEvent(new CustomEvent('chat:toggle'));
          }
        }}
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-900 shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-2 border-white cursor-pointer group"
        aria-label="Chat with local concierge"
      >
        <span className="text-xl group-hover:rotate-12 transition-transform">
          ☀️
        </span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-sky-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* 8. SERVICE BOTTOM SHEET (IMG_3852.png) */}
      {isServiceSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsServiceSheetOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full bg-white rounded-t-3xl p-5 shadow-2xl z-10 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 text-left">
            {/* Drag Pill Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black text-gray-900">Service</h3>
              <button
                type="button"
                onClick={() => setIsServiceSheetOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <LucideIcons.X className="w-4 h-4" />
              </button>
            </div>

            {/* Circular Category Icons Grid */}
            <div className="grid grid-cols-4 gap-y-5 gap-x-2">
              {categories.map((cat, idx) => {
                const Icon = getCategoryIconComponent(cat.name);
                const color = pastelColors[idx % pastelColors.length];

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setIsServiceSheetOpen(false);
                      onSelectCategory(cat.id);
                      navigate(`/tours?category=${encodeURIComponent(cat.slug || cat.id)}`);
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className={cn(
                      "w-13 h-13 rounded-full flex items-center justify-center transition-all shadow-2xs group-hover:scale-105",
                      color.bg,
                      color.text
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 text-center line-clamp-1 max-w-[70px]">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
