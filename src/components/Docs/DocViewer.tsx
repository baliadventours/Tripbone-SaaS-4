import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Search, ChevronRight, ChevronLeft, ChevronDown, Image as ImageIcon, 
  ExternalLink, Layers, Copy, Check, Sparkles, FileText,
  HelpCircle, ArrowLeft, Menu, X, Plus, Globe,
  CheckCircle2, ListOrdered, Share2, Sun, Moon, Settings, FolderPlus
} from 'lucide-react';
import { db, collection, onSnapshot } from '../../lib/firebase';
import { useTenant } from '../../lib/TenantContext';

export interface DocArticle {
  id: string;
  slug: string;
  title: string;
  subTitle?: string;
  subSubTitle?: string;
  category: string;
  categoryOrder?: number;
  description: string;
  content: string; // Markdown or HTML string
  steps?: { title: string; desc: string; image?: string }[];
  images?: string[];
  order: number;
  status: 'published' | 'draft';
  updatedAt?: any;
  createdAt?: any;
}

export interface DocCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
}

import { DEFAULT_DOC_CATEGORIES, DEFAULT_DOC_ARTICLES } from './defaultDocsData';
export { DEFAULT_DOC_CATEGORIES, DEFAULT_DOC_ARTICLES };


interface DocViewerProps {
  onOpenManageModal?: () => void;
  isSuperAdmin?: boolean;
}

export default function DocViewer({ onOpenManageModal, isSuperAdmin = false }: DocViewerProps) {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  // Theme Mode: 'dark' | 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tripbone_docs_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('tripbone_docs_theme', nextTheme);
  };

  const [articles, setArticles] = useState<DocArticle[]>(DEFAULT_DOC_ARTICLES);
  const [categories, setCategories] = useState<DocCategory[]>(DEFAULT_DOC_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Collapse and Expand State for Left Sidebar Navigation
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);

  // Load articles from Firestore `documentation_articles`
  useEffect(() => {
    const q = collection(db, 'documentation_articles');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DocArticle[];
        docs.sort((a, b) => (a.order || 0) - (b.order || 0));
        setArticles(docs);
      }
    }, (error) => {
      console.warn("Docs collection snapshot fallback:", error);
    });

    return () => unsubscribe();
  }, []);

  // Load categories from Firestore `documentation_categories`
  useEffect(() => {
    const q = collection(db, 'documentation_categories');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const cats = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DocCategory[];
        cats.sort((a, b) => (a.order || 0) - (b.order || 0));
        setCategories(cats);
      }
    }, (error) => {
      console.warn("Docs categories snapshot fallback:", error);
    });

    return () => unsubscribe();
  }, []);

  // Filtered published articles
  const publishedArticles = useMemo(() => {
    return articles.filter(a => a.status === 'published' || isSuperAdmin);
  }, [articles, isSuperAdmin]);

  // Group articles by Category
  const groupedCategories = useMemo(() => {
    const groups: { [key: string]: DocArticle[] } = {};
    publishedArticles.forEach(art => {
      const cat = art.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(art);
    });

    // Ensure category ordering matching `categories` list if available
    const categoryOrderMap: { [catName: string]: number } = {};
    categories.forEach(c => {
      categoryOrderMap[c.name] = c.order || 99;
    });

    const sortedCategoryNames = Object.keys(groups).sort((a, b) => {
      const orderA = categoryOrderMap[a] ?? 99;
      const orderB = categoryOrderMap[b] ?? 99;
      return orderA - orderB;
    });

    const orderedGroups: { [key: string]: DocArticle[] } = {};
    sortedCategoryNames.forEach(cat => {
      orderedGroups[cat] = groups[cat].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    return orderedGroups;
  }, [publishedArticles, categories]);

  // Active Article selection
  const activeArticle = useMemo(() => {
    if (slug) {
      const found = publishedArticles.find(a => a.slug === slug || a.id === slug);
      if (found) return found;
    }
    return publishedArticles[0] || DEFAULT_DOC_ARTICLES[0];
  }, [slug, publishedArticles]);

  // Auto-expand the category and sub headlines for the active article
  useEffect(() => {
    if (activeArticle) {
      if (activeArticle.category) {
        setCollapsedCategories(prev => ({
          ...prev,
          [activeArticle.category]: false
        }));
      }
      setExpandedArticles(prev => ({
        ...prev,
        [activeArticle.id]: true
      }));
    }
  }, [activeArticle]);

  const toggleCategory = (catName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const toggleArticleExpand = (artId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedArticles(prev => ({
      ...prev,
      [artId]: !prev[artId]
    }));
  };

  const toggleAllCategories = () => {
    if (allCollapsed) {
      // Expand all
      setCollapsedCategories({});
      const allArtsExpanded: Record<string, boolean> = {};
      publishedArticles.forEach(a => { allArtsExpanded[a.id] = true; });
      setExpandedArticles(allArtsExpanded);
      setAllCollapsed(false);
    } else {
      // Collapse all
      const allCatsCollapsed: Record<string, boolean> = {};
      Object.keys(groupedCategories).forEach(cat => { allCatsCollapsed[cat] = true; });
      setCollapsedCategories(allCatsCollapsed);
      setExpandedArticles({});
      setAllCollapsed(true);
    }
  };

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const queryLower = searchQuery.toLowerCase();
    return publishedArticles.filter(art => 
      art.title.toLowerCase().includes(queryLower) ||
      art.description.toLowerCase().includes(queryLower) ||
      art.category.toLowerCase().includes(queryLower) ||
      art.subTitle?.toLowerCase().includes(queryLower) ||
      art.subSubTitle?.toLowerCase().includes(queryLower)
    );
  }, [searchQuery, publishedArticles]);

  // Flattened ordered list for Prev / Next navigation
  const flatArticles = useMemo(() => {
    const list: DocArticle[] = [];
    Object.keys(groupedCategories).forEach(cat => {
      list.push(...groupedCategories[cat]);
    });
    return list;
  }, [groupedCategories]);

  const currentIndex = useMemo(() => {
    return flatArticles.findIndex(a => a.id === activeArticle?.id || a.slug === activeArticle?.slug);
  }, [flatArticles, activeArticle]);

  const prevArticle = currentIndex > 0 ? flatArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < flatArticles.length - 1 ? flatArticles[currentIndex + 1] : null;

  // Table of Contents
  const tableOfContents = useMemo(() => {
    if (!activeArticle) return [];
    const toc: { id: string; text: string; level: number }[] = [];

    if (activeArticle.subTitle) {
      toc.push({ id: 'overview-subtitle', text: activeArticle.subTitle, level: 1 });
    }
    if (activeArticle.steps && activeArticle.steps.length > 0) {
      toc.push({ id: 'steps-section', text: 'Step-by-Step Instructions', level: 1 });
      activeArticle.steps.forEach((step, idx) => {
        toc.push({ id: `step-${idx}`, text: step.title, level: 2 });
      });
    }

    if (activeArticle.images && activeArticle.images.length > 0) {
      toc.push({ id: 'gallery-section', text: 'Visual Reference', level: 1 });
    }

    return toc;
  }, [activeArticle]);

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Theme-dependent class names
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-200 ${
      isDark 
        ? 'bg-[#090d16] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300' 
        : 'bg-slate-50 text-slate-800 selection:bg-cyan-500/30 selection:text-cyan-900'
    }`}>
      
      {/* Top Bar Navigation (Spacious & Clean Header) */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-6 lg:px-10 py-4 transition-colors ${
        isDark 
          ? 'bg-[#090d16]/95 border-slate-800/80' 
          : 'bg-white/95 border-slate-200/90 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`lg:hidden p-2.5 rounded-xl border transition ${
                isDark 
                  ? 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/50' 
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/docs" className="flex items-center space-x-3.5 group">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold transition ${
                isDark 
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 group-hover:bg-cyan-500/20' 
                  : 'bg-cyan-50 border-cyan-200 text-cyan-600 group-hover:bg-cyan-100'
              }`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className={`font-extrabold text-base tracking-tight transition ${
                    isDark ? 'text-white group-hover:text-cyan-400' : 'text-slate-900 group-hover:text-cyan-600'
                  }`}>
                    docs.tripbone.com
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    isDark ? 'bg-slate-800/90 text-cyan-400 border-slate-700' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                  }`}>
                    v2.5
                  </span>
                </div>
                <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Documentation & Knowledge Center
                </span>
              </div>
            </Link>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search guides, tutorials & APIs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs font-medium transition focus:outline-none ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-cyan-500/60' 
                  : 'bg-slate-100/80 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-cyan-500 focus:bg-white'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Clear
              </button>
            )}
          </div>

          {/* Controls: Theme Toggle & Admin Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              className={`p-2.5 rounded-xl border font-bold text-xs flex items-center space-x-2 transition ${
                isDark 
                  ? 'bg-slate-800/80 border-slate-700/60 text-amber-300 hover:bg-slate-800' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span className="hidden md:inline text-xs font-semibold">
                {isDark ? 'Light' : 'Dark'}
              </span>
            </button>

            {isSuperAdmin && onOpenManageModal && (
              <button
                onClick={onOpenManageModal}
                className={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center space-x-1.5 transition ${
                  isDark 
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20' 
                    : 'bg-cyan-500 text-white border-cyan-600 hover:bg-cyan-600 shadow-xs'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Manage Docs</span>
              </button>
            )}

            <Link
              to="/admin"
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition ${
                isDark 
                  ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Back office</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="mt-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500' 
                  : 'bg-slate-100 border-slate-200 text-slate-800 focus:border-cyan-500'
              }`}
            />
          </div>
        </div>
      </header>

      {/* Main Documentation Grid Layout */}
      <div className="max-w-7xl mx-auto flex min-h-[calc(100vh-73px)]">
        
        {/* Sidebar Index Navigation */}
        <aside className={`
          fixed lg:sticky top-[73px] z-30 w-68 h-[calc(100vh-73px)] border-r
          overflow-y-auto p-5 transition-transform duration-200 shrink-0
          ${isDark ? 'bg-[#090d16] lg:bg-transparent border-slate-800/60' : 'bg-white lg:bg-transparent border-slate-200'}
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {searchQuery && (
            <div className={`mb-5 border rounded-2xl p-3.5 space-y-2.5 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Search ({searchResults.length})</span>
                <button onClick={() => setSearchQuery('')} className="text-cyan-500 hover:underline">Clear</button>
              </div>
              {searchResults.length === 0 ? (
                <p className="text-xs text-slate-400">No matching docs.</p>
              ) : (
                searchResults.map(art => (
                  <button
                    key={art.id}
                    onClick={() => {
                      navigate(`/docs/${art.slug || art.id}`);
                      setSearchQuery('');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl transition group ${
                      isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-200/80'
                    }`}
                  >
                    <p className={`text-xs font-bold transition group-hover:text-cyan-500 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {art.title}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{art.category}</p>
                  </button>
                ))
              )}
            </div>
          )}

          <div className="space-y-4">
            {/* Global Expand / Collapse All Controls */}
            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-700/30">
              <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Categories ({Object.keys(groupedCategories).length})
              </span>
              <button
                onClick={toggleAllCategories}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition flex items-center space-x-1 ${
                  isDark 
                    ? 'bg-slate-800/80 text-cyan-400 border-slate-700/70 hover:bg-slate-700' 
                    : 'bg-slate-100 text-cyan-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>{allCollapsed ? 'Expand All' : 'Collapse All'}</span>
              </button>
            </div>

            {Object.keys(groupedCategories).map((category) => {
              const isCategoryCollapsed = Boolean(collapsedCategories[category]);
              const categoryArticles = groupedCategories[category];

              return (
                <div key={category} className="space-y-1">
                  {/* Category Header with Collapse/Expand Toggle */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className={`w-full text-left px-2 py-1.5 rounded-xl flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider transition ${
                      isDark 
                        ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' 
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      {isCategoryCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      )}
                      <span className="truncate">{category}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border shrink-0 ml-1 ${
                      isDark ? 'bg-slate-800/80 text-slate-400 border-slate-700/50' : 'bg-slate-200/70 text-slate-600 border-slate-300/60'
                    }`}>
                      {categoryArticles.length}
                    </span>
                  </button>

                  {/* Articles List when Category is Expanded */}
                  {!isCategoryCollapsed && (
                    <div className={`space-y-1 border-l ml-3 pl-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      {categoryArticles.map((art) => {
                        const isActive = activeArticle?.id === art.id || activeArticle?.slug === art.slug;
                        const hasSubHeadlines = Boolean(
                          art.subTitle?.trim() || 
                          art.subSubTitle?.trim() || 
                          (art.steps && art.steps.length > 0)
                        );
                        const isArticleExpanded = Boolean(expandedArticles[art.id] || (isActive && expandedArticles[art.id] !== false));

                        // Sub headlines list
                        const subItems: { id: string; text: string; type: 'subtitle' | 'subsubtitle' | 'step' }[] = [];
                        if (art.subTitle?.trim()) {
                          subItems.push({ id: 'overview-subtitle', text: art.subTitle, type: 'subtitle' });
                        }
                        if (art.subSubTitle?.trim()) {
                          subItems.push({ id: 'overview-subsubtitle', text: art.subSubTitle, type: 'subsubtitle' });
                        }
                        if (art.steps && art.steps.length > 0) {
                          art.steps.forEach((step, idx) => {
                            if (step.title?.trim()) {
                              subItems.push({ id: `step-${idx}`, text: step.title, type: 'step' });
                            }
                          });
                        }

                        return (
                          <div key={art.id} className="space-y-0.5">
                            {/* Article Row */}
                            <div className="flex items-center group">
                              {hasSubHeadlines ? (
                                <button
                                  onClick={(e) => toggleArticleExpand(art.id, e)}
                                  title={isArticleExpanded ? "Collapse sub headlines" : "Expand sub headlines"}
                                  className={`p-1 rounded-md transition mr-0.5 ${
                                    isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800' : 'text-slate-500 hover:text-cyan-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {isArticleExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-cyan-500 shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 shrink-0" />
                                  )}
                                </button>
                              ) : (
                                <span className="w-4 shrink-0" />
                              )}

                              <button
                                onClick={() => {
                                  navigate(`/docs/${art.slug || art.id}`);
                                  setIsSidebarOpen(false);
                                }}
                                className={`
                                  w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition flex items-center justify-between font-medium
                                  ${isActive 
                                    ? (isDark 
                                        ? 'bg-cyan-500/10 text-cyan-400 font-bold border-l-2 border-cyan-400 -ml-[9px] pl-2' 
                                        : 'bg-cyan-50 text-cyan-700 font-bold border-l-2 border-cyan-600 -ml-[9px] pl-2')
                                    : (isDark 
                                        ? 'text-slate-300 hover:text-white hover:bg-slate-800/40' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80')}
                                `}
                              >
                                <span className="truncate">{art.title}</span>
                                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-500 shrink-0 ml-1" />}
                              </button>
                            </div>

                            {/* Collapsible Sub Headlines list */}
                            {hasSubHeadlines && isArticleExpanded && (
                              <div className={`ml-4 pl-2 border-l space-y-0.5 ${
                                isDark ? 'border-cyan-500/20' : 'border-cyan-200'
                              }`}>
                                {subItems.map((sub, sIdx) => (
                                  <button
                                    key={sIdx}
                                    onClick={() => {
                                      if (!isActive) {
                                        navigate(`/docs/${art.slug || art.id}`);
                                      }
                                      setIsSidebarOpen(false);
                                      setTimeout(() => {
                                        const el = document.getElementById(sub.id);
                                        if (el) {
                                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }
                                      }, 100);
                                    }}
                                    className={`
                                      w-full text-left px-2 py-1 rounded-lg text-[11px] transition block truncate font-medium
                                      ${isDark 
                                        ? 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60' 
                                        : 'text-slate-500 hover:text-cyan-700 hover:bg-slate-100'}
                                    `}
                                  >
                                    <span className="opacity-60 mr-1 font-mono text-[9px]">
                                      {sub.type === 'step' ? '•' : '↳'}
                                    </span>
                                    {sub.text}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center Main Doc Reader */}
        <main className={`flex-1 min-w-0 p-6 sm:p-8 lg:p-12 border-r ${
          isDark ? 'border-slate-800/60' : 'border-slate-200'
        }`}>
          {activeArticle ? (
            <article className="max-w-3xl space-y-8">
              
              {/* Breadcrumb */}
              <div className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Link to="/docs" className="hover:text-cyan-500 transition">Docs</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{activeArticle.category}</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-cyan-500 font-semibold truncate">{activeArticle.title}</span>
              </div>

              {/* Title Section */}
              <div className={`space-y-4 pb-6 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                      isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                    }`}>
                      {activeArticle.category}
                    </span>
                    <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {activeArticle.title}
                    </h1>
                  </div>

                  <button
                    onClick={handleCopyShare}
                    title="Share Link"
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 shrink-0 transition ${
                      isDark 
                        ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/50' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
                    }`}
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
                  </button>
                </div>

                {activeArticle.subTitle && (
                  <h2 id="overview-subtitle" className={`text-base font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {activeArticle.subTitle}
                  </h2>
                )}

                {activeArticle.subSubTitle && (
                  <p id="overview-subsubtitle" className={`text-xs font-semibold uppercase tracking-wider text-cyan-500`}>
                    {activeArticle.subSubTitle}
                  </p>
                )}

                <p className={`text-sm sm:text-base leading-relaxed pt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {activeArticle.description}
                </p>
              </div>

              {/* HTML / Body Content */}
              {activeArticle.content && (
                <div 
                  className={`prose max-w-none text-sm sm:text-base leading-relaxed space-y-4 ${
                    isDark 
                      ? 'prose-invert prose-headings:text-white prose-p:text-slate-300 prose-a:text-cyan-400 prose-strong:text-white' 
                      : 'prose-slate prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-cyan-600 prose-strong:text-slate-900'
                  }`}
                  dangerouslySetInnerHTML={{ __html: activeArticle.content }}
                />
              )}

              {/* Step-by-Step Instructions */}
              {activeArticle.steps && activeArticle.steps.length > 0 && (
                <div id="steps-section" className="space-y-4 pt-4">
                  <div className={`flex items-center space-x-2 border-b pb-3 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                    <ListOrdered className="w-4 h-4 text-cyan-500" />
                    <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Step-by-Step Instructions
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {activeArticle.steps.map((step, idx) => (
                      <div 
                        key={idx} 
                        id={`step-${idx}`}
                        className={`border rounded-2xl p-5 space-y-2.5 transition ${
                          isDark 
                            ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700/80' 
                            : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`w-7 h-7 rounded-lg border font-extrabold text-xs flex items-center justify-center shrink-0 ${
                            isDark 
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                              : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                          }`}>
                            {idx + 1}
                          </span>
                          <h4 className={`font-bold text-sm sm:text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {step.title}
                          </h4>
                        </div>
                        <p className={`text-xs sm:text-sm leading-relaxed pl-10 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {step.desc}
                        </p>
                        {step.image && (
                          <div className="pl-10 pt-2">
                            <img 
                              src={step.image} 
                              alt={step.title} 
                              className="rounded-xl border max-h-80 object-cover shadow-md"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images Reference */}
              {activeArticle.images && activeArticle.images.length > 0 && (
                <div id="gallery-section" className="space-y-3 pt-4">
                  <div className={`flex items-center space-x-2 border-b pb-3 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                    <ImageIcon className="w-4 h-4 text-cyan-500" />
                    <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Visual Reference
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeArticle.images.map((imgUrl, i) => (
                      <a 
                        key={i} 
                        href={imgUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className={`group relative rounded-2xl overflow-hidden border transition block ${
                          isDark ? 'border-slate-800 bg-slate-900 hover:border-cyan-500/40' : 'border-slate-200 bg-slate-100 hover:border-cyan-500'
                        }`}
                      >
                        <img src={imgUrl} alt={`Ref ${i}`} className="w-full h-44 object-cover group-hover:scale-105 transition duration-300" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-white gap-1.5">
                          <ExternalLink className="w-4 h-4" /> Expand Image
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Pagination Buttons */}
              <div className={`pt-8 mt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isDark ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                {prevArticle ? (
                  <button
                    onClick={() => navigate(`/docs/${prevArticle.slug || prevArticle.id}`)}
                    className={`w-full sm:w-auto px-5 py-3.5 rounded-2xl border transition text-left group flex items-center space-x-3 ${
                      isDark 
                        ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-800' 
                        : 'bg-white hover:bg-slate-100 border-slate-200 shadow-xs'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Previous</span>
                      <p className={`text-xs font-semibold truncate max-w-[200px] group-hover:text-cyan-500 ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {prevArticle.title}
                      </p>
                    </div>
                  </button>
                ) : <div />}

                {nextArticle ? (
                  <button
                    onClick={() => navigate(`/docs/${nextArticle.slug || nextArticle.id}`)}
                    className={`w-full sm:w-auto px-5 py-3.5 rounded-2xl border transition text-right group flex items-center justify-end space-x-3 ml-auto ${
                      isDark 
                        ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-800' 
                        : 'bg-white hover:bg-slate-100 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Next</span>
                      <p className={`text-xs font-semibold truncate max-w-[200px] group-hover:text-cyan-500 ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {nextArticle.title}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition" />
                  </button>
                ) : <div />}
              </div>

            </article>
          ) : (
            <div className="text-center py-20 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold">No article selected</h3>
              <p className="text-xs text-slate-400">Select a guide from the sidebar index to view content.</p>
            </div>
          )}
        </main>

        {/* Right Table of Contents */}
        <aside className="hidden xl:block w-60 h-[calc(100vh-73px)] sticky top-[73px] p-6 overflow-y-auto shrink-0">
          <div className="space-y-5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-500" />
              On This Page
            </p>

            {tableOfContents.length > 0 ? (
              <nav className="space-y-1.5 text-xs">
                {tableOfContents.map((item, idx) => (
                  <a
                    key={idx}
                    href={`#${item.id}`}
                    className={`
                      block truncate transition hover:text-cyan-500 py-0.5
                      ${item.level === 1 
                        ? (isDark ? 'font-bold text-slate-200' : 'font-bold text-slate-800') 
                        : (isDark ? 'pl-3 text-slate-400' : 'pl-3 text-slate-600')}
                    `}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            ) : (
              <p className="text-xs text-slate-400 italic">No section headers</p>
            )}

            <div className={`pt-6 border-t space-y-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className={`p-4 rounded-2xl border space-y-2 ${
                isDark ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-cyan-50/80 border-cyan-200'
              }`}>
                <p className="text-xs font-bold text-cyan-500">Merchant Support</p>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Need help with setup or custom domain mapping? Contact system operations.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center space-x-1 text-xs font-bold text-cyan-500 hover:underline pt-1"
                >
                  <span>Contact Support</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
