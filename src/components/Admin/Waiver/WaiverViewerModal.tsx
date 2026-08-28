import React from 'react';
import { SignedWaiver } from '../../../types';
import { X, Printer, ShieldCheck, CheckCircle2, Calendar, User, Phone, Mail, FileText, Download } from 'lucide-react';
import { useTenant } from '../../../lib/TenantContext';

interface WaiverViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  waiver: SignedWaiver | null;
}

export const WaiverViewerModal: React.FC<WaiverViewerModalProps> = ({
  isOpen,
  onClose,
  waiver
}) => {
  const { tenant } = useTenant();

  if (!isOpen || !waiver) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Modal Controls Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black tracking-tight uppercase">
              Signed Digital Waiver Certificate
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 text-slate-800 text-xs">
          
          {/* Certificate Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-emerald-600">
                {tenant?.companyName || 'Activity & Tour Operator'}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                ACTIVITY & LIABILITY WAIVER CERTIFICATE
              </h1>
              <p className="text-[11px] text-slate-500 font-mono">
                Document ID: {waiver.id}
              </p>
            </div>
            
            <div className="text-right bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase">
                <CheckCircle2 className="w-4 h-4" /> Legally Executed
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                {new Date(waiver.signedAt).toUTCString()}
              </div>
            </div>
          </div>

          {/* Core Booking & Tour Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tour Activity</span>
              <span className="font-bold text-slate-900 text-sm">{waiver.tourTitle || 'Tour Activity'}</span>
            </div>
            {waiver.bookingCode && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Booking Reference</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">#{waiver.bookingCode}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tour Date</span>
              <span className="font-semibold text-slate-800">{waiver.tourDate || 'Scheduled Departure'}</span>
            </div>
          </div>

          {/* Primary Signer Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" /> Primary Signer Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                <span className="font-bold text-slate-900">{waiver.signerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                <span className="text-slate-700 break-all">{waiver.signerEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span>
                <span className="text-slate-700">{waiver.signerPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Nationality</span>
                <span className="text-slate-700">{waiver.signerCountry || 'Not Specified'}</span>
              </div>
            </div>
          </div>

          {/* Participants Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Covered Participants ({waiver.participants?.length || 1})
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Participant Name</th>
                    <th className="py-2.5 px-3">Passport / ID</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Emergency Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {waiver.participants?.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{p.fullName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{p.passportOrId || '-'}</td>
                      <td className="py-2.5 px-3">
                        {p.isMinor ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                            Minor (Guardian: {p.parentGuardianName || waiver.signerName})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px]">
                            Adult
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {p.emergencyContactName ? `${p.emergencyContactName} (${p.emergencyContactPhone || ''})` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Medical Notes if any */}
          {waiver.notes && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
              <span className="font-bold text-amber-900 block mb-1">Declared Medical & Dietary Notes:</span>
              <p className="text-amber-800">{waiver.notes}</p>
            </div>
          )}

          {/* Consents Recorded */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Liability & Assumption of Risk Accepted
            </div>
            {waiver.minorConsentAccepted && (
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Parent / Guardian Legal Authorization Confirmed
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Photo & Promotional Media Consent: {waiver.photoConsentAccepted ? 'Granted' : 'Declined'}
            </div>
          </div>

          {/* Signature Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Digital Signature</span>
              <div className="p-3 bg-white border border-slate-300 rounded-xl h-24 flex items-center justify-center">
                <img
                  src={waiver.signatureDataUrl}
                  alt="Signer Signature"
                  className="max-h-20 max-w-full object-contain"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-500 font-mono flex flex-col justify-center">
              <div><strong className="text-slate-700 font-sans font-bold">Signer:</strong> {waiver.signerName}</div>
              <div><strong className="text-slate-700 font-sans font-bold">Signed UTC:</strong> {waiver.signedAt}</div>
              {waiver.userAgent && (
                <div className="text-[10px] truncate max-w-xs text-slate-400">
                  <strong className="text-slate-700 font-sans font-bold">Device:</strong> {waiver.userAgent}
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-2">
            This document is a legally recognized electronic activity waiver stored securely in the {tenant?.companyName || 'Operator'} digital registry.
          </div>
        </div>
      </div>
    </div>
  );
};
