import { lazy, ComponentType } from 'react';

/**
 * Utility helper to handle lazy component loading errors gracefully.
 * When a Vite chunk returns 404 (e.g. after a deployment or server restart),
 * this retries or performs a single page reload to fetch the new build assets.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasBeenRefreshed = sessionStorage.getItem('lazy_retry_refreshed');

    try {
      const component = await componentImport();
      sessionStorage.removeItem('lazy_retry_refreshed');
      return component;
    } catch (error: any) {
      console.warn('Lazy chunk loading failed, attempting auto-recovery:', error);
      
      if (!pageHasBeenRefreshed) {
        sessionStorage.setItem('lazy_retry_refreshed', 'true');
        window.location.reload();
        return new Promise(() => {}); // Pause until reload executes
      }

      sessionStorage.removeItem('lazy_retry_refreshed');
      throw error;
    }
  });
}
