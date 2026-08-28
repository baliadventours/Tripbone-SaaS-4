import React from 'react';
import { ShieldCheck, Network, Lock, DollarSign, Database, Server, Search, Globe, Users, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InfrastructureFeatures() {
  return (
    <div className="pt-20 bg-white">
      {/* Hero Section */}
      <section className="py-24 px-6 relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-slate-950"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-slate-300 mb-8 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4" />
            <span>Infrastructure & B2B Engine</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            Enterprise Infrastructure. Zero Fees.
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12">
            Self-hosted independence, zero transaction commissions, SEO-optimized Schema.org architecture, and multi-role B2B portals.
          </p>
          <img 
            src="https://i.ibb.co.com/B5dnFVb4/Software-dashboard-UI-mockup-202605262231.jpg" 
            alt="Infrastructure Dashboard" 
            className="rounded-[2rem] border border-white/10 shadow-2xl mx-auto max-w-5xl w-full object-cover"
          />
        </div>
      </section>

      {/* Feature 1: Self-Hosted & Zero Commission */}
      <section className="py-24 px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">[ ZERO COMMISSION DEPLOYMENT ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">Self-Hosted Platform Independence</h2>
            <p className="text-lg text-slate-600 mb-8">
              SaaS booking platforms take 3% to 6% of your revenue on every single booking. Tripbone provides a self-hosted architecture where you maintain 100% ownership of your guest database, source code, and online bookings.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Server className="w-5 h-5 text-slate-600" /> Cloud Native Infrastructure: Deploy on Cloud Run, AWS, or Vercel</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><DollarSign className="w-5 h-5 text-slate-600" /> Keep 100% of Booking Revenue: Direct payments to your merchant account</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Database className="w-5 h-5 text-slate-600" /> Database Sovereignty: Full ownership over guest logs and customer data</li>
            </ul>
          </motion.div>
          <div className="relative">
            <img src="https://i.ibb.co.com/9m1tFfW8/image.png" alt="Self-Hosted Architecture" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full" />
          </div>
        </div>
      </section>

      {/* Feature 2: SEO Friendly & Schema.org Architecture */}
      <section className="py-24 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <img src="https://i.ibb.co.com/N6fXww79/image.png" alt="SEO Infrastructure" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full object-cover" />
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
            <div className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">[ SEARCH ENGINE OPTIMIZATION ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">SEO Friendly & Structured Data</h2>
            <p className="text-lg text-slate-600 mb-8">
              Rank higher on Google organic search. Tripbone automatically embeds Schema.org Tour and Event JSON-LD structured data on every tour page, enabling rich snippets, star ratings, and prices directly in Google search results.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Search className="w-5 h-5 text-slate-600" /> Automatic XML Sitemap generation and canonical URLs</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Globe className="w-5 h-5 text-slate-600" /> Schema.org Tour JSON-LD structured metadata for rich Google snippets</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-slate-600" /> Fast mobile page loads optimized for Google Core Web Vitals</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Feature 3: Multi Suppliers & Multi Agents Roles */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">[ MULTI-ROLE NETWORK ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">Multi-Supplier & Multi-Agent Network</h2>
            <p className="text-lg text-slate-600 mb-8">
              Empower partners while securing your system. Role-based authentication isolates Admin, Agent, and Supplier environments, allowing concierges to submit orders and vendors to review pickup manifests safely.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
                <Network className="w-8 h-8 text-slate-700 mb-4" />
                <h4 className="font-bold mb-2 text-slate-900">Agent Portals</h4>
                <p className="text-sm text-slate-500">Dedicated login for travel agents with custom commission splits.</p>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
                <Users className="w-8 h-8 text-slate-700 mb-4" />
                <h4 className="font-bold mb-2 text-slate-900">Supplier Portals</h4>
                <p className="text-sm text-slate-500">Isolate vendor cost breakdowns and departure manifests securely.</p>
              </div>
            </div>
          </motion.div>
          <div className="relative">
            <img src="https://i.ibb.co.com/pjk8TdWP/image.png" alt="Multi Role Engine" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full max-w-sm mx-auto object-cover" />
          </div>
        </div>
      </section>
    </div>
  );
}
