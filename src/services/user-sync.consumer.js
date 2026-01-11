const amqp = require('amqplib');
const User = require('../models/User');
const config = require('../config');
const logger = require('../utils/logger');

class UserSyncConsumer {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async start() {
    if (!config.rabbitmq.url) {
        logger.warn('RabbitMQ URL not provided, user sync consumer skipped.');
        return;
    }

    try {
        // Connect to RabbitMQ
        this.connection = await amqp.connect(config.rabbitmq.url);
        this.channel = await this.connection.createChannel();

        // Setup exchange and queue
        await this.channel.assertExchange('quiz_server_events', 'topic', {
        durable: true
        });
        
        const queue = 'social_user_sync';
        await this.channel.assertQueue(queue, { durable: true });
        await this.channel.bindQueue(queue, 'quiz_server_events', 'user.*');

        logger.info('Waiting for user events from Quiz Server...');

        // Consume events
        this.channel.consume(queue, async (msg) => {
        if (!msg) return;

        try {
            const event = JSON.parse(msg.content.toString());
            logger.info(`Received event: ${event.eventType} for routing key: ${msg.fields.routingKey}`);

            // Safety check for event structure
            if (!event.data) {
                logger.warn('Received event with missing data payload:', event);
                return this.channel.ack(msg);
            }

            switch (event.eventType) {
                case 'created':
                    await this.handleUserCreated(event.data);
                    break;
                case 'updated':
                    await this.handleUserUpdated(event.data);
                    break;
                case 'deleted':
                    await this.handleUserDeleted(event.data);
                    break;
            }

            this.channel.ack(msg);
        } catch (error) {
            logger.error(`Error processing event: ${error.message}`);
            // Requeue if it's a transient error, otherwise maybe dead letter
            // For now, NACK without requeue to avoid loops if logic is broken
            this.channel.nack(msg, false, false); 
        }
        });
    } catch (err) {
        logger.error(`RabbitMQ Connection Error: ${err.message}`);
        // Retry logic could go here
    }
  }

  async handleUserCreated(data) {
    const exists = await User.findOne({ quizServerUUID: data.uuid });
    
    if (!exists) {
      const userType = (data.role || data.userType || 'student').toLowerCase();
      
      await User.create({
        quizServerUUID: data.uuid,
        userType, 
        name: data.name,
        avatar: data.avatar || data.photo,
        socialSettings: {
          privacy: {
            profileVisibility: 'friends',
            allowMessageRequests: true,
            showOnlineStatus: true,
            showLearningProgress: true
          },
          notifications: {
            messages: true,
            friendRequests: true,
            postLikes: true,
            postComments: true
          }
        },
        lastSyncedAt: new Date()
      });
      
      logger.info(`Created social profile for user: ${data.uuid}`);
    }
  }

  async handleUserUpdated(data) {
    const userType = (data.role || data.userType).toLowerCase();
    
    await User.updateOne(
      { quizServerUUID: data.uuid },
      {
        $set: {
          name: data.name,
          userType,
          avatar: data.avatar || data.photo,
          lastSyncedAt: new Date()
        }
      }
    );
    
    logger.info(`Synced user data: ${data.uuid}`);
  }

  async handleUserDeleted(data) {
    // Soft delete user
    await User.updateOne(
      { quizServerUUID: data.uuid },
      {
        $set: {
          isActive: false,
          deletedAt: new Date()
        }
      }
    );

    // Anonymize user's messages - unimplemented for now as Message model isn't fully ready
    // await this.anonymizeUserContent(data.uuid);
    
    logger.info(`Deleted user: ${data.uuid}`);
  }
}

module.exports = new UserSyncConsumer();
