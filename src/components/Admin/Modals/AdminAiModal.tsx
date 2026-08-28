import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Wand2, Lightbulb, Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils";

interface AdminAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  aiPrompt: string;
  setAiPrompt: (p: string) => void;
  aiGenMode: "partial" | "complete";
  setAiGenMode: (m: "partial" | "complete") => void;
  isAiBuilding: boolean;
  onGenerate: () => void;
}

export const AdminAiModal: React.FC<AdminAiModalProps> = ({
  isOpen,
  onClose,
  isEditing,
  aiPrompt,
  setAiPrompt,
  aiGenMode,
  setAiGenMode,
  isAiBuilding,
  onGenerate,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isAiBuilding && onClose()}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-[32px] overflow-hidden shadow-2xl"
        >
          <div className="bg-primary p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">AI Tour Magic</h3>
                <p className="text-white/80 font-medium text-sm">
                  Describe your tour, we will build the details.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Wand2 className="h-3 w-3" /> Your Tour Prompt or Itinerary
              </label>
              <textarea
                rows={6}
                placeholder="e.g. Create a 3-day luxury tour in Ubud featuring Tegalalang Rice Terrace, Monkey Forest, and private yoga sessions. High-end dining included."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full rounded-2xl border-2 border-gray-100 p-6 focus:border-primary focus:outline-none bg-gray-50/50 transition-all font-medium text-sm leading-relaxed"
              />
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl">
                <Lightbulb className="h-5 w-5 text-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-[11px] text-orange-800 font-bold leading-relaxed">
                    Best Prompt Tip:
                  </p>
                  <p className="text-[10px] text-orange-700/80 font-medium leading-relaxed">
                    Tell a story about a day in Bali. We will start with coffee at a local farm, hike the ridge, and finish with a sunset dinner.
                  </p>
                  <p className="text-[9px] text-primary/60 mt-1">
                    *AI will automatically format Pick-up, Highlights, and Itinerary.
                  </p>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="space-y-2 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  AI Generation Mode
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setAiGenMode("partial")}
                    className={cn(
                      "px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                      aiGenMode === "partial"
                        ? "bg-primary text-white border-primary shadow-md shadow-orange-100"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    Rewrite Details Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiGenMode("complete")}
                    className={cn(
                      "px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                      aiGenMode === "complete"
                        ? "bg-primary text-white border-primary shadow-md shadow-orange-100"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    Complete Rebuild
                  </button>
                </div>
                <p className="text-[9.5px] text-gray-400 font-semibold leading-relaxed mt-1">
                  {aiGenMode === "partial"
                    ? "AI updates description, highlights, inclusions, exclusions, and terms. Preserves existing packages (pricing) and daily itinerary."
                    : "AI completely replaces every single setting of this tour with freshly generated content, including Title and Itinerary."}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                disabled={isAiBuilding}
                onClick={onClose}
                className="flex-1 px-8 py-4 rounded-xl border border-gray-100 font-black text-xs text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isAiBuilding || !aiPrompt.trim()}
                onClick={onGenerate}
                className="flex-[2] bg-primary text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAiBuilding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mastering Your Tour...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Tour Magic
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminAiModal;
