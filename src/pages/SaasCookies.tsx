import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Cookie, Printer, Calendar, BookOpen, Settings, BarChart2, Shield, ToggleRight, Mail } from 'lucide-react';

const BRAND = 'Tripbone';
const SUPPORT_EMAIL = 'support@tripbone.com';
const EFFECTIVE_DATE = 'July 1, 2025';

const sections = [
  { id: 'what',       label: '1. What Are Cookies' },
  { id: 'types',      label: '2. Types We Use' },
  { id: 'essential',  label: '3. Essential Cookies' },
  { id: 'analytics',  label: '4. Analytics Cookies' },
  { id: 'marketing',  label: '5. Marketing Cookies' },
  { id: 'control',    label: '6. Your Controls' },
  { id: 'updates',    label: '7. Policy Updates' },
  { id: 'contact',    label: '8. Contact Us' },
];

export default function SaaSCookies() {
  const [activeSection, setActiveSection] = useState('what');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Helmet>
        <title>Cookie Policy – {BRAND}</title>
        <meta name="description" content={`Learn how ${BRAND} uses cookies and similar tracking technologies on our platform. You are in control.`} />
      </Helmet>

      <div className="min-h-screen bg-[#f8fafc] pt-20">
        {/* Hero Banner */}
        <section className="bg-gradient-to-br from-slate-900 via-[#0f1f3b] to-[#112040] py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1db3cd]/20 rounded-full mb-6 border border-[#1db3cd]/30">
              <Cookie className="h-4 w-4 text-[#1db3cd]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#1db3cd]">Cookies</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6">
              Cookie Policy
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl leading-relaxed mb-8">
              We use cookies to make {BRAND} work and to help us understand how you use our platform so we can keep improving it.
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
                <h4 className="font-extrabold text-sm mb-2 uppercase tracking-wider">Cookie Settings</h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  You can manage your cookie preferences at any time in your browser settings.
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=Cookie Preferences`}
                  className="inline-flex items-center gap-2 bg-[#1db3cd] hover:bg-[#1db3cd]/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  <Mail className="h-4 w-4" /> Contact Us
                </a>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3 space-y-14">

              {/* 1 */}
              <section id="what" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#1db3cd]/10 rounded-lg flex items-center justify-center">
                    <Cookie className="h-4 w-4 text-[#1db3cd]" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">1. What Are Cookies</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>Cookies are small text files placed on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work efficiently and to provide information to website owners.</p>
                  <p>In addition to traditional cookies, {BRAND} may use similar tracking technologies such as pixel tags, web beacons, and local storage. This policy covers all such technologies collectively referred to as "cookies."</p>
                </div>
              </section>

              {/* 2 */}
              <section id="types" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Settings className="h-4 w-4 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">2. Types We Use</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                    <div className="grid gap-4">
                      {[
                        { label: 'Essential', desc: 'Required for the platform to function. Cannot be disabled.', color: 'bg-green-100 text-green-700' },
                        { label: 'Analytics', desc: 'Help us understand how users interact with our platform.', color: 'bg-blue-100 text-blue-700' },
                        { label: 'Preferences', desc: 'Remember your settings like language and timezone.', color: 'bg-purple-100 text-purple-700' },
                        { label: 'Marketing', desc: 'Used to deliver relevant ads and track campaign performance.', color: 'bg-orange-100 text-orange-700' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-4 border-b border-slate-200/50 pb-3 last:border-0 last:pb-0">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${item.color}`}>{item.label}</span>
                          <span className="text-sm text-slate-600">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* 3 */}
              <section id="essential" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">3. Essential Cookies</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>These cookies are strictly necessary for the platform to operate. They enable core functions like:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Maintaining your logged-in session.</li>
                    <li>Securing your account with authentication tokens.</li>
                    <li>Remembering your preferences during a single session.</li>
                    <li>Enabling secure payment processing flows.</li>
                  </ul>
                  <p>These cookies cannot be disabled without severely impacting platform functionality. They do not store any personally identifiable information beyond what is necessary for the service.</p>
                </div>
              </section>

              {/* 4 */}
              <section id="analytics" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BarChart2 className="h-4 w-4 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">4. Analytics Cookies</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>We use analytics cookies to understand how visitors interact with {BRAND}. This helps us improve the platform, fix bugs, and prioritize new features. The following third-party analytics services may be active:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Google Analytics:</strong> Collects anonymized data on page visits, session duration, and user flows. Data is processed in accordance with Google's Privacy Policy.</li>
                    <li><strong>Internal Analytics:</strong> {BRAND}'s own lightweight analytics to track feature usage and performance metrics.</li>
                  </ul>
                  <p>Analytics data is aggregated and anonymized. We never sell analytics data to third parties.</p>
                </div>
              </section>

              {/* 5 */}
              <section id="marketing" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <BarChart2 className="h-4 w-4 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">5. Marketing Cookies</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>Marketing cookies may be set by advertising partners such as Google Ads and Meta to show {BRAND} ads on other platforms you visit. These cookies track your browsing activity across websites. They do not contain personally identifiable information directly.</p>
                  <p>You can opt out of marketing cookies via your browser settings or by using the opt-out links provided by each advertising platform.</p>
                </div>
              </section>

              {/* 6 */}
              <section id="control" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#1db3cd]/10 rounded-lg flex items-center justify-center">
                    <ToggleRight className="h-4 w-4 text-[#1db3cd]" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">6. Your Controls</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>You have full control over non-essential cookies. Here's how to manage them:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Browser Settings:</strong> Most browsers allow you to view, block, or delete cookies via their settings menu (usually under Privacy or Security).</li>
                    <li><strong>Opt-out Links:</strong>
                      <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noreferrer" className="text-[#1db3cd] hover:underline">Google Analytics Opt-out</a></li>
                        <li><a href="https://www.youronlinechoices.eu/" target="_blank" rel="noreferrer" className="text-[#1db3cd] hover:underline">Your Online Choices (EU)</a></li>
                      </ul>
                    </li>
                    <li><strong>Disabling Cookies:</strong> Blocking all cookies may affect the functionality of {BRAND}. Essential cookies cannot be blocked while using the platform.</li>
                  </ul>
                </div>
              </section>

              {/* 7 */}
              <section id="updates" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-slate-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">7. Policy Updates</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our services. We will notify you of significant changes via email or a notice on our website. The "Effective Date" at the top of this page indicates when the policy was last revised.</p>
                  <p>Your continued use of {BRAND} after any changes constitutes your acceptance of the updated policy.</p>
                </div>
              </section>

              {/* 8 */}
              <section id="contact" className="scroll-mt-32 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#1db3cd]/10 rounded-lg flex items-center justify-center">
                    <Mail className="h-4 w-4 text-[#1db3cd]" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">8. Contact Us</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                  <p>If you have any questions about this Cookie Policy or how we use cookies, please reach out:</p>
                  <p>
                    <strong>{BRAND}</strong><br />
                    Email: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#1db3cd] hover:underline">{SUPPORT_EMAIL}</a><br />
                    Subject: Cookie Policy Inquiry
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
