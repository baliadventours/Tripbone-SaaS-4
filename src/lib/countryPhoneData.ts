export interface CountryItem {
  name: string;
  code: string; // ISO 2-letter
  dialCode: string;
  flag: string;
}

export const COUNTRIES: CountryItem[] = [
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳' },
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: '🇨🇭' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852', flag: '🇭🇰' },
  { name: 'Taiwan', code: 'TW', dialCode: '+886', flag: '🇹🇼' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Turkey', code: 'TR', dialCode: '+90', flag: '🇹🇷' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'Russia', code: 'RU', dialCode: '+7', flag: '🇷🇺' },
  { name: 'Sweden', code: 'SE', dialCode: '+46', flag: '🇸🇪' },
  { name: 'Norway', code: 'NO', dialCode: '+47', flag: '🇳🇴' },
  { name: 'Denmark', code: 'DK', dialCode: '+45', flag: '🇩🇰' },
  { name: 'Finland', code: 'FI', dialCode: '+358', flag: '🇫🇮' },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪' },
  { name: 'Portugal', code: 'PT', dialCode: '+351', flag: '🇵🇹' },
  { name: 'Austria', code: 'AT', dialCode: '+43', flag: '🇦🇹' },
  { name: 'Belgium', code: 'BE', dialCode: '+32', flag: '🇧🇪' },
  { name: 'Poland', code: 'PL', dialCode: '+48', flag: '🇵🇱' },
  { name: 'Czech Republic', code: 'CZ', dialCode: '+420', flag: '🇨🇿' },
  { name: 'Greece', code: 'GR', dialCode: '+30', flag: '🇬🇷' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973', flag: '🇧🇭' },
  { name: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { name: 'Israel', code: 'IL', dialCode: '+972', flag: '🇮🇱' },
  { name: 'Argentina', code: 'AR', dialCode: '+54', flag: '🇦🇷' },
  { name: 'Chile', code: 'CL', dialCode: '+56', flag: '🇨🇱' },
  { name: 'Colombia', code: 'CO', dialCode: '+57', flag: '🇨🇴' },
  { name: 'Peru', code: 'PE', dialCode: '+51', flag: '🇵🇪' }
];

/**
 * Automatically detects user country from timezone or browser locale
 */
export function detectUserCountry(): CountryItem {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Jakarta') || tz.includes('Makassar') || tz.includes('Jayapura') || tz.includes('Pontianak') || tz.includes('Indonesia')) {
      return COUNTRIES.find(c => c.code === 'ID') || COUNTRIES[0];
    }
    if (tz.includes('Australia') || tz.includes('Sydney') || tz.includes('Melbourne') || tz.includes('Brisbane') || tz.includes('Perth')) {
      return COUNTRIES.find(c => c.code === 'AU') || COUNTRIES[1];
    }
    if (tz.includes('America') || tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('Chicago')) {
      return COUNTRIES.find(c => c.code === 'US') || COUNTRIES[2];
    }
    if (tz.includes('London') || tz.includes('Europe/Belfast')) {
      return COUNTRIES.find(c => c.code === 'GB') || COUNTRIES[3];
    }
    if (tz.includes('Singapore')) {
      return COUNTRIES.find(c => c.code === 'SG') || COUNTRIES[4];
    }
    if (tz.includes('Kuala_Lumpur')) {
      return COUNTRIES.find(c => c.code === 'MY') || COUNTRIES[5];
    }
    if (tz.includes('Berlin') || tz.includes('Germany')) {
      return COUNTRIES.find(c => c.code === 'DE') || COUNTRIES[6];
    }
    if (tz.includes('Paris')) {
      return COUNTRIES.find(c => c.code === 'FR') || COUNTRIES[7];
    }
    if (tz.includes('Amsterdam')) {
      return COUNTRIES.find(c => c.code === 'NL') || COUNTRIES[8];
    }
    if (tz.includes('Auckland')) {
      return COUNTRIES.find(c => c.code === 'NZ') || COUNTRIES[9];
    }
    if (tz.includes('Tokyo')) {
      return COUNTRIES.find(c => c.code === 'JP') || COUNTRIES[10];
    }
  } catch (e) {}

  // Fallback check browser language
  try {
    const lang = (navigator.language || '').toLowerCase();
    if (lang.includes('id')) return COUNTRIES.find(c => c.code === 'ID') || COUNTRIES[0];
    if (lang.includes('au')) return COUNTRIES.find(c => c.code === 'AU') || COUNTRIES[1];
    if (lang.includes('gb')) return COUNTRIES.find(c => c.code === 'GB') || COUNTRIES[3];
    if (lang.includes('de')) return COUNTRIES.find(c => c.code === 'DE') || COUNTRIES[6];
    if (lang.includes('fr')) return COUNTRIES.find(c => c.code === 'FR') || COUNTRIES[7];
  } catch (e) {}

  return COUNTRIES[0]; // Default Indonesia / or US
}

/**
 * Cleanly formats a phone number into international standard E.164
 */
export function formatE164Phone(rawPhone: string, dialCode: string): string {
  if (!rawPhone) return '';
  const digitsOnly = rawPhone.replace(/[^\d+]/g, '');
  if (!digitsOnly) return '';

  if (digitsOnly.startsWith('+')) {
    return digitsOnly;
  }

  const cleanDial = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;

  // If local number starts with 0 (e.g. 0812...), strip the leading 0
  if (digitsOnly.startsWith('0')) {
    return `${cleanDial}${digitsOnly.slice(1)}`;
  }

  // If already starts with dial code digits without +, add +
  const dialDigits = cleanDial.replace('+', '');
  if (digitsOnly.startsWith(dialDigits)) {
    return `+${digitsOnly}`;
  }

  return `${cleanDial}${digitsOnly}`;
}
