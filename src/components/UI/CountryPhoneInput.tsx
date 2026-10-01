import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check, Smartphone, MessageSquare } from 'lucide-react';
import { COUNTRIES, CountryItem, detectUserCountry, formatE164Phone } from '../../lib/countryPhoneData';
import { cn } from '../../lib/utils';

export interface CountryPhoneValue {
  phone: string;
  whatsapp: string;
  country: string;
  countryCode: string;
  dialCode: string;
  rawPhone: string;
  rawWhatsapp?: string;
  isSameAsWhatsapp: boolean;
}

interface CountryPhoneInputProps {
  value?: Partial<CountryPhoneValue>;
  onChange: (val: CountryPhoneValue) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputBg?: string;
  theme?: 'light' | 'dark';
  label?: string;
  showWhatsappToggle?: boolean;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  value,
  onChange,
  required = true,
  disabled = false,
  className,
  inputBg = 'bg-gray-50',
  theme = 'light',
  label = 'Country & Phone / WhatsApp Number',
  showWhatsappToggle = true
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(() => {
    if (value?.countryCode) {
      const match = COUNTRIES.find(c => c.code.toLowerCase() === value.countryCode?.toLowerCase());
      if (match) return match;
    }
    return detectUserCountry();
  });

  const [rawPhone, setRawPhone] = useState(value?.rawPhone || '');
  const [rawWhatsapp, setRawWhatsapp] = useState(value?.rawWhatsapp || '');
  const [isSameAsWhatsapp, setIsSameAsWhatsapp] = useState(
    value?.isSameAsWhatsapp !== undefined ? value.isSameAsWhatsapp : true
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isDropdownOpen]);

  // Sync emitted values to parent whenever values update
  useEffect(() => {
    const formattedPhone = formatE164Phone(rawPhone, selectedCountry.dialCode);
    const formattedWhatsapp = isSameAsWhatsapp 
      ? formattedPhone 
      : formatE164Phone(rawWhatsapp, selectedCountry.dialCode);

    onChangeRef.current({
      phone: formattedPhone,
      whatsapp: formattedWhatsapp,
      country: selectedCountry.name,
      countryCode: selectedCountry.code,
      dialCode: selectedCountry.dialCode,
      rawPhone,
      rawWhatsapp,
      isSameAsWhatsapp
    });
  }, [rawPhone, rawWhatsapp, selectedCountry, isSameAsWhatsapp]);

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dialCode.includes(searchQuery) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDark = theme === 'dark';

  return (
    <div className={cn("space-y-2.5 w-full text-left font-sans", className)}>
      {/* Country & Phone Number Group */}
      <div className="space-y-1.5">
        {label && (
          <label className={cn(
            "block text-[11px] font-black uppercase tracking-wider",
            isDark ? "text-gray-300" : "text-gray-700"
          )}>
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div className="flex rounded-xl shadow-xs border border-gray-200 focus-within:border-[#00b272] focus-within:ring-2 focus-within:ring-[#00b272]/20 transition-all bg-white relative">
          {/* Country Selector Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                "h-full px-3 py-2.5 flex items-center gap-1.5 border-r border-gray-200 transition-colors shrink-0 rounded-l-xl cursor-pointer",
                inputBg,
                "hover:bg-gray-100/80 disabled:opacity-60"
              )}
            >
              <span className="text-lg leading-none select-none">{selectedCountry.flag}</span>
              <span className="text-xs font-bold text-gray-800 select-none">{selectedCountry.dialCode}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", isDropdownOpen && "rotate-180")} />
            </button>

            {/* Country Search Dropdown Popup */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 max-h-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95">
                <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search country or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs font-medium bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-1">
                  {filteredCountries.map((country) => {
                    const isSelected = country.code === selectedCountry.code;
                    return (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(country);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-xs flex items-center justify-between rounded-lg transition-colors text-left cursor-pointer",
                          isSelected ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-gray-50 text-gray-700"
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-base select-none">{country.flag}</span>
                          <span className="truncate">{country.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[11px] font-mono text-gray-400">{country.dialCode}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                        </div>
                      </button>
                    );
                  })}
                  {filteredCountries.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-400">
                      No country found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Phone Input Box */}
          <div className="relative flex-1">
            <input
              type="tel"
              inputMode="tel"
              placeholder="e.g. 812 3456 7890"
              value={rawPhone}
              onChange={(e) => setRawPhone(e.target.value)}
              disabled={disabled}
              required={required}
              className={cn(
                "w-full px-3.5 py-3 text-xs md:text-sm font-semibold rounded-r-xl outline-none transition-all placeholder:text-gray-400 text-gray-900 disabled:opacity-60",
                inputBg
              )}
            />
          </div>
        </div>
      </div>

      {/* Unified WhatsApp Checkbox */}
      {showWhatsappToggle && (
        <div className="pt-0.5">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={isSameAsWhatsapp}
              onChange={(e) => setIsSameAsWhatsapp(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition cursor-pointer"
            />
            <span className={cn(
              "text-xs font-semibold transition-colors flex items-center gap-1.5",
              isDark ? "text-gray-300" : "text-gray-600",
              "group-hover:text-emerald-700"
            )}>
              <MessageSquare className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              This phone number is also my active WhatsApp
            </span>
          </label>
        </div>
      )}

      {/* Optional Separate WhatsApp Input if Unchecked */}
      {showWhatsappToggle && !isSameAsWhatsapp && (
        <div className="space-y-1.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <label className={cn(
            "block text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5",
            isDark ? "text-gray-300" : "text-gray-700"
          )}>
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            Dedicated WhatsApp Number {required && <span className="text-red-500">*</span>}
          </label>
          <div className="flex rounded-xl border border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-white">
            <span className="px-3.5 py-2.5 bg-gray-50 border-r border-gray-200 text-xs font-bold text-gray-600 rounded-l-xl flex items-center">
              {selectedCountry.dialCode}
            </span>
            <input
              type="tel"
              inputMode="tel"
              placeholder="e.g. 812 9876 5432"
              value={rawWhatsapp}
              onChange={(e) => setRawWhatsapp(e.target.value)}
              disabled={disabled}
              required={required && !isSameAsWhatsapp}
              className={cn(
                "w-full px-3.5 py-2.5 text-xs font-semibold rounded-r-xl outline-none placeholder:text-gray-400 text-gray-900",
                inputBg
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
};
