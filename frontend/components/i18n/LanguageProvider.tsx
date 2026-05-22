'use client';

import { ReactNode, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('uniRideLanguage') : null;
    const locale = stored === 'ar' ? 'ar' : 'en';
    i18n.changeLanguage(locale).catch(() => undefined);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    setReady(true);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'uniRideLanguage' && (event.newValue === 'en' || event.newValue === 'ar')) {
        const newLocale = event.newValue;
        i18n.changeLanguage(newLocale).catch(() => undefined);
        document.documentElement.lang = newLocale;
        document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!ready) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
