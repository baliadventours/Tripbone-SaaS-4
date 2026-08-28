import React, { useState, useEffect, FormEvent } from 'react';
import { 
  CreditCard, Wallet, Database, DollarSign, Save, Loader2, Info, Check, 
  ShieldCheck, ExternalLink, Zap, AlertCircle, Copy, Key, QrCode, Building, CheckCircle2,
  Activity, RefreshCw, AlertTriangle, ShieldAlert, FileText, ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getActiveTenantId } from '../../lib/firebase';
import { PaymentService, TenantPaymentSettings } from '../../services/payment/PaymentService';
import { PaymentGatewayRegistry } from '../../services/payment/PaymentGatewayRegistry';
import { GatewayConfig, PaymentProviderId, TestConnectionResult } from '../../services/payment/types';
import { PaymentHealthDashboard } from './Payment/PaymentHealthDashboard';
import { WebhookMonitor } from './Payment/WebhookMonitor';

export default function PaymentManager() {
  const activeTenantId = getActiveTenantId() || 'global';
  const registry = PaymentGatewayRegistry.getInstance();
  const allGateways = registry.getAllGateways();

  const [tenantSettings, setTenantSettings] = useState<TenantPaymentSettings | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<PaymentProviderId>('stripe');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<'gateways' | 'health' | 'webhooks' | 'deposit'>('gateways');
  const [verificationResult, setVerificationResult] = useState<TestConnectionResult | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await PaymentService.getTenantSettings(activeTenantId);
        setTenantSettings(data);
        setSelectedProviderId(data?.activeProviderId || 'stripe');
      } catch (err: any) {
        console.error('Error loading BYOPG settings:', err);
        setTenantSettings({
          activeProviderId: 'bank_transfer',
          providerConfigs: {
            stripe: { providerId: 'stripe', mode: 'sandbox', enabled: false },
            xendit: { providerId: 'xendit', mode: 'sandbox', enabled: false },
            razorpay: { providerId: 'razorpay', mode: 'sandbox', enabled: false },
            adyen: { providerId: 'adyen', mode: 'sandbox', enabled: false },
            paypal: { providerId: 'paypal', mode: 'sandbox', enabled: false },
            midtrans: { providerId: 'midtrans', mode: 'sandbox', enabled: false },
            bank_transfer: { providerId: 'bank_transfer', mode: 'live', enabled: true },
            pay_on_arrival: { providerId: 'pay_on_arrival', mode: 'live', enabled: true },
          },
          depositType: 'percentage',
          depositPercentage: 100,
          autoConfirmOnPayment: true,
          currencyConversionEnabled: false,
          updatedAt: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTenantId]);

  if (loading || !tenantSettings) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
        <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">
          Initializing Bring Your Own Payment Gateway (BYOPG)...
        </p>
      </div>
    );
  }

  const currentConfig: GatewayConfig = tenantSettings.providerConfigs[selectedProviderId] || {
    providerId: selectedProviderId,
    mode: 'sandbox',
    enabled: false,
  };

  const handleConfigChange = (field: keyof GatewayConfig, value: any) => {
    setTenantSettings(prev => {
      if (!prev) return prev;
      const updatedConfigs = { ...prev.providerConfigs };
      updatedConfigs[selectedProviderId] = {
        ...updatedConfigs[selectedProviderId],
        [field]: value,
      };
      return { ...prev, providerConfigs: updatedConfigs };
    });
  };

  const handleVerifyCredentials = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await PaymentService.testAndVerifyCredentials(activeTenantId, selectedProviderId, currentConfig);
      setVerificationResult(res);

      // Update local state with verification metadata
      handleConfigChange('verificationMeta', {
        verifiedAt: new Date().toISOString(),
        connectionStatus: res.success ? 'connected' : 'failed',
        merchantName: res.merchantName,
        accountStatus: res.accountStatus,
        mode: res.mode,
        errorMessage: res.message,
      });

      if (res.success) {
        setSaveMessage({ type: 'success', text: `Verified successfully! Merchant: ${res.merchantName || 'Active'}` });
      } else {
        setSaveMessage({ type: 'error', text: `Verification failed: ${res.message}` });
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: `Credential test failed: ${err.message}` });
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    try {
      // First verify credentials if active provider credentials changed
      const res = await PaymentService.testAndVerifyCredentials(activeTenantId, selectedProviderId, currentConfig);
      
      if (!res.success && currentConfig.enabled) {
        setSaveMessage({
          type: 'error',
          text: `Cannot save invalid credentials for active provider (${selectedProviderId.toUpperCase()}): ${res.message}`
        });
        setSaving(false);
        return;
      }

      await PaymentService.saveTenantSettings(activeTenantId, tenantSettings);
      setSaveMessage({ type: 'success', text: 'BYOPG payment gateway configuration saved securely!' });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving payment settings:', err);
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeGatewayObj = registry.getGateway(tenantSettings.activeProviderId);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="h-64 w-64 text-sky-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-black uppercase tracking-widest border border-sky-400/30">
                Universal BYOPG Architecture
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-400/30">
                100% Direct Payouts
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-sky-400" />
              Bring Your Own Payment Gateway
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-1 max-w-2xl leading-relaxed">
              Tripbone never holds or touches customer funds. Connect your own merchant credentials directly to receive payments instantly in your own business account.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0 text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Active Merchant Gateway</span>
            <div className="text-lg font-black text-white mt-0.5 flex items-center justify-end gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeGatewayObj?.name || tenantSettings.activeProviderId.toUpperCase()}
            </div>
            <span className="text-[11px] font-semibold text-sky-300 block mt-0.5">
              Mode: {tenantSettings.providerConfigs[tenantSettings.activeProviderId]?.mode?.toUpperCase() || 'SANDBOX'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab('gateways')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 ${
            activeTab === 'gateways' ? 'bg-sky-600 text-white shadow-md shadow-sky-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Gateway Providers ({allGateways.length})
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 ${
            activeTab === 'health' ? 'bg-sky-600 text-white shadow-md shadow-sky-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Activity className="h-4 w-4" />
          Payment Health & Diagnostic
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 ${
            activeTab === 'webhooks' ? 'bg-sky-600 text-white shadow-md shadow-sky-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <RefreshCw className="h-4 w-4" />
          Webhook Monitor
        </button>

        <button
          onClick={() => setActiveTab('deposit')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 ${
            activeTab === 'deposit' ? 'bg-sky-600 text-white shadow-md shadow-sky-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Deposit & Policy Rules
        </button>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs ${
          saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {saveMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
            <span>{saveMessage.text}</span>
          </div>
          <button onClick={() => setSaveMessage(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
        </div>
      )}

      {/* TAB 1: GATEWAY PROVIDERS */}
      {activeTab === 'gateways' && (
        <div className="space-y-8">
          {/* Active Provider Selector Grid */}
          <div>
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black uppercase text-gray-900 tracking-wider flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                  Multi Payment Gateway Architecture Activated
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enable multiple payment providers below. All enabled gateways will automatically be presented as customer options during checkout.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
                <span>Enabled Gateways:</span>
                <span className="font-black text-sky-900">
                  {Object.values(tenantSettings.providerConfigs).filter(c => c?.enabled).length} / {allGateways.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {allGateways.map((gw) => {
                const isActive = tenantSettings.activeProviderId === gw.providerId;
                const isSelected = selectedProviderId === gw.providerId;
                const cfg = tenantSettings.providerConfigs[gw.providerId];
                const isEnabled = cfg?.enabled ?? false;
                const isConnected = cfg?.verificationMeta?.connectionStatus === 'connected';

                return (
                  <button
                    key={gw.providerId}
                    type="button"
                    onClick={() => {
                      setSelectedProviderId(gw.providerId);
                      setVerificationResult(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between min-h-[140px] ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 shadow-md'
                        : isEnabled
                        ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <span className="font-black text-sm text-gray-900 block">{gw.name}</span>
                      <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider ${
                        isEnabled 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isEnabled ? 'ENABLED' : 'OFF'}
                      </span>
                    </div>

                    <div className="space-y-1 my-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-bold text-gray-500">
                          {isConnected ? 'Verified' : 'Not Tested'}
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase text-gray-400 block">
                        Mode: {cfg?.mode?.toUpperCase() || 'SANDBOX'}
                      </span>
                    </div>

                    {/* Enable toggle & Configure button */}
                    <div className="mt-2 flex items-center justify-between border-t border-gray-100/80 pt-2 w-full">
                      <span className="text-[9px] text-sky-700 font-bold">Configure →</span>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <label className="text-[9px] font-bold text-gray-500 cursor-pointer">
                          {isEnabled ? 'Active' : 'Enable'}
                        </label>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => {
                            const updated = e.target.checked;
                            handleConfigChange('enabled', updated);
                          }}
                          className="h-3.5 w-3.5 text-sky-600 rounded border-gray-300 cursor-pointer"
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credential Form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Key className="h-5 w-5 text-sky-600" />
                  {registry.getGateway(selectedProviderId).name} Configuration
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Input and verify merchant credentials for {selectedProviderId.toUpperCase()}.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleVerifyCredentials}
                  disabled={verifying}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${verifying ? 'animate-spin' : ''}`} />
                  {verifying ? 'Verifying...' : 'Verify Credentials'}
                </button>

                {tenantSettings.activeProviderId !== selectedProviderId && (
                  <button
                    type="button"
                    onClick={() => setTenantSettings({ ...tenantSettings, activeProviderId: selectedProviderId })}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Set as Active Gateway
                  </button>
                )}
              </div>
            </div>

            {/* Merchant Verification Badge */}
            {currentConfig.verificationMeta && (
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                currentConfig.verificationMeta.connectionStatus === 'connected'
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/60 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-3">
                  {currentConfig.verificationMeta.connectionStatus === 'connected' ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider">
                      Merchant Account Status: {currentConfig.verificationMeta.accountStatus?.toUpperCase() || 'UNVERIFIED'}
                    </h4>
                    <p className="text-xs font-medium mt-0.5">
                      Merchant: <strong className="font-black">{currentConfig.verificationMeta.merchantName || 'N/A'}</strong> | Mode: <strong className="font-black">{currentConfig.verificationMeta.mode?.toUpperCase()}</strong>
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold text-gray-500">
                  Verified: {new Date(currentConfig.verificationMeta.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}

            {/* Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                  Environment Mode
                </label>
                <select
                  value={currentConfig.mode}
                  onChange={(e) => handleConfigChange('mode', e.target.value as any)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none"
                >
                  <option value="sandbox">🟡 Sandbox / Test Mode</option>
                  <option value="live">🟢 Live Production Mode</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                  Gateway Enablement
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="enableGateway"
                    checked={currentConfig.enabled}
                    onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                    className="h-4 w-4 text-sky-600 rounded border-gray-300"
                  />
                  <label htmlFor="enableGateway" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Enable this provider for merchant checkouts
                  </label>
                </div>
              </div>
            </div>

            {/* Provider Dynamic Fields */}
            {selectedProviderId === 'stripe' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Stripe Secret Key (sk_live_... or sk_test_...)
                  </label>
                  <input
                    type="password"
                    value={currentConfig.secretKey || currentConfig.apiKey || ''}
                    onChange={(e) => {
                      handleConfigChange('secretKey', e.target.value);
                      handleConfigChange('apiKey', e.target.value);
                    }}
                    placeholder="sk_test_..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Stripe Publishable Key (pk_live_... or pk_test_...)
                  </label>
                  <input
                    type="text"
                    value={currentConfig.publicKey || ''}
                    onChange={(e) => handleConfigChange('publicKey', e.target.value)}
                    placeholder="pk_test_..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Stripe Webhook Signing Secret (whsec_...)
                  </label>
                  <input
                    type="password"
                    value={currentConfig.webhookSecret || ''}
                    onChange={(e) => handleConfigChange('webhookSecret', e.target.value)}
                    placeholder="whsec_..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {selectedProviderId === 'xendit' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Xendit Secret API Key (xnd_development_... or xnd_production_...)
                  </label>
                  <input
                    type="password"
                    value={currentConfig.apiKey || currentConfig.secretKey || ''}
                    onChange={(e) => {
                      handleConfigChange('apiKey', e.target.value);
                      handleConfigChange('secretKey', e.target.value);
                    }}
                    placeholder="xnd_development_..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Xendit Callback Token (Verification Secret)
                  </label>
                  <input
                    type="password"
                    value={currentConfig.webhookSecret || ''}
                    onChange={(e) => handleConfigChange('webhookSecret', e.target.value)}
                    placeholder="Verification token from Xendit dashboard..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {selectedProviderId === 'razorpay' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Razorpay Key ID (rzp_test_... or rzp_live_...)
                  </label>
                  <input
                    type="text"
                    value={currentConfig.publicKey || currentConfig.apiKey || ''}
                    onChange={(e) => {
                      handleConfigChange('publicKey', e.target.value);
                      handleConfigChange('apiKey', e.target.value);
                    }}
                    placeholder="rzp_test_..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Razorpay Key Secret
                  </label>
                  <input
                    type="password"
                    value={currentConfig.secretKey || ''}
                    onChange={(e) => handleConfigChange('secretKey', e.target.value)}
                    placeholder="Secret Key..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Razorpay Webhook Secret
                  </label>
                  <input
                    type="password"
                    value={currentConfig.webhookSecret || ''}
                    onChange={(e) => handleConfigChange('webhookSecret', e.target.value)}
                    placeholder="Webhook secret..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {selectedProviderId === 'adyen' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Adyen Merchant Account ID
                  </label>
                  <input
                    type="text"
                    value={currentConfig.merchantId || ''}
                    onChange={(e) => handleConfigChange('merchantId', e.target.value)}
                    placeholder="YourAdyenMerchantAccount"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Adyen API Key
                  </label>
                  <input
                    type="password"
                    value={currentConfig.apiKey || currentConfig.secretKey || ''}
                    onChange={(e) => {
                      handleConfigChange('apiKey', e.target.value);
                      handleConfigChange('secretKey', e.target.value);
                    }}
                    placeholder="AQEy..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {selectedProviderId === 'paypal' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                  <div className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5">
                    Web SDK v6
                  </div>
                  <div>
                    <p className="font-bold">PayPal Web SDK v6 Enabled</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Supports modular SDK loading, server-side client tokens, one-time payment sessions, and real-time eligibility checks (Pay Later, Venmo, Cards).
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    PayPal Client ID
                  </label>
                  <input
                    type="text"
                    value={currentConfig.publicKey || currentConfig.apiKey || ''}
                    onChange={(e) => {
                      handleConfigChange('publicKey', e.target.value);
                      handleConfigChange('apiKey', e.target.value);
                    }}
                    placeholder="A..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    PayPal Secret Key
                  </label>
                  <input
                    type="password"
                    value={currentConfig.secretKey || ''}
                    onChange={(e) => handleConfigChange('secretKey', e.target.value)}
                    placeholder="E..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {selectedProviderId === 'midtrans' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Midtrans Server Key (SB-Mid-server-... or Mid-server-...)
                  </label>
                  <input
                    type="password"
                    value={currentConfig.secretKey || currentConfig.apiKey || ''}
                    onChange={(e) => {
                      handleConfigChange('secretKey', e.target.value);
                      handleConfigChange('apiKey', e.target.value);
                    }}
                    placeholder="SB-Mid-server-..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Midtrans Client Key (SB-Mid-client-... or Mid-client-...)
                  </label>
                  <input
                    type="text"
                    value={currentConfig.publicKey || ''}
                    onChange={(e) => handleConfigChange('publicKey', e.target.value)}
                    placeholder="SB-Mid-client-..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {selectedProviderId === 'wise' && (
              <div className="space-y-4">
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-black text-xs text-sky-900 uppercase tracking-wide">
                        Wise (TransferWise) Developer Integration
                      </h4>
                      <p className="text-xs text-sky-700 leading-relaxed">
                        Wise lets you accept international bank payments with real mid-market exchange rates, receive payments into multi-currency borderless accounts, and automate transfers with low fees.
                      </p>
                      <div className="pt-2 flex items-center gap-3">
                        <a
                          href="https://docs.wise.com/guides/developer"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 hover:text-sky-950 underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Wise Developer Documentation
                        </a>
                        <a
                          href="https://wise.com/settings/api-tokens"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 hover:text-sky-950 underline"
                        >
                          <Key className="h-3.5 w-3.5" /> Generate Wise API Token
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Wise API Token (Read/Write)
                  </label>
                  <input
                    type="password"
                    value={currentConfig.apiKey || currentConfig.secretKey || ''}
                    onChange={(e) => {
                      handleConfigChange('apiKey', e.target.value);
                      handleConfigChange('secretKey', e.target.value);
                    }}
                    placeholder="e.g. 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Generated under Wise Settings &gt; API tokens. Required for profile verification, balance checks, and quotes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                      Wise Profile ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={currentConfig.profileId || ''}
                      onChange={(e) => handleConfigChange('profileId', e.target.value)}
                      placeholder="e.g. 12345678 (Auto-detected if left blank)"
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                      Webhook Secret / Public Key (Optional)
                    </label>
                    <input
                      type="password"
                      value={currentConfig.webhookSecret || ''}
                      onChange={(e) => handleConfigChange('webhookSecret', e.target.value)}
                      placeholder="Wise Webhook subscription public key"
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedProviderId === 'bank_transfer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={currentConfig.bankName || ''}
                    onChange={(e) => handleConfigChange('bankName', e.target.value)}
                    placeholder="e.g. Bank Central Asia (BCA)"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Account Number / IBAN
                  </label>
                  <input
                    type="text"
                    value={currentConfig.accountNumber || ''}
                    onChange={(e) => handleConfigChange('accountNumber', e.target.value)}
                    placeholder="e.g. 1234567890 or IBAN"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    SWIFT / BIC Code (For International Transfers)
                  </label>
                  <input
                    type="text"
                    value={currentConfig.swiftCode || ''}
                    onChange={(e) => handleConfigChange('swiftCode', e.target.value.toUpperCase())}
                    placeholder="e.g. CENAIDJA or BNINIDJA"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold uppercase tracking-wider"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Standard 8 or 11 character SWIFT/BIC code for international wire and Wise/Revolut transfers.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={currentConfig.accountHolder || ''}
                    onChange={(e) => handleConfigChange('accountHolder', e.target.value)}
                    placeholder="e.g. PT Bali Adventours"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Bank Instructions for Guests
                  </label>
                  <textarea
                    rows={2}
                    value={currentConfig.instructions || ''}
                    onChange={(e) => handleConfigChange('instructions', e.target.value)}
                    placeholder="Please include your Booking ID in the transfer reference line."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
              </div>
            )}

            {selectedProviderId === 'pay_on_arrival' && (
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                  Pay on Arrival / Cash Instructions
                </label>
                <textarea
                  rows={2}
                  value={currentConfig.instructions || ''}
                  onChange={(e) => handleConfigChange('instructions', e.target.value)}
                  placeholder="You can pay cash or card directly to your guide or driver upon arrival."
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-sky-200 disabled:opacity-50"
              >
                <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Saving & Testing...' : 'Save & Lock Gateway Config'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HEALTH & DIAGNOSTIC */}
      {activeTab === 'health' && (
        <PaymentHealthDashboard
          tenantId={activeTenantId}
          activeProviderName={registry.getGateway(tenantSettings.activeProviderId)?.name || tenantSettings.activeProviderId}
          lastDiagnostic={tenantSettings.lastDiagnostic}
          onDiagnosticComplete={(result) => setTenantSettings({ ...tenantSettings, lastDiagnostic: result })}
        />
      )}

      {/* TAB 3: WEBHOOK MONITOR */}
      {activeTab === 'webhooks' && (
        <WebhookMonitor tenantId={activeTenantId} />
      )}

      {/* TAB 4: DEPOSIT & POLICY RULES */}
      {activeTab === 'deposit' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b border-gray-100">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-sky-600" />
              Deposit & Booking Confirmation Rules
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure deposit amounts, partial payment percentage, and automated status confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                Deposit Requirement Type
              </label>
              <select
                value={tenantSettings.depositType}
                onChange={(e) => setTenantSettings({ ...tenantSettings, depositType: e.target.value as any })}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none"
              >
                <option value="full">100% Full Payment upfront</option>
                <option value="percentage">Percentage Deposit (e.g. 50%)</option>
                <option value="fixed">Fixed Deposit Amount (e.g. $50 / IDR 500k)</option>
              </select>
            </div>

            {tenantSettings.depositType === 'percentage' && (
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                  Required Deposit Percentage (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tenantSettings.depositPercentage}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, depositPercentage: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>
            )}

            {tenantSettings.depositType === 'fixed' && (
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                  Fixed Deposit Amount
                </label>
                <input
                  type="number"
                  min="1"
                  value={tenantSettings.fixedDepositAmount || 50}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, fixedDepositAmount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>
            )}

            <div className="sm:col-span-2 pt-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoConfirm"
                  checked={tenantSettings.autoConfirmOnPayment}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, autoConfirmOnPayment: e.target.checked })}
                  className="h-4 w-4 text-sky-600 rounded border-gray-300"
                />
                <label htmlFor="autoConfirm" className="text-xs font-bold text-gray-800 cursor-pointer">
                  Automatically mark booking as CONFIRMED upon successful gateway payment receipt
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-sky-200 disabled:opacity-50"
            >
              <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Saving...' : 'Save Deposit Rules'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
