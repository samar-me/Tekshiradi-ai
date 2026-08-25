import { z } from 'zod';
import { AnalysisInput, AnalysisResult } from '@/lib/types';

const resultSchema = z.object({
  score: z.number().finite().nonnegative(),
  maxScore: z.number().finite().positive(),
  suggestedGrade: z.number().int().min(2).max(5),
  summary: z.string().min(1).max(2000),
  mistakes: z.array(z.object({
    question: z.string().max(500),
    studentAnswer: z.string().max(1000),
    correctAnswer: z.string().max(1000),
    explanation: z.string().max(2000),
  })).max(50),
  feedback: z.string().min(1).max(3000),
  confidence: z.number().min(0).max(1),
});

const responseSchema = {
  type: 'OBJECT',
  required: ['score', 'maxScore', 'suggestedGrade', 'summary', 'mistakes', 'feedback', 'confidence'],
  properties: {
    score: { type: 'NUMBER' },
    maxScore: { type: 'NUMBER' },
    suggestedGrade: { type: 'INTEGER' },
    summary: { type: 'STRING' },
    mistakes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['question', 'studentAnswer', 'correctAnswer', 'explanation'],
        properties: {
          question: { type: 'STRING' }, studentAnswer: { type: 'STRING' },
          correctAnswer: { type: 'STRING' }, explanation: { type: 'STRING' },
        },
      },
    },
    feedback: { type: 'STRING' },
    confidence: { type: 'NUMBER' },
  },
};

export async function analyzeSubmission(input: AnalysisInput, requestedMaxScore: number): Promise<AnalysisResult> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI xizmati sozlanmagan');
  if (!input.imageBase64List?.length) throw new Error('Tahlil uchun rasm topilmadi');

  const model = process.env.AI_MODEL || 'gemini-3.6-flash';
  const prompt = `Siz O'zbekiston maktab o'qituvchisiga yordam beruvchi sinchkov tekshiruvchi assistentsiz.
Rasmlardagi o'quvchi ishini o'qing va faqat ko'rinadigan dalillarga tayangan holda tekshiring.
Ish turi: ${input.taskType}. O'quvchi: ${input.studentName || 'ko\u2018rsatilmagan'}. Sinf: ${input.className || 'ko\u2018rsatilmagan'}.
O'qituvchi ko'rsatmasi: ${input.instructions || 'yo\u2018q'}.
Maksimal ball ${requestedMaxScore}. score 0 va ${requestedMaxScore} oralig'ida bo'lsin, maxScore aynan ${requestedMaxScore} bo'lsin.
Noaniq yoki o'qib bo'lmaydigan joylarni uydirmang: summary va feedbackda o'qituvchi tekshirishi kerakligini ayting va confidence ni pasaytiring.
Har bir aniq xato uchun savol/topshiriq, o'quvchi javobi, to'g'ri javob va qisqa tushuntirish yozing. Xato ko'rinmasa mistakes bo'sh massiv bo'lsin.
suggestedGrade 2, 3, 4 yoki 5. Barcha izohlar o'zbek tilida bo'lsin.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts: [
        { text: prompt },
        ...input.imageBase64List.map(image => ({ inlineData: { mimeType: image.mimeType, data: image.data } })),
      ] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json', responseSchema },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error('Gemini error', response.status, detail.slice(0, 500));
    if (detail.includes('API_KEY_INVALID')) throw new Error('Gemini API kaliti yaroqsiz. Sozlamalarda yangi kalit kiriting.');
    throw new Error(response.status === 429 ? 'AI xizmati band. Birozdan keyin qayta urinib ko\u2018ring.' : 'AI tahlili bajarilmadi');
  }
  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('');
  if (!text) throw new Error('AI bo\u2018sh natija qaytardi');
  const parsed = resultSchema.parse(JSON.parse(text));
  return { ...parsed, score: Math.min(requestedMaxScore, parsed.score), maxScore: requestedMaxScore };
}
