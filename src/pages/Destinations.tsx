import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from '../lib/firebase';
import { LocationMeta } from '../types';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Search, Compass, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../lib/SettingsContext';
import { formatPageTitle } from '../lib/seoUtils';
import { useDynamicPage } from '../hooks/useDynamicPage';
import DynamicPageLayout from '../components/DynamicPageLayout';

const DEFAULT_DESTINATIONS: LocationMeta[] = [
  {
    id: 'ubud-default',
    name: 'Ubud',
    featuredImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    description: 'The cultural and artistic heart of Bali, famous for lush rice terraces, sacred monkey forests, ancient temples, artisan markets, and wellness retreats.'
  },
  {
    id: 'nusa-penida-default',
    name: 'Nusa Penida',
    featuredImage: 'https://images.unsplash.com/photo-1537953773315-221350741d53?auto=format&fit=crop&w=1200&q=80',
    description: 'An exotic island off Bali’s southeast coast featuring dramatic coastal cliffs, crystal-clear turquoise waters, Kelingking T-Rex beach, and manta ray snorkeling.'
  },
  {
    id: 'uluwatu-default',
    name: 'Uluwatu',
    featuredImage: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    description: 'Perched on high limestone cliffs, renowned for ocean sunset panoramas, historic cliffside temples, surf breaks, and authentic Kecak Fire Dance shows.'
  },
  {
    id: 'kintamani-default',
    name: 'Kintamani & Mount Batur',
    featuredImage: 'https://images.unsplash.com/photo-1518548419070-2c61b179ad65?auto=format&fit=crop&w=1200&q=80',
    description: 'Highland volcanic district centered around Mount Batur and Lake Batur, offering early morning sunrise treks and soothing geothermal hot springs.'
  },
  {
    id: 'seminyak-default',
    name: 'Seminyak & Canggu',
    featuredImage: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=1200&q=80',
    description: 'Bustling coastal havens known for trendy beach clubs, artisan coffee cafes, vibrant night spots, boutique shops, and world-class surf spots.'
  },
  {
    id: 'nusa-dua-default',
    name: 'Nusa Dua',
    featuredImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    description: 'Tranquil luxury enclave featuring pristine white-sand beaches, calm swimming waters, beachside dining, and premium beachfront resorts.'
  }
];

export default function Destinations() {
  const { settings } = useSettings();
  const { pageData } = useDynamicPage('destinations');
  const [locations, setLocations] = useState<LocationMeta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const pageTitle = formatPageTitle('Our Destinations', settings?.siteName || 'Bali Adventours', settings?.pageTitleFormat);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'locationMeta'), (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LocationMeta));
      setLocations(fetched);
      setLoading(false);
    }, (error) => {
      console.warn("Error loading locationMeta from Firestore:", error);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Merge Firestore data with default fallback items if Firestore has fewer items
  const displayLocations = useMemo(() => {
    if (locations.length > 0) {
      return locations;
    }
    return DEFAULT_DESTINATIONS;
  }, [locations]);

  const filteredLocations = useMemo(() => {
    if (!searchTerm.trim()) return displayLocations;
    const term = searchTerm.toLowerCase();
    return displayLocations.filter(loc => 
      loc.name.toLowerCase().includes(term) || 
      (loc.description && loc.description.toLowerCase().includes(term))
    );
  }, [displayLocations, searchTerm]);

  if (pageData && pageData.content) {
    return (
      <DynamicPageLayout
        fallbackTitle="Our Destinations"
        {...pageData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`Explore top handpicked destinations with ${settings?.siteName || 'Bali Adventours'}. From Ubud's jungles to Uluwatu's cliffs and Nusa Penida.`} />
      </Helmet>

      {/* Hero */}
      <section className="relative bg-gray-900 pt-36 pb-20 overflow-hidden px-4">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative container mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black tracking-widest uppercase">
            <Compass className="h-4 w-4" />
            <span>{pageData?.pillTitle || "Discover Tropical Paradises"}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            {pageData?.title || "Explore Handpicked Destinations"}
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto font-medium text-base sm:text-lg leading-relaxed">
            {pageData?.subtitle || `From the emerald jungles of Ubud to the turquoise bays of Nusa Penida, immerse yourself in extraordinary sights across ${settings?.siteName || 'Bali'}.`}
          </p>

          {/* Search bar */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search destinations by region or key highlight..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-md text-white placeholder-gray-400 text-sm font-medium pl-12 pr-4 py-4 rounded-2xl border border-white/15 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xl"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="container mx-auto px-4 py-16 sm:py-20 max-w-7xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <span>Popular Regions</span>
              <Sparkles className="h-5 w-5 text-primary" />
            </h2>
            <p className="text-gray-500 text-sm font-medium mt-1">
              Showing {filteredLocations.length} featured {filteredLocations.length === 1 ? 'destination' : 'destinations'}
            </p>
          </div>
        </div>

        {filteredLocations.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto space-y-4">
            <div className="h-16 w-16 bg-orange-50 rounded-2xl flex items-center justify-center text-primary mx-auto">
              <MapPin className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-gray-900">No destinations match your search</h3>
            <p className="text-xs text-gray-500">Try searching for a different keyword or view all destinations.</p>
            <button
              onClick={() => setSearchTerm('')}
              className="bg-primary text-white font-black text-xs px-6 py-3 rounded-xl shadow-md hover:bg-orange-600 transition-colors"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLocations.map((loc, i) => {
              let rawImage = loc.featuredImage || loc.image || loc.imageUrl;
              if (rawImage && rawImage.startsWith('api/')) {
                rawImage = '/' + rawImage;
              }
              const imageSrc = rawImage || `https://picsum.photos/seed/${encodeURIComponent(loc.name.toLowerCase())}/800/1000`;
              const description = loc.description || `Discover the breathtaking natural beauty, local culture, and memorable tour experiences in ${loc.name}.`;

              return (
                <div 
                  key={loc.id || i} 
                  className="group relative bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col"
                >
                  {/* Featured Image Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                    <img 
                      src={imageSrc} 
                      alt={loc.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md text-gray-900 rounded-full text-[11px] font-black shadow-sm">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span>{loc.name}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-primary transition-colors">
                        {loc.name}
                      </h3>
                      <p className="text-xs text-gray-600 font-medium leading-relaxed line-clamp-3">
                        {description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Guided Experiences</span>
                      <Link 
                        to={`/tours?location=${encodeURIComponent(loc.id)}`}
                        className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-white px-4 py-2.5 rounded-xl font-black text-xs transition-all duration-300"
                      >
                        <span>View Tours</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer Banner */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-orange-50 text-primary mx-auto">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Need a Custom Itinerary?</h3>
          <p className="text-gray-500 font-medium text-sm sm:text-base max-w-xl mx-auto">
            Whether you want a multi-day island hopping adventure or a tailored day tour across top locations, our local experts are ready to build your dream trip.
          </p>
          <div>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-primary text-white font-black text-xs px-8 py-4 rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all active:scale-95"
            >
              <span>Contact Travel Specialist</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

