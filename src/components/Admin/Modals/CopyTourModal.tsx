import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check } from "lucide-react";
import { Tour } from "../../../types";
import { cn } from "../../../lib/utils";

interface CopyOptions {
  itinerary: boolean;
  pricing: boolean;
  inclusions: boolean;
  exclusions: boolean;
  info: boolean;
  faq: boolean;
  seo: boolean;
  addOns: boolean;
  transports: boolean;
}

interface CopyTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  tours: Tour[];
  selectedSourceId: string;
  setSelectedSourceId: (id: string) => void;
  copyOptions: CopyOptions;
  setCopyOptions: React.Dispatch<React.SetStateAction<CopyOptions>>;
  onExecuteCopy: () => void;
}

export const CopyTourModal: React.FC<CopyTourModalProps> = ({
  isOpen,
  onClose,
  tours,
  selectedSourceId,
  setSelectedSourceId,
  copyOptions,
  setCopyOptions,
  onExecuteCopy,
}) => {
  if (!isOpen) return null;

  const toggleOption = (key: keyof CopyOptions) => {
    setCopyOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = () => {
    setCopyOptions({
      itinerary: true,
      pricing: true,
      inclusions: true,
      exclusions: true,
      info: true,
      faq: true,
      seo: true,
      addOns: true,
      transports: true,
    });
  };

  const deselectAll = () => {
    setCopyOptions({
      itinerary: false,
      pricing: false,
      inclusions: false,
      exclusions: false,
      info: false,
      faq: false,
      seo: false,
      addOns: false,
      transports: false,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-[32px] overflow-hidden shadow-2xl z-10"
        >
          <div className="bg-gradient-to-r from-teal-600 to-primary p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Copy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight font-sans">Fast Copy Elements</h3>
                <p className="text-teal-50 font-medium text-xs">
                  Instantly copy components of another tour and save valuable time.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block animate-pulse">
                Select Source Tour
              </label>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">-- Choose a tour to duplicate from --</option>
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  Select Modules to Overwrite
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300 text-xs">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-[10px] font-bold text-gray-400 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: "itinerary" as const, label: "Itinerary / Schedule" },
                  { key: "pricing" as const, label: "Pricing & Packages" },
                  { key: "inclusions" as const, label: "Included Services" },
                  { key: "exclusions" as const, label: "Excluded Services" },
                  { key: "info" as const, label: "Important Information" },
                  { key: "faq" as const, label: "Frequently Asked Questions" },
                  { key: "seo" as const, label: "SEO Meta Tags" },
                  { key: "addOns" as const, label: "Add-Ons" },
                  { key: "transports" as const, label: "Transport Options" },
                ].map((item) => {
                  const isSelected = !!copyOptions[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleOption(item.key)}
                      className={cn(
                        "p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer",
                        isSelected
                          ? "bg-primary/5 border-primary text-primary font-bold shadow-xs"
                          : "bg-gray-50/50 border-gray-100 text-gray-500 font-medium hover:bg-gray-50"
                      )}
                    >
                      <span className="text-xs truncate mr-1">{item.label}</span>
                      <div
                        className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-white"
                            : "border-gray-300 bg-white"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-8 py-4 rounded-xl border border-gray-100 font-black text-xs text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedSourceId || !Object.values(copyOptions).some(Boolean)}
                onClick={onExecuteCopy}
                className="flex-[2] bg-teal-600 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-100 hover:bg-teal-700 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Copy className="h-4 w-4" /> Copy Selected Modules
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CopyTourModal;
