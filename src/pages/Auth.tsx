import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCustomToken,
  sendEmailVerification
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, query, collection, where, getDocs, deleteDoc } from '@/src/lib/firebase';
import { Mail, Lock, User, ArrowRight, Github, Chrome, Apple, Eye, EyeOff, Loader2, Sparkles, CheckCircle2, MessageSquare, Globe, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useSettings } from '../lib/SettingsContext';
import { useTenant } from '../lib/TenantContext';
import { CountryPhoneInput, CountryPhoneValue } from '../components/UI/CountryPhoneInput';
import { detectUserCountry } from '../lib/countryPhoneData';

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

  // Phone / WhatsApp & Country state
  const [phoneData, setPhoneData] = useState<CountryPhoneValue>(() => {
    const detected = detectUserCountry();
    return {
      phone: '',
      whatsapp: '',
      country: detected.name,
      countryCode: detected.code,
      dialCode: detected.dialCode,
      rawPhone: '',
      isSameAsWhatsapp: true
    };
  });

  // Social Login Post-Registration Profile Completion state
  const [pendingSocialUser, setPendingSocialUser] = useState<{ user: any; profileData: any; targetPath: string } | null>(null);
  const [socialSaving, setSocialSaving] = useState(false);

  // Email Verification Waiting State
  const [awaitingVerificationEmail, setAwaitingVerificationEmail] = useState<string | null>(null);
  const [pendingRedirectTarget, setPendingRedirectTarget] = useState<string>('/');
  const [verificationSuccessNotice, setVerificationSuccessNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const [ssoLoading, setSsoLoading] = useState(false);

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: 'bg-gray-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (pass.length < 6) return { score: 1, text: 'Too short (minimum 6 characters)', color: 'bg-red-500' };
    if (score <= 2) return { score: 2, text: 'Fair', color: 'bg-amber-500' };
    if (score <= 3) return { score: 3, text: 'Good', color: 'bg-emerald-500' };
    return { score: 4, text: 'Strong', color: 'bg-teal-500' };
  };

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

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    setError(null);
    setVerificationSuccessNotice(null);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setVerificationSuccessNotice("🎉 Email verified successfully! Redirecting to company setup...");
          try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              emailVerified: true,
              updatedAt: serverTimestamp()
            });
          } catch (_) {}
          setTimeout(() => {
            navigate(pendingRedirectTarget || '/', { replace: true });
          }, 1200);
        } else {
          setError("Email is not verified yet. Please check your inbox (and Spam/Junk folder) and click the verification link.");
        }
      }
    } catch (checkErr: any) {
      setError("Error checking verification: " + (checkErr.message || checkErr));
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setVerificationSuccessNotice(null);
    try {
      if (auth.currentUser?.email) {
        const baseHost = window.location.origin;
        await fetch(`${baseHost}/api/mail/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: auth.currentUser.email })
        });
        setVerificationSuccessNotice("📧 Fresh confirmation email dispatched from Tripbone! Please check your inbox.");
        setResendCooldown(60);
      }
    } catch (resendErr: any) {
      setError("Failed to resend email: " + (resendErr.message || resendErr));
    }
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

        let targetPath = from;
        if (from === '/' || from === '/login') {
          if (userRole === 'admin' || userRole === 'staff' || isTenantOwner) targetPath = '/admin';
          else if (userRole === 'superadmin' || isSuperAdminEmail) targetPath = '/superadmin';
          else if (userRole === 'supplier') targetPath = '/supplier';
          else if (userRole === 'agent') targetPath = '/agent';
          else targetPath = '/customer/dashboard';
        }

        // If phone or country is not recorded yet, prompt user with smooth profile completion
        if (!profileData?.phoneNumber && !profileData?.country) {
          setPendingSocialUser({ user, profileData, targetPath });
          return;
        }

        navigate(targetPath, { replace: true });
      } else {
        setError('Apple login is not configured yet. Please use Google or Email.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSocialProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingSocialUser) return;
    if (!phoneData.rawPhone.trim()) {
      setError("Please enter your mobile or WhatsApp number.");
      return;
    }

    setSocialSaving(true);
    setError(null);
    try {
      const userRef = doc(db, 'users', pendingSocialUser.user.uid);
      await setDoc(userRef, {
        phoneNumber: phoneData.phone || '',
        whatsapp: phoneData.whatsapp || phoneData.phone || '',
        country: phoneData.country || 'Indonesia',
        countryCode: phoneData.countryCode || 'ID',
        dialCode: phoneData.dialCode || '+62',
        updatedAt: serverTimestamp()
      }, { merge: true });

      navigate(pendingSocialUser.targetPath, { replace: true });
    } catch (err: any) {
      console.error("[Auth] Failed to complete social profile:", err);
      setError("Failed to save phone and country. Please try again.");
    } finally {
      setSocialSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsCredentialError(false);

    try {
      if (mode === 'signup') {
        if (!phoneData.rawPhone.trim()) {
          setError("Please enter your mobile or WhatsApp number.");
          setLoading(false);
          return;
        }
      }

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
              phoneNumber: phoneData.phone || '',
              whatsapp: phoneData.whatsapp || phoneData.phone || '',
              country: phoneData.country || 'Indonesia',
              countryCode: phoneData.countryCode || 'ID',
              dialCode: phoneData.dialCode || '+62',
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
              phoneNumber: phoneData.phone || '',
              whatsapp: phoneData.whatsapp || phoneData.phone || '',
              country: phoneData.country || 'Indonesia',
              countryCode: phoneData.countryCode || 'ID',
              dialCode: phoneData.dialCode || '+62',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          // --- Send Tripbone Branded Welcome & Verification Emails ---
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

          const isSuperAdminEmail = ['baliadventours@gmail.com', 'admin@tripbone.com', 'kuotabox@gmail.com'].includes(user.email?.toLowerCase() || '');
          const isTenantOwner = !!(tenant && tenant.adminEmail && user.email && (tenant.adminEmail.trim().toLowerCase() === user.email.trim().toLowerCase()));
          const userRole: any = isTenantOwner ? 'admin' : (isSuperAdminEmail ? 'superadmin' : 'customer');

          let targetPath = from;
          if (from === '/' || from === '/login') {
            if (userRole === 'admin' || userRole === 'staff' || isTenantOwner) targetPath = '/admin';
            else if (userRole === 'superadmin' || isSuperAdminEmail) targetPath = '/superadmin';
            else if (userRole === 'supplier') targetPath = '/supplier';
            else if (userRole === 'agent') targetPath = '/agent';
            else targetPath = '/customer/dashboard';
          }

          // If not superadmin, halt and show the Email Verification Gate
          if (!isSuperAdminEmail && userRole !== 'superadmin') {
            setPendingRedirectTarget(targetPath);
            setAwaitingVerificationEmail(user.email || email);
            setResendCooldown(60);
            return;
          }
        } else {
          // Double-check if the profile document exists in Firestore on Email Signin
          try {
            const profileSnap = await getDoc(doc(db, 'users', user.uid));
            const isSuperAdminEmail = ['baliadventours@gmail.com', 'admin@tripbone.com', 'kuotabox@gmail.com'].includes(user.email?.toLowerCase() || '');
            const isTenantOwner = !!(tenant && tenant.adminEmail && user.email && (tenant.adminEmail.trim().toLowerCase() === user.email.trim().toLowerCase()));

            if (!profileSnap.exists()) {
              console.log("[Auth] Profile does not exist in Firestore for signed-in user, checking for placeholder or initializing profile.");
              // Check if a staff/supplier profile exists by email
              let existingRole: any = isTenantOwner ? 'admin' : (isSuperAdminEmail ? 'superadmin' : 'customer');
              let existingDisplayName = user.displayName || email.split('@')[0] || 'Traveler';
              let existingData: any = {};
              try {
                const q = query(collection(db, 'users'), where('email', '==', user.email));
                const snap = await getDocs(q);
                const matchDoc = snap.docs.find(d => d.id !== user.uid);
                if (matchDoc) {
                  existingData = matchDoc.data();
                  existingRole = existingData.role || existingRole;
                  existingDisplayName = existingData.displayName || existingDisplayName;
                  if (matchDoc.id.startsWith('usr_')) {
                    try { await deleteDoc(doc(db, 'users', matchDoc.id)); } catch (_) {}
                  }
                }
              } catch (_) {}

              await setDoc(doc(db, 'users', user.uid), {
                ...existingData,
                uid: user.uid,
                email: user.email,
                displayName: existingDisplayName,
                photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(existingDisplayName)}&background=random`,
                role: existingRole,
                tenantId: existingData.tenantId || tenantId || null,
                createdAt: existingData.createdAt || serverTimestamp(),
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
          if (userRole === 'admin' || userRole === 'staff' || isTenantOwner) navigate('/admin', { replace: true });
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 font-sans antialiased">
      {/* Brand Header */}
      <Link to="/" className="flex items-center gap-2.5 group mb-8 transition-transform hover:scale-105">
        {settings?.logoURL ? (
          <img src={settings.logoURL} alt={settings.siteName} className="h-12 md:h-14 w-auto object-contain" />
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md">
              T
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-black text-slate-900 tracking-tight leading-none">Tripbone</span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Operator OS</span>
            </div>
          </div>
        )}
      </Link>

      {awaitingVerificationEmail ? (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
              <Mail className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1.5 tracking-tight">
              Verify Your Email Address
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              We have dispatched a verification link to <strong className="font-mono text-slate-900 font-bold">{awaitingVerificationEmail}</strong>.
            </p>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 mb-6 text-xs text-emerald-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Security & Account Protection</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800">
              Please check your inbox (and spam folder) and click the confirmation link to activate your workspace.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {verificationSuccessNotice && (
            <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{verificationSuccessNotice}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleCheckVerification}
              disabled={isCheckingVerification}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isCheckingVerification ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking Status...</span>
                </>
              ) : (
                <>
                  <span>I've Confirmed My Email — Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendCooldown > 0}
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {resendCooldown > 0 ? `Resend Verification Email (${resendCooldown}s)` : 'Resend Verification Email'}
            </button>
          </div>

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={async () => {
                await auth.signOut();
                setAwaitingVerificationEmail(null);
                setMode('signin');
                setError(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              ← Use a different email / Back to Login
            </button>
          </div>
        </div>
      ) : pendingSocialUser ? (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1.5 tracking-tight">
              Welcome, {pendingSocialUser.user.displayName || 'Traveler'}!
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              To connect your bookings and receive automated WhatsApp vouchers, please confirm your WhatsApp number.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleCompleteSocialProfile} className="space-y-4">
            <CountryPhoneInput
              value={phoneData}
              onChange={setPhoneData}
              required={true}
              inputBg="bg-slate-50"
              label="Country & Mobile / WhatsApp Number"
              className="border-slate-200"
            />

            <button
              type="submit"
              disabled={socialSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {socialSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Details...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup & Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate(pendingSocialUser.targetPath, { replace: true })}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              Skip for now →
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 sm:p-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-slate-900 mb-1.5 tracking-tight">
                  {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your operator account' : 'Reset password'}
                </h1>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {mode === 'signin' ? 'Sign in to access your tour operations cockpit' : mode === 'signup' ? 'Start your 7-day free trial with zero commissions' : "Enter your email address to receive a secure reset link"}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 space-y-2">
                  <p className="font-semibold">{error}</p>
                  {isCredentialError && (
                    <div className="pt-2 border-t border-rose-200/80 flex flex-col gap-1.5">
                      <Link 
                        to={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                        className="inline-flex items-center text-xs font-bold text-emerald-600 hover:underline"
                      >
                        → Reset password via secure code
                      </Link>
                      <p className="text-[11px] text-slate-500">
                        If you registered using Google Sign-In, please use the <strong>Google</strong> button below.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {resetSent ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto">
                    <Mail className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Check your email</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">We've sent a password reset link to <span className="font-bold text-slate-900 font-mono">{email}</span></p>
                  <button 
                    onClick={() => setMode('signin')}
                    className="text-emerald-600 font-bold text-xs hover:underline uppercase tracking-wider cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none transition-all text-slate-900 font-medium"
                          placeholder="Captain John Doe"
                        />
                      </div>
                    </div>
                  )}

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

                  {mode === 'signup' && (
                    <div className="pt-0.5">
                      <CountryPhoneInput
                        value={phoneData}
                        onChange={setPhoneData}
                        required={true}
                        inputBg="bg-slate-50"
                        label="Country & Mobile / WhatsApp Number"
                        className="border-slate-200"
                      />
                    </div>
                  )}

                  {mode !== 'forgot' && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center px-0.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
                        {mode === 'signin' && (
                          <Link 
                            to={email ? `/forgot-password?email=${encodeURIComponent(email)}` : '/forgot-password'}
                            className="text-[11px] font-bold text-emerald-600 hover:underline"
                          >
                            Forgot password?
                          </Link>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-2.5 text-xs focus:outline-none transition-all text-slate-900 font-medium"
                          placeholder="••••••••"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {mode === 'signup' && password && (
                        <div className="pt-1.5 px-0.5 space-y-1 animate-in fade-in duration-200">
                          <div className="flex gap-1 h-1">
                            {[1, 2, 3, 4].map((step) => {
                              const strength = getPasswordStrength(password);
                              const isActive = strength.score >= step;
                              return (
                                <div
                                  key={step}
                                  className={cn(
                                    "flex-1 rounded-full transition-colors duration-300",
                                    isActive ? strength.color : "bg-slate-200"
                                  )}
                                />
                              );
                            })}
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-slate-400">Strength:</span>
                            <span className={cn(
                              "font-bold",
                              getPasswordStrength(password).score >= 3 ? "text-emerald-600" :
                              getPasswordStrength(password).score === 2 ? "text-amber-600" : "text-rose-500"
                            )}>
                              {getPasswordStrength(password).text}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>
                        <span>{mode === 'signin' ? 'Sign in to Dashboard' : mode === 'signup' ? 'Create Free Account' : 'Send Reset Link'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

            {mode !== 'forgot' && !resetSent && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-wider">
                    <span className="bg-white px-3 text-slate-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleSocialLogin('google')}
                    className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                  >
                    <Chrome className="h-4 w-4 text-red-500" />
                    <span>Google</span>
                  </button>
                  <button 
                    onClick={() => handleSocialLogin('apple')}
                    className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                  >
                    <Apple className="h-4 w-4" />
                    <span>Apple</span>
                  </button>
                </div>
              </>
            )}

            <div className="mt-6 text-center">
              <p className="text-slate-500 text-xs">
                {mode === 'signin' ? "Don't have a workspace yet?" : "Already have an account?"}{' '}
                <button 
                  onClick={() => handleModeChange(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-emerald-600 font-bold hover:underline cursor-pointer"
                >
                  {mode === 'signin' ? 'Start Free Trial' : 'Sign In'}
                </button>
              </p>
              {mode === 'forgot' && (
                <button 
                  onClick={() => setMode('signin')}
                  className="mt-2 text-slate-400 text-xs font-medium hover:text-emerald-600 cursor-pointer"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      )}

      <Link to="/" className="mt-6 text-slate-400 text-xs font-medium hover:text-slate-700 transition-colors">
        ← Back to Tripbone Platform
      </Link>
    </div>
  );
}
