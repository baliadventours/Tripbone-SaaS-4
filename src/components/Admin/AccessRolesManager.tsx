import React, { useState } from "react";
import { ShieldCheck, UserCheck, Users, Plus, Check, Trash2, Edit2, ShieldAlert } from "lucide-react";
import * as LucideIcons from "lucide-react";
const Icons = LucideIcons;
import { cn } from "../../lib/utils";

interface AccessRolesManagerProps {
  currentUserProfile?: any;
  setActiveMenu?: (menu: string) => void;
}

export const AccessRolesManager: React.FC<AccessRolesManagerProps> = ({ currentUserProfile, setActiveMenu = () => {} }) => {
  return (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <div className="bg-white p-10 rounded-[10px] border border-gray-100 shadow-sm relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Icons.ShieldCheck className="h-64 w-64 text-primary" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-14 w-14 rounded-[10px] bg-orange-50 text-primary flex items-center justify-center">
                          <Icons.ShieldAlert className="h-8 w-8" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Access Control & Roles</h2>
                          <p className="text-gray-500 font-medium">Define and understand system permissions for each user type.</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-8 mt-12">
                          {[
                              { 
                                role: 'Administrator', 
                                id: 'users-admins',
                                icon: Icons.ShieldCheck,
                                color: 'bg-red-50 text-red-600 border-red-100',
                                permissions: [
                                  'Full system access & settings',
                                  'Manage all users & partners',
                                  'Inventory & pricing control',
                                  'Financial reporting & analytics',
                                  'Communication & email settings'
                                ]
                              },
                              { 
                                role: 'Supplier / Partner', 
                                id: 'users-suppliers',
                                icon: Icons.Briefcase,
                                color: 'bg-purple-50 text-purple-600 border-purple-100',
                                permissions: [
                                  'Manage company tours & packets',
                                  'View & update booking status',
                                  'Manage assigned guides',
                                  'Payout & earnings tracking',
                                  'Tour review management'
                                ]
                              },
                              { 
                                role: 'Travel Agent', 
                                id: 'users-agents',
                                icon: Icons.Users2,
                                color: 'bg-blue-50 text-blue-600 border-blue-100',
                                permissions: [
                                  'Special agent discount rates',
                                  'Manage client bookings',
                                  'Bulk booking capabilities',
                                  'Commission-based dashboard',
                                  'Advanced booking priority'
                                ]
                              },
                              { 
                                role: 'Customer / Traveler', 
                                id: 'users-customers',
                                icon: Icons.Users,
                                color: 'bg-orange-50 text-primary border-orange-100',
                                permissions: [
                                  'Book any public tour/package',
                                  'View personal booking history',
                                  'Leave review & ratings',
                                  'Manage personal profile',
                                  'Favorite tours wishlist'
                                ]
                              }
                          ].map((r, i) => (
                              <div className="flex flex-col p-8 bg-white rounded-[10px] border border-gray-100 hover:border-primary hover:shadow-xl hover:shadow-orange-50 transition-all group">
                                  <div className="flex items-center justify-between mb-6">
                                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner", r.color)}>
                                        <r.icon className="h-7 w-7" />
                                    </div>
                                    <button 
                                      onClick={() => setActiveMenu(r.id)}
                                      className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors flex items-center gap-2"
                                    >
                                      Manage Users <Icons.ArrowRight className="h-4 w-4" />
                                    </button>
                                  </div>
                                  
                                  <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-primary transition-colors">{r.role}</h3>
                                  <div className="space-y-3 mt-4">
                                    {r.permissions.map((p, pi) => (
                                      <div key={pi} className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                        <Icons.CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" />
                                        {p}
                                      </div>
                                    ))}
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="mt-12 p-6 bg-gray-50 rounded-[10px] border border-gray-100 flex items-center gap-4">
                        <Icons.Info className="h-5 w-5 text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-400 font-bold leading-relaxed">
                          Note: System roles are currently fixed. Manual permission overrides can be requested by contacting the technical support team.
                        </p>
                      </div>
                    </div>
                </div>
            </div>
          );
};

export default AccessRolesManager;
