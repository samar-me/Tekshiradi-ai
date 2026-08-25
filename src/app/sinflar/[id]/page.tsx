'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  UserPlus,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { ClassItem, Student } from '@/lib/types';
import { AddStudentModal } from '@/components/students/AddStudentModal';
import { EditStudentModal } from '@/components/students/EditStudentModal';
import { DeleteStudentModal } from '@/components/students/DeleteStudentModal';
import { EditClassModal } from '@/components/classes/EditClassModal';
import { DeleteClassModal } from '@/components/classes/DeleteClassModal';
import { useTelegram } from '@/components/providers/TelegramProvider';

export default function ClassDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;
  const { refreshUser } = useTelegram();

  const [classItem, setClassItem] = useState<ClassItem | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [isDeleteClassOpen, setIsDeleteClassOpen] = useState(false);

  const fetchClassAndStudents = async () => {
    if (!classId) return;
    try {
      setIsLoading(true);
      setError(null);

      // Fetch class details
      const classRes = await fetch(`/api/classes/${classId}`);
      const classData = await classRes.json();
      if (!classRes.ok || !classData.success) {
        throw new Error(classData.error || "Sinf ma'lumotlarini yuklab bo'lmadi");
      }
      setClassItem(classData.class);

      // Fetch students
      const studentsRes = await fetch(`/api/classes/${classId}/students`);
      const studentsData = await studentsRes.json();
      if (studentsRes.ok && studentsData.success) {
        setStudents(studentsData.students || []);
      }
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassAndStudents();
  }, [classId]);

  // Callbacks
  const handleStudentAdded = (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent]);
    if (classItem) {
      setClassItem({
        ...classItem,
        student_count: (classItem.student_count || 0) + 1,
      });
    }
    refreshUser();
  };

  const handleStudentUpdated = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  };

  const handleStudentDeleted = (deletedId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== deletedId));
    if (classItem) {
      setClassItem({
        ...classItem,
        student_count: Math.max(0, (classItem.student_count || 1) - 1),
      });
    }
    refreshUser();
  };

  const handleClassUpdated = (updated: ClassItem) => {
    setClassItem(updated);
    refreshUser();
  };

  const handleClassDeleted = () => {
    refreshUser();
    router.push('/sinflar');
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="w-32 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-28" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-12"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !classItem) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
          {error || "Bu sinfni topib bo‘lmadi"}
        </p>
        <Link
          href="/sinflar"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sinflarga qaytish</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Bar with Back Button and Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/sinflar"
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sinflar</span>
        </Link>

        {/* Class actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsEditClassOpen(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs flex items-center gap-1"
            title="Sinfni tahrirlash"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsDeleteClassOpen(true)}
            className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all text-xs flex items-center gap-1"
            title="Sinfni o'chirish"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Class Overview Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-blue-600/30">
              {classItem.name}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {classItem.name} sinfi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>{classItem.subject}</span>
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60">
            {students.length} ta o‘quvchi
          </span>
        </div>
      </div>

      {/* Students Section Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            O‘quvchilar ro‘yxati
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Sinfdagi jami {students.length} nafar o'quvchi
          </p>
        </div>

        <button
          onClick={() => setIsAddStudentOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ O‘quvchi qo‘shish</span>
        </button>
      </div>

      {/* Empty State for Students */}
      {students.length === 0 && (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm space-y-3 py-10">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Ushbu sinfda hali o‘quvchilar yo‘q
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Ishlarni tekshirish uchun o'quvchilarni ro'yxatga qo'shing.
            </p>
          </div>
          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ O‘quvchi qo‘shish</span>
          </button>
        </div>
      )}

      {/* Students List */}
      {students.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
          {students.map((student, index) => (
            <div
              key={student.id}
              className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-xs font-semibold text-slate-400">
                  {index + 1}.
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {student.full_name}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingStudent(student)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  title="Tahrirlash"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingStudent(student)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all"
                  title="O'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        classId={classItem.id}
        onStudentAdded={handleStudentAdded}
      />

      <EditStudentModal
        isOpen={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
        onStudentUpdated={handleStudentUpdated}
      />

      <DeleteStudentModal
        isOpen={Boolean(deletingStudent)}
        onClose={() => setDeletingStudent(null)}
        student={deletingStudent}
        onStudentDeleted={handleStudentDeleted}
      />

      <EditClassModal
        isOpen={isEditClassOpen}
        onClose={() => setIsEditClassOpen(false)}
        classItem={classItem}
        onClassUpdated={handleClassUpdated}
      />

      <DeleteClassModal
        isOpen={isDeleteClassOpen}
        onClose={() => setIsDeleteClassOpen(false)}
        classItem={classItem}
        onClassDeleted={handleClassDeleted}
      />
    </div>
  );
}
