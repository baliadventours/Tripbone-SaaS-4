import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, Home, Building2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useTenant } from '../../lib/TenantContext';

export default function ForbiddenSuperAdmin() {
  const { tenant } = useTenant();
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'tenantsite.com';
  const fullUrl = typeof window !== 'undefined' ? window.location.href : 'https://' + currentHost + '/superadmin';

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-amber-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Alert Card */}
      <div className="w-full max-w-xl bg-[#0b101d]/90 border border-rose-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 text-slate-100">
        
        {/* Top Warning Badge */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-semibold tracking-wide">
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse text-rose-400" />
            <span>HTTP 403 • FORBIDDEN ACCESS</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
            SECURITY GUARD
          </span>
        </div>

        {/* Icon Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <Lock className="w-8 h-8 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Access Denied
            </h1>
            <p className="text-xs sm:text-sm text-rose-300 font-medium mt-1">
              Superadmin Portal is Restricted
            </p>
          </div>
        </div>

        {/* Warning Body Notice */}
        <div className="bg-rose-950/30 border border-rose-500/20 rounded-2xl p-4 sm:p-5 mb-6 space-y-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
              <p className="font-bold text-slate-100 text-sm">
                Forbidden Superadministrator Request
              </p>
              <p>
                Platform Superadmin access (<code className="bg-slate-900 px-1.5 py-0.5 rounded text-rose-300 font-mono text-[11px]">/superadmin</code>) is strictly disabled on tenant websites (<span className="text-amber-300 font-semibold">{currentHost}</span>).
              </p>
              <p className="text-slate-400">
                Master SaaS controls are exclusively restricted to the primary Tripbone infrastructure domain (<code className="text-cyan-400 font-mono">tripbone.com</code>).
              </p>
            </div>
          </div>
        </div>

        {/* Diagnostic Metadata */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-8 space-y-2 font-mono text-[11px]">
          <div className="flex items-center justify-between text-slate-400">
            <span>Target Hostname:</span>
            <span className="text-slate-200 font-semibold">{currentHost}</span>
          </div>
          {tenant && (
            <div className="flex items-center justify-between text-slate-400">
              <span>Active Tenant:</span>
              <span className="text-cyan-400 font-semibold">{tenant.companyName || tenant.slug || tenant.id}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-slate-400">
            <span>Security Status:</span>
            <span className="text-emerald-400 font-semibold">Access Blocked & Monitored</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/"
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center space-x-2 border border-slate-700 transition shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </a>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('tripbone_preview_tenant');
              sessionStorage.removeItem('tripbone_impersonated_tenant_id');
              sessionStorage.removeItem('tripbone_is_impersonating');
              window.location.href = '/superadmin';
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-orange-600/20 transition cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open SaaS Superadmin</span>
          </button>
        </div>

      </div>
    </div>
  );
}
