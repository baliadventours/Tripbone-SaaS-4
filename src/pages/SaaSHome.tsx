import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db, collection, getDocs, addDoc, setDoc, updateDoc, doc, auth, setActiveTenantId, serverTimestamp } from '../lib/firebase';
import { getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { formatPlanName, getPlanPrice, getNextBillingDate, getEffectiveInterval, generateInvoiceNumber } from '../lib/planUtils';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCustomToken, onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendEmailVerification } from 'firebase/auth';
import { useTenant } from '../lib/TenantContext';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../lib/SettingsContext';
import Admin from './Admin';
import TicketManager from '../components/Admin/TicketManager';
import SaaSKnowledgeBase from '../components/SaaS/SaaSKnowledgeBase';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { 
  Globe, Sparkles, Layers, ShieldCheck, ArrowRight, Check, Compass, 
  Laptop, MapPin, Mail, Calendar, LineChart, DollarSign, Database, 
  Lock, UserPlus, Building, ArrowLeft, Smartphone, Eye, CreditCard, Wallet,
  User, Settings, Key, Receipt, Copy, Plus, MessageSquare, LogOut,
  HelpCircle, EyeOff, ChevronRight, AlertTriangle, AlertCircle, X, Megaphone,
  Map, UserCheck, Briefcase, FileText, Image, Bell, Sliders, ChevronDown,
  LifeBuoy, Terminal, Clock, Moon, Sun, BookOpen, Tag, Gift, ArrowUpDown,
  Printer
} from 'lucide-react';
import { Tenant } from '../types';
import { createCreemCheckoutSession } from '../services/creemService';
import { 
  trackPostHogSignupStep, 
  trackPostHogWorkspaceProvisioned 
} from '../lib/posthog';
import { CountryPhoneInput, CountryPhoneValue } from '../components/UI/CountryPhoneInput';
import { detectUserCountry } from '../lib/countryPhoneData';

export default function SaaSHome() {
  const { setPreviewTenant } = useTenant();
  const { settings, globalBrand } = useSettings();
  const brandColor = globalBrand?.brandColor || '#1db3cd';
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [closedAnnouncements, setClosedAnnouncements] = useState<string[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [previewingInvoice, setPreviewingInvoice] = useState<any | null>(null);
  const [invoiceSort, setInvoiceSort] = useState<'latest' | 'oldest' | 'amount-desc' | 'amount-asc' | 'no-desc' | 'no-asc' | 'status'>('latest');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [step, setStep] = useState(1); // 1 = Main/Dashboard/Auth, 2 = Website Setup, 3 = Website Info, 4 = Business Address
  const [isSeeding, setIsSeeding] = useState(false);

  // New Tenant Form State
  const [formData, setFormData] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const planFromUrl = params.get('plan') as Tenant['plan'] || 'starter';
    
    return {
      companyName: '',
      slug: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      plan: planFromUrl,
      primaryColor: '#00b272',
    secondaryColor: '#030f0c',
    currency: 'USD',
    email: '',
    phone: '',
    address: '',
    country: 'United States',
    street: '',
    state: '',
    city: '',
    zip: ''
    };
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Payment integration states
  const [paymentMethod, setPaymentMethod] = useState<'creem' | 'tripay' | 'manual'>('creem');
  const [tripayChannel, setTripayChannel] = useState<string>('QRISC');
  const [manualPending, setManualPending] = useState(false);
  const [trialActivated, setTrialActivated] = useState(false);
  const [manualInstructions, setManualInstructions] = useState('');
  const [creemEnabled, setCreemEnabled] = useState<boolean>(true);
  const [tripayEnabled, setTripayEnabled] = useState<boolean>(true);
  const [manualEnabled, setManualEnabled] = useState<boolean>(true);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [ssoRedirecting, setSsoRedirecting] = useState<string | null>(null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // New Registration / OTP verification states
  const [regName, setRegName] = useState('');
  const [regPhoneData, setRegPhoneData] = useState<CountryPhoneValue>(() => {
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
  const [otpVerified, setOtpVerified] = useState<boolean>(() => {
    try {
      const stored = sessionStorage.getItem('otp_verified');
      return stored !== 'false';
    } catch {
      return true;
    }
  });
  const [otpViewActive, setOtpViewActive] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userEnteredOtp, setUserEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  
  // Sidebar states
  const [activeLeftMenu, setActiveLeftMenu] = useState('dashboard'); // 'dashboard' | 'my-site' | 'billing' | 'tickets' | 'docs' | 'profile'
  const [tenantActiveMenu, setTenantActiveMenu] = useState<string | null>('dashboard');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [operatorNameInput, setOperatorNameInput] = useState('');
  const [operatorPhoneInput, setOperatorPhoneInput] = useState('');
  const [operatorAddressInput, setOperatorAddressInput] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [showPassword, setShowPassword] = useState(false);
  const [coachmarkStep, setCoachmarkStep] = useState(1); // 1 = Active, 0 = Closed

  // Change Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Backup Codes states
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [generatingBackupCodes, setGeneratingBackupCodes] = useState(false);
  const [backupCodeSuccess, setBackupCodeSuccess] = useState<string | null>(null);
  const [backupCodeError, setBackupCodeError] = useState<string | null>(null);

  // Dark & Light design switcher state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('tripbone_saas_dark_mode') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('tripbone_saas_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const getWorkspaceStatus = (t: any): 'trial' | 'active' | 'inactive' | 'suspended' => {
    if (!t) return 'active';
    if (t.status === 'suspended') return 'suspended';
    
    const now = new Date();
    const createdDate = new Date(t.createdAt || Date.now());
    const trialEndsDate = t.trialEnds ? new Date(t.trialEnds) : new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    if (t.status === 'trial' || !t.status || t.status === 'pending') {
      if (now <= trialEndsDate) {
        return 'trial';
      }
      
      const gracePeriodEndsDate = new Date(trialEndsDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (now <= gracePeriodEndsDate) {
        return 'inactive';
      }
      
      return 'suspended';
    }
    
    if (t.status === 'inactive') {
      const gracePeriodEndsDate = new Date(trialEndsDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (now <= gracePeriodEndsDate) {
        return 'inactive';
      }
      return 'suspended';
    }
    
    return 'active';
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('tripbone_saas_dark_mode', String(next));
      return next;
    });
  };

  const [activeWorkspaceTours, setActiveWorkspaceTours] = useState<any[]>([]);
  const [activeWorkspaceBookings, setActiveWorkspaceBookings] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Auth/Auth view states
  const [authView, setAuthView] = useState<'login' | 'signup'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/signup') return 'signup';
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'signup') return 'signup';
    }
    return 'login';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/signup') {
        setAuthView('signup');
      } else if (window.location.pathname === '/login') {
        setAuthView('login');
      }
    }
  }, []);

  const getStorefrontUrl = (slug: string, customDomain?: string) => {
    if (customDomain) {
      return `https://${customDomain}`;
    }
    
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';

    const isAiStudioPlatform = 
      hostname.includes('run.app') || 
      hostname.includes('ai.studio') || 
      hostname.includes('aistudio.google.com') || 
      hostname.includes('vercel.app') || 
      hostname.includes('web.app') || 
      hostname.includes('firebaseapp.com');

    if (isAiStudioPlatform) {
      return `${protocol}//${window.location.host}/?tenant=${slug}`;
    } else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
      return `http://${slug}.tripbone.com`;
    } else {
      const cleanHost = window.location.host.replace(/^(app|www)\./, '');
      return `${protocol}//${slug}.${cleanHost}`;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setCurrentUser(usr);
      if (usr) {
        setShowDashboard(true);
      }
    });

    // Load global manual transfer instructions
    const loadGlobalSettings = async () => {
      try {
        const globalSnap = await getDoc(doc(db, 'communicationSettings', 'global'));
        if (globalSnap.exists()) {
          const data = globalSnap.data();
          if (data.manualBankInstructions) {
            setManualInstructions(data.manualBankInstructions);
          }
          const cE = data.creemEnabled !== false;
          const tE = data.tripayEnabled !== false;
          const mE = data.manualEnabled !== false;

          setCreemEnabled(cE);
          setTripayEnabled(tE);
          setManualEnabled(mE);

          // Adjust defaults if Creem is not active
          if (!cE) {
            if (tE) {
              setPaymentMethod('tripay');
              setPaymentModalMethod('tripay');
            } else if (mE) {
              setPaymentMethod('manual');
              setPaymentModalMethod('manual');
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load global settings in SaaSHome:", err);
      }
    };
    loadGlobalSettings();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const snap = await getDocs(collection(db, 'announcements'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Filter out expired if needed, or just sort by date
        const sortedList = list.sort((a: any, b: any) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA; // latest first
        });
        setAnnouncements(sortedList);
      } catch (err) {
        console.warn("Failed to fetch announcements in SaaSHome:", err);
      }
    };
    fetchAnnouncements();
  }, [currentUser]);

  const [isProvisioning, setIsProvisioning] = useState(false);

  // Upgrade Modal states
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalPlan, setUpgradeModalPlan] = useState<any>(null);
  const [upgradeModalLoading, setUpgradeModalLoading] = useState(false);

  // Invoice Payment Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<any>(null);
  const [paymentModalMethod, setPaymentModalMethod] = useState<'creem' | 'tripay' | 'manual'>('creem');
  const [paymentModalTripayChannel, setPaymentModalTripayChannel] = useState<string>('QRISC');
  const [paymentModalProofFile, setPaymentModalProofFile] = useState<File | null>(null);
  const [paymentModalProofNotes, setPaymentModalProofNotes] = useState<string>('');
  const [paymentModalLoading, setPaymentModalLoading] = useState(false);
  const [paymentModalSuccess, setPaymentModalSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Detect billing success redirect from Creem.io and Superadmin Impersonate overrides
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing_setup') === 'success') {
      const tenantSlug = params.get('tenant');
      setIsProvisioning(true);
      setShowDashboard(false);
      
      // Simulate backend provisioning delay
      setTimeout(() => {
        setIsProvisioning(false);
        setSuccess(`🎉 Provisioning Complete! Your workspace "${tenantSlug || 'new'}" is now active. You can manage it from your dashboard below.`);
        setShowDashboard(true);
        
        // --- MAILJET: Trigger Payment Success Email ---
        getDocs(collection(db, 'tenants')).then(snapshot => {
          const t = snapshot.docs.find(d => d.data().slug === tenantSlug);
          if (t) {
            const baseHost = window.location.origin;
            const newPlan = t.data().plan || 'starter';
            const amount = newPlan === 'business' ? '$199.00' : newPlan === 'professional' ? '$99.00' : newPlan === 'enterprise' ? '$499.00' : '$49.00';
            const email = auth.currentUser?.email || (t.data() as any).email || (t.data() as any).adminEmail;
            if (email) {
              fetch(`${baseHost}/api/mail/invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, plan: newPlan, amount, invoiceId: 'INV-' + Math.floor(Math.random() * 10000) })
              }).catch(e => console.warn('[Mailjet] Payment success fail', e));
            }
          }
        });
      }, 3500);
      
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('upgrade_success') === 'true') {
      const newPlan = params.get('plan');
      const newInterval = params.get('interval') || 'monthly';
      const tenantSlug = params.get('tenant');
      setSuccess(`🎉 Subscription successfully updated to ${newPlan?.toUpperCase()} (${newInterval})!`);
      
      if (tenantSlug && newPlan) {
        // Find tenant and update DB if needed, though usually backend webhooks handle it.
        // We will optimistically update the local database here for instant feedback.
        getDocs(collection(db, 'tenants')).then(snapshot => {
          const t = snapshot.docs.find(d => d.data().slug === tenantSlug);
          if (t) {
            setDoc(doc(db, 'tenants', t.id), { plan: newPlan, billingInterval: newInterval }, { merge: true });
            
            // --- MAILJET: Trigger Payment Success Email ---
            const baseHost = window.location.origin;
            const amount = newPlan === 'business' ? '$199.00' : newPlan === 'professional' ? '$99.00' : newPlan === 'enterprise' ? '$499.00' : '$49.00';
            const email = auth.currentUser?.email || (t.data() as any).email || (t.data() as any).adminEmail;
            if (email) {
              fetch(`${baseHost}/api/mail/invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, plan: newPlan, amount, invoiceId: 'INV-' + Math.floor(Math.random() * 10000) })
              }).catch(e => console.warn('[Mailjet] Payment success fail', e));
            }
          }
        });
      }
      window.history.replaceState({}, '', window.location.pathname);
    }

    const impersonateId = params.get('impersonate');
    if (impersonateId) {
      setSelectedWorkspaceId(impersonateId);
      setTenantActiveMenu('dashboard');
      setActiveLeftMenu('tenant-console');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Check for email verification link parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const confirmTenantId = params.get('confirmTenantId');
    if (confirmTenantId) {
      const performConfirmation = async () => {
        try {
          await setDoc(doc(db, 'tenants', confirmTenantId), {
            emailVerified: true
          }, { merge: true });
          
          setSuccess("✨ Your email address has been successfully confirmed and verified! Your account and workspace are now fully activated.");
          
          // Refresh tenants state list
          const querySnapshot = await getDocs(collection(db, 'tenants'));
          const tenantList: Tenant[] = [];
          querySnapshot.forEach((docSnap) => {
            tenantList.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          setTenants(tenantList);
          
          // Clean URL parameter
          window.history.replaceState({}, '', window.location.pathname);
        } catch (err: any) {
          console.error("Failed to verify email address:", err);
          setError("Failed to verify email address. Please make sure the link is correct or verify manually.");
        }
      };
      performConfirmation();
    }
  }, [db]);

  // Fetch and subscribe to registered tenants and metadata in real time
  useEffect(() => {
    setLoadingTenants(true);

    // Subscribe to real-time tenants updates
    const unsubTenants = onSnapshot(collection(db, 'tenants'), (snapshot) => {
      const tenantList: Tenant[] = [];
      snapshot.forEach((docSnap) => {
        tenantList.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      setTenants(tenantList);
      setLoadingTenants(false);
    }, (err) => {
      console.warn("Realtime tenants listener warning:", err);
      setLoadingTenants(false);
    });

    // Subscribe to real-time invoices updates
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const invList: any[] = [];
      snapshot.forEach(snap => invList.push({ id: snap.id, ...snap.data() }));
      setInvoices(invList);
    }, (err) => {
      console.warn("Realtime invoices listener warning:", err);
    });

    // Subscribe to real-time billing plans
    const unsubPlans = onSnapshot(collection(db, 'billingPlans'), (snapshot) => {
      const plansList: any[] = [];
      snapshot.forEach((snap) => {
        const data = snap.data();
        plansList.push({ id: snap.id, ...data, interval: data.interval || 'monthly' });
      });
      if (plansList.length > 0) {
        setPlans(plansList);
      }
    }, (err) => {
      console.warn("Realtime billing plans listener warning:", err);
    });

    return () => {
      unsubTenants();
      unsubInvoices();
      unsubPlans();
    };
  }, []);

  const handleLaunchSSO = async (tenantSlug: string, customDomain?: string, redirectPath?: string) => {
    const userObj = auth.currentUser || currentUser;
    if (!userObj) return;
    setSsoRedirecting(tenantSlug);
    setError(null);
    try {
      const idToken = typeof userObj.getIdToken === 'function' ? await userObj.getIdToken() : (auth.currentUser ? await auth.currentUser.getIdToken() : '');
      
      const res = await fetch('/api/auth/sso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ tenantSlug, customDomain })
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to generate single sign-on redirect.');
      }

      let targetUrl = data.url;
      if (redirectPath) {
        targetUrl += `&redirect=${encodeURIComponent(redirectPath)}`;
      }

      console.log(`[SaaSHome] Opening SSO URL in new tab: ${targetUrl}`);
      const a = document.createElement('a');
      a.href = targetUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setSsoRedirecting(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Single Sign-On authentication failed.');
      setSsoRedirecting(null);
    }
  };

  const sendOtpEmail = async (email: string, code: string) => {
    try {
      console.log(`[SaaSHome] Dispatching secure OTP to: ${email}`);
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp: code })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error("Failed to send OTP email:", data.error || "Unknown error");
      } else {
        console.log("OTP email sent successfully via backend!");
      }
    } catch (err) {
      console.error("Failed to send OTP email:", err);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    setError(null);
    try {
      sessionStorage.setItem('otp_verified', 'true');
      setOtpVerified(true);
      setOtpViewActive(false);

      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      
      if (userCred.user) {
        try {
          await setDoc(doc(db, 'users', userCred.user.uid), {
            uid: userCred.user.uid,
            email: userCred.user.email,
            displayName: userCred.user.displayName || 'Operator',
            photoURL: userCred.user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userCred.user.displayName || 'O')}`,
            phoneNumber: regPhoneData.phone || '',
            whatsapp: regPhoneData.whatsapp || regPhoneData.phone || '',
            country: regPhoneData.country || 'United States',
            countryCode: regPhoneData.countryCode || 'US',
            dialCode: regPhoneData.dialCode || '+1',
            role: 'admin',
            status: 'active',
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (e) {
          console.warn("[Google Signup] Profile sync failed:", e);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const translateFirebaseError = (err: any): string => {
    const code = err.code || '';
    const msg = err.message || '';
    if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
      return 'This email address is already registered in Firebase Authentication. Please click "Log In" at the bottom to sign in with your password, or sign in using Google.';
    }
    if (code === 'auth/invalid-credential' || msg.includes('invalid-credential')) {
      return 'Incorrect email address or password. Please verify your credentials and try again.';
    }
    if (code === 'auth/weak-password' || msg.includes('weak-password')) {
      return 'Password is too weak. Please use a password with at least 6 characters.';
    }
    if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
      return 'Invalid email address format. Please check your spelling.';
    }
    return err.message || 'An unexpected authentication error occurred.';
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    const entered = userEnteredOtp.trim().toUpperCase();

    if (entered === generatedOtp) {
      sessionStorage.setItem('otp_verified', 'true');
      setOtpVerified(true);
      setSuccess("OTP Verified successfully! Welcome back.");
    } else {
      // Check if it's an 8-character backup code (optional formatting with hyphen)
      let checkCode = entered;
      if (entered.length === 8 && !entered.includes('-')) {
        checkCode = `${entered.slice(0, 4)}-${entered.slice(4)}`;
      }

      if (currentUser) {
        try {
          const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const codes: string[] = userData.backupCodes || [];

            if (codes.includes(checkCode)) {
              // Consume backup code
              const updatedCodes = codes.filter(c => c !== checkCode);
              await updateDoc(doc(db, 'users', currentUser.uid), {
                backupCodes: updatedCodes
              });

              setBackupCodes(updatedCodes);
              sessionStorage.setItem('otp_verified', 'true');
              setOtpVerified(true);
              setSuccess("Emergency backup code verified successfully! Welcome back.");
              return;
            }
          }
        } catch (backupErr: any) {
          console.error("Error verifying backup code:", backupErr);
        }
      }
      setOtpError("Incorrect 6-digit verification code or invalid backup code. Please verify and try again.");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError(null);
    try {
      sessionStorage.setItem('otp_verified', 'true');
      setOtpVerified(true);
      setOtpViewActive(false);

      // Verify credentials via Firebase Auth
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      console.error(err);
      setError(translateFirebaseError(err));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!regPhoneData.rawPhone.trim()) {
      setError("Please enter your mobile or WhatsApp number.");
      return;
    }
    setLoginLoading(true);
    setError(null);
    try {
      // Mark verified immediately so onAuthStateChanged does not flash OTP gate
      sessionStorage.setItem('otp_verified', 'true');
      setOtpVerified(true);
      setOtpViewActive(false);

      // Create user profile in Firebase Auth
      const usrCredential = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
      setCurrentUser(usrCredential.user);
      
      // Store user profile with Phone, WhatsApp & Country in Firestore
      try {
        await setDoc(doc(db, 'users', usrCredential.user.uid), {
          uid: usrCredential.user.uid,
          email: loginEmail,
          displayName: regName.trim(),
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(regName.trim())}`,
          phoneNumber: regPhoneData.phone,
          whatsapp: regPhoneData.whatsapp || regPhoneData.phone,
          country: regPhoneData.country,
          countryCode: regPhoneData.countryCode,
          dialCode: regPhoneData.dialCode,
          role: 'customer',
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (profileErr) {
        console.warn("[SaaS Signup] Failed to write profile to Firestore:", profileErr);
      }

      // Send Tripbone Branded Welcome & Verification Emails via Mailjet API
      try {
        const baseHost = window.location.origin;
        fetch(`${baseHost}/api/mail/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, name: regName.trim() || 'Traveler' })
        }).catch(e => console.warn('[Mailjet] Welcome fail', e));

        fetch(`${baseHost}/api/mail/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail })
        }).catch(e => console.warn('[Mailjet] Verify fail', e));
      } catch (verErr) {
        console.warn("[SaaS Signup] Failed to trigger verification email:", verErr);
      }

      // Populate form data
      setFormData(prev => ({
        ...prev,
        adminEmail: loginEmail,
        adminName: regName.trim(),
        adminPassword: loginPassword,
        phone: regPhoneData.phone,
        country: regPhoneData.country,
        email: loginEmail
      }));
      
      // Track signup funnel step 1 in PostHog
      trackPostHogSignupStep({
        step: 1,
        email: loginEmail,
        plan: formData.plan || 'starter',
        method: 'email_password'
      });

      const isSuperAdminEmail = ['baliadventours@gmail.com', 'admin@tripbone.com', 'kuotabox@gmail.com'].includes(loginEmail.toLowerCase());
      if (isSuperAdminEmail) {
        setStep(2);
      } else {
        setStep(1); // Keep at step 1 email verification gate
      }
    } catch (err: any) {
      console.error(err);
      setError(translateFirebaseError(err));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'slug') {
      const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, slug: cleaned }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRegisterTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProvisioning) return;
    setError(null);

    const reservedSubdomains = [
      'www', 'app', 'api', 'mail', 'secure', 'billing', 'support', 
      'status', 'portal', 'superadmin', 'main', 'dev', 'staging', 
      'test', 'admin', 'supplier', 'agent', 'dashboard'
    ];
    if (reservedSubdomains.includes(formData.slug)) {
      setError(`Workspace slug "${formData.slug}" is a reserved subdomain keyword. Please choose another.`);
      return;
    }

    const exists = tenants.some(t => t.slug === formData.slug);
    if (exists) {
      setError(`Workspace slug "${formData.slug}" is already taken. Please choose another.`);
      return;
    }

    try {
      setIsProvisioning(true);
      setSuccess('Submitting workspace provisioning request to secure backend...');
      
      const constructedAddress = `${formData.street}, ${formData.city}, ${formData.state} ${formData.zip}, ${formData.country}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      const userObj = auth.currentUser || currentUser;
      if (userObj && typeof userObj.getIdToken === 'function') {
        try {
          const idToken = await userObj.getIdToken();
          headers['Authorization'] = `Bearer ${idToken}`;
        } catch (tokenErr) {
          console.warn('[Provisioning] Could not fetch ID token:', tokenErr);
        }
      }

      const response = await fetch('/api/provision-workspace', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          companyName: formData.companyName,
          slug: formData.slug,
          adminName: formData.adminName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Admin',
          adminEmail: formData.adminEmail || currentUser?.email || '',
          adminPassword: formData.adminPassword || '',
          plan: formData.plan,
          billingInterval: billingInterval,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          currency: formData.currency,
          email: formData.adminEmail || currentUser?.email || '',
          phone: formData.phone || regPhoneData.phone || '',
          whatsapp: regPhoneData.whatsapp || formData.phone || regPhoneData.phone || '',
          country: formData.country || regPhoneData.country || 'United States',
          countryCode: regPhoneData.countryCode || 'US',
          dialCode: regPhoneData.dialCode || '+1',
          address: constructedAddress
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to provision workspace.');
      }

      // Authenticate session
      try {
        if (result.customToken) {
          await signInWithCustomToken(auth, result.customToken);
        } else if (!currentUser && formData.adminEmail && formData.adminPassword) {
          await signInWithEmailAndPassword(auth, formData.adminEmail, formData.adminPassword);
        }
      } catch (authErr) {
        console.warn('SSO token authentication failure fallback:', authErr);
      }

      const productPlan = formData.plan || 'starter';
      const matchedPlans = plans.filter(p => p.slug === productPlan && p.isActive);
      const matchedPlan = matchedPlans.find(p => p.interval === billingInterval) || matchedPlans[0];
      const productId = matchedPlan?.productId || 'prod_starter_123';
      
      const host = window.location.host;
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : '';
      
      let successUrl = '';
      const isAiStudioPlatform = 
        host.includes('run.app') || 
        host.includes('ai.studio') || 
        host.includes('aistudio.google.com') || 
        host.includes('vercel.app') || 
        host.includes('web.app') || 
        host.includes('firebaseapp.com');

      if (isAiStudioPlatform) {
        successUrl = `${protocol}//${host}/?billing_setup=success&tenant=${formData.slug}`;
      } else if (host.includes('localhost') || host.includes('127.0.0.1')) {
        successUrl = `http://localhost${port}/?billing_setup=success&tenant=${formData.slug}`;
      } else {
        successUrl = `${protocol}//app.${host.replace('app.', '')}/?billing_setup=success&tenant=${formData.slug}`;
      }

      // Automatically activate 0 payment 7-day trial and write initial SaaS invoice to Firestore!
      const newTenantId = result.tenantId || `tenant_${formData.slug}`;
      const calculatedPrice = getPlanPrice(formData.plan || 'starter', billingInterval, plans);
      const formattedName = formatPlanName(formData.plan || 'starter', plans, billingInterval);
      const generatedNo = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
      const invId = `${newTenantId}_${generatedNo}`;
      const isLife = billingInterval === 'lifetime';

      try {
        await setDoc(doc(db, 'invoices', invId), {
          id: invId,
          tenantId: newTenantId,
          tenantName: formData.companyName,
          no: generatedNo,
          invoiceNumber: generatedNo,
          invoiceDate: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
          dueDate: isLife ? 'Lifetime Access' : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
          amount: `$${calculatedPrice}.00`,
          paidAmount: '$0.00',
          balanceDue: `$${calculatedPrice}.00`,
          status: 'UNPAID',
          plan: `${formattedName} (${billingInterval.toUpperCase()})`,
          planSlug: formData.plan || 'starter',
          billingInterval: billingInterval,
          type: 'saas_subscription',
          isTrialInvoice: true,
          trialEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          customer: {
            name: formData.companyName,
            email: formData.adminEmail || currentUser?.email || ''
          },
          paymentMethod: 'Instant Card / Bank Transfer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (invErr) {
        console.warn("Direct Firestore initial invoice creation notice:", invErr);
      }

      trackPostHogWorkspaceProvisioned({
        slug: formData.slug,
        companyName: formData.companyName,
        plan: formData.plan || 'starter',
        billingInterval,
        currency: formData.currency || 'USD'
      });

      setSuccess(null);
      setTrialActivated(true);
      setIsProvisioning(false);
      return;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error provisioning workspace. Please try again.');
      setSuccess(null);
      setIsProvisioning(false);
    }
  };

  const seedDemoTenants = async () => {
    setIsSeeding(true);
    setError(null);
    try {
      const demoTenants = [
        {
          id: 'tenant_bali_adventours',
          companyName: 'Bali Adventours',
          slug: 'baliadventours',
          plan: 'business',
          status: 'active',
          primaryColor: '#00b272',
          secondaryColor: '#030f0c',
          currency: 'USD',
          email: 'info@baliadventours.com',
          phone: '+62 812-3456-789',
          address: 'Jalan Raya Ubud No. 45, Ubud, Gianyar, Bali',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const t of demoTenants) {
        await setDoc(doc(db, 'tenants', t.id), t);
      }

      setSuccess('Demo workspace environments seeded successfully!');
      // Reload
      const querySnapshot = await getDocs(collection(db, 'tenants'));
      const tenantList: Tenant[] = [];
      querySnapshot.forEach((docSnap) => {
        tenantList.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      setTenants(tenantList);
    } catch (err: any) {
      setError('Seeding failed: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const userWorkspaces = currentUser
    ? tenants.filter(t => 
        (t as any).adminEmail?.toLowerCase() === currentUser.email?.toLowerCase() ||
        (t as any).email?.toLowerCase() === currentUser.email?.toLowerCase()
      )
    : [];

  const activeWorkspace = useMemo(() => {
    if (selectedWorkspaceId) {
      return userWorkspaces.find(w => w.id === selectedWorkspaceId) || userWorkspaces[0] || null;
    }
    return userWorkspaces[0] || null;
  }, [userWorkspaces, selectedWorkspaceId]);

  const workspaceLimits = useMemo(() => {
    if (!activeWorkspace) return { maxTours: 10, maxBookings: 25 };
    
    // Check if custom limits exist on activeWorkspace
    const customTours = (activeWorkspace as any).maxTours ?? (activeWorkspace as any).tourQuota;
    const customBookings = (activeWorkspace as any).maxBookings ?? (activeWorkspace as any).bookingQuota;
    if (customTours !== undefined && customBookings !== undefined) {
      return { maxTours: customTours, maxBookings: customBookings };
    }

    // Normalize plan slug
    const fullPlanSlug = (activeWorkspace.plan || 'starter').toLowerCase();
    const planSlug = fullPlanSlug.split('-')[0];
    const interval = getEffectiveInterval(activeWorkspace.plan, activeWorkspace.billingInterval);
    
    // Find matching plan in state 'plans'
    let matchedPlan = plans.find(p => p.slug?.toLowerCase() === fullPlanSlug);
    if (!matchedPlan) {
      matchedPlan = plans.find(p => p.slug?.toLowerCase() === planSlug && (p.interval || 'monthly').toLowerCase() === interval);
    }
    if (!matchedPlan) {
      matchedPlan = plans.find(p => p.slug?.toLowerCase() === planSlug);
    }
    
    let maxTours: number | string = customTours ?? 10;
    let maxBookings: number | string = customBookings ?? 25;
    
    if (matchedPlan) {
      if (typeof matchedPlan.maxTours === 'number' || matchedPlan.maxTours === 'Unlimited') {
        maxTours = matchedPlan.maxTours;
      } else if (matchedPlan.features) {
        const featureStr = matchedPlan.features?.find((f: any) => typeof f === 'string' && f.toLowerCase().includes('tours'));
        const match = featureStr?.match(/\d+/);
        if (match) maxTours = parseInt(match[0]);
        else if (featureStr?.toLowerCase().includes('unlimited')) maxTours = 'Unlimited';
        else {
          if (planSlug === 'professional') maxTours = 50;
          else if (planSlug === 'business') maxTours = 100;
          else if (planSlug === 'enterprise') maxTours = 'Unlimited';
          else maxTours = 10;
        }
      } else {
        if (planSlug === 'professional') maxTours = 50;
        else if (planSlug === 'business') maxTours = 100;
        else if (planSlug === 'enterprise') maxTours = 'Unlimited';
        else maxTours = 10;
      }
      
      if (typeof matchedPlan.maxBookings === 'number' || matchedPlan.maxBookings === 'Unlimited') {
        maxBookings = matchedPlan.maxBookings;
      } else if (matchedPlan.features) {
        const featureStr = matchedPlan.features?.find((f: any) => typeof f === 'string' && f.toLowerCase().includes('bookings'));
        const match = featureStr?.match(/\d+/);
        if (match) maxBookings = parseInt(match[0]);
        else if (featureStr?.toLowerCase().includes('unlimited')) maxBookings = 'Unlimited';
        else {
          if (planSlug === 'professional') maxBookings = 500;
          else if (planSlug === 'business') maxBookings = 2000;
          else if (planSlug === 'enterprise') maxBookings = 'Unlimited';
          else maxBookings = 25;
        }
      } else {
        if (planSlug === 'professional') maxBookings = 500;
        else if (planSlug === 'business') maxBookings = 2000;
        else if (planSlug === 'enterprise') maxBookings = 'Unlimited';
        else maxBookings = 25;
      }
    } else {
      if (planSlug === 'professional') {
        maxTours = 50;
        maxBookings = 500;
      } else if (planSlug === 'business') {
        maxTours = 100;
        maxBookings = 2000;
      } else if (planSlug === 'enterprise') {
        maxTours = 'Unlimited';
        maxBookings = 'Unlimited';
      } else {
        maxTours = 10;
        maxBookings = 25;
      }
    }
    
    return { 
      maxTours: customTours !== undefined ? customTours : maxTours, 
      maxBookings: customBookings !== undefined ? customBookings : maxBookings 
    };
  }, [activeWorkspace, plans]);

  const dateActiveStr = useMemo(() => {
    if (!activeWorkspace) return 'N/A';
    const createdAtStr = activeWorkspace.createdAt;
    if (!createdAtStr) return 'N/A';
    const d = new Date(createdAtStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [activeWorkspace]);

  const dueDateStr = useMemo(() => {
    if (!activeWorkspace) return 'N/A';
    
    const effectiveInterval = getEffectiveInterval(activeWorkspace.plan, activeWorkspace.billingInterval);
    if (effectiveInterval === 'lifetime') return 'Lifetime Access';

    const s = getWorkspaceStatus(activeWorkspace);
    let createdAtStr = activeWorkspace.createdAt;
    const d = createdAtStr ? new Date(createdAtStr) : new Date();
    
    if (s === 'trial') {
      let trialEndsDate = activeWorkspace.trialEnds ? new Date(activeWorkspace.trialEnds) : null;
      if (!trialEndsDate || isNaN(trialEndsDate.getTime())) {
        trialEndsDate = new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      return trialEndsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' (Trial Ends)';
    }
    
    if (s === 'inactive') {
      let trialEndsDate = activeWorkspace.trialEnds ? new Date(activeWorkspace.trialEnds) : null;
      if (!trialEndsDate || isNaN(trialEndsDate.getTime())) {
        trialEndsDate = new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      return trialEndsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' (Payment Overdue)';
    }

    if (isNaN(d.getTime())) return 'Active';
    
    const now = new Date();
    let nextBilling = new Date(d);
    
    let safetyCounter = 0;
    while (nextBilling <= now && safetyCounter < 100) {
      safetyCounter++;
      if (billingInterval === 'annual') {
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      } else {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      }
    }
    
    return nextBilling.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [activeWorkspace]);

  // Auto seed initial invoice in Firestore if workspace has no invoices in DB
  useEffect(() => {
    if (!activeWorkspace || loadingTenants) return;
    const activeWsId = activeWorkspace.id;
    const existingInvoices = invoices.filter(inv => inv.tenantId === activeWsId);

    if (existingInvoices.length === 0) {
      const generatedNo = generateInvoiceNumber({ tenantId: activeWsId }, activeWorkspace, tenants);
      const invId = `${activeWsId}_${generatedNo}`;
      const createdDate = activeWorkspace.createdAt ? new Date(activeWorkspace.createdAt) : new Date();
      const trialEndsDate = activeWorkspace.trialEnds ? new Date(activeWorkspace.trialEnds) : new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const planName = formatPlanName(activeWorkspace.plan, plans, activeWorkspace.billingInterval);
      const planPrice = getPlanPrice(activeWorkspace.plan, activeWorkspace.billingInterval, plans);

      const isLifetime = activeWorkspace.billingInterval === 'lifetime' || String(activeWorkspace.plan || '').toLowerCase().includes('lifetime');
      const dueDateVal = isLifetime ? 'Lifetime Access' : trialEndsDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

      const initialInvoice = {
        id: invId,
        tenantId: activeWsId,
        tenantName: activeWorkspace.companyName || 'Operator Workspace',
        no: generatedNo,
        invoiceDate: createdDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        dueDate: dueDateVal,
        amount: `$${planPrice}.00`,
        status: activeWorkspace.status === 'active' ? 'PAID' : activeWorkspace.manualPaymentPending ? 'PENDING' : 'UNPAID',
        plan: planName,
        billingInterval: activeWorkspace.billingInterval || 'monthly',
        paymentMethod: activeWorkspace.manualPaymentPending ? 'Manual Bank Transfer' : 'Card / Sandbox Gate',
        createdAt: activeWorkspace.createdAt || new Date().toISOString()
      };

      setDoc(doc(db, 'invoices', invId), initialInvoice, { merge: true }).catch(err => {
        console.error("Error auto-seeding invoice:", err);
      });
    }
  }, [activeWorkspace, invoices, loadingTenants, plans, tenants]);

  // Auto-repair effect for existing tenants that have lifetime plans/invoices missing billingInterval
  useEffect(() => {
    if (!tenants || tenants.length === 0) return;
    tenants.forEach((t) => {
      const isDianaOr1999 = t.slug === 'dianatour' || t.companyName === 'Diana Tour' || (t.plan || '').toLowerCase().includes('lifetime');
      if (isDianaOr1999 && t.billingInterval !== 'lifetime') {
        console.log(`[Auto-Repair] Repairing workspace ${t.id} (${t.companyName}) billingInterval to lifetime`);
        setDoc(doc(db, 'tenants', t.id), { billingInterval: 'lifetime' }, { merge: true }).catch(console.error);
        const generatedNo = generateInvoiceNumber({ tenantId: t.id }, t, tenants);
        const invId = `${t.id}_${generatedNo}`;
        setDoc(doc(db, 'invoices', invId), {
          plan: 'Business Lifetime',
          billingInterval: 'lifetime',
          amount: '$1999.00',
          dueDate: 'Lifetime Access'
        }, { merge: true }).catch(console.error);
      }
    });
  }, [tenants]);

  const getDynamicInvoices = useMemo(() => {
    if (!activeWorkspace) return [];

    const matchIds = new Set<string>();
    if (activeWorkspace.id) {
      matchIds.add(String(activeWorkspace.id));
      matchIds.add(String(activeWorkspace.id).replace(/^tenant_/, ''));
      if (!String(activeWorkspace.id).startsWith('tenant_')) {
        matchIds.add(`tenant_${activeWorkspace.id}`);
      }
    }
    if (activeWorkspace.slug) {
      matchIds.add(String(activeWorkspace.slug));
      matchIds.add(`tenant_${activeWorkspace.slug}`);
    }
    const matchArr = Array.from(matchIds).filter(Boolean);
    const compName = (activeWorkspace.companyName || '').toLowerCase().trim();

    let dbInvoices = invoices.filter(inv => {
      const invTenantId = inv.tenantId || inv.tenant || inv.tenant_id;
      const invDocId = inv.id || '';
      const invCompName = (inv.tenantName || '').toLowerCase().trim();

      return matchArr.includes(invTenantId) ||
             matchArr.some(cid => invDocId.startsWith(cid + '_') || invDocId === cid) ||
             (compName && invCompName && compName === invCompName);
    });

    if (dbInvoices.length === 0) {
      const interval = activeWorkspace.billingInterval || 'monthly';
      const isLifetime = interval === 'lifetime' || (activeWorkspace.plan || '').toLowerCase().includes('lifetime');
      const planPrice = getPlanPrice(activeWorkspace.plan, interval, plans);
      const generatedNo = generateInvoiceNumber({ tenantId: activeWorkspace.id }, activeWorkspace, tenants);
      const invId = `${activeWorkspace.id || activeWorkspace.slug}_${generatedNo}`;
      const dueStr = isLifetime ? 'Lifetime Access' : (activeWorkspace.trialEnds ? new Date(activeWorkspace.trialEnds).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'In 7 Days');
      
      const syntheticInvoice = {
        id: invId,
        tenantId: activeWorkspace.id || `tenant_${activeWorkspace.slug}`,
        tenantName: activeWorkspace.companyName || 'Operator Workspace',
        no: generatedNo,
        plan: formatPlanName(activeWorkspace.plan, plans, interval),
        billingInterval: interval,
        amount: `$${planPrice}.00`,
        status: (activeWorkspace.status === 'active' && !activeWorkspace.trialEnds) ? 'PAID' : 'UNPAID',
        dueDate: dueStr,
        invoiceDate: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        paymentMethod: 'Card / Sandbox Gate',
        createdAt: activeWorkspace.createdAt || new Date().toISOString()
      };

      dbInvoices = [syntheticInvoice];
    }

    const parseAmt = (val: any) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
      return isNaN(num) ? 0 : num;
    };

    const parseNum = (inv: any) => {
      const str = String(inv.no || inv.id || '');
      const m = str.match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    };

    return [...dbInvoices].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.invoiceDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.invoiceDate || 0).getTime();

      if (invoiceSort === 'latest') {
        return dateB - dateA;
      } else if (invoiceSort === 'oldest') {
        return dateA - dateB;
      } else if (invoiceSort === 'amount-desc') {
        return parseAmt(b.amount) - parseAmt(a.amount);
      } else if (invoiceSort === 'amount-asc') {
        return parseAmt(a.amount) - parseAmt(b.amount);
      } else if (invoiceSort === 'no-desc') {
        return parseNum(b) - parseNum(a);
      } else if (invoiceSort === 'no-asc') {
        return parseNum(a) - parseNum(b);
      } else if (invoiceSort === 'status') {
        return String(a.status || '').localeCompare(String(b.status || ''));
      }
      return dateB - dateA;
    });
  }, [activeWorkspace, invoices, invoiceSort, plans]);

  // Ensure an invoice is auto-generated and stored in Firestore for the active workspace if missing
  useEffect(() => {
    if (!activeWorkspace) return;
    const wsId = activeWorkspace.id || activeWorkspace.slug;
    const hasInvoice = invoices.some(inv => 
      inv.tenantId === wsId || 
      inv.tenantId === `tenant_${wsId}` || 
      inv.tenantId === activeWorkspace.slug ||
      (inv.id && (inv.id.startsWith(wsId + '_') || inv.id.startsWith(`tenant_${activeWorkspace.slug}_`)))
    );

    if (!hasInvoice) {
      const generateMissingInvoice = async () => {
        try {
          const effTenantId = wsId.startsWith('tenant_') ? wsId : `tenant_${activeWorkspace.slug || wsId}`;
          const interval = activeWorkspace.billingInterval || 'monthly';
          const isLifetime = interval === 'lifetime' || (activeWorkspace.plan || '').toLowerCase().includes('lifetime');
          const planPrice = getPlanPrice(activeWorkspace.plan, interval, plans);
          const generatedNo = generateInvoiceNumber({ tenantId: effTenantId }, activeWorkspace, tenants);
          const invId = `${effTenantId}_${generatedNo}`;
          const dueStr = isLifetime ? 'Lifetime Access' : (activeWorkspace.trialEnds ? new Date(activeWorkspace.trialEnds).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'In 7 Days');
          
          const invData = {
            id: invId,
            tenantId: effTenantId,
            tenantName: activeWorkspace.companyName || 'Operator Workspace',
            no: generatedNo,
            plan: formatPlanName(activeWorkspace.plan, plans, interval),
            billingInterval: interval,
            amount: `$${planPrice}.00`,
            status: (activeWorkspace.status === 'active' && !activeWorkspace.trialEnds) ? 'PAID' : 'UNPAID',
            dueDate: dueStr,
            invoiceDate: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
            paymentMethod: 'Card / Sandbox Gate',
            createdAt: activeWorkspace.createdAt || new Date().toISOString()
          };

          try {
            await setDoc(doc(db, 'invoices', invId), invData, { merge: true });
          } catch (e) {}

          await fetch('/api/tenant/generate-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId: effTenantId,
              companyName: activeWorkspace.companyName || 'Operator Workspace',
              plan: activeWorkspace.plan || 'starter',
              billingInterval: interval,
              trialEnds: activeWorkspace.trialEnds
            })
          });
        } catch (e) {
          console.warn("[SaaSHome] Auto generate missing invoice note:", e);
        }
      };

      generateMissingInvoice();
    }
  }, [activeWorkspace, invoices, plans]);

  useEffect(() => {
    if (!activeWorkspace) {
      setActiveWorkspaceTours([]);
      setActiveWorkspaceBookings([]);
      return;
    }

    const workspaceAny = activeWorkspace as any;
    const idsToMatch = new Set([
      activeWorkspace.id,
      activeWorkspace.slug,
      activeWorkspace.customDomain,
      workspaceAny.uid,
      workspaceAny.email
    ].filter(Boolean));

    setLoadingStats(true);

    let unsubTours = () => {};
    let unsubBookings = () => {};

    if (activeWorkspace?.id) {
      try {
        const qTours = query(collection(db, 'tours'), where('tenantId', '==', activeWorkspace.id));
        unsubTours = onSnapshot(qTours, (snapshot) => {
          const toursList: any[] = [];
          snapshot.forEach((docSnap) => {
            toursList.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          setActiveWorkspaceTours(toursList);
          setLoadingStats(false);
        }, (err) => {
          console.warn('Tenant tours query notice:', err.message);
          setLoadingStats(false);
        });
      } catch (e) {
        setLoadingStats(false);
      }

      try {
        const qBookings = query(collection(db, 'bookings'), where('tenantId', '==', activeWorkspace.id));
        unsubBookings = onSnapshot(qBookings, (snapshot) => {
          const bookingsList: any[] = [];
          snapshot.forEach((docSnap) => {
            bookingsList.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          setActiveWorkspaceBookings(bookingsList);
        }, (err) => {
          console.warn('Tenant bookings query notice:', err.message);
        });
      } catch (e) {
        console.warn('Bookings listener catch:', e);
      }
    } else {
      setLoadingStats(false);
    }

    return () => {
      unsubTours();
      unsubBookings();
    };
  }, [activeWorkspace?.id, activeWorkspace?.slug, activeWorkspace?.customDomain]);

  const handleSaveCustomDomain = async () => {
    if (!activeWorkspace) return;
    try {
      await setDoc(doc(db, 'tenants', activeWorkspace.id), {
        ...activeWorkspace,
        customDomain: customDomainInput
      }, { merge: true });
      
      // Update tenants state locally
      setTenants(prev => prev.map(t => t.id === activeWorkspace.id ? { ...t, customDomain: customDomainInput } : t));
      setSuccess('🎉 Custom Domain successfully updated in the database!');
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to update Custom Domain: ' + err.message);
      setSuccess(null);
    }
  };

  const handleSavePlan = (pkg: any) => {
    if (!activeWorkspace) return;
    setUpgradeModalPlan(pkg);
    setUpgradeModalOpen(true);
  };

  const confirmUpgrade = async () => {
    if (!upgradeModalPlan || !activeWorkspace) return;
    setUpgradeModalLoading(true);
    
    const currentPlanObj = plans.find(p => p.slug.toLowerCase() === (activeWorkspace.plan || 'starter').toLowerCase() && p.interval === (activeWorkspace.billingInterval || 'monthly'));
    const currentPrice = currentPlanObj?.price || 0;
    const newPrice = upgradeModalPlan.price || 0;
    const priceDiff = newPrice - currentPrice;

    if (priceDiff <= 0 || activeWorkspace.status === 'trial') {
      try {
        let saved = false;
        try {
          await setDoc(doc(db, 'tenants', activeWorkspace.id), {
            plan: upgradeModalPlan.slug,
            billingInterval: upgradeModalPlan.interval || 'monthly',
            updatedAt: new Date().toISOString()
          }, { merge: true });
          saved = true;
        } catch (fsErr: any) {
          console.warn("Direct Firestore update warning (using server API):", fsErr.message);
        }

        // Call server API to guarantee update and sync invoice
        const res = await fetch('/api/tenant/update-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: activeWorkspace.id,
            plan: upgradeModalPlan.slug,
            billingInterval: upgradeModalPlan.interval || 'monthly'
          })
        });

        const resData = await res.json();
        if (!saved && (!res.ok || !resData.success)) {
          throw new Error(resData.error || 'Failed to update subscription plan.');
        }
        
        setTenants(prev => prev.map(t => t.id === activeWorkspace.id ? { 
          ...t, 
          plan: upgradeModalPlan.slug, 
          billingInterval: upgradeModalPlan.interval || 'monthly' 
        } : t));
        
        // Also update local invoices state so trial invoice reflects new plan
        setInvoices(prev => prev.map(inv => inv.tenantId === activeWorkspace.id && inv.status !== 'PAID' ? {
          ...inv,
          plan: `${upgradeModalPlan.name || upgradeModalPlan.slug} (${(upgradeModalPlan.interval || 'monthly').toUpperCase()})`,
          amount: `$${upgradeModalPlan.price || 0}.00`
        } : inv));

        setSuccess(`🎉 Successfully updated subscription plan to ${upgradeModalPlan.slug.toUpperCase()}!`);
        setUpgradeModalOpen(false);
      } catch (err: any) {
        console.error(err);
        setError('Failed to update subscription plan: ' + err.message);
      }
      setUpgradeModalLoading(false);
      return;
    }

    try {
      if (!currentUser) throw new Error('Not authenticated');
      const productId = upgradeModalPlan.creemProductId || upgradeModalPlan.productId || upgradeModalPlan.creem_product_id || upgradeModalPlan.id || 'default_product'; 
      const email = currentUser.email || '';
      
      const successUrl = `${window.location.origin}/?upgrade_success=true&tenant=${activeWorkspace.slug}&plan=${upgradeModalPlan.slug}&interval=${upgradeModalPlan.interval || 'monthly'}`;
      
      try {
        const session = await createCreemCheckoutSession({
          productId,
          successUrl,
          email,
          tenantId: activeWorkspace.id
        });
        
        if (session && session.url) {
          window.location.href = session.url;
          return;
        }
      } catch (creemErr) {
        console.warn("Creem checkout session notice, launching sandbox checkout:", creemErr);
      }

      // Safe fallback to mock sandbox checkout
      const fallbackUrl = `/api/billing/mock-checkout?productId=${encodeURIComponent(upgradeModalPlan.slug)}&tenantId=${encodeURIComponent(activeWorkspace.id)}&billingInterval=${encodeURIComponent(upgradeModalPlan.interval || 'monthly')}&email=${encodeURIComponent(email)}&successUrl=${encodeURIComponent(successUrl)}`;
      window.location.href = fallbackUrl;
    } catch (err: any) {
      console.error(err);
      setError('Checkout failed: ' + err.message);
      setUpgradeModalLoading(false);
    }
  };

  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPaymentModalProofFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setPaymentModalProofFile(e.target.files[0]);
    }
  };

  const handleTenantCancelInvoice = async (invoice: any) => {
    if (!window.confirm(`Are you sure you want to cancel invoice #${invoice.no || invoice.id}?`)) return;
    try {
      const invId = invoice.id || `${activeWorkspace?.id}_${invoice.no || 'INV-101'}`;
      await setDoc(doc(db, 'invoices', invId), {
        status: 'CANCELLED',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (activeWorkspace) {
        await setDoc(doc(db, 'tenants', activeWorkspace.id), {
          manualPaymentPending: false,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        setTenants(prev => prev.map(t => t.id === activeWorkspace.id ? { ...t, manualPaymentPending: false } : t));
      }

      setInvoices(prev => prev.map(inv => (inv.id === invId || inv.no === invoice.no) ? { ...inv, status: 'CANCELLED' } : inv));
      alert("Invoice successfully cancelled.");
    } catch (err: any) {
      console.error("Error cancelling invoice:", err);
      alert("Failed to cancel invoice: " + (err.message || err));
    }
  };

  const handleRenewSubscription = () => {
    if (!activeWorkspace) return;

    const unpaidInvoice = getDynamicInvoices.find(inv => inv.status === 'UNPAID' || inv.status === 'PENDING') || getDynamicInvoices[0] || {
      id: `${activeWorkspace.id}_INV-RENEW`,
      no: `INV-${Math.floor(100 + Math.random() * 899)}`,
      tenantId: activeWorkspace.id,
      plan: activeWorkspace.plan || 'starter',
      billingInterval: activeWorkspace.billingInterval || 'monthly',
      amount: `$${getPlanPrice(activeWorkspace.plan, activeWorkspace.billingInterval, plans)}.00`,
      dueDate: getNextBillingDate({ createdAt: new Date().toISOString(), billingInterval: activeWorkspace.billingInterval || 'monthly' }),
      status: 'UNPAID'
    };

    setPaymentModalInvoice(unpaidInvoice);
    setPaymentModalMethod('creem');
    setPaymentModalTripayChannel('QRISC');
    setPaymentModalProofFile(null);
    setPaymentModalProofNotes('');
    setPaymentModalSuccess(false);
    setPaymentModalOpen(true);
  };

  const handleInvoicePaymentSubmit = async () => {
    if (!activeWorkspace || !paymentModalInvoice) return;

    if (paymentModalMethod === 'manual') {
      try {
        setPaymentModalLoading(true);
        const invId = paymentModalInvoice.id || `${activeWorkspace.id}_${paymentModalInvoice.no || 'INV-101'}`;
        
        // 1. Update invoice document in Firestore invoices collection
        await setDoc(doc(db, 'invoices', invId), {
          id: invId,
          tenantId: activeWorkspace.id,
          tenantName: activeWorkspace.companyName || 'Operator Workspace',
          no: paymentModalInvoice.no || 'INV-101',
          status: 'PENDING',
          manualPaymentNotes: paymentModalProofNotes || 'Receipt submitted by tenant',
          manualPaymentFileName: paymentModalProofFile ? paymentModalProofFile.name : '',
          paymentMethod: 'Manual Bank Transfer',
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // 2. Update tenant document in Firestore tenants collection
        const tenantRef = doc(db, 'tenants', activeWorkspace.id);
        await setDoc(tenantRef, {
          manualPaymentPending: true,
          manualPaymentInvoiceNo: paymentModalInvoice.no || 'INV-101',
          manualPaymentDate: new Date().toISOString(),
          manualPaymentNotes: paymentModalProofNotes,
          manualPaymentFileName: paymentModalProofFile ? paymentModalProofFile.name : '',
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        // Update local state so it's reflected immediately
        setTenants(prev => prev.map(t => t.id === activeWorkspace.id ? { 
          ...t, 
          manualPaymentPending: true, 
          manualPaymentInvoiceNo: paymentModalInvoice.no 
        } : t));
        
        setPaymentModalSuccess(true);
      } catch (err: any) {
        console.error(err);
        alert('Failed to submit manual payment proof: ' + err.message);
      } finally {
        setPaymentModalLoading(false);
      }
      return;
    }

    try {
      setPaymentModalLoading(true);
      const targetRawPlan = (paymentModalInvoice?.plan || activeWorkspace?.plan || 'starter').toLowerCase();
      const cleanPlanSlug = targetRawPlan
        .replace(/\s*[\(\-_]?\s*(plan|monthly|annual|annually|yearly|lifetime)[\)\-_]?\s*/gi, '')
        .trim() || 'starter';
      const targetInterval = (paymentModalInvoice?.billingInterval || activeWorkspace?.billingInterval || 'monthly').toLowerCase();
      
      // Find matching plan and its productId/creemProductId
      const matchedPlan = plans.find(p => 
        (p.slug?.toLowerCase() === cleanPlanSlug || p.slug?.toLowerCase().includes(cleanPlanSlug) || p.id === cleanPlanSlug) && 
        (p.interval || 'monthly').toLowerCase() === targetInterval
      ) || plans.find(p => p.slug?.toLowerCase() === cleanPlanSlug || p.id === cleanPlanSlug);
      
      const productId = matchedPlan?.productId || matchedPlan?.creemProductId || paymentModalInvoice?.productId || 'prod_starter_123';
      const email = currentUser?.email || '';
      
      const successUrl = `${window.location.origin}/?upgrade_success=true&tenant=${encodeURIComponent(activeWorkspace?.slug || '')}&plan=${encodeURIComponent(cleanPlanSlug)}&interval=${encodeURIComponent(targetInterval)}`;

      if (paymentModalMethod === 'creem') {
        const session = await createCreemCheckoutSession({
          productId,
          successUrl,
          email,
          tenantId: activeWorkspace.id
        });
        
        if (session && session.url) {
          window.location.href = session.url;
        } else {
          throw new Error('Failed to create Creem checkout session');
        }
      } else if (paymentModalMethod === 'tripay') {
        const res = await fetch('/api/billing/tripay-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            productId,
            successUrl,
            email,
            tenantId: activeWorkspace.id,
            companyName: activeWorkspace.companyName,
            phone: activeWorkspace.phone || '081234567890',
            channel: paymentModalTripayChannel
          })
        });
        
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create Tripay checkout session');
        }
        
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned from Tripay checkout');
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('Checkout failed: ' + err.message);
    } finally {
      setPaymentModalLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    try {
      await setDoc(doc(db, 'tenants', activeWorkspace.id), {
        ...activeWorkspace,
        companyName: operatorNameInput,
        phone: operatorPhoneInput,
        address: operatorAddressInput
      }, { merge: true });
      
      // Update tenants state locally
      setTenants(prev => prev.map(t => t.id === activeWorkspace.id ? { ...t, companyName: operatorNameInput, phone: operatorPhoneInput, address: operatorAddressInput } : t));
      setSuccess('🎉 Operator profile updated successfully in the database!');
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to update operator profile: ' + err.message);
      setSuccess(null);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      setPasswordSuccess(null);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      setPasswordSuccess(null);
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('User not found or not logged in.');
      }
      // Reauthenticate
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update Password
      await updatePassword(user, newPassword);
      
      setPasswordSuccess('🎉 Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      console.error(err);
      setPasswordError(err.message || 'Failed to update password. Please check your old password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setBackupCodes([]);
      return;
    }

    const loadUserBackupCodes = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setBackupCodes(userData.backupCodes || []);
        }
      } catch (err) {
        console.warn("Failed to load user backup codes in SaaSHome:", err);
      }
    };

    loadUserBackupCodes();
  }, [currentUser]);

  const handleGenerateBackupCodes = async () => {
    if (!currentUser) return;
    setGeneratingBackupCodes(true);
    setBackupCodeError(null);
    setBackupCodeSuccess(null);
    try {
      const codes: string[] = [];
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Secure alphanumeric characters
      for (let i = 0; i < 10; i++) {
        let code = '';
        for (let j = 0; j < 8; j++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
        codes.push(formatted);
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        backupCodes: codes,
        backupCodesCreatedAt: new Date().toISOString()
      });

      setBackupCodes(codes);
      setBackupCodeSuccess('10 fresh backup codes generated successfully! Please write them down or save them securely. Each code can be used exactly once.');
    } catch (err: any) {
      console.error('Error generating backup codes:', err);
      setBackupCodeError('Failed to generate backup codes: ' + err.message);
    } finally {
      setGeneratingBackupCodes(false);
    }
  };

  // Helper redirect triggers for tenant website modules (Tours, Bookings, customers etc)
  const handleTenantModuleRedirect = (menuId: string) => {
    if (activeWorkspace) {
      setTenantActiveMenu(menuId);
      setActiveLeftMenu('tenant-console');
    } else {
      setError('Please create or select an active workspace first to manage tours and bookings.');
    }
  };

  // ----------------------------------------------------
  // RENDER 1: UNAUTHENTICATED OR UNVERIFIED OTP (Two-Factor gate)
  // ----------------------------------------------------
  if (!currentUser || !otpVerified) {
    return (
      <div className="min-h-screen bg-[#061c15] text-gray-100 flex flex-col justify-center items-center p-6 relative select-none font-sans selection:bg-[#00b272]">
        <Helmet>
          <title>{settings?.siteName ? `${settings.siteName} - Partner Portal` : 'Tripbone - Partner Portal'}</title>
        </Helmet>
        {/* Centered White Card */}
        <div className="w-full max-w-[460px] bg-white rounded-[32px] p-10 shadow-2xl flex flex-col items-stretch text-gray-900 border border-gray-100">
          {/* Logo */}
          <div className="flex items-center space-x-2.5 mb-8 justify-center">
            <div className="bg-[#00b272] p-2 rounded-xl text-white">
              <Compass className="h-5.5 w-5.5 animate-spin-slow" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Trip<span className="text-[#00b272]">bone</span>
            </span>
          </div>

          {currentUser && otpViewActive && !otpVerified ? (
            // --- SECURE OTP VERIFICATION MODE ---
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-2 text-center flex items-center justify-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#00b272]" />
                Security Verification
              </h2>
              <p className="text-xs text-gray-500 mb-6 text-center">
                A 6-digit secure verification code has been dispatched to secure your session.
              </p>

              {otpError && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{otpError}</span>
                </div>
              )}

              {success && (
                <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2">
                  <Check className="w-4 h-4 shrink-0 text-[#00b272]" />
                  <span>{success}</span>
                </div>
              )}

              {/* Secure Delivery Notification */}
              <div className="mb-6 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-xs text-emerald-800 flex flex-col space-y-1.5">
                <div className="flex items-center space-x-2 font-semibold">
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Secure OTP Dispatched:</span>
                </div>
                <p className="leading-relaxed text-[11px] text-emerald-700">
                  We have dispatched a secure 6-digit verification code to <strong className="font-mono text-gray-800">{currentUser.email}</strong>. It may take up to a minute to arrive. Please check your inbox and paste it below.
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">6-Digit Code or Emergency Backup Code</label>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    placeholder="Enter code"
                    value={userEnteredOtp}
                    onChange={(e) => setUserEnteredOtp(e.target.value)}
                    className="w-full text-center tracking-widest font-mono text-lg font-bold px-4 py-3 bg-gray-55 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#00b272] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#00b272] hover:bg-[#00a065] text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-lg shadow-[#00b272]/20"
                >
                  <span>Verify & Authorize</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                    setGeneratedOtp(newCode);
                    if (currentUser?.email) {
                      sendOtpEmail(currentUser.email, newCode);
                    }
                    setSuccess("A fresh secure verification code has been generated and dispatched to your email!");
                    setOtpError(null);
                  }}
                  className="text-xs text-[#00b272] hover:underline font-bold"
                >
                  Resend Code
                </button>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={async () => {
                      await signOut(auth);
                      setOtpVerified(false);
                      setOtpViewActive(false);
                      setUserEnteredOtp('');
                      setOtpError(null);
                      setSuccess(null);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                  >
                    ← Cancel & Back to Login
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // --- STANDARD LOGIN / SIGN UP FORM ---
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-6 text-center">
                {authView === 'login' ? 'Log In' : 'Sign Up'}
              </h2>

              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-5 p-4 bg-emerald-50 border border-emerald-150 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2">
                  <Check className="w-4 h-4 shrink-0 text-[#00b272]" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={authView === 'login' ? handleLoginSubmit : handleSignupSubmit} className="space-y-4">
                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 flex items-center justify-center space-x-2 transition-all"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google logo" />
                  <span>{authView === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                  <span className="relative z-10 px-3 bg-white text-[11px] font-bold text-gray-400 font-mono tracking-wider">OR</span>
                </div>

                {authView === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#00b272] transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#00b272] transition-colors"
                  />
                </div>

                {authView === 'signup' && (
                  <div className="pt-0.5">
                    <CountryPhoneInput
                      value={regPhoneData}
                      onChange={setRegPhoneData}
                      required={true}
                      inputBg="bg-gray-50"
                      label="Country & WhatsApp Number"
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                      <span>💬 Direct WhatsApp is used for instant tour booking alerts and customer support.</span>
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase">Password</label>
                    {authView === 'login' && (
                      <span className="text-xs text-gray-400 hover:text-[#00b272] cursor-pointer font-medium">Forgot your password?</span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#00b272] pr-10 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {authView === 'signup' && loginPassword && (
                    <div className="pt-1.5 px-0.5 space-y-1 animate-in fade-in duration-200">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map((step) => {
                          let score = 0;
                          if (loginPassword.length >= 6) score += 1;
                          if (loginPassword.length >= 8) score += 1;
                          if (/[A-Z]/.test(loginPassword) && /[a-z]/.test(loginPassword)) score += 1;
                          if (/[0-9]/.test(loginPassword)) score += 1;
                          const isActive = (loginPassword.length < 6 ? 1 : score <= 2 ? 2 : score <= 3 ? 3 : 4) >= step;
                          const color = loginPassword.length < 6 ? 'bg-red-500' : score <= 2 ? 'bg-amber-500' : score <= 3 ? 'bg-emerald-500' : 'bg-teal-500';
                          return (
                            <div
                              key={step}
                              className={cn(
                                "flex-1 rounded-full transition-colors duration-300",
                                isActive ? color : "bg-gray-200"
                              )}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-400">Password strength:</span>
                        <span className={cn(
                          "font-bold",
                          loginPassword.length < 6 ? "text-red-500" :
                          loginPassword.length < 8 ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {loginPassword.length < 6 ? "Too short (min 6 characters)" :
                           loginPassword.length < 8 ? "Fair" : "Strong"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-[#00b272] hover:bg-[#00a065] text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-lg shadow-[#00b272]/20 disabled:opacity-50"
                >
                  <span>{loginLoading ? 'Loading...' : authView === 'login' ? 'Log In' : 'Sign Up'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Toggle link */}
              <div className="mt-8 text-center text-xs text-gray-500 font-medium border-t border-gray-100 pt-6">
                {authView === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button 
                      onClick={() => { setAuthView('signup'); setError(null); }}
                      className="text-[#00b272] hover:underline font-bold"
                    >
                      Sign up!
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button 
                      onClick={() => { setAuthView('login'); setError(null); }}
                      className="text-[#00b272] hover:underline font-bold"
                    >
                      Log in!
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Support Chat Overlay Widget */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2">
          <div className="bg-slate-950/90 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-center space-x-3 text-xs w-64">
            <div className="bg-[#00b272]/20 p-2 rounded-xl text-[#00b272]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">Questions? Chat with us.</p>
              <p className="text-[10px] text-gray-400 flex items-center space-x-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00b272] inline-block animate-ping" />
                <span>We are online</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {}}
            className="px-5 py-3 rounded-full bg-[#00b272] hover:bg-[#00a065] text-white text-xs font-bold shadow-lg shadow-[#00b272]/30 flex items-center space-x-2 transition-transform hover:scale-105"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat with Tripbone</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER 1.5: PROVISIONING LOADING STATE
  // ----------------------------------------------------
  if (isProvisioning) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center font-sans select-none relative overflow-hidden">
        <Helmet>
          <title>Provisioning Workspace... | Tripbone</title>
        </Helmet>
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 animate-fadeIn">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-slate-900/50 border border-slate-700/50 flex items-center justify-center backdrop-blur-xl shadow-2xl relative z-10 overflow-hidden">
              <Compass className="w-10 h-10 text-emerald-400 animate-spin-slow" />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/20">
                <div className="h-full bg-emerald-500 w-1/2 animate-shimmer" />
              </div>
            </div>
            
            {/* Spinning orbital rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] rounded-full border border-dashed border-emerald-500/20 animate-[spin_10s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] rounded-full border border-dashed border-indigo-500/20 animate-[spin_15s_linear_infinite_reverse]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white animate-pulse">
              Provisioning Workspace...
            </h2>
            <p className="text-sm font-medium text-slate-400 max-w-[300px] mx-auto leading-relaxed">
              We are securely creating your database instances, generating your SSL certificates, and setting up your custom tenant environment.
            </p>
          </div>
          
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-500/70 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
            <Terminal className="w-3.5 h-3.5" />
            <span className="animate-pulse">Initializing Tripbone Engine...</span>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER 2: WORKSPACE ONBOARDING STEP FLOW (Screenshot 3 & 4)
  // ----------------------------------------------------
  const isSuperAdminEmail = ['baliadventours@gmail.com', 'admin@tripbone.com', 'kuotabox@gmail.com'].includes(currentUser?.email?.toLowerCase() || '');
  const isEmailVerified = currentUser?.emailVerified || isSuperAdminEmail;

  if (currentUser && (!showDashboard || userWorkspaces.length === 0 || step > 1)) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex font-sans select-none selection:bg-[#00b272]">
        <Helmet>
          <title>Workspace Setup | Tripbone</title>
        </Helmet>
        {/* Left panel step tracker */}
        <aside className="w-80 bg-[#061c15] text-gray-300 p-8 flex flex-col justify-between border-r border-white/5 relative">
          <div className="space-y-12">
            {/* Logo */}
            <div className="flex items-center space-x-2.5">
              <div className="bg-[#00b272] p-2 rounded-xl text-white">
                <Compass className="h-5.5 w-5.5 animate-spin-slow" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Trip<span className="text-[#00b272]">bone</span>
              </span>
            </div>

            {/* Step list */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-semibold text-sm ${isEmailVerified ? 'bg-[#00b272] border-[#00b272] text-white' : 'border-amber-400 bg-amber-500/20 text-amber-300 animate-pulse'}`}>
                  {isEmailVerified ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <div>
                  <h4 className={`text-sm font-bold text-white`}>{isEmailVerified ? 'Account Verified' : 'Verify Email'}</h4>
                  <p className="text-[10px] text-gray-500 font-medium">{isEmailVerified ? 'Email confirmed' : 'Awaiting confirmation'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-semibold text-sm ${isEmailVerified && step >= 2 ? 'bg-[#00b272] border-[#00b272] text-white' : 'border-gray-700 text-gray-500'}`}>
                  {trialActivated ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isEmailVerified && step >= 2 ? 'text-white' : 'text-gray-400'}`}>Website & 7-Day Trial</h4>
                  <p className="text-[10px] text-gray-500 font-medium">Company & Subdomain</p>
                </div>
              </div>
            </div>
          </div>

          {/* Left Panel Emblem */}
          <div className="flex items-center space-x-2 pt-8 border-t border-white/5 opacity-40">
            <Compass className="w-5 h-5 text-gray-400" />
            <span className="text-[11px] font-semibold tracking-wider font-mono">ONBOARDING GATE</span>
          </div>
        </aside>

        {/* Right Panel form area */}
        <main className="flex-1 px-16 py-20 overflow-y-auto bg-slate-50 flex flex-col justify-center">
          <div className="max-w-[580px] mx-auto w-full">
            {error && (
              <div className="mb-6 p-4 bg-red-55 border border-red-200 rounded-2xl text-xs text-red-655 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-600">
                {success}
              </div>
            )}

            {/* STEP 1: Email Confirmation Gate (if email unverified) */}
            {!isEmailVerified && (
              <div className="animate-fadeIn">
                <div className="max-w-xl mx-auto space-y-6 bg-white border border-gray-200 p-8 rounded-2xl shadow-xl text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-[#00b272] rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Mail className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Verify Your Email Address</h2>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
                    We've dispatched a confirmation link to <strong className="font-mono text-gray-900">{currentUser.email}</strong>. 
                    Please verify your email before configuring your company workspace to prevent spam and protect your store.
                  </p>

                  <div className="bg-emerald-50/50 border border-emerald-500/10 rounded-2xl p-5 text-left space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-[#00b272]" />
                      <span>Workspace Security & Anti-Spam Gate</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Confirming your email address activates your custom subdomain, unlocks booking automation widgets, and prevents unauthorized workspace provisioning.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await auth.currentUser?.reload();
                          if (auth.currentUser?.emailVerified) {
                            setCurrentUser(auth.currentUser);
                            setSuccess("🎉 Email verified successfully! Continuing to company setup...");
                            setStep(2);
                          } else {
                            setError("Email is not verified yet. Please click the confirmation link in your inbox (or check your Spam/Junk folder).");
                          }
                        } catch (err: any) {
                          setError("Error checking status: " + err.message);
                        }
                      }}
                      className="w-full py-3.5 bg-[#00b272] hover:bg-[#009e64] text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/15 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>I've Confirmed My Email — Continue to Setup</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const userEmail = auth.currentUser?.email || loginEmail;
                          if (userEmail) {
                            const baseHost = window.location.origin;
                            await fetch(`${baseHost}/api/mail/verify`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: userEmail })
                            });
                            setSuccess("📧 Confirmation email dispatched from Tripbone! Please check your inbox.");
                            setError(null);
                          }
                        } catch (resendErr: any) {
                          setError("Failed to resend: " + resendErr.message);
                        }
                      }}
                      className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 transition-colors cursor-pointer"
                    >
                      Resend Confirmation Email
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-100 text-center">
                    <button
                      type="button"
                      onClick={() => signOut(auth)}
                      className="text-xs text-gray-400 hover:text-gray-600 font-medium cursor-pointer"
                    >
                      ← Sign Out & Use Another Email
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Website Setup & 7-Day Free Trial Launch */}
            {isEmailVerified && !trialActivated && (
              <div className="animate-fadeIn">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Setup Your Website</h1>
                <p className="text-xs text-gray-500 mb-6 font-medium">Just a few details to provision your 7-Day Free Trial platform.</p>
                <div className="w-12 h-1 bg-[#00b272] rounded-full mb-8" />

                <form onSubmit={handleRegisterTenant} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      required
                      placeholder="Your Company Name (e.g. Bitproy Travel)"
                      value={formData.companyName}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slugified = name.toLowerCase()
                          .replace(/[^a-z0-9]/g, '');
                        setFormData(prev => ({
                          ...prev,
                          companyName: name,
                          slug: isSlugManuallyEdited ? prev.slug : slugified
                        }));
                      }}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00b272] text-gray-900 placeholder-gray-400 transition-colors shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subdomain Name</label>
                    <div className="relative flex items-center shadow-sm rounded-xl overflow-hidden border border-gray-200 focus-within:border-[#00b272] bg-white">
                      <input
                        type="text"
                        name="workspace_subdomain_custom"
                        id="workspace_subdomain_input"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck="false"
                        required
                        placeholder="e.g. bitproytravel"
                        value={formData.slug}
                        onChange={(e) => {
                          setIsSlugManuallyEdited(true);
                          const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                          setFormData(prev => ({ ...prev, slug: cleaned }));
                        }}
                        className="w-full pl-4 pr-32 py-3 focus:outline-none text-sm text-gray-900 placeholder-gray-400 transition-colors bg-transparent"
                      />
                      <span className="absolute right-0 top-0 bottom-0 bg-gray-100/80 px-4 flex items-center text-xs text-gray-500 font-mono border-l border-gray-200">
                        .tripbone.com
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                      This is the URL to live preview your website. You can connect your own custom domain (e.g. yourcompany.com) anytime from your dashboard.
                    </p>
                  </div>

                  {/* 7-Day Free Trial Benefit Box */}
                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">7-Day Free Trial (Starter Package)</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        $0 DUE TODAY
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Your website will be provisioned with full Starter capabilities, AI tour generator, booking engine, and 0% platform commissions. Upgrade or renew anytime directly from your dashboard.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-emerald-800 pt-2 border-t border-emerald-200/60">
                      <span>✓ No Credit Card Required</span>
                      <span>✓ Provisioning in 2 Minutes</span>
                      <span>✓ Your Data Stays Yours</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => signOut(auth)}
                      className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                    <button
                      type="submit"
                      disabled={!formData.companyName || !formData.slug || isProvisioning}
                      className="px-6 py-3.5 bg-[#00b272] hover:bg-[#009e64] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-[#00b272]/20 disabled:opacity-50 cursor-pointer"
                    >
                      {isProvisioning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Provisioning in 2 Minutes...</span>
                        </>
                      ) : (
                        <>
                          <span>Launch My 7-Day Free Trial Website</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: 7-Day Trial Activation Success Screen */}
            {trialActivated && (
              <div className="animate-fadeIn">
                <div className="max-w-xl mx-auto space-y-8 bg-white border border-gray-200 p-8 rounded-2xl shadow-xl text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">7-Day Free Trial Activated!</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Your premium travel storefront workspace <strong>{formData.companyName}</strong> has been created with an active <strong>7-Day Free Trial</strong> ($0 due today).
                  </p>
                  
                  <div className="bg-emerald-50/50 border border-emerald-500/10 rounded-2xl p-6 text-left space-y-4">
                    <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Workspace Summary</h3>
                    <div className="text-xs space-y-2 text-slate-600">
                      <p>💼 <strong>Workspace:</strong> {formData.companyName}</p>
                      <p>🔗 <strong>Web Address:</strong> {formData.slug}.tripbone.com</p>
                      <p>⏱️ <strong>Trial Ends:</strong> {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                      <p>🧾 <strong>Active Plan:</strong> Starter Package (Trial Activated — renew or upgrade anytime in dashboard).</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <button
                      onClick={async () => {
                        setTrialActivated(false);
                        setStep(1);
                        try {
                          const querySnapshot = await getDocs(collection(db, 'tenants'));
                          const tenantList: Tenant[] = [];
                          querySnapshot.forEach((docSnap) => {
                            tenantList.push({ id: docSnap.id, ...(docSnap.data() as any) });
                          });
                          setTenants(tenantList);
                        } catch (e) {
                          console.error(e);
                        }
                        setShowDashboard(true);
                      }}
                      className="w-full py-3.5 bg-[#00b272] hover:bg-[#009e64] text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/15 cursor-pointer"
                    >
                      Go to My Workspace Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER 3: TENANT WORKSPACE MANAGEMENT DASHBOARD (Screenshot 5)
  // ----------------------------------------------------
  return (
    <div className={cn(
      "min-h-screen flex flex-col font-sans select-none relative transition-colors duration-200",
      isDarkMode ? "bg-[#080c14] text-slate-100" : "bg-slate-50 text-gray-800 animate-fadeIn"
    )}>
      <Helmet>
        <title>{settings?.siteName ? `${settings.siteName} - Agency Console` : 'Tripbone - Agency Console'}</title>
      </Helmet>
      {/* Global Operator Announcements */}
      {announcements.length > 0 && announcements.filter((ann) => !closedAnnouncements.includes(ann.id)).length > 0 && (
        <div className="space-y-1 shrink-0 relative z-40">
          {announcements
            .filter((ann) => !closedAnnouncements.includes(ann.id))
            .map((ann) => (
              <div 
                key={ann.id}
                className="px-6 py-2.5 text-white flex items-center justify-between gap-4 text-xs font-semibold relative shadow-inner"
                style={{ backgroundColor: brandColor }}
              >
                <div className="flex items-center space-x-2 flex-1">
                  <Megaphone className="w-4 h-4 text-white shrink-0 animate-pulse" />
                  <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest text-white">
                    {ann.type || 'Platform'}
                  </span>
                  <span className="font-extrabold">{ann.title}</span>
                  <span className="opacity-95 font-medium">{ann.message}</span>
                </div>
                <button 
                  onClick={() => setClosedAnnouncements([...closedAnnouncements, ann.id])}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ))}
        </div>
      )}
      {/* Top Royal Blue Navbar */}
      <header className={cn(
        "h-16 px-6 flex items-center justify-between shadow-md relative z-30 select-none transition-colors duration-200",
        isDarkMode ? "bg-[#0b0f19] text-slate-100 border-b border-slate-800" : "bg-[#005ea6] text-white"
      )}>
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-white" />
            <span className="font-bold text-lg tracking-tight">Tripbone</span>
          </div>

          {/* Active Workspace Selector Dropdown */}
          <div className="relative group">
            {(() => {
              const activeStatus = activeWorkspace ? getWorkspaceStatus(activeWorkspace) : 'active';
              const dotColorClass = 
                activeStatus === 'active' ? 'bg-[#00b272]' :
                activeStatus === 'trial' ? 'bg-sky-400 animate-pulse' :
                activeStatus === 'inactive' ? 'bg-amber-500' :
                'bg-rose-500';
              return (
                <button className="flex items-center space-x-2 px-3.5 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-bold transition-all border border-white/10">
                  <span className={cn("w-2 h-2 rounded-full", dotColorClass)} />
                  <span>{activeWorkspace ? activeWorkspace.companyName : 'Choose Workspace'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/70" />
                </button>
              );
            })()}

            {/* Dropdown Options */}
            <div className={cn(
              "absolute left-0 mt-2 w-64 border rounded-xl shadow-xl py-1 hidden group-hover:block z-45",
              isDarkMode ? "bg-[#111928] border-slate-800 text-slate-200" : "bg-white border-gray-200 text-gray-700"
            )}>
              {userWorkspaces.map(t => {
                const s = getWorkspaceStatus(t);
                const tDotColor = 
                  s === 'active' ? 'bg-[#00b272]' :
                  s === 'trial' ? 'bg-sky-400' :
                  s === 'inactive' ? 'bg-amber-500' :
                  'bg-rose-500';
                
                const sBadgeBg = 
                  s === 'active' ? (isDarkMode ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200') :
                  s === 'trial' ? (isDarkMode ? 'bg-sky-950/40 text-sky-400 border-sky-500/20' : 'bg-sky-50 text-sky-700 border-sky-200') :
                  s === 'inactive' ? (isDarkMode ? 'bg-amber-950/40 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200') :
                  (isDarkMode ? 'bg-rose-950/40 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200');

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedWorkspaceId(t.id);
                      setTenantActiveMenu('dashboard');
                      setActiveLeftMenu('dashboard');
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-xs font-semibold flex items-center justify-between transition-colors",
                      isDarkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-gray-700"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full", tDotColor)} />
                      <span className="truncate max-w-[130px]">{t.companyName}</span>
                    </div>
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded border capitalize font-bold", sBadgeBg)}>
                      {s}
                    </span>
                  </button>
                );
              })}
              <div className={cn("border-t my-1", isDarkMode ? "border-slate-800" : "border-gray-100")} />
              <button
                onClick={() => { setStep(2); setShowDashboard(false); }}
                className="w-full px-4 py-2 hover:bg-slate-50 text-left text-xs font-bold text-[#00b272] flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Workspace</span>
              </button>
            </div>
          </div>

          {/* Visit Website Dropdown */}
          {activeWorkspace && (
            <div className="relative group">
              <button className="text-xs font-bold text-white/80 hover:text-white flex items-center space-x-1">
                <span>Visit Website</span>
                <ChevronDown className="w-3 h-3 text-white/60" />
              </button>
              <div className={cn(
                "absolute left-0 mt-2 w-48 border rounded-xl shadow-xl py-1 hidden group-hover:block z-45",
                isDarkMode ? "bg-[#111928] border-slate-800 text-slate-200" : "bg-white border-gray-200 text-gray-700"
              )}>
                <a
                  href={getStorefrontUrl(activeWorkspace.slug, activeWorkspace.customDomain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "px-4 py-2 text-left text-xs font-semibold flex items-center space-x-2 block",
                    isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-50 text-gray-700"
                  )}
                >
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                  <span>Visit Storefront</span>
                </a>
                <div className={cn("border-t my-1", isDarkMode ? "border-slate-800" : "border-gray-100")} />
                <button
                  onClick={() => handleLaunchSSO(activeWorkspace.slug, activeWorkspace.customDomain)}
                  className="w-full px-4 py-2 hover:bg-slate-50 text-left text-xs font-bold text-indigo-600 flex items-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Log in as Tenant</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <HelpCircle className="w-5 h-5 text-white/70 hover:text-white cursor-pointer" />
          
          {/* User profile Initial avatar */}
          <div className="relative group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/20 hover:bg-white/25 flex items-center justify-center font-bold text-xs font-mono uppercase tracking-wider text-white">
              {currentUser.email?.slice(0, 2) || 'OP'}
            </div>
            
            {/* User Dropdown */}
            <div className={cn(
              "absolute right-0 mt-2 w-56 border rounded-xl shadow-xl py-1 hidden group-hover:block z-45",
              isDarkMode ? "bg-[#111928] border-slate-800 text-slate-200" : "bg-white border-gray-200 text-gray-700"
            )}>
              <div className="px-4 py-3 border-b border-gray-100 text-xs">
                <p className="text-gray-400">Account Operator</p>
                <p className={cn("font-bold truncate mt-0.5", isDarkMode ? "text-white" : "text-gray-800")}>{currentUser.email}</p>
              </div>
              <button
                onClick={() => signOut(auth)}
                className="w-full px-4 py-2.5 hover:bg-red-50 text-left text-xs font-semibold text-rose-500 flex items-center space-x-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Account</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Workspace Sidebar + Main content layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className={cn(
          "w-64 flex flex-col justify-between select-none py-6 shrink-0 transition-colors duration-200",
          isDarkMode 
            ? "bg-[#0c1425] text-slate-400 border-r border-slate-850" 
            : "bg-white text-gray-600 border-r border-gray-200"
        )}>
          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] px-3">
            {/* SaaS Menu Section */}
            <div>
              <div className="px-3 mb-2 flex items-center justify-between">
                <span className={cn(
                  "text-[10px] font-black font-mono tracking-widest uppercase",
                  isDarkMode ? "text-slate-500" : "text-gray-400"
                )}>SaaS Operator Menu</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#00b272]/15 text-[#00b272] rounded uppercase">Live</span>
              </div>
              <nav className="space-y-1">
                {/* Dashboard */}
                <button
                  onClick={() => { setActiveLeftMenu('dashboard'); setTenantActiveMenu(null); }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200",
                    activeLeftMenu === 'dashboard'
                      ? "bg-[#005ea6] text-white shadow-sm"
                      : isDarkMode
                        ? "hover:bg-slate-800/40 hover:text-white text-slate-300"
                        : "hover:bg-slate-100 hover:text-gray-900 text-gray-600"
                  )}
                >
                  <Building className="w-4 h-4 text-[#00b272]" />
                  <span>Dashboard</span>
                </button>

                {/* My Site */}
                <button
                  onClick={() => { setActiveLeftMenu('my-site'); setTenantActiveMenu(null); }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200",
                    activeLeftMenu === 'my-site'
                      ? "bg-[#005ea6] text-white shadow-sm"
                      : isDarkMode
                        ? "hover:bg-slate-800/40 hover:text-white text-slate-300"
                        : "hover:bg-slate-100 hover:text-gray-900 text-gray-600"
                  )}
                >
                  <Globe className="w-4 h-4 text-[#00b272]" />
                  <span>My Site</span>
                </button>

                {/* Billing & Plan */}
                <button
                  onClick={() => { setActiveLeftMenu('billing'); setTenantActiveMenu(null); }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200",
                    activeLeftMenu === 'billing'
                      ? "bg-[#005ea6] text-white shadow-sm"
                      : isDarkMode
                        ? "hover:bg-slate-800/40 hover:text-white text-slate-300"
                        : "hover:bg-slate-100 hover:text-gray-900 text-gray-600"
                  )}
                >
                  <CreditCard className="w-4 h-4 text-[#00b272]" />
                  <span>Billing & Plan</span>
                </button>

                {/* Support & Tickets */}
                <button
                  onClick={() => { setActiveLeftMenu('tickets'); setTenantActiveMenu(null); }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200",
                    activeLeftMenu === 'tickets'
                      ? "bg-[#005ea6] text-white shadow-sm"
                      : isDarkMode
                        ? "hover:bg-slate-800/40 hover:text-white text-slate-300"
                        : "hover:bg-slate-100 hover:text-gray-900 text-gray-600"
                  )}
                >
                  <LifeBuoy className="w-4 h-4 text-[#00b272]" />
                  <span>Support & Tickets</span>
                </button>

                {/* Knowledge Base */}
                <button
                  onClick={() => { setActiveLeftMenu('docs'); setTenantActiveMenu(null); }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200",
                    activeLeftMenu === 'docs'
                      ? "bg-[#005ea6] text-white shadow-sm"
                      : isDarkMode
                        ? "hover:bg-slate-800/40 hover:text-white text-slate-300"
                        : "hover:bg-slate-100 hover:text-gray-900 text-gray-600"
                  )}
                >
                  <BookOpen className="w-4 h-4 text-[#00b272]" />
                  <span>Knowledge Base</span>
                </button>

                {/* Profile Setting */}
                <button
                  onClick={() => { setActiveLeftMenu('profile'); setTenantActiveMenu(null); }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200",
                    activeLeftMenu === 'profile'
                      ? "bg-[#005ea6] text-white shadow-sm"
                      : isDarkMode
                        ? "hover:bg-slate-800/40 hover:text-white text-slate-300"
                        : "hover:bg-slate-100 hover:text-gray-900 text-gray-600"
                  )}
                >
                  <User className="w-4 h-4 text-[#00b272]" />
                  <span>Profile Setting</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Footer Controls */}
          <div className={cn(
            "px-4 border-t pt-4 space-y-4",
            isDarkMode ? "border-slate-800" : "border-gray-100"
          )}>
            {/* Dark & Light Design Switcher */}
            <div className="px-1">
              <button
                type="button"
                onClick={toggleDarkMode}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 border shadow-xs cursor-pointer",
                  isDarkMode 
                    ? "bg-[#111928] border-slate-800 hover:bg-slate-800 text-slate-200" 
                    : "bg-slate-50 border-gray-200 hover:bg-slate-100 text-gray-700"
                )}
              >
                <div className="flex items-center space-x-2">
                  {isDarkMode ? <Moon className="w-4 h-4 text-sky-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <div className={cn(
                  "w-8 h-4 rounded-full relative p-0.5 transition-colors duration-300",
                  isDarkMode ? "bg-emerald-600" : "bg-gray-300"
                )}>
                  <div className={cn(
                    "w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm",
                    isDarkMode ? "translate-x-4" : "translate-x-0"
                  )} />
                </div>
              </button>
            </div>

            <div className="px-2 pb-2">
              <span className="text-[10px] text-gray-500 block">Operator ID:</span>
              <span className="text-xs font-bold truncate block mt-0.5 font-mono text-gray-400">{currentUser.email}</span>
              <button
                onClick={() => signOut(auth)}
                className="mt-3.5 w-full flex items-center space-x-2 text-rose-500 hover:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Dashboard Panel */}
        <main className={cn(
          "flex-1 p-8 overflow-y-auto relative select-none transition-colors duration-250",
          isDarkMode ? "bg-[#080d19]" : "bg-slate-50"
        )}>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-250 rounded-xl text-xs text-emerald-700 flex items-center justify-between">
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} className="text-emerald-800 hover:text-emerald-950 font-bold ml-4"><X className="w-4 h-4" /></button>
            </div>
          )}

          {ssoRedirecting && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-4">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl text-center space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Authenticating Workspace...</p>
                <p className="text-xs text-gray-400 font-mono">Redirecting you securely to {ssoRedirecting}.tripbone.com...</p>
              </div>
            </div>
          )}

          {/* PANEL 1: DASHBOARD OVERVIEW */}
          {activeLeftMenu === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Top Banner Warning & Alerts */}
              <div className="space-y-3">
                {activeWorkspace && activeWorkspace.emailVerified === false && (
                  <div className={cn(
                    "p-4 border rounded-xl text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-xs gap-3 transition-colors",
                    isDarkMode 
                      ? "bg-amber-500/5 border-amber-500/25 text-amber-300" 
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  )}>
                    <div className="flex items-center space-x-2.5">
                      <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                      <span>
                        <strong>Please confirm your email to activate your account.</strong> We have dispatched a confirmation link to <strong>{activeWorkspace.adminEmail || activeWorkspace.email}</strong>.
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                      <button 
                        onClick={() => {
                          setSuccess(`A fresh email confirmation link has been resent to ${activeWorkspace.adminEmail || activeWorkspace.email}.`);
                          setError(null);
                        }}
                        className="font-bold text-[10px] bg-amber-500 text-slate-950 px-2.5 py-1 rounded hover:bg-amber-400 transition-colors"
                      >
                        Resend Link
                      </button>
                      
                    </div>
                  </div>
                )}
                {(() => {
                  const s = getWorkspaceStatus(activeWorkspace);
                  const now = new Date();
                  const createdDate = activeWorkspace ? new Date(activeWorkspace.createdAt || Date.now()) : new Date();
                  const trialEndsDate = activeWorkspace?.trialEnds 
                    ? new Date(activeWorkspace.trialEnds) 
                    : new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                  const msDiff = trialEndsDate.getTime() - now.getTime();
                  const daysLeft = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

                  if (s === 'trial') {
                    return (
                      <div className={cn(
                        "p-4 border rounded-xl text-xs flex items-center justify-between shadow-xs transition-colors",
                        isDarkMode 
                          ? "bg-sky-500/5 border-sky-500/25 text-sky-300" 
                          : "bg-sky-50/55 border-sky-200 text-sky-800"
                      )}>
                        <div className="flex items-center space-x-2.5">
                          <Compass className="w-4 h-4 text-sky-500 shrink-0 animate-spin-slow" />
                          <span>Your workspace is in <strong>Free Trial</strong>. You have <strong>{daysLeft} days left</strong> in your trial. Add billing details to seamlessly transition to a paid plan.</span>
                        </div>
                        <button 
                          onClick={() => setActiveLeftMenu('billing')}
                          className="font-bold text-xs underline cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ml-4"
                        >
                          Add Billing
                        </button>
                      </div>
                    );
                  }

                  if (s === 'inactive') {
                    return (
                      <div className={cn(
                        "p-4 border rounded-xl text-xs flex items-center justify-between shadow-xs transition-colors animate-pulse",
                        isDarkMode 
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300" 
                          : "bg-amber-50 border-amber-200 text-amber-900"
                      )}>
                        <div className="flex items-center space-x-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span><strong>Subscription Required:</strong> Your free trial has expired, but your site remains active for a limited grace period. Update your billing details now to avoid workspace suspension.</span>
                        </div>
                        <button 
                          onClick={() => setActiveLeftMenu('billing')}
                          className="font-bold text-xs bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap ml-4"
                        >
                          Setup Billing
                        </button>
                      </div>
                    );
                  }

                  if (s === 'suspended') {
                    return (
                      <div className={cn(
                        "p-4 border rounded-xl text-xs flex items-center justify-between shadow-xs transition-colors",
                        isDarkMode 
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-300" 
                          : "bg-rose-50 border-rose-200 text-rose-900"
                      )}>
                        <div className="flex items-center space-x-2.5">
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          <span><strong>Workspace Suspended:</strong> Access is disabled. Please update your payment details or contact support.</span>
                        </div>
                        <button 
                          onClick={() => setActiveLeftMenu('billing')}
                          className="font-bold text-xs bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap ml-4"
                        >
                          Update Billing
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className={cn(
                      "p-4 border rounded-xl text-xs flex items-center justify-between shadow-xs transition-colors",
                      isDarkMode 
                        ? "bg-emerald-500/5 border-emerald-500/25 text-emerald-300" 
                        : "bg-emerald-50/55 border-emerald-200 text-emerald-800"
                    )}>
                      <div className="flex items-center space-x-2.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          {activeWorkspace?.billingInterval === 'lifetime' || activeWorkspace?.plan?.toLowerCase().includes('lifetime')
                            ? 'Your active SaaS plan is running optimally with Lifetime Access.'
                            : `Your active SaaS plan is running optimally. Next automatic renewal is scheduled for ${dueDateStr}.`}
                        </span>
                      </div>
                      <button 
                        onClick={() => setActiveLeftMenu('billing')}
                        className="font-bold text-xs underline cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        Manage Billing
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className={cn(
                    "text-2xl font-extrabold tracking-tight",
                    isDarkMode ? "text-white" : "text-gray-950"
                  )}>
                    SaaS Tenant Dashboard
                  </h1>
                  <p className={cn(
                    "text-xs mt-1",
                    isDarkMode ? "text-slate-400" : "text-gray-500"
                  )}>
                    Hello, <span className={cn("font-semibold", isDarkMode ? "text-slate-200" : "text-gray-700")}>{currentUser.email}</span>. Here is a high-level summary of your active SaaS profile and travel networks.
                  </p>
                </div>
                <button
                  onClick={() => { setStep(2); setShowDashboard(false); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer self-start md:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Workspace</span>
                </button>
              </div>

              {/* Account Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {/* Active Plan */}
                <div className={cn(
                  "border rounded-2xl p-5 shadow-xs relative overflow-hidden group transition-all",
                  isDarkMode 
                    ? "bg-[#111928] border-slate-800 hover:border-emerald-500/30" 
                    : "bg-white border-gray-200/80 hover:border-emerald-500/30"
                )}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-mono">Active Plan</span>
                  <div className={cn(
                    "text-2xl font-extrabold mt-2 capitalize flex items-center space-x-1.5",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>
                      {formatPlanName(activeWorkspace?.plan, plans, activeWorkspace?.billingInterval)}
                      {(() => {
                        const wsStatus = getWorkspaceStatus(activeWorkspace);
                        if (wsStatus === 'trial') return ' (Trial)';
                        if (wsStatus === 'inactive') return ' (Inactive)';
                        if (wsStatus === 'suspended') return ' (Suspended)';
                        return '';
                      })()}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-500 font-semibold mt-3 flex items-center">
                    <Check className="w-3.5 h-3.5 mr-1" /> Custom Subdomain Active
                  </p>
                </div>

                {/* Tour Quota */}
                <div className={cn(
                  "border rounded-2xl p-5 shadow-xs relative overflow-hidden group transition-all",
                  isDarkMode 
                    ? "bg-[#111928] border-slate-800 hover:border-emerald-500/30" 
                    : "bg-white border-gray-200/80 hover:border-emerald-500/30"
                )}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-mono">Tour Quota</span>
                  <div className={cn(
                    "text-2xl font-extrabold mt-2",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    {activeWorkspaceTours.length} <span className="text-xs font-semibold text-gray-400">/ {workspaceLimits.maxTours}</span>
                  </div>
                  <div className={cn("mt-3.5 h-1.5 rounded-full overflow-hidden", isDarkMode ? "bg-slate-800" : "bg-gray-100")}>
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${Math.min(100, (activeWorkspaceTours.length / (typeof workspaceLimits.maxTours === 'number' ? workspaceLimits.maxTours : 99999)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Booking Quota */}
                <div className={cn(
                  "border rounded-2xl p-5 shadow-xs relative overflow-hidden group transition-all",
                  isDarkMode 
                    ? "bg-[#111928] border-slate-800 hover:border-emerald-500/30" 
                    : "bg-white border-gray-200/80 hover:border-emerald-500/30"
                )}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-mono">Booking Quota</span>
                  <div className={cn(
                    "text-2xl font-extrabold mt-2",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    {activeWorkspaceBookings.length} <span className="text-xs font-semibold text-gray-400">/ {workspaceLimits.maxBookings}</span>
                  </div>
                  <div className={cn("mt-3.5 h-1.5 rounded-full overflow-hidden", isDarkMode ? "bg-slate-800" : "bg-gray-100")}>
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${Math.min(100, (activeWorkspaceBookings.length / (typeof workspaceLimits.maxBookings === 'number' ? workspaceLimits.maxBookings : 99999)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Expiry Date */}
                <div className={cn(
                  "border rounded-2xl p-5 shadow-xs relative overflow-hidden group transition-all",
                  isDarkMode 
                    ? "bg-[#111928] border-slate-800 hover:border-emerald-500/30" 
                    : "bg-white border-gray-200/80 hover:border-emerald-500/30"
                )}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-mono">Active Until</span>
                  <div className={cn(
                    "text-2xl font-extrabold mt-2",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    {dueDateStr}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3.5 flex items-center font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {(() => {
                      if (activeWorkspace?.billingInterval === 'lifetime' || activeWorkspace?.plan?.toLowerCase().includes('lifetime')) {
                        return 'No Renewal Required';
                      }
                      const wsStatus = getWorkspaceStatus(activeWorkspace);
                      if (wsStatus === 'trial') return 'Trial Period Active';
                      if (wsStatus === 'inactive') return 'Payment Required';
                      if (wsStatus === 'suspended') return 'Account Suspended';
                      return 'Renews Automatically';
                    })()}
                  </p>
                </div>
              </div>

              {/* My Site section */}
              <div className={cn(
                "border rounded-2xl shadow-xs overflow-hidden",
                isDarkMode ? "bg-[#111928] border-slate-800" : "bg-white border-gray-200"
              )}>
                <div className={cn(
                  "px-6 py-5 border-b flex justify-between items-center",
                  isDarkMode ? "border-slate-800 bg-[#162235]/40" : "border-gray-100 bg-slate-50/50"
                )}>
                  <div>
                    <h3 className={cn("font-extrabold text-sm", isDarkMode ? "text-white" : "text-gray-800")}>My Sites & Workspaces</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Below is the status of travel networks managed under your email account.</p>
                  </div>
                </div>

                {userWorkspaces.length === 0 ? (
                  <div className="p-12 text-center">
                    <Globe className="w-10 h-10 text-gray-400 mx-auto opacity-60 mb-2" />
                    <p className="text-xs text-gray-400">No active travel agency sites registered under your account yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={cn(
                          "uppercase font-mono tracking-wider border-b text-[10px]",
                          isDarkMode ? "bg-[#162235]/60 text-slate-400 border-slate-800" : "bg-slate-50 text-gray-400 border-gray-150"
                        )}>
                          <th className="px-6 py-3.5 font-bold">Site</th>
                          <th className="px-6 py-3.5 font-bold">Plan</th>
                          <th className="px-6 py-3.5 font-bold">Expiry Date</th>
                          <th className="px-6 py-3.5 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className={cn(
                        "divide-y text-gray-700",
                        isDarkMode ? "divide-slate-800 text-slate-300" : "divide-gray-100 text-gray-700"
                      )}>
                        {userWorkspaces.map(w => (
                          <tr key={w.id} className={cn(
                            "hover:transition-colors",
                            isDarkMode ? "hover:bg-slate-800/30" : "hover:bg-slate-50/40"
                          )}>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3.5">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs uppercase shadow-xs shrink-0",
                                  isDarkMode ? "bg-[#1e293b] text-emerald-400" : "bg-emerald-50 text-emerald-700"
                                )}>
                                  {w.companyName?.slice(0, 2) || w.slug?.slice(0, 2)}
                                </div>
                                <div className="ml-3 text-left">
                                  <span className={cn("text-xs font-bold block", isDarkMode ? "text-white" : "text-gray-900")}>{w.companyName}</span>
                                  <span className={cn("text-[10px] font-mono mt-0.5 block", isDarkMode ? "text-slate-400" : "text-gray-400")}>{w.customDomain || `${w.slug}.tripbone.com`}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full font-bold uppercase font-mono text-[9px] border",
                                isDarkMode 
                                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60" 
                                  : "bg-emerald-50 text-emerald-800 border-emerald-100/60"
                              )}>
                                {formatPlanName(w.plan, plans, w.billingInterval)}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium">
                              {(() => {
                                if (w.billingInterval === 'lifetime' || w.plan?.toLowerCase().includes('lifetime')) {
                                  return 'Never (Lifetime)';
                                }
                                const createdDate = w.createdAt ? new Date(w.createdAt) : new Date();
                                const s = getWorkspaceStatus(w);
                                if (s === 'trial' && w.trialEnds) {
                                  const trialEndsDate = new Date(w.trialEnds);
                                  if (!isNaN(trialEndsDate.getTime())) {
                                    return trialEndsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                  }
                                }
                                const interval = getEffectiveInterval(w.plan, w.billingInterval);
                                const renewalDate = new Date(createdDate);
                                if (interval === 'annual') {
                                  renewalDate.setFullYear(renewalDate.getFullYear() + 1);
                                } else {
                                  renewalDate.setMonth(renewalDate.getMonth() + 1);
                                }
                                if (isNaN(renewalDate.getTime())) return 'Active';
                                return renewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                              })()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleLaunchSSO(w.slug, w.customDomain)}
                                  className="p-2 bg-[#005ea6] hover:bg-[#004e8a] text-white rounded-lg transition-colors flex items-center justify-center shadow-xs cursor-pointer"
                                  title="Login to Dashboard"
                                >
                                  <Lock className="w-4 h-4 text-white" />
                                </button>
                                <a
                                  href={getStorefrontUrl(w.slug, w.customDomain)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "p-2 border rounded-lg transition-colors flex items-center justify-center cursor-pointer",
                                    isDarkMode 
                                      ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200" 
                                      : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
                                  )}
                                  title="View Site"
                                >
                                  <Globe className="w-4 h-4 text-gray-500" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sub-Hub Section Linking to other menus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Billing Summary Box */}
                <div className={cn(
                  "border rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-all",
                  isDarkMode ? "bg-[#111928] border-slate-800" : "bg-white border-gray-200"
                )}>
                  <div>
                    <h3 className={cn("font-extrabold text-sm flex items-center space-x-2", isDarkMode ? "text-white" : "text-gray-900")}>
                      <CreditCard className="w-4.5 h-4.5 text-[#00b272]" />
                      <span>Billing & Plans</span>
                    </h3>
                    <p className={cn("text-xs mt-2.5 leading-relaxed", isDarkMode ? "text-slate-400" : "text-gray-500")}>
                      Your billing cycle is fully active. You have full permission to upgrade, downgrade, update your payment details, or review previous transaction receipts.
                    </p>
                  </div>
                  <div className={cn(
                    "mt-6 pt-4 border-t flex justify-between items-center",
                    isDarkMode ? "border-slate-800" : "border-gray-150"
                  )}>
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Gateway: Creem.io</span>
                    <button 
                      onClick={() => setActiveLeftMenu('billing')}
                      className={cn(
                        "text-xs font-bold flex items-center hover:underline cursor-pointer",
                        isDarkMode ? "text-[#00b272]" : "text-[#005ea6]"
                      )}
                    >
                      <span>Upgrade / Downgrade Plan</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                </div>

                {/* Support and Ticket Box */}
                <div className={cn(
                  "border rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-all",
                  isDarkMode ? "bg-[#111928] border-slate-800" : "bg-white border-gray-200"
                )}>
                  <div>
                    <h3 className={cn("font-extrabold text-sm flex items-center space-x-2", isDarkMode ? "text-white" : "text-gray-900")}>
                      <LifeBuoy className="w-4.5 h-4.5 text-[#00b272]" />
                      <span>Ticket & Support Helpdesk</span>
                    </h3>
                    <p className={cn("text-xs mt-2.5 leading-relaxed", isDarkMode ? "text-slate-400" : "text-gray-500")}>
                      Need specialized assistance or have questions regarding your storefront configurations? Get direct, priority developer support from the Tripbone core engineers.
                    </p>
                  </div>
                  <div className={cn(
                    "mt-6 pt-4 border-t flex justify-between items-center",
                    isDarkMode ? "border-slate-800" : "border-gray-150"
                  )}>
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Response time: &lt; 2 hours</span>
                    <button 
                      onClick={() => setActiveLeftMenu('tickets')}
                      className={cn(
                        "text-xs font-bold flex items-center hover:underline cursor-pointer",
                        isDarkMode ? "text-[#00b272]" : "text-[#005ea6]"
                      )}
                    >
                      <span>Open Support Ticket</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CENTRALIZED TENANT WORKSPACE CONSOLE PANEL */}
          {activeLeftMenu === 'tenant-console' && activeWorkspace && (
            <div className="bg-[#F8FAFC] -m-8 p-8 min-h-full">
              <Admin 
                isCentralPortal={true} 
                overrideMenu={tenantActiveMenu || 'dashboard'} 
              />
            </div>
          )}

          {/* PANEL 2: BILLING & SUBSCRIPTIONS */}
          {activeLeftMenu === 'billing' && (
            <>
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h1 className={cn("text-2xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-gray-950")}>Subscription & Billing</h1>
                <p className={cn("text-xs mt-1", isDarkMode ? "text-slate-400" : "text-gray-500")}>Review your SaaS subscriptions, package limits, and invoice history.</p>
              </div>

              <div className="flex flex-col space-y-8">
                {/* Main Column: Invoices and Sites */}
                <div className="space-y-6">

                  <div className={cn(
                    "border rounded-2xl p-6 shadow-xs h-fit",
                    isDarkMode ? "bg-[#111928] border-slate-800" : "bg-white border-gray-200"
                  )}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                      <h2 className={cn("text-sm font-bold flex items-center space-x-2", isDarkMode ? "text-white" : "text-gray-950")}>
                        <Receipt className="w-5 h-5 text-[#00b272]" />
                        <span>Invoice</span>
                      </h2>

                      <div className="flex items-center space-x-2">
                        <span className={cn("text-xs font-semibold flex items-center gap-1", isDarkMode ? "text-slate-400" : "text-gray-500")}>
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          <span>Sort by:</span>
                        </span>
                        <select
                          value={invoiceSort}
                          onChange={(e) => setInvoiceSort(e.target.value as any)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-xl text-xs font-medium border focus:outline-none transition-colors cursor-pointer",
                            isDarkMode 
                              ? "bg-slate-900 border-slate-700 text-slate-200 focus:border-indigo-500" 
                              : "bg-gray-50 border-gray-200 text-gray-800 focus:border-indigo-500"
                          )}
                        >
                          <option value="latest">Latest Invoice (Default)</option>
                          <option value="oldest">Oldest Invoice</option>
                          <option value="amount-desc">Amount: High to Low</option>
                          <option value="amount-asc">Amount: Low to High</option>
                          <option value="no-desc">Invoice ID: High to Low</option>
                          <option value="no-asc">Invoice ID: Low to High</option>
                          <option value="status">Status</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className={cn(
                            "border-b uppercase tracking-wider text-[11px] pb-3 font-bold",
                            isDarkMode ? "border-slate-800 text-slate-400" : "border-gray-200 text-slate-600"
                          )}>
                            <th className="pb-3 px-3">Invoice #</th>
                            <th className="pb-3 px-3">Package / Plan</th>
                            <th className="pb-3 px-3">Due Date</th>
                            <th className="pb-3 px-3">Amount</th>
                            <th className="pb-3 px-3 text-center">Status</th>
                            <th className="pb-3 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className={cn(
                          "divide-y",
                          isDarkMode ? "divide-slate-800/60 text-slate-300" : "divide-gray-100 text-slate-700"
                        )}>
                          {getDynamicInvoices.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-gray-500 font-sans">
                                No invoice history found for this workspace.
                              </td>
                            </tr>
                          ) : (
                            getDynamicInvoices.map((invoice) => {
                              const isLifetime = invoice.billingInterval === 'lifetime' || 
                                                 activeWorkspace?.billingInterval === 'lifetime' || 
                                                 String(invoice.dueDate || '').toLowerCase().includes('lifetime') ||
                                                 String(invoice.plan || '').toLowerCase().includes('lifetime');

                              const displayAmount = (() => {
                                const raw = invoice.amount ?? invoice.totalAmount ?? invoice.price;
                                if (typeof raw === 'number' && raw > 0) return `$${raw.toFixed(2)}`;
                                if (typeof raw === 'string' && raw.trim() !== '') {
                                  const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
                                  if (!isNaN(num) && num > 0) return `$${num.toFixed(2)}`;
                                  if (raw.startsWith('$')) return raw;
                                  return `$${raw}`;
                                }
                                const effInterval = invoice.billingInterval || activeWorkspace?.billingInterval || 'monthly';
                                const p = getPlanPrice(invoice.plan || activeWorkspace?.plan, effInterval, plans);
                                return `$${p || 49}.00`;
                              })();

                              return (
                                <tr 
                                  key={invoice.no || invoice.id}
                                  onClick={() => setPreviewingInvoice(invoice)}
                                  className={cn(
                                    "transition-colors cursor-pointer group",
                                    isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                                  )}
                                >
                                  <td className="py-4 px-3">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewingInvoice(invoice);
                                      }}
                                      className="cursor-pointer flex items-center gap-1.5 text-left transition-colors"
                                      title="Preview invoice statement"
                                    >
                                      <span className={cn(
                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-black tracking-tight border shadow-2xs transition-colors",
                                        isDarkMode 
                                          ? "bg-slate-800 text-indigo-300 border-slate-700 group-hover:border-indigo-400 group-hover:text-white" 
                                          : "bg-slate-100 text-indigo-900 border-slate-300 group-hover:bg-indigo-50 group-hover:border-indigo-400 group-hover:text-indigo-950"
                                      )}>
                                        #{invoice.no || invoice.id}
                                      </span>
                                    </button>
                                  </td>
                                  <td className="py-4 px-3">
                                    <span className={cn(
                                      "px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide inline-block border shadow-2xs",
                                      isDarkMode ? "bg-slate-800 text-slate-100 border-slate-700" : "bg-slate-100 text-slate-900 border-slate-300"
                                    )}>
                                      {formatPlanName(invoice.plan || activeWorkspace?.plan, plans, invoice.billingInterval || activeWorkspace?.billingInterval)}
                                    </span>
                                  </td>
                                  <td className="py-4 px-3">
                                    {isLifetime ? (
                                      <span className={cn(
                                        "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border shadow-2xs",
                                        isDarkMode ? "bg-emerald-950/80 text-emerald-300 border-emerald-700" : "bg-emerald-50 text-emerald-900 border-emerald-300"
                                      )}>
                                        ✨ Lifetime Access
                                      </span>
                                    ) : (
                                      <span className={cn("font-semibold text-xs", isDarkMode ? "text-slate-200" : "text-slate-900")}>
                                        {invoice.dueDate || '-'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-4 px-3">
                                    <span className={cn(
                                      "text-sm font-black font-mono tracking-tight",
                                      isDarkMode ? "text-white" : "text-gray-950"
                                    )}>
                                      {displayAmount}
                                    </span>
                                  </td>
                                  <td className="py-4 px-3 text-center">
                                    <span className={cn(
                                      "px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider inline-flex items-center shadow-2xs",
                                      invoice.status === 'PAID'
                                        ? isDarkMode ? "bg-emerald-950/70 text-emerald-300 border-emerald-800" : "bg-emerald-100 text-emerald-900 border-emerald-300"
                                        : invoice.status === 'PENDING'
                                          ? isDarkMode ? "bg-amber-950/70 text-amber-300 border-amber-800 animate-pulse" : "bg-amber-100 text-amber-900 border-amber-300 animate-pulse"
                                          : invoice.status === 'CANCELLED'
                                            ? isDarkMode ? "bg-gray-800 text-gray-300 border-gray-700" : "bg-gray-100 text-gray-700 border-gray-300"
                                            : isDarkMode ? "bg-rose-950/70 text-rose-300 border-rose-800" : "bg-rose-100 text-rose-900 border-rose-300"
                                    )}>
                                      {invoice.status || 'UNPAID'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-3 text-right">
                                    <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewingInvoice(invoice)}
                                        className={cn(
                                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 shadow-2xs cursor-pointer",
                                          isDarkMode 
                                            ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700" 
                                            : "bg-white hover:bg-gray-100 text-slate-800 border-gray-300"
                                        )}
                                        title="Preview invoice statement"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Preview</span>
                                      </button>

                                      {(invoice.status === 'UNPAID' || invoice.status === 'PENDING') && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPaymentModalInvoice(invoice);
                                              setPaymentModalMethod('creem');
                                              setPaymentModalTripayChannel('QRISC');
                                              setPaymentModalProofFile(null);
                                              setPaymentModalProofNotes('');
                                              setPaymentModalSuccess(false);
                                              setPaymentModalOpen(true);
                                            }}
                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                          >
                                            <CreditCard className="w-3.5 h-3.5" />
                                            <span>Pay</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleTenantCancelInvoice(invoice)}
                                            className={cn(
                                              "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                                              isDarkMode 
                                                ? "bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-300 border-slate-700" 
                                                : "bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-600 border-gray-300"
                                            )}
                                          >
                                            Cancel
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

{/* Your Sites & Subscriptions Section */}
            <div className={cn(
              "border rounded-2xl p-6 md:p-8 shadow-xs mt-0",
              isDarkMode ? "bg-[#111928] border-slate-800" : "bg-white border-gray-200"
            )}>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                  <h2 className={cn("text-sm font-bold flex items-center space-x-2", isDarkMode ? "text-white" : "text-slate-950")}>
                    <Layers className="w-5 h-5 text-indigo-500" />
                    <span>Your Sites & Subscriptions</span>
                  </h2>
                  <p className={cn("text-xs mt-1", isDarkMode ? "text-slate-400" : "text-gray-500")}>
                    Manage all your workspaces and their active subscription plans from a single dashboard.
                  </p>
                </div>
                <button
                  onClick={() => { setStep(2); setShowDashboard(false); }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Site</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className={cn(
                      "border-b uppercase tracking-wider text-[11px] pb-3 font-bold",
                      isDarkMode ? "border-slate-800 text-slate-400" : "border-gray-200 text-slate-600"
                    )}>
                      <th className="pb-3 font-bold px-4">Site Name</th>
                      <th className="pb-3 font-bold px-4">Subdomain</th>
                      <th className="pb-3 font-bold px-4">Current Plan</th>
                      <th className="pb-3 font-bold px-4">Billing Cycle</th>
                      <th className="pb-3 font-bold text-center px-4">Status</th>
                      <th className="pb-3 font-bold text-right px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className={cn(
                    "divide-y",
                    isDarkMode ? "divide-slate-800/60" : "divide-gray-100"
                  )}>
                    {userWorkspaces.map(workspace => {
                      const wsStatus = getWorkspaceStatus(workspace);
                      const wsStatusBadge = 
                        wsStatus === 'active' ? (isDarkMode ? "bg-emerald-950/70 text-emerald-300 border-emerald-800" : "bg-emerald-100 text-emerald-900 border-emerald-300") :
                        wsStatus === 'trial' ? (isDarkMode ? "bg-sky-950/70 text-sky-300 border-sky-800" : "bg-sky-100 text-sky-900 border-sky-300") :
                        wsStatus === 'inactive' ? (isDarkMode ? "bg-amber-950/70 text-amber-300 border-amber-800" : "bg-amber-100 text-amber-900 border-amber-300") :
                        (isDarkMode ? "bg-rose-950/70 text-rose-300 border-rose-800" : "bg-rose-100 text-rose-900 border-rose-300");

                      return (
                        <tr key={workspace.id} className={cn(
                          "transition-colors",
                          isDarkMode ? "hover:bg-slate-800/30 text-slate-300" : "hover:bg-slate-50 text-slate-700"
                        )}>
                          <td className={cn("py-4 px-4 font-bold text-sm", isDarkMode ? "text-white" : "text-slate-950")}>
                            {workspace.companyName || 'Unnamed Site'}
                          </td>
                          <td className="py-4 px-4 font-medium">
                            <a 
                              href={getStorefrontUrl(workspace.slug, workspace.customDomain)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={cn("hover:underline font-bold transition-colors", isDarkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-800")}
                            >
                              {workspace.customDomain || `${workspace.slug}.tripbone.com`}
                            </a>
                          </td>
                          <td className={cn("py-4 px-4 font-bold capitalize text-xs", isDarkMode ? "text-white" : "text-slate-950")}>
                            {formatPlanName(workspace.plan, plans, workspace.billingInterval)}
                          </td>
                          <td className={cn("py-4 px-4 capitalize font-semibold text-xs", isDarkMode ? "text-slate-300" : "text-slate-800")}>
                            {getEffectiveInterval(workspace.plan, workspace.billingInterval)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider shadow-2xs inline-block",
                              wsStatusBadge
                            )}>
                              {wsStatus}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => setSelectedWorkspaceId(workspace.id)}
                              className={cn(
                                "px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer",
                                activeWorkspace?.id === workspace.id
                                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                  : isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200"
                              )}
                            >
                              {activeWorkspace?.id === workspace.id ? 'Active Dashboard' : 'Manage Site'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
                </div>

                {/* Sidebar Column: Package Info */}
                <div className="space-y-6">
                  <div className={cn(
                    "border rounded-2xl p-6 relative overflow-hidden shadow-xs",
                    isDarkMode ? "bg-[#111928] border-slate-800" : "bg-white border-gray-200"
                  )}>
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h2 className={cn("text-sm font-bold flex items-center space-x-2", isDarkMode ? "text-white" : "text-gray-950")}>
                        <CreditCard className="w-5 h-5 text-[#00b272]" />
                        <span>Current Package Summary</span>
                      </h2>
                      <Link 
                        to="/redeem" 
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30 transition-colors flex items-center space-x-1.5"
                      >
                        <Tag className="w-3.5 h-3.5 text-amber-500" />
                        <span>Redeem AppSumo Code</span>
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                      <div className={cn(
                        "p-4 border rounded-xl",
                        isDarkMode ? "bg-[#162235]/60 border-slate-800" : "bg-slate-50 border-gray-100"
                      )}>
                        <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider font-bold">Selected Plan</span>
                        <p className={cn("text-base font-bold mt-1 capitalize", isDarkMode ? "text-white" : "text-gray-800")}>
                          {formatPlanName(activeWorkspace?.plan, plans, activeWorkspace?.billingInterval)}
                        </p>
                      </div>
                      <div className={cn(
                        "p-4 border rounded-xl",
                        isDarkMode ? "bg-[#162235]/60 border-slate-800" : "bg-slate-50 border-gray-100"
                      )}>
                        <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider font-bold">Pricing Model</span>
                        <p className={cn("text-base font-bold mt-1", isDarkMode ? "text-white" : "text-gray-800")}>
                          {(() => {
                            const effectiveInterval = getEffectiveInterval(activeWorkspace?.plan, activeWorkspace?.billingInterval);
                            const planPrice = getPlanPrice(activeWorkspace?.plan, effectiveInterval, plans);
                            const intervalLabel = effectiveInterval === 'lifetime' ? 'lifetime' : effectiveInterval === 'annual' ? 'yr' : 'mo';
                            return effectiveInterval === 'lifetime' ? `$${planPrice}.00 / lifetime` : `$${planPrice}.00 / ${intervalLabel}`;
                          })()}
                        </p>
                      </div>
                      <div className={cn(
                        "p-4 border rounded-xl",
                        isDarkMode ? "bg-[#162235]/60 border-slate-800" : "bg-slate-50 border-gray-100"
                      )}>
                        <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider font-bold">Date Active</span>
                        <p className={cn("text-base font-bold mt-1", isDarkMode ? "text-white" : "text-gray-800")}>
                          {dateActiveStr}
                        </p>
                      </div>
                      <div className={cn(
                        "p-4 border rounded-xl",
                        isDarkMode ? "bg-[#162235]/60 border-slate-800" : "bg-slate-50 border-gray-100"
                      )}>
                        <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider font-bold">Renewal Due Date</span>
                        <p className={cn("text-base font-bold mt-1 text-emerald-500", isDarkMode ? "text-emerald-400" : "text-emerald-600")}>
                          {dueDateStr}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 space-y-3">
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-mono">Plan Entitlements:</h3>
                      <ul className={cn("grid grid-cols-1 md:grid-cols-2 gap-3 text-xs", isDarkMode ? "text-slate-350" : "text-gray-500")}>
                        {(() => {
                          const matchedPlan = plans.find(p => p.slug?.toLowerCase() === activeWorkspace?.plan?.toLowerCase());
                          if (matchedPlan && Array.isArray(matchedPlan.features) && matchedPlan.features.length > 0) {
                            return matchedPlan.features.map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                <span>{feature}</span>
                              </li>
                            ));
                          }
                          return (
                            <>
                              <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                <span>Custom Subdomain & Custom Domains Support</span>
                              </li>
                              <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                <span>AI Concierge Guest Assistant Context</span>
                              </li>
                              <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                <span>Multi-Currency Storefront Templates</span>
                              </li>
                              <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                <span>Automated WhatsApp Updates</span>
                              </li>
                            </>
                          );
                        })()}
                      </ul>
                    </div>

                    <div className={cn("mt-8 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4", isDarkMode ? "border-slate-800" : "border-gray-100")}>
                      <p className="text-xs text-gray-400 max-w-md">
                        To update billing methods, add card details, view credit details, or cancel your active package, visit the billing portal.
                      </p>
                      <button
                        type="button"
                        onClick={handleRenewSubscription}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer"
                      >
                        <span>Renewal Subscription</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  
{/* Real Database Package Synchronization Section */}
                  {activeWorkspace && (
                    <div className={cn(
                      "border rounded-2xl p-6 shadow-xs space-y-6 animate-fadeIn",
                      isDarkMode ? "bg-[#111928] border-slate-800" : "bg-white border-gray-200"
                    )}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className={cn("text-sm font-bold flex items-center space-x-2", isDarkMode ? "text-white" : "text-gray-950")}>
                            <Sparkles className="w-5 h-5 text-emerald-500" />
                            <span>Change Package Plan</span>
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            Select a package below to update your tenant workspace plan directly in the database.
                          </p>
                        </div>
                        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                          {(['monthly', 'annual', 'lifetime'] as const).map(interval => (
                            <button
                              key={interval}
                              onClick={() => setBillingInterval(interval)}
                              className={cn(
                                "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all capitalize",
                                billingInterval === interval 
                                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm" 
                                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                              )}
                            >
                              {interval}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plans
                          .filter(p => p.isActive && p.interval === billingInterval)
                          .sort((a, b) => (a.price || 0) - (b.price || 0))
                          .map((pkg: any) => {
                          const isCurrent = activeWorkspace.plan?.toLowerCase() === pkg.slug?.toLowerCase();
                          const displayPrice = pkg.price;
                          const priceStr = typeof displayPrice === 'number' ? `$${displayPrice} / ${pkg.interval || 'mo'}` : displayPrice;
                          const descStr = Array.isArray(pkg.features) && pkg.features.length > 0 ? pkg.features[0] : (pkg.desc || '');
                          
                          return (
                            <button
                              key={pkg.slug}
                              type="button"
                              onClick={() => handleSavePlan(pkg)}
                              disabled={isCurrent}
                              className={cn(
                                "p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-32 group cursor-pointer",
                                isCurrent 
                                  ? isDarkMode
                                    ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                                    : "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/15"
                                  : isDarkMode
                                    ? "border-slate-800 bg-[#0c1220] hover:border-slate-700 hover:bg-slate-800/40"
                                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50"
                              )}
                            >
                              <div>
                                <div className="flex justify-between items-center">
                                  <span className={cn(
                                    "text-xs font-bold transition-colors",
                                    isCurrent ? "text-emerald-500" : isDarkMode ? "text-white group-hover:text-emerald-400" : "text-gray-900 group-hover:text-indigo-600"
                                  )}>
                                    {pkg.name}
                                  </span>
                                  {isCurrent && (
                                    <span className={cn(
                                      "text-[10px] font-black px-2 py-0.5 rounded-full border",
                                      isDarkMode ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/60" : "text-emerald-700 bg-emerald-50 border-emerald-150"
                                    )}>
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{descStr}</p>
                              </div>
                              <span className={cn(
                                "text-sm font-extrabold transition-colors mt-2 capitalize",
                                isCurrent ? "text-emerald-500" : isDarkMode ? "text-slate-300 group-hover:text-emerald-400" : "text-indigo-600 group-hover:text-indigo-700"
                              )}>
                                {priceStr}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

              </div>
            </div>
            </div>
            </>
        )}

{/* PANEL 3: CUSTOM DOMAINS */}
          {activeLeftMenu === 'domain' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">SaaS Domain Settings</h1>
                <p className="text-xs text-gray-400 mt-1">Configure your DNS server settings to point your custom travel domain to our platform.</p>
              </div>

              {activeWorkspace && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-3xl space-y-6">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-indigo-500" /> Point Custom Domain
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Set up your own branded website domain. Enter your custom domain address below to link it to your `{activeWorkspace.slug}` workspace.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs font-sans">https://</span>
                      <input 
                        type="text"
                        placeholder="booking.yourdomain.com"
                        value={customDomainInput}
                        onChange={(e) => setCustomDomainInput(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 hover:border-gray-300 rounded-xl py-3.5 pl-18 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all focus:outline-none focus:bg-white focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveCustomDomain}
                      className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md shrink-0"
                    >
                      Save Configuration
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400">Use a subdomain like <code className="text-indigo-600 font-bold">booking.myagency.com</code> or a root domain like <code className="text-indigo-600 font-bold">myagency.com</code>.</p>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-3xl">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Required DNS Records</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                  To point your custom domain (e.g. `www.myadventures.com`) to your Tripbone storefront workspace, configure the following DNS records in your domain registrar:
                </p>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="p-4 bg-slate-50 border border-gray-150 rounded-xl">
                    <span className="text-[10px] text-[#00b272] font-bold block mb-2 font-sans">RECORD TYPE A (Apex domain)</span>
                    <div className="flex justify-between">
                      <span className="text-gray-450">Host / Name:</span>
                      <span className="text-gray-800 font-bold">@</span>
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-gray-450">Value / IP address:</span>
                      <span className="text-gray-800 font-bold">76.76.21.21</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-gray-150 rounded-xl">
                    <span className="text-[10px] text-[#00b272] font-bold block mb-2 font-sans">RECORD CNAME (Subdomain)</span>
                    <div className="flex justify-between">
                      <span className="text-gray-450">Host / Name:</span>
                      <span className="text-gray-800 font-bold">www</span>
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-gray-450">Value / Target:</span>
                      <span className="text-gray-800 font-bold">cname.tripbone.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 4: DEVELOPER API KEYS */}
          {activeLeftMenu === 'apps' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Developer API Credentials</h1>
                <p className="text-xs text-gray-400 mt-1">Use these test credential keys to integrate custom headless widgets or query real-time booking data.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-3xl space-y-6">
                <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
                  <Key className="w-5 h-5 text-[#00b272]" />
                  <span>API Keys & Authentication</span>
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 font-mono">Publishable Key</label>
                    <div className="relative flex items-center shadow-sm rounded-xl border border-gray-200 overflow-hidden bg-slate-50">
                      <input
                        type="text"
                        readOnly
                        value={`pk_live_${activeWorkspace?.id || currentUser?.uid.slice(0, 16)}`}
                        className="w-full px-4 py-3 bg-transparent text-xs font-mono text-gray-500 focus:outline-none pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`pk_live_${activeWorkspace?.id || currentUser?.uid.slice(0, 16)}`);
                          setSuccess('Copied Publishable Key to Clipboard!');
                        }}
                        className="absolute right-3 text-gray-400 hover:text-[#00b272] transition-colors"
                        title="Copy to Clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 font-mono">Secret Integration Token</label>
                    <div className="relative flex items-center shadow-sm rounded-xl border border-gray-200 overflow-hidden bg-slate-50">
                      <input
                        type="text"
                        readOnly
                        value={`sk_live_secret_${activeWorkspace?.id || currentUser?.uid.slice(0, 24)}`}
                        className="w-full px-4 py-3 bg-transparent text-xs font-mono text-gray-500 focus:outline-none pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`sk_live_secret_${activeWorkspace?.id || currentUser?.uid.slice(0, 24)}`);
                          setSuccess('Copied Secret Key to Clipboard!');
                        }}
                        className="absolute right-3 text-gray-400 hover:text-[#00b272] transition-colors"
                        title="Copy to Clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 3.5: MY SITE (Active workspace information & links) */}
          {activeLeftMenu === 'my-site' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h1 className={cn("text-2xl font-extrabold", isDarkMode ? "text-white" : "text-gray-900")}>My Sites & Storefronts</h1>
                <p className={cn("text-xs mt-1", isDarkMode ? "text-slate-400" : "text-gray-500")}>
                  Manage, preview, and access the admin console for all your custom travel agency storefront workspaces.
                </p>
              </div>

              {userWorkspaces.length === 0 ? (
                <div className={cn(
                  "border rounded-2xl p-10 text-center space-y-4",
                  isDarkMode ? "bg-[#111928] border-slate-800" : "bg-white border-gray-200"
                )}>
                  <Globe className="w-12 h-12 text-gray-400 mx-auto" />
                  <h3 className={cn("font-bold text-lg", isDarkMode ? "text-white" : "text-gray-850")}>No active workspaces found</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    You haven't provisioned any travel agency workspaces yet. Create your first travel storefront to begin publishing tour packages!
                  </p>
                  <button
                    onClick={() => { setStep(2); setShowDashboard(false); }}
                    className="px-5 py-2.5 bg-[#00b272] hover:bg-[#009c63] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Create a Workspace
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userWorkspaces.map((ws) => (
                    <div
                      key={ws.id}
                      className={cn(
                        "border rounded-2xl p-6 shadow-sm relative group flex flex-col justify-between transition-all duration-300 hover:border-emerald-500/40",
                        isDarkMode ? "bg-[#111928] border-slate-800 text-white" : "bg-white border-gray-200 text-gray-800"
                      )}
                    >
                      <div>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-inner" style={{ backgroundColor: ws.primaryColor || '#00b272' }}>
                            {ws.companyName.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className={cn("text-sm font-bold", isDarkMode ? "text-white" : "text-gray-900")}>{ws.companyName}</h3>
                            <span className="text-[10px] font-mono text-gray-400 block">{ws.customDomain || `${ws.slug}.tripbone.com`}</span>
                          </div>
                        </div>

                        <div className={cn("border-t my-4", isDarkMode ? "border-slate-800" : "border-gray-100")} />

                        <div className="space-y-2 text-xs text-slate-400">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Storefront URL:</span>
                            <div className="flex items-center gap-2">
                              <a 
                                href={getStorefrontUrl(ws.slug, ws.customDomain)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn("flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all border", isDarkMode ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50")}
                              >
                                {ws.customDomain || `${ws.slug}.tripbone.com`}
                              </a>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Primary Contact:</span>
                            <span className={isDarkMode ? "text-slate-300" : "text-gray-750"}>{ws.email || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Currency Settings:</span>
                            <span className="font-mono font-bold text-gray-500">{ws.currency || 'USD'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-dashed border-gray-200/20 grid grid-cols-2 gap-3">
                        <a
                          href={getStorefrontUrl(ws.slug, ws.customDomain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "py-2 px-3 border rounded-xl text-[11px] font-bold transition-all text-center flex items-center justify-center space-x-1.5 cursor-pointer",
                            isDarkMode 
                              ? "border-slate-800 bg-slate-800/30 hover:bg-slate-800 text-slate-250" 
                              : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                          )}
                        >
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                          <span>Visit Storefront</span>
                        </a>
                        <button
                          onClick={() => handleLaunchSSO(ws.slug, ws.customDomain)}
                          className="py-2.5 px-3 bg-[#005ea6] hover:bg-[#004e8a] text-white rounded-xl text-[11px] font-bold shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-indigo-200" />
                          <span>Admin Console ↗</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PANEL 3.8: KNOWLEDGE BASE (Interactive, comprehensive instructions system) */}
          {activeLeftMenu === 'docs' && (
            <SaaSKnowledgeBase isDarkMode={isDarkMode} />
          )}

          {/* PANEL 5: SUPPORT & TICKETS */}
          {activeLeftMenu === 'tickets' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h1 className={cn("text-2xl font-extrabold", isDarkMode ? "text-white" : "text-gray-900")}>Support & Tickets</h1>
                <p className="text-xs text-gray-400 mt-1">Submit technical assistance inquiries or review active customer service threads.</p>
              </div>
              <TicketManager isTenantPortal={true} />
            </div>
          )}

          {/* PANEL 6: OPERATOR PROFILE */}
          {activeLeftMenu === 'profile' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h1 className={cn("text-2xl font-extrabold", isDarkMode ? "text-white" : "text-gray-900")}>Operator Profile</h1>
                <p className="text-xs text-gray-400 mt-1">Manage your administrative details and account settings.</p>
              </div>

              <div className={cn(
                "border rounded-2xl p-6 shadow-sm max-w-3xl transition-colors",
                isDarkMode ? "bg-[#111928] border-slate-800" : "bg-white border-gray-200"
              )}>
                <h2 className={cn(
                  "text-sm font-bold mb-6 flex items-center space-x-2",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  <User className="w-5 h-5 text-[#00b272]" />
                  <span>Operator Details</span>
                </h2>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Account Email</label>
                      <input
                        type="email"
                        disabled
                        value={currentUser.email || ''}
                        className={cn(
                          "w-full px-4 py-3 border rounded-xl text-sm font-mono focus:outline-none cursor-not-allowed",
                          isDarkMode ? "bg-[#0b101b] border-slate-800 text-slate-400" : "bg-slate-50 border-gray-150 text-gray-400"
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Operator Name / Company</label>
                      <input
                        type="text"
                        required
                        value={operatorNameInput}
                        onChange={(e) => setOperatorNameInput(e.target.value)}
                        className={cn(
                          "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors shadow-sm",
                          isDarkMode ? "bg-[#0b101b] border-slate-700 text-white focus:border-[#00b272]" : "bg-white border-gray-200 text-gray-800 focus:border-[#005ea6]"
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Contact Phone</label>
                      <input
                        type="text"
                        value={operatorPhoneInput}
                        onChange={(e) => setOperatorPhoneInput(e.target.value)}
                        className={cn(
                          "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors shadow-sm",
                          isDarkMode ? "bg-[#0b101b] border-slate-700 text-white focus:border-[#00b272]" : "bg-white border-gray-200 text-gray-800 focus:border-[#005ea6]"
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Office Address</label>
                      <input
                        type="text"
                        value={operatorAddressInput}
                        onChange={(e) => setOperatorAddressInput(e.target.value)}
                        className={cn(
                          "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors shadow-sm",
                          isDarkMode ? "bg-[#0b101b] border-slate-700 text-white focus:border-[#00b272]" : "bg-white border-gray-200 text-gray-800 focus:border-[#005ea6]"
                        )}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#005ea6] hover:bg-[#004e8a] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#005ea6]/15 transition-colors cursor-pointer"
                  >
                    Save Settings
                  </button>
                </form>
              </div>

              {/* Change Password Card */}
              <div className={cn(
                "border rounded-2xl p-6 shadow-sm max-w-3xl transition-colors",
                isDarkMode ? "bg-[#111928] border-slate-800" : "bg-white border-gray-200"
              )}>
                <h2 className={cn(
                  "text-sm font-bold mb-6 flex items-center space-x-2",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  <Lock className="w-5 h-5 text-indigo-500" />
                  <span>Change Password</span>
                </h2>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  {passwordError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-xl text-xs text-emerald-700 flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Old Password</label>
                      <input
                        type="password"
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        className={cn(
                          "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors shadow-sm",
                          isDarkMode ? "bg-[#0b101b] border-slate-700 text-white focus:border-[#00b272]" : "bg-white border-gray-200 text-gray-800 focus:border-[#005ea6]"
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className={cn(
                          "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors shadow-sm",
                          isDarkMode ? "bg-[#0b101b] border-slate-700 text-white focus:border-[#00b272]" : "bg-white border-gray-200 text-gray-800 focus:border-[#005ea6]"
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className={cn(
                          "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors shadow-sm",
                          isDarkMode ? "bg-[#0b101b] border-slate-700 text-white focus:border-[#00b272]" : "bg-white border-gray-200 text-gray-800 focus:border-[#005ea6]"
                        )}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/15 transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    {passwordLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </form>
              </div>

              {/* Emergency Backup Codes Card */}
              <div className={cn(
                "border rounded-2xl p-6 shadow-sm max-w-3xl transition-colors mt-8",
                isDarkMode ? "bg-[#111928] border-slate-800" : "bg-white border-gray-200"
              )}>
                <h2 className={cn(
                  "text-sm font-bold mb-2 flex items-center space-x-2",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  <Key className="w-5 h-5 text-amber-500" />
                  <span>Emergency Backup Codes</span>
                </h2>
                <p className="text-xs text-gray-400 mb-6">
                  Generate emergency backup codes to access your account if you lose access to your email. Save these codes in a safe offline location. Each backup code can only be used <strong>once</strong>.
                </p>

                {backupCodeError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{backupCodeError}</span>
                  </div>
                )}
                {backupCodeSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-xl text-xs text-emerald-700 flex items-center space-x-2 mb-4">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{backupCodeSuccess}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {backupCodes.length > 0 ? (
                    <div>
                      <p className={cn("text-xs font-semibold mb-3", isDarkMode ? "text-slate-300" : "text-gray-700")}>
                        Active Backup Codes ({backupCodes.length} remaining):
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                        {backupCodes.map((code, idx) => (
                          <div 
                            key={idx} 
                            className={cn(
                              "font-mono text-xs font-bold px-3 py-2 text-center rounded-xl border",
                              isDarkMode 
                                ? 'bg-slate-950 border-gray-800 text-gray-300' 
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                            )}
                          >
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      "p-4 rounded-xl border mb-4 text-xs",
                      isDarkMode ? "bg-slate-950/50 border-yellow-500/10 text-yellow-500/80" : "bg-yellow-50 border-yellow-250 text-yellow-800"
                    )}>
                      No backup codes generated yet. Generate emergency codes now to prevent administrator lockout.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerateBackupCodes}
                    disabled={generatingBackupCodes}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/15 transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    {generatingBackupCodes ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Generate Emergency Codes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Upgrade Modal */}
          {upgradeModalOpen && upgradeModalPlan && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className={cn("w-full max-w-md rounded-2xl shadow-2xl p-6", isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white")}>
                <h3 className={cn("text-lg font-bold mb-4", isDarkMode ? "text-white" : "text-gray-900")}>
                  Confirm Subscription Change
                </h3>
                <p className={cn("text-sm mb-6", isDarkMode ? "text-slate-400" : "text-gray-500")}>
                  You are changing your subscription to the <strong>{upgradeModalPlan.name || upgradeModalPlan.slug.toUpperCase()}</strong> plan.
                </p>
                
                <div className={cn("rounded-xl p-4 mb-6", isDarkMode ? "bg-slate-800" : "bg-gray-50")}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Current Plan</span>
                    <span className={cn("font-semibold text-sm", isDarkMode ? "text-slate-300" : "text-gray-700")}>{formatPlanName(activeWorkspace?.plan, plans, activeWorkspace?.billingInterval)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">New Plan</span>
                    <span className="font-bold text-emerald-500 text-sm">{formatPlanName(upgradeModalPlan.name || upgradeModalPlan.slug, plans, upgradeModalPlan.interval)}</span>
                  </div>
                  <div className={cn("border-t my-3", isDarkMode ? "border-slate-700" : "border-gray-200")}></div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">Price</span>
                    <span className={cn("font-bold text-lg", isDarkMode ? "text-white" : "text-gray-900")}>
                      ${upgradeModalPlan.price}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setUpgradeModalOpen(false);
                      setUpgradeModalPlan(null);
                    }}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                      isDarkMode ? "bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmUpgrade}
                    disabled={upgradeModalLoading}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
                  >
                    {upgradeModalLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Proceed to Checkout</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Payment Modal */}
          {/* Invoice Preview & Official Statement Modal */}
          {previewingInvoice && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
              <div className={cn("w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 relative transition-all my-8 max-h-[90vh] overflow-y-auto", isDarkMode ? "bg-slate-900 border border-slate-800 text-white" : "bg-white text-gray-900")}>
                {/* Header with Print and Close */}
                <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: isDarkMode ? '#1e293b' : '#f1f5f9' }}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-black text-lg">Official Subscription Invoice</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Statement</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPreviewingInvoice(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Printable Invoice Container */}
                <div className={cn("border rounded-2xl p-6 md:p-8 space-y-6", isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50/50 border-gray-100")}>
                  {/* Branding and Invoice No */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-black">Tripbone SaaS Platform</h2>
                      <p className="text-xs text-gray-500 font-medium">Enterprise Tour Operator & Booking OS</p>
                      <p className="text-xs text-gray-400 mt-1">support@tripbone.com</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-indigo-500">
                        #{previewingInvoice.no || previewingInvoice.id}
                      </div>
                      <div className="text-xs text-gray-500 font-bold mt-1">
                        Date: {previewingInvoice.invoiceDate || 'Today'}
                      </div>
                      <div className={cn(
                        "mt-2 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        previewingInvoice.status === 'PAID' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      )}>
                        {previewingInvoice.status || 'UNPAID'}
                      </div>
                    </div>
                  </div>

                  {/* Billed To */}
                  <div className="border-t border-gray-200/60 dark:border-slate-700/60 pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Billed To:</p>
                      <h4 className="font-black text-sm mt-0.5">{activeWorkspace?.companyName || 'Operator Workspace'}</h4>
                      <p className="text-xs text-gray-500 font-medium">{activeWorkspace?.adminEmail || currentUser?.email || 'operator@workspace.com'}</p>
                      <p className="text-xs text-gray-400 font-medium">{activeWorkspace?.slug ? `${activeWorkspace.slug}.tripbone.com` : 'Global Workspace'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date:</p>
                      <p className="text-xs font-bold mt-0.5">{previewingInvoice.dueDate || 'In 7 Days'}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Payment Method:</p>
                      <p className="text-xs font-bold">{previewingInvoice.paymentMethod || 'Online Gateway / Sandbox'}</p>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="border-t border-gray-200/60 dark:border-slate-700/60 pt-4">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-gray-200 dark:border-slate-700 font-black text-gray-400 uppercase tracking-wider">
                        <tr>
                          <th className="pb-2">Description</th>
                          <th className="pb-2 text-center">Qty</th>
                          <th className="pb-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-medium">
                        <tr>
                          <td className="py-3">
                            <span className="font-bold block">{formatPlanName(previewingInvoice.plan || activeWorkspace?.plan, plans, previewingInvoice.billingInterval || activeWorkspace?.billingInterval)}</span>
                            <span className="text-[11px] text-gray-400">Includes Multi-Gateway BYOPG, Channel Manager, AI Tour Planner & Booking Suite</span>
                          </td>
                          <td className="py-3 text-center">1</td>
                          <td className="py-3 text-right font-black">{previewingInvoice.amount || '$49.00'}</td>
                        </tr>
                      </tbody>
                      <tfoot className="border-t border-gray-200 dark:border-slate-700 font-bold">
                        <tr>
                          <td colSpan={2} className="pt-3 text-gray-400">Subtotal</td>
                          <td className="pt-3 text-right font-black">{previewingInvoice.amount || '$49.00'}</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="pt-1 text-gray-400">Taxes & Processing Fees (Included)</td>
                          <td className="pt-1 text-right font-black">$0.00</td>
                        </tr>
                        <tr className="text-base font-black">
                          <td colSpan={2} className="pt-3">Total Amount</td>
                          <td className="pt-3 text-right text-emerald-500">{previewingInvoice.amount || '$49.00'}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 mt-6">
                  {(previewingInvoice.status === 'UNPAID' || previewingInvoice.status === 'PENDING') && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentModalInvoice(previewingInvoice);
                        setPaymentModalMethod('creem');
                        setPaymentModalTripayChannel('QRISC');
                        setPaymentModalProofFile(null);
                        setPaymentModalProofNotes('');
                        setPaymentModalSuccess(false);
                        setPaymentModalOpen(true);
                        setPreviewingInvoice(null);
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay Invoice Now</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewingInvoice(null)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          {paymentModalOpen && paymentModalInvoice && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
              <div className={cn("w-full max-w-lg rounded-2xl shadow-2xl p-6 relative transition-all my-8", isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white")}>
                {/* Close Button */}
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className={cn("absolute top-4 right-4 p-1.5 rounded-lg border transition-colors", 
                    isDarkMode ? "border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white" : "border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>

                {paymentModalSuccess ? (
                  <div className="text-center py-8 space-y-6">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                      <Check className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className={cn("text-xl font-bold mb-2", isDarkMode ? "text-white" : "text-gray-900")}>
                        Payment Proof Submitted!
                      </h3>
                      <p className={cn("text-sm px-4", isDarkMode ? "text-slate-400" : "text-gray-500")}>
                        Your manual payment receipt for invoice <strong>{paymentModalInvoice.no}</strong> has been uploaded successfully.
                      </p>
                    </div>
                    <div className={cn("text-xs leading-relaxed max-w-sm mx-auto p-4 rounded-xl font-mono", isDarkMode ? "bg-slate-800/50 text-slate-300" : "bg-amber-50 text-amber-800 border border-amber-100")}>
                      Our finance team will verify the bank transfer. Once confirmed, your subscription status will update automatically. You can safely close this screen.
                    </div>
                    <button
                      onClick={() => setPaymentModalOpen(false)}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg"
                    >
                      Done & Back to Dashboard
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Header */}
                    <div className="mb-6">
                      <h3 className={cn("text-lg font-black tracking-tight", isDarkMode ? "text-white" : "text-gray-900")}>
                        Pay Invoice {paymentModalInvoice.no}
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">
                        Subscription Renewal / Activation
                      </p>
                    </div>

                    {/* Price Breakdown */}
                    <div className={cn("rounded-xl p-4 mb-6 border", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-gray-50/50 border-gray-100")}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-500">Plan Details</span>
                        <span className={cn("font-bold text-xs capitalize", isDarkMode ? "text-slate-200" : "text-gray-800")}>
                          {formatPlanName(paymentModalInvoice?.plan || activeWorkspace?.plan, plans, paymentModalInvoice?.billingInterval || activeWorkspace?.billingInterval)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-500">Due Date</span>
                        <span className="text-xs font-bold text-red-500">
                          {paymentModalInvoice.dueDate}
                        </span>
                      </div>

                      <div className={cn("border-t my-3 border-dashed", isDarkMode ? "border-slate-800" : "border-gray-200")}></div>

                      {/* Math parsing for breakdown */}
                      {(() => {
                        const planPrice = getPlanPrice(paymentModalInvoice.plan || activeWorkspace?.plan, paymentModalInvoice.billingInterval || activeWorkspace?.billingInterval, plans);
                        const rawAmtStr = paymentModalInvoice.amount || '';
                        const parsedRaw = parseFloat(rawAmtStr.replace(/[^0-9.]/g, '')) || 0;
                        const totalAmt = parsedRaw > 0 ? parsedRaw : planPrice;
                        const displayTotalStr = `$${totalAmt.toFixed(2)}`;
                        const vatAmt = totalAmt - (totalAmt / 1.11);
                        const baseAmt = totalAmt / 1.11;

                        const planLower = (activeWorkspace?.plan || '').toLowerCase();
                        let amountIdr = 784000;
                        if (planLower.includes('professional') || planLower.includes('pro')) {
                          amountIdr = 1584000;
                        } else if (planLower.includes('business') || planLower.includes('growth')) {
                          amountIdr = 3184000;
                        } else if (planLower.includes('enterprise')) {
                          amountIdr = 7984000;
                        }
                        const baseIdr = amountIdr / 1.11;
                        const vatIdr = amountIdr - baseIdr;

                        return (
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400">Base Subscription</span>
                              <span className={cn("font-medium", isDarkMode ? "text-slate-300" : "text-gray-700")}>
                                ${baseAmt.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400">VAT / Sales Tax (11%)</span>
                              <span className={cn("font-medium", isDarkMode ? "text-slate-300" : "text-gray-700")}>
                                ${vatAmt.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400">Processing Fee</span>
                              <span className="text-emerald-500 font-bold">FREE</span>
                            </div>
                            
                            <div className={cn("border-t my-2 border-dashed", isDarkMode ? "border-slate-800" : "border-gray-200")}></div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-500">Total in USD</span>
                              <span className={cn("font-black text-base", isDarkMode ? "text-white" : "text-gray-950")}>
                                {displayTotalStr}
                              </span>
                            </div>

                            {paymentModalMethod === 'tripay' && (
                              <div className={cn("mt-3 pt-3 border-t", isDarkMode ? "border-slate-800" : "border-gray-200")}>
                                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Local IDR Currency Breakdown</div>
                                <div className="flex justify-between items-center text-xs mb-1">
                                  <span className="text-gray-400">Base Price (IDR)</span>
                                  <span className="text-gray-500">Rp {new Intl.NumberFormat('id-ID').format(Math.round(baseIdr))}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs mb-1">
                                  <span className="text-gray-400">PPN / VAT (11%)</span>
                                  <span className="text-gray-500">Rp {new Intl.NumberFormat('id-ID').format(Math.round(vatIdr))}</span>
                                </div>
                                <div className="flex justify-between items-center font-bold text-xs text-indigo-600">
                                  <span>Total due on gateway</span>
                                  <span>Rp {new Intl.NumberFormat('id-ID').format(amountIdr)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Payment Method Selector */}
                    <div className="mb-6">
                      <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-3", isDarkMode ? "text-slate-400" : "text-gray-600")}>
                        Select Payment Method
                      </h4>
                      <div className={cn("grid gap-2.5", 
                        [creemEnabled, tripayEnabled, manualEnabled].filter(Boolean).length === 3 ? "grid-cols-3" :
                        [creemEnabled, tripayEnabled, manualEnabled].filter(Boolean).length === 2 ? "grid-cols-2" : "grid-cols-1"
                      )}>
                        {/* Creem Card option */}
                        {creemEnabled && (
                          <div
                            onClick={() => setPaymentModalMethod('creem')}
                            className={cn("p-3 border rounded-xl cursor-pointer flex flex-col justify-between items-center text-center transition-all", 
                              paymentModalMethod === 'creem' 
                                ? "border-emerald-500 bg-emerald-50/10 shadow-sm" 
                                : (isDarkMode ? "border-slate-800 hover:border-slate-700 bg-slate-900" : "border-gray-200 hover:border-gray-300 bg-white")
                            )}
                          >
                            <CreditCard className={cn("w-5 h-5 mb-2", paymentModalMethod === 'creem' ? "text-emerald-500" : "text-gray-400")} />
                            <div>
                              <div className="text-[10px] font-black leading-tight">Credit Card</div>
                              <div className="text-[8px] text-gray-400 mt-0.5">Creem.io</div>
                            </div>
                          </div>
                        )}

                        {/* Tripay option */}
                        {tripayEnabled && (
                          <div
                            onClick={() => setPaymentModalMethod('tripay')}
                            className={cn("p-3 border rounded-xl cursor-pointer flex flex-col justify-between items-center text-center transition-all", 
                              paymentModalMethod === 'tripay' 
                                ? "border-indigo-500 bg-indigo-50/10 shadow-sm" 
                                : (isDarkMode ? "border-slate-800 hover:border-slate-700 bg-slate-900" : "border-gray-200 hover:border-gray-300 bg-white")
                            )}
                          >
                            <Wallet className={cn("w-5 h-5 mb-2", paymentModalMethod === 'tripay' ? "text-indigo-500" : "text-gray-400")} />
                            <div>
                              <div className="text-[10px] font-black leading-tight">VA & QRIS</div>
                              <div className="text-[8px] text-gray-400 mt-0.5">TriPay Indo</div>
                            </div>
                          </div>
                        )}

                        {/* Manual Transfer option */}
                        {manualEnabled && (
                          <div
                            onClick={() => setPaymentModalMethod('manual')}
                            className={cn("p-3 border rounded-xl cursor-pointer flex flex-col justify-between items-center text-center transition-all", 
                              paymentModalMethod === 'manual' 
                                ? "border-amber-500 bg-amber-50/10 shadow-sm" 
                                : (isDarkMode ? "border-slate-800 hover:border-slate-700 bg-slate-900" : "border-gray-200 hover:border-gray-300 bg-white")
                            )}
                          >
                            <Building className={cn("w-5 h-5 mb-2", paymentModalMethod === 'manual' ? "text-amber-500" : "text-gray-400")} />
                            <div>
                              <div className="text-[10px] font-black leading-tight">Manual Transfer</div>
                              <div className="text-[8px] text-gray-400 mt-0.5">Bank Receipt</div>
                            </div>
                          </div>
                        )}

                        {!creemEnabled && !tripayEnabled && !manualEnabled && (
                          <div className={cn("col-span-full p-4 border rounded-xl text-center text-xs font-bold", isDarkMode ? "bg-red-950/20 border-red-900/30 text-red-400" : "bg-red-50 border-red-200 text-red-700")}>
                            ⚠️ No payment methods are currently active. Please contact support.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Context Specific Inputs */}
                    {paymentModalMethod === 'creem' && (
                      <div className={cn("p-4 rounded-xl border text-xs mb-6 flex items-start space-x-3", isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-emerald-50/50 border-emerald-100 text-emerald-800")}>
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-bold">Instant Activation:</span> Pay with local & international credit cards, debit cards, or Apple Pay. Secured and handled by Creem Checkout.
                        </div>
                      </div>
                    )}

                    {paymentModalMethod === 'tripay' && (
                      <div className="mb-6 space-y-3">
                        <div className={cn("p-4 rounded-xl border text-xs flex items-start space-x-3", isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-indigo-50/30 border-indigo-100 text-indigo-900")}>
                          <Check className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-bold">Virtual Account & QRIS:</span> Pay securely using Indonesian local banking networks. Transactions are integrated live and activate automatically.
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                            Select Payment Channel
                          </label>
                          <div className="relative">
                            <select
                              value={paymentModalTripayChannel}
                              onChange={(e) => setPaymentModalTripayChannel(e.target.value)}
                              className={cn("w-full px-4 py-2.5 rounded-xl border text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500", 
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-800"
                              )}
                            >
                              <option value="QRISC">QRIS (DANA, OVO, LinkAja, ShopeePay)</option>
                              <option value="MANDIRIV">Mandiri Virtual Account</option>
                              <option value="BNIV">BNI Virtual Account</option>
                              <option value="BRIV">BRI Virtual Account</option>
                              <option value="PERMATAV">Permata Virtual Account</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-3.5 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentModalMethod === 'manual' && (
                      <div className="mb-6 space-y-4">
                        {/* Bank transfer instructions */}
                        <div className={cn("p-4 rounded-xl border text-xs space-y-2", isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-amber-50/50 border-amber-100 text-amber-900")}>
                          <div className="font-bold text-amber-700 flex items-center space-x-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>Manual Bank Transfer Instructions</span>
                          </div>
                          <p className="font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
                            {manualInstructions || 'Bank Central Asia (BCA)\nAccount Number: 123-456-7890\nAccount Name: PT Tripbone Indonesia\n\nAfter making the payment, please upload your transfer receipt below.'}
                          </p>
                        </div>

                        {/* File Upload zone with Drag and Drop */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                            Upload Transfer Receipt
                          </label>
                          <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => {
                              if (fileInputRef.current) fileInputRef.current.click();
                            }}
                            className={cn(
                              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2",
                              dragActive 
                                ? "border-amber-500 bg-amber-50/10" 
                                : (paymentModalProofFile ? "border-emerald-500 bg-emerald-50/5" : (isDarkMode ? "border-slate-800 hover:border-slate-700 bg-slate-800" : "border-gray-200 hover:border-gray-300 bg-gray-50/50"))
                            )}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              className="hidden"
                              accept="image/*,application/pdf"
                            />
                            {paymentModalProofFile ? (
                              <>
                                <FileText className="w-8 h-8 text-emerald-500" />
                                <div>
                                  <p className="text-xs font-bold text-emerald-600 truncate max-w-xs">{paymentModalProofFile.name}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">{(paymentModalProofFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPaymentModalProofFile(null);
                                  }}
                                  className="px-2 py-1 text-[9px] bg-red-100 hover:bg-red-200 text-red-600 rounded font-bold transition-all"
                                >
                                  Remove File
                                </button>
                              </>
                            ) : (
                              <>
                                <FileText className="w-8 h-8 text-gray-400" />
                                <div>
                                  <p className="text-xs font-bold text-gray-600">Drag & Drop receipt or <span className="text-amber-600 underline">Browse</span></p>
                                  <p className="text-[10px] text-gray-400 mt-1">Supports PDF, PNG, JPG (Max 5MB)</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Reference / Notes input */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                            Sender Name / Bank / Transaction Reference
                          </label>
                          <input
                            type="text"
                            value={paymentModalProofNotes}
                            onChange={(e) => setPaymentModalProofNotes(e.target.value)}
                            placeholder="e.g. John Doe - BCA - Transfer Ref: 109348"
                            className={cn("w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold", 
                              isDarkMode ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex space-x-3 mt-8">
                      <button
                        onClick={() => setPaymentModalOpen(false)}
                        className={cn(
                          "flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                          isDarkMode ? "bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleInvoicePaymentSubmit}
                        disabled={paymentModalLoading || (paymentModalMethod === 'manual' && !paymentModalProofFile)}
                        className={cn(
                          "flex-1 px-4 py-2.5 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2",
                          paymentModalMethod === 'creem' ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/10" : "",
                          paymentModalMethod === 'tripay' ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/10" : "",
                          paymentModalMethod === 'manual' ? "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/10" : "",
                          (paymentModalMethod === 'manual' && !paymentModalProofFile) ? "opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400 shadow-none" : ""
                        )}
                      >
                        {paymentModalLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            {paymentModalMethod === 'creem' && <span>Pay Securely with Card</span>}
                            {paymentModalMethod === 'tripay' && <span>Generate Virtual Account</span>}
                            {paymentModalMethod === 'manual' && <span>Submit Payment Proof</span>}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
