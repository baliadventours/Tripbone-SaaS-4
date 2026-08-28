import React, { useState } from "react";
import { CreditCard, Sparkles, CheckCircle2, Zap, Check, ArrowRight, ShieldCheck, Download } from "lucide-react";
import * as LucideIcons from "lucide-react";
const Icons = LucideIcons;
import { cn } from "../../lib/utils";
import { db, doc, setDoc, getActiveTenantId } from "../../lib/firebase";

interface BillingViewProps {
  tenantData: any;
  setTenantData?: React.Dispatch<React.SetStateAction<any>>;
  tours?: any[];
  bookings?: any[];
  tenantInvoices?: any[];
}

export const BillingView: React.FC<BillingViewProps> = ({ 
  tenantData, 
  setTenantData,
  tours = [],
  bookings = [],
  tenantInvoices = []
}) => {
  return (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Billing & Subscription</h2>
                <p className="text-gray-500 font-medium tracking-tight">Manage your platform workspace tier, billing details, and active quotas.</p>
              </div>

              {/* Quota Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Tours</span>
                    <span className="text-xs font-black text-primary bg-orange-50 px-2 py-1 rounded-md">
                      {Math.min(100, Math.round((tours.length / ((tenantData?.plan || '').toLowerCase().includes('starter') ? 10 : (tenantData?.plan || '').toLowerCase().includes('professional') ? 50 : (tenantData?.plan || '').toLowerCase().includes('business') ? 100 : 999999)) * 100)) || 0}% Used
                    </span>
                  </div>
                  <p className="text-3xl font-black text-gray-900">
                    {tours.length} <span className="text-lg font-bold text-gray-400">/ {(tenantData?.plan || '').toLowerCase().includes('starter') ? '10' : (tenantData?.plan || '').toLowerCase().includes('professional') ? '50' : (tenantData?.plan || '').toLowerCase().includes('business') ? '100' : 'Unlimited'} tours</span>
                  </p>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((tours.length / ((tenantData?.plan || '').toLowerCase().includes('starter') ? 10 : (tenantData?.plan || '').toLowerCase().includes('professional') ? 50 : (tenantData?.plan || '').toLowerCase().includes('business') ? 100 : 999999)) * 100)) || 0}%` }} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Bookings</span>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                      {Math.min(100, Math.round((bookings.length / ((tenantData?.plan || '').toLowerCase().includes('starter') ? 100 : (tenantData?.plan || '').toLowerCase().includes('professional') ? 500 : (tenantData?.plan || '').toLowerCase().includes('business') ? 2000 : 999999)) * 100)) || 0}% Used
                    </span>
                  </div>
                  <p className="text-3xl font-black text-gray-900">
                    {bookings.length} <span className="text-lg font-bold text-gray-400">/ {(tenantData?.plan || '').toLowerCase().includes('starter') ? '100' : (tenantData?.plan || '').toLowerCase().includes('professional') ? '500' : (tenantData?.plan || '').toLowerCase().includes('business') ? '2,000' : 'Unlimited'} bookings</span>
                  </p>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((bookings.length / ((tenantData?.plan || '').toLowerCase().includes('starter') ? 100 : (tenantData?.plan || '').toLowerCase().includes('professional') ? 500 : (tenantData?.plan || '').toLowerCase().includes('business') ? 2000 : 999999)) * 100)) || 0}%` }} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Developer Webhooks</span>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">14% Used</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900">14,242 <span className="text-lg font-bold text-gray-400">/ 100,000 reqs</span></p>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '14.2%' }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Subscription & Payment History */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Payment History */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-black text-gray-900 text-lg tracking-tight">Payment History</h3>
                      <button 
                        onClick={() => alert("Retrieving full receipt ledger...")}
                        className="text-xs font-black uppercase tracking-wider text-primary hover:text-orange-700 transition-colors"
                      >
                        View Full Ledger
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-500">
                        <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/50">
                          <tr>
                            <th className="py-3 px-4">Invoice Number</th>
                            <th className="py-3 px-4">Billing Date</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {tenantInvoices.length === 0 ? (
                            <tr><td colSpan={5} className="py-4 text-center text-gray-400">No invoices found.</td></tr>
                          ) : tenantInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 px-4 font-black text-gray-900">{inv.no || inv.id}</td>
                              <td className="py-4 px-4 font-bold">{inv.invoiceDate || inv.date}</td>
                              <td className="py-4 px-4 font-black text-gray-700">{inv.amount || inv.amt}</td>
                              <td className="py-4 px-4">
                                <span className={inv.status === 'PENDING' ? "bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md" : inv.status === 'UNPAID' ? "bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md" : "bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md"}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <button 
                                  onClick={() => alert(`Downloading invoice receipt for ${inv.id}...`)}
                                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                  <Icons.Download className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Pricing Cards */}
                <div className="space-y-6">
                  {[
                    { id: 'starter', name: 'Starter Plan', price: '$49', desc: 'Up to 10 active tours & core widgets' },
                    { id: 'professional', name: 'Professional Plan', price: '$99', desc: 'Up to 50 tours & AI guest assistant' },
                    { id: 'business', name: 'Business Plan', price: '$199', desc: 'Up to 100 tours & custom payments' },
                    { id: 'enterprise', name: 'Enterprise Plan', price: '$499', desc: 'Unlimited tours, custom API & webhooks' }
                  ].map((pkg) => {
                    const isCurrent = (tenantData?.plan || 'starter').split('-')[0].toLowerCase() === pkg.id;
                    return (
                      <div 
                        key={pkg.id} 
                        className={cn(
                          "bg-white rounded-2xl p-6 md:p-8 relative overflow-hidden space-y-4 border transition-all",
                          isCurrent ? "border-2 border-orange-500 shadow-md" : "border-gray-100 hover:border-gray-200"
                        )}
                      >
                        {isCurrent && (
                          <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow">
                            Current Plan
                          </div>
                        )}
                        <div>
                          <p className={cn("text-[10px] font-black uppercase tracking-widest", isCurrent ? "text-primary" : "text-gray-400")}>
                            {pkg.name}
                          </p>
                          <h4 className="text-3xl font-black text-gray-900 tracking-tight mt-1">{pkg.price}<span className="text-sm font-medium text-gray-400"> / month</span></h4>
                        </div>
                        <p className="text-xs text-gray-500 font-bold">{pkg.desc}</p>
                        <button 
                          disabled={isCurrent}
                          onClick={async () => {
                            const tenantId = getActiveTenantId();
                            if (!tenantId) {
                              alert("Error: Tenant ID not found.");
                              return;
                            }
                            try {
                              await setDoc(doc(db, 'tenants', tenantId), { plan: pkg.id }, { merge: true });
                              alert(`🎉 Plan upgraded to ${pkg.name}!`);
                            } catch (err: any) {
                              console.error(err);
                              alert("Error updating plan: " + err.message);
                            }
                          }}
                          className={cn(
                            "w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                            isCurrent 
                              ? "bg-orange-50 text-primary cursor-not-allowed" 
                              : "bg-gray-900 hover:bg-black text-white cursor-pointer"
                          )}
                        >
                          {isCurrent ? "Plan Active" : `Select ${pkg.name}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
};

export default BillingView;
