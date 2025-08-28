// src/app/components/Footer.tsx
'use client';
import { useI18n } from '@/components/i18n/LanguageProvider';

export default function Footer() {
  const { lang, setLang, languages, t } = useI18n();

  return (
    <footer className="w-full bg-black text-white py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
        {/* Left: Logo or Name */}
        <div className="flex items-center gap-2">
          <img src="/assets/logo/BuzzWorkLargeLight.svg" alt="Logo" className="h-10 w-auto" />
          <span>© {new Date().getFullYear()} BuzzWork. All rights reserved.</span>
        </div>

        {/* Right: Links + Language */}
        <div className="flex items-center gap-6">
          <img src="/assets/Socials.svg" alt="Socials" className="h-8 w-auto" />
          <a href="/privacy" className="hover:underline">Privacy</a>
          <a href="/terms" className="hover:underline">Terms</a>
          <a href="mailto:contact@buzzwork.com" className="hover:underline">Contact</a>

          {/* Language selector */}
          <label className="ml-2 flex items-center gap-2">
            <span className="opacity-80 hidden sm:inline">{t('footer.language')}</span>
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                className="footer-select rounded-full border border-white/20 bg-white/10 px-4 py-1.5 pr-8 text-white/90 focus:outline-none focus:ring-2 focus:ring-white/40 hover:bg-white/15"
                aria-label="Select language"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-black text-white">
                    {l.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70">▾</span>
            </div>
          </label>
        </div>
      </div>
    </footer>
  );
}