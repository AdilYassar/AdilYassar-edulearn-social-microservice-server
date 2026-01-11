const Queue = require('bull');
const config = require('../config');
const logger = require('../utils/logger');

const mainQueue = new Queue('social-tasks', config.redis.url);

mainQueue.on('error', (err) => {
    logger.error(`Main Queue error: ${err.message}`);
});

mainQueue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} in mainQueue failed: ${err.message}`);
});

module.exports = {
   mainQueue,
   notificationQueue: mainQueue, // For compatibility
   moderationQueue: mainQueue,   // For compatibility
   analyticsQueue: mainQueue     // For compatibility
};
