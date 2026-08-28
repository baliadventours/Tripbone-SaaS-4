import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { db, doc, getDoc, collection, query, where, getDocs } from '../lib/firebase';
import { useTenant } from '../lib/TenantContext';
import { WaiverTemplate, SignedWaiver, Booking, WaiverParticipant } from '../types';
import { getWaiverTemplates, saveSignedWaiver } from '../lib/waiverService';
import { SignaturePad } from '../components/Admin/Waiver/SignaturePad';
import { 
  ShieldCheck, FileText, CheckCircle2, AlertCircle, Plus, Trash2, 
  Printer, ArrowLeft, Heart, Lock, Calendar, MapPin, User, Phone, 
  Mail, Users, Award, ExternalLink 
} from 'lucide-react';

export default function WaiverSigningPage() {
  const { bookingId, templateId } = useParams<{ bookingId?: string; templateId?: string }>();
  const [searchParams] = useSearchParams();
  const queryBookingId = searchParams.get('booking') || bookingId;
  const queryTemplateId = searchParams.get('template') || templateId;

  const { tenant, tenantId } = useTenant();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [templates, setTemplates] = useState<WaiverTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WaiverTemplate | null>(null);

  // Form State
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const [signerCountry, setSignerCountry] = useState('');
  
  const [tourTitle, setTourTitle] = useState('');
  const [tourDate, setTourDate] = useState('');

  // Participants list
  const [participants, setParticipants] = useState<WaiverParticipant[]>([
    {
      fullName: '',
      passportOrId: '',
      ageGroup: 'adult',
      isMinor: false,
      medicalNotes: '',
      emergencyContactName: '',
      emergencyContactPhone: ''
    }
  ]);

  // Medical conditions checklist
  const [medicalAnswers, setMedicalAnswers] = useState<Record<string, boolean>>({});
  const [medicalNotes, setMedicalNotes] = useState('');

  // Consents & Declarations
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [medicalDeclared, setMedicalDeclared] = useState(false);
  const [photoConsentAccepted, setPhotoConsentAccepted] = useState(true);
  const [minorConsentAccepted, setMinorConsentAccepted] = useState(false);

  // Digital Signature
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Completed State
  const [submittedWaiver, setSubmittedWaiver] = useState<SignedWaiver | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch Booking and Templates
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const loadedTemplates = await getWaiverTemplates(tenantId || 'global');
        setTemplates(loadedTemplates);

        let activeBooking: Booking | null = null;

        // If booking ID is provided in route or query
        if (queryBookingId) {
          try {
            const bSnap = await getDoc(doc(db, 'bookings', queryBookingId));
            if (bSnap.exists()) {
              activeBooking = { ...bSnap.data(), id: bSnap.id } as Booking;
              setBooking(activeBooking);

              // Pre-populate fields from booking
              if (activeBooking.customerData) {
                setSignerName(activeBooking.customerData.fullName || '');
                setSignerEmail(activeBooking.customerData.email || '');
                setSignerPhone(activeBooking.customerData.phone || '');
                setSignerCountry(activeBooking.customerData.country || activeBooking.customerData.nationality || '');
              }
              setTourTitle(activeBooking.tourTitle || '');
              setTourDate(activeBooking.date || '');

              // Pre-populate participants based on booking numbers
              const totalAdults = activeBooking.participants?.adults || 1;
              const totalChildren = activeBooking.participants?.children || 0;
              const initialParts: WaiverParticipant[] = [];

              for (let i = 0; i < totalAdults; i++) {
                initialParts.push({
                  fullName: i === 0 ? (activeBooking.customerData?.fullName || '') : '',
                  passportOrId: '',
                  ageGroup: 'adult',
                  isMinor: false,
                  emergencyContactName: '',
                  emergencyContactPhone: ''
                });
              }
              for (let i = 0; i < totalChildren; i++) {
                initialParts.push({
                  fullName: '',
                  passportOrId: '',
                  ageGroup: 'child',
                  isMinor: true,
                  parentGuardianName: activeBooking.customerData?.fullName || '',
                  emergencyContactName: '',
                  emergencyContactPhone: ''
                });
              }
              if (initialParts.length > 0) {
                setParticipants(initialParts);
              }
            }
          } catch (bErr) {
            console.warn('Error loading booking for waiver:', bErr);
          }
        }

        // Match suitable waiver template
        let matchedTemplate: WaiverTemplate | null = null;

        if (queryTemplateId) {
          matchedTemplate = loadedTemplates.find(t => t.id === queryTemplateId) || null;
        }

        if (!matchedTemplate && activeBooking?.tourId) {
          // Check if any template is explicitly assigned to this tour
          matchedTemplate = loadedTemplates.find(t => t.appliedTourIds?.includes(activeBooking!.tourId)) || null;
        }

        if (!matchedTemplate) {
          // Default template fallback
          matchedTemplate = loadedTemplates.find(t => t.isDefault) || loadedTemplates[0] || null;
        }

        setSelectedTemplate(matchedTemplate);
      } catch (err) {
        console.error('Error initializing waiver form:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [queryBookingId, queryTemplateId, tenantId]);

  // Handle participant mutations
  const handleAddParticipant = () => {
    setParticipants(prev => [
      ...prev,
      {
        fullName: '',
        passportOrId: '',
        ageGroup: 'adult',
        isMinor: false,
        emergencyContactName: '',
        emergencyContactPhone: ''
      }
    ]);
  };

  const handleRemoveParticipant = (index: number) => {
    if (participants.length <= 1) return;
    setParticipants(prev => prev.filter((_, i) => i !== index));
  };

  const handleParticipantChange = (index: number, field: keyof WaiverParticipant, value: any) => {
    setParticipants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'isMinor' && value === true) {
        next[index].ageGroup = 'child';
        if (!next[index].parentGuardianName) {
          next[index].parentGuardianName = signerName;
        }
      }
      return next;
    });
  };

  const hasMinors = participants.some(p => p.isMinor);

  // Form Submission
  const handleSubmitWaiver = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signerName.trim()) {
      setErrorMessage('Please enter the primary signer full name.');
      return;
    }
    if (!signerEmail.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('You must review and accept the liability release and terms.');
      return;
    }
    if (hasMinors && !minorConsentAccepted) {
      setErrorMessage('You must confirm parent/guardian legal authorization for registered minors.');
      return;
    }
    if (!signatureDataUrl) {
      setErrorMessage('Please provide your digital signature using the touchscreen or mouse.');
      return;
    }

    // Ensure all participant names are filled
    const emptyNames = participants.some(p => !p.fullName.trim());
    if (emptyNames) {
      setErrorMessage('Please ensure all participant full names are provided.');
      return;
    }

    setSubmitting(true);

    try {
      const signedRecord: Partial<SignedWaiver> = {
        tenantId: tenantId || 'global',
        bookingId: queryBookingId || booking?.id || undefined,
        bookingCode: booking?.id ? booking.id.substring(0, 8).toUpperCase() : undefined,
        tourId: booking?.tourId,
        tourTitle: tourTitle || booking?.tourTitle || selectedTemplate?.title,
        tourDate: tourDate || booking?.date,
        templateId: selectedTemplate?.id || 'general',
        templateTitle: selectedTemplate?.title || 'Activity Liability Waiver',
        activityType: selectedTemplate?.activityType || 'sightseeing',
        signerName: signerName.trim(),
        signerEmail: signerEmail.trim().toLowerCase(),
        signerPhone: signerPhone.trim(),
        signerCountry: signerCountry.trim(),
        participants,
        termsAccepted,
        medicalDeclared,
        photoConsentAccepted,
        minorConsentAccepted: hasMinors ? minorConsentAccepted : undefined,
        signatureDataUrl,
        signedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        notes: medicalNotes.trim() || undefined,
        status: 'valid'
      };

      const signedId = await saveSignedWaiver(signedRecord);
      setSubmittedWaiver({ ...signedRecord, id: signedId } as SignedWaiver);
    } catch (err: any) {
      console.error('Failed to submit signed waiver:', err);
      setErrorMessage(err.message || 'Failed to submit waiver. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading Activity Liability Waiver...</p>
        </div>
      </div>
    );
  }

  // Submission Completed View (Certificate Receipt)
  if (submittedWaiver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-200">
                Verified & Completed
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Digital Waiver Signed Successfully
              </h1>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Thank you, <strong className="text-slate-800">{submittedWaiver.signerName}</strong>. Your liability waiver has been legally authorized and attached to your tour records.
              </p>
            </div>

            {/* Certificate Details Box */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Document ID</div>
                  <div className="text-sm font-mono font-bold text-slate-800">{submittedWaiver.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Timestamp (UTC)</div>
                  <div className="text-xs font-semibold text-slate-700">
                    {new Date(submittedWaiver.signedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Activity / Tour</span>
                  <span className="font-bold text-slate-800 text-sm">{submittedWaiver.tourTitle || 'Tour Excursion'}</span>
                </div>
                {submittedWaiver.bookingCode && (
                  <div>
                    <span className="text-slate-400 block font-medium">Booking Reference</span>
                    <span className="font-bold text-emerald-700 font-mono text-sm">#{submittedWaiver.bookingCode}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block font-medium">Primary Signer</span>
                  <span className="font-semibold text-slate-800">{submittedWaiver.signerName} ({submittedWaiver.signerEmail})</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Covered Participants</span>
                  <span className="font-semibold text-slate-800">{submittedWaiver.participants?.length || 1} Person(s)</span>
                </div>
              </div>

              {/* Digital Signature Snapshot */}
              <div className="pt-3 border-t border-slate-200">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Verified Digital Signature</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block w-full max-w-xs">
                  <img
                    src={submittedWaiver.signatureDataUrl}
                    alt="Digital Signature"
                    className="max-h-20 object-contain mx-auto"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF Receipt
              </button>

              <Link
                to="/"
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Website
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Branding */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-black tracking-widest text-emerald-600 uppercase">
                  {tenant?.companyName || 'Activity & Tour Operator'}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Participant Liability & Safety Waiver
                </h1>
              </div>
            </div>

            {/* Template Selector if multiple exist */}
            {templates.length > 1 && !queryTemplateId && (
              <div className="text-right">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Activity Type</label>
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const t = templates.find(item => item.id === e.target.value);
                    if (t) setSelectedTemplate(t);
                  }}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tour Reference Banner */}
          {(tourTitle || booking) && (
            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-950 font-medium">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tour: <strong className="font-bold">{tourTitle || booking?.tourTitle}</strong></span>
              </div>
              {tourDate && (
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Date: {tourDate}</span>
                </div>
              )}
              {booking && (
                <div className="text-[11px] font-mono bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  Booking #{booking.id.substring(0, 8).toUpperCase()}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-slate-500 leading-relaxed">
            Please read the liability release carefully and complete the participant details below. All guests participating in physical activities, water sports, or guided tours must complete and sign this waiver prior to departure.
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmitWaiver} className="space-y-6">

          {/* Section 1: Lead Guest / Signer Information */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">1. Primary Signer (Lead Guest / Adult)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  WhatsApp / Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +61 400 000 000"
                  value={signerPhone}
                  onChange={(e) => setSignerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Country of Residence / Nationality</label>
                <input
                  type="text"
                  placeholder="e.g. Australia"
                  value={signerCountry}
                  onChange={(e) => setSignerCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: All Covered Participants & Minors */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">2. Participants Covered Under This Waiver</h2>
                  <p className="text-[11px] text-slate-400">List all adults and minors in your group joining the activity</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddParticipant}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Person
              </button>
            </div>

            <div className="space-y-4">
              {participants.map((part, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative transition hover:border-slate-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Participant #{idx + 1} {part.isMinor ? '(Minor / Child)' : '(Adult)'}
                    </span>
                    {participants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 transition"
                        title="Remove participant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-semibold text-slate-600">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Participant full name"
                        value={part.fullName}
                        onChange={(e) => handleParticipantChange(idx, 'fullName', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Passport / ID No.</label>
                      <input
                        type="text"
                        placeholder="Passport / ID"
                        value={part.passportOrId || ''}
                        onChange={(e) => handleParticipantChange(idx, 'passportOrId', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Minor toggle */}
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium select-none">
                      <input
                        type="checkbox"
                        checked={part.isMinor || false}
                        onChange={(e) => handleParticipantChange(idx, 'isMinor', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>This participant is under 18 years old (Minor)</span>
                    </label>
                  </div>

                  {/* Minor Guardian Detail */}
                  {part.isMinor && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1.5 animate-in fade-in duration-200">
                      <label className="font-bold text-amber-900">Parent / Legal Guardian Full Name</label>
                      <input
                        type="text"
                        placeholder="Guardian Name"
                        value={part.parentGuardianName || signerName}
                        onChange={(e) => handleParticipantChange(idx, 'parentGuardianName', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-800"
                      />
                    </div>
                  )}

                  {/* Emergency Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">Emergency Contact Name</label>
                      <input
                        type="text"
                        placeholder="Contact person"
                        value={part.emergencyContactName || ''}
                        onChange={(e) => handleParticipantChange(idx, 'emergencyContactName', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        placeholder="Phone / WhatsApp"
                        value={part.emergencyContactPhone || ''}
                        onChange={(e) => handleParticipantChange(idx, 'emergencyContactPhone', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Health & Medical Declaration */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Heart className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-bold text-slate-900">3. Health & Medical Declaration</h2>
            </div>

            <p className="text-xs text-slate-500">
              Please review the following health considerations. If anyone has medical restrictions, allergies, or injuries, please indicate below so guides can provide appropriate safety accommodations.
            </p>

            {/* Preset Medical Questions */}
            {selectedTemplate?.medicalQuestions && selectedTemplate.medicalQuestions.length > 0 && (
              <div className="space-y-2.5">
                {selectedTemplate.medicalQuestions.map((qText, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs"
                  >
                    <input
                      type="checkbox"
                      id={`med_q_${qIdx}`}
                      checked={medicalAnswers[qText] || false}
                      onChange={(e) => setMedicalAnswers(prev => ({ ...prev, [qText]: e.target.checked }))}
                      className="mt-0.5 rounded text-red-600 focus:ring-red-500 w-4 h-4 shrink-0"
                    />
                    <label htmlFor={`med_q_${qIdx}`} className="text-slate-700 font-medium cursor-pointer">
                      {qText}
                    </label>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700">Special Medical Notes or Dietary Allergies (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Asthma (carrying inhaler), peanut allergy, recent knee surgery..."
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
              />
            </div>
          </div>

          {/* Section 4: Terms, Risk Assumption & Consents */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">4. Legal Terms & Assumption of Risk</h2>
            </div>

            {/* Scrollable Terms Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 font-mono max-h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {selectedTemplate?.termsContent || 'Standard tour liability and indemnity terms apply.'}
            </div>

            {/* Mandatory Checkboxes */}
            <div className="space-y-3 pt-2 text-xs">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80 cursor-pointer text-slate-800 font-semibold select-none">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
                />
                <span>
                  I have read, understood, and voluntarily agree to all the terms, conditions, and assumption of risk outlined above on behalf of myself and all listed participants. <span className="text-red-500">*</span>
                </span>
              </label>

              {hasMinors && (
                <label className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer text-amber-950 font-semibold select-none">
                  <input
                    type="checkbox"
                    required
                    checked={minorConsentAccepted}
                    onChange={(e) => setMinorConsentAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 shrink-0"
                  />
                  <span>
                    Parent / Legal Guardian Authorization: As parent/guardian of the minor(s) listed above, I consent to their participation and accept all terms on their behalf. <span className="text-red-500">*</span>
                  </span>
                </label>
              )}

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={photoConsentAccepted}
                  onChange={(e) => setPhotoConsentAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
                />
                <span>
                  Photo & Video Consent: I permit the tour team to take souvenir photos/videos during activities for promotional media.
                </span>
              </label>
            </div>
          </div>

          {/* Section 5: Digital Touchscreen Signature */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lock className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">5. Digital Signature & Authorization</h2>
                <p className="text-[11px] text-slate-400">Sign with your fingertip or stylus on mobile, or drag your mouse on desktop</p>
              </div>
            </div>

            <SignaturePad
              height={180}
              onChange={(dataUrl) => setSignatureDataUrl(dataUrl)}
            />

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing & Securing Record...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-5 h-5" />
                    <span>Submit & Sign Official Waiver</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer info */}
        <div className="text-center text-slate-400 text-xs space-y-1">
          <p>🔒 256-bit encrypted digital signature record. Compliant with international electronic signature laws.</p>
          <p>{tenant?.companyName || 'Tour Operator'} • Digital Liability System</p>
        </div>
      </div>
    </div>
  );
}
