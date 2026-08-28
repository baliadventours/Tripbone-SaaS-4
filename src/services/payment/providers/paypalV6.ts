import axios from 'axios';

/**
 * PayPal JavaScript SDK v6 Integration Service
 * Based on official PayPal Web SDK v6: https://docs.paypal.ai/developer/how-to/sdk/js/v6/configuration
 */

export interface PayPalV6Config {
  clientId: string;
  clientToken?: string;
  mode?: 'live' | 'sandbox';
  currency?: string;
  locale?: string;
  pageType?: 'checkout' | 'cart' | 'product-details' | 'mini-cart';
  components?: ('paypal-payments' | 'paypal-messages' | 'card-fields' | 'venmo-payments' | 'googlepay-payments' | 'applepay-payments')[];
}

export interface PayPalV6Instance {
  findEligibleMethods: () => Promise<{
    isEligible: (method: string) => boolean;
    getDetails: (method: string) => any;
  }>;
  createPayPalOneTimePaymentSession?: (options: {
    onApprove: (data: { orderID: string; payerID?: string }) => Promise<void> | void;
    onCancel?: () => void;
    onError?: (err: any) => void;
  }) => Promise<{
    start: (params: { orderId: string }) => Promise<void>;
  }>;
  [key: string]: any;
}

let scriptLoadPromise: Promise<void> | null = null;
let currentLoadedMode: 'live' | 'sandbox' | null = null;

/**
 * Dynamically loads the PayPal JS SDK v6 core script tag
 */
export function loadPayPalV6Script(mode: 'live' | 'sandbox' = 'live'): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  const win = window as any;

  // If already loaded for the same mode and createInstance exists, resolve immediately
  if (win.paypal?.createInstance && currentLoadedMode === mode) {
    return Promise.resolve();
  }

  // If loading is in progress for the requested mode, reuse promise
  if (scriptLoadPromise && currentLoadedMode === mode) {
    return scriptLoadPromise;
  }

  currentLoadedMode = mode;
  const scriptUrl = mode === 'live'
    ? 'https://www.paypal.com/web-sdk/v6/core'
    : 'https://www.sandbox.paypal.com/web-sdk/v6/core';

  scriptLoadPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existingScript) {
      if (win.paypal?.createInstance) {
        resolve();
        return;
      }
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      console.log(`[PayPal v6 SDK] Loaded successfully in ${mode.toUpperCase()} mode.`);
      resolve();
    };
    script.onerror = (err) => {
      console.warn(`[PayPal v6 SDK] Failed to load ${scriptUrl}:`, err);
      reject(new Error(`Failed to load PayPal Web SDK v6 (${scriptUrl})`));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Initializes PayPal v6 SDK Instance using createInstance()
 */
export async function initPayPalV6Instance(config: PayPalV6Config): Promise<PayPalV6Instance | null> {
  const mode = config.mode || 'live';
  await loadPayPalV6Script(mode);

  const win = window as any;
  if (!win.paypal?.createInstance) {
    throw new Error('PayPal v6 createInstance is not available on window.paypal');
  }

  const options: Record<string, any> = {
    components: config.components || ['paypal-payments', 'paypal-messages'],
    pageType: config.pageType || 'checkout',
  };

  if (config.clientToken) {
    options.clientToken = config.clientToken;
  } else if (config.clientId) {
    options.clientId = config.clientId.trim();
  }

  if (config.currency) {
    options.currency = config.currency.toUpperCase();
  }
  if (config.locale) {
    options.locale = config.locale;
  }

  return await win.paypal.createInstance(options);
}

/**
 * Fetches a server-generated client token for PayPal v6 SDK
 */
export async function fetchPayPalV6ClientToken(tenantId: string = 'global'): Promise<string | null> {
  try {
    const res = await axios.post('/api/payment/paypal/client-token', { tenantId });
    if (res.data?.success && res.data?.clientToken) {
      return res.data.clientToken;
    }
    return null;
  } catch (err) {
    console.warn('[PayPal v6] Client token request note:', err);
    return null;
  }
}

/**
 * Creates a PayPal Order via backend REST API (Orders v2)
 */
export async function createPayPalOrderOnServer(params: {
  tenantId?: string;
  amount: number;
  currency?: string;
  description?: string;
  bookingId?: string;
}): Promise<{ orderId: string; status?: string }> {
  const res = await axios.post('/api/payment/paypal/create-order', {
    tenantId: params.tenantId || 'global',
    amount: params.amount,
    currency: (params.currency || 'USD').toUpperCase(),
    description: params.description || 'Tour Booking',
    bookingId: params.bookingId,
  });

  if (!res.data?.success || !res.data?.orderId) {
    throw new Error(res.data?.error || 'Failed to create PayPal order.');
  }

  return {
    orderId: res.data.orderId,
    status: res.data.status,
  };
}

/**
 * Captures a PayPal Order via backend REST API
 */
export async function capturePayPalOrderOnServer(params: {
  tenantId?: string;
  orderId: string;
}): Promise<{ success: boolean; captureId: string; details?: any }> {
  const res = await axios.post('/api/payment/paypal/capture-order', {
    tenantId: params.tenantId || 'global',
    orderId: params.orderId,
  });

  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to capture PayPal payment.');
  }

  return {
    success: true,
    captureId: res.data.captureId || params.orderId,
    details: res.data.details,
  };
}
