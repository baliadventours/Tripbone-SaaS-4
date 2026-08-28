import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Scale, Printer, Calendar, BookOpen, ShieldCheck, AlertCircle, FileText, CreditCard, Lock, Globe } from 'lucide-react';

const BRAND = 'Tripbone';
const SUPPORT_EMAIL = 'support@tripbone.com';
const EFFECTIVE_DATE = 'July 1, 2025';

const sections = [
  { id: 'acceptance',    label: '1. Acceptance of Terms' },
  { id: 'services',     label: '2. Description of Services' },
  { id: 'accounts',     label: '3. Accounts & Subscriptions' },
  { id: 'payments',     label: '4. Payments & Billing' },
  { id: 'acceptable',   label: '5. Acceptable Use' },
  { id: 'ip',           label: '6. Intellectual Property' },
  { id: 'liability',    label: '7. Limitation of Liability' },
  { id: 'termination',  label: '8. Termination' },
  { id: 'governing',    label: '9. Governing Law' },
];

export default function SaaSTerms() {
  const [activeSection, setActiveSection] = useState('acceptance');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Helmet>
        <title>Terms of Service – {BRAND}</title>
        <meta name="description" content={`Read ${BRAND}'s Terms of Service. Understand your rights and obligations when using our tour operator platform.`} />
      </Helmet>

      <div className="min-h-screen bg-[#f8fafc] pt-20">
        {/* Hero Banner */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-[#0d3b44] py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1db3cd]/20 rounded-full mb-6 border border-[#1db3cd]/30">
              <Scale className="h-4 w-4 text-[#1db3cd]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#1db3cd]">Legal</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6">
              Terms of Service
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl leading-relaxed mb-8">
              These terms govern your access to and use of {BRAND}'s platform, products, and services. Please read them carefully.
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
                  <BookOpen className="h-4 w-4" /> Table of Contents
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
                <h4 className="font-extrabold text-sm mb-2 uppercase tracking-wider">Questions?</h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Our legal team is happy to clarify any of these terms.
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="inline-flex items-center gap-2 bg-[#1db3cd] hover:bg-[#1db3cd]/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  Contact Us
                </a>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3 space-y-14">

              {/* 1 */}
              <section id="acceptance" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#1db3cd]/10 rounded-lg flex items-center justify-center">
                    <Scale className="h-4 w-4 text-[#1db3cd]" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">1. Acceptance of Terms</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>By accessing or using {BRAND}'s platform (the "Service"), you confirm that you have read, understood, and agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these Terms, you may not use the Service.</p>
                  <p>If you are accepting these Terms on behalf of a company or other legal entity, you represent that you have the authority to bind that entity to these Terms, in which case "you" refers to that entity.</p>
                  <p>{BRAND} reserves the right to update these Terms at any time. Continued use of the Service after changes constitutes your acceptance of the revised Terms.</p>
                </div>
              </section>

              {/* 2 */}
              <section id="services" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Globe className="h-4 w-4 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">2. Description of Services</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>{BRAND} provides a SaaS platform for tour operators that includes website creation, booking management, AI-powered tools, payment processing integrations, CRM, and related services ("Service").</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{BRAND} reserves the right to modify, suspend, or discontinue any aspect of the Service at any time with reasonable notice.</li>
                    <li>We may introduce new features or tools subject to additional terms.</li>
                    <li>Service availability is subject to our <a href="/sla" className="text-[#1db3cd] hover:underline">Service Level Agreement (SLA)</a> for paid plans.</li>
                  </ul>
                </div>
              </section>

              {/* 3 */}
              <section id="accounts" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-purple-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">3. Accounts & Subscriptions</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>To access the Service, you must create an account and select a subscription plan. You are responsible for maintaining the confidentiality of your account credentials.</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Eligibility:</strong> You must be at least 18 years of age and have legal capacity to enter into contracts.</li>
                    <li><strong>Account Security:</strong> You are solely responsible for all activities that occur under your account.</li>
                    <li><strong>Accurate Information:</strong> You agree to provide accurate and up-to-date registration information.</li>
                    <li><strong>One Account per Business:</strong> Unless otherwise agreed, each subscription covers one business entity.</li>
                  </ul>
                </div>
              </section>

              {/* 4 */}
              <section id="payments" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">4. Payments & Billing</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                    <h4 className="font-extrabold text-sm text-slate-900 mb-3 uppercase tracking-wider">Billing Summary</h4>
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between border-b border-slate-200/50 pb-2">
                        <span className="font-semibold text-slate-700">Billing Cycle</span>
                        <span className="font-bold text-slate-900">Monthly or Annual</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/50 pb-2">
                        <span className="font-semibold text-slate-700">Payment Methods</span>
                        <span className="font-bold text-slate-900">Credit Card, Bank Transfer</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/50 pb-2">
                        <span className="font-semibold text-slate-700">Refund Policy</span>
                        <span className="font-bold text-slate-900">14-day money-back guarantee</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="font-semibold text-slate-700">Price Changes</span>
                        <span className="font-bold text-slate-900">30 days notice</span>
                      </div>
                    </div>
                  </div>
                  <p>Subscription fees are charged in advance. Failure to pay may result in suspension or termination of your account. All fees are exclusive of applicable taxes unless stated otherwise.</p>
                </div>
              </section>

              {/* 5 */}
              <section id="acceptable" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">5. Acceptable Use</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>You agree not to misuse the Service. Prohibited activities include:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Violating any applicable law or regulation.</li>
                    <li>Uploading malicious code, viruses, or harmful content.</li>
                    <li>Attempting to reverse engineer, decompile, or disassemble any part of the platform.</li>
                    <li>Using the platform to send spam or unauthorized communications.</li>
                    <li>Reselling or sublicensing access without prior written consent from {BRAND}.</li>
                  </ul>
                  <p>Violations may result in immediate account suspension without refund.</p>
                </div>
              </section>

              {/* 6 */}
              <section id="ip" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#1db3cd]/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-[#1db3cd]" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">6. Intellectual Property</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>All rights, title, and interest in the {BRAND} platform, including software, design, trademarks, and content, belong exclusively to {BRAND} or its licensors. Your subscription grants you a limited, non-exclusive, non-transferable license to use the Service.</p>
                  <p>You retain full ownership of all content and data you upload to the platform ("Your Content"). By using our Service, you grant {BRAND} a non-exclusive license to host and process Your Content solely to provide the Service.</p>
                </div>
              </section>

              {/* 7 */}
              <section id="liability" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Lock className="h-4 w-4 text-slate-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">7. Limitation of Liability</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>To the maximum extent permitted by law, {BRAND} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising out of or in connection with your use of the Service.</p>
                  <p>Our total aggregate liability to you for any claim shall not exceed the amounts paid by you in the twelve (12) months preceding the claim.</p>
                </div>
              </section>

              {/* 8 */}
              <section id="termination" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">8. Termination</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>You may cancel your subscription at any time via your account settings. {BRAND} may terminate or suspend your account at any time for violation of these Terms, with or without prior notice.</p>
                  <p>Upon termination, you may request an export of your data within 30 days. After that, your data will be deleted in accordance with our data retention policy.</p>
                </div>
              </section>

              {/* 9 */}
              <section id="governing" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#1db3cd]/10 rounded-lg flex items-center justify-center">
                    <Scale className="h-4 w-4 text-[#1db3cd]" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">9. Governing Law</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>These Terms are governed by the laws of the Republic of Indonesia. Any disputes arising out of these Terms shall be resolved through binding arbitration in Bali, Indonesia, unless otherwise required by law.</p>
                  <p>For questions, contact us at: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#1db3cd] hover:underline">{SUPPORT_EMAIL}</a></p>
                </div>
              </section>

            </main>
          </div>
        </div>
      </div>
    </>
  );
}
