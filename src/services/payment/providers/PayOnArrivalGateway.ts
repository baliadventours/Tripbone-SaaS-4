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

export class PayOnArrivalGateway implements PaymentGateway {
  readonly providerId = 'pay_on_arrival';
  readonly name = 'Pay on Arrival / Cash';
  readonly supportedCurrencies = ['ALL'];
  readonly isManualOrOffline = true;

  async connect(config: GatewayConfig): Promise<GatewayConfig> {
    return {
      ...config,
      verificationMeta: {
        verifiedAt: new Date().toISOString(),
        connectionStatus: 'connected',
        merchantName: 'Pay on Arrival Active',
        accountStatus: 'active',
        mode: 'live',
      },
    };
  }

  async testConnection(config: GatewayConfig): Promise<TestConnectionResult> {
    return {
      success: true,
      merchantName: 'Pay on Arrival (Cash/Card at Pick-up)',
      accountStatus: 'active',
      mode: 'live',
      message: 'Pay on Arrival / Cash is enabled.',
      latencyMs: 1,
    };
  }

  async createCheckout(params: CreateCheckoutParams, config: GatewayConfig): Promise<CheckoutResult> {
    const instructions = config.instructions || 'You can pay cash or card directly to your guide or driver upon arrival.';
    return {
      success: true,
      transactionId: `POA-${params.bookingId}`,
      actionRequired: 'instructions',
      instructions,
    };
  }

  async verifyWebhook(
    payload: WebhookPayload,
    headers: Record<string, string>,
    config: GatewayConfig
  ): Promise<WebhookValidationResult> {
    return {
      isValid: true,
      event: 'arrival_payment_pending',
      status: 'pending',
    };
  }

  async getPaymentStatus(transactionId: string, config: GatewayConfig): Promise<PaymentStatusResult> {
    return {
      transactionId,
      status: 'pending',
      rawStatus: 'pay_on_arrival',
    };
  }

  async refund(transactionId: string, amount: number, config: GatewayConfig): Promise<RefundResult> {
    return {
      success: true,
      message: 'Pay on arrival reservation cancelled.',
    };
  }

  async healthCheck(config: GatewayConfig): Promise<GatewayHealthResult> {
    return {
      apiConnection: true,
      merchantStatus: 'active',
      webhookStatus: 'active',
      webhookSignatureValid: true,
      lastSuccessfulApiCall: new Date().toISOString(),
      healthScore: 100,
      issues: [],
    };
  }
}
