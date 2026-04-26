const liveKitService = require('../../../services/livekit.service');
const logger = require('../../../utils/logger');

/**
 * POST /api/v1/livekit/dispatch-agent
 * Dispatch an AI agent to a LiveKit room
 * 
 * CRITICAL DEBUG: This logs everything so we can see:
 * - What room name is being sent
 * - What agent name is being used
 * - Whether dispatch succeeds or fails
 * - Any errors from LiveKit
 */
exports.dispatchAgent = async (req, res) => {
  try {
    const { roomName, agentName } = req.body;

    // Validation
    if (!roomName || !agentName) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: roomName, agentName',
        error: 'INVALID_REQUEST'
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('[DISPATCH ENDPOINT] === REQUEST RECEIVED ===');
    console.log('Room:', roomName);
    console.log('Agent:', agentName);
    console.log('Timestamp:', new Date().toISOString());
    console.log('='.repeat(60) + '\n');

    logger.info(`[DISPATCH] Request: room=${roomName}, agent=${agentName}`);

    // Dispatch the agent - let errors throw
    let dispatch;
    try {
      console.log('[DISPATCH ENDPOINT] Calling liveKitService.dispatchAgent()...');
      dispatch = await liveKitService.dispatchAgent(roomName, agentName);
    } catch (serviceError) {
      console.log('[DISPATCH ENDPOINT] ❌ Service error:', serviceError.message);
      throw serviceError;
    }

    console.log('\n' + '='.repeat(60));
    console.log('[DISPATCH ENDPOINT] === SUCCESS ===');
    console.log('='.repeat(60) + '\n');

    logger.info(`[DISPATCH] Success: agent=${agentName} dispatched to room=${roomName}`);

    res.status(200).json({
      status: 'success',
      message: 'Agent dispatched successfully',
      data: {
        room: roomName,
        agent: agentName,
        dispatch
      }
    });
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('[DISPATCH ENDPOINT] === ERROR ===');
    console.log('Error Type:', error.constructor.name);
    console.log('Error Message:', error.message);
    console.log('Full Error:', error);
    console.log('='.repeat(60) + '\n');

    logger.error(`[DISPATCH] Error: ${error.message}`);

    // Handle specific error cases
    if (error.message.includes('not found') || error.message.includes('NOT_FOUND')) {
      return res.status(404).json({
        status: 'error',
        message: 'Room or agent not found',
        error: 'NOT_FOUND',
        details: error.message
      });
    }

    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return res.status(401).json({
        status: 'error',
        message: 'Failed to authenticate with LiveKit',
        error: 'AUTH_FAILED',
        details: error.message
      });
    }

    if (error.message.includes('not initialized')) {
      return res.status(500).json({
        status: 'error',
        message: 'Agent dispatch client not initialized',
        error: 'CONFIG_ERROR',
        details: error.message
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Agent dispatch failed',
      error: 'DISPATCH_ERROR',
      details: error.message
    });
  }
};

/**
 * POST /api/v1/livekit/token
 * Generate a LiveKit access token using the official LiveKit SDK
 * Tokens are generated server-side for security (API secrets never exposed to frontend)
 * 
 * Supports both user and agent tokens:
 * - User Token: Standard participant token with auto-generated identity
 * - Agent Token: Token for agents like "Emery-2338" using agent name as identity
 */
exports.generateToken = async (req, res) => {
  try {
    const { 
      userId, 
      userName, 
      roomName, 
      participantName, 
      participantId, 
      isAgent = false,
      canPublish = true, 
      canSubscribe = true,
      canPublishData = true
    } = req.body;

    // Support both naming conventions
    const finalUserName = userName || participantName;
    const finalUserId = userId || participantId;
    const finalRoomName = roomName;

    // Validation
    if (!finalUserName || !finalRoomName) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: userName (or participantName), roomName',
        error: 'INVALID_REQUEST'
      });
    }

    // Detect if this is an agent token based on name pattern
    // Agents typically have names like "Emery-2338" or "Emery-*"
    const isAgentToken = isAgent || /^(Emery|Agent)[-_]/i.test(finalUserName);

    logger.info(`[LiveKit Token] Generating ${isAgentToken ? 'AGENT' : 'USER'} token`);
    logger.info(`[LiveKit Token] - Name: ${finalUserName}`);
    logger.info(`[LiveKit Token] - Room: ${finalRoomName}`);
    logger.info(`[LiveKit Token] - Permissions: pub=${canPublish}, sub=${canSubscribe}`);

    // Generate token using official LiveKit SDK
    const token = await liveKitService.generateToken(finalUserId || finalUserName, finalUserName, finalRoomName, {
      canPublish,
      canSubscribe,
      canPublishData,
      isAgent: isAgentToken
    });

    logger.info(`[LiveKit Token] ✅ Token generated successfully`);

    res.status(200).json({
      status: 'success',
      message: 'Token generated successfully',
      data: {
        token,
        room: finalRoomName,
        participant: finalUserName,
        identity: isAgentToken ? finalUserName : (finalUserId || `${finalUserName}-${Math.random().toString(36).substr(2, 9)}`),
        type: isAgentToken ? 'agent' : 'user'
      }
    });
  } catch (error) {
    logger.error(`[LiveKit Token] Token generation failed: ${error.message}`);

    res.status(500).json({
      status: 'error',
      message: 'Token generation failed',
      error: 'TOKEN_ERROR',
      details: error.message
    });
  }
};

/**
 * GET /api/v1/livekit/rooms
 * List all active rooms
 */
exports.listRooms = async (req, res) => {
  try {
    logger.info('Fetching list of active rooms');

    const rooms = await liveKitService.listRooms();

    res.status(200).json({
      status: 'success',
      data: rooms
    });
  } catch (error) {
    logger.error(`Failed to list rooms: ${error.message}`);

    res.status(500).json({
      status: 'error',
      message: 'Failed to list rooms',
      error: 'ROOMS_ERROR',
      details: error.message
    });
  }
};

/**
 * GET /api/v1/livekit/rooms/:roomName
 * Get info about a specific room
 */
exports.getRoomInfo = async (req, res) => {
  try {
    const { roomName } = req.params;

    if (!roomName) {
      return res.status(400).json({
        status: 'error',
        message: 'roomName is required',
        error: 'INVALID_REQUEST'
      });
    }

    logger.info(`Fetching info for room "${roomName}"`);

    const roomInfo = await liveKitService.getRoomInfo(roomName);

    res.status(200).json({
      status: 'success',
      data: roomInfo
    });
  } catch (error) {
    logger.error(`Failed to get room info: ${error.message}`);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found',
        error: 'NOT_FOUND'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to get room info',
      error: 'ROOM_ERROR',
      details: error.message
    });
  }
};
