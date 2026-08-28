import { db, collection, addDoc, updateDoc, doc, deleteDoc, getDocs, getDoc, query, where, orderBy, setDoc } from './firebase';
import { getActiveTenantId } from './firebase';
import { TenantInvoice, InvoiceAuditLog } from '../types';
import { auth } from './firebase';

export function sanitizeFirestoreData(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeFirestoreData);
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeFirestoreData(value);
    }
  }
  return sanitized;
}

/**
 * Generates a clean, unique invoice number based on current year/month and sequential counter.
 */
export function generateUniqueInvoiceNumber(existingInvoices: TenantInvoice[] = [], prefix: string = 'INV'): string {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  
  // Find highest number with same prefix and yearMonth
  let maxSeq = 0;
  existingInvoices.forEach(inv => {
    if (inv.invoiceNumber && inv.invoiceNumber.includes(yearMonth)) {
      const parts = inv.invoiceNumber.split('-');
      const last = parts[parts.length - 1];
      const num = parseInt(last, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}-${yearMonth}-${nextSeq}`;
}

/**
 * Formats a currency string accurately
 */
export function formatInvoiceAmount(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'IDR' ? 0 : 2,
      maximumFractionDigits: currency === 'IDR' ? 0 : 2
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
}

/**
 * Saves or updates a tenant invoice in Firestore.
 */
export async function saveTenantInvoice(invoice: Partial<TenantInvoice>): Promise<string> {
  const tenantId = invoice.tenantId || getActiveTenantId() || 'global';
  const now = new Date().toISOString();
  
  const id = invoice.id || `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  const invoiceData: TenantInvoice = {
    id,
    invoiceNumber: invoice.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
    tenantId,
    tenantName: invoice.tenantName || 'Tour & Travel Operator',
    tenantLogo: invoice.tenantLogo || '',
    tenantEmail: invoice.tenantEmail || '',
    tenantPhone: invoice.tenantPhone || '',
    tenantAddress: invoice.tenantAddress || '',
    tenantWebsite: invoice.tenantWebsite || '',
    tenantTaxId: invoice.tenantTaxId || '',

    customer: {
      name: invoice.customer?.name || 'Valued Guest',
      email: invoice.customer?.email || '',
      phone: invoice.customer?.phone || '',
      whatsapp: invoice.customer?.whatsapp || invoice.customer?.phone || '',
      address: invoice.customer?.address || '',
      company: invoice.customer?.company || '',
      country: invoice.customer?.country || '',
      passportOrTaxId: invoice.customer?.passportOrTaxId || ''
    },

    issueDate: invoice.issueDate || new Date().toISOString().split('T')[0],
    dueDate: invoice.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    currency: invoice.currency || 'USD',
    status: invoice.status || 'unpaid',

    items: invoice.items || [],

    subtotal: Number(invoice.subtotal || 0),
    discountType: invoice.discountType || 'percentage',
    discountValue: Number(invoice.discountValue || 0),
    discountAmount: Number(invoice.discountAmount || 0),
    taxRate: Number(invoice.taxRate || 0),
    taxAmount: Number(invoice.taxAmount || 0),
    totalAmount: Number(invoice.totalAmount || 0),
    paidAmount: Number(invoice.paidAmount || 0),
    balanceDue: Number(invoice.balanceDue ?? invoice.totalAmount ?? 0),

    paymentButton: {
      enabled: invoice.paymentButton?.enabled ?? true,
      label: invoice.paymentButton?.label || 'Pay Invoice Online Now',
      url: invoice.paymentButton?.url || '',
      description: invoice.paymentButton?.description || 'Click to pay securely via Credit Card, Debit, or QRIS'
    },

    bankDetails: invoice.bankDetails || {
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      swiftCode: '',
      instructions: ''
    },
    paymentInstructions: invoice.paymentInstructions || '',

    notes: invoice.notes || 'Thank you for your business! Please ensure payment is completed by the due date.',
    terms: invoice.terms || 'Payment is non-refundable once reservation is confirmed within 48 hours of tour departure.',

    createdById: invoice.createdById || auth.currentUser?.uid || 'admin',
    createdByName: invoice.createdByName || auth.currentUser?.displayName || 'Admin',
    createdAt: invoice.createdAt || now,
    updatedAt: now,
    sentAt: invoice.sentAt || null,
    paidAt: invoice.paidAt || null,
    bookingId: invoice.bookingId || null,
    auditLogs: invoice.auditLogs || [
      {
        id: `log_${Date.now()}`,
        action: 'created',
        timestamp: now,
        actorName: auth.currentUser?.displayName || 'Admin',
        notes: `Invoice #${invoice.invoiceNumber || id} created`
      }
    ]
  };

  const cleanData = sanitizeFirestoreData(invoiceData);
  await setDoc(doc(db, 'tenant_invoices', id), cleanData, { merge: true });
  return id;
}

/**
 * Generates personalized WhatsApp text for client invoice dispatch.
 */
export function generateInvoiceWhatsAppText(invoice: TenantInvoice): string {
  const cName = invoice.tenantName || 'Our Tour & Travel Team';
  const currency = invoice.currency || 'USD';
  const totalFormatted = formatInvoiceAmount(invoice.totalAmount, currency);
  const balanceFormatted = formatInvoiceAmount(invoice.balanceDue ?? invoice.totalAmount, currency);

  let itemsList = '';
  if (Array.isArray(invoice.items) && invoice.items.length > 0) {
    itemsList = invoice.items
      .map((item, i) => `  ${i + 1}. *${item.title}* (Qty: ${item.quantity}) - ${formatInvoiceAmount(item.totalPrice, currency)}`)
      .join('\n');
  }

  let paymentLinkSection = '';
  if (invoice.paymentButton && invoice.paymentButton.enabled && invoice.paymentButton.url) {
    paymentLinkSection = `\n💳 *Online Payment Link:*\n👉 ${invoice.paymentButton.url}\n`;
  }

  let bankSection = '';
  if (invoice.bankDetails && (invoice.bankDetails.bankName || invoice.bankDetails.accountNumber)) {
    bankSection = `\n🏦 *Bank Transfer Details:*` +
      (invoice.bankDetails.bankName ? `\n• Bank: ${invoice.bankDetails.bankName}` : '') +
      (invoice.bankDetails.accountNumber ? `\n• Account Number: *${invoice.bankDetails.accountNumber}*` : '') +
      (invoice.bankDetails.accountHolder ? `\n• Account Name: ${invoice.bankDetails.accountHolder}` : '') +
      (invoice.bankDetails.swiftCode ? `\n• SWIFT Code: ${invoice.bankDetails.swiftCode}` : '');
  }

  const message = `Hello *${invoice.customer?.name || 'Valued Guest'}*! 👋\n\n` +
    `Here is your official invoice from *${cName}*:\n\n` +
    `🧾 *Invoice Number:* #${invoice.invoiceNumber}\n` +
    `📅 *Issue Date:* ${invoice.issueDate}\n` +
    `⏳ *Due Date:* ${invoice.dueDate}\n` +
    `📌 *Status:* ${invoice.status.toUpperCase()}\n\n` +
    `📦 *Itemized Services:*\n${itemsList}\n\n` +
    `💰 *Grand Total:* *${totalFormatted}*\n` +
    (invoice.paidAmount ? `💵 *Amount Paid:* ${formatInvoiceAmount(invoice.paidAmount, currency)}\n` : '') +
    `🔴 *Balance Due:* *${balanceFormatted}*\n` +
    paymentLinkSection +
    bankSection +
    (invoice.paymentInstructions ? `\n\n📝 *Payment Instructions:*\n${invoice.paymentInstructions}` : '') +
    (invoice.notes ? `\n\n💬 *Note:* ${invoice.notes}` : '') +
    `\n\nThank you for choosing *${cName}*! Please reply to this message once you have completed payment. 🙏✨`;

  return message;
}

/**
 * Triggers WhatsApp app or Web with the pre-filled invoice message.
 */
export function openInvoiceWhatsApp(invoice: TenantInvoice) {
  const phone = (invoice.customer?.whatsapp || invoice.customer?.phone || '').replace(/\D/g, '');
  const message = generateInvoiceWhatsAppText(invoice);
  const encoded = encodeURIComponent(message);
  
  if (phone) {
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  } else {
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }
}

/**
 * Dispatches an email with the official invoice HTML to the customer.
 */
export async function sendInvoiceEmail(invoice: TenantInvoice, extraInfo?: any): Promise<{ success: boolean; message: string }> {
  try {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    const tenantId = invoice.tenantId || getActiveTenantId() || 'global';

    const response = await fetch('/api/send-invoice-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        invoice,
        tenantId,
        to: invoice.customer?.email,
        extraInfo
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}: Failed to dispatch invoice email`);
    }

    const data = await response.json();

    // Log the event in Firestore
    const log: InvoiceAuditLog = {
      id: `log_${Date.now()}`,
      action: 'sent_email',
      timestamp: new Date().toISOString(),
      actorName: auth.currentUser?.displayName || 'Admin',
      notes: `Invoice emailed to ${invoice.customer?.email}`
    };

    const updatedLogs = [...(invoice.auditLogs || []), log];
    await setDoc(doc(db, 'tenant_invoices', invoice.id), {
      sentAt: new Date().toISOString(),
      auditLogs: updatedLogs
    }, { merge: true });

    return { success: true, message: data.message || `Invoice successfully sent to ${invoice.customer?.email}` };
  } catch (error: any) {
    console.error('Failed to send invoice email:', error);
    throw error;
  }
}
