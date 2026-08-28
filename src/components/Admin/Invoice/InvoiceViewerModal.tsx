import React, { useState } from 'react';
import { 
  X, Printer, Send, MessageSquare, Copy, Check, ExternalLink, 
  CreditCard, Building2, Calendar, User, Mail, Phone, FileText, 
  CheckCircle2, Clock, AlertCircle, Trash2, Edit3, DollarSign,
  Download, ArrowUpRight, ShieldCheck, ChevronRight
} from 'lucide-react';
import { TenantInvoice } from '../../../types';
import { formatInvoiceAmount, openInvoiceWhatsApp, sendInvoiceEmail, saveTenantInvoice } from '../../../lib/invoiceService';

interface InvoiceViewerModalProps {
  invoice: TenantInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (invoice: TenantInvoice) => void;
  onInvoiceUpdated?: (updatedInvoice: TenantInvoice) => void;
}

export default function InvoiceViewerModal({
  invoice,
  isOpen,
  onClose,
  onEdit,
  onInvoiceUpdated
}: InvoiceViewerModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [markingStatus, setMarkingStatus] = useState(false);

  if (!isOpen || !invoice) return null;

  const currency = invoice.currency || 'USD';
  const formatMoney = (amount: number) => formatInvoiceAmount(amount, currency);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> PAID
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" /> OVERDUE
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            CANCELLED
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            DRAFT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> UNPAID / PENDING
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPaymentLink = () => {
    if (invoice.paymentButton?.url) {
      navigator.clipboard.writeText(invoice.paymentButton.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice.customer?.email) {
      setEmailStatus({ type: 'error', message: 'Client email is missing.' });
      return;
    }

    setSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await sendInvoiceEmail(invoice);
      setEmailStatus({ type: 'success', message: res.message || 'Invoice emailed successfully!' });
      if (onInvoiceUpdated) {
        onInvoiceUpdated({
          ...invoice,
          sentAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setEmailStatus({ type: 'error', message: err.message || 'Failed to send invoice email' });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleTogglePaidStatus = async () => {
    setMarkingStatus(true);
    try {
      const newStatus = invoice.status === 'paid' ? 'unpaid' : 'paid';
      const updated: TenantInvoice = {
        ...invoice,
        status: newStatus,
        paidAt: newStatus === 'paid' ? new Date().toISOString() : undefined,
        paidAmount: newStatus === 'paid' ? invoice.totalAmount : 0,
        balanceDue: newStatus === 'paid' ? 0 : invoice.totalAmount,
        auditLogs: [
          ...(invoice.auditLogs || []),
          {
            id: `log_${Date.now()}`,
            action: newStatus === 'paid' ? 'marked_paid' : 'updated',
            timestamp: new Date().toISOString(),
            notes: `Status changed to ${newStatus.toUpperCase()}`
          }
        ]
      };
      await saveTenantInvoice(updated);
      if (onInvoiceUpdated) onInvoiceUpdated(updated);
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setMarkingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Control Header Bar (Hidden during Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">Invoice #{invoice.invoiceNumber}</h2>
                {getStatusBadge(invoice.status)}
              </div>
              <p className="text-xs text-slate-500">Issued to {invoice.customer?.name} on {invoice.issueDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(invoice)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            )}

            <button
              type="button"
              onClick={handleTogglePaidStatus}
              disabled={markingStatus}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
                invoice.status === 'paid'
                  ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {invoice.status === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar (Email, WhatsApp, Print, Copy) - Hidden in Print */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 bg-sky-50/60 border-b border-sky-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sendingEmail || !invoice.customer?.email}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold transition shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {sendingEmail ? 'Sending Email...' : 'Send to Client Email'}
            </button>

            <button
              type="button"
              onClick={() => openInvoiceWhatsApp(invoice)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Send via WhatsApp
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
          </div>

          <div className="flex items-center gap-2">
            {invoice.paymentButton?.enabled && invoice.paymentButton?.url && (
              <button
                type="button"
                onClick={handleCopyPaymentLink}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                {copiedLink ? 'Link Copied!' : 'Copy Pay Link'}
              </button>
            )}
          </div>
        </div>

        {/* Email Notification Alert Banner */}
        {emailStatus && (
          <div className={`px-6 py-2 text-xs flex items-center justify-between ${
            emailStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}>
            <span>{emailStatus.message}</span>
            <button type="button" onClick={() => setEmailStatus(null)} className="underline ml-2">Dismiss</button>
          </div>
        )}

        {/* Printable Invoice Body Canvas */}
        <div id="printable-invoice" className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-slate-900 print:p-0 print:overflow-visible">
          <div className="max-w-3xl mx-auto space-y-8 print:max-w-none">
            
            {/* Header: Brand & Invoice Meta */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
              <div className="space-y-2">
                {invoice.tenantLogo && (
                  <img 
                    src={invoice.tenantLogo} 
                    alt={invoice.tenantName || 'Logo'} 
                    className="h-12 w-auto object-contain mb-2"
                  />
                )}
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {invoice.tenantName || 'Tour & Travel Operator'}
                </h1>
                {invoice.tenantAddress && (
                  <p className="text-xs text-slate-500 max-w-sm">{invoice.tenantAddress}</p>
                )}
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                  {invoice.tenantEmail && <span>Email: {invoice.tenantEmail}</span>}
                  {invoice.tenantPhone && <span>Phone: {invoice.tenantPhone}</span>}
                  {invoice.tenantWebsite && <span>Web: {invoice.tenantWebsite}</span>}
                </div>
              </div>

              <div className="sm:text-right space-y-1">
                <div className="text-3xl font-black tracking-wider text-sky-700">INVOICE</div>
                <div className="text-sm font-bold text-slate-900">#{invoice.invoiceNumber}</div>
                <div className="pt-2">{getStatusBadge(invoice.status)}</div>
              </div>
            </div>

            {/* Bill To & Invoice Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200/80">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Billed To:</div>
                <div className="text-base font-extrabold text-slate-900">{invoice.customer?.name || 'Valued Guest'}</div>
                {invoice.customer?.company && (
                  <div className="text-xs font-semibold text-slate-700">{invoice.customer.company}</div>
                )}
                {invoice.customer?.email && (
                  <div className="text-xs text-slate-600 mt-1">{invoice.customer.email}</div>
                )}
                {invoice.customer?.phone && (
                  <div className="text-xs text-slate-600">{invoice.customer.phone}</div>
                )}
                {invoice.customer?.address && (
                  <div className="text-xs text-slate-500 mt-1">{invoice.customer.address}</div>
                )}
                {invoice.customer?.country && (
                  <div className="text-xs text-slate-500">{invoice.customer.country}</div>
                )}
              </div>

              <div className="sm:text-right flex flex-col justify-between space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500">Issue Date: </span>
                  <span className="font-bold text-slate-900">{invoice.issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-500">Due Date: </span>
                  <span className="font-bold text-rose-600">{invoice.dueDate}</span>
                </div>
                <div>
                  <span className="text-slate-500">Currency: </span>
                  <span className="font-bold text-slate-900">{invoice.currency}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Balance Due: </span>
                  <span className="text-lg font-black text-sky-700">
                    {formatMoney(invoice.balanceDue ?? invoice.totalAmount ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-2">Item & Description</th>
                    <th className="py-3 px-2 text-center w-16">Qty</th>
                    <th className="py-3 px-2 text-right w-28">Unit Price</th>
                    <th className="py-3 px-2 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {invoice.items && invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-2">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-slate-500 mt-0.5 whitespace-pre-line">{item.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-center text-slate-600 font-medium">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-2 text-right text-slate-600 font-medium">
                        {formatMoney(item.unitPrice)}
                      </td>
                      <td className="py-3.5 px-2 text-right text-slate-900 font-extrabold">
                        {formatMoney(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-80 space-y-2 text-xs border-t border-slate-200 pt-4">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900">{formatMoney(invoice.subtotal)}</span>
                </div>

                {invoice.discountAmount ? (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}:</span>
                    <span className="font-semibold">-{formatMoney(invoice.discountAmount)}</span>
                  </div>
                ) : null}

                {invoice.taxAmount ? (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax / VAT ({invoice.taxRate}%):</span>
                    <span className="font-semibold text-slate-900">+{formatMoney(invoice.taxAmount)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                  <span>Total Amount:</span>
                  <span className="text-lg text-sky-800">{formatMoney(invoice.totalAmount)}</span>
                </div>

                {invoice.paidAmount ? (
                  <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                    <span>Paid to Date:</span>
                    <span>-{formatMoney(invoice.paidAmount)}</span>
                  </div>
                ) : null}

                {(invoice.balanceDue !== undefined && invoice.balanceDue !== invoice.totalAmount) && (
                  <div className="flex justify-between text-base font-black text-rose-600 pt-2 border-t border-dashed border-slate-300">
                    <span>Balance Due:</span>
                    <span>{formatMoney(invoice.balanceDue)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Customizable Payment Link Button Banner */}
            {invoice.paymentButton?.enabled && invoice.paymentButton?.url && invoice.status !== 'paid' && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-teal-500/10 border-2 border-emerald-500/30 text-center space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center justify-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Instant Online Payment
                </div>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {invoice.paymentButton.description || 'Click the secure payment button below to complete your payment with instant instant confirmation:'}
                </p>
                <div className="pt-1">
                  <a
                    href={invoice.paymentButton.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm uppercase tracking-wide shadow-lg shadow-sky-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>{invoice.paymentButton.label || 'Pay Invoice Online Now'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
                <div className="text-[11px] text-slate-400 break-all pt-1">
                  Direct Link: <span className="text-sky-600 underline">{invoice.paymentButton.url}</span>
                </div>
              </div>
            )}

            {/* Bank Transfer & Payment Instructions Section */}
            {(invoice.bankDetails?.bankName || invoice.bankDetails?.accountNumber || invoice.paymentInstructions) && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                <div className="font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-700" />
                  Bank Transfer & Manual Payment Instructions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  {invoice.bankDetails?.bankName && (
                    <div><span className="text-slate-400">Bank Name: </span><strong>{invoice.bankDetails.bankName}</strong></div>
                  )}
                  {invoice.bankDetails?.accountNumber && (
                    <div><span className="text-slate-400">Account Number: </span><strong className="font-mono text-sky-700 text-sm">{invoice.bankDetails.accountNumber}</strong></div>
                  )}
                  {invoice.bankDetails?.accountHolder && (
                    <div><span className="text-slate-400">Account Holder: </span><strong>{invoice.bankDetails.accountHolder}</strong></div>
                  )}
                  {invoice.bankDetails?.swiftCode && (
                    <div><span className="text-slate-400">SWIFT / BIC: </span><strong>{invoice.bankDetails.swiftCode}</strong></div>
                  )}
                  {invoice.bankDetails?.paypalEmail && (
                    <div><span className="text-slate-400">PayPal: </span><strong>{invoice.bankDetails.paypalEmail}</strong></div>
                  )}
                </div>

                {invoice.paymentInstructions && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600 leading-relaxed whitespace-pre-line">
                    {invoice.paymentInstructions}
                  </div>
                )}
              </div>
            )}

            {/* Notes & Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs text-slate-500">
              {invoice.notes && (
                <div className="space-y-1">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Notes:</div>
                  <p className="leading-relaxed whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div className="space-y-1">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Terms & Conditions:</div>
                  <p className="leading-relaxed whitespace-pre-line">{invoice.terms}</p>
                </div>
              )}
            </div>

            {/* Footer Gratitude */}
            <div className="text-center pt-8 border-t border-slate-100 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600">Thank you for your business!</p>
              <p>For questions or assistance regarding this invoice, please reach out to {invoice.tenantEmail || invoice.tenantPhone || 'our support desk'}.</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
