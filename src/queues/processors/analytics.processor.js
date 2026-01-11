const logger = require('../../utils/logger');

const analyticsProcessor = async (job) => {
    try {
        const { type, userId, data } = job.data;
        logger.info(`Processing analytics event: ${type} for user ${userId}`, data);
        
        // In real world, push to ClickHouse, Mixpanel, or Google Analytics
        // or helper service: await analyticsService.record(type, userId, data);
        
        return { status: 'recorded' };
    } catch (error) {
        logger.error(`Analytics job failed: ${error.message}`);
        throw error;
    }
};

module.exports = analyticsProcessor;
