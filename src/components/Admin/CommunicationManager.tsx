import React, { useState, useEffect, FormEvent } from "react";
import { 
  db, auth, getActiveTenantId 
} from "../../lib/firebase";
import { 
  doc, getDoc, setDoc 
} from "@/src/lib/firebase";
import { 
  CommunicationSettings, EmailTemplate, WhatsAppTemplate 
} from "../../types";
import { 
  Mail, Phone, Sparkles, Send, Loader2, CheckCircle2, AlertCircle, 
  ExternalLink, Eye, EyeOff, Save, Check, RefreshCw, Activity, 
  Settings, Play, Terminal, Info, Globe, Image as ImageIcon,
  MessageSquare, FileText, ChevronRight, Copy, CheckCheck, Lightbulb,
  ShieldCheck, Smartphone, Cpu, ShieldAlert, Sliders, ToggleLeft, ToggleRight
} from "lucide-react";
import { cn } from "../../lib/utils";

interface CommunicationManagerProps {
  initialTab?: 'email' | 'whatsapp' | 'gemini';
}

const MERGE_TAGS = [
  { tag: '{{customerName}}', description: 'Full name of customer' },
  { tag: '{{tourTitle}}', description: 'Name of the tour booked' },
  { tag: '{{bookingId}}', description: 'Unique booking reference ID' },
  { tag: '{{date}}', description: 'Tour date' },
  { tag: '{{time}}', description: 'Tour time / slot' },
  { tag: '{{guests}}', description: 'Total number of guests' },
  { tag: '{{totalAmount}}', description: 'Total price of booking' },
  { tag: '{{paymentMethod}}', description: 'Payment gateway or bank used' },
  { tag: '{{pickupAddress}}', description: 'Pickup location address' },
  { tag: '{{paymentInstructions}}', description: 'Bank transfer instructions' },
  { tag: '{{supportPhone}}', description: 'Support contact phone' },
  { tag: '{{whatsappLink}}', description: 'Direct WhatsApp link' },
  { tag: '{{guideName}}', description: 'Assigned guide name' },
  { tag: '{{guideWhatsapp}}', description: 'Assigned guide phone' },
];

type EmailTemplateKey = 
  | 'booking_confirmed' 
  | 'booking_pending' 
  | 'payment_received' 
  | 'guide_assigned' 
  | 'admin_new_booking' 
  | 'review_request' 
  | 'booking_cancelled';

const EMAIL_TEMPLATE_DEFS: { key: EmailTemplateKey; label: string; defaultSubject: string; defaultBody: string }[] = [
  {
    key: 'booking_confirmed',
    label: 'Booking Confirmed',
    defaultSubject: 'Booking Confirmed: {{tourTitle}} (Ref: #{{bookingId}})',
    defaultBody: `Dear {{customerName}},

We are thrilled to confirm your booking for {{tourTitle}}!

Booking Reference: #{{bookingId}}
Date: {{date}} at {{time}}
Guests: {{guests}}
Total Amount: {{totalAmount}}
Pickup Location: {{pickupAddress}}

Your tour is confirmed and our team is preparing for your extraordinary experience. If you need any assistance, reach us at {{supportPhone}} or chat via WhatsApp: {{whatsappLink}}.

Warm regards,
Customer Experience Team`
  },
  {
    key: 'booking_pending',
    label: 'Booking Pending (Bank Transfer)',
    defaultSubject: 'Booking Pending Payment: {{tourTitle}} (Ref: #{{bookingId}})',
    defaultBody: `Dear {{customerName}},

Thank you for your reservation for {{tourTitle}}. Your booking is pending payment.

Booking Reference: #{{bookingId}}
Total Due: {{totalAmount}}

Payment Instructions:
{{paymentInstructions}}

Please transfer the amount and send confirmation to complete your booking.

Best regards,
Reservations Team`
  },
  {
    key: 'payment_received',
    label: 'Payment Receipt',
    defaultSubject: 'Payment Received: Receipt for Booking #{{bookingId}}',
    defaultBody: `Dear {{customerName}},

We have successfully received your payment of {{totalAmount}} via {{paymentMethod}} for {{tourTitle}}.

Booking Reference: #{{bookingId}}
Tour Date: {{date}}
Status: PAID IN FULL

We look forward to hosting you! Download your receipt or voucher anytime from your customer portal.

Warm regards,
Finance & Operations`
  },
  {
    key: 'guide_assigned',
    label: 'Guide / Driver Assigned',
    defaultSubject: 'Guide Assigned for Your Tour: {{tourTitle}} on {{date}}',
    defaultBody: `Hello {{customerName}},

Your dedicated guide and driver have been assigned for {{tourTitle}} on {{date}}.

Guide Name: {{guideName}}
Guide WhatsApp: {{guideWhatsapp}}

Your guide will contact you prior to pickup. Please ensure your WhatsApp is active. Have an unforgettable adventure!

Best regards,
Tour Operations Team`
  },
  {
    key: 'admin_new_booking',
    label: 'Admin Alert: New Booking',
    defaultSubject: 'New Booking Alert: #{{bookingId}} - {{customerName}}',
    defaultBody: `Admin Alert: A new booking has been placed on your website!

Booking Reference: #{{bookingId}}
Guest: {{customerName}}
Tour: {{tourTitle}}
Date: {{date}} at {{time}}
Guests: {{guests}}
Total: {{totalAmount}} ({{paymentMethod}})
Pickup: {{pickupAddress}}

Check your admin dashboard to review and manage this booking.`
  },
  {
    key: 'review_request',
    label: 'Review Request',
    defaultSubject: 'How was your adventure? Review {{tourTitle}}',
    defaultBody: `Hi {{customerName}},

We hope you had a wonderful adventure on {{tourTitle}}!

Your feedback helps us continuously deliver exceptional journeys. Please take 60 seconds to share your experience with fellow travelers.

Thank you for exploring with us!
Warm regards,
Customer Success Team`
  },
  {
    key: 'booking_cancelled',
    label: 'Booking Cancelled',
    defaultSubject: 'Booking Cancellation: #{{bookingId}} - {{tourTitle}}',
    defaultBody: `Dear {{customerName}},

This confirms that booking #{{bookingId}} for {{tourTitle}} on {{date}} has been cancelled.

If a refund is applicable based on the cancellation policy, it will be processed to your original payment method. For questions, contact {{supportPhone}}.

Warm regards,
Reservations Support`
  }
];

export const CommunicationManager: React.FC<CommunicationManagerProps> = ({ initialTab = 'email' }) => {
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp' | 'gemini'>(initialTab);
  const [settings, setSettings] = useState<CommunicationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Email Tester State
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [testEmailCustomTo, setTestEmailCustomTo] = useState('');

  // Email Template Editor State
  const [selectedEmailTpl, setSelectedEmailTpl] = useState<EmailTemplateKey>('booking_confirmed');
  const [previewWithData, setPreviewWithData] = useState(true);

  // WhatsApp Testing State
  const [testWhatsAppLoading, setTestWhatsAppLoading] = useState(false);
  const [testWhatsAppStatus, setTestWhatsAppStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Whapi Tester State
  const [showWhapiToken, setShowWhapiToken] = useState(false);
  const [whapiTestPhone, setWhapiTestPhone] = useState('');
  const [whapiTestMessage, setWhapiTestMessage] = useState('This is a diagnostic test message dispatched via Whapi.cloud API Gateway.');
  const [whapiHealthStatus, setWhapiHealthStatus] = useState<any>(null);
  const [whapiHealthLoading, setWhapiHealthLoading] = useState(false);

  // WABA Tester State
  const [wabaTestPhone, setWabaTestPhone] = useState('');
  const [wabaTestMode, setWabaTestMode] = useState<'template' | 'text'>('template');
  const [wabaTestTemplateName, setWabaTestTemplateName] = useState('');
  const [wabaTestLanguage, setWabaTestLanguage] = useState('id');
  const [wabaTestBody, setWabaTestBody] = useState('This is a test notification sent from your admin panel.');

  // OpenWA Session State
  const [waSessionStatus, setWaSessionStatus] = useState<any>(null);
  const [waSessionLoading, setWaSessionLoading] = useState(false);
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waActionMessage, setWaActionMessage] = useState<string | null>(null);

  // Gemini API & Connection Checker State
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [testGeminiLoading, setTestGeminiLoading] = useState(false);
  const [testGeminiResult, setTestGeminiResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    model?: string;
    latencyMs?: number;
    sampleResponse?: string;
  } | null>(null);

  // Load Settings from Firestore
  useEffect(() => {
    const fetchSettings = async () => {
      const defaults: CommunicationSettings = {
        id: 'settings',
        emailProvider: 'resend',
        senderEmail: 'booking@tripbone.com',
        senderName: 'Tripbone Bookings',
        adminNotificationEmail: import.meta.env.VITE_ADMIN_EMAIL || 'baliadventours@gmail.com',
        adminNotificationPhone: '+628123456789',
        whatsappEnabled: false,
        whatsappProvider: 'whapi',
        wabaAccessToken: '',
        wabaPhoneNumberId: '',
        wabaTemplateName: 'booking_confirmation',
        wabaLanguageCode: 'id',
        wabaVerifyToken: 'tripbone_verify',
        whapiToken: '',
        whapiApiUrl: 'https://gate.whapi.cloud',
        whapiChannelId: '',
        whapiWebhookUrl: '',
        whapiProxyUrl: '',
        whapiAutoDownload: {
          image: true,
          audio: true,
          voice: true,
          video: true,
          document: true,
          sticker: true
        },
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
            message: "*Guide Assigned*\n\nHello {{customerName}}, we have assigned a guide for {{tourTitle}} on {{date}}.\n\n*Guide:* {{guideName}}\n*WhatsApp:* {{guideWhatsapp}}\n\nHave a great trip!",
            enabled: true
          }
        },
        templates: {} as any
      };

      // Populate default email templates
      const defaultTemplates: any = {};
      EMAIL_TEMPLATE_DEFS.forEach(def => {
        defaultTemplates[def.key] = {
          subject: def.defaultSubject,
          body: def.defaultBody,
          enabled: true
        };
      });
      defaults.templates = defaultTemplates;

      try {
        const tenantId = getActiveTenantId() || 'global';
        const docRef = doc(db, 'communicationSettings', tenantId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data() as any;
          setSettings({
            ...defaults,
            ...data,
            whatsappTemplates: {
              ...defaults.whatsappTemplates,
              ...(data.whatsappTemplates || {})
            },
            templates: {
              ...defaults.templates,
              ...(data.templates || {})
            }
          });
        } else {
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

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const cleanSettings = JSON.parse(JSON.stringify(settings));
      const tenantId = getActiveTenantId() || 'global';
      await setDoc(doc(db, 'communicationSettings', tenantId), cleanSettings, { merge: true });
      setSaveStatus({ success: true, message: "Communication settings saved successfully!" });
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus({ success: false, message: `Error saving settings: ${err.message || err}` });
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Send Test Email
  const handleSendTestEmail = async () => {
    if (!settings) return;
    setTestEmailLoading(true);
    setTestEmailStatus(null);
    const targetEmail = testEmailCustomTo.trim() || settings.adminNotificationEmail;
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          to: targetEmail,
          subject: `Connection Test (${settings.emailProvider.toUpperCase()}) - ${settings.senderName || 'Storefront'}`,
          tenantId: getActiveTenantId() || 'global',
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; border: 2px solid #ea580c; border-radius: 12px; max-width: 540px; margin: 0 auto; color: #1e293b;">
            <h2 style="color: #ea580c; margin-top: 0;">Email Connection Test: SUCCESS</h2>
            <p>Your transactional email engine is functioning perfectly!</p>
            <p><strong>Configured Provider:</strong> ${settings.emailProvider.toUpperCase()}</p>
            <p><strong>Sender Email:</strong> ${settings.senderEmail}</p>
            <p><strong>Recipient:</strong> ${targetEmail}</p>
            <p style="color: #64748b; font-size: 13px;">Sent from your Tripbone Admin Panel at ${new Date().toLocaleString()}</p>
          </div>`,
          type: 'test'
        })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { success: false, error: text || 'Server returned non-JSON response.' };
      }

      if (response.ok && data.success) {
        if (data.skipped) {
          setTestEmailStatus({ 
            success: false, 
            message: `Email was skipped because provider is 'none'. Select a provider (e.g. Resend, Gmail SMTP, Mailjet), save settings, then test again.`
          });
        } else {
          setTestEmailStatus({ 
            success: true, 
            message: `Test email successfully dispatched to ${targetEmail}! Please check your inbox and spam folder.` 
          });
        }
      } else {
        setTestEmailStatus({ 
          success: false, 
          message: data.error || 'Failed to dispatch test email. Please check your credentials.' 
        });
      }
    } catch (error: any) {
      setTestEmailStatus({ success: false, message: error.message || 'An unexpected network error occurred.' });
    } finally {
      setTestEmailLoading(false);
    }
  };

  // 2. WhatsApp Handlers
  const handleCheckWhapiHealth = async () => {
    if (!settings?.whapiToken) {
      setTestWhatsAppStatus({ success: false, message: 'Please provide a Whapi API Token first in WhatsApp Settings.' });
      return;
    }
    setWhapiHealthLoading(true);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const res = await fetch('/api/whatsapp/whapi-health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          token: settings.whapiToken,
          apiUrl: settings.whapiApiUrl || 'https://gate.whapi.cloud',
          tenantId: getActiveTenantId()
        })
      });
      const data = await res.json();
      setWhapiHealthStatus(data);
      if (res.ok && data.success) {
        setTestWhatsAppStatus({
          success: true,
          message: `Whapi Channel status: ${String(data.status).toUpperCase()}! Gateway verified successfully.`
        });
      } else {
        setTestWhatsAppStatus({
          success: false,
          message: data.error || 'Failed to verify Whapi channel status.'
        });
      }
    } catch (err: any) {
      setTestWhatsAppStatus({ success: false, message: err.message || 'Error checking Whapi health.' });
    } finally {
      setWhapiHealthLoading(false);
    }
  };

  const handleSendWhapiPlayground = async () => {
    if (!settings) return;
    const phoneToUse = whapiTestPhone.trim() || settings.adminNotificationPhone;
    if (!phoneToUse) {
      setTestWhatsAppStatus({ success: false, message: 'Please specify a recipient phone number first.' });
      return;
    }
    if (!settings.whapiToken) {
      setTestWhatsAppStatus({ success: false, message: 'Please configure your Whapi API Token first.' });
      return;
    }
    setTestWhatsAppLoading(true);
    setTestWhatsAppStatus(null);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          receiver: phoneToUse,
          customMessage: whapiTestMessage.trim(),
          provider: 'whapi',
          whapiToken: settings.whapiToken,
          whapiApiUrl: settings.whapiApiUrl || 'https://gate.whapi.cloud',
          whapiChannelId: settings.whapiChannelId,
          whapiProxyUrl: settings.whapiProxyUrl,
          tenantId: getActiveTenantId()
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTestWhatsAppStatus({
          success: true,
          message: `Message dispatched via Whapi.cloud to ${phoneToUse}! Check WhatsApp on recipient device.`
        });
      } else {
        setTestWhatsAppStatus({
          success: false,
          message: data.error || 'Whapi message dispatch failed.'
        });
      }
    } catch (err: any) {
      setTestWhatsAppStatus({ success: false, message: err.message || 'An unexpected error occurred.' });
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
        setTestWhatsAppStatus({ success: false, message: data.error || 'WABA message dispatch failed.' });
      }
    } catch (error: any) {
      setTestWhatsAppStatus({ success: false, message: error.message || 'An unexpected error occurred.' });
    } finally {
      setTestWhatsAppLoading(false);
    }
  };

  const handleCheckWhatsAppStatus = async () => {
    setWaSessionLoading(true);
    setWaActionMessage(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';
      const res = await fetch('/api/whatsapp-status', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setWaSessionStatus(data.data);
        if (data.data?.status === 'qr_ready') {
          const qrRes = await fetch('/api/whatsapp-qr', {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          const qrData = await qrRes.json();
          if (qrData.success && qrData.data?.qrCode) {
            setWaQrCode(qrData.data.qrCode);
          }
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
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setWaActionMessage("Session requested. Refreshing status...");
        setTimeout(() => handleCheckWhatsAppStatus(), 1500);
      } else {
        setWaActionMessage(`Failed to start: ${data.error}`);
      }
    } catch (err: any) {
      setWaActionMessage(`Error: ${err.message}`);
    } finally {
      setWaSessionLoading(false);
    }
  };

  // 3. Gemini Connection Checker
  const handleCheckGeminiConnection = async () => {
    const keyToTest = settings?.geminiApiKey?.trim();
    if (!keyToTest) {
      setTestGeminiResult({
        success: false,
        error: "Please enter your Google Gemini API Key in the field above before running the connection check."
      });
      return;
    }
    setTestGeminiLoading(true);
    setTestGeminiResult(null);
    try {
      const res = await fetch('/api/gemini/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: keyToTest,
          tenantId: getActiveTenantId() || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestGeminiResult({
          success: true,
          message: data.message || "Successfully connected to Google Gemini API!",
          model: data.model || "gemini-2.5-flash",
          latencyMs: data.latencyMs,
          sampleResponse: data.sampleResponse || "CONNECTED"
        });
      } else {
        setTestGeminiResult({
          success: false,
          error: data.error || "Connection failed. Please verify that your Gemini API key is valid and has active quotas in Google AI Studio."
        });
      }
    } catch (err: any) {
      setTestGeminiResult({
        success: false,
        error: err.message || "Network error while connecting to Gemini test endpoint."
      });
    } finally {
      setTestGeminiLoading(false);
    }
  };

  // Template change helpers
  const handleEmailTemplateChange = (key: EmailTemplateKey, field: 'subject' | 'body' | 'enabled', val: any) => {
    if (!settings) return;
    const current = settings.templates?.[key] || {
      subject: EMAIL_TEMPLATE_DEFS.find(d => d.key === key)?.defaultSubject || '',
      body: EMAIL_TEMPLATE_DEFS.find(d => d.key === key)?.defaultBody || '',
      enabled: true
    };
    setSettings({
      ...settings,
      templates: {
        ...settings.templates,
        [key]: {
          ...current,
          [field]: val
        }
      }
    });
  };

  const insertMergeTagIntoBody = (tag: string) => {
    if (!settings) return;
    const current = settings.templates?.[selectedEmailTpl] || {
      subject: EMAIL_TEMPLATE_DEFS.find(d => d.key === selectedEmailTpl)?.defaultSubject || '',
      body: EMAIL_TEMPLATE_DEFS.find(d => d.key === selectedEmailTpl)?.defaultBody || '',
      enabled: true
    };
    handleEmailTemplateChange(selectedEmailTpl, 'body', current.body + ` ${tag} `);
  };

  const insertMergeTagIntoSubject = (tag: string) => {
    if (!settings) return;
    const current = settings.templates?.[selectedEmailTpl] || {
      subject: EMAIL_TEMPLATE_DEFS.find(d => d.key === selectedEmailTpl)?.defaultSubject || '',
      body: EMAIL_TEMPLATE_DEFS.find(d => d.key === selectedEmailTpl)?.defaultBody || '',
      enabled: true
    };
    handleEmailTemplateChange(selectedEmailTpl, 'subject', current.subject + ` ${tag}`);
  };

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

  // Preview renderer with mock data
  const renderMockEmail = (text: string) => {
    if (!previewWithData) return text;
    return text
      .replace(/{{customerName}}/g, 'Sarah Jenkins')
      .replace(/{{tourTitle}}/g, 'Mount Batur Sunrise Trek & Hot Springs')
      .replace(/{{bookingId}}/g, 'TRIP-882194')
      .replace(/{{date}}/g, 'Tomorrow, 04:30 AM')
      .replace(/{{time}}/g, '04:30 AM')
      .replace(/{{guests}}/g, '2 Adults')
      .replace(/{{totalAmount}}/g, '$130.00 USD')
      .replace(/{{paymentMethod}}/g, 'Stripe Card (Visa •••• 4242)')
      .replace(/{{pickupAddress}}/g, 'The Kayon Jungle Resort, Ubud (Room 204)')
      .replace(/{{paymentInstructions}}/g, 'Bank Mandiri Acc: 145-00-192837-1 (A/N Bali Adventours)')
      .replace(/{{supportPhone}}/g, '+62 812-3456-7890')
      .replace(/{{whatsappLink}}/g, 'https://wa.me/6281234567890')
      .replace(/{{guideName}}/g, 'Wayan Suparta')
      .replace(/{{guideWhatsapp}}/g, '+62 813-9876-5432');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold uppercase tracking-wider">Loading Communication Hub...</span>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Header & Save Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span>Communication Settings</span>
          </h2>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">
            Manage your customer transactional communications, notifications, AI intelligence, and messaging automations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving}
          className="px-6 py-3 bg-primary hover:bg-orange-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>

      {saveStatus && (
        <div className={cn(
          "p-4 rounded-xl border flex items-center gap-3 text-xs font-bold animate-in fade-in duration-200",
          saveStatus.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        )}>
          {saveStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* 3 Independent Tabs Navigation Bar */}
      <div className="bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Tab 1: Email Setting */}
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={cn(
              "flex items-center justify-center sm:justify-start gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-xs cursor-pointer",
              activeTab === 'email'
                ? "bg-white text-gray-900 shadow-sm border border-gray-200/90 ring-2 ring-primary/20 font-black"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60 border border-transparent"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              activeTab === 'email' ? "bg-primary text-white" : "bg-gray-200/80 text-gray-600"
            )}>
              <Mail className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block leading-tight">Email Setting & Templates</span>
              <span className="text-[10px] text-gray-400 font-medium block">Providers, Testing & Editor</span>
            </div>
          </button>

          {/* Tab 2: WhatsApp Automation */}
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={cn(
              "flex items-center justify-center sm:justify-start gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-xs cursor-pointer",
              activeTab === 'whatsapp'
                ? "bg-white text-gray-900 shadow-sm border border-gray-200/90 ring-2 ring-emerald-500/20 font-black"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60 border border-transparent"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              activeTab === 'whatsapp' ? "bg-[#075E54] text-white" : "bg-gray-200/80 text-gray-600"
            )}>
              <Phone className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block leading-tight">WhatsApp Automation</span>
              <span className="text-[10px] text-gray-400 font-medium block">Whapi, WABA & OpenWA</span>
            </div>
          </button>

          {/* Tab 3: Gemini API Key + Connection Checker */}
          <button
            type="button"
            onClick={() => setActiveTab('gemini')}
            className={cn(
              "flex items-center justify-center sm:justify-start gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-xs cursor-pointer",
              activeTab === 'gemini'
                ? "bg-white text-gray-900 shadow-sm border border-gray-200/90 ring-2 ring-indigo-500/20 font-black"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60 border border-transparent"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              activeTab === 'gemini' ? "bg-indigo-600 text-white" : "bg-gray-200/80 text-gray-600"
            )}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block leading-tight">Gemini AI & Intelligence</span>
              <span className="text-[10px] text-gray-400 font-medium block">API Key & Connection Checker</span>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EMAIL SETTING, PROVIDER, TESTING & TEMPLATE EDITOR */}
      {/* ========================================================================= */}
      {activeTab === 'email' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* 1.1 Email Connection Tester Card */}
          <div className="bg-gradient-to-br from-primary to-orange-600 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                      Live Diagnostic
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black tracking-tight">Email Connection Tester</h3>
                  <p className="text-xs text-orange-100 max-w-xl">
                    Dispatch an instant test email through your active provider ({settings.emailProvider.toUpperCase()}) without creating dummy bookings.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testEmailLoading || settings.emailProvider === 'none'}
                  className="bg-white hover:bg-orange-50 active:scale-95 text-primary px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {testEmailLoading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Send className="w-4 h-4 text-primary" />}
                  <span>{testEmailLoading ? "Sending..." : "Send Test Email"}</span>
                </button>
              </div>

              <div className="max-w-md pt-2">
                <label className="text-[10px] font-black uppercase text-orange-200 tracking-wider block mb-1.5">
                  Send Test To (Email Address)
                </label>
                <input
                  type="email"
                  value={testEmailCustomTo}
                  onChange={e => setTestEmailCustomTo(e.target.value)}
                  placeholder={settings.adminNotificationEmail || 'baliadventours@gmail.com'}
                  className="w-full bg-white/15 border border-white/25 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:bg-white/25 font-bold"
                />
                <p className="text-[10px] text-orange-100/80 mt-1">Leave blank to dispatch directly to your Admin Notification Email.</p>
              </div>

              {testEmailStatus && (
                <div className={cn(
                  "p-4 rounded-xl border mt-4 text-xs font-bold flex items-start gap-3",
                  testEmailStatus.success ? "bg-white/15 border-white/30 text-white" : "bg-red-900/40 border-red-400/50 text-white"
                )}>
                  {testEmailStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />}
                  <div className="space-y-1">
                    <p className="font-black text-sm">{testEmailStatus.success ? "Test Dispatched Successfully!" : "Connection / Dispatch Error"}</p>
                    <p className="text-white/90 leading-relaxed font-normal">{testEmailStatus.message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 1.2 Provider Configuration Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-primary shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Email Provider & Sender Identity</h3>
                <p className="text-xs text-gray-500">Select which SMTP or transactional API provider delivers your guest confirmations and vouchers.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Email Gateway Provider</label>
                <select
                  value={settings.emailProvider}
                  onChange={e => setSettings({ ...settings, emailProvider: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white cursor-pointer"
                >
                  <option value="none">Disabled (No Emails Sent)</option>
                  <option value="resend">Resend (Recommended — 3,000 Free/Mo)</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="brevo">Brevo (Sendinblue)</option>
                  <option value="gmail">Gmail SMTP (Direct App Password)</option>
                  <option value="mailjet">Mailjet</option>
                  <option value="enginemailer">Enginemailer</option>
                </select>
              </div>

              {/* Sender Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Sender Display Name</label>
                <input
                  type="text"
                  value={settings.senderName}
                  onChange={e => setSettings({ ...settings, senderName: e.target.value })}
                  placeholder="e.g. Bali Adventours"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              {/* Sender Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Sender Email Address</label>
                <input
                  type="email"
                  value={settings.senderEmail}
                  onChange={e => setSettings({ ...settings, senderEmail: e.target.value })}
                  placeholder="e.g. booking@yourdomain.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              {/* Admin Notification Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Admin Notification Email</label>
                <input
                  type="email"
                  value={settings.adminNotificationEmail}
                  onChange={e => setSettings({ ...settings, adminNotificationEmail: e.target.value })}
                  placeholder="e.g. admin@yourdomain.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                />
                <p className="text-[10px] text-gray-400">All new bookings, inquiry alerts, and waiver forms trigger notifications to this address.</p>
              </div>

              {/* Provider-Specific Keys */}
              {settings.emailProvider === 'gmail' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Gmail User Address</label>
                    <input
                      type="email"
                      value={settings.gmailUser || ''}
                      onChange={e => setSettings({ ...settings, gmailUser: e.target.value })}
                      placeholder="baliadventours@gmail.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Gmail 16-Char App Password</label>
                    <input
                      type="password"
                      value={settings.gmailAppPassword || ''}
                      onChange={e => setSettings({ ...settings, gmailAppPassword: e.target.value })}
                      placeholder="abcd efgh ijkl mnop"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                    />
                  </div>
                </>
              )}

              {['resend', 'sendgrid', 'brevo', 'mailjet', 'enginemailer'].includes(settings.emailProvider) && (
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{settings.emailProvider.toUpperCase()} API Key</label>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Securely Encrypted</span>
                  </div>
                  <input
                    type="password"
                    value={settings.emailApiKey || ''}
                    onChange={e => setSettings({ ...settings, emailApiKey: e.target.value })}
                    placeholder={`Enter your ${settings.emailProvider.toUpperCase()} API Key`}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 1.3 Email Template Editor */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Email Template Editor</h3>
                  <p className="text-xs text-gray-500">Customize the subject and message copy dispatched for every customer milestone.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewWithData(!previewWithData)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>{previewWithData ? "Showing Sample Data" : "Showing Raw Tags"}</span>
                </button>
              </div>
            </div>

            {/* Template Selector Pills */}
            <div className="flex flex-wrap gap-2">
              {EMAIL_TEMPLATE_DEFS.map(def => {
                const isSelected = selectedEmailTpl === def.key;
                const isTplEnabled = settings.templates?.[def.key]?.enabled !== false;
                return (
                  <button
                    key={def.key}
                    type="button"
                    onClick={() => setSelectedEmailTpl(def.key)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border",
                      isSelected
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", isTplEnabled ? "bg-emerald-400" : "bg-gray-300")} />
                    <span>{def.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Merge Tag Chips */}
            <div className="p-3 bg-orange-50/70 border border-orange-100 rounded-xl space-y-2">
              <span className="text-[10px] font-black uppercase text-orange-800 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                Click to Insert Dynamic Merge Tags:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MERGE_TAGS.map(item => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => insertMergeTagIntoBody(item.tag)}
                    title={item.description}
                    className="px-2 py-1 bg-white hover:bg-orange-100 text-gray-800 hover:text-primary rounded-lg text-[10px] font-mono font-bold border border-orange-200 transition-all cursor-pointer shadow-2xs"
                  >
                    {item.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Workspace */}
            {(() => {
              const currentTpl = settings.templates?.[selectedEmailTpl] || {
                subject: EMAIL_TEMPLATE_DEFS.find(d => d.key === selectedEmailTpl)?.defaultSubject || '',
                body: EMAIL_TEMPLATE_DEFS.find(d => d.key === selectedEmailTpl)?.defaultBody || '',
                enabled: true
              };

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  {/* Left: Inputs */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700">Subject Line</label>
                      <button
                        type="button"
                        onClick={() => insertMergeTagIntoSubject('{{bookingId}}')}
                        className="text-[10px] text-primary font-bold hover:underline"
                      >
                        + Add #{{bookingId}} to Subject
                      </button>
                    </div>
                    <input
                      type="text"
                      value={currentTpl.subject}
                      onChange={e => handleEmailTemplateChange(selectedEmailTpl, 'subject', e.target.value)}
                      placeholder="Email Subject Line"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-primary focus:bg-white"
                    />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700">Email Message Body</label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600">
                          <input
                            type="checkbox"
                            checked={currentTpl.enabled}
                            onChange={e => handleEmailTemplateChange(selectedEmailTpl, 'enabled', e.target.checked)}
                            className="rounded text-primary focus:ring-primary h-4 w-4"
                          />
                          <span>Send this notification</span>
                        </label>
                      </div>
                      <textarea
                        rows={12}
                        value={currentTpl.body}
                        onChange={e => handleEmailTemplateChange(selectedEmailTpl, 'body', e.target.value)}
                        placeholder="Write your email body here..."
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans font-medium text-gray-900 focus:outline-none focus:border-primary focus:bg-white leading-relaxed resize-y"
                      />
                    </div>
                  </div>

                  {/* Right: Real-time Live Preview */}
                  <div className="space-y-2 flex flex-col">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700">Live Customer Preview</label>
                      <span className="text-[10px] text-gray-400 font-medium">As seen in Gmail/Outlook</span>
                    </div>

                    <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-inner overflow-hidden flex flex-col">
                      {/* Fake Email Client Bar */}
                      <div className="bg-gray-100/90 px-4 py-3 border-b border-gray-200 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-gray-700">From: {settings.senderName} &lt;{settings.senderEmail}&gt;</span>
                          <span className="text-gray-400">Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-xs font-bold text-gray-900">
                          Subject: {renderMockEmail(currentTpl.subject)}
                        </div>
                      </div>

                      {/* Fake Email Body */}
                      <div className="p-5 flex-1 bg-white text-xs text-gray-800 leading-relaxed font-sans whitespace-pre-wrap">
                        {renderMockEmail(currentTpl.body)}
                      </div>

                      <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between">
                        <span>Powered by {settings.senderName} transactional engine</span>
                        <span className="text-emerald-600 font-bold">100% Mobile Responsive</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WHATSAPP AUTOMATION */}
      {/* ========================================================================= */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Master Switch & Provider Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#075E54]/10 rounded-xl flex items-center justify-center text-[#075E54] shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">WhatsApp Automation Gateway</h3>
                  <p className="text-xs text-gray-500">Send instant booking confirmations, vouchers, and driver dispatches over WhatsApp.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.whatsappEnabled} 
                    onChange={e => setSettings({ ...settings, whatsappEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#075E54] rounded-full relative transition-all after:content-[''] after:absolute after:h-5 after:w-5 after:bg-white after:rounded-full after:top-0.5 after:left-0.5 peer-checked:after:left-5.5 after:transition-all" />
                  <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                    {settings.whatsappEnabled ? "Active" : "Disabled"}
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* WhatsApp Provider */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">WhatsApp Gateway Provider</label>
                <select
                  value={settings.whatsappProvider || 'whapi'}
                  onChange={e => setSettings({ ...settings, whatsappProvider: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#075E54] focus:bg-white cursor-pointer"
                >
                  <option value="whapi">Whapi.cloud (Cloud API Gateway — Quick QR/Token)</option>
                  <option value="waba">Meta WABA (Official WhatsApp Business Platform)</option>
                  <option value="openwa">OpenWA (Self-hosted REST Gateway / Docker)</option>
                </select>
              </div>

              {/* Admin Notification Phone */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Admin Notification Phone</label>
                <input
                  type="text"
                  value={settings.adminNotificationPhone || ''}
                  onChange={e => setSettings({ ...settings, adminNotificationPhone: e.target.value })}
                  placeholder="e.g. +628123456789"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#075E54] focus:bg-white"
                />
                <p className="text-[10px] text-gray-400">Receive immediate WhatsApp pings when customers place bookings.</p>
              </div>

              {/* Whapi Settings */}
              {settings.whatsappProvider === 'whapi' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700">Whapi API Token</label>
                      <button
                        type="button"
                        onClick={() => setShowWhapiToken(!showWhapiToken)}
                        className="text-[10px] text-[#075E54] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showWhapiToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showWhapiToken ? "Hide" : "Show"}
                      </button>
                    </div>
                    <input
                      type={showWhapiToken ? "text" : "password"}
                      value={settings.whapiToken || ''}
                      onChange={e => setSettings({ ...settings, whapiToken: e.target.value })}
                      placeholder="Permanent Whapi Bearer Token"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#075E54] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Whapi Gateway URL</label>
                    <input
                      type="text"
                      value={settings.whapiApiUrl || 'https://gate.whapi.cloud'}
                      onChange={e => setSettings({ ...settings, whapiApiUrl: e.target.value })}
                      placeholder="https://gate.whapi.cloud"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#075E54] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Whapi Channel ID (Optional)</label>
                    <input
                      type="text"
                      value={settings.whapiChannelId || ''}
                      onChange={e => setSettings({ ...settings, whapiChannelId: e.target.value })}
                      placeholder="e.g. THOROD-C4US9"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#075E54] focus:bg-white"
                    />
                  </div>
                </>
              )}

              {/* Meta WABA Settings */}
              {settings.whatsappProvider === 'waba' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">WABA Access Token</label>
                    <input
                      type="password"
                      value={settings.wabaAccessToken || ''}
                      onChange={e => setSettings({ ...settings, wabaAccessToken: e.target.value })}
                      placeholder="EAAG..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#075E54] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">WABA Phone Number ID</label>
                    <input
                      type="text"
                      value={settings.wabaPhoneNumberId || ''}
                      onChange={e => setSettings({ ...settings, wabaPhoneNumberId: e.target.value })}
                      placeholder="e.g. 109283746501928"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#075E54] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Approved Template Name</label>
                    <input
                      type="text"
                      value={settings.wabaTemplateName || ''}
                      onChange={e => setSettings({ ...settings, wabaTemplateName: e.target.value })}
                      placeholder="booking_confirmation"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#075E54] focus:bg-white"
                    />
                  </div>
                </>
              )}

              {/* OpenWA Settings */}
              {settings.whatsappProvider === 'openwa' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">OpenWA Dashboard Base URL</label>
                    <input
                      type="text"
                      value={settings.openwaBaseUrl || ''}
                      onChange={e => setSettings({ ...settings, openwaBaseUrl: e.target.value })}
                      placeholder="https://openwa-dashboard.up.railway.app"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#075E54] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Session Name</label>
                    <input
                      type="text"
                      value={settings.openwaSessionId || 'baliadventours'}
                      onChange={e => setSettings({ ...settings, openwaSessionId: e.target.value })}
                      placeholder="baliadventours"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#075E54] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">OpenWA API Key</label>
                    <input
                      type="password"
                      value={settings.openwaApiKey || ''}
                      onChange={e => setSettings({ ...settings, openwaApiKey: e.target.value })}
                      placeholder="Secret API Key"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#075E54] focus:bg-white"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* WhatsApp Direct Dispatch & Connection Tester */}
          <div className="bg-[#075E54] rounded-2xl p-6 md:p-8 text-white shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                    WhatsApp Gateway Diagnostic
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                </div>
                <h3 className="text-xl md:text-2xl font-black tracking-tight">WhatsApp Connection Tester</h3>
                <p className="text-xs text-emerald-100 max-w-xl">
                  Verify API handshake and dispatch a live test notification to your target WhatsApp number.
                </p>
              </div>

              {settings.whatsappProvider === 'whapi' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCheckWhapiHealth}
                    disabled={whapiHealthLoading || !settings.whapiToken}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {whapiHealthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                    <span>Check Channel Health</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWhapiPlayground}
                    disabled={testWhatsAppLoading || !settings.whapiToken}
                    className="bg-white text-[#075E54] hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {testWhatsAppLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Dispatch Whapi Test</span>
                  </button>
                </div>
              )}

              {settings.whatsappProvider === 'waba' && (
                <button
                  type="button"
                  onClick={handleSendWabaPlayground}
                  disabled={testWhatsAppLoading || !settings.wabaAccessToken}
                  className="bg-white text-[#075E54] hover:bg-emerald-50 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {testWhatsAppLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Dispatch WABA Test</span>
                </button>
              )}

              {settings.whatsappProvider === 'openwa' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCheckWhatsAppStatus}
                    disabled={waSessionLoading}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {waSessionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>Check Status</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStartWhatsAppSession}
                    disabled={waSessionLoading}
                    className="bg-emerald-400 hover:bg-emerald-300 text-gray-900 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Session</span>
                  </button>
                </div>
              )}
            </div>

            {/* Test Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-[10px] font-black uppercase text-emerald-200 tracking-wider block mb-1">
                  Recipient WhatsApp Number
                </label>
                <input
                  type="text"
                  value={whapiTestPhone}
                  onChange={e => {
                    setWhapiTestPhone(e.target.value);
                    setWabaTestPhone(e.target.value);
                  }}
                  placeholder={settings.adminNotificationPhone || '+628123456789'}
                  className="w-full bg-white/15 border border-white/25 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:bg-white/25 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-emerald-200 tracking-wider block mb-1">
                  Test Message Payload
                </label>
                <input
                  type="text"
                  value={whapiTestMessage}
                  onChange={e => {
                    setWhapiTestMessage(e.target.value);
                    setWabaTestBody(e.target.value);
                  }}
                  className="w-full bg-white/15 border border-white/25 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:bg-white/25"
                />
              </div>
            </div>

            {/* Result Banner */}
            {testWhatsAppStatus && (
              <div className={cn(
                "p-4 rounded-xl border text-xs font-bold flex items-start gap-3",
                testWhatsAppStatus.success ? "bg-white/15 border-white/30 text-white" : "bg-red-900/40 border-red-400/50 text-white"
              )}>
                {testWhatsAppStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />}
                <div className="space-y-0.5">
                  <p className="font-black">{testWhatsAppStatus.success ? "WhatsApp Gateway Online!" : "Delivery Error"}</p>
                  <p className="text-white/90 font-normal leading-relaxed">{testWhatsAppStatus.message}</p>
                </div>
              </div>
            )}

            {/* OpenWA QR Code if available */}
            {waQrCode && (
              <div className="bg-white text-gray-900 p-6 rounded-2xl max-w-sm mx-auto text-center space-y-3 shadow-xl">
                <span className="text-xs font-black text-[#075E54] uppercase tracking-wider block">Scan with WhatsApp to Pair</span>
                <img src={waQrCode} alt="WhatsApp QR Code" className="w-48 h-48 mx-auto rounded-lg border" />
                <p className="text-[11px] text-gray-500 font-medium">Open WhatsApp on your phone &gt; Linked Devices &gt; Scan Code.</p>
                <button
                  type="button"
                  onClick={handleCheckWhatsAppStatus}
                  className="w-full py-2.5 bg-[#075E54] text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Verify Paired Status
                </button>
              </div>
            )}
          </div>

          {/* WhatsApp Automation Templates */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-[#075E54] shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">WhatsApp Automation Templates</h3>
                <p className="text-xs text-gray-500">Configure automated text messages triggered when bookings are placed, updated, or dispatched.</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Template 1: Booking Confirmation */}
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Booking Confirmation (To Guest)</h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600">
                    <input
                      type="checkbox"
                      checked={settings.whatsappTemplates.booking_confirmation.enabled}
                      onChange={e => handleWhatsAppTemplateChange('booking_confirmation', 'enabled', e.target.checked)}
                      className="rounded text-[#075E54] focus:ring-[#075E54] h-4 w-4"
                    />
                    <span>Active</span>
                  </label>
                </div>
                <textarea
                  rows={3}
                  value={settings.whatsappTemplates.booking_confirmation.message}
                  onChange={e => handleWhatsAppTemplateChange('booking_confirmation', 'message', e.target.value)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-sans text-gray-900 focus:outline-none focus:border-[#075E54]"
                />
              </div>

              {/* Template 2: Driver Assigned */}
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Driver / Guide Assigned (To Guest)</h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600">
                    <input
                      type="checkbox"
                      checked={settings.whatsappTemplates.guide_assigned?.enabled ?? true}
                      onChange={e => handleWhatsAppTemplateChange('guide_assigned', 'enabled', e.target.checked)}
                      className="rounded text-[#075E54] focus:ring-[#075E54] h-4 w-4"
                    />
                    <span>Active</span>
                  </label>
                </div>
                <textarea
                  rows={3}
                  value={settings.whatsappTemplates.guide_assigned?.message || ''}
                  onChange={e => handleWhatsAppTemplateChange('guide_assigned', 'message', e.target.value)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-sans text-gray-900 focus:outline-none focus:border-[#075E54]"
                />
              </div>

              {/* Template 3: Admin Alert */}
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Admin New Booking Alert (To Admin Phone)</h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600">
                    <input
                      type="checkbox"
                      checked={settings.whatsappTemplates.admin_notification.enabled}
                      onChange={e => handleWhatsAppTemplateChange('admin_notification', 'enabled', e.target.checked)}
                      className="rounded text-[#075E54] focus:ring-[#075E54] h-4 w-4"
                    />
                    <span>Active</span>
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={settings.whatsappTemplates.admin_notification.message}
                  onChange={e => handleWhatsAppTemplateChange('admin_notification', 'message', e.target.value)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-sans text-gray-900 focus:outline-none focus:border-[#075E54]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GEMINI API KEY + CONNECTION CHECKER */}
      {/* ========================================================================= */}
      {activeTab === 'gemini' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Gemini API Key Configuration Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Google Gemini AI Intelligence</h3>
                <p className="text-xs text-gray-500">Configure your official Gemini API key from Google AI Studio to unlock AI features.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: API Key Input & Controls */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Gemini API Key</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">Google GenAI SDK</span>
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="text-[10px] text-gray-500 hover:text-gray-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showGeminiKey ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <input
                    type={showGeminiKey ? "text" : "password"}
                    value={settings.geminiApiKey || ''}
                    onChange={e => setSettings({ ...settings, geminiApiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                    This per-tenant key powers the 1-Click AI Tour Builder, automated SEO blog generator, personalized itinerary planner, and AI travel concierge.
                  </p>
                </div>

                {/* Live Connection Checker Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCheckGeminiConnection}
                    disabled={testGeminiLoading || !settings.geminiApiKey}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    {testGeminiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                    <span>{testGeminiLoading ? "Checking Connection..." : "Test Gemini Connection"}</span>
                  </button>
                </div>

                {/* Connection Checker Result Display */}
                {testGeminiResult && (
                  <div className={cn(
                    "p-4 rounded-xl border text-xs font-bold space-y-2 animate-in fade-in duration-200",
                    testGeminiResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-red-50 border-red-200 text-red-900"
                  )}>
                    <div className="flex items-center gap-2">
                      {testGeminiResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                      )}
                      <span className="font-black text-sm">
                        {testGeminiResult.success ? "Gemini Connection Verified!" : "Connection Failed"}
                      </span>
                    </div>

                    {testGeminiResult.success ? (
                      <div className="space-y-1 text-emerald-800 text-[11px] font-medium leading-relaxed pl-7">
                        <p>{testGeminiResult.message}</p>
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-mono">
                          <span className="bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
                            Model: {testGeminiResult.model}
                          </span>
                          {testGeminiResult.latencyMs && (
                            <span className="bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
                              Latency: {testGeminiResult.latencyMs}ms
                            </span>
                          )}
                          <span className="bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
                            Ping Reply: &quot;{testGeminiResult.sampleResponse}&quot;
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-red-700 text-[11px] font-normal leading-relaxed pl-7">
                        {testGeminiResult.error}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: How to get Free Key Info Card */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-indigo-900 font-black text-xs uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-indigo-600" />
                  <span>How to Get a 100% Free Gemini API Key</span>
                </div>

                <ol className="text-xs text-indigo-950/80 space-y-2.5 list-decimal list-inside font-medium leading-relaxed">
                  <li>Visit <strong className="text-indigo-900">Google AI Studio</strong> using your Google account.</li>
                  <li>Click <strong className="text-indigo-900">&quot;Get API key&quot;</strong> in the navigation header.</li>
                  <li>Create a new API key in an existing or new Google Cloud project.</li>
                  <li>Copy and paste the key here, then click <strong className="text-indigo-900">&quot;Test Gemini Connection&quot;</strong>.</li>
                </ol>

                <div className="pt-2">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <span>Open Google AI Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="pt-3 border-t border-indigo-100 text-[11px] text-indigo-800/80 leading-relaxed">
                  <p><strong>Note:</strong> Google AI Studio provides a free tier with high rate limits that is more than sufficient for full storefront operations and daily tour drafting.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Auxiliary Media: ImgBB Image Hosting Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Image Hosting (ImgBB Multi-Tenant CDN)</h3>
                <p className="text-xs text-gray-500">Secure image CDN for automatic in-browser WebP compression and tour cover hosting.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">ImgBB API Key</label>
                  <a
                    href="https://api.imgbb.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-purple-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Get Free Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={settings.imgbbApiKey || ''}
                  onChange={e => setSettings({ ...settings, imgbbApiKey: e.target.value })}
                  placeholder="Enter your ImgBB API Key"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  Images uploaded for tours, blog articles, and storefront badges are converted to WebP in your browser and saved to your tenant ImgBB storage.
                </p>
              </div>

              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 text-xs text-purple-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Automatic CDN & WebP Compression
                </p>
                <p className="text-purple-950/80 leading-relaxed font-normal">
                  You can register a free account at <code>api.imgbb.com</code> to obtain your private key. When empty, standard fallback uploads will be utilized.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationManager;
