import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { supabaseAdmin, isSupabaseConfigured, memoryDB } from '@/lib/supabase/admin';
import { updateClassSchema } from '@/lib/validations/class-student';
import { ClassItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// GET /api/classes/[id] - Get class details by ID
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id } = params;

    if (isSupabaseConfigured) {
      const { data: classData, error } = await supabaseAdmin
        .from('classes')
        .select('*')
        .eq('id', id)
        .eq('teacher_id', session.userId)
        .single();

      if (error || !classData) {
        return NextResponse.json({ error: "Sinf topilmadi yoki unga ruxsat yo'q" }, { status: 404 });
      }

      const { count } = await supabaseAdmin
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', id);

      const result: ClassItem = {
        ...classData,
        student_count: count || 0,
      };

      return NextResponse.json({ success: true, class: result });
    } else {
      const targetClass = memoryDB.classes.get(id);
      if (!targetClass || targetClass.teacher_id !== session.userId) {
        return NextResponse.json({ error: "Sinf topilmadi yoki unga ruxsat yo'q" }, { status: 404 });
      }

      const studentCount = Array.from(memoryDB.students.values()).filter(
        (s) => s.class_id === id
      ).length;

      return NextResponse.json({
        success: true,
        class: { ...targetClass, student_count: studentCount },
      });
    }
  } catch (error: any) {
    console.error('GET /api/classes/[id] error:', error);
    return NextResponse.json({ error: "Server xatosi yuz berdi" }, { status: 500 });
  }
}

// PATCH /api/classes/[id] - Edit class
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const parsed = updateClassSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Ma'lumotlar noto'g'ri kiritildi" },
        { status: 400 }
      );
    }

    const updates: Partial<{ name: string; subject: string }> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.subject !== undefined) updates.subject = parsed.data.subject;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "O'zgartirish uchun ma'lumot berilmadi" }, { status: 400 });
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('classes')
        .update(updates)
        .eq('id', id)
        .eq('teacher_id', session.userId)
        .select('*')
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Sinf topilmadi yoki yangilashga ruxsat yo'q" }, { status: 404 });
      }

      return NextResponse.json({ success: true, class: data });
    } else {
      const targetClass = memoryDB.classes.get(id);
      if (!targetClass || targetClass.teacher_id !== session.userId) {
        return NextResponse.json({ error: "Sinf topilmadi yoki yangilashga ruxsat yo'q" }, { status: 404 });
      }

      if (updates.name) targetClass.name = updates.name;
      if (updates.subject) targetClass.subject = updates.subject;
      memoryDB.classes.set(id, targetClass);

      return NextResponse.json({ success: true, class: targetClass });
    }
  } catch (error: any) {
    console.error('PATCH /api/classes/[id] error:', error);
    return NextResponse.json({ error: "Server xatosi yuz berdi" }, { status: 500 });
  }
}

// DELETE /api/classes/[id] - Delete class
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id } = params;

    if (isSupabaseConfigured) {
      // Supabase cascade deletes students if configured, or manual delete
      const { data, error } = await supabaseAdmin
        .from('classes')
        .delete()
        .eq('id', id)
        .eq('teacher_id', session.userId)
        .select('*')
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Sinf topilmadi yoki o'chirishga ruxsat yo'q" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Sinf muvaffaqiyatli o'chirildi" });
    } else {
      const targetClass = memoryDB.classes.get(id);
      if (!targetClass || targetClass.teacher_id !== session.userId) {
        return NextResponse.json({ error: "Sinf topilmadi yoki o'chirishga ruxsat yo'q" }, { status: 404 });
      }

      // Delete class and associated students
      memoryDB.classes.delete(id);
      for (const [studentId, student] of memoryDB.students.entries()) {
        if (student.class_id === id) {
          memoryDB.students.delete(studentId);
        }
      }

      return NextResponse.json({ success: true, message: "Sinf muvaffaqiyatli o'chirildi" });
    }
  } catch (error: any) {
    console.error('DELETE /api/classes/[id] error:', error);
    return NextResponse.json({ error: "Server xatosi yuz berdi" }, { status: 500 });
  }
}
