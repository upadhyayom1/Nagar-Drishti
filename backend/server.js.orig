const app = require('./src/app');
const { env } = require('./src/config/env');
const { prisma } = require('./src/lib/prisma');
const engine = require('./src/modules/simulation/engine');

let httpServer;

const startServer = async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connected to database');

    await engine.init();
    engine.start();
    console.log('Simulation engine initialized with DB data and ticking started.');

    const PORT = env.PORT || 3000;
    httpServer = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);

    });
  } catch (error) {
    const reason = error?.message || error?.code || 'Unknown database connection error';
    console.error('❌ Failed to start server. Verify DATABASE_URL and database network access:', reason);
    process.exit(1);
  }
};

startServer();


const shutdown = async (signal) => {
  console.log(`Received ${signal}; shutting down gracefully...`);
  try {
    engine.pause();
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    await prisma.$disconnect();
  } catch (error) {
    console.error('Shutdown error:', error);
  } finally {
    process.exit(0);
  }
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
