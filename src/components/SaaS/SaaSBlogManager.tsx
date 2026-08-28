import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, addDoc, updateDoc, doc, deleteDoc, onSnapshot, serverTimestamp } from '../../lib/firebase';
import { uploadImage } from '../../lib/imgbb';
import { BlogPost } from '../../types';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  FileText, 
  Check, 
  X, 
  Loader2, 
  Globe, 
  Wand2, 
  Image as ImageIcon, 
  Tag as TagIcon, 
  Calendar, 
  User, 
  Clock, 
  ArrowLeft,
  Share2,
  CheckCircle2,
  AlertCircle,
  Upload,
  ImagePlus
} from 'lucide-react';

interface SaaSBlogManagerProps {
  isDarkMode?: boolean;
}

export default function SaaSBlogManager({ isDarkMode = false }: SaaSBlogManagerProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  
  // View mode: 'list' | 'editor'
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);

  // AI Generator state
  const [aiTopic, setAiTopic] = useState('');
  const [aiAudience, setAiAudience] = useState('Tour Operators & Travel Agencies');
  const [aiTone, setAiTone] = useState('Engaging, Professional & Authoritative');
  const [aiLanguage, setAiLanguage] = useState('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccess, setAiSuccess] = useState('');

  // Save loading state & Image upload state
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingInline, setIsUploadingInline] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const url = await uploadImage(file);
      setEditingPost(prev => prev ? { ...prev, coverImage: url } : null);
    } catch (err: any) {
      alert("Failed to upload cover image: " + (err.message || 'Unknown error'));
    } finally {
      setIsUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleUploadInlineImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingInline(true);
    try {
      const url = await uploadImage(file);
      const imageHtml = `\n<figure className="my-6">\n  <img src="${url}" alt="Article figure" className="w-full rounded-2xl object-cover shadow-md" />\n</figure>\n`;
      setEditingPost(prev => prev ? { ...prev, content: (prev.content || '') + imageHtml } : null);
    } catch (err: any) {
      alert("Failed to upload inline image: " + (err.message || 'Unknown error'));
    } finally {
      setIsUploadingInline(false);
      e.target.value = '';
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || !editingPost) return;
    const newTags = Array.from(new Set([...(editingPost.tags || []), tagInput.trim()]));
    setEditingPost({ ...editingPost, tags: newTags });
    setTagInput('');
  };

  const handleRemoveTag = (indexToRemove: number) => {
    if (!editingPost) return;
    const updated = (editingPost.tags || []).filter((_, i) => i !== indexToRemove);
    setEditingPost({ ...editingPost, tags: updated });
  };

  // Fetch blog posts from Firestore in real-time
  useEffect(() => {
    const postsRef = collection(db, 'saas_posts');
    const unsubscribe = onSnapshot(postsRef, async (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed initial B2B Tripbone SaaS blog posts
        console.log("[SaaSBlogManager]: Seeding initial Tripbone SaaS articles into saas_posts...");
        const initialSaaSPosts = [
          {
            title: "FareHarbor Alternatives 2026: Why Modern Tour Operators Are Switching to Tripbone",
            slug: "fareharbor-alternatives-2026-why-tour-operators-switch-to-tripbone",
            excerpt: "Discover why tour operators and activity providers are moving away from high-commission legacy booking engines to Tripbone's zero-commission, white-label booking platform.",
            category: "Comparisons & Software",
            content: `
              <h2>Looking for the Best FareHarbor Alternative in 2026?</h2>
              <p>For years, FareHarbor has been a dominant name in tour operator booking software. However, as tour agencies expand their direct booking channels and demand higher margins, many are seeking modern, transparent alternatives.</p>
              
              <h3>Why Tour Operators Are Leaving Legacy Booking Engines</h3>
              <ul>
                <li><strong>High Passenger Booking Fees:</strong> Legacy software often tacks on 6% to 9%+ convenience fees on customer checkouts, driving up cart abandonment.</li>
                <li><strong>Lack of Brand Identity:</strong> Heavy co-branding reduces customer trust in the operator's actual brand.</li>
                <li><strong>Complex Pricing Tier Locks:</strong> Crucial features like multi-currency support, custom domains, or automated WhatsApp reminders require expensive enterprise upgrades.</li>
              </ul>

              <h3>Why Tripbone is Built for Operator Freedom</h3>
              <p>Tripbone was engineered specifically to solve these headaches. With zero booking fees on standard plans, instant custom domain integration, multi-currency display, and automated itinerary generation, Tripbone gives you complete ownership over your brand and direct revenue.</p>

              <blockquote>"Switching to Tripbone allowed our agency to capture 100% of our direct booking revenue without forcing forced customer fees on our checkout page."</blockquote>

              <h3>Key Features to Look For:</h3>
              <ul>
                <li>White-label custom domains & branding</li>
                <li>Multi-currency auto-conversion (USD, EUR, AUD, IDR, JPY)</li>
                <li>Instant WhatsApp & Email booking confirmations</li>
                <li>AI-powered tour itinerary & blog generators</li>
              </ul>
            `,
            coverImage: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80",
            author: "Tripbone Editorial",
            readTime: "6 min read",
            status: "published",
            tags: ["FareHarbor Alternative", "Tour Software", "Direct Bookings", "SaaS"]
          },
          {
            title: "Why Tripbone? The Modern All-in-One Booking & Reservation System",
            slug: "why-tripbone-all-in-one-tour-booking-system",
            excerpt: "Explore how Tripbone empowers tour operators with instant multi-currency booking engines, white-label tenant subdomains, automated PDF vouchers, and built-in AI tools.",
            category: "Platform Guide",
            content: `
              <h2>Why Choose Tripbone for Your Tour Business?</h2>
              <p>Tripbone is the ultimate multi-tenant SaaS operating system designed specifically for tour operators, travel agencies, and destination management companies (DMCs).</p>

              <h3>1. Fully White-Labeled Tenant Websites</h3>
              <p>Every tenant gets a complete, high-converting agency website with customizable header navigation, custom domain support, and custom brand colors.</p>

              <h3>2. Smart Dynamic Pricing & Currency Support</h3>
              <p>Accept payments and display rates seamlessly in major global currencies while retaining live exchange rate synchronization.</p>

              <h3>3. Built-In AI Content & Itinerary Generator</h3>
              <p>Generate SEO-friendly blog articles, tour descriptions, and customer day-by-day itineraries instantly using integrated Gemini 3.5 Flash AI technology.</p>
            `,
            coverImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
            author: "Tripbone Product Team",
            readTime: "5 min read",
            status: "published",
            tags: ["Why Tripbone", "Booking Engine", "Tour Operator Tech"]
          },
          {
            title: "7 Critical Tips for Choosing the Best Tour Booking System in 2026",
            slug: "7-tips-choosing-best-tour-booking-system",
            excerpt: "Key criteria every tour operator, DMC, and experience provider must evaluate before selecting a reservation and booking platform.",
            category: "Operator Tips",
            content: `
              <h2>How to Select the Right Booking Engine for Your Business</h2>
              <p>Selecting tour reservation software is one of the most impactful decisions for a travel company. Here are 7 essential criteria to evaluate before signing up:</p>
              
              <ol>
                <li><strong>Transparent Fee Structure:</strong> Ensure no surprise customer fees or mandatory per-ticket cuts.</li>
                <li><strong>Mobile Checkout Experience:</strong> Over 70% of tour bookings happen on mobile devices.</li>
                <li><strong>WhatsApp & SMS Messaging Integration:</strong> Direct guest communication reduces no-shows significantly.</li>
                <li><strong>Multi-Currency & Regional Localization:</strong> Allow guests from Europe, US, Australia, and Asia to view prices in their native currency.</li>
                <li><strong>SEO & Custom Domain Control:</strong> Your booking engine must support custom domains to preserve SEO domain authority.</li>
                <li><strong>Instant Manifest & Inventory Management:</strong> Prevent double-bookings across guide schedules.</li>
                <li><strong>AI Automation:</strong> Automated review requests, itinerary generators, and customer support chatbots save hours weekly.</li>
              </ol>
            `,
            coverImage: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80",
            author: "Tripbone Strategy",
            readTime: "7 min read",
            status: "published",
            tags: ["Operator Tips", "Booking System Guide", "Travel Tech"]
          },
          {
            title: "Direct Bookings vs OTAs: How Tour Operators Save 20%+ in Commission Fees",
            slug: "direct-bookings-vs-otas-tour-operator-guide",
            excerpt: "Learn how to build a high-converting direct booking website for your tours and reduce reliance on expensive third-party online travel agencies.",
            category: "Growth Strategies",
            content: `
              <h2>Maximizing Direct Tour Revenue</h2>
              <p>While Online Travel Agencies (OTAs) provide valuable initial visibility, taking 20% to 30% commission per booking severely impacts operator margins. Building your direct booking ecosystem is the most reliable way to increase long-term profitability.</p>

              <h3>Key Direct Booking Strategies:</h3>
              <ul>
                <li>Optimize website page speed and mobile booking steps.</li>
                <li>Provide instant live chat and WhatsApp support for hesitant visitors.</li>
                <li>Offer exclusive perks for direct bookers, such as flexible cancellation or complimentary upgrades.</li>
              </ul>
            `,
            coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
            author: "Tripbone Growth",
            readTime: "5 min read",
            status: "published",
            tags: ["Direct Bookings", "OTA Commissions", "Growth Strategies"]
          }
        ];

        for (const post of initialSaaSPosts) {
          await addDoc(collection(db, 'saas_posts'), {
            ...post,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        return;
      }

      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BlogPost));

      // Sort latest first
      postsData.sort((a, b) => {
        const getMillis = (val: any) => {
          if (!val) return 0;
          if (typeof val.toMillis === 'function') return val.toMillis();
          if (typeof val.seconds === 'number') return val.seconds * 1000;
          if (val instanceof Date) return val.getTime();
          return new Date(val).getTime() || 0;
        };
        return getMillis(b.createdAt) - getMillis(a.createdAt);
      });

      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("[SaaSBlogManager Snapshot Error]:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const categories = ['All', ...new Set(posts.map(p => p.category).filter(Boolean))];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && (post.status === 'published' || post.status === 'active')) ||
      (statusFilter === 'draft' && post.status === 'draft');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateNew = () => {
    setEditingPost({
      title: '',
      slug: '',
      excerpt: '',
      category: 'Industry Insights',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      author: 'Tripbone Editorial',
      readTime: '5 min read',
      status: 'published',
      tags: ['SaaS', 'Travel Tech', 'Automation']
    });
    setAiTopic('');
    setAiError('');
    setAiSuccess('');
    setViewMode('editor');
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost({ ...post });
    setAiError('');
    setAiSuccess('');
    setViewMode('editor');
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'saas_posts', id));
    } catch (err) {
      console.error("[Delete Post Error]:", err);
      alert("Failed to delete post. Please try again.");
    }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' || post.status === 'active' ? 'draft' : 'published';
    try {
      await updateDoc(doc(db, 'saas_posts', post.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("[Toggle Status Error]:", err);
    }
  };

  const handleGenerateAIPost = async () => {
    if (!aiTopic.trim()) {
      setAiError("Please enter a blog topic or keyword prompt.");
      return;
    }

    setIsGenerating(true);
    setAiError('');
    setAiSuccess('');

    try {
      const response = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          audience: aiAudience,
          tone: aiTone,
          language: aiLanguage,
          isSaaS: true
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to generate blog article");
      }

      const coverImg = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80`;

      setEditingPost({
        title: data.title || aiTopic,
        slug: data.slug || aiTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        excerpt: data.excerpt || '',
        category: data.category || 'Comparisons & Software',
        content: data.content || '<p>Article content...</p>',
        author: data.author || 'Tripbone Editorial',
        readTime: data.readTime || '5 min read',
        coverImage: coverImg,
        status: 'published',
        tags: data.seoKeywords || ['Tripbone SaaS', 'Tour Operators', 'Booking System']
      });

      setAiSuccess("AI blog article generated successfully! Review and edit below.");
    } catch (err: any) {
      console.error("[AI Generate Error]:", err);
      setAiError(err.message || "AI generation failed. Please check your network and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePost = async () => {
    if (!editingPost?.title?.trim()) {
      alert("Article title is required.");
      return;
    }

    setIsSaving(true);

    try {
      const slugVal = editingPost.slug || editingPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const postData = {
        title: editingPost.title.trim(),
        slug: slugVal.trim(),
        excerpt: editingPost.excerpt || '',
        category: editingPost.category || 'General',
        content: editingPost.content || '',
        coverImage: editingPost.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
        author: editingPost.author || 'Tripbone Team',
        readTime: editingPost.readTime || '5 min read',
        status: editingPost.status || 'published',
        tags: editingPost.tags || [],
        updatedAt: serverTimestamp()
      };

      if (editingPost.id) {
        // Update existing post
        await updateDoc(doc(db, 'saas_posts', editingPost.id), postData);
      } else {
        // Add new post
        await addDoc(collection(db, 'saas_posts'), {
          ...postData,
          createdAt: serverTimestamp()
        });
      }

      setViewMode('list');
      setEditingPost(null);
    } catch (err: any) {
      console.error("[Save Post Error]:", err);
      alert("Failed to save post: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            <span>Blog & Updates Manager</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Publish SEO-optimized articles, platform updates, and news with built-in AI generation.
          </p>
        </div>

        {viewMode === 'list' ? (
          <button
            onClick={handleCreateNew}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Blog Post</span>
          </button>
        ) : (
          <button
            onClick={() => setViewMode('list')}
            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Blog List</span>
          </button>
        )}
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search articles by title, excerpt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}
              />
            </div>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`py-2 px-3 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>Category: {cat}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`py-2 px-3 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="all">Status: All Posts</option>
              <option value="published">Status: Published Only</option>
              <option value="draft">Status: Drafts Only</option>
            </select>
          </div>

          {/* Table Container */}
          <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-gray-200 bg-white shadow-xs'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-mono uppercase tracking-wider ${
                    isDarkMode ? 'border-slate-800 bg-slate-950/60 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}>
                    <th className="py-3.5 px-4">Article</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Author</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-gray-100'}`}>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Loading articles...</p>
                      </td>
                    </tr>
                  ) : filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-bold">No blog articles found</p>
                        <p className="text-xs text-gray-500 mt-1">Create your first blog post or generate one with AI.</p>
                        <button
                          onClick={handleCreateNew}
                          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate Article with AI</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post) => {
                      const isPub = post.status === 'published' || post.status === 'active';
                      return (
                        <tr key={post.id} className={`text-xs transition-colors ${
                          isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'
                        }`}>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={post.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=200&q=80'}
                                alt={post.title}
                                className="w-12 h-10 rounded-lg object-cover bg-slate-200 dark:bg-slate-800 shrink-0 border border-gray-200 dark:border-slate-700"
                              />
                              <div>
                                <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 max-w-xs">{post.title}</h4>
                                <p className="text-[10px] text-gray-500 font-mono line-clamp-1 max-w-xs">/blog/{post.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              {post.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-300">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="font-medium text-[11px]">{post.author || 'Editorial'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleStatus(post)}
                              title="Click to toggle status"
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-transform hover:scale-105 cursor-pointer ${
                                isPub 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isPub ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span>{isPub ? 'Published' : 'Draft'}</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <a
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View on Live Site"
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDarkMode ? 'hover:bg-slate-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() => handleEditPost(post)}
                                title="Edit Article"
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDarkMode ? 'hover:bg-indigo-900/50 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'
                                }`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                title="Delete Article"
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDarkMode ? 'hover:bg-rose-900/50 text-rose-400' : 'hover:bg-rose-50 text-rose-600'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EDITOR VIEW */}
      {viewMode === 'editor' && editingPost && (
        <div className="space-y-8 max-w-5xl mx-auto">
          
          {/* AI Generator Box */}
          <div className={`p-6 rounded-2xl border relative overflow-hidden transition-all ${
            isDarkMode ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/20 border-indigo-500/30' : 'bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 border-indigo-200'
          }`}>
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">AI Content Generator</h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono">
                Gemini 3.5 Flash
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Enter any topic or prompt, and Gemini AI will generate a complete, SEO-friendly article formatted in HTML.
            </p>

            {aiError && (
              <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div className="flex-1">
                    <p className="font-bold">{aiError}</p>
                    {aiError.toLowerCase().includes('api key') && (
                      <div className="mt-2.5 pt-2.5 border-t border-rose-500/20 text-[11px] text-gray-700 dark:text-gray-300 space-y-1.5">
                        <p className="font-extrabold text-rose-700 dark:text-rose-300">How to resolve this issue:</p>
                        <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                          <li>Generate a new free Gemini API key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800">Google AI Studio (aistudio.google.com)</a>.</li>
                          <li>Go to <strong>Admin -&gt; Settings -&gt; Communication Settings</strong> and paste the key into <strong>Gemini API Key</strong>, OR update your <strong>GEMINI_API_KEY</strong> in Vercel Environment Variables.</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {aiSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{aiSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Topic or Prompt
                </label>
                <input
                  type="text"
                  placeholder="e.g. FareHarbor Alternatives 2026, Why Tripbone..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className={`w-full px-3.5 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
                {/* Preset Topic Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-gray-400">Presets:</span>
                  {[
                    "FareHarbor Alternatives 2026",
                    "Why Tripbone? Tour Booking Software",
                    "Tips for Choosing Best Tour Booking System",
                    "Direct Bookings vs OTAs for Tour Operators"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAiTopic(preset)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        aiTopic === preset 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : isDarkMode 
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Target Audience
                </label>
                <select
                  value={aiAudience}
                  onChange={(e) => setAiAudience(e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="Tour Operators & Travel Agencies">Tour Operators & Agencies</option>
                  <option value="Travelers & Adventure Enthusiasts">Travelers & Adventurers</option>
                  <option value="B2B SaaS & Tech Decision Makers">B2B SaaS & Tech Leaders</option>
                  <option value="Hospitality & Local Guides">Hospitality & Local Guides</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Tone
                </label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="Engaging, Professional & Authoritative">Engaging & Professional</option>
                  <option value="Inspiring & Storytelling">Inspiring Storytelling</option>
                  <option value="Educational & How-To Guide">Educational How-To</option>
                  <option value="Casual & Conversational">Casual Conversational</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateAIPost}
              disabled={isGenerating}
              className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini AI is crafting your article...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Complete Article with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Main Article Fields Form */}
          <div className={`p-6 rounded-2xl border space-y-6 ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-gray-200 shadow-xs'
          }`}>
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-500 border-b pb-3 dark:border-slate-800">
              {editingPost.id ? 'Edit Article Details' : 'New Article Details'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Article Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10 Proven Strategies to Scale Your Tour Operator Business"
                  value={editingPost.title || ''}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const autoSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    setEditingPost({ ...editingPost, title: newTitle, slug: editingPost.id ? editingPost.slug : autoSlug });
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              {/* URL Slug */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  URL Slug
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400">/blog/</span>
                  <input
                    type="text"
                    value={editingPost.slug || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                    className={`w-full pl-16 pr-3.5 py-2 text-xs font-mono rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Comparisons & Software, Operator Guide..."
                    value={editingPost.category || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                    className={`flex-1 px-3.5 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                  <select
                    onChange={(e) => {
                      if (e.target.value) setEditingPost({ ...editingPost, category: e.target.value });
                    }}
                    value=""
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="" disabled>Presets...</option>
                    <option value="Comparisons & Software">Comparisons & Software</option>
                    <option value="Platform Guide">Platform Guide</option>
                    <option value="Operator Tips">Operator Tips</option>
                    <option value="Growth Strategies">Growth Strategies</option>
                    <option value="Industry Insights">Industry Insights</option>
                  </select>
                </div>
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Author Name
                </label>
                <input
                  type="text"
                  value={editingPost.author || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                  className={`w-full px-3.5 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              {/* Reading Time */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Reading Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 min read"
                  value={editingPost.readTime || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, readTime: e.target.value })}
                  className={`w-full px-3.5 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              {/* Cover Image URL & File Upload */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Cover Image
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editingPost.coverImage || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, coverImage: e.target.value })}
                    className={`flex-1 px-3.5 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                  
                  <label className={`px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer inline-flex items-center justify-center space-x-2 shrink-0 transition-all ${
                    isUploadingCover
                      ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 border-gray-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
                  }`}>
                    {isUploadingCover ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading Image...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Cover Image</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadCover}
                      className="hidden"
                      disabled={isUploadingCover}
                    />
                  </label>

                  {editingPost.coverImage && (
                    <img
                      src={editingPost.coverImage}
                      alt="Cover preview"
                      className="w-12 h-9 rounded-lg object-cover border border-gray-200 dark:border-slate-800 shrink-0"
                    />
                  )}
                </div>
              </div>

              {/* Excerpt */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Excerpt / Short Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="Summarize the core takeaways of this article..."
                  value={editingPost.excerpt || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                  className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              {/* Tags Editor */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Article Tags & Keywords
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {(editingPost.tags || []).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                    >
                      <TagIcon className="w-3 h-3" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(idx)}
                        className="hover:text-rose-500 transition-colors ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter new tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className={`flex-1 px-3.5 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
                  >
                    Add Tag
                  </button>
                </div>
              </div>

              {/* HTML Content Body + Inline Image Upload Tool */}
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Article Body Content (HTML / Rich Text)
                  </label>

                  <label className={`px-3 py-1.5 border rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center space-x-1.5 transition-all ${
                    isUploadingInline
                      ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-gray-300'
                  }`}>
                    {isUploadingInline ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Inserting Image...</span>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Insert Image into Post</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadInlineImage}
                      className="hidden"
                      disabled={isUploadingInline}
                    />
                  </label>
                </div>

                <textarea
                  rows={14}
                  placeholder="<h2>Subheading</h2><p>Article body text...</p>"
                  value={editingPost.content || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className={`w-full px-3.5 py-3 text-xs font-mono rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              {/* Publication Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Publication Status
                </label>
                <select
                  value={editingPost.status || 'published'}
                  onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as any })}
                  className={`w-full px-3.5 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="published">Published (Live on Website)</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePost}
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save & Publish Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
