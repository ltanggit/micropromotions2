'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [breathe, setBreathe] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Breathing animation toggle
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathe(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out
        ${scrolled ? 'backdrop-blur-md bg-white/70 h-14 shadow-md' : 'bg-white h-20'}`}
    >
      <div className="w-full px-4 flex items-center justify-between h-full">
        {/* Logo */}
        <div
          className={`relative w-48 h-full hover:scale-105 transition-transform duration-1000 ease-in-out ${
            breathe ? 'scale-105' : 'scale-100'
          }`}
        >
          <Link href="/">
            <Image
              src="/assets/SmashHausWordsOnly.svg"
              alt="SmashHaus Logo"
              fill
              className="object-contain"
            />
          </Link>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 h-full">
          {[
            { href: "/register", src: "/assets/Buttons/RegisterButton.svg", alt: "Register" },
            { href: "/login", src: "/assets/Buttons/LoginButton.svg", alt: "Login" },
            { href: "/payer/dashboard", src: "/assets/Buttons/PayersButton.svg", alt: "Payers" },
            { href: "/worker/dashboard", src: "/assets/Buttons/WorkersButton.svg", alt: "Workers" },
            { href: "/jobs", src: "/assets/Buttons/JobBoardButton.svg", alt: "Job Board" },
          ].map((b) => (
            <Link key={b.href} href={b.href} className="flex items-center h-full">
              {/* Center SVG within its clickable area */}
              <div className="relative h-[70%] aspect-[187/52] flex items-center justify-center shrink-0 hover:scale-105 transition-transform duration-300">
                <Image src={b.src} alt={b.alt} fill className="object-contain" />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </header>
  );
}
