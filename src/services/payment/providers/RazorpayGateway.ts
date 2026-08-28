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

export class RazorpayGateway implements PaymentGateway {
  readonly providerId = 'razorpay';
  readonly name = 'Razorpay';
  readonly supportedCurrencies = ['INR', 'USD', 'EUR', 'SGD', 'AED', 'GBP'];
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
        merchantName: testRes.merchantName || 'Razorpay Merchant',
        accountStatus: testRes.accountStatus,
        mode: testRes.mode,
      },
    };
  }

  async testConnection(config: GatewayConfig): Promise<TestConnectionResult> {
    const startTime = Date.now();
    const keyId = config.publicKey || config.apiKey;
    const keySecret = config.secretKey;

    if (!keyId || !keySecret) {
      return {
        success: false,
        accountStatus: 'unverified',
        mode: config.mode || 'sandbox',
        message: 'Razorpay Key ID or Key Secret is missing.',
        latencyMs: Date.now() - startTime,
      };
    }

    try {
      PaymentLogger.logInfo(this.providerId, 'testConnection', { keyId });
      const authHeader = 'Basic ' + btoa(`${keyId}:${keySecret}`);
      const res = await fetch('https://api.razorpay.com/v1/orders?count=1', {
        headers: { Authorization: authHeader },
      });

      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        const mode = keyId.startsWith('rzp_test_') ? 'sandbox' : 'live';
        return {
          success: true,
          merchantName: 'Razorpay Account',
          accountStatus: 'active',
          mode,
          message: 'Razorpay Key ID & Secret verified successfully.',
          latencyMs,
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          accountStatus: 'unverified',
          mode: config.mode,
          message: errJson.error?.description || 'Invalid Razorpay Key ID or Secret.',
          latencyMs,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        accountStatus: 'unverified',
        mode: config.mode,
        message: `Network error connecting to Razorpay API: ${err.message}`,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async createCheckout(params: CreateCheckoutParams, config: GatewayConfig): Promise<CheckoutResult> {
    const keyId = config.publicKey || config.apiKey;
    const keySecret = config.secretKey;
    if (!keyId || !keySecret) {
      throw new PaymentGatewayError(PaymentErrorCode.CONFIG_MISSING, this.providerId, 'Razorpay Keys missing');
    }

    try {
      PaymentLogger.logInfo(this.providerId, 'createCheckout', { bookingId: params.bookingId });
      const authHeader = 'Basic ' + btoa(`${keyId}:${keySecret}`);

      const payload = {
        amount: Math.round(params.amount * 100), // convert to paise / cents
        currency: params.currency.toUpperCase(),
        receipt: `rcpt_${params.bookingId}_${Date.now()}`,
        notes: {
          bookingId: params.bookingId,
          customerName: params.customerName,
          tourTitle: params.tourTitle,
        },
      };

      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.description || 'Failed to create Razorpay Order');
      }

      const order = await res.json();
      return {
        success: true,
        transactionId: order.id,
        actionRequired: 'none',
        rawResponse: order,
        instructions: `Order ID created: ${order.id}`,
      };
    } catch (err: any) {
      PaymentLogger.logError(this.providerId, 'createCheckout', err);
      throw new PaymentGatewayError(
        PaymentErrorCode.PAYMENT_FAILED,
        this.providerId,
        err.message,
        'Unable to initialize Razorpay Order. Please try again.'
      );
    }
  }

  async verifyWebhook(
    payload: WebhookPayload,
    headers: Record<string, string>,
    config: GatewayConfig
  ): Promise<WebhookValidationResult> {
    const signature = headers['x-razorpay-signature'] || headers['X-Razorpay-Signature'];
    const webhookSecret = config.webhookSecret;
    const data = payload.parsedBody || {};

    const entity = data.payload?.payment?.entity;
    const isPaid = data.event === 'payment.captured' || entity?.status === 'captured';

    return {
      isValid: !!signature,
      event: data.event || 'payment.captured',
      transactionId: entity?.id || entity?.order_id,
      bookingId: entity?.notes?.bookingId,
      amount: entity?.amount ? entity.amount / 100 : undefined,
      currency: entity?.currency,
      status: isPaid ? 'completed' : 'failed',
      rawEvent: data,
    };
  }

  async getPaymentStatus(transactionId: string, config: GatewayConfig): Promise<PaymentStatusResult> {
    const keyId = config.publicKey || config.apiKey;
    const keySecret = config.secretKey;
    if (!keyId || !keySecret) {
      throw new PaymentGatewayError(PaymentErrorCode.CONFIG_MISSING, this.providerId, 'Razorpay Keys missing');
    }

    try {
      const authHeader = 'Basic ' + btoa(`${keyId}:${keySecret}`);
      const res = await fetch(`https://api.razorpay.com/v1/orders/${transactionId}`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) throw new Error('Failed to fetch Razorpay order status');

      const order = await res.json();
      const isPaid = order.status === 'paid';
      return {
        transactionId: order.id,
        status: isPaid ? 'completed' : 'pending',
        amount: order.amount ? order.amount / 100 : undefined,
        currency: order.currency,
        rawStatus: order.status,
      };
    } catch (err: any) {
      throw new PaymentGatewayError(PaymentErrorCode.NETWORK_ERROR, this.providerId, err.message);
    }
  }

  async refund(transactionId: string, amount: number, config: GatewayConfig): Promise<RefundResult> {
    const keyId = config.publicKey || config.apiKey;
    const keySecret = config.secretKey;
    if (!keyId || !keySecret) {
      throw new PaymentGatewayError(PaymentErrorCode.CONFIG_MISSING, this.providerId, 'Razorpay Keys missing');
    }

    try {
      const authHeader = 'Basic ' + btoa(`${keyId}:${keySecret}`);
      const res = await fetch(`https://api.razorpay.com/v1/payments/${transactionId}/refund`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: Math.round(amount * 100) }),
      });

      const data = await res.json();
      if (res.ok) {
        return {
          success: true,
          refundId: data.id,
          amountRefunded: data.amount / 100,
          message: 'Razorpay refund issued successfully.',
        };
      }
      return { success: false, error: data.error?.description || 'Refund failed' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async healthCheck(config: GatewayConfig): Promise<GatewayHealthResult> {
    const conn = await this.testConnection(config);
    const hasSecret = !!config.webhookSecret;
    const issues: string[] = [];

    if (!conn.success) issues.push(`API Connection Failed: ${conn.message}`);
    if (!hasSecret) issues.push('Webhook Secret is not configured.');

    let healthScore = 100;
    if (!conn.success) healthScore -= 60;
    if (!hasSecret) healthScore -= 20;

    return {
      apiConnection: conn.success,
      merchantStatus: conn.accountStatus,
      webhookStatus: hasSecret ? 'active' : 'degraded',
      webhookSignatureValid: hasSecret,
      lastSuccessfulApiCall: conn.success ? new Date().toISOString() : undefined,
      healthScore: Math.max(0, healthScore),
      issues,
    };
  }
}
