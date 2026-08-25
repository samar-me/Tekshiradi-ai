'use client';

import React from 'react';
import Link from 'next/link';
import { useTelegram } from '@/components/providers/TelegramProvider';
import {
  Sparkles,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowRight,
  GraduationCap,
  FileCheck,
} from 'lucide-react';

export default function HomePage() {
  const { user, stats, isLoading, refreshUser } = useTelegram();

  React.useEffect(() => {
    refreshUser();
  }, []);

  const teacherName = user?.full_name || "Hurmatli O'qituvchi";

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Teacher Greeting Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">
              O'qituvchi xonasi
            </span>
            <h2 className="text-xl font-bold mt-1">
              Assalomu alaykum, {isLoading ? "..." : teacherName} 👋
            </h2>
            <p className="text-xs text-blue-100 mt-1 max-w-[280px]">
              AI yordamida o'quvchilar test va yozma ishlarini bir zumda tekshiring.
            </p>
          </div>
        </div>

        {/* Quick Action inside hero */}
        <div className="mt-4 pt-4 border-t border-blue-400/30 flex items-center justify-between">
          <span className="text-xs text-blue-100">
            {user?.school_name ? `🏫 ${user.school_name}` : "🏫 Maktab o'qituvchisi"}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
            {user?.subject || "Fan tanlanmagan"}
          </span>
        </div>
      </div>

      {/* MVP Statistics */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 px-1">
          Asosiy ko'rsatkichlar
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Today Checked */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Bugun tekshirildi</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.todayChecked} <span className="text-xs font-normal text-slate-500">ta ish</span>
            </div>
          </div>

          {/* Total Checked */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Jami tekshirildi</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalChecked} <span className="text-xs font-normal text-slate-500">ta ish</span>
            </div>
          </div>

          {/* Classes */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Sinflar</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.classCount} <span className="text-xs font-normal text-slate-500">ta sinf</span>
            </div>
          </div>

          {/* Students */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">O'quvchilar</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.studentCount} <span className="text-xs font-normal text-slate-500">nafar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (CTAs) */}
      <div className="space-y-2.5 pt-2">
        {/* Primary CTA */}
        <Link
          href="/tekshirish"
          className="w-full py-4 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-base flex items-center justify-between shadow-lg shadow-blue-600/25 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span>+ Ish tekshirish</span>
          </div>
          <ArrowRight className="w-5 h-5 text-blue-200" />
        </Link>

        {/* Secondary CTA */}
        <Link
          href="/sinflar?create=true"
          className="w-full py-3.5 px-5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.99] text-slate-800 dark:text-slate-200 font-medium text-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Plus className="w-4 h-4" />
            </div>
            <span>+ Sinf yaratish</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* How it works info card */}
      <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Qanday ishlaydi?
        </div>
        <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
          <li>Sinf va o'quvchini tanlang</li>
          <li>O'quvchi daftari yoki test varaqasini rasmga olib yuklang</li>
          <li>AI tahlilini ko'rib chiqing va kerak bo'lsa ballni to'g'irlang</li>
          <li>Natijani tasdiqlang va saqlang</li>
        </ol>
      </div>
    </div>
  );
}
