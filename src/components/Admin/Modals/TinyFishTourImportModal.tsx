import React, { useState } from 'react';
import { 
  Sparkles, Globe, Link, CheckCircle2, AlertCircle, Loader2, X, 
  ExternalLink, Eye, ArrowRight, DollarSign, Clock, MapPin, 
  ShieldCheck, Layers, Key, Check, Info
} from 'lucide-react';
import { Tour } from '../../../types';
import { cn } from '../../../lib/utils';

interface TinyFishTourImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (tour: Partial<Tour>) => void;
  onEditInForm?: (tour: Partial<Tour>) => void;
}

export const TinyFishTourImportModal: React.FC<TinyFishTourImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  onEditInForm
}) => {
  const [url, setUrl] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [extractedTour, setExtractedTour] = useState<Partial<Tour> | null>(null);
  const [extractionSource, setExtractionSource] = useState<'tinyfish' | 'fallback_crawler' | null>(null);

  if (!isOpen) return null;

  const handleStartExtraction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      setError('Please paste a valid tour or experience URL.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedTour(null);
    setProgressStep('Connecting to TinyFish Web Agent & unblocking page...');

    try {
      const stepTimer1 = setTimeout(() => {
        setProgressStep('Bypassing anti-bot protection & extracting live page content...');
      }, 2500);

      const stepTimer2 = setTimeout(() => {
        setProgressStep('Parsing itinerary, pricing tiers & image galleries into Tripbone schema...');
      }, 6000);

      const response = await fetch('/api/tinyfish/extract-tour', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url.trim(),
          apiKey: customApiKey.trim() || undefined
        })
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await response.json();

      if (!response.ok || !data.success || !data.tour) {
        throw new Error(data.error || 'Failed to extract tour information from the provided link.');
      }

      setExtractedTour(data.tour);
      setExtractionSource(data.source || 'tinyfish');
      setProgressStep('Extraction complete!');
    } catch (err: any) {
      console.error('[TinyFish Modal] Extraction error:', err);
      setError(err.message || 'An unexpected error occurred while communicating with TinyFish.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = (presetUrl: string) => {
    setUrl(presetUrl);
    setError(null);
  };

  const handleConfirmSave = () => {
    if (!extractedTour) return;
    onImportComplete(extractedTour);
    onClose();
  };

  const handleOpenInEditor = () => {
    if (!extractedTour) return;
    if (onEditInForm) {
      onEditInForm(extractedTour);
    } else {
      onImportComplete(extractedTour);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50/60 via-white to-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-gray-900 tracking-tight">1-Click OTA Tour Importer</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                  <Globe className="h-2.5 w-2.5" /> Powered by TinyFish.ai
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Paste any public tour link from Viator, GetYourGuide, TripAdvisor, Airbnb, or operator websites.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* URL Input Form */}
          <form onSubmit={handleStartExtraction} className="space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Tour or Experience Webpage URL
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="url"
                  placeholder="https://www.viator.com/tours/Bali/Mount-Batur-Sunrise-Trek/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="px-6 py-3 bg-primary hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extract Tour
                  </>
                )}
              </button>
            </div>

            {/* Quick sample suggestions */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-500">
              <span className="font-semibold text-gray-400 text-[11px]">Quick samples:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('https://www.viator.com/tours/Bali/Mount-Batur-Sunrise-Trek/d98-12345')}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-medium transition-colors"
              >
                Viator Sample
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('https://www.getyourguide.com/bali-l347/nusa-penida-island-tour-t12345')}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-medium transition-colors"
              >
                GetYourGuide Sample
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('https://www.airbnb.com/experiences/123456')}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-medium transition-colors"
              >
                Airbnb Sample
              </button>

              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="text-[11px] text-gray-500 hover:text-primary flex items-center gap-1 font-semibold"
                >
                  <Key className="h-3 w-3" />
                  {showKeyInput ? 'Hide API Key' : 'Custom TinyFish Key (Optional)'}
                </button>
              </div>
            </div>

            {/* Optional Custom API Key accordion */}
            {showKeyInput && (
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2 mt-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    TinyFish.ai API Key (BYOK)
                  </span>
                  <span className="text-[10px] text-gray-400">Leave blank to use platform pool</span>
                </div>
                <input
                  type="password"
                  placeholder="tf_live_..."
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </form>

          {/* Loading state indicator */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 bg-orange-50/40 rounded-2xl border border-orange-100 text-center animate-in fade-in">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-orange-200 border-t-primary animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-gray-900">{progressStep}</p>
                <p className="text-xs text-gray-500 max-w-md">
                  TinyFish's cloud browser agent is navigating the target URL, resolving dynamic scripts and extracting high-resolution media.
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && !isLoading && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs animate-in fade-in">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Extraction Unsuccessful</p>
                <p>{error}</p>
                <p className="text-[11px] text-rose-600 font-medium pt-1">
                  Tip: Ensure the URL points to a public experience listing, or try entering your custom TinyFish API key.
                </p>
              </div>
            </div>
          )}

          {/* Extracted Tour Preview Card */}
          {extractedTour && !isLoading && (
            <div className="space-y-4 border border-emerald-200/80 bg-emerald-50/20 rounded-2xl p-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-black text-gray-900">Extracted Tour Ready for Review</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    {extractionSource === 'tinyfish' ? 'Live TinyFish Agent' : 'Smart Web Extractor'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500 font-medium flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {extractedTour.duration}
                  </span>
                  <span className="text-gray-500 font-medium flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {extractedTour.location}
                  </span>
                </div>
              </div>

              {/* Main Tour Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Image Gallery Preview */}
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative group">
                  <img
                    src={extractedTour.gallery?.[0] || 'https://picsum.photos/seed/tour/600/400'}
                    alt={extractedTour.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {extractedTour.gallery && extractedTour.gallery.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      +{extractedTour.gallery.length} photos
                    </div>
                  )}
                </div>

                {/* Tour Core Details */}
                <div className="md:col-span-2 space-y-2.5">
                  <h4 className="text-base font-black text-gray-900 leading-snug">
                    {extractedTour.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                    {extractedTour.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-xs flex items-baseline gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Regular Price</span>
                      <span className="text-sm font-black text-primary">
                        ${extractedTour.regularPrice}
                      </span>
                    </div>

                    {extractedTour.discountPrice && (
                      <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-xs flex items-baseline gap-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Promo Price</span>
                        <span className="text-sm font-black text-emerald-600">
                          ${extractedTour.discountPrice}
                        </span>
                      </div>
                    )}

                    <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-xs flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Rating</span>
                      <span className="text-xs font-black text-amber-500">★ {extractedTour.rating || 4.9}</span>
                      <span className="text-[10px] text-gray-400">({extractedTour.reviewsCount || 80} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inclusions & Highlights Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1.5">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Inclusions ({extractedTour.inclusions?.length || 0})
                  </span>
                  <ul className="space-y-1 text-gray-600 text-[11px] list-disc list-inside">
                    {extractedTour.inclusions?.slice(0, 3).map((inc, i) => (
                      <li key={i} className="truncate">{inc}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1.5">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-orange-500" />
                    Itinerary Stops ({extractedTour.itinerary?.length || 0})
                  </span>
                  <ul className="space-y-1 text-gray-600 text-[11px] list-disc list-inside">
                    {extractedTour.itinerary?.slice(0, 3).map((item, i) => (
                      <li key={i} className="truncate">{item.title}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/70">
          <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />
            Extracted tours are saved in draft status and can be customized at any time.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>

            {extractedTour && (
              <>
                <button
                  type="button"
                  onClick={handleOpenInEditor}
                  className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Eye className="h-3.5 w-3.5 text-gray-500" />
                  Customize in Editor
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Save to Catalog
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
