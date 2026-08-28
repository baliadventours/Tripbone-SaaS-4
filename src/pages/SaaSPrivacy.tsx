import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, Printer, Calendar, BookOpen, Eye, Database, Share2, Lock, UserCheck, Mail } from 'lucide-react';

const BRAND = 'Tripbone';
const SUPPORT_EMAIL = 'support@tripbone.com';
const EFFECTIVE_DATE = 'July 1, 2025';

const sections = [
  { id: 'overview',    label: '1. Overview' },
  { id: 'collect',    label: '2. Data We Collect' },
  { id: 'use',        label: '3. How We Use Data' },
  { id: 'sharing',    label: '4. Data Sharing' },
  { id: 'retention',  label: '5. Data Retention' },
  { id: 'rights',     label: '6. Your Rights' },
  { id: 'security',   label: '7. Security' },
  { id: 'children',   label: "8. Children's Privacy" },
  { id: 'contact',    label: '9. Contact Us' },
];

export default function SaaSPrivacy() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Helmet>
        <title>Privacy Policy – {BRAND}</title>
        <meta name="description" content={`Learn how ${BRAND} collects, uses, and protects your personal data. We are committed to your privacy.`} />
      </Helmet>

      <div className="min-h-screen bg-[#f8fafc] pt-20">
        {/* Hero Banner */}
        <section className="bg-gradient-to-br from-slate-900 via-[#0d2a3b] to-[#0d3b44] py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1db3cd]/20 rounded-full mb-6 border border-[#1db3cd]/30">
              <Shield className="h-4 w-4 text-[#1db3cd]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#1db3cd]">Privacy</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6">
              Privacy Policy
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl leading-relaxed mb-8">
              Your privacy matters to us. This policy explains what data we collect, why we collect it, and how we protect it.
            </p>
            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Effective: {EFFECTIVE_DATE}
              </span>
              <span className="hidden md:inline text-slate-600">•</span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-[#1db3cd] hover:text-[#1db3cd]/80 transition-colors cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-28 space-y-4 lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-extrabold text-xs text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Contents
                </h3>
                <nav className="space-y-1">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollTo(s.id)}
                      className={`w-full text-left block px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                        activeSection === s.id
                          ? 'bg-[#1db3cd] text-white shadow-md shadow-[#1db3cd]/20'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl">
                <h4 className="font-extrabold text-sm mb-2 uppercase tracking-wider">Privacy Request?</h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Submit a data access, correction, or deletion request directly to our privacy team.
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=Privacy Request`}
                  className="inline-flex items-center gap-2 bg-[#1db3cd] hover:bg-[#1db3cd]/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  <Mail className="h-4 w-4" /> Submit Request
                </a>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3 space-y-14">

              {/* 1 */}
              <section id="overview" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#1db3cd]/10 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-[#1db3cd]" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">1. Overview</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>{BRAND} ("we", "our", or "us") operates as a data controller for the personal data collected from customers using our platform. This Privacy Policy describes how we collect, use, store, and share your data when you use {BRAND}'s website and services.</p>
                  <p>By using our Service, you consent to data collection as described in this policy. This policy complies with applicable data protection regulations including GDPR and Indonesian Government Regulation No. 71 of 2019.</p>
                </div>
              </section>

              {/* 2 */}
              <section id="collect" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Database className="h-4 w-4 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">2. Data We Collect</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>We collect information in the following categories:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Account Data:</strong> Name, email, company name, phone number, and billing details provided during registration.</li>
                    <li><strong>Usage Data:</strong> Pages visited, features used, click interactions, session duration, and device/browser information.</li>
                    <li><strong>Customer Data:</strong> Data you import or generate within the platform (e.g., your customer bookings, tour lists) — we process this strictly on your behalf.</li>
                    <li><strong>Communication Data:</strong> Emails, support chat messages, and feedback forms you send to us.</li>
                    <li><strong>Payment Data:</strong> Processed securely by third-party payment processors; we never store raw card data.</li>
                  </ul>
                </div>
              </section>

              {/* 3 */}
              <section id="use" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Eye className="h-4 w-4 text-purple-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">3. How We Use Data</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>We use your data to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide, maintain, and improve our platform.</li>
                    <li>Process payments and manage subscriptions.</li>
                    <li>Send transactional and product emails (invoices, feature updates, security alerts).</li>
                    <li>Provide customer support.</li>
                    <li>Analyze usage trends to improve our product (using anonymized/aggregated data where possible).</li>
                    <li>Comply with legal obligations.</li>
                  </ul>
                  <p>We do not sell your personal data to any third parties.</p>
                </div>
              </section>

              {/* 4 */}
              <section id="sharing" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <Share2 className="h-4 w-4 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">4. Data Sharing</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>We may share your data with trusted sub-processors who help us deliver the Service (e.g., cloud hosting, analytics, payment processing). All sub-processors are contractually bound to protect your data.</p>
                  <p>We may disclose data if required by law, legal process, or to protect the rights and safety of {BRAND} and its users.</p>
                </div>
              </section>

              {/* 5 */}
              <section id="retention" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Database className="h-4 w-4 text-slate-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">5. Data Retention</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>We retain your account data for as long as your subscription is active and for up to 90 days after account closure. Backup copies may be retained for up to 12 months for disaster recovery purposes.</p>
                  <p>Upon written request, we will delete your personal data within 30 days, unless retention is required by law.</p>
                </div>
              </section>

              {/* 6 */}
              <section id="rights" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#1db3cd]/10 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-[#1db3cd]" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">6. Your Rights</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>Depending on your location, you may have the following rights regarding your personal data:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
                    <li><strong>Deletion:</strong> Request erasure of your personal data ("right to be forgotten").</li>
                    <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
                    <li><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
                    <li><strong>Withdraw Consent:</strong> Opt out of marketing communications at any time.</li>
                  </ul>
                  <p>To exercise any right, email us at: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#1db3cd] hover:underline">{SUPPORT_EMAIL}</a></p>
                </div>
              </section>

              {/* 7 */}
              <section id="security" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <Lock className="h-4 w-4 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">7. Security</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>We implement industry-standard security measures including TLS encryption in transit, AES-256 encryption at rest, access controls, and regular security audits. However, no system is 100% secure. In the event of a data breach, we will notify affected users within 72 hours as required by applicable law.</p>
                </div>
              </section>

              {/* 8 */}
              <section id="children" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-yellow-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">8. Children's Privacy</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>The {BRAND} platform is intended for business users aged 18 and over. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the data immediately.</p>
                </div>
              </section>

              {/* 9 */}
              <section id="contact" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#1db3cd]/10 rounded-lg flex items-center justify-center">
                    <Mail className="h-4 w-4 text-[#1db3cd]" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">9. Contact Us</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>If you have any questions or concerns about this Privacy Policy, please contact our Privacy Team:</p>
                  <p>
                    <strong>{BRAND}</strong><br />
                    Email: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#1db3cd] hover:underline">{SUPPORT_EMAIL}</a><br />
                    Subject: Privacy Inquiry
                  </p>
                </div>
              </section>

            </main>
          </div>
        </div>
      </div>
    </>
  );
}
