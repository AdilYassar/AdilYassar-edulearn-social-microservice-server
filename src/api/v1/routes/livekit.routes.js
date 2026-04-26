const express = require('express');
const router = express.Router();
const liveKitController = require('../controllers/livekit.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * LiveKit Routes
 * Public endpoints for video/voice call functionality
 * Dispatch and token endpoints are public for frontend access
 */

/**
 * POST /api/v1/livekit/dispatch-agent
 * Dispatch an AI agent to a LiveKit room (PUBLIC - no auth required)
 * 
 * Request Body:
 * {
 *   "roomName": "playground-TkVi-UDFQ",
 *   "agentName": "Emery-2338"
 * }
 */
router.post('/dispatch-agent', liveKitController.dispatchAgent);

/**
 * POST /api/v1/livekit/token
 * Generate a LiveKit access token (PUBLIC - no auth required)
 * 
 * Request Body:
 * {
 *   "userId": "user-uuid",
 *   "userName": "John Doe",
 *   "roomName": "playground-TkVi-UDFQ",
 *   "canPublish": true,
 *   "canSubscribe": true
 * }
 */
router.post('/token', liveKitController.generateToken);

/**
 * GET /api/v1/livekit/rooms
 * List all active rooms
 */
router.get('/rooms', liveKitController.listRooms);

/**
 * GET /api/v1/livekit/rooms/:roomName
 * Get info about a specific room
 */
router.get('/rooms/:roomName', liveKitController.getRoomInfo);

module.exports = router;
