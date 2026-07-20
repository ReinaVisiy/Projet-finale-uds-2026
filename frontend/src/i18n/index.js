// src/i18n/index.js
// Initialisation d'i18next. Remplace l'ancien LanguageContext maison :
// la langue active est gérée par i18next (avec persistance en
// localStorage) et chaque composant récupère ses traductions via le hook
// useTranslation() de react-i18next au lieu du hook useDict() maison.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr/translation.json';
import en from './locales/en/translation.json';

const STORAGE_KEY = 'agriconnect_lang';

function getSavedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' || saved === 'fr' ? saved : 'fr';
  } catch {
    return 'fr';
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: getSavedLanguage(),
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },
  });

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore (mode privé, etc.)
  }
});

export default i18n;
