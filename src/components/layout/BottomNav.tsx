'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, CheckCircle2, History } from 'lucide-react';

const NAV_ITEMS = [
  {
    label: 'Bosh sahifa',
    href: '/',
    icon: Home,
  },
  {
    label: 'Sinflar',
    href: '/sinflar',
    icon: Users,
  },
  {
    label: 'Tekshirish',
    href: '/tekshirish',
    icon: CheckCircle2,
    highlight: true,
  },
  {
    label: 'Tarix',
    href: '/tarix',
    icon: History,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  const handleHaptic = () => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      try {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
      } catch {
        // ignore
      }
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleHaptic}
                className="flex flex-col items-center justify-center -mt-5 group"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950 scale-105'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/25'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={`text-[11px] mt-1 font-medium ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleHaptic}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-normal'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
