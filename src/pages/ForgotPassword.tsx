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
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-white select-none">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
        
        {/* Back Link */}
        {step !== 'success' && (
          <button 
            onClick={() => step === 'verify' ? setStep('request') : navigate('/login')}
            className="mb-6 flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-[#00A651] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 'verify' ? 'Back' : 'Back to Login'}
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
                <div className="w-12 h-12 bg-emerald-50 text-[#00A651] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                  Forgot Password?
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed px-2">
                  No worries! Enter your email address below and we'll send you a secure 6-digit verification code to change your password.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100/50 flex gap-3 items-start">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651] transition-all outline-none"
                      placeholder="Enter your registered email"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00A651] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#008d43] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-[0_4px_12px_rgba(0,166,81,0.15)]"
                >
                  {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : (
                    <>
                      Send Reset Code
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
                <div className="w-12 h-12 bg-emerald-50 text-[#00A651] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                  Verify & Reset
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed px-2">
                  We sent a 6-digit code to <span className="font-bold text-gray-800">{email}</span>. Please enter the code and your new secure password below.
                </p>
              </div>

              {successMessage && !error && (
                <div className="mb-6 p-4 bg-emerald-50 text-[#00A651] text-xs font-semibold rounded-xl border border-emerald-100/50 flex gap-2.5 items-center">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}



              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100/50 flex gap-3 items-start">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                
                {/* OTP Verification Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">6-Digit Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 text-center font-mono text-lg tracking-[0.5em] font-black focus:bg-white focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651] transition-all outline-none"
                      placeholder="000000"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651] transition-all outline-none"
                      placeholder="At least 6 characters"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651] transition-all outline-none"
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00A651] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#008d43] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-[0_4px_12px_rgba(0,166,81,0.15)]"
                >
                  {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : (
                    <>
                      Confirm Reset
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
              <div className="w-16 h-16 bg-emerald-50 text-[#00A651] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-3">
                Password Reset!
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed px-4 mb-8">
                Your password has been changed successfully. You can now use your new credentials to access your account.
              </p>

              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-[#00A651] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#008d43] active:scale-[0.99] transition-all shadow-[0_4px_12px_rgba(0,166,81,0.15)]"
              >
                Go to Sign In
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
