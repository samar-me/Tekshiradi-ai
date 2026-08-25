import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { supabaseAdmin, isSupabaseConfigured, memoryDB } from '@/lib/supabase/admin';
import { User } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    let user: User | null = null;
    let stats = {
      todayChecked: 0,
      totalChecked: 0,
      classCount: 0,
      studentCount: 0,
    };

    if (isSupabaseConfigured) {
      // Fetch user profile
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', session.userId)
        .single();

      if (userError || !userData) {
        return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
      }
      user = userData as User;

      // Count classes
      const { count: classCount } = await supabaseAdmin
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id);

      // Count students (across all teacher classes)
      const { data: classes } = await supabaseAdmin
        .from('classes')
        .select('id')
        .eq('teacher_id', user.id);

      let studentCount = 0;
      if (classes && classes.length > 0) {
        const classIds = classes.map((c) => c.id);
        const { count } = await supabaseAdmin
          .from('students')
          .select('*', { count: 'exact', head: true })
          .in('class_id', classIds);
        studentCount = count || 0;
      }

      // Count total checked submissions
      const { count: totalChecked } = await supabaseAdmin
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .eq('status', 'completed');

      // Count today checked submissions
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { count: todayChecked } = await supabaseAdmin
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', startOfToday.toISOString());

      stats = {
        todayChecked: todayChecked || 0,
        totalChecked: totalChecked || 0,
        classCount: classCount || 0,
        studentCount: studentCount || 0,
      };
    } else {
      // In-Memory store
      user = memoryDB.users.get(session.userId) || null;
      if (!user) {
        return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
      }

      const teacherClasses = Array.from(memoryDB.classes.values()).filter(
        (c) => c.teacher_id === user!.id
      );
      const classIds = new Set(teacherClasses.map((c) => c.id));
      const teacherStudents = Array.from(memoryDB.students.values()).filter(
        (s) => classIds.has(s.class_id)
      );
      const teacherSubmissions = Array.from(memoryDB.submissions.values()).filter(
        (sub) => sub.teacher_id === user!.id && sub.status === 'completed'
      );

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todaySubmissions = teacherSubmissions.filter(
        (sub) => new Date(sub.created_at) >= startOfToday
      );

      stats = {
        todayChecked: todaySubmissions.length,
        totalChecked: teacherSubmissions.length,
        classCount: teacherClasses.length,
        studentCount: teacherStudents.length,
      };
    }

    return NextResponse.json({
      success: true,
      user,
      stats,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: "Server xatosi yuz berdi" }, { status: 500 });
  }
}
