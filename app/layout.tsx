import type { Metadata, Viewport } from 'next';
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
  metadataBase: new URL('https://mapo-tennis.vercel.app'),
  title: {
    default: '마포구 테니스협회',
    template: '%s | 마포구 테니스협회',
  },
  description: '대회 일정·조편성·결과·참가 등록 정보 제공',
  openGraph: {
    type: 'website',
    url: 'https://mapo-tennis.vercel.app',
    siteName: '마포구 테니스협회',
    title: '마포구 테니스협회',
    description: '대회 일정·조편성·결과·참가 등록 정보 제공',
    images: ['/og.png'], // 퍼블릭 경로 또는 절대경로
    locale: 'ko_KR',
  },
  manifest: '/manifest.json',
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
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://mapo-tennis.vercel.app/' },
};

export const viewport: Viewport = {
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
