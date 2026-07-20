// src/context/LanguageContext.jsx
// Contexte global de langue. Avant, `lang` n'était transmis qu'à la page
// d'accueil et à la barre de navigation (props), donc toutes les autres
// pages (tableaux de bord, catalogue, profils, etc.) restaient figées en
// français. Ce contexte rend `lang` / `toggleLang` / `t` disponibles
// partout via le hook `useLanguage()`, sans avoir à faire passer des props
// à travers chaque écran.
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'agriconnect_lang';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'en' || saved === 'fr' ? saved : 'fr';
    } catch {
      return 'fr';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore (mode privé, etc.)
    }
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'fr' ? 'en' : 'fr'));
  }, []);

  // Traducteur générique : accepte soit une clé présente dans le
  // dictionnaire partagé (voir translations.js), soit directement une
  // paire { fr, en }. Retourne le texte français si aucune traduction
  // n'est trouvée (comportement de repli sûr).
  const t = useCallback(
    (key, dict) => {
      if (dict && typeof dict === 'object') {
        return dict[lang] ?? dict.fr ?? key;
      }
      return key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Repli sûr si un composant est utilisé hors du Provider (ex. tests)
    return { lang: 'fr', toggleLang: () => {}, setLang: () => {}, t: (k, d) => (d ? d.fr : k) };
  }
  return ctx;
}

// Petit utilitaire pour les composants qui définissent leur propre
// dictionnaire local `{ fr: {...}, en: {...} }` (même convention que
// NavigationConsole). Retourne l'objet de traductions courant.
export function useDict(dictionary) {
  const { lang } = useLanguage();
  return dictionary[lang] || dictionary.fr;
}
