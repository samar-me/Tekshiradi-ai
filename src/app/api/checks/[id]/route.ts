import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

const schema = z.object({ score: z.number().min(0).max(1000), maxScore: z.number().positive().max(1000), comment: z.string().max(3000).default('') });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    if (body.score > body.maxScore) return NextResponse.json({ error: 'Ball maksimal balldan oshmasligi kerak' }, { status: 400 });
    const { data: submission } = await supabaseAdmin.from('submissions').select('id').eq('id', params.id).eq('teacher_id', session.userId).maybeSingle();
    if (!submission) return NextResponse.json({ error: 'Tekshiruv topilmadi' }, { status: 404 });
    const grade = body.score / body.maxScore >= .86 ? 5 : body.score / body.maxScore >= .71 ? 4 : body.score / body.maxScore >= .55 ? 3 : 2;
    const { data, error } = await supabaseAdmin.from('results').update({
      teacher_score: body.score, teacher_max_score: body.maxScore, teacher_grade: grade,
      teacher_feedback: body.comment, teacher_comment: body.comment, approved: true,
    }).eq('submission_id', params.id).eq('teacher_id', session.userId).select('*').single();
    if (error) throw error;
    return NextResponse.json({ result: data });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Natija noto\u2018g\u2018ri' }, { status: 400 });
    return NextResponse.json({ error: 'Natijani saqlab bo\u2018lmadi' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  const { data: submission } = await supabaseAdmin.from('submissions').select('id').eq('id', params.id).eq('teacher_id', session.userId).maybeSingle();
  if (!submission) return NextResponse.json({ error: 'Tekshiruv topilmadi' }, { status: 404 });
  const { data: files } = await supabaseAdmin.from('check_files').select('storage_path').eq('check_id', params.id).eq('teacher_id', session.userId);
  if (files?.length) await supabaseAdmin.storage.from('submissions').remove(files.map(file => file.storage_path));
  const { error } = await supabaseAdmin.from('submissions').delete().eq('id', params.id).eq('teacher_id', session.userId);
  if (error) return NextResponse.json({ error: 'Tekshiruvni o\u2018chirib bo\u2018lmadi' }, { status: 500 });
  return NextResponse.json({ success: true });
}
