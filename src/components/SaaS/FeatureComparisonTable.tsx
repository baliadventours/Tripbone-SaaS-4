import React from 'react';
import { Check, Minus, Info } from 'lucide-react';

interface FeatureComparisonTableProps {
  plans: any[];
}

const FEATURE_CATEGORIES = [
  {
    name: 'Core Features',
    features: [
      { name: 'Staging Domain', tooltip: 'Test your site on a secure staging domain', tiers: { starter: true, professional: true, business: true, agency: true, enterprise: true } },
      { name: 'Custom Domain Mapping', tooltip: 'Connect your own domain name', tiers: { starter: false, professional: true, business: true, agency: true, enterprise: true } },
      { name: 'White-label Custom Theme', tooltip: 'Remove Tripbone branding and use custom themes', tiers: { starter: false, professional: false, business: true, agency: true, enterprise: true } },
      { name: 'Admin Users', tiers: { starter: '1 User', professional: '3 Users', business: '10 Users', agency: 'Unlimited', enterprise: 'Unlimited' } },
      { name: 'Tours & Activities limit', type: 'dynamic', field: 'maxTours' },
      { name: 'Monthly Bookings limit', type: 'dynamic', field: 'maxBookings' },
    ]
  },
  {
    name: 'Booking & Operations',
    features: [
      { name: 'Dynamic Bookings Manager', tooltip: 'Manage all your bookings in one place', tiers: { starter: true, professional: true, business: true, agency: true, enterprise: true } },
      { name: 'WhatsApp Notifications', tooltip: 'Send automated booking updates via WhatsApp', tiers: { starter: false, professional: true, business: true, agency: true, enterprise: true } },
      { name: 'Multi-Region Dispatch Logs', tooltip: 'Track drivers and dispatch across multiple regions', tiers: { starter: false, professional: false, business: true, agency: true, enterprise: true } },
      { name: 'Dedicated Supplier Portals', tooltip: 'Give your suppliers their own login portal', tiers: { starter: false, professional: false, business: true, agency: true, enterprise: true } },
      { name: 'Custom Pricing Rules', tooltip: 'Set up complex pricing rules based on dates, pax, etc.', tiers: { starter: false, professional: true, business: true, agency: true, enterprise: true } },
    ]
  },
  {
    name: 'AI Superpowers',
    features: [
      { name: 'AI Auto-Packaging Module', tooltip: 'Automatically generate travel packages', tiers: { starter: true, professional: true, business: true, agency: true, enterprise: true } },
      { name: 'Premium AI Planning Assistant', tooltip: 'Advanced AI assistant for complex itineraries', tiers: { starter: false, professional: true, business: true, agency: true, enterprise: true } },
      { name: '24/7 AI Chatbot', tooltip: 'AI chatbot for customer support', tiers: { starter: false, professional: true, business: true, agency: true, enterprise: true } },
      { name: 'Auto-Translation', tooltip: 'Automatically translate your content into multiple languages', tiers: { starter: false, professional: false, business: true, agency: true, enterprise: true } },
      { name: 'Predictive Availability', tooltip: 'AI predicts when a tour might be fully booked', tiers: { starter: false, professional: false, business: false, agency: true, enterprise: true } },
    ]
  },
  {
    name: 'Support & Infrastructure',
    features: [
      { name: 'Standard Support', tiers: { starter: true, professional: true, business: true, agency: true, enterprise: true } },
      { name: 'Priority Support', tiers: { starter: false, professional: true, business: true, agency: true, enterprise: true } },
      { name: 'Dedicated Account Manager', tiers: { starter: false, professional: false, business: false, agency: true, enterprise: true } },
      { name: 'SLA Guarantee', tooltip: '99.9% Uptime Guarantee', tiers: { starter: false, professional: false, business: true, agency: true, enterprise: true } },
    ]
  }
];

export default function FeatureComparisonTable({ plans }: FeatureComparisonTableProps) {
  // Use monthly plans for the comparison table columns
  const sortedPlans = plans
    .filter(p => p.isActive && p.interval === 'monthly')
    .sort((a, b) => (a.price || 0) - (b.price || 0));

  return (
    <div className="mt-24 lg:mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl font-display tracking-tight">Compare all features</h2>
        <p className="mt-4 max-w-2xl text-xl text-gray-400 mx-auto">
          Find the perfect plan for your travel business.
        </p>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-800 sm:rounded-2xl bg-[#080B14]">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-[#050810]">
                  <tr>
                    <th scope="col" className="px-6 py-6 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/4">
                      Features
                    </th>
                    {sortedPlans.map((plan) => (
                      <th key={plan.id} scope="col" className="px-6 py-6 text-center text-xs font-bold uppercase tracking-wider w-[15%]">
                        <div className="text-white text-lg mb-1">{plan.name}</div>
                        <div className="text-indigo-400">${plan.price !== undefined ? plan.price : plan.monthlyPrice}<span className="text-gray-500 text-[10px] font-normal">/{plan.interval === 'annual' ? 'yr' : plan.interval === 'lifetime' ? 'life' : 'mo'}</span></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {FEATURE_CATEGORIES.map((category) => (
                    <React.Fragment key={category.name}>
                      {/* Category Header */}
                      <tr className="bg-[#0A0E1A]">
                        <td colSpan={sortedPlans.length + 1} className="px-6 py-4 text-sm font-bold text-white uppercase tracking-widest border-t border-gray-800">
                          {category.name}
                        </td>
                      </tr>
                      {/* Feature Rows */}
                      {category.features.map((feature, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                            <div className="flex items-center">
                              <span>{feature.name}</span>
                              {feature.tooltip && (
                                <div className="ml-2 group relative flex items-center">
                                  <Info className="w-4 h-4 text-gray-600 hover:text-gray-400 cursor-help" />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-xs text-white rounded-lg shadow-xl z-10 text-center pointer-events-none">
                                    {feature.tooltip}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          {sortedPlans.map((plan) => {
                            let value: any;
                            
                            // Dynamic field mapping (like maxTours, maxBookings from DB)
                            if (feature.type === 'dynamic') {
                              value = plan[feature.field as string];
                              if (value === 999 || value === 9999 || value >= 999999) {
                                value = 'Unlimited';
                              } else {
                                value = `Up to ${value}`;
                              }
                            } else {
                              // Static matrix lookup by plan slug (or default to false)
                              const slug = plan.slug || plan.name.toLowerCase().split(' ')[0];
                              value = feature.tiers?.[slug as keyof typeof feature.tiers] ?? false;
                            }

                            return (
                              <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                {typeof value === 'boolean' ? (
                                  value ? (
                                    <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                                  ) : (
                                    <Minus className="w-5 h-5 text-gray-700 mx-auto" />
                                  )
                                ) : (
                                  <span className="text-gray-300 font-medium">{value}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
