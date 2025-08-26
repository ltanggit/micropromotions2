// app/layout.tsx
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Script from 'next/script';

export const metadata = {
  title: 'Micropromotions',
  description: 'Music reviews made easy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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

// import './globals.css';
// import { AuthProvider } from '@/lib/auth';
// import Header from '../components/Header';
// import Footer from '../components/Footer';

// export const metadata = {
//   title: 'Micropromotions',
//   description: 'Music reviews made easy',
// };

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <body>
//         <AuthProvider>
//             <Header />
//             <main className="pt-[80px]">{children}</main>
//             <Footer />
//         </AuthProvider>
//       </body>
//     </html>
//   );
// }