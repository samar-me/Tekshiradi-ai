import { verifyTelegramInitData } from '../src/lib/auth/telegram-verify';
import { createSessionToken, verifySessionToken } from '../src/lib/auth/session';
import crypto from 'crypto';

async function runPhase1Tests() {
  console.log('🧪 Starting Phase 1 Foundation Tests...\n');

  // Test 1: JWT Session Creation and Verification
  console.log('1️⃣ Testing JWT Session Token creation & verification:');
  const mockSession = {
    userId: 'user-uuid-12345',
    telegramId: 123456789,
    fullName: 'Aziza Karimova',
  };

  const token = await createSessionToken(mockSession);
  console.log('   - Generated Token:', token.substring(0, 30) + '...');

  const verified = await verifySessionToken(token);
  if (
    verified &&
    verified.userId === mockSession.userId &&
    verified.telegramId === mockSession.telegramId &&
    verified.fullName === mockSession.fullName
  ) {
    console.log('   ✅ JWT Session Verified Successfully!');
  } else {
    console.error('   ❌ JWT Session Verification Failed:', verified);
    process.exit(1);
  }

  // Test 2: Telegram initData HMAC-SHA256 Verification
  console.log('\n2️⃣ Testing Telegram initData Cryptographic Verification:');
  const testBotToken = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz_TEST_TOKEN';
  const testUser = {
    id: 987654321,
    first_name: 'Dilshod',
    last_name: 'Ahmedov',
    username: 'dilshod_teacher',
  };
  const authDate = Math.floor(Date.now() / 1000);

  // Generate valid Telegram dataCheckString
  const userJson = JSON.stringify(testUser);
  const dataCheckString = `auth_date=${authDate}\nquery_id=AAHdF6IQAAAAAN0XohD_test\nuser=${userJson}`;

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(testBotToken)
    .digest();

  const validHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const validInitData = `query_id=AAHdF6IQAAAAAN0XohD_test&user=${encodeURIComponent(
    userJson
  )}&auth_date=${authDate}&hash=${validHash}`;

  const verifyResult = verifyTelegramInitData(validInitData, testBotToken);

  if (verifyResult.isValid && verifyResult.data?.user?.id === testUser.id) {
    console.log('   ✅ Valid initData signature correctly verified!');
  } else {
    console.error('   ❌ Valid initData verification failed:', verifyResult);
    process.exit(1);
  }

  // Test 3: Tampered Telegram initData should be rejected
  console.log('\n3️⃣ Testing Tampered initData Rejection:');
  const tamperedInitData = validInitData.replace('Dilshod', 'Hacker');
  const tamperedResult = verifyTelegramInitData(tamperedInitData, testBotToken);

  if (!tamperedResult.isValid) {
    console.log('   ✅ Tampered initData correctly rejected with error:', tamperedResult.error);
  } else {
    console.error('   ❌ Tampered initData was unexpectedly accepted!');
    process.exit(1);
  }

  // Test 4: Dev Mode bypass
  console.log('\n4️⃣ Testing Dev Mode Fallback:');
  process.env.NEXT_PUBLIC_DEV_MODE = 'true';
  const devInitData = 'dev_mode=' + encodeURIComponent(JSON.stringify({ user: testUser }));
  const devResult = verifyTelegramInitData(devInitData);
  if (devResult.isValid && devResult.data?.user?.id === testUser.id) {
    console.log('   ✅ Dev mode mock initData verified successfully!');
  } else {
    console.error('   ❌ Dev mode verification failed:', devResult);
    process.exit(1);
  }

  console.log('\n🎉 ALL PHASE 1 FOUNDATION TESTS PASSED!\n');
}

runPhase1Tests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
