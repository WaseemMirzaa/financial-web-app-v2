import type { Metadata } from 'next';
import './globals.css';
import { ClientRoot } from '@/components/ClientRoot';

export const metadata: Metadata = {
  title: 'Alkhaij Tamweel',
  description: 'Professional loan management platform',
  icons: { icon: '/icon.png', apple: '/icon.png' },
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
      <body className="font-sans antialiased">
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
