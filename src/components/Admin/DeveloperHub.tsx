import React, { useState } from "react";
import { Copy, Check, Terminal, ExternalLink, ShieldCheck, Key, RefreshCw, Layers } from "lucide-react";
import { cn } from "../../lib/utils";

interface DeveloperHubProps {
  tenantId: string;
}

export const DeveloperHub: React.FC<DeveloperHubProps> = ({ tenantId }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("tb_live_" + (tenantId ? tenantId.slice(0, 16) : "demo_api_key_849204"));
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegenerate = () => {
    if (!window.confirm("Are you sure you want to regenerate your API Key? Any existing widget or API integrations will need to be updated.")) return;
    setIsRegenerating(true);
    setTimeout(() => {
      const newKey = "tb_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setApiKey(newKey);
      setIsRegenerating(false);
    }, 600);
  };

  const widgetSnippet = `<script src="https://tripbone.com/widget.js" data-tenant="${tenantId || "demo"}" async></script>
<div id="tripbone-booking-widget" data-theme="light"></div>`;

  return (
    <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Developer & API Hub</h2>
        <p className="text-gray-500 font-medium tracking-tight">Connect your Tripbone booking engine to external WordPress websites, Webflow, custom apps, or Zapier automations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Embed Widget Section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-50 text-primary rounded-xl">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg tracking-tight">Embeddable Booking Widget</h3>
                  <p className="text-xs text-gray-400 font-bold">Embed your full tour booking catalog into any external website.</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(widgetSnippet, "widget")}
                className="flex items-center gap-1.5 text-xs font-black text-primary bg-orange-50 px-3 py-2 rounded-xl hover:bg-primary hover:text-white transition-all cursor-pointer"
              >
                {copiedKey === "widget" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedKey === "widget" ? "Copied!" : "Copy Code"}
              </button>
            </div>

            <div className="bg-gray-900 rounded-2xl p-5 font-mono text-xs text-teal-300 relative overflow-x-auto">
              <pre className="whitespace-pre-wrap leading-relaxed">{widgetSnippet}</pre>
            </div>
          </div>

          {/* REST API & Secret Key */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Key className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg tracking-tight">REST API Keys</h3>
                  <p className="text-xs text-gray-400 font-bold">Use this secret key to authenticate your server-side API requests.</p>
                </div>
              </div>
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-1.5 text-xs font-black text-gray-500 bg-gray-50 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isRegenerating && "animate-spin")} />
                Regenerate
              </button>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <input
                type="password"
                readOnly
                value={apiKey}
                className="flex-1 bg-transparent font-mono text-xs text-gray-800 font-bold focus:outline-none"
              />
              <button
                onClick={() => handleCopy(apiKey, "apikey")}
                className="flex items-center gap-1.5 text-xs font-black text-primary hover:text-orange-700 transition-all cursor-pointer shrink-0"
              >
                {copiedKey === "apikey" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedKey === "apikey" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* API Docs Quick Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-wider">
              <Terminal className="h-4 w-4" /> API Endpoints
            </div>
            <div className="space-y-3 text-xs text-gray-600">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <span className="font-black text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded font-mono">GET</span>
                <p className="font-mono font-bold text-[11px] text-gray-800">/api/v1/tours</p>
                <p className="text-gray-400 text-[10px]">Fetch all active tour listings</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <span className="font-black text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono">POST</span>
                <p className="font-mono font-bold text-[11px] text-gray-800">/api/v1/bookings</p>
                <p className="text-gray-400 text-[10px]">Create an instant tour booking</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperHub;
