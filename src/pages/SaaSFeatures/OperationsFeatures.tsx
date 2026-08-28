import React from 'react';
import { Navigation, Calendar, MessageCircle, Truck, RefreshCw, Zap, Users, Ticket, Headset, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OperationsFeatures() {
  return (
    <div className="pt-20 bg-white">
      {/* Hero Section */}
      <section className="py-24 px-6 relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-slate-950"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-amber-300 mb-8 backdrop-blur-md">
            <Navigation className="w-4 h-4" />
            <span>Operations & Fleet Command</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            Streamline Every Departure.
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12">
            Advanced booking management, WhatsApp guide & guest notifications, integrated support tickets, multi-supplier cost tracking, and agent portals.
          </p>
          <img 
            src="https://i.ibb.co.com/Tx0Bpk4s/image.png" 
            alt="Dispatch Console" 
            className="rounded-[2rem] border border-white/10 shadow-2xl mx-auto max-w-5xl w-full object-cover"
          />
        </div>
      </section>

      {/* Feature 1: Advanced Booking Management */}
      <section className="py-24 px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="font-mono text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">[ DISPATCH CONTROL HUB ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">Advanced Booking Management</h2>
            <p className="text-lg text-slate-600 mb-8">
              Effortlessly track and organize thousands of traveler reservations with our high-speed administrative console. Toggle instantly between Calendar view, Daily Timeline, and Filterable Lists.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-700 font-medium">
                <Calendar className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                <div>
                  <span className="font-bold text-slate-900">Calendar & Timeline Scheduling:</span> Real-time departure slots, seat capacity monitoring, and pickup location search.
                </div>
              </li>
              <li className="flex items-start gap-3 text-slate-700 font-medium">
                <Ticket className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                <div>
                  <span className="font-bold text-slate-900">Digital Voucher Generator:</span> Auto-generates QR-coded e-tickets with full itinerary details and meeting point links.
                </div>
              </li>
              <li className="flex items-start gap-3 text-slate-700 font-medium">
                <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                <div>
                  <span className="font-bold text-slate-900">Manual Booking Creation:</span> Easily log walk-in customers or custom phone orders directly into your system.
                </div>
              </li>
            </ul>
          </motion.div>
          <div className="relative">
            <img src="https://i.ibb.co.com/FkNYsFxz/image.png" alt="Command Center" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full" />
          </div>
        </div>
      </section>

      {/* Feature 2: WhatsApp & Email Automation */}
      <section className="py-24 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <img src="https://i.ibb.co.com/hxwx5pS1/IMG-2452.png" alt="WhatsApp Automation" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full max-w-sm mx-auto object-cover" />
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
            <div className="font-mono text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">[ WHATSAPP DISPATCH ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">Email & WhatsApp Automation</h2>
            <p className="text-lg text-slate-600 mb-8">
              Eliminate manual phone calls and lost guests. When a booking is confirmed, WhatsApp notifications and e-ticket vouchers are instantly broadcast to the guest and assigned driver or tour guide.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-700 font-medium"><MessageCircle className="w-5 h-5 text-amber-500" /> WhatsApp booking confirmations & e-vouchers sent directly to traveler</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><MessageCircle className="w-5 h-5 text-amber-500" /> Automated driver and tour guide briefing notes sent to mobile</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-amber-500" /> Reduces no-shows and pickup confusion to near zero</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Feature 3: Integrated CRM & Ticket Support System */}
      <section className="py-24 px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="font-mono text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">[ INTEGRATED CRM ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">Integrated Support Ticket & CRM</h2>
            <p className="text-lg text-slate-600 mb-8">
              Maintain a complete record of every guest interaction. Your tenant portal includes a built-in customer support ticket system where staff can resolve inquiries, track customer communication history, and update booking details in one workspace.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
                <Headset className="w-8 h-8 text-amber-500 mb-4" />
                <h4 className="font-bold mb-2 text-slate-900">Support Ticket System</h4>
                <p className="text-sm text-slate-500">Log customer tickets, assign support reps, and track resolution statuses.</p>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
                <Users className="w-8 h-8 text-amber-500 mb-4" />
                <h4 className="font-bold mb-2 text-slate-900">Guest History Log</h4>
                <p className="text-sm text-slate-500">View past tours, total lifetime spend, dietary notes, and custom preferences.</p>
              </div>
            </div>
          </motion.div>
          <div className="relative">
            <img src="https://i.ibb.co.com/M58dD84y/IMG-2455.png" alt="CRM Management" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full max-w-sm mx-auto object-cover" />
          </div>
        </div>
      </section>

      {/* Feature 4: Multi Suppliers & Multi Agents Portals */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <img src="https://i.ibb.co.com/pjk8TdWP/image.png" alt="Multi Suppliers & Agents" className="rounded-[2rem] shadow-2xl border-[8px] border-white w-full max-w-sm mx-auto object-cover" />
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
            <div className="font-mono text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">[ B2B NETWORK ]</div>
            <h2 className="text-4xl font-bold mb-6 text-slate-900">Multi Suppliers & Multi Agents</h2>
            <p className="text-lg text-slate-600 mb-8">
              Expand your distribution channels seamlessly. Assign external tour suppliers, log cost breakdowns, and grant travel agents or hotel concierges dedicated agent portals with customized commission rates and discount codes.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Building2 className="w-5 h-5 text-amber-500" /> Isolated Supplier portal with vendor cost tracking and payout logs</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><Users className="w-5 h-5 text-amber-500" /> Agent portal with automated commission calculations and agent vouchers</li>
              <li className="flex items-center gap-3 text-slate-700 font-medium"><ShieldCheck className="w-5 h-5 text-amber-500" /> Role-based access control protecting your proprietary customer data</li>
            </ul>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
