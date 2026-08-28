import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, CheckCircle, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils";

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryUrls: string[];
  loadingGallery: boolean;
  gallerySearch: string;
  setGallerySearch: (s: string) => void;
  galleryFilterTab: string;
  setGalleryFilterTab: (t: string) => void;
  gallerySelected: string[];
  setGallerySelected: React.Dispatch<React.SetStateAction<string[]>>;
  isMultiSelect: boolean;
  onConfirmSelection: () => void;
}

export const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({
  isOpen,
  onClose,
  galleryUrls,
  loadingGallery,
  gallerySearch,
  setGallerySearch,
  galleryFilterTab,
  setGalleryFilterTab,
  gallerySelected,
  setGallerySelected,
  isMultiSelect,
  onConfirmSelection,
}) => {
  if (!isOpen) return null;

  const filteredUrls = galleryUrls.filter((url) => {
    if (!gallerySearch) return true;
    return url.toLowerCase().includes(gallerySearch.toLowerCase());
  });

  const toggleSelectUrl = (url: string) => {
    if (isMultiSelect) {
      setGallerySelected((prev) =>
        prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
      );
    } else {
      setGallerySelected([url]);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 flex flex-col max-h-[90vh] z-10"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-primary flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                  Media Gallery Assets
                </h3>
                <p className="text-xs text-gray-400 font-bold">
                  {isMultiSelect
                    ? "Select one or multiple images to add to the tour gallery"
                    : "Select an image to use"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search images..."
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl w-full sm:w-auto">
              {["all", "tours", "blogs"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setGalleryFilterTab(tab)}
                  className={cn(
                    "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    galleryFilterTab === tab
                      ? "bg-white text-primary shadow-xs"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[450px] pr-1">
            {loadingGallery ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-xs font-bold text-gray-400">Loading image assets...</span>
              </div>
            ) : filteredUrls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ImageIcon className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-sm font-bold text-gray-500">No media assets found</p>
                <p className="text-xs text-gray-400">
                  Uploaded tour cover images and galleries will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredUrls.map((url, idx) => {
                  const isSelected = gallerySelected.includes(url);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelectUrl(url)}
                      className={cn(
                        "group relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all",
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 scale-[0.98]"
                          : "border-transparent hover:border-gray-200"
                      )}
                    >
                      <img
                        src={url}
                        alt="Gallery asset"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div
                        className={cn(
                          "absolute inset-0 transition-opacity flex items-center justify-center",
                          isSelected
                            ? "bg-primary/20 opacity-100"
                            : "bg-black/30 opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <CheckCircle
                          className={cn(
                            "w-6 h-6 transition-all",
                            isSelected ? "text-primary fill-white scale-110" : "text-white"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-xs font-bold text-gray-400">
              {gallerySelected.length} {gallerySelected.length === 1 ? "image" : "images"} selected
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-100 text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={gallerySelected.length === 0}
                onClick={onConfirmSelection}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Use Selected ({gallerySelected.length})
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MediaGalleryModal;
