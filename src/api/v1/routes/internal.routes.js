const express = require('express');
const router = express.Router();
const deviceTokenRepository = require('../../../repositories/device-token.repository');
const notificationRepository = require('../../../repositories/notification.repository');
const logger = require('../../../utils/logger');

/**
 * Internal API routes - Called by Quiz Server
 * All routes require X-Internal-Token header for authentication
 * 
 * Usage from Quiz Server:
 * headers: { 'X-Internal-Token': process.env.MICROSERVICE_INTERNAL_TOKEN }
 */

const authenticateInternal = (req, res, next) => {
    const token = req.headers['x-internal-token'];
    const expectedToken = process.env.MICROSERVICE_INTERNAL_TOKEN || 'internal-secret-token';

    if (token !== expectedToken) {
        return res.status(401).json({ error: 'Unauthorized internal request' });
    }

    next();
};

router.use(authenticateInternal);

/**
 * POST /api/v1/internal/device-tokens/sync
 * 
 * Quiz Server calls this when a device token is registered
 * Allows microservice to store copy of the token for sending notifications
 * 
 * Body:
 * {
 *   userUUID: "user-123",
 *   token: "firebase-token-xyz",
 *   deviceInfo: { deviceType: "ios", deviceName: "iPhone", osVersion: "17.2" }
 * }
 */
router.post('/device-tokens/sync', async (req, res) => {
    try {
        const { userUUID, token, deviceInfo } = req.body;

        if (!userUUID || !token) {
            return res.status(400).json({ error: 'userUUID and token are required' });
        }

        // Check if token already exists
        const existing = await deviceTokenRepository.findByToken(token);

        if (existing) {
            // Update if user changed
            if (existing.userUUID !== userUUID) {
                await deviceTokenRepository.update(token, {
                    userUUID,
                    ...deviceInfo,
                    isInvalid: false
                });
            }
        } else {
            // Create new token
            await deviceTokenRepository.create({
                userUUID,
                token,
                ...(deviceInfo || {}),
                isInvalid: false
            });
        }

        logger.info(`Device token synced from Quiz Server: ${token}`);
        res.status(200).json({
            status: 'success',
            message: 'Device token synced'
        });
    } catch (error) {
        logger.error('Failed to sync device token:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

/**
 * POST /api/v1/internal/notifications/sync
 * 
 * Quiz Server calls this when it sends a notification
 * Allows microservice to know about notifications from Quiz Server
 * (Optional but useful for unified notification history)
 * 
 * Body:
 * {
 *   userUUID: "user-123",
 *   type: "auth_login",
 *   content: { title: "New Login", body: "...", imageUrl: "..." },
 *   data: { deviceName: "iPhone", ... },
 *   source: "quiz-server"
 * }
 */
router.post('/notifications/sync', async (req, res) => {
    try {
        const { userUUID, type, content, data, source } = req.body;

        if (!userUUID || !type) {
            return res.status(400).json({ error: 'userUUID and type are required' });
        }

        // Store the notification in microservice DB for audit/logging
        const notification = await notificationRepository.create({
            recipientUUID: userUUID,
            type,
            ...content,
            targetType: data?.targetType,
            targetId: data?.targetId,
            actorUUID: data?.actorUUID,
            content: {
                ...content,
                data,
                source // Track that this came from Quiz Server
            }
        });

        logger.info(`Notification synced from Quiz Server: ${notification._id}`);
        res.status(200).json({
            status: 'success',
            message: 'Notification synced',
            data: notification
        });
    } catch (error) {
        logger.error('Failed to sync notification:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

/**
 * GET /api/v1/internal/device-tokens/:userUUID
 * 
 * Quiz Server calls this to get all device tokens for a user
 * Useful if Quiz Server needs to send notifications but doesn't store tokens
 * 
 * Response:
 * {
 *   status: "success",
 *   data: [
 *     { token: "firebase-token-1", deviceType: "ios", ... },
 *     { token: "firebase-token-2", deviceType: "android", ... }
 *   ]
 * }
 */
router.get('/device-tokens/:userUUID', async (req, res) => {
    try {
        const { userUUID } = req.params;

        const devices = await deviceTokenRepository.findByUser(userUUID);

        res.status(200).json({
            status: 'success',
            data: devices
        });
    } catch (error) {
        logger.error('Failed to get device tokens:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

/**
 * POST /api/v1/internal/device-tokens/mark-invalid
 * 
 * Quiz Server calls this to mark tokens as invalid
 * When Firebase rejects a token, mark it invalid so we don't retry
 * 
 * Body:
 * {
 *   tokens: ["firebase-token-1", "firebase-token-2"]
 * }
 */
router.post('/device-tokens/mark-invalid', async (req, res) => {
    try {
        const { tokens } = req.body;

        if (!tokens || !Array.isArray(tokens)) {
            return res.status(400).json({ error: 'tokens array is required' });
        }

        await deviceTokenRepository.markInvalid(tokens);

        logger.info(`Marked ${tokens.length} tokens as invalid`);
        res.status(200).json({
            status: 'success',
            message: `Marked ${tokens.length} tokens as invalid`
        });
    } catch (error) {
        logger.error('Failed to mark tokens invalid:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
