const app = require('./app');
const { env } = require('./config/env');
const { prisma } = require('./lib/prisma');

const startServer = async () => {
  try {
    // Check if the Prisma client is already connected or initialize it
    // In Prisma 5+, $connect is implicitly called, but it's good to be explicit for startup validation
    await prisma.$connect();
    console.log('✅ Connected to database');

    const PORT = env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
