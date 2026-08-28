---
name: tripbone_saas_architecture
description: Deep architecture, multi-tenant rules, BYOPG payment gateway integration, Firestore data sanitization, cross-tenant GTM/GA scoping, and bundling standards for the Tripbone SaaS platform.
---

# Tripbone SaaS Architecture & Engineering Skill Guide

This skill provides comprehensive architectural guidelines, database synchronization rules, payment gateway patterns, and multi-tenant analytics isolation protocols for the Tripbone SaaS codebase.

---

## 1. Multi-Tenant Domain & Database Resolution

### Tenant Context Identification
- Every tenant operates on its own domain, custom domain, or preview subdomain.
- Identify active tenant context using `tenantId` or the fallback helper `getActiveTenantId()`.
- Default to `'global'` or primary merchant ID if no specific tenant is resolved.

### Dual-Document Firestore Storage Pattern
When reading or updating tenant payment and system configuration, always maintain dual-document backward compatibility:
- **Primary Document Path**: `paymentSettings/{tenantId}`
- **Legacy Fallback Path**: `settings/payment_{tenantId}`

```typescript
// Reading settings with fallback
const activeId = tenantId || getActiveTenantId() || 'global';
let docSnap = await getDoc(doc(db, 'paymentSettings', activeId));
if (!docSnap.exists()) {
  docSnap = await getDoc(doc(doc(db, 'settings', 'payment_' + activeId)));
}
```

---

## 2. Universal BYOPG (Bring Your Own Payment Gateway) Architecture

### Multi-Gateway Enablement
Tripbone allows tenants to enable multiple payment gateways simultaneously:
- **Supported Gateways**: `stripe`, `midtrans`, `xendit`, `razorpay`, `adyen`, `paypal`, `bank_transfer`, `pay_on_arrival`.
- **Gateway Configuration Structure**:
  Stored in `tenantSettings.providerConfigs[providerId]` containing API keys, secret keys, webhook secrets, and `enabled` boolean state.

### Flat Boolean Flag Synchronization
To maintain backwards compatibility with legacy UI components, flat boolean flags must be derived and synchronized whenever settings are saved:

```typescript
const flatLegacyFields = {
  activeProviderId: updatedSettings.activeProviderId,
  providerConfigs: updatedSettings.providerConfigs,
  
  // Synchronized multi-gateway boolean flags
  isStripeEnabled: updatedSettings.providerConfigs.stripe?.enabled ?? false,
  isMidtransEnabled: updatedSettings.providerConfigs.midtrans?.enabled ?? false,
  isXenditEnabled: updatedSettings.providerConfigs.xendit?.enabled ?? false,
  isRazorpayEnabled: updatedSettings.providerConfigs.razorpay?.enabled ?? false,
  isAdyenEnabled: updatedSettings.providerConfigs.adyen?.enabled ?? false,
  isPaypalEnabled: updatedSettings.providerConfigs.paypal?.enabled ?? false,
  creditCardEnabled: (updatedSettings.providerConfigs.paypal?.enabled || updatedSettings.providerConfigs.stripe?.enabled) ?? false,
  isBankTransferEnabled: updatedSettings.providerConfigs.bank_transfer?.enabled ?? true,
  isPayOnArrivalEnabled: updatedSettings.providerConfigs.pay_on_arrival?.enabled ?? true,
};
```

---

## 3. Firestore Data Sanitization (`sanitizeFirestoreData`)

### Preventing `undefined` Field Errors
Firestore strictly rejects documents containing `undefined` values (`FirebaseError: Function setDoc() called with invalid data. Unsupported field value: undefined`).

Before executing `setDoc` or `updateDoc`, pass data payload through `sanitizeFirestoreData`:

```typescript
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

// Example usage:
const sanitizedData = sanitizeFirestoreData(flatLegacyFields);
await setDoc(doc(db, 'paymentSettings', tenantId), sanitizedData, { merge: true });
await setDoc(doc(db, 'settings', 'payment_' + tenantId), sanitizedData, { merge: true });
```

### Strict Null & Default Handling
Never assume optional fields exist in Firestore documents without default values:
- `depositType`: Defaults to `'percentage'`
- `depositPercentage`: Defaults to `100`
- `fixedDepositAmount`: Defaults to `50`
- `depositCurrency`: Defaults to `'USD'`
- `customExchangeRates`: Defaults to `{}`
- `lastDiagnostic`: Defaults to `null`

---

## 4. Analytics & Google Tag Manager (GTM) Cross-Tenant Isolation

### Preventing Cross-Tenant Data & Cookie Leaks
Because multiple tenant websites run under the Tripbone SaaS infrastructure, cross-tenant cookie sharing must be explicitly prohibited:

1. **Domain Cookie Scoping**: Scope tracking cookies strictly to the current host domain:
   ```typescript
   window.gtag('config', measurementId, {
     page_path: window.location.pathname + window.location.search,
     send_page_view: true,
     cookie_domain: window.location.hostname === 'localhost' ? 'none' : window.location.hostname,
     cookie_flags: 'SameSite=None;Secure'
   });
   ```

2. **DataLayer Cleansing**: When unmounting or switching tenant tracking contexts, clear `window.dataLayer` to prevent residual event tagging across tenants:
   ```typescript
   if (window.dataLayer && Array.isArray(window.dataLayer)) {
     window.dataLayer.length = 0;
   }
   ```

---

## 5. Vite & esbuild Syntax Compatibility Rules

### Parentheses Grouping for Mixed Logical Operators
When combining nullish coalescing (`??`) and logical OR (`||`) operators, esbuild and Vite will fail during production bundling if explicit grouping parentheses are omitted.

```typescript
// ❌ FAILS IN ESBUILD BUNDLE:
const enabled = updatedSettings.providerConfigs.paypal?.enabled || updatedSettings.providerConfigs.stripe?.enabled ?? false;

// ✅ CORRECT:
const enabled = (updatedSettings.providerConfigs.paypal?.enabled || updatedSettings.providerConfigs.stripe?.enabled) ?? false;
```

---

## 6. Checkout Flow & Gateway Redirection

When finalizing bookings:
1. Online payment providers (`stripe`, `midtrans`, `xendit`, `razorpay`, `adyen`) trigger gateway checkout via `PaymentService.createCheckoutForBooking(...)`.
2. Upon receiving `checkoutUrl`, redirect the user directly to the gateway payment screen.
3. Offline or manual methods (`bank_transfer`, `pay_on_arrival`) finalize booking immediately and navigate to `/booking-success/{bookingId}`.
