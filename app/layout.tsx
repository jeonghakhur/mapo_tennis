import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import '@radix-ui/themes/styles.css';
import './globals.css';
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
  title: '마포구 테니스 협회',
  description: '마포구 테니스 협회 공식 웹사이트',
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Theme scaling="100%">
          <SessionProviderWrapper>
            <SWRConfigContext>{children}</SWRConfigContext>
          </SessionProviderWrapper>
        </Theme>
      </body>
    </html>
  );
}
