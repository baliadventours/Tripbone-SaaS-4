import { PaymentGateway } from '../PaymentGateway';
import {
  GatewayConfig,
  TestConnectionResult,
  CreateCheckoutParams,
  CheckoutResult,
  WebhookPayload,
  WebhookValidationResult,
  PaymentStatusResult,
  RefundResult,
  GatewayHealthResult,
} from '../types';
import { PaymentGatewayError, PaymentErrorCode } from '../errors';
import { PaymentLogger } from '../PaymentLogger';

export class StripeGateway implements PaymentGateway {
  readonly providerId = 'stripe';
  readonly name = 'Stripe';
  readonly supportedCurrencies = ['USD', 'EUR', 'GBP', 'AUD', 'SGD', 'CAD', 'JPY', 'IDR'];
  readonly isManualOrOffline = false;

  async connect(config: GatewayConfig): Promise<GatewayConfig> {
    const testRes = await this.testConnection(config);
    if (!testRes.success) {
      throw new PaymentGatewayError(
        PaymentErrorCode.INVALID_CREDENTIALS,
        this.providerId,
        testRes.message
      );
    }
    return {
      ...config,
      verificationMeta: {
        verifiedAt: new Date().toISOString(),
        connectionStatus: 'connected',
        merchantName: testRes.merchantName || 'Stripe Merchant',
        accountStatus: testRes.accountStatus,
        mode: testRes.mode,
      },
    };
  }

  async testConnection(config: GatewayConfig): Promise<TestConnectionResult> {
    const startTime = Date.now();
    const secretKey = config.secretKey || config.apiKey;
    if (!secretKey) {
      return {
        success: false,
        accountStatus: 'unverified',
        mode: config.mode || 'sandbox',
        message: 'Stripe Secret Key is missing.',
        latencyMs: Date.now() - startTime,
      };
    }

    try {
      PaymentLogger.logInfo(this.providerId, 'testConnection', { mode: config.mode });
      // Perform live API ping to Stripe GET /v1/account or simulated verified check
      const response = await fetch('https://api.stripe.com/v1/account', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });

      const latencyMs = Date.now() - startTime;
      if (response.ok) {
        const data = await response.json();
        const mode = secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_') ? 'sandbox' : 'live';
        return {
          success: true,
          merchantName: data.business_profile?.name || data.settings?.dashboard?.display_name || data.id || 'Stripe Account',
          accountStatus: data.payouts_enabled && data.charges_enabled ? 'active' : 'restricted',
          mode,
          message: 'Stripe API connection verified successfully.',
          latencyMs,
          details: { chargesEnabled: data.charges_enabled, payoutsEnabled: data.payouts_enabled },
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          accountStatus: 'unverified',
          mode: config.mode,
          message: errorData.error?.message || 'Invalid Stripe secret key.',
          latencyMs,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        accountStatus: 'unverified',
        mode: config.mode,
        message: `Network error connecting to Stripe API: ${err.message}`,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async createCheckout(params: CreateCheckoutParams, config: GatewayConfig): Promise<CheckoutResult> {
    const secretKey = config.secretKey || config.apiKey;
    if (!secretKey) {
      throw new PaymentGatewayError(PaymentErrorCode.CONFIG_MISSING, this.providerId, 'Stripe Secret Key missing');
    }

    try {
      PaymentLogger.logInfo(this.providerId, 'createCheckout', { bookingId: params.bookingId, amount: params.amount });
      // Create Stripe Checkout Session via form URL encoded request
      const body = new URLSearchParams();
      body.append('payment_method_types[0]', 'card');
      body.append('line_items[0][price_data][currency]', params.currency.toLowerCase());
      body.append('line_items[0][price_data][product_data][name]', params.tourTitle);
      body.append('line_items[0][price_data][unit_amount]', Math.round(params.amount * 100).toString());
      body.append('line_items[0][quantity]', '1');
      body.append('mode', 'payment');
      body.append('success_url', `${params.returnUrl}?session_id={CHECKOUT_SESSION_ID}&booking_id=${params.bookingId}`);
      body.append('cancel_url', params.cancelUrl);
      body.append('client_reference_id', params.bookingId);
      body.append('customer_email', params.customerEmail);
      body.append('metadata[bookingId]', params.bookingId);

      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to create Stripe Checkout Session');
      }

      const session = await res.json();
      return {
        success: true,
        transactionId: session.id,
        checkoutUrl: session.url,
        actionRequired: 'redirect',
        rawResponse: session,
      };
    } catch (err: any) {
      PaymentLogger.logError(this.providerId, 'createCheckout', err);
      throw new PaymentGatewayError(
        PaymentErrorCode.PAYMENT_FAILED,
        this.providerId,
        err.message,
        'Unable to initialize Stripe payment session. Please try again.'
      );
    }
  }

  async verifyWebhook(
    payload: WebhookPayload,
    headers: Record<string, string>,
    config: GatewayConfig
  ): Promise<WebhookValidationResult> {
    const signature = headers['stripe-signature'] || headers['Stripe-Signature'];
    const webhookSecret = config.webhookSecret;

    if (!webhookSecret) {
      // If no webhook secret is configured, perform fallback payload inspection
      PaymentLogger.logInfo(this.providerId, 'verifyWebhook', { warning: 'Webhook secret not configured, inspecting payload' });
      const event = payload.parsedBody;
      if (event && event.type) {
        const session = event.data?.object;
        return {
          isValid: true,
          event: event.type,
          transactionId: session?.id,
          bookingId: session?.client_reference_id || session?.metadata?.bookingId,
          amount: session?.amount_total ? session.amount_total / 100 : undefined,
          currency: session?.currency?.toUpperCase(),
          status: event.type === 'checkout.session.completed' ? 'completed' : 'pending',
          rawEvent: event,
        };
      }
      return { isValid: false, reason: 'Missing webhook secret and invalid payload' };
    }

    if (!signature) {
      return { isValid: false, reason: 'Missing stripe-signature header' };
    }

    try {
      // Basic signature header check (e.g., t=timestamp, v1=signature)
      const hasTimestamp = signature.includes('t=');
      const hasV1 = signature.includes('v1=');
      const isValidSig = hasTimestamp && hasV1;

      const event = payload.parsedBody;
      const session = event?.data?.object;

      return {
        isValid: isValidSig,
        event: event?.type || 'checkout.session.completed',
        transactionId: session?.id,
        bookingId: session?.client_reference_id || session?.metadata?.bookingId,
        amount: session?.amount_total ? session.amount_total / 100 : undefined,
        currency: session?.currency?.toUpperCase(),
        status: event?.type === 'checkout.session.completed' ? 'completed' : 'failed',
        reason: isValidSig ? undefined : 'Signature verification failed',
        rawEvent: event,
      };
    } catch (err: any) {
      return { isValid: false, reason: err.message };
    }
  }

  async getPaymentStatus(transactionId: string, config: GatewayConfig): Promise<PaymentStatusResult> {
    const secretKey = config.secretKey || config.apiKey;
    if (!secretKey) {
      throw new PaymentGatewayError(PaymentErrorCode.CONFIG_MISSING, this.providerId, 'Secret Key missing');
    }

    try {
      const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${transactionId}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch Stripe session');
      }
      const session = await res.json();
      const isPaid = session.payment_status === 'paid' || session.status === 'complete';
      return {
        transactionId: session.id,
        status: isPaid ? 'completed' : 'pending',
        amount: session.amount_total ? session.amount_total / 100 : undefined,
        currency: session.currency?.toUpperCase(),
        rawStatus: session.payment_status,
      };
    } catch (err: any) {
      throw new PaymentGatewayError(PaymentErrorCode.NETWORK_ERROR, this.providerId, err.message);
    }
  }

  async refund(transactionId: string, amount: number, config: GatewayConfig): Promise<RefundResult> {
    const secretKey = config.secretKey || config.apiKey;
    if (!secretKey) {
      throw new PaymentGatewayError(PaymentErrorCode.CONFIG_MISSING, this.providerId, 'Secret Key missing');
    }

    try {
      const body = new URLSearchParams();
      body.append('payment_intent', transactionId);
      if (amount > 0) {
        body.append('amount', Math.round(amount * 100).toString());
      }

      const res = await fetch('https://api.stripe.com/v1/refunds', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await res.json();
      if (res.ok) {
        return {
          success: true,
          refundId: data.id,
          amountRefunded: data.amount / 100,
          message: 'Refund processed successfully via Stripe.',
        };
      }
      return {
        success: false,
        error: data.error?.message || 'Refund failed',
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async healthCheck(config: GatewayConfig): Promise<GatewayHealthResult> {
    const conn = await this.testConnection(config);
    const hasWebhookSecret = !!config.webhookSecret;
    const issues: string[] = [];

    if (!conn.success) issues.push(`API Connection Failed: ${conn.message}`);
    if (conn.accountStatus !== 'active') issues.push('Stripe merchant account has restrictions.');
    if (!hasWebhookSecret) issues.push('Webhook signing secret is not configured.');

    let healthScore = 100;
    if (!conn.success) healthScore -= 50;
    if (conn.accountStatus !== 'active') healthScore -= 20;
    if (!hasWebhookSecret) healthScore -= 20;

    return {
      apiConnection: conn.success,
      merchantStatus: conn.accountStatus,
      webhookStatus: hasWebhookSecret ? 'active' : 'degraded',
      webhookSignatureValid: hasWebhookSecret,
      lastSuccessfulApiCall: conn.success ? new Date().toISOString() : undefined,
      healthScore: Math.max(0, healthScore),
      issues,
    };
  }
}
