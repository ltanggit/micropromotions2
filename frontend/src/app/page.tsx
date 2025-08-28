// frontend/src/app/page.tsx
// export default function Home() {
//   return (
//     <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 text-center text-white">
//       <img src="/assets/Bee.svg" alt="BuzzWork Bee" className="" />

//       <div>
//         <h1 className="text-4xl md:text-6xl font-bold mb-4">
//           Amplify Your Music. Get Heard.
//         </h1>
//         <p className="text-lg max-w-xl mx-auto text-gray-300 font-[var(--font-sans)]">
//           Authentic reviews. Real feedback. Genuine growth.
//         </p>
//       </div>

//       <div className="flex flex-col sm:flex-row gap-4">
//         <a href="/payer/dashboard" className="bg-white text-black px-6 py-3 rounded-md font-medium hover:bg-gray-200">
//           I'm an Artist
//         </a>
//         <a href="/worker/dashboard" className="border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white hover:text-black">
//           I'm a Listener
//         </a>
//       </div>
//     </main>
//   );
// }

import Header from "@/components/Header";
import BackgroundDecor from "@/components/BackgroundDecor";

export default function Page() {
  return (
    <div className="relative min-h-dvh">
      {/* Background lives behind everything and doesn't change layout */}
      <BackgroundDecor
        items={[
          // Example placements — replace src with your real files in /public/assets/bg
          {
            src: "/assets/bg/Ellipses.svg",
            width: 900,
            height: 640,
            className:
              "-top-24 -left-12 sm:-top-16 sm:left-0 max-w-none animate-float-slow opacity-50",
            priority: true,
          },
          // {
          //   src: "/assets/bg/rectangles.svg",
          //   width: 720,
          //   height: 720,
          //   className: "-bottom-32 -right-16 sm:-bottom-24 sm:-right-8 max-w-none animate-slow-spin opacity-25",
          // },
          {
            src: "/assets/bg/Rectangles.svg",
            width: 900,
            height: 900,
            className: "top-20 right-1/2 translate-x-1/2 sm:right-8 sm:translate-x-0 max-w-none opacity-10",
          },
        ]}
      />

      <Header />

      {/* Content gets some top padding so it's not hidden behind the header when at the very top */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <section className="grid gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight">Launch your campaign</h1>
          <p className="max-w-2xl text-white/80">
            Upload your track, recruit listeners, and get structured feedback. Your audience, one job at a time.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-40 rounded-2xl bg-white/5 ring-1 ring-white/10" />
            <div className="h-40 rounded-2xl bg-white/5 ring-1 ring-white/10" />
            <div className="h-40 rounded-2xl bg-white/5 ring-1 ring-white/10" />
          </div>
        </section>
      </main>
    </div>
  );
}