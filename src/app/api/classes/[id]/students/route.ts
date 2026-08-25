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
    const rawNames = Array.isArray(body.fullNames) ? body.fullNames : [body.fullName];
    const names = Array.from(new Set(rawNames.map((name: unknown) => String(name || '').trim()).filter(Boolean)));
    if (names.length === 0 || names.length > 100) return NextResponse.json({ error: "1 tadan 100 tagacha o‘quvchi kiriting" }, { status: 400 });
    const parsedNames = names.map(fullName => createStudentSchema.safeParse({ fullName }));
    const invalid = parsedNames.find(result => !result.success);

    if (invalid && !invalid.success) {
      return NextResponse.json(
        { error: invalid.error.errors[0]?.message || "Ma'lumotlar noto'g'ri kiritildi" },
        { status: 400 }
      );
    }
    const cleanNames = parsedNames.map(result => result.success ? result.data.fullName : '').filter(Boolean);
    let newStudents: Student[];

    if (isSupabaseConfigured) {
      const { data: existing } = await supabaseAdmin.from('students').select('full_name').eq('class_id', classId);
      const existingSet = new Set((existing || []).map(item => item.full_name.toLocaleLowerCase('uz')));
      const toInsert = cleanNames.filter(fullName => !existingSet.has(fullName.toLocaleLowerCase('uz')));
      if (!toInsert.length) return NextResponse.json({ error: "Bu o‘quvchilar allaqachon sinfda bor" }, { status: 409 });
      const { data, error } = await supabaseAdmin
        .from('students')
        .insert(toInsert.map(full_name => ({
          class_id: classId,
          teacher_id: session.userId,
          full_name,
        })))
        .select('*')

      if (error) {
        console.error('Error inserting student:', error);
        return NextResponse.json({ error: "O'quvchini qo'shishda xatolik yuz berdi" }, { status: 500 });
      }

      newStudents = data || [];
    } else {
      newStudents = cleanNames.map(full_name => ({ id: crypto.randomUUID(), class_id: classId, full_name, created_at: new Date().toISOString() }));
      newStudents.forEach(student => memoryDB.students.set(student.id, student));
    }

    return NextResponse.json({ success: true, students: newStudents, student: newStudents[0], added: newStudents.length }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/classes/[id]/students error:', error);
    return NextResponse.json({ error: "Server xatosi yuz berdi" }, { status: 500 });
  }
}
