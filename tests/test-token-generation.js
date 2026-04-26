/**
 * Quick token generation test - no server needed
 * Tests the LiveKit SDK directly
 * Run: node tests/test-token-generation.js
 */

require('dotenv').config();
const { AccessToken } = require('livekit-server-sdk');

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

console.log('\n===== LiveKit Token Generation Test =====\n');

console.log('📋 Configuration:');
console.log(`  API Key: ${LIVEKIT_API_KEY ? LIVEKIT_API_KEY.substring(0, 8) + '...' : '❌ NOT SET'}`);
console.log(`  API Secret: ${LIVEKIT_API_SECRET ? LIVEKIT_API_SECRET.substring(0, 8) + '...' : '❌ NOT SET'}\n`);

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('❌ Missing LiveKit credentials in .env\n');
  process.exit(1);
}

async function testTokenGeneration() {
  try {
    console.log('🔄 Generating test token...\n');

    // Create access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    // Set participant info
    const identity = `test-student-${Date.now()}`;
    at.identity = identity;
    at.name = 'Test Student';

    console.log(`  Identity: ${identity}`);
    console.log(`  Name: Test Student`);
    console.log(`  Room: test-room\n`);

    // Add grant
    at.addGrant({
      roomJoin: true,
      room: 'test-room',
      canPublish: true,
      canPublishData: true,
      canSubscribe: true
    });

    console.log('  Grant: Video + Audio + Data (RX/TX)\n');

    // Generate JWT
    const token = await at.toJwt();

    console.log('✅ Token Generated Successfully!\n');
    console.log(`Token (${token.length} chars):`);
    console.log(`${token}\n`);

    // Decode to show payload (base64)
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = Buffer.from(parts[1], 'base64').toString();
      console.log('Token Payload:');
      console.log(JSON.stringify(JSON.parse(payload), null, 2) + '\n');
    }

    console.log('✅ All tests passed!\n');
    return true;
  } catch (error) {
    console.error('❌ Token generation failed:\n');
    console.error(error);
    console.error('\n');
    return false;
  }
}

testTokenGeneration().then(success => {
  process.exit(success ? 0 : 1);
});
