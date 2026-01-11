const { createClient } = require('redis');
const config = require('./index');
const logger = require('../utils/logger');

const redisClient = createClient({
  url: config.redis.url
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

const connectRedis = async () => {
  await redisClient.connect();
};

module.exports = { redisClient, connectRedis };
