/**
 * PostHog Product Analytics & Session Replay Integration for Tripbone SaaS
 *
 * Provides:
 * - Real-time event tracking and pageviews
 * - Full-session recording & heatmap playback
 * - User identification & multi-tenant isolation
 * - Custom domain events for tours, bookings, AI plans, and conversion funnels
 * - Configurable per tenant (Firestore settings/{tenantId}) and env vars
 */

import posthog from 'posthog-js';
import { db } from './firebase';
import { doc, getDoc } from './firebase';

export interface PostHogConfig {
  apiKey?: string;
  apiHost?: string;
  enabled?: boolean;
  autocapture?: boolean;
  disableSessionRecording?: boolean;
  maskAllInputs?: boolean;
}

// In-memory tenant PostHog state
let activeConfig: PostHogConfig = {};
let activeTenantId: string | null = null;
let isInitialized = false;

// Buffer of recent events for live admin debugger
export interface RecordedPostHogEvent {
  timestamp: string;
  type: 'pageview' | 'event' | 'identify' | 'reset';
  name: string;
  properties: Record<string, any>;
}

export const recordedPostHogEvents: RecordedPostHogEvent[] = [];

const logToDebuggerStream = (
  type: 'pageview' | 'event' | 'identify' | 'reset',
  name: string,
  properties: Record<string, any> = {}
) => {
  recordedPostHogEvents.unshift({
    timestamp: new Date().toLocaleTimeString(),
    type,
    name,
    properties
  });

  if (recordedPostHogEvents.length > 50) {
    recordedPostHogEvents.pop();
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('posthog-event-logged'));
  }
};

/**
 * Resolves PostHog API Key from supported environment variable aliases
 */
export const getEnvPostHogKey = (): string =>
  (import.meta.env.VITE_POSTHOG_PROJECT_TOKEN as string | undefined) ||
  (import.meta.env.VITE_POSTHOG_KEY as string | undefined) ||
  (import.meta.env.VITE_POSTHOG_API_KEY as string | undefined) ||
  (import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined) ||
  '';

/**
 * Resolves PostHog Ingestion Host from supported environment variable aliases
 */
export const getEnvPostHogHost = (): string =>
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ||
  (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) ||
  'https://us.i.posthog.com';

/**
 * Returns active PostHog configuration
 */
export const getPostHogConfig = (): PostHogConfig => ({
  apiKey: activeConfig.apiKey || getEnvPostHogKey(),
  apiHost: activeConfig.apiHost || getEnvPostHogHost(),
  enabled: activeConfig.enabled !== false,
  autocapture: activeConfig.autocapture !== false,
  disableSessionRecording: activeConfig.disableSessionRecording === true,
  maskAllInputs: activeConfig.maskAllInputs !== false
});

/**
 * Initialize PostHog instance with tenant config or fallback to env vars
 */
export const initPostHog = async (tenantId?: string | null, customConfig?: PostHogConfig): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  const currentTenant = tenantId || null;

  // If already initialized for this tenant and config didn't change, register tenant context
  if (isInitialized && activeTenantId === currentTenant && !customConfig) {
    if (currentTenant) {
      posthog.register({ tenant_id: currentTenant });
    }
    return true;
  }

  activeTenantId = currentTenant;

  let configToUse: PostHogConfig = {
    apiKey: getEnvPostHogKey(),
    apiHost: getEnvPostHogHost(),
    enabled: true,
    autocapture: true,
    disableSessionRecording: false,
    maskAllInputs: true,
    ...customConfig
  };

  // If running in tenant context and no custom override supplied, attempt to fetch from Firestore settings
  if (!customConfig) {
    try {
      if (currentTenant) {
        const settingsRef = doc(db, 'settings', currentTenant);
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.posthogKey) configToUse.apiKey = data.posthogKey;
          if (data.posthogHost) configToUse.apiHost = data.posthogHost;
          if (typeof data.posthogEnabled === 'boolean') configToUse.enabled = data.posthogEnabled;
          if (typeof data.posthogAutocapture === 'boolean') configToUse.autocapture = data.posthogAutocapture;
          if (typeof data.posthogSessionRecording === 'boolean') {
            configToUse.disableSessionRecording = !data.posthogSessionRecording;
          }
          if (typeof data.posthogMaskAllInputs === 'boolean') {
            configToUse.maskAllInputs = data.posthogMaskAllInputs;
          }
        }
      } else {
        // Main tripbone.com site context: check globalBrand and general settings
        const brandRef = doc(db, 'settings', 'globalBrand');
        const generalRef = doc(db, 'settings', 'general');
        const [brandSnap, generalSnap] = await Promise.all([getDoc(brandRef), getDoc(generalRef)]);

        const brandData = brandSnap.exists() ? brandSnap.data() : null;
        const generalData = generalSnap.exists() ? generalSnap.data() : null;
        const mainData = brandData?.posthogKey ? brandData : generalData;

        if (mainData) {
          if (mainData.posthogKey) configToUse.apiKey = mainData.posthogKey;
          if (mainData.posthogHost) configToUse.apiHost = mainData.posthogHost;
          if (typeof mainData.posthogEnabled === 'boolean') configToUse.enabled = mainData.posthogEnabled;
          if (typeof mainData.posthogAutocapture === 'boolean') configToUse.autocapture = mainData.posthogAutocapture;
          if (typeof mainData.posthogSessionRecording === 'boolean') {
            configToUse.disableSessionRecording = !mainData.posthogSessionRecording;
          }
          if (typeof mainData.posthogMaskAllInputs === 'boolean') {
            configToUse.maskAllInputs = mainData.posthogMaskAllInputs;
          }
        }
      }
    } catch (err) {
      console.warn('PostHog: error loading settings, falling back to defaults:', err);
    }
  }

  activeConfig = configToUse;

  // If PostHog is disabled or no API key is provided
  if (!configToUse.enabled || !configToUse.apiKey || configToUse.apiKey.trim() === '') {
    return false;
  }

  try {
    const host = configToUse.apiHost?.trim() || 'https://us.i.posthog.com';
    const isMainPlatform = !currentTenant;

    posthog.init(configToUse.apiKey.trim(), {
      api_host: host,
      // Automatically captures initial pageview and subsequent SPA route changes via History API
      capture_pageview: 'history_change',
      capture_pageleave: true,
      person_profiles: 'identified_only',
      autocapture: configToUse.autocapture !== false,
      disable_session_recording: configToUse.disableSessionRecording === true,
      session_recording: {
        maskAllInputs: configToUse.maskAllInputs !== false,
        maskInputOptions: {
          password: true,
          color: false,
          date: false,
          'datetime-local': false,
          email: false,
          month: false,
          number: false,
          range: false,
          search: false,
          tel: false,
          text: false,
          time: false,
          url: false,
          week: false
        }
      },
      persistence: 'localStorage+cookie',
      bootstrap: {},
      loaded: (ph) => {
        ph.register({
          tenant_id: currentTenant || 'tripbone_main',
          site_type: isMainPlatform ? 'tripbone_main_site' : 'tenant_portal',
          is_main_site: isMainPlatform,
          domain: window.location.hostname,
          app_name: 'Tripbone SaaS'
        });

        // Ensure pageview is captured immediately for the current page upon initial load
        try {
          ph.capture('$pageview', {
            $current_url: window.location.href,
            title: document.title,
            tenant_id: currentTenant || 'tripbone_main',
            site_type: isMainPlatform ? 'tripbone_main_site' : 'tenant_portal'
          });
        } catch (pageviewErr) {
          console.warn('PostHog initial pageview error:', pageviewErr);
        }
      }
    });

    isInitialized = true;
    logToDebuggerStream('event', 'posthog_initialized', {
      host,
      tenantId: currentTenant || 'tripbone_main',
      siteType: isMainPlatform ? 'tripbone_main_site' : 'tenant_portal',
      autocapture: configToUse.autocapture !== false,
      sessionRecording: configToUse.disableSessionRecording !== true
    });

    return true;
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
    return false;
  }
};

/**
 * Update tenant PostHog settings in-memory and re-init
 */
export const updateTenantPostHog = (tenantId: string | null, config: PostHogConfig) => {
  activeConfig = { ...activeConfig, ...config };
  activeTenantId = tenantId;
  return initPostHog(tenantId, activeConfig);
};

/**
 * Check if PostHog SDK is active and initialized
 */
export const isPostHogReady = (): boolean => {
  return isInitialized && !!activeConfig.apiKey;
};

let lastTrackedUrl = '';
let lastTrackedTime = 0;

/**
 * Track route changes and pageviews in PostHog
 */
export const trackPostHogPageView = (url?: string, properties: Record<string, any> = {}) => {
  if (typeof window === 'undefined') return;

  const currentUrl = url || window.location.pathname + window.location.search;
  const currentTitle = document.title;
  const now = Date.now();

  logToDebuggerStream('pageview', '$pageview', {
    $current_url: currentUrl,
    title: currentTitle,
    tenant_id: activeTenantId || 'master',
    ...properties
  });

  if (isPostHogReady()) {
    // Prevent double-capturing if history_change or another event listener just captured this URL within 800ms
    if (lastTrackedUrl === currentUrl && now - lastTrackedTime < 800 && Object.keys(properties).length === 0) {
      return;
    }

    lastTrackedUrl = currentUrl;
    lastTrackedTime = now;

    try {
      posthog.capture('$pageview', {
        $current_url: currentUrl,
        title: currentTitle,
        tenant_id: activeTenantId || 'master',
        ...properties
      });
    } catch (err) {
      console.warn('PostHog pageview capture error:', err);
    }
  }
};

/**
 * Track generic or custom event in PostHog
 */
export const trackPostHogEvent = (eventName: string, properties: Record<string, any> = {}) => {
  if (typeof window === 'undefined') return;

  const payload = {
    tenant_id: activeTenantId || 'master',
    timestamp: new Date().toISOString(),
    ...properties
  };

  logToDebuggerStream('event', eventName, payload);

  if (isPostHogReady()) {
    try {
      posthog.capture(eventName, payload);
    } catch (err) {
      console.warn(`PostHog event capture error (${eventName}):`, err);
    }
  }
};

/**
 * Identify authenticated user in PostHog
 */
export const identifyPostHogUser = (userId: string, traits: Record<string, any> = {}) => {
  if (typeof window === 'undefined' || !userId) return;

  const userTraits = {
    tenant_id: activeTenantId || 'master',
    ...traits
  };

  logToDebuggerStream('identify', '$identify', { userId, ...userTraits });

  if (isPostHogReady()) {
    try {
      posthog.identify(userId, userTraits);
    } catch (err) {
      console.warn('PostHog identify error:', err);
    }
  }
};

/**
 * Reset PostHog user on sign-out
 */
export const resetPostHogUser = () => {
  if (typeof window === 'undefined') return;

  logToDebuggerStream('reset', '$reset', {});

  if (isPostHogReady()) {
    try {
      posthog.reset();
    } catch (err) {
      console.warn('PostHog reset error:', err);
    }
  }
};

/**
 * Domain-specific Tracking Helpers for Tripbone SaaS
 */

export const trackPostHogTourView = (tour: {
  id: string;
  title: string;
  price?: number;
  category?: string;
  location?: string;
}) => {
  trackPostHogEvent('view_tour_detail', {
    tour_id: tour.id,
    tour_title: tour.title,
    price: tour.price,
    category: tour.category || 'Tour',
    location: tour.location || 'Bali'
  });
};

export const trackPostHogBeginCheckout = (data: {
  tourId?: string;
  tourTitle?: string;
  totalPrice?: number;
  currency?: string;
  paxCount?: number;
  step?: number;
}) => {
  trackPostHogEvent('begin_checkout', {
    tour_id: data.tourId,
    tour_title: data.tourTitle,
    value: data.totalPrice,
    currency: data.currency || 'IDR',
    pax_count: data.paxCount || 1,
    checkout_step: data.step || 1
  });
};

export const trackPostHogPurchase = (order: {
  bookingId: string;
  totalAmount: number;
  currency: string;
  tourTitle?: string;
  customerEmail?: string;
  paymentMethod?: string;
}) => {
  trackPostHogEvent('completed_booking', {
    booking_id: order.bookingId,
    value: order.totalAmount,
    currency: order.currency,
    tour_title: order.tourTitle,
    payment_method: order.paymentMethod || 'Online Gateway',
    $revenue: order.totalAmount
  });
};

export const trackPostHogInquirySubmit = (inquiry: {
  name?: string;
  email?: string;
  phone?: string;
  duration?: number | string;
  destination?: string;
  travelDate?: string;
}) => {
  trackPostHogEvent('submit_inquiry', {
    guest_name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    duration: inquiry.duration,
    destination: inquiry.destination,
    travel_date: inquiry.travelDate
  });
};

export const trackPostHogAIPlanGenerated = (plan: {
  title?: string;
  days?: number;
  destination?: string;
  pax?: number | string;
  pace?: string;
}) => {
  trackPostHogEvent('generate_ai_trip_plan', {
    plan_title: plan.title,
    days: plan.days,
    destination: plan.destination,
    pax: plan.pax,
    pace: plan.pace
  });
};

/**
 * Marketing & Growth Telemetry for Tripbone Main Platform (tripbone.com)
 */

export const trackPostHogMarketingCTA = (data: {
  ctaName: string;
  location: string;
  destination?: string;
  section?: string;
}) => {
  trackPostHogEvent('marketing_cta_clicked', {
    cta_name: data.ctaName,
    cta_location: data.location,
    destination: data.destination,
    section: data.section,
    platform_scope: 'tripbone_main_site'
  });
};

export const trackPostHogDemoModalOpen = (data?: { source?: string }) => {
  trackPostHogEvent('marketing_demo_modal_opened', {
    source: data?.source || 'main_hero',
    platform_scope: 'tripbone_main_site'
  });
};

export const trackPostHogDemoLeadSubmit = (data: {
  name: string;
  email: string;
  source?: string;
  phone?: string;
  country?: string;
  companyName?: string;
}) => {
  trackPostHogEvent('marketing_demo_lead_submitted', {
    lead_name: data.name,
    lead_email: data.email,
    phone: data.phone,
    country: data.country,
    company_name: data.companyName,
    source: data.source || 'hero_modal',
    platform_scope: 'tripbone_main_site'
  });
};

export const trackPostHogShowcaseClick = (data: {
  operatorTitle: string;
  domain: string;
  prompt?: string;
  category?: string;
}) => {
  trackPostHogEvent('marketing_showcase_clicked', {
    showcase_title: data.operatorTitle,
    showcase_domain: data.domain,
    showcase_prompt: data.prompt,
    category: data.category || 'tour_operator',
    platform_scope: 'tripbone_main_site'
  });
};

export const trackPostHogPricingSelect = (data: {
  planSlug: string;
  planName?: string;
  period: string;
  price?: number;
  currency?: string;
}) => {
  trackPostHogEvent('marketing_pricing_selected', {
    plan_slug: data.planSlug,
    plan_name: data.planName || data.planSlug,
    billing_period: data.period,
    price: data.price,
    currency: data.currency || 'USD',
    platform_scope: 'tripbone_main_site'
  });
};

export const trackPostHogBillingIntervalChange = (data: { interval: string }) => {
  trackPostHogEvent('marketing_pricing_interval_toggle', {
    interval: data.interval,
    platform_scope: 'tripbone_main_site'
  });
};

export const trackPostHogFeatureTabClick = (data: { tabName: string; category?: string }) => {
  trackPostHogEvent('marketing_feature_tab_clicked', {
    tab_name: data.tabName,
    category: data.category,
    platform_scope: 'tripbone_main_site'
  });
};

export const trackPostHogComparisonView = (data: { competitor: string; source?: string }) => {
  trackPostHogEvent('marketing_comparison_viewed', {
    competitor: data.competitor,
    source: data.source,
    platform_scope: 'tripbone_main_site'
  });
};

export const trackPostHogSignupStep = (data: {
  step: number;
  email?: string;
  plan?: string;
  method?: string;
}) => {
  trackPostHogEvent('marketing_signup_funnel_step', {
    step_number: data.step,
    email: data.email,
    chosen_plan: data.plan,
    auth_method: data.method || 'email',
    platform_scope: 'tripbone_main_site'
  });
};

export const trackPostHogWorkspaceProvisioned = (data: {
  slug: string;
  companyName: string;
  plan?: string;
  billingInterval?: string;
  currency?: string;
}) => {
  trackPostHogEvent('marketing_workspace_provisioned', {
    tenant_slug: data.slug,
    company_name: data.companyName,
    plan: data.plan,
    billing_interval: data.billingInterval,
    currency: data.currency || 'USD',
    platform_scope: 'tripbone_main_site'
  });
};

export const trackPostHogCookieConsent = (data: { decision: 'accepted' | 'declined' }) => {
  trackPostHogEvent('marketing_cookie_consent', {
    decision: data.decision,
    platform_scope: 'tripbone_main_site'
  });
};

