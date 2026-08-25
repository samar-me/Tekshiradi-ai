import crypto from 'crypto';
import { TelegramInitData, TelegramUser } from '../types';

/**
 * Validates Telegram Mini App initData string using Telegram's HMAC-SHA256 algorithm.
 * Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 */
export function verifyTelegramInitData(
  initData: string,
  botToken?: string
): { isValid: boolean; data?: TelegramInitData; error?: string } {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;

  if (!initData) {
    return { isValid: false, error: 'initData is missing' };
  }

  // Support development bypass if configured
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true' && initData.startsWith('dev_mode=')) {
    try {
      const parsed = JSON.parse(decodeURIComponent(initData.replace('dev_mode=', '')));
      return {
        isValid: true,
        data: {
          auth_date: Math.floor(Date.now() / 1000),
          hash: 'dev_mock_hash',
          user: parsed.user || {
            id: 99999999,
            first_name: 'Test',
            last_name: "O'qituvchi",
            username: 'test_teacher',
          },
        },
      };
    } catch {
      // fallback to standard validation
    }
  }

  if (!token || token === 'your_telegram_bot_token_from_botfather') {
    // If dev mode is enabled and no token is set, allow dev mode
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      const params = new URLSearchParams(initData);
      const userRaw = params.get('user');
      let user: TelegramUser | undefined;
      if (userRaw) {
        try {
          user = JSON.parse(userRaw);
        } catch {
          // ignore
        }
      }
      return {
        isValid: true,
        data: {
          auth_date: Number(params.get('auth_date')) || Math.floor(Date.now() / 1000),
          hash: params.get('hash') || 'dev_hash',
          user: user || {
            id: 99999999,
            first_name: 'Test',
            last_name: "O'qituvchi",
            username: 'test_teacher',
          },
        },
      };
    }
    return { isValid: false, error: 'TELEGRAM_BOT_TOKEN is not configured on server' };
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) {
      return { isValid: false, error: 'Missing hash in initData' };
    }

    urlParams.delete('hash');

    // Sort keys alphabetically
    const paramsList: string[] = [];
    urlParams.forEach((value, key) => {
      paramsList.push(`${key}=${value}`);
    });
    paramsList.sort();

    const dataCheckString = paramsList.join('\n');

    // HMAC-SHA-256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(token)
      .digest();

    // HMAC-SHA-256(dataCheckString, secretKey)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return { isValid: false, error: 'Invalid hash signature' };
    }

    // Check expiration (24 hours)
    const authDate = Number(urlParams.get('auth_date') || 0);
    const currentTime = Math.floor(Date.now() / 1000);
    if (authDate && currentTime - authDate > 86400 * 3) {
      return { isValid: false, error: 'initData has expired' };
    }

    const userRaw = urlParams.get('user');
    let user: TelegramUser | undefined;
    if (userRaw) {
      try {
        user = JSON.parse(userRaw);
      } catch (e) {
        console.error('Failed to parse Telegram user JSON:', e);
      }
    }

    return {
      isValid: true,
      data: {
        query_id: urlParams.get('query_id') || undefined,
        user,
        auth_date: authDate,
        hash,
      },
    };
  } catch (err: any) {
    return { isValid: false, error: err?.message || 'Verification failed' };
  }
}
