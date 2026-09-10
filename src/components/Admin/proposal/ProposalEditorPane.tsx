import React from 'react';
import { 
  User, Mail, Phone, Globe, Users, Calendar, DollarSign, Percent, 
  Plus, Trash2, ChevronUp, ChevronDown, Sparkles, Search, Car, 
  Hotel, Utensils, Ticket as TicketIcon, CheckCircle2, Package, 
  Layers, RefreshCw, X, ShieldCheck
} from 'lucide-react';
import { InventoryItem, ProposalLineItem, getCategoryKey } from '../ProposalGenerator';

interface ProposalEditorPaneProps {
  guestName: string;
  setGuestName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  nationality: string;
  setNationality: (val: string) => void;
  adultsCount: number;
  setAdultsCount: (val: number) => void;
  childrenCount: number;
  setChildrenCount: (val: number) => void;
  durationDays: number;
  setDurationDays: React.Dispatch<React.SetStateAction<number>>;
  currency: string;
  setCurrency: (val: string) => void;
  marginPercentage: number;
  setMarginPercentage: (val: number) => void;
  isCustomPriceEnabled: boolean;
  setIsCustomPriceEnabled: (val: boolean) => void;
  customTotalPrice: number | string;
  setCustomTotalPrice: (val: number | string) => void;
  specialNotes: string;
  setSpecialNotes: (val: string) => void;
  selectedLineItems: ProposalLineItem[];
  setSelectedLineItems: React.Dispatch<React.SetStateAction<ProposalLineItem[]>>;
  selectedInclusions: string[];
  setSelectedInclusions: React.Dispatch<React.SetStateAction<string[]>>;
  selectedExclusions: string[];
  setSelectedExclusions: React.Dispatch<React.SetStateAction<string[]>>;
  masterInclusions: string[];
  masterExclusions: string[];
  pricingBreakdown: any;
  editingDayTitles: { [day: number]: string };
  setEditingDayTitles: React.Dispatch<React.SetStateAction<{ [day: number]: string }>>;
  inlineStopInput: { [day: number]: { name: string; type: string; price: number } };
  setInlineStopInput: React.Dispatch<React.SetStateAction<{ [day: number]: { name: string; type: string; price: number } }>>;
  onQuickAddCustomStop: (day: number, name: string, type: string, price?: number) => void;
  onMoveItemInDay: (globalIndex: number, direction: 'up' | 'down') => void;
  onRemoveLineItem: (index: number) => void;
  onOpenCatalogPicker: (dayNum: number) => void;
  onGenerateAIProposal: () => void;
  isGeneratingAI: boolean;
  incomingLeadsCount: number;
  onOpenIncomingLeads: () => void;
  onOpenTourCatalog: () => void;
  linkedInquiryId: string | null;
  onUnlinkInquiry: () => void;
  isDarkMode?: boolean;
}

export const ProposalEditorPane: React.FC<ProposalEditorPaneProps> = ({
  guestName,
  setGuestName,
  email,
  setEmail,
  phone,
  setPhone,
  nationality,
  setNationality,
  adultsCount,
  setAdultsCount,
  childrenCount,
  setChildrenCount,
  durationDays,
  setDurationDays,
  currency,
  setCurrency,
  marginPercentage,
  setMarginPercentage,
  isCustomPriceEnabled,
  setIsCustomPriceEnabled,
  customTotalPrice,
  setCustomTotalPrice,
  specialNotes,
  setSpecialNotes,
  selectedLineItems,
  setSelectedLineItems,
  selectedInclusions,
  setSelectedInclusions,
  selectedExclusions,
  setSelectedExclusions,
  masterInclusions,
  masterExclusions,
  pricingBreakdown,
  editingDayTitles,
  setEditingDayTitles,
  inlineStopInput,
  setInlineStopInput,
  onQuickAddCustomStop,
  onMoveItemInDay,
  onRemoveLineItem,
  onOpenCatalogPicker,
  onGenerateAIProposal,
  isGeneratingAI,
  incomingLeadsCount,
  onOpenIncomingLeads,
  onOpenTourCatalog,
  linkedInquiryId,
  onUnlinkInquiry,
  isDarkMode = false
}) => {
  const [customInclusionInput, setCustomInclusionInput] = React.useState('');
  const [customExclusionInput, setCustomExclusionInput] = React.useState('');

  const applyPresetInclusions = (preset: 'standard' | 'vip' | 'budget') => {
    if (preset === 'standard') {
      setSelectedInclusions([
        'Private AC Vehicle Charter with dedicated driver',
        'English-speaking licensed driver-guide',
        'Fuel, parking fees, and road tolls',
        'All entrance tickets & attraction admissions',
        'Complimentary bottled mineral water'
      ]);
      setSelectedExclusions([
        'Personal expenses and souvenir shopping',
        'Optional meals and beverages not specified',
        'Gratuities for driver / guide (voluntary)',
        'Travel insurance'
      ]);
    } else if (preset === 'vip') {
      setSelectedInclusions([
        'Luxury Private AC Vehicle Charter with personal chauffeur',
        'Licensed expert cultural tour guide',
        'All entrance tickets, donations, and fast-track admissions',
        'Daily gourmet lunch at premium scenic restaurants',
        'Bottled mineral water, refreshments, and cold towels',
        'Airport pickup and drop-off transfers',
        'Government taxes & service fees'
      ]);
      setSelectedExclusions([
        'Flight tickets',
        'Personal shopping & souvenir purchases',
        'Alcoholic beverages'
      ]);
    } else {
      setSelectedInclusions([
        'Private vehicle charter with AC',
        'Dedicated driver and fuel',
        'Bottled mineral water'
      ]);
      setSelectedExclusions([
        'Entrance tickets (paid directly on site)',
        'Meals and personal expenses',
        'Gratuities & tips'
      ]);
    }
  };

  const toggleInclusion = (text: string) => {
    setSelectedInclusions(prev => 
      prev.includes(text) ? prev.filter(i => i !== text) : [...prev, text]
    );
  };

  const toggleExclusion = (text: string) => {
    setSelectedExclusions(prev => 
      prev.includes(text) ? prev.filter(e => e !== text) : [...prev, text]
    );
  };

  return (
    <div className="space-y-6">
      {/* Studio Fast Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#111928] border border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenIncomingLeads}
            className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-extrabold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Planner Leads</span>
            {incomingLeadsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-black animate-pulse">
                {incomingLeadsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenTourCatalog}
            className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Import Tour</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
          >
            <option value="IDR">IDR (Rp)</option>
            <option value="USD">USD ($)</option>
            <option value="AUD">AUD (A$)</option>
            <option value="SGD">SGD (S$)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>

      {/* Linked Lead Status Banner */}
      {linkedInquiryId && (
        <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-orange-700 dark:text-orange-300 font-bold truncate">
            <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="truncate">Connected to AI Trip Planner Lead • {guestName}</span>
          </div>
          <button
            type="button"
            onClick={onUnlinkInquiry}
            className="text-[11px] text-gray-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer underline"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* CARD 1: Guest & Trip Profile */}
      <div className={`p-5 rounded-3xl border shadow-xs space-y-4 ${
        isDarkMode ? 'bg-[#111928] border-slate-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-xs flex items-center justify-center">
              1
            </div>
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Traveler Profile & Trip Info
            </h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Quick Fill</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
              Guest Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Alex Johnson"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-900'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
              WhatsApp / Mobile *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. +62 812-3456-7890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-900'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="email"
                placeholder="e.g. alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-900'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
              Nationality / Country
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Australia / United States"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Pax & Duration Row */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-center">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Adults
            </label>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-slate-800 font-black text-xs hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-black text-gray-900 dark:text-white w-6">{adultsCount}</span>
              <button
                type="button"
                onClick={() => setAdultsCount(adultsCount + 1)}
                className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-slate-800 font-black text-xs hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-center">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Children
            </label>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-slate-800 font-black text-xs hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-black text-gray-900 dark:text-white w-6">{childrenCount}</span>
              <button
                type="button"
                onClick={() => setChildrenCount(childrenCount + 1)}
                className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-slate-800 font-black text-xs hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-center">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Duration (Days)
            </label>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDurationDays(prev => Math.max(1, prev - 1))}
                className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-slate-800 font-black text-xs hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-black text-gray-900 dark:text-white w-6">{durationDays}</span>
              <button
                type="button"
                onClick={() => setDurationDays(prev => prev + 1)}
                className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-slate-800 font-black text-xs hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: Day-by-Day Unified Timeline Builder */}
      <div className={`p-5 rounded-3xl border shadow-xs space-y-4 ${
        isDarkMode ? 'bg-[#111928] border-slate-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-xs flex items-center justify-center">
              2
            </div>
            <div>
              <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Day-by-Day Timeline ({durationDays} Days)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDurationDays(prev => prev + 1)}
            className="px-3 py-1 rounded-xl text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Day</span>
          </button>
        </div>

        {/* Days List */}
        <div className="space-y-4">
          {Array.from({ length: durationDays }, (_, idx) => {
            const dayNum = idx + 1;
            const itemsInThisDay = selectedLineItems.filter(i => i.day === dayNum);
            const daySubtotal = itemsInThisDay.reduce((sum, item) => sum + item.subtotal, 0);
            const currentTitle = editingDayTitles[dayNum] || `Day ${dayNum}: Exploration`;

            return (
              <div 
                key={`unified-day-card-${dayNum}`}
                className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-gray-200'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="px-2.5 py-1 bg-orange-500 text-white rounded-lg text-xs font-black shrink-0">
                      Day {dayNum}
                    </span>
                    <input
                      type="text"
                      value={currentTitle}
                      onChange={(e) => setEditingDayTitles(prev => ({ ...prev, [dayNum]: e.target.value }))}
                      placeholder={`Day ${dayNum} Title...`}
                      className={`flex-1 px-2.5 py-1 text-xs font-bold rounded-lg border focus:outline-none focus:ring-1 focus:ring-orange-500 truncate ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                      {currency} {daySubtotal.toLocaleString()}
                    </span>

                    {durationDays > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete Day ${dayNum} and its stops?`)) {
                            setSelectedLineItems(prev => prev.filter(i => i.day !== dayNum).map(i => i.day > dayNum ? { ...i, day: i.day - 1 } : i));
                            setDurationDays(prev => Math.max(1, prev - 1));
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove day"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Day Line Items */}
                {itemsInThisDay.length === 0 ? (
                  <div className="py-2.5 px-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-800 text-center">
                    <p className="text-[11px] text-gray-400">No stops added yet. Type below or pick from catalog.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {itemsInThisDay.map((item) => {
                      const globalIndex = selectedLineItems.findIndex(x => x === item);
                      const cat = getCategoryKey(item.type);
                      const IconComponent = cat === 'Transportation' ? Car : cat === 'Accommodation' ? Hotel : cat === 'Meal' ? Utensils : TicketIcon;
                      const badgeColor = cat === 'Transportation' ? 'bg-blue-500/10 text-blue-600' : cat === 'Accommodation' ? 'bg-purple-500/10 text-purple-600' : cat === 'Meal' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600';

                      return (
                        <div 
                          key={`item-${globalIndex}-${item.name}`}
                          className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2.5 text-xs transition-all ${
                            isDarkMode ? 'bg-slate-800 border-slate-700/80 text-white' : 'bg-white border-gray-200/90 text-gray-900 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`p-1.5 rounded-lg shrink-0 ${badgeColor}`}>
                              <IconComponent className="w-3 h-3" />
                            </span>
                            <div className="truncate">
                              <span className="font-bold block truncate text-xs">{item.name}</span>
                              {item.description && (
                                <span className="text-[10px] text-gray-400 block truncate">{item.description}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-extrabold text-gray-700 dark:text-gray-300 text-xs">
                              {item.subtotal === 0 ? 'Included' : `${currency} ${item.subtotal.toLocaleString()}`}
                            </span>

                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => onMoveItemInDay(globalIndex, 'up')}
                                className="text-gray-400 hover:text-orange-500 cursor-pointer"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onMoveItemInDay(globalIndex, 'down')}
                                className="text-gray-400 hover:text-orange-500 cursor-pointer"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => onRemoveLineItem(globalIndex)}
                              className="text-gray-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                              title="Delete stop"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline Quick Add Stop Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="+ Quick stop name (e.g. Uluwatu Temple, Lunch at Jimbaran)..."
                    value={inlineStopInput[dayNum]?.name || ''}
                    onChange={(e) => setInlineStopInput(prev => ({
                      ...prev,
                      [dayNum]: {
                        name: e.target.value,
                        type: prev[dayNum]?.type || 'Attraction',
                        price: prev[dayNum]?.price || 0
                      }
                    }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = inlineStopInput[dayNum];
                        if (input && input.name.trim()) {
                          onQuickAddCustomStop(dayNum, input.name.trim(), input.type, input.price);
                          setInlineStopInput(prev => ({ ...prev, [dayNum]: { name: '', type: input.type, price: 0 } }));
                        }
                      }
                    }}
                    className={`flex-1 min-w-[140px] px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                    }`}
                  />
                  <select
                    value={inlineStopInput[dayNum]?.type || 'Attraction'}
                    onChange={(e) => setInlineStopInput(prev => ({
                      ...prev,
                      [dayNum]: {
                        name: prev[dayNum]?.name || '',
                        type: e.target.value,
                        price: prev[dayNum]?.price || 0
                      }
                    }))}
                    className={`px-2 py-1.5 text-xs rounded-xl border focus:outline-none ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="Attraction">🎫 Attraction</option>
                    <option value="Transportation">🚗 Transport</option>
                    <option value="Meal">🍽️ Meal</option>
                    <option value="Accommodation">🏨 Stay</option>
                    <option value="Other">📦 Other</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const input = inlineStopInput[dayNum];
                      if (input && input.name.trim()) {
                        onQuickAddCustomStop(dayNum, input.name.trim(), input.type, input.price);
                        setInlineStopInput(prev => ({ ...prev, [dayNum]: { name: '', type: input.type, price: 0 } }));
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenCatalogPicker(dayNum)}
                    className="px-3 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Search className="w-3 h-3" />
                    <span>Catalog</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CARD 3: Inclusions & Exclusions Smart Presets */}
      <div className={`p-5 rounded-3xl border shadow-xs space-y-4 ${
        isDarkMode ? 'bg-[#111928] border-slate-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-xs flex items-center justify-center">
              3
            </div>
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Inclusions & Exclusions
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Presets:</span>
            <button
              type="button"
              onClick={() => applyPresetInclusions('standard')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/10 hover:text-orange-600 cursor-pointer transition-colors"
            >
              Standard Private
            </button>
            <button
              type="button"
              onClick={() => applyPresetInclusions('vip')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/10 hover:text-orange-600 cursor-pointer transition-colors"
            >
              All-Inclusive VIP
            </button>
            <button
              type="button"
              onClick={() => applyPresetInclusions('budget')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/10 hover:text-orange-600 cursor-pointer transition-colors"
            >
              Charter Only
            </button>
          </div>
        </div>

        {/* Inclusions Chips */}
        <div className="space-y-2">
          <label className="block text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            ✓ Inclusions ({selectedInclusions.length} items active)
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
            {masterInclusions.map((item, idx) => {
              const isSelected = selectedInclusions.includes(item);
              return (
                <button
                  key={`inc-chip-${idx}`}
                  type="button"
                  onClick={() => toggleInclusion(item)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                      : isDarkMode
                      ? 'bg-slate-900 border-slate-800 text-gray-400 hover:text-gray-200'
                      : 'bg-slate-50 border-gray-200 text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {isSelected ? '✓ ' : '+ '}
                  {item}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="+ Type custom inclusion and press Enter..."
              value={customInclusionInput}
              onChange={(e) => setCustomInclusionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customInclusionInput.trim()) {
                  setSelectedInclusions(prev => [...prev, customInclusionInput.trim()]);
                  setCustomInclusionInput('');
                }
              }}
              className={`flex-1 px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-900'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                if (customInclusionInput.trim()) {
                  setSelectedInclusions(prev => [...prev, customInclusionInput.trim()]);
                  setCustomInclusionInput('');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Exclusions Chips */}
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800/80">
          <label className="block text-[11px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            ✕ Exclusions ({selectedExclusions.length} items active)
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
            {masterExclusions.map((item, idx) => {
              const isSelected = selectedExclusions.includes(item);
              return (
                <button
                  key={`exc-chip-${idx}`}
                  type="button"
                  onClick={() => toggleExclusion(item)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 font-bold shadow-xs'
                      : isDarkMode
                      ? 'bg-slate-900 border-slate-800 text-gray-400 hover:text-gray-200'
                      : 'bg-slate-50 border-gray-200 text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {isSelected ? '✕ ' : '+ '}
                  {item}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="+ Type custom exclusion and press Enter..."
              value={customExclusionInput}
              onChange={(e) => setCustomExclusionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customExclusionInput.trim()) {
                  setSelectedExclusions(prev => [...prev, customExclusionInput.trim()]);
                  setCustomExclusionInput('');
                }
              }}
              className={`flex-1 px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-900'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                if (customExclusionInput.trim()) {
                  setSelectedExclusions(prev => [...prev, customExclusionInput.trim()]);
                  setCustomExclusionInput('');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer hover:bg-rose-700"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* CARD 4: Pricing & Margin Engine */}
      <div className={`p-5 rounded-3xl border shadow-xs space-y-4 ${
        isDarkMode ? 'bg-[#111928] border-slate-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-xs flex items-center justify-center">
              4
            </div>
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Pricing & Margin Engine
            </h3>
          </div>
          <span className="text-xs font-bold text-gray-500">Live Auto-Calculation</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <span className="text-[10px] text-gray-400 block font-bold uppercase">Base Logistics Cost</span>
            <span className="text-sm font-black text-gray-900 dark:text-white">
              {currency} {pricingBreakdown.baseSubtotal.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <span className="text-[10px] text-gray-400 block font-bold uppercase">Profit Margin ({marginPercentage}%)</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              +{currency} {pricingBreakdown.marginAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Margin Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-gray-600 dark:text-gray-400">Target Profit Margin:</span>
            <span className="px-2 py-0.5 rounded-lg bg-orange-500 text-white font-black text-[11px]">
              {marginPercentage}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="1"
            value={marginPercentage}
            onChange={(e) => setMarginPercentage(Number(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>0% (Cost)</span>
            <span>15% (Standard)</span>
            <span>30% (Recommended)</span>
            <span>60% (VIP)</span>
          </div>
        </div>

        {/* Custom Price Override Toggle */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCustomPriceEnabled}
              onChange={(e) => setIsCustomPriceEnabled(e.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Manual Total Price Override
            </span>
          </label>

          {isCustomPriceEnabled && (
            <div className="pt-1">
              <input
                type="number"
                placeholder="Enter exact custom total price..."
                value={customTotalPrice}
                onChange={(e) => setCustomTotalPrice(e.target.value)}
                className={`w-full px-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}
              />
            </div>
          )}
        </div>

        {/* Final Total Badge */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between shadow-md shadow-orange-500/20">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">Total Proposal Investment</span>
            <span className="text-lg font-black">
              {currency} {pricingBreakdown.finalTotalPrice.toLocaleString()}
            </span>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-xs">
            {adultsCount + childrenCount} Travelers
          </span>
        </div>
      </div>

      {/* CARD 5: Special Preferences & AI Storytelling Polish */}
      <div className={`p-5 rounded-3xl border shadow-xs space-y-4 ${
        isDarkMode ? 'bg-[#111928] border-slate-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-xs flex items-center justify-center">
              5
            </div>
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Special Preferences & AI Storyteller
            </h3>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
            Guest Dietary, Pace or Special Notes
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Vegetarian meals preferred, relaxed photography pace, celebration of wedding anniversary..."
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            className={`w-full p-3 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white placeholder:text-gray-500' : 'bg-slate-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
            }`}
          />
        </div>

        <button
          type="button"
          onClick={onGenerateAIProposal}
          disabled={isGeneratingAI}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
        >
          {isGeneratingAI ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating AI Narrative with Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>✨ Polish Itinerary with AI Narrative & Highlights</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
