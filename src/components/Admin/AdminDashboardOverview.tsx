import React from "react";
import { 
  Zap, Download, PlusCircle, Calendar, Calendar as CalendarIcon, CreditCard, Users, 
  MapPin, Clock, MessageSquare, ArrowRight, Database, 
  FileText, ShieldCheck, CheckCircle2, TrendingUp, Briefcase
} from "lucide-react";
import * as LucideIcons from "lucide-react";
const Icons = LucideIcons;
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
  handleSeedDummyData,
}) => {
  return (
    <div className="space-y-6 md:space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            {currentUserProfile?.role === "admin"
              ? "Executive Dashboard"
              : currentUserProfile?.role === "staff"
              ? "Staff Operations Console"
              : currentUserProfile?.role === "supplier"
              ? "Supplier Dashboard"
              : currentUserProfile?.role === "agent"
              ? "Agent Portal"
              : "Admin Dashboard"}
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            {currentUserProfile?.role === "staff"
              ? "Operational dispatch, guest reservations & guide assignments."
              : "Daily performance & operations briefing."}
          </p>
        </div>
        <div className="flex sm:justify-end shrink-0">
          <div className="bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-gray-100 flex items-center gap-2 sm:gap-3 shadow-xs">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Live System Status</span>
          </div>
        </div>
      </div>

      <StatsDashboard bookings={bookings} tours={tours} users={users} inquiries={inquiries} role={currentUserProfile?.role} setActiveMenu={setActiveMenu} />

      {/* Quick Actions and Profile Preview */}
      {(currentUserProfile?.role === "supplier" || currentUserProfile?.role === "agent" || currentUserProfile?.role === "admin" || currentUserProfile?.role === "staff") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 md:p-8 shadow-xs">
            <h3 className="font-extrabold tracking-tight text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 text-sm sm:text-base">
              <Zap className="h-5 w-5 text-amber-500" />
              {currentUserProfile?.role === "staff" ? "Staff Operations Shortcuts" : "Quick Actions"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {isInstallable && (
                <div className="col-span-2 md:col-span-3 p-4 sm:p-5 rounded-2xl border border-orange-100 bg-orange-50/50 flex flex-col md:flex-row items-center gap-4 justify-between">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="p-2 sm:p-3 bg-white rounded-xl shadow-xs text-primary shrink-0">
                      <Download className="h-5 w-5" />
                    </div>
                    <div className="text-left py-0.5">
                      <h4 className="font-extrabold text-xs sm:text-sm text-gray-900">Install Mobile App</h4>
                      <p className="text-[9.5px]/normal sm:text-[10px]/relaxed text-gray-500 font-semibold max-w-md mt-0.5">
                        Add the application directly to your home screen for rapid offline-first access and push alerts.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={installApp}
                    className="w-full md:w-auto shrink-0 bg-primary hover:bg-orange-700 text-white text-[10.5px] font-black uppercase tracking-wider px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-xs cursor-pointer transition-all"
                  >
                    Install Web App
                  </button>
                </div>
              )}
              {currentUserProfile?.role === "staff" && (
                <>
                  <button
                    onClick={() => setActiveMenu("bookings")}
                    className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-blue-100 bg-blue-50/70 text-blue-700 flex flex-col items-center justify-center gap-2 hover:bg-blue-100 transition-all font-black text-[11px] group cursor-pointer"
                  >
                    <div className="p-2.5 bg-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    Manage Bookings
                  </button>
                  <button
                    onClick={() => setActiveMenu("all-tours")}
                    className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-teal-100 bg-teal-50/70 text-teal-700 flex flex-col items-center justify-center gap-2 hover:bg-teal-100 transition-all font-black text-[11px] group cursor-pointer"
                  >
                    <div className="p-2.5 bg-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                      <MapPin className="h-5 w-5 text-teal-600" />
                    </div>
                    Tours & Pricing
                  </button>
                  <button
                    onClick={() => setActiveMenu("guides")}
                    className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-purple-100 bg-purple-50/70 text-purple-700 flex flex-col items-center justify-center gap-2 hover:bg-purple-100 transition-all font-black text-[11px] group cursor-pointer"
                  >
                    <div className="p-2.5 bg-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    Assign Guides
                  </button>
                  <button
                    onClick={() => setActiveMenu("inquiries")}
                    className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-orange-100 bg-orange-50/70 text-primary flex flex-col items-center justify-center gap-2 hover:bg-orange-100 transition-all font-black text-[11px] group cursor-pointer"
                  >
                    <div className="p-2.5 bg-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    Guest Inquiries
                  </button>
                  <button
                    onClick={() => setActiveMenu("tickets")}
                    className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-indigo-100 bg-indigo-50/70 text-indigo-700 flex flex-col items-center justify-center gap-2 hover:bg-indigo-100 transition-all font-black text-[11px] group cursor-pointer"
                  >
                    <div className="p-2.5 bg-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                      <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    </div>
                    Support Tickets
                  </button>
                  <button
                    onClick={() => setActiveMenu("car-rental-bookings")}
                    className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-emerald-100 bg-emerald-50/70 text-emerald-700 flex flex-col items-center justify-center gap-2 hover:bg-emerald-100 transition-all font-black text-[11px] group cursor-pointer"
                  >
                    <div className="p-2.5 bg-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                    </div>
                    Car Rentals
                  </button>
                </>
              )}
              {currentUserProfile?.role === "admin" && (
                <>
                  <button
                    onClick={() => setActiveMenu("bookings")}
                    className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 flex flex-col items-center justify-center gap-3 hover:bg-blue-100 transition-all font-black text-[11px] group cursor-pointer"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    Manage Bookings
                  </button>
                  <button
                    onClick={() => setActiveMenu("inquiries")}
                    className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-orange-100 bg-orange-50 text-primary flex flex-col items-center justify-center gap-3 hover:bg-orange-100 transition-all font-black text-[11px] group cursor-pointer"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform relative">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    Customer Inquiries
                  </button>
                  <button
                    onClick={() => setActiveMenu("tours")}
                    className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-teal-100 bg-teal-50 text-teal-700 flex flex-col items-center justify-center gap-3 hover:bg-teal-100 transition-all font-black text-[11px] group cursor-pointer"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                      <PlusCircle className="h-6 w-6" />
                    </div>
                    Create New Tour
                  </button>
                </>
              )}
              {currentUserProfile?.role === "supplier" && (
                <>
                  <button
                    onClick={() => setActiveMenu("tours")}
                    className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-teal-100 bg-teal-50 text-teal-700 flex flex-col items-center justify-center gap-3 hover:bg-teal-100 transition-all font-black text-[11px] group cursor-pointer"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                      <PlusCircle className="h-6 w-6" />
                    </div>
                    Submit New Tour
                  </button>
                  <button
                    onClick={() => setActiveMenu("payouts")}
                    className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 flex flex-col items-center justify-center gap-3 hover:bg-emerald-100 transition-all font-black text-[11px] group cursor-pointer"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    Payout Requests
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 md:p-8 shadow-xs flex flex-col justify-between overflow-hidden relative">
            <div className="relative">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Signed in as</span>
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl border-2 border-gray-50 shadow-xs overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                  {currentUserProfile?.photoURL ? (
                    <img src={currentUserProfile.photoURL} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Users className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm sm:text-base text-gray-900 truncate">
                    {currentUserProfile?.displayName || currentUserProfile?.email || "Admin User"}
                  </h4>
                  <p className="text-xs text-primary font-bold uppercase tracking-wider mt-0.5">
                    {currentUserProfile?.role || "Staff"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Tours & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Scheduled Tours Section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 md:p-8 shadow-xs overflow-hidden min-w-0">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div>
                <h3 className="font-black tracking-tight text-gray-900 text-sm sm:text-base md:text-lg">Scheduled Tours</h3>
                <p className="text-xs font-bold text-gray-400">Scheduled for today and tomorrow</p>
              </div>
              <Calendar className="h-5 w-5 text-gray-400 shrink-0" />
            </div>

            <div className="space-y-3 sm:space-y-4">
              {(() => {
                const today = format(new Date(), "yyyy-MM-dd");
                const tom = format(addDays(new Date(), 1), "yyyy-MM-dd");
                const scheduledBookings = bookings.filter((b) => b.date === today || b.date === tom);

                if (scheduledBookings.length === 0) {
                  return <p className="text-sm text-gray-400 text-center py-8">No tours scheduled for today or tomorrow.</p>;
                }

                return scheduledBookings.map((booking, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-primary transition-all gap-3 overflow-hidden min-w-0"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-[10px] flex items-center justify-center font-black text-xs shrink-0",
                          booking.date === today ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {booking.date === today ? "TODAY" : "TOM"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors truncate">
                          {booking.tourTitle}
                        </p>
                        <p className="text-xs text-gray-400 font-bold truncate">
                          {booking.customerData?.fullName || "N/A"} • {(booking.participants?.adults || 0) + (booking.participants?.children || 0)} Pax
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="font-black text-gray-900 text-sm leading-none sm:leading-normal">
                        {booking.timeSlot || booking.time || "TBA"}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 sm:mt-1">
                        {booking.status}
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Revenue chart mockup */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 md:p-8 shadow-xs h-96 overflow-hidden min-w-0 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black tracking-tight text-gray-900 text-sm sm:text-base md:text-lg">Revenue Analytics</h3>
              <TrendingUp className="h-5 w-5 text-gray-400 shrink-0" />
            </div>
            <div className="flex items-end justify-between h-56 gap-1 sm:gap-1.5 md:gap-2 min-w-0">
              {[40, 70, 45, 90, 65, 80, 50, 60, 85, 45, 75, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-orange-100 rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative"
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    ${h}k
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] font-black text-gray-400 px-1 border-t border-gray-50 pt-3">
              <span>Jan</span>
              <span>Jun</span>
              <span>Dec</span>
            </div>
          </div>
        </div>

        {/* Popular tours sidebar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 md:p-8 shadow-xs flex flex-col justify-between overflow-hidden min-w-0">
          <div>
            <h3 className="font-black tracking-tight text-gray-900 mb-4 sm:mb-6 text-sm sm:text-base md:text-lg">Popular Tours</h3>
            <div className="space-y-4 md:space-y-6">
              {tours.slice(0, 3).map((tour, i) => (
                <div key={i} className="flex items-center gap-3 sm:gap-4 p-1 rounded-xl transition-all min-w-0">
                  <img src={tour.gallery?.[0] || ""} className="h-10 w-10 sm:h-12 sm:w-12 rounded-[10px] object-cover shrink-0" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-gray-900 truncate" title={tour.title}>
                      {tour.title}
                    </p>
                    <p className="text-[10px] font-bold text-primary leading-none mt-1">34 Bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setActiveMenu("schedule")}
            className="w-full mt-6 md:mt-8 py-3 rounded-xl bg-primary text-white font-black text-[10.5px] uppercase tracking-wider hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            <Calendar className="h-3.5 w-3.5" /> View Schedule Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
