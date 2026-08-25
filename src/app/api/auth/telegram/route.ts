import { NextRequest, NextResponse } from 'next/server';
import { verifyTelegramInitData } from '@/lib/auth/telegram-verify';
import { createSessionToken } from '@/lib/auth/session';
import { supabaseAdmin, isSupabaseConfigured, memoryDB } from '@/lib/supabase/admin';
import { User } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json(
        { error: "initData ma'lumotlari kiritilmadi" },
        { status: 400 }
      );
    }

    // Verify Telegram signature
    const verification = verifyTelegramInitData(initData);
    if (!verification.isValid || !verification.data?.user) {
      return NextResponse.json(
        { error: verification.error || "Telegram autentifikatsiyasi muvaffaqiyatsiz bo'ldi" },
        { status: 401 }
      );
    }

    const tgUser = verification.data.user;
    const telegramId = tgUser.id;
    const defaultFullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || "O'qituvchi";

    let dbUser: User | null = null;
    let isNewUser = false;

    if (isSupabaseConfigured) {
      // 1. Try finding existing user in Supabase
      const { data: existingUser, error: findError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        console.error('Supabase query error:', findError);
      }

      if (existingUser) {
        dbUser = existingUser as User;
      } else {
        // Create new user in Supabase
        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            telegram_id: telegramId,
            full_name: defaultFullName,
          })
          .select('*')
          .single();

        if (insertError) {
          console.error('Supabase user insert error:', insertError);
          return NextResponse.json({ error: "Foydalanuvchini saqlashda xatolik" }, { status: 500 });
        }
        dbUser = newUser as User;
        isNewUser = true;
      }
    } else {
      // Fallback: In-memory store for local development
      for (const u of memoryDB.users.values()) {
        if (u.telegram_id === telegramId) {
          dbUser = u;
          break;
        }
      }

      if (!dbUser) {
        dbUser = {
          id: crypto.randomUUID(),
          telegram_id: telegramId,
          full_name: defaultFullName,
          school_name: null,
          subject: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        memoryDB.users.set(dbUser.id, dbUser);
        isNewUser = true;
      }
    }

    // Generate session JWT token
    const sessionToken = await createSessionToken({
      userId: dbUser.id,
      telegramId: dbUser.telegram_id,
      fullName: dbUser.full_name,
    });

    const response = NextResponse.json({
      success: true,
      user: dbUser,
      sessionToken,
      isNewUser: isNewUser || !dbUser.subject, // Needs onboarding if subject is missing
    });

    // Set HTTP-only session cookie
    response.cookies.set('teacher_ai_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Telegram auth route error:', error);
    return NextResponse.json(
      { error: error?.message || "Kutilmagan server xatosi yuz berdi" },
      { status: 500 }
    );
  }
}
