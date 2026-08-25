import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticatedResponse, createAuthClient } from '@/lib/auth/account';
import { getSessionFromRequest } from '@/lib/auth/session';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase/admin';
import { User } from '@/lib/types';

const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/, 'Username 3–30 ta kichik harf, raqam yoki _ dan iborat bo‘lsin');
const passwordSchema = z.string().min(8, 'Parol kamida 8 ta belgidan iborat bo‘lsin').max(72);
const loginSchema = z.object({ action: z.literal('login'), username: usernameSchema, password: passwordSchema });
const registerSchema = z.object({ action: z.literal('register'), fullName: z.string().trim().min(2).max(100), username: usernameSchema, password: passwordSchema });
const updateSchema = z.object({ username: usernameSchema, password: passwordSchema });
const internalEmail = (username: string) => `${username}@login.tekshiradi.local`;

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Login xizmati sozlanmagan' }, { status: 503 });
  const body = await req.json().catch(() => null);
  const parsed = z.discriminatedUnion('action', [loginSchema, registerSchema]).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Ma\u2019lumotlar noto\u2018g\u2018ri' }, { status: 400 });
  const { username, password } = parsed.data;
  if (parsed.data.action === 'login') {
    const { data: account } = await supabaseAdmin.from('users').select('*').ilike('username', username).maybeSingle();
    if (!account?.auth_user_id) return NextResponse.json({ error: 'Username yoki parol noto\u2018g\u2018ri' }, { status: 401 });
    const { data: authRecord } = await supabaseAdmin.auth.admin.getUserById(account.auth_user_id);
    if (!authRecord.user?.email) return NextResponse.json({ error: 'Username yoki parol noto\u2018g\u2018ri' }, { status: 401 });
    const auth = createAuthClient();
    const { data, error } = await auth.auth.signInWithPassword({ email: authRecord.user.email, password });
    if (error || !data.user) return NextResponse.json({ error: 'Username yoki parol noto\u2018g\u2018ri' }, { status: 401 });
    return authenticatedResponse({ user: account, isNewUser: !account.onboarding_completed }, account as User);
  }
  const { data: duplicate } = await supabaseAdmin.from('users').select('id').ilike('username', username).maybeSingle();
  if (duplicate) return NextResponse.json({ error: 'Bu username band' }, { status: 409 });
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email: internalEmail(username), password, email_confirm: true });
  if (authError || !authData.user) return NextResponse.json({ error: authError?.message?.includes('already') ? 'Bu username band' : 'Akkaunt yaratib bo\u2018lmadi' }, { status: 409 });
  const { data: user, error } = await supabaseAdmin.from('users').insert({ auth_user_id: authData.user.id, username, full_name: parsed.data.fullName, onboarding_completed: false }).select('*').single();
  if (error) { await supabaseAdmin.auth.admin.deleteUser(authData.user.id); return NextResponse.json({ error: 'Akkauntni saqlab bo\u2018lmadi' }, { status: 500 }); }
  return authenticatedResponse({ user, isNewUser: true }, user as User);
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Ma\u2019lumotlar noto\u2018g\u2018ri' }, { status: 400 });
  const { username, password } = parsed.data;
  const { data: duplicate } = await supabaseAdmin.from('users').select('id').ilike('username', username).neq('id', session.userId).maybeSingle();
  if (duplicate) return NextResponse.json({ error: 'Bu username band' }, { status: 409 });
  const { data: current } = await supabaseAdmin.from('users').select('*').eq('id', session.userId).single();
  let authUserId = current?.auth_user_id as string | null;
  if (authUserId) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(authUserId, { password });
    if (error) return NextResponse.json({ error: 'Login ma\u2019lumotlarini yangilab bo\u2018lmadi' }, { status: 409 });
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({ email: internalEmail(username), password, email_confirm: true });
    if (error || !data.user) return NextResponse.json({ error: 'Bu username band yoki parol yaroqsiz' }, { status: 409 });
    authUserId = data.user.id;
  }
  const { data: user, error } = await supabaseAdmin.from('users').update({ username, auth_user_id: authUserId }).eq('id', session.userId).select('*').single();
  if (error) return NextResponse.json({ error: 'Login ma\u2019lumotlarini saqlab bo\u2018lmadi' }, { status: 500 });
  return authenticatedResponse({ user }, user as User);
}
