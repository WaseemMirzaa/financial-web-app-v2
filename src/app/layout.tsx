import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { AppInitializer } from '@/components/AppInitializer';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Loan Management System',
  description: 'Professional loan management platform',
  icons: { icon: '/icon' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={plusJakarta.className}>
        <LocaleProvider>
          <AuthProvider>
            <AppInitializer>{children}</AppInitializer>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
