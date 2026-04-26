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

    // DEBUG: Log the decoded payload to see what's actually coming from the Quiz Server
    logger.debug('Decoded JWT payload:', decoded);

    // Some systems use 'id', some use 'uuid', some use 'sub', some 'userUuid'
    const userUuid = decoded.uuid || decoded.id || decoded.sub || decoded.userUuid;

    if (!userUuid) {
        logger.error('Token payload missing user identifier (uuid/id/sub):', decoded);
        return res.status(401).json({ error: 'Token payload missing user identifier' });
    }

    // Find user in social DB
    let user = await User.findOne({ quizServerUUID: userUuid });

    if (!user) {
      // Create social profile on first access (Lazy Sync)
      try {
          user = await User.create({
            quizServerUUID: userUuid,
            userType: (decoded.type || decoded.role || 'student').toLowerCase(),
            name: decoded.name || decoded.username || 'User',
            avatar: decoded.avatar || decoded.photo,
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
          logger.info(`Initialized social profile for: ${userUuid}`);
      } catch (err) {
          logger.warn(`Could not auto-create user: ${err.message}`);
          user = await User.findOne({ quizServerUUID: userUuid });
      }
    } else {
        // Update user data from JWT if it's currently generic or missing
        if ((!user.name || user.name === 'User') && decoded.name) {
            user.name = decoded.name;
            user.avatar = decoded.avatar || decoded.photo || user.avatar;
            await user.save();
            logger.info(`Updated existing social profile with name from JWT: ${userUuid}`);
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
