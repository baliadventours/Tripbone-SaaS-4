import { OSMLocationSelector } from "./MetaManager";
import { uploadImage } from "../../lib/imgbb";
import React from "react";
import { 
  Save, List, ChevronRight, Sun, CheckCircle, Layout, Loader2, PlusCircle, MinusCircle, Car, Bed, Hotel, UserCheck, Calendar as CalendarIcon,
  Plus, Trash2, Edit2, Sparkles, Copy, Upload, Image as ImageIcon,
  Check, X, AlertCircle, Info, HelpCircle, ChevronDown, ChevronUp,
  MapPin, Clock, DollarSign, Users, Calendar, ShieldCheck, Tag,
  Globe, Search, Star, Layers, Settings, Eye, RefreshCw, FileText,
  ListPlus, BedDouble, Compass, ShieldAlert, ArrowRight, CheckCircle2
} from "lucide-react";
import * as LucideIcons from "lucide-react";
const Icons = LucideIcons;
import { cn, formatPrice } from "../../lib/utils";
import { Tour, Category, TourType, LocationMeta, AddOn as GlobalAddOn, TransportOption as GlobalTransport, Guide, UserProfile, UrgencyPoint } from "../../types";

interface TourEditorFormProps {
  users?: any;
  urgencyPoints?: any;
  activeTab: any;
  setActiveTab: any;
  tabs: any;
  editingId: any;
  setEditingId: any;
  formData: any;
  setFormData: any;
  handleSubmit: any;
  resetForm: any;
  setShowAiModal: any;
  setAiGenMode: any;
  setActiveMenu: any;
  setSelectedCopySourceTourId: any;
  setShowCopyModal: any;
  tours: any;
  categories: any;
  tourTypes: any;
  locations: any;
  labels: any;
  globalAddOns: any;
  globalTransports: any;
  allGuides: any;
  currentUserProfile: any;
  loadingStates: any;
  highlightsText: any;
  setHighlightsText: any;
  inclusionsText: any;
  setInclusionsText: any;
  exclusionsText: any;
  setExclusionsText: any;
  expandedPackages: any;
  setExpandedPackages: any;
  expandedItinerary: any;
  setExpandedItinerary: any;
  handleFileUpload: any;
  handleItineraryImageUpload: any;
  handleOpenGallery?: any;
}

export const TourEditorForm: React.FC<TourEditorFormProps> = ({
  users = [],
  urgencyPoints = [],

  activeTab,
  setActiveTab,
  tabs,
  editingId,
  setEditingId,
  formData,
  setFormData,
  handleSubmit,
  resetForm,
  setShowAiModal,
  setAiGenMode,
  setActiveMenu,
  setSelectedCopySourceTourId,
  setShowCopyModal,
  tours,
  categories,
  tourTypes,
  locations,
  labels,
  globalAddOns,
  globalTransports,
  allGuides,
  currentUserProfile,
  loadingStates,
  highlightsText,
  setHighlightsText,
  inclusionsText,
  setInclusionsText,
  exclusionsText,
  setExclusionsText,
  expandedPackages,
  setExpandedPackages,
  expandedItinerary,
  setExpandedItinerary,
  handleFileUpload,
  handleItineraryImageUpload,
  handleOpenGallery,
}) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);
  const openMediaGallery = handleOpenGallery || (() => {});

  const addArrayItem = (field: string, item: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] || []), item]
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_: any, i: number) => i !== index)
    }));
  };

  const updateArrayItem = (field: string, index: number, updated: any) => {
    setFormData((prev: any) => {
      const list = [...(prev[field] || [])];
      list[index] = typeof updated === "function" ? updated(list[index]) : updated;
      return { ...prev, [field]: list };
    });
  };

  return (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 bg-white p-3 sm:p-4 rounded-[10px] border border-gray-100 shadow-xs">
                <div className="flex gap-2 overflow-x-auto select-none scrollbar-none pb-1 sm:pb-0 w-full sm:w-auto shrink-0 whitespace-nowrap">
                  <button onClick={() => { setActiveTab('basic'); setEditingId(null); }} className={cn("px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer", !editingId ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-50")}>+ Add New Tour</button>
                  <button 
                    onClick={() => {
                        if (editingId) {
                          setAiGenMode('partial');
                        } else {
                          setAiGenMode('complete');
                          resetForm();
                        }
                        setShowAiModal(true);
                    }} 
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg bg-primary text-white flex items-center gap-2 shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" /> {editingId ? "AI Rewrite Assistant" : "AI Magic Builder"}
                  </button>
                  <button onClick={() => setActiveMenu('all-tours')} className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg text-gray-400 hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                    <List className="h-4 w-4" /> View Tour List
                  </button>
                </div>
                {editingId && (
                  <button onClick={resetForm} className="text-red-600 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-lg cursor-pointer sm:ml-auto whitespace-nowrap">
                    <X className="h-4 w-4" /> Cancel Editing
                  </button>
                )}
              </div>

              <div className="bg-white rounded-[10px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[700px] relative">
                
                {/* Mobile Slider Tab Navigation - Sticky and sleek */}
                <div className="md:hidden sticky top-0 z-20 w-full bg-white border-b border-gray-100 flex flex-col shrink-0">
                  <div className="flex items-center overflow-x-auto select-none scrollbar-none px-4 py-3 gap-2 scroll-smooth">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 border cursor-pointer",
                            isActive 
                              ? "bg-primary text-white border-primary shadow-xs" 
                              : "bg-gray-50/70 border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80"
                          )}
                        >
                          <tab.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-white" : "text-gray-400")} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                    
                    {/* Fast Copy Tools inside mobile tab slider as a quick action */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCopySourceTourId('');
                        setShowCopyModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 border bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>Fast Copy</span>
                    </button>
                  </div>
                </div>

                {/* Desktop Sidebar Tab Navigation */}
                <div className="hidden md:flex w-64 bg-gray-50/50 border-r border-gray-100 p-6 flex-col gap-2 shrink-0">
                  <div className="mb-6 px-2">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tour Settings</h3>
                  </div>
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all group relative overflow-hidden cursor-pointer",
                        activeTab === tab.id 
                          ? "bg-white text-primary shadow-sm border border-orange-50 translate-x-2" 
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      {activeTab === tab.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                      <tab.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-primary" : "text-gray-300")} />
                      <span>{tab.label}</span>
                      {activeTab === tab.id && <ChevronRight className="ml-auto h-3 w-3 text-primary animate-pulse" />}
                    </button>
                  ))}

                  <div className="mt-auto pt-6 border-t border-gray-100 px-2 space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCopySourceTourId('');
                        setShowCopyModal(true);
                      }}
                      className="w-full text-left bg-gradient-to-br from-orange-50/50 to-teal-50/30 hover:from-orange-50 hover:to-teal-50 border border-orange-100/50 rounded-xl p-3.5 space-y-1 cursor-pointer transition-all active:scale-[0.98] group"
                    >
                      <div className="flex items-center gap-1.5 text-orange-700">
                        <Copy className="h-3.5 w-3.5 group-hover:rotate-12 transition-all" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Fast Copy Tools</span>
                      </div>
                      <p className="text-[9.5px] font-semibold text-gray-500 leading-normal">
                        Copy packages, Incl/Excl, FAQs, or terms from another tour with 1-click.
                      </p>
                    </button>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-50">
                      <p className="text-[9px] font-black text-primary uppercase mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", formData.status === 'published' ? 'bg-orange-500' : 'bg-amber-500')} />
                        <span className="text-[10px] font-bold text-gray-900 uppercase">{formData.status || 'Draft'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[800px] scrollbar-hide">
                  <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-10 space-y-6 md:space-y-8">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  {/* Single Day vs Multi Days Selector */}
                  <div className="p-5 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border-2 border-orange-100/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" /> Tour Duration Type
                      </label>
                      <span className="text-[10px] font-bold text-gray-400">Select if this tour is a 1-day trip or multi-day journey</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tourDurationType: 'single_day' })}
                        className={cn(
                          "p-4 rounded-xl border-2 text-xs font-black transition-all flex items-center justify-center gap-3 cursor-pointer",
                          (formData.tourDurationType === 'single_day' || !formData.tourDurationType)
                            ? "bg-white border-primary text-primary shadow-md scale-[1.01]"
                            : "bg-white/60 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200"
                        )}
                      >
                        <Sun className="h-5 w-5 text-amber-500" />
                        <div className="text-left">
                          <div className="font-black text-sm">Single Day Tour</div>
                          <div className="text-[10px] text-gray-400 font-normal">Day trip with single itinerary timeline</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tourDurationType: 'multi_day' })}
                        className={cn(
                          "p-4 rounded-xl border-2 text-xs font-black transition-all flex items-center justify-center gap-3 cursor-pointer",
                          formData.tourDurationType === 'multi_day'
                            ? "bg-white border-primary text-primary shadow-md scale-[1.01]"
                            : "bg-white/60 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200"
                        )}
                      >
                        <CalendarIcon className="h-5 w-5 text-blue-500" />
                        <div className="text-left">
                          <div className="font-black text-sm">Multi Days Tour</div>
                          <div className="text-[10px] text-gray-400 font-normal">Multi-day itinerary with hotels & guides</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Tour Title</label>
                        <input
                        required
                        placeholder="e.g. Bali Tropical Jungle Trek"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
                        />
                    </div>
                    {currentUserProfile?.role === 'admin' ? (
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Assigned Supplier</label>
                          <select
                            value={formData.supplierId}
                            onChange={e => {
                              const s = users.find(u => u.uid === e.target.value);
                              setFormData({ 
                                ...formData, 
                                supplierId: e.target.value,
                                supplierName: s ? (s.companyName || s.displayName) : '',
                                supplierEmail: s ? (s.publicEmail || s.email) : ''
                              });
                            }}
                            className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all bg-white font-bold"
                          >
                            <option value="">No Supplier (Direct)</option>
                            {users.filter(u => u.role === 'supplier').map(s => {
                              const email = s.publicEmail || s.email;
                              return (
                                <option key={s.uid} value={s.uid}>
                                  {s.companyName || s.displayName} ({email || 'NO EMAIL'})
                                </option>
                              );
                            })}
                          </select>
                          {formData.supplierId && !users.find(u => u.uid === formData.supplierId)?.email && !users.find(u => u.uid === formData.supplierId)?.publicEmail && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 animate-pulse">
                              ⚠️ Warning: This supplier has no email set. They will not receive booking notifications!
                            </p>
                          )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Tour Slug (URL)</label>
                        <input
                        required
                        placeholder="bali-tropical-jungle-trek"
                        value={formData.slug}
                        onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all bg-gray-50"
                        />
                      </div>
                    )}
                  </div>

                  {currentUserProfile?.role === 'admin' && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Tour Slug (URL)</label>
                        <input
                        required
                        placeholder="bali-tropical-jungle-trek"
                        value={formData.slug}
                        onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Approval Status</label>
                        <select
                          value={formData.status}
                          onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all bg-white font-bold"
                        >
                          <option value="published">Published</option>
                          <option value="pending">Pending Review</option>
                          <option value="draft">Draft</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Move Labels here for higher visibility */}
                  <div className="space-y-4 pt-4 bg-orange-50/10 p-6 rounded-2xl border border-dashed border-orange-100">
                    <div className="flex items-center justify-between">
                       <h3 className="text-sm font-black text-gray-900 border-l-4 border-primary pl-4">General Badge Labels</h3>
                       <span className="text-[10px] font-bold text-gray-400">Select badges to display on tour cards</span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {labels.map(l => (
                        <label 
                          key={l.id}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer",
                            formData.labelIds?.includes(l.id) ? "border-primary bg-white shadow-sm" : "border-gray-50 bg-gray-50/30"
                          )}
                        >
                          <input 
                            type="checkbox"
                            className="hidden"
                            checked={formData.labelIds?.includes(l.id) || false}
                            onChange={(e) => {
                              const ids = formData.labelIds || [];
                              const newIds = e.target.checked ? [...ids, l.id] : ids.filter(id => id !== l.id);
                              
                              // Clear placements if label is removed
                              const updates: any = { labelIds: newIds };
                              if (!e.target.checked) {
                                if (formData.imageLabelId === l.id) updates.imageLabelId = '';
                                if (formData.belowTitleLabelId === l.id) updates.belowTitleLabelId = '';
                                if (formData.priceLabelId === l.id) updates.priceLabelId = '';
                              }
                              
                              setFormData({ ...formData, ...updates });
                            }}
                          />
                          <div className={cn(
                            "h-4 w-4 rounded border transition-all flex items-center justify-center shrink-0",
                            formData.labelIds?.includes(l.id) ? "bg-primary border-primary text-white" : "border-gray-300"
                          )}>
                             {formData.labelIds?.includes(l.id) && <Check className="h-3 w-3" />}
                          </div>
                          <span className="text-xs font-bold text-gray-700 truncate">{l.name}</span>
                          {l.color && (
                             <div className="h-2 w-2 rounded-full ml-auto" style={{ backgroundColor: l.color }} />
                          )}
                        </label>
                      ))}
                    </div>
                    {labels.length === 0 && (
                      <p className="text-[10px] text-gray-400 font-medium">No labels created yet. Go to Inventory &gt; General Labels to add some.</p>
                    )}

                    <div className="pt-6 mt-6 border-t border-orange-100/50">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Label Placements</h4>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">On Image Placement</label>
                          <select 
                            value={formData.imageLabelId || ''}
                            onChange={e => setFormData({ ...formData, imageLabelId: e.target.value })}
                            className="w-full rounded-[10px] border-2 border-gray-100 p-3 text-xs focus:border-primary focus:outline-none transition-all"
                          >
                            <option value="">No Label</option>
                            {labels.filter(l => formData.labelIds?.includes(l.id)).map(l => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Below Title Placement</label>
                          <select 
                            value={formData.belowTitleLabelId || ''}
                            onChange={e => setFormData({ ...formData, belowTitleLabelId: e.target.value })}
                            className="w-full rounded-[10px] border-2 border-gray-100 p-3 text-xs focus:border-primary focus:outline-none transition-all"
                          >
                            <option value="">No Label</option>
                            {labels.filter(l => formData.labelIds?.includes(l.id)).map(l => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">On Price Placement</label>
                          <select 
                            value={formData.priceLabelId || ''}
                            onChange={e => setFormData({ ...formData, priceLabelId: e.target.value })}
                            className="w-full rounded-[10px] border-2 border-gray-100 p-3 text-xs focus:border-primary focus:outline-none transition-all"
                          >
                            <option value="">No Label</option>
                            {labels.filter(l => formData.labelIds?.includes(l.id)).map(l => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Detailed Location</label>
                      <input
                        required
                        placeholder="e.g. Ubud, Bali"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Duration</label>
                      <input
                        required
                        placeholder="e.g. 5 Days / 4 Nights"
                        value={formData.duration}
                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-black text-gray-900 border-l-4 border-primary pl-4">Urgency Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {urgencyPoints.map(point => (
                        <label 
                          key={point.id}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                            formData.urgencyPointIds?.includes(point.id) ? "border-primary bg-orange-50/10" : "border-gray-50 bg-gray-50/30 hover:border-orange-100"
                          )}
                        >
                          <input 
                            type="checkbox"
                            className="hidden"
                            checked={formData.urgencyPointIds?.includes(point.id) || false}
                            onChange={(e) => {
                              const ids = formData.urgencyPointIds || [];
                              setFormData({
                                ...formData,
                                urgencyPointIds: e.target.checked ? [...ids, point.id] : ids.filter(id => id !== point.id)
                              });
                            }}
                          />
                          <div className={cn(
                            "h-5 w-5 rounded border-2 transition-all flex items-center justify-center mt-0.5",
                            formData.urgencyPointIds?.includes(point.id) ? "bg-primary border-primary text-white" : "border-gray-300"
                          )}>
                            {formData.urgencyPointIds?.includes(point.id) && <Check className="h-3 w-3" />}
                          </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{point.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{point.description}</p>
                      </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-black text-gray-900 border-l-4 border-primary pl-4">Available Time Slots</h3>
                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {TIME_SLOTS.map(time => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => {
                              const slots = formData.timeSlots || [];
                              setFormData({
                                ...formData,
                                timeSlots: slots.includes(time) ? slots.filter(s => s !== time) : [...slots, time].sort()
                              });
                            }}
                            className={cn(
                              "py-2 rounded-lg text-[10px] font-bold border transition-all",
                              formData.timeSlots?.includes(time) ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-gray-500 border-gray-100 hover:border-orange-200"
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-bold text-gray-500">
                          {formData.timeSlots?.length || 0} time slot(s) selected
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Cut-Off Time Section */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-gray-900 border-l-4 border-primary pl-4">
                        Booking Cut-Off Time (Advance Notice)
                      </h3>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                        {formData.cutOffHours && formData.cutOffHours > 0
                          ? `Bookings close ${formData.cutOffHours}h before start`
                          : "Instant / Same-Day Booking Enabled"}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                      <p className="text-xs text-gray-500 font-medium">
                        Set how many hours before departure customers are allowed to make a booking. This ensures you have adequate time to schedule guides, arrange vehicles, and confirm operations.
                      </p>

                      {/* Quick Presets */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Quick Presets</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: "0h (Instant / Same Day)", value: 0 },
                            { label: "2 Hours", value: 2 },
                            { label: "4 Hours", value: 4 },
                            { label: "6 Hours", value: 6 },
                            { label: "12 Hours", value: 12 },
                            { label: "24 Hours (1 Day)", value: 24 },
                            { label: "48 Hours (2 Days)", value: 48 },
                            { label: "72 Hours (3 Days)", value: 72 },
                          ].map(preset => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, cutOffHours: preset.value })}
                              className={cn(
                                "px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                                (formData.cutOffHours ?? 0) === preset.value
                                  ? "bg-primary text-white border-primary shadow-sm"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
                              )}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Hours and Notice Override */}
                      <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-gray-200/60">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                            Custom Cut-Off (Hours)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="720"
                            value={formData.cutOffHours ?? 0}
                            onChange={e => setFormData({ ...formData, cutOffHours: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm font-bold focus:border-primary focus:outline-none bg-white"
                            placeholder="e.g. 12"
                          />
                          <p className="text-[10px] text-gray-400">0 = instant booking up to departure time.</p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                            Custom Notice to Customer (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.cutOffNotice || ''}
                            onChange={e => setFormData({ ...formData, cutOffNotice: e.target.value })}
                            className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm font-bold focus:border-primary focus:outline-none bg-white"
                            placeholder="e.g. Please book at least 12 hours in advance for hotel pickup"
                          />
                          <p className="text-[10px] text-gray-400">Leave blank to use automatic operational notice.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-gray-50 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-primary text-[10px]">Category</label>
                      <select 
                        value={formData.categoryId}
                        onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none bg-white text-sm font-bold"
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-primary text-[10px]">Tour Type</label>
                      <select 
                        value={formData.tourTypeId}
                        onChange={e => setFormData({ ...formData, tourTypeId: e.target.value })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none bg-white text-sm font-bold"
                      >
                        <option value="">Select Type</option>
                        {tourTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-primary text-[10px]">Location Zone</label>
                      <select 
                        value={formData.locationId}
                        onChange={e => setFormData({ ...formData, locationId: e.target.value })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none bg-white text-sm font-bold"
                      >
                        <option value="">Select Zone</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Description</label>
                    <textarea
                      required
                      rows={6}
                      placeholder="A compelling story about this tour..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Highlights & Gallery Tab */}
              {activeTab === 'content' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Layout className="h-4 w-4 text-primary" /> Tour Highlights (One per line)
                    </label>
                    <textarea
                      rows={8}
                      placeholder="Visit sacred temples&#10;Sunset dinner on the beach&#10;Private jungle trek..."
                      value={highlightsText}
                      onChange={e => setHighlightsText(e.target.value)}
                      className="w-full rounded-[10px] border-2 border-gray-100 p-4 font-medium focus:border-primary focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 border-l-4 border-blue-600 pl-3">Gallery (Select Featured Image)</h3>
                      <div className="flex gap-2.5">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={isUploading}
                          />
                          <button type="button" className="text-orange-700 text-sm font-bold flex items-center gap-1 py-1.5 px-3 bg-orange-50 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors">
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Upload New Images
                          </button>
                        </div>
                        
                        <button 
                          type="button" 
                          onClick={() => {
                            openMediaGallery((urls) => {
                              const currentGallery = formData.gallery || [];
                              setFormData({ ...formData, gallery: [...currentGallery, ...urls] });
                            }, true);
                          }}
                          className="text-blue-700 text-sm font-bold flex items-center gap-1 py-1.5 px-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                        >
                          <ImageIcon className="h-4 w-4" />
                          Pick From Gallery
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                       {formData.gallery?.map((url, i) => {
                        const isFeatured = formData.featuredImage === url;
                        return (
                          <div key={i} className={cn("relative aspect-square overflow-hidden rounded-[10px] bg-gray-100 group border-2 transition-all", isFeatured ? "border-primary ring-4 ring-orange-50" : "border-gray-100")}>
                            <img src={url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                               <button 
                                 type="button"
                                 onClick={() => setFormData({ ...formData, featuredImage: url })}
                                 className="px-3 py-1 bg-white text-gray-900 text-xs font-black uppercase rounded-[5px] hover:bg-primary hover:text-white transition-all"
                               >
                                 {isFeatured ? 'Featured' : 'Set Featured'}
                               </button>
                               <button 
                                type="button" 
                                onClick={() => {
                                  if (isFeatured) setFormData({ ...formData, featuredImage: '' });
                                  removeArrayItem('gallery', i);
                                }} 
                                className="px-3 py-1 bg-red-600 text-white text-xs font-black uppercase rounded-[5px] hover:bg-red-700 transition-all"
                              >
                                Delete
                              </button>
                            </div>
                            {isFeatured && (
                              <div className="absolute top-2 left-2 bg-primary text-white p-1 rounded-full shadow-lg">
                                <Star className="h-3 w-3 fill-current" />
                              </div>
                            )}
                          </div>
                        );
                       })}
                    </div>
                  </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-orange-500" />
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Free Map Builder (OpenStreetMap)</h4>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500">Search Location</label>
                        <OSMLocationSelector onLocationSelect={(embedUrl) => {
                          setFormData({ ...formData, locationMapUrl: embedUrl });
                        }} />
                        <p className="text-[10px] text-primary/60 font-medium italic px-1">
                          Type a place name to instantly generate a free OpenStreetMap embed.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500">Map Embed URL (iframe src)</label>
                        <input
                          placeholder="https://www.openstreetmap.org/export/embed.html?..."
                          value={formData.locationMapUrl}
                          onChange={e => setFormData({ ...formData, locationMapUrl: e.target.value })}
                          className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all font-mono text-[10px]"
                        />
                      </div>
                    </div>

                </div>
              )}

               {/* Inclusions & Exclusions Tab */}
              {activeTab === 'inclusions' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                   <div className="space-y-4">
                    <label className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-tight text-[10px]">
                      <CheckCircle className="h-4 w-4" /> General Inclusions (One per line)
                    </label>
                    <textarea 
                      rows={8}
                      value={inclusionsText}
                      onChange={e => setInclusionsText(e.target.value)}
                      placeholder="e.g. Safety Equipment&#10;Professional Guide"
                      className="w-full rounded-[10px] border-2 border-gray-100 p-4 text-sm focus:border-primary focus:outline-none font-medium min-h-[150px]"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-red-600 flex items-center gap-2 uppercase tracking-tight text-[10px]">
                      <X className="h-4 w-4" /> General Exclusions (One per line)
                    </label>
                    <textarea 
                      rows={8}
                      value={exclusionsText}
                      onChange={e => setExclusionsText(e.target.value)}
                      placeholder="e.g. Personal Expenses&#10;Gratuities"
                      className="w-full rounded-[10px] border-2 border-gray-100 p-4 text-sm focus:border-red-400 focus:outline-none font-medium min-h-[150px]"
                    />
                  </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === 'pricing' && (
                <div className="space-y-12 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="grid md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-[10px] border-2 border-dashed border-gray-200">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500">Display Price (Starts From)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          required
                          value={formData.regularPrice || ''}
                          onChange={e => setFormData({ ...formData, regularPrice: Number(e.target.value) })}
                          className="w-full rounded-[10px] border-2 border-white bg-white p-4 pl-12 text-2xl font-black text-primary shadow-sm focus:border-primary focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-gray-500">Discount Info (Optional)</label>
                       <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          value={formData.discountPrice || ''}
                          onChange={e => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                          className="w-full rounded-[10px] border-2 border-white bg-white p-4 pl-12 text-2xl font-black text-secondary shadow-sm focus:border-secondary focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 p-6 bg-blue-50/50 rounded-[10px] border border-blue-100">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-blue-800 flex items-center gap-2 uppercase tracking-tight text-[10px]">
                        <Icons.Users className="h-4 w-4" /> Daily Capacity
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 20"
                        value={formData.maxCapacity || ''}
                        onChange={e => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                        className="w-full rounded-[10px] border-2 border-white bg-white p-4 font-bold text-gray-900 focus:border-blue-400 focus:outline-none transition-all"
                      />
                      <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-1">Total participants allowed per day</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-blue-800 flex items-center gap-2 uppercase tracking-tight text-[10px]">
                        <Icons.Clock4 className="h-4 w-4" /> Capacity Per Slot (Optional)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 10"
                        value={formData.slotCapacity || ''}
                        onChange={e => setFormData({ ...formData, slotCapacity: Number(e.target.value) })}
                        className="w-full rounded-[10px] border-2 border-white bg-white p-4 font-bold text-gray-900 focus:border-blue-400 focus:outline-none transition-all"
                      />
                      <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-1">Leave blank to use Daily Capacity for slots</p>
                    </div>
                  </div>

                  {/* Complex Packages Section */}
                  <div className="space-y-8">
                     <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Tiered Pricing Packages</h3>
                        <button 
                          type="button" 
                          onClick={() => addArrayItem('packages', { name: '', details: '', inclusions: [], exclusions: [], meetingPoint: '', meetingPointType: 'Meeting Point', pickupAreas: '', transportIds: formData.transportIds || [], tiers: [{ minParticipants: 1, maxParticipants: 1, adultPrice: 0, childPrice: 0 }] })} 
                          className="flex items-center gap-2 rounded-[10px] bg-primary px-6 py-2 text-sm font-bold text-white shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all"
                        >
                          <PlusCircle className="h-4 w-4" /> New Package
                        </button>
                    </div>

                    <div className="space-y-12">
                      {formData.packages?.map((pkg, pIdx) => (
                        <div key={pIdx} className="relative rounded-[15px] border-2 border-gray-100 bg-white shadow-sm group overflow-hidden transition-all hover:border-orange-100">
                          <div 
                            className="p-5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100/50 transition-colors" 
                            onClick={() => setExpandedPackages(prev => prev.includes(pIdx) ? prev.filter(i => i !== pIdx) : [...prev, pIdx])}
                          >
                             <div className="flex items-center gap-4">
                                <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center font-black transition-all shadow-sm",
                                  expandedPackages.includes(pIdx) ? "bg-primary text-white scale-110" : "bg-white text-gray-400 border border-gray-100"
                                )}>
                                   {pIdx + 1}
                                </div>
                                <div>
                                   <h4 className="font-black text-gray-900 tracking-tight">{pkg.name || `Unnamed Package`}</h4>
                                   {pkg.tiers && pkg.tiers.length > 0 && !expandedPackages.includes(pIdx) && (
                                     <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">
                                       {pkg.tiers.length} Pricing {pkg.tiers.length === 1 ? 'Tier' : 'Tiers'}
                                     </p>
                                   )}
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                   <button 
                                     type="button" 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       const clonedPkg = { ...pkg, name: `${pkg.name} (Copy)` };
                                       const currentPackages = [...(formData.packages || [])];
                                       currentPackages.splice(pIdx + 1, 0, clonedPkg);
                                       setFormData({ ...formData, packages: currentPackages });
                                       setExpandedPackages(prev => [...prev.map(i => i > pIdx ? i + 1 : i), pIdx + 1]);
                                     }}
                                     className="p-2 text-orange-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-all"
                                     title="Clone Package"
                                   >
                                     <Copy className="h-5 w-5" />
                                   </button>
                                   <button 
                                     type="button" 
                                     onClick={(e) => { e.stopPropagation(); removeArrayItem('packages', pIdx); }}
                                     className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                     title="Delete Package"
                                   >
                                     <Trash2 className="h-5 w-5" />
                                   </button>
                                </div>
                                <div className="w-px h-6 bg-gray-200 mx-1" />
                                <ChevronDown className={cn("h-6 w-6 text-gray-400 transition-transform duration-500", expandedPackages.includes(pIdx) && "rotate-180")} />
                             </div>
                          </div>

                          {expandedPackages.includes(pIdx) && (
                            <div className="p-8 space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
                              {/* Package Header */}
                              <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Package Name</label>
                                    <input
                                      value={pkg.name}
                                      onChange={e => {
                                        const newPkg = { ...pkg, name: e.target.value };
                                        updateArrayItem('packages', pIdx, newPkg);
                                      }}
                                      className="w-full rounded-[10px] border-2 border-gray-100 p-4 font-bold text-primary focus:border-primary focus:outline-none transition-all"
                                      placeholder="e.g. Silver Package"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Package Details / Intro</label>
                                    <input
                                      value={pkg.details || ''}
                                      onChange={e => {
                                        const newPkg = { ...pkg, details: e.target.value };
                                        updateArrayItem('packages', pIdx, newPkg);
                                      }}
                                      className="w-full rounded-[10px] border-2 border-gray-100 p-4 font-medium text-sm focus:border-primary focus:outline-none transition-all"
                                      placeholder="A brief explanation of this package option..."
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Tiers Table */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pricing Tiers</h4>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      const newPkg = { ...pkg, tiers: [...pkg.tiers, { minParticipants: 1, maxParticipants: 1, adultPrice: 0, childPrice: 0 }] };
                                      updateArrayItem('packages', pIdx, newPkg);
                                    }}
                                    className="text-xs font-bold text-primary hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-all"
                                  >
                                    + Add Tier
                                  </button>
                                </div>
                                <div className="overflow-hidden rounded-[15px] border border-gray-100 shadow-sm">
                                  <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                      <tr>
                                        <th className="px-6 py-4">Min Pax</th>
                                        <th className="px-6 py-4">Max Pax</th>
                                        <th className="px-6 py-4">Adult ($)</th>
                                        <th className="px-6 py-4">Child ($)</th>
                                        <th className="px-6 py-4"></th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {pkg.tiers.map((tier, tIdx) => (
                                        <tr key={tIdx} className="hover:bg-gray-50/50 transition-colors">
                                          <td className="px-6 py-4">
                                            <input 
                                              type="number" 
                                              value={tier.minParticipants} 
                                              onChange={e => {
                                                const newTiers = [...pkg.tiers];
                                                newTiers[tIdx] = { ...tier, minParticipants: Number(e.target.value) };
                                                updateArrayItem('packages', pIdx, { ...pkg, tiers: newTiers });
                                              }}
                                              className="w-16 rounded-[8px] border-2 border-gray-50 p-2 font-bold text-center focus:border-primary focus:outline-none" 
                                            />
                                          </td>
                                          <td className="px-6 py-4">
                                            <input 
                                              type="number" 
                                              value={tier.maxParticipants} 
                                              onChange={e => {
                                                const newTiers = [...pkg.tiers];
                                                newTiers[tIdx] = { ...tier, maxParticipants: Number(e.target.value) };
                                                updateArrayItem('packages', pIdx, { ...pkg, tiers: newTiers });
                                              }}
                                              className="w-16 rounded-[8px] border-2 border-gray-50 p-2 font-bold text-center focus:border-primary focus:outline-none" 
                                            />
                                          </td>
                                          <td className="px-6 py-4">
                                            <input 
                                              type="number" 
                                              value={tier.adultPrice} 
                                              onChange={e => {
                                                const newTiers = [...pkg.tiers];
                                                newTiers[tIdx] = { ...tier, adultPrice: Number(e.target.value) };
                                                updateArrayItem('packages', pIdx, { ...pkg, tiers: newTiers });
                                              }}
                                              className="w-24 rounded-[8px] border-2 border-gray-50 p-2 font-black text-primary focus:border-primary focus:outline-none" 
                                            />
                                          </td>
                                          <td className="px-6 py-4">
                                            <input 
                                              type="number" 
                                              value={tier.childPrice} 
                                              onChange={e => {
                                                const newTiers = [...pkg.tiers];
                                                newTiers[tIdx] = { ...tier, childPrice: Number(e.target.value) };
                                                updateArrayItem('packages', pIdx, { ...pkg, tiers: newTiers });
                                              }}
                                              className="w-24 rounded-[8px] border-2 border-gray-50 p-2 font-black text-secondary focus:border-secondary focus:outline-none" 
                                            />
                                          </td>
                                          <td className="px-6 py-4">
                                            <button 
                                              type="button" 
                                              onClick={() => {
                                                const newTiers = [...pkg.tiers];
                                                newTiers.splice(tIdx, 1);
                                                updateArrayItem('packages', pIdx, { ...pkg, tiers: newTiers });
                                              }}
                                              className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                              <MinusCircle className="h-4 w-4" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Package Inclusions/Exclusions */}
                              <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-gray-50">
                                <div className="space-y-4">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inclusions (One per line)</label>
                                   <textarea 
                                     rows={5}
                                     placeholder="e.g. Hotel pickup&#10;Mineral water"
                                     value={(pkg.inclusions || []).join('\n')}
                                     onChange={e => {
                                       updateArrayItem('packages', pIdx, { ...pkg, inclusions: e.target.value.split('\n') });
                                     }}
                                     className="w-full rounded-xl border-2 border-gray-50 p-4 text-xs font-medium focus:border-primary focus:outline-none min-h-[120px] bg-gray-50/30"
                                   />
                                </div>
                                <div className="space-y-4">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exclusions (One per line)</label>
                                   <textarea 
                                     rows={5}
                                     placeholder="e.g. Lunch&#10;Gratuities"
                                     value={(pkg.exclusions || []).join('\n')}
                                     onChange={e => {
                                       updateArrayItem('packages', pIdx, { ...pkg, exclusions: e.target.value.split('\n') });
                                     }}
                                     className="w-full rounded-xl border-2 border-gray-50 p-4 text-xs font-medium focus:border-amber-200 focus:outline-none min-h-[120px] bg-gray-50/30"
                                   />
                                </div>
                              </div>

                              {/* Transportation Option Section */}
                              <div className="pt-8 border-t-2 border-dashed border-gray-50 space-y-6">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-primary">
                                      <Car className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Transportation Option</h4>
                                      <p className="text-[10px] text-gray-400 font-medium">Configure global transport options available for this specific package</p>
                                    </div>
                                  </div>
                                  <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                    <button
                                      type="button"
                                      onClick={() => updateArrayItem('packages', pIdx, { ...pkg, meetingPointType: 'Meeting Point' })}
                                      className={cn(
                                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        (pkg.meetingPointType === 'Meeting Point' || !pkg.meetingPointType) ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                                      )}
                                    >
                                      Meeting Point
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateArrayItem('packages', pIdx, { ...pkg, meetingPointType: 'Pick up Location' })}
                                      className={cn(
                                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        pkg.meetingPointType === 'Pick up Location' ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                                      )}
                                    >
                                      Pick up Location
                                    </button>
                                  </div>
                                </div>

                                {/* Selectable Global Transports for this Package */}
                                <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                                      Select Global Transports for this Package
                                    </label>
                                    <span className="text-[10px] font-bold text-gray-400">
                                      {globalTransports.length} global options
                                    </span>
                                  </div>

                                  {globalTransports.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {globalTransports.map(t => {
                                        const currentPkgTransportIds = pkg.transportIds ?? formData.transportIds ?? globalTransports.map(gt => gt.id);
                                        const isSelected = currentPkgTransportIds.includes(t.id);

                                        return (
                                          <div
                                            key={t.id}
                                            onClick={() => {
                                              const updatedIds = isSelected
                                                ? currentPkgTransportIds.filter(id => id !== t.id)
                                                : [...currentPkgTransportIds, t.id];
                                              updateArrayItem('packages', pIdx, { ...pkg, transportIds: updatedIds });
                                            }}
                                            className={cn(
                                              "p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group bg-white",
                                              isSelected ? "border-primary bg-orange-50/20 text-gray-900 shadow-sm" : "border-gray-200 hover:border-orange-200 text-gray-500 opacity-70 hover:opacity-100"
                                            )}
                                          >
                                            <div className="flex items-center gap-2.5">
                                              <div className={cn(
                                                "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                                                isSelected ? "bg-primary border-primary text-white" : "border-gray-300 bg-white"
                                              )}>
                                                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                              </div>
                                              <div>
                                                <p className="font-bold text-xs text-gray-900 leading-tight">{t.name}</p>
                                                <p className="text-[10px] font-extrabold uppercase text-gray-400 mt-0.5">
                                                  Type: {t.type === 'meet' ? 'Own Transport' : t.type} • {t.type === 'meet' ? 'Free' : `${formatPrice(t.price)}`}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400 italic">No global transport options found. Please configure them in the Transports menu.</p>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                                  {/* Meeting Point Address & Maps URL */}
                                  {(() => {
                                    const rawAddress = pkg.meetingPoint || "";
                                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                                    const match = rawAddress.match(urlRegex);
                                    const currentLink = match ? match[0] : "";
                                    const currentTitle = rawAddress.replace(urlRegex, "").replace(/^[\s\-,.:;]+|[\s\-,.:;]+$/g, "").trim();

                                    return (
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4 text-primary" />
                                          <label className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
                                            Meeting Point Location & Map Link
                                          </label>
                                        </div>
                                        <div className="space-y-3">
                                          <div>
                                            <label className="text-[10px] font-bold text-gray-500 block mb-1">Location Title / Address</label>
                                            <input
                                              type="text"
                                              placeholder="e.g. Sanur Beach Harbor Entrance"
                                              value={currentTitle}
                                              onChange={e => {
                                                const newTitle = e.target.value;
                                                const newMeetingPoint = currentLink ? `${newTitle}\n${currentLink}` : newTitle;
                                                updateArrayItem('packages', pIdx, { ...pkg, meetingPoint: newMeetingPoint });
                                              }}
                                              className="w-full rounded-xl border-2 border-gray-200 p-3 text-xs font-bold text-gray-900 focus:border-primary focus:bg-white outline-none transition-all bg-white"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] font-bold text-gray-500 block mb-1">Google Maps URL</label>
                                            <input
                                              type="text"
                                              placeholder="e.g. https://maps.app.goo.gl/..."
                                              value={currentLink}
                                              onChange={e => {
                                                const newLink = e.target.value;
                                                const newMeetingPoint = newLink ? `${currentTitle}\n${newLink}` : currentTitle;
                                                updateArrayItem('packages', pIdx, { ...pkg, meetingPoint: newMeetingPoint });
                                              }}
                                              className="w-full rounded-xl border-2 border-gray-200 p-3 text-xs font-bold text-gray-900 focus:border-primary focus:bg-white outline-none transition-all bg-white"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Pick Up Areas Served */}
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                      <Car className="h-4 w-4 text-primary" />
                                      <label className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
                                        Pick Up Areas Served
                                      </label>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-gray-500 block mb-1">Covered Hotel Pickup Areas</label>
                                      <textarea
                                        rows={4}
                                        placeholder="e.g. Hotel pickup served in Ubud, Canggu, Seminyak, Kuta, Sanur, Jimbaran, Nusa Dua, and Denpasar."
                                        value={pkg.pickupAreas || ''}
                                        onChange={e => updateArrayItem('packages', pIdx, { ...pkg, pickupAreas: e.target.value })}
                                        className="w-full rounded-xl border-2 border-gray-200 p-3 text-xs font-semibold text-gray-900 focus:border-primary focus:bg-white outline-none transition-all bg-white min-h-[92px]"
                                      />
                                      <p className="text-[10px] text-gray-400 font-medium">Specify pickup zones covered for this package</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Single Day Itinerary Tab */}
              {activeTab === 'itinerary' && formData.tourDurationType !== 'multi_day' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 border-l-4 border-blue-600 pl-3 uppercase tracking-wider text-sm">Day-by-Day Journey</h3>
                    <button type="button" onClick={() => addArrayItem('itinerary', { day: (formData.itinerary?.length || 0) + 1, title: '', description: '' })} className="font-bold text-blue-600 flex items-center gap-2">
                       <PlusCircle className="h-5 w-5" /> Add New Day
                    </button>
                  </div>
                   <div className="space-y-6">
                    {formData.itinerary?.map((item, i) => (
                      <div key={i} className="group relative border-2 border-gray-100 rounded-[15px] transition-all bg-white shadow-sm overflow-hidden hover:border-blue-100">
                        <div 
                          className="p-5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100/50 transition-colors"
                          onClick={() => setExpandedItinerary(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])}
                        >
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center font-black transition-all shadow-sm",
                                expandedItinerary.includes(i) ? "bg-blue-600 text-white scale-110" : "bg-white text-gray-400 border border-gray-100"
                              )}>
                                 {item.day}
                              </div>
                              <div>
                                 <h4 className="font-black text-gray-900 tracking-tight">{item.title || `Day ${item.day}`}</h4>
                                 {!expandedItinerary.includes(i) && item.description && (
                                   <p className="text-[10px] font-bold text-gray-400 line-clamp-1 mt-0.5">{item.description}</p>
                                 )}
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); removeArrayItem('itinerary', i); }} 
                                className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Day"
                              >
                                 <Trash2 className="h-5 w-5"/>
                              </button>
                              <div className="w-px h-6 bg-gray-200 mx-1" />
                              <ChevronDown className={cn("h-6 w-6 text-gray-400 transition-transform duration-500", expandedItinerary.includes(i) && "rotate-180")} />
                           </div>
                        </div>

                        {expandedItinerary.includes(i) && (
                          <div className="p-8 space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
                            <input 
                              placeholder="Day Title (e.g. Arrival & Discovery)"
                              value={item.title} 
                              onChange={e => updateArrayItem('itinerary', i, { ...item, title: e.target.value })}
                              className="w-full font-black text-2xl mb-1 border-none focus:ring-0 p-0 text-gray-900 placeholder:text-gray-200"
                            />
                            
                            <div className="space-y-4 pt-4 border-t border-gray-50">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arrival / Pick-up Details</label>
                              <div className="flex gap-6 items-start">
                                <div className="flex-1 bg-gray-50/50 p-4 rounded-xl border-2 border-gray-50 focus-within:border-blue-200 focus-within:bg-white transition-all">
                                  <input 
                                    placeholder="Pick Up details (e.g. 08:30 AM at Hotel Lobby)"
                                    value={typeof item.pickup === 'object' ? item.pickup?.description : item.pickup || ''} 
                                    onChange={e => updateArrayItem('itinerary', i, { 
                                      ...item, 
                                      pickup: { ...(typeof item.pickup === 'object' ? item.pickup : {}), description: e.target.value } 
                                    })}
                                    className="w-full text-sm font-bold text-blue-600 bg-transparent border-none focus:ring-0 p-0 placeholder:text-blue-200"
                                  />
                                </div>
                                <div className="w-32 aspect-video rounded-[10px] bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden relative group shadow-inner">
                                   {typeof item.pickup === 'object' && item.pickup?.image ? (
                                     <>
                                       <img src={item.pickup.image} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              openMediaGallery((urls) => {
                                                if (urls[0]) {
                                                  updateArrayItem('itinerary', i, { 
                                                    ...item, 
                                                    pickup: { ...(typeof item.pickup === 'object' ? item.pickup : {}), image: urls[0], description: typeof item.pickup === 'object' ? item.pickup?.description || '' : item.pickup || '' } 
                                                  });
                                                }
                                              }, false);
                                            }} 
                                            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                                            title="Change Image from Gallery"
                                          >
                                            <ImageIcon className="h-4 w-4" />
                                          </button>
                                          <button type="button" onClick={() => updateArrayItem('itinerary', i, { ...item, pickup: { ...item.pickup, image: '' } })} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors" title="Delete Image"><Trash2 className="h-4 w-4" /></button>
                                       </div>
                                     </>
                                   ) : (
                                     <div className="h-full w-full flex flex-col justify-center items-center p-2 relative">
                                        <div className="flex gap-2 mb-1.5 shrink-0 z-10">
                                          {/* Upload */}
                                          <div className="relative">
                                            <button type="button" className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 p-1.5 rounded-md text-xs font-bold leading-none shrink-0 shadow-xs flex items-center justify-center">
                                              <Upload className="h-3.5 w-3.5 text-gray-400" />
                                            </button>
                                            <input 
                                              type="file" 
                                              onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  try {
                                                    const url = await uploadImage(file);
                                                    updateArrayItem('itinerary', i, { 
                                                      ...item, 
                                                      pickup: { ...(typeof item.pickup === 'object' ? item.pickup : {}), image: url, description: typeof item.pickup === 'object' ? item.pickup?.description || '' : item.pickup || '' } 
                                                    });
                                                  } catch (err) {
                                                    alert("Failed to upload pickup image");
                                                  }
                                                }
                                              }} 
                                              className="absolute inset-0 opacity-0 cursor-pointer" 
                                            />
                                          </div>
                                          
                                          {/* Gallery */}
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              openMediaGallery((urls) => {
                                                if (urls[0]) {
                                                  updateArrayItem('itinerary', i, { 
                                                    ...item, 
                                                    pickup: { ...(typeof item.pickup === 'object' ? item.pickup : {}), image: urls[0], description: typeof item.pickup === 'object' ? item.pickup?.description || '' : item.pickup || '' } 
                                                  });
                                                }
                                              }, false);
                                            }}
                                            className="bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 p-1.5 rounded-md text-xs font-bold leading-none shrink-0 shadow-xs flex items-center justify-center"
                                          >
                                            <ImageIcon className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                        <span className="text-[8px] text-gray-400 font-extrabold uppercase scale-90">Image</span>
                                     </div>
                                   )}
                                </div>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-4 gap-8 pt-4 border-t border-gray-50">
                              <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Description</label>
                                <textarea 
                                  placeholder="What will happen on this day? Be descriptive and engaging..."
                                  rows={6}
                                  value={item.description}
                                  onChange={e => updateArrayItem('itinerary', i, { ...item, description: e.target.value })}
                                  className="w-full text-sm font-medium text-gray-600 border-none focus:ring-0 p-0 bg-transparent scrollbar-hide min-h-[150px]"
                                />
                              </div>
                              <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between items-center">
                                  <span>Featured Day Image</span>
                                </label>
                                <div className="relative aspect-video rounded-2xl bg-gray-100 border-4 border-white shadow-xl overflow-hidden group">
                                   {item.image ? (
                                     <>
                                       <img src={item.image} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              openMediaGallery((urls) => {
                                                if (urls[0]) {
                                                  updateArrayItem('itinerary', i, { ...item, image: urls[0] });
                                                }
                                              }, false);
                                            }} 
                                            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                                            title="Change image from Gallery"
                                          >
                                            <ImageIcon className="h-6 w-6" />
                                          </button>
                                          <button type="button" onClick={() => updateArrayItem('itinerary', i, { ...item, image: '' })} className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors shadow-lg" title="Delete image"><Trash2 className="h-6 w-6" /></button>
                                       </div>
                                     </>
                                   ) : (
                                     <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-gray-50/50 p-6">
                                       <div className="flex gap-4">
                                         {/* Drop/Upload */}
                                         <div className="relative">
                                           <button type="button" className="flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 duration-200 px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
                                             <Upload className="h-4 w-4 text-gray-500" />
                                             Upload Image
                                           </button>
                                           <input type="file" onChange={(e) => handleItineraryImageUpload(i, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                         </div>
                                         
                                         {/* Gallery */}
                                         <button 
                                           type="button" 
                                           onClick={() => {
                                             openMediaGallery((urls) => {
                                               if (urls[0]) {
                                                 updateArrayItem('itinerary', i, { ...item, image: urls[0] });
                                               }
                                             }, false);
                                           }}
                                           className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 duration-200 px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
                                         >
                                           <ImageIcon className="h-4 w-4" />
                                           Pick Gallery
                                         </button>
                                       </div>
                                       <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Choose featured photo for Day {item.day}</span>
                                     </div>
                                   )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-Day Itinerary Tab */}
              {activeTab === 'itinerary' && formData.tourDurationType === 'multi_day' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-gray-900 border-l-4 border-blue-600 pl-3 uppercase tracking-wider text-sm">Multi-Day Tour Itinerary</h3>
                      <p className="text-xs text-gray-400 pl-4 mt-0.5">Organize day-by-day title, description, and time-stamped schedule with photos</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        const days = formData.multiDayItinerary || [];
                        const nextDayNum = days.length + 1;
                        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
                        const label = romanNumerals[nextDayNum - 1] || `${nextDayNum}`;
                        setFormData({
                          ...formData,
                          multiDayItinerary: [
                            ...days,
                            {
                              dayNumber: nextDayNum,
                              title: `Day ${label}: Title`,
                              description: '',
                              itineraryItems: [
                                { time: '08:00', title: 'Pick up at airport', image: '', description: '' }
                              ]
                            }
                          ]
                        });
                      }} 
                      className="font-bold bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                    >
                      <PlusCircle className="h-4 w-4" /> Add Day
                    </button>
                  </div>

                  <div className="space-y-6">
                    {(formData.multiDayItinerary || []).map((day, dayIdx) => (
                      <div key={dayIdx} className="border-2 border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden space-y-4 p-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="h-8 w-8 bg-blue-600 text-white font-black rounded-xl text-xs flex items-center justify-center shrink-0">
                              {day.dayNumber}
                            </span>
                            <input
                              type="text"
                              placeholder="Day Title (e.g. Day I: Pick up & Arrival)"
                              value={day.title}
                              onChange={e => {
                                const updated = [...(formData.multiDayItinerary || [])];
                                updated[dayIdx] = { ...updated[dayIdx], title: e.target.value };
                                setFormData({ ...formData, multiDayItinerary: updated });
                              }}
                              className="font-black text-lg text-gray-900 border-b border-dashed border-gray-200 focus:border-blue-600 focus:outline-none w-full max-w-lg pb-1"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (formData.multiDayItinerary || []).filter((_, idx) => idx !== dayIdx);
                              setFormData({ ...formData, multiDayItinerary: updated });
                            }}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Day"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Day Description</label>
                          <textarea
                            placeholder="Overview description for this day..."
                            rows={2}
                            value={day.description}
                            onChange={e => {
                              const updated = [...(formData.multiDayItinerary || [])];
                              updated[dayIdx] = { ...updated[dayIdx], description: e.target.value };
                              setFormData({ ...formData, multiDayItinerary: updated });
                            }}
                            className="w-full text-xs font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-3 focus:outline-none focus:border-blue-300"
                          />
                        </div>

                        {/* Time Schedule Items */}
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-gray-800 uppercase tracking-wider">Schedule Items</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(formData.multiDayItinerary || [])];
                                const currentItems = updated[dayIdx].itineraryItems || [];
                                updated[dayIdx] = {
                                  ...updated[dayIdx],
                                  itineraryItems: [...currentItems, { time: '09:00', title: '', image: '', description: '' }]
                                };
                                setFormData({ ...formData, multiDayItinerary: updated });
                              }}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Schedule Event
                            </button>
                          </div>

                          <div className="space-y-3 pl-2 border-l-2 border-blue-100">
                            {(day.itineraryItems || []).map((item, itemIdx) => (
                              <div key={itemIdx} className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 space-y-3 relative group">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="text"
                                    placeholder="08:00"
                                    value={item.time}
                                    onChange={e => {
                                      const updated = [...(formData.multiDayItinerary || [])];
                                      const items = [...updated[dayIdx].itineraryItems];
                                      items[itemIdx] = { ...items[itemIdx], time: e.target.value };
                                      updated[dayIdx] = { ...updated[dayIdx], itineraryItems: items };
                                      setFormData({ ...formData, multiDayItinerary: updated });
                                    }}
                                    className="w-24 text-xs font-black bg-white border border-gray-200 rounded-lg p-2 text-blue-700 text-center"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Event Title (e.g. Pick up at airport)"
                                    value={item.title}
                                    onChange={e => {
                                      const updated = [...(formData.multiDayItinerary || [])];
                                      const items = [...updated[dayIdx].itineraryItems];
                                      items[itemIdx] = { ...items[itemIdx], title: e.target.value };
                                      updated[dayIdx] = { ...updated[dayIdx], itineraryItems: items };
                                      setFormData({ ...formData, multiDayItinerary: updated });
                                    }}
                                    className="flex-1 text-xs font-bold bg-white border border-gray-200 rounded-lg p-2 text-gray-900"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...(formData.multiDayItinerary || [])];
                                      const items = updated[dayIdx].itineraryItems.filter((_, idx) => idx !== itemIdx);
                                      updated[dayIdx] = { ...updated[dayIdx], itineraryItems: items };
                                      setFormData({ ...formData, multiDayItinerary: updated });
                                    }}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Remove event"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="grid md:grid-cols-3 gap-3">
                                  <div className="md:col-span-2">
                                    <textarea
                                      placeholder="Event description..."
                                      rows={2}
                                      value={item.description}
                                      onChange={e => {
                                        const updated = [...(formData.multiDayItinerary || [])];
                                        const items = [...updated[dayIdx].itineraryItems];
                                        items[itemIdx] = { ...items[itemIdx], description: e.target.value };
                                        updated[dayIdx] = { ...updated[dayIdx], itineraryItems: items };
                                        setFormData({ ...formData, multiDayItinerary: updated });
                                      }}
                                      className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 text-gray-700"
                                    />
                                  </div>
                                  <div>
                                    {item.image ? (
                                      <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group/img">
                                        <img src={item.image} className="w-full h-full object-cover" />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = [...(formData.multiDayItinerary || [])];
                                            const items = [...updated[dayIdx].itineraryItems];
                                            items[itemIdx] = { ...items[itemIdx], image: '' };
                                            updated[dayIdx] = { ...updated[dayIdx], itineraryItems: items };
                                            setFormData({ ...formData, multiDayItinerary: updated });
                                          }}
                                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover/img:opacity-100 transition-opacity"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            openMediaGallery((urls) => {
                                              if (urls[0]) {
                                                const updated = [...(formData.multiDayItinerary || [])];
                                                const items = [...updated[dayIdx].itineraryItems];
                                                items[itemIdx] = { ...items[itemIdx], image: urls[0] };
                                                updated[dayIdx] = { ...updated[dayIdx], itineraryItems: items };
                                                setFormData({ ...formData, multiDayItinerary: updated });
                                              }
                                            }, false);
                                          }}
                                          className="flex-1 py-2 px-3 bg-white border border-gray-200 hover:border-blue-300 text-gray-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                                        >
                                          <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                                          Image
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                    {(formData.multiDayItinerary || []).length === 0 && (
                      <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                        <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-500">No multi-day itinerary added yet.</p>
                        <p className="text-[10px] text-gray-400 mt-1">Click "Add Day" above to start building Day 1, Day 2 schedule.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Accommodations Tab */}
              {activeTab === 'accommodations' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-gray-900 border-l-4 border-emerald-600 pl-3 uppercase tracking-wider text-sm">Hotel & Accommodation Options</h3>
                      <p className="text-xs text-gray-400 pl-4 mt-0.5">Admin can create unlimited accommodation types (Resorts, Villas, Hotels, Airbnb) with room options and pricing</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        const accs = formData.accommodations || [];
                        setFormData({
                          ...formData,
                          accommodations: [
                            ...accs,
                            {
                              id: `acc_${Date.now()}`,
                              category: 'Resorts',
                              name: '',
                              image: '',
                              description: '',
                              roomTypes: [
                                { id: `rt_${Date.now()}_1`, name: 'Single Room', price: 50, description: '' },
                                { id: `rt_${Date.now()}_2`, name: 'Double Room', price: 90, description: '' }
                              ]
                            }
                          ]
                        });
                      }} 
                      className="font-bold bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                    >
                      <PlusCircle className="h-4 w-4" /> Add Accommodation Option
                    </button>
                  </div>

                  <div className="space-y-6">
                    {(formData.accommodations || []).map((acc, accIdx) => (
                      <div key={acc.id || accIdx} className="border-2 border-gray-100 rounded-2xl bg-white shadow-sm p-6 space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Accommodation Type / Category</label>
                            <select
                              value={acc.category}
                              onChange={e => {
                                const updated = [...(formData.accommodations || [])];
                                updated[accIdx] = { ...updated[accIdx], category: e.target.value as any };
                                setFormData({ ...formData, accommodations: updated });
                              }}
                              className="w-full text-xs font-bold border-2 border-gray-100 rounded-xl p-3 focus:border-emerald-600 focus:outline-none"
                            >
                              <option value="Resorts">Resorts</option>
                              <option value="Hotel">Hotel</option>
                              <option value="Villa">Villa</option>
                              <option value="Airbnb">Airbnb</option>
                              <option value="Guest House">Guest House</option>
                            </select>
                          </div>

                          <div className="md:col-span-2 flex items-center gap-3">
                            <div className="flex-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Accommodation Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Grand Bali Resort"
                                value={acc.name}
                                onChange={e => {
                                  const updated = [...(formData.accommodations || [])];
                                  updated[accIdx] = { ...updated[accIdx], name: e.target.value };
                                  setFormData({ ...formData, accommodations: updated });
                                }}
                                className="w-full text-xs font-bold border-2 border-gray-100 rounded-xl p-3 focus:border-emerald-600 focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (formData.accommodations || []).filter((_, idx) => idx !== accIdx);
                                setFormData({ ...formData, accommodations: updated });
                              }}
                              className="p-3 mt-4 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Delete Accommodation"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Description</label>
                            <textarea
                              placeholder="Description of the hotel, location, highlights..."
                              rows={3}
                              value={acc.description}
                              onChange={e => {
                                const updated = [...(formData.accommodations || [])];
                                updated[accIdx] = { ...updated[accIdx], description: e.target.value };
                                setFormData({ ...formData, accommodations: updated });
                              }}
                              className="w-full text-xs font-medium border-2 border-gray-100 rounded-xl p-3 focus:border-emerald-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Photo</label>
                            {acc.image ? (
                              <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                                <img src={acc.image} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(formData.accommodations || [])];
                                    updated[accIdx] = { ...updated[accIdx], image: '' };
                                    setFormData({ ...formData, accommodations: updated });
                                  }}
                                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  openMediaGallery((urls) => {
                                    if (urls[0]) {
                                      const updated = [...(formData.accommodations || [])];
                                      updated[accIdx] = { ...updated[accIdx], image: urls[0] };
                                      setFormData({ ...formData, accommodations: updated });
                                    }
                                  }, false);
                                }}
                                className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1 hover:border-emerald-500 hover:bg-emerald-50/20 text-gray-500 font-bold text-xs"
                              >
                                <ImageIcon className="h-5 w-5 text-emerald-600" />
                                Select Image
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Room Types */}
                        <div className="pt-4 border-t border-gray-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              <Bed className="h-4 w-4 text-emerald-600" /> Room Types & Pricing
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(formData.accommodations || [])];
                                const roomTypes = updated[accIdx].roomTypes || [];
                                updated[accIdx] = {
                                  ...updated[accIdx],
                                  roomTypes: [
                                    ...roomTypes,
                                    { id: `rt_${Date.now()}`, name: 'Private Room', price: 100, description: '' }
                                  ]
                                };
                                setFormData({ ...formData, accommodations: updated });
                              }}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Room Option
                            </button>
                          </div>

                          <div className="grid md:grid-cols-2 gap-3">
                            {(acc.roomTypes || []).map((room, roomIdx) => (
                              <div key={room.id || roomIdx} className="bg-emerald-50/30 border border-emerald-100 p-3 rounded-xl space-y-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Room Name (e.g. Single / Double / Private)"
                                    value={room.name}
                                    onChange={e => {
                                      const updated = [...(formData.accommodations || [])];
                                      const roomTypes = [...updated[accIdx].roomTypes];
                                      roomTypes[roomIdx] = { ...roomTypes[roomIdx], name: e.target.value };
                                      updated[accIdx] = { ...updated[accIdx], roomTypes };
                                      setFormData({ ...formData, accommodations: updated });
                                    }}
                                    className="flex-1 text-xs font-bold bg-white border border-gray-200 rounded-lg p-2 text-gray-900"
                                  />
                                  <div className="relative w-28">
                                    <span className="absolute left-2.5 top-2 text-xs font-bold text-gray-400">$</span>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={room.price}
                                      onChange={e => {
                                        const updated = [...(formData.accommodations || [])];
                                        const roomTypes = [...updated[accIdx].roomTypes];
                                        roomTypes[roomIdx] = { ...roomTypes[roomIdx], price: parseFloat(e.target.value) || 0 };
                                        updated[accIdx] = { ...updated[accIdx], roomTypes };
                                        setFormData({ ...formData, accommodations: updated });
                                      }}
                                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg p-2 pl-6 text-emerald-700"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...(formData.accommodations || [])];
                                      const roomTypes = updated[accIdx].roomTypes.filter((_, idx) => idx !== roomIdx);
                                      updated[accIdx] = { ...updated[accIdx], roomTypes };
                                      setFormData({ ...formData, accommodations: updated });
                                    }}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                    {(formData.accommodations || []).length === 0 && (
                      <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                        <Hotel className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-500">No accommodation options created yet.</p>
                        <p className="text-[10px] text-gray-400 mt-1">Click "Add Accommodation Option" above to create hotels, resorts, villas, or airbnbs.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Guides Tab */}
              {activeTab === 'guides' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-gray-900 border-l-4 border-indigo-600 pl-3 uppercase tracking-wider text-sm">Tour Guide Language Options</h3>
                      <p className="text-xs text-gray-400 pl-4 mt-0.5">Define multi-language guide choices and associated pricing for multi-day trips</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        const guides = formData.multiDayGuides || [];
                        setFormData({
                          ...formData,
                          multiDayGuides: [
                            ...guides,
                            {
                              id: `guide_${Date.now()}`,
                              language: 'English',
                              price: 0,
                              description: 'Professional Licensed English Speaking Guide'
                            }
                          ]
                        });
                      }} 
                      className="font-bold bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                    >
                      <PlusCircle className="h-4 w-4" /> Add Guide Option
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {(formData.multiDayGuides || []).map((guide, guideIdx) => (
                      <div key={guide.id || guideIdx} className="border-2 border-gray-100 rounded-2xl bg-white shadow-sm p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Language Name</label>
                            <input
                              type="text"
                              placeholder="e.g. English, Spanish, German, Japanese"
                              value={guide.language}
                              onChange={e => {
                                const updated = [...(formData.multiDayGuides || [])];
                                updated[guideIdx] = { ...updated[guideIdx], language: e.target.value };
                                setFormData({ ...formData, multiDayGuides: updated });
                              }}
                              className="w-full text-xs font-bold border-2 border-gray-100 rounded-xl p-3 focus:border-indigo-600 focus:outline-none"
                            />
                          </div>

                          <div className="w-32">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Extra Price ($)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={guide.price}
                              onChange={e => {
                                const updated = [...(formData.multiDayGuides || [])];
                                updated[guideIdx] = { ...updated[guideIdx], price: parseFloat(e.target.value) || 0 };
                                setFormData({ ...formData, multiDayGuides: updated });
                              }}
                              className="w-full text-xs font-bold border-2 border-gray-100 rounded-xl p-3 text-indigo-700 focus:border-indigo-600 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = (formData.multiDayGuides || []).filter((_, idx) => idx !== guideIdx);
                              setFormData({ ...formData, multiDayGuides: updated });
                            }}
                            className="p-3 mt-4 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Guide Note / Description</label>
                          <input
                            type="text"
                            placeholder="e.g. Fluent local guide included throughout the multi-day tour"
                            value={guide.description || ''}
                            onChange={e => {
                              const updated = [...(formData.multiDayGuides || [])];
                              updated[guideIdx] = { ...updated[guideIdx], description: e.target.value };
                              setFormData({ ...formData, multiDayGuides: updated });
                            }}
                            className="w-full text-xs font-medium border border-gray-100 bg-gray-50 rounded-lg p-2 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {(formData.multiDayGuides || []).length === 0 && (
                    <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                      <UserCheck className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-500">No guide language options added yet.</p>
                      <p className="text-[10px] text-gray-400 mt-1">Click "Add Guide Option" above to offer multi-language guides.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Add-ons Selection Tab */}
              {activeTab === 'addOns' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                   <div className="bg-orange-50 p-6 rounded-[10px] border border-orange-100 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                         <PlusCircle className="h-6 w-6" />
                      </div>
                      <div>
                         <h4 className="font-black text-gray-900 text-sm tracking-tight">Global Add-ons Selection</h4>
                         <p className="text-xs text-gray-500 font-medium">Select the add-ons available for this specific tour.</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {globalAddOns.map(addon => {
                        const isSelected = formData.addOnIds?.includes(addon.id);
                        return (
                          <div 
                            key={addon.id} 
                            onClick={() => {
                              const currentIds = formData.addOnIds || [];
                              const newIds = isSelected 
                                ? currentIds.filter(id => id !== addon.id)
                                : [...currentIds, addon.id];
                              setFormData({ ...formData, addOnIds: newIds });
                            }}
                            className={cn(
                              "p-6 rounded-[10px] border-2 transition-all cursor-pointer flex items-center justify-between group",
                              isSelected ? "border-primary bg-orange-50/20" : "border-gray-100 bg-white hover:border-orange-200"
                            )}
                          >
                             <div className="flex items-center gap-3">
                                <div className={cn("h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all", isSelected ? "bg-primary border-primary" : "border-gray-200")}>
                                   {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                                </div>
                                <div>
                                   <p className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">{addon.name}</p>
                                   <p className="text-xs font-bold text-primary tracking-tight">{formatPrice(addon.price)} / {addon.unit}</p>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                      {globalAddOns.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-[10px]">
                           No global add-ons found. Please create them in the Add-ons Menu.
                        </div>
                      )}
                   </div>
                </div>
              )}

              {/* Transports Selection Tab */}
              {activeTab === 'transports' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                   <div className="bg-orange-50 p-6 rounded-[10px] border border-orange-100 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                         <Car className="h-6 w-6" />
                      </div>
                      <div>
                         <h4 className="font-black text-gray-900 text-sm tracking-tight">Global Transports & Meeting Point Configuration</h4>
                         <p className="text-xs text-gray-500 font-medium">Configure meeting points and toggle transfer options available for this specific tour.</p>
                      </div>
                   </div>

                   {(() => {
                     const rawAddress = formData.meetingPoint || "";
                     const urlRegex = /(https?:\/\/[^\s]+)/g;
                     const match = rawAddress.match(urlRegex);
                     const currentLink = match ? match[0] : "";
                     const currentTitle = rawAddress.replace(urlRegex, "").replace(/^[\s\-,.:;]+|[\s\-,.:;]+$/g, "").trim();

                     return (
                       <div className="space-y-4 bg-white p-6 rounded-[10px] border border-gray-100 shadow-sm">
                         <h4 className="font-bold text-sm text-gray-900 border-b border-gray-50 pb-2 flex items-center gap-2">
                           <MapPin className="h-4 w-4 text-primary" />
                           Default Meeting Point Details
                         </h4>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <label className="text-xs font-semibold text-gray-500 block">The Location Title</label>
                             <input 
                               placeholder="e.g. Tripbone Basecamp"
                               value={currentTitle}
                               onChange={e => {
                                 const newTitle = e.target.value;
                                 setFormData({
                                   ...formData,
                                   meetingPoint: currentLink ? `${newTitle}\n${currentLink}` : newTitle
                                 });
                               }}
                               className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all font-bold text-gray-800"
                             />
                           </div>
                           
                           <div className="space-y-2">
                             <label className="text-xs font-semibold text-gray-500 block">Google Maps Link</label>
                             <input 
                               placeholder="e.g. https://maps.app.goo.gl/nM2C85Qdv4BQ4BgE6"
                               value={currentLink}
                               onChange={e => {
                                 const newLink = e.target.value;
                                 setFormData({
                                   ...formData,
                                   meetingPoint: newLink ? `${currentTitle}\n${newLink}` : currentTitle
                                 });
                               }}
                               className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all font-bold text-gray-800"
                             />
                           </div>
                         </div>
                         <p className="text-xs text-gray-400">
                           This title and clickable map link will be displayed to customers when they select the self-arrival ("Own Transport") option on checkout and in confirmations.
                         </p>
                       </div>
                     );
                   })()}

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {globalTransports.map(t => {
                        const isSelected = formData.transportIds?.includes(t.id);
                        return (
                          <div 
                            key={t.id} 
                            onClick={() => {
                              const currentIds = formData.transportIds || [];
                              const newIds = isSelected 
                                ? currentIds.filter(id => id !== t.id)
                                : [...currentIds, t.id];
                              setFormData({ ...formData, transportIds: newIds });
                            }}
                            className={cn(
                              "p-6 rounded-[10px] border-2 transition-all cursor-pointer flex flex-col justify-between group",
                              isSelected ? "border-primary bg-orange-50/20" : "border-gray-100 bg-white hover:border-orange-200"
                            )}
                          >
                             <div className="flex items-center gap-3">
                                <div className={cn("h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all", isSelected ? "bg-primary border-primary" : "border-gray-200")}>
                                   {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                                </div>
                                <div>
                                   <p className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">{t.name}</p>
                                   <p className="text-xs font-black text-gray-400 uppercase tracking-wider block mt-0.5">Type: {t.type}</p>
                                   <p className="text-xs font-bold text-primary tracking-tight mt-1">
                                     {t.type === 'meet' ? 'Free' : `${formatPrice(t.price)} / ${t.priceType === 'per_person' ? 'person' : 'vehicle'}`}
                                   </p>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                      {globalTransports.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-[10px]">
                           No global transport options found. Please create them in the Global Transports Menu.
                        </div>
                      )}
                   </div>
                </div>
              )}

              {/* Important Info Tab */}
              {activeTab === 'info' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">Dynamic Info Sections</h3>
                      <p className="text-sm text-gray-500 font-medium">Add sections like "What to Bring", "Cancellation Policy", etc.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => addArrayItem('infoSections', { title: '', content: [] })}
                      className="bg-primary text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" /> Add Section
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {formData.infoSections?.map((section, sIdx) => (
                      <div key={sIdx} className="p-6 bg-gray-50 rounded-[15px] border border-gray-100 relative group">
                        <button 
                          type="button" 
                          onClick={() => removeArrayItem('infoSections', sIdx)}
                          className="absolute top-4 right-4 text-red-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Section Title</label>
                            <input 
                              placeholder="e.g. What to Bring"
                              value={section.title}
                              onChange={e => {
                                const newSections = [...(formData.infoSections || [])];
                                newSections[sIdx] = { ...newSections[sIdx], title: e.target.value };
                                setFormData({ ...formData, infoSections: newSections });
                              }}
                              className="w-full bg-white rounded-xl border-2 border-gray-100 p-4 text-lg font-black text-gray-900 focus:outline-none focus:border-primary transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Content (One item per line)</label>
                            <textarea 
                              rows={5}
                              placeholder="Point 1&#10;Point 2&#10;Point 3..."
                              value={Array.isArray(section.content) ? section.content.join('\n') : ''}
                              onChange={e => {
                                const newSections = [...(formData.infoSections || [])];
                                newSections[sIdx] = { ...newSections[sIdx], content: e.target.value.split('\n') };
                                setFormData({ ...formData, infoSections: newSections });
                              }}
                              className="w-full bg-white rounded-xl border-2 border-gray-100 p-4 text-sm font-medium focus:border-primary focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!formData.infoSections || formData.infoSections.length === 0) && (
                      <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-[20px]">
                        <ShieldAlert className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No info sections added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FAQ Tab */}
              {activeTab === 'faq' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Frequently Asked Questions</h3>
                    <button 
                      type="button" 
                      onClick={() => addArrayItem('faqs', { question: '', answer: '' })} 
                      className="text-xs font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-2"
                    >
                      <PlusCircle className="h-4 w-4" /> Add Question
                    </button>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 tracking-widest uppercase">Policy & Terms (Direct Content)</label>
                        <textarea 
                          rows={6}
                          placeholder="General policy and terms for this tour..."
                          value={formData.importantInfo || ''}
                          onChange={e => setFormData({ ...formData, importantInfo: e.target.value })}
                          className="w-full rounded-[10px] border-2 border-gray-100 p-4 text-sm font-medium focus:border-primary focus:outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-6">
                      {formData.faqs?.map((faq, fIdx) => (
                        <div key={fIdx} className="space-y-3 p-6 bg-gray-50 rounded-[15px] relative group border border-gray-100">
                          <button 
                            type="button" 
                            onClick={() => removeArrayItem('faqs', fIdx)}
                            className="absolute top-4 right-4 text-red-300 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question</label>
                            <input
                              placeholder="e.g. Is lunch included?"
                              value={faq.question}
                              onChange={e => {
                                const newFaqs = [...(formData.faqs || [])];
                                newFaqs[fIdx] = { ...faq, question: e.target.value };
                                setFormData({ ...formData, faqs: newFaqs });
                              }}
                              className="w-full font-bold text-gray-900 border-b-2 border-gray-200 bg-transparent py-2 focus:border-primary focus:outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detailed Answer</label>
                            <textarea
                              placeholder="Write the response here..."
                              rows={3}
                              value={faq.answer}
                              onChange={e => {
                                const newFaqs = [...(formData.faqs || [])];
                                newFaqs[fIdx] = { ...faq, answer: e.target.value };
                                setFormData({ ...formData, faqs: newFaqs });
                              }}
                              className="w-full text-sm font-medium text-gray-600 bg-white rounded-xl p-4 focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-sm"
                            />
                          </div>
                        </div>
                      ))}
                      {(!formData.faqs || formData.faqs.length === 0) && (
                        <div className="py-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                          No FAQs added for this tour yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="bg-orange-50/30 p-8 rounded-3xl border border-dashed border-orange-100 mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary border border-orange-50">
                        <Icons.Search className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Search Engine Optimization</h3>
                        <p className="text-gray-500 font-medium text-sm leading-relaxed">Customize how this tour appears on Google, Bing, and Social Media.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center justify-between">
                          Meta Title
                          <span className={cn("text-[9px] font-bold", (formData.seo?.title || '').length > 60 ? "text-amber-500" : "text-gray-300")}>
                            {(formData.seo?.title || '').length} / 60
                          </span>
                        </label>
                        <input 
                          value={formData.seo?.title || ''}
                          onChange={e => setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })}
                          className="w-full rounded-2xl border-2 border-gray-100 p-4 font-bold text-sm focus:border-primary focus:outline-none transition-all"
                          placeholder="Recommended: Max 60 characters"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center justify-between">
                          Meta Description
                          <span className={cn("text-[9px] font-bold", (formData.seo?.description || '').length > 160 ? "text-amber-500" : "text-gray-300")}>
                            {(formData.seo?.description || '').length} / 160
                          </span>
                        </label>
                        <textarea 
                          rows={4}
                          value={formData.seo?.description || ''}
                          onChange={e => setFormData({ ...formData, seo: { ...formData.seo, description: e.target.value } })}
                          className="w-full rounded-2xl border-2 border-gray-100 p-4 font-medium text-sm focus:border-primary focus:outline-none transition-all min-h-[120px]"
                          placeholder="Short summary for search results (Max 160 chars)"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Keywords</label>
                        <input 
                          value={formData.seo?.keywords || ''}
                          onChange={e => setFormData({ ...formData, seo: { ...formData.seo, keywords: e.target.value } })}
                          className="w-full rounded-2xl border-2 border-gray-100 p-4 font-bold text-sm focus:border-primary focus:outline-none transition-all"
                          placeholder="e.g. bali trekking, mount batur, sunrise tour"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">OG Image (Social Preview)</label>
                        <div className="flex gap-4 items-start">
                          <div className="w-32 aspect-video rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden relative group shrink-0">
                            {formData.seo?.ogImage ? (
                              <img 
                                src={formData.seo.ogImage} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                                alt="SEO Preview"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                <Icons.Image className="h-6 w-6 mb-1" />
                                <span className="text-[8px] font-black">No Preview</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <Icons.Upload className="h-5 w-5 text-white" />
                              <input 
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const url = await uploadImage(file);
                                      setFormData({ ...formData, seo: { ...formData.seo, ogImage: url } });
                                    } catch (err) {
                                      alert("Upload failed.");
                                    }
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Image URL (recommended 1200x630px)</p>
                            <input 
                              value={formData.seo?.ogImage || ''}
                              onChange={e => setFormData({ ...formData, seo: { ...formData.seo, ogImage: e.target.value } })}
                              placeholder="https://..."
                              className="w-full rounded-xl border border-gray-100 p-3 text-xs focus:border-primary focus:outline-none transition-all"
                            />
                            {formData.featuredImage && !formData.seo?.ogImage && (
                              <button 
                                type="button"
                                onClick={() => setFormData({ ...formData, seo: { ...formData.seo, ogImage: formData.featuredImage } })}
                                className="text-[9px] font-black text-primary uppercase hover:underline"
                              >
                                Use Featured Image as OG Image
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mt-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Google Search Preview</h4>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 text-[11px] text-gray-600">
                        <span>tripbone.com</span>
                        <span>›</span>
                        <span className="text-gray-400">tours</span>
                        <span>›</span>
                        <span className="text-gray-400">{formData.slug || 'tour-slug'}</span>
                      </div>
                      <h5 className="text-xl text-blue-800 hover:underline cursor-pointer font-medium leading-tight line-clamp-1">
                        {formData.seo?.title || formData.title || 'Tour Title – Tripbone'}
                      </h5>
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {formData.seo?.description || (highlightsText ? highlightsText.split('\n')[0] : 'Discover the beauty of Bali with this amazing tour experience...') }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="pt-8 border-t border-gray-100 flex justify-end gap-4">
                 <button
                  type="submit"
                  className="flex items-center gap-2 rounded-[10px] bg-primary px-12 py-4 font-black text-white transition-all hover:bg-orange-700 hover:shadow-2xl active:scale-95 shadow-lg shadow-orange-200"
                >
                  <Save className="h-5 w-5" />
                  {editingId ? 'UPDATE TOUR' : 'PUBLISH TOUR'}
                </button>
              </div>
            </form>
        </div>
        </div>
        </div>
  );
};

export default TourEditorForm;
