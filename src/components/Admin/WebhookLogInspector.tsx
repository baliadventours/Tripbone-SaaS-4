import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  Play, 
  ExternalLink, 
  Radio, 
  Clock, 
  Layers,
  ChevronDown,
  ChevronUp,
  Filter,
  CreditCard,
  Globe2
} from 'lucide-react';
import { getActiveTenantId } from '../../lib/firebase';

export interface WebhookLogItem {
  id: string;
  tenantId?: string;
  channelId?: string;
  channelName?: string;
  provider?: string;
  eventType?: string;
  otaBookingRef?: string;
  orderId?: string;
  bookingId?: string;
  tourTitle?: string;
  customerName?: string;
  paxCount?: number;
  totalAmount?: number;
  grossAmount?: number;
  status: 'success' | 'failed' | 'warning' | 'CONFIRMED' | 'CANCELLED' | string;
  idempotencyKey?: string;
  details?: string;
  payload?: any;
  headers?: any;
  durationMs?: number;
  timestamp: string;
  simulated?: boolean;
}

export default function WebhookLogInspector() {
  const activeTenantId = getActiveTenantId() || 'global';
  const [logs, setLogs] = useState<WebhookLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'ota' | 'payments' | 'simulator'>('all');
  
  // Expanded row state for payload inspecting
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Simulator Form State
  const [simChannel, setSimChannel] = useState('getyourguide');
  const [simEventType, setSimEventType] = useState('booking.created');
  const [simCustomerName, setSimCustomerName] = useState('Elena Rostova');
  const [simAmount, setSimAmount] = useState('145');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        tenantId: activeTenantId,
        limit: '60',
        status: selectedStatus,
        channel: selectedChannel !== 'all' ? selectedChannel : ''
      });
      const res = await fetch(`/api/webhooks/logs?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.warn('[WebhookLogInspector] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const timer = setInterval(fetchLogs, 15000); // Poll every 15s for real-time observability
    return () => clearInterval(timer);
  }, [activeTenantId, selectedStatus, selectedChannel]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRetryWebhook = async (logId: string) => {
    setRetryingId(logId);
    try {
      const res = await fetch('/api/webhooks/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, tenantId: activeTenantId })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Webhook ${logId} re-executed successfully!`);
        setTimeout(() => setActionSuccess(null), 4000);
        await fetchLogs();
      }
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch('/api/webhooks/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: simChannel,
          tenantId: activeTenantId,
          eventType: simEventType,
          customerName: simCustomerName,
          totalAmount: parseFloat(simAmount || '100')
        })
      });
      const data = await res.json();
      setSimResult(data);
      if (data.success) {
        setActionSuccess('Test webhook simulated & logged into engine!');
        setTimeout(() => setActionSuccess(null), 4000);
        await fetchLogs();
      }
    } catch (err: any) {
      setSimResult({ success: false, error: err.message });
    } finally {
      setSimulating(false);
    }
  };

  // Filter logs by Tab and Search
  const filteredLogs = logs.filter((log) => {
    if (activeTab === 'ota') {
      const isPayment = ['midtrans', 'stripe', 'xendit', 'paypal', 'tripay', 'adyen', 'razorpay'].includes((log.channelId || log.provider || '').toLowerCase());
      if (isPayment) return false;
    } else if (activeTab === 'payments') {
      const isPayment = ['midtrans', 'stripe', 'xendit', 'paypal', 'tripay', 'adyen', 'razorpay'].includes((log.channelId || log.provider || '').toLowerCase()) || log.eventType?.startsWith('payment');
      if (!isPayment) return false;
    }

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const str = `${log.channelName || ''} ${log.channelId || ''} ${log.provider || ''} ${log.otaBookingRef || ''} ${log.orderId || ''} ${log.customerName || ''} ${log.eventType || ''} ${log.details || ''}`.toLowerCase();
    return str.includes(term);
  });

  const totalSuccess = logs.filter(l => l.status === 'success' || l.status === 'CONFIRMED').length;
  const totalFailed = logs.filter(l => l.status === 'failed' || l.status === '500 ERR').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-500/10 via-primary/5 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/20 text-primary rounded-xl border border-primary/20">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Webhook & Ingestion Inspector
                  <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Live Guard Active
                  </span>
                </h2>
                <p className="text-xs font-medium text-slate-400">
                  Real-time cryptographic audit trail, idempotency deduplication, and OTA channel monitoring.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-slate-800/80 border border-slate-700/60 px-4 py-3 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Total Ingested</span>
              <span className="text-xl font-black text-white font-mono">{logs.length}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 px-4 py-3 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-0.5">Successful (200 OK)</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{totalSuccess}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 px-4 py-3 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Tenant Scope</span>
              <span className="text-xs font-mono font-bold text-orange-400 truncate max-w-[110px] block">{activeTenantId}</span>
            </div>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-3.5 bg-primary hover:bg-orange-600 active:scale-95 text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center cursor-pointer"
              title="Refresh Webhook Stream"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex bg-gray-100/80 p-1.5 rounded-2xl gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Radio className="h-3.5 w-3.5" /> All Ingestions
          </button>
          <button
            onClick={() => setActiveTab('ota')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'ota'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Globe2 className="h-3.5 w-3.5 text-blue-500" /> OTA Channels
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5 text-emerald-500" /> Payment Gateways
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-primary text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Play className="h-3.5 w-3.5" /> Test Simulator
          </button>
        </div>

        {/* Search Bar */}
        {activeTab !== 'simulator' && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reference, customer, channel, or event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-primary transition-all"
            />
          </div>
        )}
      </div>

      {/* TAB CONTENT: TEST SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Simulate Inbound Webhook Ping
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Trigger mock payloads from GetYourGuide, Viator, Klook, Midtrans, Stripe or Xendit to test your live booking pipeline, idempotency locks, and automated stop-sell trigger.
              </p>
            </div>

            <form onSubmit={handleSimulateWebhook} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Channel / Provider</label>
                  <select
                    value={simChannel}
                    onChange={(e) => setSimChannel(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-primary"
                  >
                    <option value="getyourguide">GetYourGuide (OTA)</option>
                    <option value="viator">Viator / TripAdvisor (OTA)</option>
                    <option value="klook">Klook Travel (OTA)</option>
                    <option value="airbnb">Airbnb Experiences (OTA)</option>
                    <option value="midtrans">Midtrans Payment (Settlement)</option>
                    <option value="stripe">Stripe Checkout (Payment Success)</option>
                    <option value="xendit">Xendit Gateway (Invoice Paid)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Event Type</label>
                  <select
                    value={simEventType}
                    onChange={(e) => setSimEventType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-primary"
                  >
                    <option value="booking.created">booking.created (New Order)</option>
                    <option value="booking.cancelled">booking.cancelled (Release Seats)</option>
                    <option value="availability.check">availability.check (Quote Query)</option>
                    <option value="payment.success">payment.success (Capture/Settle)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Test Traveler Name</label>
                  <input
                    type="text"
                    value={simCustomerName}
                    onChange={(e) => setSimCustomerName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Gross Total Amount ($ USD)</label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={simulating}
                  className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-orange-600 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {simulating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  <span>{simulating ? 'Transmitting Inbound Ping...' : 'Dispatch Test Webhook'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Simulator Info / Results */}
          <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Simulator Output</span>
                <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">JSON Trace</span>
              </div>

              {simResult ? (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Response 200 OK</span>
                  </div>
                  <pre className="bg-slate-950 p-3.5 rounded-2xl overflow-x-auto text-[11px] font-mono text-orange-400 max-h-64 leading-relaxed">
                    {JSON.stringify(simResult, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50 stroke-1.5" />
                  <p>Click "Dispatch Test Webhook" to execute an end-to-end ingestion test.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Idempotency verification guarantees double-pings will never duplicate bookings.</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: WEBHOOK LOGS TABLE */}
      {activeTab !== 'simulator' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-gray-900 text-base tracking-tight">Ingested Event History</h3>
              <p className="text-xs text-gray-400">Click any row to inspect raw payload, idempotency keys, and trace metadata.</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Auto-polling (15s)</span>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-3">
              <Terminal className="h-10 w-10 mx-auto text-gray-300 stroke-1.5" />
              <p className="text-sm font-bold text-gray-700">No Webhook Logs Found</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                No webhooks have been received matching this filter. You can send a test ping using the "Test Simulator" tab above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const isSuccess = log.status === 'success' || log.status === 'CONFIRMED' || log.status === '200 OK';
                const isCancelled = log.status === 'CANCELLED' || log.eventType === 'booking.cancelled';

                return (
                  <div key={log.id} className="transition-colors hover:bg-gray-50/70">
                    <div 
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                    >
                      {/* Left: Provider & Reference */}
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className={`p-2.5 rounded-2xl shrink-0 ${
                          isCancelled 
                            ? 'bg-amber-50 text-amber-600'
                            : isSuccess 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {isCancelled ? (
                            <AlertTriangle className="h-5 w-5" />
                          ) : isSuccess ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-gray-900 text-sm">
                              {log.channelName || log.provider || 'OTA Channel'}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                              {log.eventType || 'booking.created'}
                            </span>
                            {log.simulated && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md border border-purple-100">
                                Simulated
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-mono">
                            <span className="font-bold text-gray-700">{log.otaBookingRef || log.orderId || log.bookingId || 'Ref N/A'}</span>
                            {log.customerName && (
                              <>
                                <span>•</span>
                                <span className="font-sans text-gray-600 font-medium">{log.customerName}</span>
                              </>
                            )}
                            {log.paxCount ? (
                              <>
                                <span>•</span>
                                <span>{log.paxCount} Pax</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Right: Status & Actions */}
                      <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                        <div className="text-right">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            isCancelled
                              ? 'bg-amber-100 text-amber-800'
                              : isSuccess
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status || 'PROCESSED'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono block mt-1">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        <div className="text-gray-400">
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED DETAILS ACCORDION */}
                    {isExpanded && (
                      <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-2 bg-gray-50/50 border-t border-gray-100 space-y-4 animate-in fade-in duration-200">
                        {log.details && (
                          <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-700">
                            <span className="font-bold text-gray-900 block mb-0.5">Execution Summary:</span>
                            {log.details}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                          <div className="p-3 bg-white rounded-xl border border-gray-200">
                            <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">Idempotency Key</span>
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-gray-800 font-bold text-[11px]">{log.idempotencyKey || `${log.channelId}_${log.otaBookingRef}`}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(log.idempotencyKey || `${log.channelId}_${log.otaBookingRef}`, log.id);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-700 rounded"
                              >
                                {copiedKey === log.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-gray-200">
                            <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">Total Gross Value</span>
                            <span className="text-gray-900 font-bold font-mono text-sm">
                              ${log.totalAmount || log.grossAmount || 0} USD
                            </span>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">Manual Action</span>
                              <span className="text-[10px] text-gray-500">Re-dispatch payload</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetryWebhook(log.id);
                              }}
                              disabled={retryingId === log.id}
                              className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                            >
                              {retryingId === log.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                              <span>Retry Event</span>
                            </button>
                          </div>
                        </div>

                        {/* Raw JSON viewer */}
                        {log.payload && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Raw Inbound Payload</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(JSON.stringify(log.payload, null, 2), `payload_${log.id}`);
                                }}
                                className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                              >
                                {copiedKey === `payload_${log.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                <span>Copy JSON</span>
                              </button>
                            </div>
                            <pre className="bg-slate-950 text-orange-400 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
