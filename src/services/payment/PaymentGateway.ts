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
} from './types';

export interface PaymentGateway {
  readonly providerId: string;
  readonly name: string;
  readonly supportedCurrencies: string[];
  readonly isManualOrOffline: boolean;

  /**
   * Validates and establishes connection with provider API.
   */
  connect(config: GatewayConfig): Promise<GatewayConfig>;

  /**
   * Tests API credentials and returns latency, merchant details, mode, and status.
   */
  testConnection(config: GatewayConfig): Promise<TestConnectionResult>;

  /**
   * Initiates payment checkout transaction.
   */
  createCheckout(params: CreateCheckoutParams, config: GatewayConfig): Promise<CheckoutResult>;

  /**
   * Verifies incoming webhook request headers & payload signature.
   */
  verifyWebhook(
    payload: WebhookPayload,
    headers: Record<string, string>,
    config: GatewayConfig
  ): Promise<WebhookValidationResult>;

  /**
   * Queries payment provider for real-time status of a transaction.
   */
  getPaymentStatus(transactionId: string, config: GatewayConfig): Promise<PaymentStatusResult>;

  /**
   * Issues a refund for a previously captured transaction.
   */
  refund(transactionId: string, amount: number, config: GatewayConfig): Promise<RefundResult>;

  /**
   * Performs quick health diagnostic of provider integration.
   */
  healthCheck(config: GatewayConfig): Promise<GatewayHealthResult>;
}
