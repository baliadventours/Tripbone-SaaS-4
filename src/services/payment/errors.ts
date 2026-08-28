export enum PaymentErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  WEBHOOK_INVALID = 'WEBHOOK_INVALID',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  GATEWAY_UNAVAILABLE = 'GATEWAY_UNAVAILABLE',
  REFUND_FAILED = 'REFUND_FAILED',
  CONFIG_MISSING = 'CONFIG_MISSING',
  CURRENCY_NOT_SUPPORTED = 'CURRENCY_NOT_SUPPORTED',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export class PaymentGatewayError extends Error {
  public readonly code: PaymentErrorCode;
  public readonly providerId: string;
  public readonly originalError?: any;
  public readonly userMessage: string;

  constructor(
    code: PaymentErrorCode,
    providerId: string,
    message: string,
    userMessage?: string,
    originalError?: any
  ) {
    super(message);
    this.name = 'PaymentGatewayError';
    this.code = code;
    this.providerId = providerId;
    this.originalError = originalError;
    this.userMessage = userMessage || PaymentGatewayError.getDefaultUserMessage(code, providerId);
  }

  public static getDefaultUserMessage(code: PaymentErrorCode, providerId: string): string {
    const providerName = providerId.toUpperCase();
    switch (code) {
      case PaymentErrorCode.INVALID_CREDENTIALS:
        return `${providerName} connection failed. Please verify API credentials in Payment Settings.`;
      case PaymentErrorCode.WEBHOOK_INVALID:
        return `Payment webhook verification failed for ${providerName}. Security signature did not match.`;
      case PaymentErrorCode.PAYMENT_FAILED:
        return `Payment process could not be completed with ${providerName}. Please check your card or try another method.`;
      case PaymentErrorCode.NETWORK_ERROR:
        return `Unable to connect to ${providerName} server. Please try again in a few moments.`;
      case PaymentErrorCode.GATEWAY_UNAVAILABLE:
        return `${providerName} gateway is currently offline or improperly configured.`;
      case PaymentErrorCode.CONFIG_MISSING:
        return `Payment settings for ${providerName} are incomplete.`;
      case PaymentErrorCode.CURRENCY_NOT_SUPPORTED:
        return `The selected currency is not supported by ${providerName}.`;
      case PaymentErrorCode.REFUND_FAILED:
        return `Refund request was declined by ${providerName}.`;
      default:
        return `A payment error occurred while contacting ${providerName}. Please try again.`;
    }
  }
}
