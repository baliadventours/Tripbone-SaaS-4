import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  db 
} from '../../lib/firebase';
import { PageContent, LandingPageSection, LandingPageFeatureItem } from '../../types';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Save, 
  Loader2, 
  Eye, 
  MoveUp, 
  MoveDown, 
  Sparkles, 
  Image as ImageIcon, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  Award, 
  Heart, 
  Users, 
  Zap, 
  Headphones, 
  Compass, 
  Calendar, 
  DollarSign,
  Layout,
  ExternalLink,
  Code2,
  Columns,
  Sparkle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { uploadImage } from '../../lib/imgbb';

interface LandingPageGeneratorProps {
  openMediaGallery?: (onSelect: (urls: string[]) => void, multiple?: boolean) => void;
  allTours?: any[];
}

const FEATURE_ICONS: { [key: string]: any } = {
  ShieldCheck,
  Star,
  CheckCircle,
  Clock,
  Award,
  Heart,
  Users,
  Zap,
  Headphones,
  Compass,
  Calendar,
  DollarSign,
  MapPin,
  Sparkles
};

export const DEFAULT_LANDING_SECTIONS: LandingPageSection[] = [
  {
    id: 'sec_hero',
    type: 'hero',
    enabled: true,
    heroTitle: 'Experience Extraordinary Private Bali Adventures',
    heroSubtitle: 'Handcrafted itineraries, licensed local expert guides, luxury VIP transfers, and 5-star personalized hospitality.',
    heroImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80',
    heroCtaText: 'Explore Signature Tours',
    heroCtaLink: '#featured-tours',
    heroOverlay: 'medium'
  },
  {
    id: 'sec_intro',
    type: 'intro',
    enabled: true,
    introTitle: 'Welcome to Bali Adventours',
    introContent: 'We are a premier boutique tour operator dedicated to revealing the true heart and soul of Bali. From sacred sunrise temple treks and hidden cascading waterfalls to serene rice terrace walks and private island transfers, our dedicated local guides ensure every moment of your journey is seamless, safe, and truly unforgettable.'
  },
  {
    id: 'sec_tours',
    type: 'tours',
    enabled: true,
    toursTitle: 'Our Signature Recommended Tours',
    toursSubtitle: 'Hand-picked experiences curated for discerning travelers',
    selectedTourIds: [],
    toursColumns: 3
  },
  {
    id: 'sec_features',
    type: 'features',
    enabled: true,
    featuresTitle: 'Why Book With Us',
    featuresSubtitle: 'The dedicated quality standards that set our journeys apart',
    features: [
      {
        id: 'feat_1',
        title: '100% Direct Price Guarantee',
        description: 'No hidden commissions or third-party reseller markups. Pay direct local prices with full transparency.',
        icon: 'DollarSign'
      },
      {
        id: 'feat_2',
        title: 'Flexible Free Cancellation',
        description: 'Plans change effortlessly. Enjoy up to 24-hour hassle-free cancellation with instant full refunds.',
        icon: 'Clock'
      },
      {
        id: 'feat_3',
        title: '5-Star Licensed Guides',
        description: 'English-fluent local experts born and raised in Bali, passionate about culture, safety, and storytelling.',
        icon: 'ShieldCheck'
      },
      {
        id: 'feat_4',
        title: '24/7 Dedicated Concierge',
        description: 'Direct line via WhatsApp for any assistance, custom itinerary tweaks, or instant recommendations.',
        icon: 'Headphones'
      }
    ]
  },
  {
    id: 'sec_reviews',
    type: 'reviews',
    enabled: true,
    reviewsTitle: 'Guest Testimonials & Reviews',
    reviewsSubtitle: 'Real experiences shared by travelers from around the globe',
    reviewsEmbedCode: '<div class="elfsight-app-eb388836-7c64-42f1-aa5b-017e822067bd" data-elfsight-app-lazy></div>\n<script src="https://static.elfsight.com/platform/platform.js" async></script>'
  },
  {
    id: 'sec_contact',
    type: 'contact',
    enabled: true,
    contactTitle: 'Get In Touch & Visit Us',
    contactSubtitle: 'Have questions or want a custom trip plan? Reach out to our team directly.',
    contactPhone: '+62 812-3456-7890',
    contactEmail: 'info@baliadventours.com',
    contactWhatsapp: '+62 812-3456-7890',
    contactAddress: 'Jalan Raya Ubud No. 88, Gianyar, Bali 80571, Indonesia',
    contactMapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63138.64708779032!2d115.2287233!3d-8.5068537!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd23d739818b2c5%3A0x5030bfbca735e70!2sUbud%2C%20Gianyar%20Regency%2C%20Bali!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid'
  }
];

export default function LandingPageGenerator({ openMediaGallery, allTours = [] }: LandingPageGeneratorProps) {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'landing' | 'static'>('landing');
  const [editingPage, setEditingPage] = useState<Partial<PageContent> | null>(null);
  const [activeEditorTab, setActiveEditorTab] = useState<'build' | 'preview' | 'seo'>('build');
  const [saving, setSaving] = useState(false);
  const [tourSearch, setTourSearch] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'pages'), (snapshot) => {
      setPages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PageContent)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const landingPages = pages.filter(p => p.isLandingPage);
  const staticPages = pages.filter(p => !p.isLandingPage);

  const handleCreateNewLandingPage = () => {
    const defaultSlug = `landing-${Date.now().toString().slice(-4)}`;
    setEditingPage({
      title: 'Tenant Special Landing Page',
      slug: defaultSlug,
      isLandingPage: true,
      sections: JSON.parse(JSON.stringify(DEFAULT_LANDING_SECTIONS)),
      seo: {
        title: 'Exclusive Experiences – Bali Adventours',
        description: 'Explore top-rated tours, handcrafted itineraries, and luxury private transfers with Bali Adventours.'
      }
    });
    setActiveEditorTab('build');
  };

  const handleCreateStaticPage = () => {
    setEditingPage({
      title: 'New Page',
      slug: `page-${Date.now().toString().slice(-4)}`,
      content: '',
      isLandingPage: false,
      seo: { title: '', description: '' }
    });
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage?.title || !editingPage?.slug) {
      alert("Please provide both a Title and a URL slug.");
      return;
    }

    setSaving(true);
    try {
      const slugClean = editingPage.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      const pageData: Partial<PageContent> = {
        title: editingPage.title,
        slug: slugClean,
        isLandingPage: !!editingPage.isLandingPage,
        seo: editingPage.seo || { title: editingPage.title, description: '' },
        updatedAt: serverTimestamp()
      };

      if (editingPage.isLandingPage) {
        pageData.sections = editingPage.sections || [];
      } else {
        pageData.content = editingPage.content || '';
      }

      if (editingPage.id) {
        await updateDoc(doc(db, 'pages', editingPage.id), pageData);
      } else {
        await addDoc(collection(db, 'pages'), pageData);
      }
      setEditingPage(null);
      alert("Landing Page saved successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to save page: " + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (secId: string, updates: Partial<LandingPageSection>) => {
    if (!editingPage?.sections) return;
    const newSections = editingPage.sections.map(sec => 
      sec.id === secId ? { ...sec, ...updates } : sec
    );
    setEditingPage({ ...editingPage, sections: newSections });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!editingPage?.sections) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= editingPage.sections.length) return;
    const newSecs = [...editingPage.sections];
    const temp = newSecs[index];
    newSecs[index] = newSecs[targetIdx];
    newSecs[targetIdx] = temp;
    setEditingPage({ ...editingPage, sections: newSecs });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[20px] border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-orange-100 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Website Builder Module
            </span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Pages & Landing Page Generator</h2>
          <p className="text-gray-500 font-medium text-sm mt-1">
            Build custom block-based landing pages or manage static pages (Terms, Privacy) for your agency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNewLandingPage}
            className="bg-primary text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" /> Generate Landing Page
          </button>
          <button
            onClick={handleCreateStaticPage}
            className="bg-gray-900 text-white px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-black transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Static Page
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveSubTab('landing')}
          className={cn(
            "px-6 py-3 rounded-t-xl font-black text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2",
            activeSubTab === 'landing'
              ? "border-primary text-primary bg-orange-50/40"
              : "border-transparent text-gray-400 hover:text-gray-700"
          )}
        >
          <Layout className="h-4 w-4" />
          Landing Pages ({landingPages.length})
        </button>
        <button
          onClick={() => setActiveSubTab('static')}
          className={cn(
            "px-6 py-3 rounded-t-xl font-black text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2",
            activeSubTab === 'static'
              ? "border-primary text-primary bg-orange-50/40"
              : "border-transparent text-gray-400 hover:text-gray-700"
          )}
        >
          <Code2 className="h-4 w-4" />
          Static Content Pages ({staticPages.length})
        </button>
      </div>

      {/* LANDING PAGES TAB CONTENT */}
      {activeSubTab === 'landing' && (
        <div className="space-y-6">
          {landingPages.length === 0 ? (
            <div className="bg-white rounded-[24px] border-2 border-dashed border-gray-200 p-16 text-center space-y-4">
              <div className="h-16 w-16 bg-orange-50 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">No Custom Landing Pages Yet</h3>
                <p className="text-gray-500 font-medium text-sm max-w-md mx-auto mt-1">
                  Create high-converting tenant landing pages complete with Hero images, Introduction paragraphs, Tour grids, Why Book features, Elfsight Reviews, and Contact Google Maps!
                </p>
              </div>
              <button
                onClick={handleCreateNewLandingPage}
                className="bg-primary text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" /> Generate Default Tenant Landing Page
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {landingPages.map(page => (
                <div 
                  key={page.id} 
                  className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm transition-all hover:border-primary group hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-xl bg-orange-50 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Layout className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md">
                        Block Builder
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-gray-900 tracking-tight group-hover:text-primary transition-colors">
                        {page.title}
                      </h3>
                      <p className="text-xs font-bold text-primary tracking-tight mt-1">
                        /page/{page.slug}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {(page.sections || []).filter(s => s.enabled).map(s => (
                        <span key={s.id} className="text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {s.type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
                    <a
                      href={`/page/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Preview Live
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingPage(page)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Page"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete landing page "${page.title}"?`)) {
                            await deleteDoc(doc(db, 'pages', page.id!));
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Page"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STATIC PAGES TAB CONTENT */}
      {activeSubTab === 'static' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staticPages.map(page => (
            <div key={page.id} className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm transition-all hover:border-primary group hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-gray-50 text-gray-700 flex items-center justify-center">
                  <Code2 className="h-6 w-6" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditingPage(page)} className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                  <button 
                    onClick={async () => {
                      if (confirm("Delete this page?")) await deleteDoc(doc(db, 'pages', page.id!));
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-1 group-hover:text-primary transition-colors">{page.title}</h3>
              <p className="text-xs font-semibold text-primary tracking-tight mb-3">/{page.slug}</p>
              <p className="text-xs text-gray-500 line-clamp-3 font-medium leading-relaxed">
                {(page.content || '').replace(/<[^>]*>/g, '').substring(0, 120)}...
              </p>
            </div>
          ))}
          {staticPages.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-2xl">
              No static content pages added yet. Click "Static Page" above to add legal policies or standard pages.
            </div>
          )}
        </div>
      )}

      {/* EDITING / BUILDER MODAL */}
      <AnimatePresence>
        {editingPage && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[28px] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="p-6 bg-gray-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary rounded-xl text-white">
                    {editingPage.isLandingPage ? <Layout className="h-5 w-5" /> : <Code2 className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">
                      {editingPage.id ? (editingPage.isLandingPage ? 'Edit Tenant Landing Page' : 'Edit Static Page') : (editingPage.isLandingPage ? 'Create Tenant Landing Page' : 'New Page')}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      Configure your section blocks, content, and live preview.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Editor View Switcher */}
                  {editingPage.isLandingPage && (
                    <div className="flex bg-gray-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setActiveEditorTab('build')}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                          activeEditorTab === 'build' ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                        )}
                      >
                        Section Blocks
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveEditorTab('preview')}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                          activeEditorTab === 'preview' ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                        )}
                      >
                        <Eye className="h-3.5 w-3.5" /> Live Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveEditorTab('seo')}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                          activeEditorTab === 'seo' ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                        )}
                      >
                        SEO
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setEditingPage(null)}
                    className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSavePage} className="flex-1 overflow-y-auto p-8 space-y-8">
                
                {/* Meta General Info Bar */}
                <div className="grid md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Page Title</label>
                    <input
                      required
                      value={editingPage.title || ''}
                      onChange={e => setEditingPage({ ...editingPage, title: e.target.value })}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white p-3.5 font-black text-gray-900 focus:border-primary focus:outline-none transition-all"
                      placeholder="e.g. Bali Private Adventure Tours"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">URL Slug</label>
                    <div className="flex items-center">
                      <span className="bg-gray-200 text-gray-600 px-3.5 py-3.5 rounded-l-xl text-xs font-bold font-mono">/page/</span>
                      <input
                        required
                        value={editingPage.slug || ''}
                        onChange={e => setEditingPage({ ...editingPage, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                        className="w-full rounded-r-xl border-2 border-l-0 border-gray-200 bg-white p-3.5 font-mono text-xs font-bold text-gray-800 focus:border-primary focus:outline-none transition-all"
                        placeholder="landing-bali-tours"
                      />
                    </div>
                  </div>
                </div>

                {/* IF STATIC PAGE: Render simple HTML/Markdown Editor */}
                {!editingPage.isLandingPage && (
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Page Content (HTML / Markdown Supported)</label>
                    <textarea
                      required
                      rows={12}
                      value={editingPage.content || ''}
                      onChange={e => setEditingPage({ ...editingPage, content: e.target.value })}
                      className="w-full rounded-2xl border-2 border-gray-200 p-4 font-medium text-sm focus:border-primary focus:outline-none transition-all"
                      placeholder="Write your page content here..."
                    />
                  </div>
                )}

                {/* IF LANDING PAGE BUILD TAB: Render 8 Editable Block Sections */}
                {editingPage.isLandingPage && activeEditorTab === 'build' && (
                  <div className="space-y-8">
                    
                    {/* 1. Header Navigation Banner Notice (Default Header) */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-primary/20 text-primary border border-primary/30 rounded-lg flex items-center justify-center font-black text-xs">
                          NAV
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-orange-400">1. Header Navigation (Default Header)</p>
                          <p className="text-[11px] text-gray-300">Renders tenant custom logo, menu links, currency selector & contact bar automatically.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded">Active</span>
                    </div>

                    {/* Section Blocks Loop */}
                    <div className="space-y-6">
                      {editingPage.sections?.map((sec, idx) => (
                        <div 
                          key={sec.id} 
                          className={cn(
                            "rounded-2xl border-2 transition-all overflow-hidden bg-white shadow-xs",
                            sec.enabled ? "border-gray-200 hover:border-primary/50" : "border-gray-100 bg-gray-50/50 opacity-60"
                          )}
                        >
                          {/* Section Header Bar */}
                          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="h-7 w-7 rounded-lg bg-orange-100 text-primary flex items-center justify-center font-black text-xs">
                                {idx + 2}
                              </span>
                              <div>
                                <h4 className="font-black text-sm text-gray-900 uppercase tracking-wider">
                                  {sec.type === 'hero' && '2. Hero Image & Headline'}
                                  {sec.type === 'intro' && '3. Paragraph Introduction'}
                                  {sec.type === 'tours' && '4. Featured Tour List Grid'}
                                  {sec.type === 'features' && '5. Features List (Why Book With Us)'}
                                  {sec.type === 'reviews' && '6. Review List (Elfsight Embed)'}
                                  {sec.type === 'contact' && '7. Contact Information & Maps Embed'}
                                </h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Move Up / Down */}
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveSection(idx, 'up')}
                                className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-30"
                              >
                                <MoveUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (editingPage.sections?.length || 0) - 1}
                                onClick={() => moveSection(idx, 'down')}
                                className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-30"
                              >
                                <MoveDown className="h-4 w-4" />
                              </button>

                              {/* Toggle Enabled */}
                              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer ml-2">
                                <input
                                  type="checkbox"
                                  checked={sec.enabled}
                                  onChange={e => updateSection(sec.id, { enabled: e.target.checked })}
                                  className="rounded accent-primary h-4 w-4"
                                />
                                {sec.enabled ? <span className="text-primary">Enabled</span> : <span className="text-gray-400">Disabled</span>}
                              </label>
                            </div>
                          </div>

                          {/* Section Inputs Body */}
                          {sec.enabled && (
                            <div className="p-6 space-y-6">
                              
                              {/* HERO EDIT BLOCK */}
                              {sec.type === 'hero' && (
                                <div className="space-y-6">
                                  <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Headline Title</label>
                                      <input
                                        value={sec.heroTitle || ''}
                                        onChange={e => updateSection(sec.id, { heroTitle: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-sm font-black text-gray-900 focus:border-primary outline-none"
                                        placeholder="Headline banner..."
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subheadline / Tagline</label>
                                      <input
                                        value={sec.heroSubtitle || ''}
                                        onChange={e => updateSection(sec.id, { heroSubtitle: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs font-medium focus:border-primary outline-none"
                                        placeholder="Short supporting description..."
                                      />
                                    </div>
                                  </div>

                                  <div className="grid md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hero Image URL</label>
                                      <div className="flex gap-2">
                                        <input
                                          value={sec.heroImage || ''}
                                          onChange={e => updateSection(sec.id, { heroImage: e.target.value })}
                                          className="w-full rounded-xl border border-gray-200 p-3 text-xs font-bold text-gray-800 focus:border-primary outline-none"
                                          placeholder="https://images.unsplash.com/..."
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (openMediaGallery) {
                                              openMediaGallery((urls) => {
                                                if (urls[0]) updateSection(sec.id, { heroImage: urls[0] });
                                              }, false);
                                            }
                                          }}
                                          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                                        >
                                          <ImageIcon className="h-4 w-4 text-primary" /> Gallery
                                        </button>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Overlay Darkening</label>
                                      <select
                                        value={sec.heroOverlay || 'medium'}
                                        onChange={e => updateSection(sec.id, { heroOverlay: e.target.value as any })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs font-bold focus:border-primary outline-none"
                                      >
                                        <option value="none">No Overlay</option>
                                        <option value="light">Light Darkening</option>
                                        <option value="medium">Medium Darkening</option>
                                        <option value="dark">Dark Gradient</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CTA Button Text</label>
                                      <input
                                        value={sec.heroCtaText || ''}
                                        onChange={e => updateSection(sec.id, { heroCtaText: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs font-bold focus:border-primary outline-none"
                                        placeholder="e.g. Explore All Tours"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CTA Button Link</label>
                                      <input
                                        value={sec.heroCtaLink || ''}
                                        onChange={e => updateSection(sec.id, { heroCtaLink: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs font-bold focus:border-primary outline-none"
                                        placeholder="/tours or #tours"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* PARAGRAPH INTRO BLOCK */}
                              {sec.type === 'intro' && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Introduction Section Headline</label>
                                    <input
                                      value={sec.introTitle || ''}
                                      onChange={e => updateSection(sec.id, { introTitle: e.target.value })}
                                      className="w-full rounded-xl border border-gray-200 p-3 text-sm font-black text-gray-900 focus:border-primary outline-none"
                                      placeholder="Welcome message title..."
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paragraph Content</label>
                                    <textarea
                                      rows={5}
                                      value={sec.introContent || ''}
                                      onChange={e => updateSection(sec.id, { introContent: e.target.value })}
                                      className="w-full rounded-xl border border-gray-200 p-4 text-xs font-medium leading-relaxed focus:border-primary outline-none"
                                      placeholder="Write your tenant introduction paragraph..."
                                    />
                                  </div>
                                </div>
                              )}

                              {/* TOURS LIST COLUMNS BLOCK */}
                              {sec.type === 'tours' && (
                                <div className="space-y-6">
                                  <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tours Section Title</label>
                                      <input
                                        value={sec.toursTitle || ''}
                                        onChange={e => updateSection(sec.id, { toursTitle: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-sm font-black text-gray-900 focus:border-primary outline-none"
                                        placeholder="Our Signature Tours"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtitle</label>
                                      <input
                                        value={sec.toursSubtitle || ''}
                                        onChange={e => updateSection(sec.id, { toursSubtitle: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs font-medium focus:border-primary outline-none"
                                        placeholder="Handpicked recommendations"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Layout Columns</label>
                                      <select
                                        value={sec.toursColumns || 3}
                                        onChange={e => updateSection(sec.id, { toursColumns: Number(e.target.value) as any })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs font-bold focus:border-primary outline-none"
                                      >
                                        <option value={2}>2 Columns</option>
                                        <option value={3}>3 Columns (Recommended)</option>
                                        <option value={4}>4 Columns</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Tour Selection Checkboxes */}
                                  <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Select Tours to Display ({sec.selectedTourIds?.length || 0} selected)
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Search tour title..."
                                        value={tourSearch}
                                        onChange={e => setTourSearch(e.target.value)}
                                        className="text-xs border border-gray-200 rounded-lg px-3 py-1 bg-white font-medium focus:outline-none"
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                                      {allTours
                                        .filter(t => t.title?.toLowerCase().includes(tourSearch.toLowerCase()))
                                        .map(tour => {
                                          const isSelected = (sec.selectedTourIds || []).includes(tour.id);
                                          return (
                                            <div
                                              key={tour.id}
                                              onClick={() => {
                                                const currentIds = sec.selectedTourIds || [];
                                                const nextIds = isSelected 
                                                  ? currentIds.filter(id => id !== tour.id)
                                                  : [...currentIds, tour.id];
                                                updateSection(sec.id, { selectedTourIds: nextIds });
                                              }}
                                              className={cn(
                                                "p-3 rounded-xl border flex items-center gap-3 cursor-pointer select-none transition-all",
                                                isSelected ? "bg-orange-50 border-primary shadow-xs" : "bg-white border-gray-200 hover:border-gray-300"
                                              )}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                readOnly
                                                className="rounded accent-primary"
                                              />
                                              {tour.gallery?.[0] && (
                                                <img src={tour.gallery[0]} className="h-8 w-8 rounded-lg object-cover" />
                                              )}
                                              <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-gray-900 truncate">{tour.title}</p>
                                                <p className="text-[10px] font-bold text-primary">${tour.regularPrice}</p>
                                              </div>
                                            </div>
                                          );
                                      })}
                                      {allTours.length === 0 && (
                                        <p className="col-span-full py-4 text-center text-xs text-gray-400 font-bold">
                                          No published tours found in tour inventory.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* FEATURES LIST BLOCK (WHY BOOK WITH US) */}
                              {sec.type === 'features' && (
                                <div className="space-y-6">
                                  <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Features Headline</label>
                                      <input
                                        value={sec.featuresTitle || ''}
                                        onChange={e => updateSection(sec.id, { featuresTitle: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-sm font-black text-gray-900 focus:border-primary outline-none"
                                        placeholder="Why Book With Us"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Features Subtitle</label>
                                      <input
                                        value={sec.featuresSubtitle || ''}
                                        onChange={e => updateSection(sec.id, { featuresSubtitle: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs font-medium focus:border-primary outline-none"
                                        placeholder="Why guests prefer our services"
                                      />
                                    </div>
                                  </div>

                                  {/* Feature Items Editor */}
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Feature Cards List ({sec.features?.length || 0})
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newFeats: LandingPageFeatureItem[] = [
                                            ...(sec.features || []),
                                            {
                                              id: `feat_${Date.now()}`,
                                              title: 'New Feature Title',
                                              description: 'Description of this key benefit or service feature.',
                                              icon: 'CheckCircle'
                                            }
                                          ];
                                          updateSection(sec.id, { features: newFeats });
                                        }}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                      >
                                        <Plus className="h-3.5 w-3.5" /> Add Feature Card
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {sec.features?.map((feat, fIdx) => (
                                        <div key={feat.id || fIdx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-3 relative group">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = (sec.features || []).filter((_, i) => i !== fIdx);
                                              updateSection(sec.id, { features: updated });
                                            }}
                                            className="absolute top-3 right-3 text-red-300 hover:text-red-600 transition-colors"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>

                                          <div className="grid grid-cols-3 gap-3">
                                            <div className="col-span-2 space-y-1">
                                              <label className="text-[9px] font-black text-gray-400 uppercase">Feature Title</label>
                                              <input
                                                value={feat.title}
                                                onChange={e => {
                                                  const updated = [...(sec.features || [])];
                                                  updated[fIdx] = { ...updated[fIdx], title: e.target.value };
                                                  updateSection(sec.id, { features: updated });
                                                }}
                                                className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs font-bold focus:border-primary outline-none"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[9px] font-black text-gray-400 uppercase">Icon</label>
                                              <select
                                                value={feat.icon || 'CheckCircle'}
                                                onChange={e => {
                                                  const updated = [...(sec.features || [])];
                                                  updated[fIdx] = { ...updated[fIdx], icon: e.target.value };
                                                  updateSection(sec.id, { features: updated });
                                                }}
                                                className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs font-bold focus:border-primary outline-none"
                                              >
                                                {Object.keys(FEATURE_ICONS).map(iconName => (
                                                  <option key={iconName} value={iconName}>{iconName}</option>
                                                ))}
                                              </select>
                                            </div>
                                          </div>

                                          <div className="space-y-1">
                                            <label className="text-[9px] font-black text-gray-400 uppercase">Description</label>
                                            <textarea
                                              rows={2}
                                              value={feat.description}
                                              onChange={e => {
                                                const updated = [...(sec.features || [])];
                                                updated[fIdx] = { ...updated[fIdx], description: e.target.value };
                                                updateSection(sec.id, { features: updated });
                                              }}
                                              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs font-medium focus:border-primary outline-none"
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* REVIEWS EMBOD CODE BLOCK (ELFSIGHT) */}
                              {sec.type === 'reviews' && (
                                <div className="space-y-4">
                                  <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reviews Section Title</label>
                                      <input
                                        value={sec.reviewsTitle || ''}
                                        onChange={e => updateSection(sec.id, { reviewsTitle: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-sm font-black text-gray-900 focus:border-primary outline-none"
                                        placeholder="Guest Reviews & Ratings"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtitle</label>
                                      <input
                                        value={sec.reviewsSubtitle || ''}
                                        onChange={e => updateSection(sec.id, { reviewsSubtitle: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs font-medium focus:border-primary outline-none"
                                        placeholder="What our travelers say about us"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                      <Code2 className="h-3.5 w-3.5 text-primary" /> Elfsight Widget HTML / Script Embed Code
                                    </label>
                                    <textarea
                                      rows={5}
                                      value={sec.reviewsEmbedCode || ''}
                                      onChange={e => updateSection(sec.id, { reviewsEmbedCode: e.target.value })}
                                      className="w-full font-mono text-xs rounded-xl border border-gray-200 bg-slate-900 text-emerald-400 p-4 focus:border-primary outline-none"
                                      placeholder="<div class='elfsight-app-...'></div>..."
                                    />
                                    <p className="text-[10px] text-gray-400">
                                      Paste your custom Elfsight widget embed HTML code or script tag above. If left blank, a clean default testimonial layout will be displayed.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* CONTACT & MAPS EMBED BLOCK */}
                              {sec.type === 'contact' && (
                                <div className="space-y-6">
                                  <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Section Title</label>
                                      <input
                                        value={sec.contactTitle || ''}
                                        onChange={e => updateSection(sec.id, { contactTitle: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-sm font-black text-gray-900 focus:border-primary outline-none"
                                        placeholder="Contact Information & Office"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtitle</label>
                                      <input
                                        value={sec.contactSubtitle || ''}
                                        onChange={e => updateSection(sec.id, { contactSubtitle: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs font-medium focus:border-primary outline-none"
                                        placeholder="We are available 24/7 for booking inquiries"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-gray-400 uppercase">Phone Number</label>
                                      <input
                                        value={sec.contactPhone || ''}
                                        onChange={e => updateSection(sec.id, { contactPhone: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs font-bold focus:border-primary outline-none"
                                        placeholder="+62 812-3456-7890"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-gray-400 uppercase">Email Address</label>
                                      <input
                                        value={sec.contactEmail || ''}
                                        onChange={e => updateSection(sec.id, { contactEmail: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs font-bold focus:border-primary outline-none"
                                        placeholder="info@yourdomain.com"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-gray-400 uppercase">WhatsApp Number</label>
                                      <input
                                        value={sec.contactWhatsapp || ''}
                                        onChange={e => updateSection(sec.id, { contactWhatsapp: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs font-bold focus:border-primary outline-none"
                                        placeholder="+62 812-3456-7890"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Office Address</label>
                                    <input
                                      value={sec.contactAddress || ''}
                                      onChange={e => updateSection(sec.id, { contactAddress: e.target.value })}
                                      className="w-full rounded-xl border border-gray-200 p-3 text-xs font-bold text-gray-800 focus:border-primary outline-none"
                                      placeholder="Jalan Raya Ubud No. 88, Gianyar, Bali..."
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                      <MapPin className="h-3.5 w-3.5 text-primary" /> Google Maps Embed URL or iframe code
                                    </label>
                                    <input
                                      value={sec.contactMapEmbedUrl || ''}
                                      onChange={e => {
                                        let val = e.target.value;
                                        // Auto extract src if iframe tag is pasted
                                        const match = val.match(/src="([^"]+)"/);
                                        if (match) val = match[1];
                                        updateSection(sec.id, { contactMapEmbedUrl: val });
                                      }}
                                      className="w-full rounded-xl border border-gray-200 p-3 text-xs font-mono font-bold text-gray-700 focus:border-primary outline-none"
                                      placeholder="https://www.google.com/maps/embed?pb=..."
                                    />
                                  </div>
                                </div>
                              )}

                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 8. Footer Banner Notice (Default Footer) */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-primary/20 text-primary border border-primary/30 rounded-lg flex items-center justify-center font-black text-xs">
                          FTR
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-orange-400">8. Footer (Default Footer)</p>
                          <p className="text-[11px] text-gray-300">Renders tenant custom footer links, newsletter signup & copyright automatically.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded">Active</span>
                    </div>

                  </div>
                )}

                {/* IF LANDING PAGE PREVIEW TAB: Render Live Mock Preview */}
                {editingPage.isLandingPage && activeEditorTab === 'preview' && (
                  <div className="space-y-8 bg-gray-100 p-6 rounded-3xl border border-gray-200 min-h-[500px]">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                      
                      {/* Fake Nav */}
                      <div className="bg-white border-b px-6 py-4 flex items-center justify-between text-xs font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="h-7 w-7 bg-primary text-white font-black rounded-lg flex items-center justify-center">B</span>
                          <span className="font-black text-gray-900 text-sm">Bali Adventours</span>
                        </div>
                        <div className="flex items-center gap-6 text-gray-600">
                          <span>Home</span>
                          <span>Tours</span>
                          <span>About</span>
                          <span>Contact</span>
                        </div>
                      </div>

                      {/* Sections Render */}
                      {editingPage.sections?.filter(s => s.enabled).map(sec => (
                        <div key={sec.id} className="border-b border-gray-100">
                          {sec.type === 'hero' && (
                            <div className="relative bg-gray-900 text-white py-20 px-8 text-center overflow-hidden">
                              {sec.heroImage && (
                                <img src={sec.heroImage} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                              )}
                              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                                <h1 className="text-3xl font-black">{sec.heroTitle}</h1>
                                <p className="text-sm text-gray-200">{sec.heroSubtitle}</p>
                                {sec.heroCtaText && (
                                  <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg">
                                    {sec.heroCtaText}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {sec.type === 'intro' && (
                            <div className="py-12 px-8 max-w-3xl mx-auto text-center space-y-4">
                              <h2 className="text-2xl font-black text-gray-900">{sec.introTitle}</h2>
                              <p className="text-sm text-gray-600 leading-relaxed font-medium">{sec.introContent}</p>
                            </div>
                          )}

                          {sec.type === 'tours' && (
                            <div className="py-12 px-8 max-w-5xl mx-auto space-y-6">
                              <div className="text-center">
                                <h2 className="text-2xl font-black text-gray-900">{sec.toursTitle}</h2>
                                <p className="text-xs text-gray-500 font-medium">{sec.toursSubtitle}</p>
                              </div>
                              <div className={cn("grid gap-4", sec.toursColumns === 2 ? "grid-cols-2" : sec.toursColumns === 4 ? "grid-cols-4" : "grid-cols-3")}>
                                {(sec.selectedTourIds || []).slice(0, 6).map(tId => {
                                  const tour = allTours.find(t => t.id === tId);
                                  return (
                                    <div key={tId} className="border rounded-xl p-3 bg-white space-y-2">
                                      {tour?.gallery?.[0] && (
                                        <img src={tour.gallery[0]} className="h-28 w-full object-cover rounded-lg" />
                                      )}
                                      <p className="font-bold text-xs line-clamp-1">{tour?.title || 'Selected Tour'}</p>
                                      <p className="text-xs font-black text-primary">${tour?.regularPrice || 99}</p>
                                    </div>
                                  );
                                })}
                                {(sec.selectedTourIds || []).length === 0 && (
                                  <p className="col-span-full text-center py-6 text-xs text-gray-400 font-medium">No tours selected yet in block builder.</p>
                                )}
                              </div>
                            </div>
                          )}

                          {sec.type === 'features' && (
                            <div className="py-12 px-8 bg-orange-50/40 max-w-5xl mx-auto space-y-6">
                              <div className="text-center">
                                <h2 className="text-2xl font-black text-gray-900">{sec.featuresTitle}</h2>
                                <p className="text-xs text-gray-500 font-medium">{sec.featuresSubtitle}</p>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                {sec.features?.map(feat => {
                                  const Icon = FEATURE_ICONS[feat.icon || 'CheckCircle'] || CheckCircle;
                                  return (
                                    <div key={feat.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-3">
                                      <div className="p-2 bg-orange-50 text-primary rounded-lg shrink-0">
                                        <Icon className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-xs text-gray-900">{feat.title}</h4>
                                        <p className="text-[11px] text-gray-500 mt-0.5">{feat.description}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {sec.type === 'reviews' && (
                            <div className="py-12 px-8 max-w-3xl mx-auto text-center space-y-4">
                              <h2 className="text-2xl font-black text-gray-900">{sec.reviewsTitle}</h2>
                              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-xs font-mono text-gray-600">
                                [Elfsight Reviews Embed Code Active]
                              </div>
                            </div>
                          )}

                          {sec.type === 'contact' && (
                            <div className="py-12 px-8 max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <h2 className="text-2xl font-black text-gray-900">{sec.contactTitle}</h2>
                                <p className="text-xs text-gray-500">{sec.contactSubtitle}</p>
                                <div className="space-y-2 text-xs font-medium text-gray-700 pt-2">
                                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {sec.contactPhone}</p>
                                  <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {sec.contactEmail}</p>
                                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {sec.contactAddress}</p>
                                </div>
                              </div>
                              <div className="h-40 rounded-xl overflow-hidden bg-gray-200">
                                {sec.contactMapEmbedUrl ? (
                                  <iframe src={sec.contactMapEmbedUrl} className="w-full h-full border-0" />
                                ) : (
                                  <div className="h-full flex items-center justify-center text-xs text-gray-400 font-bold">Google Maps Embed</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Fake Footer */}
                      <div className="bg-gray-900 text-gray-400 px-6 py-6 text-[11px] text-center">
                        © {new Date().getFullYear()} Bali Adventours. All rights reserved.
                      </div>
                    </div>
                  </div>
                )}

                {/* SEO TAB */}
                {editingPage.isLandingPage && activeEditorTab === 'seo' && (
                  <div className="space-y-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="font-black text-sm text-gray-900 uppercase tracking-widest">Search Engine Optimization (SEO)</h4>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-gray-400 uppercase">Meta Title</label>
                        <input
                          value={editingPage.seo?.title || ''}
                          onChange={e => setEditingPage({ ...editingPage, seo: { ...editingPage.seo, title: e.target.value } })}
                          className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs font-bold text-gray-900 focus:border-primary outline-none"
                          placeholder="Page Browser Meta Title"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-gray-400 uppercase">Meta Description</label>
                        <textarea
                          rows={3}
                          value={editingPage.seo?.description || ''}
                          onChange={e => setEditingPage({ ...editingPage, seo: { ...editingPage.seo, description: e.target.value } })}
                          className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs font-medium focus:border-primary outline-none"
                          placeholder="Short summary for Google search snippets..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Footer Bar */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditingPage(null)}
                    className="px-8 py-4 font-bold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-primary text-white px-12 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {editingPage.id ? 'Publish Changes' : 'Create & Publish Landing Page'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
