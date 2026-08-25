'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ClassItem } from '@/lib/types';

interface DeleteClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: ClassItem | null;
  onClassDeleted: (classId: string) => void;
}

export function DeleteClassModal({
  isOpen,
  onClose,
  classItem,
  onClassDeleted,
}: DeleteClassModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !classItem) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const res = await fetch(`/api/classes/${classItem.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Sinfni o'chirishda xatolik");
      }

      onClassDeleted(classItem.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Sinf o'chirilmadi. Qayta urinib ko'ring.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold">Sinfni o‘chirmoqchimisiz?</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          <strong className="text-slate-800 dark:text-slate-200">{classItem.name}</strong> sinfi va unga tegishli barcha o‘quvchilar ro‘yxatdan o‘chiriladi. Ushbu amalni bekor qilib bo‘lmaydi.
        </p>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>O'chirilmoqda...</span>
              </>
            ) : (
              <span>Sinfni o‘chirish</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
