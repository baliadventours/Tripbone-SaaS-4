import React, { useState } from 'react';
import { 
  Car, 
  Settings, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  HelpCircle,
  Clock,
  Compass,
  AlertCircle
} from 'lucide-react';
import { useSettings } from '../../../lib/SettingsContext';
import { useTenant } from '../../../lib/TenantContext';
import { db, doc, setDoc, serverTimestamp, getActiveTenantId } from '../../../lib/firebase';
import { CarRentalModuleSettings, RentalZone, RentalAddOn } from '../../../types';
import { DEFAULT_RENTAL_ZONES, DEFAULT_RENTAL_ADDONS, sanitizeFirestoreData } from '../../../lib/carRentalService';
import { cn } from '../../../lib/utils';

export default function RentalModuleSettings() {
  const { settings } = useSettings();
  const { tenantId } = useTenant();

  const initialConfig: CarRentalModuleSettings = settings?.carRentalModule || {
    enabled: true,
    showOnHomepage: true,
    heroSearchTab: true,
    moduleTitle: "Private Car Rentals & Chauffeur Charters",
    moduleSubtitle: "Explore the island in total comfort with vetted vehicles and experienced private drivers.",
    defaultDepositPercentage: 20,
    depositPolicy: "A 20% deposit secures your reservation. Balance payable on arrival.",
    driverInclusionNote: "Includes English-speaking driver, vehicle, and fuel for designated itinerary zone.",
    selfDriveRequirementNote: "Requires valid IDP / Driver's License and refundable security deposit.",
    zones: DEFAULT_RENTAL_ZONES,
    globalAddOns: DEFAULT_RENTAL_ADDONS,
  };

  const [config, setConfig] = useState<CarRentalModuleSettings>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const effectiveTenantId = tenantId || getActiveTenantId();
      
      const payload = {
        ...settings,
        carRentalModule: config,
        updatedAt: serverTimestamp(),
      };

      // Save to settings/general or paymentSettings/tenantId
      if (effectiveTenantId) {
        await setDoc(doc(db, 'settings', effectiveTenantId), sanitizeFirestoreData(payload), { merge: true });
        await setDoc(doc(db, 'tenants', effectiveTenantId), sanitizeFirestoreData({ carRentalModule: config }), { merge: true });
      } else {
        await setDoc(doc(db, 'settings', 'general'), sanitizeFirestoreData(payload), { merge: true });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save rental settings:', err);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddZone = () => {
    const newZone: RentalZone = {
      id: `zone-${Date.now()}`,
      name: 'Custom Zone: Extended Route',
      description: 'Covers distant landmarks and specialty locations.',
      surcharge: 20,
      coveredAreas: ['Custom Area 1', 'Custom Area 2'],
    };
    setConfig(prev => ({
      ...prev,
      zones: [...(prev.zones || DEFAULT_RENTAL_ZONES), newZone],
    }));
  };

  const handleDeleteZone = (id: string) => {
    setConfig(prev => ({
      ...prev,
      zones: (prev.zones || DEFAULT_RENTAL_ZONES).filter(z => z.id !== id),
    }));
  };

  const handleAddAddOn = () => {
    const newAddOn: RentalAddOn = {
      id: `addon-${Date.now()}`,
      name: 'New Equipment Add-on',
      price: 10,
      type: 'per_day',
      description: 'Description of equipment or concierge service.',
    };
    setConfig(prev => ({
      ...prev,
      globalAddOns: [...(prev.globalAddOns || DEFAULT_RENTAL_ADDONS), newAddOn],
    }));
  };

  const handleDeleteAddOn = (id: string) => {
    setConfig(prev => ({
      ...prev,
      globalAddOns: (prev.globalAddOns || DEFAULT_RENTAL_ADDONS).filter(a => a.id !== id),
    }));
  };

  return (
    <form onSubmit={handleSaveSettings} className="space-y-8 text-left max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider mb-2">
            <Car className="w-3.5 h-3.5" />
            <span>Module Settings & Toggles</span>
          </div>
          <h2 className="text-xl font-black text-gray-900">
            Car Rental & Chauffeur Settings
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Activate or deactivate the module, manage homepage showcase, hero tabs, zones, and distance pricing.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 rounded-2xl bg-primary hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-primary/20 active:scale-95 transition-all shrink-0 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Car Rental module settings saved successfully! Changes are live across your website.</span>
        </div>
      )}

      {/* 1. Master Activation & Display Toggles */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-sm space-y-6">
        <h3 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span>Module Activation & Integration</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Master Enable */}
          <div className="p-5 rounded-2xl border-2 border-gray-200 bg-gray-50/50 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-gray-900">Master Module</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                  config.enabled ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                )}>
                  {config.enabled ? "Active" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Controls overall availability of the Car Rental system, routes (/rentals), and reservation forms.
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-gray-200">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="h-5 w-5 rounded text-primary focus:ring-primary"
              />
              <span className="text-xs font-bold text-gray-800">Enable Car Rental Module</span>
            </label>
          </div>

          {/* Homepage Showcase Section */}
          <div className="p-5 rounded-2xl border-2 border-gray-200 bg-gray-50/50 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-gray-900">Homepage Showcase</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                  config.showOnHomepage && config.enabled ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                )}>
                  {config.showOnHomepage && config.enabled ? "Visible" : "Hidden"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Renders modern fleet showcase directly between "Featured Tours" and "Guest Favorites" on the homepage.
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-gray-200">
              <input
                type="checkbox"
                checked={config.showOnHomepage}
                disabled={!config.enabled}
                onChange={(e) => setConfig({ ...config, showOnHomepage: e.target.checked })}
                className="h-5 w-5 rounded text-primary focus:ring-primary disabled:opacity-50"
              />
              <span className="text-xs font-bold text-gray-800">Show on Frontpage</span>
            </label>
          </div>

          {/* Hero Search Tab */}
          <div className="p-5 rounded-2xl border-2 border-gray-200 bg-gray-50/50 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-gray-900">Hero Search Tab</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                  config.heroSearchTab && config.enabled ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                )}>
                  {config.heroSearchTab && config.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Adds a quick tab switcher ("Tours & Activities" / "Car Rental & Chauffeur") inside the Hero search bar.
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-gray-200">
              <input
                type="checkbox"
                checked={config.heroSearchTab}
                disabled={!config.enabled}
                onChange={(e) => setConfig({ ...config, heroSearchTab: e.target.checked })}
                className="h-5 w-5 rounded text-primary focus:ring-primary disabled:opacity-50"
              />
              <span className="text-xs font-bold text-gray-800">Add Search Form to Hero</span>
            </label>
          </div>
        </div>

        {/* Section Titles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Homepage Section Title
            </label>
            <input
              type="text"
              value={config.moduleTitle || ''}
              onChange={(e) => setConfig({ ...config, moduleTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Homepage Section Subtitle
            </label>
            <input
              type="text"
              value={config.moduleSubtitle || ''}
              onChange={(e) => setConfig({ ...config, moduleSubtitle: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* 2. Operational Travel Zones & Distance Surcharges */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Operational Distance Zones & Fuel Surcharges</span>
          </h3>
          <button
            type="button"
            onClick={handleAddZone}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Zone</span>
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Define geographical distance tiers. Chauffeur charters in farther zones automatically add the specified flat fuel surcharge to transparently cover long-distance driving.
        </p>

        <div className="space-y-4">
          {(config.zones || DEFAULT_RENTAL_ZONES).map((zone, idx) => (
            <div
              key={zone.id}
              className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Zone Name</label>
                    <input
                      type="text"
                      value={zone.name}
                      onChange={(e) => {
                        const updated = [...(config.zones || DEFAULT_RENTAL_ZONES)];
                        updated[idx].name = e.target.value;
                        setConfig({ ...config, zones: updated });
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Fuel Surcharge ($)</label>
                    <input
                      type="number"
                      value={zone.surcharge}
                      onChange={(e) => {
                        const updated = [...(config.zones || DEFAULT_RENTAL_ZONES)];
                        updated[idx].surcharge = Number(e.target.value);
                        setConfig({ ...config, zones: updated });
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Covered Hubs (comma-separated)</label>
                    <input
                      type="text"
                      value={(zone.coveredAreas || []).join(', ')}
                      onChange={(e) => {
                        const updated = [...(config.zones || DEFAULT_RENTAL_ZONES)];
                        updated[idx].coveredAreas = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        setConfig({ ...config, zones: updated });
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteZone(zone.id)}
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition"
                  title="Remove Zone"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Zone description shown to customers"
                  value={zone.description}
                  onChange={(e) => {
                    const updated = [...(config.zones || DEFAULT_RENTAL_ZONES)];
                    updated[idx].description = e.target.value;
                    setConfig({ ...config, zones: updated });
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-600"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Global Add-Ons & Equipment */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Rental Add-Ons & Travel Extras</span>
          </h3>
          <button
            type="button"
            onClick={handleAddAddOn}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Extra</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(config.globalAddOns || DEFAULT_RENTAL_ADDONS).map((addon, idx) => (
            <div
              key={addon.id}
              className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2 relative"
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={addon.name}
                  onChange={(e) => {
                    const updated = [...(config.globalAddOns || DEFAULT_RENTAL_ADDONS)];
                    updated[idx].name = e.target.value;
                    setConfig({ ...config, globalAddOns: updated });
                  }}
                  className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteAddOn(addon.id)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Price ($)</label>
                  <input
                    type="number"
                    value={addon.price}
                    onChange={(e) => {
                      const updated = [...(config.globalAddOns || DEFAULT_RENTAL_ADDONS)];
                      updated[idx].price = Number(e.target.value);
                      setConfig({ ...config, globalAddOns: updated });
                    }}
                    className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Pricing Type</label>
                  <select
                    value={addon.type}
                    onChange={(e: any) => {
                      const updated = [...(config.globalAddOns || DEFAULT_RENTAL_ADDONS)];
                      updated[idx].type = e.target.value;
                      setConfig({ ...config, globalAddOns: updated });
                    }}
                    className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900"
                  >
                    <option value="per_day">Per Day</option>
                    <option value="per_booking">Per Booking</option>
                  </select>
                </div>
              </div>

              <input
                type="text"
                placeholder="Brief description"
                value={addon.description || ''}
                onChange={(e) => {
                  const updated = [...(config.globalAddOns || DEFAULT_RENTAL_ADDONS)];
                  updated[idx].description = e.target.value;
                  setConfig({ ...config, globalAddOns: updated });
                }}
                className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-600"
              />
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
