import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, query, onSnapshot, doc, deleteDoc, where } from '../../../lib/firebase';
import { useTenant } from '../../../lib/TenantContext';
import { SignedWaiver, WaiverTemplate, Booking, Tour } from '../../../types';
import { getWaiverTemplates, deleteWaiverTemplate, openWaiverWhatsApp } from '../../../lib/waiverService';
import { WaiverViewerModal } from './WaiverViewerModal';
import { WaiverTemplateEditorModal } from './WaiverTemplateEditorModal';
import QRCode from 'react-qr-code';
import {
  ShieldCheck, FileText, Search, Plus, Trash2, Eye, Printer, 
  QrCode, ExternalLink, Share2, Copy, Check, MessageSquare, 
  Calendar, User, AlertCircle, Sparkles, Filter, RefreshCw
} from 'lucide-react';

interface WaiverManagerProps {
  tours?: Tour[];
  bookings?: Booking[];
}

export const WaiverManager: React.FC<WaiverManagerProps> = ({
  tours = [],
  bookings = []
}) => {
  const { tenant, tenantId } = useTenant();
  const activeTenantId = tenantId || 'global';

  const [activeTab, setActiveTab] = useState<'submissions' | 'templates' | 'kiosk'>('submissions');
  const [loading, setLoading] = useState(true);
  const [waivers, setWaivers] = useState<SignedWaiver[]>([]);
  const [templates, setTemplates] = useState<WaiverTemplate[]>([]);

  // Search & Filters for submissions
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTourFilter, setSelectedTourFilter] = useState('all');

  // Modals
  const [viewingWaiver, setViewingWaiver] = useState<SignedWaiver | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<WaiverTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Kiosk / QR Generator state
  const [kioskTourId, setKioskTourId] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Subscribe to signed_waivers collection
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'signed_waivers'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: SignedWaiver[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SignedWaiver;
        if (!data.tenantId || data.tenantId === activeTenantId || activeTenantId === 'global') {
          list.push({ ...data, id: docSnap.id });
        }
      });

      // Sort newest first
      list.sort((a, b) => new Date(b.signedAt || 0).getTime() - new Date(a.signedAt || 0).getTime());
      setWaivers(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching signed waivers:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTenantId]);

  // 2. Fetch Templates
  const loadTemplates = async () => {
    try {
      const list = await getWaiverTemplates(activeTenantId);
      setTemplates(list);
    } catch (err) {
      console.error('Error loading waiver templates:', err);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [activeTenantId]);

  // Filtered Submissions
  const filteredWaivers = useMemo(() => {
    return waivers.filter(w => {
      if (selectedTourFilter !== 'all') {
        if (w.tourId !== selectedTourFilter && w.tourTitle !== selectedTourFilter) {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchSigner = w.signerName?.toLowerCase().includes(q);
      const matchEmail = w.signerEmail?.toLowerCase().includes(q);
      const matchPhone = w.signerPhone?.toLowerCase().includes(q);
      const matchBooking = w.bookingCode?.toLowerCase().includes(q) || w.bookingId?.toLowerCase().includes(q);
      const matchTour = w.tourTitle?.toLowerCase().includes(q);
      const matchParticipant = w.participants?.some(p => p.fullName?.toLowerCase().includes(q) || p.passportOrId?.toLowerCase().includes(q));

      return matchSigner || matchEmail || matchPhone || matchBooking || matchTour || matchParticipant;
    });
  }, [waivers, searchQuery, selectedTourFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalParticipants = waivers.reduce((acc, w) => acc + (w.participants?.length || 1), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const signedToday = waivers.filter(w => w.signedAt?.startsWith(todayStr)).length;

    return {
      totalWaivers: waivers.length,
      totalParticipants,
      signedToday,
      activeTemplates: templates.filter(t => t.active).length
    };
  }, [waivers, templates]);

  // Delete Waiver
  const handleDeleteWaiver = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the waiver for "${name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'signed_waivers', id));
      setActionNotice({ type: 'success', message: 'Signed waiver document deleted.' });
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to delete waiver.' });
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (templateId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the template "${title}"?`)) return;

    try {
      await deleteWaiverTemplate(templateId);
      await loadTemplates();
      setActionNotice({ type: 'success', message: `Template "${title}" deleted.` });
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to delete template.' });
    }
  };

  // Kiosk Link URL
  const kioskUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (kioskTourId) {
      return `${origin}/waiver?template=${kioskTourId}`;
    }
    return `${origin}/waiver`;
  }, [kioskTourId]);

  const handleCopyKioskUrl = () => {
    navigator.clipboard.writeText(kioskUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notice */}
      {actionNotice && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-md transition-all ${
            actionNotice.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <span>{actionNotice.message}</span>
          <button onClick={() => setActionNotice(null)} className="opacity-80 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              Operational Safety & Compliance
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Activity & Liability Waiver Hub
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Manage digital liability waivers, custom activity templates, guest medical declarations, and live check-in QR kiosks for guides & drivers.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={() => {
              setEditingTemplate(null);
              setIsTemplateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Waiver Template
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Waivers Signed</span>
          <span className="text-2xl font-black text-slate-900">{stats.totalWaivers}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Participants Covered</span>
          <span className="text-2xl font-black text-emerald-600">{stats.totalParticipants}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Signed Today</span>
          <span className="text-2xl font-black text-blue-600">{stats.signedToday}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Templates</span>
          <span className="text-2xl font-black text-purple-600">{stats.activeTemplates}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'submissions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Signed Waivers ({waivers.length})
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Waiver Templates ({templates.length})
        </button>

        <button
          onClick={() => setActiveTab('kiosk')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'kiosk'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4" />
          On-Site QR Kiosk / Check-in
        </button>
      </div>

      {/* TAB 1: Signed Submissions */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          {/* Filter & Search Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Guest Name, Booking #, Tour, Passport ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTourFilter}
                onChange={(e) => setSelectedTourFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-semibold text-slate-700"
              >
                <option value="all">All Tours</option>
                {tours.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>

              <button
                onClick={loadTemplates}
                title="Refresh"
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Waivers Table */}
          {loading ? (
            <div className="text-center py-12 text-xs font-semibold text-slate-500">
              Loading signed waivers...
            </div>
          ) : filteredWaivers.length === 0 ? (
            <div className="text-center py-16 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">No Signed Waivers Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Guests who complete the digital waiver online or via QR check-in will appear here in real-time.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Primary Signer</th>
                    <th className="py-3 px-4">Activity / Tour</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Participants</th>
                    <th className="py-3 px-4">Signed Date (UTC)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWaivers.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{w.signerName}</div>
                        <div className="text-[11px] text-slate-400">{w.signerEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{w.tourTitle || 'Tour Activity'}</div>
                        <div className="text-[10px] text-slate-400">{w.templateTitle}</div>
                      </td>
                      <td className="py-3 px-4">
                        {w.bookingCode ? (
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                            #{w.bookingCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Direct / Kiosk</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-700">{w.participants?.length || 1} Person(s)</span>
                        {w.participants?.some(p => p.isMinor) && (
                          <span className="ml-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                            Includes Minor
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(w.signedAt).toLocaleDateString()} {new Date(w.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingWaiver(w)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1 shadow-sm"
                            title="View Certificate"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Certificate
                          </button>
                          <button
                            onClick={() => handleDeleteWaiver(w.id, w.signerName)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Waiver Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tmpl => (
              <div
                key={tmpl.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase tracking-wider rounded-md border border-emerald-200">
                      {tmpl.activityType}
                    </span>
                    {tmpl.isDefault && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold text-[10px] rounded-md border border-purple-200">
                        Default Template
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-slate-900">{tmpl.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {tmpl.description || tmpl.termsContent}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400 font-medium">
                    {tmpl.medicalQuestions?.length || 0} Medical Check(s) • {tmpl.appliedTourIds?.length || 'All'} Tour(s)
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingTemplate(tmpl);
                        setIsTemplateModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(tmpl.id, tmpl.title)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: On-Site QR Kiosk Generator */}
      {activeTab === 'kiosk' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">On-Site QR Code & Mobile Check-in Kiosk</h3>
            <p className="text-xs text-slate-500 max-w-xl">
              Display this QR code on a tablet, driver phone, or printed stand at departure points. Arriving guests can scan to instantly sign their digital waiver on their personal smartphone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-50 p-6 rounded-3xl border border-slate-200">
            {/* QR Visual */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200 inline-block">
                <QRCode
                  value={kioskUrl}
                  size={200}
                  level="H"
                />
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Scan with Smartphone Camera
              </span>
            </div>

            {/* Config & Controls */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Specific Activity Template (Optional)</label>
                <select
                  value={kioskTourId}
                  onChange={(e) => setKioskTourId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                >
                  <option value="">General (All Tours / Default)</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.activityType})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Direct Public Signing URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={kioskUrl}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-mono text-[11px] select-all outline-none"
                  />
                  <button
                    onClick={handleCopyKioskUrl}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center gap-1.5 shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUrl ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={kioskUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Public Guest Screen
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Certificate Modal */}
      <WaiverViewerModal
        isOpen={!!viewingWaiver}
        onClose={() => setViewingWaiver(null)}
        waiver={viewingWaiver}
      />

      {/* Edit / Create Template Modal */}
      <WaiverTemplateEditorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        template={editingTemplate}
        tours={tours}
        onSaved={loadTemplates}
      />
    </div>
  );
};

export default WaiverManager;
