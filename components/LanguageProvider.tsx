'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  isLanguage,
  translations,
  type Language,
  type TranslationKey,
} from '../lib/i18n';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const queryLanguage = new URLSearchParams(window.location.search).get('lang');
    let savedLanguage: string | null = null;
    try {
      savedLanguage = window.localStorage.getItem('d10g3n_language');
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
    const browserLanguage = navigator.language.split('-')[0];
    const initial = isLanguage(queryLanguage)
      ? queryLanguage
      : isLanguage(savedLanguage)
        ? savedLanguage
        : isLanguage(browserLanguage)
          ? browserLanguage
          : 'en';
    setLanguageState(initial);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage(nextLanguage) {
      setLanguageState(nextLanguage);
      try {
        window.localStorage.setItem('d10g3n_language', nextLanguage);
      } catch {
        // The in-memory selection still works when persistence is denied.
      }
    },
    t: (key) => translations[language][key],
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
