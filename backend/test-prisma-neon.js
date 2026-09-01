const { PrismaNeon } = require('@prisma/adapter-neon');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;
const connectionString = "postgresql://neondb_owner:npg_gJNdL5HO8EYW@ep-hidden-cake-avi81aam.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
adapter.queryRaw({ sql: 'SELECT 1', values: [] }).then(console.log).catch(console.error);
