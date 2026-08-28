import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, onSnapshot, db } from '../lib/firebase';
import { PageContent, LandingPageSection, LandingPageFeatureItem } from '../types';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../lib/SettingsContext';
import { formatPageTitle } from '../lib/seoUtils';
import { 
  ShieldCheck, 
  Star, 
  CheckCircle, 
  Clock, 
  Award, 
  Heart, 
  Users, 
  Zap, 
  Headphones, 
  Compass, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Phone, 
  Mail, 
  Sparkles, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import TourCard from '../components/TourCard';
import ElfsightWidget from '../components/Home/ElfsightWidget';

const FEATURE_ICONS: { [key: string]: any } = {
  ShieldCheck,
  Star,
  CheckCircle,
  Clock,
  Award,
  Heart,
  Users,
  Zap,
  Headphones,
  Compass,
  Calendar,
  DollarSign,
  MapPin,
  Sparkles
};

export default function CustomPageView() {
  const { slug } = useParams<{ slug: string }>();
  const { settings } = useSettings();
  const [page, setPage] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [toursList, setToursList] = useState<any[]>([]);

  // Fetch page data by slug
  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const q = query(collection(db, 'pages'), where('slug', '==', slug));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data() as PageContent;
        setPage({ id: snapshot.docs[0].id, ...docData });
      } else {
        setPage(null);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return unsubscribe;
  }, [slug]);

  // Fetch all published tours for featured tours grid
  useEffect(() => {
    const unsubTours = onSnapshot(collection(db, 'tours'), (snapshot) => {
      setToursList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubTours;
  }, []);

  // Execute external Elfsight scripts if embedded
  useEffect(() => {
    if (!page?.isLandingPage) return;
    const reviewSec = page.sections?.find(s => s.type === 'reviews' && s.enabled);
    if (reviewSec?.reviewsEmbedCode && reviewSec.reviewsEmbedCode.includes('elfsight')) {
      // Inject Elfsight platform script if not present
      if (!document.querySelector('script[src*="elfsight"]')) {
        const script = document.createElement('script');
        script.src = 'https://static.elfsight.com/platform/platform.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [page]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">404 - Page Not Found</h1>
        <p className="text-gray-500 font-medium text-sm mb-6 max-w-md">
          The requested landing page dynamic slug could not be located.
        </p>
        <Link
          to="/"
          className="bg-primary text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const pageTitle = formatPageTitle(page.seo?.title || page.title, settings?.siteName || 'Bali Adventours', settings?.pageTitleFormat);

  // STANDARD STATIC PAGE VIEW (Terms, Privacy, etc)
  if (!page.isLandingPage) {
    return (
      <>
        <Helmet>
          <title>{pageTitle}</title>
          {page.seo?.description && <meta name="description" content={page.seo.description} />}
        </Helmet>
        <div className="min-h-screen bg-white py-16 px-4 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{page.title}</h1>
            <div 
              className="prose prose-lg max-w-none font-medium text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: page.content || '' }}
            />
          </div>
        </div>
      </>
    );
  }

  // TENANT LANDING PAGE BLOCK VIEW
  const enabledSections = (page.sections || []).filter(s => s.enabled);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        {page.seo?.description && <meta name="description" content={page.seo.description} />}
      </Helmet>

      <div className="bg-white min-h-screen">
        {enabledSections.map((sec) => {
          
          {/* HERO SECTION */}
          if (sec.type === 'hero') {
            return (
              <section key={sec.id} className="relative bg-gray-950 text-white min-h-[520px] md:min-h-[620px] flex items-center justify-center overflow-hidden py-24 px-4">
                {sec.heroImage && (
                  <img 
                    src={sec.heroImage} 
                    alt={sec.heroTitle || 'Hero Banner'} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {/* Overlay */}
                <div 
                  className={cn(
                    "absolute inset-0 bg-black",
                    sec.heroOverlay === 'light' ? "bg-opacity-30" :
                    sec.heroOverlay === 'dark' ? "bg-opacity-70" :
                    sec.heroOverlay === 'gradient' ? "bg-gradient-to-t from-black via-black/50 to-transparent" :
                    "bg-opacity-50"
                  )}
                />

                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 backdrop-blur-md border border-primary/40 rounded-full text-primary text-xs font-black uppercase tracking-widest shadow-lg">
                    <Sparkles className="h-3.5 w-3.5" /> Official Tenant Landing Page
                  </span>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md">
                    {sec.heroTitle}
                  </h1>
                  {sec.heroSubtitle && (
                    <p className="text-base md:text-xl text-gray-200 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow">
                      {sec.heroSubtitle}
                    </p>
                  )}
                  {sec.heroCtaText && (
                    <div className="pt-4">
                      <a
                        href={sec.heroCtaLink || '#tours-grid'}
                        className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-500/30 hover:bg-orange-600 hover:scale-105 transition-all cursor-pointer"
                      >
                        {sec.heroCtaText} <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          {/* PARAGRAPH INTRODUCTION SECTION */}
          if (sec.type === 'intro') {
            return (
              <section key={sec.id} className="py-20 px-4 lg:px-8 bg-gray-50/60 border-b border-gray-100">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                  {sec.introTitle && (
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                      {sec.introTitle}
                    </h2>
                  )}
                  {sec.introContent && (
                    <p className="text-gray-600 font-medium text-base md:text-lg leading-relaxed whitespace-pre-line">
                      {sec.introContent}
                    </p>
                  )}
                </div>
              </section>
            );
          }

          {/* LIST OF TOURS SECTION (COLUMNS) */}
          if (sec.type === 'tours') {
            const selectedTours = (sec.selectedTourIds || [])
              .map(id => toursList.find(t => t.id === id))
              .filter(Boolean);

            const toursToDisplay = selectedTours.length > 0 ? selectedTours : toursList.slice(0, 6);

            return (
              <section key={sec.id} id="tours-grid" className="py-20 px-4 lg:px-8 max-w-7xl mx-auto space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                    {sec.toursTitle || 'Our Recommended Tours'}
                  </h2>
                  {sec.toursSubtitle && (
                    <p className="text-gray-500 font-medium text-sm md:text-base">
                      {sec.toursSubtitle}
                    </p>
                  )}
                </div>

                <div 
                  className={cn(
                    "grid gap-8",
                    sec.toursColumns === 2 ? "grid-cols-1 md:grid-cols-2" :
                    sec.toursColumns === 4 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" :
                    "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  )}
                >
                  {toursToDisplay.map((tour) => (
                    <TourCard key={tour.id} tour={tour} />
                  ))}
                </div>

                {toursToDisplay.length === 0 && (
                  <p className="text-center text-gray-400 font-bold py-8">
                    No tours available to display at this moment.
                  </p>
                )}
              </section>
            );
          }

          {/* FEATURES LIST SECTION (WHY BOOK WITH US) */}
          if (sec.type === 'features') {
            return (
              <section key={sec.id} className="py-20 px-4 lg:px-8 bg-gradient-to-b from-orange-50/50 to-white border-y border-gray-100">
                <div className="max-w-6xl mx-auto space-y-12">
                  <div className="text-center max-w-2xl mx-auto space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full">
                      Guaranteed Standards
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                      {sec.featuresTitle || 'Why Book With Us'}
                    </h2>
                    {sec.featuresSubtitle && (
                      <p className="text-gray-500 font-medium text-sm">
                        {sec.featuresSubtitle}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {sec.features?.map((feat) => {
                      const Icon = FEATURE_ICONS[feat.icon || 'CheckCircle'] || CheckCircle;
                      return (
                        <div 
                          key={feat.id} 
                          className="bg-white p-6 rounded-[22px] border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4 group hover:-translate-y-1"
                        >
                          <div className="h-12 w-12 rounded-2xl bg-orange-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-black text-base text-gray-900 tracking-tight">{feat.title}</h3>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2">{feat.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          }

          {/* REVIEW LIST SECTION (ELFSIGHT CODE EMBED) */}
          if (sec.type === 'reviews') {
            return (
              <section key={sec.id} className="py-20 px-4 lg:px-8 max-w-6xl mx-auto space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                    {sec.reviewsTitle || 'Guest Reviews'}
                  </h2>
                  {sec.reviewsSubtitle && (
                    <p className="text-gray-500 font-medium text-sm">
                      {sec.reviewsSubtitle}
                    </p>
                  )}
                </div>

                {/* Elfsight Widget Container or Fallback Cards */}
                {sec.reviewsEmbedCode && sec.reviewsEmbedCode.trim().length > 5 ? (
                  <ElfsightWidget embedCode={sec.reviewsEmbedCode} />
                ) : (
                  /* Fallback Reviews Cards */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { name: 'Sarah & Mark (UK)', rating: 5, text: 'The absolute highlight of our trip to Bali! Our guide was deeply knowledgeable, friendly, and took us to spots away from tourist crowds.' },
                      { name: 'Alexandre R. (France)', rating: 5, text: 'Top-tier service from pickup to dropoff. Pristine luxury vehicle and private customization made everything perfect.' },
                      { name: 'Elena V. (Australia)', rating: 5, text: 'Booking with Bali Adventours was super smooth. Direct communication via WhatsApp made us feel 100% safe and cared for.' }
                    ].map((rev, i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                        <div className="flex text-amber-400 gap-1">
                          {[...Array(5)].map((_, idx) => <Star key={idx} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                        </div>
                        <p className="text-xs text-gray-600 font-medium leading-relaxed italic">"{rev.text}"</p>
                        <p className="text-xs font-black text-gray-900 pt-2 border-t border-gray-100">— {rev.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          }

          {/* CONTACT INFORMATION & MAPS EMBED SECTION */}
          if (sec.type === 'contact') {
            return (
              <section key={sec.id} className="py-20 px-4 lg:px-8 bg-gray-900 text-white border-t border-gray-800">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                        Reach Out Anytime
                      </span>
                      <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mt-3">
                        {sec.contactTitle || 'Contact Us'}
                      </h2>
                      {sec.contactSubtitle && (
                        <p className="text-gray-400 font-medium text-sm mt-2">
                          {sec.contactSubtitle}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 pt-4">
                      {sec.contactPhone && (
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/60 border border-gray-800">
                          <Phone className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="text-[10px] font-black uppercase text-gray-400">Call Us Direct</p>
                            <p className="text-sm font-bold text-white">{sec.contactPhone}</p>
                          </div>
                        </div>
                      )}

                      {sec.contactEmail && (
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/60 border border-gray-800">
                          <Mail className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="text-[10px] font-black uppercase text-gray-400">Email Inquiry</p>
                            <p className="text-sm font-bold text-white">{sec.contactEmail}</p>
                          </div>
                        </div>
                      )}

                      {sec.contactAddress && (
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/60 border border-gray-800">
                          <MapPin className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="text-[10px] font-black uppercase text-gray-400">Office Location</p>
                            <p className="text-sm font-bold text-white">{sec.contactAddress}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Google Maps Embed */}
                  <div className="h-[380px] rounded-3xl overflow-hidden border border-gray-800 bg-gray-800 shadow-2xl">
                    {sec.contactMapEmbedUrl ? (
                      <iframe 
                        src={sec.contactMapEmbedUrl}
                        className="w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 font-bold text-xs">
                        [Google Maps Location Embed]
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          }

          return null;
        })}
      </div>
    </>
  );
}
