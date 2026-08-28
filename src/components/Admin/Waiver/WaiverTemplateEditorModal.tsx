import React, { useState, useEffect } from 'react';
import { WaiverTemplate, ActivityWaiverType, Tour } from '../../../types';
import { saveWaiverTemplate } from '../../../lib/waiverService';
import { useTenant } from '../../../lib/TenantContext';
import { X, ShieldCheck, Save, Plus, Trash2, HelpCircle } from 'lucide-react';

interface WaiverTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: WaiverTemplate | null;
  tours?: any[];
  onSaved: () => void;
}

export const WaiverTemplateEditorModal: React.FC<WaiverTemplateEditorModalProps> = ({
  isOpen,
  onClose,
  template,
  tours = [],
  onSaved
}) => {
  const { tenantId } = useTenant();

  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState<ActivityWaiverType>('sightseeing');
  const [description, setDescription] = useState('');
  const [termsContent, setTermsContent] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [active, setActive] = useState(true);

  // Settings
  const [requirePassportId, setRequirePassportId] = useState(true);
  const [requireEmergencyContact, setRequireEmergencyContact] = useState(true);
  const [requireMedicalChecklist, setRequireMedicalChecklist] = useState(true);
  const [requireMinorParentSignature, setRequireMinorParentSignature] = useState(true);
  const [requirePhotoVideoConsent, setRequirePhotoVideoConsent] = useState(true);

  // Medical Questions
  const [medicalQuestions, setMedicalQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');

  // Tour Associations
  const [appliedTourIds, setAppliedTourIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setTitle(template.title || '');
      setActivityType(template.activityType || 'sightseeing');
      setDescription(template.description || '');
      setTermsContent(template.termsContent || '');
      setIsDefault(template.isDefault || false);
      setActive(template.active !== false);
      setRequirePassportId(template.requirePassportId !== false);
      setRequireEmergencyContact(template.requireEmergencyContact !== false);
      setRequireMedicalChecklist(template.requireMedicalChecklist !== false);
      setRequireMinorParentSignature(template.requireMinorParentSignature !== false);
      setRequirePhotoVideoConsent(template.requirePhotoVideoConsent !== false);
      setMedicalQuestions(template.medicalQuestions || []);
      setAppliedTourIds(template.appliedTourIds || []);
    } else {
      setTitle('');
      setActivityType('sightseeing');
      setDescription('');
      setTermsContent(`1. ASSUMPTION OF RISK
I voluntarily assume all risk of injury, illness, or property loss while participating in this activity.

2. RELEASE OF LIABILITY
I release the tour operator, staff, and guides from any claims arising out of participation.

3. MEDICAL FITNESS
I declare that all participants are fit to partake and have disclosed any pertinent conditions.`);
      setIsDefault(false);
      setActive(true);
      setRequirePassportId(true);
      setRequireEmergencyContact(true);
      setRequireMedicalChecklist(true);
      setRequireMinorParentSignature(true);
      setRequirePhotoVideoConsent(true);
      setMedicalQuestions([
        'Do you have any severe heart conditions or respiratory issues?',
        'Are you currently pregnant or recovering from major surgeries?'
      ]);
      setAppliedTourIds([]);
    }
  }, [template, isOpen]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    setMedicalQuestions(prev => [...prev, newQuestion.trim()]);
    setNewQuestion('');
  };

  const handleRemoveQuestion = (idx: number) => {
    setMedicalQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleToggleTour = (tourId: string) => {
    setAppliedTourIds(prev => 
      prev.includes(tourId) ? prev.filter(id => id !== tourId) : [...prev, tourId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a template title.');
      return;
    }
    if (!termsContent.trim()) {
      setError('Please provide the liability terms content.');
      return;
    }

    setSaving(true);
    try {
      await saveWaiverTemplate({
        id: template?.id,
        tenantId: tenantId || 'global',
        title: title.trim(),
        activityType,
        description: description.trim(),
        termsContent: termsContent.trim(),
        isDefault,
        active,
        requirePassportId,
        requireEmergencyContact,
        requireMedicalChecklist,
        requireMinorParentSignature,
        requirePhotoVideoConsent,
        medicalQuestions,
        appliedTourIds
      });

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error saving waiver template:', err);
      setError(err.message || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black tracking-tight">
              {template ? 'Edit Waiver Template' : 'Create New Activity Waiver Template'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-semibold rounded-xl">
              {error}
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-slate-700">Waiver Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Quad Bike / ATV Adventure Safety Waiver"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Activity Category</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityWaiverType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="sightseeing">General Sightseeing & Cultural Tours</option>
                <option value="adventure">High-Risk Adventure (ATV, Buggy, Rafting)</option>
                <option value="water_sports">Water Sports, Snorkeling & Diving</option>
                <option value="trekking">Volcano & Mountain Trekking</option>
                <option value="transport">Private Transport & Charter</option>
                <option value="custom">Custom Specialty Tour</option>
              </select>
            </div>

            <div className="flex items-center gap-6 pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Set as Default Waiver</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Active / Enabled</span>
              </label>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-slate-700">Short Summary / Description</label>
              <input
                type="text"
                placeholder="Brief internal note or subtitle"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Legal Terms Content */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Legal Terms & Liability Release Clauses *</span>
              <span className="text-[10px] text-slate-400 font-normal">Plain text or structured clauses</span>
            </label>
            <textarea
              rows={8}
              required
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xs text-slate-800 leading-relaxed"
            />
          </div>

          {/* Custom Medical Questions */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">Health & Medical Declarations</label>
              <span className="text-[10px] text-slate-400">Questions guests must review</span>
            </div>

            <div className="space-y-2">
              {medicalQuestions.map((q, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-700 font-medium">{q}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="text-slate-400 hover:text-red-500 p-1 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom health question (e.g. Do you have back or neck injuries?)"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddQuestion(); } }}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Tour Assignment */}
          {tours.length > 0 && (
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">Assign Specific Tours (Optional)</label>
                <span className="text-[10px] text-slate-400">Leave empty to use as general template</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pt-1">
                {tours.map(t => (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition ${
                      appliedTourIds.includes(t.id)
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={appliedTourIds.includes(t.id)}
                      onChange={() => handleToggleTour(t.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span className="truncate">{t.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Waiver Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
