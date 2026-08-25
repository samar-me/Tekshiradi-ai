import { webhookCallback } from 'grammy';
import { bot } from '../../../../../bot/index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handleUpdate = webhookCallback(bot, 'std/http');

export async function POST(request: Request) {
  return handleUpdate(request);
}

export function GET() {
  return Response.json({ ok: true, service: 'telegram-webhook' });
}
