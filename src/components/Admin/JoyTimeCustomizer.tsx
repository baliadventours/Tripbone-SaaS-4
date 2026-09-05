import React, { useState } from 'react';
import { 
  Palette, Image as ImageIcon, Sparkles, Plus, Trash2, Sliders, Check, 
  Eye, RefreshCw, Upload, ArrowRight, Layers, Tag, ExternalLink, Copy,
  ArrowUp, ArrowDown, Star, MessageSquare, BookOpen, Clock, Play
} from 'lucide-react';
import { JoyTimePresetCustomization, JoyTimeBannerSlide } from '../../types';
import { cn } from '../../lib/utils';
import { uploadImage } from '../../lib/imgbb';

export type JoyTimeCustomization = JoyTimePresetCustomization;

export interface JoyTimeCustomizerProps {
  customization?: JoyTimePresetCustomization;
  value?: JoyTimePresetCustomization;
  onChange: (updated: JoyTimePresetCustomization) => void;
  brandLogo?: string;
  brandName?: string;
}

const DEFAULT_BANNERS: JoyTimeBannerSlide[] = [
  {
    id: 'banner-default-1',
    badge: 'Travel like a VIP',
    title: '25% OFF COMBO',
    subtitle: 'Fast Track, Chauffeur & Island Tour',
    promoCode: 'COMBO25',
    buttonText: 'Book Now',
    link: '/tours',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    gradientFrom: '#0284c7',
    gradientVia: '#2563eb',
    gradientTo: '#4338ca',
    gradientDirection: 'to-r',
    overlayOpacity: 35
  }
];

const PRESET_PALETTES = [
  {
    name: 'JoyTime Sky Blue (Default)',
    primary: '#0284c7',
    secondary: '#0369a1',
    accent: '#f59e0b',
    headerBg: '#ffffff',
    gradientClass: 'from-sky-500 to-blue-600'
  },
  {
    name: 'Tropical Azure & Cyan',
    primary: '#0284c7',
    secondary: '#0ea5e9',
    accent: '#10b981',
    headerBg: '#f0f9ff',
    gradientClass: 'from-cyan-500 to-sky-600'
  },
  {
    name: 'Bali Emerald Jungle',
    primary: '#059669',
    secondary: '#047857',
    accent: '#f59e0b',
    headerBg: '#ffffff',
    gradientClass: 'from-emerald-500 to-teal-700'
  },
  {
    name: 'Sunset Riviera Coral',
    primary: '#f43f5e',
    secondary: '#e11d48',
    accent: '#fbbf24',
    headerBg: '#ffffff',
    gradientClass: 'from-rose-500 to-pink-600'
  },
  {
    name: 'Klook Energy Orange',
    primary: '#ea580c',
    secondary: '#c2410c',
    accent: '#facc15',
    headerBg: '#ffffff',
    gradientClass: 'from-orange-500 to-amber-600'
  },
  {
    name: 'Royal Safari Indigo',
    primary: '#4f46e5',
    secondary: '#3730a3',
    accent: '#fbbf24',
    headerBg: '#ffffff',
    gradientClass: 'from-indigo-600 to-purple-800'
  },
  {
    name: 'Obsidian Dark Elegance',
    primary: '#0f172a',
    secondary: '#1e293b',
    accent: '#d97706',
    headerBg: '#0f172a',
    gradientClass: 'from-slate-800 to-zinc-950'
  }
];

const PRESET_GRADIENTS = [
  {
    name: 'Sky & Deep Ocean',
    from: '#0284c7',
    via: '#2563eb',
    to: '#4338ca',
    dir: 'to-r' as const
  },
  {
    name: 'Sunset Fire & Coral',
    from: '#f97316',
    via: '#f43f5e',
    to: '#be185d',
    dir: 'to-r' as const
  },
  {
    name: 'Emerald Sea & Teal',
    from: '#059669',
    via: '#0d9488',
    to: '#0284c7',
    dir: 'to-r' as const
  },
  {
    name: 'Neon Violet & Berry',
    from: '#7c3aed',
    via: '#a855f7',
    to: '#ec4899',
    dir: 'to-r' as const
  },
  {
    name: 'Golden Luxury Royal',
    from: '#78350f',
    via: '#b45309',
    to: '#d97706',
    dir: 'to-r' as const
  },
  {
    name: 'Midnight Indigo Slate',
    from: '#0f172a',
    via: '#1e1b4b',
    to: '#312e81',
    dir: 'to-r' as const
  }
];

const CURATED_IMAGE_PRESETS = [
  {
    label: 'Nusa Penida Beach',
    url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Ubud Jungle & River',
    url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Luxury Catamaran & Yacht',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Mount Batur 4x4 Jeep',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Tropical Sunset Temple',
    url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'
  }
];

export default function JoyTimeCustomizer({
  customization,
  value,
  onChange,
  brandLogo,
  brandName = 'My Tour Brand'
}: JoyTimeCustomizerProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'banners' | 'sections'>('colors');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  const effectiveCustomization = customization || value;
  const primaryColor = effectiveCustomization?.primaryColor || '#0284c7';
  const secondaryColor = effectiveCustomization?.secondaryColor || '#0369a1';
  const accentColor = effectiveCustomization?.accentColor || '#f59e0b';
  const headerBgColor = effectiveCustomization?.headerBgColor || '#ffffff';
  
  const banners = effectiveCustomization?.banners && effectiveCustomization.banners.length > 0 
    ? effectiveCustomization.banners 
    : DEFAULT_BANNERS;

  // Multi-Banner layout and slider options
  const bannerLayout = effectiveCustomization?.bannerLayout || 'slider';
  const bannerAutoplay = effectiveCustomization?.bannerAutoplay !== false;
  const bannerAutoplayInterval = effectiveCustomization?.bannerAutoplayInterval || 4500;
  const showBannerDots = effectiveCustomization?.showBannerDots !== false;
  const showBannerCounter = effectiveCustomization?.showBannerCounter ?? true;

  // Homepage section settings
  const showReviewsSection = effectiveCustomization?.showReviewsSection !== false;
  const reviewsTitle = effectiveCustomization?.reviewsTitle || 'Traveler Reviews & Experiences';
  const reviewsSubtitle = effectiveCustomization?.reviewsSubtitle || 'Real reviews from verified travelers';
  const reviewsBgStyle = effectiveCustomization?.reviewsBgStyle || 'subtle-slate';

  const showBlogSection = effectiveCustomization?.showBlogSection !== false;
  const blogTitle = effectiveCustomization?.blogTitle || 'Travel Guides & Stories';
  const blogSubtitle = effectiveCustomization?.blogSubtitle || 'Insider tips, curated itineraries & packing guides';
  const blogBgStyle = effectiveCustomization?.blogBgStyle || 'transparent';

  const currentSlide = banners[activeSlideIndex] || banners[0] || DEFAULT_BANNERS[0];

  const updateCustomization = (partial: Partial<JoyTimePresetCustomization>) => {
    onChange({
      primaryColor,
      secondaryColor,
      accentColor,
      headerBgColor,
      banners,
      bannerLayout,
      bannerAutoplay,
      bannerAutoplayInterval,
      showBannerDots,
      showBannerCounter,
      showReviewsSection,
      reviewsTitle,
      reviewsSubtitle,
      reviewsBgStyle,
      showBlogSection,
      blogTitle,
      blogSubtitle,
      blogBgStyle,
      ...partial
    });
  };

  const updateCurrentSlide = (partial: Partial<JoyTimeBannerSlide>) => {
    const updated = [...banners];
    updated[activeSlideIndex] = {
      ...currentSlide,
      ...partial
    };
    updateCustomization({ banners: updated });
  };

  const handleAddSlide = () => {
    const newSlide: JoyTimeBannerSlide = {
      id: `banner-${Date.now()}`,
      badge: 'Special Promo',
      title: 'HOT SUMMER OFFER',
      subtitle: 'Exclusive discounts on all daily tours',
      promoCode: 'SUMMER20',
      buttonText: 'Explore Now',
      link: '/tours',
      image: CURATED_IMAGE_PRESETS[1].url,
      gradientFrom: primaryColor,
      gradientVia: secondaryColor,
      gradientTo: '#1e293b',
      gradientDirection: 'to-r',
      overlayOpacity: 35
    };
    const updated = [...banners, newSlide];
    updateCustomization({ banners: updated });
    setActiveSlideIndex(updated.length - 1);
  };

  const handleDuplicateSlide = (index: number) => {
    const target = banners[index];
    if (!target) return;
    const duplicated: JoyTimeBannerSlide = {
      ...target,
      id: `banner-${Date.now()}`,
      title: `${target.title} (Copy)`
    };
    const updated = [...banners];
    updated.splice(index + 1, 0, duplicated);
    updateCustomization({ banners: updated });
    setActiveSlideIndex(index + 1);
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const updated = [...banners];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    updateCustomization({ banners: updated });
    setActiveSlideIndex(targetIndex);
  };

  const handleDeleteSlide = (index: number) => {
    if (banners.length <= 1) {
      alert('You need at least one promotion banner slide.');
      return;
    }
    const updated = banners.filter((_, i) => i !== index);
    updateCustomization({ banners: updated });
    setActiveSlideIndex(Math.max(0, index - 1));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      updateCurrentSlide({ image: url });
    } catch (err) {
      console.error(err);
      alert('Failed to upload banner image.');
    } finally {
      setUploading(false);
    }
  };

  const getGradientCss = (slide: JoyTimeBannerSlide) => {
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

  return (
    <div className="bg-white border border-sky-200/80 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-700 border border-sky-200">
              JoyTime Studio
            </span>
            <span className="text-xs font-bold text-gray-500">Live Customizer</span>
          </div>
          <h3 className="text-xl font-black text-gray-900 mt-1">JoyTime Mobile Colors & Banner Builder</h3>
          <p className="text-xs text-gray-500 max-w-2xl mt-0.5">
            Customize the theme colors, header background, and design multi-slide promotional banners with custom gradient overlays for your mobile storefront.
          </p>
        </div>

        {/* Sub Navigation Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('colors')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2",
              activeTab === 'colors' ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Palette className="w-3.5 h-3.5 text-sky-600" />
            Color Palette
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2",
              activeTab === 'banners' ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
            Multi-Banner & Slider ({banners.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2",
              activeTab === 'sections' ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            Homepage Sections (Reviews & Blog)
          </button>
        </div>
      </div>

      {/* TAB 1: COLORS CUSTOMIZER */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          {/* Quick Palette Swatches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                1-Click Preset Palettes
              </label>
              <button
                type="button"
                onClick={() => updateCustomization({
                  primaryColor: '#0284c7',
                  secondaryColor: '#0369a1',
                  accentColor: '#f59e0b',
                  headerBgColor: '#ffffff'
                })}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset to Default
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {PRESET_PALETTES.map((palette) => {
                const isMatch = primaryColor === palette.primary && secondaryColor === palette.secondary;
                return (
                  <button
                    key={palette.name}
                    type="button"
                    onClick={() => updateCustomization({
                      primaryColor: palette.primary,
                      secondaryColor: palette.secondary,
                      accentColor: palette.accent,
                      headerBgColor: palette.headerBg
                    })}
                    className={cn(
                      "p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 relative",
                      isMatch 
                        ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/40" 
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    )}
                  >
                    {isMatch && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-sky-600 rounded-full flex items-center justify-center text-white">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: palette.primary }} />
                      <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: palette.secondary }} />
                      <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: palette.accent }} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 leading-tight">{palette.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{palette.primary}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Fine-Tune Pickers */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-4">
              Fine-Tune Custom Theme Colors
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Primary Color */}
              <div className="space-y-1.5 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
                <label className="text-xs font-bold text-gray-700 block">Primary Accent</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => updateCustomization({ primaryColor: e.target.value })}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => updateCustomization({ primaryColor: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-800 uppercase"
                  />
                </div>
                <span className="text-[10px] text-gray-400 block">Search buttons, cart badges, active indicators.</span>
              </div>

              {/* Secondary Color */}
              <div className="space-y-1.5 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
                <label className="text-xs font-bold text-gray-700 block">Secondary Accent</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => updateCustomization({ secondaryColor: e.target.value })}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => updateCustomization({ secondaryColor: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-800 uppercase"
                  />
                </div>
                <span className="text-[10px] text-gray-400 block">Gradient blends, hover rings, icon borders.</span>
              </div>

              {/* Accent / Tag Color */}
              <div className="space-y-1.5 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
                <label className="text-xs font-bold text-gray-700 block">VIP Tag & Star Gold</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => updateCustomization({ accentColor: e.target.value })}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => updateCustomization({ accentColor: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-800 uppercase"
                  />
                </div>
                <span className="text-[10px] text-gray-400 block">VIP badges, promo tags, ranking crowns.</span>
              </div>

              {/* Header Background */}
              <div className="space-y-1.5 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
                <label className="text-xs font-bold text-gray-700 block">Mobile Header Canvas</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={headerBgColor}
                    onChange={(e) => updateCustomization({ headerBgColor: e.target.value })}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={headerBgColor}
                    onChange={(e) => updateCustomization({ headerBgColor: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-800 uppercase"
                  />
                </div>
                <span className="text-[10px] text-gray-400 block">Top sticky header background color.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BANNER & GRADIENT BUILDER */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          {/* Multi-Banner Layout Modes Card */}
          <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  Multi-Banner Display Options
                </h4>
                <p className="text-[11px] text-sky-800 font-medium mt-0.5">
                  Choose how promotional slides are rendered and animated on the JoyTime mobile storefront.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-sky-700 border border-sky-200 self-start">
                {banners.length} Active {banners.length === 1 ? 'Banner' : 'Banners'}
              </span>
            </div>

            {/* Layout Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {[
                { 
                  id: 'slider', 
                  title: 'Full-Width Slider', 
                  desc: 'Auto-sliding touch carousel with pagination dots & swipe',
                  icon: Play
                },
                { 
                  id: 'carousel-peek', 
                  title: 'Peek Carousel', 
                  desc: 'Card shows 86% with adjacent slide peeking to invite swipe',
                  icon: Layers
                },
                { 
                  id: 'multi-scroll', 
                  title: 'Card Stream', 
                  desc: 'Horizontal scrollable row of compact promo banners',
                  icon: ArrowRight
                },
                { 
                  id: 'stacked', 
                  title: 'Stacked Cards', 
                  desc: 'Vertical stacked banners with high-impact visuals',
                  icon: Tag
                }
              ].map((opt) => {
                const isSelected = bannerLayout === opt.id;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateCustomization({ bannerLayout: opt.id as any })}
                    className={cn(
                      "p-3 rounded-xl text-left transition-all border flex flex-col justify-between cursor-pointer",
                      isSelected 
                        ? "bg-white border-sky-600 ring-2 ring-sky-500/20 shadow-xs" 
                        : "bg-white/60 border-sky-100 hover:bg-white hover:border-sky-300"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <IconComponent className={cn("w-4 h-4", isSelected ? "text-sky-600" : "text-gray-400")} />
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                      </div>
                      <p className={cn("text-xs font-black", isSelected ? "text-sky-950" : "text-gray-800")}>
                        {opt.title}
                      </p>
                      <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Slider Settings Row */}
            <div className="pt-2 border-t border-sky-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Autoplay toggle */}
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-sky-100">
                <div>
                  <p className="text-[11px] font-bold text-gray-800">Auto-Slide Carousel</p>
                  <p className="text-[9px] text-gray-500">Automatically advance slides</p>
                </div>
                <input
                  type="checkbox"
                  checked={bannerAutoplay}
                  onChange={(e) => updateCustomization({ bannerAutoplay: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
              </div>

              {/* Autoplay speed */}
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-sky-100">
                <div>
                  <p className="text-[11px] font-bold text-gray-800">Slide Timing</p>
                  <p className="text-[9px] text-gray-500">Duration per slide</p>
                </div>
                <select
                  value={bannerAutoplayInterval}
                  onChange={(e) => updateCustomization({ bannerAutoplayInterval: Number(e.target.value) })}
                  className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-2 py-1 cursor-pointer"
                  disabled={!bannerAutoplay}
                >
                  <option value={3000}>3 seconds</option>
                  <option value={4500}>4.5 seconds</option>
                  <option value={6000}>6 seconds</option>
                  <option value={8000}>8 seconds</option>
                </select>
              </div>

              {/* Dots & Counter */}
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-sky-100">
                <div>
                  <p className="text-[11px] font-bold text-gray-800">Indicators & Dots</p>
                  <p className="text-[9px] text-gray-500">Pills & counter tag</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-[10px] font-bold text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBannerDots}
                      onChange={(e) => updateCustomization({ showBannerDots: e.target.checked })}
                      className="w-3.5 h-3.5 text-sky-600 rounded"
                    />
                    Dots
                  </label>
                  <label className="flex items-center gap-1 text-[10px] font-bold text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBannerCounter}
                      onChange={(e) => updateCustomization({ showBannerCounter: e.target.checked })}
                      className="w-3.5 h-3.5 text-sky-600 rounded"
                    />
                    1/{banners.length}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Slide Switcher Strip */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 bg-gray-50 p-2.5 rounded-2xl border border-gray-200/80">
            <div className="flex items-center gap-1.5 flex-wrap">
              {banners.map((slide, idx) => (
                <div key={slide.id || idx} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveSlideIndex(idx)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer",
                      activeSlideIndex === idx
                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    <Tag className="w-3 h-3" />
                    Slide {idx + 1}: {slide.title ? (slide.title.length > 14 ? slide.title.slice(0, 14) + '...' : slide.title) : 'Promo'}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddSlide}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-gray-100 text-sky-700 transition flex items-center gap-1 border border-dashed border-sky-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Slide
              </button>
            </div>

            {/* Slide Actions Toolbar */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleMoveSlide(activeSlideIndex, 'up')}
                disabled={activeSlideIndex === 0}
                className="p-1.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-white border border-gray-200 disabled:opacity-30 cursor-pointer"
                title="Move Slide Left"
              >
                <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveSlide(activeSlideIndex, 'down')}
                disabled={activeSlideIndex === banners.length - 1}
                className="p-1.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-white border border-gray-200 disabled:opacity-30 cursor-pointer"
                title="Move Slide Right"
              >
                <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => handleDuplicateSlide(activeSlideIndex)}
                className="px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:text-sky-700 rounded-lg hover:bg-white border border-gray-200 flex items-center gap-1 cursor-pointer"
                title="Duplicate Current Slide"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
              {banners.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteSlide(activeSlideIndex)}
                  className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 border border-rose-200 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Left: Controls */}
            <div className="space-y-5">
              {/* 1. Banner Content Fields */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-3">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-sky-600" />
                  Text & Copywriting
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">VIP Badge Text</label>
                    <input
                      type="text"
                      value={currentSlide.badge || ''}
                      onChange={(e) => updateCurrentSlide({ badge: e.target.value })}
                      placeholder="e.g. Travel like a VIP"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Promo Code</label>
                    <input
                      type="text"
                      value={currentSlide.promoCode || ''}
                      onChange={(e) => updateCurrentSlide({ promoCode: e.target.value })}
                      placeholder="e.g. COMBO25"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600">Main Title / Headline</label>
                  <input
                    type="text"
                    value={currentSlide.title || ''}
                    onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                    placeholder="e.g. 25% OFF COMBO"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600">Subtitle / Offer Description</label>
                  <input
                    type="text"
                    value={currentSlide.subtitle || ''}
                    onChange={(e) => updateCurrentSlide({ subtitle: e.target.value })}
                    placeholder="e.g. Fast Track, Chauffeur & Island Tour"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Button CTA Text</label>
                    <input
                      type="text"
                      value={currentSlide.buttonText || 'Book Now'}
                      onChange={(e) => updateCurrentSlide({ buttonText: e.target.value })}
                      placeholder="Book Now"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Target Link URL</label>
                    <input
                      type="text"
                      value={currentSlide.link || '/tours'}
                      onChange={(e) => updateCurrentSlide({ link: e.target.value })}
                      placeholder="/tours or /tour/slug"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Color Gradient Selector */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-sky-600" />
                    Color Gradient Selector
                  </h4>
                  <span className="text-[10px] font-bold text-gray-500">Real-time dynamic CSS</span>
                </div>

                {/* Preset Gradients */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_GRADIENTS.map((grad) => (
                    <button
                      key={grad.name}
                      type="button"
                      onClick={() => updateCurrentSlide({
                        gradientFrom: grad.from,
                        gradientVia: grad.via,
                        gradientTo: grad.to,
                        gradientDirection: grad.dir
                      })}
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 text-left transition flex items-center gap-2"
                    >
                      <div 
                        className="w-5 h-5 rounded-md shrink-0 shadow-2xs" 
                        style={{ background: `linear-gradient(to right, ${grad.from}, ${grad.to})` }} 
                      />
                      <span className="text-[10px] font-bold text-gray-700 truncate">{grad.name}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Gradient Stops */}
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">From (Start)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={currentSlide.gradientFrom || '#0284c7'}
                        onChange={(e) => updateCurrentSlide({ gradientFrom: e.target.value })}
                        className="w-7 h-7 rounded cursor-pointer border p-0.5"
                      />
                      <input
                        type="text"
                        value={currentSlide.gradientFrom || '#0284c7'}
                        onChange={(e) => updateCurrentSlide({ gradientFrom: e.target.value })}
                        className="w-full text-[10px] font-mono px-1 py-1 bg-white border rounded"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">Via (Middle)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={currentSlide.gradientVia || '#2563eb'}
                        onChange={(e) => updateCurrentSlide({ gradientVia: e.target.value })}
                        className="w-7 h-7 rounded cursor-pointer border p-0.5"
                      />
                      <input
                        type="text"
                        value={currentSlide.gradientVia || ''}
                        onChange={(e) => updateCurrentSlide({ gradientVia: e.target.value })}
                        placeholder="Optional"
                        className="w-full text-[10px] font-mono px-1 py-1 bg-white border rounded"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">To (End)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={currentSlide.gradientTo || '#4338ca'}
                        onChange={(e) => updateCurrentSlide({ gradientTo: e.target.value })}
                        className="w-7 h-7 rounded cursor-pointer border p-0.5"
                      />
                      <input
                        type="text"
                        value={currentSlide.gradientTo || '#4338ca'}
                        onChange={(e) => updateCurrentSlide({ gradientTo: e.target.value })}
                        className="w-full text-[10px] font-mono px-1 py-1 bg-white border rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Gradient Direction & Opacity */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">Gradient Angle</label>
                    <select
                      value={currentSlide.gradientDirection || 'to-r'}
                      onChange={(e) => updateCurrentSlide({ gradientDirection: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                    >
                      <option value="to-r">Left to Right (→)</option>
                      <option value="to-br">Top-Left to Bottom-Right (↘)</option>
                      <option value="to-b">Top to Bottom (↓)</option>
                      <option value="to-tr">Bottom-Left to Top-Right (↗)</option>
                      <option value="to-l">Right to Left (←)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-500">Overlay Opacity</label>
                      <span className="text-[10px] font-mono font-bold text-sky-600">
                        {currentSlide.overlayOpacity ?? 35}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={currentSlide.overlayOpacity ?? 35}
                      onChange={(e) => updateCurrentSlide({ overlayOpacity: parseInt(e.target.value, 10) })}
                      className="w-full accent-sky-600"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Image Selector */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-3">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                  Background Image Selector
                </h4>

                <div className="flex items-center gap-3">
                  <label className="px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-xs font-bold text-gray-700 cursor-pointer flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5 text-sky-600" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={currentSlide.image || ''}
                    onChange={(e) => updateCurrentSlide({ image: e.target.value })}
                    placeholder="Or paste image URL"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                  />
                </div>

                {/* Quick Travel Preset Photos */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-gray-400">Quick Curated Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {CURATED_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => updateCurrentSlide({ image: preset.url })}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold border transition",
                          currentSlide.image === preset.url
                            ? "bg-sky-50 text-sky-700 border-sky-400"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Real-time Live Interactive Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-600" />
                  Live Mobile Banner Card Preview
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  Slide {activeSlideIndex + 1} of {banners.length}
                </span>
              </div>

              {/* The Live Rendered Card */}
              <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200 max-w-sm mx-auto">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  JoyTime Promotion Section
                </p>

                <div 
                  className="relative rounded-2xl overflow-hidden text-white shadow-lg transition-all min-h-[160px] flex flex-col justify-between"
                  style={{ background: getGradientCss(currentSlide) }}
                >
                  {/* Photo Overlay */}
                  {currentSlide.image && (
                    <div 
                      className="absolute inset-0 mix-blend-overlay bg-cover bg-center pointer-events-none transition-all"
                      style={{
                        backgroundImage: `url(${currentSlide.image})`,
                        opacity: (currentSlide.overlayOpacity ?? 35) / 100
                      }}
                    />
                  )}

                  {/* Card Content */}
                  <div className="relative z-10 p-5 flex flex-col justify-between h-full">
                    <div className="space-y-1.5">
                      <span 
                        className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block"
                        style={{ color: accentColor, backgroundColor: 'rgba(0,0,0,0.2)' }}
                      >
                        {currentSlide.badge || 'Travel like a VIP'}
                      </span>
                      <h4 className="text-xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
                        {currentSlide.title || '25% OFF COMBO'}
                      </h4>
                      <p className="text-[11px] text-white/90 font-medium line-clamp-1">
                        {currentSlide.subtitle || 'Fast Track, Chauffeur & Island Tour'}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black tracking-wider text-amber-200 border border-white/25">
                        CODE: {currentSlide.promoCode || 'COMBO25'}
                      </span>
                      <span className="text-xs font-black text-white flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                        {currentSlide.buttonText || 'Book Now'} <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* Multiple Slides Indicator */}
                  {banners.length > 1 && (
                    <div className="absolute bottom-2 right-3 flex items-center gap-1 z-20">
                      {banners.map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            activeSlideIndex === i ? "w-4 bg-white" : "w-1.5 bg-white/40"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOMEPAGE SECTIONS (REVIEWS & BLOG) */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80">
            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              Homepage Content Modules
            </h4>
            <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
              Control the social proof and editorial content featured directly on the JoyTime mobile homepage. All content automatically syncs with your live database.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Review & Testimonials Section */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900">Review & Social Proof Section</h4>
                    <p className="text-[10px] text-gray-500">Highlight verified customer feedback on homepage</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showReviewsSection}
                    onChange={(e) => updateCustomization({ showReviewsSection: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700">Section Headline</label>
                  <input
                    type="text"
                    value={reviewsTitle}
                    onChange={(e) => updateCustomization({ reviewsTitle: e.target.value })}
                    placeholder="e.g. Traveler Reviews & Experiences"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700">Section Subtitle</label>
                  <input
                    type="text"
                    value={reviewsSubtitle}
                    onChange={(e) => updateCustomization({ reviewsSubtitle: e.target.value })}
                    placeholder="e.g. Real reviews from verified travelers"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                  />
                </div>

                {/* Reviews Section Background Style */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                    <span>Section Background Theme</span>
                    <span className="text-[10px] font-medium text-gray-400 capitalize">{reviewsBgStyle.replace('-', ' ')}</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: 'subtle-slate', label: 'Slate', bg: 'bg-slate-100 border-slate-300 text-slate-800' },
                      { id: 'soft-sky', label: 'Sky Blue', bg: 'bg-sky-50 border-sky-300 text-sky-800' },
                      { id: 'warm-cream', label: 'Warm', bg: 'bg-[#faf6f0] border-amber-300 text-amber-900' },
                      { id: 'pure-white', label: 'White', bg: 'bg-white border-gray-300 text-gray-800' },
                      { id: 'dark-luxury', label: 'Dark', bg: 'bg-slate-900 border-slate-700 text-white' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateCustomization({ reviewsBgStyle: opt.id as any })}
                        className={cn(
                          "py-1.5 px-1 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer",
                          opt.bg,
                          reviewsBgStyle === opt.id ? "ring-2 ring-sky-500 shadow-xs scale-102" : "opacity-80 hover:opacity-100"
                        )}
                      >
                        <span className="truncate">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sample Review Card Mobile Preview */}
              <div className="pt-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Live Review Card Layout</p>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center">
                        SJ
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-800 leading-tight">Sarah Jenkins</p>
                        <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Verified Traveler
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 italic">
                    "Unbelievable experience! Private driver was prompt, helpful, and took amazing pictures."
                  </p>
                  <div className="text-[9px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md inline-block">
                    Booked: Nusa Penida Island Tour
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Blog & Guides Section */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900">Blog & Travel Guides Section</h4>
                    <p className="text-[10px] text-gray-500">Showcase articles, tips & itineraries on homepage</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBlogSection}
                    onChange={(e) => updateCustomization({ showBlogSection: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700">Section Headline</label>
                  <input
                    type="text"
                    value={blogTitle}
                    onChange={(e) => updateCustomization({ blogTitle: e.target.value })}
                    placeholder="e.g. Travel Guides & Stories"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700">Section Subtitle</label>
                  <input
                    type="text"
                    value={blogSubtitle}
                    onChange={(e) => updateCustomization({ blogSubtitle: e.target.value })}
                    placeholder="e.g. Insider tips, curated itineraries & packing guides"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                  />
                </div>

                {/* Blog Section Background Style */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                    <span>Section Background Theme</span>
                    <span className="text-[10px] font-medium text-gray-400 capitalize">{blogBgStyle === 'transparent' ? 'Clean Default' : blogBgStyle.replace('-', ' ')}</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: 'transparent', label: 'Clean', bg: 'bg-gray-50 border-gray-200 text-gray-700' },
                      { id: 'subtle-slate', label: 'Slate', bg: 'bg-slate-100 border-slate-300 text-slate-800' },
                      { id: 'soft-sky', label: 'Sky Blue', bg: 'bg-sky-50 border-sky-300 text-sky-800' },
                      { id: 'warm-cream', label: 'Warm', bg: 'bg-[#faf6f0] border-amber-300 text-amber-900' },
                      { id: 'pure-white', label: 'White', bg: 'bg-white border-gray-300 text-gray-800' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateCustomization({ blogBgStyle: opt.id as any })}
                        className={cn(
                          "py-1.5 px-1 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer",
                          opt.bg,
                          blogBgStyle === opt.id ? "ring-2 ring-sky-500 shadow-xs scale-102" : "opacity-80 hover:opacity-100"
                        )}
                      >
                        <span className="truncate">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sample Blog Card Mobile Preview */}
              <div className="pt-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Live Guide Card Layout</p>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex gap-3 items-center">
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=160&q=80"
                    alt="Guide"
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-sky-100 text-sky-700">
                      Travel Guide
                    </span>
                    <p className="text-[11px] font-bold text-gray-800 truncate">Top 7 Hidden Beaches You Must Visit</p>
                    <p className="text-[9px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> 4 min read · Concierge Desk
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="pt-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                Full JoyTime Mobile Header & Accent Live Sync
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Active on Mobile Devices
            </span>
          </div>

          <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div 
              className="p-3 border-b border-gray-100 flex items-center justify-between"
              style={{ backgroundColor: headerBgColor }}
            >
              <div className="flex items-center gap-2">
                {brandLogo ? (
                  <img src={brandLogo} alt="Logo" className="h-6 w-auto max-w-[80px] object-contain" />
                ) : (
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {brandName[0]}
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-black text-gray-900 leading-none">{brandName}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                    Verified Partner
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow-2xs font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Tag className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Search Pill */}
            <div className="p-3 bg-gray-50/50">
              <div className="bg-white border border-gray-200 rounded-full px-3 py-1.5 flex items-center justify-between shadow-2xs">
                <span className="text-[11px] text-gray-400 font-medium">Search activities, tours...</span>
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
