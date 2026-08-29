const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { neonConfig } = require('@neondatabase/serverless');
const { env } = require('../config/env');

const connectionString = env.DATABASE_URL;

// Ensure WebSocket is used if available (Polyfill for node if needed)
const ws = require('ws');
neonConfig.webSocketConstructor = ws;

// PrismaNeon takes the driver's configuration object, not an already-created
// Pool. Passing the Pool caused Prisma to fall back to localhost at runtime.
const adapter = new PrismaNeon({ connectionString });

const prisma = global.prisma || new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (env.NODE_ENV !== 'production') global.prisma = prisma;

module.exports = { prisma };
