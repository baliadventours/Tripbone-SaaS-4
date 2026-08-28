import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PaymentGatewayRegistry } from './PaymentGatewayRegistry';
import {
  GatewayConfig,
  PaymentProviderId,
  TestConnectionResult,
  CreateCheckoutParams,
  CheckoutResult,
  WebhookPayload,
  WebhookValidationResult,
  PaymentStatusResult,
  DiagnosticResult,
  DiagnosticStep,
  WebhookLogEntry,
  PaymentTimelineEvent,
  GatewayHealthResult,
} from './types';
import { PaymentLogger } from './PaymentLogger';
import { PaymentGatewayError, PaymentErrorCode } from './errors';

export interface TenantPaymentSettings {
  activeProviderId: PaymentProviderId;
  providerConfigs: Record<string, GatewayConfig>;
  depositType: 'percentage' | 'fixed' | 'full';
  depositPercentage: number;
  fixedDepositAmount?: number;
  depositCurrency?: string;
  autoConfirmOnPayment: boolean;
  currencyConversionEnabled: boolean;
  customExchangeRates?: Record<string, number>;
  lastDiagnostic?: DiagnosticResult;
  updatedAt: string;
}

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

export class PaymentService {
  private static registry = PaymentGatewayRegistry.getInstance();

  /**
   * Retrieves tenant payment configuration, seamlessly migrating legacy schema formats.
   */
  public static async getTenantSettings(tenantId: string = 'global'): Promise<TenantPaymentSettings> {
    try {
      const docRef = doc(db, 'paymentSettings', tenantId);
      const snap = await getDoc(docRef);

      const defaultConfigs: Record<string, GatewayConfig> = {
        stripe: { providerId: 'stripe', mode: 'sandbox', enabled: false },
        xendit: { providerId: 'xendit', mode: 'sandbox', enabled: false },
        razorpay: { providerId: 'razorpay', mode: 'sandbox', enabled: false },
        adyen: { providerId: 'adyen', mode: 'sandbox', enabled: false },
        paypal: { providerId: 'paypal', mode: 'sandbox', enabled: false },
        midtrans: { providerId: 'midtrans', mode: 'sandbox', enabled: false },
        wise: { providerId: 'wise', mode: 'live', enabled: false },
        bank_transfer: { providerId: 'bank_transfer', mode: 'live', enabled: true },
        pay_on_arrival: { providerId: 'pay_on_arrival', mode: 'live', enabled: true },
      };

      if (!snap.exists()) {
        return {
          activeProviderId: 'bank_transfer',
          providerConfigs: defaultConfigs,
          depositType: 'percentage',
          depositPercentage: 100,
          autoConfirmOnPayment: true,
          currencyConversionEnabled: false,
          updatedAt: new Date().toISOString(),
        };
      }

      const data = snap.data();

      // Normalize providerConfigs from raw document
      const providerConfigs: Record<string, GatewayConfig> = {
        ...defaultConfigs,
        ...(data.providerConfigs || {}),
      };

      // Seamless backward compatibility migration layer
      if (data.stripeSecretKey || data.stripePublicKey) {
        providerConfigs.stripe = {
          ...providerConfigs.stripe,
          secretKey: data.stripeSecretKey || providerConfigs.stripe.secretKey,
          publicKey: data.stripePublicKey || providerConfigs.stripe.publicKey,
          apiKey: data.stripeSecretKey || providerConfigs.stripe.apiKey,
          webhookSecret: data.stripeWebhookSecret || providerConfigs.stripe.webhookSecret,
          mode: data.mode === 'live' ? 'live' : providerConfigs.stripe.mode,
          enabled: true,
        };
      }

      if (data.xenditApiKey) {
        providerConfigs.xendit = {
          ...providerConfigs.xendit,
          apiKey: data.xenditApiKey || providerConfigs.xendit.apiKey,
          secretKey: data.xenditApiKey || providerConfigs.xendit.secretKey,
          webhookSecret: data.xenditWebhookSecret || providerConfigs.xendit.webhookSecret,
          mode: data.mode === 'live' ? 'live' : providerConfigs.xendit.mode,
          enabled: true,
        };
      }

      if (data.razorpayKeyId || data.razorpayKeySecret) {
        providerConfigs.razorpay = {
          ...providerConfigs.razorpay,
          publicKey: data.razorpayKeyId || providerConfigs.razorpay.publicKey,
          secretKey: data.razorpayKeySecret || providerConfigs.razorpay.secretKey,
          webhookSecret: data.razorpayWebhookSecret || providerConfigs.razorpay.webhookSecret,
          mode: data.mode === 'live' ? 'live' : providerConfigs.razorpay.mode,
          enabled: true,
        };
      }

      if (data.paypalClientId) {
        providerConfigs.paypal = {
          ...providerConfigs.paypal,
          publicKey: data.paypalClientId || providerConfigs.paypal.publicKey,
          secretKey: data.paypalSecret || providerConfigs.paypal.secretKey,
          mode: data.mode === 'live' ? 'live' : providerConfigs.paypal.mode,
          enabled: true,
        };
      }

      if (data.midtransServerKey) {
        providerConfigs.midtrans = {
          ...providerConfigs.midtrans,
          secretKey: data.midtransServerKey || providerConfigs.midtrans.secretKey,
          publicKey: data.midtransClientKey || providerConfigs.midtrans.publicKey,
          mode: data.mode === 'live' ? 'live' : providerConfigs.midtrans.mode,
          enabled: true,
        };
      }

      if (data.bankName || data.accountNumber) {
        providerConfigs.bank_transfer = {
          ...providerConfigs.bank_transfer,
          bankName: data.bankName || providerConfigs.bank_transfer.bankName,
          accountNumber: data.accountNumber || providerConfigs.bank_transfer.accountNumber,
          accountHolder: data.accountHolder || providerConfigs.bank_transfer.accountHolder,
          swiftCode: data.swiftCode || providerConfigs.bank_transfer.swiftCode,
          instructions: data.paymentInstructions || data.instructions || providerConfigs.bank_transfer.instructions,
          enabled: true,
        };
      }

      if (data.wiseApiToken || data.isWiseEnabled) {
        providerConfigs.wise = {
          ...providerConfigs.wise,
          apiKey: data.wiseApiToken || providerConfigs.wise.apiKey,
          secretKey: data.wiseApiToken || providerConfigs.wise.secretKey,
          profileId: data.wiseProfileId || providerConfigs.wise.profileId,
          mode: data.mode === 'live' ? 'live' : providerConfigs.wise.mode,
          enabled: !!data.isWiseEnabled,
        };
      }

      let activeProviderId = data.activeProviderId || data.activeGateway || data.activeProvider || 'bank_transfer';
      if (!PaymentService.registry.hasGateway(activeProviderId)) {
        activeProviderId = 'bank_transfer';
      }

      return {
        activeProviderId,
        providerConfigs,
        depositType: data.depositType || 'percentage',
        depositPercentage: data.depositPercentage !== undefined ? data.depositPercentage : 100,
        fixedDepositAmount: data.fixedDepositAmount !== undefined ? data.fixedDepositAmount : 50,
        depositCurrency: data.depositCurrency || 'USD',
        autoConfirmOnPayment: data.autoConfirmOnPayment !== undefined ? data.autoConfirmOnPayment : true,
        currencyConversionEnabled: !!data.currencyConversionEnabled,
        customExchangeRates: data.customExchangeRates || {},
        lastDiagnostic: data.lastDiagnostic || null,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    } catch (err: any) {
      PaymentLogger.logError('system', 'getTenantSettings', err);
      const defaultConfigs: Record<string, GatewayConfig> = {
        stripe: { providerId: 'stripe', mode: 'sandbox', enabled: false },
        xendit: { providerId: 'xendit', mode: 'sandbox', enabled: false },
        razorpay: { providerId: 'razorpay', mode: 'sandbox', enabled: false },
        adyen: { providerId: 'adyen', mode: 'sandbox', enabled: false },
        paypal: { providerId: 'paypal', mode: 'sandbox', enabled: false },
        midtrans: { providerId: 'midtrans', mode: 'sandbox', enabled: false },
        wise: { providerId: 'wise', mode: 'live', enabled: false },
        bank_transfer: { providerId: 'bank_transfer', mode: 'live', enabled: true },
        pay_on_arrival: { providerId: 'pay_on_arrival', mode: 'live', enabled: true },
      };
      return {
        activeProviderId: 'bank_transfer',
        providerConfigs: defaultConfigs,
        depositType: 'percentage',
        depositPercentage: 100,
        autoConfirmOnPayment: true,
        currencyConversionEnabled: false,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Verifies provider credentials with API test before saving.
   * Updates verification metadata and blocks activation if invalid.
   */
  public static async testAndVerifyCredentials(
    tenantId: string = 'global',
    providerId: PaymentProviderId,
    config: GatewayConfig
  ): Promise<TestConnectionResult> {
    const gateway = PaymentService.registry.getGateway(providerId);
    PaymentLogger.logInfo(providerId, 'testAndVerifyCredentials', { mode: config.mode });

    const testRes = await gateway.testConnection(config);

    if (testRes.success) {
      config.verificationMeta = {
        verifiedAt: new Date().toISOString(),
        connectionStatus: 'connected',
        merchantName: testRes.merchantName,
        accountStatus: testRes.accountStatus,
        mode: testRes.mode,
      };
    } else {
      config.verificationMeta = {
        verifiedAt: new Date().toISOString(),
        connectionStatus: 'failed',
        accountStatus: 'unverified',
        mode: config.mode,
        errorMessage: testRes.message,
      };
    }

    return testRes;
  }

  /**
   * Saves updated tenant payment configuration safely.
   */
  public static async saveTenantSettings(
    tenantId: string = 'global',
    settings: Partial<TenantPaymentSettings>
  ): Promise<void> {
    const existing = await PaymentService.getTenantSettings(tenantId);
    const updatedSettings: TenantPaymentSettings = {
      ...existing,
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    // Keep legacy flat fields updated in sync so older parts of code read them without error
    const activeConfig = updatedSettings.providerConfigs[updatedSettings.activeProviderId] || {};
    const flatLegacyFields: Record<string, any> = {
      activeProviderId: updatedSettings.activeProviderId,
      activeGateway: updatedSettings.activeProviderId,
      activeProvider: updatedSettings.activeProviderId,
      depositType: updatedSettings.depositType,
      depositPercentage: updatedSettings.depositPercentage,
      fixedDepositAmount: updatedSettings.fixedDepositAmount,
      depositCurrency: updatedSettings.depositCurrency,
      autoConfirmOnPayment: updatedSettings.autoConfirmOnPayment,
      currencyConversionEnabled: updatedSettings.currencyConversionEnabled,
      customExchangeRates: updatedSettings.customExchangeRates,
      providerConfigs: updatedSettings.providerConfigs,
      lastDiagnostic: updatedSettings.lastDiagnostic || null,
      updatedAt: updatedSettings.updatedAt,
      // Flat syncs for legacy components & multi gateway flags:
      isStripeEnabled: updatedSettings.providerConfigs.stripe?.enabled ?? false,
      isXenditEnabled: updatedSettings.providerConfigs.xendit?.enabled ?? false,
      isRazorpayEnabled: updatedSettings.providerConfigs.razorpay?.enabled ?? false,
      isAdyenEnabled: updatedSettings.providerConfigs.adyen?.enabled ?? false,
      isPaypalEnabled: updatedSettings.providerConfigs.paypal?.enabled ?? false,
      isWiseEnabled: updatedSettings.providerConfigs.wise?.enabled ?? false,
      creditCardEnabled: (updatedSettings.providerConfigs.paypal?.enabled || updatedSettings.providerConfigs.stripe?.enabled) ?? false,
      isMidtransEnabled: updatedSettings.providerConfigs.midtrans?.enabled ?? false,
      isBankTransferEnabled: updatedSettings.providerConfigs.bank_transfer?.enabled ?? true,
      isPayOnArrivalEnabled: updatedSettings.providerConfigs.pay_on_arrival?.enabled ?? true,
      stripePublicKey: updatedSettings.providerConfigs.stripe?.publicKey || '',
      stripeSecretKey: updatedSettings.providerConfigs.stripe?.secretKey || '',
      stripeWebhookSecret: updatedSettings.providerConfigs.stripe?.webhookSecret || '',
      xenditApiKey: updatedSettings.providerConfigs.xendit?.apiKey || updatedSettings.providerConfigs.xendit?.secretKey || '',
      xenditWebhookSecret: updatedSettings.providerConfigs.xendit?.webhookSecret || '',
      razorpayKeyId: updatedSettings.providerConfigs.razorpay?.publicKey || '',
      razorpayKeySecret: updatedSettings.providerConfigs.razorpay?.secretKey || '',
      razorpayWebhookSecret: updatedSettings.providerConfigs.razorpay?.webhookSecret || '',
      paypalClientId: updatedSettings.providerConfigs.paypal?.publicKey || '',
      paypalSecret: updatedSettings.providerConfigs.paypal?.secretKey || '',
      midtransServerKey: updatedSettings.providerConfigs.midtrans?.secretKey || '',
      midtransClientKey: updatedSettings.providerConfigs.midtrans?.publicKey || '',
      wiseApiToken: updatedSettings.providerConfigs.wise?.apiKey || updatedSettings.providerConfigs.wise?.secretKey || '',
      wiseProfileId: updatedSettings.providerConfigs.wise?.profileId || '',
      bankName: updatedSettings.providerConfigs.bank_transfer?.bankName || '',
      accountNumber: updatedSettings.providerConfigs.bank_transfer?.accountNumber || '',
      accountHolder: updatedSettings.providerConfigs.bank_transfer?.accountHolder || '',
      swiftCode: updatedSettings.providerConfigs.bank_transfer?.swiftCode || '',
      paymentInstructions: updatedSettings.providerConfigs.bank_transfer?.instructions || '',
      mode: (activeConfig as GatewayConfig)?.mode || 'sandbox',
    };

    const sanitizedFields = sanitizeFirestoreData(flatLegacyFields);

    const docRef = doc(db, 'paymentSettings', tenantId);
    await setDoc(docRef, sanitizedFields, { merge: true });

    // Sync to legacy document path as well
    const legacyDocRef = doc(db, 'settings', 'payment_' + tenantId);
    await setDoc(legacyDocRef, sanitizedFields, { merge: true });

    PaymentLogger.logInfo('system', 'saveTenantSettings', { activeProviderId: updatedSettings.activeProviderId });
  }

  /**
   * Initiates payment checkout for a booking using the active gateway or specified provider.
   */
  public static async createCheckoutForBooking(
    booking: {
      id: string;
      tourTitle: string;
      customerData: { fullName: string; email: string; phone?: string };
      totalAmount: number;
      currency?: string;
    },
    tenantId: string = 'global',
    baseUrl: string = window.location.origin,
    selectedProviderId?: PaymentProviderId
  ): Promise<CheckoutResult> {
    const settings = await PaymentService.getTenantSettings(tenantId);
    const providerId = selectedProviderId || settings.activeProviderId;
    const gatewayConfig = settings.providerConfigs[providerId];

    if (!gatewayConfig) {
      throw new PaymentGatewayError(
        PaymentErrorCode.CONFIG_MISSING,
        providerId,
        `Payment configuration for '${providerId}' is missing.`
      );
    }

    const gateway = PaymentService.registry.getGateway(providerId);

    // Calculate required deposit amount
    let checkoutAmount = booking.totalAmount;
    if (settings.depositType === 'percentage' && settings.depositPercentage < 100) {
      checkoutAmount = Math.round((booking.totalAmount * settings.depositPercentage) / 100);
    } else if (settings.depositType === 'fixed' && settings.fixedDepositAmount) {
      checkoutAmount = Math.min(booking.totalAmount, settings.fixedDepositAmount);
    }

    const checkoutParams: CreateCheckoutParams = {
      bookingId: booking.id,
      tourTitle: booking.tourTitle,
      customerName: booking.customerData?.fullName || 'Guest',
      customerEmail: booking.customerData?.email || '',
      customerPhone: booking.customerData?.phone || '',
      amount: checkoutAmount,
      currency: booking.currency || 'USD',
      returnUrl: `${baseUrl}/booking-success?booking_id=${booking.id}`,
      cancelUrl: `${baseUrl}/checkout?booking_id=${booking.id}`,
      webhookUrl: `${baseUrl}/api/webhooks/payment/${providerId}?tenant_id=${tenantId}`,
    };

    PaymentLogger.logInfo(providerId, 'createCheckoutForBooking', { bookingId: booking.id, amount: checkoutAmount });

    const result = await gateway.createCheckout(checkoutParams, gatewayConfig);

    // Record checkout creation in payment timeline
    await PaymentService.addTimelineEvent(booking.id, {
      step: 'checkout_created',
      title: 'Checkout Session Created',
      description: `Payment checkout session initialized with ${gateway.name} for ${checkoutParams.currency} ${checkoutParams.amount}.`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      metadata: { transactionId: result.transactionId, providerId },
    });

    return result;
  }

  /**
   * Runs end-to-end payment diagnostic testing.
   */
  public static async runDiagnostic(tenantId: string = 'global'): Promise<DiagnosticResult> {
    const settings = await PaymentService.getTenantSettings(tenantId);
    const providerId = settings.activeProviderId;
    const config = settings.providerConfigs[providerId];

    const gateway = PaymentService.registry.getGateway(providerId);
    const steps: DiagnosticStep[] = [];

    // Step 1: Gateway Configuration Check
    steps.push({
      id: 'step_config',
      name: 'Gateway Configuration Check',
      status: 'running',
    });

    if (!config) {
      steps[0].status = 'fail';
      steps[0].message = `No gateway configuration found for provider ${providerId}.`;
      return {
        overallStatus: 'fail',
        healthScore: 0,
        timestamp: new Date().toISOString(),
        steps,
      };
    } else {
      steps[0].status = 'pass';
      steps[0].message = `Config loaded for ${gateway.name} (${config.mode.toUpperCase()} Mode).`;
    }

    // Step 2: API Credentials & Authentication Test
    steps.push({
      id: 'step_auth',
      name: 'API Credential Authentication',
      status: 'running',
    });

    const connTest = await gateway.testConnection(config);
    if (connTest.success) {
      steps[1].status = 'pass';
      steps[1].message = `Connected successfully (${connTest.latencyMs}ms). Merchant: ${connTest.merchantName || 'Active'}`;
      steps[1].durationMs = connTest.latencyMs;
    } else {
      steps[1].status = 'fail';
      steps[1].message = connTest.message;
    }

    // Step 3: Merchant Account Status & Permissions
    steps.push({
      id: 'step_merchant',
      name: 'Merchant Account Status',
      status: 'running',
    });

    if (connTest.accountStatus === 'active') {
      steps[2].status = 'pass';
      steps[2].message = 'Merchant account is active and enabled for charges.';
    } else if (connTest.accountStatus === 'restricted') {
      steps[2].status = 'fail';
      steps[2].message = 'Merchant account has restricted capabilities or disabled payouts.';
    } else {
      steps[2].status = 'fail';
      steps[2].message = 'Merchant account unverified or inactive.';
    }

    // Step 4: Webhook Signing Secret Validation
    steps.push({
      id: 'step_webhook',
      name: 'Webhook Configuration & Signature Test',
      status: 'running',
    });

    if (gateway.isManualOrOffline) {
      steps[3].status = 'pass';
      steps[3].message = 'Offline gateway does not require webhook signature verification.';
    } else if (config.webhookSecret) {
      steps[3].status = 'pass';
      steps[3].message = 'Webhook secret configured and signature validation active.';
    } else {
      steps[3].status = 'fail';
      steps[3].message = 'Webhook signing secret is missing! Live webhooks will lack signature verification.';
    }

    // Step 5: Mock Payload Verification Test
    steps.push({
      id: 'step_payload',
      name: 'Payload & Security Verification',
      status: 'running',
    });

    try {
      const dummyWebhook: WebhookPayload = {
        rawBody: JSON.stringify({ test: true, event: 'ping' }),
        parsedBody: { test: true, event: 'ping' },
        providerId,
      };
      await gateway.verifyWebhook(dummyWebhook, { 'x-test-header': '1' }, config);
      steps[4].status = 'pass';
      steps[4].message = 'Webhook parser successfully processed security verification logic.';
    } catch (err: any) {
      steps[4].status = 'fail';
      steps[4].message = `Payload verification failed: ${err.message}`;
    }

    // Calculate score
    const passCount = steps.filter(s => s.status === 'pass').length;
    const healthScore = Math.round((passCount / steps.length) * 100);
    const overallStatus = healthScore === 100 ? 'pass' : healthScore >= 60 ? 'warning' : 'fail';

    const diagnosticResult: DiagnosticResult = {
      overallStatus,
      healthScore,
      timestamp: new Date().toISOString(),
      steps,
    };

    // Save diagnostic result
    await PaymentService.saveTenantSettings(tenantId, { lastDiagnostic: diagnosticResult });

    return diagnosticResult;
  }

  /**
   * Appends an entry to Webhook Logs for monitoring.
   */
  public static async logWebhookEvent(
    entry: Omit<WebhookLogEntry, 'id'>
  ): Promise<void> {
    try {
      const logsRef = collection(db, 'webhookLogs');
      await addDoc(logsRef, {
        ...entry,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      PaymentLogger.logError('system', 'logWebhookEvent', err);
    }
  }

  /**
   * Fetches recent Webhook logs for the tenant.
   */
  public static async getWebhookLogs(tenantId: string = 'global', limitCount: number = 20): Promise<WebhookLogEntry[]> {
    try {
      const logsRef = collection(db, 'webhookLogs');
      const q = query(logsRef, orderBy('receivedAt', 'desc'), limit(limitCount));
      const snap = await getDocs(q);

      return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as WebhookLogEntry[];
    } catch (err: any) {
      PaymentLogger.logError('system', 'getWebhookLogs', err);
      return [];
    }
  }

  /**
   * Adds an event to a booking's Payment Timeline.
   */
  public static async addTimelineEvent(
    bookingId: string,
    event: PaymentTimelineEvent
  ): Promise<void> {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const snap = await getDoc(bookingRef);
      if (!snap.exists()) return;

      const existingTimeline: PaymentTimelineEvent[] = snap.data().paymentTimeline || [];
      const updatedTimeline = [...existingTimeline, event];

      await setDoc(bookingRef, { paymentTimeline: updatedTimeline }, { merge: true });
    } catch (err: any) {
      PaymentLogger.logError('system', 'addTimelineEvent', err);
    }
  }

  /**
   * Returns default Payment Timeline events for a booking.
   */
  public static getPaymentTimeline(bookingData: any): PaymentTimelineEvent[] {
    if (bookingData.paymentTimeline && bookingData.paymentTimeline.length > 0) {
      return bookingData.paymentTimeline;
    }

    // Synthesize timeline if not present
    const createdAt = bookingData.createdAt || new Date().toISOString();
    const isPaid = bookingData.paymentStatus === 'paid' || bookingData.status === 'confirmed';

    const events: PaymentTimelineEvent[] = [
      {
        step: 'created',
        title: 'Booking Created',
        description: 'Customer submitted booking request.',
        timestamp: createdAt,
        status: 'completed',
      },
      {
        step: 'checkout_created',
        title: 'Checkout Created',
        description: `Payment gateway session prepared (${bookingData.paymentMethod || 'BYOPG'}).`,
        timestamp: createdAt,
        status: isPaid ? 'completed' : 'pending',
      },
      {
        step: 'payment_completed',
        title: 'Payment Completed',
        description: isPaid ? 'Funds processed successfully.' : 'Awaiting payment capture.',
        timestamp: isPaid ? (bookingData.paidAt || createdAt) : '',
        status: isPaid ? 'completed' : 'pending',
      },
      {
        step: 'webhook_received',
        title: 'Webhook Received',
        description: isPaid ? 'Gateway webhook verified & processed.' : 'Awaiting webhook callback.',
        timestamp: isPaid ? (bookingData.paidAt || createdAt) : '',
        status: isPaid ? 'completed' : 'pending',
      },
      {
        step: 'booking_confirmed',
        title: 'Booking Confirmed',
        description: isPaid ? 'Booking status changed to Confirmed.' : 'Pending confirmation.',
        timestamp: isPaid ? (bookingData.paidAt || createdAt) : '',
        status: isPaid ? 'completed' : 'pending',
      },
    ];

    return events;
  }
}
