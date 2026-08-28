import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Users, 
  Briefcase, 
  Fuel, 
  DollarSign, 
  ShieldCheck, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  Image as ImageIcon,
  Key,
  UserCheck,
  UploadCloud,
  FolderOpen,
  Star,
  CheckCircle2,
  Link as LinkIcon
} from 'lucide-react';
import { RentalVehicle, RentalCategory, RentalTransmission, RentalFuelType } from '../../../types';
import { getRentalVehicles, saveRentalVehicle, deleteRentalVehicle, DEFAULT_RENTAL_FLEET } from '../../../lib/carRentalService';
import { useTenant } from '../../../lib/TenantContext';
import { useSettings } from '../../../lib/SettingsContext';
import { uploadImage } from '../../../lib/imgbb';
import FormattedPrice from '../../FormattedPrice';
import SmartImage from '../../SmartImage';
import { cn } from '../../../lib/utils';

interface FleetManagerProps {
  openMediaGallery?: (callback: (urls: string[]) => void, multiSelect?: boolean) => Promise<void>;
}

export default function FleetManager({ openMediaGallery }: FleetManagerProps = {}) {
  const { tenantId } = useTenant();
  const { settings } = useSettings();
  
  const [vehicles, setVehicles] = useState<RentalVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState<Partial<RentalVehicle> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'features'>('info');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Photo upload states
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFleet();
  }, [tenantId]);

  const loadFleet = async () => {
    try {
      setLoading(true);
      const data = await getRentalVehicles(tenantId);
      setVehicles(data);
    } catch (err) {
      console.error('Error loading fleet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0 || !editingVehicle) return;

    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      alert('Please select valid image files (JPG, PNG, WebP, etc.).');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setUploadStatusText(`Optimizing & uploading ${fileList.length} photo${fileList.length > 1 ? 's' : ''}...`);

      const uploadedUrls: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadStatusText(`Uploading photo ${i + 1} of ${fileList.length} (${file.name})...`);
        const url = await uploadImage(file);
        if (url) {
          uploadedUrls.push(url);
        }
      }

      if (uploadedUrls.length > 0) {
        const currentImages = editingVehicle.images || [];
        const updatedImages = Array.from(new Set([...currentImages, ...uploadedUrls]));
        const currentFeatured = editingVehicle.featuredImage;
        const newFeatured = !currentFeatured || currentFeatured.includes('unsplash.com/photo-1549399542') 
          ? uploadedUrls[0] 
          : currentFeatured;

        setEditingVehicle({
          ...editingVehicle,
          featuredImage: newFeatured,
          images: updatedImages,
        });
      }
    } catch (error: any) {
      console.error('Failed to upload vehicle photos:', error);
      alert(`Photo upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploadingPhoto(false);
      setUploadStatusText('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetFeaturedPhoto = (url: string) => {
    if (!editingVehicle) return;
    setEditingVehicle({
      ...editingVehicle,
      featuredImage: url,
    });
  };

  const handleRemovePhoto = (url: string) => {
    if (!editingVehicle) return;
    const currentImages = (editingVehicle.images || []).filter(img => img !== url);
    let newFeatured = editingVehicle.featuredImage;
    if (newFeatured === url) {
      newFeatured = currentImages.length > 0 ? currentImages[0] : '';
    }
    setEditingVehicle({
      ...editingVehicle,
      featuredImage: newFeatured,
      images: currentImages,
    });
  };

  const handleOpenAdd = () => {
    setEditingVehicle({
      name: '',
      model: '',
      brand: 'Toyota',
      category: 'standard_mpv',
      passengerCapacity: 6,
      luggageCapacity: 4,
      doors: 5,
      transmission: 'automatic',
      fuelType: 'petrol',
      hasAC: true,
      year: new Date().getFullYear(),
      licensePlate: '',
      status: 'available',
      featuredImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
      images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80'],
      description: 'Clean, modern, and comfortable vehicle for exploring Bali.',
      features: ['Air Conditioning', 'Bluetooth Audio', 'Clean Sanitized Cabin', 'Comprehensive Insurance'],
      inclusions: ['Clean Vehicle', '24/7 Roadside Assistance'],
      exclusions: ['Toll & Parking Fees'],
      pricing: {
        withDriver: {
          enabled: true,
          halfDayPrice: 35,
          fullDayPrice: 48,
          hourlyPrice: 10,
          overtimePricePerHour: 5,
        },
        selfDrive: {
          enabled: true,
          dailyPrice: 25,
          depositRequired: 50,
          minimumDays: 1,
        },
      },
      rating: 5.0,
      reviewsCount: 1,
      isPopular: false,
      sortOrder: vehicles.length + 1,
    });
    setActiveTab('info');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: RentalVehicle) => {
    setEditingVehicle({ ...v });
    setActiveTab('info');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle from the fleet?')) return;
    try {
      await deleteRentalVehicle(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
      showToast('Vehicle deleted successfully.', 'success');
    } catch (err: any) {
      console.error('Failed to delete vehicle:', err);
      showToast(`Failed to delete vehicle: ${err?.message || 'Permission denied'}`, 'error');
    }
  };

  const handleToggleStatus = async (v: RentalVehicle) => {
    const newStatus = v.status === 'available' ? 'hidden' : 'available';
    try {
      await saveRentalVehicle({ ...v, status: newStatus }, tenantId);
      setVehicles(prev => prev.map(item => item.id === v.id ? { ...item, status: newStatus } : item));
      showToast(`Vehicle is now ${newStatus === 'available' ? 'visible & available' : 'hidden'}.`, 'success');
    } catch (err: any) {
      console.error('Failed to update status:', err);
      showToast(`Failed to update status: ${err?.message || 'Error occurred'}`, 'error');
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle || !editingVehicle.name) {
      alert('Please enter vehicle name.');
      return;
    }

    try {
      setIsSaving(true);
      const savedId = await saveRentalVehicle(editingVehicle, tenantId);
      await loadFleet();
      setIsModalOpen(false);
      setEditingVehicle(null);
      showToast('Vehicle saved to fleet successfully!', 'success');
    } catch (err: any) {
      console.error('Failed to save vehicle:', err);
      showToast(`Failed to save vehicle: ${err?.message || 'Check permissions or internet connection'}`, 'error');
      alert(`Error saving vehicle: ${err?.message || 'Failed to save to database. Please check permissions.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left relative">
      {/* Toast Alert */}
      {toast && (
        <div 
          className={cn(
            "fixed top-6 right-6 z-[999] px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-200 border",
            toast.type === 'success' ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
          )}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider mb-2">
            <Car className="w-3.5 h-3.5" />
            <span>Vehicle Fleet Management</span>
          </div>
          <h2 className="text-xl font-black text-gray-900">
            Car Rental & Chauffeur Fleet
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure vehicle specs, capacity, photos, chauffeur rates, and self-drive pricing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-5 py-3 rounded-2xl bg-primary hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-primary/20 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Fleet Table / Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-150">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-bold">Loading vehicle fleet...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-150">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-black text-gray-900">No vehicles in fleet yet</h3>
          <p className="text-xs text-gray-500 mt-1 mb-4">Click below to add your first rental vehicle.</p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-6 py-2.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-wider"
          >
            + Add Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="relative aspect-[16/10] bg-gray-100">
                  <SmartImage
                    src={v.featuredImage}
                    alt={v.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-black/75 text-white text-[10px] font-black uppercase">
                      {v.category.replace('_', ' ')}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      v.status === 'available' ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                    )}>
                      {v.status}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-black text-base text-gray-900">{v.name}</h3>
                    <p className="text-xs text-gray-500">{v.brand} • {v.model}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100 text-xs font-bold text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span>{v.passengerCapacity}p</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      <span>{v.luggageCapacity}b</span>
                    </div>
                    <div className="flex items-center gap-1 capitalize">
                      <Fuel className="w-3.5 h-3.5 text-gray-400" />
                      <span>{v.transmission}</span>
                    </div>
                  </div>

                  {/* Pricing Overview */}
                  <div className="space-y-1.5 text-xs bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    {v.pricing.withDriver?.enabled && (
                      <div className="flex items-center justify-between font-bold text-gray-800">
                        <span className="flex items-center gap-1 text-[11px] text-gray-500">
                          <UserCheck className="w-3 h-3 text-primary" /> With Driver (10h):
                        </span>
                        <span className="text-primary font-black">
                          ${v.pricing.withDriver.fullDayPrice || 48}
                        </span>
                      </div>
                    )}

                    {v.pricing.selfDrive?.enabled && (
                      <div className="flex items-center justify-between font-bold text-gray-800">
                        <span className="flex items-center gap-1 text-[11px] text-gray-500">
                          <Key className="w-3 h-3 text-primary" /> Self-Drive (24h):
                        </span>
                        <span className="text-gray-900 font-black">
                          ${v.pricing.selfDrive.dailyPrice || 25}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-5 pt-0 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(v)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition"
                  title={v.status === 'available' ? 'Hide Vehicle' : 'Make Available'}
                >
                  {v.status === 'available' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(v)}
                    className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(v.id)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition"
                    title="Delete Vehicle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    {editingVehicle.id ? `Edit ${editingVehicle.name}` : 'Add New Fleet Vehicle'}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Configure specifications, chauffeur pricing, and self-drive options.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={cn(
                  "py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition",
                  activeTab === 'info' ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"
                )}
              >
                1. Vehicle Specs & Photos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pricing')}
                className={cn(
                  "py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition",
                  activeTab === 'pricing' ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"
                )}
              >
                2. Pricing Matrix (Driver & Self-Drive)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('features')}
                className={cn(
                  "py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition",
                  activeTab === 'features' ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"
                )}
              >
                3. Features & Inclusions
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveVehicle} className="overflow-y-auto flex-1 p-6 space-y-6">
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Toyota Avanza Standard MPV"
                        value={editingVehicle.name || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                      <select
                        value={editingVehicle.category || 'standard_mpv'}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="economy">Economy / City Compact</option>
                        <option value="standard_mpv">Standard Family MPV</option>
                        <option value="executive">Executive & Hybrid</option>
                        <option value="luxury_vip">Luxury VIP</option>
                        <option value="minibus">Minibus (10-16 seats)</option>
                        <option value="suv">SUV</option>
                        <option value="van">Van</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Brand</label>
                      <input
                        type="text"
                        placeholder="e.g. Toyota, Honda"
                        value={editingVehicle.brand || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, brand: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Model / Trim</label>
                      <input
                        type="text"
                        placeholder="e.g. Avanza 1.5 Veloz"
                        value={editingVehicle.model || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Year</label>
                      <input
                        type="number"
                        value={editingVehicle.year || 2024}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, year: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Capacities */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Passengers</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={editingVehicle.passengerCapacity || 5}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, passengerCapacity: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Luggage Bags</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={editingVehicle.luggageCapacity || 3}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, luggageCapacity: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Transmission</label>
                      <select
                        value={editingVehicle.transmission || 'automatic'}
                        onChange={(e: any) => setEditingVehicle({ ...editingVehicle, transmission: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                      >
                        <option value="automatic">Automatic</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Fuel Type</label>
                      <select
                        value={editingVehicle.fuelType || 'petrol'}
                        onChange={(e: any) => setEditingVehicle({ ...editingVehicle, fuelType: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                      >
                        <option value="petrol">Petrol / Gasoline</option>
                        <option value="diesel">Diesel</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="electric">Electric (EV)</option>
                      </select>
                    </div>
                  </div>

                  {/* Vehicle Photos Upload & Gallery Manager */}
                  <div className="space-y-3 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="block text-xs font-black text-gray-900">
                          Vehicle Photos & Visual Gallery *
                        </label>
                        <p className="text-[11px] text-gray-500 font-medium">
                          Upload high-resolution vehicle photos. Files are automatically compressed and converted to WebP for lightning-fast loading.
                        </p>
                      </div>

                      {openMediaGallery && (
                        <button
                          type="button"
                          onClick={() => {
                            openMediaGallery((urls) => {
                              if (urls && urls.length > 0) {
                                const currentImages = editingVehicle.images || [];
                                const updatedImages = Array.from(new Set([...currentImages, ...urls]));
                                const currentFeatured = editingVehicle.featuredImage;
                                const newFeatured = !currentFeatured || currentFeatured.includes('unsplash.com/photo-1549399542')
                                  ? urls[0]
                                  : currentFeatured;
                                setEditingVehicle({
                                  ...editingVehicle,
                                  featuredImage: newFeatured,
                                  images: updatedImages,
                                });
                              }
                            }, true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold transition shadow-xs shrink-0 self-start sm:self-auto"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-primary" />
                          <span>Select from Media Gallery</span>
                        </button>
                      )}
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/svg+xml"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleUploadFiles(e.target.files);
                        }
                      }}
                      className="hidden"
                    />

                    {/* Upload Dropzone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(false);
                        if (e.dataTransfer.files) {
                          handleUploadFiles(e.dataTransfer.files);
                        }
                      }}
                      onClick={() => {
                        if (!isUploadingPhoto && fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                      className={cn(
                        "relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3",
                        isDraggingOver 
                          ? "border-primary bg-primary/5 scale-[1.01]" 
                          : "border-gray-300 hover:border-primary hover:bg-white bg-white/50",
                        isUploadingPhoto && "pointer-events-none opacity-80"
                      )}
                    >
                      {isUploadingPhoto ? (
                        <div className="py-4 flex flex-col items-center gap-2.5">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <p className="text-xs font-bold text-gray-800 animate-pulse">
                            {uploadStatusText || 'Converting to WebP & Uploading...'}
                          </p>
                          <span className="text-[10px] text-gray-400 font-medium">Please keep this window open</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-primary flex items-center justify-center shadow-xs">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-gray-900 hover:text-primary transition-colors block">
                              Click to upload vehicle photo or drag & drop here
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                              Supports JPG, PNG, WebP (multi-photo upload supported)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              ✓ Auto WebP Compression
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                              ✓ Instant Cloud Storage
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Uploaded Photos Gallery Preview & Management */}
                    {(editingVehicle.images && editingVehicle.images.length > 0) || editingVehicle.featuredImage ? (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                          <span>
                            Current Photos ({Array.from(new Set([...(editingVehicle.images || []), ...(editingVehicle.featuredImage ? [editingVehicle.featuredImage] : [])])).length})
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Click star icon to change main cover photo
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {Array.from(new Set([...(editingVehicle.images || []), ...(editingVehicle.featuredImage ? [editingVehicle.featuredImage] : [])])).map((imgUrl, idx) => {
                            const isFeatured = editingVehicle.featuredImage === imgUrl;
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "group relative aspect-[16/11] rounded-xl overflow-hidden border-2 bg-gray-100 shadow-xs transition-all",
                                  isFeatured ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-gray-200 hover:border-gray-300"
                                )}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Vehicle Photo ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />

                                {/* Badge */}
                                {isFeatured ? (
                                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-primary text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                                    <Star className="w-2.5 h-2.5 fill-white" />
                                    <span>Main Cover</span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetFeaturedPhoto(imgUrl)}
                                    className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 hover:bg-primary text-white text-[9px] font-bold uppercase transition opacity-0 group-hover:opacity-100 flex items-center gap-1 backdrop-blur-xs"
                                    title="Set as Main Cover Photo"
                                  >
                                    <Star className="w-2.5 h-2.5" />
                                    <span>Set Main</span>
                                  </button>
                                )}

                                {/* Delete Photo */}
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(imgUrl)}
                                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-red-600/90 hover:bg-red-700 text-white transition opacity-0 group-hover:opacity-100 shadow-xs"
                                  title="Delete photo"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* Optional URL input toggle */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowManualUrl(!showManualUrl)}
                        className="text-[11px] font-bold text-gray-500 hover:text-gray-800 inline-flex items-center gap-1 transition"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>{showManualUrl ? 'Hide manual image URL option' : 'Or enter image URL manually (optional)'}</span>
                      </button>

                      {showManualUrl && (
                        <div className="mt-2 space-y-2 bg-white p-3 rounded-xl border border-gray-200">
                          <label className="block text-[10px] font-bold text-gray-600">Manual Featured Image URL</label>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={editingVehicle.featuredImage || ''}
                            onChange={(e) => setEditingVehicle({ ...editingVehicle, featuredImage: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Description</label>
                    <textarea
                      rows={3}
                      placeholder="Write brief description highlighting comfort, cabin cleanliness, etc."
                      value={editingVehicle.description || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  {/* With Driver Matrix */}
                  <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-primary" />
                        <span className="font-black text-sm text-gray-900">Option 1: With Private Driver & Fuel</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingVehicle.pricing?.withDriver?.enabled ?? true}
                          onChange={(e) => {
                            const cur = editingVehicle.pricing || {};
                            setEditingVehicle({
                              ...editingVehicle,
                              pricing: {
                                ...cur,
                                withDriver: {
                                  ...(cur.withDriver || { halfDayPrice: 35, fullDayPrice: 48, hourlyPrice: 10, overtimePricePerHour: 5 }),
                                  enabled: e.target.checked,
                                },
                              },
                            });
                          }}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-xs font-bold text-gray-700">Enable Chauffeur Charter</span>
                      </label>
                    </div>

                    {editingVehicle.pricing?.withDriver?.enabled && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Full-Day (10-12h) Rate ($)</label>
                          <input
                            type="number"
                            value={editingVehicle.pricing?.withDriver?.fullDayPrice || 48}
                            onChange={(e) => {
                              const cur = editingVehicle.pricing || {};
                              setEditingVehicle({
                                ...editingVehicle,
                                pricing: {
                                  ...cur,
                                  withDriver: { ...(cur.withDriver || { enabled: true }), fullDayPrice: Number(e.target.value) },
                                },
                              });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Half-Day (4-6h) Rate ($)</label>
                          <input
                            type="number"
                            value={editingVehicle.pricing?.withDriver?.halfDayPrice || 35}
                            onChange={(e) => {
                              const cur = editingVehicle.pricing || {};
                              setEditingVehicle({
                                ...editingVehicle,
                                pricing: {
                                  ...cur,
                                  withDriver: { ...(cur.withDriver || { enabled: true }), halfDayPrice: Number(e.target.value) },
                                },
                              });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Hourly Rate ($/hr)</label>
                          <input
                            type="number"
                            value={editingVehicle.pricing?.withDriver?.hourlyPrice || 10}
                            onChange={(e) => {
                              const cur = editingVehicle.pricing || {};
                              setEditingVehicle({
                                ...editingVehicle,
                                pricing: {
                                  ...cur,
                                  withDriver: { ...(cur.withDriver || { enabled: true }), hourlyPrice: Number(e.target.value) },
                                },
                              });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Overtime ($/hr)</label>
                          <input
                            type="number"
                            value={editingVehicle.pricing?.withDriver?.overtimePricePerHour || 5}
                            onChange={(e) => {
                              const cur = editingVehicle.pricing || {};
                              setEditingVehicle({
                                ...editingVehicle,
                                pricing: {
                                  ...cur,
                                  withDriver: { ...(cur.withDriver || { enabled: true }), overtimePricePerHour: Number(e.target.value) },
                                },
                              });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Self-Drive Matrix */}
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-gray-800" />
                        <span className="font-black text-sm text-gray-900">Option 2: Self-Drive (Car Only)</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingVehicle.pricing?.selfDrive?.enabled ?? true}
                          onChange={(e) => {
                            const cur = editingVehicle.pricing || {};
                            setEditingVehicle({
                              ...editingVehicle,
                              pricing: {
                                ...cur,
                                selfDrive: {
                                  ...(cur.selfDrive || { dailyPrice: 25, depositRequired: 50, minimumDays: 1 }),
                                  enabled: e.target.checked,
                                },
                              },
                            });
                          }}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-xs font-bold text-gray-700">Enable Self-Drive</span>
                      </label>
                    </div>

                    {editingVehicle.pricing?.selfDrive?.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Daily 24h Rate ($)</label>
                          <input
                            type="number"
                            value={editingVehicle.pricing?.selfDrive?.dailyPrice || 25}
                            onChange={(e) => {
                              const cur = editingVehicle.pricing || {};
                              setEditingVehicle({
                                ...editingVehicle,
                                pricing: {
                                  ...cur,
                                  selfDrive: { ...(cur.selfDrive || { enabled: true }), dailyPrice: Number(e.target.value) },
                                },
                              });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Refundable Deposit ($)</label>
                          <input
                            type="number"
                            value={editingVehicle.pricing?.selfDrive?.depositRequired || 50}
                            onChange={(e) => {
                              const cur = editingVehicle.pricing || {};
                              setEditingVehicle({
                                ...editingVehicle,
                                pricing: {
                                  ...cur,
                                  selfDrive: { ...(cur.selfDrive || { enabled: true }), depositRequired: Number(e.target.value) },
                                },
                              });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Minimum Days</label>
                          <input
                            type="number"
                            min="1"
                            value={editingVehicle.pricing?.selfDrive?.minimumDays || 1}
                            onChange={(e) => {
                              const cur = editingVehicle.pricing || {};
                              setEditingVehicle({
                                ...editingVehicle,
                                pricing: {
                                  ...cur,
                                  selfDrive: { ...(cur.selfDrive || { enabled: true }), minimumDays: Number(e.target.value) },
                                },
                              });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Features List (comma-separated)
                    </label>
                    <textarea
                      rows={2}
                      value={(editingVehicle.features || []).join(', ')}
                      onChange={(e) => setEditingVehicle({
                        ...editingVehicle,
                        features: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                      })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                      placeholder="Air Conditioning, Bluetooth Audio, USB Charger, Sanitized"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Inclusions (comma-separated)
                    </label>
                    <textarea
                      rows={2}
                      value={(editingVehicle.inclusions || []).join(', ')}
                      onChange={(e) => setEditingVehicle({
                        ...editingVehicle,
                        inclusions: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                      })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                      placeholder="English-speaking Driver, Fuel for Itinerary, Free 24h Cancellation"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Exclusions (comma-separated)
                    </label>
                    <textarea
                      rows={2}
                      value={(editingVehicle.exclusions || []).join(', ')}
                      onChange={(e) => setEditingVehicle({
                        ...editingVehicle,
                        exclusions: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                      })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900"
                      placeholder="Toll and parking fees, Driver overtime past 10 hours"
                    />
                  </div>
                </div>
              )}

              {/* Bottom Footer Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-orange-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Vehicle</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
