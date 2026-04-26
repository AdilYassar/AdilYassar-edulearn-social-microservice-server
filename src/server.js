const http = require('http');
const app = require('./app');
const config = require('./config');
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./socket');
const { initFirebase } = require('./config/firebase');
const logger = require('./utils/logger');
const userSyncConsumer = require('./services/user-sync.consumer');
const startQueueWorkers = require('./queues/workers');

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Connect to Redis
    await connectRedis();

    // 3. Initialize Firebase
    initFirebase();

    // 4. Create HTTP Server
    const server = http.createServer(app);

    // 5. Initialize Socket.IO
    initSocket(server);

    // 6. Start Background Services
    userSyncConsumer.start();
    startQueueWorkers();

    // 7. Start Server with dynamic port finding
    const net = require('net');
    
    logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    logger.info(`Starting server on PORT: ${config.port}`);
    logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const findAvailablePort = (startPort) => {
        return new Promise((resolve, reject) => {
            const testServer = net.createServer();
            testServer.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(findAvailablePort(startPort + 1));
                } else {
                    reject(err);
                }
            });
            testServer.once('listening', () => {
                testServer.close(() => {
                    resolve(startPort);
                });
            });
            testServer.listen(startPort);
        });
    };

    findAvailablePort(config.port).then((availablePort) => {
        server.listen(availablePort, () => {
             logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
             logger.info(`✅ Social Microservice is RUNNING`);
             logger.info(`   Environment: ${config.env}`);
             logger.info(`   PORT: ${availablePort}`);
             logger.info(`   Access at: http://localhost:${availablePort}`);
             logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        });
    }).catch((err) => {
        logger.error('Failed to find open port:', err);
        process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      logger.error(`Error: ${err.message}`);
    });

  } catch (error) {
    console.error('FATAL ERROR STARTING SERVER:', error);
    process.exit(1);
  }
};

startServer();
