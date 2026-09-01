import React from "react";
import { 
  Zap, Download, PlusCircle, Calendar, CreditCard, Users, 
  MapPin, Clock, MessageSquare, ArrowRight, 
  FileText, ShieldCheck, CheckCircle2, TrendingUp, Briefcase, ChevronRight,
  UserCheck, AlertCircle, ArrowUpRight, Search, Car, HelpCircle
} from "lucide-react";
import { cn, formatPrice } from "../../lib/utils";
import StatsDashboard from "./StatsDashboard";
import { Booking, Tour, UserProfile, Inquiry } from "../../types";
import { format, addDays } from "date-fns";

interface AdminDashboardOverviewProps {
  currentUserProfile: UserProfile | null;
  bookings: Booking[];
  tours: Tour[];
  users: UserProfile[];
  inquiries: Inquiry[];
  isInstallable: boolean;
  installApp: () => void;
  setActiveMenu: (m: string) => void;
  setTourSupplierFilter: (s: string) => void;
  handleSeedDummyData?: () => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  currentUserProfile,
  bookings,
  tours,
  users,
  inquiries,
  isInstallable,
  installApp,
  setActiveMenu,
  setTourSupplierFilter,
}) => {
  const role = currentUserProfile?.role || 'admin';
  const isStaff = role === 'staff';
  const isSupplier = role === 'supplier';
  const isAgent = role === 'agent';
  const isAdmin = role === 'admin' || role === 'superadmin';

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const todayBookings = bookings.filter(b => b.date === todayStr && b.status !== 'cancelled');
  const tomorrowBookings = bookings.filter(b => b.date === tomorrowStr && b.status !== 'cancelled');
  const upcomingBookings = [...todayBookings, ...tomorrowBookings];
  
  const pendingInquiries = inquiries.filter(i => i.status === 'new');
  const unassignedGuideBookings = bookings.filter(b => b.status === 'confirmed' && !b.assignedGuideName);

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 text-left">
      {/* Top Header & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-500">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {isStaff ? 'Staff Console' : isSupplier ? 'Supplier Portal' : isAgent ? 'Agent Portal' : role === 'superadmin' ? 'Superadmin' : 'Administrator'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            {isStaff
              ? `Welcome back, ${currentUserProfile?.displayName?.split(' ')[0] || 'Staff'}`
              : isSupplier
              ? `Supplier Operations Overview`
              : isAgent
              ? `Agent Booking Workspace`
              : `System Executive Overview`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            {isStaff
              ? "Dispatch drivers, process guest reservations, and review inquiries."
              : "Real-time bookings, revenue velocity, and operations overview."}
          </p>
        </div>

        {/* Action button / Status */}
        <div className="flex items-center gap-2 shrink-0">
          {isInstallable && (
            <button
              onClick={installApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 shadow-xs transition"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Install PWA
            </button>
          )}

          {isStaff ? (
            <button
              onClick={() => setActiveMenu('bookings')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-medium shadow-xs transition"
            >
              <Briefcase className="h-3.5 w-3.5" />
              View Bookings
            </button>
          ) : (
            <button
              onClick={() => setActiveMenu('tours')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-medium shadow-xs transition"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add Tour
            </button>
          )}
        </div>
      </div>

      {/* Staff Operational Notice Banner if action needed */}
      {isStaff && unassignedGuideBookings.length > 0 && (
        <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-amber-900 font-medium truncate">
              <strong>{unassignedGuideBookings.length} confirmed tour(s)</strong> require driver or tour guide assignment.
            </span>
          </div>
          <button
            onClick={() => setActiveMenu('guides')}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-[11px] shrink-0 transition"
          >
            Assign Guides
          </button>
        </div>
      )}

      {/* Stats Dashboard Component */}
      <StatsDashboard
        bookings={bookings}
        tours={tours}
        users={users}
        inquiries={inquiries}
        role={role}
        setActiveMenu={setActiveMenu}
      />

      {/* Quick Action Navigation Grid */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            {isStaff ? "Operational Quick Access" : "Quick Navigation"}
          </h2>
          <span className="text-[11px] text-slate-400 font-normal">Direct short-paths</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          <button
            onClick={() => setActiveMenu("bookings")}
            className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition text-left group"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold text-slate-900">Bookings</div>
            <div className="text-[11px] text-slate-400 truncate">{bookings.length} reservations</div>
          </button>

          <button
            onClick={() => setActiveMenu("all-tours")}
            className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition text-left group"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold text-slate-900">Tours & Pricing</div>
            <div className="text-[11px] text-slate-400 truncate">{tours.length} packages</div>
          </button>

          <button
            onClick={() => setActiveMenu("car-rental-bookings")}
            className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition text-left group"
          >
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Car className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold text-slate-900">Car Rental</div>
            <div className="text-[11px] text-slate-400 truncate">Fleet & dispatch</div>
          </button>

          <button
            onClick={() => setActiveMenu("inquiries")}
            className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition text-left group"
          >
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold text-slate-900">Inquiries</div>
            <div className="text-[11px] text-slate-400 truncate">{pendingInquiries.length} new incoming</div>
          </button>

          <button
            onClick={() => setActiveMenu("guides")}
            className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition text-left group"
          >
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold text-slate-900">Guides & Drivers</div>
            <div className="text-[11px] text-slate-400 truncate">Dispatch directory</div>
          </button>

          <button
            onClick={() => setActiveMenu("tickets")}
            className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition text-left group"
          >
            <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold text-slate-900">Support Tickets</div>
            <div className="text-[11px] text-slate-400 truncate">Customer care</div>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Scheduled Departures + Recent Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today & Tomorrow Schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  Scheduled Tour Departures
                </h3>
                <p className="text-[11px] text-slate-400 font-normal">Active tours for today and tomorrow</p>
              </div>
              <button
                onClick={() => setActiveMenu("schedule")}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
              >
                Calendar View <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Calendar className="h-8 w-8 mx-auto stroke-1 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No scheduled departures for today or tomorrow</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Upcoming bookings will appear automatically here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingBookings.slice(0, 6).map((b, idx) => {
                  const isTodayTour = b.date === todayStr;
                  const totalPax = (b.participants?.adults || 0) + (b.participants?.children || 0);

                  return (
                    <div
                      key={b.id || idx}
                      className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0",
                          isTodayTour ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        )}>
                          {isTodayTour ? "Today" : "Tomorrow"}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {b.tourTitle || b.packageName || "Tour Booking"}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {b.customerData?.fullName || "Guest"} • {totalPax > 0 ? `${totalPax} Pax` : "1 Guest"}
                            {b.assignedGuideName ? ` • Guide: ${b.assignedGuideName}` : " • Guide: Unassigned"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-slate-900 block">
                          {b.timeSlot || b.time || "08:00 AM"}
                        </span>
                        <span className={cn(
                          "text-[10px] font-medium capitalize",
                          b.status === 'confirmed' ? 'text-emerald-600' : 'text-slate-400'
                        )}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing next 48 hours dispatch</span>
            <button
              onClick={() => setActiveMenu("bookings")}
              className="text-slate-700 hover:text-slate-900 font-medium transition"
            >
              Manage all reservations →
            </button>
          </div>
        </div>

        {/* Right Col: Recent Inquiries & Requests */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-500" />
                  Recent Inquiries
                </h3>
                <p className="text-[11px] text-slate-400 font-normal">Traveler questions & proposals</p>
              </div>
              <button
                onClick={() => setActiveMenu("inquiries")}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition"
              >
                View all ({inquiries.length})
              </button>
            </div>

            {inquiries.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <MessageSquare className="h-8 w-8 mx-auto stroke-1 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No customer inquiries recorded</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Incoming requests will appear here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {inquiries.slice(0, 5).map((inq, idx) => (
                  <div
                    key={inq.id || idx}
                    onClick={() => setActiveMenu("inquiries")}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {inq.userName || "Traveler"}
                      </span>
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded capitalize",
                        inq.status === 'new' ? 'bg-amber-50 text-amber-700 font-semibold' : 'bg-slate-100 text-slate-600'
                      )}>
                        {inq.status || 'new'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal line-clamp-1">
                      {inq.planTitle || inq.summary || "Custom Trip Inquiry"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{pendingInquiries.length} awaiting follow up</span>
            <button
              onClick={() => setActiveMenu("inquiries")}
              className="text-slate-700 hover:text-slate-900 font-medium transition"
            >
              Open Inbox →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
