'use client';

import React from 'react';
import { useTelegram } from '../providers/TelegramProvider';
import { Sparkles, BookOpen } from 'lucide-react';

export function Header() {
  const { user } = useTelegram();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Teacher AI
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">
              O'quvchilar ishini tekshirish
            </p>
          </div>
        </div>

        {user?.subject && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{user.subject}</span>
          </div>
        )}
      </div>
    </header>
  );
}
