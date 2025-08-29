// app/layout.tsx
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackgroundDecor from '@/components/BackgroundDecor';
import { LanguageProvider } from '@/components/i18n/LanguageProvider';
import Script from 'next/script';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400','600','700'],
});

export const metadata = {
  title: 'Micropromotions',
  description: 'Music reviews made easy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <head>
        <Script src="https://sdk.scdn.co/spotify-player.js" strategy="afterInteractive" />
      </head>
      <body className="min-h-dvh flex flex-col relative">
        {/* Backgrounds */}
        <div className="absolute inset-x-0 top-0 bottom-0 -z-10 overflow-hidden">
          <BackgroundDecor
            items={[
              { 
                src: '/assets/bg/hexagons.svg',
                width: 720,
                height: 720,
                className: '-bottom-32 -right-16 sm:-bottom-24 sm:-right-8 max-w-none animate-slow-spin opacity-25'
              },
              {
                src: '/assets/bg/Rectangles.svg',
                width: 900,
                height: 900,
                className: 'top-20 right-1/2 translate-x-1/2 sm:right-8 sm:translate-x-0 max-w-none opacity-10',
              },
              {
                behavior: 'scroll',
                repeatY: true,
                src: '/assets/bg/Hexagons.svg',
                className: 'left-0 top-0 w-[280px] min-h-full h-full opacity-15',
                bgSize: 'contain',
                bgPosition: 'top left',
              },
              {
                behavior: 'scroll',
                src: '/assets/bg/ellipses.svg',
                className: 'right-0 top-32 w-full h-[180vh] opacity-50',
              },
            ]}
          />
        </div>

        <LanguageProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1 pt-[80px]">{children}</main>
            <Footer />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}