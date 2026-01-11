const jwt = require('jsonwebtoken');
const config = require('../../../config');
const User = require('../../../models/User');
const logger = require('../../../utils/logger');

exports.authenticate = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }

    // Verify token using SAME secret as Quiz Server
    const decoded = jwt.verify(token, config.jwt.secret);

    // Find user in social DB
    let user = await User.findOne({ quizServerUUID: decoded.uuid });

    if (!user) {
      // Create social profile on first access (Lazy Sync)
      try {
          user = await User.create({
            quizServerUUID: decoded.uuid,
            userType: decoded.type || 'student',
            name: decoded.name || 'User',
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
            }
          });
          logger.info(`Initialized social profile for: ${decoded.uuid}`);
      } catch (err) {
          logger.warn(`Could not auto-create user (might exist): ${err.message}`);
          user = await User.findOne({ quizServerUUID: decoded.uuid });
      }
    }

    if (!user) {
         return res.status(500).json({ error: 'Failed to initialize user session' });
    }

    // Attach user info to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    logger.error(`Auth Error: ${error.message}`);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
