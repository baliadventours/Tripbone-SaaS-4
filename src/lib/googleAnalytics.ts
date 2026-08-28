// Google Analytics 4 (GA4), Google Tag Manager (GTM), & Google Ads Conversion Tracker for Tripbone SaaS
import { db } from './firebase';
import { doc, getDoc } from '@/src/lib/firebase';

export interface GAEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

export interface TenantTrackingConfig {
  gaMeasurementId?: string; // G-XXXXXXXXXX or GT-XXXXXXXXXX
  gtmId?: string; // GTM-XXXXXXXX
  googleAdsId?: string; // AW-XXXXXXXXX
  googleAdsConversionLabel?: string; // e.g. AbCdEfGh
  gaCustomScript?: string; // raw custom head scripts
  gtmBodyScript?: string; // raw body noscript
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    GA_MEASUREMENT_ID?: string;
    GTM_ID?: string;
    GOOGLE_ADS_ID?: string;
  }
}

// Active in-memory tenant tracking state
let activeConfig: TenantTrackingConfig = {};
let activeTenantId: string | null = null;
let isTrackerInitialized = false;

// Memory logging of tracking events for the interactive dashboard preview list
export const recordedGAEvents: Array<{
  timestamp: string;
  type: 'pageview' | 'event' | 'conversion';
  name: string;
  params: any;
}> = [];

// Helper to push to interactive dashboard stream
const logToInteractiveStream = (type: 'pageview' | 'event' | 'conversion', name: string, params: any) => {
  recordedGAEvents.unshift({
    timestamp: new Date().toLocaleTimeString(),
    type,
    name,
    params
  });
  
  // Keep last 50 events in buffer
  if (recordedGAEvents.length > 50) {
    recordedGAEvents.pop();
  }

  // Trigger a custom event so the UI can listen and refresh live
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ga-event-logged'));
  }
};

/**
 * Intelligent extractor to parse any Google tag ID from raw snippet or input string
 */
export const extractTrackingIds = (text: string): Partial<TenantTrackingConfig> => {
  if (!text || typeof text !== 'string') return {};
  const extracted: Partial<TenantTrackingConfig> = {};

  // GTM Container ID (e.g. GTM-XXXXXXX)
  const gtmMatch = text.match(/GTM-[A-Z0-9]{4,14}/i);
  if (gtmMatch) extracted.gtmId = gtmMatch[0].toUpperCase();

  // Google Ads ID (e.g. AW-123456789)
  const adsMatch = text.match(/AW-[0-9]{6,14}/i);
  if (adsMatch) extracted.googleAdsId = adsMatch[0].toUpperCase();

  // Google Ads Conversion Label inside send_to (e.g. AW-123456789/AbCdEfGhIjK)
  const sendToMatch = text.match(/AW-[0-9]{6,14}\/([A-Za-z0-9_-]+)/i);
  if (sendToMatch && sendToMatch[1]) {
    extracted.googleAdsConversionLabel = sendToMatch[1];
  }

  // GA4 / Google Tag Measurement ID (e.g. G-XXXXXXXXXX or GT-XXXXXXXXXX)
  const gaMatch = text.match(/(?:G|GT)-[A-Z0-9]{6,14}/i);
  if (gaMatch) extracted.gaMeasurementId = gaMatch[0].toUpperCase();

  // Legacy UA
  if (!extracted.gaMeasurementId) {
    const uaMatch = text.match(/UA-[0-9]+-[0-9]+/i);
    if (uaMatch) extracted.gaMeasurementId = uaMatch[0].toUpperCase();
  }

  return extracted;
};

// Backwards-compatible single ID extractor
export const extractMeasurementId = (text: string): string => {
  const ids = extractTrackingIds(text);
  return ids.gaMeasurementId || ids.googleAdsId || ids.gtmId || '';
};

export const getGAMeasurementId = (): string => {
  return activeConfig.gaMeasurementId || '';
};

export const getGTMId = (): string => {
  return activeConfig.gtmId || '';
};

export const getGoogleAdsId = (): string => {
  return activeConfig.googleAdsId || '';
};

export const getGoogleAdsConversionLabel = (): string => {
  return activeConfig.googleAdsConversionLabel || '';
};

export const getGACustomScript = (): string => {
  return activeConfig.gaCustomScript || '';
};

export const getActiveTrackingConfig = (): TenantTrackingConfig => {
  return { ...activeConfig };
};

/**
 * Completely purges tracking scripts and resets dataLayer on tenant switch
 */
export const clearGATracking = () => {
  activeConfig = {};
  isTrackerInitialized = false;

  if (typeof window !== 'undefined') {
    localStorage.removeItem('ga_measurement_id');
    localStorage.removeItem('gtm_container_id');
    localStorage.removeItem('google_ads_id');
    localStorage.removeItem('ga_custom_script');

    delete window.GA_MEASUREMENT_ID;
    delete window.GTM_ID;
    delete window.GOOGLE_ADS_ID;

    // Remove injected script elements
    const elementsToRemove = [
      'ga-gtag-script',
      'ga-gtag-init',
      'gtm-container-script',
      'gtm-noscript-container',
      'ga-custom-script-injection',
      'gtm-body-script-injection'
    ];

    elementsToRemove.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    // Reset dataLayer array to prevent cross-tenant event pollution (AGENTS.md rule)
    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.length = 0;
    }
  }
};

/**
 * Injects and initializes Google Tag Manager container (gtm.js)
 */
export const setupGTMTags = (gtmId: string) => {
  if (!gtmId || typeof window === 'undefined') return;
  const cleanGtmId = gtmId.trim().toUpperCase();
  if (!cleanGtmId.startsWith('GTM-')) return;

  try {
    // 1. Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    // 2. Inject official GTM container script in head
    const existingGtm = document.getElementById('gtm-container-script');
    if (!existingGtm) {
      const script = document.createElement('script');
      script.id = 'gtm-container-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${cleanGtmId}&l=dataLayer`;
      document.head.appendChild(script);
    }

    // 3. Inject official GTM noscript iframe in body
    const existingNoscript = document.getElementById('gtm-noscript-container');
    if (!existingNoscript && document.body) {
      const noscript = document.createElement('noscript');
      noscript.id = 'gtm-noscript-container';
      noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${cleanGtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body.insertBefore(noscript, document.body.firstChild);
    }

    window.GTM_ID = cleanGtmId;
    console.log(`[Google Tag Manager] Initialized container: ${cleanGtmId}`);
  } catch (error) {
    console.error('[Google Tag Manager] Setup error:', error);
  }
};

/**
 * Injects and initializes Google Tag (gtag.js) for GA4 and Google Ads
 */
export const setupGATags = (configOrId: string | TenantTrackingConfig) => {
  if (typeof window === 'undefined') return;

  let gaId = '';
  let adsId = '';

  if (typeof configOrId === 'string') {
    const trimmed = configOrId.trim().toUpperCase();
    if (trimmed.startsWith('AW-')) {
      adsId = trimmed;
    } else {
      gaId = trimmed;
    }
  } else {
    gaId = (configOrId.gaMeasurementId || '').trim().toUpperCase();
    adsId = (configOrId.googleAdsId || '').trim().toUpperCase();
  }

  // Choose primary ID for the library script loader
  const primaryId = gaId || adsId;
  if (!primaryId) return;

  try {
    // 1. Inject gtag.js loader script if not present
    const existingScriptId = 'ga-gtag-script';
    let script = document.getElementById(existingScriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = existingScriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`;
      document.head.appendChild(script);
    }

    // 2. Initialize dataLayer & gtag function
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
    }

    // 3. Fire js baseline initialization
    window.gtag('js', new Date());

    const cookieDomain = window.location.hostname === 'localhost' ? 'none' : window.location.hostname;

    // 4. Configure GA4 Measurement ID if provided
    if (gaId) {
      window.gtag('config', gaId, {
        page_path: window.location.pathname + window.location.search,
        send_page_view: true,
        cookie_domain: cookieDomain,
        cookie_flags: 'SameSite=None;Secure'
      });
      window.GA_MEASUREMENT_ID = gaId;
    }

    // 5. Configure Google Ads Conversion ID if provided
    if (adsId) {
      window.gtag('config', adsId, {
        page_path: window.location.pathname + window.location.search,
        send_page_view: true,
        cookie_domain: cookieDomain,
        cookie_flags: 'SameSite=None;Secure'
      });
      window.GOOGLE_ADS_ID = adsId;
    }

    isTrackerInitialized = true;

    logToInteractiveStream('pageview', window.location.pathname, {
      title: document.title,
      gaId,
      adsId,
      status: 'tags_configured'
    });

    console.log(`[Google Analytics / Ads] Initialized tags -> GA: ${gaId || 'None'}, Ads: ${adsId || 'None'}`);
  } catch (error) {
    console.error('[Google Analytics / Ads] Tag setup error:', error);
  }
};

/**
 * Safely injects custom script blocks (Meta Pixel, custom GTM snippet, etc.) into head/body
 */
export const injectCustomScript = (htmlSnippet: string, target: 'head' | 'body' = 'head') => {
  if (typeof document === 'undefined') return;

  const containerId = target === 'head' ? 'ga-custom-script-injection' : 'gtm-body-script-injection';
  const existingBlock = document.getElementById(containerId);
  if (existingBlock) existingBlock.remove();

  if (!htmlSnippet || !htmlSnippet.trim()) return;

  try {
    const container = document.createElement('div');
    container.id = containerId;
    container.style.display = 'none';
    container.innerHTML = htmlSnippet;
    document.body.appendChild(container);

    const scripts = Array.from(container.querySelectorAll('script'));
    scripts.forEach((s) => {
      const newScript = document.createElement('script');
      for (let j = 0; j < s.attributes.length; j++) {
        const attr = s.attributes[j];
        newScript.setAttribute(attr.name, attr.value);
      }
      if (s.textContent) {
        newScript.textContent = s.textContent;
      }
      if (target === 'head') {
        document.head.appendChild(newScript);
      } else {
        document.body.appendChild(newScript);
      }
    });

    console.log(`[Analytics] Injected custom ${target} script block successfully.`);
  } catch (error) {
    console.error(`[Analytics] Error injecting custom ${target} script block:`, error);
  }
};

/**
 * Synchronizes and activates all tracking services (GTM, GA4, Google Ads, Custom Scripts) for the tenant
 */
export const updateTenantGA = (
  tenantId: string | null,
  configOrMeasurementId?: string | TenantTrackingConfig | null,
  legacyCustomScript?: string | null
) => {
  if (typeof window === 'undefined') return;

  activeTenantId = tenantId;

  let config: TenantTrackingConfig = {};

  if (typeof configOrMeasurementId === 'object' && configOrMeasurementId !== null) {
    config = { ...configOrMeasurementId };
  } else {
    const rawId = (typeof configOrMeasurementId === 'string' ? configOrMeasurementId : '').trim();
    const rawScript = (typeof legacyCustomScript === 'string' ? legacyCustomScript : '').trim();

    // Auto extract IDs from raw string or snippet
    const extractedFromId = extractTrackingIds(rawId);
    const extractedFromScript = extractTrackingIds(rawScript);

    config = {
      gaMeasurementId: rawId.startsWith('G-') || rawId.startsWith('GT-') ? rawId : (extractedFromId.gaMeasurementId || extractedFromScript.gaMeasurementId),
      gtmId: rawId.startsWith('GTM-') ? rawId : (extractedFromId.gtmId || extractedFromScript.gtmId),
      googleAdsId: rawId.startsWith('AW-') ? rawId : (extractedFromId.googleAdsId || extractedFromScript.googleAdsId),
      googleAdsConversionLabel: extractedFromId.googleAdsConversionLabel || extractedFromScript.googleAdsConversionLabel,
      gaCustomScript: rawScript,
    };
  }

  // Clean and normalize all IDs
  config.gaMeasurementId = (config.gaMeasurementId || '').trim().toUpperCase();
  config.gtmId = (config.gtmId || '').trim().toUpperCase();
  config.googleAdsId = (config.googleAdsId || '').trim().toUpperCase();
  config.googleAdsConversionLabel = (config.googleAdsConversionLabel || '').trim();
  config.gaCustomScript = (config.gaCustomScript || '').trim();
  config.gtmBodyScript = (config.gtmBodyScript || '').trim();

  // If GTM ID was accidentally typed in gaMeasurementId
  if (config.gaMeasurementId.startsWith('GTM-') && !config.gtmId) {
    config.gtmId = config.gaMeasurementId;
    config.gaMeasurementId = '';
  }

  // If Google Ads ID was typed in gaMeasurementId
  if (config.gaMeasurementId.startsWith('AW-') && !config.googleAdsId) {
    config.googleAdsId = config.gaMeasurementId;
    config.gaMeasurementId = '';
  }

  const hasAnyConfig = Boolean(
    config.gaMeasurementId ||
    config.gtmId ||
    config.googleAdsId ||
    config.gaCustomScript ||
    config.gtmBodyScript
  );

  if (!hasAnyConfig) {
    clearGATracking();
    return;
  }

  activeConfig = { ...config };

  // 1. Initialize Google Tag Manager if configured
  if (config.gtmId) {
    setupGTMTags(config.gtmId);
  }

  // 2. Initialize Google Tag (GA4 and/or Google Ads) if configured
  if (config.gaMeasurementId || config.googleAdsId) {
    setupGATags(config);
  }

  // 3. Inject custom header and body scripts if present
  if (config.gaCustomScript) {
    injectCustomScript(config.gaCustomScript, 'head');
  }
  if (config.gtmBodyScript) {
    injectCustomScript(config.gtmBodyScript, 'body');
  }
};

/**
 * Initializes and fetches tenant analytics settings from Cloud Firestore
 */
export const initGA = async (tenantId?: string | null) => {
  if (typeof window === 'undefined') return;

  const currentTenantId = tenantId !== undefined ? tenantId : activeTenantId;

  try {
    const settingsDocId = currentTenantId || 'general';
    const docRef = doc(db, 'settings', settingsDocId);
    const snap = await getDoc(docRef);

    let config: TenantTrackingConfig = {};

    if (snap.exists()) {
      const data = snap.data();
      config = {
        gaMeasurementId: data.gaMeasurementId || data.googleAnalyticsId || data.measurementId || '',
        gtmId: data.gtmId || '',
        googleAdsId: data.googleAdsId || '',
        googleAdsConversionLabel: data.googleAdsConversionLabel || '',
        gaCustomScript: data.gaCustomScript || data.customScript || '',
        gtmBodyScript: data.gtmBodyScript || ''
      };
    }

    updateTenantGA(currentTenantId, config);

    if (config.gaMeasurementId || config.googleAdsId || config.gtmId) {
      trackGAPageview(window.location.pathname + window.location.search);
    }
  } catch (error) {
    console.warn('[Analytics] Remote config sync postponed:', error);
  }
};

/**
 * Dispatches a virtual pageview across all active analytics services & GTM dataLayer
 */
export const trackGAPageview = (path: string, pageTitle?: string) => {
  if (typeof window === 'undefined') return;

  const title = pageTitle || document.title;
  const gaId = getGAMeasurementId();
  const adsId = getGoogleAdsId();

  try {
    // 1. Dispatch via gtag
    if (typeof (window as any).gtag === 'function') {
      if (gaId) {
        (window as any).gtag('config', gaId, {
          page_path: path,
          page_title: title,
          send_page_view: true
        });
      }
      if (adsId) {
        (window as any).gtag('config', adsId, {
          page_path: path,
          page_title: title,
          send_page_view: true
        });
      }
    } else if (gaId || adsId) {
      setupGATags(activeConfig);
      if (typeof (window as any).gtag === 'function') {
        if (gaId) (window as any).gtag('config', gaId, { page_path: path, page_title: title, send_page_view: true });
        if (adsId) (window as any).gtag('config', adsId, { page_path: path, page_title: title, send_page_view: true });
      }
    }

    // 2. Dispatch page_view event to Google Tag Manager dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'page_view',
      page_path: path,
      page_title: title,
      page_location: window.location.href
    });

    logToInteractiveStream('pageview', path, {
      title,
      gaId,
      adsId,
      gtmId: getGTMId()
    });
  } catch (error) {
    console.warn('[Analytics] Pageview tracking error:', error);
  }
};

/**
 * Universal Event Tracker (GA4, Google Ads, and GTM dataLayer)
 */
export const trackGAEvent = (
  action: string,
  category: string = 'engagement',
  label?: string,
  value?: number,
  extraParams?: Record<string, any>
) => {
  if (typeof window === 'undefined') return;

  try {
    const payload: Record<string, any> = {
      event_category: category,
      event_label: label,
      value: value,
      ...extraParams
    };

    // 1. Dispatch to gtag
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', action, payload);
    } else if (activeConfig.gaMeasurementId || activeConfig.googleAdsId) {
      setupGATags(activeConfig);
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', action, payload);
      }
    }

    // 2. Dispatch to GTM dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: action,
      ...payload
    });

    logToInteractiveStream('event', action, {
      category,
      label,
      value,
      ...extraParams
    });
  } catch (error) {
    console.warn('[Analytics] Event tracking error:', error);
  }
};

// ============================================================================
// Specialized GA4 & Google Ads E-Commerce & Conversion Tracking Helpers
// ============================================================================

/**
 * View Item (Tour Detail Page)
 */
export const trackGAViewItem = (tour: { id: string; title: string; price?: number; category?: string; currency?: string }) => {
  const item = {
    item_id: tour.id,
    item_name: tour.title,
    item_category: tour.category || 'Tour',
    price: tour.price || 0
  };

  trackGAEvent('view_item', 'ecommerce', tour.title, tour.price, {
    currency: tour.currency || 'USD',
    value: tour.price || 0,
    items: [item]
  });

  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'view_item',
      ecommerce: {
        currency: tour.currency || 'USD',
        value: tour.price || 0,
        items: [item]
      }
    });
  }
};

/**
 * Add To Cart / Select Tour Option
 */
export const trackGAAddToCart = (tour: { id: string; title: string; price: number; quantity?: number; currency?: string }) => {
  const item = {
    item_id: tour.id,
    item_name: tour.title,
    price: tour.price,
    quantity: tour.quantity || 1
  };

  trackGAEvent('add_to_cart', 'ecommerce', tour.title, tour.price, {
    currency: tour.currency || 'USD',
    value: tour.price * (tour.quantity || 1),
    items: [item]
  });

  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'add_to_cart',
      ecommerce: {
        currency: tour.currency || 'USD',
        value: tour.price * (tour.quantity || 1),
        items: [item]
      }
    });
  }
};

/**
 * Begin Checkout Step
 */
export const trackGABeginCheckout = (booking: {
  tourTitle: string;
  totalAmount: number;
  participants?: number;
  currency?: string;
  tourId?: string;
}) => {
  const item = {
    item_id: booking.tourId || 'tour_booking',
    item_name: booking.tourTitle,
    price: booking.totalAmount,
    quantity: booking.participants || 1
  };

  trackGAEvent('begin_checkout', 'ecommerce', booking.tourTitle, booking.totalAmount, {
    currency: booking.currency || 'USD',
    value: booking.totalAmount,
    items: [item]
  });

  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'begin_checkout',
      ecommerce: {
        currency: booking.currency || 'USD',
        value: booking.totalAmount,
        items: [item]
      }
    });
  }
};

/**
 * Add Passenger / Shipping / Pickup Info Step (GA4 & GTM)
 */
export const trackGAAddShippingInfo = (booking: {
  tourTitle: string;
  totalAmount: number;
  currency?: string;
  shippingTier?: string;
  itemsCount?: number;
}) => {
  trackGAEvent('add_shipping_info', 'ecommerce', booking.tourTitle, booking.totalAmount, {
    currency: booking.currency || 'USD',
    value: booking.totalAmount,
    shipping_tier: booking.shippingTier || 'Standard Pickup'
  });

  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'add_shipping_info',
      ecommerce: {
        currency: booking.currency || 'USD',
        value: booking.totalAmount,
        shipping_tier: booking.shippingTier || 'Standard Pickup'
      }
    });
  }
};

/**
 * Add Payment Info Step (GA4 & GTM)
 */
export const trackGAAddPaymentInfo = (booking: {
  tourTitle: string;
  totalAmount: number;
  paymentType: string;
  currency?: string;
}) => {
  trackGAEvent('add_payment_info', 'ecommerce', booking.paymentType, booking.totalAmount, {
    currency: booking.currency || 'USD',
    value: booking.totalAmount,
    payment_type: booking.paymentType
  });

  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'add_payment_info',
      ecommerce: {
        currency: booking.currency || 'USD',
        value: booking.totalAmount,
        payment_type: booking.paymentType
      }
    });
  }
};

/**
 * Promo Coupon Applied (GA4 & GTM)
 */
export const trackGASelectPromotion = (couponCode: string, discountValue?: number) => {
  trackGAEvent('select_promotion', 'ecommerce', couponCode, discountValue || 0, {
    promotion_id: couponCode,
    promotion_name: `Coupon: ${couponCode}`,
    discount: discountValue || 0
  });

  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'select_promotion',
      ecommerce: {
        promotion_id: couponCode,
        promotion_name: `Coupon: ${couponCode}`,
        discount: discountValue || 0
      }
    });
  }
};

/**
 * Complete Purchase / Confirmed Booking (Google Ads + GA4 + GTM Conversion)
 */
export const trackGAPurchase = (booking: {
  id: string;
  tourTitle: string;
  totalAmount: number;
  paymentMethod?: string;
  currency?: string;
  participants?: number;
  customerEmail?: string;
}) => {
  const currency = booking.currency || 'USD';
  const value = Number(booking.totalAmount) || 0;
  const adsId = getGoogleAdsId();
  const conversionLabel = getGoogleAdsConversionLabel();

  const item = {
    item_id: booking.id,
    item_name: booking.tourTitle,
    price: value,
    quantity: booking.participants || 1
  };

  // 1. Dispatch GA4 purchase event
  trackGAEvent('purchase', 'ecommerce', booking.tourTitle, value, {
    transaction_id: booking.id,
    value: value,
    currency: currency,
    payment_type: booking.paymentMethod || 'online',
    items: [item]
  });

  // 2. Dispatch Google Ads conversion event if Google Ads is configured
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && adsId) {
    const sendTo = conversionLabel ? `${adsId}/${conversionLabel}` : adsId;
    window.gtag('event', 'conversion', {
      send_to: sendTo,
      value: value,
      currency: currency,
      transaction_id: booking.id
    });

    logToInteractiveStream('conversion', 'google_ads_conversion', {
      send_to: sendTo,
      value,
      currency,
      transaction_id: booking.id
    });

    console.log(`[Google Ads Conversion] Fired conversion event -> ${sendTo} (Value: ${value} ${currency})`);
  }

  // 3. Dispatch enhanced e-commerce purchase to GTM dataLayer
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'purchase',
      ecommerce: {
        transaction_id: booking.id,
        value: value,
        currency: currency,
        payment_type: booking.paymentMethod || 'online',
        items: [item]
      }
    });

    // Also push dedicated conversion event for custom GTM triggers
    window.dataLayer.push({
      event: 'conversion',
      conversion_type: 'booking_purchase',
      transaction_id: booking.id,
      value: value,
      currency: currency
    });
  }
};

/**
 * Lead / Contact / Inquiry Form Submit Conversion
 */
export const trackGAInquirySubmit = (inquiryType: string, planTitle?: string, value: number = 1) => {
  const adsId = getGoogleAdsId();

  trackGAEvent('generate_lead', 'conversion', planTitle || inquiryType, value, {
    lead_type: inquiryType
  });

  // If Google Ads configured, fire lead conversion
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && adsId) {
    window.gtag('event', 'conversion', {
      send_to: adsId,
      value: value,
      currency: 'USD'
    });
  }

  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'generate_lead',
      lead_type: inquiryType,
      plan: planTitle || ''
    });
  }
};
