import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { applyActionCode } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Mail, Compass, RefreshCw } from 'lucide-react';
import { useSettings } from '../lib/SettingsContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');
  const emailParam = searchParams.get('email');

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleVerification() {
      // If code is provided in query params
      if (oobCode) {
        try {
          await applyActionCode(auth, oobCode);
          if (auth.currentUser) {
            await auth.currentUser.reload();
            try {
              await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                emailVerified: true,
                updatedAt: serverTimestamp()
              });
            } catch (uErr) {
              console.warn('[VerifyEmail] Could not update user document:', uErr);
            }
          }
          if (isMounted) {
            setSuccess(true);
            setVerifying(false);
          }
        } catch (err: any) {
          console.error('[VerifyEmail] Error applying action code:', err);
          if (isMounted) {
            // Check if user is already verified
            if (auth.currentUser?.emailVerified) {
              setSuccess(true);
              setVerifying(false);
            } else {
              setErrorMessage(
                err.code === 'auth/invalid-action-code'
                  ? 'This verification link is invalid or has already been used. If your account is not verified, please request a new link below.'
                  : err.code === 'auth/expired-action-code'
                  ? 'This verification link has expired. Please request a new verification email below.'
                  : err.message || 'Failed to verify email address.'
              );
              setVerifying(false);
            }
          }
        }
      } else {
        // No code provided, check current auth state
        if (auth.currentUser?.emailVerified) {
          if (isMounted) {
            setSuccess(true);
            setVerifying(false);
          }
        } else {
          if (isMounted) {
            setErrorMessage('No verification code was found in this link. Please check your email or request a new link below.');
            setVerifying(false);
          }
        }
      }
    }

    handleVerification();

    return () => {
      isMounted = false;
    };
  }, [oobCode]);

  const handleResend = async () => {
    const targetEmail = emailParam || auth.currentUser?.email;
    if (!targetEmail) {
      setResendStatus('Please sign in or provide your email address to resend.');
      return;
    }

    setResending(true);
    setResendStatus(null);
    try {
      const baseHost = window.location.origin;
      const res = await fetch(`${baseHost}/api/mail/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setResendStatus('📧 A fresh confirmation email has been dispatched from Tripbone! Please check your inbox.');
      } else {
        setResendStatus(`Failed to send: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      setResendStatus(`Network error: ${e.message}`);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061c15] text-gray-100 flex flex-col justify-center items-center p-6 relative select-none font-sans selection:bg-[#00b272]">
      <Helmet>
        <title>Confirm Your Email | Tripbone</title>
      </Helmet>

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-[500px] bg-white rounded-[32px] p-8 sm:p-10 shadow-2xl flex flex-col items-stretch text-gray-900 border border-gray-100 relative z-10">
        
        {/* Tripbone Branding Header */}
        <div className="flex items-center space-x-2.5 mb-8 justify-center">
          <div className="bg-[#00b272] p-2 rounded-xl text-white shadow-md shadow-emerald-500/20">
            <Compass className="h-6 w-6 animate-spin-slow" />
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900">
            Trip<span className="text-[#00b272]">bone</span>
          </span>
        </div>

        {verifying ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Verifying your email...</h2>
            <p className="text-xs text-gray-500">Securing your Tripbone workspace credentials.</p>
          </div>
        ) : success ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Account Verified</span>
              </span>
              <h2 className="text-2xl font-black text-gray-900">Email Address Confirmed!</h2>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Your operator account is confirmed. Your <strong>7-Day Free Trial</strong> has been activated with full Starter capabilities and zero platform commissions.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>⚡ Next Step: Setup Your Tour Website</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Configure your tour company name and subdomain. Your booking engine and AI automations will be provisioned in under 2 minutes.
              </p>
            </div>

            <button
              onClick={() => {
                sessionStorage.setItem('otp_verified', 'true');
                navigate('/');
              }}
              className="w-full py-3.5 bg-[#00b272] hover:bg-[#009e64] text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Workspace Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Verification Link Issue</h2>
              <p className="text-xs text-red-600 leading-relaxed bg-red-50 border border-red-100 p-3 rounded-xl">
                {errorMessage}
              </p>
            </div>

            {resendStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-left">
                {resendStatus}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full py-3 bg-[#00b272] hover:bg-[#009e64] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {resending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                <span>{resending ? 'Sending...' : 'Resend Confirmation Email'}</span>
              </button>

              <Link
                to="/"
                className="block text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors pt-2"
              >
                ← Back to Login / Home
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
