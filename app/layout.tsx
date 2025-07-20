import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import '@radix-ui/themes/styles.css';
import SessionProviderWrapper from '../components/SessionProviderWrapper';
import { Theme } from '@radix-ui/themes';
import SWRConfigContext from '../context/SWRConfigContext';
import PWAInstaller from '../components/PWAInstaller';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

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
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '마포구 테니스',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': '마포구 테니스',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Theme>
          <SessionProviderWrapper>
            <SWRConfigContext>{children}</SWRConfigContext>
            <PWAInstaller />
            <PWAInstallPrompt />
          </SessionProviderWrapper>
        </Theme>
      </body>
    </html>
  );
}
