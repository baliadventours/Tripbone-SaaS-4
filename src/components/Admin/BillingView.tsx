import React, { useState, useEffect, useMemo } from "react";
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
  DollarSign,
  ChevronRight,
  TrendingUp,
  Receipt,
  Search,
  Filter,
  Eye
} from "lucide-react";
import { cn } from "../../lib/utils";
import { db, doc, setDoc, getActiveTenantId, collection, onSnapshot } from "../../lib/firebase";
import { generateInvoiceNumber } from "../../lib/planUtils";

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
  const [isCancelling, setIsCancelling] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'OVERDUE'>('ALL');

  const activeTenantId = getActiveTenantId() || tenantData?.id || tenantData?.slug || tenantData?.tenantId || '';

  // All potential tenant ID identifiers to ensure 100% data discovery
  const candidateTenantIds = useMemo(() => {
    const ids = new Set<string>();
    if (activeTenantId) {
      ids.add(String(activeTenantId));
      ids.add(String(activeTenantId).replace(/^tenant_/, ''));
      if (!String(activeTenantId).startsWith('tenant_')) {
        ids.add(`tenant_${activeTenantId}`);
      }
    }
    if (tenantData?.id) {
      ids.add(String(tenantData.id));
      ids.add(String(tenantData.id).replace(/^tenant_/, ''));
      if (!String(tenantData.id).startsWith('tenant_')) {
        ids.add(`tenant_${tenantData.id}`);
      }
    }
    if (tenantData?.slug) {
      ids.add(String(tenantData.slug));
      ids.add(`tenant_${tenantData.slug}`);
    }
    if (tenantData?.tenantId) {
      ids.add(String(tenantData.tenantId));
      ids.add(`tenant_${tenantData.tenantId}`);
    }
    return Array.from(ids).filter(Boolean);
  }, [activeTenantId, tenantData?.id, tenantData?.slug, tenantData?.tenantId]);

  // Realtime listener for invoices matching any workspace tenant identifier
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, 'invoices'), (snapshot) => {
        const list: any[] = [];
        const todayTime = Date.now();
        const compName = (tenantData?.companyName || '').toLowerCase().trim();

        snapshot.forEach((d) => {
          const data = d.data();
          const docId = d.id;
          const invoiceTenantId = data.tenantId || data.tenant || data.tenant_id;
          const invoiceTenantName = (data.tenantName || '').toLowerCase().trim();

          const matchesTenant = candidateTenantIds.length === 0 || 
            candidateTenantIds.includes(invoiceTenantId) ||
            candidateTenantIds.some(cid => docId.startsWith(cid + '_') || docId === cid) ||
            (compName && invoiceTenantName && compName === invoiceTenantName);

          if (!matchesTenant) return;

          let st = (data.status || '').toUpperCase();
          const isPaid = st === 'PAID';
          const isLife = data.billingInterval === 'lifetime' || String(data.dueDate || '').toLowerCase().includes('lifetime');
          const dueMs = data.dueDate && !isLife && data.dueDate !== 'Lifetime Access' ? new Date(data.dueDate).getTime() : 0;
          const isPastDue = !isPaid && !isLife && (
            st === 'OVERDUE' ||
            (dueMs > 0 && dueMs < todayTime) ||
            (tenantData?.trialEnds && new Date(tenantData.trialEnds).getTime() < todayTime && tenantData.status === 'past_due')
          );

          if (isPastDue && !isPaid) {
            st = 'OVERDUE';
          } else if (!st || st === 'PENDING') {
            st = 'UNPAID';
          }

          const computedNo = (data.no && /\d/.test(data.no))
            ? (data.no.startsWith('INV-') ? data.no : `INV-${data.no}`)
            : generateInvoiceNumber(data, invoiceTenantId || docId);

          list.push({ 
            id: docId, 
            ...data, 
            status: st, 
            isOverdue: isPastDue,
            no: computedNo,
            amount: data.amount || (data.price ? `$${data.price}.00` : '$49.00')
          });
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
  }, [candidateTenantIds, tenantData?.trialEnds, tenantData?.status, tenantData?.companyName]);

  // Initial synchronization fallback from prop
  useEffect(() => {
    if (tenantInvoices && tenantInvoices.length > 0 && invoices.length === 0) {
      setInvoices(tenantInvoices);
    }
  }, [tenantInvoices, invoices.length]);

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

  // Sync billing cycle with tenantData
  useEffect(() => {
    if (tenantData?.billingInterval === 'lifetime' || (tenantData?.plan || '').toLowerCase().includes('lifetime')) {
      setBillingCycle('lifetime');
    } else if (tenantData?.billingInterval === 'yearly') {
      setBillingCycle('yearly');
    }
  }, [tenantData?.billingInterval, tenantData?.plan]);

  // Auto-generate invoice in Firestore + API if missing for this workspace
  useEffect(() => {
    if (!activeTenantId || invoices.length > 0) return;

    const autoGenerateInvoice = async () => {
      try {
        setIsGeneratingInvoice(true);
        const resolvedTenantId = activeTenantId.startsWith('tenant_') ? activeTenantId : `tenant_${activeTenantId}`;
        const effInterval = tenantData?.billingInterval || 'monthly';
        const effPlan = (tenantData?.plan || 'starter').toLowerCase();
        const planObj = pricingPlans.find(p => p.id === effPlan) || pricingPlans[0];
        const planPrice = effInterval === 'lifetime' ? planObj.lifetimePrice : effInterval === 'yearly' ? planObj.yearlyPrice * 12 : planObj.monthlyPrice;
        const dueStr = effInterval === 'lifetime' ? 'Lifetime Access' : tenantData?.trialEnds ? new Date(tenantData.trialEnds).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const generatedNo = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
        const initialDocId = `${resolvedTenantId}_${generatedNo}`;

        const initialInvData = {
          id: initialDocId,
          tenantId: resolvedTenantId,
          tenantName: tenantData?.companyName || 'Operator Workspace',
          no: generatedNo,
          invoiceDate: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
          dueDate: dueStr,
          amount: `$${planPrice}.00`,
          status: 'UNPAID',
          plan: `${planObj.name} (${effInterval.toUpperCase()})`,
          billingInterval: effInterval,
          paymentMethod: 'Card / Sandbox Gate',
          createdAt: new Date().toISOString()
        };

        // Write directly to Firestore for instant reactive appearance
        try {
          await setDoc(doc(db, 'invoices', initialDocId), initialInvData, { merge: true });
          setInvoices([initialInvData]);
        } catch (fsErr) {
          console.warn("Direct Firestore invoice seed warning:", fsErr);
        }

        // Call server API for persistent backend synchronization
        const res = await fetch('/api/tenant/generate-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: resolvedTenantId,
            companyName: tenantData?.companyName || 'Operator Workspace',
            plan: effPlan,
            billingInterval: effInterval,
            trialEnds: tenantData?.trialEnds
          })
        });
        const data = await res.json();
        if (data.success && data.invoice) {
          setInvoices(prev => prev.some(i => i.id === data.invoice.id) ? prev : [data.invoice, ...prev]);
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

  // Active / Primary Invoice Resolution
  const activeInvoice = useMemo(() => {
    // 1. Highest priority: Overdue invoice
    const overdue = invoices.find(inv => inv.isOverdue || (inv.status || '').toUpperCase() === 'OVERDUE');
    if (overdue) return overdue;

    // 2. Second priority: Unpaid subscription invoice
    const unpaid = invoices.find(inv => (inv.status || '').toUpperCase() === 'UNPAID');
    if (unpaid) return unpaid;

    // 3. Third priority: Most recent paid invoice
    if (invoices.length > 0) return invoices[0];

    // 4. Fallback synthetic invoice if none yet generated
    const effInterval = tenantData?.billingInterval || 'monthly';
    const effPlan = (tenantData?.plan || 'starter').toLowerCase();
    const planObj = pricingPlans.find(p => p.id === effPlan) || pricingPlans[0];
    const planPrice = effInterval === 'lifetime' ? planObj.lifetimePrice : effInterval === 'yearly' ? planObj.yearlyPrice * 12 : planObj.monthlyPrice;

    return {
      id: `${activeTenantId || 'tenant'}_INV-1001`,
      no: 'INV-1001',
      plan: `${planObj.name} (${effInterval.toUpperCase()})`,
      billingInterval: effInterval,
      amount: `$${planPrice}.00`,
      status: isTrial ? 'UNPAID' : 'PAID',
      dueDate: isLifetime ? 'Lifetime Access' : (tenantData?.trialEnds ? new Date(tenantData.trialEnds).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'In 7 Days'),
      invoiceDate: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      paymentMethod: 'Card / Sandbox Gate',
      isOverdue: false
    };
  }, [invoices, tenantData, activeTenantId, isTrial, isLifetime, pricingPlans]);

  // Overdue subscription invoices
  const overdueInvoices = useMemo(() => {
    return invoices.filter(inv => inv.isOverdue || (inv.status || '').toUpperCase() === 'OVERDUE');
  }, [invoices]);

  // Invoices list for history table (fallback to activeInvoice if list is empty)
  const displayInvoices = useMemo(() => {
    if (invoices.length > 0) return invoices;
    if (activeInvoice) return [activeInvoice];
    return [];
  }, [invoices, activeInvoice]);

  // Filtered invoices for history table
  const filteredInvoices = useMemo(() => {
    return displayInvoices.filter(inv => {
      const matchSearch = !invoiceSearchQuery.trim() || 
        (inv.no || '').toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
        (inv.plan || '').toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
        (inv.amount || '').toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
        (inv.dueDate || '').toLowerCase().includes(invoiceSearchQuery.toLowerCase());

      const st = (inv.status || '').toUpperCase();
      const isPaid = st === 'PAID';
      const isOverdue = inv.isOverdue || st === 'OVERDUE';
      const isUnpaid = !isPaid && !isOverdue;

      if (statusFilter === 'PAID') return matchSearch && isPaid;
      if (statusFilter === 'OVERDUE') return matchSearch && isOverdue;
      if (statusFilter === 'UNPAID') return matchSearch && isUnpaid;
      return matchSearch;
    });
  }, [displayInvoices, invoiceSearchQuery, statusFilter]);

  // Handle plan update (upgrade / downgrade)
  const handleUpdatePlan = async (pkg: any) => {
    if (!activeTenantId) {
      setNotification({ type: 'error', message: 'Tenant workspace identifier not found.' });
      return;
    }

    setIsUpdatingPlan(pkg.id);
    setNotification(null);

    const chosenInterval = billingCycle;
    const planSlug = pkg.id;

    try {
      const resolvedTenantId = activeTenantId.startsWith('tenant_') ? activeTenantId : `tenant_${activeTenantId}`;

      // 1. Direct Firestore update
      try {
        await setDoc(doc(db, 'tenants', resolvedTenantId), {
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
          tenantId: resolvedTenantId,
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
    const resolvedTenantId = activeTenantId.startsWith('tenant_') ? activeTenantId : `tenant_${activeTenantId}`;

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

        await setDoc(doc(db, 'tenants', resolvedTenantId), {
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
          tenantId: resolvedTenantId,
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
      const resolvedTenantId = activeTenantId.startsWith('tenant_') ? activeTenantId : `tenant_${activeTenantId}`;
      const res = await fetch('/api/tenant/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: resolvedTenantId,
          companyName: tenantData?.companyName || 'Operator Workspace',
          plan: tenantData?.plan || 'starter',
          billingInterval: tenantData?.billingInterval || 'monthly',
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

  // Handle cancel / pause subscription
  const handleCancelSubscription = async () => {
    if (!activeTenantId) return;
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel your package subscription? Your workspace will remain accessible until the end of your current billing period."
    );
    if (!confirmCancel) return;

    setIsCancelling(true);
    try {
      const resolvedTenantId = activeTenantId.startsWith('tenant_') ? activeTenantId : `tenant_${activeTenantId}`;
      await setDoc(doc(db, 'tenants', resolvedTenantId), {
        subscriptionStatus: 'cancelled',
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (setTenantData) {
        setTenantData((prev: any) => ({
          ...prev,
          subscriptionStatus: 'cancelled',
          status: 'cancelled'
        }));
      }

      setNotification({
        type: 'success',
        message: 'Subscription has been cancelled. Your workspace remains active until the end of the current billing cycle.'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Failed to cancel subscription: ${err.message}`
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const currentPlanObj = pricingPlans.find(p => p.id === currentPlanStr) || pricingPlans[0];
  const isCurrentPlanActivePaid = activeInvoice?.status === 'PAID' && !isTrial;

  return (
    <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
      {/* ========================================================================= */}
      {/* 1. HEADER & STATUS */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Billing & Subscription</h2>
          <p className="text-gray-500 font-medium tracking-tight">
            Manage your active package tier, payable invoices, and official payment history.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-3">
          {isTrial ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-2xl text-xs font-bold shadow-xs">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Trial Period: {daysRemaining} days remaining ({trialEndsFormatted})</span>
            </div>
          ) : isCurrentPlanActivePaid ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Active Package ({tenantData?.plan?.toUpperCase() || 'STARTER'})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2 rounded-2xl text-xs font-bold shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>Payment Pending ({tenantData?.plan?.toUpperCase() || 'STARTER'})</span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={cn(
          "p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-bold shadow-sm transition-all animate-in fade-in",
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
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overdue Urgent Alert Banner */}
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
                Please complete payment now to ensure uninterrupted booking automation and avoid account suspension.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSelectedInvoiceForPayment(overdueInvoices[0])}
                className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-rose-600/25 transition-all cursor-pointer animate-pulse"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Overdue Invoice ({overdueInvoices[0]?.amount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SECTION 1: ACTIVE PACKAGE CARD & QUOTA METERS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-primary flex items-center justify-center font-black">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-primary uppercase tracking-widest bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200/60">
                  {tenantData?.billingInterval === 'lifetime' ? 'Lifetime Tier' : `${tenantData?.billingInterval || 'Monthly'} Subscription`}
                </span>
                {isTrial && (
                  <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                    7-Day Free Trial
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                {currentPlanObj.name}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {currentPlanObj.desc}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Next Renewal / Due Date</span>
              <span className="text-sm font-black text-gray-900">
                {isLifetime ? 'Lifetime Access' : isTrial ? `Trial Ends ${trialEndsFormatted}` : (activeInvoice?.dueDate || 'Active')}
              </span>
            </div>
          </div>
        </div>

        {/* Quotas Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Active Tours */}
          <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Tours</span>
              <span className="text-xs font-black text-primary bg-orange-50 px-2 py-0.5 rounded-md">
                {tourQuota >= 999999 ? 'Unlimited' : `${tourPercent}% Used`}
              </span>
            </div>
            <p className="text-2xl font-black text-gray-900">
              {tours.length} <span className="text-sm font-bold text-gray-400">/ {tourQuota >= 999999 ? 'Unlimited' : `${tourQuota} tours`}</span>
            </p>
            <div className="w-full bg-gray-200/60 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500" 
                style={{ width: `${tourQuota >= 999999 ? 10 : tourPercent}%` }} 
              />
            </div>
          </div>

          {/* Monthly Bookings */}
          <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Bookings</span>
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {bookingQuota >= 999999 ? 'Unlimited' : `${bookingPercent}% Used`}
              </span>
            </div>
            <p className="text-2xl font-black text-gray-900">
              {bookings.length} <span className="text-sm font-bold text-gray-400">/ {bookingQuota >= 999999 ? 'Unlimited' : `${bookingQuota} bookings`}</span>
            </p>
            <div className="w-full bg-gray-200/60 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${bookingQuota >= 999999 ? 10 : bookingPercent}%` }} 
              />
            </div>
          </div>

          {/* BYOPG & Developer API */}
          <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Gateway Access</span>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Multi-Gateway Enabled</span>
            </div>
            <p className="text-2xl font-black text-gray-900">
              BYOPG <span className="text-sm font-bold text-gray-400">/ All Gateways</span>
            </p>
            <div className="w-full bg-gray-200/60 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Upgrade / Downgrade Tiers Section */}
        <div className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-black text-gray-900 text-base tracking-tight">Change / Upgrade Package</h4>
              <p className="text-xs text-gray-400 font-medium">Instantly switch your plan tier or adjust your billing cycle</p>
            </div>

            {/* Cycle Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-[11px] font-black uppercase">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                  billingCycle === 'monthly' ? "bg-white text-gray-900 shadow-xs font-black" : "text-gray-500 hover:text-gray-900"
                )}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer",
                  billingCycle === 'yearly' ? "bg-white text-gray-900 shadow-xs font-black" : "text-gray-500 hover:text-gray-900"
                )}
              >
                <span>Yearly</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.2 rounded">-20%</span>
              </button>
              <button 
                onClick={() => setBillingCycle('lifetime')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer",
                  billingCycle === 'lifetime' ? "bg-white text-gray-900 shadow-xs font-black" : "text-gray-500 hover:text-gray-900"
                )}
              >
                <span>Lifetime</span>
                <span className="text-[9px] bg-purple-100 text-purple-800 font-black px-1.5 py-0.2 rounded">🔥 PROMO</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricingPlans.map((pkg) => {
              const isCurrent = currentPlanStr === pkg.id && (
                billingCycle === 'lifetime' 
                  ? (tenantData?.billingInterval === 'lifetime' || currentPlanStr.includes('lifetime'))
                  : (tenantData?.billingInterval || 'monthly') === billingCycle
              );

              const priceDisplay = billingCycle === 'lifetime'
                ? `$${pkg.lifetimePrice}`
                : billingCycle === 'yearly'
                ? `$${pkg.yearlyPrice}`
                : `$${pkg.monthlyPrice}`;

              const periodDisplay = billingCycle === 'lifetime' ? ' / lifetime' : billingCycle === 'yearly' ? ' / mo (billed yearly)' : ' / month';

              return (
                <div 
                  key={pkg.id} 
                  className={cn(
                    "bg-white rounded-2xl p-5 relative overflow-hidden space-y-3 border transition-all flex flex-col justify-between",
                    isCurrent ? "border-2 border-orange-500 shadow-md ring-2 ring-orange-500/10" : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  {isCurrent && (
                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-xs">
                      Current Plan
                    </div>
                  )}

                  <div className="space-y-2">
                    <div>
                      <p className={cn("text-[10px] font-black uppercase tracking-widest", isCurrent ? "text-primary" : "text-gray-400")}>
                        {pkg.name}
                      </p>
                      <h5 className="text-xl font-black text-gray-900 tracking-tight mt-0.5">
                        {priceDisplay}
                        <span className="text-[11px] font-medium text-gray-400">{periodDisplay}</span>
                      </h5>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-tight">{pkg.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-gray-50">
                    <button 
                      disabled={isCurrent || isUpdatingPlan === pkg.id}
                      onClick={() => handleUpdatePlan(pkg)}
                      className={cn(
                        "w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                        isCurrent 
                          ? "bg-orange-50 text-primary cursor-default" 
                          : "bg-gray-900 hover:bg-black text-white cursor-pointer shadow-sm hover:shadow"
                      )}
                    >
                      {isUpdatingPlan === pkg.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : isCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Active Tier</span>
                        </>
                      ) : (
                        <span>Switch to {pkg.name.split(' ')[0]}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cancel Subscription Action */}
          <div className="pt-2 text-center">
            <button
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="text-xs text-rose-500 hover:text-rose-700 font-bold hover:underline transition-colors cursor-pointer"
            >
              {isCancelling ? 'Processing cancellation...' : 'Cancel or Pause Workspace Subscription →'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION 2: ACTIVE INVOICE CARD (DEDICATED DISPLAY & PAY ACTION) */}
      {/* ========================================================================= */}
      {activeInvoice && (
        <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-orange-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                <Receipt className="w-3.5 h-3.5" />
                <span>Active Subscription Invoice</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Invoice #{activeInvoice.no || activeInvoice.id}
              </h3>
              <p className="text-sm text-gray-300 font-medium leading-relaxed">
                Plan: <strong className="text-white">{activeInvoice.plan || currentPlanObj.name}</strong> • Billed to: <strong className="text-white">{tenantData?.companyName || 'Operator Workspace'}</strong>
              </p>
            </div>

            {/* Total Due & Pay Button */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Amount</span>
                <span className="text-3xl font-black text-emerald-400 tracking-tight">{activeInvoice.amount}</span>
              </div>

              <div className="flex items-center gap-2">
                {activeInvoice.status !== 'PAID' ? (
                  <button
                    onClick={() => setSelectedInvoiceForPayment(activeInvoice)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer font-sans"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Now</span>
                  </button>
                ) : (
                  <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Paid & Active</span>
                  </div>
                )}
                <button
                  onClick={() => setSelectedInvoiceForView(activeInvoice)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider px-4 py-3.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                  title="Preview Official Invoice Statement"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview Invoice</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Invoice Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Invoice Date</span>
              <span className="font-bold text-white mt-0.5 block">{activeInvoice.invoiceDate || 'Today'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Due Date</span>
              <span className="font-bold text-amber-300 mt-0.5 block">{activeInvoice.dueDate || trialEndsFormatted}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Payment Status</span>
              <span className={cn(
                "mt-0.5 inline-block font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md",
                activeInvoice.status === 'PAID' ? "bg-emerald-500/20 text-emerald-300" : activeInvoice.isOverdue ? "bg-rose-500/20 text-rose-300 animate-pulse" : "bg-amber-500/20 text-amber-300"
              )}>
                {activeInvoice.status || 'UNPAID'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Payment Gateway</span>
              <span className="font-bold text-white mt-0.5 block">{activeInvoice.paymentMethod || 'Online Gateway / Sandbox'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SECTION 3: PAYMENT / INVOICE HISTORY TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-gray-900 text-xl tracking-tight">Payment & Invoice History</h3>
            <p className="text-xs text-gray-400 font-medium">Full ledger of platform subscription statements and receipts</p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 w-40 sm:w-48"
              />
            </div>

            {/* Filter Pill */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-[10px] font-black uppercase">
              {(['ALL', 'UNPAID', 'PAID', 'OVERDUE'] as const).map((filterOpt) => (
                <button
                  key={filterOpt}
                  onClick={() => setStatusFilter(filterOpt)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                    statusFilter === filterOpt ? "bg-white text-gray-900 shadow-xs font-black" : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  {filterOpt}
                </button>
              ))}
            </div>

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
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/50">
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
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-bold text-xs text-gray-700">No invoices matching the current filter</p>
                    <p className="font-medium text-[11px] text-gray-400 mt-0.5">All issued subscription invoices will appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const isOverdue = inv.isOverdue || (inv.status || '').toUpperCase() === 'OVERDUE';

                  return (
                    <tr 
                      key={inv.id} 
                      onClick={() => setSelectedInvoiceForView(inv)}
                      className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 font-black text-gray-900">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoiceForView(inv);
                          }}
                          className="font-black text-gray-900 group-hover:text-primary flex items-center gap-2 cursor-pointer transition-colors text-left"
                          title="Click to preview invoice"
                        >
                          <FileText className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
                          <span className="underline decoration-transparent group-hover:decoration-primary group-hover:underline transition-all">
                            {inv.no || inv.id}
                          </span>
                        </button>
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-700">
                        <div>{inv.plan || tenantData?.plan?.toUpperCase() || 'Starter Plan'}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{inv.invoiceDate || 'Today'}</div>
                      </td>
                      <td className="py-4 px-4 text-xs font-bold text-gray-600">
                        {inv.dueDate || (isTrial ? `Trial Ends ${trialEndsFormatted}` : 'Lifetime Access')}
                      </td>
                      <td className="py-4 px-4 font-black text-gray-900 text-sm">
                        {inv.amount || '$49.00'}
                      </td>
                      <td className="py-4 px-4">
                        {isPaid ? (
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        ) : isOverdue ? (
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
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button 
                            type="button"
                            onClick={() => setSelectedInvoiceForView(inv)}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 font-bold text-[11px] rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title="Preview and Print Invoice"
                          >
                            <Eye className="h-3.5 w-3.5 text-gray-500" />
                            <span>Preview</span>
                          </button>
                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceForPayment(inv)}
                              className={cn(
                                "font-black text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-all cursor-pointer",
                                isOverdue
                                  ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
                                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
                              )}
                              title={isOverdue ? "Pay Overdue Invoice" : "Pay Subscription Invoice"}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{isOverdue ? 'Pay Overdue' : 'Pay Now'}</span>
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={() => setSelectedInvoiceForView(inv)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
                            title="View & Download Official Receipt"
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

      {/* ========================================================================= */}
      {/* 5. MODAL: PAY INVOICE (INSTANT SANDBOX / CARD GATEWAY) */}
      {/* ========================================================================= */}
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
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice Summary Box */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Plan & Workspace:</span>
                <span className="font-black text-gray-800">{selectedInvoiceForPayment.plan || currentPlanObj.name}</span>
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
                <span className="text-2xl font-black text-emerald-600">{selectedInvoiceForPayment.amount || '$49.00'}</span>
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
                    <span>Instant Payment & Settle Invoice</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const checkoutUrl = `/api/billing/mock-checkout?productId=${encodeURIComponent(tenantData?.plan || 'starter')}&tenantId=${encodeURIComponent(activeTenantId)}&billingInterval=${encodeURIComponent(tenantData?.billingInterval || 'monthly')}`;
                  window.location.href = checkoutUrl;
                }}
                className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Pay via Online Card Gateway</span>
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center font-medium">
              🔒 256-bit encrypted transaction. Payment is securely reflected in your tenant ledger instantly.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: VIEW & PRINT OFFICIAL RECEIPT */}
      {/* ========================================================================= */}
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
                        <span className="font-bold text-gray-900 block">{selectedInvoiceForView.plan || currentPlanObj.name}</span>
                        <span className="text-[11px] text-gray-500">Includes Multi-Gateway BYOPG, Channel Manager, AI Tour Planner & Booking Suite</span>
                      </td>
                      <td className="py-3 text-center">1</td>
                      <td className="py-3 text-right font-black text-gray-900">{selectedInvoiceForView.amount || '$49.00'}</td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t border-gray-200 font-bold">
                    <tr>
                      <td colSpan={2} className="pt-3 text-gray-500">Subtotal</td>
                      <td className="pt-3 text-right text-gray-900 font-black">{selectedInvoiceForView.amount || '$49.00'}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="pt-1 text-gray-500">Taxes & Processing Fees (Included)</td>
                      <td className="pt-1 text-right text-gray-900">$0.00</td>
                    </tr>
                    <tr className="text-base font-black text-gray-900">
                      <td colSpan={2} className="pt-3">Total Amount</td>
                      <td className="pt-3 text-right text-emerald-600">{selectedInvoiceForView.amount || '$49.00'}</td>
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
