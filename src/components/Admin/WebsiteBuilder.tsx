import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, onSnapshot, addDoc, updateDoc, serverTimestamp } from '../../lib/firebase';
import { db } from '../../lib/firebase';
import { useTenant } from '../../lib/TenantContext';
import { LayoutTemplate, Menu, Save, Loader2, Image as ImageIcon, Plus, Trash2, X, AlertCircle, Upload, LayoutGrid, Star, Heart, ArrowUp, ArrowDown, Search, Check, Sparkles, Mail, CheckCircle, Smartphone, Compass, Eye } from 'lucide-react';
import { uploadImage } from '../../lib/imgbb';
import { cn } from '../../lib/utils';

export interface BlockConfig {
  id: string;
  active: boolean;
  design: string;
  // Generic fields for flexibility
  headline?: string;
  subheadline?: string;
  description?: string;
  badge?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  image?: string;
  heroImages?: string[];
  youtubeUrl?: string;
  videoUrl?: string;
  mediaType?: 'image' | 'slideshow' | 'video';
  overlayOpacity?: 'none' | 'light' | 'medium' | 'dark' | 'gradient';
  showSearch?: boolean;
  heroBullets?: string[];
  menuId?: string;
  tourIds?: string[];
}

export interface CustomMenu {
  id: string;
  name: string;
  location: 'top-nav' | 'main-nav' | 'footer-1' | 'footer-2' | 'footer-3' | 'footer-bottom' | 'none';
  links: { label: string; url: string }[];
}

export interface WebsiteBuilderSettings {
  blocks: BlockConfig[];
  menus: CustomMenu[];
  mobilePreset?: string;
}

const DEFAULT_BLOCKS: BlockConfig[] = [
  { id: 'topNav', active: true, design: 'default' },
  { id: 'mainNav', active: true, design: 'default' },
  { id: 'hero', active: true, design: 'slideshow-atv', headline: 'Discover the extraordinary.', subheadline: 'Unforgettable adventures await.' },
  { id: 'featuredTours', active: true, design: 'default', tourIds: [], headline: 'Featured Tours', subheadline: 'Handpicked experiences our guests love most' },
  { id: 'guestFavorites', active: true, design: 'default', tourIds: [], headline: 'Guest Favorites', subheadline: 'Overwhelmingly positive guest expeditions' },
  { id: 'reviews', active: true, design: 'slider' },
  { id: 'blog', active: true, design: 'carousel' },
  { id: 'footer', active: true, design: 'default' }
];

function TourPickerManager({
  block,
  toursList,
  updateBlock,
  blockType
}: {
  block: BlockConfig;
  toursList: any[];
  updateBlock: (id: string, updates: Partial<BlockConfig>) => void;
  blockType: 'featuredTours' | 'guestFavorites';
}) {
  const [search, setSearch] = useState('');
  const selectedIds = block.tourIds || [];

  // Get selected tour objects in exact order
  const selectedTours = selectedIds
    .map(id => toursList.find(t => t.id === id))
    .filter(Boolean);

  // Available tours matching search query
  const filteredAvailableTours = toursList.filter(t =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.location?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleTour = (tourId: string) => {
    const isSelected = selectedIds.includes(tourId);
    const nextIds = isSelected
      ? selectedIds.filter(id => id !== tourId)
      : [...selectedIds, tourId];
    updateBlock(block.id, { tourIds: nextIds });
  };

  const moveTour = (index: number, direction: 'up' | 'down') => {
    const newIds = [...selectedIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newIds.length) return;
    const temp = newIds[index];
    newIds[index] = newIds[targetIndex];
    newIds[targetIndex] = temp;
    updateBlock(block.id, { tourIds: newIds });
  };

  const isFeatured = blockType === 'featuredTours';
  const icon = isFeatured ? <Star className="w-4 h-4 fill-amber-400 text-amber-500" /> : <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />;

  return (
    <div className="space-y-6">
      {/* Selected Tours Section */}
      <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h4 className="font-bold text-gray-900 text-sm">
              Currently Selected {isFeatured ? 'Featured Tours' : 'Favorite Tours'} ({selectedTours.length})
            </h4>
          </div>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => updateBlock(block.id, { tourIds: [] })}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Clear Selection
            </button>
          )}
        </div>

        {selectedTours.length === 0 ? (
          <div className="text-center py-6 px-4 border border-dashed border-gray-300 rounded-xl bg-white">
            <p className="text-xs text-gray-500 font-medium">
              No specific tours selected. The frontpage will automatically show all {isFeatured ? 'published tours' : 'top rated tours'}.
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Select tours from the list below to explicitly pick and re-order what appears on the frontpage.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-gray-500">
              Use arrow buttons to re-order how tours appear on your frontpage:
            </p>
            {selectedTours.map((tour, idx) => (
              <div
                key={tour.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-600 shrink-0">
                    {idx + 1}
                  </span>
                  <img
                    src={tour.featuredImage || tour.gallery?.[0] || 'https://picsum.photos/seed/tour/100/100'}
                    alt={tour.title}
                    className="w-12 h-12 object-cover rounded-lg shrink-0 border border-gray-100"
                  />
                  <div className="min-w-0">
                    <h5 className="font-bold text-gray-900 text-xs truncate">{tour.title}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                      <span>${tour.discountPrice || tour.regularPrice}</span>
                      {tour.duration && <span>• {tour.duration}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => moveTour(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-600"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTour(idx, 'down')}
                    disabled={idx === selectedTours.length - 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-600"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTour(tour.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Tours Selector */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Available Tours ({toursList.length})
          </label>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tours..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50/50">
          {filteredAvailableTours.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-4">No matching tours found.</p>
          ) : (
            filteredAvailableTours.map(tour => {
              const isSelected = selectedIds.includes(tour.id);
              return (
                <div
                  key={tour.id}
                  onClick={() => toggleTour(tour.id)}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all",
                    isSelected
                      ? "bg-orange-50/80 border-primary shadow-sm"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary pointer-events-none"
                    />
                    <img
                      src={tour.featuredImage || tour.gallery?.[0] || 'https://picsum.photos/seed/tour/100/100'}
                      alt={tour.title}
                      className="w-10 h-10 object-cover rounded-lg shrink-0 border border-gray-100"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 text-xs truncate">{tour.title}</div>
                      <div className="text-[10px] text-gray-500 font-medium">
                        ${tour.discountPrice || tour.regularPrice} {tour.duration ? `• ${tour.duration}` : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold transition shrink-0 ml-2",
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {isSelected ? '✓ Selected' : '+ Select'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function WebsiteBuilder() {
  const { tenantId } = useTenant();
  const [activeTab, setActiveTab] = useState<'blocks' | 'tours' | 'menus' | 'pages' | 'mobilePresets'>('blocks');
  const [settings, setSettings] = useState<WebsiteBuilderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  const [pagesList, setPagesList] = useState<any[]>([]);
  const [toursList, setToursList] = useState<any[]>([]);
  const [selectedPageSlug, setSelectedPageSlug] = useState<string>('about');
  const [pageEditorState, setPageEditorState] = useState<{
    id?: string;
    title: string;
    subtitle: string;
    heroImage: string;
    content: string;
    seoTitle: string;
    seoDescription: string;
    layout: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    mapsEmbed: string;
    facebook: string;
    instagram: string;
    youtube: string;
    twitter: string;
    featuredImages: string[];
    showContactForm: boolean;
    pillTitle: string;
    storyTitle: string;
    storyBody: string;
    missionText: string;
    visionText: string;
    experienceBadgeNumber: string;
    experienceBadgeTitle: string;
    experienceBadgeDesc: string;
    coreValuesTitle: string;
    coreValuesSubtitle: string;
    coreValues: { title: string; desc: string }[];
    newsletterTitle: string;
    newsletterSubtitle: string;
    verifiedBadgeTitle: string;
    verifiedBadgeDesc: string;
  }>({
    title: '',
    subtitle: '',
    heroImage: '',
    content: '',
    seoTitle: '',
    seoDescription: '',
    layout: 'standard',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    mapsEmbed: '',
    facebook: '',
    instagram: '',
    youtube: '',
    twitter: '',
    featuredImages: [],
    showContactForm: true,
    pillTitle: '',
    storyTitle: '',
    storyBody: '',
    missionText: '',
    visionText: '',
    experienceBadgeNumber: '10+',
    experienceBadgeTitle: 'Years of Excellence',
    experienceBadgeDesc: 'Serving over 50,000 satisfied travelers from 80+ countries worldwide.',
    coreValuesTitle: 'Our Core Values',
    coreValuesSubtitle: 'The principles that guide every decision we make and every tour we create.',
    coreValues: [
      { title: 'People First', desc: 'Our guests and our local community are the heart of our business.' },
      { title: 'Safety Always', desc: 'Uncompromising standards of safety and professional guidance.' },
      { title: 'Authenticity', desc: 'Real experiences, real people, and real connections.' },
      { title: 'Quality Service', desc: 'Continuous improvement in every touchpoint of our journey.' }
    ],
    newsletterTitle: 'Stay in the Loop',
    newsletterSubtitle: 'Get the latest travel tips and exclusive Bali offers delivered to your inbox.',
    verifiedBadgeTitle: 'Verified Locally & Built for Smart Travel',
    verifiedBadgeDesc: 'Avoid outdated blogs. All travel advice, local protocols, and logs are continuously maintained by our active on-the-ground team of Balinese private drivers and tour managers.',
  });
  const [savingPage, setSavingPage] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    const unsubscribe = onSnapshot(collection(db, 'pages'), (snapshot) => {
      setPagesList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    const unsubscribe = onSnapshot(collection(db, 'tours'), (snapshot) => {
      setToursList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [tenantId]);

  useEffect(() => {
    const existing = pagesList.find(p => p.slug === selectedPageSlug);
    if (existing) {
      setPageEditorState({
        id: existing.id,
        title: existing.title || '',
        subtitle: existing.subtitle || '',
        heroImage: existing.heroImage || '',
        content: existing.content || '',
        seoTitle: existing.seo?.title || '',
        seoDescription: existing.seo?.description || '',
        layout: existing.layout || 'standard',
        phone: existing.phone || '',
        whatsapp: existing.whatsapp || '',
        email: existing.email || '',
        address: existing.address || '',
        mapsEmbed: existing.mapsEmbed || '',
        facebook: existing.socialMedia?.facebook || '',
        instagram: existing.socialMedia?.instagram || '',
        youtube: existing.socialMedia?.youtube || '',
        twitter: existing.socialMedia?.twitter || '',
        featuredImages: existing.featuredImages || [],
        showContactForm: existing.showContactForm ?? true,
        pillTitle: existing.pillTitle || '',
        storyTitle: existing.storyTitle || '',
        storyBody: existing.storyBody || '',
        missionText: existing.missionText || '',
        visionText: existing.visionText || '',
        experienceBadgeNumber: existing.experienceBadgeNumber || '10+',
        experienceBadgeTitle: existing.experienceBadgeTitle || 'Years of Excellence',
        experienceBadgeDesc: existing.experienceBadgeDesc || 'Serving over 50,000 satisfied travelers from 80+ countries worldwide.',
        coreValuesTitle: existing.coreValuesTitle || 'Our Core Values',
        coreValuesSubtitle: existing.coreValuesSubtitle || 'The principles that guide every decision we make and every tour we create.',
        coreValues: existing.coreValues && existing.coreValues.length > 0 ? existing.coreValues : [
          { title: 'People First', desc: 'Our guests and our local community are the heart of our business.' },
          { title: 'Safety Always', desc: 'Uncompromising standards of safety and professional guidance.' },
          { title: 'Authenticity', desc: 'Real experiences, real people, and real connections.' },
          { title: 'Quality Service', desc: 'Continuous improvement in every touchpoint of our journey.' }
        ],
        newsletterTitle: existing.newsletterTitle || 'Stay in the Loop',
        newsletterSubtitle: existing.newsletterSubtitle || 'Get the latest travel tips and exclusive Bali offers delivered to your inbox.',
        verifiedBadgeTitle: existing.verifiedBadgeTitle || 'Verified Locally & Built for Smart Travel',
        verifiedBadgeDesc: existing.verifiedBadgeDesc || 'Avoid outdated blogs. All travel advice, local protocols, and logs are continuously maintained by our active on-the-ground team of Balinese private drivers and tour managers.',
      });
    } else {
      setPageEditorState({
        title: '',
        subtitle: '',
        heroImage: '',
        content: '',
        seoTitle: '',
        seoDescription: '',
        layout: 'standard',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
        mapsEmbed: '',
        facebook: '',
        instagram: '',
        youtube: '',
        twitter: '',
        featuredImages: [],
        showContactForm: true,
        pillTitle: '',
        storyTitle: '',
        storyBody: '',
        missionText: '',
        visionText: '',
        experienceBadgeNumber: '10+',
        experienceBadgeTitle: 'Years of Excellence',
        experienceBadgeDesc: 'Serving over 50,000 satisfied travelers from 80+ countries worldwide.',
        coreValuesTitle: 'Our Core Values',
        coreValuesSubtitle: 'The principles that guide every decision we make and every tour we create.',
        coreValues: [
          { title: 'People First', desc: 'Our guests and our local community are the heart of our business.' },
          { title: 'Safety Always', desc: 'Uncompromising standards of safety and professional guidance.' },
          { title: 'Authenticity', desc: 'Real experiences, real people, and real connections.' },
          { title: 'Quality Service', desc: 'Continuous improvement in every touchpoint of our journey.' }
        ],
        newsletterTitle: 'Stay in the Loop',
        newsletterSubtitle: 'Get the latest travel tips and exclusive Bali offers delivered to your inbox.',
        verifiedBadgeTitle: 'Verified Locally & Built for Smart Travel',
        verifiedBadgeDesc: 'Avoid outdated blogs. All travel advice, local protocols, and logs are continuously maintained by our active on-the-ground team of Balinese private drivers and tour managers.',
      });
    }
  }, [selectedPageSlug, pagesList]);

  useEffect(() => {
    async function loadData() {
      if (!tenantId) return;
      try {
        const docRef = doc(db, 'website_builder', tenantId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as WebsiteBuilderSettings;
          // Merge defaults if missing blocks
          const mergedBlocks = DEFAULT_BLOCKS.map(dbk => {
            const existing = data.blocks?.find(b => b.id === dbk.id);
            return existing || dbk;
          });
          setSettings({ blocks: mergedBlocks, menus: data.menus || [], mobilePreset: data.mobilePreset || 'klook-explorer' });
        } else {
          setSettings({ blocks: DEFAULT_BLOCKS, menus: [], mobilePreset: 'klook-explorer' });
        }
      } catch (err) {
        console.error("Failed to load website builder settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId || !settings) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'website_builder', tenantId), settings);

      // Sync topNav, mainNav presets and mobilePreset to general settings
      const topNavBlock = settings.blocks?.find(b => b.id === 'topNav');
      const mainNavBlock = settings.blocks?.find(b => b.id === 'mainNav');
      
      const generalRef = doc(db, 'settings', tenantId);
      const generalSnap = await getDoc(generalRef);
      const existingGen = generalSnap.exists() ? generalSnap.data() : {};
      const updatedStyles = {
        ...(existingGen.sectionStyles || {}),
        ...(topNavBlock?.design ? { topNav: topNavBlock.design } : {}),
        ...(mainNavBlock?.design ? { mainNav: mainNavBlock.design } : {}),
      };
      await setDoc(generalRef, { 
        ...existingGen, 
        sectionStyles: updatedStyles, 
        themeMode: 'custom',
        mobilePreset: settings.mobilePreset || 'klook-explorer'
      }, { merge: true });

      alert('Website Builder settings saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const updateBlock = (id: string, updates: Partial<BlockConfig>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      blocks: settings.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
    });
  };

  const getDesignOptions = (blockId: string) => {
    switch(blockId) {
      case 'topNav':
        return [
          { value: 'default', label: 'Classic Dark Bar', desc: 'Social Icons, Support Phone, Support Email, Currency Switcher' },
          { value: 'airbnb-classic', label: 'Airbnb White Bar', desc: 'Welcome banner, WhatsApp assistance link, Currency Switcher' },
          { value: 'emerald-safari', label: 'Emerald Tropical Bar', desc: '24/7 Hotline badge, Instant WhatsApp link, Currency Switcher' },
          { value: 'tokyo-neon', label: 'Cyberpunk Slate Bar', desc: 'Live booking status indicator, System status, Currency' },
          { value: 'sunset-ibiza', label: 'Gradient Sunset Ibiza', desc: 'Special offer discount banner highlight, Currency' },
          { value: 'nordic-clean', label: 'Nordic Stone Grey Bar', desc: 'Clean operating hours badge, Phone link, Currency' },
          { value: 'royal-gold', label: 'Royal Black & Gold', desc: 'VIP Concierge & Luxury Chauffeur, Direct Desk link' },
          { value: 'modern-dark', label: 'Modern Obsidian Bar', desc: 'Adventure intelligence stats badge, System status, Currency' },
          { value: 'modern-glass', label: 'Glassmorphism Bar', desc: 'Frosted container with AI Planner CTA, Currency' },
          { value: 'minimal-type', label: 'Editorial Typographic', desc: 'Monospace contact details and uppercase brand tag' },
          { value: 'saas-clean', label: 'SaaS Minimal Bar', desc: 'Build version tag, Developer support, Currency' }
        ];

      case 'mainNav':
        return [
          { value: 'default', label: 'Standard Responsive Navigation', desc: 'Classic Brand Logo, Search Bar, Links, Currency, Book CTA' },
          { value: 'airbnb-classic', label: 'Airbnb Floating Search Pill Header', desc: 'Interactive search pill ("Where next? | Dates | Group size")' },
          { value: 'centered-logo', label: 'Centered Brand Logo Header', desc: 'Categories on left, centered display brand logo, right action area' },
          { value: 'floating-dock', label: 'Apple Floating Capsule Island', desc: 'Floats centered above top banner with backdrop blur and shadow' },
          { value: 'split-action', label: 'Split Action Header', desc: 'Brand logo left, badge links middle, Contact Us + Book Tour CTAs' },
          { value: 'lux-editorial', label: 'High-End Editorial Serif Header', desc: 'Serif logo, uppercase links, direct concierge button' },
          { value: 'brutalist-bold', label: 'High-Contrast Brutalist Header', desc: 'Yellow canvas with thick black borders and solid shadow buttons' },
          { value: 'modern-glass', label: 'Glassmorphism Capsule Nav', desc: 'Dark backdrop blur, glass container with search button' },
          { value: 'minimal-type', label: 'Editorial Typographic Header', desc: 'Monospace typography with clean borders and volume tag' },
          { value: 'saas-clean', label: 'SaaS Engine Header', desc: 'Compact logo with console badge button' }
        ];

      case 'hero':
        return [
          { value: 'slideshow-atv', label: 'Cinematic Slideshow', desc: 'Full-bleed image slider with badge, animated titles, and dot navigation' },
          { value: 'airbnb-classic', label: 'Airbnb Split Search & Gallery', desc: 'Left search form with staggered 3-photo masonry grid' },
          { value: 'youtube-video', label: 'Full Video Canvas', desc: 'Cinematic YouTube or direct MP4 video background with custom overlay' },
          { value: 'split-media-right', label: 'Split Modern & Glass Card', desc: 'Side-by-side layout with badge, text, bullet highlights, and glass card media' },
          { value: 'centered-overlay', label: 'Luxury Cover & Centered Search', desc: 'Full-bleed cover background with centered headline, search bar, and trust metrics' },
          { value: 'bento-grid-hero', label: 'Bento Showcase Grid', desc: '3-card interactive bento layout showcasing main banner + highlight cards' },
          { value: 'floating-card-hero', label: 'Floating Island Booking Card', desc: 'Full-bleed media canvas with elevated floating booking search card' },
          { value: 'modern-glass', label: 'Glassmorphism Cyber Slate', desc: 'Dark obsidian canvas with glowing status dot and frosted glass container' },
          { value: 'minimal-type', label: 'Editorial Typographic', desc: 'High-contrast display typography with volume tag and sleek right side image panel' }
        ];
      case 'featuredTours':
      case 'guestFavorites':
        return [
          { value: 'default', label: 'Horizontal Carousel' },
          { value: 'minimal-grid', label: 'Minimalist Grid Layout' },
          { value: 'premium-full', label: 'Premium Large Display' }
        ];
      case 'reviews':
        return [
          { value: 'slider', label: 'Interactive Card Slider' },
          { value: 'grid', label: 'Masonry Grid Layout' }
        ];
      case 'blog':
        return [
          { value: 'carousel', label: 'Horizontal Carousel' },
          { value: 'grid', label: 'Card Grid Layout' }
        ];
      default:
        return [
          { value: 'default', label: 'Standard Layout' }
        ];
    }
  };

  const [uploadingImage, setUploadingImage] = useState(false);
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId: string, isMulti: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingImage(true);
    try {
      if (isMulti) {
        const urls = await Promise.all(Array.from(files).map(f => uploadImage(f)));
        const block = settings?.blocks.find(b => b.id === blockId);
        const existing = block?.heroImages || [];
        updateBlock(blockId, { heroImages: [...existing, ...urls] });
      } else {
        const url = await uploadImage(files[0]);
        updateBlock(blockId, { image: url });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload image(s).');
    } finally {
      setUploadingImage(false);
    }
  };

  const blockLabels: Record<string, string> = {
    topNav: 'Top Navigation Bar',
    mainNav: 'Main Navigation',
    hero: 'Hero Section',
    featuredTours: 'Featured Tours',
    guestFavorites: 'Guest Favorites',
    reviews: 'Customer Reviews',
    blog: 'Latest Blog Posts',
    footer: 'Footer'
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Website Builder</h2>
          <p className="text-gray-500 font-medium">Design and structure your storefront by toggling blocks and creating custom menus.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl flex items-center gap-2 hover:bg-orange-700 transition shadow-sm"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          SAVE CHANGES
        </button>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          className={cn("py-4 px-6 font-bold border-b-2 transition-colors whitespace-nowrap", activeTab === 'blocks' ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700")}
          onClick={() => setActiveTab('blocks')}
        >
          <div className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> Page Builder (Blocks)</div>
        </button>
        <button
          className={cn("py-4 px-6 font-bold border-b-2 transition-colors whitespace-nowrap", activeTab === 'tours' ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700")}
          onClick={() => setActiveTab('tours')}
        >
          <div className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-500 fill-amber-400" /> Featured & Favorite Tours</div>
        </button>
        <button
          className={cn("py-4 px-6 font-bold border-b-2 transition-colors whitespace-nowrap", activeTab === 'menus' ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700")}
          onClick={() => setActiveTab('menus')}
        >
          <div className="flex items-center gap-2"><Menu className="w-4 h-4" /> Custom Menus</div>
        </button>
        <button
          className={cn("py-4 px-6 font-bold border-b-2 transition-colors whitespace-nowrap", activeTab === 'pages' ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700")}
          onClick={() => setActiveTab('pages')}
        >
          <div className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> System Page Design</div>
        </button>
        <button
          className={cn("py-4 px-6 font-bold border-b-2 transition-colors whitespace-nowrap relative", activeTab === 'mobilePresets' ? "border-orange-500 text-orange-600 bg-orange-50/50" : "border-transparent text-gray-600 hover:text-gray-900")}
          onClick={() => setActiveTab('mobilePresets')}
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-orange-500" />
            <span>Mobile Presets (10 Designs)</span>
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 rounded-full">Klook 2-Col + 9 More</span>
          </div>
        </button>
      </div>

      {activeTab === 'blocks' && (
        <div className="space-y-4 max-w-4xl">
          {settings?.blocks.map(block => (
            <div key={block.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 sm:px-6 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { active: !block.active }); }}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", block.active ? 'bg-primary' : 'bg-gray-300')}
                    >
                      <div className={cn("w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform", block.active ? 'left-6' : 'left-0.5')} />
                    </button>
                    <span className="text-sm font-bold text-gray-900 w-16">{block.active ? 'ACTIVE' : 'HIDDEN'}</span>
                  </div>
                  <h3 className="font-black text-gray-900">{blockLabels[block.id] || block.id}</h3>
                </div>
                <div className="text-gray-400">
                  {expandedBlock === block.id ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
              </div>

              {expandedBlock === block.id && (
                <div className="p-6 border-t border-gray-100 space-y-6">
                  {/* Design Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Select Hero Preset / Layout</span>
                      <span className="text-[11px] font-semibold text-primary">{getDesignOptions(block.id).length} Presets Available</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {getDesignOptions(block.id).map(opt => {
                        const isSelected = block.design === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateBlock(block.id, { design: opt.value })}
                            className={cn(
                              "p-4 rounded-2xl border-2 font-bold text-sm transition-all text-left flex flex-col justify-between group relative overflow-hidden", 
                              isSelected 
                                ? "border-primary text-gray-900 bg-orange-50/60 shadow-md ring-2 ring-primary/20" 
                                : "border-gray-200/80 text-gray-600 bg-white hover:border-gray-300 hover:shadow-sm"
                            )}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className={cn("font-extrabold text-sm", isSelected ? "text-primary" : "text-gray-900")}>
                                  {opt.label}
                                </span>
                                {opt.desc && (
                                  <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider", isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-500")}>
                                    {isSelected ? 'Active' : 'Preset'}
                                  </span>
                                )}
                              </div>
                              {opt.desc && (
                                <p className="text-xs font-normal text-gray-500 line-clamp-2 leading-relaxed">
                                  {opt.desc}
                                </p>
                              )}
                            </div>
                            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>Select Layout</span>
                              <Sparkles className="w-3 h-3" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Headline, Subheadline & Description (For Hero and featured blocks) */}
                  {['hero', 'featuredTours', 'guestFavorites'].includes(block.id) && (
                    <div className="grid grid-cols-1 gap-6 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Headline / Main Title</label>
                          <input
                            type="text"
                            value={block.headline || ''}
                            onChange={(e) => updateBlock(block.id, { headline: e.target.value })}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                            placeholder="e.g. Discover Balinese Wonders"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Subheadline / Eyebrow Subtitle</label>
                          <input
                            type="text"
                            value={block.subheadline || ''}
                            onChange={(e) => updateBlock(block.id, { subheadline: e.target.value })}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                            placeholder="e.g. Unforgettable Island Expeditions"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Hero Narrative Description</label>
                        <textarea
                          value={block.description || ''}
                          onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                          rows={3}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none font-medium"
                          placeholder="e.g. Curated expeditions and private custom adventures with trusted local hosts..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional fields for Hero (Badge, Bullet Checklist, & Buttons) */}
                  {block.id === 'hero' && (
                    <div className="space-y-6 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Badge Text / Tag</label>
                          <input
                            type="text"
                            value={block.badge || ''}
                            onChange={(e) => updateBlock(block.id, { badge: e.target.value })}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="e.g. ⭐ #1 Rated Tour Operator in Bali"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Hero Feature Highlights (Comma separated)</label>
                          <input
                            type="text"
                            value={block.heroBullets ? block.heroBullets.join(', ') : ''}
                            onChange={(e) => updateBlock(block.id, { heroBullets: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="e.g. Free Cancellation, 24/7 Support, Instant Confirmation"
                          />
                        </div>
                      </div>

                      {/* Action Buttons Customizer */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-3">
                          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">Primary Call-to-Action</label>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Button Text</label>
                            <input
                              type="text"
                              value={block.primaryButtonText || ''}
                              onChange={(e) => updateBlock(block.id, { primaryButtonText: e.target.value })}
                              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium"
                              placeholder="e.g. Book ATV Tour Now"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Target Link</label>
                            <input
                              type="text"
                              value={block.primaryButtonLink || ''}
                              onChange={(e) => updateBlock(block.id, { primaryButtonLink: e.target.value })}
                              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium"
                              placeholder="e.g. /tours?search=atv"
                            />
                          </div>
                        </div>

                        <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-3">
                          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">Secondary Call-to-Action</label>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Button Text</label>
                            <input
                              type="text"
                              value={block.secondaryButtonText || ''}
                              onChange={(e) => updateBlock(block.id, { secondaryButtonText: e.target.value })}
                              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium"
                              placeholder="e.g. Inquire / Contact Us"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Target Link</label>
                            <input
                              type="text"
                              value={block.secondaryButtonLink || ''}
                              onChange={(e) => updateBlock(block.id, { secondaryButtonLink: e.target.value })}
                              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium"
                              placeholder="e.g. /contact"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Display & Layout Controls */}
                      <div className="p-4 border border-gray-200 rounded-2xl bg-orange-50/30 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="showSearch"
                            checked={block.showSearch !== false}
                            onChange={(e) => updateBlock(block.id, { showSearch: e.target.checked })}
                            className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
                          />
                          <label htmlFor="showSearch" className="text-xs font-bold text-gray-800 cursor-pointer">
                            Show Integrated Search / Booking Form in Hero Section
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">Overlay Tint:</span>
                          <select
                            value={block.overlayOpacity || 'gradient'}
                            onChange={(e) => updateBlock(block.id, { overlayOpacity: e.target.value as any })}
                            className="p-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none"
                          >
                            <option value="gradient">Gradient Dark</option>
                            <option value="dark">Deep Dark (80%)</option>
                            <option value="medium">Medium Dark (50%)</option>
                            <option value="light">Light Tint (25%)</option>
                            <option value="none">No Overlay (Raw)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unified Media Customizer (Hero only) */}
                  {block.id === 'hero' && (
                    <div className="space-y-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Hero Background Media Customizer</label>
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => updateBlock(block.id, { mediaType: 'image' })}
                            className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all", (block.mediaType || 'image') === 'image' ? "bg-white text-primary shadow-sm" : "text-gray-500")}
                          >
                            Single Image
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBlock(block.id, { mediaType: 'slideshow' })}
                            className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all", block.mediaType === 'slideshow' ? "bg-white text-primary shadow-sm" : "text-gray-500")}
                          >
                            Slideshow
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBlock(block.id, { mediaType: 'video' })}
                            className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all", block.mediaType === 'video' ? "bg-white text-primary shadow-sm" : "text-gray-500")}
                          >
                            Video (YouTube/MP4)
                          </button>
                        </div>
                      </div>

                      {/* Video URL Input */}
                      {((block.mediaType === 'video') || block.design === 'youtube-video') && (
                        <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Video Background Source (YouTube URL or Direct MP4 Link)
                          </label>
                          <input
                            type="text"
                            value={block.videoUrl || block.youtubeUrl || ''}
                            onChange={(e) => updateBlock(block.id, { videoUrl: e.target.value, youtubeUrl: e.target.value })}
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-mono"
                            placeholder="e.g. https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
                          />
                          <p className="text-[11px] text-gray-500 font-medium">
                            Supports YouTube watch links, embed links, or direct .mp4/.webm video URLs. Auto-plays muted in background.
                          </p>
                        </div>
                      )}

                      {/* Single Image Upload */}
                      {((block.mediaType || 'image') === 'image' && block.design !== 'youtube-video') && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Single Hero Image</label>
                          {block.image && (
                            <div className="mb-4 relative w-64 aspect-video rounded-2xl overflow-hidden shadow-md border border-gray-200">
                              <img src={block.image} className="w-full h-full object-cover" alt="Hero background" />
                              <button onClick={() => updateBlock(block.id, { image: '' })} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, block.id, false)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={uploadingImage}
                            />
                            <div className="w-full p-5 border-2 border-dashed border-gray-300 rounded-2xl text-center hover:border-primary transition-colors bg-gray-50">
                              {uploadingImage ? (
                                <div className="flex items-center justify-center gap-2 text-gray-500 font-bold"><Loader2 className="w-5 h-5 animate-spin text-primary" /> Uploading image to cloud...</div>
                              ) : (
                                <div className="flex flex-col items-center gap-1 text-gray-500">
                                  <Upload className="w-6 h-6 mb-1 text-gray-400" />
                                  <span className="font-bold text-sm text-gray-800">Click to upload image file</span>
                                  <span className="text-xs text-gray-400">JPG, PNG, WEBP supported</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Multi-Image Gallery / Slideshow Manager */}
                      {(block.mediaType === 'slideshow' || block.design === 'slideshow-atv' || block.design === 'airbnb-classic' || block.design === 'airbnb-fluid') && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Hero Image Gallery & Airbnb Grid</label>
                          <p className="text-[11px] text-gray-500 mb-3 font-medium">
                            {block.design === 'airbnb-classic' || block.design === 'airbnb-fluid'
                              ? "The first 3 images below will be displayed in the staggered masonry grid on your homepage."
                              : "Upload or add multiple photos for your homepage hero slideshow."}
                          </p>
                          {block.heroImages && block.heroImages.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                              {block.heroImages.map((img, idx) => (
                                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-200 group bg-gray-100">
                                  <img src={img} className="w-full h-full object-cover" alt={`Hero image ${idx+1}`} />
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newImgs = [...(block.heroImages || [])];
                                      newImgs.splice(idx, 1);
                                      updateBlock(block.id, { heroImages: newImgs });
                                    }} 
                                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors opacity-90 group-hover:opacity-100"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] font-black rounded">
                                    Photo {idx+1}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add URL Input */}
                          <div className="flex gap-2 mb-3">
                            <input
                              type="text"
                              placeholder="Paste image URL (e.g. https://.../photo.jpg)"
                              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                              id={`add-hero-url-${block.id}`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.currentTarget;
                                  if (input.value.trim()) {
                                    const existing = block.heroImages || [];
                                    updateBlock(block.id, { heroImages: [...existing, input.value.trim()] });
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById(`add-hero-url-${block.id}`) as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  const existing = block.heroImages || [];
                                  updateBlock(block.id, { heroImages: [...existing, input.value.trim()] });
                                  input.value = '';
                                }
                              }}
                              className="px-3.5 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors"
                            >
                              Add URL
                            </button>
                          </div>

                          {/* File Upload Drag/Drop */}
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleImageUpload(e, block.id, true)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={uploadingImage}
                            />
                            <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl text-center hover:border-primary transition-colors bg-gray-50">
                              {uploadingImage ? (
                                <div className="flex items-center justify-center gap-2 text-gray-500 font-bold text-xs"><Loader2 className="w-4 h-4 animate-spin text-primary" /> Uploading image(s)...</div>
                              ) : (
                                <div className="flex flex-col items-center gap-1 text-gray-500">
                                  <Upload className="w-5 h-5 mb-0.5 text-gray-400" />
                                  <span className="font-bold text-xs text-gray-800">Click to upload photos for gallery</span>
                                  <span className="text-[10px] text-gray-400">JPG, PNG, WEBP supported</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tour Picker for featuredTours and guestFavorites */}
                  {['featuredTours', 'guestFavorites'].includes(block.id) && (
                    <TourPickerManager
                      block={block}
                      toursList={toursList}
                      updateBlock={updateBlock}
                      blockType={block.id as 'featuredTours' | 'guestFavorites'}
                    />
                  )}

                  {/* Menu Picker (Navs only) */}
                  {['topNav', 'mainNav', 'footer'].includes(block.id) && (
                    <div>
                       <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Assigned Menu</label>
                       <select
                          value={block.menuId || ''}
                          onChange={(e) => updateBlock(block.id, { menuId: e.target.value })}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                       >
                         <option value="">-- Select a custom menu --</option>
                         {settings.menus.map(m => (
                           <option key={m.id} value={m.id}>{m.name}</option>
                         ))}
                       </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'tours' && (
        <div className="space-y-8 max-w-5xl">
          <div className="p-6 bg-amber-50/80 border border-amber-200/80 text-amber-900 rounded-2xl flex items-start gap-4 shadow-sm">
            <Sparkles className="w-6 h-6 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-lg text-amber-950">Frontpage Tour Selections</h3>
              <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                Choose exactly which tours are showcased as <strong>Featured Tours</strong> and <strong>Guest Favorites</strong> on your frontpage. Select tours, re-order them, or customize section headlines. Click <strong>SAVE CHANGES</strong> at the top when done.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Featured Tours Card */}
            {(() => {
              const featBlock = settings?.blocks.find(b => b.id === 'featuredTours') || { id: 'featuredTours', active: true, design: 'default', tourIds: [], headline: 'Featured Tours', subheadline: 'Handpicked experiences our guests love most' };
              return (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                        <Star className="w-5 h-5 fill-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-lg">Featured Tours</h3>
                        <p className="text-xs text-gray-500 font-medium">Displayed in Featured Section on homepage</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => updateBlock('featuredTours', { active: !featBlock.active })}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", featBlock.active ? 'bg-primary' : 'bg-gray-300')}
                      title="Toggle active on homepage"
                    >
                      <div className={cn("w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform", featBlock.active ? 'left-6' : 'left-0.5')} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Section Headline</label>
                      <input
                        type="text"
                        value={featBlock.headline || ''}
                        onChange={(e) => updateBlock('featuredTours', { headline: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Featured Tours"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Section Subheadline</label>
                      <input
                        type="text"
                        value={featBlock.subheadline || ''}
                        onChange={(e) => updateBlock('featuredTours', { subheadline: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Curated expeditions our guests love most"
                      />
                    </div>
                  </div>

                  <TourPickerManager
                    block={featBlock}
                    toursList={toursList}
                    updateBlock={updateBlock}
                    blockType="featuredTours"
                  />
                </div>
              );
            })()}

            {/* Guest Favorites Card */}
            {(() => {
              const favBlock = settings?.blocks.find(b => b.id === 'guestFavorites') || { id: 'guestFavorites', active: true, design: 'default', tourIds: [], headline: 'Guest Favorites', subheadline: 'Overwhelmingly positive guest expeditions' };
              return (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                        <Heart className="w-5 h-5 fill-rose-500" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-lg">Guest Favorites</h3>
                        <p className="text-xs text-gray-500 font-medium">Displayed in Top Rated / Favorites section</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => updateBlock('guestFavorites', { active: !favBlock.active })}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", favBlock.active ? 'bg-primary' : 'bg-gray-300')}
                      title="Toggle active on homepage"
                    >
                      <div className={cn("w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform", favBlock.active ? 'left-6' : 'left-0.5')} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Section Headline</label>
                      <input
                        type="text"
                        value={favBlock.headline || ''}
                        onChange={(e) => updateBlock('guestFavorites', { headline: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Guest Favorites"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Section Subheadline</label>
                      <input
                        type="text"
                        value={favBlock.subheadline || ''}
                        onChange={(e) => updateBlock('guestFavorites', { subheadline: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="The most loved tours by our explorers"
                      />
                    </div>
                  </div>

                  <TourPickerManager
                    block={favBlock}
                    toursList={toursList}
                    updateBlock={updateBlock}
                    blockType="guestFavorites"
                  />
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'menus' && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-6 bg-blue-50 text-blue-800 rounded-2xl flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 shrink-0 text-blue-600 mt-1" />
              <div>
                <h3 className="font-bold text-lg">Menu & Navigation Management</h3>
                <p className="text-sm opacity-90 mt-1">Customize all header and footer menu titles and links. Assign each menu to a display location (Main Navigation, Top Bar, or Footer Columns).</p>
              </div>
            </div>
            <button
              onClick={() => {
                const defaultMenus: CustomMenu[] = [
                  {
                    id: `menu_main_${Date.now()}`,
                    name: 'Main Header Navigation',
                    location: 'main-nav',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'Tours', url: '/tours' },
                      { label: 'AI Planner', url: '/planner' },
                      { label: 'Blog', url: '/blog' },
                      { label: 'About', url: '/about' },
                      { label: 'Contact', url: '/contact' }
                    ]
                  },
                  {
                    id: `menu_f1_${Date.now()}`,
                    name: 'Destinations',
                    location: 'footer-1',
                    links: [
                      { label: 'All Tours & Journeys', url: '/tours' },
                      { label: 'Explore Regions & Villages', url: '/destinations' }
                    ]
                  },
                  {
                    id: `menu_f2_${Date.now()}`,
                    name: 'Customer Support',
                    location: 'footer-2',
                    links: [
                      { label: 'Help & Contact Center', url: '/contact' },
                      { label: 'Track My Booking', url: '/track-booking' },
                      { label: 'Smart Travel Advisory & FAQ', url: '/ai-hub' }
                    ]
                  },
                  {
                    id: `menu_f3_${Date.now()}`,
                    name: 'Company',
                    location: 'footer-3',
                    links: [
                      { label: 'Our Story & Philosophy', url: '/about' },
                      { label: 'Travel Blog & Journals', url: '/blog' },
                      { label: 'AI Planner', url: '/planner' }
                    ]
                  }
                ];
                if (settings) {
                  setSettings({ ...settings, menus: defaultMenus });
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs whitespace-nowrap shadow-sm transition"
            >
              Load Default Menus
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                const newMenu: CustomMenu = { id: `menu_${Date.now()}`, name: 'New Menu', location: 'none', links: [] };
                if (settings) setSettings({ ...settings, menus: [...settings.menus, newMenu] });
              }}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Custom Menu
            </button>
            <span className="text-xs font-semibold text-gray-500">
              {settings?.menus?.length || 0} Menus Configured
            </span>
          </div>

          <div className="space-y-6">
            {settings?.menus.map(menu => (
              <div key={menu.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex-1">
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Menu Title</label>
                    <input
                      type="text"
                      value={menu.name}
                      onChange={(e) => {
                        const updated = settings.menus.map(m => m.id === menu.id ? { ...m, name: e.target.value } : m);
                        setSettings({ ...settings, menus: updated });
                      }}
                      className="text-lg font-black bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 w-full focus:bg-white focus:border-primary outline-none transition-all"
                      placeholder="e.g. Header Navigation or Destinations"
                    />
                  </div>

                  <div className="w-full sm:w-64">
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Display Location</label>
                    <select
                      value={menu.location || 'none'}
                      onChange={(e) => {
                        const updated = settings.menus.map(m => m.id === menu.id ? { ...m, location: e.target.value as any } : m);
                        setSettings({ ...settings, menus: updated });
                      }}
                      className="bg-gray-50 border border-gray-200 text-gray-800 font-bold text-xs rounded-xl px-3 py-2 w-full focus:bg-white focus:border-primary outline-none transition-all"
                    >
                      <option value="main-nav">Main Navigation (Header)</option>
                      <option value="top-nav">Top Bar (Header)</option>
                      <option value="footer-1">Footer Column 1</option>
                      <option value="footer-2">Footer Column 2</option>
                      <option value="footer-3">Footer Column 3</option>
                      <option value="footer-bottom">Footer Bottom Links</option>
                      <option value="none">Unassigned / Custom Block</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => {
                      if(confirm(`Delete menu "${menu.name}"?`)) {
                        setSettings({ ...settings, menus: settings.menus.filter(m => m.id !== menu.id) });
                      }
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition self-end sm:self-center"
                    title="Delete Menu"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Menu Links ({menu.links.length})</label>
                    <button 
                      onClick={() => {
                        const newLinks = [...menu.links, { label: 'New Link', url: '/' }];
                        const updated = settings.menus.map(m => m.id === menu.id ? { ...m, links: newLinks } : m);
                        setSettings({ ...settings, menus: updated });
                      }}
                      className="text-primary font-bold text-xs hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Link Item
                    </button>
                  </div>

                  {menu.links.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                      No links added yet. Click "+ Add Link Item" above.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {menu.links.map((link, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-gray-50/70 p-2 rounded-xl border border-gray-100">
                          <input 
                            type="text" 
                            value={link.label}
                            onChange={(e) => {
                              const newLinks = [...menu.links];
                              newLinks[idx].label = e.target.value;
                              const updated = settings.menus.map(m => m.id === menu.id ? { ...m, links: newLinks } : m);
                              setSettings({ ...settings, menus: updated });
                            }}
                            className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold" 
                            placeholder="Label (e.g. AI Planner)" 
                          />
                          <input 
                            type="text" 
                            value={link.url}
                            onChange={(e) => {
                              const newLinks = [...menu.links];
                              newLinks[idx].url = e.target.value;
                              const updated = settings.menus.map(m => m.id === menu.id ? { ...m, links: newLinks } : m);
                              setSettings({ ...settings, menus: updated });
                            }}
                            className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold" 
                            placeholder="URL (e.g. /planner)" 
                          />
                          <button 
                            onClick={() => {
                              const newLinks = menu.links.filter((_, i) => i !== idx);
                              const updated = settings.menus.map(m => m.id === menu.id ? { ...m, links: newLinks } : m);
                              setSettings({ ...settings, menus: updated });
                            }} 
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {settings?.menus.length === 0 && (
              <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <p className="font-bold text-gray-600 mb-1">No custom menus created yet</p>
                <p className="text-xs text-gray-400 mb-4">Click "Load Default Menus" above to quickly edit default Header & Footer menu titles.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Page Selector Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
              <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-widest mb-3 font-mono">Select Page</h3>
              <div className="space-y-1">
                {[
                  { slug: 'about', title: 'About Us', url: '/about' },
                  { slug: 'contact', title: 'Contact Us', url: '/contact' },
                  { slug: 'privacy', title: 'Privacy Policy', url: '/privacy' },
                  { slug: 'tours', title: 'Tours Directory', url: '/tours' },
                  { slug: 'blog', title: 'Blog Page', url: '/blog' },
                  { slug: 'destinations', title: 'Destinations', url: '/destinations' },
                  { slug: 'ai-hub', title: 'AI Hub', url: '/ai-hub' }
                ].map(page => (
                  <button
                    key={page.slug}
                    onClick={() => setSelectedPageSlug(page.slug)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex flex-col gap-0.5",
                      selectedPageSlug === page.slug
                        ? "bg-primary text-white shadow-md shadow-orange-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <span>{page.title}</span>
                    <span className={cn("text-[10px] font-mono font-medium", selectedPageSlug === page.slug ? "text-orange-100" : "text-gray-400")}>{page.url}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Page Editor Form */}
          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase">
                  Customize: {selectedPageSlug.toUpperCase()}
                </h3>
                <p className="text-gray-500 text-xs font-medium mt-1">Configure banner details, hero imagery, custom narrative sections, and SEO tags.</p>
              </div>
              <button
                onClick={async () => {
                  setSavingPage(true);
                  try {
                    const pageData = {
                      title: pageEditorState.title,
                      slug: selectedPageSlug,
                      subtitle: pageEditorState.subtitle || '',
                      heroImage: pageEditorState.heroImage || '',
                      content: pageEditorState.content || '',
                      seo: {
                        title: pageEditorState.seoTitle || '',
                        description: pageEditorState.seoDescription || ''
                      },
                      layout: pageEditorState.layout || 'standard',
                      phone: pageEditorState.phone || '',
                      whatsapp: pageEditorState.whatsapp || '',
                      email: pageEditorState.email || '',
                      address: pageEditorState.address || '',
                      mapsEmbed: pageEditorState.mapsEmbed || '',
                      socialMedia: {
                        facebook: pageEditorState.facebook || '',
                        instagram: pageEditorState.instagram || '',
                        youtube: pageEditorState.youtube || '',
                        twitter: pageEditorState.twitter || ''
                      },
                      featuredImages: pageEditorState.featuredImages || [],
                      showContactForm: pageEditorState.showContactForm ?? true,
                      pillTitle: pageEditorState.pillTitle || '',
                      storyTitle: pageEditorState.storyTitle || '',
                      storyBody: pageEditorState.storyBody || '',
                      missionText: pageEditorState.missionText || '',
                      visionText: pageEditorState.visionText || '',
                      experienceBadgeNumber: pageEditorState.experienceBadgeNumber || '',
                      experienceBadgeTitle: pageEditorState.experienceBadgeTitle || '',
                      experienceBadgeDesc: pageEditorState.experienceBadgeDesc || '',
                      coreValuesTitle: pageEditorState.coreValuesTitle || '',
                      coreValuesSubtitle: pageEditorState.coreValuesSubtitle || '',
                      coreValues: pageEditorState.coreValues || [],
                      newsletterTitle: pageEditorState.newsletterTitle || '',
                      newsletterSubtitle: pageEditorState.newsletterSubtitle || '',
                      verifiedBadgeTitle: pageEditorState.verifiedBadgeTitle || '',
                      verifiedBadgeDesc: pageEditorState.verifiedBadgeDesc || '',
                      updatedAt: serverTimestamp()
                    };

                    if (pageEditorState.id) {
                      await updateDoc(doc(db, 'pages', pageEditorState.id), pageData);
                    } else {
                      await addDoc(collection(db, 'pages'), pageData);
                    }
                    alert('Page design updated successfully!');
                  } catch (err) {
                    console.error(err);
                    alert('Failed to save page configuration.');
                  } finally {
                    setSavingPage(false);
                  }
                }}
                disabled={savingPage}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl flex items-center gap-2 hover:bg-orange-700 transition"
              >
                {savingPage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Page Design
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Pill Badge / Tagline Title</label>
                <input
                  type="text"
                  value={pageEditorState.pillTitle}
                  onChange={e => setPageEditorState(prev => ({ ...prev, pillTitle: e.target.value }))}
                  placeholder="e.g. Our story / Curated Expeditions"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Hero Title / Main Heading</label>
                <input
                  type="text"
                  required
                  value={pageEditorState.title}
                  onChange={e => setPageEditorState(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. About Our Journey"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Hero Subtitle / Description</label>
                <input
                  type="text"
                  value={pageEditorState.subtitle}
                  onChange={e => setPageEditorState(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="e.g. Premium tours curated by local experts in Bali."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none text-sm font-medium"
                />
              </div>
            </div>

            {/* Page-Specific Custom Content Editors */}
            {selectedPageSlug === 'about' && (
              <div className="p-6 bg-orange-50/40 rounded-2xl border border-orange-100 space-y-6">
                <div className="flex items-center gap-2 border-b border-orange-200/60 pb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">About Us Page Custom Content</h4>
                </div>

                {/* Story Section */}
                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-800 uppercase tracking-wider">Story Section Title & Story Body</label>
                  <input
                    type="text"
                    value={pageEditorState.storyTitle}
                    onChange={e => setPageEditorState(prev => ({ ...prev, storyTitle: e.target.value }))}
                    placeholder="Story Headline (e.g. Experience Bali Like A Local Expert)"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:border-primary focus:outline-none"
                  />
                  <textarea
                    rows={4}
                    value={pageEditorState.storyBody}
                    onChange={e => setPageEditorState(prev => ({ ...prev, storyBody: e.target.value }))}
                    placeholder="Founded with a passion for authentic exploration, Smart Bali Tours has been..."
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Mission & Vision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-800 uppercase tracking-wider">Our Mission</label>
                    <textarea
                      rows={3}
                      value={pageEditorState.missionText}
                      onChange={e => setPageEditorState(prev => ({ ...prev, missionText: e.target.value }))}
                      placeholder="To provide world-class travel services while preserving local culture..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-800 uppercase tracking-wider">Our Vision</label>
                    <textarea
                      rows={3}
                      value={pageEditorState.visionText}
                      onChange={e => setPageEditorState(prev => ({ ...prev, visionText: e.target.value }))}
                      placeholder="Becoming the most trusted gateway for travelers to discover hidden gems..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Experience Badge */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-orange-200/60">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-800 uppercase tracking-wider">Experience Badge Number</label>
                    <input
                      type="text"
                      value={pageEditorState.experienceBadgeNumber}
                      onChange={e => setPageEditorState(prev => ({ ...prev, experienceBadgeNumber: e.target.value }))}
                      placeholder="e.g. 10+"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-800 uppercase tracking-wider">Experience Badge Title</label>
                    <input
                      type="text"
                      value={pageEditorState.experienceBadgeTitle}
                      onChange={e => setPageEditorState(prev => ({ ...prev, experienceBadgeTitle: e.target.value }))}
                      placeholder="e.g. Years of Excellence"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-800 uppercase tracking-wider">Experience Badge Subtitle</label>
                    <input
                      type="text"
                      value={pageEditorState.experienceBadgeDesc}
                      onChange={e => setPageEditorState(prev => ({ ...prev, experienceBadgeDesc: e.target.value }))}
                      placeholder="e.g. Serving over 50,000 satisfied travelers..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Our Core Values */}
                <div className="space-y-4 pt-4 border-t border-orange-200/60">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-800 uppercase tracking-wider">Core Values Section Title</label>
                      <input
                        type="text"
                        value={pageEditorState.coreValuesTitle}
                        onChange={e => setPageEditorState(prev => ({ ...prev, coreValuesTitle: e.target.value }))}
                        placeholder="e.g. Our Core Values"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-800 uppercase tracking-wider">Core Values Section Subtitle</label>
                      <input
                        type="text"
                        value={pageEditorState.coreValuesSubtitle}
                        onChange={e => setPageEditorState(prev => ({ ...prev, coreValuesSubtitle: e.target.value }))}
                        placeholder="e.g. The principles that guide every decision..."
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">Core Values Items</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pageEditorState.coreValues.map((val, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-primary uppercase">Value Item #{idx + 1}</span>
                          {pageEditorState.coreValues.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setPageEditorState(prev => ({
                                ...prev,
                                coreValues: prev.coreValues.filter((_, i) => i !== idx)
                              }))}
                              className="text-red-500 hover:text-red-700 text-xs font-bold"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={val.title}
                          onChange={e => {
                            const newVals = [...pageEditorState.coreValues];
                            newVals[idx].title = e.target.value;
                            setPageEditorState(prev => ({ ...prev, coreValues: newVals }));
                          }}
                          placeholder="Title (e.g. People First)"
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:border-primary focus:outline-none"
                        />
                        <textarea
                          rows={2}
                          value={val.desc}
                          onChange={e => {
                            const newVals = [...pageEditorState.coreValues];
                            newVals[idx].desc = e.target.value;
                            setPageEditorState(prev => ({ ...prev, coreValues: newVals }));
                          }}
                          placeholder="Description..."
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPageEditorState(prev => ({
                      ...prev,
                      coreValues: [...prev.coreValues, { title: 'New Core Value', desc: 'Description of core value' }]
                    }))}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition"
                  >
                    + Add Core Value
                  </button>
                </div>
              </div>
            )}

            {selectedPageSlug === 'blog' && (
              <div className="p-6 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-4">
                <div className="flex items-center gap-2 border-b border-blue-200/60 pb-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Blog Page Newsletter Banner Settings</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-800 uppercase tracking-wider">Newsletter Headline</label>
                    <input
                      type="text"
                      value={pageEditorState.newsletterTitle}
                      onChange={e => setPageEditorState(prev => ({ ...prev, newsletterTitle: e.target.value }))}
                      placeholder="e.g. Stay in the Loop"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-800 uppercase tracking-wider">Newsletter Subheadline</label>
                    <input
                      type="text"
                      value={pageEditorState.newsletterSubtitle}
                      onChange={e => setPageEditorState(prev => ({ ...prev, newsletterSubtitle: e.target.value }))}
                      placeholder="e.g. Get the latest travel tips and exclusive Bali offers..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedPageSlug === 'ai-hub' && (
              <div className="p-6 bg-teal-50/40 rounded-2xl border border-teal-100 space-y-4">
                <div className="flex items-center gap-2 border-b border-teal-200/60 pb-3">
                  <CheckCircle className="h-5 w-5 text-teal-600" />
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">AI Advisory Hub Verified Banner Settings</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-800 uppercase tracking-wider">Verified Banner Headline</label>
                    <input
                      type="text"
                      value={pageEditorState.verifiedBadgeTitle}
                      onChange={e => setPageEditorState(prev => ({ ...prev, verifiedBadgeTitle: e.target.value }))}
                      placeholder="e.g. Verified Locally & Built for Smart Travel"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-800 uppercase tracking-wider">Verified Banner Description</label>
                    <textarea
                      rows={3}
                      value={pageEditorState.verifiedBadgeDesc}
                      onChange={e => setPageEditorState(prev => ({ ...prev, verifiedBadgeDesc: e.target.value }))}
                      placeholder="Avoid outdated blogs. All travel advice, local protocols..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Page Banner Upload */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Hero Background Image</label>
              {pageEditorState.heroImage && (
                <div className="mb-4 relative w-full max-w-md aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  <img src={pageEditorState.heroImage} className="w-full h-full object-cover" alt="Hero background preview" />
                  <button 
                    onClick={() => setPageEditorState(prev => ({ ...prev, heroImage: '' }))} 
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    setUploadingImage(true);
                    try {
                      const url = await uploadImage(files[0]);
                      setPageEditorState(prev => ({ ...prev, heroImage: url }));
                    } catch (err) {
                      console.error(err);
                      alert('Failed to upload image.');
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingImage}
                />
                <div className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-primary transition-colors bg-gray-50">
                  {uploadingImage ? (
                    <div className="flex items-center justify-center gap-2 text-gray-500 font-bold">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" /> Uploading...
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-500">
                      <Upload className="w-6 h-6 mb-1 text-gray-400" />
                      <span className="font-bold text-sm">Click to upload custom page banner image</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Page Design Template Section */}
            <div className="pt-6 border-t border-gray-150 space-y-6">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Page Layout & Content Blocks</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'standard', name: 'Standard Narrative', desc: 'A clean, full-width content page featuring standard markdown text descriptions.' },
                  { id: 'about-grid', name: 'About Bento Grid', desc: 'A modern multi-column layout with office details, Google Map iframe, phone, email, and a featured image gallery.' },
                  { id: 'contact-grid', name: 'Contact Columns Grid', desc: 'Two-column design including an active customer contact form on the left, and rich touchpoints/socials on the right.' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPageEditorState(prev => ({ ...prev, layout: item.id }))}
                    className={cn(
                      "text-left p-5 rounded-2xl border-2 transition-all flex flex-col gap-2 h-full",
                      pageEditorState.layout === item.id 
                        ? "border-primary bg-orange-50/20" 
                        : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <span className="font-extrabold text-sm text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-500 font-medium leading-normal">{item.desc}</span>
                  </button>
                ))}
              </div>

              {pageEditorState.layout !== 'standard' && (
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <h5 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-2">Configure Layout Block Elements</h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-gray-600 uppercase">Contact Email</label>
                      <input
                        type="email"
                        value={pageEditorState.email}
                        onChange={e => setPageEditorState(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="e.g. hello@baliadventours.com"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-primary focus:outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-gray-600 uppercase">Direct Phone / Hotline</label>
                      <input
                        type="text"
                        value={pageEditorState.phone}
                        onChange={e => setPageEditorState(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g. +62 812 4650 2939"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-primary focus:outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-gray-600 uppercase">WhatsApp Number (e.g. 6281246502939)</label>
                      <input
                        type="text"
                        value={pageEditorState.whatsapp}
                        onChange={e => setPageEditorState(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="e.g. 6281246502939"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-primary focus:outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-gray-600 uppercase">Office Address</label>
                      <input
                        type="text"
                        value={pageEditorState.address}
                        onChange={e => setPageEditorState(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="e.g. Jln. Raya Ubud, Ubud, Gianyar, Bali"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-primary focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-gray-600 uppercase">Google Maps Embed URL / Iframe Code</label>
                    <textarea
                      value={pageEditorState.mapsEmbed}
                      onChange={e => {
                        const val = e.target.value;
                        if (val.trim().startsWith('<iframe')) {
                          const match = val.match(/src="([^"]+)"/);
                          if (match && match[1]) {
                            setPageEditorState(prev => ({ ...prev, mapsEmbed: match[1] }));
                            return;
                          }
                        }
                        setPageEditorState(prev => ({ ...prev, mapsEmbed: val }));
                      }}
                      placeholder="Paste your Google Maps embed URL (https://www.google.com/maps/embed?...) or full iframe HTML"
                      rows={2}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-primary focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-gray-400 font-medium">Tip: On Google Maps, click Share to Embed a map to Copy HTML. Paste it here and we will extract the exact coordinate source automatically!</p>
                  </div>

                  {/* Social Media Block */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Social Media Links</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Instagram Link</span>
                        <input
                          type="text"
                          value={pageEditorState.instagram}
                          onChange={e => setPageEditorState(prev => ({ ...prev, instagram: e.target.value }))}
                          placeholder="e.g. https://instagram.com/baliadventours"
                          className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs focus:border-primary focus:outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Facebook Link</span>
                        <input
                          type="text"
                          value={pageEditorState.facebook}
                          onChange={e => setPageEditorState(prev => ({ ...prev, facebook: e.target.value }))}
                          placeholder="e.g. https://facebook.com/baliadventours"
                          className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs focus:border-primary focus:outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">YouTube Link</span>
                        <input
                          type="text"
                          value={pageEditorState.youtube}
                          onChange={e => setPageEditorState(prev => ({ ...prev, youtube: e.target.value }))}
                          placeholder="e.g. https://youtube.com/@baliadventours"
                          className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs focus:border-primary focus:outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Twitter / X Link</span>
                        <input
                          type="text"
                          value={pageEditorState.twitter}
                          onChange={e => setPageEditorState(prev => ({ ...prev, twitter: e.target.value }))}
                          placeholder="e.g. https://x.com/baliadventours"
                          className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs focus:border-primary focus:outline-none font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Featured Images Block */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Featured Images Grid Gallery</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;
                            setUploadingImage(true);
                            try {
                              const uploadedUrls: string[] = [];
                              for (let i = 0; i < files.length; i++) {
                                const url = await uploadImage(files[i]);
                                uploadedUrls.push(url);
                              }
                              setPageEditorState(prev => ({
                                ...prev,
                                featuredImages: [...prev.featuredImages, ...uploadedUrls]
                              }));
                            } catch (err) {
                              console.error(err);
                              alert('Failed to upload image gallery files.');
                            } finally {
                              setUploadingImage(false);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingImage}
                        />
                        <button type="button" className="px-4 py-2 bg-gray-950 text-white font-bold rounded-lg text-[10px] uppercase tracking-widest hover:bg-gray-800 transition">
                          + Upload Gallery Image
                        </button>
                      </div>
                    </div>

                    {(pageEditorState.featuredImages || []).length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {(pageEditorState.featuredImages || []).map((img, idx) => (
                          <div key={idx} className="relative aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100 group">
                            <img src={img} className="w-full h-full object-cover" alt="Gallery item" />
                            <button
                              type="button"
                              onClick={() => setPageEditorState(prev => ({
                                ...prev,
                                featuredImages: prev.featuredImages.filter((_, i) => i !== idx)
                              }))}
                              className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 font-bold">No gallery images added yet. Click upload to build a showcase portfolio!</p>
                    )}
                  </div>

                  {pageEditorState.layout === 'contact-grid' && (
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                      <input
                        type="checkbox"
                        id="showContactForm"
                        checked={pageEditorState.showContactForm}
                        onChange={e => setPageEditorState(prev => ({ ...prev, showContactForm: e.target.checked }))}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <label htmlFor="showContactForm" className="text-[10px] font-black text-gray-700 uppercase tracking-wider cursor-pointer">
                        Enable Interactive Customer Contact Form (Integrated with Mail Settings)
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Body Content Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Page Body / Custom Content Narrative (Markdown/HTML supported)</label>
              <textarea
                value={pageEditorState.content}
                onChange={e => setPageEditorState(prev => ({ ...prev, content: e.target.value }))}
                rows={12}
                placeholder="Write your custom narrative, intro, mission, or description details here..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none text-sm font-medium min-h-[250px] font-sans"
              />
            </div>

            {/* SEO Section */}
            <div className="pt-6 border-t border-gray-100 space-y-4 bg-gray-50/30 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">SEO Search Metadata (Optional overrides)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase">Search Page Title (Meta Title)</label>
                  <input
                    value={pageEditorState.seoTitle}
                    onChange={e => setPageEditorState(prev => ({ ...prev, seoTitle: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 p-3 text-xs focus:border-primary outline-none"
                    placeholder="Page Browser Meta Title"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase">Search Snippet Description (Meta Desc)</label>
                  <textarea
                    value={pageEditorState.seoDescription}
                    onChange={e => setPageEditorState(prev => ({ ...prev, seoDescription: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 p-3 text-xs focus:border-primary outline-none resize-none"
                    rows={2}
                    placeholder="Short SEO snippet overview..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mobilePresets' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200/80 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                    Mobile Experience Engine
                  </span>
                  <span className="text-xs font-bold text-gray-500">10 Presets Available</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 mt-1">Select Active Mobile Frontpage Layout</h3>
                <p className="text-xs text-gray-600 max-w-2xl mt-0.5">
                  Choose how your storefront renders on mobile devices (smartphones and small screens). Each preset adapts Hero, Featured Tours, Car Rental, Guest Favorites, Reviews, Blog & Footer to specific marketplace styles.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Currently Active</p>
                  <p className="text-sm font-black text-orange-600">
                    {settings?.mobilePreset || 'klook-explorer'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                id: 'klook-explorer',
                name: 'Klook Explorer (2-Column Grid)',
                tag: 'Recommended · User Request',
                tagColor: 'bg-orange-500 text-white',
                borderAccent: 'border-orange-400 ring-2 ring-orange-400/20',
                description: 'Klook-inspired high-conversion layout featuring 2-column compact tour cards for Featured & Guest Favorites, fast category pills, chauffeur charter banner, reviews and blog cards.',
                features: [
                  '2-Column Tour Cards (Featured & Favorites)',
                  'Klook Orange Theme & Sticky Search',
                  'Category Quick-Pill Horizontal Strip',
                  'Chauffeur & Car Rental Banner',
                  'Verified Review Testimonials + Travel Inspiration'
                ]
              },
              {
                id: 'getyourguide-activity',
                name: 'GetYourGuide Activity',
                tag: 'Activity & Bestseller Badges',
                tagColor: 'bg-blue-600 text-white',
                borderAccent: 'border-blue-400',
                description: 'Sapphire & sunny yellow theme with horizontal activity listings, free cancellation tags, duration badges, and bestseller sliders.',
                features: [
                  'Horizontal Activity Cards with Badges',
                  'Sapphire & Yellow Theme',
                  'Instant Confirmation & Duration Tags',
                  'Car Charter Spotlight Card',
                  'Traveler Voice Reviews Carousel'
                ]
              },
              {
                id: 'airbnb-experiences',
                name: 'Airbnb Experiences',
                tag: 'Photo-First & Soft Curved',
                tagColor: 'bg-rose-500 text-white',
                borderAccent: 'border-rose-300',
                description: 'Soft curved photo-first cards with floating pill search capsule, hosted driver experience highlights, and authentic guest quote testimonials.',
                features: [
                  'Floating Search Capsule ("Where next?")',
                  'Full-Aspect Photo Cards (4:3)',
                  'Curated Bali Hosts Spotlight',
                  'Host Chauffeur Card',
                  'Authentic Quotes & Stories'
                ]
              },
              {
                id: 'viator-classic',
                name: 'Viator Classic',
                tag: 'High Trust & Urgency',
                tagColor: 'bg-emerald-700 text-white',
                borderAccent: 'border-emerald-400',
                description: 'Deep forest trust theme with "Likely to Sell Out" badges, badge counters, airport transfer card, and comprehensive review summary.',
                features: [
                  '"Likely to Sell Out" Urgency Badges',
                  'Forest Green Trust Styling',
                  'Airport Transfer & Chauffeur Card',
                  'Tripadvisor Rating Integration',
                  'Verified Guest Badges'
                ]
              },
              {
                id: 'tripadvisor-wanderer',
                name: 'Tripadvisor Wanderer',
                tag: 'Rankings & Bubble Scores',
                tagColor: 'bg-emerald-600 text-white',
                borderAccent: 'border-emerald-400',
                description: 'Emerald green bubble scores, category circle shortcuts, #1 in Bali rank tags, and full-width chauffeur charter booking card.',
                features: [
                  'Green Bubble Score Rating Badges',
                  'Round Category Circle Shortcuts',
                  '#1 Ranked Bali Expeditions',
                  'Chauffeur Charter Card',
                  'Community Travel Insight'
                ]
              },
              {
                id: 'luxury-concierge',
                name: 'Luxury Concierge',
                tag: 'Obsidian & Champagne Gold',
                tagColor: 'bg-amber-600 text-white',
                borderAccent: 'border-amber-400',
                description: 'Obsidian dark canvas with champagne gold accents, VIP private helicopter & yacht charter cards, Toyota Alphard fleet, and elite reviews.',
                features: [
                  'Obsidian Dark Canvas & Gold Badges',
                  'VIP Private Itinerary Showcases',
                  'Toyota Alphard Chauffeur Fleet Card',
                  'Concierge Desk WhatsApp Action',
                  'Editorial High-Society Journal'
                ]
              },
              {
                id: 'boutique-minimalist',
                name: 'Boutique Minimalist',
                tag: 'Scandinavian Monochrome',
                tagColor: 'bg-gray-900 text-white',
                borderAccent: 'border-gray-400',
                description: 'Scandinavian clean monochrome aesthetic, numbered architectural sections (01, 02, 03), subtle hairline dividers, and minimal tour cards.',
                features: [
                  'Scandinavian Monochrome Layout',
                  'Numbered Architectural Sections (01, 02)',
                  'Subtle Hairline Dividers',
                  'Clean Minimalist Car Card',
                  'Editorial Journal Overview'
                ]
              },
              {
                id: 'nordic-adventure',
                name: 'Nordic Adventure',
                tag: 'Outdoor & Expeditions',
                tagColor: 'bg-stone-800 text-white',
                borderAccent: 'border-stone-400',
                description: 'Forest green & earthy palette, trail difficulty badges, 4x4 mountain Jeep transport card, and outdoor adventure field guides.',
                features: [
                  'Trail Difficulty Badges (Moderate/Challenging)',
                  'Deep Forest Earth Palette',
                  '4x4 Mountain Jeep & SUV Card',
                  'Field Equipment & Safety Guides',
                  'Verified Trekker Feedback'
                ]
              },
              {
                id: 'tokyo-cyber',
                name: 'Tokyo Cyber Slate',
                tag: 'Dark Neon & Live Counters',
                tagColor: 'bg-cyan-600 text-white',
                borderAccent: 'border-cyan-400',
                description: 'Dark slate canvas with glowing cyan accents, instant QR pass badges, live spots remaining counter, and sports car rental card.',
                features: [
                  'Dark Slate Canvas with Cyan Accents',
                  'Instant QR Fast-Pass Badges',
                  'Live Spots Remaining Counter',
                  'Cyber Chauffeur & Sports Car Card',
                  'Live Community Feedback Stream'
                ]
              },
              {
                id: 'island-breeze',
                name: 'Island Breeze Resort',
                tag: 'Tropical Ocean & Coral',
                tagColor: 'bg-teal-600 text-white',
                borderAccent: 'border-teal-400',
                description: 'Turquoise ocean & coral sunset resort theme, speedboat transfer & beach club cards, sun lounger vibe, and tropical reviews.',
                features: [
                  'Turquoise & Coral Gradient Accents',
                  'Speedboat & Beach Club Transfer Card',
                  'Island Hopping Quick Badges',
                  'Tropical Guest Reviews',
                  'Bali Insider Secret Guides'
                ]
              }
            ].map((p) => {
              const isSelected = (settings?.mobilePreset || 'klook-explorer') === p.id;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "border rounded-2xl p-5 flex flex-col justify-between transition-all relative overflow-hidden bg-white shadow-xs",
                    isSelected
                      ? `${p.borderAccent} shadow-md ring-2 ring-orange-500/20`
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-orange-600 text-white px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Check className="w-3 h-3" /> Active Preset
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", p.tagColor)}>
                        {p.tag}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-gray-900 leading-snug">{p.name}</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{p.description}</p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Layout Structure:</p>
                      <ul className="space-y-1">
                        {p.features.map((feat, idx) => (
                          <li key={idx} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-orange-500 font-bold">•</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-5 mt-3 border-t border-gray-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSettings(prev => prev ? ({ ...prev, mobilePreset: p.id }) : prev);
                      }}
                      className={cn(
                        "w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2",
                        isSelected
                          ? "bg-orange-600 text-white shadow-sm cursor-default"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" /> Selected Preset
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4 text-gray-500" /> Apply This Preset
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
