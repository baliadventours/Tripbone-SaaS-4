import { lazy, ComponentType } from 'react';

/**
 * Utility helper to handle lazy component loading errors gracefully.
 * When a Vite chunk returns 404 (e.g. after a deployment or server restart),
 * this retries dynamically and performs a cache-busted auto-recovery to load fresh assets.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    // 1. Attempt initial import with up to 2 immediate retries for transient network drops
    let lastError: any = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        const component = await componentImport();
        sessionStorage.removeItem('lazy_retry_timestamp');
        return component;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || err?.toString() || '';
        const isModuleChunkError =
          msg.includes('Failed to fetch dynamically imported module') ||
          msg.includes('Loading chunk') ||
          msg.includes('error loading dynamically imported module') ||
          msg.includes('Importing a module script failed') ||
          msg.includes('is not a valid JavaScript MIME type');

        if (!isModuleChunkError) {
          // If it's a code or runtime error not related to fetching chunk assets, throw immediately
          throw err;
        }
      }
    }

    // 2. If it's a chunk hash mismatch due to a recent platform deployment,
    // perform a cache-busting page reload to fetch the newly deployed HTML and bundle
    const lastRecovery = sessionStorage.getItem('lazy_retry_timestamp');
    const now = Date.now();

    if (!lastRecovery || now - parseInt(lastRecovery, 10) > 15000) {
      console.warn('[lazyWithRetry] Stale chunk detected after deployment. Auto-recovering with cache bust...');
      sessionStorage.setItem('lazy_retry_timestamp', now.toString());
      const targetUrl = new URL(window.location.href);
      targetUrl.searchParams.set('_v', now.toString());
      window.location.replace(targetUrl.toString());
      return new Promise(() => {}); // Suspend until browser navigates
    }

    sessionStorage.removeItem('lazy_retry_timestamp');
    throw lastError;
  });
}

