import React from 'react';
import { 
  Save, Share2, Printer, Mail, ExternalLink, Sparkles, Check, 
  Car, Hotel, Utensils, Ticket as TicketIcon, Clock, CheckCircle2, 
  XCircle, Copy, FileText, Phone
} from 'lucide-react';
import { Proposal, toRoman, getCategoryKey } from '../ProposalGenerator';

interface ProposalPreviewPaneProps {
  proposal: Proposal;
  isSaving: boolean;
  onSave: () => void;
  onDirectWhatsApp: () => void;
  onOpenEmailModal: () => void;
  onPrint: () => void;
  copySuccess: boolean;
  activeProposalId: string | null;
  isDarkMode?: boolean;
}

export const ProposalPreviewPane: React.FC<ProposalPreviewPaneProps> = ({
  proposal,
  isSaving,
  onSave,
  onDirectWhatsApp,
  onOpenEmailModal,
  onPrint,
  copySuccess,
  activeProposalId,
  isDarkMode = false
}) => {
  return (
    <div className="space-y-4">
      {/* Sticky Action Toolbar */}
      <div className="sticky top-4 z-20 p-3 rounded-2xl bg-white/95 dark:bg-[#111928]/95 backdrop-blur-md border border-gray-200 dark:border-slate-800 shadow-lg flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Proposal'}</span>
          </button>

          <button
            type="button"
            onClick={onDirectWhatsApp}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            title="Open WhatsApp chat with formatted itinerary and copy to clipboard"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
            {copySuccess && <span className="text-[10px] bg-white/30 px-1.5 py-0.5 rounded-sm">Copied!</span>}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenEmailModal}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs transition-colors cursor-pointer"
            title="Send proposal via Email"
          >
            <Mail className="w-4 h-4" />
          </button>

          {activeProposalId && (
            <a
              href={`#/proposal/${activeProposalId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs transition-colors cursor-pointer"
              title="Open Public Client Proposal Page"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <button
            type="button"
            onClick={onPrint}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs transition-colors cursor-pointer"
            title="Print Proposal Document or Export to PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Rendered Document */}
      <div 
        id="official-proposal-print-area" 
        className="bg-white text-slate-900 rounded-3xl border border-gray-200 shadow-xl overflow-hidden font-sans print:border-none print:shadow-none print:m-0 print:p-0 print:text-black"
      >
        {/* Document Header */}
        <div className="p-8 sm:p-10 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="space-y-2 max-w-md">
              {proposal.companyLogo && (
                <img 
                  src={proposal.companyLogo} 
                  alt={proposal.companyName} 
                  className="h-12 w-auto object-contain rounded-lg"
                />
              )}
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {proposal.companyName}
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                {proposal.companyAddress}
              </p>
              <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                {proposal.companyPhone && <span>Tel/WA: {proposal.companyPhone}</span>}
                {proposal.companyEmail && <span>Email: {proposal.companyEmail}</span>}
                {proposal.companyWebsite && <span>Web: {proposal.companyWebsite}</span>}
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white">
                Official Tour Proposal
              </span>
              <p className="text-xs font-bold text-slate-400">
                Ref: {activeProposalId ? activeProposalId.slice(0, 10).toUpperCase() : 'PROPOSAL-DRAFT'}
              </p>
              <p className="text-xs text-slate-500">
                Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Prepared For Client Banner */}
          <div className="mt-8 p-5 rounded-2xl bg-slate-100/80 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prepared For</span>
              <span className="font-black text-slate-900 text-sm">{proposal.guestName || 'Valued Guest'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Party Size</span>
              <span className="font-extrabold text-slate-800">{proposal.paxBreakdown || `${proposal.paxCount} Travelers`}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trip Length</span>
              <span className="font-extrabold text-slate-800">{proposal.durationDays} Days / {Math.max(1, proposal.durationDays - 1)} Nights</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Phone</span>
              <span className="font-extrabold text-slate-800">{proposal.phone || '-'}</span>
            </div>
          </div>
        </div>

        {/* Welcome Letter */}
        <div className="px-8 sm:px-10 py-6 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
            Welcome & Trip Overview
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {proposal.welcomeMessage}
          </p>
        </div>

        {/* Day-by-Day Timeline Narrative */}
        <div className="px-8 sm:px-10 py-8 border-b border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Day-by-Day Itinerary Schedule
            </h2>
            <span className="text-xs text-slate-400 font-bold">
              {proposal.itineraryNarrative.length} Scheduled Days
            </span>
          </div>

          <div className="space-y-6">
            {proposal.itineraryNarrative.map((day) => {
              const dayLogistics = proposal.selectedItems.filter(i => i.day === day.dayNumber);

              return (
                <div 
                  key={`doc-day-${day.dayNumber}`}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-black text-xs">
                        Day {toRoman(day.dayNumber)}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {day.title}
                      </h3>
                    </div>
                  </div>

                  {day.summary && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {day.summary}
                    </p>
                  )}

                  {/* Included day logistics badges */}
                  {dayLogistics.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Scheduled Logistics & Admissions:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {dayLogistics.map((item, idx) => {
                          const cat = getCategoryKey(item.type);
                          const IconComp = cat === 'Transportation' ? Car : cat === 'Accommodation' ? Hotel : cat === 'Meal' ? Utensils : TicketIcon;

                          return (
                            <div 
                              key={`doc-item-${day.dayNumber}-${idx}`}
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80 flex items-center space-x-2 text-xs"
                            >
                              <IconComp className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                              <span className="font-semibold text-slate-800 truncate text-[11px]">{item.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inclusions & Exclusions 2-Column Grid */}
        <div className="px-8 sm:px-10 py-8 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-3">
            <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>What Is Included</span>
            </h3>
            <ul className="space-y-2">
              {proposal.inclusions.map((inc, i) => (
                <li key={`doc-inc-${i}`} className="text-xs text-slate-700 flex items-start space-x-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>What Is Not Included</span>
            </h3>
            <ul className="space-y-2">
              {proposal.exclusions.map((exc, i) => (
                <li key={`doc-exc-${i}`} className="text-xs text-slate-700 flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>{exc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Investment Pricing Summary */}
        <div className="px-8 sm:px-10 py-8 border-b border-slate-100 bg-slate-50/50">
          <div className="max-w-md ml-auto space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Total Package Investment
            </h3>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Party Size:</span>
                <span className="font-bold text-slate-900">{proposal.paxBreakdown || `${proposal.paxCount} Travelers`}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-bold text-slate-900">{proposal.durationDays} Days Private Touring</span>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-baseline">
              <span className="text-sm font-black text-slate-900">Total Net Investment:</span>
              <div className="text-right">
                <span className="text-2xl font-black text-orange-600 tracking-tight">
                  {proposal.currency} {Number(proposal.totalPrice).toLocaleString()}
                </span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  All taxes & service included
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="px-8 sm:px-10 py-8 border-b border-slate-100 space-y-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Booking Terms & Conditions
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-500 list-disc list-inside leading-relaxed">
            {proposal.termsAndConditions.map((term, i) => (
              <li key={`doc-term-${i}`}>{term}</li>
            ))}
          </ul>
        </div>

        {/* Signatures & Official Acceptance */}
        <div className="px-8 sm:px-10 py-10">
          <div className="grid grid-cols-2 gap-12 pt-6">
            <div className="space-y-12 text-center">
              <div className="border-b-2 border-slate-300 pb-2">
                <p className="text-xs font-extrabold text-slate-900">{proposal.companyName}</p>
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Authorized Representative
              </p>
            </div>

            <div className="space-y-12 text-center">
              <div className="border-b-2 border-slate-300 pb-2">
                <p className="text-xs font-extrabold text-slate-900">{proposal.guestName || 'Valued Guest'}</p>
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Client Acceptance & Confirmation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
