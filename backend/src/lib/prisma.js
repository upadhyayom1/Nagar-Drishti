const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { env } = require('../config/env');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5, // Limit concurrent connections
  connectionTimeoutMillis: 10000, // Abort connection after 10s if Neon is slow
  idleTimeoutMillis: 30000,
});
const adapter = new PrismaPg(pool);

const prisma = global.prisma || new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (env.NODE_ENV !== 'production') global.prisma = prisma;

module.exports = { prisma };
