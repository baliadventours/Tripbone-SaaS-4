import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Check, 
  MessageSquare, 
  Clock, 
  UserCheck, 
  Star, 
  Mail, 
  RefreshCw, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Play, 
  Copy, 
  Layers, 
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { SiteSettings, RentalAutomationsConfig } from '../../../types';
import { useSettings } from '../../../lib/SettingsContext';
import { useTenant } from '../../../lib/TenantContext';
import { db, doc, updateDoc, serverTimestamp, getActiveTenantId } from '../../../lib/firebase';
import { DEFAULT_RENTAL_AUTOMATIONS, formatRentalTemplate } from '../../../lib/rentalAutomationsService';
import { sendCustomWhatsApp, getWhatsAppLink } from '../../../lib/whatsappService';
import { cn } from '../../../lib/utils';

export default function RentalAutomations() {
  const { settings } = useSettings();
  const { tenantId } = useTenant();

  const [automations, setAutomations] = useState<RentalAutomationsConfig>(() => {
    return settings?.carRentalModule?.automations || DEFAULT_RENTAL_AUTOMATIONS;
  });

  const [activeTab, setActiveTab] = useState<'confirmation' | 'dispatch' | 'reminder' | 'review' | 'email'>('confirmation');
  const [isSaving, setIsSaving] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState(settings?.whatsappNumber || '+6281234567890');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.carRentalModule?.automations) {
      setAutomations(settings.carRentalModule.automations);
    }
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Mock booking data for live template preview
  const mockBooking: any = {
    id: 'DEMO-8821',
    customerData: {
      fullName: 'Alexander Wright',
      phone: testPhoneNumber,
      email: 'alex.wright@gmail.com',
      pickupAddress: 'W Bali - Seminyak Resort',
    },
    date: '2026-08-25',
    timeSlot: '09:00 AM',
    totalAmount: 120,
    tourTitle: 'Toyota Innova Zenix Executive',
    rentalDetails: {
      vehicleName: 'Toyota Innova Zenix Executive',
      vehicleCategory: 'executive',
      serviceMode: 'with_driver',
      durationType: 'full_day',
      durationDays: 1,
      pickupDate: '2026-08-25',
      pickupTime: '09:00 AM',
      pickupLocation: 'W Bali - Seminyak Resort',
      zoneName: 'Zone 1: Standard Tourist Hub',
      baseRate: 95,
      securityDeposit: 0,
      depositPaidAmount: 50,
      balanceDue: 70,
      assignedDriverName: 'Wayan Sudarma',
      assignedDriverPhone: '+62 812-3456-7899',
      assignedVehiclePlate: 'DK 1842 AB',
      depositStatus: 'received',
    },
  };

  // Dynamic tags available for insertion
  const availableTags = [
    { tag: '{customer_name}', label: 'Guest Name' },
    { tag: '{booking_id}', label: 'Booking Ref' },
    { tag: '{vehicle_name}', label: 'Vehicle Name' },
    { tag: '{service_mode}', label: 'Service Mode' },
    { tag: '{pickup_date}', label: 'Pickup Date' },
    { tag: '{pickup_time}', label: 'Pickup Time' },
    { tag: '{pickup_location}', label: 'Pickup Address' },
    { tag: '{duration_summary}', label: 'Duration' },
    { tag: '{driver_name}', label: 'Driver Name' },
    { tag: '{driver_phone}', label: 'Driver Phone' },
    { tag: '{license_plate}', label: 'License Plate' },
    { tag: '{total_amount}', label: 'Total Amount' },
    { tag: '{deposit_amount}', label: 'Deposit Paid' },
    { tag: '{balance_due}', label: 'Balance Due' },
    { tag: '{company_name}', label: 'Company Name' },
    { tag: '{support_phone}', label: 'Support Hotline' },
    { tag: '{review_link}', label: 'Review Link' },
  ];

  // Insert tag into currently active template
  const handleInsertTag = (tag: string) => {
    setAutomations(prev => {
      const copy = { ...prev };
      if (activeTab === 'confirmation') {
        copy.bookingConfirmationWhatsApp.template += ` ${tag}`;
      } else if (activeTab === 'dispatch') {
        copy.driverDispatchWhatsApp.template += ` ${tag}`;
      } else if (activeTab === 'reminder') {
        copy.preTripReminderWhatsApp.template += ` ${tag}`;
      } else if (activeTab === 'review') {
        copy.postTripReviewWhatsApp.template += ` ${tag}`;
      }
      return copy;
    });
  };

  // Save Settings to Firestore
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const effectiveTenantId = tenantId || getActiveTenantId();
      
      const currentModule = settings?.carRentalModule || {
        enabled: true,
        showOnHomepage: true,
        heroSearchTab: true,
      };

      const updatedModule = {
        ...currentModule,
        automations,
      };

      // Update primary site settings
      const settingsRef = doc(db, 'settings', 'global');
      await updateDoc(settingsRef, {
        carRentalModule: updatedModule,
        updatedAt: serverTimestamp(),
      });

      // Backwards compatible tenant settings
      if (effectiveTenantId) {
        try {
          const tenantRef = doc(db, 'paymentSettings', effectiveTenantId);
          await updateDoc(tenantRef, {
            'carRentalModule.automations': automations,
            updatedAt: serverTimestamp(),
          });
        } catch (e) {
          // ignore if tenant settings doc not initialized
        }
      }

      setSaveSuccess(true);
      showToast('Automations configuration saved successfully!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save automations:', err);
      showToast('Error saving configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger test-send via WhatsApp
  const handleTestSend = async () => {
    let currentTemplate = automations.bookingConfirmationWhatsApp.template;
    if (activeTab === 'dispatch') currentTemplate = automations.driverDispatchWhatsApp.template;
    if (activeTab === 'reminder') currentTemplate = automations.preTripReminderWhatsApp.template;
    if (activeTab === 'review') currentTemplate = automations.postTripReviewWhatsApp.template;

    const formattedMsg = formatRentalTemplate(currentTemplate, mockBooking, settings, {
      driverName: 'Wayan Sudarma',
      driverPhone: '+62 812-3456-7899',
      licensePlate: 'DK 1842 AB',
      reviewLink: `https://${settings?.customDomain || 'tripbone.com'}/reviews`,
    });

    const url = getWhatsAppLink(testPhoneNumber, formattedMsg);
    window.open(url, '_blank');
    showToast('Opened WhatsApp with live preview message');
  };

  // Current template preview text
  const currentPreviewText = formatRentalTemplate(
    activeTab === 'confirmation' ? automations.bookingConfirmationWhatsApp.template :
    activeTab === 'dispatch' ? automations.driverDispatchWhatsApp.template :
    activeTab === 'reminder' ? automations.preTripReminderWhatsApp.template :
    automations.postTripReviewWhatsApp.template,
    mockBooking,
    settings,
    {
      driverName: 'Wayan Sudarma',
      driverPhone: '+62 812-3456-7899',
      licensePlate: 'DK 1842 AB',
    }
  );

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-4 py-3 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-2xl flex items-center gap-2 border border-gray-800"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-primary flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Car Rental Booking Automations</h1>
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-bold border",
              automations.enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"
            )}>
              {automations.enabled ? '● Active' : '○ Paused'}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Set up hands-free WhatsApp and Email automated message triggers for customer bookings, driver assignments, and pre-trip reminders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={automations.enabled} 
              onChange={(e) => setAutomations({ ...automations, enabled: e.target.checked })} 
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            <span className="ml-2 text-xs font-bold text-gray-700">Master Switch</span>
          </label>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-all shadow active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {isSaving ? 'Saving...' : 'Save Automations'}
          </button>
        </div>
      </div>

      {/* Main Grid: Workflow Editor + Live WhatsApp Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Triggers List & Template Editor */}
        <div className="lg:col-span-7 space-y-4">
          {/* Trigger Navigation Tabs */}
          <div className="flex gap-2 p-1.5 bg-gray-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('confirmation')}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5",
                activeTab === 'confirmation' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              1. Confirmation
            </button>

            <button
              onClick={() => setActiveTab('dispatch')}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5",
                activeTab === 'dispatch' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              2. Driver Dispatch
            </button>

            <button
              onClick={() => setActiveTab('reminder')}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5",
                activeTab === 'reminder' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              3. Pre-Trip Reminder
            </button>

            <button
              onClick={() => setActiveTab('review')}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5",
                activeTab === 'review' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Star className="w-3.5 h-3.5 text-amber-500" />
              4. Review & Deposit
            </button>
          </div>

          {/* Editor Container */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            {/* Header & Toggle */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {activeTab === 'confirmation' && 'Instant Booking Confirmation Trigger'}
                  {activeTab === 'dispatch' && 'Chauffeur & License Plate Dispatch Alert'}
                  {activeTab === 'reminder' && '24-Hour Pre-Trip Reminder Trigger'}
                  {activeTab === 'review' && 'Post-Rental Feedback & Deposit Return Trigger'}
                </h2>
                <p className="text-xs text-gray-500">
                  {activeTab === 'confirmation' && 'Dispatched immediately when a customer reserves a vehicle on your website.'}
                  {activeTab === 'dispatch' && 'Dispatched when your operations team assigns a driver or license plate in the booking drawer.'}
                  {activeTab === 'reminder' && 'Sent 24h before scheduled vehicle pickup with packing & IDP checklists.'}
                  {activeTab === 'review' && 'Sent after trip completion confirming deposit return & review link.'}
                </p>
              </div>

              {/* Specific Trigger Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={
                    activeTab === 'confirmation' ? automations.bookingConfirmationWhatsApp.enabled :
                    activeTab === 'dispatch' ? automations.driverDispatchWhatsApp.enabled :
                    activeTab === 'reminder' ? automations.preTripReminderWhatsApp.enabled :
                    automations.postTripReviewWhatsApp.enabled
                  }
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAutomations(prev => {
                      const copy = { ...prev };
                      if (activeTab === 'confirmation') copy.bookingConfirmationWhatsApp.enabled = checked;
                      if (activeTab === 'dispatch') copy.driverDispatchWhatsApp.enabled = checked;
                      if (activeTab === 'reminder') copy.preTripReminderWhatsApp.enabled = checked;
                      if (activeTab === 'review') copy.postTripReviewWhatsApp.enabled = checked;
                      return copy;
                    });
                  }}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Dynamic Tag Injector Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Click to Insert Dynamic Placeholders:
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100">
                {availableTags.map(item => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleInsertTag(item.tag)}
                    className="px-2 py-1 bg-white hover:bg-orange-50 hover:border-primary/40 border border-gray-200 rounded-lg text-[11px] font-mono text-gray-700 transition-colors shadow-2xs"
                  >
                    + {item.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Template Editor */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp Message Body (Markdown Supported)</label>
              <textarea
                rows={12}
                value={
                  activeTab === 'confirmation' ? automations.bookingConfirmationWhatsApp.template :
                  activeTab === 'dispatch' ? automations.driverDispatchWhatsApp.template :
                  activeTab === 'reminder' ? automations.preTripReminderWhatsApp.template :
                  automations.postTripReviewWhatsApp.template
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setAutomations(prev => {
                    const copy = { ...prev };
                    if (activeTab === 'confirmation') copy.bookingConfirmationWhatsApp.template = val;
                    if (activeTab === 'dispatch') copy.driverDispatchWhatsApp.template = val;
                    if (activeTab === 'reminder') copy.preTripReminderWhatsApp.template = val;
                    if (activeTab === 'review') copy.postTripReviewWhatsApp.template = val;
                    return copy;
                  });
                }}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all leading-relaxed"
              />
            </div>

            {/* Quick Test Bar */}
            <div className="pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="Test Phone (+6281...)"
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="button"
                onClick={handleTestSend}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs"
              >
                <Play className="w-3 h-3" />
                Test Send via WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Mobile Simulation */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 bg-gray-900 rounded-3xl p-4 shadow-2xl border-4 border-gray-800">
            {/* Phone Screen Top Header */}
            <div className="bg-emerald-800 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                  TB
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">{settings?.siteName || 'Tripbone Rental'}</div>
                  <div className="text-[10px] text-emerald-200">Verified Business Concierge</div>
                </div>
              </div>
              <div className="text-[10px] bg-emerald-700/60 px-2 py-0.5 rounded font-mono">
                WhatsApp Live
              </div>
            </div>

            {/* Chat Bubble Canvas */}
            <div className="bg-[#ECE5DD] p-4 rounded-b-2xl min-h-[460px] max-h-[520px] overflow-y-auto space-y-3">
              <div className="text-center">
                <span className="text-[10px] bg-white/80 text-gray-500 px-2 py-0.5 rounded-md shadow-2xs font-medium">
                  TODAY
                </span>
              </div>

              {/* Message Bubble */}
              <div className="bg-white rounded-2xl rounded-tl-none p-3.5 shadow-sm max-w-[95%] border border-gray-200/60">
                <div className="text-xs text-gray-900 whitespace-pre-wrap font-sans leading-relaxed">
                  {currentPreviewText}
                </div>
                <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-gray-400">
                  <span>09:42 AM</span>
                  <span className="text-blue-500 font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* Simulation Footer Note */}
            <div className="pt-3 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Real-time preview rendered using actual guest sample variables</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
