import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, ArrowRight, Ban } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Guide, Booking } from "../../../types";

interface AssignGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  allGuides: Guide[];
  bookings: Booking[];
  loading: boolean;
  onAssign: (booking: Booking, guide: Guide) => void;
}

export const AssignGuideModal: React.FC<AssignGuideModalProps> = ({
  isOpen,
  onClose,
  booking,
  allGuides,
  bookings,
  loading,
  onAssign,
}) => {
  if (!isOpen || !booking) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900">Assign Guide</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
              <X className="h-6 w-6" />
            </button>
          </div>

          <p className="text-sm text-gray-500 font-medium">
            Select a guide to send the tour details via WhatsApp.
          </p>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {allGuides.map((guide) => {
              const isAlreadyBooked = bookings.some(
                (b) =>
                  b.assignedGuideId === guide.id &&
                  b.date === booking.date &&
                  b.id !== booking.id &&
                  b.status !== "cancelled"
              );
              return (
                <button
                  key={guide.id}
                  disabled={isAlreadyBooked || loading}
                  onClick={() => onAssign(booking, guide)}
                  className={cn(
                    "w-full p-4 rounded-2xl border transition-all text-left group flex items-center justify-between",
                    isAlreadyBooked || loading
                      ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                      : "border-gray-100 hover:border-orange-500 hover:bg-orange-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center font-black transition-all",
                        isAlreadyBooked || loading
                          ? "bg-gray-200 text-gray-400"
                          : "bg-orange-50 text-primary group-hover:bg-primary group-hover:text-white"
                      )}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        guide.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "font-black",
                            isAlreadyBooked
                              ? "text-gray-400"
                              : "text-gray-900 group-hover:text-orange-700"
                          )}
                        >
                          {guide.name}
                        </p>
                        {isAlreadyBooked && (
                          <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                            Unavailable Today
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400">+{guide.whatsapp}</p>
                    </div>
                  </div>
                  {!isAlreadyBooked && (
                    <ArrowRight className="h-4 w-4 text-orange-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  )}
                  {isAlreadyBooked && <Ban className="h-4 w-4 text-gray-300" />}
                </button>
              );
            })}
            {allGuides.length === 0 && (
              <p className="text-center py-10 text-xs font-bold text-gray-400 uppercase tracking-widest">
                No active guides found.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AssignGuideModal;
