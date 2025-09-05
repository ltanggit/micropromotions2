// frontend/src/app/page.tsx
"use client";
import BackgroundDecor, { BgItem } from "@/components/BackgroundDecor";
import { useEffect, useState } from "react";


export default function Page() {
  const backgroundItems: BgItem[] = [
  ];

  const [scrolled, setScrolled] = useState(false);
    // Scroll detection
    useEffect(() => {
      const onScroll = () => setScrolled(window.scrollY > 20);
      window.addEventListener("scroll", onScroll);
      return () => window.removeEventListener("scroll", onScroll);
    }, []);
  

  return (
    <div className="relative min-h-dvh">
      <BackgroundDecor items={backgroundItems} />

      {/* Flying bee animation */}
      <div className="pointer-events-none absolute top-8 left-0 w-full z-70">
        <img
          src="/assets/logo/bee.svg"
          alt="Bee"
          className="bee-flight w-4 h-4"
        />
      </div>

      {/* Bee buzzing around left side of header */}
        {/* <div className='pointer-events-none fixed top-6 left-6 w-32 h-32 z-[70] overflow-visible'>
          <div className="bee-buzz-x w-full h-full relative">
            <img
              src="/assets/logo/bee.svg"
              alt="Bee"
              className="bee-buzz-y w-30 h-30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </div>
        </div> */}

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <section className="grid gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight">Launch Your Campaign.</h1>
          <p className="max-w-2xl text-white/80">
            Upload your track, recruit listeners, and get structured feedback. Your audience, one job at a time.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-40 rounded-2xl bg-white/5 ring-1 ring-white/10" />
            <div className="h-40 rounded-2xl bg-white/5 ring-1 ring-white/10" />
            <div className="h-40 rounded-2xl bg-white/5 ring-1 ring-white/10" />
          </div>
        </section>

        <section className="mt-32 grid gap-6">
          <h2 className="text-2xl font-bold">More Content Down The Page</h2>
          <p className="max-w-2xl text-white/70">We can put some more pretty cool stuff and features down here, like a newsletter, sponsors, general information, etc.</p>
          <div className="h-[120vh] rounded-2xl bg-white/5 ring-1 ring-white/10" />
        </section>
      </main>
    </div>
  );
}