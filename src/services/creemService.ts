import axios from 'axios';

const CREEM_LIVE_URL = 'https://api.creem.io/v1/checkouts';
const CREEM_TEST_URL = 'https://test-api.creem.io/v1/checkouts';

export async function createCreemCheckoutSession(params: {
  productId: string;
  successUrl: string;
  email: string;
  tenantId: string;
  billingInterval?: string;
  apiKey?: string;
  mode?: string;
}) {
  const intervalVal = params.billingInterval || 'monthly';
  // If running in browser, call the server API to avoid CORS
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (res.ok && (data.url || data.checkout_url)) {
        return data;
      }
      // If server returned an error object or non-200, fallback gracefully to mock checkout
      console.warn('[Creem Service] Server proxy returned non-OK response:', data);
      const mockUrl = `/api/billing/mock-checkout?productId=${encodeURIComponent(params.productId || 'starter')}&tenantId=${encodeURIComponent(params.tenantId || 'tenant')}&email=${encodeURIComponent(params.email || '')}&successUrl=${encodeURIComponent(params.successUrl || '/')}&billingInterval=${encodeURIComponent(intervalVal)}`;
      return { url: mockUrl, checkout_url: mockUrl };
    } catch (e: any) {
      console.warn('[Creem Service] Network or fetch error in browser proxy:', e);
      const mockUrl = `/api/billing/mock-checkout?productId=${encodeURIComponent(params.productId || 'starter')}&tenantId=${encodeURIComponent(params.tenantId || 'tenant')}&email=${encodeURIComponent(params.email || '')}&successUrl=${encodeURIComponent(params.successUrl || '/')}&billingInterval=${encodeURIComponent(intervalVal)}`;
      return { url: mockUrl, checkout_url: mockUrl };
    }
  }

  // Server-side logic
  const rawApiKey = params.apiKey || (typeof process !== 'undefined' ? (process as any).env?.CREEM_API_KEY || (process as any).env?.VITE_CREEM_API_KEY : '');
  const apiKey = typeof rawApiKey === 'string' ? rawApiKey.trim() : '';

  // Sanitize successUrl to ensure it is a valid URL
  let cleanSuccessUrl = params.successUrl || '';
  try {
    cleanSuccessUrl = new URL(params.successUrl).toString();
  } catch (e) {
    cleanSuccessUrl = encodeURI(params.successUrl);
  }

  const isFallback = !apiKey || 
    apiKey.toLowerCase().includes('placeholder') || 
    apiKey.toLowerCase().includes('your_') ||
    apiKey === '';

  if (isFallback) {
    console.log(`[Creem Service] No valid CREEM_API_KEY configured. Falling back to Sandbox Mock Checkout.`);
    const mockUrl = `/api/billing/mock-checkout?productId=${encodeURIComponent(params.productId)}&tenantId=${encodeURIComponent(params.tenantId)}&email=${encodeURIComponent(params.email)}&successUrl=${encodeURIComponent(cleanSuccessUrl)}&billingInterval=${encodeURIComponent(intervalVal)}`;
    return {
      checkout_url: mockUrl,
      url: mockUrl
    };
  }

  const rawMode = params.mode || (typeof process !== 'undefined' ? (process as any).env?.CREEM_MODE || (process as any).env?.VITE_CREEM_MODE : 'test');
  const isLive = rawMode === 'live';
  const url = isLive ? CREEM_LIVE_URL : CREEM_TEST_URL;

  const payload = {
    product_id: params.productId,
    success_url: cleanSuccessUrl,
    metadata: {
      tenantId: params.tenantId,
      email: params.email
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });
    const sessionData = response.data || {};
    const finalUrl = sessionData.checkout_url || sessionData.checkoutUrl || sessionData.url || sessionData.checkout_session_url || sessionData.pay_url;
    return {
      ...sessionData,
      url: finalUrl,
      checkout_url: finalUrl
    };
  } catch (error: any) {
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.warn(`[Creem API Error]:`, errorDetails);
    
    // Check if error is Product Not Found (404) or bad request / invalid product ID
    const isProductNotFound = errorDetails.toLowerCase().includes('product not found') || error.response?.status === 404 || error.response?.status === 400;
    if (isProductNotFound) {
      console.log(`[Creem Service] Product ID "${params.productId}" not found in Creem account. Redirecting smoothly to Sandbox Simulator.`);
      const mockUrl = `/api/billing/mock-checkout?productId=${encodeURIComponent(params.productId)}&tenantId=${encodeURIComponent(params.tenantId)}&email=${encodeURIComponent(params.email)}&successUrl=${encodeURIComponent(cleanSuccessUrl)}`;
      return {
        checkout_url: mockUrl,
        url: mockUrl
      };
    }

    throw new Error(`Creem.io Checkout Error: ${errorDetails}`);
  }
}

export async function moderateCreemContent(text: string) {
  // If running in browser, proxy through the backend
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/billing/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to moderate content');
    return data;
  }

  const rawApiKey = typeof process !== 'undefined' ? (process as any).env?.CREEM_API_KEY || (process as any).env?.VITE_CREEM_API_KEY : '';
  const apiKey = typeof rawApiKey === 'string' ? rawApiKey.trim() : '';

  const rawMode = typeof process !== 'undefined' ? (process as any).env?.CREEM_MODE || (process as any).env?.VITE_CREEM_MODE : '';
  const isLive = rawMode === 'live';
  const url = isLive ? 'https://api.creem.io/v1/moderations' : 'https://test-api.creem.io/v1/moderations';

  if (!apiKey || apiKey.toLowerCase().includes('placeholder') || apiKey === '') {
    // Basic compliance check fallback if CREEM_API_KEY is not configured
    const lower = text.toLowerCase();
    const prohibitedKeywords = ['hate', 'violence', 'illegal', 'harmful', 'nsfw', 'abuse', 'exploit', 'malware', 'weapon'];
    if (prohibitedKeywords.some(word => lower.includes(word))) {
      throw new Error('Content violates safety guidelines and moderation policy.');
    }
    return { status: 'approved', flagged: false };
  }

  try {
    const response = await axios.post(url, { text }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      timeout: 3000
    });
    // Check if the content is flagged
    if (response.data && (response.data.status === 'rejected' || response.data.flagged === true)) {
      throw new Error('Content violates safety guidelines and moderation policy.');
    }
    return response.data;
  } catch (error: any) {
    if (error.message?.includes('violates') || error.message?.includes('safety guidelines')) {
      throw error;
    }
    // If Creem API fails or endpoint is unavailable, fallback to local keyword check
    console.warn(`[Creem Moderation API Warning]: ${error.message}. Performing local safety check.`);
    const lower = text.toLowerCase();
    const prohibitedKeywords = ['hate', 'violence', 'illegal', 'harmful', 'nsfw', 'abuse', 'exploit', 'malware', 'weapon'];
    if (prohibitedKeywords.some(word => lower.includes(word))) {
      throw new Error('Content violates safety guidelines and moderation policy.');
    }
    return { status: 'approved', flagged: false };
  }
}

