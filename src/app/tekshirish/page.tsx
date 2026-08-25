'use client';

import React from 'react';
import { Sparkles, Upload, FileText, CheckCircle2 } from 'lucide-react';

export default function TekshirishPage() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ish tekshirish</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          O'quvchi ishini yuklang va AI yordamida tekshiring
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center py-8">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Upload className="w-7 h-7" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
          Tekshirish moduli tayyorlanmoqda
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
          3-bosqichda to'liq rasm yuklash va ko'p modelli AI tahlili ishga tushadi.
        </p>
      </div>
    </div>
  );
}
