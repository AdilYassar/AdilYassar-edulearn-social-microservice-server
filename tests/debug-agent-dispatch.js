/**
 * LiveKit Agent Debug Test
 * Tests dispatch with debug output to identify the exact issue
 * 
 * Run: node tests/debug-agent-dispatch.js
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:4001/api/v1';
const LIVEKIT_URL = process.env.LIVEKIT_URL;

console.log(`
╔════════════════════════════════════════════════════════════╗
║          LiveKit Agent Dispatch Debug Test                ║
║    This will show exactly what's happening with dispatch  ║
╚════════════════════════════════════════════════════════════╝
`);

console.log(`API Base: ${API_BASE}`);
console.log(`LiveKit URL: ${LIVEKIT_URL}\n`);

async function testDispatch() {
  // Generate exact room name like the app would
  const roomName = `playground-${Math.random().toString(36).substring(7).toUpperCase()}`;
  const agentName = 'Emery-2338';

  console.log('📊 Test Parameters:');
  console.log(`  Room Name: ${roomName}`);
  console.log(`  Agent Name: ${agentName}\n`);

  console.log('🔄 Sending dispatch request...\n');

  try {
    const response = await axios.post(`${API_BASE}/livekit/dispatch-agent`, {
      roomName,
      agentName
    });

    console.log('✅ Response received:\n');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.status === 'success') {
      console.log('\n✅ Dispatch succeeded!');
      console.log('\nNow check in LiveKit dashboard:');
      console.log(`1. Navigate to room: ${roomName}`);
      console.log(`2. Look for participant: ${agentName}`);
      console.log(`3. If not there, agent service may not be running\n`);
    }
  } catch (error) {
    console.log('❌ Request failed:\n');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    console.log('\nPossible causes:');
    console.log('1. Backend not running (start: npm start)');
    console.log('2. Wrong API URL');
    console.log('3. LiveKit credentials invalid');
    console.log('4. Agent service not deployed in LiveKit\n');
  }
}

// Also test token generation with agent name
async function testAgentToken() {
  const roomName = `test-agent-token-${Date.now()}`;
  const agentName = 'Emery-2338';

  console.log('\n' + '='.repeat(60));
  console.log('Testing Agent Token Generation');
  console.log('='.repeat(60) + '\n');

  try {
    const response = await axios.post(`${API_BASE}/livekit/token`, {
      userName: agentName,
      roomName: roomName,
      isAgent: true
    });

    console.log('✅ Agent token generated:\n');
    console.log('Identity:', response.data.data.identity);
    console.log('Type:', response.data.data.type);
    console.log('Room:', response.data.data.room);
    console.log('Token length:', response.data.data.token.length);
  } catch (error) {
    console.log('❌ Token generation failed:', error.message);
  }
}

async function runAll() {
  await testDispatch();
  await testAgentToken();
  console.log('\n' + '='.repeat(60));
  console.log('Debug test complete. Check backend logs for details.');
  console.log('='.repeat(60) + '\n');
}

runAll();
