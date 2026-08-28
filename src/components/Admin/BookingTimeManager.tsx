import * as LucideIcons from 'lucide-react';
const Icons = LucideIcons;
import { COUNTRIES } from '../../constants';
import { useSettings } from '../../lib/SettingsContext';
import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo, useRef } from "react";

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
import { motion, AnimatePresence } from "motion/react";
import { 
  db, auth, storage, handleFirestoreError, OperationType, getActiveTenantId 
} from "../../lib/firebase";
import { 
  collection, addDoc, updateDoc, deleteDoc, 
  doc, onSnapshot, serverTimestamp, query, orderBy,
  getDoc, setDoc, getDocs, collectionGroup, where 
} from "@/src/lib/firebase";
import { 
  Tour, TourPackage, PricingTier, AddOn, TransportOption, Coupon, PageContent, 
  ImportantInfoSection, UrgencyPoint, Booking, Review, UserProfile, Guide, 
  BlogPost, CommunicationSettings, SiteSettings, BookingLog, TourLabel, 
  Category, TourType, LocationMeta, Inquiry 
} from "../../types";
import RichTextEditor from "../RichTextEditor";
import { sendBookingEmail } from "../../lib/emailService";
import { sendWhatsAppNotification, getWhatsAppLink, generateBookingMessage, sendCustomWhatsApp } from "../../lib/whatsappService";
import { 
  Plus, Edit2, Trash2, Save, X, Check,
  Layout, LayoutTemplate, Image as ImageIcon, DollarSign, Map as MapIcon, 
  Info, List, CheckCircle, ChevronRight, 
  PlusCircle, MinusCircle, MessageCircle, Database,
  Upload, Loader2, BarChart3, FileText, TrendingUp, 
  MessageSquare, Monitor, Users, CreditCard, Settings, Wallet,
  Calendar as CalendarIcon, LayoutGrid, Clock, Briefcase, Star,
  Layers, Users2, ChevronDown, PieChart, Tag, MapPin, Globe,
  ShieldAlert, BookOpen, ShieldCheck, Phone, CheckCheck, Copy,
  Sparkles, Wand2, Lightbulb, LogOut, LifeBuoy,
  Camera, Compass, Waves, Mountain, Sun, Tent,
  Bike, Bus, Car, Plane, Sailboat, Palmtree, Navigation, Activity,
  User, CheckCircle2, AlertCircle, FileCode, Terminal, ChevronLeft,
  Share2, Printer, XCircle, ExternalLink, UserCheck, ArrowRight,
  ArrowLeft, Clock4, Ban, Bot,
  Zap, Send, Mail, Search, Hotel, Bed, Home, Building
} from "lucide-react";
import { cn, formatPrice } from "../../lib/utils";
import { uploadImage } from "../../lib/imgbb";


const BookingTimeManager = () => {
    const [slots, setSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'settings', 'timeslots_' + (getActiveTenantId() || 'global')), (snap) => {
            if (snap.exists()) {
                setSlots(snap.data().slots || []);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const toggleSlot = async (time: string) => {
        const newSlots = slots.includes(time) 
            ? slots.filter(s => s !== time) 
            : [...slots, time].sort();
        
        try {
            await setDoc(doc(db, 'settings', 'timeslots_' + (getActiveTenantId() || 'global')), { slots: newSlots });
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Global Time Slots</h2>
                <p className="text-gray-500 font-medium">Configure the default available 30-minute intervals for your tours.</p>
            </div>

            <div className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-[10px] border border-primary/10">
                    <div className="h-10 w-10 bg-primary text-white rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Default Availability</p>
                        <p className="text-xs text-gray-500 font-medium">Selected slots will be available for customers at checkout by default.</p>
                    </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {TIME_SLOTS.map(time => {
                        const isSelected = slots.includes(time);
                        return (
                            <button
                                key={time}
                                onClick={() => toggleSlot(time)}
                                className={cn(
                                    "py-3 rounded-xl text-xs font-bold transition-all border-2",
                                    isSelected 
                                        ? "bg-primary text-white border-primary shadow-lg shadow-orange-100" 
                                        : "bg-white text-gray-400 border-gray-50 hover:border-orange-200"
                                )}
                            >
                                {time}
                            </button>
                        );
                    })}
                </div>

                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {slots.length} Active Slots Selected
                    </p>
                    <button 
                        onClick={async () => {
                            if(confirm("Clear all slots?")) await setDoc(doc(db, 'settings', 'timeslots_' + (getActiveTenantId() || 'global')), { slots: [] });
                        }}
                        className="text-xs font-bold text-red-500 hover:underline"
                    >
                        Clear All
                    </button>
                </div>
            </div>
        </div>
    );
};

  const ReviewManager = ({ tours }: { tours: Tour[] }) => {
    const { settings } = useSettings();
    const [localSettings, setLocalSettings] = useState<Partial<SiteSettings>>({});
    const [savingSettings, setSavingSettings] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
    const [deletingBulk, setDeletingBulk] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showSourceSettings, setShowSourceSettings] = useState(false);
    const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
    const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
      if (settings) {
        setLocalSettings(settings);
      }
    }, [settings]);

    const handleSyncExternalReviews = async (platformName: 'google' | 'tripadvisor' | 'airbnb' | 'all') => {
      setSyncingPlatform(platformName);
      setSyncSuccessMsg(null);
      
      try {
        let targetUrl = '';
        if (platformName === 'google') targetUrl = localSettings?.googleReviewUrl || '';
        else if (platformName === 'tripadvisor') targetUrl = localSettings?.tripadvisorUrl || '';
        else if (platformName === 'airbnb') targetUrl = localSettings?.airbnbUrl || '';

        const tenantId = getActiveTenantId();
        const response = await fetch('/api/gemini/fetch-external-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: platformName,
            url: targetUrl,
            tenantId: tenantId || 'global'
          })
        });

        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.reviews)) {
          throw new Error(data.error || 'Failed to fetch reviews from external server');
        }

        const newFetchedReviews = data.reviews;

        for (const rev of newFetchedReviews) {
          await addDoc(collection(db, 'reviews'), {
            userId: 'ext-' + (rev.platform || platformName) + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            userName: rev.userName || 'Verified Guest',
            nationality: rev.nationality || 'Global Traveler',
            rating: rev.rating || 5,
            comment: rev.comment || '',
            platform: rev.platform || platformName,
            status: 'approved',
            createdAt: new Date(),
            isVerified: true
          });
        }

        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const fetched: Review[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Review));
        setReviews(fetched);

        setSyncingPlatform(null);
        setSyncSuccessMsg(`Successfully collected ${newFetchedReviews.length} real verified review(s) from ${platformName === 'all' ? 'all external review links' : platformName} into tenant showcase!`);
        setTimeout(() => setSyncSuccessMsg(null), 6000);
      } catch (err: any) {
        console.error("Error syncing external reviews:", err);
        setSyncingPlatform(null);
        alert(`Unable to sync reviews automatically: ${err.message || 'Please check network connection.'}`);
      }
    };

    const handleUpdateSetting = async (field: string, value: any) => {
      const updated = { ...localSettings, [field]: value };
      setLocalSettings(updated);
      try {
        setSavingSettings(true);
        const tenantId = getActiveTenantId();
        await setDoc(doc(db, 'settings', tenantId || 'general'), { [field]: value }, { merge: true });
        setSavingSettings(false);
      } catch (err) {
        console.error("Error saving setting:", err);
        setSavingSettings(false);
      }
    };
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [newReview, setNewReview] = useState<Partial<Review>>({
      rating: 5,
      userName: '',
      nationality: 'Australia',
      title: '',
      comment: '',
      userPhoto: '',
      images: [],
      tourDate: new Date().toISOString().split('T')[0],
      status: 'approved'
    });
    const [targetTourId, setTargetTourId] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);

    useEffect(() => {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      let unsubFallback: (() => void) | null = null;
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          setReviews(snapshot.docs.map(doc => ({ 
            id: doc.id, 
            refPath: doc.ref.path, // Store the path for easier matching
            ...doc.data() 
          } as any)));
          setLoading(false);
        },
        (error) => {
          console.error("Reviews snapshot error:", error);
          if (unsubFallback) unsubFallback();
          unsubFallback = onSnapshot(collection(db, 'reviews'), (snap) => {
            const list = snap.docs.map(doc => ({
              id: doc.id,
              refPath: doc.ref.path,
              ...doc.data()
            } as any));
            // Sort in memory (desc)
            list.sort((a, b) => {
              const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tB - tA;
            });
            setReviews(list);
          });
          setLoading(false);
        }
      );
      return () => {
        unsubscribe();
        if (unsubFallback) unsubFallback();
      };
    }, []);

    const handleCreateReview = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!targetTourId || !newReview.userName || !newReview.comment) {
        alert("Please fill in all required fields.");
        return;
      }

      try {
        const tour = tours.find(t => t.id === targetTourId);
        const reviewData = {
          ...newReview,
          tourId: targetTourId,
          tourTitle: tour?.title || 'Tour',
          status: 'approved',
          isVerified: true,
          label: 'Verified Guest',
          createdAt: serverTimestamp(),
          userId: auth.currentUser?.uid || 'admin'
        };

        await addDoc(collection(db, 'reviews'), reviewData);

        // Recalculate rating
        const reviewsSnap = await getDocs(query(collection(db, 'reviews'), where('tourId', '==', targetTourId), where('status', '==', 'approved')));
        const approvedReviews = reviewsSnap.docs.map(d => d.data() as Review);
        const count = approvedReviews.length;
        const avg = count > 0 
          ? parseFloat((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
          : 0;
            
        await updateDoc(doc(db, 'tours', targetTourId), {
          rating: avg,
          reviewsCount: count
        });

        alert("Review created successfully!");
        setShowAddForm(false);
        setNewReview({
          rating: 5,
          userName: '',
          nationality: 'Australia',
          title: '',
          comment: '',
          userPhoto: '',
          images: [],
          tourDate: new Date().toISOString().split('T')[0],
          status: 'approved'
        });
        setTargetTourId('');
      } catch (err) {
        console.error(err);
        alert("Error creating review");
      }
    };

    const handleDelete = async (review: any) => {
      if (confirm(`Delete review from ${review.userName}?`)) {
        try {
          const docRef = doc(db, review.refPath);
          const tourId = review.tourId;
          
          await deleteDoc(docRef);
          
          // Recalculate tour average rating
          if (tourId) {
            const reviewsSnap = await getDocs(query(collection(db, 'reviews'), where('tourId', '==', tourId), where('status', '==', 'approved')));
            const approvedReviews = reviewsSnap.docs.map(d => d.data() as Review);
            
            const count = approvedReviews.length;
            const avg = count > 0 
              ? parseFloat((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
              : 0;
              
            await updateDoc(doc(db, 'tours', tourId), {
              rating: avg,
              reviewsCount: count
            });
          }
          alert("Review deleted.");
        } catch (error) {
          console.error("Error deleting", error);
        }
      }
    };

    const handleDeleteSelected = async () => {
      if (selectedReviewIds.length === 0) return;
      if (!confirm(`Are you sure you want to permanently delete ${selectedReviewIds.length} selected review(s)?`)) return;

      try {
        setDeletingBulk(true);
        const toDelete = reviews.filter(r => selectedReviewIds.includes(r.id));
        for (const r of toDelete) {
          const docRef = (r as any).refPath ? doc(db, (r as any).refPath) : doc(db, 'reviews', r.id);
          await deleteDoc(docRef);
        }
        setSelectedReviewIds([]);
        setSyncSuccessMsg(`Successfully deleted ${toDelete.length} selected review(s)!`);
        setTimeout(() => setSyncSuccessMsg(null), 5000);
      } catch (err) {
        console.error("Bulk delete error:", err);
        alert("Error deleting selected reviews. Please try again.");
      } finally {
        setDeletingBulk(false);
      }
    };

    const handleClearAllExternalReviews = async () => {
      const extList = reviews.filter(r => r.platform || (r as any).userId?.startsWith('ext-') || (r as any).userId?.includes('-sync-'));
      if (extList.length === 0) {
        alert("No external/imported reviews found to delete.");
        return;
      }

      if (!confirm(`Are you sure you want to delete all ${extList.length} imported external reviews? This will immediately remove them from the website.`)) return;

      try {
        setDeletingBulk(true);
        for (const r of extList) {
          const docRef = (r as any).refPath ? doc(db, (r as any).refPath) : doc(db, 'reviews', r.id);
          await deleteDoc(docRef);
        }
        setSelectedReviewIds(prev => prev.filter(id => !extList.some(r => r.id === id)));
        setSyncSuccessMsg(`Successfully deleted all ${extList.length} imported external review(s)!`);
        setTimeout(() => setSyncSuccessMsg(null), 5000);
      } catch (err) {
        console.error("Clear external reviews error:", err);
        alert("Error clearing external reviews.");
      } finally {
        setDeletingBulk(false);
      }
    };

    const handleModerate = async (review: any, status: 'approved' | 'rejected') => {
      try {
        const docRef = doc(db, review.refPath);
        await updateDoc(docRef, { status });
        
        // Recalculate tour average rating
        const tourId = review.tourId;
        if (tourId) {
          const reviewsSnap = await getDocs(query(collection(db, 'reviews'), where('tourId', '==', tourId), where('status', '==', 'approved')));
          const approvedReviews = reviewsSnap.docs.map(d => d.data() as Review);
          
          const count = approvedReviews.length;
          const avg = count > 0 
            ? parseFloat((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
            : 0;
            
          await updateDoc(doc(db, 'tours', tourId), {
            rating: avg,
            reviewsCount: count
          });
        }
        
        alert(`Review ${status}!`);
      } catch (error) {
        console.error("Error moderating", error);
      }
    };

    if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;

    return (
      <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Guest Reviews</h2>
          <p className="text-gray-500 font-medium text-sm">Monitor and moderate all client feedback across all tours.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           {/* View Switcher */}
           <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
             <button 
               onClick={() => setViewMode('list')}
               className={cn(
                 "p-2 rounded-lg transition-all",
                 viewMode === 'list' ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
               )}
               title="List View"
             >
               <Icons.List className="h-4 w-4" />
             </button>
             <button 
               onClick={() => setViewMode('grid')}
               className={cn(
                 "p-2 rounded-lg transition-all",
                 viewMode === 'grid' ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
               )}
               title="Grid View"
             >
               <Icons.LayoutGrid className="h-4 w-4" />
             </button>
           </div>

           <button 
             onClick={() => setShowSourceSettings(!showSourceSettings)}
             className="bg-slate-900 text-white px-5 py-3 rounded-[10px] font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all border border-slate-700 cursor-pointer"
           >
             <Icons.Award className="h-4 w-4 text-amber-400" />
             {showSourceSettings ? 'Hide Review Config' : 'External Review Widget & Links'}
           </button>

           <button 
             onClick={() => setShowAddForm(!showAddForm)}
             className="bg-primary text-white px-6 py-3 rounded-[10px] font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all cursor-pointer"
           >
             {showAddForm ? <Icons.X className="h-4 w-4" /> : <Icons.Plus className="h-4 w-4" />}
             {showAddForm ? 'Cancel' : 'Write Review'}
           </button>
           <div className="flex items-center gap-4 bg-orange-50 px-6 py-3 rounded-[10px] border border-orange-100">
              <div className="flex flex-col items-center">
                 <span className="text-xl font-black text-primary">{reviews.filter(r => (r as any).status === 'approved').length}</span>
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Approved</span>
              </div>
              <div className="w-px h-6 bg-orange-100" />
              <div className="flex flex-col items-center">
                 <span className="text-xl font-black text-amber-500">{reviews.filter(r => !(r as any).status || (r as any).status === 'pending').length}</span>
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Pending</span>
              </div>
           </div>
        </div>
      </div>

        {showSourceSettings && (
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6 motion-safe:animate-in motion-safe:fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Icons.Award className="h-4 w-4 text-amber-400" />
                  Elfsight / Trustmary Style External Review Widget & Source Links
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Paste your review listing links from Google Maps, TripAdvisor, or Airbnb to collect and automatically display real verified reviews on your website.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSyncExternalReviews('all')}
                  disabled={syncingPlatform !== null || deletingBulk}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {syncingPlatform === 'all' ? (
                    <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Icons.RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Auto-Sync All Review Links
                </button>

                <button
                  type="button"
                  onClick={handleClearAllExternalReviews}
                  disabled={deletingBulk || syncingPlatform !== null}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {deletingBulk ? <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icons.Trash2 className="h-3.5 w-3.5 text-red-400" />}
                  Clear All Imported Reviews
                </button>

                <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Widget Status</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings?.externalReviewsEnabled ?? true}
                      onChange={(e) => handleUpdateSetting('externalReviewsEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {syncSuccessMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <Icons.CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                {syncSuccessMsg}
              </div>
            )}

            {/* Elfsight Live Review Widget Integration Card */}
            <div className="bg-slate-950 p-5 rounded-xl border border-amber-500/30 shadow-lg space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
                    ES
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      Elfsight Review Widget Code Integration
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                        Supports Airbnb, Google & TripAdvisor
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Paste your widget HTML embed code or App ID from Elfsight to display live customer reviews on your website.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={localSettings?.elfsightEnabled ?? true}
                    onChange={(e) => handleUpdateSetting('elfsightEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Elfsight Widget Embed Code or App ID
                </label>
                <textarea
                  rows={2}
                  value={localSettings?.elfsightEmbedCode ?? ''}
                  onChange={(e) => handleUpdateSetting('elfsightEmbedCode', e.target.value)}
                  placeholder={`Paste Elfsight code snippet e.g.:\n<script src="https://static.elfsight.com/platform/platform.js" async></script>\n<div class="elfsight-app-12345678-abcd-1234-abcd-1234567890ab" data-elfsight-app-lazy></div>`}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-mono bg-slate-900 border border-slate-700 text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-y"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>Paste full Elfsight HTML code or class (e.g., <code className="text-slate-400">elfsight-app-xxxx</code>).</span>
                  {localSettings?.elfsightEmbedCode && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Icons.CheckCircle2 className="h-3 w-3" /> Elfsight Code Loaded
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Widget Display Limit Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <Icons.Sliders className="h-4 w-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Maximum Reviews Displayed on Website</span>
                  <span className="text-[10px] text-slate-400 block">Limit the number of reviews shown in the website review showcase section</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Display Limit:</label>
                <select
                  value={localSettings?.maxDisplayReviews ?? 6}
                  onChange={(e) => handleUpdateSetting('maxDisplayReviews', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 text-amber-400 font-bold text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                >
                  <option value={3}>3 Reviews (Compact)</option>
                  <option value={6}>6 Reviews (Standard - 2 rows)</option>
                  <option value={9}>9 Reviews (3 rows)</option>
                  <option value={12}>12 Reviews (4 rows)</option>
                  <option value={18}>18 Reviews (Extended)</option>
                  <option value={999}>Show All Reviews</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-900">
              {/* Google Maps Card */}
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span className="font-bold text-xs">Google Maps Reviews</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings?.googleReviewsEnabled ?? true}
                      onChange={(e) => handleUpdateSetting('googleReviewsEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Google Maps Review Link</label>
                  <input
                    type="text"
                    value={localSettings?.googleReviewUrl ?? 'https://maps.app.goo.gl/2pB62e6cRxkjJevL6'}
                    onChange={(e) => handleUpdateSetting('googleReviewUrl', e.target.value)}
                    placeholder="https://maps.app.goo.gl/2pB62e6cRxkjJevL6"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      max="5"
                      min="1"
                      value={localSettings?.googleRating ?? 4.9}
                      onChange={(e) => handleUpdateSetting('googleRating', parseFloat(e.target.value) || 4.9)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Count</label>
                    <input
                      type="number"
                      value={localSettings?.googleReviewCount ?? 520}
                      onChange={(e) => handleUpdateSetting('googleReviewCount', parseInt(e.target.value, 10) || 520)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSyncExternalReviews('google')}
                  disabled={syncingPlatform !== null}
                  className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {syncingPlatform === 'google' ? <Icons.Loader2 className="h-3 w-3 animate-spin" /> : <Icons.Download className="h-3 w-3" />}
                  Fetch & Sync Google Reviews
                </button>
              </div>

              {/* TripAdvisor Card */}
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] flex items-center justify-center shrink-0">TA</span>
                    <span className="font-bold text-xs">TripAdvisor Reviews</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings?.tripadvisorEnabled ?? true}
                      onChange={(e) => handleUpdateSetting('tripadvisorEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TripAdvisor Listing Link</label>
                  <input
                    type="text"
                    value={localSettings?.tripadvisorUrl ?? 'https://www.tripadvisor.com/Attraction_Review-g297694-d7939737-Reviews-Bali_Adventours-Denpasar_Bali.html'}
                    onChange={(e) => handleUpdateSetting('tripadvisorUrl', e.target.value)}
                    placeholder="https://www.tripadvisor.com/Attraction_Review-g297694-d7939737-Reviews-Bali_Adventours-Denpasar_Bali.html"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      max="5"
                      min="1"
                      value={localSettings?.tripadvisorRating ?? 5.0}
                      onChange={(e) => handleUpdateSetting('tripadvisorRating', parseFloat(e.target.value) || 5.0)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Count</label>
                    <input
                      type="number"
                      value={localSettings?.tripadvisorReviewCount ?? 342}
                      onChange={(e) => handleUpdateSetting('tripadvisorReviewCount', parseInt(e.target.value, 10) || 342)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSyncExternalReviews('tripadvisor')}
                  disabled={syncingPlatform !== null}
                  className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {syncingPlatform === 'tripadvisor' ? <Icons.Loader2 className="h-3 w-3 animate-spin" /> : <Icons.Download className="h-3 w-3" />}
                  Fetch & Sync TripAdvisor Reviews
                </button>
              </div>

              {/* Airbnb Card */}
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center shrink-0">ab</span>
                    <span className="font-bold text-xs">Airbnb Reviews</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings?.airbnbEnabled ?? true}
                      onChange={(e) => handleUpdateSetting('airbnbEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Airbnb Host Listing Link</label>
                  <input
                    type="text"
                    value={localSettings?.airbnbUrl ?? 'https://www.airbnb.com/experiences/4127629'}
                    onChange={(e) => handleUpdateSetting('airbnbUrl', e.target.value)}
                    placeholder="https://www.airbnb.com/experiences/4127629"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      max="5"
                      min="1"
                      value={localSettings?.airbnbRating ?? 4.95}
                      onChange={(e) => handleUpdateSetting('airbnbRating', parseFloat(e.target.value) || 4.95)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Count</label>
                    <input
                      type="number"
                      value={localSettings?.airbnbReviewCount ?? 185}
                      onChange={(e) => handleUpdateSetting('airbnbReviewCount', parseInt(e.target.value, 10) || 185)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSyncExternalReviews('airbnb')}
                  disabled={syncingPlatform !== null}
                  className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {syncingPlatform === 'airbnb' ? <Icons.Loader2 className="h-3 w-3 animate-spin" /> : <Icons.Download className="h-3 w-3" />}
                  Fetch & Sync Airbnb Reviews
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleCreateReview} className="bg-white p-8 rounded-[10px] border border-orange-100 shadow-sm space-y-6 motion-safe:animate-in motion-safe:fade-in">
             <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Create Professional Admin Review</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Origin</label>
                   <select 
                     value={newReview.platform || 'direct'}
                     onChange={e => setNewReview({...newReview, platform: e.target.value as any})}
                     className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                   >
                     <option value="direct">Direct Website</option>
                     <option value="google">Google Maps</option>
                     <option value="tripadvisor">TripAdvisor</option>
                     <option value="airbnb">Airbnb</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Tour</label>
                   <select 
                     value={targetTourId}
                     onChange={e => setTargetTourId(e.target.value)}
                     className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                   >
                     <option value="">Select Tour...</option>
                     {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Guest Name</label>
                   <input 
                     type="text" 
                     value={newReview.userName}
                     onChange={e => setNewReview({...newReview, userName: e.target.value})}
                     className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                     placeholder="John Doe"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nationality</label>
                   <select 
                     value={newReview.nationality}
                     onChange={e => setNewReview({...newReview, nationality: e.target.value})}
                     className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                   >
                     {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Guest Avatar</label>
                   <div className="flex items-center gap-4">
                     <div className="h-14 w-14 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                       {newReview.userPhoto ? (
                         <img src={newReview.userPhoto} className="h-full w-full object-cover" />
                       ) : (
                         <Icons.User className="h-6 w-6 text-gray-300" />
                       )}
                     </div>
                     <div className="flex-1">
                       <label className="relative cursor-pointer bg-white border-2 border-gray-100 px-4 py-2 rounded-lg text-[10px] font-bold text-gray-600 hover:border-primary transition-all inline-block">
                         {uploadingAvatar ? (
                           <div className="flex items-center gap-2">
                             <Icons.Loader2 className="h-3 w-3 animate-spin" />
                             Uploading...
                           </div>
                         ) : 'Choose Photo'}
                         <input 
                           type="file" 
                           className="hidden" 
                           accept="image/*"
                           onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               try {
                                 setUploadingAvatar(true);
                                 const url = await uploadImage(file);
                                 setNewReview({...newReview, userPhoto: url});
                               } catch (err) {
                                 alert("Upload failed");
                               } finally {
                                 setUploadingAvatar(false);
                               }
                             }
                           }}
                         />
                       </label>
                       {newReview.userPhoto && (
                         <button 
                           type="button" 
                           onClick={() => setNewReview({...newReview, userPhoto: ''})}
                           className="ml-2 text-[10px] font-bold text-red-500 underline"
                         >
                           Remove
                         </button>
                       )}
                     </div>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating</label>
                   <input 
                     type="number" 
                     min="1" max="5"
                     value={newReview.rating}
                     onChange={e => setNewReview({...newReview, rating: parseInt(e.target.value)})}
                     className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tour Date</label>
                   <input 
                     type="date" 
                     value={newReview.tourDate}
                     onChange={e => setNewReview({...newReview, tourDate: e.target.value})}
                     className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                   />
                </div>
             </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Review Headline / Highlight</label>
              <input 
                type="text" 
                value={newReview.title || ''}
                onChange={e => setNewReview({...newReview, title: e.target.value})}
                className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
                placeholder="e.g. Unforgettable Sunrise Experience!"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Comment</label>
              <textarea 
                value={newReview.comment}
                onChange={e => setNewReview({...newReview, comment: e.target.value})}
                className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold focus:border-primary focus:bg-white focus:outline-none transition-all h-32"
                placeholder="Write the review content here..."
              />
            </div>

             <div className="space-y-4 pt-4 border-t border-gray-50">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Experience Photos (Optional)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {(newReview.images || []).map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                      <img src={img} className="h-full w-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setNewReview({ ...newReview, images: newReview.images?.filter((_, i) => i !== idx) })}
                        className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Icons.X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-orange-50/10 transition-all">
                    {uploadingImages ? (
                      <Icons.Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      <>
                        <Icons.Camera className="h-6 w-6 text-gray-300" />
                        <span className="text-[8px] font-black text-gray-400 uppercase">Add Photo</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          try {
                            setUploadingImages(true);
                            const urls = await Promise.all(files.map(f => uploadImage(f)));
                            setNewReview({ ...newReview, images: [...(newReview.images || []), ...urls] });
                          } catch (err) {
                            alert("Upload failed");
                          } finally {
                            setUploadingImages(false);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
             </div>

             <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
                Publish Verified Review
             </button>
          </form>
        )}

        {/* Bulk Action Toolbar */}
        {reviews.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={reviews.length > 0 && selectedReviewIds.length === reviews.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedReviewIds(reviews.map(r => r.id));
                    } else {
                      setSelectedReviewIds([]);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                Select All ({reviews.length})
              </label>

              {selectedReviewIds.length > 0 && (
                <span className="text-xs font-black text-primary bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                  {selectedReviewIds.length} Selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {selectedReviewIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deletingBulk}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  {deletingBulk ? <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icons.Trash2 className="h-3.5 w-3.5" />}
                  Delete Selected ({selectedReviewIds.length})
                </button>
              )}

              <button
                onClick={handleClearAllExternalReviews}
                disabled={deletingBulk}
                className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Icons.Trash2 className="h-3.5 w-3.5" />
                Clear External Reviews
              </button>
            </div>
          </div>
        )}

        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
        )}>
          {reviews.map(review => {
            const status = (review as any).status || 'pending';
            const isSelected = selectedReviewIds.includes(review.id);
            return (
              <div key={review.id} className={cn(
                "bg-white p-8 rounded-[10px] border shadow-sm flex flex-col gap-6 group transition-all relative",
                viewMode === 'list' ? "md:flex-row md:items-start" : "flex-col",
                status === 'approved' ? "border-orange-100" : status === 'rejected' ? "border-red-100 opacity-60" : "border-amber-200 bg-amber-50/10",
                isSelected && "ring-2 ring-primary border-primary bg-orange-50/10"
              )}>
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReviewIds(prev => [...prev, review.id]);
                      } else {
                        setSelectedReviewIds(prev => prev.filter(id => id !== review.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className={cn(
                  "h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden mt-4 md:mt-0",
                  viewMode === 'grid' && "mx-auto"
                )}>
                  {review.userPhoto ? (
                    <img src={review.userPhoto} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-2xl font-black text-primary">{review.userName.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className={cn(
                    "flex flex-col justify-between gap-4",
                    viewMode === 'list' ? "md:flex-row md:items-center" : "items-center text-center"
                  )}>
                    <div className="flex-1">
                      <div className={cn(
                        "flex items-center gap-3",
                        viewMode === 'grid' && "justify-center"
                      )}>
                        <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                           {review.userName}
                           {review.nationality && (
                             <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                               <Icons.Globe className="h-2.5 w-2.5" /> {review.nationality}
                             </span>
                           )}
                           {review.platform && (
                             <span className={cn(
                               "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1",
                               review.platform === 'google' ? "bg-blue-100 text-blue-700 border border-blue-200" :
                               review.platform === 'tripadvisor' ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                               review.platform === 'airbnb' ? "bg-rose-100 text-rose-700 border border-rose-200" :
                               "bg-purple-100 text-purple-700 border border-purple-200"
                             )}>
                               {review.platform}
                             </span>
                           )}
                        </h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                          status === 'approved' ? "bg-orange-100 text-orange-700" : 
                          status === 'rejected' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {status}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs font-bold text-gray-400 flex flex-wrap items-center gap-2 mt-0.5",
                        viewMode === 'grid' && "justify-center"
                      )}>
                         <span className="flex items-center gap-2"><Icons.Calendar className="h-3 w-3" /> Traveled on {review.tourDate || 'Unknown Date'}</span>
                         {review.tourTitle && <span className="text-primary">• Experience: {review.tourTitle}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Icons.Star key={s} className={cn("h-4 w-4", review.rating >= s ? "fill-current" : "text-gray-200")} />
                      ))}
                    </div>
                  </div>
                  <div className={cn(
                    "space-y-2",
                    viewMode === 'grid' && "text-center"
                  )}>
                     {review.title && <h4 className={cn("font-black text-gray-900", viewMode === 'list' ? "border-l-4 border-primary pl-3" : "text-lg")}>{review.title}</h4>}
                     <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">{review.comment}</p>
                  </div>
                  
                  {((review as any).images && (review as any).images.length > 0) ? (
                    <div className={cn(
                      "flex flex-wrap gap-2 mt-4",
                      viewMode === 'grid' && "justify-center"
                    )}>
                      {(review as any).images.map((img: string, idx: number) => (
                        <div key={idx} className="h-16 w-16 rounded-lg overflow-hidden border border-gray-100 shadow-sm cursor-zoom-in" onClick={() => window.open(img, '_blank')}>
                           <img src={img} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  ) : review.image && (
                    <div className={cn(
                      "mt-4 rounded-xl overflow-hidden border border-gray-100 h-24 w-40 shadow-sm cursor-zoom-in",
                      viewMode === 'grid' && "mx-auto"
                    )} onClick={() => window.open(review.image, '_blank')}>
                       <img src={review.image} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  
                  <div className="pt-6 border-t border-gray-50 flex items-center justify-end gap-3 flex-wrap">
                    {status !== 'approved' && (
                      <button 
                        onClick={() => handleModerate(review, 'approved')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                    )}
                    {status !== 'rejected' && (
                      <button 
                        onClick={() => handleModerate(review, 'rejected')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(review)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {reviews.length === 0 && (
            <div className="p-20 text-center text-gray-400 bg-white rounded-[10px] border border-gray-100 border-dashed">
               No reviews collected yet.
            </div>
          )}
        </div>
      </div>
    );
  };  const LegacyUserManager = ({ users, setUsers, onDeleteUser, roleFilter, allTours = [], resetForm, setFormData, formData, setActiveMenu }: { 
    users: UserProfile[], 
    setUsers: (u: UserProfile[]) => void, 
    onDeleteUser: (u: UserProfile) => void, 
    roleFilter?: UserProfile['role'], 
    allTours?: Tour[],
    resetForm: () => void,
    setFormData: (f: any) => void,
    formData: any,
    setActiveMenu: (m: any) => void
  }) => {
    const [loading, setLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [isAddingPartner, setIsAddingPartner] = useState(false);
    const [newPartner, setNewPartner] = useState<Partial<UserProfile>>({
      role: roleFilter || 'supplier',
      status: 'active',
      displayName: '',
      email: '',
      companyName: '',
      commissionRate: 10,
      discountRate: 15
    });

    // Update newPartner role if roleFilter changes
    useEffect(() => {
      if (roleFilter) {
        setNewPartner(prev => ({ ...prev, role: roleFilter }));
      }
    }, [roleFilter]);

    useEffect(() => {
      const tenantId = getActiveTenantId();
      const q = tenantId 
        ? query(collection(db, 'users'), where('tenantId', '==', tenantId))
        : query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let list = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        list.sort((a: any, b: any) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setUsers(list);
        setLoading(false);
      });
      return unsubscribe;
    }, []);

    const filteredUsers = useMemo(() => {
      if (!roleFilter) return users;
      return users.filter(u => u.role === roleFilter);
    }, [users, roleFilter]);

    const handleCreatePartner = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPartner.email || !newPartner.displayName) {
        alert("Email and Name are required");
        return;
      }
      
      const tempId = `u_${Math.random().toString(36).substr(2, 9)}`;
      console.log("[Admin] Attempting to create user:", {
        email: newPartner.email,
        role: newPartner.role,
        currentUser: auth.currentUser?.email,
        authUid: auth.currentUser?.uid,
        tempId
      });
      
      setLoading(true);
      try {
        const partnerData = {
          ...newPartner,
          uid: tempId,
          photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(newPartner.displayName || '')}&background=random`,
          tenantId: getActiveTenantId(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        console.log("[Admin] Target path: users/" + tempId);
        await setDoc(doc(db, 'users', tempId), partnerData);
        console.log("[Admin] User created successfully");
        
        setIsAddingPartner(false);
        setNewPartner({
          role: roleFilter || 'supplier',
          status: 'active',
          displayName: '',
          email: '',
          companyName: '',
          commissionRate: 10,
          discountRate: 15
        });
        alert(`${newPartner.role?.charAt(0).toUpperCase()}${newPartner.role?.slice(1)} account created! Note: They still need to sign up with this email to access their dashboard.`);
      } catch (error: any) {
        console.error("Error creating user", error);
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.WRITE, `users/${tempId}`);
        }
        alert("Failed to create user. " + (error.message || ""));
      } finally {
        setLoading(false);
      }
    };
;

    const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      try {
        await updateDoc(doc(db, 'users', editingUser.uid), {
          role: editingUser.role,
          status: editingUser.status || 'active',
          commissionRate: Number(editingUser.commissionRate || 0),
          discountRate: Number(editingUser.discountRate || 0),
          companyName: editingUser.companyName || '',
          publicEmail: editingUser.publicEmail || '',
          taxId: editingUser.taxId || '',
          phoneNumber: editingUser.phoneNumber || '',
          website: editingUser.website || '',
          instagramUrl: editingUser.instagramUrl || '',
          facebookUrl: editingUser.facebookUrl || '',
          twitterUrl: editingUser.twitterUrl || '',
          tiktokUrl: editingUser.tiktokUrl || '',
          payoutMethod: editingUser.payoutMethod || null,
          updatedAt: serverTimestamp()
        });
        setEditingUser(null);
        alert("User updated successfully!");
      } catch (error) {
        console.error("Error updating user", error);
        alert("Failed to update user.");
      }
    };

    const handleDeleteUserLocal = async (user: UserProfile) => {
      setLoading(true);
      await onDeleteUser(user);
      setLoading(false);
    };

    if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;

    const roleName = roleFilter ? roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1) : 'System';

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{roleName} Users</h2>
            <p className="text-gray-500 font-medium">Manage permissions, roles, and financial terms.</p>
          </div>
          <button 
            onClick={() => setIsAddingPartner(true)}
            className="px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all flex items-center gap-2"
          >
            <Icons.PlusCircle className="h-4 w-4" /> Add New {roleFilter || 'User'}
          </button>
        </div>

        <div className="bg-white rounded-[10px] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                {roleFilter === 'supplier' && (
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Tours</th>
                )}
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Commission/Discount</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map(u => (
                <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <img src={u.photoURL} className="h-10 w-10 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                       <div>
                         <p className="text-sm font-black text-gray-900">{u.displayName}</p>
                         <p className="text-[10px] font-bold text-gray-400 tracking-tight">{u.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={cn(
                       "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                       u.role === 'admin' ? "bg-red-50 text-red-600" :
                       u.role === 'supplier' ? "bg-purple-50 text-purple-600" :
                       u.role === 'agent' ? "bg-blue-50 text-blue-600" :
                       "bg-gray-100 text-gray-500"
                     )}>
                       {u.role}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5">
                       <div className={cn(
                         "h-1.5 w-1.5 rounded-full",
                         u.status === 'active' || !u.status ? "bg-orange-500" :
                         u.status === 'pending' ? "bg-amber-500" : "bg-red-500"
                       )} />
                       <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest">
                         {u.status || 'active'}
                       </span>
                     </div>
                  </td>
                  {roleFilter === 'supplier' && (
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {allTours.filter(t => t.supplierId === u.uid).map(t => (
                          <button
                            key={t.id}
                            onClick={() => window.open(`/tours/${t.slug}`, '_blank')}
                            className="bg-gray-100 text-[9px] font-black uppercase text-gray-500 px-2 py-1 rounded-md hover:bg-primary/10 hover:text-primary transition-all whitespace-nowrap"
                            title={t.title}
                          >
                            {t.title}
                          </button>
                        ))}
                        {allTours.filter(t => t.supplierId === u.uid).length === 0 && (
                          <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-xl border border-dashed border-gray-200 w-full">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight">No Tours Assigned</span>
                            <button 
                              onClick={() => {
                                resetForm();
                                setFormData({ ...formData, supplierId: u.uid, supplierName: u.companyName || u.displayName });
                                setActiveMenu('tours');
                              }}
                              className="text-[9px] font-bold text-primary hover:underline mt-0.5"
                            >
                              + Create First Tour
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 text-xs font-black text-gray-900">
                    {u.role === 'supplier' ? `${u.commissionRate || 0}% Fee` : 
                     u.role === 'agent' ? `${u.discountRate || 0}% Disc` : 
                     '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <div className="flex justify-end gap-2">
                       <button 
                         onClick={() => setEditingUser(u)}
                         className="p-2 text-gray-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-all"
                         title="Edit User"
                       >
                          <Icons.Settings className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => handleDeleteUserLocal(u)}
                         className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                         title="Delete User"
                       >
                          <Icons.Trash2 className="h-4 w-4" />
                       </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add New Partner Modal */}
        <AnimatePresence>
          {isAddingPartner && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddingPartner(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-8 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Create New {roleFilter ? roleName : 'User'}</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Manual account setup</p>
                  </div>
                  <button onClick={() => setIsAddingPartner(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                    <Icons.X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-8 pt-6 space-y-8 overflow-y-auto custom-scrollbar flex-grow">
                  <form onSubmit={handleCreatePartner} id="create-partner-form" className="space-y-6">
                    {!roleFilter && (
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">User Role</label>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {(['admin', 'supplier', 'agent', 'customer'] as UserProfile['role'][]).map(r => (
                              <button 
                                key={r}
                                type="button" 
                                onClick={() => setNewPartner({...newPartner, role: r})}
                                className={cn(
                                  "p-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest", 
                                  newPartner.role === r 
                                    ? "border-primary bg-orange-50 text-orange-700" 
                                    : "border-gray-50 text-gray-400"
                                )}>
                                 {r}
                              </button>
                            ))}
                         </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name / Contact Person</label>
                        <input
                          required
                          type="text"
                          value={newPartner.displayName}
                          onChange={(e) => setNewPartner({...newPartner, displayName: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email (Primary for notifications)</label>
                        <input
                          required
                          type="email"
                          value={newPartner.email}
                          onChange={(e) => setNewPartner({...newPartner, email: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                          placeholder="partner@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Company Name</label>
                        <input
                          type="text"
                          value={newPartner.companyName}
                          onChange={(e) => setNewPartner({...newPartner, companyName: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                          placeholder="e.g. Bali Tours Ltd."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                          {newPartner.role === 'supplier' ? 'Commission Fee (%)' : 'Wholesale Discount (%)'}
                        </label>
                        <input
                          type="number"
                          value={newPartner.role === 'supplier' ? newPartner.commissionRate : newPartner.discountRate}
                          onChange={(e) => setNewPartner({
                            ...newPartner, 
                            [newPartner.role === 'supplier' ? 'commissionRate' : 'discountRate']: Number(e.target.value)
                          })}
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Account Status</label>
                        <div className="flex h-11 items-center px-4 bg-gray-50 rounded-2xl">
                           <span className="text-xs font-bold text-gray-900">Active</span>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 flex-shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingPartner(false)}
                    className="flex-1 py-4 bg-white text-gray-500 border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all font-sans"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    form="create-partner-form"
                    disabled={loading}
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 disabled:opacity-50 font-sans"
                  >
                    {loading ? "Creating..." : "Save Partner Profile"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* User Edit Modal */}
        <AnimatePresence>
          {editingUser && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingUser(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-8 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <img src={editingUser.photoURL} className="h-12 w-12 rounded-full border-2 border-primary/10" referrerPolicy="no-referrer" />
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">Edit Profile</h3>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{editingUser.displayName}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                    <Icons.X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-8 pt-6 space-y-8 overflow-y-auto custom-scrollbar flex-grow">
                  <form onSubmit={handleSaveUser} id="edit-user-form" className="space-y-6 pb-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Access Role</label>
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="customer">Customer</option>
                          <option value="agent">Agent (Wholesale)</option>
                          <option value="supplier">Supplier (Vendor)</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Account Status</label>
                        <select
                          value={editingUser.status || 'active'}
                          onChange={(e) => setEditingUser({...editingUser, status: e.target.value as any})}
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending Approval</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </div>

                    {editingUser.role === 'supplier' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-purple-50/50 p-6 rounded-3xl border border-purple-100">
                        <div className="flex items-center gap-3 mb-2">
                          <Icons.Store className="h-5 w-5 text-purple-600" />
                          <h4 className="text-sm font-black text-purple-900 uppercase tracking-tight">Supplier Configuration</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">Platform Commission (%)</label>
                            <input
                              type="number"
                              value={editingUser.commissionRate}
                              onChange={(e) => setEditingUser({...editingUser, commissionRate: Number(e.target.value)})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                              placeholder="e.g. 15"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">Company Name</label>
                            <input
                              type="text"
                              value={editingUser.companyName}
                              onChange={(e) => setEditingUser({...editingUser, companyName: e.target.value})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                                placeholder="Legal Entity Name"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">Public / Support Email</label>
                            <input
                              type="email"
                              value={editingUser.publicEmail}
                              onChange={(e) => setEditingUser({...editingUser, publicEmail: e.target.value})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                              placeholder="For guest contact"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">WhatsApp / Phone</label>
                            <input
                              type="text"
                              value={editingUser.phoneNumber}
                              onChange={(e) => setEditingUser({...editingUser, phoneNumber: e.target.value})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                              placeholder="+62..."
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">Website</label>
                            <input
                              type="url"
                              value={editingUser.website}
                              onChange={(e) => setEditingUser({...editingUser, website: e.target.value})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                              placeholder="https://..."
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">Instagram</label>
                            <input
                              type="text"
                              value={editingUser.instagramUrl}
                              onChange={(e) => setEditingUser({...editingUser, instagramUrl: e.target.value})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                              placeholder="@handle or URL"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">Facebook</label>
                            <input
                              type="text"
                              value={editingUser.facebookUrl}
                              onChange={(e) => setEditingUser({...editingUser, facebookUrl: e.target.value})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                              placeholder="URL"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-purple-100">
                          <div className="flex items-center gap-3 mb-4">
                            <Icons.Wallet className="h-4 w-4 text-purple-600" />
                            <h5 className="text-[10px] font-black text-purple-900 uppercase tracking-widest">Payout Settings</h5>
                          </div>
                          
                          <div className="space-y-4">
                            <select
                              value={editingUser.payoutMethod?.type || 'bank_transfer'}
                              onChange={(e) => setEditingUser({
                                ...editingUser, 
                                payoutMethod: { 
                                  ...(editingUser.payoutMethod || { type: 'bank_transfer' }), 
                                  type: e.target.value as any 
                                }
                              })}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                            >
                              <option value="bank_transfer">Bank Transfer</option>
                              <option value="paypal">PayPal</option>
                              <option value="other">Other Method</option>
                            </select>

                            {(!editingUser.payoutMethod || editingUser.payoutMethod.type === 'bank_transfer') && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Bank Name</label>
                                  <input 
                                    type="text" 
                                    value={editingUser.payoutMethod?.bankName || ''}
                                    onChange={(e) => setEditingUser({
                                      ...editingUser,
                                      payoutMethod: { ...editingUser.payoutMethod!, type: 'bank_transfer', bankName: e.target.value }
                                    })}
                                    className="w-full bg-white border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Account Number</label>
                                  <input 
                                    type="text" 
                                    value={editingUser.payoutMethod?.accountNumber || ''}
                                    onChange={(e) => setEditingUser({
                                      ...editingUser,
                                      payoutMethod: { ...editingUser.payoutMethod!, type: 'bank_transfer', accountNumber: e.target.value }
                                    })}
                                    className="w-full bg-white border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                                  />
                                </div>
                                <div className="space-y-1 col-span-2">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Account Holder</label>
                                  <input 
                                    type="text" 
                                    value={editingUser.payoutMethod?.accountHolder || ''}
                                    onChange={(e) => setEditingUser({
                                      ...editingUser,
                                      payoutMethod: { ...editingUser.payoutMethod!, type: 'bank_transfer', accountHolder: e.target.value }
                                    })}
                                    className="w-full bg-white border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                                  />
                                </div>
                              </div>
                            )}

                            {editingUser.payoutMethod?.type === 'paypal' && (
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">PayPal Email</label>
                                <input 
                                  type="email" 
                                  value={editingUser.payoutMethod?.paypalEmail || ''}
                                  onChange={(e) => setEditingUser({
                                    ...editingUser,
                                    payoutMethod: { ...editingUser.payoutMethod!, type: 'paypal', paypalEmail: e.target.value }
                                  })}
                                  className="w-full bg-white border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                                />
                              </div>
                            )}

                            {editingUser.payoutMethod?.type === 'other' && (
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Payout Details</label>
                                <textarea 
                                  rows={2}
                                  value={editingUser.payoutMethod?.details || ''}
                                  onChange={(e) => setEditingUser({
                                    ...editingUser,
                                    payoutMethod: { ...editingUser.payoutMethod!, type: 'other', details: e.target.value }
                                  })}
                                  className="w-full bg-white border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-purple-200"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {editingUser.role === 'agent' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                          <Icons.BadgePercent className="h-5 w-5 text-blue-600" />
                          <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Agent Configuration</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">Base Discount (%)</label>
                            <input
                              type="number"
                              value={editingUser.discountRate}
                              onChange={(e) => setEditingUser({...editingUser, discountRate: Number(e.target.value)})}
                              className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-200"
                              placeholder="e.g. 10"
                            />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">Company / Branch</label>
                             <input
                               type="text"
                               value={editingUser.companyName}
                               onChange={(e) => setEditingUser({...editingUser, companyName: e.target.value})}
                               className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-200"
                               placeholder="Agency Name"
                             />
                           </div>
                        </div>
                      </motion.div>
                    )}

                  </form>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 flex-shrink-0">
                  <button
                    type="submit"
                    form="edit-user-form"
                    className="flex-1 bg-gray-900 text-white rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-gray-200 hover:bg-black transition-all active:scale-95 font-sans"
                  >
                    Commit Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 bg-white text-gray-500 border border-gray-200 rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all active:scale-95 font-sans"
                  >
                    Discard
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const LegacyPaymentManager = () => {
  const [settings, setSettings] = useState({
    paypalClientId: '',
    paypalSecret: '',
    paypalSandboxClientId: '',
    paypalSandboxSecret: '',
    paypalMode: 'sandbox' as 'live' | 'sandbox',
    isPaypalEnabled: false,
    creditCardEnabled: false,
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    swiftCode: '',
    bankInstructions: '',
    isPayOnArrivalEnabled: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'payment_' + (getActiveTenantId() || 'global'));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (err) {
        console.error("Error fetching settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'payment_' + (getActiveTenantId() || 'global')), settings);
      alert("Success: Payment configuration saved!");
    } catch (err) {
      console.error(err);
      alert("Error: Failed to save configuration. Check permissions.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">Loading encrypted settings...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Payment Gateways</h2>
        <p className="text-gray-500 font-medium">Configure secure customer checkout and automated payouts.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white p-10 rounded-[10px] border border-gray-100 shadow-sm space-y-10">
            <div className="space-y-8">
              {/* PayPal Header Toggle */}
              <div className="flex items-center justify-between p-6 bg-orange-50/30 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-orange-100">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900">PayPal Express Checkout</h4>
                    <p className="text-xs text-primary font-bold mt-0.5">Primary Gateway</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setSettings({...settings, paypalMode: 'sandbox'})}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                        settings.paypalMode === 'sandbox' 
                          ? "bg-white text-orange-600 shadow-sm" 
                          : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({...settings, paypalMode: 'live'})}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                        settings.paypalMode === 'live' 
                          ? "bg-white text-primary shadow-sm" 
                          : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      Live
                    </button>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={settings.isPaypalEnabled}
                      onChange={e => setSettings({...settings, isPaypalEnabled: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Client ID Section */}
              <div className={cn("space-y-6 transition-all duration-500", !settings.isPaypalEnabled && "opacity-40 grayscale pointer-events-none")}>
                {settings.paypalMode === 'live' ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary tracking-widest uppercase flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                        Live PayPal Client ID
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <CreditCard className="h-4 w-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                        <input 
                          type="text"
                          placeholder="Enter your Production Client ID"
                          value={settings.paypalClientId}
                          onChange={e => setSettings({...settings, paypalClientId: e.target.value})}
                          className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 pl-12 focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-mono text-sm tracking-tight"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Live Client Secret (Optional)</label>
                      <input 
                        type="password"
                        placeholder="Required for some advanced features"
                        value={settings.paypalSecret || ''}
                        onChange={e => setSettings({...settings, paypalSecret: e.target.value})}
                        className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-mono text-sm tracking-tight"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-orange-600 tracking-widest uppercase flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        Sandbox PayPal Client ID
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Icons.Terminal className="h-4 w-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                        <input 
                          type="text"
                          placeholder="Enter your Sandbox Client ID"
                          value={settings.paypalSandboxClientId || ''}
                          onChange={e => setSettings({...settings, paypalSandboxClientId: e.target.value})}
                          className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 pl-12 focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-mono text-sm tracking-tight"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Sandbox Client Secret (Optional)</label>
                      <input 
                        type="password"
                        placeholder="Enter your Sandbox Client Secret"
                        value={settings.paypalSandboxSecret || ''}
                        onChange={e => setSettings({...settings, paypalSandboxSecret: e.target.value})}
                        className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-mono text-sm tracking-tight"
                      />
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 rounded-xl flex gap-3 text-gray-400">
                  <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <p className="text-[10px] leading-relaxed font-medium capitalize">
                    {settings.paypalMode === 'live' ? (
                      <>Retrieve your <span className="text-gray-900 font-bold">Live Credentials</span> from the <a href="https://developer.paypal.com/dashboard/applications/live" target="_blank" className="text-primary underline font-black">Production Dashboard</a>.</>
                    ) : (
                      <>
                        Test transactions using your <span className="text-gray-900 font-bold">Sandbox Credentials</span>. 
                        <br />
                        <span className="text-orange-600 font-black mt-1 block">Important: Log in with a "Personal" buyer account from <a href="https://developer.paypal.com/dashboard/accounts" target="_blank" className="underline">PayPal Accounts</a>. You cannot pay using your Business/Merchant account.</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Advanced CC Toggle */}
              <div className={cn("pt-6 border-t border-gray-50 transition-all duration-500", !settings.isPaypalEnabled && "opacity-0 invisible h-0 overflow-hidden")}>
                <label className="flex items-center gap-4 cursor-pointer group p-4 hover:bg-gray-50 rounded-xl transition-all">
                  <div className={cn(
                    "h-6 w-6 rounded border-2 flex items-center justify-center transition-all",
                    settings.creditCardEnabled ? "bg-primary border-primary text-white" : "border-gray-200"
                  )}>
                    {settings.creditCardEnabled && <Check className="h-4 w-4" />}
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.creditCardEnabled}
                    onChange={e => setSettings({...settings, creditCardEnabled: e.target.checked})}
                    className="hidden"
                  />
                  <div>
                    <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">Direct Card Entry</span>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Allow customers to pay via card without leaving checkout</p>
                  </div>
                </label>
              </div>

              {/* Bank Transfer Settings */}
              <div className="pt-8 border-t border-gray-50 space-y-6">
                <div>
                  <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <Database className="h-4 w-4 text-secondary" /> Manual Bank Transfer Details
                  </h4>
                  <p className="text-[10px] text-gray-400 font-medium">These details will be shown to customers who choose manual bank transfer.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Bank Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Bank Central Asia (BCA)"
                      value={settings.bankName || ''}
                      onChange={e => setSettings({...settings, bankName: e.target.value})}
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Account Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. 1234567890"
                      value={settings.accountNumber || ''}
                      onChange={e => setSettings({...settings, accountNumber: e.target.value})}
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">SWIFT Code</label>
                    <input 
                      type="text"
                      placeholder="e.g. BCACIDJA"
                      value={settings.swiftCode || ''}
                      onChange={e => setSettings({...settings, swiftCode: e.target.value})}
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Account Holder Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. PT Bali Adventours"
                    value={settings.accountHolder || ''}
                    onChange={e => setSettings({...settings, accountHolder: e.target.value})}
                    className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Payment Instructions</label>
                  <textarea 
                    rows={3}
                    placeholder="e.g. Please include your Booking ID as the reference number."
                    value={settings.bankInstructions || ''}
                    onChange={e => setSettings({...settings, bankInstructions: e.target.value})}
                    className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                  />
                </div>
              </div>

              {/* Pay on Arrival Settings */}
              <div className="pt-8 border-t border-gray-50 space-y-6">
                <div className="flex items-center justify-between p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-gray-900">Pay on Arrival (Cash)</h4>
                      <p className="text-xs text-emerald-600 font-bold mt-0.5">Toggle cash payment availability at checkout</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={settings.isPayOnArrivalEnabled ?? true}
                      onChange={e => setSettings({...settings, isPayOnArrivalEnabled: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary text-white py-5 rounded-[10px] font-bold text-sm tracking-wide shadow-2xl shadow-orange-100 hover:bg-orange-700 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Save className="h-4 w-4" /> Save Global Configuration
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-[10px] p-8 text-white relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 h-40 w-40 bg-white/5 rounded-full blur-3xl" />
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
              <Star className="h-5 w-5 text-amber-400 fill-current" /> Security Note
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed font-medium relative z-10">
              Clients never store sensitive payment data. We strictly use modern redirect or component-based methods ensuring 
              <span className="text-white font-bold ml-1">PCI-DSS compliance</span> at all times.
            </p>
          </div>

          <div className="rounded-[10px] border border-gray-100 p-8 space-y-4">
            <h4 className="text-xs font-black text-gray-900 tracking-widest uppercase">Transaction Preview</h4>
            <div className="p-4 rounded-xl bg-gray-50 space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-400">
                <span>Fee (2.9% + $0.30)</span>
                <span>-$3.20</span>
              </div>
              <div className="flex justify-between text-xs font-black text-primary border-t border-gray-100 pt-2">
                <span>Next Payout Deposit</span>
                <span>$96.80</span>
              </div>
            </div>
            <p className="text-[9px] text-gray-400">Estimated for a $100.00 booking through PayPal Express.</p>
          </div>
        </div>
      </div>
    </div>
  );
};


export { BookingTimeManager, ReviewManager };
export default BookingTimeManager;
