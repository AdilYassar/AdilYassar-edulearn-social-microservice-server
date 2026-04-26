/**
 * Quiz Server: Firebase Notification Service Implementation
 * 
 * This file should be created on your Quiz Server at: src/services/firebase-notification.service.js
 * It's identical to the microservice version but tailored for quiz-specific events
 */

const { getFirebaseMessaging, admin } = require('../config/firebase');
const deviceTokenRepository = require('../repositories/device-token.repository');
const logger = require('../utils/logger');
const axios = require('axios');

class FirebaseNotificationService {
    constructor() {
        // Call microservice API to sync device tokens
        this.microserviceUrl = process.env.MICROSERVICE_URL;
        this.internalToken = process.env.MICROSERVICE_INTERNAL_TOKEN;
    }

    /**
     * Send notification when user authenticates from another device
     */
    async sendAuthNotification(userUUID, deviceInfo) {
        const content = {
            title: 'New Login',
            body: `New login from ${deviceInfo.deviceName || 'a new device'}`,
            imageUrl: null
        };

        const data = {
            type: 'auth_login',
            deviceName: deviceInfo.deviceName,
            timestamp: new Date().toISOString()
        };

        return this.sendToUser(userUUID, 'auth_login', content, data);
    }

    /**
     * Send achievement unlock notification
     */
    async sendAchievementNotification(userUUID, achievement) {
        const content = {
            title: 'Achievement Unlocked! 🏆',
            body: achievement.description,
            imageUrl: achievement.imageUrl
        };

        const data = {
            type: 'achievement_unlocked',
            achievementId: achievement._id,
            achievementName: achievement.name
        };

        return this.sendToUser(userUUID, 'achievement_unlocked', content, data);
    }

    /**
     * Send quiz assigned notification
     */
    async sendQuizAssignedNotification(userUUIDs, quiz) {
        const content = {
            title: 'New Quiz Assigned',
            body: `"${quiz.title}" has been assigned to you`,
            imageUrl: quiz.imageUrl
        };

        const data = {
            type: 'quiz_assigned',
            quizId: quiz._id,
            quizTitle: quiz.title
        };

        return this.sendToUsers(userUUIDs, 'quiz_assigned', content, data);
    }

    /**
     * Send quiz results notification
     */
    async sendQuizResultNotification(userUUID, quiz, score, totalMarks) {
        const percentage = Math.round((score / totalMarks) * 100);
        const content = {
            title: `Quiz Complete! Score: ${percentage}%`,
            body: `You scored ${score}/${totalMarks} on "${quiz.title}"`,
            imageUrl: quiz.imageUrl
        };

        const data = {
            type: 'quiz_completed',
            quizId: quiz._id,
            score,
            totalMarks,
            percentage
        };

        return this.sendToUser(userUUID, 'quiz_completed', content, data);
    }

    /**
     * Core method: Send to single user
     */
    async sendToUser(userUUID, type, content, data = {}) {
        try {
            // 1. Send push notification
            await this.pushToUserDevices(userUUID, type, content, data);

            // 2. Also notify microservice to send (in case user is on microservice)
            // This ensures notification is delivered even if user is in chat/feed
            await this.notifyMicroservice(userUUID, type, content, data);

            return { success: true, userUUID };
        } catch (error) {
            logger.error(`Failed to send notification to ${userUUID}:`, error);
            throw error;
        }
    }

    /**
     * Core method: Send to multiple users
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
     * Push notification via Firebase
     */
    async pushToUserDevices(userUUID, type, content, data = {}) {
        try {
            const messaging = getFirebaseMessaging();
            if (!messaging) {
                logger.warn('Firebase messaging not initialized');
                return { success: 0, failed: 0 };
            }

            // Get device tokens (from local DB)
            const devices = await deviceTokenRepository.findByUser(userUUID);

            if (devices.length === 0) {
                logger.debug(`No devices registered for user ${userUUID}`);
                return { success: 0, failed: 0 };
            }

            const validTokens = devices.filter(d => !d.isInvalid).map(d => d.token);

            if (validTokens.length === 0) {
                logger.debug(`No valid tokens for user ${userUUID}`);
                return { success: 0, failed: 0 };
            }

            const message = {
                notification: {
                    title: content.title || 'New Notification',
                    body: content.body || ''
                },
                data: {
                    type,
                    userUUID,
                    sentAt: new Date().toISOString(),
                    ...data
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

            const response = await messaging.sendMulticast({
                ...message,
                tokens: validTokens
            });

            await this.handleMulticastResponse(userUUID, response, devices);

            logger.debug(`Sent push notification to ${userUUID}: ${response.successCount}/${validTokens.length}`);
            return { success: response.successCount, failed: response.failureCount };

        } catch (error) {
            logger.error(`Failed to push notification to ${userUUID}:`, error);
            return { success: 0, failed: 1 };
        }
    }

    /**
     * Handle invalid tokens
     */
    async handleMulticastResponse(userUUID, response, devices) {
        const invalidTokens = [];

        response.responses.forEach((resp, index) => {
            if (!resp.success) {
                const error = resp.error;

                if (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered') {
                    invalidTokens.push(devices[index].token);
                }
            }
        });

        if (invalidTokens.length > 0) {
            await deviceTokenRepository.markInvalid(invalidTokens);
        }
    }

    /**
     * Notify microservice about notification (so it can sync/store)
     * This ensures both servers are aware of notifications
     */
    async notifyMicroservice(userUUID, type, content, data) {
        if (!this.microserviceUrl) return;

        try {
            await axios.post(
                `${this.microserviceUrl}/api/v1/internal/notifications/sync`,
                {
                    userUUID,
                    type,
                    content,
                    data,
                    source: 'quiz-server'
                },
                {
                    headers: {
                        'X-Internal-Token': this.internalToken,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );

            logger.debug(`Synced notification with microservice for ${userUUID}`);
        } catch (error) {
            // Don't fail the notification if microservice is down
            logger.warn(`Failed to sync notification with microservice:`, error.message);
        }
    }

    /**
     * Register device token
     */
    async registerDeviceToken(userUUID, token, deviceInfo = {}) {
        try {
            const existing = await deviceTokenRepository.findByToken(token);

            if (existing) {
                if (existing.userUUID !== userUUID) {
                    await deviceTokenRepository.update(token, {
                        userUUID,
                        ...deviceInfo,
                        isInvalid: false
                    });
                }
                return existing;
            }

            const device = await deviceTokenRepository.create({
                userUUID,
                token,
                ...deviceInfo,
                isInvalid: false
            });

            // Sync with microservice
            await this.syncDeviceTokenWithMicroservice(userUUID, token, deviceInfo);

            logger.info(`Device token registered for ${userUUID}`);
            return device;
        } catch (error) {
            logger.error('Failed to register device token:', error);
            throw error;
        }
    }

    /**
     * Sync device token with microservice
     */
    async syncDeviceTokenWithMicroservice(userUUID, token, deviceInfo) {
        if (!this.microserviceUrl) return;

        try {
            await axios.post(
                `${this.microserviceUrl}/api/v1/internal/device-tokens/sync`,
                {
                    userUUID,
                    token,
                    deviceInfo
                },
                {
                    headers: {
                        'X-Internal-Token': this.internalToken,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );

            logger.debug(`Device token synced with microservice: ${token}`);
        } catch (error) {
            logger.warn(`Failed to sync device token with microservice:`, error.message);
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
}

module.exports = new FirebaseNotificationService();
