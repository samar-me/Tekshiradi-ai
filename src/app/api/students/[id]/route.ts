import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { supabaseAdmin, isSupabaseConfigured, memoryDB } from '@/lib/supabase/admin';
import { updateStudentSchema } from '@/lib/validations/class-student';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// Helper: verify that student belongs to a class owned by the teacher
async function verifyStudentTeacherOwnership(
  studentId: string,
  teacherId: string
): Promise<{ authorized: boolean; student?: any; classId?: string }> {
  if (isSupabaseConfigured) {
    // 1. Fetch student
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id, class_id, full_name')
      .eq('id', studentId)
      .single();

    if (!student) return { authorized: false };

    // 2. Fetch class and check teacher_id
    const { data: classData } = await supabaseAdmin
      .from('classes')
      .select('id, teacher_id')
      .eq('id', student.class_id)
      .single();

    if (!classData || classData.teacher_id !== teacherId) {
      return { authorized: false };
    }

    return { authorized: true, student, classId: student.class_id };
  } else {
    const student = memoryDB.students.get(studentId);
    if (!student) return { authorized: false };

    const classData = memoryDB.classes.get(student.class_id);
    if (!classData || classData.teacher_id !== teacherId) {
      return { authorized: false };
    }

    return { authorized: true, student, classId: student.class_id };
  }
}

// PATCH /api/students/[id] - Edit student
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id: studentId } = params;
    const check = await verifyStudentTeacherOwnership(studentId, session.userId);
    if (!check.authorized) {
      return NextResponse.json({ error: "O'quvchi topilmadi yoki unga ruxsat yo'q" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateStudentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Ma'lumotlar noto'g'ri kiritildi" },
        { status: 400 }
      );
    }

    const { fullName } = parsed.data;

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('students')
        .update({ full_name: fullName })
        .eq('id', studentId)
        .select('*')
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "O'quvchini yangilashda xatolik yuz berdi" }, { status: 500 });
      }

      return NextResponse.json({ success: true, student: data });
    } else {
      const student = check.student;
      student.full_name = fullName;
      memoryDB.students.set(studentId, student);

      return NextResponse.json({ success: true, student });
    }
  } catch (error: any) {
    console.error('PATCH /api/students/[id] error:', error);
    return NextResponse.json({ error: "Server xatosi yuz berdi" }, { status: 500 });
  }
}

// DELETE /api/students/[id] - Delete student
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id: studentId } = params;
    const check = await verifyStudentTeacherOwnership(studentId, session.userId);
    if (!check.authorized) {
      return NextResponse.json({ error: "O'quvchi topilmadi yoki o'chirishga ruxsat yo'q" }, { status: 404 });
    }

    if (isSupabaseConfigured) {
      const { error } = await supabaseAdmin
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) {
        return NextResponse.json({ error: "O'quvchini o'chirishda xatolik yuz berdi" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "O'quvchi muvaffaqiyatli o'chirildi" });
    } else {
      memoryDB.students.delete(studentId);
      return NextResponse.json({ success: true, message: "O'quvchi muvaffaqiyatli o'chirildi" });
    }
  } catch (error: any) {
    console.error('DELETE /api/students/[id] error:', error);
    return NextResponse.json({ error: "Server xatosi yuz berdi" }, { status: 500 });
  }
}
