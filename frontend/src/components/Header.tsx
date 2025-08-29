// // frontend/src/components/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from '@/components/i18n/LanguageProvider';
import type { ReactNode } from "react";

export default function Header() {
  const [breathe, setBreathe] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useI18n();

  // Breathing animation toggle
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathe((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  const buttons: { href: string; label: string | ReactNode; variant?: "primary" | "outline" | "ghost" }[] = [
    { href: "/register", label: t('nav.register'), variant: "primary" },
    { href: "/login", label: t('nav.login'), variant: "outline" },
    { href: "/payer/dashboard", label: t('nav.payers'), variant: "ghost" },
    { href: "/worker/dashboard", label: t('nav.workers'), variant: "ghost" },
    { href: "/jobs", label: t('nav.marketplace'), variant: "ghost" },
    { href: "/profile", label: <Image src="/assets/icons/honeycomb.svg" alt="Profile" width={30} height={30} />, variant: "ghost" },
  ];

  const baseBtn =
    "inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 hover:scale-[1.02] active:scale-[0.99]";

  const styles: Record<string, string> = {
    primary: "bg-[--brand] text-white shadow-lg shadow-[--brand]/30 hover:brightness-110 hover:border border-white/25",
    outline: "border border-white/25 text-white/90 hover:bg-white/10",
    ghost: "text-white/85 hover:bg-white/10",
  };

  return (
    <header
      className={`fixed top-4 left-0 w-full z-50 transition-transform duration-500 ease-in-out ${
        scrolled ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`rounded-2xl px-4 sm:px-6 py-3 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out bg-white/10`} data-buzz-anchor
        >
          <div className="flex items-center justify-between gap-6 h-14">
            {/* Left: Logo with breathing effect */}
            <div
              className={`relative w-48 h-full hover:scale-105 transition-transform duration-1000 ease-in-out ${breathe ? 'scale-105' : 'scale-100'}`}
            >
              <Link href="/">
                <Image
                  src="/assets/logo/BuzzWorkLargeLight.svg"
                  alt="BuzzWork Logo"
                  fill
                  className="object-contain"
                />
              </Link>
            </div>

            {/* Right: Coded button group */}
            <div className="flex items-center gap-2 h-full">
              {buttons.map(({ href, label, variant = "ghost" }) => (
                <Link key={href} href={href} className={`${baseBtn} ${styles[variant]}`}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}