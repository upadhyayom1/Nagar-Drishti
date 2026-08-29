const app = require('./src/app');
const { env } = require('./src/config/env');
const { prisma } = require('./src/lib/prisma');
const engine = require('./src/modules/simulation/engine');

const startServer = async () => {
  try {
    // `$connect` alone does not execute a query for every Prisma adapter. Run a
    // harmless query so a server only advertises itself after the DB is usable.
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connected to database');

    await engine.init();
    console.log('Simulation engine initialized with DB data.');

    const PORT = env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);

      // An external monitor is required to keep an idle deployment reachable;
      // a process cannot wake itself once the host has suspended it. The
      // repository workflow pings this server's /api/health endpoint.
    });
  } catch (error) {
    const reason = error?.message || error?.code || 'Unknown database connection error';
    console.error('❌ Failed to start server. Verify DATABASE_URL and database network access:', reason);
    process.exit(1);
  }
};

startServer();
