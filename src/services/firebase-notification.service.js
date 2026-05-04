const { getFirebaseMessaging, admin } = require('../config/firebase');
const deviceTokenRepository = require('../repositories/device-token.repository');
const notificationRepository = require('../repositories/notification.repository');
const userRepository = require('../repositories/user.repository');
const logger = require('../utils/logger');

class FirebaseNotificationService {
    /**
     * Send notification to a single user
     * @param {string} recipientUUID - User UUID
     * @param {string} type - Notification type (friend_request, message, etc)
     * @param {object} content - {title, body, imageUrl}
     * @param {object} data - Additional metadata {targetType, targetId, actorUUID, etc}
     */
    async sendToUser(recipientUUID, type, content, data = {}) {
        try {
            // 1. Store in database
            const notification = await notificationRepository.create({
                recipientUUID,
                type,
                ...content,
                targetType: data.targetType,
                targetId: data.targetId,
                actorUUID: data.actorUUID,
                content: {
                    ...content,
                    data
                }
            });

            // 2. Send real-time via Socket.IO (if connected)
            this.emitSocketNotification(recipientUUID, notification);

            // 3. Send combined push notification (Visible + Data in one message)
            // This prevents the "Double Notification" issue
            await this.pushToUserDevices(recipientUUID, type, content, {
                ...data,
                subType: 'NOTIFICATION_RECEIVED',
                payload: JSON.stringify(notification)
            });

            return notification;
        } catch (error) {
            logger.error(`Failed to send notification to ${recipientUUID}:`, error);
            throw error;
        }
    }

    /**
     * Send notification to multiple users
     */
    async sendToUsers(userUUIDs, type, content, data = {}) {
        const results = await Promise.allSettled(
            userUUIDs.map(uuid => this.sendToUser(uuid, type, content, data))
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        logger.info(`Sent notifications to ${successful}/${userUUIDs.length} users. Failed: ${failed}`);
        return { successful, failed, results };
    }

    /**
     * Send firebase push notification
     */
    async pushToUserDevices(recipientUUID, type, content, data = {}) {
        try {
            const messaging = getFirebaseMessaging();
            if (!messaging) {
                logger.warn('Firebase messaging not initialized');
                return { success: 0, failed: 0 };
            }

            // Get all device tokens for this user
            const devices = await deviceTokenRepository.findByUser(recipientUUID);
            
            if (devices.length === 0) {
                logger.debug(`No devices registered for user ${recipientUUID}`);
                return { success: 0, failed: 0 };
            }

            const validTokens = devices.filter(d => !d.isInvalid).map(d => d.token);
            
            if (validTokens.length === 0) {
                logger.debug(`No valid tokens for user ${recipientUUID}`);
                return { success: 0, failed: 0 };
            }

            // Prepare Firebase message
            const message = {
                notification: {
                    title: content.title || 'New Notification',
                    body: content.body || ''
                },
                data: {
                    type,
                    recipientUUID,
                    sentAt: new Date().toISOString(),
                    ...data // Include custom data
                },
                ...(content.imageUrl && { webpush: { notification: { icon: content.imageUrl } } }),
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'default'
                    }
                },
                apns: {
                    headers: {
                        'apns-priority': '10'
                    }
                }
            };

            // Send to multiple devices
            const response = await messaging.sendEachForMulticast({
                ...message,
                tokens: validTokens
            });

            // Handle responses
            await this.handleMulticastResponse(recipientUUID, response, devices);

            logger.debug(`Sent push notification to ${recipientUUID}: ${response.successCount}/${validTokens.length}`);
            return { success: response.successCount, failed: response.failureCount };

        } catch (error) {
            logger.error(`Failed to push notification to ${recipientUUID}:`, error);
            return { success: 0, failed: 1 };
        }
    }

    /**
     * Send a "silent" data-only message for real-time social events
     * @param {string} recipientUUID - User UUID
     * @param {object} eventData - {subType, payload}
     */
    async sendDataToUser(recipientUUID, eventData) {
        try {
            const messaging = getFirebaseMessaging();
            if (!messaging) return { success: 0, failed: 0 };

            const devices = await deviceTokenRepository.findByUser(recipientUUID);
            const validTokens = devices.filter(d => !d.isInvalid).map(d => d.token);
            
            if (validTokens.length === 0) return { success: 0, failed: 0 };

            const message = {
                data: {
                    type: 'SOCIAL_EVENT',
                    ...eventData,
                    sentAt: new Date().toISOString(),
                    isSilent: 'true' 
                },
                android: { 
                    priority: 'high' 
                },
                apns: { 
                    payload: { 
                        aps: { 'content-available': 1 } 
                    } 
                }
            };

            const response = await messaging.sendEachForMulticast({
                ...message,
                tokens: validTokens
            });

            await this.handleMulticastResponse(recipientUUID, response, devices);
            logger.debug(`Sent data message to ${recipientUUID}: ${response.successCount}/${validTokens.length}`);
            return { success: response.successCount, failed: response.failureCount };
        } catch (error) {
            logger.error(`Failed to send data message to ${recipientUUID}:`, error);
            return { success: 0, failed: 1 };
        }
    }

    /**
     * Send silent data messages to multiple users
     */
    async sendDataToUsers(userUUIDs, eventData) {
        const results = await Promise.allSettled(
            userUUIDs.map(uuid => this.sendDataToUser(uuid, eventData))
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        return { successful, total: userUUIDs.length };
    }

    /**
     * Handle Firebase multicast response (mark invalid tokens)
     */
    async handleMulticastResponse(recipientUUID, response, devices) {
        const invalidTokens = [];

        response.responses.forEach((resp, index) => {
            if (!resp.success) {
                const error = resp.error;
                
                // Mark token as invalid if it's unrecoverable
                if (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered') {
                    invalidTokens.push(devices[index].token);
                    logger.debug(`Invalid token marked: ${devices[index].token}`);
                }
            }
        });

        // Update invalid tokens in database
        if (invalidTokens.length > 0) {
            await deviceTokenRepository.markInvalid(invalidTokens);
        }
    }

    /**
     * Emit real-time notification via Socket.IO
     */
    emitSocketNotification(recipientUUID, notification) {
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            if (io) {
                io.to(`user:${recipientUUID}`).emit('notification:new', notification);
                logger.debug(`Socket notification emitted to user:${recipientUUID}`);
            }
        } catch (error) {
            logger.warn('Socket notification failed (user might be offline):', error.message);
        }
    }

    /**
     * Register device token for a user
     * Called by frontend when FCM token is obtained
     */
    async registerDeviceToken(userUUID, token, deviceInfo = {}) {
        try {
            // Check if token already exists
            const existing = await deviceTokenRepository.findByToken(token);
            
            if (existing) {
                // Update existing token
                if (existing.userUUID !== userUUID) {
                    // Token moved to new user - update it
                    await deviceTokenRepository.update(token, {
                        userUUID,
                        ...deviceInfo,
                        isInvalid: false
                    });
                }
                return existing;
            }

            // Register new token
            const device = await deviceTokenRepository.create({
                userUUID,
                token,
                ...deviceInfo,
                isInvalid: false
            });

            logger.info(`Device token registered for ${userUUID}`);
            return device;
        } catch (error) {
            logger.error('Failed to register device token:', error);
            throw error;
        }
    }

    /**
     * Unregister device token
     */
    async unregisterDeviceToken(token) {
        try {
            await deviceTokenRepository.delete(token);
            logger.info(`Device token unregistered: ${token}`);
        } catch (error) {
            logger.error('Failed to unregister device token:', error);
            throw error;
        }
    }

    /**
     * Send notification to ALL registered devices (Broadcast)
     * Also saves to database for all users so it appears in notification lists
     */
    async broadcast(type, content, data = {}) {
        try {
            const actorUUID = data.actorUUID;

            // 1. Persist in database for all active users
            try {
                const allUserUUIDs = await userRepository.findAllUUIDs();
                const recipientUUIDs = actorUUID 
                    ? allUserUUIDs.filter(uuid => uuid !== actorUUID)
                    : allUserUUIDs;

                if (recipientUUIDs.length > 0) {
                    const Notification = require('../models/Notification');
                    const notifications = recipientUUIDs.map(uuid => ({
                        recipientUUID: uuid,
                        type,
                        ...content,
                        targetType: data.targetType,
                        targetId: data.targetId,
                        actorUUID: data.actorUUID,
                        content: {
                            ...content,
                            data
                        }
                    }));
                    
                    // Insert in chunks of 500 to avoid BSON document size limits
                    const chunkSize = 500;
                    for (let i = 0; i < notifications.length; i += chunkSize) {
                        const chunk = notifications.slice(i, i + chunkSize);
                        await Notification.insertMany(chunk, { ordered: false });
                    }
                    logger.debug(`Broadcast persisted for ${recipientUUIDs.length} users`);
                }
            } catch (dbError) {
                logger.error('Failed to persist broadcast notifications:', dbError);
                // Continue with push even if DB save fails
            }

            // 2. Send Push Notifications
            const messaging = getFirebaseMessaging();
            if (!messaging) return { success: 0, failed: 0 };

            const allDevices = await deviceTokenRepository.findAllValidTokens();
            if (allDevices.length === 0) return { success: 0, failed: 0 };

            // Exclude actor's tokens to prevent self-notification
            const filteredDevices = actorUUID 
                ? allDevices.filter(d => d.userUUID !== actorUUID)
                : allDevices;

            if (filteredDevices.length === 0) return { success: 0, failed: 0 };
            const tokens = filteredDevices.map(d => d.token);
            
            // Prepare Message
            const message = {
                notification: {
                    title: content.title || 'New Update',
                    body: content.body || ''
                },
                data: {
                    type,
                    sentAt: new Date().toISOString(),
                    ...data
                }
            };

            // Chunk tokens (Firebase limit is 500 per call for sendEachForMulticast)
            let successCount = 0;
            let failureCount = 0;
            const pushChunkSize = 500;

            for (let i = 0; i < tokens.length; i += pushChunkSize) {
                const chunk = tokens.slice(i, i + pushChunkSize);
                const response = await messaging.sendEachForMulticast({
                    ...message,
                    tokens: chunk
                });
                successCount += response.successCount;
                failureCount += response.failureCount;
                
                // Handle invalid tokens for this chunk
                // We use the full allDevices list but offset correctly
                const chunkDevices = filteredDevices.slice(i, i + pushChunkSize);
                await this.handleMulticastResponse(null, response, chunkDevices);
            }

            logger.info(`Broadcast notification sent to ${successCount} devices. Failed: ${failureCount}`);
            return { success: successCount, failed: failureCount };
        } catch (error) {
            logger.error('Failed to broadcast notification:', error);
            return { success: 0, failed: 1 };
        }
    }

    /**
     * Test Firebase connection
     */
    async testConnection() {
        try {
            const messaging = getFirebaseMessaging();
            if (!messaging) {
                return { status: 'not_configured' };
            }

            // Try to send a test message (we'll catch errors)
            return { status: 'connected', projectId: admin.apps[0]?.options?.projectId };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }
}

module.exports = new FirebaseNotificationService();
