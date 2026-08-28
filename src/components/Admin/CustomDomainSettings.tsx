import React, { useState } from "react";
import { Globe, Check, AlertCircle, RefreshCw, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import * as LucideIcons from "lucide-react";
const Icons = LucideIcons;
import { cn } from "../../lib/utils";
import { auth, doc, setDoc, updateDoc, db, getActiveTenantId } from "../../lib/firebase";

interface CustomDomainSettingsProps {
  tenantData: any;
  setTenantData: React.Dispatch<React.SetStateAction<any>>;
}

export const CustomDomainSettings: React.FC<CustomDomainSettingsProps> = ({ tenantData, setTenantData }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRecord(id);
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  const handleSaveDomain = async () => {
    setIsSaving(true);
    try {
      const activeTenantId = getActiveTenantId();
      if (activeTenantId) {
        await updateDoc(doc(db, "tenants", activeTenantId), {
          customDomain: tenantData?.customDomain || "",
        });
      }
      alert("Custom domain configuration saved successfully!");
    } catch (e: any) {
      console.error("Error saving custom domain:", e);
      alert("Failed to save custom domain: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Custom Domain Pointing</h2>
                <p className="text-gray-500 font-medium tracking-tight">Point your agency's domain name to our server clusters to offer a fully branded checkout and reservation experience.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Domain Input Form */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
                    <h3 className="font-black text-gray-900 text-lg tracking-tight flex items-center gap-2">
                      <Icons.Globe className="h-5 w-5 text-primary" /> Setup Custom Domain URL
                    </h3>
                    
                    {/* Domain Field Form */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">https://</span>
                          <input 
                            type="text"
                            placeholder="booking.yourdomain.com"
                            value={tenantData?.customDomain || ''}
                            onChange={(e) => {
                              const newDomain = e.target.value;
                              setTenantData(prev => prev ? { ...prev, customDomain: newDomain } : { customDomain: newDomain });
                            }}
                            className="w-full bg-gray-50 border-gray-100 hover:border-gray-200 rounded-2xl py-4 pl-18 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const tenantId = getActiveTenantId();
                              if (!tenantId) {
                                alert("Error: Tenant ID not found.");
                                return;
                              }
                              // Hit the Vercel API
                              const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
                              const res = await fetch('/api/tenant/add-domain', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ domain: tenantData?.customDomain || '' })
                              });
                              if (!res.ok) {
                                const errorData = await res.json();
                                alert("Vercel API Error: " + (errorData.error || "Failed to add domain"));
                                return;
                              }
                              await setDoc(doc(db, 'tenants', tenantId), { 
                                customDomain: tenantData?.customDomain || '' 
                              }, { merge: true });
                              alert("Success: Custom Domain successfully updated on Vercel!");
                            } catch (err) {
                              console.error(err);
                              alert("Error: Failed to save domain config.");
                            }
                          }}
                          className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all cursor-pointer shadow-md"
                        >
                          Save Configuration
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 px-1 font-bold">Use a subdomain like <code className="text-primary">booking.myagency.com</code> or a root domain like <code className="text-primary">myagency.com</code>.</p>
                    </div>

                    {/* Verification DNS records details */}
                    <div className="space-y-4 pt-4 border-t border-gray-50">
                      <div>
                        <h4 className="font-black text-gray-900 text-sm">Required DNS Settings</h4>
                        <p className="text-xs text-gray-400 mt-1">Configure these configurations inside your DNS provider (GoDaddy, Namecheap, Cloudflare, Route53, etc.)</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono text-gray-500 border border-gray-100 rounded-xl overflow-hidden">
                          <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                            <tr>
                              <th className="py-3 px-4">Type</th>
                              <th className="py-3 px-4">Host / Name</th>
                              <th className="py-3 px-4">Points To / IP Value</th>
                              <th className="py-3 px-4">TTL</th>
                              <th className="py-3 px-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 bg-white">
                            <tr>
                              <td className="py-4 px-4 font-black text-gray-900 font-sans">CNAME</td>
                              <td className="py-4 px-4 text-primary font-bold">www</td>
                              <td className="py-4 px-4 text-gray-700 font-bold select-all">cname.vercel-dns.com</td>
                              <td className="py-4 px-4 text-gray-400">Automatic</td>
                              <td className="py-4 px-4 font-sans">
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded uppercase">Connected</span>
                              </td>
                            </tr>
                            <tr>
                              <td className="py-4 px-4 font-black text-gray-900 font-sans">A Record</td>
                              <td className="py-4 px-4 text-primary font-bold">@</td>
                              <td className="py-4 px-4 text-gray-700 font-bold select-all">76.76.21.21</td>
                              <td className="py-4 px-4 text-gray-400">3600 (1 Hour)</td>
                              <td className="py-4 px-4 font-sans">
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded uppercase">Connected</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Live DNS verify diagnostic action */}
                    <div className="bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                          <Icons.ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900">Automatic SSL Certificates Active</p>
                          <p className="text-[10px] text-gray-400 font-medium">Free, auto-renewing Let's Encrypt SSL active for your pointed domain.</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!tenantData?.customDomain) {
                            alert("Please enter and save a domain first!");
                            return;
                          }
                          try {
                            const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
                            const res = await fetch(`/api/tenant/verify-domain?domain=${encodeURIComponent(tenantData.customDomain)}`, {
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const data = await res.json();
                            if (data.verified) {
                              alert(`Pinging Custom Domain DNS Records...\nDiagnostic Status: 100% OK! DNS successfully propagated.`);
                            } else {
                              alert(`Pinging Custom Domain DNS Records...\nDiagnostic Status: PENDING! DNS has not propagated yet or is misconfigured.\nMake sure you added the CNAME pointing to cname.vercel-dns.com!`);
                            }
                          } catch (err) {
                            alert("Error checking DNS status!");
                          }
                        }}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition-all cursor-pointer"
                      >
                        Check Live Status
                      </button>
                    </div>
                  </div>
                </div>

                {/* Helpful guides sidebar widget */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
                    <h3 className="font-black text-gray-900 text-sm tracking-tight flex items-center gap-2">
                      <Icons.HelpCircle className="h-4 w-4 text-primary" /> Setup Guidelines
                    </h3>
                    <div className="space-y-3.5 text-xs text-gray-500 font-sans">
                      <div className="flex items-start gap-3">
                        <div className="h-5 w-5 bg-orange-50 text-primary font-black rounded-full flex items-center justify-center shrink-0 text-[10px]">1</div>
                        <p className="leading-relaxed font-semibold">Login to your domain provider panel (GoDaddy, Namecheap, Cloudflare, etc.)</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-5 w-5 bg-orange-50 text-primary font-black rounded-full flex items-center justify-center shrink-0 text-[10px]">2</div>
                        <p className="leading-relaxed font-semibold">Navigate to the DNS management tab for your domain.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-5 w-5 bg-orange-50 text-primary font-black rounded-full flex items-center justify-center shrink-0 text-[10px]">3</div>
                        <p className="leading-relaxed font-semibold">Add a new record of type CNAME pointing <code className="text-primary font-bold">www</code> or sub-host to <code className="text-primary font-bold">cname.vercel-dns.com</code>.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-5 w-5 bg-orange-50 text-primary font-black rounded-full flex items-center justify-center shrink-0 text-[10px]">4</div>
                        <p className="leading-relaxed font-semibold">Wait a few minutes for changes to propagate globally (usually takes 5–15 mins).</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
};

export default CustomDomainSettings;
