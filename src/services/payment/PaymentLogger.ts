/**
 * PaymentLogger ensures all API keys, authorization headers, credit cards, 
 * and secret tokens are sanitized and masked before being logged or stored.
 */
export class PaymentLogger {
  private static SENSITIVE_KEYS = [
    'secret',
    'secretkey',
    'secret_key',
    'apikey',
    'api_key',
    'token',
    'authorization',
    'auth',
    'signature',
    'cardnumber',
    'cvv',
    'password',
    'client_secret',
    'privatekey',
    'private_key',
    'bearer'
  ];

  public static maskSecret(value: string | undefined | null): string {
    if (!value) return '[EMPTY]';
    if (value.length <= 8) return '****';
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }

  public static sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => PaymentLogger.sanitizeObject(item));
    }

    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase().replace(/[^a-z]/g, '');
      const isSensitive = PaymentLogger.SENSITIVE_KEYS.some(s => lowerKey.includes(s));

      if (isSensitive) {
        if (typeof val === 'string') {
          sanitized[key] = PaymentLogger.maskSecret(val);
        } else {
          sanitized[key] = '[REDACTED]';
        }
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = PaymentLogger.sanitizeObject(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  public static logInfo(providerId: string, action: string, data?: any) {
    const cleanData = PaymentLogger.sanitizeObject(data);
    console.log(`[PAYMENT_LOG][${providerId.toUpperCase()}][${action}]`, cleanData || '');
  }

  public static logError(providerId: string, action: string, error: any) {
    const cleanError = error instanceof Error 
      ? { message: error.message, name: error.name, stack: error.stack }
      : PaymentLogger.sanitizeObject(error);

    console.error(`[PAYMENT_ERROR][${providerId.toUpperCase()}][${action}]`, cleanError);
  }
}
