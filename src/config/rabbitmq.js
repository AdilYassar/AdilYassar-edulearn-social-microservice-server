const amqp = require('amqplib');
const config = require('./index');
const logger = require('../utils/logger');

class RabbitMQConnection {
    constructor() {
        this.connection = null;
        this.channel = null;
    }

    async connect() {
        if (this.connection) return;

        try {
            this.connection = await amqp.connect(config.rabbitmq.url);
            this.channel = await this.connection.createChannel();
            
            this.connection.on('error', (err) => {
                logger.error('RabbitMQ connection error', err);
                this.connection = null;
            });

            this.connection.on('close', () => {
                logger.warn('RabbitMQ connection closed');
                this.connection = null;
            });

            logger.info('Connected to RabbitMQ');
        } catch (error) {
            logger.error('Failed to connect to RabbitMQ', error);
            throw error;
        }
    }

    async getChannel() {
        if (!this.channel) {
            await this.connect();
        }
        return this.channel;
    }
}

module.exports = new RabbitMQConnection();
