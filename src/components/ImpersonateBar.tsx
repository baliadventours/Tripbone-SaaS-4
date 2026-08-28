import React from 'react';
import { useTenant } from '../lib/TenantContext';
import { ShieldAlert } from 'lucide-react';

export default function ImpersonateBar() {
  const { isImpersonating } = useTenant();

  if (!isImpersonating) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[10000] no-print pointer-events-none">
      <div className="flex items-center gap-2 bg-slate-900 border border-amber-500/50 shadow-2xl px-3 py-2 rounded-full text-white pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wide pr-1">
          Super Admin Impersonate Mode
        </span>
      </div>
    </div>
  );
}
