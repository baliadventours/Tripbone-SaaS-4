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


import * as LucideIcons from "lucide-react";
const Icons = LucideIcons;

const COLLECTION_METADATA = [
  { id: 'tours', name: 'Tours', desc: 'Tour products, rates, and configurations', category: 'Pillars', icon: Compass },
  { id: 'bookings', name: 'Bookings', desc: 'Customer reservations, tickets, status', category: 'Pillars', icon: Briefcase },
  { id: 'users', name: 'Users & Roles', desc: 'Administrative and partner profiles', category: 'Pillars', icon: Users },
  { id: 'reviews', name: 'Reviews', desc: 'Customer ratings and feedback logs', category: 'Engagement', icon: Star },
  { id: 'blog', name: 'Blog Posts', desc: 'Editorial articles, SEO content', category: 'Marketing', icon: FileText },
  { id: 'settings', name: 'Platform Settings', desc: 'Branding, integrations, policies', category: 'Configuration', icon: Settings },
  { id: 'coupons', name: 'Coupons', desc: 'Discount vouchers and promotions', category: 'Marketing', icon: Tag },
  { id: 'inquiries', name: 'Inquiries & Leads', desc: 'Contact inquiries and RFQs', category: 'Engagement', icon: MessageSquare },
];

const BackupManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Partial backup states
  const [backupMode, setBackupMode] = useState<'full' | 'selective'>('full');
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    COLLECTION_METADATA.map(c => c.id)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Selective Restore states
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<any | null>(null);
  const [restoreCollections, setRestoreCollections] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Toggle collection selection for backup
  const toggleCollection = (id: string) => {
    if (selectedCollections.includes(id)) {
      setSelectedCollections(selectedCollections.filter(c => c !== id));
    } else {
      setSelectedCollections([...selectedCollections, id]);
    }
  };

  const selectAllCollections = () => {
    setSelectedCollections(COLLECTION_METADATA.map(c => c.id));
  };

  const clearAllCollections = () => {
    setSelectedCollections([]);
  };

  // Filter collections for dynamic UI
  const filteredCollections = useMemo(() => {
    return COLLECTION_METADATA.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'all' || c.category.toLowerCase() === activeTab.toLowerCase();
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab]);

  const handleBackup = async (format: 'json' | 'csv' = 'json') => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    const user = auth.currentUser;
    if (!user) {
      setError('No authenticated user found. Please log in again.');
      setIsLoading(false);
      return;
    }

    if (format === 'json' && backupMode === 'selective' && selectedCollections.length === 0) {
      setError('Please select at least one collection to back up.');
      setIsLoading(false);
      return;
    }
    
    try {
      const token = await user.getIdToken();
      
      // Determine what to backup. CSV specializes in bookings. Partial backup requests specified collections.
      const colParam = format === 'csv' 
        ? 'bookings' 
        : (backupMode === 'full' ? '' : selectedCollections.join(','));

      const response = await fetch(`/api/admin/backup${colParam ? `?collections=${colParam}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Backup failed');
      }
      const fullData = await response.json();
      
      let finalBlob: Blob;
      let filename: string;

      if (format === 'csv') {
        // For CSV, we'll specialize in Bookings as it's the most requested
        const bookings = fullData.data.bookings || [];
        if (bookings.length === 0) {
          setSuccess(null);
          setError('No bookings found in the database to export to CSV.');
          setIsLoading(false);
          return;
        }

        const headers = [
          'ID', 'Reference', 'Date', 'Tour', 'Customer Name', 'Customer Email', 'Phone', 
          'Status', 'Total Amount', 'Supplier Name', 'Payment Method'
        ];
        
        const rows = bookings.map((b: any) => [
          b.id,
          b.reference || b.id?.substring(0, 8).toUpperCase(),
          b.date,
          `"${(b.tourTitle || 'N/A').replace(/"/g, '""')}"`,
          `"${(b.customerData?.fullName || 'N/A').replace(/"/g, '""')}"`,
          b.customerData?.email || 'N/A',
          `'${b.customerData?.phone || ''}`, // Force string in Excel
          b.status,
          b.totalAmount,
          `"${(b.supplierName || 'System').replace(/"/g, '""')}"`,
          b.paymentMethod || 'manual'
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map((r: any) => r.join(','))
        ].join('\n');

        finalBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        filename = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        finalBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const prefix = backupMode === 'selective' ? 'partial' : 'full';
        filename = `${prefix}-backup-${new Date().toISOString().split('T')[0]}.json`;
      }

      const url = window.URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess(`${format.toUpperCase()} Backup downloaded successfully!`);
    } catch (err: any) {
      setError(err.message || 'Backup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const processSelectedFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Please upload a valid JSON backup file.');
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.data) {
        throw new Error('Invalid backup file format. Missing "data" layer.');
      }

      setRestoreFile(file);
      setParsedBackup(parsed);

      const cols = Object.keys(parsed.data).filter(col => {
        return Array.isArray(parsed.data[col]) && parsed.data[col].length > 0;
      });

      setRestoreCollections(cols); // Select all found collections by default
      setSuccess(`Backup file "${file.name}" parsed successfully! Select collections below to restore.`);
      setError(null);
    } catch (err: any) {
      setError(`Failed to read the backup: ${err.message}`);
      setSuccess(null);
      setRestoreFile(null);
      setParsedBackup(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
    e.target.value = '';
  };

  const executeRestore = async () => {
    if (!parsedBackup || !restoreFile) return;

    if (restoreCollections.length === 0) {
      setError('Please select at least one collection to restore.');
      return;
    }

    if (!window.confirm(`WARNING: This will overwrite or merge data in the selected collections (${restoreCollections.join(', ')}). Are you absolutely sure you want to proceed?`)) {
      return;
    }

    setRestoreLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user found. Please login again.');
      
      const filteredData: Record<string, any[]> = {};
      for (const col of restoreCollections) {
        if (parsedBackup.data[col]) {
          filteredData[col] = parsedBackup.data[col];
        }
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: filteredData })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Restore failed');
      }

      const statsMsg = Object.entries(result.stats || {})
        .map(([col, cnt]) => `${COLLECTION_METADATA.find(c => c.id === col)?.name || col}: ${cnt} items`)
        .join(', ');
      
      setSuccess(`Restore completed successfully! Restored details: ${statsMsg}`);
      setRestoreFile(null);
      setParsedBackup(null);
    } catch (err: any) {
      setError(err.message || 'Restore failed');
    } finally {
      setRestoreLoading(false);
    }
  };

  const toggleRestoreCollection = (id: string) => {
    if (restoreCollections.includes(id)) {
      setRestoreCollections(restoreCollections.filter(c => c !== id));
    } else {
      setRestoreCollections([...restoreCollections, id]);
    }
  };

  const categories = ['all', 'Pillars', 'Settings', 'Finance', 'Content', 'Quality'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">System Backup & Restore</h2>
        <p className="text-gray-500 font-medium">Backup your site data or restore specific sections with complete precision.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Backup Selection & Operations */}
        <div className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-6 xl:col-span-8">
          <div className="flex items-center gap-4 p-6 bg-orange-50 rounded-[10px] border border-orange-100 text-orange-800">
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
              <Compass className="h-6 w-6" />
            </div>
            <div className="flex-grow">
              <h4 className="font-black text-lg">System Export Options</h4>
              <p className="text-sm font-medium opacity-80">Export all site variables, tours, metadata or configure partial downloads.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
              <button
                onClick={() => setBackupMode('full')}
                className={cn(
                  "px-4 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all",
                  backupMode === 'full' 
                    ? "bg-white text-gray-900 shadow-sm border border-gray-100" 
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                Full Backup
              </button>
              <button
                onClick={() => setBackupMode('selective')}
                className={cn(
                  "px-4 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all",
                  backupMode === 'selective' 
                    ? "bg-white text-primary shadow-sm border border-gray-100" 
                    : "text-gray-500 hover:text-primary"
                )}
              >
                Partial Backup
              </button>
            </div>

            {backupMode === 'selective' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllCollections}
                  className="text-[10px] font-black uppercase text-gray-500 hover:text-gray-900 tracking-widest bg-gray-50 px-3 py-2 rounded-lg border border-gray-100"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAllCollections}
                  className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500 tracking-widest bg-gray-50 px-3 py-2 rounded-lg border border-gray-100"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {backupMode === 'selective' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search database collections..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 placeholder-gray-400 font-medium text-sm rounded-xl border-2 border-gray-100 focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={cn(
                        "whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all capitalize border",
                        activeTab === cat 
                          ? "bg-primary/5 text-primary border-primary/20" 
                          : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredCollections.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-100 text-gray-400 font-bold text-sm">
                  No collections match your criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
                  {filteredCollections.map(col => {
                    const IconComp = col.icon;
                    const isSelected = selectedCollections.includes(col.id);
                    return (
                      <div
                        key={col.id}
                        onClick={() => toggleCollection(col.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all cursor-pointer flex gap-3.5 items-start group relative",
                          isSelected 
                            ? "bg-orange-50/40 border-primary shadow-sm" 
                            : "bg-white border-gray-100 hover:border-gray-200"
                        )}
                      >
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border",
                          isSelected 
                            ? "bg-primary text-white border-primary" 
                            : "bg-gray-50 text-gray-400 border-gray-100 group-hover:bg-gray-100 group-hover:text-gray-600"
                        )}>
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div className="flex-grow min-w-0 pr-6">
                          <span className="font-extrabold text-gray-900 tracking-tight text-sm block">{col.name}</span>
                          <span className="text-[10px] font-mono text-gray-400 tracking-tight block mt-0.5">{col.id}</span>
                          <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1.5 line-clamp-2">{col.desc}</p>
                        </div>
                        <div className="absolute top-4 right-4 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0">
                          {isSelected && <Check className="h-3 w-3 text-primary stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-3.5 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-3">
                <ShieldCheck className="h-4.5 w-4.5 text-primary stroke-[2.5] shrink-0" />
                <span className="text-xs text-gray-600 font-bold">
                  {selectedCollections.length} of {COLLECTION_METADATA.length} collections selected for backup. ({COLLECTION_METADATA.length - selectedCollections.length} will be omitted).
                </span>
              </div>
            </div>
          )}

            <div className="border-t border-gray-50 pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <p className="text-xs text-gray-500 font-bold max-w-md">
                {backupMode === 'full' 
                  ? "A Full Backup is highly recommended before performing system imports, running major schema adjustments, or changing system pricing guides." 
                  : `Exporting a partial backup with ${selectedCollections.length} target collections.`}
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleBackup('json')}
                  disabled={isLoading || restoreLoading}
                  className="bg-primary text-white px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-50 disabled:opacity-50 flex items-center justify-center gap-3 flex-grow sm:flex-grow-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Working...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" /> Export JSON
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleBackup('csv')}
                  disabled={isLoading || restoreLoading}
                  className="bg-blue-600 text-white px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-50 disabled:opacity-50 flex items-center justify-center gap-3 flex-grow sm:flex-grow-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Working...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" /> Export Bookings CSV
                    </>
                  )}
                </button>
              </div>
            </div>
        </div>

        {/* Restore Column */}
        <div className="space-y-8 xl:col-span-4">
          {/* Main Restore Upload View */}
          <div className="bg-white p-8 rounded-[10px] border border-gray-100 shadow-sm space-y-6 flex flex-col">
            <div className="flex items-center gap-4 p-6 bg-amber-50 rounded-[10px] border border-amber-100 text-amber-800">
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-black text-lg">Selective Restore</h4>
                <p className="text-sm font-medium opacity-80">Upload a JSON backup file to browse and import select data blocks.</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 font-medium">
              Upload a previously exported JSON backup file. You can preview the records inside the file and selectively choose which collections to restore into the database.
            </p>

            {/* Draggable upload box */}
            {!parsedBackup ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4.5 text-center transition-all bg-gray-50/50 cursor-pointer hover:bg-gray-50 hover:border-amber-400 group relative min-h-[220px]",
                  isDragging ? "border-amber-500 bg-amber-50/30 ring-4 ring-amber-500/10" : "border-gray-200"
                )}
              >
                <input 
                  type="file" 
                  accept=".json" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleFileChange}
                  disabled={isLoading || restoreLoading}
                />
                <div className="h-14 w-14 bg-amber-100/50 text-amber-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-extrabold text-gray-800 text-sm block">Drag & Drop backup file</span>
                  <span className="text-xs text-gray-400 font-bold mt-1 block">or <span className="text-amber-500 font-extrabold group-hover:underline">browse files</span> on your computer</span>
                </div>
                <span className="text-[10px] font-mono text-gray-300">Supported formats: .json</span>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-extrabold text-gray-800 text-sm block truncate">{restoreFile?.name}</span>
                    <span className="text-[10px] font-mono text-gray-400 block mt-0.5">Size: {(restoreFile?.size || 0) > 1024 * 1024 ? `${((restoreFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB` : `${((restoreFile?.size || 0) / 1024).toFixed(1)} KB`}</span>
                  </div>
                  <button
                    onClick={() => {
                      setRestoreFile(null);
                      setParsedBackup(null);
                      setError(null);
                    }}
                    className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-800 transition-all rounded-lg shrink-0"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Preview Backup Contents</span>
                    <p className="text-xs text-gray-400 font-medium mt-1">Select the collections you wish to restore into the database.</p>
                  </div>

                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {Object.keys(parsedBackup.data || {}).map(colId => {
                      const colItems = parsedBackup.data[colId];
                      if (!Array.isArray(colItems) || colItems.length === 0) return null;
                      
                      const colMeta = COLLECTION_METADATA.find(c => c.id === colId);
                      const isSelected = restoreCollections.includes(colId);
                      
                      return (
                        <div
                          key={colId}
                          onClick={() => toggleRestoreCollection(colId)}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between",
                            isSelected 
                              ? "bg-amber-50/30 border-amber-500/80" 
                              : "bg-white border-gray-100 hover:border-gray-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded-md flex items-center justify-center shrink-0 border",
                              isSelected ? "bg-amber-500 text-white border-amber-500" : "bg-gray-50 text-gray-400 border-gray-100"
                            )}>
                              {colMeta ? <colMeta.icon className="h-4.5 w-4.5" /> : <Database className="h-4.5 w-4.5" />}
                            </div>
                            <div>
                              <span className="font-extrabold text-sm text-gray-800">{colMeta?.name || colId}</span>
                              <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{colItems.length} records detected</span>
                            </div>
                          </div>
                          
                          <div className={cn(
                            "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected ? "border-amber-500/80 bg-amber-500" : "border-gray-200"
                          )}>
                            {isSelected && <Check className="h-3 w-3 text-white stroke-[3.5]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400">
                      {restoreCollections.length} collections selected
                    </span>
                    <button
                      type="button"
                      onClick={executeRestore}
                      disabled={restoreLoading || restoreCollections.length === 0}
                      className="bg-amber-500 text-white px-5 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {restoreLoading ? (
                        <>
                          <Icons.Loader2 className="h-3 w-3 animate-spin" /> Restoring...
                        </>
                      ) : (
                        <>
                          <Icons.RefreshCw className="h-3 w-3" /> Commit Restore
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {(error || success) && (
        <div className={cn(
          "p-5 rounded-xl border-2 font-bold text-sm leading-relaxed shadow-sm",
          error ? "bg-red-50 border-red-200 text-red-600" : "bg-orange-50 border-orange-200 text-primary"
        )}>
          {error || success}
        </div>
      )}
    </div>
  );
};


export { BackupManager };
export default BackupManager;
