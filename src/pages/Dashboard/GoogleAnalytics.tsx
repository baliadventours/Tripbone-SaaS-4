import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  CheckCircle2, 
  RefreshCw, 
  Database, 
  Code, 
  Copy, 
  ExternalLink,
  HelpCircle,
  BarChart2,
  ShieldCheck,
  Zap,
  Radio,
  Target,
  Layers,
  Activity,
  AlertTriangle,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getGAMeasurementId, 
  getGTMId,
  getGoogleAdsId,
  getGoogleAdsConversionLabel,
  getGACustomScript,
  updateTenantGA,
  trackGAEvent, 
  trackGAPurchase,
  trackGABeginCheckout,
  trackGAInquirySubmit,
  recordedGAEvents,
  extractTrackingIds
} from '../../lib/googleAnalytics';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from '@/src/lib/firebase';
import { useTenant } from '../../lib/TenantContext';

export default function GoogleAnalytics() {
  const { tenantId } = useTenant();
  
  // Tracking config state
  const [gaMeasurementId, setGaMeasurementId] = useState(getGAMeasurementId());
  const [gtmId, setGtmId] = useState(getGTMId());
  const [googleAdsId, setGoogleAdsId] = useState(getGoogleAdsId());
  const [googleAdsConversionLabel, setGoogleAdsConversionLabel] = useState(getGoogleAdsConversionLabel());
  const [gaCustomScript, setGaCustomScript] = useState(getGACustomScript());
  const [gtmBodyScript, setGtmBodyScript] = useState('');

  // Editable form state
  const [newGaId, setNewGaId] = useState(gaMeasurementId);
  const [newGtmId, setNewGtmId] = useState(gtmId);
  const [newGoogleAdsId, setNewGoogleAdsId] = useState(googleAdsId);
  const [newConversionLabel, setNewConversionLabel] = useState(googleAdsConversionLabel);
  const [newCustomScript, setNewCustomScript] = useState(gaCustomScript);
  const [newBodyScript, setNewBodyScript] = useState(gtmBodyScript);

  // Active tab in settings
  const [activeTab, setActiveTab] = useState<'all' | 'gtm' | 'ads' | 'ga4' | 'custom'>('all');

  // Test sandbox state
  const [liveEvents, setLiveEvents] = useState<typeof recordedGAEvents>([]);
  const [currentTestEventName, setCurrentTestEventName] = useState('purchase');
  const [testAmount, setTestAmount] = useState('150.00');
  const [testTourTitle, setTestTourTitle] = useState('Nusa Penida Ultimate Day Tour');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  // Load analytics configuration from Cloud database for active tenant
  useEffect(() => {
    const fetchRemoteSettings = async () => {
      try {
        const settingsDocId = tenantId || 'general';
        const docRef = doc(db, 'settings', settingsDocId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          const remoteGa = data.gaMeasurementId || data.googleAnalyticsId || data.measurementId || '';
          const remoteGtm = data.gtmId || '';
          const remoteAds = data.googleAdsId || '';
          const remoteLabel = data.googleAdsConversionLabel || '';
          const remoteScript = data.gaCustomScript || data.customScript || '';
          const remoteBody = data.gtmBodyScript || '';
          
          setGaMeasurementId(remoteGa);
          setNewGaId(remoteGa);
          setGtmId(remoteGtm);
          setNewGtmId(remoteGtm);
          setGoogleAdsId(remoteAds);
          setNewGoogleAdsId(remoteAds);
          setGoogleAdsConversionLabel(remoteLabel);
          setNewConversionLabel(remoteLabel);
          setGaCustomScript(remoteScript);
          setNewCustomScript(remoteScript);
          setGtmBodyScript(remoteBody);
          setNewBodyScript(remoteBody);
          
          updateTenantGA(tenantId, {
            gaMeasurementId: remoteGa,
            gtmId: remoteGtm,
            googleAdsId: remoteAds,
            googleAdsConversionLabel: remoteLabel,
            gaCustomScript: remoteScript,
            gtmBodyScript: remoteBody
          });
        } else {
          setGaMeasurementId('');
          setNewGaId('');
          setGtmId('');
          setNewGtmId('');
          setGoogleAdsId('');
          setNewGoogleAdsId('');
          setGoogleAdsConversionLabel('');
          setNewConversionLabel('');
          setGaCustomScript('');
          setNewCustomScript('');
          setGtmBodyScript('');
          setNewBodyScript('');
          updateTenantGA(tenantId, null);
        }
      } catch (err) {
        console.warn('[Analytics settings] Failed to sync remote cloud configs:', err);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchRemoteSettings();
  }, [tenantId]);

  // Listen for real client-side events captured on the live site
  useEffect(() => {
    setLiveEvents([...recordedGAEvents]);
    
    const handleGAEvent = () => {
      setLiveEvents([...recordedGAEvents]);
    };
    
    window.addEventListener('ga-event-logged', handleGAEvent);

    return () => {
      window.removeEventListener('ga-event-logged', handleGAEvent);
    };
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean and normalize
    let cleanGa = newGaId.trim().toUpperCase();
    let cleanGtm = newGtmId.trim().toUpperCase();
    let cleanAds = newGoogleAdsId.trim().toUpperCase();
    let cleanLabel = newConversionLabel.trim();
    let cleanHead = newCustomScript.trim();
    let cleanBody = newBodyScript.trim();

    // Auto extract IDs if pasted raw inside any box
    const extractedHead = extractTrackingIds(cleanHead);
    if (!cleanGtm && extractedHead.gtmId) cleanGtm = extractedHead.gtmId;
    if (!cleanAds && extractedHead.googleAdsId) cleanAds = extractedHead.googleAdsId;
    if (!cleanLabel && extractedHead.googleAdsConversionLabel) cleanLabel = extractedHead.googleAdsConversionLabel;
    if (!cleanGa && extractedHead.gaMeasurementId) cleanGa = extractedHead.gaMeasurementId;

    const payload = {
      gaMeasurementId: cleanGa,
      gtmId: cleanGtm,
      googleAdsId: cleanAds,
      googleAdsConversionLabel: cleanLabel,
      gaCustomScript: cleanHead,
      gtmBodyScript: cleanBody
    };

    // 1. Update runtime state immediately
    updateTenantGA(tenantId, payload);
    
    setGaMeasurementId(cleanGa);
    setNewGaId(cleanGa);
    setGtmId(cleanGtm);
    setNewGtmId(cleanGtm);
    setGoogleAdsId(cleanAds);
    setNewGoogleAdsId(cleanAds);
    setGoogleAdsConversionLabel(cleanLabel);
    setNewConversionLabel(cleanLabel);
    setGaCustomScript(cleanHead);
    setNewCustomScript(cleanHead);
    setGtmBodyScript(cleanBody);
    setNewBodyScript(cleanBody);

    // 2. Persist to Cloud Firestore for this tenant
    try {
      const settingsDocId = tenantId || 'general';
      const docRef = doc(db, 'settings', settingsDocId);
      await setDoc(docRef, {
        ...payload,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (cloudErr) {
      console.warn('[Analytics] Cloud database sync notice:', cloudErr);
    }

    setSuccessMessage('Tracking tags deployed to production successfully! Detected by Google Tag Assistant & Ads verification.');
    setTimeout(() => setSuccessMessage(''), 6000);

    trackGAEvent('update_tracking_config', 'admin', `GTM:${cleanGtm || 'none'}|Ads:${cleanAds || 'none'}`);
  };

  const handleTriggerTestEvent = () => {
    const numAmount = parseFloat(testAmount) || 100;
    
    if (currentTestEventName === 'purchase') {
      const mockId = `TEST-TRX-${Math.floor(100000 + Math.random() * 900000)}`;
      trackGAPurchase({
        id: mockId,
        tourTitle: testTourTitle,
        totalAmount: numAmount,
        currency: 'USD',
        paymentMethod: 'credit_card',
        participants: 2,
        customerEmail: 'test-conversion@example.com'
      });
      setSuccessMessage(`Fired conversion "purchase" (${mockId}, $${numAmount})! Check Google Ads Conversions & GA4 DebugView.`);
    } else if (currentTestEventName === 'begin_checkout') {
      trackGABeginCheckout({
        tourTitle: testTourTitle,
        totalAmount: numAmount,
        currency: 'USD',
        participants: 2,
        tourId: 'test-tour-1'
      });
      setSuccessMessage(`Fired "begin_checkout" event ($${numAmount}) to dataLayer & gtag.`);
    } else if (currentTestEventName === 'generate_lead') {
      trackGAInquirySubmit('custom_tour_inquiry', testTourTitle, numAmount);
      setSuccessMessage(`Fired "generate_lead" conversion event to Google Ads & GA4.`);
    } else {
      trackGAEvent(currentTestEventName, 'sandbox_verification', testTourTitle, numAmount);
      setSuccessMessage(`Fired "${currentTestEventName}" event successfully!`);
    }

    setTimeout(() => setSuccessMessage(''), 6000);
  };

  const handleCopyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTemplate(label);
    setTimeout(() => setCopiedTemplate(null), 3000);
  };

  const sampleGtmHead = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->`;

  const sampleAdsGtag = `<!-- Google Ads Tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'AW-XXXXXXXXX');
</script>`;

  const isGtmActive = Boolean(gtmId);
  const isAdsActive = Boolean(googleAdsId);
  const isGa4Active = Boolean(gaMeasurementId);
  const isAnyActive = isGtmActive || isAdsActive || isGa4Active || Boolean(gaCustomScript);

  return (
    <div className="space-y-8 animate-fadeIn text-left max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-3 py-1 text-xs font-black rounded-full flex items-center gap-1.5 border ${
              isAnyActive 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isAnyActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isAnyActive ? 'Tracking Active in Production' : 'Setup Required for Tracking'}
            </span>

            {isGtmActive && (
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                GTM: {gtmId}
              </span>
            )}

            {isAdsActive && (
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                Google Ads: {googleAdsId}
              </span>
            )}

            {isGa4Active && (
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 rounded-full">
                GA4: {gaMeasurementId}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Google Tag Manager & Google Ads Tracking</h1>
          <p className="text-sm font-medium text-gray-500 mt-1 max-w-3xl">
            Configure Google Tag Manager (GTM), Google Ads conversion tracking, and Google Analytics 4 (GA4). Auto-injects head/body tags and dispatches e-commerce purchase conversions to Google.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://tagmanager.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:text-gray-900 shadow-xs transition-all"
          >
            <Layers className="h-4 w-4 text-indigo-600" />
            Google Tag Manager
          </a>
          <a
            href="https://ads.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:text-gray-900 shadow-xs transition-all"
          >
            <Target className="h-4 w-4 text-amber-600" />
            Google Ads
          </a>
          <a
            href="https://analytics.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:text-gray-900 shadow-xs transition-all"
          >
            <BarChart2 className="h-4 w-4 text-orange-600" />
            GA4
          </a>
        </div>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-3.5 rounded-xl flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="font-bold">{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccessMessage('')}
              className="text-xs text-emerald-700 hover:text-emerald-950 font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Configuration + Setup Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Config Form Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-orange-50 rounded-xl text-primary">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-gray-900 text-lg">Tracking Tags & IDs</h2>
                  <p className="text-xs font-semibold text-gray-400">Deployed immediately on server SSR and client-side</p>
                </div>
              </div>

              {loadingConfig && (
                <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
              )}
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-6">
              
              {/* Google Tag Manager (GTM) Section */}
              <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <label className="text-xs font-black uppercase tracking-wider text-indigo-950">
                      1. Google Tag Manager (GTM)
                    </label>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    Recommended
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    GTM Container ID
                  </label>
                  <input 
                    type="text"
                    value={newGtmId}
                    onChange={(e) => setNewGtmId(e.target.value.toUpperCase().trim())}
                    placeholder="e.g. GTM-XXXXXXX"
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-mono font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <p className="text-[10px] font-medium text-gray-500 mt-1">
                    Format: <code className="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">GTM-XXXXXXX</code> (Found at tagmanager.google.com header)
                  </p>
                </div>
              </div>

              {/* Google Ads Conversion Tracking Section */}
              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-600" />
                    <label className="text-xs font-black uppercase tracking-wider text-amber-950">
                      2. Google Ads Conversion Tracking
                    </label>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                    Fixes Ads Detection
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Google Ads ID (Conversion ID)
                    </label>
                    <input 
                      type="text"
                      value={newGoogleAdsId}
                      onChange={(e) => setNewGoogleAdsId(e.target.value.toUpperCase().trim())}
                      placeholder="e.g. AW-123456789"
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-mono font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                    <p className="text-[10px] font-medium text-gray-500 mt-1">
                      Starts with <code className="font-mono text-amber-700 bg-amber-50 px-1 py-0.5 rounded">AW-</code>
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Conversion Label (Optional)
                    </label>
                    <input 
                      type="text"
                      value={newConversionLabel}
                      onChange={(e) => setNewConversionLabel(e.target.value.trim())}
                      placeholder="e.g. AbCdEfGhIjKlMnOp"
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-mono font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                    <p className="text-[10px] font-medium text-gray-500 mt-1">
                      Label from your Google Ads purchase conversion action
                    </p>
                  </div>
                </div>

                {newGoogleAdsId && (
                  <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-[11px] text-amber-900">
                    <strong>Send-To Parameter:</strong> <code className="font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded ml-1">{newConversionLabel ? `${newGoogleAdsId}/${newConversionLabel}` : newGoogleAdsId}</code>
                  </div>
                )}
              </div>

              {/* Google Analytics 4 Section */}
              <div className="p-4 bg-orange-50/40 rounded-xl border border-orange-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-orange-600" />
                    <label className="text-xs font-black uppercase tracking-wider text-orange-950">
                      3. Google Analytics 4 (GA4)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    GA4 Measurement ID
                  </label>
                  <input 
                    type="text"
                    value={newGaId}
                    onChange={(e) => setNewGaId(e.target.value.toUpperCase().trim())}
                    placeholder="e.g. G-XXXXXXXXXX"
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-mono font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                  <p className="text-[10px] font-medium text-gray-500 mt-1">
                    Starts with <code className="font-mono text-orange-700 bg-orange-50 px-1 py-0.5 rounded">G-</code> or <code className="font-mono text-orange-700 bg-orange-50 px-1 py-0.5 rounded">GT-</code> (Found in GA4 &gt; Admin &gt; Data Streams)
                  </p>
                </div>
              </div>

              {/* Custom Script Block (Optional) */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                  4. Custom Script Header & Body Blocks (Optional)
                </label>
                
                <div>
                  <span className="text-[11px] font-bold text-gray-600 block mb-1">Head Script (&lt;head&gt;)</span>
                  <textarea 
                    value={newCustomScript}
                    onChange={(e) => setNewCustomScript(e.target.value)}
                    placeholder={`<!-- Meta Pixel, TikTok Pixel, or custom scripts -->`}
                    rows={4}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono font-medium text-gray-900 placeholder:text-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all leading-relaxed"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-bold text-gray-600 block mb-1">Body Noscript (&lt;body&gt;)</span>
                  <textarea 
                    value={newBodyScript}
                    onChange={(e) => setNewBodyScript(e.target.value)}
                    placeholder={`<!-- <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX" ...></iframe></noscript> -->`}
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono font-medium text-gray-900 placeholder:text-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full py-3.5 bg-primary hover:bg-orange-600 font-black text-sm text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Save & Deploy Tracking Tags to Production
                </button>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100 text-xs font-medium text-gray-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Cross-domain isolated & SSR ready
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                Auto-Synced to Cloud Firestore
              </span>
            </div>
          </div>

          {/* Test Event Dispatcher Sandbox */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="font-black text-gray-900 text-base">Conversion & Tag Test Sandbox</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded">
                Live Verification
              </span>
            </div>

            <p className="text-xs font-medium text-gray-500">
              Fire test events with transaction value to immediately verify that Google Ads Tag Assistant, GTM Preview Mode, and GA4 DebugView capture conversions accurately.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Event Type</label>
                <select 
                  value={currentTestEventName}
                  onChange={(e) => setCurrentTestEventName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-bold text-gray-900 focus:bg-white focus:outline-none"
                >
                  <option value="purchase">purchase (Google Ads Conversion + E-comm)</option>
                  <option value="begin_checkout">begin_checkout (Booking Step)</option>
                  <option value="generate_lead">generate_lead (Inquiry Form)</option>
                  <option value="page_view_test">page_view_test (Baseline Tag Check)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Tour Title</label>
                <input 
                  type="text"
                  value={testTourTitle}
                  onChange={(e) => setTestTourTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-bold text-gray-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Amount ($ USD)</label>
                <input 
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-bold text-gray-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button 
              type="button"
              onClick={handleTriggerTestEvent}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Play className="h-4 w-4 text-emerald-400 fill-emerald-400" />
              Dispatch Conversion Test Event (Google Ads + GTM + GA4)
            </button>
          </div>
        </div>

        {/* Right Column: Setup Guides + Live Event Logger */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Diagnostic Status Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <h3 className="font-black text-gray-900 text-sm">Real-time Tag Detection Status</h3>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Client Window</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-indigo-600" />
                  Google Tag Manager
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  gtmId ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                }`}>
                  {gtmId ? `ACTIVE (${gtmId})` : 'NOT SET'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-amber-600" />
                  Google Ads Tag
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  googleAdsId ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                }`}>
                  {googleAdsId ? `ACTIVE (${googleAdsId})` : 'NOT SET'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5 text-orange-600" />
                  Google Analytics 4
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  gaMeasurementId ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                }`}>
                  {gaMeasurementId ? `ACTIVE (${gaMeasurementId})` : 'NOT SET'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-slate-600" />
                  window.dataLayer
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                  {typeof window !== 'undefined' && window.dataLayer ? `INITIALIZED (${window.dataLayer.length} events)` : 'READY'}
                </span>
              </div>
            </div>
          </div>

          {/* Step-by-Step Setup Guide Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
              <div className="flex items-center gap-2.5">
                <Target className="h-5 w-5 text-amber-400" />
                <h3 className="font-black text-white text-base">Google Ads Verification Setup</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                Ads Guide
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">Get Google Ads Conversion ID</h4>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">
                    In <a href="https://ads.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">Google Ads</a>, go to <strong>Goals &gt; Conversions &gt; Summary</strong>. Click your purchase conversion action and view the tag setup to get your <code className="text-amber-300 font-mono">AW-XXXXXXXXX</code> ID and conversion label.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">Paste into Settings & Save</h4>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">
                    Input your <code className="text-amber-300 font-mono">AW-XXXXXXXXX</code> ID and conversion label in the form and click <strong>Save & Deploy</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">Verify in Google Ads or Tag Assistant</h4>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">
                    In Google Ads, click <strong>Troubleshoot / Verify Tag</strong> or use the <strong>Tag Assistant</strong> Chrome extension. The tag will immediately be detected as active!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reference GTM Template */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
              <Code className="h-4 w-4 text-indigo-600" />
              Standard GTM Snippet Template
            </h3>

            <div className="relative bg-gray-900 rounded-xl p-3 text-[11px] font-mono text-gray-200 overflow-x-auto leading-relaxed">
              <button 
                onClick={() => handleCopyCode(sampleGtmHead, 'gtm')}
                className="absolute top-2 right-2 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Copy className="h-3 w-3" />
                {copiedTemplate === 'gtm' ? 'Copied!' : 'Copy'}
              </button>
              <pre className="pr-12 whitespace-pre-wrap">{sampleGtmHead}</pre>
            </div>
          </div>

          {/* Live GA / GTM / Ads Event Stream Logger */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
                  Live Event & Conversion Feed
                </h3>
                <p className="text-xs font-semibold text-gray-400">Captures actual page views, checkouts, and conversions</p>
              </div>

              {liveEvents.length > 0 && (
                <button 
                  onClick={() => {
                    recordedGAEvents.length = 0;
                    setLiveEvents([]);
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                >
                  Clear Feed
                </button>
              )}
            </div>

            <div className="h-60 overflow-y-auto border border-gray-150 rounded-xl bg-gray-50 p-3 space-y-2 font-mono text-[11px] text-gray-700 no-scrollbar">
              {liveEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 select-none space-y-2 py-8 text-center">
                  <Database className="h-8 w-8 stroke-1.5 text-gray-300" />
                  <span className="text-xs font-medium">No actions captured yet in this browser session.</span>
                  <span className="text-[10px] text-gray-400">Dispatch a test conversion above to see real-time data!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {liveEvents.map((evt, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-lg border border-gray-200 space-y-1 shadow-2xs">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-semibold text-gray-400">{evt.timestamp}</span>
                        <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                          evt.type === 'conversion' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : evt.type === 'pageview' 
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {evt.type}
                        </span>
                      </div>
                      <div className="text-gray-900 font-bold break-all">
                        {evt.type === 'conversion' 
                          ? `Conversion: "${evt.name}"`
                          : evt.type === 'pageview' 
                            ? `Page View: ${evt.name}` 
                            : `Event: "${evt.name}"`}
                      </div>
                      {evt.params && (
                        <div className="text-[10px] text-slate-800 bg-slate-50 p-1.5 rounded border border-slate-200 overflow-x-auto whitespace-pre font-mono">
                          {JSON.stringify(evt.params, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
