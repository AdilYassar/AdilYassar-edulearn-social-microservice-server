## 🔍 Agent Dispatch Debugging Checklist

**Problem:** Agent (Emery-2338) never appears in LiveKit rooms  
**Status:** Implementation fixed - now with full debugging enabled  

---

## ✅ What We Fixed

1. **AgentDispatchClient Initialization** ✅
   - Now initializes at module startup
   - Converts `wss://` URL to `https://` for AgentDispatchClient
   - Exports error if credentials missing

2. **Error Handling** ✅
   - No longer silently catching dispatch failures
   - Errors propagate all the way to frontend
   - Status codes: 404 (not found), 401 (auth), 500 (other)

3. **Debug Logging** ✅
   - Added console.log + logger throughout dispatch flow
   - Shows exact room name and agent name being sent
   - Shows if dispatch succeeds or where it fails

4. **LiveKit SDK** ✅
   - Using `AccessToken` + `addGrant()` for tokens (correct)
   - Using `AgentDispatchClient` for dispatch (correct)
   - Support for agent tokens with identity = agent name

---

## 🔧 Test the Fix

### Step 1: Start Backend
```bash
cd d:\Apps\chatting_microservice
npm start
```

Watch for this in logs:
```
[LiveKit Agent] AgentDispatchClient initialized
[LiveKit Agent] - URL: https://edulearn-yk8z461f.livekit.cloud
```

### Step 2: Run Debug Test
```bash
node tests/debug-agent-dispatch.js
```

This will show:
- Room name being dispatched to
- Agent being dispatched
- Success/failure response
- Console logs from backend

### Step 3: Check Backend Logs

Backend logs should show:
```
============================================================
[DISPATCH ENDPOINT] === REQUEST RECEIVED ===
Room: playground-ABC123
Agent: Emery-2338
Timestamp: 2026-04-02T04:52:00.000Z
============================================================

[LiveKit Agent] === DISPATCH CALLED ===
[LiveKit Agent] Room: playground-ABC123
[LiveKit Agent] Agent: Emery-2338
[LiveKit Agent] LiveKit URL: wss://edulearn-yk8z461f.livekit.cloud

[LiveKit Agent] Calling agentDispatchClient.createDispatch()...
```

Then EITHER:

**✅ SUCCESS:**
```
============================================================
[LiveKit Agent] === DISPATCH SUCCESS ===
[LiveKit Agent] Agent "Emery-2338" dispatched to room "playground-ABC123"
[LiveKit Agent] Response: { ... }
============================================================
```

**❌ FAILURE:**
```
============================================================
[LiveKit Agent] === DISPATCH FAILED ===
[LiveKit Agent] Error Type: RangeError/TypeError/Error
[LiveKit Agent] Error Message: [specific error]
============================================================
```

---

## 🐛 Diagnosis Guide

### If you see: "Agent dispatch succeeded" but agent still doesn't appear

**Possibility 1: Room name mismatch**
- Backend dispatching to: `playground-ABC123`
- App joining: `call-987654`
- **Fix:** Trace app code to see what room name it sends to dispatch endpoint

**Possibility 2: Agent not registered**
- Dispatch succeeds but in LiveKit Cloud dashboard
- Go to Agents section
- Check if "Emery-2338" exists
- **Fix:** Register agent in LiveKit if missing

**Possibility 3: Agent service not running**
- Agent is registered but offline
- In LiveKit dashboard: Agents → Emery-2338 → Status
- Should show "Active/Running"
- **Fix:** Deploy agent service to LiveKit

### If you see: Token generation error "VideoGrant is not a constructor"

**Already fixed!** We now use `addGrant()` instead of `new VideoGrant()`.

### If you see: "AgentDispatchClient not initialized"

Check these:
1. Is `.env` file missing `LIVEKIT_API_KEY`?
2. Is `.env` file missing `LIVEKIT_API_SECRET`?
3. Is `.env` file missing `LIVEKIT_URL`?

Verify:
```bash
echo %LIVEKIT_URL%
echo %LIVEKIT_API_KEY%
echo %LIVEKIT_API_SECRET%
```

All three must be set.

---

## 🎯 What to Share with DevOps

From your debug logs, provide:

1. **Exact error message** from dispatch failure
2. **Room name** being dispatched to
3. **Console output** from `node tests/debug-agent-dispatch.js`
4. **Backend logs** showing `[DISPATCH ENDPOINT]` markers

This will tell DevOps:
- Is the URL format wrong?
- Are credentials invalid?
- Is the agent service deployed?
- Is there a room name mismatch?

---

## 📋 Frontend Room Name Check

**Critical:** Frontend must send EXACT room name to dispatch endpoint that it uses for `room.connect()`.

If your React Native app uses:
```javascript
const room = new Room();
await room.connect(livekitURL, accessToken);
```

Then room name is in the token. Dispatch MUST use same room name.

**Add this to frontend debug:**
```javascript
console.log('Room name for dispatch:', roomName);
console.log('Room name for connect:', room.name);
// These must match!
```

---

## 🚀 Success Criteria

✅ Dispatch returns `success: true`  
✅ Backend logs show `DISPATCH SUCCESS`  
✅ In LiveKit dashboard:
   - Room exists
   - Agent participant appears
   - Agent has permissions
   - Audio/video flows

If ANY of these are false, dispatch succeeded but agent didn't join = LiveKit service issue, not backend.

---

**Generated:** April 2, 2026  
**Backend Status:** ✅ Ready to debug  
**Next Step:** Run `node tests/debug-agent-dispatch.js` and share output
