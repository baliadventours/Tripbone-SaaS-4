import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Bot, Globe, Navigation, Calendar, MessageCircle, Truck, 
  BriefcaseBusiness, Users, Zap, TrendingUp, CreditCard, Star, 
  LayoutTemplate, Smartphone, Palette, ShieldCheck, Server, DollarSign, 
  Network, Copy, Search, ArrowRight, BarChart3, Ticket, Share2, 
  Layers, Lock, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SaaSFeatures() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const featureCategories = [
    { id: 'all', label: 'All Capabilities' },
    { id: 'ai', label: 'AI Superpowers', icon: Sparkles, color: 'text-blue-500 bg-blue-50' },
    { id: 'design', label: 'Web Design & Builder', icon: LayoutTemplate, color: 'text-purple-500 bg-purple-50' },
    { id: 'sales', label: 'Sales & Booking Engine', icon: BriefcaseBusiness, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'operations', label: 'Operations & Automation', icon: Navigation, color: 'text-amber-500 bg-amber-50' },
    { id: 'infrastructure', label: 'Infrastructure & B2B', icon: ShieldCheck, color: 'text-slate-600 bg-slate-100' },
  ];

  const allFeatures = [
    // AI Category
    {
      category: 'ai',
      categoryLabel: 'AI Superpowers',
      title: '1-Click AI Tour Page Generator',
      desc: 'Type a brief prompt like "3-Day Ubud Cultural Tour" and AI instantly generates itineraries, inclusions, highlights, FAQ, and pricing options.',
      badge: 'AI Core',
      link: '/features/ai'
    },
    {
      category: 'ai',
      categoryLabel: 'AI Superpowers',
      title: 'AI Travel Planner for Guests',
      desc: 'Allow website visitors to design custom multi-day trips with AI on your storefront. Saved itineraries drop into your CRM as high-intent sales leads.',
      badge: 'Lead Gen',
      link: '/features/ai'
    },
    {
      category: 'ai',
      categoryLabel: 'AI Superpowers',
      title: 'AI Tour Proposal Generator',
      desc: 'Receive customer trip requests and generate tailor-made interactive tour proposals with pricing & deposit links in under 30 seconds.',
      badge: 'Sales Automation',
      link: '/features/ai'
    },
    {
      category: 'ai',
      categoryLabel: 'AI Superpowers',
      title: 'AI Chatbot & Order Tracker',
      desc: '24/7 AI chatbot handles guest questions, checks live departure calendar, and enables travelers to track booking status using their reference code.',
      badge: '24/7 Support',
      link: '/features/ai'
    },

    // Design & Builder Category
    {
      category: 'design',
      categoryLabel: 'Web Design & Builder',
      title: '2 Minutes to Go Live',
      desc: 'Instant workspace provisioning with pre-loaded tours, demo media, and localized currency settings so tour operators launch on day one.',
      badge: 'Speed',
      link: '/features/design'
    },
    {
      category: 'design',
      categoryLabel: 'Web Design & Builder',
      title: '10 Swiss UI Design Presets',
      desc: 'Choose from 10 professionally curated typography and color theme presets designed for trust, clarity, and rapid conversion.',
      badge: 'Branding',
      link: '/features/design'
    },
    {
      category: 'design',
      categoryLabel: 'Web Design & Builder',
      title: '8 Dynamic Hero Banner Styles',
      desc: 'Pick from full-screen video, multi-image gallery, interactive search widget, or minimal minimalist hero layouts for your homepage.',
      badge: 'Customization',
      link: '/features/design'
    },
    {
      category: 'design',
      categoryLabel: 'Web Design & Builder',
      title: 'Advanced Tour Page Section Editor',
      desc: 'Duplicate, clone, reorder, or edit any section on your tour detail page with instant preview and modular component controls.',
      badge: 'Flexibility',
      link: '/features/design'
    },
    {
      category: 'design',
      categoryLabel: 'Web Design & Builder',
      title: 'Image Compression & Gallery Optimization',
      desc: 'Automated client-side and server-side image compression converts uploads into ultra-fast WebP format with crisp retina quality.',
      badge: 'Performance',
      link: '/features/design'
    },
    {
      category: 'design',
      categoryLabel: 'Web Design & Builder',
      title: 'Custom Pages & Navigation Menus',
      desc: 'Add custom landing pages, policy documents, customized header navigation menus, and video hero section embeds with zero code.',
      badge: 'CMS',
      link: '/features/design'
    },

    // Sales & Booking Category
    {
      category: 'sales',
      categoryLabel: 'Sales & Booking Engine',
      title: 'Dynamic Tiered & Multi-Package Pricing',
      desc: 'Offer Standard, Deluxe, and VIP packages per tour. Configure Adult, Child, and Infant pricing tiers with seasonal surcharges.',
      badge: 'Yield Mgmt',
      link: '/features/sales'
    },
    {
      category: 'sales',
      categoryLabel: 'Sales & Booking Engine',
      title: 'Integrated Payment Gateways',
      desc: 'Accept global payments with Stripe, PayPal, manual bank wire transfers, or cash on arrival with zero platform transaction fees.',
      badge: 'Payments',
      link: '/features/sales'
    },
    {
      category: 'sales',
      categoryLabel: 'Sales & Booking Engine',
      title: 'Multi-Currency Conversion Engine',
      desc: 'Display prices in USD, EUR, AUD, IDR, GBP, and more with real-time exchange rates so international tourists book in their home currency.',
      badge: 'Global',
      link: '/features/sales'
    },
    {
      category: 'sales',
      categoryLabel: 'Sales & Booking Engine',
      title: 'Integrated TripAdvisor, Google & Airbnb Reviews',
      desc: 'Import and highlight verified 5-star reviews from TripAdvisor, Google Business, and Airbnb directly on your tour checkout pages.',
      badge: 'Social Proof',
      link: '/features/sales'
    },
    {
      category: 'sales',
      categoryLabel: 'Sales & Booking Engine',
      title: 'Google Analytics & Built-in Analytics',
      desc: 'Track visitor traffic, conversion funnels, top performing tours, and total revenue with native privacy-first charts and Google Analytics 4.',
      badge: 'Data',
      link: '/features/sales'
    },

    // Operations Category
    {
      category: 'operations',
      categoryLabel: 'Operations & Automation',
      title: 'Advanced Dispatch Booking Management',
      desc: 'Manage thousands of departures with Calendar, Timeline, and Daily List views. Instant filters, manual booking creation, and e-ticket generation.',
      badge: 'Operations',
      link: '/features/operations'
    },
    {
      category: 'operations',
      categoryLabel: 'Operations & Automation',
      title: 'WhatsApp & Email Automated Briefings',
      desc: 'Dispatch driver assignments, pickup confirmations, and e-vouchers directly to guests and tour guides via automated WhatsApp messages.',
      badge: 'Automation',
      link: '/features/operations'
    },
    {
      category: 'operations',
      categoryLabel: 'Operations & Automation',
      title: 'Integrated CRM & Ticket Support System',
      desc: 'Manage customer support requests, log contact interactions, track lead stages, and manage open support tickets directly in your admin suite.',
      badge: 'CRM',
      link: '/features/operations'
    },

    // Infrastructure & B2B Category
    {
      category: 'infrastructure',
      categoryLabel: 'Infrastructure & B2B',
      title: 'Multi-Supplier Portal & Cost Tracking',
      desc: 'Assign external tour suppliers, calculate vendor cost breakdowns, and give suppliers isolated portals to manage their schedules.',
      badge: 'B2B Network',
      link: '/features/infrastructure'
    },
    {
      category: 'infrastructure',
      categoryLabel: 'Infrastructure & B2B',
      title: 'Multi-Agent Portal & Commission Engine',
      desc: 'Provide hotel concierges, travel agents, and affiliates dedicated portals with custom commission tiers and discount vouchers.',
      badge: 'Agent Network',
      link: '/features/infrastructure'
    },
    {
      category: 'infrastructure',
      categoryLabel: 'Infrastructure & B2B',
      title: 'SEO Friendly & Schema.org Architecture',
      desc: 'Automatic XML sitemaps, fast page load speeds, clean semantic code, and Schema.org Tour JSON-LD structured data for Google rankings.',
      badge: 'SEO',
      link: '/features/infrastructure'
    }
  ];

  const filteredFeatures = allFeatures.filter(f => {
    const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pt-24 pb-24 bg-slate-50 min-h-screen">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-xs font-bold text-brand mb-6 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Complete Platform Feature Directory</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
            Everything Tour Operators Need to Scale.
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            From 1-click AI tour generation to WhatsApp dispatch automation and multi-agent commission portals. Explore all features powered by Tripbone.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-12 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search features (e.g. WhatsApp, AI, Pricing, Reviews)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {featureCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeCategory === cat.id 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.icon && <cat.icon className="w-3.5 h-3.5" />}
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-6">
        {filteredFeatures.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No matching features found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search term or filter category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all duration-300 group relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                      {feature.badge}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{feature.categoryLabel}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {feature.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Included in All Plans
                  </span>
                  <Link 
                    to={feature.link}
                    className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Deep Dive <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Five Module Navigation Banners */}
      <div className="max-w-7xl mx-auto px-6 mt-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-slate-900">Explore Feature Modules</h2>
          <p className="text-sm text-slate-500">Click any core pillar for deep technical breakdown & video walkthroughs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Link to="/features/ai" className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition text-center group">
            <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-slate-900 text-sm mb-1">AI Superpowers</h4>
            <p className="text-xs text-slate-500">Generator, Planner, Proposal</p>
          </Link>

          <Link to="/features/design" className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-purple-500 hover:shadow-md transition text-center group">
            <LayoutTemplate className="w-8 h-8 text-purple-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-slate-900 text-sm mb-1">Web Design</h4>
            <p className="text-xs text-slate-500">10 Presets, Mobile First</p>
          </Link>

          <Link to="/features/sales" className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition text-center group">
            <BriefcaseBusiness className="w-8 h-8 text-emerald-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-slate-900 text-sm mb-1">Sales Engine</h4>
            <p className="text-xs text-slate-500">Stripe, Reviews, Multi-Currency</p>
          </Link>

          <Link to="/features/operations" className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition text-center group">
            <Navigation className="w-8 h-8 text-amber-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-slate-900 text-sm mb-1">Operations</h4>
            <p className="text-xs text-slate-500">WhatsApp, Dispatch, CRM</p>
          </Link>

          <Link to="/features/infrastructure" className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-800 hover:shadow-md transition text-center group">
            <ShieldCheck className="w-8 h-8 text-slate-700 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-slate-900 text-sm mb-1">Infrastructure</h4>
            <p className="text-xs text-slate-500">Agents, Suppliers, SEO</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
