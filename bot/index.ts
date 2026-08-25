import { Bot, InlineKeyboard } from 'grammy';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!token || token.includes('dummy') || token.includes('your_telegram_bot_token')) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN is not set or using dummy token. Please configure .env.local with a valid token from @BotFather.');
}

export const bot = new Bot(token || 'dummy_token');

// Helper to create appropriate keyboard safely
function getAppKeyboard() {
  const keyboard = new InlineKeyboard();
  if (appUrl.startsWith('https://')) {
    keyboard.webApp("🚀 Teacher AI'ni ochish", appUrl);
    return keyboard;
  }
  return undefined; // Do not send invalid localhost URL in inline button
}

// Error handler to prevent bot crashes
bot.catch((err) => {
  console.error('Telegram Bot Error occurred:', err.error || err);
});

// /start command handler
bot.command('start', async (ctx) => {
  const firstName = ctx.from?.first_name || "O'qituvchi";
  const keyboard = getAppKeyboard();
  
  let welcomeText = 
`👋 **Assalomu alaykum, ${firstName}!**

🌟 **Teacher AI** — AI yordamida o'quvchilar ishlarini tezroq tekshiring.`;

  if (keyboard) {
    welcomeText += `\n\nQuyidagi tugmani bosish orqali ilovani oching:`;
    await ctx.reply(welcomeText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } else {
    welcomeText += 
`\n\n🖥 **Lokal ishlab chiqish rejimi:**
Ilovani brauzerda ochish: [http://localhost:3000](http://localhost:3000)

💡 *Eslatma: Telegram ichida ochilishi uchun ilovani Vercel yoki ngrok (HTTPS) ga joylash lozim.*`;
    await ctx.reply(welcomeText, {
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
    });
  }
});

// /help command
bot.command('help', async (ctx) => {
  const helpText = 
`📚 **Teacher AI qo'llanmasi:**

1. /start buyrug'ini yuboring.
2. Ilovani oching.
3. Sinf va o'quvchini tanlang.
4. O'quvchi ishining rasmini yuklang va AI tahlilini oling!

Savollar yoki yordam uchun: @support`;

  await ctx.reply(helpText, { parse_mode: 'Markdown' });
});

// Fallback message
bot.on('message', async (ctx) => {
  const keyboard = getAppKeyboard();
  if (keyboard) {
    await ctx.reply("Ilovani ishga tushirish uchun quyidagi tugmani bosing:", {
      reply_markup: keyboard,
    });
  } else {
    await ctx.reply("Ilovaga kirish: http://localhost:3000");
  }
});

// If run directly: tsx bot/index.ts
if (require.main === module) {
  console.log('🤖 Teacher AI Telegram Bot ishga tushmoqda...');
  bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Bot @${botInfo.username} muvaffaqiyatli ishga tushdi!`);
      console.log(`🌐 Mini App URL: ${appUrl}`);
    },
  });
}
