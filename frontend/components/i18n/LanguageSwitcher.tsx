'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe2 } from 'lucide-react';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'العربية' },
];

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [locale, setLocale] = useState(i18n.language || 'en');

  useEffect(() => {
    setLocale(i18n.language || 'en');
  }, [i18n.language]);

  const switchLanguage = (code: string) => {
    if (locale === code) return;
    i18n.changeLanguage(code).catch(() => undefined);
    window.localStorage.setItem('uniRideLanguage', code);
    document.documentElement.lang = code;
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    setLocale(code);
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/95 px-2 py-1 text-sm text-slate-300 shadow-sm shadow-black/20">
      <Globe2 className="h-4 w-4 text-cyan-300" aria-hidden="true" />
      <span className="sr-only">{t('languageSwitcher')}</span>
      <div className="inline-flex overflow-hidden rounded-full bg-slate-950/80 p-1">
        {languages.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => switchLanguage(item.code)}
            className={`rounded-full px-3 py-1 transition-all duration-200 ${
              locale === item.code
                ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
