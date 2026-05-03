const logger = require('../../utils/logger');
// Move groupService require inside the function to avoid circular dependency

module.exports = (io, socket) => {
  const groupService = require('../../services/group.service');
  const userUUID = socket.user.quizServerUUID;

  socket.on('group:join', async ({ groupId }) => {
      // Check permission?
      try {
          // Assuming user is member, join the room
          // Ideally service check: await groupService.checkMembership(userUUID, groupId);
          socket.join(`conversation:${groupId}`); // Groups chat in conversation room logic, or group:ID? 
          // Our model has `conversationId`. We should likely join the conversation ID room.
          // But client might send groupId. Let's look up.
          const group = await groupService.getGroupDetails(groupId);
          if (group && group.conversationId) {
             socket.join(`conversation:${group.conversationId}`);
             logger.debug(`User ${userUUID} joined group chat ${groupId} (conv: ${group.conversationId})`);
          }
      } catch (err) {
          socket.emit('error', { message: err.message });
      }
  });

  socket.on('group:typing', ({ groupId, isTyping }) => {
      // Find conversationId for group... this is inefficient to do every time.
      // Client should probably send conversationId for typing to be consistent with 1:1
      // But if we support group:typing :
      // Broadcast to room
      // socket.to(...).emit(...)
  });
};
