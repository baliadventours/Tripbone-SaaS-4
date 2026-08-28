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


const CouponManager = ({ items }: { items: Coupon[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<Partial<Coupon>>({ 
    code: '', 
    discountType: 'percentage', 
    discountValue: 0, 
    minBookingValue: 0, 
    isActive: true 
  });

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.code?.trim()) return;
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'coupons', editingItem.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        alert("Success: Coupon updated!");
      } else {
        await addDoc(collection(db, 'coupons'), { 
          ...formData,
          createdAt: serverTimestamp()
        });
        alert("Success: Coupon created!");
      }
      setFormData({ code: '', discountType: 'percentage', discountValue: 0, minBookingValue: 0, isActive: true });
      setIsAdding(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error saving Coupon", error);
      alert("Error: Failed to save Coupon.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete this Coupon?`)) {
      await deleteDoc(doc(db, 'coupons', id));
    }
  };

  const startEdit = (coupon: Coupon) => {
    setEditingItem(coupon);
    setFormData(coupon);
    setIsAdding(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Coupons</h2>
          <p className="text-gray-500 font-medium">Create and manage discount codes for your tours.</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingItem(null);
            setFormData({ code: '', discountType: 'percentage', discountValue: 0, minBookingValue: 0, isActive: true });
          }}
          className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-orange-200"
        >
          <Plus className="h-4 w-4" /> Add New Coupon
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-white p-8 rounded-[10px] border border-gray-100 space-y-6 motion-safe:animate-in motion-safe:slide-in-from-top-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">
              {editingItem ? `Editing Coupon: ${editingItem.code}` : 'Create New Coupon'}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Coupon Code</label>
              <input 
                required
                placeholder="e.g. SUMMER25"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Discount Type</label>
              <select 
                value={formData.discountType}
                onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none bg-white font-bold"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Discount Value</label>
              <input 
                required
                type="number"
                value={formData.discountValue}
                onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Min. Booking ($)</label>
              <input 
                required
                type="number"
                value={formData.minBookingValue}
                onChange={e => setFormData({ ...formData, minBookingValue: Number(e.target.value) })}
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-gray-50">
             <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 font-bold px-4">Cancel</button>
             <button type="submit" className="bg-primary text-white px-10 py-4 rounded-[10px] font-bold text-sm tracking-wide shadow-xl active:scale-95 transition-all">Create Coupon</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-[10px] border border-gray-100 shadow-sm flex flex-col gap-4 group hover:border-primary transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center text-primary">
                  <Tag className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-bold text-gray-900 text-lg tracking-tight block">{item.code}</span>
                  <span className="text-sm font-semibold text-primary">
                    {item.discountType === 'percentage' ? `${item.discountValue}% Off` : `$${item.discountValue} Off`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => startEdit(item)}
                  className="p-2 text-gray-400 hover:text-primary transition-colors bg-gray-50 rounded-lg"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors bg-gray-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Min. Spend: ${item.minBookingValue}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export { CouponManager };
export default CouponManager;
