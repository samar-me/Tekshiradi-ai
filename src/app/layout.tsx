import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { TelegramProvider } from '@/components/providers/TelegramProvider';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

export const metadata: Metadata = { title:'Tekshiradi AI — O‘qituvchi yordamchisi', description:'O‘quvchilar ishini tez, aniq va ishonchli tekshirish uchun aqlli yordamchi.' };
export const viewport: Viewport = { width:'device-width', initialScale:1, viewportFit:'cover' };

export default function RootLayout({ children }: { children:React.ReactNode }) {
  return <html lang="uz"><head><Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" /></head><body><TelegramProvider><div className="min-h-screen"><Header/><main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-10 md:pt-8">{children}</main><BottomNav/><OnboardingModal/></div></TelegramProvider></body></html>;
}
