import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
];

const DEFAULT_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  AUD: 1.50,
  CAD: 1.36,
  JPY: 158.0,
  CNY: 7.25,
  SGD: 1.35,
  IDR: 16200.0,
  CHF: 0.90
};

interface CurrencyContextType {
  selectedCurrency: string;
  setCurrency: (code: string) => void;
  rates: Record<string, number>;
  convert: (amount: number, from?: string) => number;
  formatPrice: (amount: number, from?: string) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return localStorage.getItem('preferred_currency') || 'USD';
  });
  const [rates, setRates] = useState<Record<string, number>>(() => {
    try {
      const cached = localStorage.getItem('currency_rates_cache');
      if (cached) {
        const { rates: cachedRates } = JSON.parse(cached);
        return { ...DEFAULT_RATES, ...cachedRates };
      }
    } catch (e) {}
    return DEFAULT_RATES;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRates = async (force = false) => {
      try {
        const cached = localStorage.getItem('currency_rates_cache');
        if (cached && !force) {
          const { rates: cachedRates, timestamp } = JSON.parse(cached);
          // 24 hour cache
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            setRates(prev => ({ ...DEFAULT_RATES, ...cachedRates }));
            return;
          }
        }

        let data: any = null;
        try {
          // Priority 1: Official open ExchangeRate API (Free, high availability, no key required)
          const response = await fetch('https://open.er-api.com/v6/latest/USD');
          if (response.ok) {
            data = await response.json();
          }
        } catch (e) {
          // Priority 2: Fallback to custom key if set
          const apiKey = import.meta.env.VITE_CURRENCY_API_KEY;
          if (apiKey) {
            const fallbackRes = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
            if (fallbackRes.ok) {
              data = await fallbackRes.json();
            }
          }
        }
        
        if (data && (data.result === 'success' || data.rates || data.conversion_rates)) {
          const newRates = data.rates || data.conversion_rates || {};
          const fetchedRates = { ...DEFAULT_RATES, ...newRates };
          setRates(fetchedRates);
          localStorage.setItem('currency_rates_cache', JSON.stringify({
            rates: fetchedRates,
            timestamp: Date.now()
          }));
        } else {
          setRates(DEFAULT_RATES);
        }
      } catch (error) {
        console.warn('Currency rate update notice: using default currency matrix.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  const setCurrency = (code: string) => {
    setSelectedCurrency(code);
    localStorage.setItem('preferred_currency', code);
  };

  const convert = (amount: number, from: string = 'USD') => {
    if (from === selectedCurrency) return amount;
    // Base everything on USD
    const amountInUSD = from === 'USD' ? amount : amount / (rates[from] || 1);
    return amountInUSD * (rates[selectedCurrency] || 1);
  };

  const formatPrice = (amount: number, from: string = 'USD') => {
    const converted = convert(amount, from);
    const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);
    const symbol = currencyInfo?.symbol || '$';
    
    return `${symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: selectedCurrency === 'IDR' ? 0 : 2,
      maximumFractionDigits: selectedCurrency === 'IDR' ? 0 : 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setCurrency, rates, convert, formatPrice, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
