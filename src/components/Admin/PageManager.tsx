import * as LucideIcons from 'lucide-react';
const Icons = LucideIcons;
import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo, useRef } from "react";
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


const PageManager = () => {
    const [pages, setPages] = useState<PageContent[]>([]);
    const [editingPage, setEditingPage] = useState<Partial<PageContent> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'pages'), (snapshot) => {
            setPages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PageContent)));
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingPage?.title || !editingPage?.slug) return;

        try {
            const pageData = {
                title: editingPage.title,
                slug: editingPage.slug.toLowerCase().replace(/ /g, '-'),
                content: editingPage.content || '',
                seo: editingPage.seo || { title: '', description: '' },
                updatedAt: serverTimestamp()
            };

            if (editingPage.id) {
                await updateDoc(doc(db, 'pages', editingPage.id), pageData);
            } else {
                await addDoc(collection(db, 'pages'), pageData);
            }
            setEditingPage(null);
            alert("Page saved successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to save page.");
        }
    };

    if (loading) return (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Static Pages</h2>
                    <p className="text-gray-500 font-medium">Manage your Terms and Conditions, Privacy Policy, and other content pages.</p>
                </div>
                <button 
                  onClick={() => setEditingPage({ title: '', slug: '', content: '' })}
                  className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-orange-200"
                >
                  <Plus className="h-4 w-4" /> Create New Page
                </button>
            </div>

            {editingPage && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="bg-white rounded-[20px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">
                                {editingPage.id ? 'Edit Page' : 'New Page'}
                            </h3>
                            <button onClick={() => setEditingPage(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500">Page Title</label>
                                    <input 
                                      required
                                      value={editingPage.title}
                                      onChange={e => setEditingPage({ ...editingPage, title: e.target.value })}
                                      className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none font-bold"
                                      placeholder="e.g. Terms and Conditions"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500">URL Slug</label>
                                    <input 
                                      required
                                      value={editingPage.slug}
                                      onChange={e => setEditingPage({ ...editingPage, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                      className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none font-bold text-gray-500"
                                      placeholder="e.g. terms-and-conditions"
                                      disabled={!!editingPage.id}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500">Page Content (HTML/Markdown supported)</label>
                                <textarea 
                                  required
                                  rows={10}
                                  value={editingPage.content}
                                  onChange={e => setEditingPage({ ...editingPage, content: e.target.value })}
                                  className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none font-medium min-h-[200px]"
                                  placeholder="Paste your page content here..."
                                />
                            </div>

                            <div className="pt-6 border-t border-gray-100 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icons.Share2 className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">SEO Settings (Custom Meta)</h4>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Meta Title</label>
                                        <input 
                                            value={editingPage.seo?.title || ''}
                                            onChange={e => setEditingPage({ ...editingPage, seo: { ...editingPage.seo, title: e.target.value } })}
                                            className="w-full rounded-[8px] border border-gray-100 p-3 text-sm focus:border-primary outline-none"
                                            placeholder="SEO Browser Title"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Meta Description</label>
                                        <textarea 
                                            value={editingPage.seo?.description || ''}
                                            onChange={e => setEditingPage({ ...editingPage, seo: { ...editingPage.seo, description: e.target.value } })}
                                            className="w-full rounded-[8px] border border-gray-100 p-3 text-sm focus:border-primary outline-none"
                                            rows={2}
                                            placeholder="Short SEO description..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setEditingPage(null)} className="px-8 py-4 font-bold text-gray-400">Cancel</button>
                                <button type="submit" className="bg-primary text-white px-12 py-4 rounded-[10px] font-bold text-sm tracking-wide shadow-xl active:scale-95 transition-all">
                                    {editingPage.id ? 'Save Changes' : 'Create Page'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages.map(page => (
                    <div key={page.id} className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm transition-all hover:border-primary group hover:shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-14 w-14 rounded-[10px] bg-orange-50 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                                <FileText className="h-7 w-7" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingPage(page)} className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-gray-50 rounded-lg"><Edit2 className="h-5 w-5" /></button>
                                <button 
                                  onClick={async () => {
                                    if (confirm("Delete this page?")) await deleteDoc(doc(db, 'pages', page.id));
                                  }}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2 group-hover:text-primary transition-colors">{page.title}</h3>
                        <p className="text-sm font-semibold text-primary tracking-tight mb-4">/{page.slug}</p>
                        <p className="text-xs text-gray-500 line-clamp-3 font-medium leading-relaxed">
                            {(page.content || '').replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};


export { PageManager };
export default PageManager;
