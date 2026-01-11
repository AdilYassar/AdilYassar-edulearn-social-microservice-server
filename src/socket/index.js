const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { redisClient } = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const chatHandler = require('./handlers/chat.handler');
const presenceHandler = require('./handlers/presence.handler');
const groupHandler = require('./handlers/group.handler');
const feedHandler = require('./handlers/feed.handler');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origins,
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/socket.io'
  });

  /* Redis Adapter logic - Disabled to save connections on Free Tier Redis
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
     io.adapter(createAdapter(pubClient, subClient));
     logger.info('Socket.IO Redis Adapter connected');
  }).catch(err => {
      logger.error('Socket.IO Redis Adapter error', err);
  });
  */
  
  io.on('connection', async (socket) => {
    // Auth Middleware for Socket
    const token = socket.handshake.auth.token;
    if (!token) {
        logger.warn(`Socket connection attempt without token: ${socket.id}`);
        return socket.disconnect();
    }
    
    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findOne({ quizServerUUID: decoded.uuid });
        if (!user) {
             logger.warn(`User not found for socket: ${decoded.uuid}`);
             return socket.disconnect();
        }
        socket.user = user;
    } catch (err) {
        logger.error(`Socket auth failed: ${err.message}`);
        return socket.disconnect();
    }

    logger.debug(`New client connected: ${socket.id} (User: ${socket.user.name})`);
    
    // Attach Handlers
    chatHandler(io, socket);
    presenceHandler(io, socket);
    groupHandler(io, socket);
    feedHandler(io, socket);
    
    socket.on('disconnect', () => {
      logger.debug(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };
