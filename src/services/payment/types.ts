export type PaymentProviderId = 
  | 'stripe' 
  | 'xendit' 
  | 'razorpay' 
  | 'adyen' 
  | 'paypal' 
  | 'midtrans' 
  | 'wise'
  | 'bank_transfer' 
  | 'pay_on_arrival'
  | string;

export type PaymentMode = 'sandbox' | 'live';

export type AccountStatus = 'active' | 'restricted' | 'unverified' | 'suspended';

export interface GatewayConfig {
  providerId: PaymentProviderId;
  mode: PaymentMode;
  enabled: boolean;
  // Specific credential fields stored securely per tenant
  apiKey?: string;
  secretKey?: string;
  publicKey?: string;
  merchantId?: string;
  profileId?: string;
  webhookSecret?: string;
  clientSecret?: string;
  accountNumber?: string;
  bankName?: string;
  accountHolder?: string;
  swiftCode?: string;
  instructions?: string;
  additionalParams?: Record<string, any>;
  // Verification metadata populated automatically when credentials are verified
  verificationMeta?: {
    verifiedAt: string;
    connectionStatus: 'connected' | 'failed' | 'untested';
    merchantName?: string;
    accountStatus?: AccountStatus;
    mode?: PaymentMode;
    errorMessage?: string;
  };
}

export interface ConnectionResult {
  success: boolean;
  merchantName?: string;
  accountStatus: AccountStatus;
  mode: PaymentMode;
  message: string;
  issues?: string[];
  details?: Record<string, any>;
}

export interface TestConnectionResult extends ConnectionResult {
  latencyMs: number;
}

export interface CreateCheckoutParams {
  bookingId: string;
  tourTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  webhookUrl: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CheckoutResult {
  success: boolean;
  transactionId?: string;
  checkoutUrl?: string;
  qrCodeUrl?: string;
  clientSecret?: string;
  actionRequired?: 'redirect' | 'qr_code' | 'instructions' | 'none';
  instructions?: string;
  rawResponse?: any;
  error?: string;
}

export interface WebhookPayload {
  rawBody: string;
  parsedBody: any;
  providerId: PaymentProviderId;
}

export interface WebhookValidationResult {
  isValid: boolean;
  event?: string;
  transactionId?: string;
  bookingId?: string;
  amount?: number;
  currency?: string;
  status?: 'completed' | 'failed' | 'pending' | 'refunded';
  reason?: string;
  rawEvent?: any;
}

export interface PaymentStatusResult {
  transactionId: string;
  status: 'completed' | 'failed' | 'pending' | 'refunded' | 'partially_refunded';
  amount?: number;
  currency?: string;
  paidAt?: string;
  rawStatus?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amountRefunded?: number;
  message?: string;
  error?: string;
}

export interface GatewayHealthResult {
  apiConnection: boolean;
  merchantStatus: AccountStatus;
  webhookStatus: 'active' | 'degraded' | 'inactive';
  webhookSignatureValid: boolean;
  lastSuccessfulApiCall?: string;
  lastWebhookReceived?: string;
  healthScore: number; // 0 to 100
  issues: string[];
}

export interface DiagnosticStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'pass' | 'fail' | 'skipped';
  message?: string;
  durationMs?: number;
  details?: any;
}

export interface DiagnosticResult {
  overallStatus: 'pass' | 'fail' | 'warning';
  healthScore: number;
  timestamp: string;
  steps: DiagnosticStep[];
}

export interface WebhookLogEntry {
  id: string;
  tenantId: string;
  providerId: PaymentProviderId;
  event: string;
  status: 'success' | 'failed' | 'signature_invalid' | 'ignored';
  signatureValid: boolean;
  bookingId?: string;
  transactionId?: string;
  receivedAt: string;
  processingTimeMs: number;
  payloadPreview: string;
  errorMessage?: string;
}

export interface PaymentTimelineEvent {
  step: 'created' | 'checkout_created' | 'payment_pending' | 'payment_completed' | 'webhook_received' | 'booking_confirmed' | 'failed';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed' | 'current';
  metadata?: Record<string, any>;
}
