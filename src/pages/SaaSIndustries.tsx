import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Bike, Anchor, Utensils, Compass, Key, Mountain, 
  CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Zap, 
  ChevronRight, ArrowLeft
} from 'lucide-react';
import { useSettings } from '../lib/SettingsContext';

interface Industry {
  id: string;
  slugs: string[];
  name: string;
  badge: string;
  icon: React.ElementType;
  heroImg: string;
  tagline: string;
  description: string;
  keyFeatures: string[];
  painPointsSolved: string[];
  sampleSiteTitle: string;
  metaTitle: string;
  metaDesc: string;
}

const INDUSTRIES_DATA: Industry[] = [
  {
    id: 'day-tours',
    slugs: ['day-tours', 'day-tour', 'private-driver'],
    name: 'Day Tour & Private Driver Operators',
    badge: 'Full-Day Sightseeing & Custom Itineraries',
    icon: Compass,
    heroImg: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Automate driver dispatches, multi-stop itineraries, and deposit bookings.',
    description: 'The preferred choice for sightseeing agencies and driver associations. Offer instant online booking with customizable stops, deposit payments, and automated driver dispatch notifications.',
    keyFeatures: [
      'Custom Itinerary Builder with optional add-on attractions',
      'Automated driver assignment with WhatsApp contact sharing',
      'Deposit payment flow (Pay 20% online, balance cash to driver)',
      'Multi-language booking engine for international travelers'
    ],
    painPointsSolved: [
      'Eliminates endless WhatsApp negotiation messages before securing a deposit',
      'Automates driver assignment notifications night before the tour',
      'Tracks cash balances collected by drivers on the ground'
    ],
    sampleSiteTitle: 'Bali UNESCO Temples & Waterfall Day Tour',
    metaTitle: 'Website Builder & Booking Engine for Day Tour Operators | Tripbone',
    metaDesc: 'Launch your direct day tour website in 2 minutes. Accept online deposits, automate driver WhatsApp notifications, and eliminate OTA commissions.'
  },
  {
    id: 'atv-offroad',
    slugs: ['atv-offroad', 'atv', 'quad-bikes'],
    name: 'ATV & Quad Bike Operators',
    badge: 'Popular for Quad Bike & Buggy Operators',
    icon: Bike,
    heroImg: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Streamline waiver signatures, equipment inventory, and muddy trail departure slots.',
    description: 'Purpose-built for quad bike, buggy, and dirt bike operators. Eliminate front-desk bottlenecks with digital safety waivers, helmet size logging, and automated WhatsApp reminder notifications sent directly to riders.',
    keyFeatures: [
      'Digital Safety Waiver & Liability Signatures on mobile',
      'Engine & Equipment Maintenance logging per departure slot',
      'WhatsApp automated hotel pickup coordinates & driver details',
      'Instant group waiver status dashboard at base camp'
    ],
    painPointsSolved: [
      'No more paper waiver clipboards ruining morning departure times',
      'Prevents double-booking quad bikes during peak morning slots',
      'Automates driver assignment for hotel transfers'
    ],
    sampleSiteTitle: 'Bali ATV Jungle Quad Adventure',
    metaTitle: 'Website Builder & Booking System for ATV & Quad Bike Operators | Tripbone',
    metaDesc: 'Streamline ATV quad bike bookings, digital safety waivers, and hotel pickup logistics. No coding needed.'
  },
  {
    id: 'rafting-outdoor',
    slugs: ['rafting-outdoor', 'rafting', 'outdoor-adventure'],
    name: 'White Water Rafting & Adventure Operators',
    badge: 'Ziplines, Rafting, Canyoning & Parks',
    icon: Mountain,
    heroImg: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Timed entry tickets, QR code gate scanning, and gear size logs.',
    description: 'Power high-throughput adventure destinations like white water rafting, ziplining, and water parks. Generate instant QR code tickets for rapid gate admission and gear preparation.',
    keyFeatures: [
      'Timed slot entry booking to prevent arrival congestion',
      'Instant QR Code E-Tickets scanned on mobile at entry gate',
      'Group leader roster management for corporate or school outings',
      'Photo & Video package upsells directly at checkout'
    ],
    painPointsSolved: [
      'Eliminates long ticket counter queues with mobile QR check-in',
      'Pre-sizes harnesses, wetsuits, or life jackets before arrival',
      'Maximizes revenue with instant photo package add-on sales'
    ],
    sampleSiteTitle: 'Ayung River White Water Rafting Center',
    metaTitle: 'Booking System & Website Builder for Rafting & Adventure Operators | Tripbone',
    metaDesc: 'Empower white water rafting, zipline, and canyoning operators with digital waivers, timed entry QR tickets, and photo package add-ons.'
  },
  {
    id: 'boat-charters',
    slugs: ['boat-charters', 'boat', 'cruises'],
    name: 'Boat Charters & Cruise Operators',
    badge: 'Yachts, Catamarans & Snorkeling Boats',
    icon: Anchor,
    heroImg: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Manage captain manifests, tide-dependent schedules, and private island charters.',
    description: 'Designed for island hopping, catamaran cruises, and diving charters. Manage passenger manifests for port authority compliance, collect dietary requirements in advance, and handle tide-adjusted departure times with ease.',
    keyFeatures: [
      'Official Passenger Manifest generation for port authorities',
      'Tide & weather-contingent flexible scheduling alerts',
      'Meal preference & dietary restriction intake during checkout',
      'Private charter vs shared seat pricing engine'
    ],
    painPointsSolved: [
      'Automates harbor master manifest printing in one click',
      'Avoids refund chaos during sudden weather cancellations with instant reschedule links',
      'Seamless add-ons for snorkeling gear and private cabana upgrades'
    ],
    sampleSiteTitle: 'Nusa Penida Speedboat & Fast Boat Charters',
    metaTitle: 'Booking System & Website Builder for Boat Charters & Cruises | Tripbone',
    metaDesc: 'Manage passenger manifests, weather updates, and private boat charter bookings with zero booking fees.'
  },
  {
    id: 'food-culinary',
    slugs: ['food-culinary', 'food-tours', 'culinary'],
    name: 'Food & Culinary Walking Tour Operators',
    badge: 'Foodies, Cooking Schools & Market Walks',
    icon: Utensils,
    heroImg: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Coordinate local vendor stops, dietary intake, and intimate group caps.',
    description: 'Empower food tour guides, street food walks, and cooking classes. Keep small group sizes capped dynamically, track ingredient costs, and send automatic WhatsApp reminders with meeting point drop-pins.',
    keyFeatures: [
      'Dietary requirements & allergy intake (Vegan, Halal, Gluten-Free)',
      'Vendor headcount notifications via automated WhatsApp alerts',
      'Strict max-guest limits per guide for intimate group dynamics',
      'Interactive culinary map & recipe digital downloadable gifts'
    ],
    painPointsSolved: [
      'Prevents last-minute guest dietary surprises at local food stalls',
      'Notifies street vendors in advance of expected guest counts',
      'Boosts TripAdvisor & Google reviews automatically after tasting walks'
    ],
    sampleSiteTitle: 'Ubud Night Market & Culinary Walking Tour',
    metaTitle: 'Booking System & Website Builder for Food & Culinary Tours | Tripbone',
    metaDesc: 'Automate guest dietary restriction collecting, street vendor headcount dispatches, and review requests.'
  },
  {
    id: 'rentals',
    slugs: ['rentals', 'scooter-rental', 'equipment-rental'],
    name: 'Scooter, Bike & Equipment Rental Operators',
    badge: 'Motorbikes, E-Bikes & Surf Gear',
    icon: Key,
    heroImg: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Real-time fleet availability, hotel drop-offs, and digital security deposits.',
    description: 'Streamline your vehicle or gear rental operations. Manage real-time inventory calendars, track driver license uploads, and collect refundable security deposits effortlessly.',
    keyFeatures: [
      'Real-time vehicle fleet inventory tracking & conflict prevention',
      'Passport & Driver License document upload before key handoff',
      'Hotel delivery vs shop pickup selection at checkout',
      'Refundable security deposit holds via credit card or cash'
    ],
    painPointsSolved: [
      'Stops overbooking motorbikes during peak holiday seasons',
      'Speeds up check-in with pre-uploaded driving licenses',
      'Tracks vehicle return dates with automated WhatsApp reminder'
    ],
    sampleSiteTitle: 'Canggu Scooter & NMAX Rental Fleet',
    metaTitle: 'Booking & Fleet Management Website Builder for Rental Operators | Tripbone',
    metaDesc: 'Real-time vehicle inventory calendars, online license verification, and digital security deposits.'
  }
];

export default function SaaSIndustries() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { globalBrand } = useSettings();
  const brandColor = globalBrand?.brandColor || '#1db3cd';

  // Find matching industry if slug is provided
  const activeIndustry = slug 
    ? INDUSTRIES_DATA.find(ind => ind.id === slug || ind.slugs.includes(slug.toLowerCase())) 
    : null;

  const [selectedIndustry, setSelectedIndustry] = useState<Industry>(activeIndustry || INDUSTRIES_DATA[0]);

  useEffect(() => {
    if (activeIndustry) {
      setSelectedIndustry(activeIndustry);
    }
  }, [slug, activeIndustry]);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900">
      <Helmet>
        <title>
          {activeIndustry ? activeIndustry.metaTitle : 'Tailored Booking Solutions for Tour Operator Industries | Tripbone'}
        </title>
        <meta 
          name="description" 
          content={activeIndustry ? activeIndustry.metaDesc : "Discover how Tripbone provides industry-specific booking engines, digital waivers, and WhatsApp automation for ATV tours, boat charters, food walks, day tours, and rentals."} 
        />
      </Helmet>

      <style>{`
        .text-brand { color: ${brandColor} !important; }
        .bg-brand { background-color: ${brandColor} !important; }
        .border-brand { border-color: ${brandColor} !important; }
        .bg-brand-fade { background-color: ${brandColor}15 !important; }
      `}</style>

      {/* Hero Header */}
      <section className="bg-slate-950 text-white pt-36 sm:pt-40 pb-16 sm:pb-20 px-6 relative overflow-hidden border-b border-slate-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/20 to-emerald-500/15 rounded-full blur-[120px] pointer-events-none -z-0"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          {activeIndustry && (
            <div className="mb-6 flex justify-center">
              <Link to="/industries" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-700 transition-all">
                <ArrowLeft className="w-3.5 h-3.5 text-brand" />
                <span>All Industries</span>
              </Link>
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-bold text-slate-300 shadow-xs mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-brand" />
            <span>{activeIndustry ? activeIndustry.badge : 'Tailored For Your Specific Experience Vertical'}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
            {activeIndustry ? (
              <>
                Website Builder & Booking System for <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-[#1db3cd]">
                  {activeIndustry.name}
                </span>
              </>
            ) : (
              <>
                Built Specifically For Your <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-[#1db3cd]">
                  Tour & Activity Industry
                </span>
              </>
            )}
          </h1>

          <p className="text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {activeIndustry 
              ? activeIndustry.description 
              : "Generic booking software wasn't built for muddy quad bike waivers, tide-dependent boat manifests, or dietary restrictions. Tripbone provides specialized workflows for your exact experience business."}
          </p>
        </div>
      </section>

      {/* Main Content Body */}
      <div className="py-12 sm:py-16">
        
        {/* Industry Nav Pills */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex items-center justify-start md:justify-center gap-3 overflow-x-auto pb-4 scrollbar-none">
            {INDUSTRIES_DATA.map((ind) => {
              const Icon = ind.icon;
              const isSelected = selectedIndustry.id === ind.id;
              return (
                <button
                  key={ind.id}
                  onClick={() => {
                    setSelectedIndustry(ind);
                    navigate(`/industries/${ind.id}`);
                  }}
                  className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                    isSelected 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`} />
                  <span>{ind.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Industry Deep Dive Card */}
        <div className="max-w-7xl mx-auto px-6 mb-20">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Left Content Column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-block px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-full text-xs font-bold uppercase tracking-wider">
                  {selectedIndustry.badge}
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                  {selectedIndustry.name}
                </h2>

                <p className="text-base text-slate-700 font-semibold leading-relaxed italic border-l-4 border-brand pl-4 py-1">
                  "{selectedIndustry.tagline}"
                </p>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {selectedIndustry.description}
                </p>

                {/* Key Features */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Key Workflows Included:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedIndustry.keyFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-800 font-semibold">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pain Points Solved */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    Operational Bottlenecks Solved:
                  </h3>
                  <ul className="space-y-2">
                    {selectedIndustry.painPointsSolved.map((pain, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
                        <span>{pain}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Action Button */}
                <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
                  <Link
                    to="/signup"
                    className="w-full sm:w-auto px-8 py-4 rounded-xl text-white font-bold text-sm text-center shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: brandColor }}
                  >
                    <span>Try it Free (7 Days)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/directory"
                    className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm text-center transition-all border border-slate-200"
                  >
                    View Live Storefront Demos
                  </Link>
                </div>

              </div>

              {/* Right Hero Image Card Column */}
              <div className="lg:col-span-5">
                <div className="relative group rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100">
                  <img 
                    src={selectedIndustry.heroImg} 
                    alt={selectedIndustry.name}
                    className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                  <div className="absolute bottom-5 left-5 right-5 p-4 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Example Live Tenant</p>
                        <h4 className="text-sm font-black text-slate-900">{selectedIndustry.sampleSiteTitle}</h4>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-200">
                        Live
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Grid of All Industries */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Explore All Specialized Vertical Solutions</h3>
            <p className="text-slate-600 text-sm">Select any industry to see how Tripbone transforms your operations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {INDUSTRIES_DATA.map((ind) => {
              const Icon = ind.icon;
              return (
                <Link 
                  key={ind.id}
                  to={`/industries/${ind.id}`}
                  className="bg-white border border-slate-200 hover:border-brand/50 p-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg group block"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-5 group-hover:bg-brand-fade transition-colors">
                    <Icon className="w-6 h-6 text-brand" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand transition-colors flex items-center justify-between">
                    <span>{ind.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand transition-colors" />
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {ind.tagline}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand">
                    <span>Explore features</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-5xl mx-auto px-6 mt-20 text-center">
          <div className="bg-slate-900 text-white border border-slate-800 p-10 md:p-14 rounded-3xl shadow-2xl">
            <h2 className="text-3xl font-black text-white mb-4">Ready to Modernize Your Tour Business?</h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              Launch your custom brand website in under 2 minutes. Zero setup fees, 0% commission option, and instant WhatsApp booking workflow.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-sm shadow-xl hover:brightness-110 transition-all"
              style={{ backgroundColor: brandColor }}
            >
              <span>Try it Free (7 Days)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
