import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/messages/en.json';
import ar from '@/messages/ar.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'ar'],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
