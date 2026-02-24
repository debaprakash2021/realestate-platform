const dotenv = require('dotenv');

// Load env vars FIRST before anything else
dotenv.config();

const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Connect to MongoDB THEN start server
const startServer = async () => {
  try {
    // Step 1: Connect to MongoDB
    await connectDB();

    // Step 2: Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`✅ Server running in ${NODE_ENV} mode on port ${PORT}`);
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`❌ Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error(`❌ Uncaught Exception: ${err.message}`);
      process.exit(1);
    });

  } catch (error) {
    logger.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();