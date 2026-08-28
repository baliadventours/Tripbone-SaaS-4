import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock3, 
  Plus, 
  Send, 
  Printer, 
  FileText, 
  UserCheck, 
  ShieldCheck, 
  ArrowUpRight, 
  ChevronRight, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  Trash2, 
  Edit, 
  Key, 
  DollarSign, 
  ChevronDown, 
  Check, 
  X, 
  Copy, 
  Compass,
  SlidersHorizontal,
  Gauge,
  Fuel,
  Info
} from 'lucide-react';
import { Booking, RentalVehicle, RentalZone, RentalAddOn, RentalServiceMode, Guide, SiteSettings } from '../../../types';
import { db, collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getActiveTenantId, onSnapshot } from '../../../lib/firebase';
import { useSettings } from '../../../lib/SettingsContext';
import { useTenant } from '../../../lib/TenantContext';
import { getRentalVehicles, DEFAULT_RENTAL_ZONES, DEFAULT_RENTAL_ADDONS, calculateRentalQuote } from '../../../lib/carRentalService';
import { 
  triggerRentalBookingConfirmation, 
  triggerRentalDriverDispatch, 
  triggerRentalPreTripReminder, 
  triggerRentalPostTripReview, 
  formatRentalTemplate,
  DEFAULT_RENTAL_AUTOMATIONS 
} from '../../../lib/rentalAutomationsService';
import { sendCustomWhatsApp, getWhatsAppLink } from '../../../lib/whatsappService';
import FormattedPrice from '../../FormattedPrice';
import SmartImage from '../../SmartImage';
import { cn } from '../../../lib/utils';

interface CarRentalBookingManagerProps {
  allGuides?: Guide[];
}

export default function CarRentalBookingManager({ allGuides = [] }: CarRentalBookingManagerProps) {
  const { settings } = useSettings();
  const { tenantId } = useTenant();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<RentalVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'today', 'tomorrow', 'week', 'month'
  
  // Active selected booking for detailed drawer / modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // Dispatch Form State
  const [dispatchDriverName, setDispatchDriverName] = useState('');
  const [dispatchDriverPhone, setDispatchDriverPhone] = useState('');
  const [dispatchVehiclePlate, setDispatchVehiclePlate] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Feedback Notification Toast
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setActionToast({ message, type });
    setTimeout(() => setActionToast(null), 3500);
  };

  // Real-time listener for car rental bookings
  useEffect(() => {
    setLoading(true);
    const effectiveTenantId = tenantId || getActiveTenantId();
    
    // Listen to bookings collection
    const bookingsRef = collection(db, 'bookings');
    const unsub = onSnapshot(bookingsRef, (snapshot) => {
      const allFetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];

      // Filter for rental bookings belonging to this tenant
      const rentalBookings = allFetched.filter(b => {
        const matchesTenant = !effectiveTenantId || b.tenantId === effectiveTenantId;
        const isRental = b.bookingType === 'rental' || Boolean(b.rentalDetails);
        return matchesTenant && isRental;
      });

      // Sort newest first
      rentalBookings.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setBookings(rentalBookings);
      setLoading(false);
    }, (err) => {
      console.error('Error listening to rental bookings:', err);
      setLoading(false);
    });

    // Also fetch rental vehicles for fast reference & manual booking creation
    getRentalVehicles(effectiveTenantId).then(res => setVehicles(res)).catch(console.error);

    return () => unsub();
  }, [tenantId]);

  // Derived Statistics
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const activeTrip = bookings.filter(b => b.status === 'review_required' || (b.status === 'confirmed' && b.date === new Date().toISOString().split('T')[0])).length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const unassignedDispatch = bookings.filter(b => b.status === 'confirmed' && !b.rentalDetails?.assignedDriverName && b.rentalDetails?.serviceMode === 'with_driver').length;

    return {
      total,
      pending,
      confirmed,
      activeTrip,
      completed,
      totalRevenue,
      unassignedDispatch
    };
  }, [bookings]);

  // Filtered Bookings List
  const filteredBookings = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    return bookings.filter(b => {
      // Status filter
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;

      // Service mode filter
      if (modeFilter !== 'all' && b.rentalDetails?.serviceMode !== modeFilter) return false;

      // Payment filter
      if (paymentFilter !== 'all' && b.paymentStatus !== paymentFilter) return false;

      // Date range filter
      if (dateFilter === 'today' && b.date !== todayStr) return false;
      if (dateFilter === 'tomorrow' && b.date !== tomorrowStr) return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const refMatch = b.id?.toLowerCase().includes(q);
        const nameMatch = b.customerData?.fullName?.toLowerCase().includes(q);
        const phoneMatch = b.customerData?.phone?.includes(q);
        const emailMatch = b.customerData?.email?.toLowerCase().includes(q);
        const vehicleMatch = b.rentalDetails?.vehicleName?.toLowerCase().includes(q) || b.tourTitle?.toLowerCase().includes(q);
        const plateMatch = b.rentalDetails?.assignedVehiclePlate?.toLowerCase().includes(q);
        const driverMatch = b.rentalDetails?.assignedDriverName?.toLowerCase().includes(q);
        const locationMatch = b.rentalDetails?.pickupLocation?.toLowerCase().includes(q);

        if (!refMatch && !nameMatch && !phoneMatch && !emailMatch && !vehicleMatch && !plateMatch && !driverMatch && !locationMatch) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, statusFilter, modeFilter, paymentFilter, dateFilter, searchQuery]);

  // Update Booking Status Handler
  const handleUpdateStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      showToast(`Booking marked as ${newStatus.toUpperCase()}`, 'success');

      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
      showToast('Failed to update status', 'error');
    }
  };

  // Open Dispatch Modal
  const openDispatchModal = (b: Booking) => {
    setSelectedBooking(b);
    setDispatchDriverName(b.rentalDetails?.assignedDriverName || '');
    setDispatchDriverPhone(b.rentalDetails?.assignedDriverPhone || '');
    setDispatchVehiclePlate(b.rentalDetails?.assignedVehiclePlate || '');
    setIsDispatchModalOpen(true);
  };

  // Submit Driver Dispatch & Auto-Send WhatsApp
  const handleSaveAndSendDispatch = async () => {
    if (!selectedBooking) return;
    if (!dispatchDriverName.trim()) {
      showToast('Please enter Driver / Chauffeur Name', 'error');
      return;
    }

    try {
      setIsDispatching(true);
      const res = await triggerRentalDriverDispatch(selectedBooking, settings, {
        driverName: dispatchDriverName,
        driverPhone: dispatchDriverPhone,
        licensePlate: dispatchVehiclePlate,
      });

      if (res.success) {
        showToast('Driver & Vehicle Dispatched! WhatsApp notice sent to customer.', 'success');
      } else {
        showToast('Driver saved. Note: WhatsApp web redirection triggered.', 'info');
      }

      setIsDispatchModalOpen(false);
    } catch (err) {
      console.error('Dispatch failed:', err);
      showToast('Error saving dispatch info', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  // One-Click Automation Triggers
  const handleTriggerConfirmation = async (b: Booking) => {
    showToast('Sending automated booking confirmation...', 'info');
    const res = await triggerRentalBookingConfirmation(b, settings);
    if (res.success) {
      showToast('Booking confirmation sent to guest WhatsApp!', 'success');
    } else {
      showToast(res.message || 'Opened WhatsApp to send confirmation', 'info');
    }
  };

  const handleTriggerReminder = async (b: Booking) => {
    showToast('Sending pre-trip reminder...', 'info');
    const res = await triggerRentalPreTripReminder(b, settings);
    if (res.success) {
      showToast('Pre-trip reminder sent to guest WhatsApp!', 'success');
    } else {
      showToast(res.message || 'Opened WhatsApp reminder', 'info');
    }
  };

  const handleTriggerReview = async (b: Booking) => {
    showToast('Sending post-trip review invitation...', 'info');
    const res = await triggerRentalPostTripReview(b, settings);
    if (res.success) {
      showToast('Post-trip review request sent to guest!', 'success');
    } else {
      showToast(res.message || 'Opened WhatsApp review invite', 'info');
    }
  };

  // Delete Booking Handler
  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this car rental reservation?')) return;
    try {
      await deleteDoc(doc(db, 'bookings', id));
      showToast('Reservation deleted', 'info');
      if (selectedBooking?.id === id) {
        setIsDetailOpen(false);
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error('Failed to delete booking:', err);
      showToast('Failed to delete booking', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {actionToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium",
              actionToast.type === 'success' && "bg-emerald-900 text-emerald-100 border-emerald-700",
              actionToast.type === 'info' && "bg-blue-900 text-blue-100 border-blue-700",
              actionToast.type === 'error' && "bg-rose-900 text-rose-100 border-rose-700"
            )}
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{actionToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-primary flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Car Rental & Charter Bookings</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-primary border border-orange-200">
              {bookings.length} Total Rentals
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Track reservations, dispatch chauffeurs & vehicles, send automated WhatsApp notifications, and print vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-orange-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + New Rental Booking
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Bookings</div>
          <div className="text-2xl font-black text-gray-900">{stats.total}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">All-time fleet hires</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/20 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Pending Approval</div>
          <div className="text-2xl font-black text-amber-700">{stats.pending}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Requires confirmation</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-100 bg-blue-50/20 shadow-sm">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Confirmed</div>
          <div className="text-2xl font-black text-blue-700">{stats.confirmed}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Ready for departure</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Active / On Road</div>
          <div className="text-2xl font-black text-emerald-700">{stats.activeTrip}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Currently rented out</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-100 bg-purple-50/20 shadow-sm">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Needs Dispatch</div>
          <div className="text-2xl font-black text-purple-700">{stats.unassignedDispatch}</div>
          <div className="text-[11px] text-purple-600 mt-0.5">Chauffeur unassigned</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Rental Revenue</div>
          <div className="text-xl font-black text-gray-900 truncate">
            <FormattedPrice amount={stats.totalRevenue} />
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">Grand booking total</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Guest Name, Booking Ref, Phone, Vehicle, DK Plate, Hotel..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="confirmed">Confirmed</option>
              <option value="review_required">Active / On Road</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Mode Select */}
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-primary"
            >
              <option value="all">All Service Modes</option>
              <option value="with_driver">🚗 With Chauffeur</option>
              <option value="self_drive">🔑 Self-Drive</option>
            </select>

            {/* Date Shortcut */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-primary"
            >
              <option value="all">All Dates</option>
              <option value="today">Today's Pickups</option>
              <option value="tomorrow">Tomorrow's Pickups</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table / Card View */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-gray-500">Loading car rental reservations...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-primary flex items-center justify-center mx-auto">
            <Car className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">No Car Rental Bookings Found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
              {searchQuery || statusFilter !== 'all' || modeFilter !== 'all' 
                ? "No reservations match your current filter settings. Try adjusting the search filters."
                : "You don't have any vehicle reservations yet. New bookings from your website will appear here automatically."}
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-orange-700 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Walk-In / Phone Reservation
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-black text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Booking Ref & Guest</th>
                  <th className="py-3.5 px-4">Vehicle & Mode</th>
                  <th className="py-3.5 px-4">Pickup Date & Timing</th>
                  <th className="py-3.5 px-4">Driver & Plate DK</th>
                  <th className="py-3.5 px-4">Financials</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Quick Automations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredBookings.map((b) => {
                  const rental = b.rentalDetails;
                  const isSelfDrive = rental?.serviceMode === 'self_drive';
                  const shortId = b.id ? b.id.slice(-6).toUpperCase() : 'RENTAL';

                  return (
                    <tr 
                      key={b.id} 
                      className="hover:bg-orange-50/20 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedBooking(b);
                        setIsDetailOpen(true);
                      }}
                    >
                      {/* Booking Ref & Guest */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                            #{shortId}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            {b.bookingSource || 'Direct'}
                          </span>
                        </div>
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          {b.customerData?.fullName || 'Guest Customer'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          {b.customerData?.phone && (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = getWhatsAppLink(b.customerData.phone, `Hi ${b.customerData.fullName}, contacting you regarding your vehicle reservation #${shortId}.`);
                                window.open(url, '_blank');
                              }}
                              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              {b.customerData.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Vehicle & Mode */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-gray-900">
                          {rental?.vehicleName || b.tourTitle}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold",
                            isSelfDrive 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-blue-100 text-blue-800"
                          )}>
                            {isSelfDrive ? <Key className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            {isSelfDrive ? 'Self-Drive' : 'With Driver'}
                          </span>
                          {rental?.vehicleCategory && (
                            <span className="text-[10px] font-semibold text-gray-500 uppercase">
                              {rental.vehicleCategory.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 truncate max-w-[200px]">
                          📍 {rental?.pickupLocation || b.customerData?.pickupAddress || 'Standard Hub'}
                        </div>
                      </td>

                      {/* Pickup Date & Timing */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-gray-900 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          {b.date || rental?.pickupDate}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {b.timeSlot || rental?.pickupTime || '09:00 AM'}
                        </div>
                        <div className="text-[11px] font-medium text-orange-600 mt-1">
                          {isSelfDrive ? `${rental?.durationDays || 1} Day(s)` : rental?.durationType === 'half_day' ? 'Half-Day (6h)' : 'Full-Day (10h)'}
                        </div>
                      </td>

                      {/* Driver & Plate DK */}
                      <td className="py-4 px-4 align-top">
                        {isSelfDrive ? (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                              Plate: {rental?.assignedVehiclePlate || 'Pending Assign'}
                            </span>
                            <div className="text-[11px] text-gray-500">
                              Deposit: {rental?.depositStatus === 'received' ? '✅ Received' : '⏳ Pending'}
                            </div>
                          </div>
                        ) : rental?.assignedDriverName ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-gray-900 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              {rental.assignedDriverName}
                            </div>
                            <div className="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded inline-block">
                              {rental.assignedVehiclePlate || 'DK Plate'}
                            </div>
                            {rental.dispatchNotifiedAt && (
                              <div className="text-[10px] text-emerald-600 font-medium">
                                ✓ Dispatched
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDispatchModal(b);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-primary bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors inline-flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            Assign Driver
                          </button>
                        )}
                      </td>

                      {/* Financials */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-black text-gray-900">
                          <FormattedPrice amount={b.totalAmount || 0} />
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {b.paymentStatus === 'paid' ? (
                            <span className="text-emerald-600 font-bold">Paid in Full</span>
                          ) : rental?.depositPaidAmount ? (
                            <span className="text-blue-600 font-medium">Dep: <FormattedPrice amount={rental.depositPaidAmount} /></span>
                          ) : (
                            <span className="text-amber-600 font-medium">Pay on Arrival</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 align-top" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={b.status}
                          onChange={(e) => handleUpdateStatus(b.id, e.target.value as any)}
                          className={cn(
                            "text-xs font-bold px-2.5 py-1 rounded-full border focus:outline-none transition-colors cursor-pointer",
                            b.status === 'confirmed' && "bg-blue-50 text-blue-800 border-blue-200",
                            b.status === 'pending' && "bg-amber-50 text-amber-800 border-amber-200",
                            b.status === 'completed' && "bg-emerald-50 text-emerald-800 border-emerald-200",
                            b.status === 'cancelled' && "bg-rose-50 text-rose-800 border-rose-200",
                            b.status === 'review_required' && "bg-purple-50 text-purple-800 border-purple-200"
                          )}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="review_required">Active / On Road</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Quick Automations */}
                      <td className="py-4 px-4 align-top text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Trigger WhatsApp Confirmation */}
                          <button
                            title="Send WhatsApp Confirmation"
                            onClick={() => handleTriggerConfirmation(b)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Trigger Driver Dispatch */}
                          <button
                            title="Assign & Dispatch Driver Notice"
                            onClick={() => openDispatchModal(b)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Rental Voucher */}
                          <button
                            title="Print Rental Voucher / Agreement"
                            onClick={() => {
                              setSelectedBooking(b);
                              setIsVoucherModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* View Detailed Drawer */}
                          <button
                            title="View Full Details"
                            onClick={() => {
                              setSelectedBooking(b);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED BOOKING MANAGEMENT DRAWER */}
      <AnimatePresence>
        {isDetailOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-2xl bg-white h-full shadow-2xl z-10 overflow-y-auto flex flex-col"
            >
              {/* Drawer Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-primary flex items-center justify-center font-bold">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-gray-900">
                        Rental #{selectedBooking.id?.slice(-6).toUpperCase()}
                      </h2>
                      <span className={cn(
                        "text-xs font-bold px-2.5 py-0.5 rounded-full border",
                        selectedBooking.status === 'confirmed' && "bg-blue-50 text-blue-800 border-blue-200",
                        selectedBooking.status === 'pending' && "bg-amber-50 text-amber-800 border-amber-200",
                        selectedBooking.status === 'completed' && "bg-emerald-50 text-emerald-800 border-emerald-200",
                        selectedBooking.status === 'cancelled' && "bg-rose-50 text-rose-800 border-rose-200"
                      )}>
                        {selectedBooking.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Booked on {selectedBooking.createdAt ? new Date(selectedBooking.createdAt.toDate ? selectedBooking.createdAt.toDate() : selectedBooking.createdAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsVoucherModalOpen(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    title="Print Rental Voucher"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body Content */}
              <div className="p-6 space-y-6 flex-1">
                {/* 1. Customer & Pickup Logistics */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    Guest Information & Logistics
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-400">Lead Guest Name</div>
                      <div className="font-bold text-gray-900">{selectedBooking.customerData?.fullName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Phone / WhatsApp</div>
                      <div className="font-bold text-emerald-700 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedBooking.customerData?.phone}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Email Address</div>
                      <div className="font-medium text-gray-800">{selectedBooking.customerData?.email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Flight Number</div>
                      <div className="font-medium text-gray-800">{selectedBooking.rentalDetails?.flightNumber || 'None provided'}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60">
                    <div className="text-xs text-gray-400">Pickup Hotel / Meeting Address</div>
                    <div className="font-medium text-gray-900 flex items-start gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{selectedBooking.rentalDetails?.pickupLocation || selectedBooking.customerData?.pickupAddress || 'Standard Island Hub'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Vehicle & Service Details */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-primary" />
                    Vehicle & Charter Inclusions
                  </h3>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                      {selectedBooking.rentalDetails?.vehicleImage ? (
                        <SmartImage src={selectedBooking.rentalDetails.vehicleImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><Car className="w-6 h-6" /></div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{selectedBooking.rentalDetails?.vehicleName || selectedBooking.tourTitle}</div>
                      <div className="text-xs text-gray-500">
                        {selectedBooking.rentalDetails?.serviceMode === 'self_drive' ? '🔑 Self-Drive (Car Only)' : '🚗 Private Chauffeur Charter (Driver + Petrol)'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-200/60 text-xs">
                    <div>
                      <span className="text-gray-400">Pickup:</span>{' '}
                      <strong className="text-gray-800">{selectedBooking.date} @ {selectedBooking.rentalDetails?.pickupTime || selectedBooking.timeSlot}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Zone:</span>{' '}
                      <strong className="text-gray-800">{selectedBooking.rentalDetails?.zoneName || 'Zone 1 (Standard)'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Duration:</span>{' '}
                      <strong className="text-gray-800">
                        {selectedBooking.rentalDetails?.serviceMode === 'self_drive' 
                          ? `${selectedBooking.rentalDetails.durationDays || 1} Days` 
                          : selectedBooking.rentalDetails?.durationType === 'half_day' ? 'Half Day' : 'Full Day'}
                      </strong>
                    </div>
                  </div>

                  {/* Add-ons gear if any */}
                  {selectedBooking.rentalDetails?.selectedAddOns && selectedBooking.rentalDetails.selectedAddOns.length > 0 && (
                    <div className="pt-2 border-t border-gray-200/60">
                      <div className="text-xs font-semibold text-gray-600 mb-1">Equipment & Add-ons:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedBooking.rentalDetails.selectedAddOns.map((addon, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[11px] font-medium text-gray-700">
                            {addon.name} (x{addon.quantity || 1})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Driver & Vehicle Dispatch Station */}
                <div className="bg-orange-50/40 p-4 rounded-2xl border border-orange-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-orange-900 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-primary" />
                      Assigned Driver & Vehicle Plate
                    </h3>
                    <button
                      onClick={() => openDispatchModal(selectedBooking)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit Dispatch
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white p-3 rounded-xl border border-orange-100">
                      <div className="text-xs text-gray-400">Assigned Chauffeur / Driver</div>
                      <div className="font-bold text-gray-900">
                        {selectedBooking.rentalDetails?.assignedDriverName || 'Not Assigned Yet'}
                      </div>
                      {selectedBooking.rentalDetails?.assignedDriverPhone && (
                        <div className="text-xs text-emerald-600 mt-0.5">
                          📞 {selectedBooking.rentalDetails.assignedDriverPhone}
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-orange-100">
                      <div className="text-xs text-gray-400">Vehicle License Plate</div>
                      <div className="font-mono font-bold text-gray-900">
                        {selectedBooking.rentalDetails?.assignedVehiclePlate || 'Plate Not Set (e.g. DK 1842 AB)'}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {selectedBooking.rentalDetails?.dispatchNotifiedAt ? '✓ Customer Notified' : 'Notification Pending'}
                      </div>
                    </div>
                  </div>

                  {/* One-click trigger dispatch button */}
                  <button
                    onClick={() => openDispatchModal(selectedBooking)}
                    className="w-full py-2 bg-white border border-primary/30 text-primary font-bold text-xs rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send / Resend Chauffeur Dispatch WhatsApp Alert
                  </button>
                </div>

                {/* 4. Automated Communications Trigger Station */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Customer Booking Automations
                  </h3>
                  <p className="text-xs text-gray-500">
                    Instantly trigger personalized, pre-configured WhatsApp templates directly to the customer's phone number.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleTriggerConfirmation(selectedBooking)}
                      className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left transition-all"
                    >
                      <div className="font-bold text-xs text-emerald-900 flex items-center gap-1">
                        <Send className="w-3 h-3 text-emerald-600" />
                        1. Confirmation
                      </div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">Send reservation summary & voucher link</div>
                    </button>

                    <button
                      onClick={() => handleTriggerReminder(selectedBooking)}
                      className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition-all"
                    >
                      <div className="font-bold text-xs text-blue-900 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        2. 24h Reminder
                      </div>
                      <div className="text-[11px] text-blue-700 mt-0.5">Send pre-trip checklist & timing reminder</div>
                    </button>

                    <button
                      onClick={() => handleTriggerReview(selectedBooking)}
                      className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-left transition-all"
                    >
                      <div className="font-bold text-xs text-purple-900 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        3. Review & Deposit
                      </div>
                      <div className="text-[11px] text-purple-700 mt-0.5">Send deposit refund note & review invite</div>
                    </button>
                  </div>
                </div>

                {/* 5. Financial Breakdown */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                    Financial Breakdown
                  </h3>

                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Base Vehicle Rate:</span>
                      <span className="font-semibold text-gray-900">
                        <FormattedPrice amount={selectedBooking.rentalDetails?.baseRate || 0} />
                      </span>
                    </div>
                    {selectedBooking.rentalDetails?.zoneSurcharge ? (
                      <div className="flex justify-between">
                        <span>Zone Extension Surcharge:</span>
                        <span className="font-semibold text-gray-900">
                          +<FormattedPrice amount={selectedBooking.rentalDetails.zoneSurcharge} />
                        </span>
                      </div>
                    ) : null}
                    {selectedBooking.rentalDetails?.addOnsTotal ? (
                      <div className="flex justify-between">
                        <span>Add-ons / Equipment Total:</span>
                        <span className="font-semibold text-gray-900">
                          +<FormattedPrice amount={selectedBooking.rentalDetails.addOnsTotal} />
                        </span>
                      </div>
                    ) : null}
                    <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                      <span>Total Reservation Price:</span>
                      <span className="text-base text-primary">
                        <FormattedPrice amount={selectedBooking.totalAmount || 0} />
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-700 font-medium">
                      <span>Security Deposit Status:</span>
                      <span>
                        {selectedBooking.rentalDetails?.depositStatus === 'received' ? '✅ Deposit Received' : '⏳ Pending Handover'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="sticky bottom-0 bg-white p-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleDeleteBooking(selectedBooking.id)}
                  className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Reservation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsVoucherModalOpen(true)}
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Digital Voucher
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedBooking.id, selectedBooking.status === 'confirmed' ? 'completed' : 'confirmed');
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {selectedBooking.status === 'confirmed' ? 'Mark Completed' : 'Confirm Reservation'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DISPATCH DRIVER & VEHICLE MODAL */}
      <AnimatePresence>
        {isDispatchModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDispatchModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Dispatch Driver & Vehicle</h3>
                    <p className="text-xs text-gray-500">Assign private chauffeur and send automated dispatch notification</p>
                  </div>
                </div>
                <button onClick={() => setIsDispatchModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Preset Guides/Drivers */}
              {allGuides && allGuides.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Pick from Registered Drivers:</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {allGuides.map(guide => (
                      <button
                        key={guide.id}
                        type="button"
                        onClick={() => {
                          setDispatchDriverName(guide.name);
                          setDispatchDriverPhone(guide.whatsapp || '');
                        }}
                        className={cn(
                          "px-2.5 py-1 text-xs rounded-lg border transition-all",
                          dispatchDriverName === guide.name 
                            ? "bg-primary text-white border-primary" 
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        {guide.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Chauffeur / Driver Name *</label>
                  <input
                    type="text"
                    value={dispatchDriverName}
                    onChange={(e) => setDispatchDriverName(e.target.value)}
                    placeholder="e.g. Wayan Sudarma"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Driver WhatsApp Phone</label>
                    <input
                      type="text"
                      value={dispatchDriverPhone}
                      onChange={(e) => setDispatchDriverPhone(e.target.value)}
                      placeholder="e.g. +628123456789"
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle License Plate (DK)</label>
                    <input
                      type="text"
                      value={dispatchVehiclePlate}
                      onChange={(e) => setDispatchVehiclePlate(e.target.value)}
                      placeholder="e.g. DK 1842 AB"
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  disabled={isDispatching}
                  onClick={handleSaveAndSendDispatch}
                  className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isDispatching ? 'Dispatching...' : 'Save & Send WhatsApp Notice'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINTABLE DIGITAL RENTAL VOUCHER MODAL */}
      <AnimatePresence>
        {isVoucherModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 my-8 space-y-6 print:m-0 print:p-4">
              <div className="flex items-center justify-between border-b pb-4 print:hidden">
                <h3 className="font-black text-gray-900">Rental Voucher & Digital Handover Agreement</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Printer className="w-4 h-4" />
                    Print Voucher (PDF)
                  </button>
                  <button onClick={() => setIsVoucherModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Voucher Content */}
              <div className="space-y-6 border border-gray-200 rounded-2xl p-6 bg-white">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h2 className="text-xl font-black text-primary tracking-tight">
                      {settings?.siteName || 'Tripbone Car Rentals'}
                    </h2>
                    <p className="text-xs text-gray-500">{settings?.officeAddress || 'Bali, Indonesia'}</p>
                    <p className="text-xs text-gray-500">Contact: {settings?.whatsappNumber || settings?.supportPhone}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-base font-black text-gray-900">
                      REF #{selectedBooking.id?.slice(-6).toUpperCase()}
                    </div>
                    <div className="text-xs text-emerald-700 font-bold uppercase mt-0.5">
                      Status: {selectedBooking.status.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-gray-400 font-bold uppercase">Customer Details</div>
                    <div className="font-bold text-sm text-gray-900 mt-1">{selectedBooking.customerData?.fullName}</div>
                    <div className="text-gray-600">{selectedBooking.customerData?.phone}</div>
                    <div className="text-gray-600">{selectedBooking.customerData?.email}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 font-bold uppercase">Vehicle & Service</div>
                    <div className="font-bold text-sm text-gray-900 mt-1">{selectedBooking.rentalDetails?.vehicleName}</div>
                    <div className="text-gray-600">Mode: {selectedBooking.rentalDetails?.serviceMode === 'self_drive' ? 'Self-Drive (Car Only)' : 'Private Chauffeur Charter'}</div>
                    <div className="text-gray-600">Plate: {selectedBooking.rentalDetails?.assignedVehiclePlate || 'Standard Fleet'}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-gray-400">Pickup Date:</span>{' '}
                    <strong className="text-gray-900">{selectedBooking.date}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Pickup Time:</span>{' '}
                    <strong className="text-gray-900">{selectedBooking.rentalDetails?.pickupTime || selectedBooking.timeSlot}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Assigned Driver:</span>{' '}
                    <strong className="text-gray-900">{selectedBooking.rentalDetails?.assignedDriverName || 'Coordinator Assigned'}</strong>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-gray-400">Pickup Address:</span>{' '}
                    <strong className="text-gray-900">{selectedBooking.rentalDetails?.pickupLocation || selectedBooking.customerData?.pickupAddress}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t text-xs space-y-1">
                  <div className="flex justify-between font-bold text-sm text-gray-900">
                    <span>Total Rate:</span>
                    <span><FormattedPrice amount={selectedBooking.totalAmount || 0} /></span>
                  </div>
                </div>

                {/* Handover Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t text-center text-xs text-gray-500">
                  <div>
                    <div className="h-12 border-b border-dashed border-gray-300"></div>
                    <p className="mt-2 font-bold text-gray-700">Guest / Hirer Signature</p>
                  </div>
                  <div>
                    <div className="h-12 border-b border-dashed border-gray-300"></div>
                    <p className="mt-2 font-bold text-gray-700">Fleet Officer / Driver Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MANUAL RENTAL BOOKING MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateManualRentalModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            vehicles={vehicles}
            onSuccess={() => {
              setIsCreateModalOpen(false);
              showToast('Rental booking created successfully!', 'success');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component: Create Manual Rental Booking Modal
function CreateManualRentalModal({
  isOpen,
  onClose,
  vehicles,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  vehicles: RentalVehicle[];
  onSuccess: () => void;
}) {
  const { settings } = useSettings();
  const { tenantId } = useTenant();

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [serviceMode, setServiceMode] = useState<RentalServiceMode>('with_driver');
  const [durationType, setDurationType] = useState<'hourly' | 'half_day' | 'full_day' | 'multi_day'>('full_day');
  const [durationDays, setDurationDays] = useState(1);
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('09:00');
  const [selectedZoneId, setSelectedZoneId] = useState('zone-standard');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  }, [vehicles, selectedVehicleId]);

  const zones = settings?.carRentalModule?.zones || DEFAULT_RENTAL_ZONES;
  const currentZone = zones.find(z => z.id === selectedZoneId) || zones[0];

  // Calculate live quote
  const quote = useMemo(() => {
    if (!selectedVehicle) {
      return {
        baseRate: 0,
        zoneSurcharge: 0,
        totalAddOns: 0,
        subtotal: 0,
        grandTotal: 0,
        depositAmount: 0,
        overtimeRatePerHour: 0,
        currency: settings?.currency || 'USD',
      };
    }
    return calculateRentalQuote({
      vehicle: selectedVehicle,
      serviceMode,
      durationType,
      durationDays,
      durationHours: 10,
      zoneId: selectedZoneId,
      selectedZone: currentZone,
      currency: settings?.currency || 'USD',
    });
  }, [selectedVehicle, serviceMode, durationType, durationDays, selectedZoneId, currentZone, settings]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return alert('Please enter guest name');
    if (!selectedVehicle) return alert('Please select a vehicle');

    try {
      setIsSubmitting(true);
      const effectiveTenantId = tenantId || getActiveTenantId();

      const bookingPayload: Partial<Booking> = {
        tourId: selectedVehicle.id,
        tourTitle: `${selectedVehicle.name} (${serviceMode === 'with_driver' ? 'Chauffeur Charter' : 'Self-Drive'})`,
        bookingType: 'rental',
        customerData: {
          fullName: guestName,
          email: guestEmail || 'walkin@guest.com',
          phone: guestPhone || '+628123456789',
          pickupAddress: pickupAddress || 'Bali Hotel / Airport',
          specialRequirements: notes,
        },
        date: pickupDate,
        timeSlot: pickupTime,
        status: 'confirmed',
        paymentStatus: 'pending',
        participants: {
          adults: selectedVehicle.passengerCapacity || 4,
          children: 0,
        },
        totalAmount: quote.grandTotal,
        paymentMethod: 'cash_on_arrival',
        bookingSource: 'Manual / Walk-in',
        tenantId: effectiveTenantId,
        rentalDetails: {
          vehicleId: selectedVehicle.id,
          vehicleName: selectedVehicle.name,
          vehicleCategory: selectedVehicle.category,
          vehicleImage: selectedVehicle.featuredImage || selectedVehicle.images?.[0],
          serviceMode,
          durationType,
          durationDays,
          pickupDate,
          pickupTime,
          pickupLocation: pickupAddress || 'Bali Hotel / Airport',
          zoneId: selectedZoneId,
          zoneName: currentZone.name,
          zoneSurcharge: quote.zoneSurcharge,
          baseRate: quote.baseRate,
          securityDeposit: quote.depositAmount,
          notes,
        },
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingPayload);

      // Trigger automatic confirmation if phone provided
      if (guestPhone) {
        try {
          await triggerRentalBookingConfirmation({
            id: docRef.id,
            ...bookingPayload
          } as Booking, settings);
        } catch (autoErr) {
          console.log('Automated WA notice previewed:', autoErr);
        }
      }

      onSuccess();
    } catch (err) {
      console.error('Error creating manual booking:', err);
      alert('Failed to create manual rental booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl bg-white rounded-2xl p-6 shadow-2xl my-8 space-y-4"
      >
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-primary flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Create Walk-In / Manual Rental Booking</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 text-sm">
          {/* Guest Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Guest Full Name *</label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp Phone Number *</label>
              <input
                type="text"
                required
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+6281234567890"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Vehicle & Mode Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Select Fleet Vehicle</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-primary"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.transmission}, {v.passengerCapacity}pax)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Service Mode</label>
              <select
                value={serviceMode}
                onChange={(e) => setServiceMode(e.target.value as RentalServiceMode)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-primary"
              >
                <option value="with_driver">🚗 With Chauffeur & Petrol</option>
                <option value="self_drive">🔑 Self-Drive (Car Only)</option>
              </select>
            </div>
          </div>

          {/* Date, Time & Duration */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Pickup Date</label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Pickup Time</label>
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {serviceMode === 'self_drive' ? 'Days' : 'Charter Type'}
              </label>
              {serviceMode === 'self_drive' ? (
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-xs"
                />
              ) : (
                <select
                  value={durationType}
                  onChange={(e) => setDurationType(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-xs"
                >
                  <option value="half_day">Half Day (6h)</option>
                  <option value="full_day">Full Day (10h)</option>
                </select>
              )}
            </div>
          </div>

          {/* Pickup Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Hotel / Pickup Address</label>
            <input
              type="text"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="e.g. W Bali Seminyak / DPS Airport Arrival Gate"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
            />
          </div>

          {/* Pricing Quote Summary */}
          <div className="bg-orange-50 p-3.5 rounded-xl border border-orange-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-orange-800 font-bold">Estimated Grand Total:</div>
              <div className="text-xl font-black text-primary">
                <FormattedPrice amount={quote.grandTotal} />
              </div>
            </div>
            <div className="text-right text-xs text-orange-700">
              <div>Base: <FormattedPrice amount={quote.baseRate} /></div>
              {quote.depositAmount > 0 && <div>Deposit: <FormattedPrice amount={quote.depositAmount} /></div>}
            </div>
          </div>

          <div className="pt-2 border-t flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-all shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Reservation'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
