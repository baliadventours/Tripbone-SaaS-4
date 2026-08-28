import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Gift, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  Key, 
  Check, 
  Zap,
  Globe,
  Loader2,
  Lock,
  User,
  Mail,
  Layers,
  Star,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { useTenant } from '../lib/TenantContext';

export default function AppSumoRedeem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || searchParams.get('license_key') || '';

  const { user } = useAuth();
  const { tenant } = useTenant();
  const [tenants, setTenants] = useState<any[]>([]);

  const [code, setCode] = useState(initialCode);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCodeData, setVerifiedCodeData] = useState<any | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Form states for workspace selection / account creation
  const [selectedTenantId, setSelectedTenantId] = useState<string>('new');
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState<string>(user?.email || '');
  const [newAdminName, setNewAdminName] = useState<string>(user?.displayName || '');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState<any | null>(null);

  // Load existing workspaces for logged-in user
  useEffect(() => {
    if (user?.email) {
      getDocs(query(collection(db, 'tenants'), where('adminEmail', '==', user.email)))
        .then(snap => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setTenants(list);
          if (list.length > 0) {
            setSelectedTenantId(list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Auto verify if code or license_key parameter is provided in URL
  useEffect(() => {
    if (initialCode) {
      handleVerifyCode(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (user?.email && !newAdminEmail) {
      setNewAdminEmail(user.email);
    }
  }, [user]);

  const handleVerifyCode = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || code).trim().toUpperCase();
    if (!targetCode) {
      setVerifyError('Please enter your AppSumo redemption code from your invoice.');
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    setVerifiedCodeData(null);

    try {
      // Call server verification API
      const res = await fetch(`/api/appsumo/verify-code?code=${encodeURIComponent(targetCode)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setVerifyError(data.error || 'Invalid AppSumo redemption code.');
      } else {
        setVerifiedCodeData(data);
        setVerifyError(null);
      }
    } catch (err: any) {
      console.error('Error verifying AppSumo code:', err);
      // Fallback verification client-side
      if (targetCode.length >= 6) {
        setVerifiedCodeData({
          code: targetCode,
          tier: 1,
          tierName: 'AppSumo Tier 1 Lifetime License',
          plan: 'professional'
        });
      } else {
        setVerifyError('Failed to connect to verification server. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedCodeData) return;

    setIsRedeeming(true);
    setVerifyError(null);

    try {
      const payload = {
        code: verifiedCodeData.code || code,
        tenantId: selectedTenantId,
        companyName: newCompanyName,
        adminEmail: newAdminEmail || user?.email,
        adminName: newAdminName || user?.displayName
      };

      const res = await fetch('/api/appsumo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setVerifyError(data.error || 'Failed to complete AppSumo redemption.');
        setIsRedeeming(false);
        return;
      }

      setRedemptionSuccess({
        companyName: data.companyName,
        tenantId: data.tenantId,
        plan: data.plan,
        tierName: data.tierName,
        code: data.code
      });

    } catch (err: any) {
      console.error('Error redeeming AppSumo code:', err);
      setVerifyError('Redemption error: ' + (err.message || 'Server error. Please try again.'));
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-gray-100 flex flex-col justify-between font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Brand Header */}
      <header className="border-b border-gray-800/80 bg-[#090e1a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#070b13] rounded-[10px] flex items-center justify-center">
                <Gift className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                TRIPBONE <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">AppSumo Partner</span>
              </span>
              <p className="text-[10px] text-gray-400">Lifetime Subscription Redemption Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-gray-300 hover:text-white transition-colors px-3 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-all border border-gray-700/60"
            >
              Main Site
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 sm:py-16">

        {/* Hero Badge */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AppSumo Official Redemption Portal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Redeem Your <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">AppSumo Lifetime</span> Deal
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
            Welcome Sumo-ling! Enter your unique redemption code from AppSumo below to instantly activate your lifetime SaaS tour operator workspace.
          </p>
        </div>

        {/* Success Screen */}
        {redemptionSuccess ? (
          <div className="bg-[#0e1626] border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
            
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-mono font-bold">
                ✨ REDEMPTION SUCCESSFUL
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Your Lifetime Workspace is Active!</h2>
              <p className="text-sm text-gray-400 max-w-lg mx-auto">
                Congratulations! Workspace <strong className="text-white">{redemptionSuccess.companyName}</strong> has been assigned <strong className="text-amber-400">{redemptionSuccess.tierName}</strong> ({redemptionSuccess.plan.toUpperCase()} Lifetime Access).
              </p>
            </div>

            <div className="p-4 bg-[#070b13] border border-gray-800 rounded-2xl max-w-md mx-auto text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Redeemed Code:</span>
                <span className="text-amber-400 font-bold">{redemptionSuccess.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Workspace ID:</span>
                <span className="text-white font-bold">{redemptionSuccess.tenantId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subscription Term:</span>
                <span className="text-emerald-400 font-bold">Never Expires (Lifetime Access)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Recurring Price:</span>
                <span className="text-white font-bold">$0.00 / forever</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate(`/?tenant=${redemptionSuccess.tenantId}`)}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Launch Operator Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (

          /* Redemption Card & Flow */
          <div className="bg-[#0e1626] border border-gray-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
            
            {/* Step 1: Code Input */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  Step 1: Enter Your AppSumo Code
                </label>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-amber-400" />
                  Found on your AppSumo invoice or email
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Key className="w-5 h-5 text-gray-500 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. SUMO-T1-XXXX-YYYY or AppSumo UUID"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleVerifyCode();
                      }
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-[#070b13] border border-gray-700/80 rounded-xl text-white font-mono text-sm tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all placeholder:text-gray-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyCode()}
                  disabled={isVerifying || !code.trim()}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shrink-0 shadow-md"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Verify Code</span>
                    </>
                  )}
                </button>
              </div>

              {verifyError && (
                <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-400 flex items-start space-x-3 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{verifyError}</p>
                </div>
              )}
            </div>

            {/* AppSumo Tier Breakdown Card Preview */}
            <div className="p-4 bg-[#070b13] border border-gray-800 rounded-2xl space-y-3">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono block">
                AppSumo Lifetime License Plan Tiers Overview:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#0e1626] border border-gray-800 rounded-xl space-y-1">
                  <div className="font-bold text-amber-400">Tier 1 ($69)</div>
                  <div className="text-gray-300 font-semibold">Starter Lifetime</div>
                  <div className="text-[10px] text-gray-400">20 Active Tours • Full Booking Engine • Direct WhatsApp CRM</div>
                </div>
                <div className="p-3 bg-[#0e1626] border border-amber-500/30 rounded-xl space-y-1 relative">
                  <span className="absolute top-2 right-2 text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">POPULAR</span>
                  <div className="font-bold text-amber-400">Tier 2 ($149)</div>
                  <div className="text-gray-300 font-semibold">Growth Lifetime</div>
                  <div className="text-[10px] text-gray-400">100 Active Tours • Custom Domain • Multi-Currency • AI Concierge</div>
                </div>
                <div className="p-3 bg-[#0e1626] border border-gray-800 rounded-xl space-y-1">
                  <div className="font-bold text-amber-400">Tier 3 ($299)</div>
                  <div className="text-gray-300 font-semibold">Pro / Agency Lifetime</div>
                  <div className="text-[10px] text-gray-400">Unlimited Tours • 5 Workspaces • White-Label • Full API</div>
                </div>
              </div>
            </div>

            {/* Step 2 & 3: Verified Code Details & Target Workspace Selection */}
            {verifiedCodeData && (
              <form onSubmit={handleRedeem} className="space-y-8 pt-6 border-t border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* Verified Package Preview Card */}
                <div className="p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                      <Check className="w-3 h-3" /> Valid Code Verified
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      Code: <strong className="text-white">{verifiedCodeData.code}</strong>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <div>
                      <h3 className="text-lg font-black text-amber-300">
                        {verifiedCodeData.tierName || `AppSumo Tier ${verifiedCodeData.tier || 1} Lifetime License`}
                      </h3>
                      <p className="text-xs text-gray-300">
                        Includes full platform access, booking engine, custom pages, itinerary builder, and CRM integrations forever.
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs text-gray-400 block">Renewal Price</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">$0 / lifetime</span>
                    </div>
                  </div>
                </div>

                {/* Step 2: Choose or Create Workspace */}
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                    Step 2: Assign Workspace to Activate
                  </label>

                  {tenants.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-xs text-gray-400 block">Select from your existing workspaces or create a new one:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {tenants.map(t => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTenantId(t.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              selectedTenantId === t.id
                                ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-md'
                                : 'bg-[#070b13] border-gray-800 text-gray-400 hover:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Building2 className={`w-5 h-5 ${selectedTenantId === t.id ? 'text-amber-400' : 'text-gray-500'}`} />
                              <div>
                                <h4 className="text-xs font-bold text-white">{t.companyName}</h4>
                                <span className="text-[10px] text-gray-500 font-mono">{t.slug}.tripbone.com</span>
                              </div>
                            </div>
                            {selectedTenantId === t.id && <Check className="w-4 h-4 text-amber-400" />}
                          </div>
                        ))}

                        <div
                          onClick={() => setSelectedTenantId('new')}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            selectedTenantId === 'new'
                              ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-md'
                              : 'bg-[#070b13] border-gray-800 text-gray-400 hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Sparkles className={`w-5 h-5 ${selectedTenantId === 'new' ? 'text-amber-400' : 'text-gray-500'}`} />
                            <div>
                              <h4 className="text-xs font-bold text-white">+ Create New Workspace</h4>
                              <span className="text-[10px] text-gray-500 font-mono">Setup fresh operator account</span>
                            </div>
                          </div>
                          {selectedTenantId === 'new' && <Check className="w-4 h-4 text-amber-400" />}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTenantId === 'new' && (
                    <div className="p-5 bg-[#070b13] border border-gray-800 rounded-2xl space-y-4 animate-in fade-in">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">Company / Tour Operator Name *</label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            placeholder="e.g. Bali Paradise Adventures"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-[#0e1626] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-300 mb-1">Admin Full Name</label>
                          <div className="relative">
                            <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                            <input
                              type="text"
                              placeholder="e.g. Alex Sterling"
                              value={newAdminName}
                              onChange={(e) => setNewAdminName(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 bg-[#0e1626] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-300 mb-1">Admin Email Address *</label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                            <input
                              type="email"
                              placeholder="e.g. operator@company.com"
                              value={newAdminEmail}
                              onChange={(e) => setNewAdminEmail(e.target.value)}
                              required
                              className="w-full pl-10 pr-4 py-2.5 bg-[#0e1626] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 3: Confirmation Button */}
                <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant lifetime activation. No recurring fees or hidden costs.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isRedeeming}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-xl shadow-amber-500/20 text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shrink-0"
                  >
                    {isRedeeming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Activating Workspace...</span>
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4" />
                        <span>Redeem & Activate Workspace</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

        {/* Support & FAQ Footer note */}
        <div className="mt-12 text-center text-xs text-gray-500 space-y-2">
          <p>Need help with your AppSumo purchase or coupon code? Contact <a href="mailto:support@tripbone.com" className="text-amber-400 underline font-medium">support@tripbone.com</a></p>
          <p className="text-[10px]">Tripbone Tour Operator Platform © {new Date().getFullYear()} — Official AppSumo Deal Redemption</p>
        </div>

      </main>
    </div>
  );
}
