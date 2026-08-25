import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { supabaseAdmin, isSupabaseConfigured, memoryDB } from '@/lib/supabase/admin';
import { createClassSchema } from '@/lib/validations/class-student';
import { ClassItem } from '@/lib/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// GET /api/classes - List teacher's classes with student counts
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    if (isSupabaseConfigured) {
      // 1. Fetch classes for this teacher
      const { data: classesData, error: classesError } = await supabaseAdmin
        .from('classes')
        .select('*')
        .eq('teacher_id', session.userId)
        .order('created_at', { ascending: false });

      if (classesError) {
        console.error('Error fetching classes:', classesError);
        return NextResponse.json({ error: "Sinflarni yuklashda xatolik yuz berdi" }, { status: 500 });
      }

      const classes: ClassItem[] = classesData || [];

      // 2. Fetch student counts for each class
      if (classes.length > 0) {
        const classIds = classes.map((c) => c.id);
        const { data: studentsData } = await supabaseAdmin
          .from('students')
          .select('class_id')
          .in('class_id', classIds);

        const countsMap: Record<string, number> = {};
        studentsData?.forEach((s) => {
          countsMap[s.class_id] = (countsMap[s.class_id] || 0) + 1;
        });

        classes.forEach((c) => {
          c.student_count = countsMap[c.id] || 0;
        });
      }

      return NextResponse.json({ success: true, classes });
    } else {
      // In-Memory Dev Store
      const classes = Array.from(memoryDB.classes.values())
        .filter((c) => c.teacher_id === session.userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      classes.forEach((c) => {
        const count = Array.from(memoryDB.students.values()).filter((s) => s.class_id === c.id).length;
        c.student_count = count;
      });

      return NextResponse.json({ success: true, classes });
    }
  } catch (error: any) {
    console.error('GET /api/classes error:', error);
    return NextResponse.json({ error: "Server xatosi yuz berdi" }, { status: 500 });
  }
}

// POST /api/classes - Create new class for authenticated teacher
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createClassSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Ma'lumotlar noto'g'ri kiritildi" },
        { status: 400 }
      );
    }

    const { name, subject } = parsed.data;

    let newClass: ClassItem;

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('classes')
        .insert({
          teacher_id: session.userId,
          name,
          subject,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating class in Supabase:', error);
        return NextResponse.json({ error: "Sinf yaratishda xatolik yuz berdi" }, { status: 500 });
      }

      newClass = { ...data, student_count: 0 };
    } else {
      newClass = {
        id: crypto.randomUUID(),
        teacher_id: session.userId,
        name,
        subject,
        created_at: new Date().toISOString(),
        student_count: 0,
      };
      memoryDB.classes.set(newClass.id, newClass);
    }

    return NextResponse.json({ success: true, class: newClass }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/classes error:', error);
    return NextResponse.json({ error: "Server xatosi yuz berdi" }, { status: 500 });
  }
}
