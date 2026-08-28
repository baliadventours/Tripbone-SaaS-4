import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Layers, 
  Activity, 
  ShieldCheck, 
  Radio, 
  Globe, 
  ArrowUpRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SimpleAnalyticsDashboard from './SimpleAnalyticsDashboard';
import ConversionFunnelTracker from './ConversionFunnelTracker';
import GoogleAnalytics from '../../pages/Dashboard/GoogleAnalytics';
import { Booking } from '../../types';

interface AnalyticsManagerProps {
  initialTab?: 'traffic' | 'funnel' | 'ga4';
  bookings?: Booking[];
}

export default function AnalyticsManager({
  initialTab = 'traffic',
  bookings = []
}: AnalyticsManagerProps) {
  const [activeTab, setActiveTab] = useState<'traffic' | 'funnel' | 'ga4'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const tabs = [
    {
      id: 'traffic' as const,
      label: 'Traffic & Visitor Insights',
      shortLabel: 'Site Traffic',
      icon: Globe,
      badge: 'Live',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Real-time pageviews, visitor sessions, devices & acquisition channels'
    },
    {
      id: 'funnel' as const,
      label: 'Checkout Conversion Funnel',
      shortLabel: 'Drop-off Funnel',
      icon: Target,
      badge: 'Growth',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: '6-stage booking drop-off tracker, bottlenecks & optimization advice'
    },
    {
      id: 'ga4' as const,
      label: 'Google Analytics & GTM Tracking',
      shortLabel: 'GA4 / GTM / Ads',
      icon: Activity,
      badge: 'Enterprise',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'GA4 Measurement ID, GTM Container, Google Ads conversion & live event stream'
    }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header & Sub-Navigation Tabs */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Analytics & Growth Hub
              </h1>
            </div>
            <p className="text-xs text-gray-500 font-medium ml-11.5">
              Comprehensive telemetry, real-time guest tracking, checkout conversion funnels, and GA4/GTM integrations.
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 self-start lg:self-auto bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-200/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-gray-700">Analytics Engine Active</span>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-primary/5 border-primary text-gray-900 shadow-xs ring-1 ring-primary/20'
                    : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50/50'
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-black truncate">{tab.shortLabel}</span>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${tab.badgeColor}`}>
                      {tab.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-1 font-medium">
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab View */}
      <div>
        {activeTab === 'traffic' && (
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
            <SimpleAnalyticsDashboard />
          </div>
        )}

        {activeTab === 'funnel' && (
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
            <ConversionFunnelTracker bookings={bookings} />
          </div>
        )}

        {activeTab === 'ga4' && (
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
            <GoogleAnalytics />
          </div>
        )}
      </div>
    </div>
  );
}
