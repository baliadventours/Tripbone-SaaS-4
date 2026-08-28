/**
 * Constructs an official HTML email document for tenant invoices.
 */
import { TenantInvoice } from "../types";

export function buildInvoiceEmailHtml(params: {
  invoice: TenantInvoice;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyAddress?: string;
  companyLogo?: string;
}) {
  const inv = params.invoice;
  const cName = params.companyName || inv.tenantName || 'Tour & Travel Operator';
  const cEmail = params.companyEmail || inv.tenantEmail || 'info@tripbone.com';
  const cPhone = params.companyPhone || inv.tenantPhone || '';
  const cWeb = params.companyWebsite || inv.tenantWebsite || '';
  const cAddress = params.companyAddress || inv.tenantAddress || '';
  const cLogo = params.companyLogo || inv.tenantLogo || '';

  const currency = inv.currency || 'USD';
  const formatMoney = (amount: number) => {
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
  };

  const statusColor = inv.status === 'paid' ? '#10b981' : inv.status === 'overdue' ? '#ef4444' : '#f59e0b';
  const statusLabel = (inv.status || 'unpaid').toUpperCase();

  // Line items HTML
  let itemsRowsHtml = '';
  if (Array.isArray(inv.items)) {
    inv.items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      const bg = isEven ? '#ffffff' : '#f8fafc';
      itemsRowsHtml += `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 14px; font-size: 13px; color: #0f172a; font-weight: 600;">
            ${item.title}
            ${item.description ? `<div style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 2px;">${item.description}</div>` : ''}
          </td>
          <td style="padding: 12px 14px; font-size: 13px; color: #475569; text-align: center;">
            ${item.quantity || 1}
          </td>
          <td style="padding: 12px 14px; font-size: 13px; color: #475569; text-align: right;">
            ${formatMoney(item.unitPrice || 0)}
          </td>
          <td style="padding: 12px 14px; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">
            ${formatMoney(item.totalPrice || 0)}
          </td>
        </tr>
      `;
    });
  }

  // Payment Link Button HTML
  let paymentButtonHtml = '';
  if (inv.paymentButton && inv.paymentButton.enabled && inv.paymentButton.url && inv.status !== 'paid') {
    paymentButtonHtml = `
      <div style="margin: 28px 0 20px 0; text-align: center; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #86efac; border-radius: 14px; padding: 24px;">
        <div style="font-size: 12px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          ⚡ Instant Secure Online Payment
        </div>
        <div style="margin-bottom: 14px; font-size: 13px; color: #166534;">
          ${inv.paymentButton.description || 'Click the button below to complete your payment with Instant Confirmation:'}
        </div>
        <a href="${inv.paymentButton.url}" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 12px rgba(2,132,199,0.35); text-transform: uppercase; letter-spacing: 0.5px;">
          ${inv.paymentButton.label || 'Pay Invoice Online Now'} →
        </a>
        <div style="font-size: 11px; color: #64748b; margin-top: 10px; word-break: break-all;">
          Or copy link: <a href="${inv.paymentButton.url}" style="color: #0284c7;">${inv.paymentButton.url}</a>
        </div>
      </div>
    `;
  }

  // Bank details HTML
  let bankDetailsHtml = '';
  if (inv.bankDetails && (inv.bankDetails.bankName || inv.bankDetails.accountNumber || inv.paymentInstructions)) {
    bankDetailsHtml = `
      <div style="margin: 20px 0; padding: 18px 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="font-weight: 800; color: #0f172a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: flex; align-items: center;">
          🏦 Bank Transfer & Payment Instructions
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          ${inv.bankDetails.bankName ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 140px;">Bank Name:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${inv.bankDetails.bankName}</td>
            </tr>
          ` : ''}
          ${inv.bankDetails.accountNumber ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Account Number:</td>
              <td style="padding: 4px 0; color: #0284c7; font-weight: 800; font-family: monospace; font-size: 14px;">${inv.bankDetails.accountNumber}</td>
            </tr>
          ` : ''}
          ${inv.bankDetails.accountHolder ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Account Holder:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${inv.bankDetails.accountHolder}</td>
            </tr>
          ` : ''}
          ${inv.bankDetails.swiftCode ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b;">SWIFT / BIC Code:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${inv.bankDetails.swiftCode}</td>
            </tr>
          ` : ''}
          ${inv.bankDetails.paypalEmail ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b;">PayPal Email:</td>
              <td style="padding: 4px 0; color: #0284c7; font-weight: 700;">${inv.bankDetails.paypalEmail}</td>
            </tr>
          ` : ''}
        </table>
        ${inv.paymentInstructions ? `
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #475569; line-height: 1.5; white-space: pre-line;">
            ${inv.paymentInstructions}
          </div>
        ` : ''}
      </div>
    `;
  }

  const emailSubject = `Invoice #${inv.invoiceNumber} from ${cName} - Total: ${formatMoney(inv.totalAmount || 0)}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${emailSubject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b;">
      <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 28px; color: #ffffff;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                ${cLogo ? `<img src="${cLogo}" alt="${cName}" style="max-height: 48px; margin-bottom: 12px; display: block;" />` : ''}
                <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">${cName}</h1>
                ${cAddress ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">${cAddress}</p>` : ''}
                ${cEmail || cPhone ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #94a3b8;">${[cEmail, cPhone, cWeb].filter(Boolean).join(' • ')}</p>` : ''}
              </td>
              <td style="text-align: right; vertical-align: top;">
                <div style="font-size: 24px; font-weight: 900; color: #38bdf8; letter-spacing: 1px;">INVOICE</div>
                <div style="font-size: 13px; font-weight: 700; color: #f8fafc; margin-top: 4px;">#${inv.invoiceNumber}</div>
                <div style="display: inline-block; margin-top: 8px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; background-color: ${statusColor}; color: #ffffff;">
                  ${statusLabel}
                </div>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding: 28px;">
          <!-- Invoice Meta Info & Bill To -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="width: 50%; vertical-align: top; padding-right: 16px;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 6px;">Billed To:</div>
                <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${inv.customer?.name || 'Valued Guest'}</div>
                ${inv.customer?.company ? `<div style="font-size: 13px; color: #475569; font-weight: 600;">${inv.customer.company}</div>` : ''}
                ${inv.customer?.email ? `<div style="font-size: 13px; color: #64748b;">${inv.customer.email}</div>` : ''}
                ${inv.customer?.phone ? `<div style="font-size: 13px; color: #64748b;">${inv.customer.phone}</div>` : ''}
                ${inv.customer?.address ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${inv.customer.address}</div>` : ''}
                ${inv.customer?.country ? `<div style="font-size: 12px; color: #64748b;">${inv.customer.country}</div>` : ''}
              </td>
              <td style="width: 50%; vertical-align: top; padding-left: 16px; background-color: #f8fafc; border-radius: 10px; padding: 14px;">
                <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Issue Date:</td>
                    <td style="padding: 4px 0; color: #0f172a; font-weight: 700; text-align: right;">${inv.issueDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Due Date:</td>
                    <td style="padding: 4px 0; color: #dc2626; font-weight: 700; text-align: right;">${inv.dueDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Currency:</td>
                    <td style="padding: 4px 0; color: #0f172a; font-weight: 700; text-align: right;">${inv.currency}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Total Due:</td>
                    <td style="padding: 4px 0; color: #0284c7; font-weight: 900; font-size: 14px; text-align: right;">${formatMoney(inv.balanceDue ?? inv.totalAmount ?? 0)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Line Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; text-align: left;">Item Description</th>
                <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; text-align: center; width: 60px;">Qty</th>
                <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; text-align: right; width: 120px;">Unit Price</th>
                <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; text-align: right; width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>

          <!-- Totals Calculation Box -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
            <table style="width: 260px; margin-left: auto; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Subtotal:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${formatMoney(inv.subtotal || 0)}</td>
              </tr>
              ${inv.discountAmount ? `
                <tr>
                  <td style="padding: 6px 0; color: #16a34a;">Discount:</td>
                  <td style="padding: 6px 0; color: #16a34a; font-weight: 600; text-align: right;">-${formatMoney(inv.discountAmount)}</td>
                </tr>
              ` : ''}
              ${inv.taxAmount ? `
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Tax / VAT (${inv.taxRate || 0}%):</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">+${formatMoney(inv.taxAmount)}</td>
                </tr>
              ` : ''}
              <tr style="border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a;">
                <td style="padding: 10px 0; color: #0f172a; font-weight: 900; font-size: 15px;">Grand Total:</td>
                <td style="padding: 10px 0; color: #0f172a; font-weight: 900; font-size: 16px; text-align: right;">${formatMoney(inv.totalAmount || 0)}</td>
              </tr>
              ${inv.paidAmount ? `
                <tr>
                  <td style="padding: 6px 0; color: #15803d; font-weight: 600;">Amount Paid:</td>
                  <td style="padding: 6px 0; color: #15803d; font-weight: 700; text-align: right;">-${formatMoney(inv.paidAmount)}</td>
                </tr>
                <tr style="border-top: 1px dashed #cbd5e1;">
                  <td style="padding: 8px 0; color: #dc2626; font-weight: 900;">Balance Due:</td>
                  <td style="padding: 8px 0; color: #dc2626; font-weight: 900; font-size: 15px; text-align: right;">${formatMoney(inv.balanceDue ?? 0)}</td>
                </tr>
              ` : ''}
            </table>
          </div>

          <!-- Payment CTA Button -->
          ${paymentButtonHtml}

          <!-- Bank & Wire Instructions -->
          ${bankDetailsHtml}

          <!-- Notes & Terms -->
          ${inv.notes ? `
            <div style="margin-top: 20px; padding: 14px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; font-size: 12px; color: #92400e; line-height: 1.5;">
              <strong>📝 Notes:</strong> ${inv.notes}
            </div>
          ` : ''}

          ${inv.terms ? `
            <div style="margin-top: 16px; font-size: 11px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 12px;">
              <strong>Terms & Conditions:</strong> ${inv.terms}
            </div>
          ` : ''}

          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
            Thank you for choosing ${cName}! If you have any questions concerning this invoice, please reach out to ${cEmail || cPhone || 'us'}.
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  return { subject: emailSubject, html: emailHtml };
}
