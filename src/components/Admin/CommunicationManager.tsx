import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  db, auth, storage, handleFirestoreError, OperationType, getActiveTenantId 
} from "../../lib/firebase";
import { 
  collection, addDoc, updateDoc, deleteDoc, 
  doc, onSnapshot, serverTimestamp, query, orderBy,
  getDoc, setDoc, getDocs, collectionGroup, where 
} from "@/src/lib/firebase";
import { 
  Tour, TourPackage, PricingTier, AddOn, TransportOption, Coupon, PageContent, 
  ImportantInfoSection, UrgencyPoint, Booking, Review, UserProfile, Guide, 
  BlogPost, CommunicationSettings, SiteSettings, BookingLog, TourLabel, 
  Category, TourType, LocationMeta, Inquiry 
} from "../../types";
import RichTextEditor from "../RichTextEditor";
import { sendBookingEmail } from "../../lib/emailService";
import { sendWhatsAppNotification, getWhatsAppLink, generateBookingMessage, sendCustomWhatsApp } from "../../lib/whatsappService";
import { 
  Plus, Edit2, Trash2, Save, X, Check,
  Layout, LayoutTemplate, Image as ImageIcon, DollarSign, Map as MapIcon, 
  Info, List, CheckCircle, ChevronRight, 
  PlusCircle, MinusCircle, MessageCircle, Database,
  Upload, Loader2, BarChart3, FileText, TrendingUp, 
  MessageSquare, Monitor, Users, CreditCard, Settings, Wallet,
  Calendar as CalendarIcon, LayoutGrid, Clock, Briefcase, Star,
  Layers, Users2, ChevronDown, PieChart, Tag, MapPin, Globe,
  ShieldAlert, BookOpen, ShieldCheck, Phone, CheckCheck, Copy,
  Sparkles, Wand2, Lightbulb, LogOut, LifeBuoy,
  Camera, Compass, Waves, Mountain, Sun, Tent,
  Bike, Bus, Car, Plane, Sailboat, Palmtree, Navigation, Activity,
  User, CheckCircle2, AlertCircle, FileCode, Terminal, ChevronLeft,
  Share2, Printer, XCircle, ExternalLink, UserCheck, ArrowRight,
  ArrowLeft, Clock4, Ban, Bot,
  Zap, Send, Mail, Search, Hotel, Bed, Home, Building
} from "lucide-react";
import { cn, formatPrice } from "../../lib/utils";
import { uploadImage } from "../../lib/imgbb";


const CommunicationManager = () => {
  const [settings, setSettings] = useState<CommunicationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{success: boolean, message: string} | null>(null);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<{success: boolean, message: string} | null>(null);
  const [testWhatsAppLoading, setTestWhatsAppLoading] = useState(false);
  const [testWhatsAppStatus, setTestWhatsAppStatus] = useState<{success: boolean, message: string} | null>(null);

  // WABA Custom Tester State
  const [wabaTestPhone, setWabaTestPhone] = useState('');
  const [wabaTestMode, setWabaTestMode] = useState<'template' | 'text'>('template');
  const [wabaTestTemplateName, setWabaTestTemplateName] = useState('');
  const [wabaTestLanguage, setWabaTestLanguage] = useState('id');
  const [wabaTestBody, setWabaTestBody] = useState('This is a custom test message sent from the Bali AdvenTours admin panel playground.');

  // WhatsApp Session Management
  const [waSessionStatus, setWaSessionStatus] = useState<any>(null);
  const [waSessionLoading, setWaSessionLoading] = useState(false);
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waActionMessage, setWaActionMessage] = useState<string | null>(null);

  // Email Diagnostic Logs
  const [diagnosticLogs, setDiagnosticLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchDiagnosticLogs = async () => {
    setLogsLoading(true);
    try {
      const q = query(collection(db, 'email_logs'), orderBy('createdAt', 'desc'));
      const logSnap = await getDocs(q);
      const logs = logSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDiagnosticLogs(logs.slice(0, 25)); // Use slice for safe client-side paging limit
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const MERGE_TAGS = [
    { tag: '{{customerName}}', description: 'Full name of the customer' },
    { tag: '{{tourTitle}}', description: 'Name of the tour booked' },
    { tag: '{{bookingId}}', description: 'Unique booking reference ID' },
    { tag: '{{date}}', description: 'Date of the tour' },
    { tag: '{{time}}', description: 'Time or time slot of the tour' },
    { tag: '{{guests}}', description: 'Number of guests (Adults + Children)' },
    { tag: '{{totalAmount}}', description: 'Total price of the booking' },
    { tag: '{{paymentMethod}}', description: 'The payment method used' },
    { tag: '{{pickupAddress}}', description: 'Pickup location address' },
    { tag: '{{status}}', description: 'Current status of the booking' },
    { tag: '{{paymentInstructions}}', description: 'Bank details (only for pending email)' },
    { tag: '{{supportPhone}}', description: 'Your company support phone' },
    { tag: '{{whatsappLink}}', description: 'Direct link to chat with support' },
    { tag: '{{guideName}}', description: "Assigned guide's name" },
    { tag: '{{guideWhatsapp}}', description: "Assigned guide's WhatsApp number" },
    { tag: '{{bookingDate}}', description: 'The date of the tour' },
    { tag: '{{customer_name}}', description: 'Full name of the customer' },
    { tag: '{{tour_title}}', description: 'Name of the tour booked' },
    { tag: '{{booking_date}}', description: 'The date of the tour' },
    { tag: '{{guide_name}}', description: "Assigned guide's name" },
    { tag: '{{guide_whatsapp}}', description: "Assigned guide's WhatsApp number" },
  ];

  const handleWhatsAppTemplateChange = (type: keyof CommunicationSettings['whatsappTemplates'], field: 'message' | 'enabled', value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      whatsappTemplates: {
        ...settings.whatsappTemplates,
        [type]: {
          ...settings.whatsappTemplates[type],
          [field]: value
        }
      }
    });
  };

  const handleSendTestWhatsApp = async () => {
    if (!settings) return;
    if (!settings.adminNotificationPhone) {
      setTestWhatsAppStatus({ success: false, message: 'Please set an Admin Notification Phone number first in the fields below.' });
      return;
    }
    setTestWhatsAppLoading(true);
    setTestWhatsAppStatus(null);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const currentProvider = settings.whatsappProvider || 'openwa';
      
      const bodyData: any = {
        receiver: settings.adminNotificationPhone,
        customMessage: `*WhatsApp Test Message*\n\nThis is a diagnostic connection test notification from your Bali AdvenTours admin panel.\n\nProvider: ${currentProvider.toUpperCase()}\nTime: ${new Date().toLocaleString()}`,
        type: 'test',
        provider: currentProvider,
        tenantId: getActiveTenantId(),
      };

      if (currentProvider === 'waba') {
        bodyData.wabaAccessToken = settings.wabaAccessToken;
        bodyData.wabaPhoneNumberId = settings.wabaPhoneNumberId;
        bodyData.wabaTemplateName = settings.wabaTemplateName;
        bodyData.wabaLanguageCode = settings.wabaLanguageCode || 'en';
      } else {
        bodyData.token = settings.openwaApiKey;
        bodyData.baseUrl = settings.openwaBaseUrl || 'https://openwa-dashboard-production-b24e.up.railway.app';
        bodyData.sessionId = settings.openwaSessionId;
      }

      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify(bodyData)
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setTestWhatsAppStatus({ 
          success: true, 
          message: `Test message successfully sent via ${currentProvider.toUpperCase()}! Please check your phone for the receipt.` 
        });
      } else {
        let errorMsg = data.error || 'Failed to send WhatsApp message.';
        // Clean up HTML error messages from nginx or other proxies
        if (errorMsg.includes('<html') || errorMsg.includes('<!DOCTYPE')) {
          errorMsg = 'Received an HTML error page. This usually means the API Base URL is incorrect or the endpoint does not exist (404/405).';
        }
        setTestWhatsAppStatus({ success: false, message: errorMsg });
      }
    } catch (error: any) {
      setTestWhatsAppStatus({ success: false, message: error.message || 'An unexpected error occurred.' });
    } finally {
      setTestWhatsAppLoading(false);
    }
  };

  const handleSendWabaPlayground = async () => {
    if (!settings) return;
    const phoneToUse = wabaTestPhone.trim() || settings.adminNotificationPhone;
    if (!phoneToUse) {
      setTestWhatsAppStatus({ success: false, message: 'Please specify a recipient phone number first.' });
      return;
    }
    setTestWhatsAppLoading(true);
    setTestWhatsAppStatus(null);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      
      const bodyData: any = {
        receiver: phoneToUse,
        type: 'custom_waba_test',
        provider: 'waba',
        wabaAccessToken: settings.wabaAccessToken,
        wabaPhoneNumberId: settings.wabaPhoneNumberId,
        customMessage: wabaTestBody.trim(),
        tenantId: getActiveTenantId()
      };

      if (wabaTestMode === 'template') {
        bodyData.wabaTemplateName = wabaTestTemplateName.trim() || settings.wabaTemplateName || 'booking_confirmation';
        bodyData.wabaLanguageCode = wabaTestLanguage.trim() || settings.wabaLanguageCode || 'id';
      }

      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify(bodyData)
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setTestWhatsAppStatus({ 
          success: true, 
          message: `WABA test message successfully sent to ${phoneToUse}! Mode: ${wabaTestMode.toUpperCase()}.` 
        });
      } else {
        setTestWhatsAppStatus({ success: false, message: data.error || 'WABA test message failed to send.' });
      }
    } catch (error: any) {
      setTestWhatsAppStatus({ success: false, message: error.message || 'An unexpected error occurred.' });
    } finally {
      setTestWhatsAppLoading(false);
    }
  };

  const handleFetchWhatsAppQR = async () => {
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';
      const res = await fetch('/api/whatsapp-qr', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await res.json();
      if (data.success && data.data?.qrCode) {
        setWaQrCode(data.data.qrCode);
      } else if (data.error) {
        console.warn('QR code fetch failed:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch QR:', err);
    }
  };

  const handleCheckWhatsAppStatus = async () => {
    setWaSessionLoading(true);
    setWaActionMessage(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';
      const res = await fetch('/api/whatsapp-status', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setWaSessionStatus(data.data);
        if (data.data?.status === 'qr_ready') {
          await handleFetchWhatsAppQR();
        } else {
          setWaQrCode(null);
        }
      } else {
        setWaActionMessage(`Error: ${data.error}`);
        setWaSessionStatus({ status: 'failed', error: data.error });
      }
    } catch (err: any) {
      setWaActionMessage(`Error: ${err.message}`);
    } finally {
      setWaSessionLoading(false);
    }
  };

  const handleStartWhatsAppSession = async () => {
    setWaSessionLoading(true);
    setWaActionMessage("Starting session, please wait...");
    setWaQrCode(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';
      const res = await fetch('/api/whatsapp-start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setWaActionMessage("Session initialization requested successfully. Checking status...");
        setTimeout(() => {
          handleCheckWhatsAppStatus();
        }, 1500);
      } else {
        setWaActionMessage(`Failed to start session: ${data.error}`);
      }
    } catch (err: any) {
      setWaActionMessage(`Error: ${err.message}`);
    } finally {
      setWaSessionLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!settings) return;
    setTestEmailLoading(true);
    setTestEmailStatus(null);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          to: settings.adminNotificationEmail,
          subject: 'Test Email - Bali AdvenTours',
          tenantId: getActiveTenantId() || 'global',
          html: `<div style="font-family: sans-serif; padding: 20px; border: 2px solid #0d9488; border-radius: 10px;">
            <h2 style="color: #0d9488;">Email Configuration Test</h2>
            <p>Success! This is a test email from your <strong>Bali AdvenTours</strong> website.</p>
            <p><strong>Provider used:</strong> ${settings.emailProvider.toUpperCase()}</p>
            <p>If you're seeing this, your transactional emails are now working correctly.</p>
            <hr />
            <small>Sent at: ${new Date().toLocaleString()}</small>
          </div>`,
          type: 'test'
        })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { success: false, error: text || 'Server returned an invalid response (500).' };
      }

      if (response.ok && data.success) {
        if (data.skipped) {
          setTestEmailStatus({ 
            success: false, 
            message: `Email was NOT sent because the active provider is configured as 'none' or 'Disabled'. Please select your provider (e.g., Mailjet, Resend, etc.), fill in the credentials, and click 'Save settings' at the bottom of the page before sending a test.`
          });
        } else {
          setTestEmailStatus({ success: true, message: 'Test email sent successfully! Please check your inbox (' + settings.adminNotificationEmail + ').' });
        }
      } else {
        // If it's a known server error string masquerading as HTML
        const displayError = data.error?.includes('A server error occurred') 
          ? 'The Vercel Server crashed while trying to load the email handler. This usually means a missing environment variable or configuration file.'
          : (data.error || 'Failed to send test email.');
          
        setTestEmailStatus({ success: false, message: displayError });
      }
    } catch (error: any) {
      setTestEmailStatus({ success: false, message: error.message || 'An unexpected error occurred.' });
    } finally {
      setTestEmailLoading(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const defaults: CommunicationSettings = {
        id: 'settings',
        emailProvider: 'none',
        senderEmail: 'booking@tripbone.com',
        senderName: 'Tripbone Bookings',
        adminNotificationEmail: import.meta.env.VITE_ADMIN_EMAIL || 'baliadventours@gmail.com',
        adminNotificationPhone: '+10000000000',
        whatsappEnabled: false,
        whatsappProvider: 'openwa',
        wabaAccessToken: '',
        wabaPhoneNumberId: '',
        wabaTemplateName: '',
        wabaLanguageCode: 'id',
        wabaVerifyToken: 'baliadventours',
        geminiApiKey: '',
        imgbbApiKey: '',
        whatsappTemplates: {
          booking_confirmation: {
            message: "Halo {{customerName}}, booking anda untuk {{tourTitle}} pada tanggal {{date}} telah dikonfirmasi. Booking ID: {{bookingId}}",
            enabled: true
          },
          booking_status_updated: {
            message: "Halo {{customerName}}, status booking anda {{bookingId}} telah diperbarui menjadi: {{status}}",
            enabled: true
          },
          admin_notification: {
            message: "New Booking Alert! {{customerName}} booked {{tourTitle}} for {{date}}. Total: {{totalAmount}}",
            enabled: true
          },
          guide_assigned: {
            message: "*Guide Assigned*\n\nHello {{customer_name}}, we have assigned a guide for your tour \"{{tour_title}}\" on {{booking_date}}.\n\n*Your Guide:* {{guide_name}}\n*Guide WhatsApp:* {{guide_whatsapp}}\n\nOur guide will contact you soon for pickup details. Enjoy your trip!",
            enabled: true
          }
        },
        templates: {} as any
      };

      try {
        const docRef = doc(db, 'communicationSettings', getActiveTenantId() || 'global');
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data() as any;
          // Merge templates specifically to ensure new ones are added
          setSettings({ 
            ...defaults, 
            ...data,
            whatsappTemplates: {
              ...defaults.whatsappTemplates,
              ...(data.whatsappTemplates || {})
            }
          });
        } else {
          try {
            await setDoc(docRef, defaults);
          } catch (e) {
            console.warn('Could not auto-create communication settings doc:', e);
          }
          setSettings(defaults);
        }
      } catch (err: any) {
        console.error('Error fetching communication settings:', err);
        setSettings(defaults);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchDiagnosticLogs();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await setDoc(doc(db, 'communicationSettings', getActiveTenantId() || 'global'), settings);
      setSaveStatus({ success: true, message: "Settings saved successfully!" });
      setTimeout(() => setSaveStatus(null), 6000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus({ success: false, message: `Error saving settings: ${err.message || err}` });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;
  if (!settings) return null;

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Communication Settings</h2>
        <p className="text-gray-500 font-medium">Configure how you communicate with your guests via email.</p>
      </div>

      {/* Email Testing Tool (Fixed Position) */}
      <div className="bg-primary rounded-[10px] p-8 shadow-2xl shadow-primary/20 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Icons.Zap className="h-48 w-48 rotate-12" />
        </div>
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
             <div className="flex items-center gap-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Diagnostic tool</span>
                <span className="h-1.5 w-1.5 bg-orange-300 rounded-full animate-pulse"></span>
             </div>
             <h3 className="text-3xl font-black tracking-tight">Email Connection Tester</h3>
             <p className="text-orange-50 text-sm font-medium">Verify your Gmail or SMTP settings instantly without making a real booking. We will send a test email to <strong>{settings.adminNotificationEmail}</strong>.</p>
          </div>
          <button 
            type="button" 
            onClick={handleSendTestEmail}
            disabled={testEmailLoading || settings.emailProvider === 'none'}
            className="bg-white text-primary px-10 py-5 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shrink-0"
          >
            {testEmailLoading ? <Icons.Loader2 className="h-5 w-5 animate-spin" /> : <Icons.Send className="h-5 w-5" />}
            {testEmailLoading ? 'Running test...' : 'Send Test mail'}
          </button>
        </div>

        {testEmailStatus && (
           <div className={`mt-8 p-6 rounded-2xl border-2 animate-in fade-in zoom-in duration-300 ${testEmailStatus.success ? 'bg-white/10 border-white/20 text-white' : 'bg-red-500/20 border-red-500/30 text-white'}`}>
             <div className="flex items-start gap-4">
                {testEmailStatus.success ? <Icons.CheckCircle2 className="h-8 w-8 text-white shrink-0" /> : <Icons.AlertCircle className="h-8 w-8 text-white shrink-0" />}
                <div className="space-y-1">
                   <p className="text-lg font-black tracking-tight">{testEmailStatus.success ? 'System Online!' : 'Connection Refused'}</p>
                   <p className="text-sm font-medium opacity-90">{testEmailStatus.message}</p>
                   {!testEmailStatus.success && (
                      <div className="mt-4 bg-black/20 p-4 rounded-xl text-xs font-mono leading-relaxed border border-white/10">
                         <span className="font-black text-white underline mb-1 block">QUICK FIX FOR GMAIL:</span>
                         1. Ensure <a href="https://myaccount.google.com/security" target="_blank" className="underline font-bold">2-Step Verification</a> is ON.<br/>
                         2. Generate a 16-character <strong>App Password</strong>.<br/>
                         3. Use that code instead of your regular password.
                      </div>
                   )}
                </div>
             </div>
           </div>
        )}
      </div>

      {/* WhatsApp Testing Tool */}
      <div className="bg-[#075E54] rounded-[10px] p-8 shadow-2xl shadow-[#075E54]/20 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Icons.Phone className="h-48 w-48 rotate-12" />
        </div>
        
        {settings.whatsappProvider === 'waba' ? (
          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">WABA Play Area</span>
              <span className="h-1.5 w-1.5 bg-orange-400 rounded-full animate-pulse"></span>
            </div>
            
            <div>
              <h3 className="text-3xl font-black tracking-tight">WABA Direct Dispatch Tester</h3>
              <p className="text-orange-50 text-sm font-medium mt-1">
                Trigger and monitor custom Meta WABA notifications directly. Perfect for testing templates or session-based messaging.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-black/15 p-6 rounded-2xl border border-white/10 mt-4 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-orange-200 tracking-wider">Recipient Phone Number</label>
                <input
                  type="text"
                  value={wabaTestPhone}
                  onChange={e => setWabaTestPhone(e.target.value)}
                  placeholder={settings.adminNotificationPhone || 'e.g. +62812345678'}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm focus:bg-white/15 focus:outline-none focus:border-orange-400 transition-all font-mono placeholder:text-white/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-orange-200 tracking-wider">Message Mode</label>
                <select
                  value={wabaTestMode}
                  onChange={e => setWabaTestMode(e.target.value as 'template' | 'text')}
                  className="w-full rounded-xl bg-[#075E54] border border-white/20 px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-all text-white font-bold cursor-pointer font-sans"
                >
                  <option value="template">Template Message (Meta Approved Template)</option>
                  <option value="text">Standard Text Message (Requires Open Session)</option>
                </select>
              </div>

              {wabaTestMode === 'template' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-orange-200 tracking-wider">Template Name</label>
                  <input
                    type="text"
                    value={wabaTestTemplateName}
                    onChange={e => setWabaTestTemplateName(e.target.value)}
                    placeholder={settings.wabaTemplateName || 'e.g. booking_confirmation'}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm focus:bg-white/15 focus:outline-none focus:border-orange-400 transition-all font-mono placeholder:text-white/30 text-white"
                  />
                </div>
              )}

              {wabaTestMode === 'template' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-orange-200 tracking-wider">Template Language Code</label>
                  <input
                    type="text"
                    value={wabaTestLanguage}
                    onChange={e => setWabaTestLanguage(e.target.value)}
                    placeholder={settings.wabaLanguageCode || 'id'}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm focus:bg-white/15 focus:outline-none focus:border-orange-400 transition-all font-mono placeholder:text-white/30 text-white"
                  />
                </div>
              )}

              <div className="col-span-full space-y-2">
                <label className="text-[10px] font-black uppercase text-orange-200 tracking-wider">
                  {wabaTestMode === 'template' 
                    ? 'Template Parameters (Body Variable 1)' 
                    : 'Standard Message Text'}
                </label>
                <textarea
                  rows={3}
                  value={wabaTestBody}
                  onChange={e => setWabaTestBody(e.target.value)}
                  placeholder="Enter the body message or the template custom string..."
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm focus:bg-white/15 focus:outline-none focus:border-orange-400 transition-all placeholder:text-white/30 text-white"
                />
                <p className="text-[10px] text-orange-200/70 font-medium">
                  {wabaTestMode === 'template' 
                    ? 'Note: Meta approved templates usually expect dynamic parameters. We will map this message to {{1}}.' 
                    : 'Note: Meta requires that standard text messages be sent only when there is an active customer-initiated chat window open within 24 hours.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={handleSendWabaPlayground}
                disabled={testWhatsAppLoading || !settings.whatsappEnabled}
                className="bg-white text-[#075E54] px-10 py-4 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 cursor-pointer"
              >
                {testWhatsAppLoading ? <Icons.Loader2 className="h-5 w-5 animate-spin" /> : <Icons.MessageSquare className="h-5 w-5" />}
                {testWhatsAppLoading ? 'Dispatched...' : 'Trigger WABA Dispatch'}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 max-w-xl">
               <div className="flex items-center gap-3">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">WhatsApp diagnostic</span>
                  <span className="h-1.5 w-1.5 bg-orange-400 rounded-full animate-pulse"></span>
               </div>
               <h3 className="text-3xl font-black tracking-tight">WhatsApp Connection Tester</h3>
               <p className="text-orange-50 text-sm font-medium">Verify your OpenWA configuration instantly. We will send a test message to <strong>{settings.adminNotificationPhone || 'No number set'}</strong>.</p>
            </div>
            <button 
              type="button" 
              onClick={handleSendTestWhatsApp}
              disabled={testWhatsAppLoading || !settings.whatsappEnabled}
              className="bg-white text-[#075E54] px-10 py-5 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shrink-0"
            >
              {testWhatsAppLoading ? <Icons.Loader2 className="h-5 w-5 animate-spin" /> : <Icons.MessageSquare className="h-5 w-5" />}
              {testWhatsAppLoading ? 'Sending...' : 'Send Test WhatsApp'}
            </button>
          </div>
        )}

        {testWhatsAppStatus && (
           <div className={`mt-8 p-6 rounded-2xl border-2 animate-in fade-in zoom-in duration-300 ${testWhatsAppStatus.success ? 'bg-white/10 border-white/20 text-white' : 'bg-red-500/20 border-red-500/30 text-white'}`}>
             <div className="flex items-start gap-4 text-left">
                {testWhatsAppStatus.success ? <Icons.CheckCircle2 className="h-8 w-8 text-white shrink-0" /> : <Icons.AlertCircle className="h-8 w-8 text-white shrink-0" />}
                <div className="space-y-1">
                   <p className="text-lg font-black tracking-tight">{testWhatsAppStatus.success ? 'WhatsApp Online!' : 'Send Failed'}</p>
                   <p className="text-sm font-medium opacity-90">{testWhatsAppStatus.message}</p>
                   {!testWhatsAppStatus.success && settings.whatsappProvider !== 'waba' && (
                      <div className="mt-4 bg-black/20 p-4 rounded-xl text-xs font-mono leading-relaxed border border-white/10 opacity-90 text-left">
                         <span className="font-black text-white underline mb-1 block">QUICK FIX:</span>
                         1. Ensure <strong>OpenWA Base URL</strong> and <strong>Session Name</strong> ({settings.openwaSessionId || 'baliadventours'}) are correct.<br/>
                         2. Verify your <strong>OpenWA API Key</strong>.<br/>
                         3. <strong>SESSION NOT RUNNING:</strong> Use the live controls below to start the WhatsApp session and generate your authentication QR code.
                      </div>
                   )}
                   {!testWhatsAppStatus.success && settings.whatsappProvider === 'waba' && (
                      <div className="mt-4 bg-black/20 p-4 rounded-xl text-xs font-mono leading-relaxed border border-white/10 opacity-90 text-left">
                         <span className="font-black text-white underline mb-1 block">QUICK FIX FOR WABA:</span>
                         1. Ensure <strong>WABA Access Token</strong> and <strong>Phone Number ID</strong> are correct in communication settings.<br/>
                         2. Double check if your recipient phone number is fully formatted with country code (e.g., 628123456789).<br/>
                         3. If sending in Template Mode, confirm the template name and language code exist and are approved in Meta WhatsApp Manager.<br/>
                         4. In Non-Template Mode, ensure the recipient has initiated contact within the last 24 hours.
                      </div>
                   )}
                </div>
             </div>
           </div>
        )}

        {/* Real-time Session Connector */}
        {settings.whatsappProvider !== 'waba' && (
          <div className="mt-8 pt-8 border-t border-white/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 text-left">
                <h4 className="text-lg font-bold flex items-center gap-2">
                  <Icons.Settings className="h-5 w-5" />
                  Live Session Control
                </h4>
                <p className="text-xs text-orange-100">
                  Manage the active WhatsApp connection state on your gateway dynamically.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCheckWhatsAppStatus}
                  disabled={waSessionLoading}
                  className="bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/25 text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {waSessionLoading ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <Icons.RefreshCw className="h-4 w-4" />}
                  Check Connection Status
                </button>
                <button
                  type="button"
                  onClick={handleStartWhatsAppSession}
                  disabled={waSessionLoading}
                  className="bg-orange-500 hover:bg-primary border border-orange-400 text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Icons.Play className="h-4 w-4 fill-current" />
                  Initialize/Start Session
                </button>
              </div>
            </div>

            {waActionMessage && (
              <div className="mt-4 text-xs font-mono bg-black/30 p-3 rounded-lg text-orange-300 text-left">
                {waActionMessage}
              </div>
            )}

            {waSessionStatus && (
              <div className="mt-6 bg-white/10 border border-white/15 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300 text-left">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-250">Session ID</span>
                  <p className="font-mono text-sm font-bold">{waSessionStatus.name || settings.openwaSessionId || 'baliadventours'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-250">Connection State</span>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      waSessionStatus.status === 'ready' ? 'bg-orange-400 animate-pulse' :
                      waSessionStatus.status === 'qr_ready' ? 'bg-yellow-400 animate-pulse' :
                      waSessionStatus.status === 'initializing' || waSessionStatus.status === 'authenticating' ? 'bg-indigo-400 animate-pulse' : 'bg-red-450'
                    }`}></span>
                    <p className="font-bold uppercase tracking-wider text-sm">{waSessionStatus.status || 'UNKNOWN'}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-250">Linked Phone</span>
                  <p className="text-sm font-bold">{waSessionStatus.phone ? `+${waSessionStatus.phone}` : 'Not linked'}</p>
                </div>
              </div>
            )}

            {waQrCode && (
              <div className="mt-6 flex flex-col items-center bg-white text-gray-900 p-6 rounded-2xl max-w-sm mx-auto shadow-xl border border-white/20 animate-in zoom-in duration-300">
                <span className="text-xs font-black text-[#075E54] uppercase tracking-widest mb-3">Scan this QR Code via WhatsApp</span>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <img src={waQrCode} alt="WhatsApp QR Code" className="w-[200px] h-[200px]" referrerPolicy="no-referrer" />
                </div>
                <p className="text-[10px] text-gray-500 text-center font-medium mt-3 leading-relaxed">
                  Open WhatsApp on your phone, navigate to Linked Devices, and scan the QR code to authenticate the <strong>{settings.openwaSessionId || 'baliadventours'}</strong> session.
                </p>
                <button
                  type="button"
                  onClick={handleCheckWhatsAppStatus}
                  className="mt-4 w-full bg-[#075E54] hover:bg-[#128C7E] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                >
                  I Scanned It! Verify Connection
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-12">
        {saveStatus && (
          <div className={`p-5 rounded-xl border-2 ${saveStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'} flex items-start gap-4 font-bold text-sm animate-in fade-in duration-200`}>
            {saveStatus.success ? <Icons.CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" /> : <Icons.AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />}
            <div className="space-y-1">
              <p className="font-black">{saveStatus.success ? 'Success!' : 'Error Saving Settings'}</p>
              <p className="font-medium text-xs opacity-90">{saveStatus.message}</p>
            </div>
          </div>
        )}
        <section className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                    <Icons.Sparkles className="h-5 w-5" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">AI Intelligence (Google Gemini)</h3>
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Gemini API Key</label>
                     <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Securely Stored</span>
                   </div>
                   <input 
                     type="password"
                     value={settings.geminiApiKey || ''}
                     onChange={e => setSettings({ ...settings, geminiApiKey: e.target.value })}
                     placeholder="Enter your Google AI Studio API Key"
                     className="w-full rounded-[10px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-mono"
                   />
                   <p className="text-[10px] text-gray-400 font-medium">This key powers the AI Tour Builder. You can get a free key from Google AI Studio.</p>
                 </div>
               </div>
               
               <div className="bg-indigo-50/30 p-6 rounded-xl border border-indigo-100">
                 <div className="flex gap-4">
                   <Icons.Lightbulb className="h-6 w-6 text-indigo-600 shrink-0" />
                   <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 text-sm">How it works</h4>
                      <p className="text-xs text-gray-600 font-medium leading-relaxed">
                         The API key is used to communicate with Gemini 1.5 Flash. 
                         It's stored in your secure database and used whenever you click "AI Magic Builder".
                      </p>
                      <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 mt-2 hover:underline"
                      >
                        Get Key Here <Icons.Globe className="h-3 w-3" />
                      </a>
                   </div>
                 </div>
               </div>
            </div>
         </section>

        <section className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                    <Icons.Image className="h-5 w-5" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">Image Hosting (ImgBB)</h3>
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest">ImgBB API Key</label>
                     <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Securely Stored</span>
                   </div>
                   <input 
                     type="password"
                     value={settings.imgbbApiKey || ''}
                     onChange={e => setSettings({ ...settings, imgbbApiKey: e.target.value })}
                     placeholder="Enter your ImgBB API Key"
                     className="w-full rounded-[10px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-mono"
                   />
                   <p className="text-[10px] text-gray-400 font-medium">This key is used for secure multi-tenant image uploads, converting and compressing client images into WebP files automatically.</p>
                 </div>
               </div>
               
               <div className="bg-indigo-50/30 p-6 rounded-xl border border-indigo-100">
                 <div className="flex gap-4">
                   <Icons.Lightbulb className="h-6 w-6 text-indigo-600 shrink-0" />
                   <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 text-sm">How it works</h4>
                      <p className="text-xs text-gray-600 font-medium leading-relaxed">
                         Images uploaded via the tour manager, blogs, or settings are automatically converted and optimized to WebP format inside the browser, and then securely hosted via your private ImgBB storage using your individual API Key.
                      </p>
                      <a 
                        href="https://api.imgbb.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 mt-2 hover:underline"
                      >
                        Get Key Here <Icons.Globe className="h-3 w-3" />
                      </a>
                   </div>
                 </div>
               </div>
            </div>
         </section>

        <section className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-8">
           <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center text-primary">
                 <Icons.Mail className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Email Provider</h3>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Provider</label>
                 <select 
                   value={settings.emailProvider}
                   onChange={e => setSettings({ ...settings, emailProvider: e.target.value as any })}
                   className="w-full rounded-[10px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold appearance-none bg-white"
                 >
                   <option value="none">Disabled (No Emails)</option>
                   <option value="resend">Resend (Recommended)</option>
                   <option value="sendgrid">SendGrid</option>
                    <option value="brevo">Brevo (Sendinblue)</option>
                    <option value="gmail">Gmail SMTP (Direct Method)</option>
                     <option value="enginemailer">Enginemailer</option>
                     <option value="mailjet">Mailjet</option>
                 </select>
              </div>

              {settings.emailProvider === 'gmail' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Gmail Address</label>
                    <input 
                      type="email"
                      value={settings.gmailUser || ''}
                      onChange={e => setSettings({ ...settings, gmailUser: e.target.value })}
                      placeholder="baliadventours@gmail.com"
                      className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Google App Password</label>
                    <input 
                      type="password"
                      value={settings.gmailAppPassword || ''}
                      onChange={e => setSettings({ ...settings, gmailAppPassword: e.target.value })}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3 bg-secondary/5 p-6 rounded-xl border border-secondary/20">
                    <div className="flex gap-4">
                      <Icons.Info className="h-6 w-6 text-secondary shrink-0" />
                      <div className="space-y-2">
                         <h4 className="font-bold text-gray-900 text-sm underline">How to get a Google App Password?</h4>
                         <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4 font-medium leading-relaxed">
                            <li>Turn on <strong>2-Step Verification</strong> in your Google Account settings.</li>
                            <li>Search for "App Passwords" in your account search bar.</li>
                            <li>Select "Mail" and "Other (Custom name)" and type "Bali Website".</li>
                            <li>Copy the 16-character code and paste it here.</li>
                         </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {settings.emailProvider !== 'none' && settings.emailProvider !== 'gmail' && settings.emailProvider !== 'mailjet' && (
                <div className="space-y-2 lg:col-span-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest">API Key</label>
                     <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Env Vars Supported</span>
                   </div>
                   <input 
                     type="password"
                     value={settings.emailApiKey || ''}
                     onChange={e => setSettings({ ...settings, emailApiKey: e.target.value })}
                     placeholder={
                       settings.emailProvider === "enginemailer"
                         ? "Enter your Enginemailer API key or use ENGINEMAILER_API_KEY env var"
                         : `Enter your ${settings.emailProvider} API key or use BREVO_API_KEY env var`
                     }
                     className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                   />
                   <p className="text-[10px] text-gray-400 font-medium">Use the "Settings" menu to add your API key securely as an environment variable.</p>
                </div>
              )}

              {settings.emailProvider === 'mailjet' && (
                <>
                  <div className="space-y-2">
                     <div className="flex justify-between items-center">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-mono">Mailjet API Key (Public)</label>
                       <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Or use Env Vars</span>
                     </div>
                     <input 
                       type="text"
                       value={settings.emailApiKey?.includes(':') ? settings.emailApiKey.split(':')[0] : (settings.emailApiKey || '')}
                       onChange={e => {
                         const currentSecret = settings.emailApiKey?.includes(':') ? settings.emailApiKey.split(':')[1] : '';
                         setSettings({ ...settings, emailApiKey: `${e.target.value.trim()}:${currentSecret}` });
                       }}
                       placeholder="Enter Mailjet Public API Key"
                       className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-mono">Mailjet API Secret (Private)</label>
                     <input 
                       type="password"
                       value={settings.emailApiKey?.includes(':') ? settings.emailApiKey.split(':')[1] : ''}
                       onChange={e => {
                         const currentKey = settings.emailApiKey?.includes(':') ? settings.emailApiKey.split(':')[0] : (settings.emailApiKey || '');
                         setSettings({ ...settings, emailApiKey: `${currentKey}:${e.target.value.trim()}` });
                       }}
                       placeholder="Enter Mailjet Private Secret Key"
                       className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                     />
                  </div>
                </>
              )}

              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Sender Email</label>
                 <input 
                   required
                   type="email"
                   value={settings.senderEmail}
                   onChange={e => setSettings({ ...settings, senderEmail: e.target.value })}
                   className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Sender Name</label>
                 <input 
                   required
                   value={settings.senderName}
                   onChange={e => setSettings({ ...settings, senderName: e.target.value })}
                   className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Admin Notification Email</label>
                 <input 
                   required
                   type="email"
                   value={settings.adminNotificationEmail}
                   onChange={e => setSettings({ ...settings, adminNotificationEmail: e.target.value })}
                   className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                 />
              </div>
           </div>
        </section>

        <section className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-8">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center text-[#075E54]">
                   <Icons.Phone className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">WhatsApp Automation</h3>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.whatsappEnabled} 
                    onChange={e => setSettings({ ...settings, whatsappEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-primary rounded-full relative transition-all after:content-[''] after:absolute after:h-5 after:w-5 after:bg-white after:rounded-full after:top-0.5 after:left-0.5 peer-checked:after:left-5.5 after:transition-all"></div>
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Master Switch</span>
                </label>
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest">WhatsApp Gateway Provider</label>
                   <select 
                     value={settings.whatsappProvider || 'openwa'}
                     onChange={e => setSettings({ ...settings, whatsappProvider: e.target.value as 'openwa' | 'waba' })}
                     className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold cursor-pointer"
                   >
                     <option value="openwa">OpenWA (Self-hosted / REST Gateway)</option>
                     <option value="waba">WABA (WhatsApp Business Platform / Cloud API)</option>
                   </select>
                   <p className="text-[10px] text-gray-400 font-medium">Choose between your own self-hosted OpenWA instance or official Meta Cloud API.</p>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Admin Notification Phone</label>
                   <input 
                     type="text"
                     value={settings.adminNotificationPhone || ''}
                     onChange={e => setSettings({ ...settings, adminNotificationPhone: e.target.value })}
                     placeholder="+628xxx"
                     className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                   />
                   <p className="text-[10px] text-gray-400 font-medium">Phone number that will receive new booking alerts.</p>
                 </div>

                 {(settings.whatsappProvider === 'waba') ? (
                   <>
                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">WABA Access Token</label>
                       <input 
                         type="password"
                         value={settings.wabaAccessToken || ''}
                         onChange={e => setSettings({ ...settings, wabaAccessToken: e.target.value })}
                         placeholder="Meta System User token"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                       <p className="text-[10px] text-gray-400 font-medium">System User token with whatsapp_business_messaging permissions.</p>
                     </div>

                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">WABA Phone Number ID</label>
                       <input 
                         type="text"
                         value={settings.wabaPhoneNumberId || ''}
                         onChange={e => setSettings({ ...settings, wabaPhoneNumberId: e.target.value })}
                         placeholder="e.g. 104847294829"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                       <p className="text-[10px] text-gray-400 font-medium">The Phone Number ID displayed in your Facebook App Developer console.</p>
                     </div>

                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Default Template Name (Optional)</label>
                       <input 
                         type="text"
                         value={settings.wabaTemplateName || ''}
                         onChange={e => setSettings({ ...settings, wabaTemplateName: e.target.value })}
                         placeholder="e.g. booking_confirmation"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                       <p className="text-[10px] text-gray-400 font-medium">If empty, standard text messages are used. If specified, WABA template message is triggered.</p>
                     </div>

                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Template Language Code</label>
                       <input 
                         type="text"
                         value={settings.wabaLanguageCode || 'id'}
                         onChange={e => setSettings({ ...settings, wabaLanguageCode: e.target.value })}
                         placeholder="e.g. id, en"
                          className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">WABA Webhook Verify Token</label>
                        <input 
                          type="text"
                          value={settings.wabaVerifyToken || 'baliadventours'}
                          onChange={e => setSettings({ ...settings, wabaVerifyToken: e.target.value })}
                          placeholder="e.g. baliadventours"
                          className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                        />
                        <p className="text-[10px] text-gray-400 font-medium">Configure this string as the Verification Token in your Meta Developer App Webhook settings.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Template Language Code</label>
                        <input 
                          type="text"
                          value={settings.wabaLanguageCode || 'id'}
                          onChange={e => setSettings({ ...settings, wabaLanguageCode: e.target.value })}
                          placeholder="e.g. id, en"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">OpenWA API Key</label>
                       <input 
                         type="password"
                         value={settings.openwaApiKey || ''}
                         onChange={e => setSettings({ ...settings, openwaApiKey: e.target.value })}
                         placeholder="Enter your OpenWA API key"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                       <p className="text-[10px] text-gray-400 font-medium">Get this from your OpenWA Dashboard.</p>
                     </div>

                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">OpenWA Session Name</label>
                       <input 
                         type="text"
                         value={settings.openwaSessionId || ''}
                         onChange={e => setSettings({ ...settings, openwaSessionId: e.target.value })}
                         placeholder="e.g. baliadventours"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                       <p className="text-[10px] text-gray-400 font-medium">Required for multi-session dashboards. Tip: If the name doesn't work, try using just the number (e.g. 62812...).</p>
                     </div>

                     <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">OpenWA Base URL</label>
                       <input 
                         type="text"
                         value={settings.openwaBaseUrl || ''}
                         onChange={e => setSettings({ ...settings, openwaBaseUrl: e.target.value })}
                         placeholder="https://your-openwa-instance.railway.app"
                         className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                       />
                       <p className="text-[10px] text-gray-400 font-medium">The URL of your OpenWA instance.</p>
                     </div>
                   </>
                 )}
               </div>
               
               {settings.whatsappProvider === 'waba' ? (
                 <div className="bg-[#E7F3FF] p-6 rounded-xl border border-blue-100 flex flex-col justify-between">
                   <div className="flex gap-4">
                     <Icons.ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
                     <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 text-sm">WABA Cloud API Active</h4>
                        <p className="text-xs text-gray-600 font-medium leading-relaxed">
                           System uses <strong>WhatsApp Business Platform (Cloud API)</strong> from Meta to deliver transaction notifications.
                        </p>
                        <div className="mt-4 p-4 bg-white/50 rounded-lg border border-blue-100/20">
                           <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">Configuration Guide</p>
                           <ul className="text-[9px] text-gray-500 list-disc pl-4 space-y-1">
                             <li>Create a Meta Developer app and set up <strong>WhatsApp</strong> product.</li>
                             <li className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/50 my-2 space-y-1">
                               <p className="font-bold text-blue-800 text-[10px] uppercase">Webhook Configuration (Copy these to Meta App):</p>
                               <div className="space-y-1 text-left">
                                 <div>
                                   <span className="font-semibold text-gray-700 block">Callback URL:</span>
                                   <div className="flex items-center gap-1.5 mt-0.5">
                                     <code className="bg-white px-2 py-1 rounded border text-[10px] font-mono select-all flex-1 break-all text-blue-900 font-bold">
                                       {typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '/api/whatsapp/webhook'}
                                     </code>
                                     <button
                                       type="button"
                                       onClick={() => {
                                         const url = typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '/api/whatsapp/webhook';
                                         navigator.clipboard.writeText(url);
                                         alert('Callback URL copied to clipboard!');
                                       }}
                                       className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                     >
                                       Copy
                                     </button>
                                   </div>
                                 </div>
                                 <div className="pt-1">
                                   <span className="font-semibold text-gray-700 block">Verify Token:</span>
                                   <div className="flex items-center gap-1.5 mt-0.5">
                                     <code className="bg-white px-2 py-1 rounded border text-[10px] font-mono select-all flex-1 text-blue-900 font-bold">
                                       {settings.wabaVerifyToken || 'baliadventours'}
                                     </code>
                                     <button
                                       type="button"
                                       onClick={() => {
                                         navigator.clipboard.writeText(settings.wabaVerifyToken || 'baliadventours');
                                         alert('Verify Token copied to clipboard!');
                                       }}
                                       className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                     >
                                       Copy
                                     </button>
                                   </div>
                                 </div>
                               </div>
                             </li>
                             <li>Obtain a Permanent <strong>System User Access Token</strong> with <code>whatsapp_business_messaging</code> permission.</li>
                             <li>Configure your WABA <strong>Phone Number ID</strong> (found in Meta Developer Portal).</li>
                             <li>
                               <strong>Pro Tip:</strong> Create a template on Meta Manager with a single body parameter <code>{"{{1}}"}</code>. The system will automatically inject the full booking details into it for 100% dynamic notifications!
                             </li>
                           </ul>
                        </div>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 flex flex-col justify-between">
                   <div className="flex gap-4">
                     <Icons.ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                     <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 text-sm">OpenWA API Connected</h4>
                        <p className="text-xs text-gray-600 font-medium leading-relaxed">
                           System uses your custom <strong>OpenWA</strong> server to send notifications. Ideal for advanced self-hosted instance configurations.
                        </p>
                        <div className="mt-4 p-4 bg-white/50 rounded-lg border border-orange-100/20">
                           <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Configuration Needed</p>
                           <ul className="text-[9px] text-gray-500 list-disc pl-4 space-y-1">
                             <li>Get your <strong>API Key</strong> from your <a href="https://openwa-dashboard-production-b24e.up.railway.app/message-tester" target="_blank" className="underline font-bold">OpenWA Dashboard</a>.</li>
                             <li>Configure the Session ID and verify your server is scanning and active.</li>
                             <li>Ensure the <strong>Base URL</strong> matches your hosted OpenWA instance.</li>
                           </ul>
                        </div>
                     </div>
                   </div>
                 </div>
               )}
            </div>

           <div className="space-y-6 pt-4">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Automation Templates</h4>
              
              <div className="grid grid-cols-1 gap-4">
                {settings.whatsappTemplates && Object.keys(settings.whatsappTemplates).map((key) => {
                   const template = settings.whatsappTemplates[key as keyof typeof settings.whatsappTemplates];
                   return (
                     <div key={key} className="bg-gray-50/50 rounded-xl p-6 border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={template?.enabled}
                                onChange={e => {
                                   const next = { ...settings };
                                   next.whatsappTemplates[key as keyof typeof settings.whatsappTemplates].enabled = e.target.checked;
                                   setSettings(next);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4 bg-gray-200 peer-checked:bg-[#0668E1] rounded-full relative transition-all after:content-[''] after:absolute after:h-3 after:w-3 after:bg-white after:rounded-full after:top-0.5 after:left-0.5 peer-checked:after:left-4 after:transition-all"></div>
                           </label>
                        </div>
                        <textarea 
                           rows={3}
                           value={template?.message}
                           onChange={e => {
                              const next = { ...settings };
                              next.whatsappTemplates[key as keyof typeof settings.whatsappTemplates].message = e.target.value;
                              setSettings(next);
                           }}
                           className="w-full bg-white rounded-xl border-2 border-gray-100 p-4 text-sm font-medium focus:border-[#0668E1] transition-all focus:outline-none" 
                        />
                     </div>
                   )
                })}
              </div>
           </div>
        </section>

        <section className="bg-white p-10 rounded-[10px] border border-gray-100 shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <Icons.FileCode className="h-40 w-40" />
           </div>
           
           <div className="relative space-y-8">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                   <Icons.FileCode className="h-8 w-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">Email Content Engine</h3>
                   <p className="text-sm font-medium text-gray-500">Email templates are now strictly managed via source code for maximum reliability.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                       <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                          <Icons.Search className="h-4 w-4 text-primary" />
                          Where to edit content?
                       </h4>
                       <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                          To update the subject line or body of any automated email, you must modify the following file in your project directory:
                       </p>
                       <code className="block p-4 bg-gray-900 text-orange-400 font-mono text-xs rounded-xl border border-gray-700 shadow-lg">
                          /src/services/emailTemplates.ts
                       </code>
                       <div className="flex items-center gap-2 text-[10px] text-amber-600 font-black uppercase bg-amber-50 p-3 rounded-lg border border-amber-100">
                          <Icons.AlertCircle className="h-4 w-4" />
                          Database Overrides are now Disabled
                       </div>
                    </div>
                    
                    <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 space-y-3">
                       <h4 className="text-sm font-black text-orange-900 uppercase tracking-widest">Available Merge Tags</h4>
                       <div className="grid grid-cols-2 gap-2">
                          {MERGE_TAGS.slice(0, 8).map(tag => (
                             <div key={tag.tag} className="bg-white/60 p-2 rounded-lg text-[10px] font-bold text-gray-700 border border-orange-200">
                                {tag.tag}
                             </div>
                          ))}
                          <div className="bg-primary text-white p-2 rounded-lg text-[10px] font-black text-center uppercase">
                             + Many More
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden group shadow-2xl">
                       <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 bg-primary/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                       <div className="relative space-y-6">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                                <Icons.Terminal className="h-5 w-5 text-white" />
                             </div>
                             <p className="text-sm font-black uppercase tracking-widest">Developer Mode Active</p>
                          </div>
                          <p className="text-sm text-gray-300 font-medium leading-relaxed">
                            "By moving templates to the code, your emails are now version-controlled and faster to load. No more sync issues between database and code."
                          </p>
                          <div className="pt-4 flex items-center gap-3">
                             <div className="h-1 w-12 bg-primary rounded-full"></div>
                             <span className="text-[10px] font-black tracking-widest uppercase text-gray-400">Bali AdvenTours System</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        <div className="flex justify-end pt-8 border-t border-gray-100">
           <button 
             type="submit" 
             disabled={isSaving}
             className="bg-primary text-white px-12 py-4 rounded-xl font-black text-sm tracking-widest uppercase shadow-xl hover:bg-orange-700 transition-all flex items-center gap-2"
           >
             {isSaving ? <Icons.Loader2 className="animate-spin h-5 w-5" /> : <Icons.Save className="h-5 w-5" />}
             Save Communication Settings
           </button>
        </div>
      </form>

      {/* NEW: Real-time Email Trace & Diagnostic Console */}
      <div className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-6 mt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-700">
              <Icons.Terminal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Email Trace & Log Analyzer</h3>
              <p className="text-xs text-gray-500 font-medium">Investigate real-time email triggers, supplier alerts, and trace failure points instantly.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchDiagnosticLogs}
            disabled={logsLoading}
            className="bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 border border-gray-100 disabled:opacity-55"
          >
            {logsLoading ? <Icons.Loader2 className="h-4 w-4 animate-spin text-gray-500" /> : <Icons.RefreshCw className="h-4 w-4" />}
            Refresh Trace Logs
          </button>
        </div>

        {logsLoading && diagnosticLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
            <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-wider">Fetching live channel records...</p>
          </div>
        ) : diagnosticLogs.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-200">
            <Icons.MailCheck className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold">No dispatch histories logged yet.</p>
            <p className="text-xs text-gray-450 mt-1">Try triggering a "Send Test mail" above to populate the local tracker.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden border border-gray-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 uppercase tracking-widest text-[9px] font-black border-b border-gray-100">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Trigger / Email Type</th>
                    <th className="p-4">Recipient (To)</th>
                    <th className="p-4">Mailer Provider</th>
                    <th className="p-4">Delivery Status</th>
                    <th className="p-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {diagnosticLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const dateDisplay = log.createdAt?.seconds 
                      ? new Date(log.createdAt.seconds * 1000).toLocaleString() 
                      : (log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Just now');

                    return (
                      <>
                        <tr 
                          key={log.id} 
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="hover:bg-gray-50/50 cursor-pointer transition-colors duration-150"
                        >
                          <td className="p-4 font-mono text-gray-500">{dateDisplay}</td>
                          <td className="p-4 font-bold text-gray-900">
                            <span className="font-mono bg-gray-105 px-2 py-0.5 rounded text-gray-700 font-medium">
                              {log.type}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600 font-medium break-all max-w-[200px]">{log.to}</td>
                          <td className="p-4 font-mono text-gray-500 uppercase">{log.provider || 'N/A'}</td>
                          <td className="p-4">
                            {log.status === 'success' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                Delivered
                              </span>
                            )}
                            {log.status === 'skipped' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                Skipped
                              </span>
                            )}
                            {log.status === 'failed' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-750 border border-rose-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                Def refused
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              className="text-primary hover:text-emerald-750 font-black uppercase tracking-wider text-[10px] hover:underline"
                            >
                              {isExpanded ? 'Collapse' : 'Analyze'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gray-50/70">
                            <td colSpan={6} className="p-6 border-b border-gray-100">
                              <div className="bg-gray-950 text-gray-200 p-6 rounded-2xl font-mono text-xs space-y-4 shadow-inner max-w-full overflow-x-auto relative leading-relaxed">
                                <span className="absolute top-4 right-4 text-[10px] font-bold text-gray-550 border border-gray-800 px-2 py-0.5 rounded">
                                  ID: {log.id}
                                </span>
                                <div>
                                  <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">SUBJECT LINE</p>
                                  <p className="text-white font-bold">{log.subject || 'N/A'}</p>
                                </div>
                                {log.bookingId && (
                                  <div>
                                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">BOOKING REFERENCE</p>
                                    <p className="text-orange-400 font-bold">#{log.bookingId.toUpperCase()}</p>
                                  </div>
                                )}
                                {log.reason && (
                                  <div>
                                    <p className="text-gray-550 text-[10px] uppercase font-black tracking-widest">DECISION REASON</p>
                                    <p className={`${log.status === 'failed' ? 'text-rose-400' : 'text-amber-400'} font-bold`}>
                                      {log.reason}
                                    </p>
                                  </div>
                                )}
                                {log.errorDetails && (
                                  <div>
                                    <p className="text-rose-405 text-[10px] uppercase font-black tracking-widest mb-1.5">STACK TRACE / DETAILS</p>
                                    <pre className="bg-black/40 p-4 border border-rose-950/20 rounded-xl text-rose-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                                      {log.errorDetails}
                                    </pre>
                                  </div>
                                )}
                                <div className="pt-2 flex items-center gap-1.5 text-gray-500 text-[10px]">
                                  <Icons.Info className="h-3.5 w-3.5 text-gray-500" />
                                  Email processed at container server node and logged atomically to Firebase.
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              Showing the latest 25 delivery trace attempts. Expand any trace log to review complete payload details and connection stack traces.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


export { CommunicationManager };
export default CommunicationManager;
