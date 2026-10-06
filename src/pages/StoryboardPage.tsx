import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Film, 
  Sparkles, 
  Clock, 
  Award, 
  Cloud, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function StoryboardPage() {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    const text = `# Google Cloud AI Builder Cup 2026 - Video Demo Storyboard & Script
**Project:** Tripbone (AI-Native Tour Commerce & Operating Engine)
**Track:** Retail & Commerce: Intelligent Customer & Business Experiences
**Target Video Duration:** 2:55 (Max 3:00)
**Format:** 1080p 60fps Screen Recording + Voiceover Narrator

---

## SCENE 1: The Hook & The Market Problem (0:00 - 0:35)
- **Visual:** Split screen montage showing chaotic WhatsApp group chats, manual PDF receipts, and OTA commission fee statements (20-25%).
- **Voiceover:** "Across Southeast Asia and the Asia-Pacific, independent tour operators power a multi-billion dollar tourism economy. Yet over 80% still manage direct bookings through fragmented WhatsApp chats, manual bank transfers, and static spreadsheets. This causes operators to lose up to 40% of international direct sales due to friction, timezone delays, and lack of dynamic pricing. Meet Tripbone — an AI-native, multi-tenant commerce and operating engine built on Google Cloud that turns any tour operator into a modern digital travel enterprise."
- **On-Screen Badges:** [The Problem: Fragmented Offline Tourism Commerce] [High OTA Commissions (25%)] [Tripbone • AI-Native Travel Commerce Engine]

---

## SCENE 2: The Customer Experience & Gemini AI (0:35 - 1:25)
- **Visual:** User interacts with the AI Trip Planner (/planner). Types prompt: "3 days in Bali for a couple, budget $600, love waterfalls and sunrises". Gemini streams back a personalized day-by-day plan with interactive route maps and live bookable tour cards. User clicks a tour, lands on Tour Details page with clean Airbnb-style Date & Guest picker, and clicks "Check availability" to view dynamic group rates and departure time slots.
- **Voiceover:** "For travelers, Tripbone leverages Google's Gemini API to power an intelligent AI Trip Planner. Rather than static PDFs, travelers receive personalized daily itineraries with real-time route optimization, duration calculations, and instant bookable recommendations. Booking is effortless. With our minimal Airbnb-grade booking flow, travelers only pick their date and traveler count—no confusing options up front. On the checkout step, our dynamic group pricing engine automatically recalculates rates as traveler sizes scale, paired with seamless departure time slot selection."
- **On-Screen Badges:** [Powered by Google Gemini 2.5] [Live Streaming Itinerary Generation] [Dynamic Group Rate Tiers]

---

## SCENE 3: Universal BYOPG Checkout & Instant Digital Voucher (1:25 - 1:55)
- **Visual:** Checkout payment options (Stripe, Midtrans QRIS, Xendit, PayPal, Pay on Arrival). Customer confirms booking. Redirects immediately to confirmed voucher page with QR code check-in and self-service booking tracker.
- **Voiceover:** "Tripbone features a Universal BYOPG architecture. Operators can enable Stripe, Midtrans QRIS, Xendit, PayPal, and Pay-on-Arrival simultaneously—supporting multi-currency conversions for global travelers. Instantly, a tamper-proof digital travel voucher with a scannable check-in QR code is generated, and customers can self-track their booking status without needing to create an account."
- **On-Screen Badges:** [Universal BYOPG Gateways: Stripe • QRIS • Midtrans • Xendit • PayPal] [Automated Digital Voucher with Scannable QR]

---

## SCENE 4: The Operator Operating System & Market Intelligence (1:55 - 2:30)
- **Visual:** Quick transition to Operator Admin Dashboard. Highlights live revenue metrics, tour management, driver/guide assignment, TinyFish live competitor price scraper, and live Website Builder / Theme customizer.
- **Voiceover:** "For the tour operator, Tripbone is a complete operating system: managing bookings, assigning drivers and guides, issuing tickets, and monitoring cash flow in real time. With our integrated TinyFish market intelligence, operators can scrape and monitor live competitor prices across major OTAs, keeping their direct rates competitive automatically. And with our built-in Website Builder, operators can fully customize their branding colors, typography, and domain in seconds."
- **On-Screen Badges:** [Multi-Tenant SaaS OS] [Automated Driver & Guide Assignment] [TinyFish OTA Price Intelligence] [Instant Tenant Branding Engine]

---

## SCENE 5: Google Cloud Architecture & Grand Finale (2:30 - 2:55)
- **Visual:** Clean technical architecture diagram highlighting: React Frontend, Google Cloud Run Node/Express API, Firebase Firestore & Auth, Google Gemini API, and Google Maps Platform. Concludes with live URL and GitHub link.
- **Voiceover:** "Tripbone is 100% cloud-native, built with Google Cloud Run, Firebase Firestore, Google Maps Platform, and the Gemini API—delivering sub-second latency, enterprise multi-tenant isolation, and scale-to-zero efficiency. Tripbone democratizes enterprise travel tech for thousands of operators across the region. Thank you, and see you in Singapore at the Google Cloud AI Builder Cup Grand Finale!"
- **On-Screen Badges:** [Google Cloud Run • Firebase Firestore • Gemini 2.5 API • Google Maps Platform] [Tripbone • See You in Singapore 2026!]
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadDoc = () => {
    window.open('/TRIPBONE_STORYBOARD_AIBUILDERCUP.html', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans print:bg-white print:text-black py-8 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Tripbone - AI Builder Cup 2026 Demo Storyboard</title>
      </Helmet>

      {/* Top Floating Control Bar - Hidden on Print */}
      <div className="max-w-4xl mx-auto mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4 no-print sticky top-4 z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
            <Film className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
              AI Builder Cup 2026 Demo Storyboard
            </h1>
            <p className="text-xs text-slate-500 font-medium">3-Minute Video Script & Production Blueprint</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownloadDoc}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Standalone Doc</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:opacity-90 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <article className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-900/[0.04] border border-slate-200 overflow-hidden print:border-none print:shadow-none print:p-0 print:rounded-none">
        {/* Document Header / Cover Banner */}
        <header className="p-8 md:p-10 border-b border-slate-100 bg-gradient-to-br from-slate-900 to-slate-800 text-white print:bg-white print:text-black print:border-b-2 print:border-black print:p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono font-bold tracking-wider uppercase border border-white/20 print:border-black print:text-black">
              Google Cloud AI Builder Cup 2026 Submission
            </span>
            <span className="text-xs font-bold text-slate-300 print:text-black flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" /> Target: 2:55 (Max 3:00)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight mb-2">
            Tripbone: AI-Native Tour Commerce & Operating Engine
          </h1>
          <p className="text-slate-300 print:text-gray-700 text-sm md:text-base font-normal max-w-2xl leading-relaxed">
            Video demo production script, scene-by-scene timing cues, visual recording prompts, and evaluation score mapping.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 print:border-gray-300 text-xs">
            <div>
              <span className="text-slate-400 print:text-gray-600 block uppercase text-[10px] font-bold">Category</span>
              <span className="font-bold text-white print:text-black">Retail & Commerce</span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block uppercase text-[10px] font-bold">AI Technology</span>
              <span className="font-bold text-white print:text-black">Google Gemini 2.5</span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block uppercase text-[10px] font-bold">Cloud Stack</span>
              <span className="font-bold text-white print:text-black">Cloud Run + Firestore</span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block uppercase text-[10px] font-bold">Target Resolution</span>
              <span className="font-bold text-white print:text-black">1080p 60fps</span>
            </div>
          </div>
        </header>

        {/* Storyboard Body */}
        <div className="p-8 md:p-10 space-y-10 print:p-4 print:space-y-6">
          
          {/* Scene 1 */}
          <section className="space-y-4 border-l-4 border-rose-500 pl-5 relative print:border-l-2 print:pl-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-black text-rose-600 uppercase tracking-wider font-mono">
                SCENE 1 • 0:00 – 0:35 (35 Seconds)
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Rubric: Problem Alignment & Impact (25%)
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              The Hook & The Tourism Fragmentation Problem
            </h2>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                  Visual Action On Screen
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Fast split-screen montage showing typical operator friction: messy WhatsApp group chats with customer quotes, static Word/PDF booking receipts, and OTA fee statements taking 20–25% commission.
                </p>
                <p className="text-slate-600 leading-relaxed font-medium">
                  &rarr; Smooth transition into the sleek, modern Tripbone platform homepage.
                </p>
              </div>

              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/60 space-y-2">
                <span className="font-bold text-rose-900 block uppercase tracking-wider text-[10px]">
                  Voiceover Script
                </span>
                <p className="text-rose-950 italic leading-relaxed">
                  "Across Southeast Asia and the Asia-Pacific, independent tour operators power a multi-billion dollar tourism economy. Yet over 80% still manage direct bookings through fragmented WhatsApp chats, manual bank transfers, and static spreadsheets. This causes operators to lose up to 40% of international direct sales. Meet Tripbone — an AI-native, multi-tenant commerce and operating engine built on Google Cloud that turns any tour operator into a modern digital travel enterprise."
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">Badge: Fragmented Offline Commerce</span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">Badge: High OTA Commissions (25%)</span>
              <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-md">Badge: Tripbone Commerce Engine</span>
            </div>
          </section>

          {/* Scene 2 */}
          <section className="space-y-4 border-l-4 border-amber-500 pl-5 relative print:border-l-2 print:pl-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-black text-amber-600 uppercase tracking-wider font-mono">
                SCENE 2 • 0:35 – 1:25 (50 Seconds)
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Rubric: Gen AI Implementation (40%) & UX (10%)
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              The Traveler Experience & Google Gemini AI Planner
            </h2>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                  Visual Action On Screen
                </span>
                <p className="text-slate-600 leading-relaxed">
                  1. Open AI Trip Planner (<code className="font-mono text-primary font-bold">/planner</code>). Input prompt: <em>"3 days in Bali for a couple, budget $600, love waterfalls and sunrises"</em>.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  2. Watch Gemini stream back day-by-day itineraries, interactive route maps, and bookable cards.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  3. Click a tour &rarr; Tour Details page. Show clean Airbnb Date & Guests picker &rarr; click "Check availability" to show dynamic group pricing tiers and departure times on Checkout.
                </p>
              </div>

              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/60 space-y-2">
                <span className="font-bold text-amber-900 block uppercase tracking-wider text-[10px]">
                  Voiceover Script
                </span>
                <p className="text-amber-950 italic leading-relaxed">
                  "For travelers, Tripbone leverages Google's Gemini API to power an intelligent AI Trip Planner. Rather than static PDFs, travelers receive personalized daily itineraries with real-time route optimization, duration calculations, and instant bookable recommendations. Booking is effortless. With our minimal Airbnb-grade booking flow, travelers only pick their date and traveler count—no confusing options up front. On the checkout step, our dynamic group pricing engine automatically recalculates rates as traveler sizes scale, paired with seamless departure time slot selection."
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md">Badge: Powered by Google Gemini 2.5</span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md">Badge: Streaming Itinerary Gen</span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md">Badge: Dynamic Group Rate Tiers</span>
            </div>
          </section>

          {/* Scene 3 */}
          <section className="space-y-4 border-l-4 border-emerald-500 pl-5 relative print:border-l-2 print:pl-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-wider font-mono">
                SCENE 3 • 1:25 – 1:55 (30 Seconds)
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Rubric: Technical Merit & Universal BYOPG
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              Universal Multi-Gateway Checkout & Instant Digital Voucher
            </h2>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                  Visual Action On Screen
                </span>
                <p className="text-slate-600 leading-relaxed">
                  1. Scroll through enabled gateways: Stripe, QRIS, Midtrans, Xendit, PayPal, Pay on Arrival.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  2. Complete payment &rarr; Instant redirect to Booking Success Voucher page with scannable QR code and itemized transport details.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  3. Quick click on "Track Booking" to demonstrate zero-friction self-service lookup.
                </p>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/60 space-y-2">
                <span className="font-bold text-emerald-900 block uppercase tracking-wider text-[10px]">
                  Voiceover Script
                </span>
                <p className="text-emerald-950 italic leading-relaxed">
                  "Tripbone features a Universal BYOPG architecture. Operators can enable Stripe, Midtrans QRIS, Xendit, PayPal, and Pay-on-Arrival simultaneously—supporting multi-currency conversions for global travelers. Instantly, a tamper-proof digital travel voucher with a scannable check-in QR code is generated, and customers can self-track their booking status without needing to create an account."
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md">Badge: BYOPG: Stripe, QRIS, Midtrans, Xendit</span>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md">Badge: Scannable Check-In QR</span>
            </div>
          </section>

          {/* Scene 4 */}
          <section className="space-y-4 border-l-4 border-sky-500 pl-5 relative print:border-l-2 print:pl-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-black text-sky-600 uppercase tracking-wider font-mono">
                SCENE 4 • 1:55 – 2:30 (35 Seconds)
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Rubric: Innovation & Operator Productivity (25%)
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              The Operator OS, TinyFish Pricing Intelligence & Website Builder
            </h2>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                  Visual Action On Screen
                </span>
                <p className="text-slate-600 leading-relaxed">
                  1. Switch to Admin Dashboard (<code className="font-mono text-primary font-bold">/admin</code>): Show revenue charts, driver/guide assignment workflow.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  2. Showcase TinyFish OTA competitor rate scraper extracting live OTA market rates.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  3. Open Website Builder / Theme Customizer: Change primary brand color, showing instant site-wide adaptation.
                </p>
              </div>

              <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-200/60 space-y-2">
                <span className="font-bold text-sky-900 block uppercase tracking-wider text-[10px]">
                  Voiceover Script
                </span>
                <p className="text-sky-950 italic leading-relaxed">
                  "For the tour operator, Tripbone is a complete operating system: managing bookings, assigning drivers and guides, issuing tickets, and monitoring cash flow in real time. With our integrated TinyFish market intelligence, operators can scrape and monitor live competitor prices across major OTAs, keeping their direct rates competitive automatically. And with our built-in Website Builder, operators can fully customize their branding colors, typography, and domain in seconds."
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
              <span className="px-2.5 py-1 bg-sky-100 text-sky-800 rounded-md">Badge: Multi-Tenant Operating System</span>
              <span className="px-2.5 py-1 bg-sky-100 text-sky-800 rounded-md">Badge: TinyFish OTA Price Intelligence</span>
              <span className="px-2.5 py-1 bg-sky-100 text-sky-800 rounded-md">Badge: Real-Time Theming Engine</span>
            </div>
          </section>

          {/* Scene 5 */}
          <section className="space-y-4 border-l-4 border-indigo-600 pl-5 relative print:border-l-2 print:pl-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-wider font-mono">
                SCENE 5 • 2:30 – 2:55 (25 Seconds)
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Rubric: Technical Architecture & Grand Finale Call
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              Google Cloud Native Architecture & Closing Call
            </h2>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                  Visual Action On Screen
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Full-screen Architecture Diagram: React SPA &rarr; Google Cloud Run (Node API) &rarr; Firebase Firestore & Auth &rarr; Google Gemini 2.5 Flash & Maps Platform.
                </p>
                <p className="text-slate-600 leading-relaxed font-medium">
                  &rarr; Clean closing screen with Live Demo URL, GitHub badge, and Singapore Grand Finale graphic.
                </p>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200/60 space-y-2">
                <span className="font-bold text-indigo-900 block uppercase tracking-wider text-[10px]">
                  Voiceover Script
                </span>
                <p className="text-indigo-950 italic leading-relaxed">
                  "Tripbone is 100% cloud-native, built with Google Cloud Run, Firebase Firestore, Google Maps Platform, and the Gemini API—delivering sub-second latency, enterprise multi-tenant isolation, and scale-to-zero efficiency. Tripbone democratizes enterprise travel tech for thousands of operators across the region. Thank you, and see you in Singapore at the Google Cloud AI Builder Cup Grand Finale!"
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-md">Badge: Google Cloud Run + Firebase Firestore</span>
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-md">Badge: See You in Singapore 2026!</span>
            </div>
          </section>

          {/* Submission Checklist Summary Box */}
          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 print:bg-white print:border-t-2 print:border-black">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Recording & Submission Checklist
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Video Duration:</strong> Keep strictly under 3 minutes (Target: 2:55).</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Resolution:</strong> 1080p (1920x1080) at 60fps with 110% zoom.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Audio:</strong> High-clarity vocal recording with low background synth music (10%).</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Hosting:</strong> Upload as Unlisted/Public to YouTube or Vimeo.</span>
              </div>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
