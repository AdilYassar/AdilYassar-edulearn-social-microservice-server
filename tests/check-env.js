/**
 * Check what environment variables are loaded
 * Run: node tests/check-env.js
 */

require('dotenv').config();

console.log(`
╔════════════════════════════════════════════════════════════╗
║    Environment Variables Check                            ║
║    (What's actually loaded in .env)                       ║
╚════════════════════════════════════════════════════════════╝
`);

console.log('LiveKit Configuration:');
console.log('='.repeat(60));

const liveKitUrl = process.env.LIVEKIT_URL;
const liveKitKey = process.env.LIVEKIT_API_KEY;
const liveKitSecret = process.env.LIVEKIT_API_SECRET;

console.log('1. LIVEKIT_URL:');
if (liveKitUrl) {
  console.log(`   ✅ SET: ${liveKitUrl}`);
} else {
  console.log('   ❌ NOT SET');
}

console.log('\n2. LIVEKIT_API_KEY:');
if (liveKitKey) {
  console.log(`   ✅ SET: ${liveKitKey.substring(0, 12)}...`);
  console.log(`   Full length: ${liveKitKey.length} chars`);
} else {
  console.log('   ❌ NOT SET');
}

console.log('\n3. LIVEKIT_API_SECRET:');
if (liveKitSecret) {
  console.log(`   ✅ SET: ${liveKitSecret.substring(0, 12)}...`);
  console.log(`   Full length: ${liveKitSecret.length} chars`);
} else {
  console.log('   ❌ NOT SET');
}

console.log('\n' + '='.repeat(60));

// Now test what config loads
console.log('\nConfig object values:');
console.log('='.repeat(60));

const config = require('../src/config');

console.log('config.livekit.url:', config.livekit.url || 'EMPTY');
console.log('config.livekit.apiKey:', config.livekit.apiKey ? config.livekit.apiKey.substring(0, 12) + '...' : 'EMPTY');
console.log('config.livekit.apiSecret:', config.livekit.apiSecret ? config.livekit.apiSecret.substring(0, 12) + '...' : 'EMPTY');

console.log('\n' + '='.repeat(60));

const hasUrl = !!config.livekit.url;
const hasKey = !!config.livekit.apiKey;
const hasSecret = !!config.livekit.apiSecret;

console.log('\nCondition check:');
console.log('  config.livekit.url truthy?', hasUrl);
console.log('  config.livekit.apiKey truthy?', hasKey);
console.log('  config.livekit.apiSecret truthy?', hasSecret);
console.log('  ALL THREE?', hasUrl && hasKey && hasSecret);

if (!hasUrl || !hasKey || !hasSecret) {
  console.log('\n⚠️  ISSUE FOUND:');
  if (!hasUrl) console.log('  - LIVEKIT_URL is missing/empty');
  if (!hasKey) console.log('  - LIVEKIT_API_KEY is missing/empty');
  if (!hasSecret) console.log('  - LIVEKIT_API_SECRET is missing/empty');
  console.log('\nCheck your .env file!');
} else {
  console.log('\n✅ All credentials present!');
}

console.log('\n' + '='.repeat(60) + '\n');
