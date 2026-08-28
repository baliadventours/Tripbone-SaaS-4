import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, getDocs, getActiveTenantId } from '@/src/lib/firebase';
import { Booking, UserProfile, TenantInvoice } from '../../types';
import * as Icons from 'lucide-react';
import { cn, formatPrice } from '../../lib/utils';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  subDays, 
  subWeeks, 
  subMonths, 
  subYears, 
  addDays, 
  addWeeks, 
  addMonths, 
  addYears, 
  isWithinInterval,
  isBefore
} from 'date-fns';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import InvoiceViewerModal from './Invoice/InvoiceViewerModal';
import InvoiceGeneratorModal from './Invoice/InvoiceGeneratorModal';

interface BookingReportsProps {
  currentUserProfile: UserProfile | null;
}

type Period = 'daily' | 'weekly' | 'monthly' | 'annually' | 'custom';
type ReportTab = 'overview' | 'channels' | 'invoices' | 'ledger';

interface ChannelMetrics {
  name: string;
  key: 'online' | 'offline' | 'ota';
  color: string;
  badgeBg: string;
  badgeText: string;
  icon: any;
  revenue: number;
  netEarnings: number;
  count: number;
  sharePercent: number;
  aov: number;
  paxCount: number;
  subSources: Record<string, { count: number; revenue: number }>;
}

export default function BookingReports({ currentUserProfile }: BookingReportsProps) {
  const activeTenantId = getActiveTenantId() || 'global';
  const isAdmin = currentUserProfile?.role === 'admin';
  const isSupplier = currentUserProfile?.role === 'supplier';

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [period, setPeriod] = useState<Period>('monthly');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Filter States
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [selectedPaymentStatusFilter, setSelectedPaymentStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination for Ledger
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Modals for Invoices
  const [selectedInvoice, setSelectedInvoice] = useState<TenantInvoice | null>(null);
  const [isInvoiceViewerOpen, setIsInvoiceViewerOpen] = useState<boolean>(false);
  const [isInvoiceGeneratorOpen, setIsInvoiceGeneratorOpen] = useState<boolean>(false);

  // 1. Real-time Subscription to Bookings
  useEffect(() => {
    let q = query(collection(db, 'bookings'));

    if (isSupplier && currentUserProfile?.uid) {
      q = query(
        collection(db, 'bookings'),
        where('supplierId', '==', currentUserProfile.uid)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];

      // Filter by tenant if applicable
      const tenantBookings = bookingsData.filter(b => {
        if (!activeTenantId || activeTenantId === 'global') return true;
        return !b.tenantId || b.tenantId === activeTenantId;
      });

      setBookings(tenantBookings);
      setLoading(false);
    }, (err) => {
      console.error("[BookingReports] Bookings sync error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserProfile, isSupplier, activeTenantId]);

  // 2. Real-time Subscription to Tenant Invoices
  useEffect(() => {
    const q = query(collection(db, 'tenant_invoices'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invList: TenantInvoice[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as any;
        if (!data.tenantId || data.tenantId === activeTenantId || activeTenantId === 'global') {
          invList.push({ id: docSnap.id, ...data });
        }
      });
      setInvoices(invList);
    }, (err) => {
      console.warn("[BookingReports] Invoices sync error:", err);
    });

    return () => unsubscribe();
  }, [activeTenantId]);

  // 3. Fetch Suppliers for Admin Multi-vendor breakdown
  useEffect(() => {
    if (isAdmin) {
      const fetchSuppliers = async () => {
        try {
          const q = query(collection(db, 'users'), where('role', '==', 'supplier'));
          const snapshot = await getDocs(q);
          const suppliersData = snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
          })) as UserProfile[];
          setSuppliers(suppliersData);
        } catch (e) {
          console.warn("[BookingReports] Supplier fetch error:", e);
        }
      };
      fetchSuppliers();
    }
  }, [isAdmin]);

  // Navigation handlers
  const navigatePeriod = (direction: 'prev' | 'next') => {
    switch (period) {
      case 'daily':
        setReferenceDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
        break;
      case 'weekly':
        setReferenceDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
        break;
      case 'monthly':
        setReferenceDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        break;
      case 'annually':
        setReferenceDate(prev => direction === 'prev' ? subYears(prev, 1) : addYears(prev, 1));
        break;
    }
  };

  // Helper to categorize a booking into 3 main channels: 'online' | 'offline' | 'ota'
  const getBookingChannel = (b: Booking): { channel: 'online' | 'offline' | 'ota'; label: string; subSource: string } => {
    const rawSource = (b.bookingSource || '').trim();
    const rawMethod = (b.paymentMethod || '').toLowerCase();

    // Check OTA first
    const otaList = ['klook', 'viator', 'getyourguide', 'tripadvisor', 'booking.com', 'ota', 'ota offline', 'expedia', 'airbnb'];
    const isOTA = otaList.some(ota => rawSource.toLowerCase().includes(ota));
    if (isOTA) {
      return {
        channel: 'ota',
        label: 'OTA Channel',
        subSource: rawSource || 'OTA Partner'
      };
    }

    // Check Offline / Manual
    const offlineList = ['manual', 'walk-in', 'walk in', 'whatsapp direct', 'whatsapp', 'phone', 'email', 'hotel concierge', 'concierge', 'admin backend', 'agent', 'desk', 'cash'];
    const isOffline = offlineList.some(off => rawSource.toLowerCase().includes(off)) || rawMethod === 'manual' || rawMethod === 'cash' || rawMethod === 'pay_on_arrival';
    if (isOffline) {
      return {
        channel: 'offline',
        label: 'Offline / Manual',
        subSource: rawSource || 'Admin Manual'
      };
    }

    // Default to Online Direct
    return {
      channel: 'online',
      label: 'Online Direct',
      subSource: rawSource || (rawMethod ? `Website (${rawMethod})` : 'Website Direct')
    };
  };

  // Compute Current Date Range
  const currentInterval = useMemo(() => {
    let start: Date;
    let end: Date;

    switch (period) {
      case 'daily':
        start = startOfDay(referenceDate);
        end = endOfDay(referenceDate);
        break;
      case 'weekly':
        start = startOfWeek(referenceDate, { weekStartsOn: 1 });
        end = endOfWeek(referenceDate, { weekStartsOn: 1 });
        break;
      case 'monthly':
        start = startOfMonth(referenceDate);
        end = endOfMonth(referenceDate);
        break;
      case 'annually':
        start = startOfYear(referenceDate);
        end = endOfYear(referenceDate);
        break;
      case 'custom':
        start = startOfDay(new Date(customStartDate));
        end = endOfDay(new Date(customEndDate));
        break;
      default:
        start = startOfMonth(referenceDate);
        end = endOfMonth(referenceDate);
    }

    return { start, end };
  }, [period, referenceDate, customStartDate, customEndDate]);

  // Compute Previous Interval for Growth Comparison
  const previousInterval = useMemo(() => {
    let start: Date;
    let end: Date;

    switch (period) {
      case 'daily':
        start = startOfDay(subDays(referenceDate, 1));
        end = endOfDay(subDays(referenceDate, 1));
        break;
      case 'weekly':
        start = startOfWeek(subWeeks(referenceDate, 1), { weekStartsOn: 1 });
        end = endOfWeek(subWeeks(referenceDate, 1), { weekStartsOn: 1 });
        break;
      case 'monthly':
        start = startOfMonth(subMonths(referenceDate, 1));
        end = endOfMonth(subMonths(referenceDate, 1));
        break;
      case 'annually':
        start = startOfYear(subYears(referenceDate, 1));
        end = endOfYear(subYears(referenceDate, 1));
        break;
      case 'custom': {
        const daysDiff = Math.max(1, Math.round((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24)));
        start = startOfDay(subDays(new Date(customStartDate), daysDiff));
        end = endOfDay(subDays(new Date(customStartDate), 1));
        break;
      }
      default:
        start = startOfMonth(subMonths(referenceDate, 1));
        end = endOfMonth(subMonths(referenceDate, 1));
    }

    return { start, end };
  }, [period, referenceDate, customStartDate, customEndDate]);

  // Period Display Label
  const periodLabel = useMemo(() => {
    switch (period) {
      case 'daily':
        return format(referenceDate, 'EEEE, dd MMM yyyy');
      case 'weekly':
        return `${format(startOfWeek(referenceDate, { weekStartsOn: 1 }), 'dd MMM')} - ${format(endOfWeek(referenceDate, { weekStartsOn: 1 }), 'dd MMM yyyy')}`;
      case 'monthly':
        return format(referenceDate, 'MMMM yyyy');
      case 'annually':
        return `Year ${format(referenceDate, 'yyyy')}`;
      case 'custom':
        return `${format(new Date(customStartDate), 'dd MMM yyyy')} - ${format(new Date(customEndDate), 'dd MMM yyyy')}`;
    }
  }, [period, referenceDate, customStartDate, customEndDate]);

  // Helper to extract booking Date safely
  const getBookingDate = (b: Booking): Date => {
    if (b.createdAt?.toDate && typeof b.createdAt.toDate === 'function') {
      return b.createdAt.toDate();
    }
    if (b.createdAt) {
      const d = new Date(b.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    if (b.date) {
      const d = new Date(b.date);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  // Filtered Bookings for the Active Period
  const periodBookings = useMemo(() => {
    return bookings.filter(b => {
      if (b.status === 'cancelled') {
        return false;
      }
      const date = getBookingDate(b);
      return isWithinInterval(date, currentInterval);
    });
  }, [bookings, currentInterval]);

  // Bookings from Previous Period for Growth Calculation
  const prevPeriodBookings = useMemo(() => {
    return bookings.filter(b => {
      if (b.status === 'cancelled') return false;
      const date = getBookingDate(b);
      return isWithinInterval(date, previousInterval);
    });
  }, [bookings, previousInterval]);

  // Invoices for the Active Period & Total Invoice Status
  const periodInvoices = useMemo(() => {
    return invoices.filter(inv => {
      let invDate = new Date();
      if (inv.createdAt?.toDate && typeof inv.createdAt.toDate === 'function') {
        invDate = inv.createdAt.toDate();
      } else if (inv.issueDate) {
        invDate = new Date(inv.issueDate);
      }
      return isWithinInterval(invDate, currentInterval);
    });
  }, [invoices, currentInterval]);

  // Comprehensive Financial & Channel Statistics
  const financialStats = useMemo(() => {
    let totalGrossRevenue = 0;
    let totalNetEarnings = 0;
    let totalMerchantFees = 0;
    let totalAdults = 0;
    let totalChildren = 0;
    let totalTourRevenue = 0;
    let totalRentalRevenue = 0;

    const channelMap: Record<'online' | 'offline' | 'ota', ChannelMetrics> = {
      online: {
        name: 'Online Direct',
        key: 'online',
        color: '#3B82F6',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        icon: Icons.Globe,
        revenue: 0,
        netEarnings: 0,
        count: 0,
        sharePercent: 0,
        aov: 0,
        paxCount: 0,
        subSources: {}
      },
      offline: {
        name: 'Offline / Manual',
        key: 'offline',
        color: '#10B981',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        icon: Icons.UserCheck,
        revenue: 0,
        netEarnings: 0,
        count: 0,
        sharePercent: 0,
        aov: 0,
        paxCount: 0,
        subSources: {}
      },
      ota: {
        name: 'OTA Channels',
        key: 'ota',
        color: '#F59E0B',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        icon: Icons.PlaneTakeoff,
        revenue: 0,
        netEarnings: 0,
        count: 0,
        sharePercent: 0,
        aov: 0,
        paxCount: 0,
        subSources: {}
      }
    };

    const paymentGateways: Record<string, { count: number; amount: number }> = {};
    const topServicesMap: Record<string, { title: string; count: number; revenue: number; pax: number; type: string }> = {};

    periodBookings.forEach(b => {
      const gross = Number(b.totalAmount) || 0;
      const fee = Number(b.merchantFee) || 0;
      const net = b.supplierEarnings !== undefined ? Number(b.supplierEarnings) : (gross - fee);
      const adults = Number(b.participants?.adults) || 1;
      const children = Number(b.participants?.children) || 0;
      const pax = adults + children;

      totalGrossRevenue += gross;
      totalNetEarnings += net;
      totalMerchantFees += fee;
      totalAdults += adults;
      totalChildren += children;

      // Service Category Split
      const isCarRental = b.bookingType === 'rental' || Boolean(b.rentalDetails) || b.tourTitle?.toLowerCase().includes('rental') || b.tourTitle?.toLowerCase().includes('charter');
      if (isCarRental) {
        totalRentalRevenue += gross;
      } else {
        totalTourRevenue += gross;
      }

      // Channel mapping
      const { channel, subSource } = getBookingChannel(b);
      channelMap[channel].revenue += gross;
      channelMap[channel].netEarnings += net;
      channelMap[channel].count += 1;
      channelMap[channel].paxCount += pax;

      if (!channelMap[channel].subSources[subSource]) {
        channelMap[channel].subSources[subSource] = { count: 0, revenue: 0 };
      }
      channelMap[channel].subSources[subSource].count += 1;
      channelMap[channel].subSources[subSource].revenue += gross;

      // Payment Gateway breakdown
      const method = (b.paymentMethod || 'manual').toUpperCase();
      if (!paymentGateways[method]) {
        paymentGateways[method] = { count: 0, amount: 0 };
      }
      paymentGateways[method].count += 1;
      paymentGateways[method].amount += gross;

      // Top Services
      const serviceKey = b.tourTitle || b.tourId || 'Standard Service';
      if (!topServicesMap[serviceKey]) {
        topServicesMap[serviceKey] = {
          title: serviceKey,
          count: 0,
          revenue: 0,
          pax: 0,
          type: isCarRental ? 'Car Rental' : 'Tour Package'
        };
      }
      topServicesMap[serviceKey].count += 1;
      topServicesMap[serviceKey].revenue += gross;
      topServicesMap[serviceKey].pax += pax;
    });

    // Calculate shares and AOVs
    const totalCount = periodBookings.length;
    (['online', 'offline', 'ota'] as const).forEach(key => {
      const ch = channelMap[key];
      ch.sharePercent = totalGrossRevenue > 0 ? Math.round((ch.revenue / totalGrossRevenue) * 100) : 0;
      ch.aov = ch.count > 0 ? Math.round(ch.revenue / ch.count) : 0;
    });

    // Previous period comparisons
    let prevGross = 0;
    let prevNet = 0;
    prevPeriodBookings.forEach(b => {
      const g = Number(b.totalAmount) || 0;
      const f = Number(b.merchantFee) || 0;
      prevGross += g;
      prevNet += (b.supplierEarnings !== undefined ? Number(b.supplierEarnings) : (g - f));
    });

    const revenueGrowth = prevGross > 0 ? ((totalGrossRevenue - prevGross) / prevGross) * 100 : (totalGrossRevenue > 0 ? 100 : 0);
    const countGrowth = prevPeriodBookings.length > 0 ? ((totalCount - prevPeriodBookings.length) / prevPeriodBookings.length) * 100 : (totalCount > 0 ? 100 : 0);

    // Top 5 services array
    const topServices = Object.values(topServicesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Invoice Metrics for Active Period & Lifetime Accounts Receivable
    let totalInvoicedAmount = 0;
    let totalPaidInvoicesAmount = 0;
    let totalPaidInvoicesCount = 0;
    let totalUnpaidInvoicesAmount = 0;
    let totalUnpaidInvoicesCount = 0;
    let totalOverdueInvoicesAmount = 0;
    let totalOverdueInvoicesCount = 0;

    const todayDate = new Date();

    periodInvoices.forEach(inv => {
      const total = Number(inv.totalAmount) || 0;
      const paid = Number(inv.paidAmount) || (inv.status === 'paid' ? total : 0);
      const balance = inv.balanceDue !== undefined ? Number(inv.balanceDue) : (total - paid);

      totalInvoicedAmount += total;

      const isOverdue = inv.status === 'overdue' || (inv.status === 'unpaid' && inv.dueDate && isBefore(new Date(inv.dueDate), todayDate));

      if (inv.status === 'paid' || balance <= 0) {
        totalPaidInvoicesAmount += total;
        totalPaidInvoicesCount += 1;
      } else if (isOverdue) {
        totalOverdueInvoicesAmount += balance;
        totalOverdueInvoicesCount += 1;
        totalUnpaidInvoicesAmount += balance;
        totalUnpaidInvoicesCount += 1;
      } else {
        totalUnpaidInvoicesAmount += balance;
        totalUnpaidInvoicesCount += 1;
      }
    });

    const invoiceCollectionRate = totalInvoicedAmount > 0 ? Math.round((totalPaidInvoicesAmount / totalInvoicedAmount) * 100) : 100;

    return {
      totalGrossRevenue,
      totalNetEarnings,
      totalMerchantFees,
      totalBookings: totalCount,
      totalPax: totalAdults + totalChildren,
      totalAdults,
      totalChildren,
      aov: totalCount > 0 ? Math.round(totalGrossRevenue / totalCount) : 0,
      revPerPax: (totalAdults + totalChildren) > 0 ? Math.round(totalGrossRevenue / (totalAdults + totalChildren)) : 0,
      totalTourRevenue,
      totalRentalRevenue,
      channels: channelMap,
      paymentGateways,
      topServices,
      revenueGrowth,
      countGrowth,
      // Invoices
      totalInvoicedAmount,
      totalPaidInvoicesAmount,
      totalPaidInvoicesCount,
      totalUnpaidInvoicesAmount,
      totalUnpaidInvoicesCount,
      totalOverdueInvoicesAmount,
      totalOverdueInvoicesCount,
      invoiceCollectionRate
    };
  }, [periodBookings, prevPeriodBookings, periodInvoices]);

  // Chart Data Generation (Hourly for Daily, Daily for Monthly/Weekly, Monthly for Annually)
  const chartData = useMemo(() => {
    if (period === 'daily') {
      // 24 Hour blocks
      const hours = Array.from({ length: 24 }, (_, i) => {
        const hourLabel = `${i.toString().padStart(2, '0')}:00`;
        return {
          label: hourLabel,
          revenue: 0,
          net: 0,
          orders: 0
        };
      });

      periodBookings.forEach(b => {
        const d = getBookingDate(b);
        const h = d.getHours();
        if (hours[h]) {
          const gross = Number(b.totalAmount) || 0;
          const fee = Number(b.merchantFee) || 0;
          const net = b.supplierEarnings !== undefined ? Number(b.supplierEarnings) : (gross - fee);
          hours[h].revenue += gross;
          hours[h].net += net;
          hours[h].orders += 1;
        }
      });
      return hours;
    }

    if (period === 'weekly') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekData = days.map((day) => ({
        label: day,
        revenue: 0,
        net: 0,
        orders: 0
      }));

      periodBookings.forEach(b => {
        const d = getBookingDate(b);
        const dayIdx = (d.getDay() + 6) % 7;
        if (weekData[dayIdx]) {
          const gross = Number(b.totalAmount) || 0;
          const fee = Number(b.merchantFee) || 0;
          const net = b.supplierEarnings !== undefined ? Number(b.supplierEarnings) : (gross - fee);
          weekData[dayIdx].revenue += gross;
          weekData[dayIdx].net += net;
          weekData[dayIdx].orders += 1;
        }
      });
      return weekData;
    }

    if (period === 'monthly') {
      const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
      const monthData = Array.from({ length: daysInMonth }, (_, i) => ({
        label: `${i + 1}`,
        fullLabel: format(new Date(referenceDate.getFullYear(), referenceDate.getMonth(), i + 1), 'dd MMM'),
        revenue: 0,
        net: 0,
        orders: 0
      }));

      periodBookings.forEach(b => {
        const d = getBookingDate(b);
        const dayNum = d.getDate();
        if (monthData[dayNum - 1]) {
          const gross = Number(b.totalAmount) || 0;
          const fee = Number(b.merchantFee) || 0;
          const net = b.supplierEarnings !== undefined ? Number(b.supplierEarnings) : (gross - fee);
          monthData[dayNum - 1].revenue += gross;
          monthData[dayNum - 1].net += net;
          monthData[dayNum - 1].orders += 1;
        }
      });
      return monthData;
    }

    if (period === 'annually') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const yearData = months.map((m) => ({
        label: m,
        revenue: 0,
        net: 0,
        orders: 0
      }));

      periodBookings.forEach(b => {
        const d = getBookingDate(b);
        const m = d.getMonth();
        if (yearData[m]) {
          const gross = Number(b.totalAmount) || 0;
          const fee = Number(b.merchantFee) || 0;
          const net = b.supplierEarnings !== undefined ? Number(b.supplierEarnings) : (gross - fee);
          yearData[m].revenue += gross;
          yearData[m].net += net;
          yearData[m].orders += 1;
        }
      });
      return yearData;
    }

    // Custom period fallback (Group by Day)
    const customDaysMap: Record<string, { label: string; revenue: number; net: number; orders: number }> = {};
    periodBookings.forEach(b => {
      const d = getBookingDate(b);
      const key = format(d, 'yyyy-MM-dd');
      const label = format(d, 'dd MMM');
      if (!customDaysMap[key]) {
        customDaysMap[key] = { label, revenue: 0, net: 0, orders: 0 };
      }
      const gross = Number(b.totalAmount) || 0;
      const fee = Number(b.merchantFee) || 0;
      const net = b.supplierEarnings !== undefined ? Number(b.supplierEarnings) : (gross - fee);
      customDaysMap[key].revenue += gross;
      customDaysMap[key].net += net;
      customDaysMap[key].orders += 1;
    });

    return Object.keys(customDaysMap).sort().map(k => customDaysMap[k]);
  }, [period, referenceDate, periodBookings]);

  // Channel Pie Data for Recharts
  const channelPieData = useMemo(() => {
    return [
      { name: 'Online Direct', value: financialStats.channels.online.revenue, color: '#3B82F6' },
      { name: 'Offline / Manual', value: financialStats.channels.offline.revenue, color: '#10B981' },
      { name: 'OTA Channels', value: financialStats.channels.ota.revenue, color: '#F59E0B' }
    ].filter(item => item.value > 0);
  }, [financialStats]);

  // Filtered Ledger Bookings (Search + Filters + Pagination)
  const filteredLedgerBookings = useMemo(() => {
    return periodBookings.filter(b => {
      // Channel Filter
      if (selectedChannelFilter !== 'all') {
        const { channel } = getBookingChannel(b);
        if (channel !== selectedChannelFilter) return false;
      }

      // Service Filter
      if (selectedServiceFilter !== 'all') {
        const isCarRental = b.bookingType === 'rental' || Boolean(b.rentalDetails) || b.tourTitle?.toLowerCase().includes('rental');
        if (selectedServiceFilter === 'rental' && !isCarRental) return false;
        if (selectedServiceFilter === 'tour' && isCarRental) return false;
      }

      // Payment Status Filter
      if (selectedPaymentStatusFilter !== 'all') {
        const st = (b.paymentStatus || b.status || 'paid').toLowerCase();
        if (st !== selectedPaymentStatusFilter.toLowerCase()) return false;
      }

      // Supplier Filter
      if (isAdmin && selectedSupplierId !== 'all') {
        if (b.supplierId !== selectedSupplierId) return false;
      }

      // Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const refMatch = b.id?.toLowerCase().includes(q);
        const nameMatch = b.customerData?.fullName?.toLowerCase().includes(q) || b.customerData?.email?.toLowerCase().includes(q);
        const titleMatch = b.tourTitle?.toLowerCase().includes(q);
        const invMatch = b.invoiceId?.toLowerCase().includes(q);
        if (!refMatch && !nameMatch && !titleMatch && !invMatch) return false;
      }

      return true;
    });
  }, [
    periodBookings, 
    selectedChannelFilter, 
    selectedServiceFilter, 
    selectedPaymentStatusFilter, 
    selectedSupplierId, 
    searchQuery, 
    isAdmin
  ]);

  // Paginated Ledger
  const totalLedgerPages = Math.ceil(filteredLedgerBookings.length / itemsPerPage) || 1;
  const paginatedLedger = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLedgerBookings.slice(start, start + itemsPerPage);
  }, [filteredLedgerBookings, currentPage, itemsPerPage]);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (filteredLedgerBookings.length === 0) {
      alert("No data available to export for this period.");
      return;
    }

    const headers = [
      'Booking ID',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Service / Tour',
      'Service Type',
      'Channel',
      'Sub Source',
      'Payment Gateway',
      'Status',
      'Adults',
      'Children',
      'Gross Amount ($)',
      'Merchant Fee ($)',
      'Net Earnings ($)',
      'Linked Invoice ID'
    ];

    const rows = filteredLedgerBookings.map(b => {
      const { channel, subSource } = getBookingChannel(b);
      const isRental = b.bookingType === 'rental' || Boolean(b.rentalDetails) || b.tourTitle?.toLowerCase().includes('rental');
      const d = getBookingDate(b);
      const gross = Number(b.totalAmount) || 0;
      const fee = Number(b.merchantFee) || 0;
      const net = b.supplierEarnings !== undefined ? Number(b.supplierEarnings) : (gross - fee);

      return [
        `"${b.id}"`,
        `"${format(d, 'yyyy-MM-dd HH:mm')}"`,
        `"${(b.customerData?.fullName || '').replace(/"/g, '""')}"`,
        `"${(b.customerData?.email || '').replace(/"/g, '""')}"`,
        `"${(b.customerData?.phone || '').replace(/"/g, '""')}"`,
        `"${(b.tourTitle || '').replace(/"/g, '""')}"`,
        `"${isRental ? 'Car Rental' : 'Tour Package'}"`,
        `"${channel.toUpperCase()}"`,
        `"${subSource.replace(/"/g, '""')}"`,
        `"${(b.paymentMethod || 'Manual').toUpperCase()}"`,
        `"${(b.status || 'Confirmed').toUpperCase()}"`,
        b.participants?.adults || 1,
        b.participants?.children || 0,
        gross.toFixed(2),
        fee.toFixed(2),
        net.toFixed(2),
        `"${b.invoiceId || ''}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial-statement-${period}-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Statement Function
  const handlePrintReport = () => {
    window.print();
  };

  // Open Linked Invoice
  const handleOpenLinkedInvoice = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId || i.invoiceNumber === invoiceId);
    if (inv) {
      setSelectedInvoice(inv);
      setIsInvoiceViewerOpen(true);
    } else {
      alert(`Invoice #${invoiceId} not found or was generated externally.`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Icons.Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          Synthesizing Financial Ledger & Invoices...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* 1. Header & Financial Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-orange-50 text-primary flex items-center justify-center shadow-xs">
              <Icons.BadgePercent className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Financial & Revenue Report</h2>
              <p className="text-xs text-gray-500 font-medium">
                P&L analytics, multi-channel attribution (Online, Offline, OTA), and Invoice integration
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Period Navigation */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector Tabs */}
          <div className="flex bg-gray-100/80 p-1 rounded-2xl border border-gray-200/50">
            {(['daily', 'weekly', 'monthly', 'annually', 'custom'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  period === p 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                {p === 'annually' ? 'Yearly' : p}
              </button>
            ))}
          </div>

          {/* Date Navigator (for non-custom) */}
          {period !== 'custom' ? (
            <div className="flex items-center bg-white border border-gray-200 rounded-2xl p-1 shadow-xs">
              <button
                onClick={() => navigatePeriod('prev')}
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-primary transition"
                title="Previous Period"
              >
                <Icons.ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-xs font-black text-gray-800 min-w-[140px] text-center">
                {periodLabel}
              </span>
              <button
                onClick={() => navigatePeriod('next')}
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-primary transition"
                title="Next Period"
              >
                <Icons.ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Custom Date Picker Inputs */
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs font-bold text-gray-800 bg-transparent px-2 py-1 outline-none"
              />
              <span className="text-gray-400 text-xs font-bold">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs font-bold text-gray-800 bg-transparent px-2 py-1 outline-none"
              />
            </div>
          )}

          {/* Today Button */}
          {period !== 'custom' && (
            <button
              onClick={() => setReferenceDate(new Date())}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider transition border border-gray-200"
            >
              Today
            </button>
          )}

          {/* Supplier Filter for Admins */}
          {isAdmin && suppliers.length > 0 && (
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:border-primary outline-none shadow-xs"
            >
              <option value="all">All Suppliers (Platform)</option>
              {suppliers.map(s => (
                <option key={s.uid} value={s.uid}>{s.companyName || s.displayName || s.email}</option>
              ))}
            </select>
          )}

          {/* Export & Print Dropdown */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition shadow-xs"
              title="Export Ledger as CSV for Excel / Accounting"
            >
              <Icons.Download className="w-3.5 h-3.5 text-primary" />
              <span>CSV</span>
            </button>
            <button
              onClick={handlePrintReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition shadow-xs"
              title="Print Clean Statement"
            >
              <Icons.Printer className="w-3.5 h-3.5 text-gray-500" />
              <span>Print</span>
            </button>
            <button
              onClick={() => setIsInvoiceGeneratorOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-orange-600 text-white text-xs font-black transition shadow-sm shadow-orange-500/20"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
              <span>New Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Executive KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Booking Value (GMV) */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icons.DollarSign className="w-5 h-5" />
            </div>
            <div className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1",
              financialStats.revenueGrowth >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}>
              {financialStats.revenueGrowth >= 0 ? <Icons.TrendingUp className="w-3 h-3" /> : <Icons.TrendingDown className="w-3 h-3" />}
              <span>{financialStats.revenueGrowth >= 0 ? '+' : ''}{financialStats.revenueGrowth.toFixed(1)}%</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gross Booking Value (GMV)</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5 tracking-tight">
              {formatPrice(financialStats.totalGrossRevenue)}
            </p>
            <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium mt-2 pt-2 border-t border-gray-50">
              <span>{financialStats.totalBookings} Completed Bookings</span>
              <span>AOV: {formatPrice(financialStats.aov)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Net Profit & Earnings */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icons.Wallet className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
              {financialStats.totalGrossRevenue > 0 
                ? `${Math.round((financialStats.totalNetEarnings / financialStats.totalGrossRevenue) * 100)}% Margin` 
                : '100% Margin'}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Net Profit / Earnings</span>
            <p className="text-2xl font-black text-emerald-600 mt-0.5 tracking-tight">
              {formatPrice(financialStats.totalNetEarnings)}
            </p>
            <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium mt-2 pt-2 border-t border-gray-50">
              <span>Gateway Fees: {formatPrice(financialStats.totalMerchantFees)}</span>
              <span>Net/Pax: {formatPrice(financialStats.revPerPax)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Pax Served */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Icons.Users className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-wider">
              {financialStats.totalAdults} Adults • {financialStats.totalChildren} Kids
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Passengers (Pax)</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5 tracking-tight">
              {financialStats.totalPax} Guests
            </p>
            <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium mt-2 pt-2 border-t border-gray-50">
              <span>Tours: {formatPrice(financialStats.totalTourRevenue)}</span>
              <span>Rentals: {formatPrice(financialStats.totalRentalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Invoice Accounts Receivable (A/R) Status */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-primary flex items-center justify-center">
              <Icons.Receipt className="w-5 h-5" />
            </div>
            <span className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
              financialStats.totalOverdueInvoicesCount > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
            )}>
              {financialStats.invoiceCollectionRate}% Collected
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Invoiced Volume</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5 tracking-tight">
              {formatPrice(financialStats.totalInvoicedAmount)}
            </p>
            <div className="flex items-center justify-between text-[11px] font-medium mt-2 pt-2 border-t border-gray-50">
              <span className="text-emerald-600 font-bold">Paid: {formatPrice(financialStats.totalPaidInvoicesAmount)}</span>
              <span className="text-rose-600 font-bold">Unpaid: {formatPrice(financialStats.totalUnpaidInvoicesAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { id: 'overview', label: 'Financial Overview & P&L', icon: Icons.BarChart3 },
          { id: 'channels', label: 'Channel Attribution (Online / Offline / OTA)', icon: Icons.Layers },
          { id: 'invoices', label: 'Invoices & Receivables (A/R)', icon: Icons.FileText, count: periodInvoices.length },
          { id: 'ledger', label: 'Transaction Audit Ledger', icon: Icons.TableProperties, count: filteredLedgerBookings.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-black transition-all cursor-pointer",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === tab.id ? "bg-orange-50 text-primary" : "bg-gray-100 text-gray-600"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW & P&L */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Main Trend Chart */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Revenue & Profit Progression</h3>
                <p className="text-xs text-gray-500 font-medium">
                  {period === 'daily' ? 'Hourly revenue & profit distribution' :
                   period === 'weekly' ? 'Daily revenue throughout this week' :
                   period === 'monthly' ? 'Daily revenue curve for this month' :
                   period === 'annually' ? 'Monthly revenue breakdown (Jan - Dec)' : 'Custom interval progression'}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-gray-700">Gross Booking Value</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-gray-700">Net Profit</span>
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-[320px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EA580C" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#EA580C" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }} 
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }}
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-xl border border-gray-800 text-xs space-y-1.5 min-w-[140px]">
                              <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">
                                {data.fullLabel || label}
                              </p>
                              <div className="flex justify-between items-center text-primary font-black">
                                <span>Gross Revenue:</span>
                                <span>{formatPrice(data.revenue)}</span>
                              </div>
                              <div className="flex justify-between items-center text-emerald-400 font-bold">
                                <span>Net Profit:</span>
                                <span>{formatPrice(data.net)}</span>
                              </div>
                              <div className="flex justify-between items-center text-gray-300 text-[10px]">
                                <span>Orders:</span>
                                <span>{data.orders} bookings</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Gross Revenue"
                      stroke="#EA580C" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#revenueGrad)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="net" 
                      name="Net Profit"
                      stroke="#10B981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#netGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                  No transaction data available for this chart.
                </div>
              )}
            </div>
          </div>

          {/* Two-Column Diagnostic: Channel Share vs Top Performing Products */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Donut Chart: Channel Distribution */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900 tracking-tight">Sales Channel Distribution</h3>
                <p className="text-xs text-gray-500 font-medium">Revenue contribution by channel</p>
              </div>

              <div className="h-[220px] w-full relative flex items-center justify-center">
                {channelPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelPieData}
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {channelPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => formatPrice(Number(value))}
                        contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-xs text-gray-400 font-bold">
                    No channel sales recorded in this period
                  </div>
                )}
                {channelPieData.length > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Sales</span>
                    <span className="text-sm font-black text-gray-900">{formatPrice(financialStats.totalGrossRevenue)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-center">
                <div className="p-2 rounded-xl bg-blue-50/60">
                  <span className="text-[10px] font-bold text-blue-700 block">Online</span>
                  <span className="text-xs font-black text-blue-900">{financialStats.channels.online.sharePercent}%</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50/60">
                  <span className="text-[10px] font-bold text-emerald-700 block">Offline</span>
                  <span className="text-xs font-black text-emerald-900">{financialStats.channels.offline.sharePercent}%</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/60">
                  <span className="text-[10px] font-bold text-amber-700 block">OTA</span>
                  <span className="text-xs font-black text-amber-900">{financialStats.channels.ota.sharePercent}%</span>
                </div>
              </div>
            </div>

            {/* Top Performing Services & Add-ons */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-900 tracking-tight">Top Revenue Drivers</h3>
                  <p className="text-xs text-gray-500 font-medium">Best performing tours & charter products</p>
                </div>
                <span className="text-xs font-bold text-gray-400">
                  {financialStats.topServices.length} key products
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {financialStats.topServices.length > 0 ? (
                  financialStats.topServices.map((service, index) => {
                    const percent = financialStats.totalGrossRevenue > 0 ? Math.round((service.revenue / financialStats.totalGrossRevenue) * 100) : 0;
                    return (
                      <div key={index} className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-lg bg-gray-200 text-gray-700 text-[10px] font-black flex items-center justify-center shrink-0">
                              #{index + 1}
                            </span>
                            <p className="text-xs font-black text-gray-900 truncate">
                              {service.title}
                            </p>
                            <span className="px-2 py-0.5 rounded-full bg-white text-gray-600 text-[9px] font-bold border border-gray-200 shrink-0">
                              {service.type}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-gray-900">{formatPrice(service.revenue)}</span>
                            <span className="text-[10px] text-gray-500 font-bold block">{service.count} bookings ({service.pax} pax)</span>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-gray-400 font-bold">
                    No service transactions logged for this period.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHANNEL ATTRIBUTION (ONLINE VS OFFLINE VS OTA) */}
      {activeTab === 'channels' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Channel Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['online', 'offline', 'ota'] as const).map(key => {
              const ch = financialStats.channels[key];
              const IconComp = ch.icon;

              return (
                <div key={key} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs", ch.badgeBg, ch.badgeText)}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className={cn("px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider", ch.badgeBg, ch.badgeText)}>
                        {ch.sharePercent}% Share
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-gray-900">{ch.name}</h3>
                      <p className="text-xs text-gray-500 font-medium">
                        {key === 'online' ? 'Direct website checkout & payment gateways' :
                         key === 'offline' ? 'Walk-in, phone orders, WhatsApp, concierge' :
                         'Viator, Klook, GetYourGuide, TripAdvisor'}
                      </p>
                    </div>

                    {/* Revenue & Margin Box */}
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[11px] font-bold text-gray-400 uppercase">Gross Revenue</span>
                        <span className="text-lg font-black text-gray-900">{formatPrice(ch.revenue)}</span>
                      </div>
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-bold text-gray-500">Net Profit</span>
                        <span className="font-black text-emerald-600">{formatPrice(ch.netEarnings)}</span>
                      </div>
                      <div className="flex justify-between items-baseline text-xs pt-1 border-t border-gray-200/60">
                        <span className="font-bold text-gray-500">Total Bookings</span>
                        <span className="font-black text-gray-900">{ch.count} orders ({ch.paxCount} pax)</span>
                      </div>
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-bold text-gray-500">Average Order Value</span>
                        <span className="font-black text-primary">{formatPrice(ch.aov)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-sources drilldown list */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                      Sub-Channel Attribution
                    </span>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {Object.keys(ch.subSources).length > 0 ? (
                        Object.entries(ch.subSources).map(([sourceName, data], sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-gray-50/60 hover:bg-gray-100/80 transition">
                            <span className="font-bold text-gray-700 truncate max-w-[140px]">{sourceName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-gray-500">{data.count}x</span>
                              <span className="font-black text-gray-900">{formatPrice(data.revenue)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">No sub-sources logged</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Gateways & Settlement Distribution */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Payment Gateways & Settlement Split</h3>
              <p className="text-xs text-gray-500 font-medium">How funds were collected across payment processors</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(financialStats.paymentGateways).map(([gateway, data], gIdx) => {
                const percent = financialStats.totalGrossRevenue > 0 ? Math.round((data.amount / financialStats.totalGrossRevenue) * 100) : 0;
                return (
                  <div key={gIdx} className="p-4 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-gray-900 uppercase tracking-wider">{gateway}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white text-gray-700 text-[10px] font-bold border border-gray-200">
                        {percent}%
                      </span>
                    </div>
                    <p className="text-xl font-black text-gray-900">{formatPrice(data.amount)}</p>
                    <p className="text-[11px] text-gray-500 font-medium">{data.count} transactions settled</p>
                  </div>
                );
              })}
              {Object.keys(financialStats.paymentGateways).length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-400 text-xs font-bold">
                  No payment gateway settlements recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVOICES & ACCOUNTS RECEIVABLE (A/R) */}
      {activeTab === 'invoices' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Invoice Summary Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Invoiced</span>
              <p className="text-2xl font-black text-gray-900">{formatPrice(financialStats.totalInvoicedAmount)}</p>
              <span className="text-[11px] text-gray-500 font-medium block">{periodInvoices.length} invoices generated</span>
            </div>

            <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Total Paid</span>
              <p className="text-2xl font-black text-emerald-700">{formatPrice(financialStats.totalPaidInvoicesAmount)}</p>
              <span className="text-[11px] text-emerald-600 font-medium block">{financialStats.totalPaidInvoicesCount} invoices fully settled</span>
            </div>

            <div className="p-5 rounded-3xl bg-amber-50/50 border border-amber-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Unpaid / Outstanding</span>
              <p className="text-2xl font-black text-amber-700">{formatPrice(financialStats.totalUnpaidInvoicesAmount)}</p>
              <span className="text-[11px] text-amber-600 font-medium block">{financialStats.totalUnpaidInvoicesCount} invoices pending</span>
            </div>

            <div className="p-5 rounded-3xl bg-rose-50/50 border border-rose-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Overdue (Past Due)</span>
              <p className="text-2xl font-black text-rose-700">{formatPrice(financialStats.totalOverdueInvoicesAmount)}</p>
              <span className="text-[11px] text-rose-600 font-medium block">{financialStats.totalOverdueInvoicesCount} invoices requiring follow-up</span>
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-gray-900 tracking-tight">Period Invoices & Settlement Ledger</h3>
                <p className="text-xs text-gray-500 font-medium">Click any invoice to view, print, or share payment link</p>
              </div>

              <button
                onClick={() => setIsInvoiceGeneratorOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black hover:bg-orange-600 transition shadow-xs self-start sm:self-auto"
              >
                <Icons.Plus className="w-3.5 h-3.5" />
                <span>Create Invoice</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice #</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Issue / Due Date</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {periodInvoices.length > 0 ? (
                    periodInvoices.map((inv) => {
                      const total = Number(inv.totalAmount) || 0;
                      const paid = Number(inv.paidAmount) || (inv.status === 'paid' ? total : 0);
                      const isOverdue = inv.status === 'overdue' || (inv.status === 'unpaid' && inv.dueDate && isBefore(new Date(inv.dueDate), new Date()));

                      return (
                        <tr 
                          key={inv.id} 
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsInvoiceViewerOpen(true);
                          }}
                          className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-gray-900 group-hover:text-primary transition-colors">
                              {inv.invoiceNumber || `#${inv.id.slice(-8).toUpperCase()}`}
                            </span>
                            {inv.bookingId && (
                              <span className="block text-[10px] text-gray-400 font-mono mt-0.5">
                                Ref: {inv.bookingId.slice(-6).toUpperCase()}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{inv.customer?.name || 'Customer'}</p>
                            <p className="text-[11px] text-gray-400">{inv.customer?.email || inv.customer?.phone || '-'}</p>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-600">
                            <div>Issued: {inv.issueDate || '-'}</div>
                            <div className={cn("text-[11px]", isOverdue ? "text-rose-600 font-bold" : "text-gray-400")}>
                              Due: {inv.dueDate || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-black text-gray-900 text-sm">{formatPrice(total)}</span>
                            {paid > 0 && paid < total && (
                              <span className="block text-[10px] text-emerald-600 font-bold">
                                Paid: {formatPrice(paid)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1",
                              inv.status === 'paid' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              isOverdue ? "bg-rose-50 text-rose-700 border border-rose-200" :
                              inv.status === 'unpaid' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                              "bg-gray-100 text-gray-600"
                            )}>
                              {inv.status === 'paid' && <Icons.CheckCircle2 className="w-3 h-3" />}
                              {isOverdue && <Icons.AlertCircle className="w-3 h-3" />}
                              {isOverdue ? 'Overdue' : inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInvoice(inv);
                                setIsInvoiceViewerOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-primary hover:text-white text-gray-700 text-[11px] font-bold transition shadow-xs inline-flex items-center gap-1"
                            >
                              <Icons.Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                        No customer invoices found in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DETAILED TRANSACTION AUDIT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filters and Search Bar */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Icons.Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Reference, Customer, Tour, Email, Invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-primary outline-none transition"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Channel Filter */}
              <select
                value={selectedChannelFilter}
                onChange={(e) => setSelectedChannelFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-primary"
              >
                <option value="all">All Channels</option>
                <option value="online">Online Direct</option>
                <option value="offline">Offline / Manual</option>
                <option value="ota">OTA Channels</option>
              </select>

              {/* Service Filter */}
              <select
                value={selectedServiceFilter}
                onChange={(e) => setSelectedServiceFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-primary"
              >
                <option value="all">All Service Types</option>
                <option value="tour">Tour Packages</option>
                <option value="rental">Car Rentals / Charters</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedPaymentStatusFilter}
                onChange={(e) => setSelectedPaymentStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-primary"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid / Confirmed</option>
                <option value="pending">Pending</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-black hover:bg-orange-600 transition shadow-xs"
              >
                <Icons.Download className="w-3.5 h-3.5" />
                <span>Export ({filteredLedgerBookings.length})</span>
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Ref</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Item</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Channel</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Gross</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Fee</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {paginatedLedger.length > 0 ? (
                    paginatedLedger.map((b) => {
                      const d = getBookingDate(b);
                      const { channel, subSource } = getBookingChannel(b);
                      const isRental = b.bookingType === 'rental' || Boolean(b.rentalDetails) || b.tourTitle?.toLowerCase().includes('rental');
                      const gross = Number(b.totalAmount) || 0;
                      const fee = Number(b.merchantFee) || 0;
                      const net = b.supplierEarnings !== undefined ? Number(b.supplierEarnings) : (gross - fee);

                      return (
                        <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900 block">{format(d, 'dd MMM yyyy')}</span>
                            <span className="text-[10px] font-mono text-gray-400">{format(d, 'HH:mm')} • #{b.id.slice(-6).toUpperCase()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{b.customerData?.fullName || 'Guest Customer'}</p>
                            <p className="text-[11px] text-gray-400">{b.customerData?.email || b.customerData?.phone || '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              {isRental ? (
                                <Icons.Car className="w-3.5 h-3.5 text-primary shrink-0" />
                              ) : (
                                <Icons.Compass className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              )}
                              <p className="font-bold text-gray-900 line-clamp-1 max-w-[200px]">{b.tourTitle || 'Tour Service'}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                              {(b.participants?.adults || 1)} Adult(s){b.participants?.children ? `, ${b.participants.children} Child` : ''}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block",
                              channel === 'online' ? "bg-blue-50 text-blue-700" :
                              channel === 'offline' ? "bg-emerald-50 text-emerald-700" :
                              "bg-amber-50 text-amber-700"
                            )}>
                              {channel}
                            </span>
                            <span className="block text-[10px] text-gray-400 truncate max-w-[120px] mt-0.5">
                              {subSource}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-800 uppercase block">{b.paymentMethod || 'Manual'}</span>
                            {b.invoiceId && (
                              <button
                                onClick={() => handleOpenLinkedInvoice(b.invoiceId!)}
                                className="text-[10px] text-primary font-bold hover:underline inline-flex items-center gap-0.5 mt-0.5"
                              >
                                <Icons.FileText className="w-3 h-3" />
                                <span>Inv #{b.invoiceId.slice(-4)}</span>
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-gray-900">
                            {formatPrice(gross)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-orange-600">
                            {fee > 0 ? formatPrice(fee) : '-'}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-emerald-600 text-sm">
                            {formatPrice(net)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                        No transactions match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalLedgerPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLedgerBookings.length)} of {filteredLedgerBookings.length} bookings
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 text-xs font-black text-gray-700">
                    Page {currentPage} of {totalLedgerPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalLedgerPages, p + 1))}
                    disabled={currentPage === totalLedgerPages}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Invoice Modals Integration */}
      <InvoiceViewerModal
        invoice={selectedInvoice}
        isOpen={isInvoiceViewerOpen}
        onClose={() => {
          setIsInvoiceViewerOpen(false);
          setSelectedInvoice(null);
        }}
      />

      <InvoiceGeneratorModal
        isOpen={isInvoiceGeneratorOpen}
        onClose={() => setIsInvoiceGeneratorOpen(false)}
        onInvoiceCreated={(newInv) => {
          setSelectedInvoice(newInv);
          setIsInvoiceGeneratorOpen(false);
          setIsInvoiceViewerOpen(true);
        }}
      />
    </div>
  );
}
