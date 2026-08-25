import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeSubmission } from '@/lib/ai/analyze';
import { getSessionFromRequest } from '@/lib/auth/session';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 120;

const bodySchema = z.object({
  classId: z.string().uuid(), studentId: z.string().uuid(),
  taskType: z.enum(['test', 'yozma', 'diktant', 'uy_vazifasi', 'boshqa']),
  instructions: z.string().max(2000).optional().default(''),
  maxScore: z.number().int().min(1).max(1000).default(20),
  images: z.array(z.object({
    data: z.string().min(1), mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  })).min(1).max(6),
});

const extension: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Ma\u2019lumotlar bazasi sozlanmagan' }, { status: 503 });
  let submissionId: string | undefined;
  try {
    const body = bodySchema.parse(await req.json());
    const decoded = body.images.map(image => ({ ...image, buffer: Buffer.from(image.data, 'base64') }));
    if (decoded.some(image => !image.buffer.length) || decoded.reduce((sum, image) => sum + image.buffer.length, 0) > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Rasmlar hajmi jami 15 MB dan oshmasligi kerak' }, { status: 413 });
    }
    const [{ data: classItem }, { data: student }] = await Promise.all([
      supabaseAdmin.from('classes').select('id,name,subject').eq('id', body.classId).eq('teacher_id', session.userId).maybeSingle(),
      supabaseAdmin.from('students').select('id,full_name').eq('id', body.studentId).eq('class_id', body.classId).eq('teacher_id', session.userId).maybeSingle(),
    ]);
    if (!classItem || !student) return NextResponse.json({ error: 'Sinf yoki o\u2018quvchi topilmadi' }, { status: 404 });

    const { data: submission, error: submissionError } = await supabaseAdmin.from('submissions').insert({
      teacher_id: session.userId, class_id: body.classId, student_id: body.studentId,
      task_type: body.taskType, instructions: body.instructions, file_urls: [], status: 'analyzing',
    }).select('id').single();
    if (submissionError) throw submissionError;
    submissionId = submission.id;

    const paths: string[] = [];
    for (let index = 0; index < decoded.length; index += 1) {
      const image = decoded[index];
      const path = `${session.userId}/${submissionId}/${index + 1}.${extension[image.mimeType]}`;
      const { error } = await supabaseAdmin.storage.from('submissions').upload(path, image.buffer, { contentType: image.mimeType, upsert: false });
      if (error) throw error;
      paths.push(path);
    }
    await supabaseAdmin.from('check_files').insert(paths.map((storage_path, index) => ({
      check_id: submissionId, teacher_id: session.userId, storage_path, page_number: index + 1,
    })));
    await supabaseAdmin.from('submissions').update({ file_urls: paths }).eq('id', submissionId);

    const analysis = await analyzeSubmission({
      taskType: body.taskType, instructions: body.instructions, imageUrls: paths,
      imageBase64List: body.images, studentName: student.full_name, className: classItem.name,
    }, body.maxScore);
    const { data: result, error: resultError } = await supabaseAdmin.from('results').insert({
      submission_id: submissionId, teacher_id: session.userId, ai_score: analysis.score,
      ai_max_score: analysis.maxScore, ai_grade: analysis.suggestedGrade, ai_summary: analysis.summary,
      ai_mistakes: analysis.mistakes, ai_feedback: analysis.feedback, ai_confidence: analysis.confidence,
      approved: false,
    }).select('*').single();
    if (resultError) throw resultError;
    const { data: usage } = await supabaseAdmin.from('usage').select('checks_used').eq('teacher_id', session.userId).maybeSingle();
    await Promise.all([
      supabaseAdmin.from('submissions').update({ status: 'completed' }).eq('id', submissionId),
      supabaseAdmin.from('usage').update({ checks_used: (usage?.checks_used || 0) + 1 }).eq('teacher_id', session.userId),
    ]);
    return NextResponse.json({ submissionId, result });
  } catch (error) {
    if (submissionId) await supabaseAdmin.from('submissions').update({ status: 'failed' }).eq('id', submissionId);
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Kiritilgan ma\u2019lumot noto\u2018g\u2018ri' }, { status: 400 });
    console.error('Check analyze error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Tekshiruv bajarilmadi' }, { status: 500 });
  }
}
