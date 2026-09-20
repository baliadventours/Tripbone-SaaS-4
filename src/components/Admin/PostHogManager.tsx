import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  Zap, 
  ShieldCheck, 
  Eye, 
  Play, 
  Sparkles, 
  Copy, 
  Video, 
  Layers, 
  Settings, 
  Sliders, 
  Check, 
  AlertTriangle,
  Globe,
  Radio,
  RadioTower,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from '@/src/lib/firebase';
import { useTenant } from '../../lib/TenantContext';
import { 
  getPostHogConfig, 
  updateTenantPostHog, 
  isPostHogReady, 
  recordedPostHogEvents, 
  trackPostHogEvent,
  trackPostHogPageView,
  trackPostHogTourView,
  trackPostHogBeginCheckout,
  trackPostHogPurchase,
  RecordedPostHogEvent
} from '../../lib/posthog';

export default function PostHogManager() {
  const { tenantId } = useTenant();

  const [apiKey, setApiKey] = useState('');
  const [apiHost, setApiHost] = useState('https://us.i.posthog.com');
  const [enabled, setEnabled] = useState(true);
  const [autocapture, setAutocapture] = useState(true);
  const [sessionRecording, setSessionRecording] = useState(true);
  const [maskInputs, setMaskInputs] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Live event stream
  const [events, setEvents] = useState<RecordedPostHogEvent[]>([]);
  const [testEventType, setTestEventType] = useState<'pageview' | 'tour' | 'checkout' | 'purchase'>('pageview');

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docId = tenantId || 'general';
        const snap = await getDoc(doc(db, 'settings', docId));
        if (snap.exists()) {
          const data = snap.data();
          const key = data.posthogKey || (import.meta.env.VITE_POSTHOG_KEY as string) || '';
          const host = data.posthogHost || (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://us.i.posthog.com';
          setApiKey(key);
          setApiHost(host);
          setEnabled(typeof data.posthogEnabled === 'boolean' ? data.posthogEnabled : true);
          setAutocapture(typeof data.posthogAutocapture === 'boolean' ? data.posthogAutocapture : true);
          setSessionRecording(typeof data.posthogSessionRecording === 'boolean' ? data.posthogSessionRecording : true);
          setMaskInputs(typeof data.posthogMaskInputs === 'boolean' ? data.posthogMaskInputs : true);

          // Update active memory config
          updateTenantPostHog(tenantId, {
            apiKey: key,
            apiHost: host,
            enabled: data.posthogEnabled !== false,
            autocapture: data.posthogAutocapture !== false,
            disableSessionRecording: data.posthogSessionRecording === false,
            maskAllInputs: data.posthogMaskInputs !== false
          });
        } else {
          // Fallback to env
          const envKey = (import.meta.env.VITE_POSTHOG_KEY as string) || '';
          const envHost = (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://us.i.posthog.com';
          setApiKey(envKey);
          setApiHost(envHost);
        }
      } catch (err) {
        console.warn('PostHogManager: error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
    setEvents([...recordedPostHogEvents]);

    const handleLogged = () => {
      setEvents([...recordedPostHogEvents]);
    };

    window.addEventListener('posthog-event-logged', handleLogged);
    return () => {
      window.removeEventListener('posthog-event-logged', handleLogged);
    };
  }, [tenantId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const docId = tenantId || 'general';
      const docRef = doc(db, 'settings', docId);

      await setDoc(docRef, {
        posthogKey: apiKey.trim(),
        posthogHost: apiHost.trim(),
        posthogEnabled: enabled,
        posthogAutocapture: autocapture,
        posthogSessionRecording: sessionRecording,
        posthogMaskInputs: maskInputs,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Live reload SDK
      await updateTenantPostHog(tenantId, {
        apiKey: apiKey.trim(),
        apiHost: apiHost.trim(),
        enabled,
        autocapture,
        disableSessionRecording: !sessionRecording,
        maskAllInputs: maskInputs
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save PostHog configuration:', err);
      alert('Failed to save PostHog configuration. Please check your network connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const fireTestEvent = () => {
    if (testEventType === 'pageview') {
      trackPostHogPageView('/tours/nusa-penida-ultimate', {
        test_event: true,
        source: 'admin_debugger'
      });
    } else if (testEventType === 'tour') {
      trackPostHogTourView({
        id: 'tour_test_123',
        title: 'Nusa Penida Ultimate Day Tour',
        price: 850000,
        category: 'Island Adventure',
        location: 'Nusa Penida, Bali'
      });
    } else if (testEventType === 'checkout') {
      trackPostHogBeginCheckout({
        tourId: 'tour_test_123',
        tourTitle: 'Nusa Penida Ultimate Day Tour',
        totalPrice: 1700000,
        currency: 'IDR',
        paxCount: 2,
        step: 1
      });
    } else if (testEventType === 'purchase') {
      trackPostHogPurchase({
        bookingId: `BK-${Date.now().toString().slice(-6)}`,
        totalAmount: 1700000,
        currency: 'IDR',
        tourTitle: 'Nusa Penida Ultimate Day Tour',
        customerEmail: 'guest@example.com',
        paymentMethod: 'Stripe'
      });
    }
  };

  const isConfigured = !!apiKey.trim();
  const isHostEU = apiHost.includes('eu.i.posthog.com') || apiHost.includes('eu.posthog.com');
  const posthogDashboardUrl = isHostEU 
    ? 'https://eu.posthog.com' 
    : 'https://us.posthog.com';

  return (
    <div className="space-y-6">
      {/* Top Banner & Status Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#F54E00] to-[#FF9300] text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  PostHog Product Analytics & Session Replay
                </h2>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  isConfigured && enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isConfigured && !enabled
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    isConfigured && enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                  }`} />
                  {isConfigured && enabled ? 'Connected & Tracking' : isConfigured ? 'Tracking Paused' : 'Not Configured'}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed max-w-2xl">
                Capture every click, conversion bottleneck, and visitor drop-off point. Watch video-like session replays to understand exactly how travelers navigate your tours and checkout.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <a
              href={posthogDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
            >
              <span>Open PostHog</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-gray-100">
          <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-100/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Session Replay & Heatmaps</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                Watch high-fidelity video recordings of guest interactions on desktop and mobile.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Autocapture Events</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                Zero-code capture of button clicks, tour card taps, tab switching, and scroll depth.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Privacy & PII Safe</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                Automatic masking of passwords, credit cards, and sensitive guest contact inputs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings & Test Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Configuration Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-black text-gray-900">Credentials & Ingestion Ingress</h3>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">Auto-syncs per tenant</span>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Project API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800">
                  Project API Key <span className="text-red-500">*</span>
                </label>
                <a
                  href={`${posthogDashboardUrl}/project/settings`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-1"
                >
                  <span>Where to find this?</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                placeholder="phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-gray-50/50"
              />
              <p className="text-[11px] text-gray-400">
                Found in PostHog under <strong>Project Settings → Project API Key</strong> (starts with <code className="font-mono text-gray-600">phc_</code>).
              </p>
            </div>

            {/* Ingestion Host */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-800">
                Ingestion Region / API Host
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setApiHost('https://us.i.posthog.com')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    apiHost === 'https://us.i.posthog.com'
                      ? 'border-orange-500 bg-orange-50/40 text-gray-900 ring-1 ring-orange-500/30'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">🇺🇸 US Cloud</span>
                    {apiHost === 'https://us.i.posthog.com' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono">us.i.posthog.com</p>
                </button>

                <button
                  type="button"
                  onClick={() => setApiHost('https://eu.i.posthog.com')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    apiHost === 'https://eu.i.posthog.com'
                      ? 'border-orange-500 bg-orange-50/40 text-gray-900 ring-1 ring-orange-500/30'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">🇪🇺 EU Cloud (GDPR)</span>
                    {apiHost === 'https://eu.i.posthog.com' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono">eu.i.posthog.com</p>
                </button>
              </div>

              {/* Custom Host input if needed */}
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="https://us.i.posthog.com (or self-hosted domain)"
                  value={apiHost}
                  onChange={(e) => setApiHost(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-gray-50/50"
                />
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <label className="text-xs font-bold text-gray-800 block">
                Telemetry & Capture Features
              </label>

              <div className="space-y-2.5">
                {/* Enable Telemetry */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50/50 cursor-pointer transition-colors">
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">Enable PostHog Tracking</span>
                    <span className="text-[11px] text-gray-400">Stream events, pageviews, and custom funnel telemetry.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                </label>

                {/* Session Recording */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50/50 cursor-pointer transition-colors">
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">Session Replay</span>
                    <span className="text-[11px] text-gray-400">Record visitor cursor movements, taps, and screen sessions.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sessionRecording}
                    onChange={(e) => setSessionRecording(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                </label>

                {/* Autocapture */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50/50 cursor-pointer transition-colors">
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">Autocapture All Interactions</span>
                    <span className="text-[11px] text-gray-400">Automatically logs button clicks, menu dropdowns, and form submits.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autocapture}
                    onChange={(e) => setAutocapture(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                </label>

                {/* Input Masking */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50/50 cursor-pointer transition-colors">
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">Strict Input Masking (PII Protection)</span>
                    <span className="text-[11px] text-gray-400">Obfuscate credit cards, personal passwords, and phone numbers in replays.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={maskInputs}
                    onChange={(e) => setMaskInputs(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 flex items-center justify-between gap-3 border-t border-gray-100">
              <div className="text-[11px] text-gray-400">
                {saveSuccess && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Settings saved & PostHog re-initialized!
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Deploy PostHog</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right 5 Cols: Live Event Sandbox & Recent Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Test Event Sandbox */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-black text-gray-900">Event Sandbox & Verifier</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 text-orange-600">
                Live Test
              </span>
            </div>

            <p className="text-xs text-gray-500">
              Trigger a test telemetry payload to verify PostHog ingest and view live data stream:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTestEventType('pageview')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                  testEventType === 'pageview'
                    ? 'bg-orange-50 border-orange-300 text-orange-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                📄 Pageview
              </button>

              <button
                type="button"
                onClick={() => setTestEventType('tour')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                  testEventType === 'tour'
                    ? 'bg-orange-50 border-orange-300 text-orange-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                🌴 View Tour
              </button>

              <button
                type="button"
                onClick={() => setTestEventType('checkout')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                  testEventType === 'checkout'
                    ? 'bg-orange-50 border-orange-300 text-orange-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                🛒 Begin Checkout
              </button>

              <button
                type="button"
                onClick={() => setTestEventType('purchase')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                  testEventType === 'purchase'
                    ? 'bg-orange-50 border-orange-300 text-orange-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                💰 Complete Booking
              </button>
            </div>

            <button
              type="button"
              onClick={fireTestEvent}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Fire Test Event Now</span>
            </button>
          </div>

          {/* Real-time Event Inspector */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <RadioTower className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-gray-900">Real-time Event Stream</h3>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                {events.length} captured
              </span>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Activity className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-400">
                  No events logged in this session yet. Navigate the site or click "Fire Test Event Now" above.
                </p>
              </div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                {events.slice(0, 15).map((ev, idx) => (
                  <div
                    key={`ev-${idx}`}
                    className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 font-mono text-[11px] truncate">
                        {ev.name}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {ev.timestamp}
                      </span>
                    </div>
                    {ev.properties && Object.keys(ev.properties).length > 0 && (
                      <div className="text-[10px] text-gray-500 font-mono bg-white p-1.5 rounded-lg border border-gray-200/50 max-h-20 overflow-x-auto truncate">
                        {JSON.stringify(ev.properties)}
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
  );
}
