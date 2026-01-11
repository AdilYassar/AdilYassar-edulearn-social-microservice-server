require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY,
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY,
  },
  quizServer: {
    url: process.env.QUIZ_SERVER_URL,
    internalToken: process.env.QUIZ_SERVER_INTERNAL_TOKEN,
  },
  mongo: {
    uri: process.env.MONGODB_URI,
    poolSize: parseInt(process.env.MONGODB_POOL_SIZE, 10) || 10,
  },
  redis: {
    url: process.env.REDIS_URL,
    ttl: parseInt(process.env.REDIS_CACHE_TTL, 10) || 300,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
  },
  googleDrive: {
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN, // Still need refresh token from User if not in env
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/callback',
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '1CCW6Phbb_A_-bLrOCjqLm4LgNIb4_H1_'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    maxMessages: parseInt(process.env.RATE_LIMIT_MAX_MESSAGES, 10) || 60,
    maxApi: parseInt(process.env.RATE_LIMIT_MAX_API, 10) || 100,
  },
  fileUpload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 104857600,
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || '').split(','),
  },
  cors: {
    origins: (process.env.ALLOWED_ORIGINS || '').split(','),
  },
};
