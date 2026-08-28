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

export class XenditGateway implements PaymentGateway {
  readonly providerId = 'xendit';
  readonly name = 'Xendit';
  readonly supportedCurrencies = ['IDR', 'PHP', 'USD', 'SGD', 'MYR', 'VND', 'THB'];
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
        merchantName: testRes.merchantName || 'Xendit Merchant',
        accountStatus: testRes.accountStatus,
        mode: testRes.mode,
      },
    };
  }

  async testConnection(config: GatewayConfig): Promise<TestConnectionResult> {
    const startTime = Date.now();
    const apiKey = config.apiKey || config.secretKey;
    if (!apiKey) {
      return {
        success: false,
        accountStatus: 'unverified',
        mode: config.mode || 'sandbox',
        message: 'Xendit API Secret Key is missing.',
        latencyMs: Date.now() - startTime,
      };
    }

    try {
      PaymentLogger.logInfo(this.providerId, 'testConnection', { mode: config.mode });
      const authHeader = 'Basic ' + btoa(`${apiKey}:`);
      // Test credentials against Xendit Balance or Account profile endpoint
      const res = await fetch('https://api.xendit.co/balance', {
        headers: { Authorization: authHeader },
      });

      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        const mode = apiKey.startsWith('xnd_development_') ? 'sandbox' : 'live';
        return {
          success: true,
          merchantName: 'Xendit Account',
          accountStatus: 'active',
          mode,
          message: 'Xendit API key verified successfully.',
          latencyMs,
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          accountStatus: 'unverified',
          mode: config.mode,
          message: errJson.message || 'Invalid Xendit Secret API Key.',
          latencyMs,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        accountStatus: 'unverified',
        mode: config.mode,
        message: `Network error connecting to Xendit API: ${err.message}`,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async createCheckout(params: CreateCheckoutParams, config: GatewayConfig): Promise<CheckoutResult> {
    const apiKey = config.apiKey || config.secretKey;
    if (!apiKey) {
      throw new PaymentGatewayError(PaymentErrorCode.CONFIG_MISSING, this.providerId, 'Xendit Secret API Key missing');
    }

    try {
      PaymentLogger.logInfo(this.providerId, 'createCheckout', { bookingId: params.bookingId, amount: params.amount });
      const authHeader = 'Basic ' + btoa(`${apiKey}:`);

      const payload = {
        external_id: `booking-${params.bookingId}-${Date.now()}`,
        amount: Math.round(params.amount),
        payer_email: params.customerEmail,
        description: `${params.tourTitle} - Booking #${params.bookingId}`,
        success_redirect_url: params.returnUrl,
        failure_redirect_url: params.cancelUrl,
        currency: params.currency.toUpperCase(),
      };

      const res = await fetch('https://api.xendit.co/v2/invoices', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create Xendit invoice');
      }

      const invoice = await res.json();
      return {
        success: true,
        transactionId: invoice.id,
        checkoutUrl: invoice.invoice_url,
        actionRequired: 'redirect',
        rawResponse: invoice,
      };
    } catch (err: any) {
      PaymentLogger.logError(this.providerId, 'createCheckout', err);
      throw new PaymentGatewayError(
        PaymentErrorCode.PAYMENT_FAILED,
        this.providerId,
        err.message,
        'Unable to initialize Xendit payment link. Please try again.'
      );
    }
  }

  async verifyWebhook(
    payload: WebhookPayload,
    headers: Record<string, string>,
    config: GatewayConfig
  ): Promise<WebhookValidationResult> {
    const callbackToken = headers['x-callback-token'] || headers['X-Callback-Token'];
    const expectedToken = config.webhookSecret;

    const data = payload.parsedBody || {};
    const isValidToken = !expectedToken || callbackToken === expectedToken;

    const isPaid = data.status === 'PAID' || data.status === 'SETTLED';
    return {
      isValid: isValidToken,
      event: `invoice.${(data.status || 'updated').toLowerCase()}`,
      transactionId: data.id,
      bookingId: data.external_id ? data.external_id.split('-')[1] : undefined,
      amount: data.amount,
      currency: data.currency,
      status: isPaid ? 'completed' : data.status === 'EXPIRED' ? 'failed' : 'pending',
      reason: isValidToken ? undefined : 'X-Callback-Token signature verification failed',
      rawEvent: data,
    };
  }

  async getPaymentStatus(transactionId: string, config: GatewayConfig): Promise<PaymentStatusResult> {
    const apiKey = config.apiKey || config.secretKey;
    if (!apiKey) {
      throw new PaymentGatewayError(PaymentErrorCode.CONFIG_MISSING, this.providerId, 'API Key missing');
    }

    try {
      const authHeader = 'Basic ' + btoa(`${apiKey}:`);
      const res = await fetch(`https://api.xendit.co/v2/invoices/${transactionId}`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) throw new Error('Failed to fetch Xendit invoice status');

      const invoice = await res.json();
      const isPaid = invoice.status === 'PAID' || invoice.status === 'SETTLED';

      return {
        transactionId: invoice.id,
        status: isPaid ? 'completed' : invoice.status === 'EXPIRED' ? 'failed' : 'pending',
        amount: invoice.amount,
        currency: invoice.currency,
        rawStatus: invoice.status,
      };
    } catch (err: any) {
      throw new PaymentGatewayError(PaymentErrorCode.NETWORK_ERROR, this.providerId, err.message);
    }
  }

  async refund(transactionId: string, amount: number, config: GatewayConfig): Promise<RefundResult> {
    return {
      success: false,
      error: 'Xendit automated invoice refunds require dashboard processing or specific payment method APIs.',
    };
  }

  async healthCheck(config: GatewayConfig): Promise<GatewayHealthResult> {
    const conn = await this.testConnection(config);
    const hasWebhookToken = !!config.webhookSecret;
    const issues: string[] = [];

    if (!conn.success) issues.push(`API Connection Failed: ${conn.message}`);
    if (!hasWebhookToken) issues.push('Xendit Callback Token (webhookSecret) is missing.');

    let healthScore = 100;
    if (!conn.success) healthScore -= 60;
    if (!hasWebhookToken) healthScore -= 20;

    return {
      apiConnection: conn.success,
      merchantStatus: conn.accountStatus,
      webhookStatus: hasWebhookToken ? 'active' : 'degraded',
      webhookSignatureValid: hasWebhookToken,
      lastSuccessfulApiCall: conn.success ? new Date().toISOString() : undefined,
      healthScore: Math.max(0, healthScore),
      issues,
    };
  }
}
