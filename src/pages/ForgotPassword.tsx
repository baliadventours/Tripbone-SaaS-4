import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, KeyRound, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { getActiveTenantId } from '../lib/firebase';

type ResetStep = 'request' | 'verify' | 'success';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<ResetStep>('request');
  const [email, setEmail] = useState(() => (searchParams.get('email') || '').trim());
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // For developer/testing fallback convenience
  const [fallbackOtp, setFallbackOtp] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setFallbackOtp(null);

    try {
      const response = await fetch('/api/auth/forgot-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(),
          tenantId: getActiveTenantId() || 'global'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request verification code.');
      }

      setSuccessMessage(data.message);
      
      // If the email sender is in fallback/dev mode, store the OTP so the user can easily test it
      if (data.fallback && data.otp) {
        setFallbackOtp(data.otp);
      }

      setStep('verify');
    } catch (err: any) {
      console.error('[ForgotPassword] Request OTP Error:', err);
      setError(err.message || 'An error occurred. Please verify your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setStep('success');
    } catch (err: any) {
      console.error('[ForgotPassword] Reset Password Error:', err);
      setError(err.message || 'Verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Brand Header */}
      <Link to="/" className="flex items-center gap-2.5 group mb-8 transition-transform hover:scale-105">
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md">
          T
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xl font-black text-slate-900 tracking-tight leading-none">Tripbone</span>
          <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Password Recovery</span>
        </div>
      </Link>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 sm:p-9 shadow-2xl transition-all">
        
        {/* Back Link */}
        {step !== 'success' && (
          <button 
            onClick={() => step === 'verify' ? setStep('request') : navigate('/login')}
            className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{step === 'verify' ? 'Back to email' : 'Back to Sign In'}</span>
          </button>
        )}

        <AnimatePresence mode="wait">
          
          {/* STEP 1: REQUEST OTP */}
          {step === 'request' && (
            <motion.div
              key="request"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                  <KeyRound className="h-7 w-7" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                  Forgot Password?
                </h1>
                <p className="text-slate-500 text-xs leading-relaxed px-2">
                  Enter your registered email address to receive a secure 6-digit verification code to reset your account password.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex gap-2.5 items-start">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none transition-all text-slate-900 font-medium"
                      placeholder="operator@company.com"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: VERIFY CODE & NEW PASSWORD */}
          {step === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                  Verify & Reset
                </h1>
                <p className="text-slate-500 text-xs leading-relaxed px-2">
                  We sent a 6-digit code to <strong className="font-mono text-slate-900">{email}</strong>. Enter the code and your new password.
                </p>
              </div>

              {successMessage && !error && (
                <div className="mb-6 p-3.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 flex gap-2 items-center">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex gap-2.5 items-start">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                
                {/* OTP Verification Code */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">6-Digit Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-center font-mono text-base tracking-[0.4em] font-black focus:outline-none transition-all text-slate-900"
                      placeholder="000000"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none transition-all text-slate-900 font-medium"
                      placeholder="At least 6 characters"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none transition-all text-slate-900 font-medium"
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : (
                    <>
                      <span>Confirm & Update Password</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xs">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                Password Reset Successfully!
              </h1>
              <p className="text-slate-500 text-xs leading-relaxed px-4 mb-8">
                Your password has been changed. You can now use your new credentials to sign in to your operations dashboard.
              </p>

              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <Link to="/" className="mt-6 text-slate-400 text-xs font-medium hover:text-slate-700 transition-colors">
        ← Back to Tripbone Platform
      </Link>
    </div>
  );
}
