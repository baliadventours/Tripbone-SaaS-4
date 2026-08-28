import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { db, collection, query, orderBy, onSnapshot, where, limit } from "../lib/firebase";
import { Tour, Category, Review, BlogPost } from "../types";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Leaf,
  Play,
  Sparkles,
  Clock,
  Globe,
  Zap,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TourCard from "../components/TourCard";
import { useSettings } from "../lib/SettingsContext";
import SearchForm from "../components/Home/SearchForm";
import { Helmet } from "react-helmet-async";
import FormattedPrice from "../components/FormattedPrice";
import { cn } from "../lib/utils";

import MobileHomeHeader from "../components/Home/MobileHomeHeader";
import MobileHomePresets from "../components/Home/MobileHomePresets";
import SmartImage from "../components/SmartImage";
import LazySection from "../components/LazySection";

// Lazy load non-critical home sections
const TopRatedTours = lazy(() => import("../components/Home/TopRatedTours"));
const ReviewSlider = lazy(() => import("../components/Home/ReviewSlider"));
const BlogSection = lazy(() => import("../components/Home/BlogSection"));
const CarRentalShowcase = lazy(() => import("../components/Home/CarRentalShowcase"));

const CategoryIcon = ({
  iconName,
  className,
}: {
  iconName?: string;
  className: string;
}) => {
  if (!iconName) return <LucideIcons.LayoutGrid className={className} />;

  if (iconName.startsWith("http")) {
    return (
      <img
        src={iconName}
        className={cn("object-contain", className)}
        referrerPolicy="no-referrer"
      />
    );
  }

  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Compass;
  return <IconComponent className={className} />;
};

const SliderTourCard = ({ tour }: { tour: Tour }) => {
  return (
    <Link
      to={`/tour/${tour.slug || tour.id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <SmartImage
          src={
            tour.featuredImage ||
            tour.gallery?.[0] ||
            "https://picsum.photos/seed/placeholder/800/600"
          }
          alt={tour.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          aspectRatio="auto"
          width={400}
          quality={75}
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-black text-gray-900 flex items-center gap-1 shadow-sm">
          <LucideIcons.Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span>{tour.rating ? tour.rating.toFixed(1) : "4.9"}</span>
        </div>
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-black text-white uppercase tracking-wider">
          {tour.duration}
        </div>
      </div>

      <div className="p-4 space-y-2 text-left">
        <h4 className="text-base font-black text-gray-900 line-clamp-1 leading-tight group-hover:text-primary transition-colors">
          {tour.title}
        </h4>
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {tour.description}
        </p>
        <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              Price Starts At
            </span>
            <span className="text-lg font-black text-primary leading-none mt-0.5">
              <FormattedPrice
                amount={tour.discountPrice || tour.regularPrice}
              />
            </span>
          </div>
          <div className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-primary px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm hover:bg-orange-600 transition-colors">
            Book Now <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </Link>
  );
};

import { generateOrganizationSchema } from "../lib/seoUtils";

const DEFAULT_FALLBACK_TOURS: Tour[] = [
  {
    id: "ubud-day-tour-seed",
    slug: "ubud-day-tour",
    title: "Ubud Day Tour: Monkey Forest, Rice Terraces & Waterfall",
    description: "Spend a day getting to know the real Ubud, the place everyone falls in love with.",
    duration: "6-8 Hours",
    regularPrice: 45,
    discountPrice: 35,
    featuredImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
    gallery: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80"],
    rating: 4.9,
    reviewsCount: 124,
    isPopular: true,
    categoryId: "culture-fallback",
    status: "published",
    highlights: ["Sacred Monkey Forest Sanctuary", "Tegalalang Rice Terraces", "Tegenungan Waterfall"],
    inclusions: ["AC transport", "Driver guide", "Entrance tickets"],
    exclusions: ["Lunch", "Personal expenses"],
    itinerary: [],
    location: "Ubud, Bali",
    locationMapUrl: "",
    languages: ["English", "Indonesian"],
    packages: [],
    faqs: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mount-batur-trek-seed",
    slug: "mount-batur-sunrise-trek",
    title: "Mount Batur Sunrise Trekking with Natural Hot Spring",
    description: "Hike up to the active volcano Mount Batur to see an incredibly spectacular sunrise over Bali island.",
    duration: "8-10 Hours",
    regularPrice: 65,
    discountPrice: 49,
    featuredImage: "https://images.unsplash.com/photo-1518548419070-2c61b179ad65?auto=format&fit=crop&w=600&q=80",
    gallery: ["https://images.unsplash.com/photo-1518548419070-2c61b179ad65?auto=format&fit=crop&w=600&q=80"],
    rating: 4.8,
    reviewsCount: 96,
    isPopular: true,
    categoryId: "history-fallback",
    status: "published",
    highlights: ["Sunrise view from volcanic peak", "Natural thermal hot spring soak", "Coffee plantation visit"],
    inclusions: ["Hotel pickup/dropoff", "Local trekking guide", "Breakfast at summit", "Hot spring tickets"],
    exclusions: ["Gratuities"],
    itinerary: [],
    location: "Kintamani, Bali",
    locationMapUrl: "",
    languages: ["English", "Indonesian"],
    packages: [],
    faqs: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "nusa-penida-tour-seed",
    slug: "nusa-penida-one-day-tour",
    title: "Nusa Penida One Day Tour with Snorkeling Activities",
    description: "Sail away to exotic Nusa Penida island and visit iconic Kelingking Beach, Broken Beach, and snorkel with mantas.",
    duration: "10-12 Hours",
    regularPrice: 75,
    discountPrice: 59,
    featuredImage: "https://images.unsplash.com/photo-1537953773315-221350741d53?auto=format&fit=crop&w=600&q=80",
    gallery: ["https://images.unsplash.com/photo-1537953773315-221350741d53?auto=format&fit=crop&w=600&q=80"],
    rating: 4.9,
    reviewsCount: 148,
    isPopular: true,
    categoryId: "beach-fallback",
    status: "published",
    highlights: ["Kelingking T-Rex Beach", "Broken Beach / Angel Billabong", "Snorkeling with Manta Rays"],
    inclusions: ["Fast boat ticket return", "Island private transport", "Lunch", "Snorkeling gear and boat"],
    exclusions: ["Retribution fee"],
    itinerary: [],
    location: "Nusa Penida, Bali",
    locationMapUrl: "",
    languages: ["English", "Indonesian"],
    packages: [],
    faqs: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "uluwatu-kecak-seed",
    slug: "uluwatu-temple-sunset-kecak-dance",
    title: "Uluwatu Temple Sunset Tour with Kecak Fire Dance Show",
    description: "Watch the incredible sunset over the Indian Ocean from Uluwatu cliff temple, then watch the legendary Kecak dance.",
    duration: "5-6 Hours",
    regularPrice: 39,
    discountPrice: 29,
    featuredImage: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80",
    gallery: ["https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80"],
    rating: 4.7,
    reviewsCount: 82,
    isPopular: false,
    categoryId: "culture-fallback",
    status: "published",
    highlights: ["Uluwatu cliff-top temple", "Sunset ocean panorama", "Kecak Fire Dance performance"],
    inclusions: ["AC private car", "Driver guide", "Uluwatu temple tickets", "Kecak dance tickets"],
    exclusions: ["Dinner"],
    itinerary: [],
    location: "Uluwatu, Bali",
    locationMapUrl: "",
    languages: ["English", "Indonesian"],
    packages: [],
    faqs: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const DEFAULT_FALLBACK_REVIEWS: Review[] = [
  {
    id: "review-1",
    userName: "Emma Watson",
    nationality: "United Kingdom",
    rating: 5,
    title: "Absolutely incredible experience!",
    comment: "The Ubud Day Tour was the highlight of our Bali trip. Our guide was incredibly knowledgeable and the rice terraces were stunning.",
    tourTitle: "Ubud Day Tour: Monkey Forest & Rice Terraces",
    tourDate: "May 2026",
    userPhoto: "",
    userId: "user-1",
    status: "approved",
    createdAt: new Date()
  },
  {
    id: "review-2",
    userName: "David Miller",
    nationality: "Australia",
    rating: 5,
    title: "Breathtaking sunrise trekking!",
    comment: "Hiking Mount Batur is tough but 100% worth it. The view at the peak was stunning and the natural hot spring afterwards was perfect.",
    tourTitle: "Mount Batur Sunrise Trekking",
    tourDate: "May 2026",
    userPhoto: "",
    userId: "user-2",
    status: "approved",
    createdAt: new Date()
  }
];

const DEFAULT_FALLBACK_POSTS: BlogPost[] = [
  {
    id: "post-1",
    title: "10 Most Beautiful Places to Visit in Ubud, Bali",
    slug: "beautiful-places-to-visit-in-ubud",
    excerpt: "Ubud is renowned as Bali's cultural heart filled with beautiful rice fields, monkey sanctuaries, stunning waterfalls and palaces.",
    featuredImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
    category: "Travel Guide",
    tags: ["Ubud", "Bali", "Travel Tips"],
    author: "Bali Admin",
    status: "published",
    content: "Ubud is the spiritual and cultural heart of Bali...",
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "post-2",
    title: "The Ultimate Guide to Hiking Mount Batur for Sunrise",
    slug: "ultimate-mount-batur-sunrise-trek-guide",
    excerpt: "Everything you need to know before trekking Mount Batur's active volcanic peak to catch one of the most stunning sunrises of your life.",
    featuredImage: "https://images.unsplash.com/photo-1518548419070-2c61b179ad65?auto=format&fit=crop&w=600&q=80",
    category: "Adventure Tours",
    tags: ["Mount Batur", "Trekking", "Sunrise"],
    author: "Bali Admin",
    status: "published",
    content: "Hiking Mount Batur is one of Bali’s highly-rated activities...",
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const SLIDES = [
  {
    image: "",
    subtitle: "WELCOME TO BALI ADVENTURES",
    title: "Where Adrenaline Meets Natural Beauty",
    description: "Experience an unforgettable off-road journey through lush jungles, scenic rice fields, muddy trails, rivers, and exciting jungle tracks designed for riders of all skill levels.",
    badge: "Ubud, Bali",
    link: "/tours?search=atv"
  },
  {
    image: "",
    subtitle: "UNFORGETTABLE OFF-ROAD JOURNEYS",
    title: "Explore the Wild Side of Ubud",
    description: "Get ready to discover why we offer some of Bali's most exciting and action-packed outdoor experiences.",
    badge: "Exciting Trails",
    link: "/tours?search=atv"
  },
  {
    image: "",
    subtitle: "MUDDY TRAILS & RICE FIELDS",
    title: "Conquer Scenic Bali Landscapes",
    description: "Ride through exciting muddy tracks, scenic rivers, and traditional villages on our high-performance quad bikes.",
    badge: "Adrenaline Rush",
    link: "/tours?search=atv"
  },
  {
    image: "",
    subtitle: "RIDE WITH CONFIDENCE",
    title: "Designed for All Skill Levels",
    description: "Whether you're traveling solo, as a couple, with family, or in a group, our professional team ensures a safe, fun, and thrilling experience.",
    badge: "Safe & Professional",
    link: "/tours?search=atv"
  },
  {
    image: "",
    subtitle: "MEMORIES TO LAST A LIFETIME",
    title: "Bali's Ultimate Outdoor Adventure",
    description: "Our dedicated professional guides deliver non-stop fun and support as you navigate Ubud's best ATV trails.",
    badge: "Top Rated",
    link: "/tours?search=atv"
  }
];

export default function Home() {
  const { settings, builderSettings } = useSettings();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  const heroBlock = builderSettings?.blocks.find(b => b.id === 'hero');
  const imagesToUse = heroBlock?.heroImages?.length ? heroBlock.heroImages : settings?.heroImages;
  const singleImageToUse = heroBlock?.image || settings?.heroImage;

  const getHeroTitle = () => {
    const val = heroBlock?.headline || settings?.heroTitle;
    return typeof val === 'string' && val.trim() !== '' ? val : null;
  };
  const getHeroSubtitle = () => {
    const val = heroBlock?.subheadline || settings?.heroSubtitle;
    return typeof val === 'string' && val.trim() !== '' ? val : null;
  };
  const getHeroDescription = () => {
    const val = heroBlock?.description || settings?.heroDescription;
    return typeof val === 'string' && val.trim() !== '' ? val : null;
  };

  const getHeroBadge = () => {
    const val = heroBlock?.badge;
    return typeof val === 'string' && val.trim() !== '' ? val : null;
  };
  const getPrimaryButtonText = (fallback: string) => {
    const val = heroBlock?.primaryButtonText;
    return typeof val === 'string' && val.trim() !== '' ? val : fallback;
  };
  const getPrimaryButtonLink = (fallback: string) => {
    const val = heroBlock?.primaryButtonLink;
    return typeof val === 'string' && val.trim() !== '' ? val : fallback;
  };
  const getSecondaryButtonText = (fallback: string) => {
    const val = heroBlock?.secondaryButtonText;
    return typeof val === 'string' && val.trim() !== '' ? val : fallback;
  };
  const getSecondaryButtonLink = (fallback: string) => {
    const val = heroBlock?.secondaryButtonLink;
    return typeof val === 'string' && val.trim() !== '' ? val : fallback;
  };

  const getHeroBullets = () => {
    if (heroBlock?.heroBullets && heroBlock.heroBullets.length > 0) return heroBlock.heroBullets;
    return ['Free Cancellation up to 24h', 'Verified English Speaking Guides', 'Instant Confirmation'];
  };

  const getHeroOverlayClass = () => {
    const opacity = heroBlock?.overlayOpacity || 'gradient';
    switch(opacity) {
      case 'dark': return 'bg-black/80';
      case 'medium': return 'bg-black/55';
      case 'light': return 'bg-black/25';
      case 'none': return 'bg-transparent';
      case 'gradient':
      default: return 'bg-gradient-to-t from-black/90 via-black/50 to-black/30';
    }
  };

  const slidesToUse = useMemo(() => {
    const baseTitle = getHeroTitle() || "Where Adrenaline Meets Natural Beauty";
    const baseSubtitle = getHeroSubtitle() || (settings?.siteName ? `WELCOME TO ${settings.siteName.toUpperCase()}` : "WELCOME TO TRIPBONE");
    const baseDesc = getHeroDescription() || "Experience an unforgettable off-road journey through lush jungles, scenic rice fields, muddy trails, rivers, and exciting jungle tracks designed for riders of all skill levels.";

    const hasCustomTitle = !!getHeroTitle();
    const hasCustomSubtitle = !!getHeroSubtitle();
    const hasCustomDesc = !!getHeroDescription();

    let result = [...SLIDES];

    if (imagesToUse && Array.isArray(imagesToUse) && imagesToUse.length > 0) {
      result = imagesToUse.map((image, idx) => {
        const baseSlide = SLIDES[idx % SLIDES.length] || SLIDES[0];
        return { ...baseSlide, image };
      });
    } else if (singleImageToUse) {
      result = SLIDES.map((slide, idx) => {
        if (idx === 0) return { ...slide, image: singleImageToUse };
        return slide;
      });
    }

    return result.map(slide => ({
      ...slide,
      badge: getHeroBadge() || slide.badge,
      title: hasCustomTitle ? baseTitle : slide.title,
      subtitle: hasCustomSubtitle ? baseSubtitle : (slide.subtitle.includes('GORILLA') ? baseSubtitle : slide.subtitle),
      description: hasCustomDesc ? baseDesc : slide.description.replace(/Gorilla ATV Adventure/ig, settings?.siteName || 'Tripbone'),
    }));
  }, [imagesToUse, singleImageToUse, heroBlock?.headline, heroBlock?.subheadline, heroBlock?.description, settings?.heroImages, settings?.heroImage, settings?.heroTitle, settings?.heroSubtitle, settings?.heroDescription, settings?.siteName]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesToUse.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slidesToUse.length]);

  const [tours, setTours] = useState<Tour[]>(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).__PRELOADED_DATA__?.featuredTours
    ) {
      return (window as any).__PRELOADED_DATA__.featuredTours;
    }
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("bali_cached_tours");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_FALLBACK_TOURS;
  });
  const [loading, setLoading] = useState(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).__PRELOADED_DATA__?.featuredTours
    ) {
      return false;
    }
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("bali_cached_tours");
        if (cached && JSON.parse(cached).length > 0) {
          return false;
        }
      } catch (e) {}
    }
    return true;
  });
  const [selectedMobileCategory, setSelectedMobileCategory] = useState("all");
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("bali_cached_categories");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    // Elegant default categories to prevent any skeletons on first-ever load
    return [
      { id: "culture-fallback", name: "Art & Culture", icon: "Compass" },
      { id: "beach-fallback", name: "Beach", icon: "Sun" },
      { id: "food-fallback", name: "Food & Drink", icon: "Tag" },
      { id: "history-fallback", name: "History", icon: "Activity" }
    ] as Category[];
  });
  const [reviews, setReviews] = useState<Review[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("bali_cached_reviews");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return [];
  });
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("bali_cached_posts");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_FALLBACK_POSTS;
  });
  const [mobileSearchTerm, setMobileSearchTerm] = useState("");
  const [isAllCategoriesModalOpen, setIsAllCategoriesModalOpen] =
    useState(false);

  const siteUrl = window.location.origin;
  const organizationSchema = generateOrganizationSchema(siteUrl);

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileSearchTerm.trim()) return;
    navigate(`/tours?search=${encodeURIComponent(mobileSearchTerm)}`);
  };

  const homeTitle = (
    settings?.homeTitleFormat || "{{siteName}} - Adventure Tours in Bali"
  ).replace("{{siteName}}", settings?.siteName || "Bali Adventours");

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };


  
  const videoId = heroBlock?.youtubeUrl 
    ? getYoutubeId(heroBlock.youtubeUrl) 
    : (settings?.heroYoutubeUrl ? getYoutubeId(settings.heroYoutubeUrl) : null);

  useEffect(() => {
    const q = query(
      collection(db, "tours"),
      where("status", "in", ["published", "active"]),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tourData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Tour);
      tourData.sort((a, b) => {
        const getTimestampMillis = (val: any): number => {
          if (!val) return 0;
          if (typeof val.toMillis === "function") return val.toMillis();
          if (typeof val.seconds === "number") return val.seconds * 1000;
          if (val instanceof Date) return val.getTime();
          if (typeof val === "string" || typeof val === "number") return new Date(val).getTime() || 0;
          return 0;
        };
        return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
      });
      const limitedTours = tourData.slice(0, 24);
      setTours(limitedTours);
      setLoading(false);
      try {
        localStorage.setItem("bali_cached_tours", JSON.stringify(limitedTours));
      } catch (e) {}
    }, (error) => {
      console.error("[Home Tours Snapshot Error]:", error);
      setLoading(false);
    });

    const timer = setTimeout(() => {
      setIsVideoLoaded(true);
    }, 1000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // 1. Fetch Categories
    const catQuery = query(
      collection(db, "categories"),
      orderBy("name", "asc"),
    );
    const unsubCats = onSnapshot(catQuery, (snapshot) => {
      const catData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Category);
      setCategories(catData);
      try {
        localStorage.setItem("bali_cached_categories", JSON.stringify(catData));
      } catch (e) {}
    });

    // 2. Fetch Reviews (approved)
    const reviewQuery = query(
      collection(db, "reviews"),
      where("status", "==", "approved"),
    );
    const unsubReviews = onSnapshot(reviewQuery, (snapshot) => {
      const reviewData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Review);
      const sorted = reviewData
        .sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds 
            ? a.createdAt.seconds * 1000 + (a.createdAt.nanoseconds || 0) / 1000000
            : (a.createdAt instanceof Date ? a.createdAt.getTime() : typeof a.createdAt === 'number' ? a.createdAt : 0);
          const timeB = b.createdAt?.seconds 
            ? b.createdAt.seconds * 1000 + (b.createdAt.nanoseconds || 0) / 1000000
            : (b.createdAt instanceof Date ? b.createdAt.getTime() : typeof b.createdAt === 'number' ? b.createdAt : 0);
          return timeB - timeA;
        })
        .slice(0, 6);
      setReviews(sorted);
      try {
        localStorage.setItem("bali_cached_reviews", JSON.stringify(sorted));
      } catch (e) {}
    });

    // 3. Fetch Blog Posts (published)
    const postQuery = query(
      collection(db, "posts"),
      where("status", "in", ["published", "active"]),
    );
    const unsubPosts = onSnapshot(postQuery, (snapshot) => {
      const postData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as BlogPost);
      postData.sort((a, b) => {
        const getTimestampMillis = (val: any): number => {
          if (!val) return 0;
          if (typeof val.toMillis === "function") return val.toMillis();
          if (typeof val.seconds === "number") return val.seconds * 1000;
          if (val instanceof Date) return val.getTime();
          if (typeof val === "string" || typeof val === "number") return new Date(val).getTime() || 0;
          return 0;
        };
        return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
      });
      const limitedPosts = postData.slice(0, 6);
      setPosts(limitedPosts);
      try {
        localStorage.setItem("bali_cached_posts", JSON.stringify(limitedPosts));
      } catch (e) {}
    }, (error) => {
      console.error("[Home Posts Snapshot Error]:", error);
    });

    return () => {
      unsubCats();
      unsubReviews();
      unsubPosts();
    };
  }, []);

  const filteredTours = tours.filter(
    (t) =>
      selectedMobileCategory === "all" ||
      t.categoryId === selectedMobileCategory,
  );

  const getFavoriteTours = () => {
    let favs = tours.filter((t) => (t.rating || 0) >= 4.5);
    if (favs.length === 0) favs = tours;
    return favs.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
  };
  const favoriteTours = getFavoriteTours();

  const getFeaturedToursData = () => {
    const block = builderSettings?.blocks?.find(b => b.id === 'featuredTours');
    if (block?.tourIds && block.tourIds.length > 0) {
      const tourMap = new Map(tours.map(t => [t.id, t]));
      const selected = block.tourIds.map(id => tourMap.get(id)).filter((t): t is Tour => !!t);
      if (selected.length > 0) return selected;
    }
    return filteredTours;
  };

  const getGuestFavoritesData = () => {
    const block = builderSettings?.blocks?.find(b => b.id === 'guestFavorites');
    if (block?.tourIds && block.tourIds.length > 0) {
      const tourMap = new Map(tours.map(t => [t.id, t]));
      const selected = block.tourIds.map(id => tourMap.get(id)).filter((t): t is Tour => !!t);
      if (selected.length > 0) return selected;
    }
    return favoriteTours;
  };

  const showEmptyState = !loading && tours.length === 0;

  // Theme Logic
  const getBlock = (id: string) => builderSettings?.blocks.find(b => b.id === id);
  const heroStyle = getBlock('hero')?.design || "slideshow-atv";
  const featuredToursStyle = getBlock('featuredTours')?.design || "default";
  const reviewsStyle = getBlock('reviews')?.design || "slider";
  const blogStyle = getBlock('blog')?.design || "carousel";

  const renderHero = () => {
    switch (heroStyle) {
      case "youtube-video": {
        const heroBlock = getBlock('hero');
        const headline = getHeroTitle() || settings?.siteName || "Adventure Awaits";
        const subheadline = getHeroSubtitle() || settings?.siteDescription || "Explore the best tours with us.";
        return (
          <section className="relative h-screen min-h-[650px] w-full overflow-hidden bg-black flex items-center justify-center">
            {/* Background Video */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {videoId ? (
                <iframe
                  className="absolute w-[300vw] h-[300vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none md:w-[150vw] md:h-[150vh]"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoId}&playsinline=1`}
                  allow="autoplay; encrypted-media"
                  frameBorder="0"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 bg-gray-900" />
              )}
              <div className="absolute inset-0 bg-black/50 z-10" />
            </div>

            {/* Content Overlay */}
            <div className="relative z-20 container mx-auto px-6 lg:px-12 flex flex-col justify-center h-full text-center items-center">
              <span className="text-orange-400 font-bold uppercase tracking-widest text-sm mb-6 block">
                {getHeroSubtitle() || "Welcome"}
              </span>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter drop-shadow-xl max-w-5xl leading-tight"
              >
                {headline}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-6 text-lg md:text-2xl text-gray-200 max-w-2xl font-medium drop-shadow-md"
              >
                {getHeroDescription() || subheadline}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10"
              >
                <Link
                  to={getPrimaryButtonLink("/tours")}
                  className="px-8 py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-orange-700 transition shadow-lg flex items-center gap-2"
                >
                  Explore Now <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>
          </section>
        );
      }
      
      case "slideshow-atv": {
        return (
          <section className="relative h-screen min-h-[650px] w-full overflow-hidden bg-gray-950 flex items-center justify-center">
            {/* Background Slideshow */}
            <div className="absolute inset-0">
              <AnimatePresence initial={false}>
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20 z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 z-10" />
                  {slidesToUse[currentSlide]?.image ? (
                    <img
                      src={slidesToUse[currentSlide]?.image}
                      alt={slidesToUse[currentSlide]?.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#1e1b4b]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.12),transparent_60%)] animate-pulse" style={{ animationDuration: '8s' }} />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.08),transparent_60%)] animate-pulse" style={{ animationDuration: '12s' }} />
                      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Content Overlay */}
            <div className="relative z-20 container mx-auto px-6 lg:px-12 flex flex-col justify-center h-full text-left pt-16">
              <div className="max-w-3xl space-y-6">
                {/* Badge & Subtitle */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={`badge-${currentSlide}`}
                  transition={{ duration: 0.6 }}
                  className="flex items-center gap-3"
                >
                  <span className="bg-primary/25 border border-primary/45 backdrop-blur-md text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-sm">
                    {slidesToUse[currentSlide]?.badge}
                  </span>
                  <div className="h-px w-8 bg-orange-400" />
                  <span className="text-[10px] md:text-xs font-black text-orange-400 tracking-[0.25em] uppercase">
                    {slidesToUse[currentSlide]?.subtitle}
                  </span>
                </motion.div>

                {/* Heading */}
                <motion.h1
                  key={`title-${currentSlide}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight drop-shadow-md"
                >
                  {slidesToUse[currentSlide]?.title}
                </motion.h1>

                {/* Description */}
                <motion.p
                  key={`desc-${currentSlide}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="text-sm md:text-base lg:text-lg text-gray-200 font-medium max-w-2xl leading-relaxed opacity-95 drop-shadow-sm"
                >
                  {slidesToUse[currentSlide]?.description}
                </motion.p>

                {/* Call To Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="flex flex-wrap items-center gap-4 pt-4"
                >
                  <Link
                    to={getPrimaryButtonLink("/tours?search=atv")}
                    className="px-8 py-4 bg-primary text-white hover:opacity-90 active:scale-95 transition-all rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2"
                  >
                    <span>{getPrimaryButtonText("Book ATV Tour Now")}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={getSecondaryButtonLink("/contact")}
                    className="px-8 py-4 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 transition-all rounded-xl border border-white/20 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                  >
                    <span>{getSecondaryButtonText("Inquire / Contact")}</span>
                    <LucideIcons.MessageSquare className="h-4 w-4 text-orange-400" />
                  </Link>
                </motion.div>


              </div>
            </div>

            {/* Slider Navigation Arrows */}
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev === 0 ? slidesToUse.length - 1 : prev - 1))
              }
              className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 hover:bg-black/60 border border-white/10 text-white transition-all active:scale-90"
              aria-label="Previous Slide"
            >
              <LucideIcons.ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev + 1) % slidesToUse.length)
              }
              className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 hover:bg-black/60 border border-white/10 text-white transition-all active:scale-90"
              aria-label="Next Slide"
            >
              <LucideIcons.ChevronRight className="h-6 w-6" />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
              {slidesToUse.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    currentSlide === idx ? "w-8 bg-primary" : "w-2 bg-white/40 hover:bg-white/70"
                  )}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </section>
        );
      }

      case "airbnb-classic":
      case "airbnb-fluid": {
        const getPhotoTourLink = (keyword: string, fallbackTerm: string) => {
          const found = tours.find((t) =>
            t.title?.toLowerCase().includes(keyword.toLowerCase()),
          );
          if (found) return `/tour/${found.slug || found.id}`;
          return `/tours?search=${encodeURIComponent(fallbackTerm)}`;
        };

        return (
          <section className="relative min-h-screen lg:h-screen flex items-center pt-28 pb-12 bg-zinc-100 text-zinc-900 w-full overflow-hidden">
            <div
              className={cn(
                "w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-16 justify-center",
                heroStyle === "airbnb-fluid"
                  ? "px-4"
                  : "container mx-auto px-4 lg:px-8",
              )}
            >
              {/* Left Side: Title & Integrated Search Form */}
              <div className="w-full lg:w-[45%] flex flex-col justify-center space-y-8 z-10">
                <div>
                  <h1 className="text-5xl md:text-7xl font-extrabold text-zinc-900 leading-[1.05] tracking-tight whitespace-pre-wrap">
                    {getHeroTitle() || (
                      <>
                        Discover <br />
                        <span className="text-primary">Balinese</span> Wonders
                      </>
                    )}
                  </h1>
                  <p className="mt-4 text-base text-zinc-600 font-medium leading-relaxed whitespace-pre-wrap">
                    {getHeroDescription() || "Curated expeditions and private custom adventures with trusted local hosts. Hand-vetted tours, high-performance transports, and custom timelines tailored around you."}
                  </p>
                </div>

                {/* Modern search form embedded directly inside the Hero page flow */}
                <div className="w-full">
                  <SearchForm />
                </div>

                <div className="flex items-center gap-6 text-xs font-bold text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Local Private Guides
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Flexible Calendars
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Instant Booking
                  </span>
                </div>
              </div>

              {/* Right Side: Dynamic 3-Photo Staggered Masonry Board */}
              {(() => {
                const configuredImages = (imagesToUse && imagesToUse.length > 0)
                  ? imagesToUse
                  : (singleImageToUse ? [singleImageToUse] : []);

                const tourImages = tours.map(t => t.featuredImage || t.gallery?.[0] || (t as any).coverImage || (t as any).image).filter(Boolean);

                const defaultUnsplash = [
                  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
                  "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
                  "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=800&q=80"
                ];

                const img1 = configuredImages[0] || tourImages[0] || defaultUnsplash[0];
                const img2 = configuredImages[1] || tourImages[1] || defaultUnsplash[1];
                const img3 = configuredImages[2] || tourImages[2] || defaultUnsplash[2];

                const title1 = tours[0]?.title || "Exploring Rice Terrace";
                const title2 = tours[1]?.title || "Best Sunrise Trekking";
                const title3 = tours[2]?.title || "For Your Instagram Feed";

                return (
                  <div className="w-full lg:w-[55%] grid grid-cols-2 gap-4 select-none">
                    {/* Column 1 - Custom Staggered Column */}
                    <div className="space-y-4 pt-4 md:pt-8 flex flex-col justify-center">
                      <Link
                        to={getPhotoTourLink("rice", title1)}
                        className="block relative overflow-hidden rounded-[2rem] group shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer aspect-[3/4] bg-zinc-200"
                      >
                        <SmartImage
                          src={img1}
                          alt={title1}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                          aspectRatio="portrait"
                          priority={true}
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 min-h-[40%] flex flex-col justify-end z-[5]">
                          <span className="text-white font-black text-xs md:text-sm line-clamp-2">
                            {title1}
                          </span>
                          <span className="text-orange-400 font-bold text-[9px] uppercase tracking-wider mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Explore Expedition
                          </span>
                        </div>
                      </Link>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                      <Link
                        to={getPhotoTourLink("trekking", title2)}
                        className="block relative overflow-hidden rounded-[2rem] group shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer aspect-square bg-zinc-200"
                      >
                        <SmartImage
                          src={img2}
                          alt={title2}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                          aspectRatio="square"
                          priority={true}
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 min-h-[40%] flex flex-col justify-end z-[5]">
                          <span className="text-white font-black text-xs md:text-sm line-clamp-2">
                            {title2}
                          </span>
                          <span className="text-orange-400 font-bold text-[9px] uppercase tracking-wider mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Explore Expedition
                          </span>
                        </div>
                      </Link>
                      <Link
                        to={getPhotoTourLink("instagram", title3)}
                        className="block relative overflow-hidden rounded-[2rem] group shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer aspect-square bg-zinc-200"
                      >
                        <SmartImage
                          src={img3}
                          alt={title3}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                          aspectRatio="square"
                          priority={true}
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 min-h-[40%] flex flex-col justify-end z-[5]">
                          <span className="text-white font-black text-xs md:text-sm line-clamp-2">
                            {title3}
                          </span>
                          <span className="text-orange-400 font-bold text-[9px] uppercase tracking-wider mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Explore Expedition
                          </span>
                        </div>
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        );
      }

      case "modern-dark":
      case "modern-glass":
        const isGlass = heroStyle === "modern-glass";
        return (
          <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gray-950 px-4 pt-20">
            <div className="absolute top-0 left-0 w-full h-full opacity-30">
              {(singleImageToUse || imagesToUse?.[0]) ? (
                <img
                  src={singleImageToUse || imagesToUse?.[0]}
                  className="w-full h-full object-cover filter brightness-50"
                  alt="Dark Bali"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#1e1b4b]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.1),transparent_60%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.06),transparent_60%)]" />
                </div>
              )}
            </div>
            {isGlass && (
              <div className="absolute inset-0 backdrop-blur-[5px]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-transparent to-gray-950" />

            <div className="relative z-10 max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-400/10 border border-orange-400/20 rounded-full mb-8">
                <div className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400">
                  {getHeroSubtitle() || "Expedition Engine Active"}
                </span>
              </div>
              <h1 className="text-6xl md:text-[10rem] font-black text-white leading-[0.8] tracking-tighter mb-12 uppercase italic">
                {getHeroTitle() ? (
                  <span dangerouslySetInnerHTML={{__html: getHeroTitle()!.replace(/\n/g, '<br />')}} />
                ) : (
                  <>Pure <br /> <span className="text-orange-400 not-italic">Engine</span></>
                )}
              </h1>
              <p className="text-orange-100/50 text-xl font-medium max-w-2xl mx-auto mb-16 leading-relaxed">
                {getHeroDescription() || "High-performance Balinese adventures. Engineered for those who demand the absolute peak of exploration."}
              </p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <Link
                  to={getPrimaryButtonLink("/tours")}
                  className="px-12 py-5 bg-orange-400 text-gray-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_50px_-10px_rgba(52,211,153,0.5)]"
                >
                  Launch Finder
                </Link>
                <Link
                  to="/planner"
                  className="px-12 py-5 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
                >
                  Neural Planner
                </Link>
              </div>
            </div>
          </section>
        );

      case "minimal-grid":
      case "minimal-type":
        const isType = heroStyle === "minimal-type";
        return (
          <section className="bg-white min-h-[80vh] flex flex-col md:flex-row border-b border-gray-100">
            <div className="flex-1 p-8 md:p-20 flex flex-col justify-center border-r border-gray-100">
              <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-gray-400 mb-8">
                {getHeroSubtitle() || "Vol. 01 — The Expedition"}
              </span>
              <h1
                className={cn(
                  "text-7xl md:text-[11rem] font-black tracking-tighter leading-none mb-12 uppercase",
                  isType ? "italic font-serif" : "",
                )}
              >
                {getHeroTitle() ? (
                  <span dangerouslySetInnerHTML={{__html: getHeroTitle()!.replace(/\n/g, '<br />')}} />
                ) : (
                  <>Soul <br /> Deep.</>
                )}
              </h1>
              <div className="max-w-md">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-loose mb-16">
                  {getHeroDescription() || "A curated study of Balinese life. Twelve chapters, twelve locations, one unforgettable narrative."}
                </p>
                <Link
                  to={getPrimaryButtonLink("/tours")}
                  className="inline-flex items-center gap-12 group"
                >
                  <span className="text-[11px] font-black uppercase tracking-[0.6em]">
                    View Catalog
                  </span>
                  <div className="h-px w-20 bg-gray-900 group-hover:w-40 transition-all" />
                </Link>
              </div>
            </div>
            <div className="flex-1 hidden md:block grayscale hover:grayscale-0 transition-all duration-700">
              {(singleImageToUse || imagesToUse?.[0]) ? (
                <img
                  src={singleImageToUse || imagesToUse?.[0]}
                  className="w-full h-full object-cover"
                  alt="Minimalist Scene"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8">
                  <div className="text-center font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                    Brand Gallery Empty
                  </div>
                </div>
              )}
            </div>
          </section>
        );

      case "premium-serif":
      case "premium-full":
        const isFull = heroStyle === "premium-full";
        return (
          <section
            className={cn(
              "relative min-h-screen flex items-center justify-center overflow-hidden",
              isFull ? "bg-black" : "bg-[#fdfcfb]",
            )}
          >
            <div className="absolute inset-0 opacity-40">
              {(singleImageToUse || imagesToUse?.[0]) ? (
                <img
                  src={singleImageToUse || imagesToUse?.[0]}
                  className="w-full h-full object-cover"
                  alt="Luxury Bali"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#1e1b4b]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.12),transparent_60%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.08),transparent_60%)]" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />

            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
              <div className="flex items-center justify-center gap-6 mb-12">
                <div className="h-px w-16 bg-amber-400/40" />
                <span className="font-serif italic text-amber-500 text-xl">
                  {getHeroSubtitle() || "The Signature Collection"}
                </span>
                <div className="h-px w-16 bg-amber-400/40" />
              </div>
              <h1 className="text-6xl md:text-9xl font-serif text-white tracking-[0.05em] leading-[0.9] mb-16">
                {getHeroTitle() ? (
                  <span dangerouslySetInnerHTML={{__html: getHeroTitle()!.replace(/\n/g, '<br />')}} />
                ) : (
                  <>Elegance <br /> in Motion</>
                )}
              </h1>
              <p className="max-w-xl mx-auto text-white/50 text-xs uppercase tracking-[0.7em] font-light leading-loose mb-20">
                {getHeroDescription() || "Where high luxury meets the untamed beauty of the Indonesian Archipelago."}
              </p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-16">
                <Link
                  to={getPrimaryButtonLink("/tours")}
                  className="text-white text-[10px] font-black uppercase tracking-[0.5em] hover:text-amber-500 transition-colors border-b border-white/20 pb-2"
                >
                  Destinations
                </Link>
                <Link
                  to="/about"
                  className="text-white text-[10px] font-black uppercase tracking-[0.5em] hover:text-amber-500 transition-colors border-b border-white/20 pb-2"
                >
                  The Philosophy
                </Link>
                <Link
                  to={getSecondaryButtonLink("/contact")}
                  className="text-white text-[10px] font-black uppercase tracking-[0.5em] hover:text-amber-500 transition-colors border-b border-white/20 pb-2"
                >
                  Inquiry
                </Link>
              </div>
            </div>
          </section>
        );

      case "saas-clean":
      case "saas-dash":
        return (
          <section className="relative pt-48 pb-32 overflow-hidden bg-[#fafafa]">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="container mx-auto px-4 lg:px-8 relative z-10">
              <div className="flex flex-col lg:flex-row items-center gap-20">
                <div className="lg:w-1/2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-gray-100 shadow-sm mb-10">
                    <span className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                      v2.0
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">
                      Cloud-based trip management
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-300" />
                  </div>
                  <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-none mb-10">
                    {getHeroTitle() ? (
                      <span dangerouslySetInnerHTML={{__html: getHeroTitle()!.replace(/\n/g, '<br />')}} />
                    ) : (
                      <>The OS for <br /> <span className="text-primary italic">Adventure.</span></>
                    )}
                  </h1>
                  <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-lg mb-12">
                    {getHeroDescription() || "Unified infrastructure for Balinese exploration. Real-time availability, instant confirmations, and API-driven local experiences."}
                  </p>
                  <div className="flex flex-wrap gap-4 mb-16">
                    <Link
                      to="/login"
                      className="px-10 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                    >
                      Start Free Trial
                    </Link>
                    <Link
                      to={getPrimaryButtonLink("/tours")}
                      className="px-10 py-5 bg-white text-gray-900 border border-gray-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                      Quick Search
                    </Link>
                  </div>
                  <div className="pt-10 border-t border-gray-100">
                    <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest mb-6">
                      Trusted by organizations worldwide
                    </p>
                    <div className="flex items-center gap-10 opacity-30 grayscale">
                      <Globe className="h-8 w-8" />
                      <Zap className="h-8 w-8" />
                      <Leaf className="h-8 w-8" />
                      <Sparkles className="h-8 w-8" />
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2 relative">
                  <img
                    src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80"
                    className="w-full aspect-square object-cover rounded-[3rem] shadow-2xl"
                    alt="SaaS Hero"
                  />
                  <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[2rem] shadow-2xl border border-gray-100 animate-float hidden md:block">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-primary font-black">
                        98%
                      </div>
                      <span className="text-sm font-bold text-gray-900 uppercase">
                        Success Rate
                      </span>
                    </div>
                    <div className="w-48 h-2 bg-gray-50 rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case "split-media-right": {
        const headline = getHeroTitle() || "Curated Expeditions & Private Custom Adventures";
        const subtitle = getHeroSubtitle() || (getHeroBadge() || "⭐ #1 Rated Tour Operator in Bali");
        const desc = getHeroDescription() || "Hand-vetted tours, high-performance transports, and custom timelines. Engineered for travelers who seek the extraordinary.";
        const mediaSrc = singleImageToUse || imagesToUse?.[0] || "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80";
        const videoBg = heroBlock?.videoUrl || heroBlock?.youtubeUrl;

        return (
          <section className="relative min-h-[90vh] flex items-center pt-28 pb-16 bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 blur-[120px] pointer-events-none" />
            <div className="container mx-auto px-6 lg:px-12 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                {/* Left Side: Copy & Actions */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                    <span className="text-xs font-extrabold uppercase tracking-widest text-orange-300">
                      {subtitle}
                    </span>
                  </div>

                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight text-white">
                    {headline}
                  </h1>

                  <p className="text-base md:text-xl text-gray-300 font-medium leading-relaxed max-w-2xl">
                    {desc}
                  </p>

                  {/* Bullet Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {getHeroBullets().map((bullet, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-sm">
                        <LucideIcons.CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-xs font-bold text-gray-200">{bullet}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions & Search */}
                  <div className="flex flex-wrap items-center gap-4 pt-4">
                    <Link
                      to={getPrimaryButtonLink("/tours")}
                      className="px-8 py-4 bg-primary hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
                    >
                      <span>{getPrimaryButtonText("Explore All Tours")}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to={getSecondaryButtonLink("/contact")}
                      className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all backdrop-blur-md flex items-center gap-2"
                    >
                      <span>{getSecondaryButtonText("Custom Inquiry")}</span>
                      <LucideIcons.MessageSquare className="w-4 h-4 text-orange-400" />
                    </Link>
                  </div>

                  {heroBlock?.showSearch !== false && (
                    <div className="pt-4 max-w-2xl">
                      <SearchForm />
                    </div>
                  )}
                </div>

                {/* Right Side: Elevated Glass Media Card */}
                <div className="lg:col-span-5 relative">
                  <div className="relative rounded-[2.5rem] overflow-hidden border border-white/20 bg-white/5 p-3 backdrop-blur-xl shadow-2xl group">
                    <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-gray-900">
                      {videoBg ? (
                        <div className="relative w-full h-full">
                          {videoId ? (
                            <iframe
                              className="w-full h-full object-cover scale-[1.3]"
                              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1`}
                              allow="autoplay; encrypted-media"
                            />
                          ) : (
                            <video src={videoBg} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                          )}
                        </div>
                      ) : (
                        <img src={mediaSrc} alt="Hero Media" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Floating Rating Badge */}
                      <div className="absolute top-4 left-4 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white text-xs font-bold flex items-center gap-2">
                        <LucideIcons.Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>4.9 / 5.0 (1,200+ Verified Guests)</span>
                      </div>

                      {/* Floating Play Button */}
                      {videoBg && (
                        <button
                          type="button"
                          onClick={() => setActiveVideoModal(videoBg)}
                          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group/btn"
                        >
                          <Play className="w-7 h-7 fill-white ml-1" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case "centered-overlay": {
        const headline = getHeroTitle() || "Experience Unmatched Balinese Wonders";
        const subtitle = getHeroSubtitle() || (getHeroBadge() || "PREMIUM ADVENTURES & PRIVATE TRANSPORTS");
        const desc = getHeroDescription() || "Handpicked expeditions with instant confirmation and dedicated private concierge.";
        const bgImage = singleImageToUse || imagesToUse?.[0] || "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80";

        return (
          <section className="relative min-h-screen w-full flex flex-col justify-between pt-32 pb-16 bg-gray-950 text-white overflow-hidden">
            {/* Background Image / Overlay */}
            <div className="absolute inset-0 z-0">
              <img src={bgImage} className="w-full h-full object-cover" alt="Hero Cover" />
              <div className={cn("absolute inset-0 z-10", getHeroOverlayClass())} />
            </div>

            {/* Main Center Content */}
            <div className="relative z-20 container mx-auto px-6 lg:px-12 flex flex-col items-center text-center my-auto max-w-5xl space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-md text-white">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-black uppercase tracking-widest">{subtitle}</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] text-white drop-shadow-2xl">
                {headline}
              </h1>

              <p className="text-lg md:text-2xl text-gray-200 font-medium max-w-3xl leading-relaxed drop-shadow-md">
                {desc}
              </p>

              {/* Embedded Floating Search Widget */}
              {heroBlock?.showSearch !== false && (
                <div className="w-full max-w-4xl pt-4">
                  <div className="p-3 bg-white/15 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl">
                    <SearchForm />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Trust Metrics Bar */}
            <div className="relative z-20 container mx-auto px-6 lg:px-12 pt-12 border-t border-white/10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="space-y-1">
                  <span className="text-2xl md:text-3xl font-black text-white">10,000+</span>
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Happy Travelers</p>
                </div>
                <div className="space-y-1">
                  <span className="text-2xl md:text-3xl font-black text-white">100+</span>
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Handpicked Tours</p>
                </div>
                <div className="space-y-1">
                  <span className="text-2xl md:text-3xl font-black text-white">4.9 / 5.0</span>
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Guest Rating</p>
                </div>
                <div className="space-y-1">
                  <span className="text-2xl md:text-3xl font-black text-white">24/7</span>
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Local Concierge</p>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case "bento-grid-hero": {
        const headline = getHeroTitle() || "Explore Bali’s Peak Destinations";
        const desc = getHeroDescription() || "Custom private drivers, ATV adventures, sunrise volcano treks, and Instagram private tours.";
        const bgImage = singleImageToUse || imagesToUse?.[0] || "https://images.unsplash.com/photo-1518548419070-2c61b179ad65?auto=format&fit=crop&w=1200&q=80";
        const topTour = tours[0];

        return (
          <section className="relative min-h-screen pt-28 pb-16 bg-zinc-950 text-white flex items-center overflow-hidden">
            <div className="container mx-auto px-6 lg:px-12 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Bento Card 1: Main Banner (Span 8) */}
                <div className="lg:col-span-8 relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-gray-900 p-8 md:p-12 flex flex-col justify-between min-h-[500px] group shadow-2xl">
                  <img src={bgImage} className="absolute inset-0 w-full h-full object-cover filter brightness-50 group-hover:scale-105 transition-transform duration-700" alt="Bento Main" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

                  <div className="relative z-20 space-y-3">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest shadow-md">
                      {getHeroBadge() || "FEATURED EXPERIENCE"}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white max-w-2xl">
                      {headline}
                    </h1>
                  </div>

                  <div className="relative z-20 space-y-6 pt-8">
                    <p className="text-base md:text-lg text-gray-200 font-medium max-w-xl">
                      {desc}
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <Link
                        to={getPrimaryButtonLink("/tours")}
                        className="px-8 py-4 bg-primary hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
                      >
                        <span>{getPrimaryButtonText("Book Expedition")}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Right Column: Bento Cards 2 & 3 (Span 4) */}
                <div className="lg:col-span-4 grid grid-cols-1 gap-6">
                  {/* Bento Card 2: Spotlight Tour */}
                  <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-gray-900 p-6 flex flex-col justify-between min-h-[240px] group">
                    <img
                      src={topTour?.gallery?.[0] || topTour?.featuredImage || "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80"}
                      className="absolute inset-0 w-full h-full object-cover filter brightness-50 group-hover:scale-105 transition-transform duration-500"
                      alt="Spotlight Tour"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

                    <div className="relative z-20 flex items-center justify-between">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                        Top Rated
                      </span>
                      {topTour?.regularPrice && (
                        <span className="px-3 py-1 bg-amber-400 text-gray-950 font-black text-xs rounded-full">
                          <FormattedPrice amount={topTour.discountPrice || topTour.regularPrice} />
                        </span>
                      )}
                    </div>

                    <div className="relative z-20 space-y-2">
                      <h3 className="text-xl font-bold text-white line-clamp-1">
                        {topTour?.title || "Mount Batur Sunrise Volcano Trek"}
                      </h3>
                      <Link
                        to={topTour ? `/tour/${topTour.slug || topTour.id}` : "/tours"}
                        className="inline-flex items-center gap-2 text-xs font-black text-primary hover:underline uppercase tracking-wider"
                      >
                        <span>Explore Tour</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Bento Card 3: Trust & Instant Concierge */}
                  <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-gray-900 via-gray-950 to-black p-6 flex flex-col justify-between min-h-[240px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                          WhatsApp Concierge
                        </span>
                      </div>
                      <LucideIcons.ShieldCheck className="w-6 h-6 text-primary" />
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-300">
                        Need custom itineraries or direct driver bookings? Talk directly with our Balinese travel team.
                      </p>
                      <Link
                        to="/contact"
                        className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center block transition-all"
                      >
                        Chat with Concierge
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case "floating-card-hero": {
        const headline = getHeroTitle() || "Explore Bali Like Never Before";
        const desc = getHeroDescription() || "Hand-vetted local guides, private transports, and instant confirmation for all activities.";
        const bgImage = singleImageToUse || imagesToUse?.[0] || "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1600&q=80";

        return (
          <section className="relative min-h-screen w-full flex items-center justify-start pt-28 pb-16 bg-gray-950 overflow-hidden">
            {/* Full Bleed Background Media */}
            <div className="absolute inset-0 z-0">
              <img src={bgImage} className="w-full h-full object-cover" alt="Floating Hero Cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
            </div>

            {/* Elevated Floating Search Island */}
            <div className="relative z-20 container mx-auto px-6 lg:px-12">
              <div className="max-w-xl bg-white/95 backdrop-blur-2xl border border-white/40 p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-gray-900 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-primary text-xs font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{getHeroBadge() || "INSTANT PRIVATE BOOKINGS"}</span>
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                  {headline}
                </h1>

                <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed">
                  {desc}
                </p>

                <div className="pt-2">
                  <SearchForm />
                </div>
              </div>
            </div>
          </section>
        );
      }

      default:
        return (
          <section className="relative h-[85vh] w-full overflow-hidden hidden md:block bg-gray-900">
            {videoId && isVideoLoaded ? (
              <div className="absolute inset-0 w-full h-full pointer-events-none scale-[1.05]">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&playlist=${videoId}&iv_load_policy=3&enablejsapi=1`}
                  title="Hero Background Video"
                  className="w-full h-full scale-[1.35] md:scale-[1.5]"
                  allow="autoplay; encrypted-media"
                />
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full">
                <SmartImage
                  src={
                    videoId
                      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                      : settings?.ogImage ||
                        "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1600&q=80"
                  }
                  alt="Bali Landscape"
                  className="h-full w-full object-cover"
                  priority
                  aspectRatio="auto"
                  width={1920}
                  quality={80}
                />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 pb-20">
              <span className="mb-4 inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider">
                Explore Bali
              </span>
              <h1 className="mb-6 text-4xl font-black md:text-6xl leading-[0.95] tracking-tighter max-w-4xl">
                Discover the Hidden{" "}
                <span className="text-secondary">Treasures</span> of Bali
              </h1>
              <p className="mb-10 max-w-xl text-lg text-gray-100 font-medium leading-relaxed opacity-90">
                Curated expeditions through active volcanoes, emerald rice
                terraces, and ancient water temples.
              </p>
            </div>

            <div className="absolute bottom-[150px] left-0 w-full z-30">
              <SearchForm />
            </div>
          </section>
        );
    }
  };

  const renderFeaturedTours = () => {
    const featuredToursData = getFeaturedToursData();
    switch (featuredToursStyle) {
      case "airbnb-classic":
      case "airbnb-fluid":
        return (
          <section className="container mx-auto px-4 py-16 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Featured Guest Favorites
              </h2>
              <Link
                to={getPrimaryButtonLink("/tours")}
                className="text-sm font-bold text-gray-900 underline underline-offset-4"
              >
                Show all (50+)
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredToursData.slice(0, 4).map((tour, index) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  index={index}
                  variant="minimal"
                />
              ))}
            </div>
          </section>
        );

      case "modern-dark":
      case "modern-glass":
        return (
          <section className="py-24 bg-gray-950 overflow-hidden">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 text-white">
                <div>
                  <span className="text-orange-400 font-black text-[10px] uppercase tracking-widest">
                    The Core Collection
                  </span>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter mt-4 mb-6 italic uppercase">
                    Selected <br /> Units
                  </h2>
                </div>
                <p className="text-lg text-white/50 font-medium max-w-xs">
                  Optimized for high-impact experiences.
                </p>
              </div>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {featuredToursData.slice(0, 3).map((tour, index) => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                    index={index}
                    variant="modern"
                  />
                ))}
              </div>
            </div>
          </section>
        );

      case "minimal-grid":
      case "minimal-type":
        const isType = featuredToursStyle === "minimal-type";
        return (
          <section className="py-24 border-b border-gray-100">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="flex flex-col md:flex-row gap-20">
                <div className="md:w-1/4">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 mb-8 block">
                    Collection / 1
                  </span>
                  <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-8">
                    Selected <br /> Works
                  </h2>
                  <Link
                    to={getPrimaryButtonLink("/tours")}
                    className="text-[10px] font-black uppercase tracking-[0.3em] border-b border-gray-900 pb-1"
                  >
                    Enter Volume
                  </Link>
                </div>
                <div className="md:w-3/4">
                  <div className="grid gap-12 sm:grid-cols-2">
                    {featuredToursData.slice(0, 4).map((tour, index) => (
                      <div key={tour.id} className="group cursor-pointer">
                        <div className="aspect-[16/10] bg-gray-50 overflow-hidden mb-6 filter grayscale group-hover:grayscale-0 transition-all duration-700">
                          <img
                            src={tour.gallery?.[0] || tour.featuredImage}
                            className="w-full h-full object-cover"
                            alt={tour.title}
                          />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 block">
                          Tour 0{index + 1}
                        </span>
                        <h3
                          className={cn(
                            "text-xl font-black uppercase tracking-tighter group-hover:text-gray-400 transition-colors",
                            isType ? "italic font-serif" : "",
                          )}
                        >
                          {tour.title}
                        </h3>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case "premium-serif":
      case "premium-full":
        return (
          <section className="py-32 bg-[#fffcf5]">
            <div className="container mx-auto px-4">
              <div className="text-center mb-24">
                <h2 className="text-4xl md:text-7xl font-serif text-gray-900 tracking-widest uppercase mb-6 leading-none">
                  The <br /> Portfolio
                </h2>
                <div className="h-px w-20 bg-amber-400 mx-auto" />
              </div>
              <div className="grid gap-24">
                {featuredToursData.slice(0, 3).map((tour, index) => (
                  <div
                    key={tour.id}
                    className={cn(
                      "flex flex-col lg:flex-row items-center gap-16",
                      index % 2 === 1 ? "lg:flex-row-reverse" : "",
                    )}
                  >
                    <div className="lg:w-1/2 aspect-[16/10] shadow-2xl overflow-hidden">
                      <img
                        src={tour.gallery?.[0] || tour.featuredImage}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                        alt={tour.title}
                      />
                    </div>
                    <div className="lg:w-1/2 space-y-8">
                      <span className="text-amber-600/50 font-serif italic text-xl">
                        Issue 0{index + 1}
                      </span>
                      <h3 className="text-4xl font-serif text-gray-900 tracking-tight leading-none mb-4 italic">
                        {tour.title}
                      </h3>
                      <p className="text-gray-500 font-light leading-relaxed max-w-md italic">
                        {tour.description}
                      </p>
                      <Link
                        to={`/tour/${tour.slug}`}
                        className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 border-b border-amber-400 pb-2"
                      >
                        Discover the story
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case "saas-clean":
      case "saas-dash":
        return (
          <section className="py-24 container mx-auto px-4">
            <div className="mb-20">
              <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
                Product Line
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mt-2">
                Unified Experiences
              </h2>
            </div>
            <div className="grid gap-px bg-gray-100 border border-gray-100 rounded-[2rem] overflow-hidden">
              {featuredToursData.slice(0, 6).map((tour, index) => (
                <div
                  key={tour.id}
                  className="bg-white p-12 hover:bg-gray-50 transition-colors flex flex-col md:flex-row items-center gap-12 group"
                >
                  <div className="h-16 w-16 bg-gray-950 rounded-2xl flex items-center justify-center text-white font-black shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-primary transition-colors">
                      {tour.title}
                    </h3>
                    <p className="text-gray-500 font-medium text-sm line-clamp-1">
                      {tour.description}
                    </p>
                  </div>
                  <Link
                    to={`/tour/${tour.slug}`}
                    className="px-8 py-4 bg-gray-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Deploy
                  </Link>
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return (
          <section className="container mx-auto px-4 py-12 md:py-20 lg:px-8">
            <div className="mb-8 flex md:flex-row md:items-end justify-between gap-6 hidden md:flex">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="h-4 w-4 text-primary" />
                  <span className="text-primary text-xs font-black">
                    Handpicked experiences
                  </span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">
                  Featured Tours
                </h2>
                <p className="mt-3 text-gray-500 font-medium text-lg">
                  Curated expeditions our guests love most
                </p>
              </div>
              <Link
                to={getPrimaryButtonLink("/tours")}
                className="flex items-center gap-2 text-primary font-black text-xs group"
              >
                View all tours{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 min-h-[400px]">
              {loading && tours.length === 0
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-4 animate-pulse">
                      <div className="aspect-[4/3] w-full bg-gray-100 rounded-[16px]" />
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-100 rounded-full w-1/3" />
                        <div className="h-4 bg-gray-100 rounded-full w-full" />
                      </div>
                    </div>
                  ))
                : featuredToursData
                    .slice(0, 8)
                    .map((tour, index) => (
                      <TourCard key={tour.id} tour={tour} index={index} />
                    ))}
            </div>
          </section>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{settings?.metaTitle || homeTitle}</title>
        <meta
          name="description"
          content={
            settings?.siteDescription ||
            `Discover the hidden treasures of Bali with ${settings?.siteName || "Bali Adventours"}.`
          }
        />
        <meta name="keywords" content={settings?.siteKeywords} />
        <link rel="canonical" href={siteUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={settings?.metaTitle || homeTitle} />
        <meta
          property="og:description"
          content={
            settings?.siteDescription ||
            "Expertly curated expeditions through Bali."
          }
        />
        <meta
          property="og:image"
          content={settings?.ogImage || settings?.heroImage || settings?.logoURL || "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80"}
        />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={siteUrl} />
        <meta
          property="twitter:title"
          content={settings?.metaTitle || homeTitle}
        />
        <meta
          property="twitter:description"
          content={
            settings?.siteDescription ||
            "Expertly curated expeditions through Bali."
          }
        />
        <meta
          property="twitter:image"
          content={settings?.ogImage || settings?.heroImage || settings?.logoURL || "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80"}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c') }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${siteUrl}/tours?search={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }).replace(/</g, '\\u003c'),
          }}
        />
      </Helmet>

      {/* Mobile Redesigned View Layout with 10 Presets */}
      <div className="block md:hidden bg-white pt-0 pb-6">
        <MobileHomePresets
          preset={settings?.mobilePreset || builderSettings?.mobilePreset || 'klook-explorer'}
          tours={tours}
          filteredTours={filteredTours}
          favoriteTours={getGuestFavoritesData()}
          categories={categories}
          reviews={reviews}
          posts={posts}
          selectedCategory={selectedMobileCategory}
          onSelectCategory={setSelectedMobileCategory}
          loading={loading}
          settings={settings}
          builderSettings={builderSettings}
          onOpenCategoriesModal={() => setIsAllCategoriesModalOpen(true)}
          heroSlides={slidesToUse}
        />
      </div>

      {/* Categories modal selection bottom-sheet */}
      <AnimatePresence>
        {isAllCategoriesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs"
              onClick={() => setIsAllCategoriesModalOpen(false)}
            />

            {/* Modal Drawer Sheet */}
            <motion.div
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              exit={{ y: "110%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl z-10 max-h-[85vh] flex flex-col overflow-hidden text-left"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <LucideIcons.LayoutGrid className="h-5 w-5 text-primary" />
                  Choose Category
                </h3>
                <button
                  onClick={() => setIsAllCategoriesModalOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <LucideIcons.X className="h-6 w-6" />
                </button>
              </div>

              <div className="overflow-y-auto py-2 space-y-2 flex-1 scrollbar-hidden pb-8">
                {/* "All" Option */}
                <button
                  onClick={() => {
                    setSelectedMobileCategory("all");
                    setIsAllCategoriesModalOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left",
                    selectedMobileCategory === "all"
                      ? "bg-primary/5 border border-primary/20 text-primary"
                      : "hover:bg-gray-50 border border-transparent text-gray-700",
                  )}
                >
                  <div
                    className={cn(
                      "p-2.5 rounded-lg",
                      selectedMobileCategory === "all"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-500",
                    )}
                  >
                    <LucideIcons.Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-black text-sm block">
                      All Destinations & Tours
                    </span>
                    <span className="text-xs text-gray-400">
                      View all available curated expeditions
                    </span>
                  </div>
                </button>

                {/* Categories list */}
                {categories.map((cat) => {
                  const isActive = selectedMobileCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedMobileCategory(cat.id);
                        setIsAllCategoriesModalOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left",
                        isActive
                          ? "bg-primary/5 border border-primary/20 text-primary"
                          : "hover:bg-gray-50 border border-transparent text-gray-700",
                      )}
                    >
                      <div
                        className={cn(
                          "p-2.5 rounded-lg",
                          isActive
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-500",
                        )}
                      >
                        <CategoryIcon iconName={cat.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-black text-sm block">
                          {cat.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          Discover active {cat.name.toLowerCase()} tours
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sections */}
      <div className="hidden md:block">
        {(!builderSettings || builderSettings.blocks.find(b => b.id === 'hero')?.active !== false) && renderHero()}
        {(!builderSettings || builderSettings.blocks.find(b => b.id === 'featuredTours')?.active !== false) && renderFeaturedTours()}

        {/* Car Rental & Chauffeur Charter Showcase (Positioned between Featured Tours & Guest Favorites) */}
        {settings?.carRentalModule?.enabled !== false && settings?.carRentalModule?.showOnHomepage !== false && (
          <LazySection>
            <CarRentalShowcase />
          </LazySection>
        )}

        {(!builderSettings || builderSettings.blocks.find(b => b.id === 'guestFavorites')?.active !== false) && (
          <LazySection>
            <TopRatedTours />
          </LazySection>
        )}

        {(!builderSettings || builderSettings.blocks.find(b => b.id === 'reviews')?.active !== false) && (
          <LazySection>
            <ReviewSlider />
          </LazySection>
        )}

        {(!builderSettings || builderSettings.blocks.find(b => b.id === 'blog')?.active !== false) && (
          <LazySection>
            <BlogSection />
          </LazySection>
        )}
      </div>

      {/* Video Lightbox Modal */}
      <AnimatePresence>
        {activeVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            onClick={() => setActiveVideoModal(null)}
          >
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/20" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="absolute top-4 right-4 z-50 p-3 rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-all"
              >
                <LucideIcons.X className="w-6 h-6" />
              </button>
              {activeVideoModal.includes('youtube') || activeVideoModal.includes('youtu.be') ? (
                <iframe
                  className="w-full h-full"
                  src={`${activeVideoModal.replace('watch?v=', 'embed/')}?autoplay=1`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <video src={activeVideoModal} autoPlay controls className="w-full h-full object-contain" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
