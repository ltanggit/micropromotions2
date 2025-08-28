// app/layout.tsx
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackgroundDecor from '@/components/BackgroundDecor';
import Script from 'next/script';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',          // avoids FOIT
  variable: '--font-sans',  // lets you use it as a CSS var
  weight: ['400','600','700'],
});

export const metadata = {
  title: 'Micropromotions',
  description: 'Music reviews made easy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={'${inter.variable} font-sans'}>
      <head>
        {/* Spotify Web Playback SDK */}
        <Script src="https://sdk.scdn.co/spotify-player.js" strategy="afterInteractive" />
      </head>
      <body className="min-h-dvh flex flex-col">
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
                  {
                    src: "/assets/bg/Hexagons.svg",
                    width: 100,
                    height: 100,
                    className: "-bottom-32 -right-16 sm:-bottom-24 sm:-right-8 max-w-none animate-slow-spin opacity-25",
                  },
                  {
                    src: "/assets/bg/Rectangles.svg",
                    width: 900,
                    height: 900,
                    className: "top-20 right-1/2 translate-x-1/2 sm:right-8 sm:translate-x-0 max-w-none opacity-10",
                  },
                ]}
              />
        <AuthProvider>
          <Header />
          <main className="flex-1 pt-[80px]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}