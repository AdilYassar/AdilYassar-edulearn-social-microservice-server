const { AccessToken, AgentDispatchClient } = require('livekit-server-sdk');
const config = require('../config');
const logger = require('../utils/logger');

// === CREDENTIAL SETUP: Prioritize config, fallback to hardcoded ===
const LIVEKIT_URL = config.livekit.url || 'wss://edulearn-yk8z461f.livekit.cloud';
const LIVEKIT_API_KEY = config.livekit.apiKey || 'APICnhfusNi9Gcz';
const LIVEKIT_API_SECRET = config.livekit.apiSecret || 'g5on4I7v5SmcZ53LpA8c7lEsi38MzSy1HesNl0M4GfY';

// === SINGLETON GUARD: Prevent double initialization ===
let agentDispatchClient = null;
let initializationAttempted = false;
let initializationSucceeded = false;

function initializeAgentDispatchClient() {
  // Already attempted initialization - don't try again
  if (initializationAttempted) {
    console.log(`[LiveKit Service] ⏭️  Already attempted initialization (success: ${initializationSucceeded})`);
    return initializationSucceeded;
  }

  initializationAttempted = true;

  console.log('\n' + '='.repeat(60));
  console.log('[LiveKit Service] === INITIALIZING AGENT DISPATCH CLIENT ===');
  console.log('[LiveKit Service] Credentials source:');
  console.log('  URL from config:', config.livekit.url ? '✅ CONFIG' : '❌ using hardcoded');
  console.log('  API Key from config:', config.livekit.apiKey ? '✅ CONFIG' : '❌ using hardcoded');
  console.log('  API Secret from config:', config.livekit.apiSecret ? '✅ CONFIG' : '❌ using hardcoded');
  console.log('[LiveKit Service] Using:');
  console.log('  LIVEKIT_URL:', LIVEKIT_URL);
  console.log('  LIVEKIT_API_KEY:', LIVEKIT_API_KEY.substring(0, 8) + '...');
  console.log('  LIVEKIT_API_SECRET:', LIVEKIT_API_SECRET.substring(0, 8) + '...');
  console.log('='.repeat(60) + '\n');

  try {
    // Convert wss:// to https:// for AgentDispatchClient HTTP endpoint
    const httpUrl = LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://');
    
    console.log('[LiveKit Service] Creating AgentDispatchClient with HTTP URL:', httpUrl);
    
    agentDispatchClient = new AgentDispatchClient(
      httpUrl,
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET
    );
    
    initializationSucceeded = true;
    console.log('[LiveKit Service] ✅ SUCCESS: AgentDispatchClient created');
    
    logger.info(`[LiveKit] ✅ AgentDispatchClient initialized`);
    logger.info(`[LiveKit] - URL: ${httpUrl}`);
    logger.info(`[LiveKit] - API Key: ${LIVEKIT_API_KEY.substring(0, 8)}...`);
    
    return true;
  } catch (error) {
    console.error('[LiveKit Service] ❌ FAILED: Error creating AgentDispatchClient:');
    console.error('  Error Type:', error.constructor.name);
    console.error('  Error Message:', error.message);
    console.error('  Stack:', error.stack);
    
    logger.error(`[LiveKit] ❌ Failed to initialize AgentDispatchClient`);
    logger.error(`[LiveKit] - Error: ${error.message}`);
    logger.error(`[LiveKit] - Stack: ${error.stack}`);
    
    return false;
  }
}

// Initialize on module load
console.log('[LiveKit Service] Module loaded, initializing...');
initializeAgentDispatchClient();

class LiveKitService {
  /**
   * Generate a LiveKit access token for a user or agent
   * Uses the official LiveKit SDK for secure server-side token generation
   * Tokens are never generated on the frontend for security
   * 
   * @param {string} userId - User's unique identifier (or agent name like "Emery-2338")
   * @param {string} userName - User's display name (required)
   * @param {string} roomName - Room name to join (required)
   * @param {object} options - Additional token options
   * @param {boolean} options.isAgent - Whether this token is for an agent
   * @returns {string} JWT token
   */
  async generateToken(userId, userName, roomName, options = {}) {
    try {
      const {
        canPublish = true,
        canPublishData = true,
        canSubscribe = true,
        metadata = '',
        isAgent = false
      } = options;

      // For agents, use the agent name as identity (e.g., "Emery-2338")
      // For users, generate a unique identity if not provided
      const identity = isAgent 
        ? userId  // Agent name directly: "Emery-2338"
        : (userId || `${userName}-${Math.random().toString(36).substr(2, 9)}`);

      logger.info(`[LiveKit Token] Generating token for: ${userName}`);
      logger.info(`[LiveKit Token] - Identity: ${identity}`);
      logger.info(`[LiveKit Token] - Room: ${roomName}`);
      logger.info(`[LiveKit Token] - Type: ${isAgent ? 'AGENT' : 'USER'}`);
      logger.info(`[LiveKit Token] - Permissions: pub=${canPublish}, sub=${canSubscribe}`);

      // Create access token using LiveKit SDK
      const at = new AccessToken(
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET
      );

      // Set participant identity and name
      at.identity = identity;
      at.name = userName;
      at.metadata = metadata;

      // Add video grant with permissions
      // Grants allow the participant to publish/subscribe to video/audio
      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: canPublish,
        canPublishData: canPublishData,
        canSubscribe: canSubscribe
      });

      // Generate JWT token
      const jwt = await at.toJwt();

      logger.info(`[LiveKit Token] ✅ Token generated successfully`);
      logger.info(`[LiveKit Token] - Token length: ${jwt.length} characters`);
      
      return jwt;
    } catch (error) {
      logger.error(`[LiveKit Token] Failed to generate token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Dispatch an AI agent to a LiveKit room
   * CRITICAL: This actually calls LiveKit to deploy the agent to the room
   * 
   * @param {string} roomName - Room name to dispatch to
   * @param {string} agentName - Agent identifier (e.g., "Emery-2338")
   * @returns {object} Dispatch response from LiveKit
   */
  async dispatchAgent(roomName, agentName) {
    try {
      // Validate inputs
      if (!roomName || !agentName) {
        throw new Error('roomName and agentName are required');
      }

      // Re-initialize if we haven't done so yet
      if (!initializationAttempted) {
        console.log('[LiveKit Service] ⚠️  Module still not initialized, attempting now...');
        initializeAgentDispatchClient();
      }

      // Check if AgentDispatchClient is initialized
      if (!agentDispatchClient) {
        const criticalError = `AgentDispatchClient is NULL. Initialization succeeded: ${initializationSucceeded}. Check LiveKit credentials (URL="${LIVEKIT_URL}", key="${LIVEKIT_API_KEY.substring(0, 8)}...")`;
        logger.error(`[LiveKit] ❌ CRITICAL: ${criticalError}`);
        throw new Error(criticalError);
      }

      logger.info(`\n${'='.repeat(60)}`);
      logger.info(`[LiveKit Agent] === DISPATCH CALLED ===`);
      logger.info(`[LiveKit Agent] Room: ${roomName}`);
      logger.info(`[LiveKit Agent] Agent: ${agentName}`);
      logger.info(`[LiveKit Agent] Using URL: ${LIVEKIT_URL}`);
      logger.info(`[LiveKit Agent] Timestamp: ${new Date().toISOString()}`);
      logger.info(`${'='.repeat(60)}\n`);

      // Call LiveKit to dispatch the agent
      logger.info(`[LiveKit Agent] Calling agentDispatchClient.createDispatch()...`);
      
      const dispatch = await agentDispatchClient.createDispatch(roomName, agentName);

      logger.info(`\n${'='.repeat(60)}`);
      logger.info(`[LiveKit Agent] === DISPATCH SUCCESS ===`);
      logger.info(`[LiveKit Agent] Agent "${agentName}" dispatched to room "${roomName}"`);
      logger.info(`[LiveKit Agent] Response:`);
      logger.info(`[LiveKit Agent] ${JSON.stringify(dispatch, null, 2)}`);
      logger.info(`${'='.repeat(60)}\n`);

      return dispatch;
    } catch (error) {
      logger.error(`\n${'='.repeat(60)}`);
      logger.error(`[LiveKit Agent] === DISPATCH FAILED ===`);
      logger.error(`[LiveKit Agent] Room: ${roomName}`);
      logger.error(`[LiveKit Agent] Agent: ${agentName}`);
      logger.error(`[LiveKit Agent] Error Type: ${error.constructor.name}`);
      logger.error(`[LiveKit Agent] Error Message: ${error.message}`);
      logger.error(`[LiveKit Agent] Full Error:`, error);
      logger.error(`${'='.repeat(60)}\n`);
      
      throw error;
    }
  }

  /**
   * List active rooms
   * @returns {array} Array of active rooms
   */
  async listRooms() {
    try {
      // Placeholder for room listing functionality
      logger.info('Listing active rooms');
      return [];
    } catch (error) {
      logger.error(`Failed to list rooms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get room info
   * @param {string} roomName - Room name
   * @returns {object} Room information
   */
  async getRoomInfo(roomName) {
    try {
      if (!roomName) {
        throw new Error('roomName is required');
      }

      logger.info(`Fetching info for room "${roomName}"`);
      return null; // Placeholder
    } catch (error) {
      logger.error(`Failed to get room info: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new LiveKitService();
