# Teacher AI 🌟

AI yordamida o'quvchilar ishlarini (testlar, yozma ishlar, uy vazifalari) tezkor va aniq tekshirish uchun Telegram Mini App platformasi.

---

## 📋 Mundarija

1. [Talablar](#talablar)
2. [O'rnatish](#ornatish)
3. [Muhit o'zgaruvchilari (.env)](#muhit-ozgaruvchilari-env)
4. [Supabase sozlash](#supabase-sozlash)
5. [Ma'lumotlar bazasi migratsiyasi](#malumotlar-bazasi-migratsiyasi)
6. [Telegram BotFather sozlash](#telegram-botfather-sozlash)
7. [Telegram Mini App sozlash](#telegram-mini-app-sozlash)
8. [Mahalliy ishlab chiqish (Local Dev)](#mahalliy-ishlab-chiqish-local-dev)
9. [AI provayderini sozlash (Gemini / OpenAI)](#ai-provayderini-sozlash)
10. [Vercel platformasiga joylash (Deployment)](#vercel-platformasiga-joylash)
11. [Testlash](#testlash)

---

## 1. Talablar

* **Node.js**: v18.0.0 yoki undan yuqori (tavsiya etiladi: v20+)
* **npm** yoki **pnpm** / **yarn**
* **Supabase** hisobi (PostgreSQL & Storage)
* **Telegram** hisobi va BotFather orqali yaratilgan bot
* **Google AI Studio (Gemini)** yoki **OpenAI** API kaliti

---

## 2. O'rnatish

Loyihani klonlang yoki papkasiga kiring va bog'liqliklarni o'rnating:

```bash
cd "tekshiradi ai"
npm install
```

---

## 3. Muhit o'zgaruvchilari (.env)

`.env.example` faylidan nusxa olib, `.env.local` yarating:

```bash
cp .env.example .env.local
```

`.env.local` tarkibi:

```env
# Telegram Bot & Mini App Configuration
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=teacher_ai_bot

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# AI Provider Configuration (gemini, openai)
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_api_key

# Application Base URL
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security & Session
JWT_SECRET=super_secret_jwt_key_must_be_at_least_32_chars

# Local browser preview mode
NEXT_PUBLIC_DEV_MODE=true
```

---

## 4. Supabase sozlash

1. [Supabase](https://supabase.com) ga kiring va yangi loyiha yarating.
2. **Project Settings -> API** bo'limidan `Project URL`, `anon / public key` va `service_role key` ni oling va `.env.local` ga yozing.
3. **Storage** bo'limida `submissions` nomli yangi public bucket yarating.

---

## 5. Ma'lumotlar bazasi migratsiyasi

Supabase boshqaruv panelida **SQL Editor** ga kiring va `supabase/schema.sql` fayli tarkibini nusxalab ishga tushiring:

* `users` (O'qituvchilar profili)
* `classes` (Sinflar)
* `students` (O'quvchilar)
* `submissions` (Yuklangan ishlar va rasmlar)
* `results` (AI tavsiyasi va o'qituvchi yakuniy bahosi)
* `events` (Mahsulot tahlili)

---

## 6. Telegram BotFather sozlash

1. Telegramda [@BotFather](https://t.me/BotFather) botiga kiring.
2. `/newbot` buyrug'ini yuboring va bot nomi hamda username'ini belgilang (masalan: `TeacherAIBot`).
3. BotFather bergan `API Token`ni oling va `.env.local` dagi `TELEGRAM_BOT_TOKEN` ga qo'ying.

---

## 7. Telegram Mini App sozlash

1. BotFather'ga `/newapp` buyrug'ini yuboring.
2. Botni tanlang (masalan, `@TeacherAIBot`).
3. Ilova nomi, tavsifi va rasmini kiriting.
4. **Web App URL** so'ralganda o'z domeningizni kiriting (masalan: `https://your-domain.vercel.app` yoki test uchun ngrok URL: `https://xxxx.ngrok-free.app`).
5. Qisqa nom (short name) bering (masalan: `app`).

---

## 8. Mahalliy ishlab chiqish (Local Dev)

Next.js ilovasini ishga tushirish:

```bash
npm run dev
```

Brauzerda oching: [http://localhost:3000](http://localhost:3000)

Telegram Botni alohida ishga tushirish (long-polling):

```bash
npm run bot
```

---

## 9. AI provayderini sozlash

Tizim modulli AI arxitekturasi asosida ishlaydi:
* **Gemini (Standart)**: `AI_PROVIDER=gemini` va [Google AI Studio](https://aistudio.google.com/) dan olingan kalit.
* **OpenAI**: `AI_PROVIDER=openai` va OpenAI API kaliti.

---

## 10. Vercel platformasiga joylash (Deployment)

1. Loyihani GitHub repozitoriyga yuklang.
2. [Vercel](https://vercel.com) da repozitoriyni import qiling.
3. **Environment Variables** bo'limiga `.env.local` dagi barcha o'zgaruvchilarni kiriting.
4. **Deploy** tugmasini bosing.
5. Tayyor bo'lgan `https://xxx.vercel.app` manzilini BotFather'da Mini App URL sifatida yangilang.

---

## 11. Testlash

Avtomatlashtirilgan testlarni ishga tushirish:

```bash
npm run test
```

TypeScript turlarini tekshirish:

```bash
npm run type-check
```

Production build tekshirish:

```bash
npm run build
```
