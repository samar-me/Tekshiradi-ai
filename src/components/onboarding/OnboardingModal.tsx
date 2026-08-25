'use client';

import React, { useState } from 'react';
import { useTelegram } from '../providers/TelegramProvider';
import { BookOpen, School, User, Sparkles, Loader2 } from 'lucide-react';

const COMMON_SUBJECTS = [
  'Matematika',
  'Ona tili va adabiyot',
  'Ingliz tili',
  'Fizika',
  'Kimyo',
  'Biologiya',
  'Tarix',
  'Informatika',
  'Boshlang‘ich ta’lim',
  'Geografiya',
];

export function OnboardingModal() {
  const { user, updateUser, showOnboarding } = useTelegram();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [schoolName, setSchoolName] = useState(user?.school_name || '');
  const [subject, setSubject] = useState(user?.subject || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!showOnboarding) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Iltimos, ism va familiyangizni kiriting");
      return;
    }
    if (!subject.trim()) {
      setError("Iltimos, asosiy faningizni tanlang yoki kiriting");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          schoolName: schoolName.trim() || null,
          subject: subject.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ma'lumotlarni saqlashda xatolik");
      }

      updateUser(data.user);
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Xush kelibsiz! 👋</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Teacher AI profilingizni bir necha soniyada to'ldiring
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Ism va familiyangiz <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masalan: Aziza Karimova"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* School Name (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Maktab nomi / raqami <span className="text-slate-400 font-normal">(ixtiyoriy)</span>
            </label>
            <div className="relative">
              <School className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Masalan: 45-maktab yoki IDUM"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Main Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Asosiy faningiz <span className="text-red-500">*</span>
            </label>
            <div className="relative mb-2">
              <BookOpen className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Fan nomini yozing yoki pastdan tanlang"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Quick subject pills */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-1">
              {COMMON_SUBJECTS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setSubject(item)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    subject === item
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saqlanmoqda...</span>
              </>
            ) : (
              <span>Boshlash 🚀</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
