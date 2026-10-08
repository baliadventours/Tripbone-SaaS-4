import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, CheckCircle2, Circle, ArrowRight, ExternalLink, 
  Mail, MessageSquare, Globe, Sparkles, Palette, CreditCard, 
  Building, Search, ChevronDown, ChevronUp, X, ShieldAlert, 
  BookOpen, Check, AlertTriangle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSettings } from '../../lib/SettingsContext';
import { useTenant } from '../../lib/TenantContext';

interface FundamentalOnboardingBannerProps {
  setActiveMenu: (menu: string) => void;
  setSettingsActiveTab?: (tab: string) => void;
  setWebsiteBuilderTab?: (tab: any) => void;
  className?: string;
}

interface OnboardingTask {
  id: string;
  number: number;
  title: string;
  category: string;
  description: string;
  icon: any;
  targetMenu: string;
  targetTab?: string;
  docAnchor: string;
  checkCompleted: (settings: any, tenant: any) => boolean;
}

export const FundamentalOnboardingBanner: React.FC<FundamentalOnboardingBannerProps> = ({
  setActiveMenu,
  setSettingsActiveTab,
  setWebsiteBuilderTab,
  className
}) => {
  const navigate = useNavigate();
  const { settings, builderSettings } = useSettings();
  const { tenant } = useTenant();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tripbone_onboarding_collapsed') === 'true';
    }
    return false;
  });

  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tripbone_onboarding_dismissed') === 'true';
    }
    return false;
  });

  // Master List of the 8 Core Fundamentals
  const tasks: OnboardingTask[] = [
    {
      id: 'email',
      number: 1,
      title: 'Setup Email for Notification',
      category: 'Notifications',
      description: 'Configure Resend, Mailjet, or SMTP for instant guest vouchers, PDF tickets & invoices.',
      icon: Mail,
      targetMenu: 'communication',
      targetTab: 'email',
      docAnchor: 'email',
      checkCompleted: (s, t) => Boolean(s?.emailProvider || s?.senderEmail || s?.resendApiKey || s?.mailjetApiKey)
    },
    {
      id: 'whatsapp',
      number: 2,
      title: 'Setup WhatsApp Messaging',
      category: 'Automation',
      description: 'Send automated booking vouchers, pickup times & driver dispatch notifications.',
      icon: MessageSquare,
      targetMenu: 'communication',
      targetTab: 'whatsapp',
      docAnchor: 'whatsapp',
      checkCompleted: (s, t) => Boolean(s?.whapiToken || s?.openwaApiKey || s?.whatsappNumber || t?.whatsappNumber)
    },
    {
      id: 'domain',
      number: 3,
      title: 'Setup Custom Domain',
      category: 'Branding',
      description: 'Connect your own domain (e.g. yourbrand.com) with automated Cloudflare/Vercel SSL.',
      icon: Globe,
      targetMenu: 'custom-domain',
      targetTab: 'domain',
      docAnchor: 'custom-domain',
      checkCompleted: (s, t) => Boolean(t?.customDomain || s?.customDomain)
    },
    {
      id: 'gemini',
      number: 4,
      title: 'Google Gemini AI Engine',
      category: 'AI Engine',
      description: 'Platform AI is active. Optionally connect your personal Google AI Studio key in Communication Settings.',
      icon: Sparkles,
      targetMenu: 'communication',
      targetTab: 'gemini',
      docAnchor: 'gemini',
      checkCompleted: () => true
    },
    {
      id: 'dress-site',
      number: 5,
      title: 'Dress Your Site (Brand & Mobile)',
      category: 'Website Builder',
      description: 'Upload logo & favicon, choose signature brand colors, and pick mobile JoyTime preset.',
      icon: Palette,
      targetMenu: 'website-builder',
      targetTab: 'siteSettings',
      docAnchor: 'dress-site',
      checkCompleted: (s, t) => Boolean(s?.logoUrl || s?.primaryColor || t?.primaryColor || (builderSettings as any)?.logoUrl)
    },
    {
      id: 'payment',
      number: 6,
      title: 'Setup Payment Gateways (BYOPG)',
      category: 'Finance',
      description: 'Connect Stripe, Midtrans, Xendit, PayPal, or Bank Transfer with 0% platform fee.',
      icon: CreditCard,
      targetMenu: 'payment-settings',
      targetTab: 'gateways',
      docAnchor: 'payment',
      checkCompleted: (s, t) => {
        const p = s?.paymentGateways || s?.providerConfigs || {};
        return Boolean(
          s?.stripeEnabled || s?.midtransEnabled || s?.xenditEnabled || 
          s?.paypalEnabled || s?.bankTransferEnabled || Object.keys(p).length > 0
        );
      }
    },
    {
      id: 'company',
      number: 7,
      title: 'Setup Company Information',
      category: 'Business Profile',
      description: 'Legal registered business name, support phone, physical office address & social links.',
      icon: Building,
      targetMenu: 'general-settings',
      targetTab: 'company-info',
      docAnchor: 'company',
      checkCompleted: (s, t) => Boolean(s?.companyName || s?.companyEmail || t?.businessName)
    },
    {
      id: 'seo',
      number: 8,
      title: 'Setup SEO & Analytics',
      category: 'Growth & Traffic',
      description: 'Global meta title, 155-character summary, OpenGraph social card & Google Analytics 4.',
      icon: Search,
      targetMenu: 'general-settings',
      targetTab: 'seo',
      docAnchor: 'seo',
      checkCompleted: (s, t) => Boolean(s?.seoTitle || s?.seoDescription || s?.googleAnalyticsId)
    }
  ];

  // Calculate live completion progress
  const completedCount = tasks.filter(t => t.checkCompleted(settings, tenant)).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);
  const isAllCompleted = completedCount === tasks.length;

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('tripbone_onboarding_collapsed', String(next));
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('tripbone_onboarding_dismissed', 'true');
  };

  const handleTaskClick = (task: OnboardingTask) => {
    setActiveMenu(task.targetMenu);
    if (task.targetTab && setSettingsActiveTab) {
      setSettingsActiveTab(task.targetTab);
    }
    if (task.targetMenu === 'website-builder' && setWebsiteBuilderTab) {
      setWebsiteBuilderTab('siteSettings');
    }
  };

  const handleOpenDocs = () => {
    navigate('/docs/fundamental-setup');
  };

  if (isDismissed) {
    return (
      <div className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-orange-200/90 rounded-2xl px-5 py-3.5 shadow-xs hover:border-orange-300 transition-all gap-3",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
            isAllCompleted ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
          )}>
            {isAllCompleted ? <Check className="h-5 w-5 stroke-[2.5]" /> : <Rocket className="h-4 w-4" />}
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-900 flex flex-wrap items-center gap-2">
              <span>Fundamental Onboarding Setup</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                isAllCompleted ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"
              )}>
                {completedCount}/{tasks.length} Completed ({progressPercent}%)
              </span>
              {isAllCompleted && (
                <span className="text-[10px] text-emerald-700 font-bold hidden md:inline">
                  🎉 Ready for live sales!
                </span>
              )}
            </h4>
            <p className="text-[11px] text-gray-500 font-medium">
              Milestone checklist hidden. Click &apos;Show Fundamental Onboarding&apos; anytime to review setup milestones.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsDismissed(false);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('tripbone_onboarding_dismissed');
            }
          }}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-xs cursor-pointer"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Show Fundamental Onboarding</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm",
      isAllCompleted 
        ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white border-emerald-200" 
        : "bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-white border-orange-200/80",
      className
    )}>
      {/* Top Banner Header Bar */}
      <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3.5">
          <div className={cn(
            "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-md",
            isAllCompleted 
              ? "bg-emerald-600 text-white shadow-emerald-500/20" 
              : "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-orange-500/20"
          )}>
            {isAllCompleted ? <Check className="h-6 w-6 stroke-[3]" /> : <Rocket className="h-6 w-6 animate-pulse" />}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base md:text-lg font-black text-gray-900 tracking-tight">
                {isAllCompleted 
                  ? "🎉 Fundamental Onboarding Completed — Website Fully Active!" 
                  : "🚀 Make Your Website Working — Fundamental Onboarding"}
              </h3>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                isAllCompleted 
                  ? "bg-emerald-100 text-emerald-800" 
                  : "bg-orange-100 text-orange-800"
              )}>
                {completedCount} / {tasks.length} Completed ({progressPercent}%)
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium max-w-2xl">
              Complete these 8 essential configurations to launch your live booking engine, process guest payments, and send automated dispatches.
            </p>
          </div>
        </div>

        {/* Action Controls: Prominent Close and Show / Docs Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <button
            onClick={handleOpenDocs}
            className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all hover:border-primary hover:text-primary"
            title="Read Complete Documentation on docs.tripbone.com/fundamental-setup"
          >
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="hidden lg:inline">Docs Guide</span>
            <ExternalLink className="h-3 w-3 text-gray-400" />
          </button>

          <button
            onClick={toggleCollapse}
            className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 transition-colors shadow-xs"
            title={isCollapsed ? "Expand Checklist" : "Minimize Checklist"}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>

          {/* User Close Block Button: Setup Done or Close */}
          <button
            onClick={handleDismiss}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs cursor-pointer border",
              isAllCompleted
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                : "bg-white hover:bg-gray-100 text-gray-700 border-gray-300 hover:border-gray-400"
            )}
            title={isAllCompleted ? "Setup Completed! Close this banner" : "Close and hide this onboarding checklist"}
          >
            {isAllCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 text-gray-500" />}
            <span>{isAllCompleted ? "Setup Done — Close" : "Close Onboarding"}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-gray-100 h-1.5 overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-700 ease-out",
            isAllCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-orange-500 to-amber-500"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Expandable Task Checklist Grid */}
      {!isCollapsed && (
        <div className="p-4 md:p-6 bg-white/60 backdrop-blur-xs border-t border-orange-100/60">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {tasks.map((task) => {
              const isDone = task.checkCompleted(settings, tenant);
              const TaskIcon = task.icon;

              return (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={cn(
                    "group relative p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3",
                    isDone 
                      ? "bg-white/80 border-gray-200/80 hover:border-emerald-400 hover:shadow-sm" 
                      : "bg-white border-orange-200/80 shadow-xs hover:border-primary hover:shadow-md"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Step {task.number} • {task.category}
                      </span>
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <CheckCircle2 className="h-3 w-3" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 animate-pulse">
                          <Circle className="h-2 w-2 fill-orange-500" /> Action Required
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0 transition-colors",
                        isDone ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-primary group-hover:bg-primary group-hover:text-white"
                      )}>
                        <TaskIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-gray-900 group-hover:text-primary transition-colors leading-snug">
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold">
                    <span className={cn(
                      "transition-colors",
                      isDone ? "text-gray-400" : "text-primary group-hover:underline"
                    )}>
                      {isDone ? "Review Setting" : "Configure Now"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Footer Link Bar */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-gray-500 font-medium text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              Need step-by-step guidance? Everything is documented in detail with screenshots & DNS examples.
            </div>

            <button
              onClick={handleOpenDocs}
              className="inline-flex items-center gap-1.5 text-primary hover:text-orange-600 font-black text-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <span>Open Fundamental Setup Guide</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
