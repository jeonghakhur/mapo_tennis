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
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '마포구 테니스 협회',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
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
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="마포구 테니스 협회" />
        <meta name="mobile-web-app-capable" content="yes" />
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
