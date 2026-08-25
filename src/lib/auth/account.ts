import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from './session';
import { User } from '@/lib/types';

export function createAuthClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', { auth:{ persistSession:false, autoRefreshToken:false, detectSessionInUrl:false } });
}
export function normalizePhone(value:string){const digits=value.replace(/\D/g,'');return `+${digits.startsWith('998')?digits:`998${digits}`}`;}
export function maskPhone(value?:string|null){if(!value)return null;return `${value.slice(0,7)} ** *** ** ${value.slice(-2)}`;}
export function maskEmail(value?:string|null){if(!value)return null;const[a,b]=value.split('@');return `${a.slice(0,2)}***@${b}`;}
export async function authenticatedResponse(payload:Record<string,unknown>,user:User){const token=await createSessionToken({userId:user.id,authUserId:user.auth_user_id||undefined,telegramId:user.telegram_id,fullName:user.full_name});const response=NextResponse.json({success:true,...payload});response.cookies.set(SESSION_COOKIE_NAME,token,sessionCookieOptions);return response;}
