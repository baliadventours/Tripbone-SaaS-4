import React from 'react';
import { Sparkles, Bot, Globe, Zap, LayoutTemplate, ShieldCheck, FileText, Send, CheckCircle2, Image as ImageIcon, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIFeatures() {
  return (
    <div className="pt-20 bg-white">
      {/* Hero Section */}
      <section className="py-24 px-6 relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-blue-300 mb-8 backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            <span>AI Superpowers</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            Automate Your Tour Operations.
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12">
            Create 1-click tour pages, auto-generate sales proposals, qualify inbound leads with guest planners, and handle 24/7 order tracking with AI.
          </p>
          <img 
            src="https://i.ibb.co.com/4nF2mvyr/AIgenerated.png" 
            alt="AI Interface" 
            className="rounded-[2rem] border border-white/10 shadow-2xl mx-auto max-w-5xl w-full object-cover"
          />
        </div>
      </section>

      {/* Feature 1: One Click AI Tour Page Creation */}
      <section className="py-24 px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="font-mono text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">[ 1-CLICK TOUR BUILDER ]</div>
            <h2 className="text-4xl font-bold mb-6">One Click AI Tour Page Creation</h2>
            <p className="text-lg text-slate-600 mb-8">
              Stop spending hours researching, drafting, and formatting tour itineraries. Simply input a title like "Full Day Nusa Penida Island Hopping" and AI automatically builds complete day-by-day itineraries, inclusions, highlights, FAQ, and pricing rules.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900">Multi Package & Multi Tier Pricing</h4>
                  <p className="text-sm text-slate-500">Auto-configures Standard, Deluxe, VIP tiers along with Adult, Child, and Infant rates.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ImageIcon className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900">Image Gallery Compression</h4>
                  <p className="text-sm text-slate-500">Auto-compresses high-resolution tour photos into lightweight WebP format for fast mobile loads.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900">Flexible Availability & Cutoff Times</h4>
                  <p className="text-sm text-slate-500">Defines daily departure slots, max capacity limits, and advance booking rules instantly.</p>
                </div>
              </div>
            </div>
          </motion.div>
          <div className="relative">
            <img src="https://i.ibb.co.com/KzWryQqz/image.png" alt="Tour Generator" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Feature 2: Guest AI Travel Planner & Lead Generator */}
      <section className="py-24 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <img src="https://i.ibb.co.com/VYwm826K/image.png" alt="Travel Planner" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full object-cover" />
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
            <div className="font-mono text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">[ LEAD GENERATION ENGINE ]</div>
            <h2 className="text-4xl font-bold mb-6">AI Powered Guest Travel Planner</h2>
            <p className="text-lg text-slate-600 mb-8">
              Turn casual website visitors into ready-to-buy inquiries. Travelers use an interactive AI itinerary planner on your storefront to outline their custom dream vacation. Once saved, the generated itinerary is delivered directly to your tenant admin portal as a qualified lead.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Travelers save custom multi-day trip schedules</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Send className="w-5 h-5 text-blue-500" /> Tenant receives full guest contact details & itinerary lead</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Bot className="w-5 h-5 text-blue-500" /> Higher conversion rate than standard contact forms</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Feature 3: AI Tour Proposal Generator */}
      <section className="py-24 px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="font-mono text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">[ PROPOSAL AUTOMATION ]</div>
            <h2 className="text-4xl font-bold mb-6">AI Powered Tour Proposal</h2>
            <p className="text-lg text-slate-600 mb-8">
              When a traveler inquires about a private group or custom trip, your team can generate a stunning interactive web proposal in seconds. AI formats pricing options, daily schedules, and deposit checkout links into a shareable branded link.
            </p>
            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
              <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                <FileText className="w-4 h-4 text-blue-600" /> Instant Shareable Link
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                Send interactive proposals via WhatsApp or Email. Guests view their custom trip layout, select package options, and pay deposits directly online.
              </p>
            </div>
          </motion.div>
          <div className="relative">
            <img src="https://i.ibb.co.com/0gBfXtC/image.png" alt="AI Proposal Interface" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Feature 4: Live AI Chatbot & Order Tracking */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <img src="https://i.ibb.co.com/VYwm826K/image.png" alt="Chatbot Interface" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full object-cover" />
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
            <div className="font-mono text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">[ 24/7 GUEST SUPPORT ]</div>
            <h2 className="text-4xl font-bold mb-6">AI Chatbot & Booking Tracking</h2>
            <p className="text-lg text-slate-600 mb-8">
              Keep customer service running round-the-clock. Your store's AI assistant answers trip questions, recommends tours based on preferences, and allows existing guests to check their real-time booking status using their reference code.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
                <Bot className="w-8 h-8 text-blue-500 mb-4" />
                <h4 className="font-bold mb-2 text-slate-900">AI Assistant</h4>
                <p className="text-sm text-slate-500">Provides live answers about pickup locations, inclusions, and policies.</p>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
                <Globe className="w-8 h-8 text-blue-500 mb-4" />
                <h4 className="font-bold mb-2 text-slate-900">Order Tracking</h4>
                <p className="text-sm text-slate-500">Guests look up vouchers and departure status anytime without emailing staff.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
