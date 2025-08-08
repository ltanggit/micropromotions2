import './globals.css';
import { AuthProvider } from '@/lib/auth';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Micropromotions',
  description: 'Music reviews made easy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
            <Header />
            <main className="pt-[80px]">{children}</main>
            <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}