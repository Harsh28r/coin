import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CurrencyContextType {
  currency: string;
  locale: string;
  formatPrice: (price: number, currencyCode?: string) => string;
  setCurrency: (currency: string) => void;
  setLocale: (locale: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<string>('USD');
  const [locale, setLocaleState] = useState<string>('en-US');

  const formatPrice = (price: number, currencyCode?: string): string => {
    const currencyToUse = currencyCode || currency;
    const localeToUse = locale;
    
    try {
      return new Intl.NumberFormat(localeToUse, {
        style: 'currency',
        currency: currencyToUse,
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      }).format(price);
    } catch (error) {
      // Fallback formatting if the locale or currency is not supported
      return `${currencyToUse} ${price.toFixed(2)}`;
    }
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
  };

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
  };

  const value: CurrencyContextType = {
    currency,
    locale,
    formatPrice,
    setCurrency,
    setLocale,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
} 
