import * as LucideIcons from 'lucide-react';
const Icons = LucideIcons;
import { generateBlogPostData } from '../../services/geminiService';
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


const PartnerListing = ({ 
  type, 
  users, 
  onSelect,
  onDelete,
  onViewTours,
  allTours = [],
  resetForm,
  setFormData,
  formData,
  setActiveMenu
}: { 
  type: 'supplier' | 'agent', 
  users: UserProfile[], 
  onSelect: (user: UserProfile) => void,
  onDelete: (user: UserProfile) => void,
  onViewTours?: (user: UserProfile) => void,
  allTours?: Tour[],
  resetForm: () => void,
  setFormData: (f: any) => void,
  formData: any,
  setActiveMenu: (m: any) => void
}) => {
  const filteredUsers = users.filter(u => u.role === type);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
          {type === 'supplier' ? 'Official Suppliers' : 'Travel Agents'}
        </h2>
        <p className="text-gray-500 font-medium">
          {type === 'supplier' ? 'Manage your product providers and their tour inventory.' : 'Manage affiliated agents and their booking performance.'}
        </p>
      </div>

      <div className="bg-white rounded-[10px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Name / Company</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
              {type === 'supplier' && (
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Tours</th>
              )}
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                {type === 'supplier' ? 'Commission Rate' : 'Agent Discount'}
              </th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.map(u => (
              <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={u.photoURL} className="h-10 w-10 rounded-full border border-gray-100" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-sm font-black text-gray-900">{u.displayName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{u.companyName || 'Individual'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-gray-600">{u.email}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{u.phoneNumber || 'No Phone'}</p>
                </td>
                {type === 'supplier' && (
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
                        <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">No Tours Assigned</span>
                          <button 
                            onClick={() => {
                              resetForm();
                              setFormData({ ...formData, supplierId: u.uid, supplierName: u.companyName || u.displayName });
                              setActiveMenu('tours');
                            }}
                            className="text-[9px] font-bold text-primary hover:underline mt-1"
                          >
                            + Create First Tour
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <span className="text-sm font-black text-primary">
                    {type === 'supplier' ? `${u.commissionRate || 10}%` : `${u.discountRate || 0}%`}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onSelect(u)}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="View Details"
                    >
                      <Icons.Eye className="h-4 w-4" />
                    </button>
                    {type === 'supplier' && onViewTours && (
                      <button 
                        onClick={() => onViewTours(u)}
                        className="p-2 text-primary hover:bg-orange-50 rounded-lg transition-all"
                        title="View Tours"
                      >
                        <Icons.Compass className="h-4 w-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => onDelete(u)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Partner"
                    >
                      <Icons.Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                  No {type}s found in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface BlogManagerProps {
  commSettings?: any;
  openMediaGallery: (callback: (urls: string[]) => void, multiSelect?: boolean) => void;
  autoOpenModal?: boolean;
  onHandledAutoOpenModal?: () => void;
}

const BlogManager: React.FC<BlogManagerProps> = ({
  commSettings,
  openMediaGallery,
  autoOpenModal,
  onHandledAutoOpenModal
}) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isUploadingBlogImage, setIsUploadingBlogImage] = useState(false);

  useEffect(() => {
    if (autoOpenModal) {
      setEditingPost({ status: 'draft', tags: [] });
      setIsModalOpen(true);
      if (onHandledAutoOpenModal) {
        onHandledAutoOpenModal();
      }
    }
  }, [autoOpenModal, onHandledAutoOpenModal]);

  const handleGenerateBlog = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const genData = await generateBlogPostData(aiPrompt, commSettings?.geminiApiKey);
      setEditingPost(prev => ({
        ...prev,
        title: genData.title,
        excerpt: genData.excerpt,
        content: genData.content,
        category: genData.category,
        tags: genData.tags,
        slug: genData.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      }));
      setIsAiModalOpen(false);
      setAiPrompt('');
      alert("Success! AI has generated the blog post content.");
    } catch (err: any) {
      alert(err.message || "Failed to generate blog post.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const tenantId = getActiveTenantId();
    const q = tenantId 
      ? query(collection(db, 'posts'), where('tenantId', '==', tenantId))
      : query(collection(db, 'posts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
      list.sort((a, b) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
        const tB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
        return tB - tA;
      });
      setPosts(list);
      setLoading(false);
    }, (error) => {
      console.error("Posts fetch error:", error);
      alert(`Posts fetch error: ${error.message}`);
      setLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleBlogFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBlogImage(true);
    try {
      const url = await uploadImage(file);
      setEditingPost(prev => prev ? { ...prev, featuredImage: url } : { featuredImage: url, status: 'draft', tags: [] });
    } catch (err: any) {
      console.error("Blog image upload failed:", err);
      alert("Image upload failed: " + (err.message || err));
    } finally {
      setIsUploadingBlogImage(false);
      e.target.value = '';
    }
  };

  const handleSavePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPost?.title || !editingPost?.slug) return;

    const { id, ...restData } = editingPost as any;
    const currentTenantId = getActiveTenantId();
    const postData = {
      ...restData,
      tenantId: restData.tenantId || currentTenantId,
      featuredImage: editingPost.featuredImage || '',
      seo: restData.seo || { title: '', description: '' },
      updatedAt: serverTimestamp(),
    };

    if (!postData.createdAt) {
      postData.createdAt = serverTimestamp();
    }

    const cleanUndefined = (obj: any): any => {
      if (obj === undefined) return null;
      if (typeof obj !== 'object' || obj === null) return obj;
      if (obj.toDate || obj._methodName) return obj; // Firebase timestamp or FieldValue
      if (Array.isArray(obj)) return obj.map(cleanUndefined).filter(v => v !== null);
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) {
          result[k] = cleanUndefined(v);
        }
      }
      return result;
    };
    const cleanPostData = cleanUndefined(postData);

    try {
      if (editingPost.id) {
        await updateDoc(doc(db, 'posts', editingPost.id), cleanPostData);
      } else {
        await addDoc(collection(db, 'posts'), cleanPostData);
      }
      setIsModalOpen(false);
      setEditingPost(null);
      alert("Success: Blog post saved!");
    } catch (err: any) {
      console.error("Error saving post:", err);
      alert("Failed to save post: " + (err.message || err));
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm("Delete this post?")) {
      await deleteDoc(doc(db, 'posts', id));
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Blog Articles</h2>
          <p className="text-gray-500 font-medium text-sm">Create and manage your stories and news.</p>
        </div>
        <button 
          onClick={() => { setEditingPost({ status: 'draft', tags: [] }); setIsModalOpen(true); }}
          className="bg-primary text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <Icons.Plus className="h-4 w-4" /> New Article
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-[10px] border border-gray-100 shadow-sm overflow-hidden group">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={post.featuredImage || 'https://picsum.photos/seed/blog/800/600'} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => { setEditingPost(post); setIsModalOpen(true); }} className="p-2 bg-white/90 backdrop-blur rounded-lg text-blue-600 shadow-lg">
                  <Icons.Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDeletePost(post.id)} className="p-2 bg-white/90 backdrop-blur rounded-lg text-red-600 shadow-lg">
                  <Icons.Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4">
                <span className={cn(
                  "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                  post.status === 'published' ? "bg-orange-500 text-white" : "bg-amber-500 text-white"
                )}>
                  {post.status}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{post.category}</span>
              </div>
              <h3 className="font-black text-gray-900 line-clamp-1 mb-2">{post.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">{post.excerpt}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-8 space-y-6 scrollbar-hide"
            >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-black text-gray-900">{editingPost?.id ? 'Edit Article' : 'New Article'}</h3>
                    {!editingPost?.id && (
                      <button
                        type="button"
                        onClick={() => setIsAiModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all border border-primary/20"
                      >
                        <Sparkles className="h-3 w-3" /> AI Write
                      </button>
                    )}
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                    <Icons.X className="h-6 w-6" />
                  </button>
                </div>

              <form onSubmit={handleSavePost} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Title</label>
                    <input 
                      required
                      value={editingPost?.title || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setEditingPost(prev => prev ? { 
                          ...prev, 
                          title: val, 
                          slug: val
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/-+/g, '-') 
                        } : {
                          title: val,
                          slug: val
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '-').replace(/-+/g, '-'),
                          status: 'draft',
                          tags: []
                        });
                      }}
                      placeholder="Article Title"
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Slug</label>
                    <input 
                      required
                      value={editingPost?.slug || ''}
                      onChange={e => setEditingPost(prev => prev ? { ...prev, slug: e.target.value } : { slug: e.target.value, status: 'draft', tags: [] })}
                      placeholder="url-slug"
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Category</label>
                    <input 
                      value={editingPost?.category || ''}
                      onChange={e => setEditingPost(prev => prev ? { ...prev, category: e.target.value } : { category: e.target.value, status: 'draft', tags: [] })}
                      placeholder="e.g. Travel Tips"
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Author</label>
                    <input 
                      value={editingPost?.author || ''}
                      onChange={e => setEditingPost(prev => prev ? { ...prev, author: e.target.value } : { author: e.target.value, status: 'draft', tags: [] })}
                      placeholder="Author Name"
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Status</label>
                    <select 
                      value={editingPost?.status || 'draft'}
                      onChange={e => {
                        const val = e.target.value as any;
                        setEditingPost(prev => prev ? { ...prev, status: val, publishedAt: val === 'published' ? (prev.publishedAt || serverTimestamp()) : null } : { status: val, tags: [] });
                      }}
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all appearance-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                {/* Refactored Featured Image Upload & Management Section */}
                <div className="space-y-4 bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      Featured Image
                    </label>
                    {editingPost?.featuredImage && (
                      <button
                        type="button"
                        onClick={() => setEditingPost(prev => prev ? { ...prev, featuredImage: '' } : prev)}
                        className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-all"
                      >
                        <Icons.X className="h-3 w-3" /> Remove Image
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4 aspect-video bg-white border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden relative group flex items-center justify-center shadow-inner">
                      {editingPost?.featuredImage ? (
                        <>
                          <img 
                            src={editingPost.featuredImage} 
                            alt="Article Featured" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <label className="cursor-pointer bg-white text-gray-900 text-xs font-black px-3 py-1.5 rounded-lg shadow-md hover:bg-gray-100 transition-all flex items-center gap-1">
                              <Icons.Upload className="h-3.5 w-3.5 text-primary" />
                              Change
                              <input 
                                type="file"
                                accept="image/*"
                                onChange={handleBlogFileUpload}
                                className="hidden"
                                disabled={isUploadingBlogImage}
                              />
                            </label>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-[11px] font-bold text-gray-400">No image selected</p>
                        </div>
                      )}

                      {isUploadingBlogImage && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
                          <Icons.Loader2 className="h-6 w-6 text-primary animate-spin" />
                          <span className="text-[11px] font-black text-gray-700 uppercase tracking-wider">Uploading Image...</span>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-8 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className={`cursor-pointer px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-sm ${
                          isUploadingBlogImage 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-primary text-white hover:bg-orange-600'
                        }`}>
                          {isUploadingBlogImage ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <Icons.Upload className="h-4 w-4" />}
                          {isUploadingBlogImage ? 'Uploading...' : 'Upload Image File'}
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={handleBlogFileUpload}
                            className="hidden"
                            disabled={isUploadingBlogImage}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            openMediaGallery((urls) => {
                              if (urls[0]) {
                                setEditingPost(prev => prev ? { ...prev, featuredImage: urls[0] } : { featuredImage: urls[0], status: 'draft', tags: [] });
                              }
                            }, false);
                          }}
                          className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-sm"
                        >
                          <ImageIcon className="h-4 w-4 text-blue-600" />
                          Pick from Gallery
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Or Paste Image Web URL</label>
                        <input 
                          value={editingPost?.featuredImage || ''}
                          onChange={e => setEditingPost(prev => prev ? { ...prev, featuredImage: e.target.value } : { featuredImage: e.target.value, status: 'draft', tags: [] })}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full rounded-xl border border-gray-200 bg-white p-3 font-medium text-xs focus:border-primary focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tags (Comma separated)</label>
                  <input 
                    value={editingPost?.tags?.join(', ') || ''}
                    onChange={e => setEditingPost(prev => prev ? { ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean), status: 'draft' })}
                    placeholder="e.g. Travel, Bali, Adventure"
                    className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Short Excerpt</label>
                  <textarea 
                    rows={2}
                    value={editingPost?.excerpt || ''}
                    onChange={e => setEditingPost(prev => prev ? { ...prev, excerpt: e.target.value } : { excerpt: e.target.value, status: 'draft', tags: [] })}
                    placeholder="Brief summary for archive page..."
                    className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-medium text-sm focus:border-primary focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Content</label>
                  <RichTextEditor 
                    content={editingPost?.content || ''}
                    onChange={(html) => setEditingPost(prev => prev ? { ...prev, content: html } : { content: html, status: 'draft', tags: [] })}
                    placeholder="Start writing your article..."
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
                              value={editingPost?.seo?.title || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setEditingPost(prev => prev ? { ...prev, seo: { ...prev.seo, title: val } } : { seo: { title: val, description: '' }, status: 'draft', tags: [] });
                              }}
                              className="w-full rounded-[8px] border border-gray-100 p-3 text-sm focus:border-primary outline-none"
                              placeholder="SEO Browser Title"
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Meta Description</label>
                          <textarea 
                              value={editingPost?.seo?.description || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setEditingPost(prev => prev ? { ...prev, seo: { ...prev.seo, description: val } } : { seo: { description: val, title: '' }, status: 'draft', tags: [] });
                              }}
                              className="w-full rounded-[8px] border border-gray-100 p-3 text-sm focus:border-primary outline-none"
                              rows={2}
                              placeholder="Short SEO description..."
                          />
                      </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-100">
                  Save Article
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">AI Magic Writer</h3>
                </div>
                <button onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                  <Icons.X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Tell the AI what you want to write about. Be specific for better results (e.g., "Write a guide about the best waterfalls in Ubud for 2024").
                </p>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your article ideas..."
                  className="w-full h-32 rounded-2xl border-2 border-gray-50 bg-gray-50/50 p-4 font-medium text-sm focus:border-primary focus:bg-white outline-none transition-all resize-none"
                  disabled={isGenerating}
                />
                
                <button 
                  onClick={handleGenerateBlog}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="w-full bg-primary text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" /> Generate Magic Content
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AdminProps {
  overrideMenu?: string;
  overrideTab?: string;
  isCentralPortal?: boolean;
}


export { PartnerListing, BlogManager };
export default PartnerListing;
