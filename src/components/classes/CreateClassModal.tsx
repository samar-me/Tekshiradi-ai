'use client';

import React, { useState } from 'react';
import { X, BookOpen, GraduationCap, Loader2, Sparkles } from 'lucide-react';
import { ClassItem } from '@/lib/types';

const COMMON_SUBJECTS = [
  'Matematika',
  'Ingliz tili',
  'Ona tili',
  'Informatika',
  'Fizika',
  'Kimyo',
  'Biologiya',
  'Tarix',
  'Geografiya',
];

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated: (newClass: ClassItem) => void;
}

export function CreateClassModal({ isOpen, onClose, onClassCreated }: CreateClassModalProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = (isCustom ? customSubject : subject).trim();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Iltimos, sinf nomini kiriting (masalan: 7-A)");
      return;
    }
    if (!finalSubject) {
      setError("Iltimos, fanni tanlang yoki kiriting");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          subject: finalSubject,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Sinf yaratishda xatolik yuz berdi");
      }

      onClassCreated(data.class);
      setName('');
      setSubject('');
      setCustomSubject('');
      setIsCustom(false);
      onClose();
    } catch (err: any) {
      setError(err.message || "Sinf yaratilmadi. Qayta urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Yangi sinf yaratish</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sinf nomi va o'qitiladigan fanni belgilang
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Sinf nomi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: 7-A, 8-B yoki 10-A"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
              autoFocus
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Fan <span className="text-red-500">*</span>
            </label>

            {!isCustom ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto py-1">
                  {COMMON_SUBJECTS.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setSubject(item)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        subject === item
                          ? 'bg-blue-600 text-white border-blue-600 font-medium shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustom(true);
                      setSubject('');
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/50"
                  >
                    + Boshqa fan
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Fan nomini yozing (masalan: Rus tili)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsCustom(false)}
                  className="text-xs text-blue-600 dark:text-blue-400 underline"
                >
                  ← Ro'yxatdan tanlash
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Yaratilmoqda...</span>
                </>
              ) : (
                <span>Sinf yaratish</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
