import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { AuthSession } from '../types';

const jwtSecret = process.env.JWT_SECRET || 'teacher_ai_default_secret_key_change_me_in_production_123456789';
if (process.env.NODE_ENV === 'production' && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters in production');
}
const SECRET_KEY = new TextEncoder().encode(jwtSecret);

export const SESSION_COOKIE_NAME = 'teacher_ai_session';

export async function createSessionToken(session: AuthSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      authUserId: payload.authUserId as string | undefined,
      telegramId: (payload.telegramId as number | null | undefined) ?? null,
      fullName: payload.fullName as string,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
};

export async function getSessionFromRequest(req: NextRequest): Promise<AuthSession | null> {
  // 1. Try Authorization header
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = await verifySessionToken(token);
    if (session) return session;
  }

  // 2. Try cookie
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (sessionCookie?.value) {
    const session = await verifySessionToken(sessionCookie.value);
    if (session) return session;
  }

  return null;
}
