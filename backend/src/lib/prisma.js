const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { env } = require('../config/env');

const connectionString = env.DATABASE_URL;

// Ensure WebSocket is used if available (Polyfill for node if needed)
const ws = require('ws');
neonConfig.webSocketConstructor = ws;

console.log("CREATING POOL WITH:", connectionString); const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);

const prisma = global.prisma || new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (env.NODE_ENV !== 'production') global.prisma = prisma;

module.exports = { prisma };
