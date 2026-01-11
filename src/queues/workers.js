const { mainQueue } = require('./index');
const notificationProcessor = require('./processors/notification.processor');
const moderationProcessor = require('./processors/moderation.processor');
const logger = require('../utils/logger');

const startWorkers = () => {
    logger.info('Starting Consolidated Queue Workers...');
    
    // We use named processors if we want to distinguish, 
    // but for now let's just use the main queue for notifications primarily
    mainQueue.process('notification', notificationProcessor);
    mainQueue.process('moderation', moderationProcessor);
    
    // Default processor if none specified
    mainQueue.process(notificationProcessor);
};

module.exports = startWorkers;
