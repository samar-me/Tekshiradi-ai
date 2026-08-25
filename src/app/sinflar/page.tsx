'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Users, GraduationCap, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { ClassItem } from '@/lib/types';
import { CreateClassModal } from '@/components/classes/CreateClassModal';
import { useTelegram } from '@/components/providers/TelegramProvider';

function SinflarContent() {
  const searchParams = useSearchParams();
  const { refreshUser } = useTelegram();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/classes');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Sinflarni yuklab bo'lmadi");
      }

      setClasses(data.classes || []);
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleClassCreated = (newClass: ClassItem) => {
    setClasses((prev) => [newClass, ...prev]);
    refreshUser();
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Sinflar</span>
            {!isLoading && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {classes.length}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sinflar va ularga tegishli o'quvchilar ro'yxati
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Sinf yaratish</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchClasses} className="underline font-semibold ml-2">
            Qayta urinish
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2">
                  <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-32 h-3 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="w-16 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && classes.length === 0 && (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm space-y-3 py-10">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              Hali sinf yaratilmagan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              O‘quvchilarni qo‘shish va ishlarni tekshirish uchun birinchi sinfingizni yarating.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Sinf yaratish</span>
          </button>
        </div>
      )}

      {/* Class List */}
      {!isLoading && classes.length > 0 && (
        <div className="space-y-3">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/sinflar/${c.id}`}
              className="block p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-base shadow-sm">
                    {c.name}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {c.name} sinf
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span>{c.subject}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {c.student_count || 0} o‘quvchi
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onClassCreated={handleClassCreated}
      />
    </div>
  );
}

export default function SinflarPage() {
  return (
    <Suspense fallback={
      <div className="space-y-3 animate-pulse">
        <div className="w-32 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-24" />
      </div>
    }>
      <SinflarContent />
    </Suspense>
  );
}
