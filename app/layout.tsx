import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import '@radix-ui/themes/styles.css';
import SessionProviderWrapper from '../components/SessionProviderWrapper';
import { Theme } from '@radix-ui/themes';
import SWRConfigContext from '../context/SWRConfigContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Mapogu Tennis Association',
  description: '마포구 테니스 협회',
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const themeColor = '#3b82f6';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Theme>
          <SessionProviderWrapper>
            <SWRConfigContext>{children}</SWRConfigContext>
          </SessionProviderWrapper>
        </Theme>
      </body>
    </html>
  );
}
