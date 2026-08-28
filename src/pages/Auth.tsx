import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCustomToken
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, query, collection, where, getDocs, deleteDoc } from '@/src/lib/firebase';
import { Mail, Lock, User, ArrowRight, Github, Chrome, Apple, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useSettings } from '../lib/SettingsContext';
import { useTenant } from '../lib/TenantContext';

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function Auth() {
  const { settings } = useSettings();
  const { tenantId, tenant, isAppGate, isImpersonating } = useTenant();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCredentialError, setIsCredentialError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const [ssoLoading, setSsoLoading] = useState(false);

  useEffect(() => {
    if (isImpersonating) {
      navigate('/admin', { replace: true });
    }
  }, [isImpersonating, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ssoToken = params.get('token');
    const redirectTo = params.get('redirect') || '/';

    if (ssoToken) {
      async function performSSO() {
        setSsoLoading(true);
        setError(null);
        try {
          console.log('[Auth SSO] Attempting Custom Token login...');
          await signInWithCustomToken(auth, ssoToken);
          console.log('[Auth SSO] Success! Redirecting to:', redirectTo);
          navigate(redirectTo, { replace: true });
        } catch (ssoErr: any) {
          console.error('[Auth SSO] Authentication failed:', ssoErr);
          setError(ssoErr.message || 'SSO Login failed. Please try standard sign-in.');
        } finally {
          setSsoLoading(false);
        }
      }
      performSSO();
    }
  }, [location, navigate]);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setResetSent(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError(null);
    try {
      if (provider === 'google') {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        const user = result.user;
        
        // Ensure profile exists
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          try {
            // Check if there's an existing profile with this email (e.g. manually created partner)
            const q = query(collection(db, 'users'), where('email', '==', user.email));
            const existingProfiles = await getDocs(q);
            
            let migratedData = {};
            if (!existingProfiles.empty) {
              const oldProfile = existingProfiles.docs[0];
              if (oldProfile.id !== user.uid) {
                console.log("[Auth] Merging manually created profile with new Auth profile:", oldProfile.id);
                migratedData = oldProfile.data();
                
                // --- DATA MIGRATION: Update Tours & Bookings that referenced the old ID ---
                try {
                  const toursQuery = query(collection(db, 'tours'), where('supplierId', '==', oldProfile.id));
                  const tourSnaps = await getDocs(toursQuery);
                  for (const tourDoc of tourSnaps.docs) {
                    await updateDoc(doc(db, 'tours', tourDoc.id), { supplierId: user.uid });
                  }
                  
                  const bookingsQuery = query(collection(db, 'bookings'), where('supplierId', '==', oldProfile.id));
                  const bookingSnaps = await getDocs(bookingsQuery);
                  for (const bookingDoc of bookingSnaps.docs) {
                    await updateDoc(doc(db, 'bookings', bookingDoc.id), { supplierId: user.uid });
                  }
                  
                  const userBookingsQuery = query(collection(db, 'bookings'), where('userId', '==', oldProfile.id));
                  const userBookingSnaps = await getDocs(userBookingsQuery);
                  for (const bookingDoc of userBookingSnaps.docs) {
                    await updateDoc(doc(db, 'bookings', bookingDoc.id), { userId: user.uid });
                  }
                } catch (dataMigError) {
                  console.warn("[Auth] Failed to migrate related data (tours/bookings):", dataMigError);
                }

                // Clean up the temporary ID to avoid duplicates
                try {
                  await deleteDoc(doc(db, 'users', oldProfile.id));
                } catch (delError) {
                  console.warn("[Auth] Could not delete old temporary profile during social login migration:", delError);
                }
              }
            }

            const isSuperAdminEmail = ['baliadventours@gmail.com', 'admin@tripbone.com', 'kuotabox@gmail.com'].includes(user.email?.toLowerCase() || '');
            await setDoc(profileRef, {
              ...migratedData, // Preserve manually set role, commission, etc.
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || (migratedData as any)?.displayName || 'Traveler',
              photoURL: user.photoURL || (migratedData as any)?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'T')}&background=random`,
              role: (migratedData as any)?.role || (isSuperAdminEmail ? 'superadmin' : 'customer'),
              tenantId: tenantId || null,
              createdAt: (migratedData as any)?.createdAt || serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (mergeError) {
            console.error("[Auth] Social login merge failed:", mergeError);
            const isSuperAdminEmail = ['baliadventours@gmail.com', 'admin@tripbone.com', 'kuotabox@gmail.com'].includes(user.email?.toLowerCase() || '');
            // Fallback for social
            await setDoc(profileRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'Traveler',
              photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'T')}&background=random`,
              role: isSuperAdminEmail ? 'superadmin' : 'customer',
              tenantId: tenantId || null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
        
        // Refresh snap for role check
        const finalSnap = await getDoc(profileRef);
        const profileData = finalSnap.data() as any;
        let userRole = profileData?.role || 'customer';
        let userTenantId = profileData?.tenantId;

        const isSuperAdminEmail = ['baliadventours@gmail.com', 'admin@tripbone.com', 'kuotabox@gmail.com'].includes(user.email?.toLowerCase() || '') || userRole === 'superadmin';
        const isTenantOwner = !!(tenant && tenant.adminEmail && user.email && (tenant.adminEmail.trim().toLowerCase() === user.email.trim().toLowerCase()));

        if (isTenantOwner && userRole !== 'admin') {
          userRole = 'admin';
          await setDoc(profileRef, {
            role: 'admin',
            tenantId: tenantId || tenant?.id || null,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } else if (!userTenantId && tenantId && !isSuperAdminEmail) {
          await setDoc(profileRef, {
            tenantId: tenantId,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        // Enforce tenant boundary on Google sign-in only for explicit cross-tenant mismatches
        if (!isAppGate && !isSuperAdminEmail && !isTenantOwner && tenantId && userTenantId) {
          const matchesTenant = userTenantId === tenantId || userTenantId === tenant?.id || userTenantId === tenant?.slug;
          if (!matchesTenant) {
            await auth.signOut();
            throw new Error('This account is associated with another store workspace. Please sign in on your dedicated workspace.');
          }
        }

        if (from === '/' || from === '/login') {
          if (userRole === 'admin' || isTenantOwner) navigate('/admin', { replace: true });
          else if (userRole === 'superadmin' || isSuperAdminEmail) navigate('/superadmin', { replace: true });
          else if (userRole === 'supplier') navigate('/supplier', { replace: true });
          else if (userRole === 'agent') navigate('/agent', { replace: true });
          else navigate('/customer/dashboard', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setError('Apple login is not configured yet. Please use Google or Email.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsCredentialError(false);

    try {
      if (mode === 'signin' || mode === 'signup') {
        const user = (await (mode === 'signin' 
          ? signInWithEmailAndPassword(auth, email, password)
          : createUserWithEmailAndPassword(auth, email, password))).user;

        if (mode === 'signup') {
          try {
            // Check for existing manually created profile
            const q = query(collection(db, 'users'), where('email', '==', user.email));
            const existingProfiles = await getDocs(q);
            
            let migratedData = {};
            if (!existingProfiles.empty) {
              const oldProfile = existingProfiles.docs[0];
              if (oldProfile.id !== user.uid) {
                console.log("[Auth] Merging existing profile entry:", oldProfile.id);
                migratedData = oldProfile.data();

                // --- DATA MIGRATION: Update Tours & Bookings that referenced the old ID ---
                try {
                  const toursQuery = query(collection(db, 'tours'), where('supplierId', '==', oldProfile.id));
                  const tourSnaps = await getDocs(toursQuery);
                  for (const tourDoc of tourSnaps.docs) {
                    await updateDoc(doc(db, 'tours', tourDoc.id), { supplierId: user.uid });
                  }
                  
                  const bookingsQuery = query(collection(db, 'bookings'), where('supplierId', '==', oldProfile.id));
                  const bookingSnaps = await getDocs(bookingsQuery);
                  for (const bookingDoc of bookingSnaps.docs) {
                    await updateDoc(doc(db, 'bookings', bookingDoc.id), { supplierId: user.uid });
                  }
                  
                  const userBookingsQuery = query(collection(db, 'bookings'), where('userId', '==', oldProfile.id));
                  const userBookingSnaps = await getDocs(userBookingsQuery);
                  for (const bookingDoc of userBookingSnaps.docs) {
                    await updateDoc(doc(db, 'bookings', bookingDoc.id), { userId: user.uid });
                  }
                } catch (dataMigError) {
                  console.warn("[Auth] Failed to migrate related data (tours/bookings):", dataMigError);
                }

                try {
                  await deleteDoc(doc(db, 'users', oldProfile.id));
                } catch (delError) {
                  console.warn("[Auth] Could not delete temporary profile, continuing...", delError);
                }
              }
            }

            const isSuperAdminEmail = ['baliadventours@gmail.com', 'admin@tripbone.com', 'kuotabox@gmail.com'].includes(user.email?.toLowerCase() || '');
            const isTenantOwner = !!(tenant && tenant.adminEmail && user.email && (tenant.adminEmail.trim().toLowerCase() === user.email.trim().toLowerCase()));

            await setDoc(doc(db, 'users', user.uid), {
              ...migratedData,
              uid: user.uid,
              email: user.email,
              displayName: fullName || (migratedData as any)?.displayName || 'Traveler',
              photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || (migratedData as any)?.displayName || 'T')}&background=random`,
              role: isTenantOwner ? 'admin' : ((migratedData as any)?.role || (isSuperAdminEmail ? 'superadmin' : 'customer')),
              tenantId: tenantId || null,
              createdAt: (migratedData as any)?.createdAt || serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (mergeError) {
            console.error("[Auth] Merging failed, falling back to clean signup:", mergeError);
            const isSuperAdminEmail = ['baliadventours@gmail.com', 'admin@tripbone.com', 'kuotabox@gmail.com'].includes(user.email?.toLowerCase() || '');
            const isTenantOwner = !!(tenant && tenant.adminEmail && user.email && (tenant.adminEmail.trim().toLowerCase() === user.email.trim().toLowerCase()));

            // Fallback: Create basic profile even if merging fails
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: fullName || 'Traveler',
              photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'T')}&background=random`,
              role: isTenantOwner ? 'admin' : (isSuperAdminEmail ? 'superadmin' : 'customer'),
              tenantId: tenantId || null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          // --- MAILJET: Trigger Welcome & Verification Emails ---
          try {
            const baseHost = window.location.origin;
            fetch(`${baseHost}/api/mail/welcome`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email, name: fullName || 'Traveler' })
            }).catch(e => console.warn('[Mailjet] Welcome fail', e));
            
            fetch(`${baseHost}/api/mail/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email })
            }).catch(e => console.warn('[Mailjet] Verify fail', e));
          } catch (mailError) {
            console.warn('[Auth] Failed to send welcome/verification emails:', mailError);
          }
        } else {
          // Double-check if the profile document exists in Firestore on Email Signin
          try {
            const profileSnap = await getDoc(doc(db, 'users', user.uid));
            const isSuperAdminEmail = ['baliadventours@gmail.com', 'admin@tripbone.com', 'kuotabox@gmail.com'].includes(user.email?.toLowerCase() || '');
            const isTenantOwner = !!(tenant && tenant.adminEmail && user.email && (tenant.adminEmail.trim().toLowerCase() === user.email.trim().toLowerCase()));

            if (!profileSnap.exists()) {
              console.log("[Auth] Profile does not exist in Firestore for signed-in user, initializing profile.");
              await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || email.split('@')[0] || 'Traveler',
                photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || email.split('@')[0] || 'T')}&background=random`,
                role: isTenantOwner ? 'admin' : (isSuperAdminEmail ? 'superadmin' : 'customer'),
                tenantId: tenantId || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } else if (isTenantOwner) {
              // Ensure tenant owner always has role admin and correct tenantId
              const pData = profileSnap.data();
              if (pData?.role !== 'admin' || !pData?.tenantId) {
                await setDoc(doc(db, 'users', user.uid), {
                  role: 'admin',
                  tenantId: tenantId || tenant?.id || null,
                  updatedAt: serverTimestamp()
                }, { merge: true });
              }
            }
          } catch (profileInitErr) {
            console.error("[Auth] Failed to verify or initialize profile during signin:", profileInitErr);
          }
        }

        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        const profileData = profileSnap.data() as any;
        let userRole = profileData?.role || 'customer';
        let userTenantId = profileData?.tenantId;

        const isSuperAdminEmail = ['baliadventours@gmail.com', 'admin@tripbone.com', 'kuotabox@gmail.com'].includes(user.email?.toLowerCase() || '') || userRole === 'superadmin';
        const isTenantOwner = !!(tenant && tenant.adminEmail && user.email && (tenant.adminEmail.trim().toLowerCase() === user.email.trim().toLowerCase()));

        if (isTenantOwner && userRole !== 'admin') {
          userRole = 'admin';
          await setDoc(doc(db, 'users', user.uid), {
            role: 'admin',
            tenantId: tenantId || tenant?.id || null,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } else if (!userTenantId && tenantId && !isSuperAdminEmail) {
          await setDoc(doc(db, 'users', user.uid), {
            tenantId: tenantId,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        // Enforce tenant boundary on email sign-in only for explicit cross-tenant mismatches
        if (!isAppGate && !isSuperAdminEmail && !isTenantOwner && tenantId && userTenantId) {
          const matchesTenant = userTenantId === tenantId || userTenantId === tenant?.id || userTenantId === tenant?.slug;
          if (!matchesTenant) {
            await auth.signOut();
            throw new Error('This account is associated with another store workspace. Please sign in on your dedicated workspace.');
          }
        }

        if (from === '/' || from === '/login') {
          if (userRole === 'admin' || isTenantOwner) navigate('/admin', { replace: true });
          else if (userRole === 'superadmin' || isSuperAdminEmail) navigate('/superadmin', { replace: true });
          else if (userRole === 'supplier') navigate('/supplier', { replace: true });
          else if (userRole === 'agent') navigate('/agent', { replace: true });
          else navigate('/customer/dashboard', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setResetSent(true);
      }
    } catch (err: any) {
      console.error("[Auth] Authentication Flow Error:", err);
      let friendlyMessage = err.message || 'An unexpected error occurred during authentication.';
      
      // Translating standard Firebase Auth error codes into helpful customer instructions
      if (err.code === 'auth/invalid-credential' || err.message?.includes('invalid-credential')) {
        setIsCredentialError(true);
        friendlyMessage = 'Invalid email address or password. Please check your spelling or reset your password.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email address is already in use. Please sign in instead or reset your password.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Your password is too weak. Please choose a password with at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'The email address format is invalid. Please check your spelling.';
      } else if (err.code === 'auth/user-disabled') {
        friendlyMessage = 'This account has been suspended. Please contact customer support.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many failed login attempts. Please wait a few minutes or reset your password.';
      }
      
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  if (ssoLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-4 text-gray-100">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Authenticating Single Sign-On...</h2>
          <p className="text-sm text-gray-400 font-mono">Establishing secure session to your administration cockpit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Link to="/" className="flex items-center gap-2 group mb-8">
        {settings?.logoURL ? (
          <img src={settings.logoURL} alt={settings.siteName} className="h-16 md:h-24 w-auto object-contain transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex flex-col -space-y-1 items-center">
            <span className="text-2xl font-bold text-gray-900 leading-tight">{settings?.siteName.split(' ')[0] || 'bali'}</span>
            <span className="text-2xl font-bold text-[#00A651] leading-tight">{settings?.siteName.split(' ').slice(1).join(' ') || 'adventours'}</span>
          </div>
        )}
      </Link>

      <div className="w-full max-w-md bg-white rounded-[20px] shadow-sm border border-gray-100 p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {mode === 'signin' ? 'Welcome back!' : mode === 'signup' ? 'Create an account' : 'Reset password'}
              </h1>
              <p className="text-gray-500 text-sm">
                {mode === 'signin' ? 'Please sign in to your account' : mode === 'signup' ? 'Start your adventure with us' : "Enter your email to receive a reset link"}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-[10px] border border-red-100 space-y-2">
                <p className="font-medium">{error}</p>
                {isCredentialError && (
                  <div className="pt-2 border-t border-red-100/80 flex flex-col gap-2">
                    <Link 
                      to={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                      className="inline-flex items-center text-xs font-bold text-[#00A651] hover:underline"
                    >
                      → Reset your password via secure code
                    </Link>
                    <p className="text-xs text-gray-500">
                      If you registered using Google Sign-In, please use the <strong>Google</strong> button below.
                    </p>
                  </div>
                )}
              </div>
            )}

            {resetSent ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-50 text-[#00A651] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold mb-2">Check your email</h3>
                <p className="text-gray-500 mb-6 text-sm">We've sent a password reset link to <span className="font-semibold text-gray-900">{email}</span></p>
                <button 
                  onClick={() => setMode('signin')}
                  className="text-[#00A651] font-bold text-sm hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 ml-1">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input 
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-[10px] pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#00A651] transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-[10px] pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#00A651] transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-xs font-bold text-gray-400">Password</label>
                      {mode === 'signin' && (
                        <Link 
                          to={email ? `/forgot-password?email=${encodeURIComponent(email)}` : '/forgot-password'}
                          className="text-xs font-bold text-[#00A651] hover:underline"
                        >
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-[10px] pl-11 pr-11 py-3 text-sm focus:ring-2 focus:ring-[#00A651] transition-all"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00A651] text-white py-3 rounded-[10px] font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {mode !== 'forgot' && !resetSent && (
              <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs font-bold">
                    <span className="bg-white px-4 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleSocialLogin('google')}
                    className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 rounded-[10px] border border-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <Chrome className="h-4 w-4 text-red-500" />
                    Google
                  </button>
                  <button 
                    onClick={() => handleSocialLogin('apple')}
                    className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 rounded-[10px] border border-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <Apple className="h-4 w-4" />
                    Apple
                  </button>
                </div>
              </>
            )}

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
                <button 
                  onClick={() => handleModeChange(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-[#00A651] font-bold hover:underline"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
              {mode === 'forgot' && (
                <button 
                  onClick={() => setMode('signin')}
                  className="mt-2 text-gray-400 text-sm font-medium hover:text-[#00A651]"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <Link to="/" className="mt-8 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors">
        ← Back to home
      </Link>

      <div className="mt-12 text-center max-w-sm">
        <p className="text-xs text-gray-400 leading-relaxed">
          "Just browsing? You can still book tours as a guest without creating an account."
        </p>
      </div>
    </div>
  );
}
