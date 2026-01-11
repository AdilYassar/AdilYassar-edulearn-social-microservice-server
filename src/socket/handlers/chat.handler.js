const logger = require('../../utils/logger');
const chatService = require('../../services/chat.service');

module.exports = (io, socket) => {
  const userUUID = socket.user.quizServerUUID;

  // Join user's personal room for notifications
  socket.join(`user:${userUUID}`);
  logger.debug(`User ${userUUID} joined room user:${userUUID}`);

  // Join conversation rooms
  socket.on('conversation:join', ({ conversationId }) => {
    socket.join(`conversation:${conversationId}`);
    logger.debug(`User ${userUUID} joined conversation:${conversationId}`);
  });

  socket.on('conversation:leave', ({ conversationId }) => {
    socket.leave(`conversation:${conversationId}`);
    logger.debug(`User ${userUUID} left conversation:${conversationId}`);
  });

  socket.on('message:send', async (data) => {
      try {
          const { conversationId, content, type } = data;
          const message = await chatService.sendMessage(userUUID, conversationId, content, type);
          // Emitted by service, but we could ack here
          socket.emit('message:sent', { tempId: data.tempId, message }); 
      } catch (err) {
          socket.emit('error', { message: err.message });
      }
  });

  socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', { conversationId, userUUID });
  });

  socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', { conversationId, userUUID });
  });
};
