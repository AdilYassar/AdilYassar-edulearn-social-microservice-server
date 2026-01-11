const User = require('../../models/User');
const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  const userUUID = socket.user.quizServerUUID;

  // Handle presence update
  socket.on('presence:update', async (data) => {
    try {
        const { status } = data; // 'online', 'away', 'offline'
        
        // Update DB
        await User.updateOne(
            { quizServerUUID: userUUID }, 
            { 
               isOnline: status === 'online', 
               lastSeen: new Date()
            }
        );

        // Broadcast to friends? Or to anyone subscribed?
        // Let's broadcast to the 'global' presence channel for simplicity in this microservice pattern,
        // OR better, friends subscribe to `presence:UUID` rooms?
        // Architecture suggested `channel:presence`
        
        // socket.broadcast.emit('presence:status', { userUUID, status, lastSeen: new Date() });
        // ^ Too noisy for all.
        
        // Better:
        io.emit('presence:status', { userUUID, status, lastSeen: new Date() });
        
    } catch (err) {
        logger.error(`Presence update error: ${err.message}`);
    }
  });

  socket.on('presence:subscribe', ({ userUUIDs }) => {
     // If we use rooms for presence updates
     userUUIDs.forEach(uuid => {
         socket.join(`presence:${uuid}`);
     });
  });
  
  // On disconnect, mark offline
  socket.on('disconnect', async () => {
      await User.updateOne(
          { quizServerUUID: userUUID },
          { 
              isOnline: false, 
              lastSeen: new Date() 
          }
      );
      io.emit('presence:status', { userUUID, status: 'offline', lastSeen: new Date() });
  });
};
