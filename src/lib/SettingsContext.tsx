import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, getDoc, setDoc, collection, query, orderBy } from '@/src/lib/firebase';
import { db } from './firebase';
import { SiteSettings, TourLabel } from '../types';
import { useTenant } from './TenantContext';
import { updateTenantGA } from './googleAnalytics';

import { WebsiteBuilderSettings } from '../components/Admin/WebsiteBuilder';

interface SettingsContextType {
  settings: SiteSettings | null;
  builderSettings: WebsiteBuilderSettings | null;
  globalBrand: any | null;
  labels: TourLabel[];
  loading: boolean;
}

const defaultSettings: SiteSettings = {
  siteName: 'Tripbone',
  siteDescription: 'Discover the best tours and experiences with Tripbone.',
  siteKeywords: 'bali, tours, adventure, tripbone',
  supportEmail: 'support@tripbone.com',
  supportPhone: '+6281234567890',
  whatsappNumber: '+62 812-3456-7890',
  logoURL: '',
  faviconURL: '',
  heroImage: '',
  heroImages: [],
  officeAddress: 'Jl. Raya Ubud, Gianyar, Bali, Indonesia 80571',
  primaryColor: '#FF7A00',
  secondaryColor: '#1F3B1F',
  bodyFont: 'Plus Jakarta Sans',
  headingFont: 'Plus Jakarta Sans',
  currency: 'USD',
  destinationRegion: 'Bali',
  externalReviewsEnabled: true,
  googleReviewsEnabled: true,
  googleReviewUrl: 'https://www.google.com/maps/place/Bali+Adventours/@-8.4655289,115.3440464,18z/data=!4m18!1m9!3m8!1s0x2dd240fe46cca75b:0xbd3a5e58ca91c8b5!2sBali+Adventours!8m2!3d-8.466484!4d115.3451461!9m1!1b1!16s%2Fg%2F11b76fptbd!3m7!1s0x2dd240fe46cca75b:0xbd3a5e58ca91c8b5!8m2!3d-8.466484!4d115.3451461!9m1!1b1!16s%2Fg%2F11b76fptbd?entry=ttu',
  googleRating: 4.9,
  googleReviewCount: 520,
  tripadvisorEnabled: true,
  tripadvisorUrl: 'https://www.tripadvisor.com/Attraction_Review-g297694-d7939737-Reviews-Bali_Adventours-Denpasar_Bali.html',
  tripadvisorRating: 5.0,
  tripadvisorReviewCount: 342,
  airbnbEnabled: true,
  airbnbUrl: 'https://www.airbnb.com/experiences/4127629?modal=reviews',
  airbnbRating: 4.95,
  airbnbReviewCount: 185,
  viatorEnabled: false,
  viatorUrl: '',
  viatorRating: 4.9,
  viatorReviewCount: 120,
  getyourguideEnabled: false,
  getyourguideUrl: '',
  getyourguideRating: 4.8,
  getyourguideReviewCount: 95,
  trustpilotEnabled: false,
  trustpilotUrl: '',
  trustpilotRating: 4.9,
  trustpilotReviewCount: 150,
  klookEnabled: false,
  klookUrl: '',
  klookRating: 4.9,
  klookReviewCount: 88,
  bookingEnabled: false,
  bookingUrl: '',
  bookingRating: 9.6,
  bookingReviewCount: 210,
  customReviewEnabled: false,
  customReviewPlatformName: 'Direct Reviews',
  customReviewUrl: '',
  customReviewRating: 5.0,
  customReviewCount: 50,
  maxDisplayReviews: 6,
  elfsightEnabled: true,
  elfsightEmbedCode: `<script src="https://elfsightcdn.com/platform.js" async></script>\n<div class="elfsight-app-f42c2859-6759-4fed-9af6-fba72d93a9f6" data-elfsight-app-lazy></div>`
};

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  builderSettings: null,
  globalBrand: null,
  labels: [],
  loading: true
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { tenantId, tenant, loading: tenantLoading } = useTenant();
  const [settings, setSettings] = useState<SiteSettings | null>(() => {
    if (typeof window !== 'undefined' && (window as any).__PRELOADED_DATA__?.settings) {
      return (window as any).__PRELOADED_DATA__.settings as SiteSettings;
    }
    return null;
  });
  const [builderSettings, setBuilderSettings] = useState<WebsiteBuilderSettings | null>(null);
  const [globalBrand, setGlobalBrand] = useState<any>(null);
  const [labels, setLabels] = useState<TourLabel[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply settings initially if preloaded
  useEffect(() => {
    if (settings) {
      applySettings(settings);
    }
  }, []);

  useEffect(() => {
    const faviconUrl = settings?.faviconURL || tenant?.favicon || tenant?.logo || globalBrand?.faviconUrl || '/api/uploads/q08dkhNCIxtWc4kuqnrv';
    if (faviconUrl) {
      ['icon', 'shortcut icon', 'apple-touch-icon'].forEach(rel => {
        let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = rel;
          document.head.appendChild(link);
        }
        link.href = faviconUrl;
      });
    }
  }, [globalBrand?.faviconUrl, settings?.faviconURL, tenant?.favicon, tenant?.logo]);

  useEffect(() => {
    if (tenantLoading) return;

    const docRef = doc(db, 'settings', tenantId || 'general');
    
    // Listen for settings
    const unsubscribeSettings = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SiteSettings;
        setSettings(data);
        applySettings(data);
        updateTenantGA(tenantId, {
          gaMeasurementId: data.gaMeasurementId,
          gtmId: data.gtmId,
          googleAdsId: data.googleAdsId,
          googleAdsConversionLabel: data.googleAdsConversionLabel,
          gaCustomScript: data.gaCustomScript,
          gtmBodyScript: data.gtmBodyScript
        });
      } else {
        const fallback: SiteSettings = {
          ...defaultSettings,
          siteName: tenant?.companyName || 'Tripbone',
          siteDescription: tenant?.companyName ? `Premium Tours & Experiences with ${tenant.companyName}` : `Premium Tours & Experiences with Tripbone`,
          supportEmail: tenant?.email || defaultSettings.supportEmail,
          supportPhone: tenant?.phone || defaultSettings.supportPhone,
          logoURL: tenant?.logo || defaultSettings.logoURL,
          primaryColor: tenant?.primaryColor || defaultSettings.primaryColor,
          secondaryColor: tenant?.secondaryColor || defaultSettings.secondaryColor,
        };
        setSettings(fallback);
        applySettings(fallback);
        updateTenantGA(tenantId, {
          gaMeasurementId: fallback.gaMeasurementId,
          gtmId: fallback.gtmId,
          googleAdsId: fallback.googleAdsId,
          googleAdsConversionLabel: fallback.googleAdsConversionLabel,
          gaCustomScript: fallback.gaCustomScript,
          gtmBodyScript: fallback.gtmBodyScript
        });
      }
    });

    const builderRef = doc(db, 'website_builder', tenantId || 'general');
    const unsubscribeBuilder = onSnapshot(builderRef, (snapshot) => {
      if (snapshot.exists()) {
        setBuilderSettings(snapshot.data() as WebsiteBuilderSettings);
      } else {
        setBuilderSettings(null);
      }
    });

    // Listen for global platform branding
    const globalBrandRef = doc(db, 'settings', 'globalBrand');
    const unsubscribeGlobalBrand = onSnapshot(globalBrandRef, (snapshot) => {
      if (snapshot.exists()) {
        setGlobalBrand(snapshot.data());
      } else {
        setGlobalBrand({
          platformName: 'Tripbone SaaS',
          tagline: 'Secure Enterprise Sandbox',
          supportEmail: 'support@tripbone.com',
          copyright: '© 2026 PT Tripbone Indonesia',
          logoUrl: '',
          faviconUrl: ''
        });
      }
    });

    // Listen for labels
    const unsubscribeLabels = onSnapshot(query(collection(db, 'tourLabels'), orderBy('name')), (snapshot) => {
      setLabels(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TourLabel)));
      setLoading(false);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeBuilder();
      unsubscribeGlobalBrand();
      unsubscribeLabels();
    };
  }, [tenantId, tenantLoading]);

  function applySettings(data: SiteSettings) {
    // Apply colors to CSS variables
    document.documentElement.style.setProperty('--primary-color', data.primaryColor);

    // Apply branding preset class to root
    const root = document.documentElement;
    root.classList.remove(
      'theme-swiss-minimalist', 
      'theme-tech-dark', 
      'theme-elegant-editorial', 
      'theme-nordic-forest',
      'theme-retro-adventure',
      'theme-tokyo-neon',
      'theme-mediterranean-breeze',
      'theme-brutalist-mono',
      'theme-royal-safari',
      'theme-zen-oasis',
      'theme-alpine-chalet',
      'theme-sunset-ibiza',
      'theme-default'
    );
    const activePreset = data.brandingPreset || 'default';
    root.classList.add(`theme-${activePreset}`);
    
    // Inject fonts if they are from Google Fonts or branding presets
    if (data.headingFont || data.bodyFont || activePreset !== 'default') {
        const fontId = 'google-fonts-link';
        let link = document.getElementById(fontId) as HTMLLinkElement;
        if (!link) {
            link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        
        let headingFont = (data.headingFont && data.headingFont !== 'Oswald') ? data.headingFont : 'Plus Jakarta Sans';
        let bodyFont = data.bodyFont || 'Plus Jakarta Sans';

        if (activePreset === 'swiss-minimalist') {
            headingFont = 'Inter';
            bodyFont = 'Inter';
        } else if (activePreset === 'tech-dark') {
            headingFont = 'Plus Jakarta Sans';
            bodyFont = 'Inter';
        } else if (activePreset === 'elegant-editorial') {
            headingFont = 'Playfair Display';
            bodyFont = 'Plus Jakarta Sans';
        } else if (activePreset === 'nordic-forest') {
            headingFont = 'Outfit';
            bodyFont = 'Plus Jakarta Sans';
        } else if (activePreset === 'retro-adventure') {
            headingFont = 'Plus Jakarta Sans';
            bodyFont = 'Plus Jakarta Sans';
        } else if (activePreset === 'tokyo-neon') {
            headingFont = 'Plus Jakarta Sans';
            bodyFont = 'Inter';
        } else if (activePreset === 'mediterranean-breeze') {
            headingFont = 'Outfit';
            bodyFont = 'Plus Jakarta Sans';
        } else if (activePreset === 'brutalist-mono') {
            headingFont = 'Plus Jakarta Sans';
            bodyFont = 'Inter';
        } else if (activePreset === 'royal-safari') {
            headingFont = 'Cormorant Garamond';
            bodyFont = 'Plus Jakarta Sans';
        } else if (activePreset === 'zen-oasis') {
            headingFont = 'Outfit';
            bodyFont = 'Inter';
        } else if (activePreset === 'alpine-chalet') {
            headingFont = 'Outfit';
            bodyFont = 'Plus Jakarta Sans';
        } else if (activePreset === 'sunset-ibiza') {
            headingFont = 'Plus Jakarta Sans';
            bodyFont = 'Plus Jakarta Sans';
        }

        const families = [];
        if (headingFont) families.push(`family=${headingFont.replace(/ /g, '+')}:wght@400;500;700;900`);
        if (bodyFont) families.push(`family=${bodyFont.replace(/ /g, '+')}:wght@400;500;600`);
        
        if (families.length > 0) {
            link.href = `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
        }
        
        document.documentElement.style.setProperty('--font-heading', headingFont);
        document.documentElement.style.setProperty('--font-body', bodyFont);
    }

    // Apply favicon
    if (data.faviconURL) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = data.faviconURL;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, builderSettings, globalBrand, labels, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}
