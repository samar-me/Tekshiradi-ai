import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 30));
  const { data, error } = await supabaseAdmin.from('submissions')
    .select('id,task_type,status,created_at,classes(name,subject),students(full_name),results(*)')
    .eq('teacher_id', session.userId).order('created_at', { ascending: false }).limit(limit);
  if (error) return NextResponse.json({ error: 'Tarixni yuklab bo\u2018lmadi' }, { status: 500 });
  return NextResponse.json({ checks: data || [] });
}
