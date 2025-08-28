// // frontend/src/components/Header.tsx
// 'use client';

// import Image from 'next/image';
// import Link from 'next/link';
// import { useEffect, useState } from 'react';

// export default function Header() {
//   const [breathe, setBreathe] = useState(false);
//   const [scrolled, setScrolled] = useState(false);

//   // Breathing animation toggle
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setBreathe(prev => !prev);
//     }, 3000);
//     return () => clearInterval(interval);
//   }, []);

//   // Scroll detection
//   useEffect(() => {
//     const onScroll = () => {
//       setScrolled(window.scrollY > 20);
//     };
//     window.addEventListener('scroll', onScroll);
//     return () => window.removeEventListener('scroll', onScroll);
//   }, []);

//   return (
//     <header
//       className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out
//         ${scrolled ? 'backdrop-blur-md bg-transparent h-14 shadow-md' : 'h-14 bg-white/30'}`}
//     >
//       <div className="w-full px-4 flex items-center justify-between h-full">
//         {/* Logo */}
//         <div
//           className={`relative w-80 h-full hover:scale-105 transition-transform duration-1000 ease-in-out ${
//             breathe ? 'scale-105' : 'scale-100'
//           }`}
//         >
//           <Link href="/">
//             <Image
//               src="/assets/BuzzWorkLargeLight.svg"
//               alt="BuzzWork Logo"
//               fill
//               className="object-contain"
//             />
//           </Link>
//         </div>

//         {/* Buttons */}
//         <div className="flex items-center gap-2 h-full">
//           {[
//             { href: "/register", src: "/assets/Buttons/RegisterButton.svg", alt: "Register" },
//             { href: "/login", src: "/assets/Buttons/LoginButton.svg", alt: "Login" },
//             { href: "/payer/dashboard", src: "/assets/Buttons/PayersButton.svg", alt: "Payers" },
//             { href: "/worker/dashboard", src: "/assets/Buttons/WorkersButton.svg", alt: "Workers" },
//             { href: "/jobs", src: "/assets/Buttons/JobBoardButton.svg", alt: "Job Board" },
//           ].map((b) => (
//             <Link key={b.href} href={b.href} className="flex items-center h-full">
//               {/* Center SVG within its clickable area */}
//               <div className="relative h-[50%] aspect-[187/52] flex items-center justify-center shrink-0 hover:scale-105 transition-transform duration-300">
//                 <Image src={b.src} alt={b.alt} fill className="object-contain" />
//               </div>
//             </Link>
//           ))}
//         </div>

//       </div>
//     </header>
//   );
// }

// "use client";
// import Link from "next/link";
// import { usePathname } from "next/navigation";

// const nav = [
//   { href: "/tools", label: "Tools" },
//   { href: "/insights", label: "Insights" },
//   { href: "/partners", label: "Partners" },
// ];

// export default function Header() {
//   const pathname = usePathname();

//   return (
//     <header className="sticky top-0 z-50">
//       {/* Glassy bar */}
//       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//         <div className="mt-4 rounded-2xl bg-white/5 px-4 sm:px-6 py-3 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
//           <div className="flex items-center justify-between gap-6">
//             {/* Left: logo */}
//             <Link href="/" className="flex items-center gap-2">
//               <div className="size-8 rounded-md bg-[--brand] grid place-items-center shadow-lg shadow-[--brand]/30">
//                 <span className="i-lucide-sparkles text-black" />
//               </div>
//               <span className="text-lg font-semibold tracking-tight">songtools</span>
//             </Link>

//             {/* Center: nav */}
//             <nav className="hidden md:flex items-center gap-8">
//               {nav.map((item) => {
//                 const active = pathname?.startsWith(item.href);
//                 return (
//                   <Link
//                     key={item.href}
//                     href={item.href}
//                     className="group relative py-2 text-sm/6 text-white/80 hover:text-white transition"
//                   >
//                     {item.label}
//                     {/* underline indicator */}
//                     <span
//                       className={`pointer-events-none absolute -bottom-1 left-0 h-[2px] bg-white ${
//                         active ? "w-full" : "w-0 group-hover:w-full"
//                       } transition-[width] duration-300 rounded-full`}
//                     />
//                   </Link>
//                 );
//               })}
//             </nav>

//             {/* Right: auth actions */}
//             <div className="flex items-center gap-3">
//               <Link
//                 href="/login"
//                 className="rounded-full border border-white/25 px-4 py-1.5 text-sm text-white/90 hover:bg-white/10 transition"
//               >
//                 Login
//               </Link>
//               <Link
//                 href="/signup"
//                 className="rounded-full bg-[--brand] px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-[--brand]/30 hover:brightness-110 transition"
//               >
//                 Sign Up
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Subtle bottom gradient to blend over hero image/video */}
//       <div className="h-6 bg-gradient-to-b from-black/30 to-transparent -mt-2" />
//     </header>
//   );
// }

// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import { useEffect, useState } from "react";

// export default function Header() {
//   const [breathe, setBreathe] = useState(false);
//   const [scrolled, setScrolled] = useState(false);

//   // Breathing animation toggle
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setBreathe((prev) => !prev);
//     }, 3000);
//     return () => clearInterval(interval);
//   }, []);

//   // Scroll detection
//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 20);
//     window.addEventListener("scroll", onScroll);
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   return (
//     <header
//       className={`fixed top-4 left-0 w-full z-50 transition-transform duration-500 ease-in-out ${
//         scrolled ? "-translate-y-full" : "translate-y-0"
//       }`}
//     >
//       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//         <div
//           className={`rounded-2xl px-4 sm:px-6 py-3 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out 
//           bg-white/10`}
//         >
//           <div className="flex items-center justify-between gap-6 h-14">
//             {/* Left: Logo with breathing effect */}
//             <div
//               className={`relative w-48 h-full hover:scale-105 transition-transform duration-1000 ease-in-out ${
//                 breathe ? "scale-105" : "scale-100"
//               }`}
//             >
//               <Link href="/">
//                 <Image
//                   src="/assets/BuzzWorkLargeLight.svg"
//                   alt="BuzzWork Logo"
//                   fill
//                   className="object-contain"
//                 />
//               </Link>
//             </div>

//             {/* Right: Button group */}
//             <div className="flex items-center gap-3 h-full">
//               {[
//                 { href: "/register", src: "/assets/Buttons/RegisterButton.svg", alt: "Register" },
//                 { href: "/login", src: "/assets/Buttons/LoginButton.svg", alt: "Login" },
//                 { href: "/payer/dashboard", src: "/assets/Buttons/PayersButton.svg", alt: "Payers" },
//                 { href: "/worker/dashboard", src: "/assets/Buttons/WorkersButton.svg", alt: "Workers" },
//                 { href: "/jobs", src: "/assets/Buttons/JobBoardButton.svg", alt: "Job Board" },
//               ].map((b) => (
//                 <Link key={b.href} href={b.href} className="flex items-center h-full">
//                   <div className="relative h-[50%] aspect-[187/52] flex items-center justify-center shrink-0 hover:scale-105 transition-transform duration-300">
//                     <Image src={b.src} alt={b.alt} fill className="object-contain" />
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }


"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [breathe, setBreathe] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  const buttons: { href: string; label: string; variant?: "primary" | "outline" | "ghost" }[] = [
    { href: "/register", label: "Register", variant: "primary" },
    { href: "/login", label: "Login", variant: "outline" },
    { href: "/payer/dashboard", label: "Payers", variant: "ghost" },
    { href: "/worker/dashboard", label: "Workers", variant: "ghost" },
    { href: "/jobs", label: "Job Board", variant: "ghost" },
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
          className={`rounded-2xl px-4 sm:px-6 py-3 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out bg-white/10`}
        >
          <div className="flex items-center justify-between gap-6 h-14">
            {/* Left: Logo with breathing effect */}
            <div
              className={`relative w-48 h-full hover:scale-105 transition-transform duration-1000 ease-in-out ${
                breathe ? "scale-105" : "scale-100"
              }`}
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