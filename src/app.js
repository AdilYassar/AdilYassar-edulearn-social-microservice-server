const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const routes = require('./api/v1/routes');
const logger = require('./utils/logger'); // Assuming you want to use the logger here too
const errorMiddleware = require('./api/v1/middlewares/error.middleware');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxApi,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging Middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/v1', routes);

// Error Handling (Must be last)
app.use(errorMiddleware);

module.exports = app;
