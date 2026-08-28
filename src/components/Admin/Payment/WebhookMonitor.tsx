import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Clock, RefreshCw, Eye } from 'lucide-react';
import { WebhookLogEntry } from '../../../services/payment/types';
import { PaymentService } from '../../../services/payment/PaymentService';

interface Props {
  tenantId?: string;
}

export const WebhookMonitor: React.FC<Props> = ({ tenantId = 'global' }) => {
  const [logs, setLogs] = useState<WebhookLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<WebhookLogEntry | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await PaymentService.getWebhookLogs(tenantId, 25);
      if (data.length > 0) {
        setLogs(data);
      } else {
        // Provide mock demo events if no real webhooks have arrived yet
        setLogs([
          {
            id: 'wh_mock_1',
            tenantId,
            providerId: 'stripe',
            event: 'checkout.session.completed',
            status: 'success',
            signatureValid: true,
            bookingId: 'BK-9021',
            transactionId: 'cs_live_a1b2c3d4e5f6',
            receivedAt: new Date().toISOString(),
            processingTimeMs: 42,
            payloadPreview: JSON.stringify({
              id: 'evt_1P8x9y2eZvKYlo2C',
              object: 'event',
              type: 'checkout.session.completed',
              data: { object: { id: 'cs_live_a1b2c3d4e5f6', payment_status: 'paid', amount_total: 15000 } }
            }, null, 2)
          },
          {
            id: 'wh_mock_2',
            tenantId,
            providerId: 'xendit',
            event: 'invoice.paid',
            status: 'success',
            signatureValid: true,
            bookingId: 'BK-8840',
            transactionId: 'inv_6633a201b2',
            receivedAt: new Date(Date.now() - 3600000).toISOString(),
            processingTimeMs: 28,
            payloadPreview: JSON.stringify({
              id: '5f91283720a',
              status: 'PAID',
              external_id: 'booking-BK-8840-1700000',
              amount: 750000,
              currency: 'IDR'
            }, null, 2)
          }
        ]);
      }
    } catch (err: any) {
      console.error('Error fetching webhook logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tenantId]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-sky-600" />
            Webhook Event Monitor
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time tracking of incoming payment gateway callback events and signature verification.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-medium">No webhook events received yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase font-black text-[10px] tracking-wider">
                <th className="pb-3 px-2">Provider</th>
                <th className="pb-3 px-2">Event</th>
                <th className="pb-3 px-2">Booking ID</th>
                <th className="pb-3 px-2">Signature</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2">Latency</th>
                <th className="pb-3 px-2">Timestamp</th>
                <th className="pb-3 px-2 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-2 font-bold uppercase text-slate-800">
                    {log.providerId}
                  </td>
                  <td className="py-3 px-2 font-mono text-[11px] text-sky-700">
                    {log.event}
                  </td>
                  <td className="py-3 px-2 font-semibold text-gray-700">
                    {log.bookingId || 'N/A'}
                  </td>
                  <td className="py-3 px-2">
                    {log.signatureValid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="h-3 w-3" /> Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                        <ShieldAlert className="h-3 w-3" /> Invalid
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      log.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {log.status === 'success' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-500 font-mono text-[11px]">
                    {log.processingTimeMs}ms
                  </td>
                  <td className="py-3 px-2 text-gray-500 text-[11px]">
                    {new Date(log.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                      title="View Raw Payload"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h4 className="font-bold text-gray-900 text-sm">
                Webhook Event Payload ({selectedLog.event})
              </h4>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <pre className="bg-slate-900 text-slate-100 text-[11px] p-4 rounded-xl font-mono overflow-x-auto max-h-96">
              {selectedLog.payloadPreview}
            </pre>

            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
