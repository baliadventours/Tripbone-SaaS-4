import React from 'react';
import PricingTab from '../components/SaaS/PricingTab';
import { Check, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

interface FeatureRow {
  name: string;
  starter: string | boolean;
  professional: string | boolean;
  business: string | boolean;
}

interface FeatureCategory {
  title: string;
  features: FeatureRow[];
}

const comparisonData: FeatureCategory[] = [
  {
    title: "General Features",
    features: [
      { name: "No of tour", starter: "10", professional: "50", business: "200" },
      { name: "Booking per month", starter: "100", professional: "500", business: "5000" },
      { name: "Storage", starter: "5GB", professional: "20 GB", business: "50GB" },
      { name: "Booking fee", starter: "0", professional: "0", business: "0" },
      { name: "Service fee", starter: "0", professional: "0", business: "0" },
      { name: "Custom domain (www.yourtoursite.com)", starter: true, professional: true, business: true },
      { name: "Whitelabel", starter: true, professional: true, business: true },
      { name: "Hosting included", starter: true, professional: true, business: true }
    ]
  },
  {
    title: "Design",
    features: [
      { name: "Website builder", starter: true, professional: true, business: true },
      { name: "Mobile first design", starter: true, professional: true, business: true },
      { name: "Design customization", starter: true, professional: true, business: true },
      { name: "Responsive design", starter: true, professional: true, business: true },
      { name: "Custom logo & favicon", starter: true, professional: true, business: true },
      { name: "Custom fonts", starter: true, professional: true, business: true },
      { name: "Multi currency", starter: true, professional: true, business: true }
    ]
  },
  {
    title: "Tour & Itinerary Builder",
    features: [
      { name: "AI tour builder", starter: true, professional: true, business: true },
      { name: "Multi package", starter: true, professional: true, business: true },
      { name: "Multi tier price", starter: true, professional: true, business: true },
      { name: "Tour add ons", starter: true, professional: true, business: true },
      { name: "Tour categories", starter: true, professional: true, business: true },
      { name: "Tour location", starter: true, professional: true, business: true },
      { name: "Urgency features", starter: true, professional: true, business: true },
      { name: "Min-max participant", starter: true, professional: true, business: true },
      { name: "Coupon code", starter: true, professional: true, business: true }
    ]
  },
  {
    title: "Payment Integration",
    features: [
      { name: "Paypal", starter: true, professional: true, business: true },
      { name: "Stripe", starter: true, professional: true, business: true },
      { name: "Bank transfer", starter: true, professional: true, business: true },
      { name: "Pay on arrival", starter: true, professional: true, business: true }
    ]
  },
  {
    title: "Booking",
    features: [
      { name: "Booking automation", starter: true, professional: true, business: true },
      { name: "Import booking", starter: true, professional: true, business: true },
      { name: "Booking calendar", starter: true, professional: true, business: true },
      { name: "Booking report", starter: true, professional: true, business: true }
    ]
  },
  {
    title: "Operation",
    features: [
      { name: "Financial report", starter: true, professional: true, business: true },
      { name: "Analytics", starter: true, professional: true, business: true },
      { name: "Guide management", starter: true, professional: true, business: true },
      { name: "Guide assignment", starter: true, professional: true, business: true },
      { name: "Integrated inquiry", starter: true, professional: true, business: true },
      { name: "Proposal generator", starter: true, professional: true, business: true },
      { name: "Multi supplier", starter: true, professional: true, business: true },
      { name: "Multi agen", starter: true, professional: true, business: true }
    ]
  },
  {
    title: "Automation",
    features: [
      { name: "Whatsapp automation", starter: true, professional: true, business: true },
      { name: "Email notification", starter: true, professional: true, business: true },
      { name: "Guide assignment", starter: true, professional: true, business: true },
      { name: "Trip reminder", starter: true, professional: true, business: true },
      { name: "AI itinerary generator", starter: true, professional: true, business: true }
    ]
  },
  {
    title: "Customer Relations",
    features: [
      { name: "Integrated ticket support", starter: true, professional: true, business: true }
    ]
  },
  {
    title: "Content & SEO",
    features: [
      { name: "SEO optimization", starter: true, professional: true, business: true },
      { name: "AI blog generator", starter: true, professional: true, business: true },
      { name: "AI FAQ generator", starter: true, professional: true, business: true }
    ]
  },
  {
    title: "Reporting",
    features: [
      { name: "Detail booking report", starter: true, professional: true, business: true },
      { name: "Analytics", starter: true, professional: true, business: true }
    ]
  }
];

export default function SaaSPricing() {
  const renderValue = (val: string | boolean) => {
    if (typeof val === 'boolean') {
      return val ? (
        <div className="flex justify-center items-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
          <Check className="w-4 h-4" />
        </div>
      ) : (
        <div className="flex justify-center items-center w-6 h-6 mx-auto text-gray-300">
          <Minus className="w-4 h-4" />
        </div>
      );
    }
    return <span className="text-gray-700 font-medium text-sm">{val}</span>;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="pt-32 pb-16">
        <div className="text-center mb-8 px-4">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-slate-900 tracking-tight">Plans & Pricing</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Choose the perfect plan for your tour business. Start for free, upgrade as you grow, and never worry about hidden fees.
          </p>
        </div>
        
        {/* Main Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 mb-24">
          <PricingTab />
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Compare Features</h2>
            <p className="text-slate-500">Everything you need to run your tour business, built right in.</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr>
                    <th className="py-6 px-6 bg-slate-50 border-b border-slate-200 w-1/3">
                      <span className="sr-only">Features</span>
                    </th>
                    <th className="py-6 px-6 bg-slate-50 border-b border-slate-200 text-center w-1/5">
                      <div className="text-lg font-bold text-slate-900 mb-1">Starter</div>
                    </th>
                    <th className="py-6 px-6 bg-emerald-50/50 border-b border-emerald-100 text-center w-1/5 relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                      <div className="text-lg font-bold text-emerald-700 mb-1">Professional</div>
                    </th>
                    <th className="py-6 px-6 bg-slate-50 border-b border-slate-200 text-center w-1/5">
                      <div className="text-lg font-bold text-slate-900 mb-1">Business</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonData.map((category, catIdx) => (
                    <React.Fragment key={catIdx}>
                      {/* Category Header */}
                      <tr>
                        <td colSpan={4} className="py-4 px-6 bg-slate-50/50 text-sm font-bold text-slate-900 uppercase tracking-wider">
                          {category.title}
                        </td>
                      </tr>
                      {/* Features */}
                      {category.features.map((feature, featIdx) => (
                        <tr key={featIdx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 text-sm text-slate-600 border-r border-slate-100">
                            {feature.name}
                          </td>
                          <td className="py-4 px-6 text-center border-r border-slate-100">
                            {renderValue(feature.starter)}
                          </td>
                          <td className="py-4 px-6 text-center bg-emerald-50/10 border-r border-emerald-50">
                            {renderValue(feature.professional)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {renderValue(feature.business)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Description text below the table */}
          <div className="mt-8 text-center max-w-2xl mx-auto">
            <p className="text-slate-600 mb-2">
              Need help deciding which plan fits you best? Take a look at all the features each plan offers to make the perfect choice.
            </p>
            <p className="text-sm text-slate-400">
              All plans auto-renew. You’re free to upgrade, downgrade, or cancel your subscription anytime.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500">Everything you need to know about our pricing and plans.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-slate-600">We accept all major credit cards (Visa, Mastercard, American Express) securely processed via Stripe. Annual subscriptions can also be paid via wire transfer upon request.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Can I switch plans later?</h3>
                <p className="text-slate-600">Absolutely! You can upgrade or downgrade your plan at any time from your dashboard. If you upgrade, the new pricing will be prorated for the remainder of your billing cycle.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Are there any setup fees?</h3>
                <p className="text-slate-600">No, there are zero setup fees or hidden costs. The price you see on the pricing table is the final price you pay.</p>
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">What happens if I exceed my booking limit?</h3>
                <p className="text-slate-600">We won't suddenly cut off your service. If you consistently exceed your plan's monthly booking limits, our team will reach out to help you seamlessly upgrade to a plan that better fits your volume.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Do I need to host my own website?</h3>
                <p className="text-slate-600">No! Fully managed, secure, and fast hosting is included out-of-the-box on all of our plans. You just need to bring your custom domain name.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Do you offer customer support?</h3>
                <p className="text-slate-600">Yes, we provide integrated ticket support for all plans. Higher tier plans may receive priority handling to ensure minimal disruption to your operations.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
