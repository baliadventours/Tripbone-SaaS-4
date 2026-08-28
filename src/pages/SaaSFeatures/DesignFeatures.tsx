import React from 'react';
import { LayoutTemplate, Smartphone, MonitorSmartphone, Palette, CheckCircle2, Zap, Copy, Video, Image as ImageIcon, Layers, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DesignFeatures() {
  return (
    <div className="pt-20 bg-white">
      {/* Hero Section */}
      <section className="py-24 px-6 relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-purple-300 mb-8 backdrop-blur-md">
            <LayoutTemplate className="w-4 h-4" />
            <span>Web Design Engine</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            Unlimited Design Possibilities.
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12">
            Launch in 2 minutes with 10 design presets, 8 hero banner styles, modular section builders, and mobile-first responsiveness.
          </p>
          <img 
            src="https://i.ibb.co.com/N6fXww79/image.png" 
            alt="Design Builder" 
            className="rounded-[2rem] border border-white/10 shadow-2xl mx-auto max-w-5xl w-full object-cover"
          />
        </div>
      </section>

      {/* Feature 1: 2 Minutes to Go Live & 10 Design Presets */}
      <section className="py-24 px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="font-mono text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">[ INSTANT DEPLOYMENT ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">2 Minutes to Go Live & 10 Design Presets</h2>
            <p className="text-lg text-slate-600 mb-8">
              No web designers or developers needed. Get a complete, fully functioning tour operator storefront in under 2 minutes. Pick from 10 Swiss UI design presets to match your company's aesthetic.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Zap className="w-5 h-5 text-purple-500" /> Pre-configured out-of-the-box with sample tours & currency settings</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Palette className="w-5 h-5 text-purple-500" /> 10 Typography & Color presets: Swiss Minimal, Dark Modern, Emerald Coast, etc.</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Instant brand logo, accent color, and custom domain matching</li>
            </ul>
          </motion.div>
          <div className="relative">
            <img src="https://i.ibb.co.com/FkV496k6/image.png" alt="10 Design Presets" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full" />
          </div>
        </div>
      </section>

      {/* Feature 2: 8 Hero Banner Presets & Custom Media */}
      <section className="py-24 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <img src="https://i.ibb.co.com/VYwm826K/image.png" alt="Hero Banner Presets" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full object-cover" />
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
            <div className="font-mono text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">[ HERO BANNER ENGINE ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">8 Hero Banner Presets & Custom Media</h2>
            <p className="text-lg text-slate-600 mb-8">
              Make an unforgettable first impression. Choose from 8 distinct homepage hero banner layouts featuring video backgrounds, multi-image galleries, search bars, or interactive destination carousels.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Video className="w-5 h-5 text-purple-500 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900">Video & Image Backgrounds</h4>
                  <p className="text-sm text-slate-500">Embed YouTube/Vimeo video loops or high-res background photography.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sliders className="w-5 h-5 text-purple-500 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900">Custom Navigation Menus & Pages</h4>
                  <p className="text-sm text-slate-500">Build custom navigation links, policy pages, destination guides, and landing pages.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature 3: Advanced Tour Design System */}
      <section className="py-24 px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="font-mono text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">[ MODULAR SECTION BUILDER ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">Advanced Tour Design System</h2>
            <p className="text-lg text-slate-600 mb-8">
              Customize every detail of your tour product pages. Easily duplicate, clone, copy, and edit any section of your tour layout including FAQs, daily timeline blocks, gallery grids, and inclusion badges.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Copy className="w-5 h-5 text-purple-500" /> 1-Click Duplicate/Clone: Replicate successful tour structures instantly</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Layers className="w-5 h-5 text-purple-500" /> Section Order Control: Drag and adjust layout hierarchy easily</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><ImageIcon className="w-5 h-5 text-purple-500" /> Automated Image Compression: Fast WebP conversion for maximum speed</li>
            </ul>
          </motion.div>
          <div className="relative">
            <img src="https://i.ibb.co.com/N6fXww79/image.png" alt="Tour Design System" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Feature 4: Responsive & Mobile First Experience */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <img src="https://i.ibb.co.com/3GCdFxL/image.png" alt="Mobile Checkout Experience" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full max-w-sm mx-auto object-cover" />
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
            <div className="font-mono text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">[ MOBILE PERFORMANCE ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">Responsive & Mobile First Experience</h2>
            <p className="text-lg text-slate-600 mb-8">
              Deliver blistering speed across mobile, tablet, and desktop devices. Touch-friendly controls, 44px minimum touch targets, fast client-side navigation, and 95+ Google PageSpeed score ensure travelers complete checkouts anywhere.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
                <Smartphone className="w-8 h-8 text-purple-500 mb-4" />
                <h4 className="font-bold mb-2 text-slate-900">Mobile First Checkout</h4>
                <p className="text-sm text-slate-500">Smooth touch gestures and quick date selection built for smartphones.</p>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
                <Zap className="w-8 h-8 text-purple-500 mb-4" />
                <h4 className="font-bold mb-2 text-slate-900">Ultra-Fast Performance</h4>
                <p className="text-sm text-slate-500">Sub-second page loads reduce bounce rates and maximize conversions.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
