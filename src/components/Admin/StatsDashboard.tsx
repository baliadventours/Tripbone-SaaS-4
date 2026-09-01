import React, { useMemo } from 'react';
import { 
  DollarSign, TrendingUp, Users, Calendar, 
  ArrowUpRight, ArrowDownRight, Globe, ShoppingBag, 
  Clock, CheckCircle2, MapPin
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPrice } from '../../lib/utils';
import { Booking, Tour, UserProfile, Inquiry } from '../../types';

interface StatsDashboardProps {
  bookings: Booking[];
  tours: Tour[];
  users: UserProfile[];
  inquiries?: Inquiry[];
  role?: string;
  setActiveMenu?: (m: string) => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ 
  bookings, 
  tours, 
  users, 
  inquiries = [],
  role = 'admin',
  setActiveMenu
}) => {
  const isSupplier = role === 'supplier';
  const isAgent = role === 'agent';
  const isStaff = role === 'staff';

  // 1. Metric Calculations
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let successfulBookings = 0;
    let pendingBookings = 0;
    let completedBookings = 0;

    bookings.forEach(b => {
      const isConfirmedOrPaid = (b.paymentStatus === 'paid' || b.status === 'confirmed') && b.status !== 'cancelled';
      if (isConfirmedOrPaid) {
        const amount = isSupplier ? (b.supplierEarnings || 0) : isAgent ? (b.agentDiscount || 0) : (b.totalAmount || 0);
        totalRevenue += amount;
        successfulBookings += 1;
      }
      if (b.status === 'pending') pendingBookings += 1;
      if (b.status === 'completed') completedBookings += 1;
    });

    const activeTours = tours.filter(t => t.status === 'published').length;

    return {
      totalRevenue,
      successfulBookings,
      pendingBookings,
      completedBookings,
      activeTours
    };
  }, [bookings, tours, isSupplier, isAgent]);

  // 2. Parsed Bookings with standard dates
  const parsedBookings = useMemo(() => {
    return bookings.map(b => {
      let bookingDate = new Date();
      if (b.createdAt) {
        if (typeof (b.createdAt as any).toDate === 'function') {
          bookingDate = (b.createdAt as any).toDate();
        } else if ((b.createdAt as any).seconds) {
          bookingDate = new Date((b.createdAt as any).seconds * 1000);
        } else if (typeof b.createdAt === 'string') {
          bookingDate = new Date(b.createdAt);
        } else if (b.createdAt instanceof Date) {
          bookingDate = b.createdAt;
        }
      } else if (b.date) {
        bookingDate = new Date(b.date);
      }
      return { ...b, parsedDate: bookingDate };
    });
  }, [bookings]);

  // 3. Last 7 Days trend chart data
  const chartData = useMemo(() => {
    const data: Record<string, { revenue: number; bookingsCount: number }> = {};
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      data[key] = { revenue: 0, bookingsCount: 0 };
    }

    parsedBookings.forEach(b => {
      const isConfirmedOrPaid = (b.paymentStatus === 'paid' || b.status === 'confirmed') && b.status !== 'cancelled';
      const key = b.parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (data[key] !== undefined) {
        if (isConfirmedOrPaid) {
          const rev = isSupplier ? (b.supplierEarnings || 0) : isAgent ? (b.agentDiscount || 0) : (b.totalAmount || 0);
          data[key].revenue += rev;
        }
        if (b.status !== 'cancelled') {
          data[key].bookingsCount += 1;
        }
      }
    });

    return Object.entries(data).map(([name, val]) => ({
      name,
      revenue: val.revenue,
      bookings: val.bookingsCount
    }));
  }, [parsedBookings, isSupplier, isAgent]);

  // 4. Tour Performance Leaderboard
  const leaderBoardTours = useMemo(() => {
    const tourCounts: Record<string, { title: string; count: number; revenue: number }> = {};
    
    parsedBookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const id = b.tourId || 'custom_itinerary';
      const title = b.tourTitle || b.packageName || 'Private Custom Itinerary';
      
      if (!tourCounts[id]) {
        tourCounts[id] = { title, count: 0, revenue: 0 };
      }
      tourCounts[id].count += 1;
      const rev = isSupplier ? (b.supplierEarnings || 0) : isAgent ? (b.agentDiscount || 0) : (b.totalAmount || 0);
      tourCounts[id].revenue += rev;
    });

    return Object.values(tourCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [parsedBookings, isSupplier, isAgent]);

  // 5. Booking Channel Distribution
  const channelData = useMemo(() => {
    const channels: Record<string, number> = {};
    parsedBookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const source = b.bookingSource || 'Direct Website';
      channels[source] = (channels[source] || 0) + 1;
    });

    const total = Object.values(channels).reduce((a, b) => a + b, 0) || 1;
    const colors = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    return Object.entries(channels)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
        percentage: Math.round((value / total) * 100)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [parsedBookings]);

  // Cards definitions
  const statCards = [
    {
      label: isSupplier ? 'Supplier Net Revenue' : isAgent ? 'Total Commissions' : 'Total Revenue',
      value: formatPrice(metrics.totalRevenue),
      trend: '+12.4%',
      isUp: true,
      description: 'Confirmed and settled sales',
      icon: DollarSign,
      actionMenu: 'bookings'
    },
    {
      label: 'Total Bookings',
      value: bookings.length.toString(),
      trend: `${metrics.successfulBookings} confirmed`,
      isUp: true,
      description: `${metrics.pendingBookings} pending review`,
      icon: Calendar,
      actionMenu: 'bookings'
    },
    {
      label: 'Published Tours',
      value: metrics.activeTours.toString(),
      trend: `${tours.length} total`,
      isUp: true,
      description: 'Live in public marketplace',
      icon: ShoppingBag,
      actionMenu: 'all-tours'
    },
    {
      label: isStaff ? 'Open Inquiries' : 'Registered Users',
      value: isStaff ? inquiries.length.toString() : users.length.toString(),
      trend: isStaff ? 'Live feed' : '+4 this week',
      isUp: true,
      description: isStaff ? 'Customer questions' : 'Staff, agents & customers',
      icon: Users,
      actionMenu: isStaff ? 'inquiries' : 'users'
    }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* 1. Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            onClick={() => setActiveMenu && setActiveMenu(stat.actionMenu)}
            className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-500 tracking-normal">
                  {stat.label}
                </span>
                <div className="h-7 w-7 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                  <stat.icon className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                {stat.value}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-normal truncate">{stat.description}</span>
              <span className="font-medium text-emerald-600 shrink-0 ml-1">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Main Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Performance Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-500" />
                Revenue & Booking Velocity
              </h3>
              <p className="text-[11px] text-slate-400 font-normal">Past 7 days aggregated operational output</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-900" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Bookings
              </span>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full">
            {bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-1">
                <TrendingUp className="h-8 w-8 stroke-1" />
                <span className="text-xs font-medium text-slate-500">No bookings recorded this week</span>
                <span className="text-[11px] text-slate-400">Charts will populate once reservations are logged.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === 'Revenue') return [formatPrice(value as number), 'Revenue'];
                      return [value, 'Bookings'];
                    }}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontSize: '11px',
                      fontWeight: '500',
                      textAlign: 'left'
                    }} 
                  />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Col: Booking Channel Segmentation */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-500" />
                  Booking Channels
                </h3>
                <p className="text-[11px] text-slate-400 font-normal">Source & OTA channel attribution</p>
              </div>
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Real-time
              </span>
            </div>

            {channelData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <Globe className="h-7 w-7 stroke-1 mb-2 text-slate-300" />
                <span className="text-xs font-medium text-slate-500">No channel data available</span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {channelData.map(ch => (
                  <div key={ch.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate">{ch.name}</span>
                      <span className="font-medium text-slate-900 font-mono text-[11px]">{ch.value} ({ch.percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all" 
                        style={{ width: `${ch.percentage}%`, backgroundColor: ch.color }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Direct vs OTAs Distribution</span>
            <span className="font-medium text-slate-700">{bookings.length} Total</span>
          </div>
        </div>
      </div>

      {/* 3. Top Performing Tours */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-slate-500" />
              Top Demand Tours & Packages
            </h3>
            <p className="text-[11px] text-slate-400 font-normal">Ranked by passenger booking volume and generated GMV</p>
          </div>
          {setActiveMenu && (
            <button
              onClick={() => setActiveMenu('all-tours')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 transition"
            >
              View catalog ({tours.length})
            </button>
          )}
        </div>

        {leaderBoardTours.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <ShoppingBag className="h-8 w-8 mx-auto stroke-1 text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-600">No tour bookings recorded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {leaderBoardTours.map((t, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-5 w-5 rounded bg-slate-200/70 text-slate-700 font-semibold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {t.title}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                  <span className="text-slate-500">{t.count} bookings</span>
                  <span className="font-semibold text-slate-900 font-mono">{formatPrice(t.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsDashboard;
