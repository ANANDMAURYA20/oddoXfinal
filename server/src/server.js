const app = require("./app");
const env = require("./config/env");
const logger = require("./utils/logger");
const prisma = require("./config/db");

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info("✅ Database connected successfully");

    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
      logger.info(`📋 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
