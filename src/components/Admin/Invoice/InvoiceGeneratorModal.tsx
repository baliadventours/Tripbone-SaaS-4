import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Plus, Trash2, Edit3, Check, DollarSign, Calendar, User, Mail, 
  Phone, Globe, Building2, CreditCard, Link as LinkIcon, FileText, 
  Sparkles, AlertCircle, CheckCircle2, ChevronRight, Package, 
  Car, Compass, RefreshCw, Eye, Send, MessageSquare, HelpCircle,
  Percent, ShieldCheck
} from 'lucide-react';
import { 
  db, collection, getDocs, doc, getDoc, auth, getActiveTenantId 
} from '../../../lib/firebase';
import { 
  Tour, TourPackage, AddOn, TransportOption, TenantInvoice, InvoiceLineItem 
} from '../../../types';
import { 
  saveTenantInvoice, generateUniqueInvoiceNumber, formatInvoiceAmount 
} from '../../../lib/invoiceService';
import { PaymentService } from '../../../services/payment/PaymentService';

interface InvoiceGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: (invoice: TenantInvoice, action?: 'preview' | 'email' | 'whatsapp') => void;
  initialInvoice?: TenantInvoice | null;
  existingInvoices?: TenantInvoice[];
}

export default function InvoiceGeneratorModal({
  isOpen,
  onClose,
  onInvoiceCreated,
  initialInvoice,
  existingInvoices = []
}: InvoiceGeneratorModalProps) {
  const activeTenantId = getActiveTenantId() || 'global';

  // Catalog items for selector
  const [tours, setTours] = useState<Tour[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [transports, setTransports] = useState<TransportOption[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState<string>('USD');
  const [status, setStatus] = useState<TenantInvoice['status']>('unpaid');

  // Customer State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerCompany, setCustomerCompany] = useState<string>('');
  const [customerCountry, setCustomerCountry] = useState<string>('');

  // Tenant / Company details
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantLogo, setTenantLogo] = useState<string>('');
  const [tenantEmail, setTenantEmail] = useState<string>('');
  const [tenantPhone, setTenantPhone] = useState<string>('');
  const [tenantAddress, setTenantAddress] = useState<string>('');
  const [tenantWebsite, setTenantWebsite] = useState<string>('');

  // Line items state
  const [items, setItems] = useState<InvoiceLineItem[]>([]);

  // Calculation adjustments
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Customizable Payment Link Button
  const [paymentButtonEnabled, setPaymentButtonEnabled] = useState<boolean>(true);
  const [paymentButtonLabel, setPaymentButtonLabel] = useState<string>('💳 Pay Invoice Online');
  const [paymentButtonUrl, setPaymentButtonUrl] = useState<string>('');
  const [paymentButtonDescription, setPaymentButtonDescription] = useState<string>(
    'Click to pay securely via Credit Card, Debit, or QRIS'
  );

  // Bank & Payment instructions
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [swiftCode, setSwiftCode] = useState<string>('');
  const [paypalEmail, setPaypalEmail] = useState<string>('');
  const [paymentInstructions, setPaymentInstructions] = useState<string>('');

  // Notes & Terms
  const [notes, setNotes] = useState<string>('Thank you for choosing us! Please complete payment before the due date.');
  const [terms, setTerms] = useState<string>(
    'Reservations are confirmed upon receipt of payment. Free cancellation up to 48 hours before tour start.'
  );

  // Item Picker Modals / UI States
  const [activeTab, setActiveTab] = useState<'items' | 'customer' | 'payment' | 'notes'>('items');
  const [showTourPicker, setShowTourPicker] = useState<boolean>(false);
  const [showAddonPicker, setShowAddonPicker] = useState<boolean>(false);
  const [showTransportPicker, setShowTransportPicker] = useState<boolean>(false);
  const [showCustomItemForm, setShowCustomItemForm] = useState<boolean>(false);

  // Tour Picker Specific State
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [selectedPackageName, setSelectedPackageName] = useState<string>('');
  const [tourAdults, setTourAdults] = useState<number>(2);
  const [tourChildren, setTourChildren] = useState<number>(0);
  const [customTourPrice, setCustomTourPrice] = useState<string>('');

  // Custom Item Form State
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDesc, setCustomDesc] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 1. Fetch catalogs (tours, addons, transports, tenant settings)
  useEffect(() => {
    if (!isOpen) return;

    const loadCatalogs = async () => {
      setLoadingCatalogs(true);
      try {
        // Load Tours
        const toursSnap = await getDocs(collection(db, 'tours'));
        const toursList = toursSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Tour))
          .filter(t => !t.supplierId || t.supplierId === activeTenantId || activeTenantId === 'global');
        setTours(toursList);

        // Load AddOns
        try {
          const addonsSnap = await getDocs(collection(db, 'addOns'));
          setAddOns(addonsSnap.docs.map(d => ({ id: d.id, ...d.data() } as AddOn)));
        } catch {}

        // Load Transports
        try {
          const transSnap = await getDocs(collection(db, 'transports'));
          setTransports(transSnap.docs.map(d => ({ id: d.id, ...d.data() } as TransportOption)));
        } catch {}

        // Load Tenant Settings for branding & Bank details
        try {
          const settingsDoc = await getDoc(
            doc(db, 'settings', activeTenantId === 'global' ? 'general' : activeTenantId)
          );
          if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (!initialInvoice) {
              setTenantName(data?.siteName || data?.brandName || 'Tour & Travel Operator');
              setTenantLogo(data?.logo || data?.lightLogo || '');
              setTenantEmail(data?.supportEmail || data?.contactEmail || '');
              setTenantPhone(data?.contactPhone || data?.whatsappNumber || '');
              setTenantAddress(data?.address || '');
              setTenantWebsite(data?.siteUrl || '');
              if (data?.currency) setCurrency(data.currency);
            }
          }
        } catch {}

        // Load Payment Settings for Bank Transfer Pre-fills
        try {
          const paySettings = await PaymentService.getTenantSettings(activeTenantId);
          if (paySettings && !initialInvoice) {
            const bankConf = paySettings.providerConfigs?.bank_transfer;
            if (bankConf) {
              const credentials = (bankConf as any).credentials || bankConf;
              if (credentials.bankName) setBankName(credentials.bankName);
              if (credentials.accountNumber) setAccountNumber(credentials.accountNumber);
              if (credentials.accountHolder) setAccountHolder(credentials.accountHolder);
              if (credentials.swiftCode) setSwiftCode(credentials.swiftCode);
              if (credentials.instructions) setPaymentInstructions(credentials.instructions);
            }
          }
        } catch {}
      } catch (err) {
        console.error('Error loading catalogs for invoice:', err);
      } finally {
        setLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, [isOpen, activeTenantId, initialInvoice]);

  // 2. Initialize or reset form values
  useEffect(() => {
    if (!isOpen) return;

    if (initialInvoice) {
      setInvoiceNumber(initialInvoice.invoiceNumber || '');
      setIssueDate(initialInvoice.issueDate || new Date().toISOString().split('T')[0]);
      setDueDate(initialInvoice.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
      setCurrency(initialInvoice.currency || 'USD');
      setStatus(initialInvoice.status || 'unpaid');

      setCustomerName(initialInvoice.customer?.name || '');
      setCustomerEmail(initialInvoice.customer?.email || '');
      setCustomerPhone(initialInvoice.customer?.phone || '');
      setCustomerWhatsapp(initialInvoice.customer?.whatsapp || '');
      setCustomerAddress(initialInvoice.customer?.address || '');
      setCustomerCompany(initialInvoice.customer?.company || '');
      setCustomerCountry(initialInvoice.customer?.country || '');

      setTenantName(initialInvoice.tenantName || '');
      setTenantLogo(initialInvoice.tenantLogo || '');
      setTenantEmail(initialInvoice.tenantEmail || '');
      setTenantPhone(initialInvoice.tenantPhone || '');
      setTenantAddress(initialInvoice.tenantAddress || '');
      setTenantWebsite(initialInvoice.tenantWebsite || '');

      setItems(initialInvoice.items || []);
      setDiscountType(initialInvoice.discountType || 'percentage');
      setDiscountValue(initialInvoice.discountValue || 0);
      setTaxRate(initialInvoice.taxRate || 0);
      setPaidAmount(initialInvoice.paidAmount || 0);

      setPaymentButtonEnabled(initialInvoice.paymentButton?.enabled ?? true);
      setPaymentButtonLabel(initialInvoice.paymentButton?.label || '💳 Pay Invoice Online');
      setPaymentButtonUrl(initialInvoice.paymentButton?.url || '');
      setPaymentButtonDescription(initialInvoice.paymentButton?.description || '');

      setBankName(initialInvoice.bankDetails?.bankName || '');
      setAccountNumber(initialInvoice.bankDetails?.accountNumber || '');
      setAccountHolder(initialInvoice.bankDetails?.accountHolder || '');
      setSwiftCode(initialInvoice.bankDetails?.swiftCode || '');
      setPaypalEmail(initialInvoice.bankDetails?.paypalEmail || '');
      setPaymentInstructions(initialInvoice.paymentInstructions || '');

      setNotes(initialInvoice.notes || '');
      setTerms(initialInvoice.terms || '');
    } else {
      // New Invoice: Auto-generate invoice number
      const newNo = generateUniqueInvoiceNumber(existingInvoices, 'INV');
      setInvoiceNumber(newNo);
      setIssueDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
      setStatus('unpaid');
      setItems([]);
      setDiscountValue(0);
      setTaxRate(0);
      setPaidAmount(0);

      // Default dynamic pay link suggestion
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setPaymentButtonUrl(`${origin}/pay?invoice=${newNo}`);
    }
  }, [isOpen, initialInvoice, existingInvoices]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    }
    return Math.min(discountValue, subtotal);
  }, [subtotal, discountType, discountValue]);

  const afterDiscount = Math.max(0, subtotal - discountAmount);

  const taxAmount = useMemo(() => {
    if (!taxRate || taxRate <= 0) return 0;
    return (afterDiscount * taxRate) / 100;
  }, [afterDiscount, taxRate]);

  const totalAmount = Math.max(0, afterDiscount + taxAmount);
  const balanceDue = Math.max(0, totalAmount - (Number(paidAmount) || 0));

  // Handle adding Tour & Package to items
  const handleAddTourPackage = () => {
    if (!selectedTourId) return;
    const tour = tours.find(t => t.id === selectedTourId);
    if (!tour) return;

    const pkg = tour.packages?.find(p => p.name === selectedPackageName) || tour.packages?.[0];
    const totalPax = (Number(tourAdults) || 1) + (Number(tourChildren) || 0);

    // Calculate price
    let unitRate = 0;
    if (customTourPrice && !isNaN(Number(customTourPrice))) {
      unitRate = Number(customTourPrice);
    } else if (pkg && pkg.tiers && pkg.tiers.length > 0) {
      const tier = pkg.tiers.find(t => totalPax >= t.minParticipants && totalPax <= t.maxParticipants) || pkg.tiers[0];
      const adultPrice = tier ? tier.adultPrice : (tour.regularPrice || 0);
      const childPrice = tier ? tier.childPrice : (tour.regularPrice || 0) * 0.7;
      const totalTourCost = (Number(tourAdults) * adultPrice) + (Number(tourChildren) * childPrice);
      unitRate = totalTourCost; // Pack as total item price or per passenger
    } else {
      unitRate = (tour.discountPrice || tour.regularPrice || 100) * totalPax;
    }

    const paxSummary = `${tourAdults} Adult(s)${tourChildren > 0 ? `, ${tourChildren} Child(ren)` : ''}`;
    const itemTitle = `${tour.title}${pkg ? ` - ${pkg.name}` : ''}`;
    const itemDesc = `Participants: ${paxSummary}. Duration: ${tour.duration || 'Day Tour'}. Inclusions: ${tour.inclusions?.slice(0, 3).join(', ') || 'All standard activities'}.`;

    const newItem: InvoiceLineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'tour_package',
      title: itemTitle,
      description: itemDesc,
      tourId: tour.id,
      tourTitle: tour.title,
      packageName: pkg?.name || 'Standard',
      paxAdults: Number(tourAdults),
      paxChildren: Number(tourChildren),
      quantity: 1,
      unitPrice: unitRate,
      totalPrice: unitRate
    };

    setItems(prev => [...prev, newItem]);
    setShowTourPicker(false);
    setSelectedTourId('');
    setSelectedPackageName('');
    setCustomTourPrice('');
  };

  // Handle adding Custom Item
  const handleAddCustomItem = () => {
    if (!customTitle.trim()) {
      alert("Please enter a service or item name.");
      return;
    }

    const price = Number(customPrice) || 0;
    const qty = Number(customQty) || 1;

    const newItem: InvoiceLineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'custom_service',
      title: customTitle.trim(),
      description: customDesc.trim() || undefined,
      quantity: qty,
      unitPrice: price,
      totalPrice: price * qty
    };

    setItems(prev => [...prev, newItem]);
    setShowCustomItemForm(false);
    setCustomTitle('');
    setCustomDesc('');
    setCustomQty(1);
    setCustomPrice('');
  };

  // Handle adding AddOn
  const handleAddAddonItem = (addon: AddOn) => {
    const newItem: InvoiceLineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'addon',
      title: `Add-on: ${addon.name}`,
      description: addon.description || `Optional add-on (${addon.unit})`,
      quantity: 1,
      unitPrice: addon.price,
      totalPrice: addon.price
    };
    setItems(prev => [...prev, newItem]);
    setShowAddonPicker(false);
  };

  // Handle adding Transport
  const handleAddTransportItem = (t: TransportOption) => {
    const newItem: InvoiceLineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'transport',
      title: `Transport: ${t.name}`,
      description: `${t.carType ? t.carType + ' • ' : ''}${t.description || 'Dedicated transport service'}`,
      quantity: 1,
      unitPrice: t.price,
      totalPrice: t.price
    };
    setItems(prev => [...prev, newItem]);
    setShowTransportPicker(false);
  };

  // Update line item inline
  const handleUpdateItem = (id: string, updates: Partial<InvoiceLineItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
          const q = Number(updated.quantity) || 1;
          const p = Number(updated.unitPrice) || 0;
          updated.totalPrice = q * p;
        }
        return updated;
      }
      return item;
    }));
  };

  // Remove line item
  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Save invoice and trigger action
  const handleSaveInvoice = async (action: 'save' | 'preview' | 'email' | 'whatsapp' = 'save') => {
    setValidationError(null);

    if (!invoiceNumber.trim()) {
      setValidationError("Invoice number is required.");
      return;
    }

    if (!customerName.trim()) {
      setValidationError("Client full name is required.");
      setActiveTab('customer');
      return;
    }

    if (items.length === 0) {
      setValidationError("Please add at least one line item (Tour, Package, or Custom Service) to the invoice.");
      setActiveTab('items');
      return;
    }

    setSaving(true);
    try {
      const invoicePayload: Partial<TenantInvoice> = {
        id: initialInvoice?.id,
        invoiceNumber: invoiceNumber.trim(),
        tenantId: activeTenantId,
        tenantName: tenantName.trim() || 'Tour & Travel Operator',
        tenantLogo: tenantLogo.trim(),
        tenantEmail: tenantEmail.trim(),
        tenantPhone: tenantPhone.trim(),
        tenantAddress: tenantAddress.trim(),
        tenantWebsite: tenantWebsite.trim(),

        customer: {
          name: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim(),
          whatsapp: customerWhatsapp.trim() || customerPhone.trim(),
          address: customerAddress.trim(),
          company: customerCompany.trim(),
          country: customerCountry.trim()
        },

        issueDate,
        dueDate,
        currency,
        status,

        items,

        subtotal,
        discountType,
        discountValue,
        discountAmount,
        taxRate,
        taxAmount,
        totalAmount,
        paidAmount: Number(paidAmount) || 0,
        balanceDue,

        paymentButton: {
          enabled: paymentButtonEnabled,
          label: paymentButtonLabel.trim() || '💳 Pay Invoice Online',
          url: paymentButtonUrl.trim(),
          description: paymentButtonDescription.trim()
        },

        bankDetails: {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
          swiftCode: swiftCode.trim(),
          paypalEmail: paypalEmail.trim(),
          instructions: paymentInstructions.trim()
        },
        paymentInstructions: paymentInstructions.trim(),

        notes: notes.trim(),
        terms: terms.trim(),

        createdById: initialInvoice?.createdById || auth.currentUser?.uid || 'admin',
        createdByName: initialInvoice?.createdByName || auth.currentUser?.displayName || 'Admin'
      };

      const savedId = await saveTenantInvoice(invoicePayload);
      const completeInvoice = {
        ...invoicePayload,
        id: savedId,
        createdAt: initialInvoice?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as TenantInvoice;

      onInvoiceCreated(completeInvoice, action === 'save' ? 'preview' : action);
      onClose();
    } catch (err: any) {
      console.error("Failed to save invoice:", err);
      setValidationError("Failed to save invoice: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-600/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {initialInvoice ? `Edit Invoice #${initialInvoice.invoiceNumber}` : 'Create Manual Invoice'}
              </h2>
              <p className="text-xs text-slate-500">
                Select tours, add custom services, configure payment links, and dispatch to client
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white gap-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'items'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            1. Line Items & Services ({items.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customer')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'customer'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            2. Client Information {customerName ? `(${customerName})` : ''}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'payment'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            3. Payment Link & Bank Details
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            4. Notes, Terms & Dates
          </button>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
            <button type="button" onClick={() => setValidationError(null)} className="font-bold underline ml-2">
              Dismiss
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: LINE ITEMS */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              
              {/* Quick Meta Controls (Invoice #, Currency, Status) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="INV-2026-001"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="MYR">MYR (RM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Add Item Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-black text-slate-900">
                  Itemized Charges & Services ({items.length})
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTourPicker(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    + Add Tour & Package
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddonPicker(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition shadow-sm"
                  >
                    <Package className="w-3.5 h-3.5 text-slate-500" />
                    + Add Add-on
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTransportPicker(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition shadow-sm"
                  >
                    <Car className="w-3.5 h-3.5 text-slate-500" />
                    + Add Transport
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCustomItemForm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Custom Service
                  </button>
                </div>
              </div>

              {/* Items Table */}
              {items.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-700">No items added to this invoice yet</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click <strong>"+ Add Tour & Package"</strong> or <strong>"+ Add Custom Service"</strong> above to populate invoice line items.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Item & Description</th>
                        <th className="py-3 px-3 text-center w-20">Qty</th>
                        <th className="py-3 px-3 text-right w-28">Unit Price ({currency})</th>
                        <th className="py-3 px-3 text-right w-28">Total ({currency})</th>
                        <th className="py-3 px-2 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                              className="w-full font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none text-xs"
                            />
                            <textarea
                              rows={1}
                              value={item.description || ''}
                              onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                              placeholder="Add optional item description..."
                              className="w-full text-[11px] text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none resize-none mt-1"
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, { quantity: Math.max(1, Number(e.target.value)) })}
                              className="w-14 text-center font-bold px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(item.id, { unitPrice: Math.max(0, Number(e.target.value)) })}
                              className="w-24 text-right font-semibold px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                            {formatInvoiceAmount(item.totalPrice, currency)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Financial Calculations Box */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-slate-200">
                {/* Adjustments (Discount & Tax) */}
                <div className="w-full sm:w-1/2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-700">Discounts & Taxes</div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Discount</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min={0}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setDiscountType(discountType === 'percentage' ? 'fixed' : 'percentage')}
                          className="px-2.5 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
                        >
                          {discountType === 'percentage' ? '%' : currency}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Tax / VAT (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={taxRate}
                        onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                        placeholder="e.g. 10 or 11"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Paid Amount ({currency})</label>
                    <input
                      type="number"
                      min={0}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Summary Table */}
                <div className="w-full sm:w-80 space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900">{formatInvoiceAmount(subtotal, currency)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-semibold">-{formatInvoiceAmount(discountAmount, currency)}</span>
                    </div>
                  )}

                  {taxAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax ({taxRate}%):</span>
                      <span className="font-semibold text-slate-900">+{formatInvoiceAmount(taxAmount, currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-base text-sky-700">{formatInvoiceAmount(totalAmount, currency)}</span>
                  </div>

                  {paidAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                      <span>Amount Paid:</span>
                      <span>-{formatInvoiceAmount(paidAmount, currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-black text-rose-600 pt-2 border-t border-dashed border-slate-300">
                    <span>Balance Due:</span>
                    <span>{formatInvoiceAmount(balanceDue, currency)}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CLIENT INFORMATION */}
          {activeTab === 'customer' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-600" />
                  Client / Recipient Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (!customerWhatsapp) setCustomerWhatsapp(e.target.value);
                      }}
                      placeholder="e.g. +62 812 3456 7890"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Company / Organization</label>
                    <input
                      type="text"
                      value={customerCompany}
                      onChange={(e) => setCustomerCompany(e.target.value)}
                      placeholder="e.g. Acme Travel Club"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Billing Address</label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="e.g. 123 Sunset Road, Suite 4B"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Country / Nationality</label>
                    <input
                      type="text"
                      value={customerCountry}
                      onChange={(e) => setCustomerCountry(e.target.value)}
                      placeholder="e.g. Australia"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Operator / Tenant Branding Override */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  Operator Branding on Invoice
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Business Name</label>
                    <input
                      type="text"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Logo Image URL</label>
                    <input
                      type="url"
                      value={tenantLogo}
                      onChange={(e) => setTenantLogo(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Support Email</label>
                    <input
                      type="email"
                      value={tenantEmail}
                      onChange={(e) => setTenantEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Hotline / Phone</label>
                    <input
                      type="text"
                      value={tenantPhone}
                      onChange={(e) => setTenantPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT LINK & BANK DETAILS */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              
              {/* Customizable Payment Link Button Setting */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-teal-500/10 p-5 rounded-2xl border-2 border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Interactive Payment Link Button</h3>
                      <p className="text-xs text-slate-500">
                        Include a clickable online payment button directly on the client's invoice & email
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentButtonEnabled}
                      onChange={(e) => setPaymentButtonEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {paymentButtonEnabled && (
                  <div className="space-y-3 pt-2 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Button Label / Call-to-Action
                      </label>
                      <input
                        type="text"
                        value={paymentButtonLabel}
                        onChange={(e) => setPaymentButtonLabel(e.target.value)}
                        placeholder="e.g. 💳 Pay Invoice Online (Credit Card / QRIS)"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Custom Payment Link URL (Stripe, Midtrans, PayPal, Xendit, etc.)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={paymentButtonUrl}
                          onChange={(e) => setPaymentButtonUrl(e.target.value)}
                          placeholder="https://buy.stripe.com/... or https://domain.com/pay"
                          className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-sky-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>
                      
                      {/* Presets & Helper Buttons */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[11px] text-slate-400 font-semibold">Quick presets:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const origin = typeof window !== 'undefined' ? window.location.origin : '';
                            setPaymentButtonUrl(`${origin}/pay?invoice=${invoiceNumber}`);
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-md text-[11px] font-medium text-slate-700"
                        >
                          🌐 Standard Web Checkout Link
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentButtonUrl(`https://buy.stripe.com/`)}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-md text-[11px] font-medium text-slate-700"
                        >
                          💳 Stripe Payment Link
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentButtonUrl(`https://paypal.me/`)}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-md text-[11px] font-medium text-slate-700"
                        >
                          🅿️ PayPal.me Link
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Subtext / Description
                      </label>
                      <input
                        type="text"
                        value={paymentButtonDescription}
                        onChange={(e) => setPaymentButtonDescription(e.target.value)}
                        placeholder="e.g. Instant payment with Visa, Mastercard, AMEX, or QRIS"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bank Transfer Details Section */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  Bank Transfer Details & Manual Wire Instructions
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Bank Central Asia (BCA) / Chase Bank"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Account Number / IBAN</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 123-456-7890"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="e.g. PT BALI ADVENTOURS INDONESIA"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">SWIFT / BIC Code</label>
                    <input
                      type="text"
                      value={swiftCode}
                      onChange={(e) => setSwiftCode(e.target.value)}
                      placeholder="e.g. CENAIDJA"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">PayPal / Additional Instructions</label>
                    <textarea
                      rows={3}
                      value={paymentInstructions}
                      onChange={(e) => setPaymentInstructions(e.target.value)}
                      placeholder="e.g. Please put invoice number as transfer reference and send proof to billing@domain.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs resize-none"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: NOTES & TERMS */}
          {activeTab === 'notes' && (
            <div className="space-y-6 text-xs">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  Notes & Terms and Conditions
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Invoice Notes (Shown to Client)</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs resize-none"
                    placeholder="Thank you for booking with us..."
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Terms & Conditions</label>
                  <textarea
                    rows={4}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs resize-none"
                    placeholder="Cancellation and refund policies..."
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Invoice Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full sm:w-60 px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                  >
                    <option value="unpaid">UNPAID / PENDING</option>
                    <option value="paid">PAID IN FULL</option>
                    <option value="draft">DRAFT</option>
                    <option value="overdue">OVERDUE</option>
                    <option value="cancelled">CANCELLED</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs">
            <span className="text-slate-500">Total: </span>
            <span className="text-base font-black text-slate-900">{formatInvoiceAmount(totalAmount, currency)}</span>
            <span className="text-slate-400 ml-2">({items.length} item{items.length !== 1 ? 's' : ''})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveInvoice('preview')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              Save & Preview
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveInvoice('email')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-600/20 transition"
            >
              <Send className="w-3.5 h-3.5" />
              Save & Send Email
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveInvoice('whatsapp')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Save & WhatsApp
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUB-MODAL: TOUR & PACKAGE SELECTOR */}
        {/* ------------------------------------------------------------- */}
        {showTourPicker && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-sky-600" />
                  <h3 className="font-black text-slate-900 text-sm">Select Tour & Package</h3>
                </div>
                <button type="button" onClick={() => setShowTourPicker(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Tour</label>
                  <select
                    value={selectedTourId}
                    onChange={(e) => {
                      setSelectedTourId(e.target.value);
                      const t = tours.find(tour => tour.id === e.target.value);
                      if (t?.packages && t.packages.length > 0) {
                        setSelectedPackageName(t.packages[0].name);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                  >
                    <option value="">-- Choose a Tour --</option>
                    {tours.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({currency} {t.regularPrice || 0})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTourId && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Select Package Tier</label>
                      {(() => {
                        const t = tours.find(tour => tour.id === selectedTourId);
                        const pkgs = t?.packages || [];
                        if (pkgs.length === 0) {
                          return <p className="text-slate-400 italic">Standard Package</p>;
                        }
                        return (
                          <div className="space-y-1.5">
                            {pkgs.map(p => (
                              <label
                                key={p.name}
                                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                                  selectedPackageName === p.name ? 'border-sky-600 bg-sky-50/60 font-bold text-sky-900' : 'border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="pkgSelection"
                                    checked={selectedPackageName === p.name}
                                    onChange={() => setSelectedPackageName(p.name)}
                                    className="text-sky-600"
                                  />
                                  <span>{p.name}</span>
                                </div>
                                <span className="text-[11px] text-slate-500">
                                  {p.inclusions?.slice(0, 2).join(', ')}
                                </span>
                              </label>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Adults</label>
                        <input
                          type="number"
                          min={1}
                          value={tourAdults}
                          onChange={(e) => setTourAdults(Math.max(1, Number(e.target.value)))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Children</label>
                        <input
                          type="number"
                          min={0}
                          value={tourChildren}
                          onChange={(e) => setTourChildren(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Price Override (Optional total item amount in {currency})
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={customTourPrice}
                        onChange={(e) => setCustomTourPrice(e.target.value)}
                        placeholder="Leave empty to auto-calculate from rates"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTourPicker(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedTourId}
                  onClick={handleAddTourPackage}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 text-white font-extrabold text-xs hover:bg-sky-700 disabled:opacity-50"
                >
                  Add to Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SUB-MODAL: ADD CUSTOM SERVICE */}
        {/* ------------------------------------------------------------- */}
        {showCustomItemForm && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-slate-900 text-sm">Add Custom Service / Line Item</h3>
                </div>
                <button type="button" onClick={() => setShowCustomItemForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Service / Item Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. VIP Airport Fast-Track & Meet Service"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                  <textarea
                    rows={2}
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="e.g. Includes immigration fast-lane, baggage assistance and welcome floral lei."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={customQty}
                      onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Unit Price ({currency})</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomItemForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 shadow-sm"
                >
                  Add to Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SUB-MODAL: ADD-ON SELECTOR */}
        {/* ------------------------------------------------------------- */}
        {showAddonPicker && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-sky-600" />
                  <h3 className="font-black text-slate-900 text-sm">Select Add-On Item</h3>
                </div>
                <button type="button" onClick={() => setShowAddonPicker(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
                {addOns.length === 0 ? (
                  <p className="text-slate-400 text-center py-6">No add-ons configured in your catalog.</p>
                ) : (
                  addOns.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleAddAddonItem(a)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 flex items-center justify-between transition"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{a.name}</div>
                        <div className="text-[11px] text-slate-500">{a.description || a.unit}</div>
                      </div>
                      <div className="font-extrabold text-sky-700">{formatInvoiceAmount(a.price, currency)}</div>
                    </button>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddonPicker(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SUB-MODAL: TRANSPORT SELECTOR */}
        {/* ------------------------------------------------------------- */}
        {showTransportPicker && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-sky-600" />
                  <h3 className="font-black text-slate-900 text-sm">Select Transport Service</h3>
                </div>
                <button type="button" onClick={() => setShowTransportPicker(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
                {transports.length === 0 ? (
                  <p className="text-slate-400 text-center py-6">No transport options configured in your catalog.</p>
                ) : (
                  transports.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleAddTransportItem(t)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 flex items-center justify-between transition"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{t.name}</div>
                        <div className="text-[11px] text-slate-500">{t.carType || t.type}</div>
                      </div>
                      <div className="font-extrabold text-sky-700">{formatInvoiceAmount(t.price, currency)}</div>
                    </button>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransportPicker(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
