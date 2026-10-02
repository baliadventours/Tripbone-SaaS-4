import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Download, 
  Clock, 
  AlertCircle, 
  FileText, 
  ExternalLink,
  Printer,
  X,
  RefreshCw,
  DollarSign
} from "lucide-react";
import { cn } from "../../lib/utils";
import { db, doc, setDoc, getActiveTenantId, collection, query, where, onSnapshot, getDocs } from "../../lib/firebase";

interface BillingViewProps {
  tenantData: any;
  setTenantData?: React.Dispatch<React.SetStateAction<any>>;
  tours?: any[];
  bookings?: any[];
  tenantInvoices?: any[];
  currentUser?: any;
}

export const BillingView: React.FC<BillingViewProps> = ({ 
  tenantData, 
  setTenantData,
  tours = [],
  bookings = [],
  tenantInvoices = [],
  currentUser
}) => {
  const [invoices, setInvoices] = useState<any[]>(tenantInvoices);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any | null>(null);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<any | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [isUpdatingPlan, setIsUpdatingPlan] = useState<string | null>(null);
  const [isPayingInvoice, setIsPayingInvoice] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeTenantId = getActiveTenantId() || tenantData?.id || tenantData?.slug;

  // Realtime listener for invoices scoped to this workspace
  useEffect(() => {
    if (!activeTenantId) return;

    try {
      const q = query(collection(db, 'invoices'), where('tenantId', '==', activeTenantId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: any[] = [];
        const todayTime = Date.now();
        snapshot.forEach((d) => {
          const data = d.data();
          let st = (data.status || '').toUpperCase();
          const isPaid = st === 'PAID';
          const isLife = data.billingInterval === 'lifetime' || String(data.dueDate || '').toLowerCase().includes('lifetime');
          const dueMs = data.dueDate && !isLife ? new Date(data.dueDate).getTime() : 0;
          const isPastDue = !isPaid && !isLife && (
            st === 'OVERDUE' ||
            (dueMs > 0 && dueMs < todayTime) ||
            (tenantData?.trialEnds && new Date(tenantData.trialEnds).getTime() < todayTime && tenantData.status === 'past_due')
          );

          if (isPastDue && !isPaid) {
            st = 'OVERDUE';
          }

          list.push({ id: d.id, ...data, status: st, isOverdue: isPastDue });
        });
        list.sort((a, b) => new Date(b.createdAt || b.invoiceDate || 0).getTime() - new Date(a.createdAt || a.invoiceDate || 0).getTime());
        setInvoices(list);
      }, (err) => {
        console.warn("Realtime invoices listener note:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Error setting up invoice listener:", e);
    }
  }, [activeTenantId, tenantData?.trialEnds, tenantData?.status]);

  useEffect(() => {
    if (tenantInvoices && tenantInvoices.length > 0 && invoices.length === 0) {
      setInvoices(tenantInvoices);
    }
  }, [tenantInvoices, invoices.length]);

  // Overdue subscription invoices calculation
  const overdueInvoices = useMemo(() => {
    return invoices.filter(inv => inv.isOverdue || (inv.status || '').toUpperCase() === 'OVERDUE');
  }, [invoices]);

  // Sync billing cycle with tenantData if lifetime
  useEffect(() => {
    if (tenantData?.billingInterval === 'lifetime' || (tenantData?.plan || '').toLowerCase().includes('lifetime')) {
      setBillingCycle('lifetime');
    } else if (tenantData?.billingInterval === 'yearly') {
      setBillingCycle('yearly');
    }
  }, [tenantData?.billingInterval, tenantData?.plan]);

  // Auto-generate invoice if missing for this workspace
  useEffect(() => {
    if (!activeTenantId || invoices.length > 0) return;

    const autoGenerateInvoice = async () => {
      try {
        setIsGeneratingInvoice(true);
        const res = await fetch('/api/tenant/generate-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: activeTenantId,
            companyName: tenantData?.companyName || 'Operator Workspace',
            plan: tenantData?.plan || 'starter',
            billingInterval: tenantData?.billingInterval || 'monthly',
            trialEnds: tenantData?.trialEnds
          })
        });
        const data = await res.json();
        if (data.success && data.invoice) {
          setInvoices([data.invoice]);
        }
      } catch (err) {
        console.warn("Auto-generate invoice notice:", err);
      } finally {
        setIsGeneratingInvoice(false);
      }
    };

    autoGenerateInvoice();
  }, [activeTenantId, invoices.length, tenantData?.companyName, tenantData?.plan, tenantData?.billingInterval, tenantData?.trialEnds]);

  // Quotas calculations
  const currentPlanStr = (tenantData?.plan || 'starter').toLowerCase();
  const isLifetime = tenantData?.billingInterval === 'lifetime' || currentPlanStr.includes('lifetime');

  const tourQuota = isLifetime || currentPlanStr.includes('enterprise')
    ? 999999
    : currentPlanStr.includes('business') 
    ? 100 
    : currentPlanStr.includes('professional') 
    ? 50 
    : 10;

  const bookingQuota = isLifetime || currentPlanStr.includes('enterprise')
    ? 999999
    : currentPlanStr.includes('business') 
    ? 2000 
    : currentPlanStr.includes('professional') 
    ? 500 
    : 100;

  const tourPercent = tourQuota >= 999999 ? 5 : Math.min(100, Math.round((tours.length / tourQuota) * 100));
  const bookingPercent = bookingQuota >= 999999 ? 5 : Math.min(100, Math.round((bookings.length / bookingQuota) * 100));

  // Trial status info
  const isTrial = tenantData?.status === 'trial' || !!tenantData?.trialEnds;
  const trialEndsFormatted = tenantData?.trialEnds 
    ? new Date(tenantData.trialEnds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'In 7 Days';

  const daysRemaining = tenantData?.trialEnds
    ? Math.max(0, Math.ceil((new Date(tenantData.trialEnds).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 7;

  // Plan pricing tiers
  const pricingPlans = [
    {
      id: 'starter',
      name: 'Starter Plan',
      monthlyPrice: 49,
      yearlyPrice: 39,
      lifetimePrice: 499,
      desc: 'Up to 10 active tours, 100 monthly bookings & core booking widgets',
      features: ['10 Active Tours', '100 Bookings / mo', 'Standard Checkout', 'Email Alerts']
    },
    {
      id: 'professional',
      name: 'Professional Plan',
      monthlyPrice: 99,
      yearlyPrice: 79,
      lifetimePrice: 999,
      desc: 'Up to 50 tours, 500 bookings & AI guest travel assistant',
      features: ['50 Active Tours', '500 Bookings / mo', 'AI Tour Generator', 'WhatsApp Notifications', 'Multi-Language']
    },
    {
      id: 'business',
      name: 'Business Plan',
      monthlyPrice: 199,
      yearlyPrice: 159,
      lifetimePrice: 1999,
      desc: 'Up to 100 tours, 2,000 bookings, custom payments & multi-currency',
      features: ['100 Active Tours', '2,000 Bookings / mo', 'Multi-Gateway BYOPG', 'Channel Manager Sync', 'Custom Domain']
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      monthlyPrice: 499,
      yearlyPrice: 399,
      lifetimePrice: 3999,
      desc: 'Unlimited tours, unlimited bookings, dedicated support & developer APIs',
      features: ['Unlimited Tours', 'Unlimited Bookings', 'Dedicated Support', 'Webhooks & REST APIs', 'White-Label Branding']
    }
  ];

  // Handle plan update (upgrade / downgrade)
  const handleUpdatePlan = async (pkg: any) => {
    if (!activeTenantId) {
      setNotification({ type: 'error', message: 'Tenant ID not found.' });
      return;
    }

    setIsUpdatingPlan(pkg.id);
    setNotification(null);

    const chosenInterval = billingCycle;
    const planSlug = pkg.id;

    try {
      // 1. Direct Firestore update
      try {
        await setDoc(doc(db, 'tenants', activeTenantId), {
          plan: planSlug,
          billingInterval: chosenInterval,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (firestoreErr: any) {
        console.warn("Direct Firestore setDoc warning (falling back to server API):", firestoreErr.message);
      }

      // 2. Server API fallback route to guarantee persistence and invoice alignment
      const res = await fetch('/api/tenant/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          plan: planSlug,
          billingInterval: chosenInterval
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to update plan via server.');
      }

      // 3. Update local state
      if (setTenantData) {
        setTenantData((prev: any) => ({
          ...prev,
          plan: planSlug,
          billingInterval: chosenInterval
        }));
      }

      // 4. Refresh invoices list & synchronize any unpaid invoices in Firestore
      const newPlanAmt = chosenInterval === 'lifetime' 
        ? `$${pkg.lifetimePrice || 499}.00`
        : chosenInterval === 'yearly' 
        ? `$${pkg.yearlyPrice * 12}.00`
        : `$${pkg.monthlyPrice}.00`;

      for (const inv of invoices) {
        if (inv.status !== 'PAID') {
          try {
            await setDoc(doc(db, 'invoices', inv.id), {
              plan: `${pkg.name} (${chosenInterval.toUpperCase()})`,
              billingInterval: chosenInterval,
              amount: newPlanAmt,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (syncErr) {
            console.warn("Direct Firestore invoice update warning:", syncErr);
          }
        }
      }

      setInvoices((prev) => 
        prev.map(inv => inv.status !== 'PAID' ? {
          ...inv,
          plan: `${pkg.name} (${chosenInterval.toUpperCase()})`,
          amount: newPlanAmt
        } : inv)
      );

      setNotification({ 
        type: 'success', 
        message: `🎉 Successfully updated subscription plan to ${pkg.name} (${chosenInterval.toUpperCase()})!` 
      });
    } catch (err: any) {
      console.error(err);
      setNotification({ 
        type: 'error', 
        message: `Failed to update plan: ${err.message || 'Please check your permissions.'}` 
      });
    } finally {
      setIsUpdatingPlan(null);
    }
  };

  // Handle invoice payment
  const handlePayInvoice = async (invoice: any, method: string = 'Instant Card Checkout') => {
    if (!activeTenantId || !invoice) return;
    setIsPayingInvoice(true);
    setNotification(null);

    const nowIso = new Date().toISOString();
    const paidAmt = invoice.amount || '$0.00';

    try {
      // 1. Direct Firestore write
      try {
        await setDoc(doc(db, 'invoices', invoice.id), {
          status: 'PAID',
          paidAt: nowIso,
          paidAmount: paidAmt,
          balanceDue: '$0.00',
          paymentMethod: method,
          updatedAt: nowIso
        }, { merge: true });

        await setDoc(doc(db, 'tenants', activeTenantId), {
          status: 'active',
          manualPaymentPending: false,
          subscriptionStatus: 'active',
          trialEnds: 'Subscription Active',
          updatedAt: nowIso
        }, { merge: true });
      } catch (fsErr: any) {
        console.warn("Direct Firestore pay update warning (using server API):", fsErr.message);
      }

      // 2. Call server payment verification API
      const res = await fetch('/api/tenant/pay-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          invoiceId: invoice.id,
          paymentMethod: method,
          amount: paidAmt
        })
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Server payment confirmation failed');
      }

      // 3. Update local invoice state
      setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { 
        ...inv, 
        status: 'PAID', 
        paidAmount: paidAmt,
        balanceDue: '$0.00',
        isOverdue: false,
        paymentMethod: method 
      } : inv));
      
      if (setTenantData) {
        setTenantData((prev: any) => ({
          ...prev,
          status: 'active',
          manualPaymentPending: false
        }));
      }

      setSelectedInvoiceForPayment(null);
      setNotification({
        type: 'success',
        message: `🎉 Invoice ${invoice.no || invoice.id} paid successfully! Your workspace subscription is now FULLY ACTIVE.`
      });
    } catch (err: any) {
      console.error("Payment error:", err);
      setNotification({
        type: 'error',
        message: `Payment processing error: ${err.message}`
      });
    } finally {
      setIsPayingInvoice(false);
    }
  };

  // Generate missing invoice manually
  const handleManualGenerateInvoice = async () => {
    if (!activeTenantId) return;
    setIsGeneratingInvoice(true);
    try {
      const res = await fetch('/api/tenant/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          companyName: tenantData?.companyName || 'Operator Workspace',
          plan: tenantData?.plan || 'business',
          billingInterval: tenantData?.billingInterval || 'lifetime',
          trialEnds: tenantData?.trialEnds
        })
      });
      const data = await res.json();
      if (data.success && data.invoice) {
        setInvoices([data.invoice, ...invoices]);
        setNotification({
          type: 'success',
          message: `✅ Subscription invoice ${data.invoice.no} generated successfully!`
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: `Invoice generation failed: ${err.message}` });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  return (
    <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Billing & Subscription</h2>
          <p className="text-gray-500 font-medium tracking-tight">Manage your platform workspace tier, billing details, and active quotas.</p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-3">
          {isTrial ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-2xl text-xs font-bold">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Trial Period: {daysRemaining} days left ({trialEndsFormatted})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Active Subscription ({tenantData?.plan?.toUpperCase() || 'BUSINESS'})</span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={cn(
          "p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-bold shadow-sm transition-all",
          notification.type === 'success' 
            ? "bg-emerald-50 border border-emerald-200 text-emerald-900" 
            : "bg-rose-50 border border-rose-200 text-rose-900"
        )}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overdue Invoice Alert Banner */}
      {overdueInvoices.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500/15 via-red-500/10 to-rose-500/5 border-2 border-rose-500/40 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xs animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xs">
                <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                <span>Overdue Subscription Invoice</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                Payment Past Due: Settle Invoice #{overdueInvoices[0]?.no || overdueInvoices[0]?.id}
              </h3>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                Your workspace subscription invoice for <strong className="text-rose-700 font-black">{overdueInvoices[0]?.amount}</strong> was due on <strong>{overdueInvoices[0]?.dueDate}</strong>. 
                Please complete payment now to prevent automated booking engine interruption and account suspension.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSelectedInvoiceForPayment(overdueInvoices[0])}
                className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-rose-600/25 transition-all cursor-pointer animate-bounce"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Overdue Invoice ({overdueInvoices[0]?.amount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trial Banner with Urgent Call to Pay Invoice */}
      {isTrial && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-2 border-amber-400/40 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Invoice Ready Before Trial Ends</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                Your Workspace Subscription Invoice Is Payable Today
              </h3>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                Your <strong>7-Day Free Trial</strong> is active until <strong>{trialEndsFormatted}</strong> ({daysRemaining} days remaining). 
                To ensure uninterrupted booking automation, domain uptime, and AI tools, your subscription invoice is listed below and can be paid at any time before your trial expires.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {invoices.length > 0 && invoices.some(i => i.status !== 'PAID') && (
                <button
                  onClick={() => setSelectedInvoiceForPayment(invoices.find(i => i.status !== 'PAID'))}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Subscription Invoice</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quota Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Tours Quota */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Tours</span>
            <span className="text-xs font-black text-primary bg-orange-50 px-2 py-1 rounded-md">
              {tourQuota >= 999999 ? 'Unlimited' : `${tourPercent}% Used`}
            </span>
          </div>
          <p className="text-3xl font-black text-gray-900">
            {tours.length} <span className="text-lg font-bold text-gray-400">/ {tourQuota >= 999999 ? 'Unlimited' : `${tourQuota} tours`}</span>
          </p>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-500" 
              style={{ width: `${tourQuota >= 999999 ? 10 : tourPercent}%` }} 
            />
          </div>
        </div>

        {/* Monthly Bookings Quota */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Bookings</span>
            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              {bookingQuota >= 999999 ? 'Unlimited' : `${bookingPercent}% Used`}
            </span>
          </div>
          <p className="text-3xl font-black text-gray-900">
            {bookings.length} <span className="text-lg font-bold text-gray-400">/ {bookingQuota >= 999999 ? 'Unlimited' : `${bookingQuota} bookings`}</span>
          </p>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${bookingQuota >= 999999 ? 10 : bookingPercent}%` }} 
            />
          </div>
        </div>

        {/* Developer Webhooks & API */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Webhook & API Quota</span>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">100% Active</span>
          </div>
          <p className="text-3xl font-black text-gray-900">
            BYOPG <span className="text-lg font-bold text-gray-400">/ Multi-Gateway</span>
          </p>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoices & Payment History */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-gray-900 text-lg tracking-tight">Subscription Invoices</h3>
                <p className="text-xs text-gray-400 font-medium">Payable before trial concludes to avoid suspension</p>
              </div>

              <div className="flex items-center gap-2">
                {invoices.length === 0 && (
                  <button
                    onClick={handleManualGenerateInvoice}
                    disabled={isGeneratingInvoice}
                    className="text-xs font-black bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isGeneratingInvoice && "animate-spin")} />
                    <span>Generate Invoice</span>
                  </button>
                )}
                <span className="text-[11px] font-black text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                  {invoices.length} {invoices.length === 1 ? 'Invoice' : 'Invoices'}
                </span>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/50">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Plan & Period</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="font-medium text-xs">Generating your trial subscription invoice...</p>
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => {
                      const isPaid = inv.status === 'PAID' || inv.status === 'Paid';
                      const isPending = inv.status === 'PENDING';
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-4 px-4 font-black text-gray-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span>{inv.no || inv.id}</span>
                          </td>
                          <td className="py-4 px-4 font-bold text-gray-700">
                            <div>{inv.plan || tenantData?.plan?.toUpperCase() || 'Business Plan'}</div>
                            <div className="text-[10px] text-gray-400 font-medium">{inv.invoiceDate || inv.date || 'Today'}</div>
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-gray-600">
                            {inv.dueDate || (isTrial ? `Trial Ends ${trialEndsFormatted}` : 'Lifetime Access')}
                          </td>
                          <td className="py-4 px-4 font-black text-gray-900 text-sm">
                            {inv.amount || inv.amt || '$1,999.00'}
                          </td>
                          <td className="py-4 px-4">
                            {isPaid ? (
                              <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Paid</span>
                              </span>
                            ) : (inv.isOverdue || (inv.status || '').toUpperCase() === 'OVERDUE') ? (
                              <span className="bg-rose-50 border border-rose-300 text-rose-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md inline-flex items-center gap-1 shadow-2xs">
                                <AlertCircle className="w-3 h-3 text-rose-600 animate-pulse" />
                                <span>Overdue</span>
                              </span>
                            ) : (
                              <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Payable</span>
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isPaid && (
                                <button
                                  onClick={() => setSelectedInvoiceForPayment(inv)}
                                  className={cn(
                                    "font-black text-[11px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all cursor-pointer",
                                    (inv.isOverdue || (inv.status || '').toUpperCase() === 'OVERDUE')
                                      ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
                                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                  )}
                                  title={(inv.isOverdue || (inv.status || '').toUpperCase() === 'OVERDUE') ? "Pay Overdue Invoice" : "Pay Subscription Invoice"}
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>{(inv.isOverdue || (inv.status || '').toUpperCase() === 'OVERDUE') ? 'Pay Overdue' : 'Pay Now'}</span>
                                </button>
                              )}
                              <button 
                                onClick={() => setSelectedInvoiceForView(inv)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
                                title="View & Download Invoice Receipt"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pricing Cards (Upgrade & Downgrade Plans) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-lg tracking-tight">Upgrade / Change Tier</h3>
            
            {/* Interval Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-[10px] font-black uppercase">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all",
                  billingCycle === 'monthly' ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                )}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all",
                  billingCycle === 'yearly' ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                )}
              >
                Yearly (-20%)
              </button>
              <button 
                onClick={() => setBillingCycle('lifetime')}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all",
                  billingCycle === 'lifetime' ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                )}
              >
                Lifetime
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {pricingPlans.map((pkg) => {
              const isCurrent = currentPlanStr.includes(pkg.id) && (
                billingCycle === 'lifetime' 
                  ? isLifetime 
                  : !isLifetime
              );

              const priceDisplay = billingCycle === 'lifetime'
                ? `$${pkg.lifetimePrice || 1999}`
                : billingCycle === 'yearly'
                ? `$${pkg.yearlyPrice}`
                : `$${pkg.monthlyPrice}`;

              const periodDisplay = billingCycle === 'lifetime' ? ' / lifetime' : billingCycle === 'yearly' ? ' / mo (billed yearly)' : ' / month';

              return (
                <div 
                  key={pkg.id} 
                  className={cn(
                    "bg-white rounded-2xl p-5 md:p-6 relative overflow-hidden space-y-3 border transition-all",
                    isCurrent ? "border-2 border-orange-500 shadow-md ring-2 ring-orange-500/10" : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  {isCurrent && (
                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-xs">
                      Current Plan
                    </div>
                  )}

                  <div>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", isCurrent ? "text-primary" : "text-gray-400")}>
                      {pkg.name}
                    </p>
                    <h4 className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">
                      {priceDisplay}
                      <span className="text-xs font-medium text-gray-400">{periodDisplay}</span>
                    </h4>
                  </div>

                  <p className="text-xs text-gray-500 font-bold">{pkg.desc}</p>

                  <div className="pt-1">
                    <button 
                      disabled={isCurrent || isUpdatingPlan === pkg.id}
                      onClick={() => handleUpdatePlan(pkg)}
                      className={cn(
                        "w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        isCurrent 
                          ? "bg-orange-50 text-primary cursor-default" 
                          : "bg-gray-900 hover:bg-black text-white cursor-pointer shadow-sm hover:shadow"
                      )}
                    >
                      {isUpdatingPlan === pkg.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Updating Plan...</span>
                        </>
                      ) : isCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Active Tier</span>
                        </>
                      ) : (
                        <span>Select {pkg.name}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Pay Invoice */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">Pay Subscription Invoice</h3>
                  <p className="text-xs text-gray-400 font-medium">Invoice #{selectedInvoiceForPayment.no || selectedInvoiceForPayment.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice Summary Box */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Plan & Workspace:</span>
                <span className="font-black text-gray-800">{selectedInvoiceForPayment.plan || tenantData?.plan}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Due Date:</span>
                <span className="font-bold text-amber-600">{selectedInvoiceForPayment.dueDate || trialEndsFormatted}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Company:</span>
                <span className="font-black text-gray-800">{tenantData?.companyName || 'Operator Workspace'}</span>
              </div>
              <div className="border-t border-gray-200/60 pt-3 flex justify-between items-center">
                <span className="text-sm font-black text-gray-900">Total Payable:</span>
                <span className="text-2xl font-black text-emerald-600">{selectedInvoiceForPayment.amount || '$1,999.00'}</span>
              </div>
            </div>

            {/* Payment Actions */}
            <div className="space-y-3">
              <button
                disabled={isPayingInvoice}
                onClick={() => handlePayInvoice(selectedInvoiceForPayment, 'Instant Card / Sandbox')}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer"
              >
                {isPayingInvoice ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-emerald-200" />
                    <span>Instant Payment & Activate Workspace</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const checkoutUrl = `/api/billing/mock-checkout?productId=${encodeURIComponent(tenantData?.plan || 'business')}&tenantId=${encodeURIComponent(activeTenantId)}&billingInterval=${encodeURIComponent(tenantData?.billingInterval || 'lifetime')}`;
                  window.location.href = checkoutUrl;
                }}
                className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Pay via Creem / Online Card Gateway</span>
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center font-medium">
              🔒 256-bit encrypted transaction. Payment is securely reflected in your tenant ledger instantly.
            </p>
          </div>
        </div>
      )}

      {/* Modal: View & Download Invoice Receipt */}
      {selectedInvoiceForView && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header with print button */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-black text-gray-900 text-lg">Official Subscription Invoice</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button 
                  onClick={() => setSelectedInvoiceForView(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div className="border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6 bg-slate-50/50">
              {/* Branding and Invoice No */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Tripbone SaaS Platform</h2>
                  <p className="text-xs text-gray-500 font-medium">Enterprise Tour Operator & Booking OS</p>
                  <p className="text-xs text-gray-400 mt-1">support@tripbone.com</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-gray-900">
                    {selectedInvoiceForView.no || selectedInvoiceForView.id}
                  </div>
                  <div className="text-xs text-gray-500 font-bold mt-1">
                    Date: {selectedInvoiceForView.invoiceDate || 'Today'}
                  </div>
                  <div className={cn(
                    "mt-2 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    selectedInvoiceForView.status === 'PAID' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  )}>
                    {selectedInvoiceForView.status || 'UNPAID'}
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="border-t border-gray-200/60 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Billed To:</p>
                  <h4 className="font-black text-gray-900 text-sm mt-0.5">{tenantData?.companyName || 'Operator Workspace'}</h4>
                  <p className="text-xs text-gray-600 font-medium">{tenantData?.adminEmail || tenantData?.email || currentUser?.email || 'operator@workspace.com'}</p>
                  <p className="text-xs text-gray-500 font-medium">{tenantData?.address || tenantData?.country || 'Global Workspace'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date:</p>
                  <p className="text-xs font-bold text-gray-800 mt-0.5">{selectedInvoiceForView.dueDate || trialEndsFormatted}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Payment Method:</p>
                  <p className="text-xs font-bold text-gray-800">{selectedInvoiceForView.paymentMethod || 'Online Credit Card / Sandbox'}</p>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t border-gray-200/60 pt-4">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 font-black text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    <tr>
                      <td className="py-3">
                        <span className="font-bold text-gray-900 block">{selectedInvoiceForView.plan || 'Business Plan'}</span>
                        <span className="text-[11px] text-gray-500">Includes Multi-Gateway BYOPG, Channel Manager, AI Tour Planner & Booking Suite</span>
                      </td>
                      <td className="py-3 text-center">1</td>
                      <td className="py-3 text-right font-black text-gray-900">{selectedInvoiceForView.amount || '$1,999.00'}</td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t border-gray-200 font-bold">
                    <tr>
                      <td colSpan={2} className="pt-3 text-gray-500">Subtotal</td>
                      <td className="pt-3 text-right text-gray-900 font-black">{selectedInvoiceForView.amount || '$1,999.00'}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="pt-1 text-gray-500">Taxes & Processing Fees (Included)</td>
                      <td className="pt-1 text-right text-gray-900">$0.00</td>
                    </tr>
                    <tr className="text-base font-black text-gray-900">
                      <td colSpan={2} className="pt-3">Total Amount</td>
                      <td className="pt-3 text-right text-emerald-600">{selectedInvoiceForView.amount || '$1,999.00'}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              {selectedInvoiceForView.status !== 'PAID' && (
                <button
                  onClick={() => {
                    setSelectedInvoiceForPayment(selectedInvoiceForView);
                    setSelectedInvoiceForView(null);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Invoice Now</span>
                </button>
              )}
              <button
                onClick={() => setSelectedInvoiceForView(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
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

export default BillingView;
