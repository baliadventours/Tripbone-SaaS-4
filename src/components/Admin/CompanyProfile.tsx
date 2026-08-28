import React, { useState, useEffect } from "react";
import { UserProfile } from "../../types";
import { db, doc, setDoc } from "../../lib/firebase";
import { Save, User, Building, Phone, Globe, MapPin, Mail, Loader2, CheckCircle2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
const Icons = LucideIcons;

export const CompanyProfile = ({ userData, isAdminEdit = false }: { userData: UserProfile; isAdminEdit?: boolean }) => {
  const [profile, setProfile] = useState<UserProfile>(userData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfile(userData);
  }, [userData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", profile.uid), {
        ...profile,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert("Success: Profile updated!");
    } catch (err: any) {
      alert("Error saving profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-xs max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-orange-50 text-primary rounded-2xl">
          <Building className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {isAdminEdit ? "Partner Company Profile" : "Company & Business Profile"}
          </h2>
          <p className="text-xs text-gray-500 font-bold mt-0.5">
            Manage legal, contact, and branding information for this account.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              Company Name / Brand
            </label>
            <input
              type="text"
              value={profile?.companyName || ""}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 font-bold text-xs focus:bg-white focus:border-primary transition-all outline-hidden"
              placeholder="e.g. Bali Adventure Tours Ltd."
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              Contact Person / Representative
            </label>
            <input
              type="text"
              value={profile?.displayName || ""}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 font-bold text-xs focus:bg-white focus:border-primary transition-all outline-hidden"
              placeholder="Full Name"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={profile?.email || ""}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-100 font-bold text-xs text-gray-500 cursor-not-allowed outline-hidden"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              Phone / WhatsApp
            </label>
            <input
              type="text"
              value={profile?.phoneNumber || ""}
              onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 font-bold text-xs focus:bg-white focus:border-primary transition-all outline-hidden"
              placeholder="+62 812 3456 7890"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              Office / Operating Address
            </label>
            <textarea
              rows={3}
              value={(profile as any)?.address || ""}
              onChange={(e) => setProfile({ ...profile, address: e.target.value } as any)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 font-bold text-xs focus:bg-white focus:border-primary transition-all outline-hidden resize-none"
              placeholder="Full physical operating address..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-primary text-white rounded-xl font-black uppercase text-xs tracking-wider hover:bg-orange-700 transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving Changes..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfile;
