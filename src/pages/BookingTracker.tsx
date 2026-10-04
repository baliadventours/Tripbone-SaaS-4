import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from '@/src/lib/firebase';
import { Booking } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { useSettings } from '../lib/SettingsContext';

export default function BookingTracker() {
  const { settings } = useSettings();
  const [searchParams] = useSearchParams();
  const [bookingId, setBookingId] = useState(searchParams.get('id') || '');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bookingId || !email) {
      setError('Please provide both Booking Reference and Email');
      return;
    }

    setLoading(true);
    setError(null);
    setBooking(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      let cleanId = bookingId.trim();
      if (cleanId.startsWith('#')) {
        cleanId = cleanId.substring(1).trim();
      }

      // 1. First attempt: call secure server tracking endpoint (handles both full IDs & 8-char short references)
      try {
        const res = await fetch('/api/track-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: cleanId, email: normalizedEmail })
        });
        const json = await res.json();
        if (res.ok && json.success && json.booking) {
          setBooking(json.booking);
          return;
        }
      } catch (apiErr) {
        console.warn('[Booking Tracker API Notice]', apiErr);
      }

      // 2. Fallback: direct doc get (for confirmed/direct docs)
      try {
        const docRef = doc(db, 'bookings', cleanId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Booking;
          const bEmail = (data.customerData?.email || (data as any).customerDetails?.email || (data as any).email || "").toLowerCase();
          if (bEmail === normalizedEmail) {
            setBooking({ id: docSnap.id, ...data });
            return;
          }
        }
      } catch (docErr) {
        console.warn('[Booking Tracker Direct Get Notice]', docErr);
      }

      setError('No booking found matching this reference and email address.');
    } catch (err: any) {
      console.error(err);
      setError('An error occurred while fetching the booking. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if ID is in URL (we still need email though)
  useEffect(() => {
    if (searchParams.get('id')) {
      setBookingId(searchParams.get('id') || '');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 font-sans">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter uppercase font-display italic">
            Booking <span className="text-primary tracking-normal not-italic">Tracker</span>
          </h1>
          <p className="text-gray-500 font-medium">Track your adventure status without an account</p>
        </div>

        {/* Search Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-8 md:p-12 shadow-2xl shadow-gray-200 mb-12 max-w-2xl mx-auto border border-gray-100"
        >
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Booking Ref</label>
                <div className="relative">
                  <Icons.Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                  <input 
                    type="text"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="e.g. ABC123XYZ"
                    className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl pl-12 pr-4 font-black transition-all focus:border-primary focus:bg-white outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full h-14 bg-gray-50 border-2 border-gray-50 rounded-2xl pl-12 pr-4 font-black transition-all focus:border-primary focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-sm uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Track My Booking <Icons.ArrowRight className="h-5 w-5" /></>
              )}
            </button>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-3"
                >
                  <Icons.AlertCircle className="h-4 w-4" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        {/* Results Area */}
        <AnimatePresence>
          {booking && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200 overflow-hidden border border-gray-100">
                {/* Status Bar */}
                <div className={`p-6 text-center ${
                  booking.status === 'confirmed' ? 'bg-orange-500' : 
                  booking.status === 'pending' ? 'bg-amber-500' : 
                  booking.status === 'review_required' ? 'bg-blue-500' : 'bg-gray-500'
                } text-white`}>
                  <div className="flex items-center justify-center gap-2">
                    {booking.status === 'confirmed' && <Icons.CheckCircle className="h-5 w-5" />}
                    {booking.status === 'pending' && <Icons.Clock className="h-5 w-5" />}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{booking.status.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="p-8 md:p-12">
                   <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
                      <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">{booking.tourTitle}</h2>
                        <span className="px-4 py-1.5 bg-gray-50 text-gray-500 font-bold text-[10px] rounded-lg border border-gray-100 uppercase tracking-widest">{booking.packageName}</span>
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Payment</span>
                         <span className="text-3xl font-black text-gray-900 tracking-tighter">{formatPrice(booking.totalAmount)}</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 p-8 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Date</span>
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{booking.date}</span>
                      </div>
                      <div className="space-y-1 border-l border-gray-200 pl-6">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Time</span>
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{booking.time || 'TBA'}</span>
                      </div>
                      <div className="space-y-1 border-l border-gray-200 pl-6">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Adults</span>
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{(booking.participants?.adults || 0)}</span>
                      </div>
                      <div className="space-y-1 border-l border-gray-200 pl-6">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Children</span>
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{(booking.participants?.children || 0)}</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      {booking.status === 'confirmed' ? (
                        <Link 
                          to={`/booking-success/${booking.id}`}
                          className="w-full h-16 bg-primary text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest hover:opacity-95 transition-all shadow-xl shadow-primary/20 cursor-pointer"
                        >
                          View Voucher <Icons.Ticket className="h-5 w-5" />
                        </Link>
                      ) : (
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                          <p className="text-xs font-bold text-amber-800 leading-relaxed text-center">
                            Your booking is still processing. Please check your email for payment instructions. Once paid, our team will verify and confirm your booking.
                          </p>
                        </div>
                      )}
                      
                      <div className="text-center pt-8">
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-4">Need help with this booking?</p>
                        <div className="flex justify-center gap-4">
                           <a href={`mailto:${settings?.supportEmail || 'info@gorillaatvadventure.com'}`} className="h-12 px-6 bg-white border border-gray-100 text-gray-900 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all">
                             <Icons.Mail className="h-4 w-4" /> Email Us
                           </a>
                           <Link to="/contact" className="h-12 px-6 bg-white border border-gray-100 text-gray-900 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all">
                             <Icons.MessageCircle className="h-4 w-4" /> Contact Support
                           </Link>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
