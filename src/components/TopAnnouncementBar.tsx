import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, X, Megaphone, Zap } from 'lucide-react';
import { useSettings } from '../lib/SettingsContext';
import { useTenant } from '../lib/TenantContext';

interface TopAnnouncementBarProps {
  onDismiss?: () => void;
  className?: string;
}

export default function TopAnnouncementBar({ onDismiss, className = '' }: TopAnnouncementBarProps) {
  const { settings, globalBrand } = useSettings();
  const { isMaster, tenantId } = useTenant();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('tripbone_topbar_dismissed') === 'true';
    }
    return false;
  });

  const isTenantWebsite = !isMaster || Boolean(tenantId && tenantId !== 'master');
  const defaultSaaSMessage = 'Build Your Tour Booking Website in 2 Minutes — AI-Powered & Zero Code!';

  // On tenant websites, NEVER display the top SaaS promotional bar unless the tenant explicitly enabled it with custom text
  if (isTenantWebsite) {
    const tenantBarEnabled = settings?.topBarEnabled === true;
    const customText = settings?.topBarText;
    const isSaaSPromoText = !customText || customText.includes('Build Your Tour Booking Website') || customText === defaultSaaSMessage;

    if (!tenantBarEnabled || isSaaSPromoText || !customText) {
      return null;
    }
  }

  // Priorities for SaaS platform: tenant settings > globalBrand > defaults
  const enabled = settings?.topBarEnabled ?? globalBrand?.topBarEnabled ?? true;
  const badge = settings?.topBarBadge || globalBrand?.topBarBadge || 'PROMO 🚀';
  const text = settings?.topBarText || globalBrand?.topBarText || defaultSaaSMessage;
  const link = settings?.topBarLink || globalBrand?.topBarLink || '/signup';
  const linkText = settings?.topBarLinkText || globalBrand?.topBarLinkText || 'Get Started';

  if (!enabled || dismissed || !text) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tripbone_topbar_dismissed', 'true');
    }
    if (onDismiss) onDismiss();
  };

  const isExternal = link.startsWith('http://') || link.startsWith('https://');

  return (
    <div className={`w-full bg-[#063d0f] text-emerald-100 border-b border-[#00aa13]/25 text-xs sm:text-sm py-2 px-4 relative z-50 transition-all ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 mx-auto sm:mx-0 overflow-hidden text-ellipsis whitespace-nowrap">
          {badge && (
            <span className="inline-flex items-center gap-1 bg-[#00aa13] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex-shrink-0 shadow-sm">
              <Zap className="w-3 h-3 text-white fill-white" />
              {badge}
            </span>
          )}
          <span className="font-medium text-white truncate text-xs sm:text-sm">
            {text}
          </span>
          {link && linkText && (
            <div className="hidden md:inline-flex items-center flex-shrink-0 ml-1">
              {isExternal ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-300 hover:text-white underline underline-offset-4 decoration-[#00aa13] transition-all"
                >
                  <span>{linkText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              ) : (
                <Link
                  to={link}
                  className="inline-flex items-center gap-1 font-bold text-emerald-300 hover:text-white underline underline-offset-4 decoration-[#00aa13] transition-all"
                >
                  <span>{linkText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {link && linkText && (
            <div className="inline-flex md:hidden items-center">
              {isExternal ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-xs text-cyan-400 hover:text-cyan-300"
                >
                  <span>{linkText}</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              ) : (
                <Link
                  to={link}
                  className="inline-flex items-center gap-1 font-bold text-xs text-cyan-400 hover:text-cyan-300"
                >
                  <span>{linkText}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Dismiss Announcement"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
