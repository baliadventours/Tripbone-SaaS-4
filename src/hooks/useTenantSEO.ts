import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTenant } from '../lib/TenantContext';
import { useSettings } from '../lib/SettingsContext';

function deriveBrandFromHostname(hostname: string): string {
  if (!hostname) return 'Tripbone';
  const clean = hostname.replace(/^www\./i, '').split(':')[0].trim().toLowerCase();
  const namePart = clean.split('.')[0]; // e.g. smartbalitours or baliwanderlust
  if (!namePart || namePart === 'localhost' || namePart === 'tripbone' || namePart === '127' || namePart === 'app') {
    return 'Tripbone';
  }

  const knownBrands: Record<string, string> = {
    'smartbalitours': 'Smart Bali Tours',
    'baliparadisetour': 'Bali Paradise Tour',
    'baliblissfultours': 'Bali Blissful Tours',
    'baliwanderlust': 'Bali Wanderlust',
  };
  if (knownBrands[namePart]) {
    return knownBrands[namePart];
  }

  // Convert hyphens/underscores or merged lowercase to readable Title Case if applicable
  const words = namePart.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  return words.replace(/\b\w/g, c => c.toUpperCase());
}

export function useTenantSEO() {
  const { tenant, isMaster, globalSEO } = useTenant();
  const { settings, globalBrand } = useSettings();
  const location = useLocation();

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const derivedBrand = deriveBrandFromHostname(hostname);
    const isCustomDomain = derivedBrand !== 'Tripbone';

    const siteName = settings?.siteName || tenant?.companyName || (isCustomDomain ? derivedBrand : (globalBrand?.platformName || globalSEO?.siteName || 'Tripbone'));
    const siteDescription = settings?.metaDescription || settings?.siteDescription || (tenant as any)?.description || 
        (!isMaster || isCustomDomain ? `Explore amazing tours and travel packages curated by ${siteName}. Book directly online with instant confirmation.` : (globalBrand?.tagline || globalSEO?.description));
    const siteKeywords = settings?.siteKeywords || globalSEO?.keywords || '';
    const siteImage = settings?.ogImage || settings?.heroImage || settings?.logoURL || tenant?.logo || globalBrand?.logoUrl || globalSEO?.image || 'https://i.ibb.co.com/pvLCVYkM/ALAS-HARUM8-optimized.webp';

    let title = siteName;
    if (isMaster && !isCustomDomain) {
      title = globalSEO?.title || (globalBrand?.platformName ? `${globalBrand.platformName} - All-in-One AI Tour Operator Software & Website Builder` : 'Tripbone.com - All-in-One AI Tour Operator Software & Website Builder');
    } else {
      const isTourDetail = location.pathname.startsWith('/tour/');
      if (location.pathname === '/') {
         title = settings?.metaTitle || '';
         if (!title && settings?.homeTitleFormat) {
           title = settings.homeTitleFormat.replace(/\{\{siteName\}\}/gi, siteName);
         }
         title = title || `${siteName} - Book Tours and Activities in Bali`;
      } else if (!isTourDetail) {
         const pathParts = location.pathname.split('/').filter(Boolean);
         if (pathParts.length > 0) {
            const pageName = pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1);
            title = `${pageName} | ${siteName}`;
         }
      }
    }

    // Update document title
    document.title = title;

    // Helper to update meta tags safely
    const updateMeta = (name: string, content: string, property?: string) => {
      if (!content) return;
      let el: HTMLMetaElement | null = null;
      if (property) {
        el = document.querySelector(`meta[property="${property}"]`);
      } else if (name) {
        el = document.querySelector(`meta[name="${name}"]`);
      }
      
      if (!el) {
        el = document.createElement('meta');
        if (property) el.setAttribute('property', property);
        if (name) el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateMeta('description', siteDescription);
    updateMeta('', siteName, 'og:site_name');
    updateMeta('', title, 'og:title');
    updateMeta('', siteDescription, 'og:description');
    updateMeta('', siteImage, 'og:image');
    updateMeta('', 'website', 'og:type');

    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', siteDescription);
    updateMeta('twitter:image', siteImage);
    
    if (siteKeywords) {
       updateMeta('keywords', siteKeywords);
    }

    const siteFavicon = settings?.faviconURL || tenant?.favicon || tenant?.logo || globalBrand?.faviconUrl || globalSEO?.faviconUrl || globalSEO?.favicon || '/api/uploads/q08dkhNCIxtWc4kuqnrv';
    if (siteFavicon) {
      ['icon', 'shortcut icon', 'apple-touch-icon'].forEach(rel => {
        let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = rel;
          document.head.appendChild(link);
        }
        link.href = siteFavicon;
      });
    }

    // Dynamic PWA Meta Synchronization
    const activeThemeColor = (settings as any)?.accentColor || settings?.primaryColor || '#00A651';
    updateMeta('apple-mobile-web-app-title', siteName);
    updateMeta('apple-mobile-web-app-capable', 'yes');
    updateMeta('mobile-web-app-capable', 'yes');
    updateMeta('theme-color', activeThemeColor);

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = '/manifest.json';

  }, [tenant, settings, globalBrand, isMaster, globalSEO, location.pathname]);
}
