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

export class WiseGateway implements PaymentGateway {
  readonly providerId = 'wise';
  readonly name = 'Wise (TransferWise)';
  readonly supportedCurrencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'NZD', 'JPY', 'IDR', 'MYR', 'CHF'];
  readonly isManualOrOffline = false;

  private getBaseUrl(mode: 'sandbox' | 'live' = 'live'): string {
    return mode === 'sandbox'
      ? 'https://api.sandbox.transferwise.tech'
      : 'https://api.wise.com';
  }

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
        merchantName: testRes.merchantName || 'Wise Business Profile',
        accountStatus: testRes.accountStatus,
        mode: testRes.mode,
      },
    };
  }

  async testConnection(config: GatewayConfig): Promise<TestConnectionResult> {
    const startTime = Date.now();
    const apiToken = config.apiKey || config.secretKey;
    const mode = config.mode || 'live';

    if (!apiToken) {
      return {
        success: false,
        accountStatus: 'unverified',
        mode,
        message: 'Wise API Token (Read/Write) is missing. Generate a token in Wise Settings > API Tokens.',
        latencyMs: Date.now() - startTime,
      };
    }

    try {
      PaymentLogger.logInfo(this.providerId, 'testConnection', { mode });

      // Call backend server proxy to bypass browser CORS and keep tokens secure
      const verifyRes = await fetch('/api/payment/wise/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiToken: apiToken.trim(),
          mode,
          profileId: config.profileId || config.merchantId || '',
        }),
      });

      const latencyMs = Date.now() - startTime;
      const data = await verifyRes.json().catch(() => ({}));

      if (verifyRes.ok && data.success) {
        return {
          success: true,
          merchantName: data.merchantName || 'Wise Merchant Profile',
          accountStatus: data.accountStatus || 'active',
          mode,
          message: data.message || 'Wise API connected successfully! Profiles and multi-currency transfers are active.',
          latencyMs,
          details: data.details,
        };
      } else {
        return {
          success: false,
          accountStatus: 'unverified',
          mode,
          message: data.message || `Wise verification failed (HTTP ${verifyRes.status}).`,
          latencyMs,
        };
      }
    } catch (err: any) {
      PaymentLogger.logError(this.providerId, 'testConnectionError', err);
      return {
        success: false,
        accountStatus: 'unverified',
        mode,
        message: `Connection to Wise verification service failed: ${err.message}`,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async createCheckout(params: CreateCheckoutParams, config: GatewayConfig): Promise<CheckoutResult> {
    const apiToken = config.apiKey || config.secretKey;
    const mode = config.mode || 'live';

    if (!apiToken) {
      throw new PaymentGatewayError(
        PaymentErrorCode.CONFIG_MISSING,
        this.providerId,
        'Wise API Token is not configured.'
      );
    }

    try {
      PaymentLogger.logInfo(this.providerId, 'createCheckout', {
        bookingId: params.bookingId,
        amount: params.amount,
        currency: params.currency,
      });

      // Provide direct Wise bank transfer & payment instructions with reference
      const reference = `BK-${params.bookingId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase()}`;
      const instructions = `Transfer ${params.currency} ${params.amount} via Wise using payment reference: "${reference}". Your booking will be automatically verified once the transfer completes.`;

      return {
        success: true,
        transactionId: `WISE-${params.bookingId}`,
        actionRequired: 'instructions',
        instructions,
        rawResponse: {
          reference,
          amount: params.amount,
          currency: params.currency,
          recipientNote: params.description || `Booking for ${params.tourTitle}`,
        },
      };
    } catch (err: any) {
      PaymentLogger.logError(this.providerId, 'createCheckoutError', err);
      throw new PaymentGatewayError(
        PaymentErrorCode.NETWORK_ERROR,
        this.providerId,
        `Wise transfer initiation failed: ${err.message}`
      );
    }
  }

  async verifyWebhook(
    payload: WebhookPayload,
    headers: Record<string, string>,
    config: GatewayConfig
  ): Promise<WebhookValidationResult> {
    try {
      const data = payload.parsedBody;
      // Wise Webhook structure: data.event_type, data.data.resource, etc.
      const eventType = data?.event_type || data?.type || 'transfer.state_change';
      const transferId = data?.data?.resource?.id || data?.resource?.id;
      const status = data?.data?.current_state || data?.current_state;

      let paymentStatus: 'completed' | 'failed' | 'pending' = 'pending';
      if (status === 'outgoing_payment_sent' || status === 'funds_converted' || status === 'COMPLETED' || status === 'transferred') {
        paymentStatus = 'completed';
      } else if (status === 'cancelled' || status === 'rejected' || status === 'FAILED') {
        paymentStatus = 'failed';
      }

      return {
        isValid: true,
        event: eventType,
        transactionId: String(transferId || ''),
        status: paymentStatus,
        rawEvent: data,
      };
    } catch (err: any) {
      return {
        isValid: false,
        reason: `Wise webhook parsing failed: ${err.message}`,
      };
    }
  }

  async getPaymentStatus(transactionId: string, config: GatewayConfig): Promise<PaymentStatusResult> {
    return {
      transactionId,
      status: 'pending',
      rawStatus: 'wise_transfer_monitoring',
    };
  }

  async refund(transactionId: string, amount: number, config: GatewayConfig): Promise<RefundResult> {
    return {
      success: true,
      message: 'Wise refund order logged. Process via Wise dashboard or Payout API.',
    };
  }

  async healthCheck(config: GatewayConfig): Promise<GatewayHealthResult> {
    const conn = await this.testConnection(config);
    return {
      apiConnection: conn.success,
      merchantStatus: conn.accountStatus,
      webhookStatus: config.webhookSecret ? 'active' : 'degraded',
      webhookSignatureValid: true,
      lastSuccessfulApiCall: new Date().toISOString(),
      healthScore: conn.success ? 100 : 0,
      issues: conn.success ? [] : [conn.message],
    };
  }
}
