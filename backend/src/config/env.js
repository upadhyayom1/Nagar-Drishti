const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('1d'),
  PORT: z.string().default('8000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ML_SERVICE_URL: z.string().url().default('http://127.0.0.1:8001/ml'),
  ANPR_SERVICE_URL: z.string().url().default('http://127.0.0.1:8001/anpr'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001,http://localhost:5173,https://nagardrishti.vercel.app'),
  RENDER_EXTERNAL_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  REDIS_ENABLED: z.string().default('true').transform((value) => value.toLowerCase() !== 'false'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

module.exports = { env: _env.data };
