import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { TelegramProvider } from '@/components/providers/TelegramProvider';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

export const metadata: Metadata = {
  title: 'Teacher AI — O‘quvchilar ishini tekshirish',
  description: 'AI yordamida o‘quvchilar ishlarini tezroq va osonroq tekshiring',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
        <TelegramProvider>
          <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-slate-50 dark:bg-slate-950 shadow-sm border-x border-slate-200/50 dark:border-slate-800/50">
            <Header />
            <main className="flex-1 pb-24 pt-2 px-4">{children}</main>
            <BottomNav />
            <OnboardingModal />
          </div>
        </TelegramProvider>
      </body>
    </html>
  );
}
