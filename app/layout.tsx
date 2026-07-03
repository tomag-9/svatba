import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { PwaRegister } from '@/components/pwa-register';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { MobileNav } from '@/components/mobile-nav';
import { DeadlineAlerts } from '@/components/deadline-alerts';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Svadba bez chaosu',
  description: 'Mobilná PWA aplikácia na plánovanie svadby, úloh, hostí, rozpočtu a časovej osi.',
  appleWebApp: {
    capable: true,
    title: 'Svadba bez chaosu',
    statusBarStyle: 'default'
  }
};

export const viewport = {
  themeColor: '#9b4f2f'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" className={`${manrope.variable} ${cormorant.variable}`}>
      <body>
        <PwaRegister />
        <PwaInstallPrompt />
        <MobileNav />
        <DeadlineAlerts />
        {children}
      </body>
    </html>
  );
}
