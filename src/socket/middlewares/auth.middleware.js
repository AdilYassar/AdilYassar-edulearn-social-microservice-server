const jwt = require('jsonwebtoken');
const config = require('../../config');
const User = require('../../models/User');
const logger = require('../../utils/logger');

const authMiddleware = async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
      logger.warn(`Socket connection attempt without token: ${socket.id}`);
      return next(new Error('Authentication error'));
  }

  try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      const user = await User.findOne({ quizServerUUID: decoded.uuid });
      if (!user) {
           return next(new Error('User not found'));
      }
      
      socket.user = user;
      next();
  } catch (err) {
      logger.error(`Socket auth failed: ${err.message}`);
      return next(new Error('Authentication error'));
  }
};

module.exports = authMiddleware;
