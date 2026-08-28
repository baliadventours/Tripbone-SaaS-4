import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, ExternalLink, Globe, Layout, ArrowLeft, Layers, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function SaaSShowcase() {
  const [showcases, setShowcases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShowcases() {
      try {
        const snap = await getDocs(collection(db, 'clientShowcase'));
        const list: any[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        // Sort by weight desc, then fallback to createdAt
        list.sort((a, b) => {
          const wA = a.weight || 0;
          const wB = b.weight || 0;
          if (wA !== wB) return wB - wA;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        setShowcases(list);
      } catch (err) {
        console.error('Error loading showcases for directory page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadShowcases();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Navigation back */}
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Title / Header */}
        <div className="text-left max-w-3xl mb-16">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/50 text-indigo-600 text-xs font-black uppercase tracking-wider mb-4 animate-pulse">
            <Globe className="w-3.5 h-3.5" />
            <span>Customer Showcases</span>
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            Live Websites Built with Tripbone
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            See how top-tier local travel agencies, private excursion operators, and custom adventure designers run premium checkout flows and booking pipelines completely custom-branded with Tripbone.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm animate-pulse">
                <div className="h-48 bg-slate-100" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-5/6" />
                  <div className="h-3 bg-slate-200 rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        ) : showcases.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 bg-white border border-slate-200/60 rounded-3xl p-8 max-w-xl mx-auto">
            <Layout className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Showcase directory is empty</h3>
            <p className="text-sm text-slate-500 mb-6">Our superadmin is currently curating list showcases. Please check back shortly!</p>
            <Link to="/" className="inline-flex bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all">
              Return to Homepage
            </Link>
          </div>
        ) : (
          /* Grid showcase list */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {showcases.map((item, i) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                key={item.id}
                className="group flex flex-col justify-between rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white hover:shadow-xl transition-all duration-300"
              >
                <div>
                  {/* Browser-like Header Bar */}
                  <div className="w-full h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 justify-between z-10 relative">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100/80 px-4 py-0.5 rounded-md truncate max-w-[140px] md:max-w-[180px]">
                      {item.url ? item.url.replace(/^https?:\/\//i, '') : 'client-site'}
                    </span>
                    <div className="w-8" />
                  </div>

                  {/* Screenshot Container */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100 border-b border-slate-150">
                    {item.screenshotUrl ? (
                      <img
                        src={item.screenshotUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Layers className="w-10 h-10 stroke-1" />
                        <span className="text-[10px] font-mono mt-2 uppercase tracking-widest font-bold">Image Pending</span>
                      </div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="p-6 text-left">
                    <div className="flex items-center space-x-1.5 mb-2">
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {item.title}
                      </h3>
                      <CheckCircle2 className="w-4 h-4 text-[#05c46b] fill-[#05c46b]/10 flex-shrink-0" />
                    </div>
                    
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                      {item.description || 'Verified Tripbone travel partner workspace platform live site.'}
                    </p>
                  </div>
                </div>

                {/* Footer Link Button */}
                <div className="px-6 pb-6 pt-2 text-left">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center space-x-2 text-xs"
                  >
                    <span>Visit Live Site</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
