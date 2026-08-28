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

export class BankTransferGateway implements PaymentGateway {
  readonly providerId = 'bank_transfer';
  readonly name = 'Manual Bank Transfer';
  readonly supportedCurrencies = ['ALL'];
  readonly isManualOrOffline = true;

  async connect(config: GatewayConfig): Promise<GatewayConfig> {
    const testRes = await this.testConnection(config);
    if (!testRes.success) {
      throw new PaymentGatewayError(
        PaymentErrorCode.CONFIG_MISSING,
        this.providerId,
        testRes.message
      );
    }
    return {
      ...config,
      verificationMeta: {
        verifiedAt: new Date().toISOString(),
        connectionStatus: 'connected',
        merchantName: config.bankName ? `${config.bankName} - ${config.accountHolder}` : 'Bank Account Configured',
        accountStatus: 'active',
        mode: 'live',
      },
    };
  }

  async testConnection(config: GatewayConfig): Promise<TestConnectionResult> {
    const startTime = Date.now();
    const hasBank = !!config.bankName || !!config.accountNumber || !!config.instructions;

    if (!hasBank) {
      return {
        success: false,
        accountStatus: 'unverified',
        mode: 'live',
        message: 'Please provide Bank Name, Account Number, or Transfer Instructions.',
        latencyMs: Date.now() - startTime,
      };
    }

    return {
      success: true,
      merchantName: `${config.bankName || 'Bank'} (${config.accountHolder || 'Holder'})`,
      accountStatus: 'active',
      mode: 'live',
      message: 'Bank Transfer details saved and ready to accept offline payments.',
      latencyMs: Date.now() - startTime,
    };
  }

  async createCheckout(params: CreateCheckoutParams, config: GatewayConfig): Promise<CheckoutResult> {
    const instructions = config.instructions || 
      `Please transfer ${params.currency} ${params.amount} to Bank: ${config.bankName || 'N/A'}, Account: ${config.accountNumber || 'N/A'} (${config.accountHolder || 'N/A'}). Upload payment proof on booking status page.`;

    return {
      success: true,
      transactionId: `BT-${params.bookingId}`,
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
      event: 'manual_proof_submitted',
      status: 'pending',
    };
  }

  async getPaymentStatus(transactionId: string, config: GatewayConfig): Promise<PaymentStatusResult> {
    return {
      transactionId,
      status: 'pending',
      rawStatus: 'awaiting_manual_confirmation',
    };
  }

  async refund(transactionId: string, amount: number, config: GatewayConfig): Promise<RefundResult> {
    return {
      success: true,
      message: 'Manual bank transfer refund recorded in system.',
    };
  }

  async healthCheck(config: GatewayConfig): Promise<GatewayHealthResult> {
    const conn = await this.testConnection(config);
    return {
      apiConnection: conn.success,
      merchantStatus: 'active',
      webhookStatus: 'active',
      webhookSignatureValid: true,
      lastSuccessfulApiCall: new Date().toISOString(),
      healthScore: conn.success ? 100 : 0,
      issues: conn.success ? [] : [conn.message],
    };
  }
}
