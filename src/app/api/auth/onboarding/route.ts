import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { supabaseAdmin, isSupabaseConfigured, memoryDB } from '@/lib/supabase/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const onboardingSchema = z.object({
  fullName: z.string().min(2, "Ism va familiyani to'liq kiriting"),
  schoolName: z.string().optional().nullable(),
  subject: z.string().min(2, "Asosiy fanni tanlang yoki kiriting"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Ma'lumotlar noto'g'ri kiritildi" },
        { status: 400 }
      );
    }

    const { fullName, schoolName, subject } = parsed.data;

    let updatedUser: any = null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          full_name: fullName,
          school_name: schoolName || null,
          subject: subject,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.userId)
        .select('*')
        .single();

      if (error) {
        console.error('Failed to update user profile in Supabase:', error);
        return NextResponse.json({ error: "Profilni saqlashda xatolik yuz berdi" }, { status: 500 });
      }
      updatedUser = data;
    } else {
      // In-Memory store update
      const existing = memoryDB.users.get(session.userId);
      if (existing) {
        existing.full_name = fullName;
        existing.school_name = schoolName || null;
        existing.subject = subject;
        existing.updated_at = new Date().toISOString();
        memoryDB.users.set(session.userId, existing);
        updatedUser = existing;
      }
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Onboarding API error:', error);
    return NextResponse.json(
      { error: error?.message || "Server xatosi yuz berdi" },
      { status: 500 }
    );
  }
}
