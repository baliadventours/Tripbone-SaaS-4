import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from '@/src/lib/firebase';
import { Booking } from '../types';
import * as Icons from 'lucide-react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import FormattedPrice from '../components/FormattedPrice';
import { motion } from 'motion/react';
import { useSettings } from '../lib/SettingsContext';
import QRCode from 'react-qr-code';
import { getWhatsAppLink, generateBookingMessage } from '../lib/whatsappService';
import { collection, onSnapshot, query, where, limit } from '@/src/lib/firebase';
import { parseMeetingPoint } from '../lib/utils';
import { trackGAPurchase } from '../lib/googleAnalytics';
import { trackPostHogPurchase } from '../lib/posthog';

export default function BookingSuccess() {
  const { settings } = useSettings();
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [tour, setTour] = useState<any>(null);
  const [commSettings, setCommSettings] = useState<any>(null);

  useEffect(() => {
    // Fetch communication settings for WA templates
    const unsub = onSnapshot(doc(db, 'communicationSettings', 'global'), (snap) => {
      if (snap.exists()) setCommSettings(snap.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const [bookingSnap, settingsSnap] = await Promise.all([
          getDoc(doc(db, 'bookings', id)),
          getDoc(doc(db, 'settings', 'payment'))
        ]);

        if (bookingSnap.exists()) {
          const bookingData = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
          setBooking(bookingData);
          
          // Fire Google Ads, GA4 & GTM Conversion Tracking event once per booking session
          try {
            const sessionKey = `tb_tracked_booking_${bookingData.id}`;
            if (typeof window !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
              trackGAPurchase({
                id: bookingData.id,
                tourTitle: bookingData.tourTitle || 'Tour Booking',
                totalAmount: Number(bookingData.totalAmount || (bookingData as any).totalPrice) || 0,
                paymentMethod: bookingData.paymentMethod || 'online',
                currency: (bookingData as any).currency || 'USD',
                participants: ((bookingData as any).adults || 0) + ((bookingData as any).children || 0) || (bookingData as any).participants || 1,
                customerEmail: (bookingData as any).customerDetails?.email || (bookingData as any).customerData?.email || (bookingData as any).userEmail
              });
              trackPostHogPurchase({
                bookingId: bookingData.id,
                totalAmount: Number(bookingData.totalAmount || (bookingData as any).totalPrice) || 0,
                currency: (bookingData as any).currency || 'USD',
                tourTitle: bookingData.tourTitle || 'Tour Booking',
                customerEmail: (bookingData as any).customerDetails?.email || (bookingData as any).customerData?.email || (bookingData as any).userEmail,
                paymentMethod: bookingData.paymentMethod || 'online'
              });
              sessionStorage.setItem(sessionKey, '1');
            }
          } catch (trackErr) {
            console.warn('[Analytics] Conversion tracking notice:', trackErr);
          }

          if (bookingData.tourId) {
            const tourSnap = await getDoc(doc(db, 'tours', bookingData.tourId));
            if (tourSnap.exists()) {
              setTour(tourSnap.data());
            }
          }
        }
        if (settingsSnap.exists()) {
          setPaymentSettings(settingsSnap.data());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-gray-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-white text-gray-900">
        <h1 className="text-4xl font-black text-gray-900 uppercase">Booking Not Found</h1>
        <p className="mt-4 text-gray-500 font-medium">We couldn't find the booking you were looking for.</p>
        <Link to="/" className="mt-8 inline-block rounded-full bg-gray-900 px-10 py-4 font-black text-white uppercase tracking-widest text-xs transition-all hover:bg-black">
          Return Home
        </Link>
      </div>
    );
  }

  if (booking.status !== 'confirmed') {
    return (
      <div className="min-h-screen bg-neutral-50/60 flex items-center justify-center p-4 pt-28 pb-20 font-sans text-neutral-900">
        <div className="max-w-xl w-full">
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-neutral-900/[0.04] border border-neutral-200 text-center relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-200/60">
                {booking.status === 'pending' || booking.status === 'review_required' ? (
                  <Clock className="h-8 w-8 text-amber-600 animate-pulse" />
                ) : (
                  <XCircle className="h-8 w-8 text-rose-500" />
                )}
              </div>

              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 mb-4 tracking-tight">
                {booking.status === 'pending' || booking.status === 'review_required' ? 'Booking Processing' : 'Booking ' + booking.status}
              </h1>

              {booking.id && (
                <div className="mb-6 px-4 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 inline-block">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Booking Reference</span>
                  <span className="text-lg font-mono font-bold text-neutral-900 tracking-tight">#{booking.id}</span>
                </div>
              )}

              <div className="space-y-4 text-neutral-600 font-normal leading-relaxed mb-8 text-sm">
                {booking.status === 'pending' || booking.status === 'review_required' ? (
                  <>
                    <p className="text-neutral-900 font-semibold">
                      Check your inbox! We've sent confirmation to <span className="font-bold text-neutral-900">{booking.customerData?.email || 'your email address'}</span> with:
                    </p>
                    
                    <ul className="text-left bg-neutral-50 p-4 rounded-xl space-y-2.5 text-xs text-neutral-700 border border-neutral-100">
                      <li className="flex gap-2.5 items-center">
                        <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        Detailed summary of your trip details
                      </li>
                      <li className="flex gap-2.5 items-center">
                        <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        Step-by-step instructions on payment verification
                      </li>
                      <li className="flex gap-2.5 items-center">
                        <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        Voucher download link (after payment is verified)
                      </li>
                    </ul>

                    <div className="pt-2">
                      <p className="text-xs bg-neutral-100/70 text-neutral-700 p-3 rounded-xl border border-neutral-200/60">
                        <strong>Pro-Tip:</strong> To track your booking and manage your trips easily, you can <Link to="/auth?mode=signup" className="underline font-bold text-neutral-900">sign up</Link> using the same email.
                      </p>
                    </div>
                  </>
                ) : (
                  <p>This booking is {booking.status}. Vouchers are only available for confirmed bookings.</p>
                )}
              </div>

              <div className="grid gap-2.5">
                <Link 
                  to="/customer/bookings" 
                  className="w-full h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider hover:bg-black transition-all cursor-pointer"
                >
                  Go to Dashboard <Icons.ArrowRight className="h-4 w-4" />
                </Link>
                
                <Link 
                  to={`/track-booking?id=${booking.id}`}
                  className="w-full h-12 bg-white border border-neutral-300 text-neutral-800 rounded-xl flex items-center justify-center gap-2 font-bold text-xs hover:bg-neutral-50 transition-all cursor-pointer"
                >
                  Track Without Account <Icons.Search className="h-3.5 w-3.5" />
                </Link>

                <Link 
                  to="/" 
                  className="w-full h-10 text-neutral-500 rounded-xl flex items-center justify-center font-medium text-xs hover:text-neutral-900 transition-all cursor-pointer"
                >
                  Return Home
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/60 py-10 px-4 booking-success-page print:p-0 print:bg-white text-neutral-900">
      <div className="mx-auto max-w-3xl print:max-w-none">
        
        {/* Header Actions - Hidden on Print */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 no-print">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">Booking Confirmed</h1>
            <p className="text-sm font-normal text-neutral-500 mt-1">Your adventure is ready. Print or save your official voucher below.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-xs font-bold text-white transition-all hover:bg-black cursor-pointer shadow-xs"
            >
              Print Voucher
            </button>
            <Link 
              to="/"
              className="flex items-center gap-2 rounded-xl bg-white border border-neutral-300 px-6 py-3 text-xs font-bold text-neutral-700 transition-all hover:bg-neutral-50 cursor-pointer"
            >
              Explore More
            </Link>
          </div>
        </div>

        {/* THE VOUCHER CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-neutral-900/[0.04] overflow-hidden border border-neutral-200 voucher-card print:border-neutral-200 print:shadow-none print:rounded-2xl"
        >
          {/* Header Branding */}
          <div className="p-6 md:p-8 border-b border-neutral-100 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6 bg-neutral-50/40 print:p-6 print:bg-white">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-white p-2 shadow-xs border border-neutral-100 flex items-center justify-center print:h-14 print:w-14">
                {settings?.logoURL ? (
                  <img 
                    src={settings.logoURL} 
                    alt={settings.siteName} 
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-full w-full bg-neutral-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {settings?.siteName?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight">{settings?.siteName}</h2>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/60">
                  <CheckCircle className="h-3 w-3 text-emerald-600" /> Official Experience Voucher
                </div>
              </div>
            </div>
            
            <div className="md:text-right">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Voucher Reference</p>
              <div className="inline-block px-3.5 py-1.5 bg-white rounded-xl border border-neutral-200 shadow-xs">
                <p className="text-base font-mono font-bold text-neutral-900 tracking-tight">#{booking.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 print:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 print:gap-6">
              
              {/* Details Column */}
              <div className="space-y-6">
                <div className="voucher-section">
                  <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">You're going to</h3>
                  <h4 className="text-2xl md:text-3xl font-bold text-neutral-900 leading-tight tracking-tight print:text-xl">{booking.tourTitle}</h4>
                  <div className="flex items-center gap-2 mt-2.5 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200/80 w-fit">
                    <CheckCircle className="h-3.5 w-3.5 text-neutral-700" />
                    <span className="text-xs font-semibold text-neutral-800">{booking.packageName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 voucher-section bg-neutral-50/60 p-4 rounded-2xl border border-neutral-100">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Date</p>
                    <p className="text-sm font-bold text-neutral-900">{booking.date}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Time</p>
                    <p className="text-sm font-bold text-neutral-900">{booking.time || "TBA"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Guests</p>
                    <p className="text-sm font-bold text-neutral-900">{(booking.participants?.adults || 0) + (booking.participants?.children || 0)} Persons</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Payment</p>
                    <p className={`text-sm font-bold ${booking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {booking.paymentStatus === 'paid' ? 'Fully Paid' : 'Pending'}
                    </p>
                  </div>
                </div>

                {/* Transport & Location Details */}
                <div className="pt-4 border-t border-neutral-100 space-y-2.5 voucher-section">
                  {(() => {
                    const isMeetingPoint = !booking.customerData?.pickupAddress || 
                      booking.selectedTransport?.type === 'meet' ||
                      booking.selectedTransport?.name?.toLowerCase().includes("own transport") ||
                      booking.selectedTransport?.name?.toLowerCase().includes("meet on location") ||
                      booking.customerData?.pickupAddress || "".includes("Meet") || 
                      booking.customerData?.pickupAddress || "".toLowerCase().includes("basecamp") ||
                      booking.customerData?.pickupAddress || "".toLowerCase().includes("operation") ||
                      booking.customerData?.pickupAddress || "".includes("maps.app.goo.gl") ||
                      booking.customerData?.pickupAddress || "".includes("google.com/maps");
                    
                    if (isMeetingPoint) {
                      const selectedPkg = tour?.packages?.find((p: any) => p.name === booking.packageName);
                      const rawMp = (selectedPkg?.meetingPoint && selectedPkg.meetingPoint.trim()) || 
                                    (tour?.meetingPoint && tour.meetingPoint.trim()) || 
                                    ((booking.customerData?.pickupAddress && booking.customerData?.pickupAddress !== "Meet directly at our adventure basecamp.") ? booking.customerData?.pickupAddress : null) || 
                                    "Meet directly at our adventure basecamp.";
                      const mp = parseMeetingPoint(rawMp, booking.packageName || booking.tourTitle);
                      return (
                        <>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            Meeting Point Location
                          </p>
                          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 text-left space-y-2">
                            <div className="flex items-start gap-2">
                              <Icons.MapPin className="h-4 w-4 shrink-0 text-neutral-700 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-neutral-900 block">{mp.venue}</span>
                                {mp.address && mp.address !== mp.venue && (
                                  <p className="text-xs text-neutral-500 font-medium leading-relaxed">{mp.address}</p>
                                )}
                              </div>
                            </div>
                            <div className="pl-6 border-t border-neutral-200/60 pt-2">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Direct Google Maps Link:</span>
                              <a 
                                href={mp.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-neutral-900 underline break-all inline-block hover:text-black"
                              >
                                {mp.url}
                              </a>
                            </div>
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            Hotel Pickup Address
                          </p>
                          <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200/80">
                            <p className="text-xs font-bold text-neutral-900 leading-relaxed">
                              {booking.customerData?.pickupAddress || ""}
                            </p>
                          </div>
                        </>
                      );
                    }
                  })()}
                </div>

                <div className="pt-4 border-t border-neutral-100 voucher-section">
                  <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2.5">Lead Guest Details</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-700">
                      {(booking.customerData?.fullName || "G").charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{booking.customerData?.fullName || "N/A"}</p>
                      <div className="flex items-center gap-3 text-xs font-medium text-neutral-500 mt-0.5">
                        <span>{booking.customerData?.phone || ""}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR & Info Column */}
              <div className="space-y-6">
                <div className="bg-neutral-900 rounded-3xl p-6 text-center text-white print:bg-white print:text-black print:border print:border-neutral-200 print:rounded-2xl voucher-section">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-4 print:text-neutral-400">Check-in Scan</p>
                  <div className="bg-white p-3 rounded-2xl inline-block mb-4 shadow-sm print:shadow-none print:border print:border-neutral-200">
                    <QRCode 
                      value={`${window.location.origin}/admin/booking/${booking.id}`}
                      size={130}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox={`0 0 256 256`}
                    />
                  </div>
                  <p className="text-[10px] font-medium text-white/60 leading-relaxed print:text-neutral-500">
                    Present this code at terminal or to your guide.
                  </p>
                </div>

                <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200/80 print:bg-white voucher-section">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Price</span>
                    <span className="text-xl font-bold text-neutral-900 tracking-tight"><FormattedPrice amount={booking.totalAmount} /></span>
                  </div>
                  <div className="pt-4 border-t border-neutral-200">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2.5">Support</p>
                    <div className="space-y-2.5">
                       {settings?.supportPhone && (
                         <button 
                           onClick={() => {
                             const template = commSettings?.whatsappTemplates?.booking_status_updated?.message || 
                               "Hi, I have a question about my booking {{bookingId}} for {{tourTitle}}.";
                             const message = generateBookingMessage(template, booking!);
                             const link = getWhatsAppLink(settings.supportPhone!, message);
                             window.open(link, '_blank');
                           }}
                           className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl bg-neutral-900 text-white hover:bg-black transition-all text-xs font-bold cursor-pointer"
                         >
                           <Icons.MessageSquare className="h-3.5 w-3.5" />
                           Contact Support (WhatsApp)
                         </button>
                       )}
                       {settings?.supportPhone && (
                         <div className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                           <Icons.Phone className="h-3 w-3 text-neutral-400" />
                           {settings.supportPhone}
                         </div>
                       )}
                       {settings?.supportEmail && (
                         <div className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                           <Icons.Mail className="h-3 w-3 text-neutral-400" />
                           {settings.supportEmail}
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 py-4 px-8 border-t border-neutral-100 text-center print:bg-white">
             <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
               Thank you for choosing {settings?.siteName}
             </p>
          </div>
        </motion.div>

        <div className="mt-6 text-center no-print">
          <p className="text-[11px] text-neutral-400 font-medium">
            A copy has been sent to {booking.customerData?.email || ""}
          </p>
        </div>
      </div>
    </div>
  );
}
