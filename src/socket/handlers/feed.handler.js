const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  const userUUID = socket.user.quizServerUUID;

  // Subscribe to personal feed updates?
  // Ideally feed updates are pushed via 'user:UUID' room or 'feed:UUID'
  socket.on('feed:subscribe', () => {
      socket.join(`feed:${userUUID}`);
      logger.debug(`User ${userUUID} subscribed to feed updates`);
  });

  // Client creates post -> server processes -> emits to friends
  // This usually happens via REST API, then controller calls service, service emits event.
  // So this handler might just be for specific real-time interactions if any.
  
  socket.on('feed:view', ({ postId }) => {
      // Track view count real-time?
  });
};
