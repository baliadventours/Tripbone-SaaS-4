import CompanyProfile from './CompanyProfile';
import React from "react";
import { ArrowLeft, Users, Mail, Phone, MapPin, Star, Calendar, DollarSign, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import * as LucideIcons from "lucide-react";
const Icons = LucideIcons;
import { cn, formatPrice } from "../../lib/utils";
import { format } from "date-fns";
import { PartnerListing } from "./PartnerListing";

interface PartnerDetailViewProps {
  selectedPartner: any;
  setSelectedPartner: (p: any) => void;
  activeMenu: string;
  tours: any[];
  bookings: any[];
  users: any[];
  handleDeleteUser: (user: any) => void;
  resetForm: () => void;
  setFormData: any;
  formData: any;
  setActiveMenu: (m: string) => void;
  setTourSupplierFilter: (s: string) => void;
}

export const PartnerDetailView: React.FC<PartnerDetailViewProps> = ({
  selectedPartner,
  setSelectedPartner,
  activeMenu,
  tours,
  bookings,
  users,
  handleDeleteUser,
  resetForm,
  setFormData,
  formData,
  setActiveMenu,
  setTourSupplierFilter,
}) => {
  return (
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
          {selectedPartner ? (
            <div className="space-y-8">
              <button 
                onClick={() => setSelectedPartner(null)}
                className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-all"
              >
                <Icons.ArrowLeft className="h-4 w-4" /> Back to Listing
              </button>

              <div className="bg-white rounded-[10px] border border-gray-100 p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                  <Icons.Users className="h-40 w-40" />
                </div>
                
                <div className="relative flex flex-col md:flex-row md:items-center gap-8 border-b border-gray-100 pb-10 mb-10">
                  <img src={selectedPartner.photoURL} className="h-24 w-24 rounded-[10px] border-4 border-gray-50 shadow-sm" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-3xl font-black text-gray-900 tracking-tight">{selectedPartner.displayName}</h3>
                       <span className={cn(
                         "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                         selectedPartner.role === 'supplier' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                       )}>
                         {selectedPartner.role}
                       </span>
                    </div>
                    <p className="text-gray-500 font-medium tracking-tight">Joined {selectedPartner.createdAt?.toDate ? format(selectedPartner.createdAt.toDate(), 'MMMM d, yyyy') : 'Unknown'}</p>
                    <div className="flex flex-wrap gap-6 mt-6">
                      <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl">
                        <Icons.Mail className="h-4 w-4 text-primary" />
                        <span className="text-xs font-black text-gray-700 tracking-tight">{selectedPartner.email}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl">
                        <Icons.Phone className="h-4 w-4 text-primary" />
                        <span className="text-xs font-black text-gray-700 tracking-tight">{selectedPartner.phoneNumber || 'No Whatsapp'}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl">
                        <Icons.Briefcase className="h-4 w-4 text-primary" />
                        <span className="text-xs font-black text-gray-700 tracking-tight">{selectedPartner.companyName || 'No Company Name'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setSelectedPartner({...selectedPartner, _isEditing: !(selectedPartner as any)._isEditing} as any)}
                      className={cn(
                        "px-6 py-3 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                        (selectedPartner as any)._isEditing ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {(selectedPartner as any)._isEditing ? 'View Stats' : 'Edit Company Details'}
                    </button>
                  </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-10">
                    {(selectedPartner as any)._isEditing ? (
                       <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4">
                          <CompanyProfile userData={selectedPartner} isAdminEdit={true} />
                       </div>
                    ) : (
                       <div className="relative grid md:grid-cols-2 gap-10">
                        <div className="space-y-10">
                           {selectedPartner.role === 'supplier' ? (
                             <div className="space-y-6">
                                <h4 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                  <Icons.Map className="h-5 w-5 text-primary" /> Owned Tours ({tours.filter(t => t.supplierId === selectedPartner.uid).length})
                                </h4>
                                <div className="space-y-3">
                                   {tours.filter(t => t.supplierId === selectedPartner.uid).slice(0, 5).map(tour => (
                                     <div key={tour.id} className="p-4 bg-gray-50 rounded-[10px] border border-gray-100 flex items-center justify-between hover:border-primary transition-all group">
                                        <div className="flex items-center gap-3">
                                           <img src={tour.gallery?.[0] || ''} className="h-10 w-10 rounded-[10px] object-cover shadow-sm" />
                                           <div>
                                              <p className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">{tour.title}</p>
                                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tour.location}</p>
                                           </div>
                                        </div>
                                        <Icons.ArrowRight className="h-4 w-4 text-gray-300" />
                                     </div>
                                   ))}
                                </div>
                             </div>
                           ) : (
                             <div className="space-y-6">
                                <h4 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                  <Icons.Briefcase className="h-5 w-5 text-primary" /> Agent Bookings ({bookings.filter(b => b.userId === selectedPartner.uid).length})
                                </h4>
                                <div className="space-y-3">
                                   {bookings.filter(b => b.userId === selectedPartner.uid).slice(0, 5).map(booking => (
                                     <div key={booking.id} className="p-4 bg-gray-50 rounded-[10px] border border-gray-100 flex items-center justify-between hover:border-primary transition-all group">
                                        <div>
                                           <p className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">{booking.tourTitle}</p>
                                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{booking.date} • {(booking.participants?.adults || 0)} Pax</p>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-primary bg-orange-50 px-2 py-0.5 rounded-md">{booking.status}</span>
                                     </div>
                                   ))}
                                </div>
                             </div>
                           )}

                           <div className="space-y-6">
                              <h4 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <Icons.BarChart3 className="h-5 w-5 text-primary" /> Performance metrics
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-orange-50 rounded-[10px] border border-orange-100">
                                   <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Total Value</p>
                                   <p className="text-2xl font-black text-orange-900">
                                     {formatPrice(bookings.filter(b => (selectedPartner.role === 'supplier' ? b.supplierId : b.userId) === selectedPartner.uid && b.status === 'confirmed').reduce((acc, b) => acc + b.totalAmount, 0))}
                                   </p>
                                </div>
                                <div className="p-6 bg-blue-50 rounded-[10px] border border-blue-100">
                                   <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Share Value</p>
                                   <p className="text-2xl font-black text-blue-900">
                                     {selectedPartner.role === 'supplier' 
                                       ? formatPrice(bookings.filter(b => b.supplierId === selectedPartner.uid && b.status === 'confirmed').reduce((acc, b) => acc + (b.supplierEarnings || 0), 0))
                                       : formatPrice(bookings.filter(b => b.userId === selectedPartner.uid && b.status === 'confirmed').reduce((acc, b) => acc + (b.agentDiscount || 0), 0))}
                                   </p>
                                </div>
                              </div>
                           </div>
                        </div>

                        <div className="p-8 bg-gray-50 rounded-[10px] border border-gray-100">
                           <div className="flex items-center gap-3 mb-6 text-gray-900">
                              <Icons.Lock className="h-4 w-4" />
                              <h5 className="font-black text-sm uppercase tracking-widest">Financial Setup</h5>
                           </div>
                           <div className="space-y-6">
                              <div className="flex items-center justify-between p-4 bg-white rounded-[10px] border border-gray-100">
                                 <span className="text-sm font-medium text-gray-500">{selectedPartner.role === 'supplier' ? 'Commission Rate' : 'Discount Rate'}</span>
                                 <span className="text-lg font-black text-gray-900">{selectedPartner.role === 'supplier' ? selectedPartner.commissionRate : selectedPartner.discountRate}%</span>
                              </div>
                              <button 
                                onClick={() => setActiveMenu('users')}
                                className="w-full py-4 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-primary transition-all text-gray-600 shadow-sm"
                              >
                                Update Financial Terms
                              </button>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-gray-50 rounded-[10px] p-8 border border-gray-100">
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6">Partner Info</h4>
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Company</p>
                          <p className="text-sm font-bold text-gray-900">{selectedPartner.companyName || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Public Email</p>
                          <p className="text-sm font-bold text-gray-900">{selectedPartner.publicEmail || selectedPartner.email}</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">WhatsApp</p>
                          <p className="text-sm font-bold text-gray-900">{selectedPartner.phoneNumber || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {! (selectedPartner as any)._isEditing && (
                        <button 
                          onClick={() => setSelectedPartner({...selectedPartner, _isEditing: true} as any)}
                          className="w-full mt-6 py-4 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:border-primary hover:text-primary transition-all"
                        >
                          Quick Edit Profile
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <PartnerListing 
              type={activeMenu === 'suppliers' ? 'supplier' : 'agent'} 
              users={users} 
              onSelect={setSelectedPartner} 
              onDelete={handleDeleteUser}
              resetForm={resetForm}
              setFormData={setFormData}
              formData={formData}
              setActiveMenu={setActiveMenu}
              onViewTours={(u) => {
                setTourSupplierFilter(u.uid);
                setActiveMenu('all-tours');
              }}
              allTours={tours}
            />
          )}
        </div>
  );
};

export default PartnerDetailView;
