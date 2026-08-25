'use client';

import React from 'react';
import { History, Clock, FileText } from 'lucide-react';

export default function TarixPage() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tekshiruvlar tarixi</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Avval tekshirilgan va tasdiqlangan o'quvchilar ishlari
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center py-8">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
          <History className="w-7 h-7" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
          Hozircha tekshiruvlar mavjud emas
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
          Ishlarni tekshirib tasdiqlaganingizdan so'ng, ular shu yerda saqlanadi.
        </p>
      </div>
    </div>
  );
}
