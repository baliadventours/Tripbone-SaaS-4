import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../lib/SettingsContext';
import { Compass, Target, Sparkles, ShieldCheck, Heart, ArrowRight, Star, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export default function SaaSAbout() {
  const { settings } = useSettings();
  const siteName = settings?.siteName || 'Tripbone';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 15
      }
    }
  } as const;

  return (
    <>
      <Helmet>
        <title>{`Our Story & Vision | ${siteName}`}</title>
        <meta name="description" content="Discover the story behind Tripbone: a premium tour booking platform built by travel industry veterans for operators demanding excellence." />
      </Helmet>

      {/* Hero Section */}
      <div className="relative min-h-[60vh] bg-slate-950 flex items-center overflow-hidden pt-24">
        {/* Abstract background mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(29,179,205,0.15),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,178,114,0.1),transparent_50%)]" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-[#1db3cd]/15 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 py-16 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">By Operators, For Operators</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto"
          >
            Crafting the Backbone of <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-[#1db3cd]">Modern Tourism</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed"
          >
            We got tired of clunky plugins, fragmented spreadsheets, and high commissions. So, we built the ultimate system to run and grow our own tour company.
          </motion.p>
        </div>
      </div>

      {/* The Story Section */}
      <div className="bg-white py-24 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Story Text */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#1db3cd] font-mono block mb-2">Our Origin</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  The Spark That Built Tripbone
                </h2>
              </div>

              <div className="space-y-6 text-slate-600 text-base sm:text-lg leading-relaxed font-sans">
                <p>
                  Before we built a single line of code, <strong>we ran tours in Bali</strong>. We guided curious travelers through emerald rice terraces, climbed active volcanoes in the dark of night, and managed deep-sea diving expeditions. It was a beautiful life, but behind the scenes of every unforgettable holiday was a quiet operational nightmare.
                </p>
                <p>
                  Our weeks were swallowed by clunky plugins that crashed overnight, scattered Excel files, missed booking updates, double-booking emergencies, and endless manual WhatsApp threads with guides. To make matters worse, centralized Online Travel Agencies (OTAs) demanded up to <strong>25% of our hard-earned revenue</strong> just to route a booking.
                </p>
                <p>
                  We searched extensively for a website and booking platform that was clean, modern, fully customizable, mobile-first, and fairly priced. What we found was disappointing: either legacy software built by developers who had never set foot in a safari vehicle, or overpriced corporate portals.
                </p>
                <p>
                  Frustrated and pushed to the limit, we decided to build our own. We designed <strong>Tripbone</strong> to act as the strong digital spine of a tour business—sturdy, highly integrated, and perfectly silent, leaving your brand, your domain, and your relationships in the absolute center stage.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 items-center pt-4">
                <div className="flex items-center gap-3 bg-emerald-50 px-5 py-3.5 rounded-2xl border border-emerald-100">
                  <Star className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                  <div>
                    <div className="text-sm font-bold text-slate-900 leading-none">Tour Operator Veteran</div>
                    <div className="text-xs text-slate-500 mt-1">Real operational experience</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-cyan-50 px-5 py-3.5 rounded-2xl border border-cyan-100">
                  <Sparkles className="w-5 h-5 text-[#1db3cd]" />
                  <div>
                    <div className="text-sm font-bold text-slate-900 leading-none">Zero Commission Policy</div>
                    <div className="text-xs text-slate-500 mt-1">Keep 100% of your bookings</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Side Accent */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500 to-[#1db3cd] opacity-10 blur-xl" />
              <div className="relative bg-slate-950 p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
                
                <h3 className="text-xl font-bold mb-6 font-mono text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  FOUNDER'S NOTE
                </h3>

                <blockquote className="text-base sm:text-lg italic text-slate-300 leading-relaxed mb-6 font-serif">
                  "We didn't set out to build a giant tech startup. We set out to build a platform that actually respects how tours run on the ground. When your guides are in the field and your phone is blowing up with booking requests, you need a system that acts like a trusted partner, not a technical headache."
                </blockquote>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300 text-lg font-mono">
                    BA
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Bali Tour Operators</div>
                    <div className="text-xs text-slate-400">Creators of Tripbone</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Vision & Mission Section */}
      <div className="bg-slate-50 py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Vision Card */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group transition-all"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#1db3cd]/5 rounded-bl-full transition-all group-hover:bg-[#1db3cd]/10" />
              <div className="w-14 h-14 rounded-2xl bg-[#1db3cd]/10 flex items-center justify-center mb-8 border border-[#1db3cd]/20">
                <Compass className="w-7 h-7 text-[#1db3cd]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h3>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-sans">
                To build the world's most trusted, decentralized, and accessible travel tech infrastructure. We envision a future where local tour operators everywhere have complete digital independence, run highly profitable storefronts under their own brand, and bypass predatory commission models entirely.
              </p>
            </motion.div>

            {/* Mission Card */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group transition-all"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full transition-all group-hover:bg-emerald-500/10" />
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-8 border border-emerald-500/20">
                <Target className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h3>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-sans">
                To democratize enterprise-grade booking and operations tech. We simplify the heavy lifting of scheduling, guide dispatch, instant payments, and localized languages into a seamless, mobile-first dashboard—enabling you to focus purely on creating unforgettable guest experiences.
              </p>
            </motion.div>

          </div>
        </div>
      </div>

      {/* The Future of Travel Booking (Suggested Core Pillars) */}
      <div className="bg-white py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 font-mono block mb-2">Our Philosophy</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              The Future of Travel Booking
            </h2>
            <p className="mt-4 text-lg text-slate-500 font-sans">
              We believe the next generation of travel technology isn't centralized directories; it is distributed, independent, and augmented.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Pillar 1 */}
            <motion.div variants={itemVariants} className="p-8 rounded-3xl border border-slate-100 hover:border-emerald-500/30 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-100">
                <span className="text-lg font-bold text-emerald-600 font-mono">01</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Absolute Autonomy</h4>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                Your customers buy directly from your custom domain. You own the relationship, the analytics, and the customer data. No middleman, no distraction, and zero fee slippage.
              </p>
            </motion.div>

            {/* Pillar 2 */}
            <motion.div variants={itemVariants} className="p-8 rounded-3xl border border-slate-100 hover:border-[#1db3cd]/30 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-6 border border-cyan-100">
                <span className="text-lg font-bold text-[#1db3cd] font-mono">02</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Mobile-First In-Field Operations</h4>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                Tourism happens outdoors, not behind an office desk. Our platform is fully responsive and fast, allowing guides to look up manifests, verify vouchers, and report status on slow connections.
              </p>
            </motion.div>

            {/* Pillar 3 */}
            <motion.div variants={itemVariants} className="p-8 rounded-3xl border border-slate-100 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-6 border border-indigo-100">
                <span className="text-lg font-bold text-indigo-600 font-mono">03</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">AI-Amplified Efficiency</h4>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                Harnessing modern AI to automate tedious office tasks: translation of guest inquiries, intelligent itinerary design, and smart chatbot answering for international bookings.
              </p>
            </motion.div>

            {/* Pillar 4 */}
            <motion.div variants={itemVariants} className="p-8 rounded-3xl border border-slate-100 hover:border-teal-500/30 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-6 border border-teal-100">
                <span className="text-lg font-bold text-teal-600 font-mono">04</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Modern Secure Payments</h4>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                Offer secure credit cards, local digital wallets, and custom bank transfer receipts in the traveler's native currency while receiving settlements in your preferred local account.
              </p>
            </motion.div>

            {/* Pillar 5 */}
            <motion.div variants={itemVariants} className="p-8 rounded-3xl border border-slate-100 hover:border-orange-500/30 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-6 border border-orange-100">
                <span className="text-lg font-bold text-orange-600 font-mono">05</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Veteran Support Guarantee</h4>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                When you contact support, you don't talk to automated tier-1 scripts. You talk to software engineers and veteran tour managers who understand what "tour pick-up in 10 minutes" means.
              </p>
            </motion.div>

            {/* Pillar 6 */}
            <motion.div variants={itemVariants} className="p-8 rounded-3xl border border-slate-100 hover:border-purple-500/30 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-6 border border-purple-100">
                <span className="text-lg font-bold text-purple-600 font-mono">06</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Flat-Rate Subscription</h4>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                Your growth should not pay us a tax. Tripbone charges a transparent subscription based on capabilities and volumes, not a percentage cut of your actual tours or ticket sales.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Suggested Core Values Box */}
      <div className="bg-slate-950 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,178,114,0.1),transparent_60%)]" />
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <Heart className="w-12 h-12 text-emerald-400 mx-auto mb-6 animate-pulse" />
          <h3 className="text-3xl font-extrabold mb-4">Our Golden Rule</h3>
          <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto font-serif italic">
            "If a software feature isn't useful to a tour operator guiding a group through a forest with a dying battery and poor mobile signal, it has no business being inside Tripbone."
          </p>
          <div className="mt-8 text-xs font-mono uppercase tracking-widest text-slate-500">
            Tripbone Development Philosophy
          </div>
        </div>
      </div>
    </>
  );
}
