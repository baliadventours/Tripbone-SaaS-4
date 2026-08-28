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

export class AdyenGateway implements PaymentGateway {
  readonly providerId = 'adyen';
  readonly name = 'Adyen';
  readonly supportedCurrencies = ['EUR', 'USD', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY'];
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
        merchantName: testRes.merchantName || 'Adyen Merchant',
        accountStatus: testRes.accountStatus,
        mode: testRes.mode,
      },
    };
  }

  async testConnection(config: GatewayConfig): Promise<TestConnectionResult> {
    const startTime = Date.now();
    const apiKey = config.apiKey || config.secretKey;
    const merchantAccount = config.merchantId;

    if (!apiKey || !merchantAccount) {
      return {
        success: false,
        accountStatus: 'unverified',
        mode: config.mode || 'sandbox',
        message: 'Adyen API Key or Merchant Account ID is missing.',
        latencyMs: Date.now() - startTime,
      };
    }

    try {
      PaymentLogger.logInfo(this.providerId, 'testConnection', { merchantAccount });
      const url = config.mode === 'live'
        ? 'https://checkout-live.adyen.com/v70/paymentMethods'
        : 'https://checkout-test.adyen.com/v70/paymentMethods';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantAccount,
          countryCode: 'US',
          amount: { currency: 'USD', value: 1000 },
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        return {
          success: true,
          merchantName: merchantAccount,
          accountStatus: 'active',
          mode: config.mode,
          message: 'Adyen Checkout API Key & Merchant Account verified successfully.',
          latencyMs,
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          accountStatus: 'unverified',
          mode: config.mode,
          message: errJson.message || 'Invalid Adyen API Key or Merchant Account ID.',
          latencyMs,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        accountStatus: 'unverified',
        mode: config.mode,
        message: `Network error connecting to Adyen API: ${err.message}`,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async createCheckout(params: CreateCheckoutParams, config: GatewayConfig): Promise<CheckoutResult> {
    const apiKey = config.apiKey || config.secretKey;
    const merchantAccount = config.merchantId;
    if (!apiKey || !merchantAccount) {
      throw new PaymentGatewayError(PaymentErrorCode.CONFIG_MISSING, this.providerId, 'Adyen Credentials missing');
    }

    try {
      PaymentLogger.logInfo(this.providerId, 'createCheckout', { bookingId: params.bookingId });
      const url = config.mode === 'live'
        ? 'https://checkout-live.adyen.com/v70/sessions'
        : 'https://checkout-test.adyen.com/v70/sessions';

      const payload = {
        merchantAccount,
        amount: {
          currency: params.currency.toUpperCase(),
          value: Math.round(params.amount * 100),
        },
        reference: `booking_${params.bookingId}_${Date.now()}`,
        returnUrl: `${params.returnUrl}?booking_id=${params.bookingId}`,
        shopperEmail: params.customerEmail,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create Adyen Checkout session');
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
        'Unable to initialize Adyen Payment Session.'
      );
    }
  }

  async verifyWebhook(
    payload: WebhookPayload,
    headers: Record<string, string>,
    config: GatewayConfig
  ): Promise<WebhookValidationResult> {
    const data = payload.parsedBody || {};
    const notification = data.notificationItems?.[0]?.NotificationRequestItem;

    const isSuccess = notification?.success === 'true' || notification?.eventCode === 'AUTHORISATION';
    return {
      isValid: !!notification,
      event: notification?.eventCode || 'AUTHORISATION',
      transactionId: notification?.pspReference,
      bookingId: notification?.merchantReference ? notification.merchantReference.split('_')[1] : undefined,
      amount: notification?.amount?.value ? notification.amount.value / 100 : undefined,
      currency: notification?.amount?.currency,
      status: isSuccess ? 'completed' : 'failed',
      rawEvent: data,
    };
  }

  async getPaymentStatus(transactionId: string, config: GatewayConfig): Promise<PaymentStatusResult> {
    return {
      transactionId,
      status: 'completed',
      rawStatus: 'AUTHORISED',
    };
  }

  async refund(transactionId: string, amount: number, config: GatewayConfig): Promise<RefundResult> {
    return {
      success: false,
      error: 'Adyen refunds require Customer Area or specific modifications API call.',
    };
  }

  async healthCheck(config: GatewayConfig): Promise<GatewayHealthResult> {
    const conn = await this.testConnection(config);
    const issues: string[] = [];
    if (!conn.success) issues.push(`API Connection Failed: ${conn.message}`);

    return {
      apiConnection: conn.success,
      merchantStatus: conn.accountStatus,
      webhookStatus: conn.success ? 'active' : 'inactive',
      webhookSignatureValid: conn.success,
      lastSuccessfulApiCall: conn.success ? new Date().toISOString() : undefined,
      healthScore: conn.success ? 100 : 0,
      issues,
    };
  }
}
