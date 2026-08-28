import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Filter, Printer, Send, MessageSquare, Copy, Check, 
  Trash2, Edit3, Eye, FileText, DollarSign, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, RefreshCw, Download, ExternalLink,
  ArrowUpRight, Building2, User, MoreVertical
} from 'lucide-react';
import { db, collection, getDocs, doc, deleteDoc, query, orderBy, onSnapshot } from '../../../lib/firebase';
import { getActiveTenantId } from '../../../lib/firebase';
import { TenantInvoice } from '../../../types';
import { 
  formatInvoiceAmount, openInvoiceWhatsApp, sendInvoiceEmail, saveTenantInvoice 
} from '../../../lib/invoiceService';
import InvoiceGeneratorModal from './InvoiceGeneratorModal';
import InvoiceViewerModal from './InvoiceViewerModal';

export default function InvoiceManager() {
  const activeTenantId = getActiveTenantId() || 'global';

  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<TenantInvoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<TenantInvoice | null>(null);

  // Copied link toast state per invoice ID
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Subscribe to Firestore `tenant_invoices` collection
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'tenant_invoices'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: TenantInvoice[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        // Tenant Scoping & data validity check
        if (!data.tenantId || data.tenantId === activeTenantId || activeTenantId === 'global') {
          // Only treat as customer invoice if it has items or an invoiceNumber
          if (data.invoiceNumber || (Array.isArray(data.items) && data.items.length > 0)) {
            list.push({ ...data, id: docSnap.id });
          }
        }
      });

      // Sort descending by createdAt or issueDate
      list.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.issueDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.issueDate || 0).getTime();
        return dateB - dateA;
      });

      setInvoices(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching invoices:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTenantId]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Status filter
      if (statusFilter !== 'all' && inv.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = inv.invoiceNumber?.toLowerCase().includes(q);
        const nameMatch = inv.customer?.name?.toLowerCase().includes(q);
        const emailMatch = inv.customer?.email?.toLowerCase().includes(q);
        const companyMatch = inv.customer?.company?.toLowerCase().includes(q);
        const itemsMatch = inv.items?.some(i => i.title?.toLowerCase().includes(q));

        if (!numMatch && !nameMatch && !emailMatch && !companyMatch && !itemsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, statusFilter, searchQuery]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    let totalInvoicedUSD = 0;
    let totalPaidUSD = 0;
    let totalUnpaidUSD = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let overdueCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    invoices.forEach(inv => {
      const total = Number(inv.totalAmount) || 0;
      const paid = Number(inv.paidAmount) || (inv.status === 'paid' ? total : 0);
      const balance = Number(inv.balanceDue ?? (total - paid));

      totalInvoicedUSD += total;
      totalPaidUSD += paid;
      totalUnpaidUSD += balance;

      if (inv.status === 'paid') {
        paidCount++;
      } else if (inv.status === 'overdue' || (inv.dueDate && inv.dueDate < todayStr && inv.status === 'unpaid')) {
        overdueCount++;
        unpaidCount++;
      } else if (inv.status === 'unpaid') {
        unpaidCount++;
      }
    });

    return {
      totalCount: invoices.length,
      totalInvoicedUSD,
      totalPaidUSD,
      totalUnpaidUSD,
      paidCount,
      unpaidCount,
      overdueCount
    };
  }, [invoices]);

  const handleOpenCreate = () => {
    setEditingInvoice(null);
    setIsGeneratorOpen(true);
  };

  const handleOpenEdit = (invoice: TenantInvoice) => {
    setEditingInvoice(invoice);
    setIsGeneratorOpen(true);
    setIsViewerOpen(false);
  };

  const handleOpenView = (invoice: TenantInvoice) => {
    setSelectedInvoice(invoice);
    setIsViewerOpen(true);
  };

  const handleDelete = async (invoice: TenantInvoice) => {
    if (!window.confirm(`Are you sure you want to delete invoice #${invoice.invoiceNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'tenant_invoices', invoice.id));
      setActionNotice({ type: 'success', message: `Invoice #${invoice.invoiceNumber} deleted.` });
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      alert("Failed to delete invoice: " + err.message);
    }
  };

  const handleCopyLink = (invoice: TenantInvoice) => {
    const url = invoice.paymentButton?.url;
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedId(invoice.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSendEmailDirect = async (invoice: TenantInvoice) => {
    if (!invoice.customer?.email) {
      alert("This invoice has no customer email assigned.");
      return;
    }
    setActionNotice({ type: 'success', message: `Sending invoice #${invoice.invoiceNumber} email...` });
    try {
      const res = await sendInvoiceEmail(invoice);
      setActionNotice({ type: 'success', message: res.message || 'Invoice emailed successfully!' });
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to dispatch email' });
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleInvoiceCreated = (newInvoice: TenantInvoice, action?: 'preview' | 'email' | 'whatsapp') => {
    setSelectedInvoice(newInvoice);
    if (action === 'preview') {
      setIsViewerOpen(true);
    } else if (action === 'whatsapp') {
      openInvoiceWhatsApp(newInvoice);
      setIsViewerOpen(true);
    } else if (action === 'email') {
      setIsViewerOpen(true);
      sendInvoiceEmail(newInvoice).then(res => {
        setActionNotice({ type: 'success', message: res.message });
        setTimeout(() => setActionNotice(null), 4000);
      }).catch(err => {
        setActionNotice({ type: 'error', message: err.message });
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> PAID
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3" /> OVERDUE
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
            CANCELLED
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            DRAFT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3" /> UNPAID
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notice Banner */}
      {actionNotice && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{actionNotice.message}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-600" />
            Invoice Generator & Billing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, manage, and dispatch official customer invoices with custom packages and direct payment links
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-600/20 transition transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            + Create New Invoice
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Invoiced</div>
          <div className="text-xl font-black text-slate-900">
            {formatInvoiceAmount(metrics.totalInvoicedUSD, 'USD')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {metrics.totalCount} invoice{metrics.totalCount !== 1 ? 's' : ''} generated
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Paid & Collected</div>
          <div className="text-xl font-black text-emerald-700">
            {formatInvoiceAmount(metrics.totalPaidUSD, 'USD')}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold">
            {metrics.paidCount} paid invoice{metrics.paidCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-black uppercase tracking-wider text-amber-600">Pending Balance</div>
          <div className="text-xl font-black text-amber-700">
            {formatInvoiceAmount(metrics.totalUnpaidUSD, 'USD')}
          </div>
          <div className="text-[11px] text-amber-600 font-bold">
            {metrics.unpaidCount} unpaid invoice{metrics.unpaidCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-black uppercase tracking-wider text-rose-600">Overdue Invoices</div>
          <div className="text-xl font-black text-rose-700">
            {metrics.overdueCount}
          </div>
          <div className="text-[11px] text-rose-500 font-medium">
            Requires follow-up
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by #, client, email, service..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs font-bold">
          {[
            { id: 'all', label: 'All' },
            { id: 'unpaid', label: 'Unpaid / Pending' },
            { id: 'paid', label: 'Paid' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'draft', label: 'Draft' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
            <div className="text-xs font-bold text-slate-500">Loading invoices...</div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No invoices found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters to see more results.'
                : 'Click "+ Create New Invoice" to generate your first client invoice.'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 shadow-sm mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Invoice Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const currency = inv.currency || 'USD';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition group">
                      {/* Invoice Number */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleOpenView(inv)}
                          className="font-extrabold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1"
                        >
                          #{inv.invoiceNumber}
                        </button>
                        <div className="text-[10px] text-slate-400 mt-0.5">Issued: {inv.issueDate}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inv.customer?.name || 'Valued Guest'}</div>
                        {inv.customer?.company && (
                          <div className="text-[11px] text-slate-500 font-medium">{inv.customer.company}</div>
                        )}
                        {inv.customer?.email && (
                          <div className="text-[10px] text-slate-400">{inv.customer.email}</div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="truncate font-medium text-slate-700">
                          {inv.items?.map(i => i.title).join(', ') || 'Custom Services'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {inv.items?.length || 0} line item{inv.items?.length !== 1 ? 's' : ''}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {inv.dueDate}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-slate-900">
                          {formatInvoiceAmount(inv.totalAmount, currency)}
                        </div>
                        {inv.status !== 'paid' && inv.balanceDue !== undefined && inv.balanceDue !== inv.totalAmount && (
                          <div className="text-[10px] text-rose-600 font-bold">
                            Bal: {formatInvoiceAmount(inv.balanceDue, currency)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(inv.status)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View & Print */}
                          <button
                            type="button"
                            onClick={() => handleOpenView(inv)}
                            className="p-1.5 text-slate-500 hover:text-sky-700 rounded-lg hover:bg-sky-50 transition"
                            title="View / Print Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Send WhatsApp */}
                          <button
                            type="button"
                            onClick={() => openInvoiceWhatsApp(inv)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition"
                            title="Send via WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Send Email */}
                          <button
                            type="button"
                            onClick={() => handleSendEmailDirect(inv)}
                            className="p-1.5 text-sky-600 hover:text-sky-800 rounded-lg hover:bg-sky-50 transition"
                            title="Email Invoice to Client"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* Copy Payment Link */}
                          {inv.paymentButton?.url && (
                            <button
                              type="button"
                              onClick={() => handleCopyLink(inv)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                              title="Copy Payment Link"
                            >
                              {copiedId === inv.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(inv)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                            title="Edit Invoice"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(inv)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      <InvoiceGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onInvoiceCreated={handleInvoiceCreated}
        initialInvoice={editingInvoice}
        existingInvoices={invoices}
      />

      <InvoiceViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        invoice={selectedInvoice}
        onEdit={handleOpenEdit}
        onInvoiceUpdated={(updated) => {
          setSelectedInvoice(updated);
          setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
        }}
      />

    </div>
  );
}
