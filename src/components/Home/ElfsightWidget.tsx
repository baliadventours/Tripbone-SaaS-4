import { useEffect } from 'react';

interface ElfsightWidgetProps {
  embedCode?: string;
  className?: string;
}

const DEFAULT_ELFSIGHT_CODE = `<script src="https://elfsightcdn.com/platform.js" async></script>
<div class="elfsight-app-f42c2859-6759-4fed-9af6-fba72d93a9f6" data-elfsight-app-lazy></div>`;

export default function ElfsightWidget({ embedCode, className = '' }: ElfsightWidgetProps) {
  const activeCode = (embedCode && embedCode.trim()) ? embedCode.trim() : DEFAULT_ELFSIGHT_CODE;

  useEffect(() => {
    if (!activeCode) return;

    // Load Elfsight platform script if not already present
    const existingScript = document.querySelector('script[src*="platform.js"], script[src*="elfsight"]');
    if (!existingScript) {
      const script = document.createElement('script');
      // Extract script src if provided in user code, otherwise use elfsightcdn.com
      const srcMatch = activeCode.match(/src=["']([^"']+)["']/);
      script.src = srcMatch ? srcMatch[1] : 'https://elfsightcdn.com/platform.js';
      script.async = true;
      document.body.appendChild(script);
    } else {
      // Re-initialize Elfsight if window.eapps is available
      if ((window as any).eapps && typeof (window as any).eapps.init === 'function') {
        try {
          (window as any).eapps.init();
        } catch (e) {
          console.log("[Elfsight Init Note]:", e);
        }
      }
    }
  }, [activeCode]);

  if (!activeCode) {
    return null;
  }

  // Parse embed code: extract app class (e.g., elfsight-app-f42c2859-6759-4fed-9af6-fba72d93a9f6)
  let appIdClass = '';
  const match = activeCode.match(/elfsight-app-[a-zA-Z0-9_-]+/);
  if (match) {
    appIdClass = match[0];
  } else if (activeCode.length > 5) {
    appIdClass = activeCode.startsWith('elfsight-app-') ? activeCode : `elfsight-app-${activeCode}`;
  }

  if (!appIdClass) {
    return null;
  }

  return (
    <div className={`w-full flex justify-center py-2 sm:py-4 ${className}`}>
      <div className={`${appIdClass} w-full min-h-[120px]`} />
    </div>
  );
}
