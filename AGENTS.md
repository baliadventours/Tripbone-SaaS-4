# AGENTS.md - Tripbone SaaS Development & Architecture Instructions

This document provides project-specific context, conventions, and rules for AI agents working on the Tripbone SaaS codebase. Detailed architectural workflows and skill guides are documented in `/.agents/skills/tripbone_saas_architecture/SKILL.md`.

---

## 1. Multi-Tenant Architecture & Domain Resolution
- **Tenant Context**: All settings (payment, branding, analytics) are scoped per tenant (`tenantId` or `getActiveTenantId()`).
- **Database Paths**: Primary tenant settings reside in `paymentSettings/{tenantId}` and legacy fallback `settings/payment_{tenantId}`. Sync updates to both paths for backwards compatibility.

---

## 2. Universal Payment Gateway (BYOPG) Architecture
- **Multi-Gateway Enablement**: Multiple payment gateways (Stripe, Midtrans, Xendit, Razorpay, Adyen, PayPal, Bank Transfer, Pay on Arrival) can be enabled simultaneously.
- **Provider Configs**: Gateway details are stored inside `tenantSettings.providerConfigs[providerId]`.
- **Firestore Data Sanitization**: Always pass updated settings through `sanitizeFirestoreData()` before `setDoc` to prevent `FirebaseError: Function setDoc() called with invalid data. Unsupported field value: undefined`. Never write `undefined` fields to Firestore documents.

---

## 3. Analytics & Google Tag Manager (GTM) Scoping
- **Cross-Tenant Isolation**: When initializing Google Analytics or GTM scripts, scope cookies to `window.location.hostname` (`cookie_domain: window.location.hostname`) and set `cookie_flags: 'SameSite=None;Secure'`.
- **DataLayer Reset**: Clear `window.dataLayer` array when switching tenant tracking contexts to prevent event/tag pollution across different tenant domains.

---

## 4. Code Base Quality & Type Safety
- **Strict Null Checks**: Never assume optional fields exist without defaults (e.g. `depositPercentage`, `fixedDepositAmount`, `depositCurrency`).
- **Vite & esbuild Bundle Rules**: Avoid mixing standard nullish coalescing (`??`) and logical OR (`||`) operators on the same line without explicit parentheses grouping.
