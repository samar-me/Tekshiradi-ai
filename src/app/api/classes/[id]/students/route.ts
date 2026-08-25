import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { supabaseAdmin, isSupabaseConfigured, memoryDB } from '@/lib/supabase/admin';
import { createStudentSchema } from '@/lib/validations/class-student';
import { Student } from '@/lib/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// Helper: verify that authenticated teacher owns this class
async function verifyClassOwnership(classId: string, teacherId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const { data } = await supabaseAdmin
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('teacher_id', teacherId)
      .single();
    return Boolean(data);
  } else {
    const targetClass = memoryDB.classes.get(classId);
    return Boolean(targetClass && targetClass.teacher_id === teacherId);
  }
}

// GET /api/classes/[id]/students - List students for class
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id: classId } = params;
    const isOwner = await verifyClassOwnership(classId, session.userId);
    if (!isOwner) {
      return NextResponse.json({ error: "Sinf topilmadi yoki unga ruxsat yo'q" }, { status: 404 });
    }

    if (isSupabaseConfigured) {
      const { data: students, error } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json({ error: "O'quvchilarni yuklashda xatolik yuz berdi" }, { status: 500 });
      }

      return NextResponse.json({ success: true, students: students || [] });
    } else {
      const students = Array.from(memoryDB.students.values())
        .filter((s) => s.class_id === classId)
        .sort((a, b) => a.full_name.localeCompare(b.full_name, 'uz'));

      return NextResponse.json({ success: true, students });
    }
  } catch (error: any) {
    console.error('GET /api/classes/[id]/students error:', error);
    return NextResponse.json({ error: "Server xatosi yuz berdi" }, { status: 500 });
  }
}

// POST /api/classes/[id]/students - Add student to class
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id: classId } = params;
    const isOwner = await verifyClassOwnership(classId, session.userId);
    if (!isOwner) {
      return NextResponse.json({ error: "Sinf topilmadi yoki unga ruxsat yo'q" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = createStudentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Ma'lumotlar noto'g'ri kiritildi" },
        { status: 400 }
      );
    }

    const { fullName } = parsed.data;

    let newStudent: Student;

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('students')
        .insert({
          class_id: classId,
          teacher_id: session.userId,
          full_name: fullName,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error inserting student:', error);
        return NextResponse.json({ error: "O'quvchini qo'shishda xatolik yuz berdi" }, { status: 500 });
      }

      newStudent = data;
    } else {
      newStudent = {
        id: crypto.randomUUID(),
        class_id: classId,
        full_name: fullName,
        created_at: new Date().toISOString(),
      };
      memoryDB.students.set(newStudent.id, newStudent);
    }

    return NextResponse.json({ success: true, student: newStudent }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/classes/[id]/students error:', error);
    return NextResponse.json({ error: "Server xatosi yuz berdi" }, { status: 500 });
  }
}
