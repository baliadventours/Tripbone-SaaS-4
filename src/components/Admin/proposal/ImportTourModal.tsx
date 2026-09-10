import React, { useState } from 'react';
import { X, Search, Package, Clock, ArrowRight, Check } from 'lucide-react';

interface ImportTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  tours: any[];
  onSelectTour: (tour: any) => void;
  currency: string;
  isDarkMode?: boolean;
}

export const ImportTourModal: React.FC<ImportTourModalProps> = ({
  isOpen,
  onClose,
  tours,
  onSelectTour,
  currency,
  isDarkMode = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredTours = tours.filter(t => {
    const q = searchTerm.toLowerCase();
    const title = (t.title || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    const loc = (t.location || '').toLowerCase();
    return title.includes(q) || desc.includes(q) || loc.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className={`w-full max-w-3xl rounded-3xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
          isDarkMode ? 'bg-[#111928] border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold">Import from Tour Catalog</h2>
              <p className="text-xs text-gray-500">
                Pre-fill days, activities, and standard inclusions from your published tours
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tours by name, region, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-gray-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Tours List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredTours.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Package className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-xs text-gray-400">No published tours found matching your search.</p>
            </div>
          ) : (
            filteredTours.map((tour) => {
              const days = tour.itinerary?.length || 1;
              const price = tour.price ? `${currency} ${Number(tour.price).toLocaleString()}` : 'Custom Rate';

              return (
                <div
                  key={tour.id}
                  className={`p-4 rounded-2xl border transition-all hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDarkMode ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-white border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-gray-900 dark:text-white truncate">
                        {tour.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-bold shrink-0">
                        {days} Day{days > 1 ? 's' : ''}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 line-clamp-1">
                      {tour.description || 'No description provided'}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-0.5">
                      <span className="font-extrabold text-orange-600 dark:text-orange-400">
                        Base: {price}
                      </span>
                      {tour.inclusions && tour.inclusions.length > 0 && (
                        <span>{tour.inclusions.length} Inclusions</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectTour(tour)}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <span>Import into Proposal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-400">
            Total {tours.length} tours in your catalog
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
