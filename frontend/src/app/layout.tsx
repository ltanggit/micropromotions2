// app/layout.tsx
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
        <AuthProvider>
          <Header />
          <main className="flex-1 pt-[80px]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}