import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp } from '../../lib/firebase';
import { UserProfile, StaffPermissions, DEFAULT_STAFF_PERMISSIONS } from '../../types';
import { 
  Users, UserPlus, Shield, UserCheck, Truck, Building2, Search, Filter, 
  Edit3, Trash2, CheckCircle2, XCircle, AlertCircle, RefreshCw, Mail, Phone,
  Globe, Percent, Key, Save, X, Eye, BadgeCheck, MoreVertical, Sliders, CheckSquare,
  ShieldCheck, Lock, Unlock, Zap, HelpCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getActiveTenantId } from '../../lib/firebase';

interface UserManagerProps {
  users?: UserProfile[];
  setUsers?: any;
  currentUserProfile?: UserProfile | null;
  onDeleteUser?: (u: UserProfile) => void;
  setActiveMenu?: (m: any) => void;
  roleFilter?: string;
  allTours?: any[];
  resetForm?: () => void;
  setFormData?: (f: any) => void;
  formData?: any;
  initialOpenCreate?: boolean;
}

export default function UserManager({ users = [], setUsers, currentUserProfile, initialOpenCreate = false }: UserManagerProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff' | 'supplier' | 'agent' | 'customer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialOpenCreate);

  useEffect(() => {
    if (initialOpenCreate) {
      handleOpenCreateModal();
    }
  }, [initialOpenCreate]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dedicated Permissions Matrix Modal
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [permissionTargetUser, setPermissionTargetUser] = useState<UserProfile | null>(null);
  const [userPermissionsState, setUserPermissionsState] = useState<StaffPermissions>(DEFAULT_STAFF_PERMISSIONS);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    role: 'staff' as 'superadmin' | 'admin' | 'staff' | 'supplier' | 'agent' | 'customer',
    status: 'active' as 'active' | 'pending' | 'suspended',
    permissions: DEFAULT_STAFF_PERMISSIONS as StaffPermissions,
    companyName: '',
    publicEmail: '',
    taxId: '',
    website: '',
    commissionRate: 15, // For suppliers
    discountRate: 10,  // For agents
    bio: '',
    country: 'Indonesia',
    initialPassword: ''
  });

  const activeTenantId = getActiveTenantId();

  useEffect(() => {
    fetchUsers();
  }, [activeTenantId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let q;
      if (activeTenantId) {
        q = query(collection(db, 'users'), where('tenantId', '==', activeTenantId));
      } else {
        q = query(collection(db, 'users'));
      }
      const snap = await getDocs(q);
      const list = snap.docs.map(docSnap => ({
        uid: docSnap.id,
        ...docSnap.data()
      })) as UserProfile[];
      setUsers(list);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setFormData({
      displayName: '',
      email: '',
      phoneNumber: '',
      role: 'staff',
      status: 'active',
      permissions: { ...DEFAULT_STAFF_PERMISSIONS },
      companyName: '',
      publicEmail: '',
      taxId: '',
      website: '',
      commissionRate: 15,
      discountRate: 10,
      bio: '',
      country: 'Indonesia',
      initialPassword: 'TempPassword123!'
    });
    setEditingUser(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      displayName: user.displayName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role || 'staff',
      status: user.status || 'active',
      permissions: { ...DEFAULT_STAFF_PERMISSIONS, ...(user.permissions || {}) },
      companyName: user.companyName || '',
      publicEmail: user.publicEmail || user.email || '',
      taxId: user.taxId || '',
      website: user.website || '',
      commissionRate: user.commissionRate ?? 15,
      discountRate: user.discountRate ?? 10,
      bio: user.bio || '',
      country: user.country || 'Indonesia',
      initialPassword: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenPermissionsModal = (user: UserProfile) => {
    setPermissionTargetUser(user);
    const existing = { ...DEFAULT_STAFF_PERMISSIONS, ...(user.permissions || {}) };
    setUserPermissionsState(existing);
    setIsPermissionsModalOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!permissionTargetUser) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', permissionTargetUser.uid);
      await updateDoc(userRef, {
        permissions: userPermissionsState,
        updatedAt: serverTimestamp()
      });

      setUsers((prev: UserProfile[]) => prev.map(u => 
        u.uid === permissionTargetUser.uid 
          ? { ...u, permissions: userPermissionsState }
          : u
      ));

      showNotification('success', `Permissions updated for ${permissionTargetUser.displayName || permissionTargetUser.email}.`);
      setIsPermissionsModalOpen(false);
      setPermissionTargetUser(null);
    } catch (err: any) {
      console.error("Save permissions error:", err);
      showNotification('error', err.message || 'Failed to update user permissions.');
    } finally {
      setLoading(false);
    }
  };

  const applyPermissionPreset = (preset: 'operations' | 'coordinator' | 'support' | 'full') => {
    switch (preset) {
      case 'operations':
        setUserPermissionsState({
          bookings: true,
          canCreateBookings: true,
          canEditBookings: true,
          canAssignGuides: true,
          canDeleteBookings: false,
          tours: true,
          canEditTours: false,
          carRental: true,
          inquiries: true,
          tickets: true,
          guides: true,
          reviews: true,
          analytics: false,
          coupons: false,
          marketing: false,
          websiteBuilder: false,
          finance: false,
          settings: false,
          userManagement: false
        });
        break;
      case 'coordinator':
        setUserPermissionsState({
          bookings: true,
          canCreateBookings: true,
          canEditBookings: true,
          canAssignGuides: true,
          canDeleteBookings: false,
          tours: true,
          canEditTours: true,
          carRental: true,
          inquiries: false,
          tickets: false,
          guides: true,
          reviews: true,
          analytics: false,
          coupons: false,
          marketing: false,
          websiteBuilder: false,
          finance: false,
          settings: false,
          userManagement: false
        });
        break;
      case 'support':
        setUserPermissionsState({
          bookings: true,
          canCreateBookings: false,
          canEditBookings: false,
          canAssignGuides: false,
          canDeleteBookings: false,
          tours: true,
          canEditTours: false,
          carRental: false,
          inquiries: true,
          tickets: true,
          guides: false,
          reviews: true,
          analytics: false,
          coupons: false,
          marketing: false,
          websiteBuilder: false,
          finance: false,
          settings: false,
          userManagement: false
        });
        break;
      case 'full':
        setUserPermissionsState({
          bookings: true,
          canCreateBookings: true,
          canEditBookings: true,
          canAssignGuides: true,
          canDeleteBookings: true,
          tours: true,
          canEditTours: true,
          carRental: true,
          inquiries: true,
          tickets: true,
          guides: true,
          reviews: true,
          analytics: true,
          coupons: true,
          marketing: true,
          websiteBuilder: true,
          finance: true,
          settings: false,
          userManagement: false
        });
        break;
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName || !formData.email) {
      showNotification('error', 'Name and Email are required fields.');
      return;
    }

    setLoading(true);
    try {
      if (editingUser) {
        // Update existing user document
        const userRef = doc(db, 'users', editingUser.uid);
        const updates: Partial<UserProfile> & { updatedAt: any } = {
          displayName: formData.displayName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: formData.role,
          status: formData.status,
          ...(formData.role === 'staff' && { permissions: formData.permissions }),
          companyName: formData.companyName,
          publicEmail: formData.publicEmail,
          taxId: formData.taxId,
          website: formData.website,
          commissionRate: Number(formData.commissionRate),
          discountRate: Number(formData.discountRate),
          bio: formData.bio,
          country: formData.country,
          updatedAt: serverTimestamp()
        };

        await updateDoc(userRef, updates);

        setUsers((prev: UserProfile[]) => prev.map(u => u.uid === editingUser.uid ? { ...u, ...updates } : u));
        showNotification('success', `User ${formData.displayName} updated successfully.`);
      } else {
        // Check if a user with this email already exists in Firestore (e.g. signed up previously as customer)
        const emailLower = formData.email.trim().toLowerCase();
        let targetUid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        let existingUserFound = false;

        try {
          const q = query(collection(db, 'users'), where('email', '==', formData.email.trim()));
          const existingSnap = await getDocs(q);
          if (!existingSnap.empty) {
            targetUid = existingSnap.docs[0].id;
            existingUserFound = true;
          }
        } catch (searchErr) {
          console.warn("Could not check existing email before user create:", searchErr);
        }

        const newUser: UserProfile & { tenantId?: string; createdAt?: any; updatedAt: any } = {
          uid: targetUid,
          displayName: formData.displayName,
          email: formData.email.trim(),
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.displayName)}`,
          phoneNumber: formData.phoneNumber,
          role: formData.role,
          status: formData.status,
          ...(formData.role === 'staff' && { permissions: formData.permissions }),
          companyName: formData.companyName,
          publicEmail: formData.publicEmail,
          taxId: formData.taxId,
          website: formData.website,
          commissionRate: Number(formData.commissionRate),
          discountRate: Number(formData.discountRate),
          bio: formData.bio,
          country: formData.country,
          tenantId: activeTenantId || undefined,
          updatedAt: serverTimestamp(),
          ...(!existingUserFound && { createdAt: serverTimestamp() })
        };

        await setDoc(doc(db, 'users', targetUid), newUser, { merge: true });
        setUsers((prev: UserProfile[]) => {
          const filtered = prev.filter(u => u.uid !== targetUid && u.email?.toLowerCase() !== emailLower);
          return [newUser as UserProfile, ...filtered];
        });
        showNotification('success', `User ${formData.displayName} (${formData.role.toUpperCase()}) saved successfully.`);
      }

      setIsCreateModalOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      console.error("Save user error:", err);
      showNotification('error', err.message || 'Failed to save user record.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', user.uid), { status: nextStatus, updatedAt: serverTimestamp() });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, status: nextStatus } : u));
      showNotification('success', `${user.displayName}'s status updated to ${nextStatus.toUpperCase()}.`);
    } catch (err: any) {
      showNotification('error', 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'users', deleteConfirmUser.uid));
      setUsers(prev => prev.filter(u => u.uid !== deleteConfirmUser.uid));
      showNotification('success', `User ${deleteConfirmUser.displayName} deleted successfully.`);
      setDeleteConfirmUser(null);
    } catch (err: any) {
      showNotification('error', 'Failed to delete user record.');
    } finally {
      setLoading(false);
    }
  };

  // Filter users list
  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.companyName?.toLowerCase().includes(q) ||
      u.phoneNumber?.toLowerCase().includes(q);
    return matchesRole && matchesStatus && matchesSearch;
  });

  // Role metrics
  const counts = {
    all: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    staff: users.filter(u => u.role === 'staff').length,
    supplier: users.filter(u => u.role === 'supplier').length,
    agent: users.filter(u => u.role === 'agent').length,
    customer: users.filter(u => u.role === 'customer').length
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200"><Shield className="w-3 h-3" /> Admin</span>;
      case 'staff':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200"><UserCheck className="w-3 h-3" /> Staff</span>;
      case 'supplier':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200"><Truck className="w-3 h-3" /> Supplier</span>;
      case 'agent':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200"><Building2 className="w-3 h-3" /> Agent</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200"><Users className="w-3 h-3" /> Customer</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" /> User Management
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Manage system users, grant roles (Admin, Staff, Supplier, Agent), and configure commission/discount structures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-3 bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all border border-gray-200"
            title="Refresh Users"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
          >
            <UserPlus className="w-4 h-4" /> Add New User
          </button>
        </div>
      </div>

      {/* Action Message Alert */}
      {actionMessage && (
        <div className={cn(
          "p-4 rounded-xl border text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
          actionMessage.type === 'success' ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
        )}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Role Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: 'all', label: 'All Users', count: counts.all, icon: Users, color: 'text-gray-900 bg-gray-50 border-gray-200' },
          { key: 'admin', label: 'Administrators', count: counts.admin, icon: Shield, color: 'text-rose-700 bg-rose-50/50 border-rose-200' },
          { key: 'staff', label: 'Staff Team', count: counts.staff, icon: UserCheck, color: 'text-indigo-700 bg-indigo-50/50 border-indigo-200' },
          { key: 'supplier', label: 'Suppliers', count: counts.supplier, icon: Truck, color: 'text-amber-700 bg-amber-50/50 border-amber-200' },
          { key: 'agent', label: 'Agents', count: counts.agent, icon: Building2, color: 'text-emerald-700 bg-emerald-50/50 border-emerald-200' },
          { key: 'customer', label: 'Customers', count: counts.customer, icon: Users, color: 'text-blue-700 bg-blue-50/50 border-blue-200' },
        ].map((item) => {
          const IconComp = item.icon;
          const isSelected = roleFilter === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setRoleFilter(item.key as any)}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between",
                item.color,
                isSelected ? "ring-2 ring-primary shadow-md bg-white scale-[1.02]" : "hover:border-gray-300 opacity-90 hover:opacity-100"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">{item.label}</span>
                <IconComp className="w-4 h-4 opacity-40" />
              </div>
              <p className="text-2xl font-black mt-2">{item.count}</p>
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, company, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <span className="text-[10px] font-bold text-gray-400 pl-2 uppercase">Status:</span>
            {(['all', 'active', 'pending', 'suspended'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all",
                  statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="p-4 pl-6">User Profile</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Role Specific details</th>
                <th className="p-4">Contact</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-bold">No users match your criteria.</p>
                    <p className="text-[11px] text-gray-400 mt-1">Try clearing filters or search terms.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                    {/* User Identity */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.displayName || user.email)}`}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full border border-gray-200 object-cover bg-gray-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate flex items-center gap-1.5">
                            {user.displayName || 'Unnamed User'}
                            {currentUserProfile?.uid === user.uid && (
                              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">YOU</span>
                            )}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      {getRoleBadge(user.role)}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        title="Click to toggle status"
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all hover:scale-105",
                          user.status === 'active' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          user.status === 'pending' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-rose-50 text-rose-700 border border-rose-200"
                        )}
                      >
                        {user.status === 'active' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                        {user.status || 'active'}
                      </button>
                    </td>

                    {/* Role Specific details */}
                    <td className="p-4 text-gray-600">
                      {user.role === 'supplier' && (
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-900 text-[11px]">{user.companyName || 'No Company Set'}</p>
                          <p className="text-[10px] text-amber-700 font-extrabold flex items-center gap-1">
                            <Percent className="w-3 h-3" /> Commission: {user.commissionRate ?? 15}%
                          </p>
                        </div>
                      )}
                      {user.role === 'agent' && (
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-900 text-[11px]">{user.companyName || 'Agency Account'}</p>
                          <p className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1">
                            <Percent className="w-3 h-3" /> Discount Rate: {user.discountRate ?? 10}%
                          </p>
                        </div>
                      )}
                      {user.role === 'staff' && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/60">
                              Operations Staff
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenPermissionsModal(user)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Sliders className="w-3 h-3" />
                              Permissions
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium">
                            {[
                              user.permissions?.bookings !== false && 'Bookings',
                              user.permissions?.tours !== false && 'Tours',
                              user.permissions?.carRental !== false && 'Cars',
                              user.permissions?.inquiries !== false && 'Inquiries',
                              user.permissions?.tickets !== false && 'Tickets',
                              user.permissions?.guides !== false && 'Guides'
                            ].filter(Boolean).slice(0, 4).join(', ')}
                          </p>
                        </div>
                      )}
                      {user.role === 'admin' && (
                        <span className="text-[11px] font-bold text-rose-900 bg-rose-50 px-2 py-0.5 rounded">Full Admin Privileges</span>
                      )}
                      {user.role === 'customer' && (
                        <span className="text-[11px] text-gray-400">Regular Customer</span>
                      )}
                    </td>

                    {/* Contact info */}
                    <td className="p-4 text-[11px] text-gray-500">
                      <div>{user.phoneNumber || 'No phone'}</div>
                      <div className="text-gray-400 text-[10px]">{user.country || 'Indonesia'}</div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPermissionsModal(user)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Configure User Permissions"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          className="p-2 text-gray-500 hover:text-primary hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit User"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {currentUserProfile?.uid !== user.uid && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmUser(user)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                {editingUser ? <Edit3 className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />}
                {editingUser ? `Edit User: ${editingUser.displayName}` : 'Create New System User'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Assign role permissions and specific business settings.</p>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wayan Sutrisna"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full p-3 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. wayan@balitours.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Role & Status Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">User Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full p-3 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none"
                  >
                    <option value="admin">Administrator (Full Control)</option>
                    <option value="staff">Staff (Booking & Customer Ops)</option>
                    <option value="supplier">Supplier (Product Owner / Provider)</option>
                    <option value="agent">Agent (Travel Partner / B2B)</option>
                    <option value="customer">Customer (Standard User)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Account Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-3 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none"
                  >
                    <option value="active">Active (Can Log In)</option>
                    <option value="pending">Pending Approval</option>
                    <option value="suspended">Suspended (Blocked)</option>
                  </select>
                </div>
              </div>

              {/* Role Specific Fields */}
              {formData.role === 'staff' && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-4 animate-in fade-in">
                  <div>
                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" /> Staff Module Permissions
                    </h4>
                    <p className="text-[10px] text-indigo-700 mt-0.5">
                      Check which modules and operational tasks this staff member can access.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { key: 'bookings', label: 'View Bookings' },
                      { key: 'canEditBookings', label: 'Change/Edit Booking' },
                      { key: 'canAssignGuides', label: 'Assign Guides & Drivers' },
                      { key: 'tours', label: 'View Tours & Prices' },
                      { key: 'carRental', label: 'Car Rental Bookings' },
                      { key: 'inquiries', label: 'Customer Inquiries' },
                      { key: 'tickets', label: 'Support Tickets' },
                      { key: 'guides', label: 'Guide Roster' },
                      { key: 'reviews', label: 'Customer Reviews' },
                      { key: 'canEditTours', label: 'Edit Tour Details' },
                      { key: 'analytics', label: 'Analytics Reports' },
                      { key: 'settings', label: 'System Settings' },
                    ].map(({ key, label }) => {
                      const isChecked = (formData.permissions as any)?.[key] ?? false;
                      return (
                        <label
                          key={key}
                          className={cn(
                            "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all",
                            isChecked 
                              ? "bg-white border-indigo-300 text-indigo-950 shadow-xs" 
                              : "bg-indigo-50/40 border-indigo-100 text-gray-500"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                permissions: {
                                  ...formData.permissions,
                                  [key]: e.target.checked
                                }
                              });
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] leading-tight select-none">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.role === 'supplier' && (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-4 animate-in fade-in">
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-600" /> Supplier Specific Settings
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-amber-900 uppercase">Company / Operator Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Bali Rafting Adventure PT"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full p-2.5 text-xs font-bold bg-white border border-amber-200 rounded-xl outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-amber-900 uppercase">Platform Commission Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="15"
                        value={formData.commissionRate}
                        onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                        className="w-full p-2.5 text-xs font-bold bg-white border border-amber-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.role === 'agent' && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-4 animate-in fade-in">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" /> Agent B2B Settings
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-emerald-900 uppercase">Agency / Partner Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Global Travel Hub Ltd"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full p-2.5 text-xs font-bold bg-white border border-emerald-200 rounded-xl outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-emerald-900 uppercase">Agent Discount Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="10"
                        value={formData.discountRate}
                        onChange={(e) => setFormData({ ...formData, discountRate: Number(e.target.value) })}
                        className="w-full p-2.5 text-xs font-bold bg-white border border-emerald-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Phone / WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="+62 812 3456 7890"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full p-3 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Country</label>
                  <input
                    type="text"
                    placeholder="Indonesia"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full p-3 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-3 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Granular Permissions Adjustment Modal */}
      {isPermissionsModalOpen && permissionTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPermissionsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  User Permissions & Access Control
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Adjust allowed modules for <strong>{permissionTargetUser.displayName || permissionTargetUser.email}</strong> ({permissionTargetUser.role.toUpperCase()}).
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                Quick Role Presets
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => applyPermissionPreset('operations')}
                  className="p-2.5 text-left rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-900 transition-all cursor-pointer"
                >
                  <p className="text-xs font-black">Staff Default</p>
                  <p className="text-[10px] text-indigo-700 leading-tight mt-0.5">Bookings, Tours, Cars, Inquiries, Support</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPermissionPreset('coordinator')}
                  className="p-2.5 text-left rounded-xl border border-teal-100 bg-teal-50/50 hover:bg-teal-100 text-teal-900 transition-all cursor-pointer"
                >
                  <p className="text-xs font-black">Tour Coordinator</p>
                  <p className="text-[10px] text-teal-700 leading-tight mt-0.5">Bookings, Guides, Tour pricing & edits</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPermissionPreset('support')}
                  className="p-2.5 text-left rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100 text-amber-900 transition-all cursor-pointer"
                >
                  <p className="text-xs font-black">Helpdesk / Support</p>
                  <p className="text-[10px] text-amber-700 leading-tight mt-0.5">Tickets, Inquiries & booking reviews</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPermissionPreset('full')}
                  className="p-2.5 text-left rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100 text-purple-900 transition-all cursor-pointer"
                >
                  <p className="text-xs font-black">Operations Lead</p>
                  <p className="text-[10px] text-purple-700 leading-tight mt-0.5">Full operations without admin settings</p>
                </button>
              </div>
            </div>

            {/* Granular Matrix */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2">
                  Operations & Bookings Module
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'bookings', label: 'Access Bookings Dashboard', desc: 'Can view customer bookings list and itinerary status' },
                    { key: 'canCreateBookings', label: 'Create New Bookings', desc: 'Can book on behalf of guests or walk-in customers' },
                    { key: 'canEditBookings', label: 'Modify Bookings & Dates', desc: 'Can edit booking details, prices, and dates' },
                    { key: 'canAssignGuides', label: 'Assign Guides & Drivers', desc: 'Can dispatch drivers and guides to reservations' },
                    { key: 'canDeleteBookings', label: 'Cancel / Void Bookings', desc: 'Can cancel reservations and mark void' },
                  ].map(({ key, label, desc }) => {
                    const isChecked = (userPermissionsState as any)[key] ?? false;
                    return (
                      <label
                        key={key}
                        className={cn(
                          "flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                          isChecked 
                            ? "bg-indigo-50/40 border-indigo-200 text-gray-900" 
                            : "bg-gray-50 border-gray-200 text-gray-500"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setUserPermissionsState({ ...userPermissionsState, [key]: e.target.checked })}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <div>
                          <p className="text-xs font-extrabold text-gray-900">{label}</p>
                          <p className="text-[10.5px] text-gray-500 leading-snug mt-0.5">{desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2">
                  Catalog, Support & Customer Communications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'tours', label: 'Tours & Pricing Directory', desc: 'Can check tour prices, packages, and seasonal rates' },
                    { key: 'canEditTours', label: 'Edit & Create Tours', desc: 'Can add or modify tours and pricing tiers' },
                    { key: 'carRental', label: 'Car Rental Management', desc: 'Can view and coordinate vehicle rentals' },
                    { key: 'inquiries', label: 'Customer Inquiries & Quotes', desc: 'Can read, reply to, and quote traveler inquiries' },
                    { key: 'tickets', label: 'Support & Dispute Tickets', desc: 'Can resolve customer help requests and live issues' },
                    { key: 'guides', label: 'Guides & Drivers Roster', desc: 'Can view guide contact info and license status' },
                    { key: 'reviews', label: 'Customer Reviews Moderation', desc: 'Can view and reply to guest ratings' },
                  ].map(({ key, label, desc }) => {
                    const isChecked = (userPermissionsState as any)[key] ?? false;
                    return (
                      <label
                        key={key}
                        className={cn(
                          "flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                          isChecked 
                            ? "bg-teal-50/40 border-teal-200 text-gray-900" 
                            : "bg-gray-50 border-gray-200 text-gray-500"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setUserPermissionsState({ ...userPermissionsState, [key]: e.target.checked })}
                          className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <div>
                          <p className="text-xs font-extrabold text-gray-900">{label}</p>
                          <p className="text-[10.5px] text-gray-500 leading-snug mt-0.5">{desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2">
                  Administrative & System Access
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'analytics', label: 'Business Analytics & Revenue Reports', desc: 'Financial turnover, channel performance, and booking stats' },
                    { key: 'coupons', label: 'Promotions & Promo Codes', desc: 'Create and manage discount codes' },
                    { key: 'marketing', label: 'Marketing Campaigns & SEO', desc: 'Email broadcasts, meta tags, and blog publishing' },
                    { key: 'websiteBuilder', label: 'Visual Website Builder', desc: 'Edit homepage sections, banners, and layout' },
                    { key: 'finance', label: 'Supplier Payouts & Invoicing', desc: 'Approve vendor payouts and view company bank ledger' },
                    { key: 'settings', label: 'Global Platform Settings', desc: 'Payment gateways, domain setup, tenant configuration' },
                    { key: 'userManagement', label: 'User & Role Administration', desc: 'Create users and adjust security permissions' },
                  ].map(({ key, label, desc }) => {
                    const isChecked = (userPermissionsState as any)[key] ?? false;
                    return (
                      <label
                        key={key}
                        className={cn(
                          "flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                          isChecked 
                            ? "bg-rose-50/40 border-rose-200 text-gray-900" 
                            : "bg-gray-50 border-gray-200 text-gray-500"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setUserPermissionsState({ ...userPermissionsState, [key]: e.target.checked })}
                          className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                        />
                        <div>
                          <p className="text-xs font-extrabold text-gray-900">{label}</p>
                          <p className="text-[10.5px] text-gray-500 leading-snug mt-0.5">{desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Delete User Account?</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Are you sure you want to delete <strong>{deleteConfirmUser.displayName}</strong> ({deleteConfirmUser.email})? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={loading}
                className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
