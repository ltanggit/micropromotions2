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
          className={`relative w-48 h-full transition-transform duration-1000 ease-in-out ${
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
        <div className="flex gap-6 items-center">
          <Link href="/worker/dashboard">
            <div className="h-30 aspect-square relative">
              <Image
                src="/assets/Shop.svg"
                alt="Shop Icon"
                fill
                className="object-contain"
              />
            </div>
          </Link>

          <Link href="/payer/dashboard">
            <div className="h-45 aspect-square relative">
              <Image
                src="/assets/CreatorSignUp.svg"
                alt="Creator Icon"
                fill
                className="object-contain"
              />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
