// frontend/src/components/i18n/LanguageProvider.tsx
'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'en' | 'es' | 'fr';

type Dict = Record<string, Record<Lang, string>>;

const DICT: Dict = {
  'nav.register': { en: 'Register', es: 'Registrarse', fr: 'S’inscrire' },
  'nav.login': { en: 'Login', es: 'Iniciar sesión', fr: 'Se connecter' },
  'nav.dashboard': { en: 'Dashboard', es: 'Tablero', fr: 'Tableau de bord' },
  'nav.payers': { en: 'Payers', es: 'Pagadores', fr: 'Annonceurs' },
  'nav.workers': { en: 'Workers', es: 'Trabajadores', fr: 'Écouteurs' },
  'nav.marketplace': { en: 'Marketplace', es: 'Mercado', fr: 'Marché' },
  'nav.profile': { en: 'Profile', es: 'Perfil', fr: 'Profil' },
  'footer.language': { en: 'Language', es: 'Idioma', fr: 'Langue' },
};

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof DICT) => string;
  languages: { code: Lang; label: string }[];
}

const I18nCtx = createContext<Ctx | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && (localStorage.getItem('lang') as Lang)) || null;
    const browser = (typeof navigator !== 'undefined' && (navigator.language || '').slice(0, 2)) as Lang;
    const initial = (saved || (['en','es','fr'].includes(browser) ? browser : 'en')) as Lang;
    setLangState(initial);
    if (typeof document !== 'undefined') document.documentElement.lang = initial;
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem('lang', l);
    if (typeof document !== 'undefined') document.documentElement.lang = l;
  };

  const t = (key: keyof typeof DICT) => DICT[key]?.[lang] ?? (DICT[key]?.en ?? String(key));

  const value = useMemo<Ctx>(() => ({
    lang,
    setLang,
    t,
    languages: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' },
      { code: 'fr', label: 'Français' },
    ],
  }), [lang]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider');
  return ctx;
}