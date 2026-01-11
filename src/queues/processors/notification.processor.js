const logger = require('../../utils/logger');
// const notificationService = require('../../services/notification.service');
// const pushNotificationService = require('../../services/push.service'); // if exists

module.exports = async (job) => {
    const { recipientUUID, type, content, data } = job.data;
    
    logger.debug(`Processing notification job ${job.id} for ${recipientUUID}`);

    try {
        // In a real app, this might trigger a Push Notification (FCM/OneSignal)
        // Since we handle in-app notifications via socket immediately in service, 
        // this queue is best for PUSH notifications/Emails to offload the main thread.
        
        // await pushNotificationService.send(recipientUUID, content);
        
        // Simulating delay/work
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return { sent: true };
    } catch (err) {
        logger.error(`Notification job failed: ${err.message}`);
        throw err;
    }
};
