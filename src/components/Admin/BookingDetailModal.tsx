import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../../lib/utils';
import { Booking, Tour, BookingLog, SignedWaiver } from '../../types';
import { COUNTRIES } from '../../constants';
import { PaymentTimeline } from './Payment/PaymentTimeline';
import { WaiverViewerModal } from './Waiver/WaiverViewerModal';
import { getSignedWaiverById, openWaiverWhatsApp } from '../../lib/waiverService';
import { db, collection, query, where, getDocs } from '../../lib/firebase';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  setBooking: (booking: Booking | null) => void;
  isEditingTrip: boolean;
  setIsEditingTrip: (val: boolean) => void;
  tours: Tour[];
  newNote: string;
  setNewNote: (val: string) => void;
  handleAddInternalNote: () => void;
  handleSaveBookingChange: (e: React.FormEvent) => Promise<void>;
  handlePrintManifest: (booking: Booking) => void;
  handleDeleteBooking: (id: string) => Promise<void>;
  sendBookingEmail: (type: string, booking: Booking) => Promise<any>;
  updateBookingStatus: (id: string, status: any) => Promise<void>;
  formatPrice: (price: number) => string;
  userRole?: string;
  loadingStates?: any;
  onAssignGuide?: (booking: Booking) => void;
}

const BookingDetailModal = ({
  isOpen,
  onClose,
  booking,
  setBooking,
  isEditingTrip,
  setIsEditingTrip,
  tours,
  newNote,
  setNewNote,
  handleAddInternalNote,
  handleSaveBookingChange,
  handlePrintManifest,
  handleDeleteBooking,
  formatPrice,
  userRole,
  loadingStates = {},
  onAssignGuide
}: BookingDetailModalProps) => {
  const [isViewingWaiver, setIsViewingWaiver] = useState(false);
  const [activeSignedWaiver, setActiveSignedWaiver] = useState<SignedWaiver | null>(null);
  const [loadingWaiver, setLoadingWaiver] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!booking) return null;

  const isAdmin = userRole === 'admin';
  const isWaiverSigned = booking.waiverStatus === 'signed' || !!booking.signedWaiverId;

  const handleViewSignedWaiver = async () => {
    try {
      setLoadingWaiver(true);
      if (booking.signedWaiverId) {
        const waiver = await getSignedWaiverById(booking.signedWaiverId);
        if (waiver) {
          setActiveSignedWaiver(waiver);
          setIsViewingWaiver(true);
          return;
        }
      }
      
      // Fallback: search by bookingId
      const q = query(collection(db, 'signed_waivers'), where('bookingId', '==', booking.id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const found = { ...snap.docs[0].data(), id: snap.docs[0].id } as SignedWaiver;
        setActiveSignedWaiver(found);
        setIsViewingWaiver(true);
      } else {
        alert('No signed waiver certificate found for this booking yet.');
      }
    } catch (err) {
      console.error('Error fetching waiver certificate:', err);
      alert('Error fetching waiver certificate.');
    } finally {
      setLoadingWaiver(false);
    }
  };

  const handleCopyWaiverLink = () => {
    const url = `${window.location.origin}/waiver/${booking.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[190] flex items-center justify-end">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-950/40 backdrop-blur-xs"
          />
          
          {/* Drawer Panel */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative h-full w-full max-w-lg bg-white shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none">Booking Reference</span>
                <span className="text-xl font-black text-gray-900 tracking-tight block mt-1">
                  #{booking.id.toUpperCase()}
                </span>
              </div>
              <button 
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <LucideIcons.X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <form id="global-booking-edit-form" onSubmit={handleSaveBookingChange} className="space-y-6">
                
                {/* 1. Status Selection */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Manage Status</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Booking Status</label>
                      <select
                        disabled={!isAdmin}
                        value={booking.status}
                        onChange={e => setBooking({ ...booking, status: e.target.value as any })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-black uppercase tracking-wider outline-none text-gray-700"
                      >
                        <option value="pending">🟡 Pending</option>
                        <option value="review_required">🟣 Review Req</option>
                        <option value="confirmed">🟢 Confirmed</option>
                        <option value="completed">🔵 Completed</option>
                        <option value="cancelled">🔴 Cancelled</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Payment Status</label>
                      <select
                        disabled={!isAdmin}
                        value={booking.paymentStatus || 'pending'}
                        onChange={e => setBooking({ ...booking, paymentStatus: e.target.value as any })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-black uppercase tracking-wider outline-none text-gray-700"
                      >
                        <option value="pending">🟡 Pending</option>
                        <option value="paid">🟢 Paid</option>
                        <option value="failed">🔴 Failed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* BYOPG Payment Timeline */}
                <PaymentTimeline bookingData={booking} />

                {/* 2. Tour Configuration */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Trip Details</span>
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-4">
                    <div>
                      <span className="text-[9px] font-black uppercase text-gray-400">Selected Experience</span>
                      <p className="font-extrabold text-sm text-gray-800 tracking-tight leading-tight uppercase mt-0.5">
                        {booking.tourTitle}
                      </p>
                      <p className="text-[10px] text-primary font-extrabold uppercase mt-0.5">
                        Package: {booking.packageName}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Date</label>
                        <input
                          type="date"
                          disabled={!isAdmin}
                          value={booking.date}
                          onChange={e => setBooking({ ...booking, date: e.target.value })}
                          className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-2 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Pickup Time</label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          value={booking.time || ''}
                          onChange={e => setBooking({ ...booking, time: e.target.value })}
                          className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-2 text-xs font-bold"
                          placeholder="e.g. 08:30 AM"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Adults</label>
                        <input
                          type="number"
                          disabled={!isAdmin}
                          min={1}
                          value={(booking.participants?.adults || 0)}
                          onChange={e => setBooking({ ...booking, participants: { ...booking.participants, adults: Number(e.target.value) } })}
                          className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-2 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Children</label>
                        <input
                          type="number"
                          disabled={!isAdmin}
                          min={0}
                          value={(booking.participants?.children || 0)}
                          onChange={e => setBooking({ ...booking, participants: { ...booking.participants, children: Number(e.target.value) } })}
                          className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-2 text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Pickup Location</label>
                      <textarea
                        rows={2}
                        disabled={!isAdmin}
                        value={booking.customerData?.pickupAddress || ''}
                        onChange={e => setBooking({ ...booking, customerData: { ...(booking.customerData || { fullName: '', email: '', phone: '' }), pickupAddress: e.target.value } })}
                        placeholder="Hotel name & Lobby note..."
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-2 text-xs font-bold"
                      />
                    </div>

                    {booking.selectedTransport && (
                      <div className="bg-orange-50/50 rounded-lg p-3 border border-orange-100/50 space-y-1">
                        <span className="text-[9px] font-black uppercase text-orange-600 block">Transportation Chosen</span>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                          <LucideIcons.Car className="h-4 w-4 text-orange-500 animate-pulse" />
                          <span>{booking.selectedTransport.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium">({booking.selectedTransport.type === 'meet' ? 'Meet on location' : booking.selectedTransport.carType || booking.selectedTransport.type})</span>
                        </div>
                        {booking.selectedTransport.price > 0 && (
                          <p className="text-[10px] text-gray-500 font-semibold">
                            Price: {formatPrice(booking.selectedTransport.price)} {booking.selectedTransport.priceType === 'per_person' ? 'per person' : 'flat rate'} (Total: {formatPrice(booking.transportTotal || 0)})
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Guest Profile */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Lead Guest Details</span>
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Full Name</label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          value={booking.customerData?.fullName || ''}
                          onChange={e => setBooking({ ...booking, customerData: { ...(booking.customerData || { fullName: '', email: '', phone: '' }), fullName: e.target.value } })}
                          className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-2 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Nationality</label>
                        <select
                          disabled={!isAdmin}
                          value={booking.customerData?.nationality || ''}
                          onChange={e => setBooking({ ...booking, customerData: { ...(booking.customerData || { fullName: '', email: '', phone: '' }), nationality: e.target.value } })}
                          className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none"
                        >
                          <option value="">(Select Country)</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">WhatsApp/Phone</label>
                        <input
                          type="tel"
                          disabled={!isAdmin}
                          value={booking.customerData?.phone || ''}
                          onChange={e => setBooking({ ...booking, customerData: { ...(booking.customerData || { fullName: '', email: '', phone: '' }), phone: e.target.value } })}
                          className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-2 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Email Address</label>
                        <input
                          type="email"
                          disabled={!isAdmin}
                          value={booking.customerData?.email || ''}
                          onChange={e => setBooking({ ...booking, customerData: { ...(booking.customerData || { fullName: '', email: '', phone: '' }), email: e.target.value } })}
                          className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-2 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Guide Assignment */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Assigned Guide / Driver</span>
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                      {booking.assignedGuideId ? (
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs">
                            {booking.assignedGuideName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-gray-900 leading-none">{booking.assignedGuideName}</p>
                            <p className="text-[9px] font-bold text-blue-500 mt-0.5">+{booking.assignedGuideWhatsapp}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-gray-400 italic">No guide assigned yet</p>
                      )}
                    </div>
                    {onAssignGuide && (
                      <button
                        type="button"
                        onClick={() => onAssignGuide(booking)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-colors"
                      >
                        {booking.assignedGuideId ? 'Change Guide' : 'Assign Guide'}
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold italic leading-tight">
                    * Note: A guide is only available for 1 active trip per day across the entire system.
                  </p>
                </div>

                {/* 5. Liability Waiver & Safety */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                      Digital Liability Waiver & Safety
                    </span>
                    {isWaiverSigned ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                        <LucideIcons.ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Signed & Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">
                        <LucideIcons.Clock className="w-3 h-3 text-amber-600" />
                        Pending Signature
                      </span>
                    )}
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <LucideIcons.FileText className={cn("w-4 h-4", isWaiverSigned ? "text-emerald-600" : "text-amber-500")} />
                          <span className="text-xs font-black text-gray-900">
                            {isWaiverSigned ? 'Activity Liability Waiver Executed' : 'Waiver Not Yet Signed'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium mt-1 leading-relaxed">
                          {isWaiverSigned 
                            ? `Signed by lead participant and stored securely with legal timestamp${booking.waiverSignedAt ? ` on ${new Date(booking.waiverSignedAt).toLocaleDateString()}` : ''}.`
                            : 'Guest has not executed their digital liability release yet. You can dispatch signing links via WhatsApp or collect on-site via tablet/phone.'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-50 grid grid-cols-2 gap-2">
                      {isWaiverSigned ? (
                        <button
                          type="button"
                          onClick={handleViewSignedWaiver}
                          disabled={loadingWaiver}
                          className="col-span-2 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          {loadingWaiver ? (
                            <LucideIcons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LucideIcons.ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          View Signed Certificate
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openWaiverWhatsApp(booking)}
                            className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <LucideIcons.PhoneCall className="w-3 h-3" />
                            Send WhatsApp Link
                          </button>

                          <button
                            type="button"
                            onClick={handleCopyWaiverLink}
                            className="py-2 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            {copiedLink ? (
                              <>
                                <LucideIcons.Check className="w-3 h-3 text-emerald-600" />
                                Link Copied!
                              </>
                            ) : (
                              <>
                                <LucideIcons.Copy className="w-3 h-3 text-gray-500" />
                                Copy Guest Link
                              </>
                            )}
                          </button>

                          <a
                            href={`/waiver/${booking.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="col-span-2 py-2 px-3 bg-orange-50 hover:bg-orange-100 text-primary text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 text-center"
                          >
                            <LucideIcons.ExternalLink className="w-3 h-3" />
                            Open On-Site Tablet / Kiosk Signer
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. Pricing & Payments */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Pricing & Payments</span>
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Trip Charge (USD)</label>
                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={booking.totalAmount}
                          onChange={e => setBooking({ ...booking, totalAmount: Number(e.target.value) })}
                          className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Payment Method</label>
                        <p className="bg-gray-50 p-2 border border-gray-150 rounded-lg text-xs font-black uppercase text-gray-600 tracking-tight">
                          {booking.paymentMethod || 'manual'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Manual Reference / Token ID</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={booking.paymentToken || ''}
                        onChange={e => setBooking({ ...booking, paymentToken: e.target.value })}
                        placeholder="e.g. Bank Transfer ID / Reference"
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-2 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Activity Logs & Notes */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Internal Staff Notes</span>
                  
                  {/* Notes Feed */}
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {booking.logs && booking.logs.length > 0 ? (
                      [...(booking.logs || [])].reverse().map((log: BookingLog, lIdx) => (
                        <div key={lIdx} className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-xs text-gray-700">
                          <div className="flex justify-between text-[9px] text-gray-400 font-extrabold mb-1">
                            <span>{log.userName || 'Admin'}</span>
                            <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="font-medium text-gray-800 leading-tight">{log.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-gray-400 italic text-center py-2">No notes recorded yet</p>
                    )}
                  </div>

                  {/* Add note input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an internal comment..."
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddInternalNote}
                      disabled={!newNote.trim() || loadingStates.addingNote}
                      className="p-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-35"
                    >
                      <LucideIcons.Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-gray-100 bg-gray-55 space-y-3 shrink-0">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintManifest(booking)}
                  className="p-3 rounded-lg border border-primary text-primary hover:bg-orange-50 transition-colors"
                  title="Print manifest info"
                >
                  <LucideIcons.Printer className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {isAdmin && (
                  <button
                    form="global-booking-edit-form"
                    type="submit"
                    disabled={loadingStates.updatingBooking}
                    className="flex-[2] bg-primary text-white p-3 rounded-lg text-xs font-black tracking-widest hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {loadingStates.updatingBooking ? (
                      <>
                        <LucideIcons.Loader2 className="h-3.5 w-3.5 animate-spin" /> SAVING...
                      </>
                    ) : (
                      'SAVE CHANGES'
                    )}
                  </button>
                )}
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleDeleteBooking(booking.id)}
                  disabled={loadingStates.deletingBooking}
                  className="w-full py-2 text-[10px] font-black text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {loadingStates.deletingBooking ? (
                    <LucideIcons.Loader2 className="h-3 w-3 animate-spin text-red-500" />
                  ) : (
                    <LucideIcons.Trash2 className="h-3 w-3" />
                  )}
                  DELETE BOOKING PERMANENTLY
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Digital Waiver Certificate Viewer Modal */}
      <WaiverViewerModal
        isOpen={isViewingWaiver}
        onClose={() => {
          setIsViewingWaiver(false);
          setActiveSignedWaiver(null);
        }}
        waiver={activeSignedWaiver}
      />
    </AnimatePresence>
  );
};

export default BookingDetailModal;
