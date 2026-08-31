const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { env } = require('../src/config/env');

const connectionString = env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminSecret = process.env.SEED_ADMIN_PASSWORD || (isProduction ? null : 'admin123');
  const operatorSecret = process.env.SEED_OPERATOR_PASSWORD || (isProduction ? null : adminSecret);
  const userSecret = process.env.SEED_USER_PASSWORD || (isProduction ? null : 'user123');
  if (!adminSecret || !operatorSecret || !userSecret) {
    throw new Error('Set SEED_ADMIN_PASSWORD, SEED_OPERATOR_PASSWORD and SEED_USER_PASSWORD in production.');
  }
  const adminPassword = await bcrypt.hash(adminSecret, 12);
  const operatorPassword = await bcrypt.hash(operatorSecret, 12);
  const userPassword = await bcrypt.hash(userSecret, 12);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminPassword },
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      name: 'Central Admin',
      role: 'ADMIN',
    },
  });

  const operator = await prisma.user.upsert({
    where: { username: 'operator.krishnan' },
    update: { passwordHash: adminPassword },
    create: {
      username: 'operator.krishnan',
      passwordHash: operatorPassword,
      name: 'Officer Krishnan',
      role: 'ADMIN',
    },
  });

  const citizen = await prisma.user.upsert({
    where: { username: 'citizen.user' },
    update: { passwordHash: userPassword },
    create: {
      username: 'citizen.user',
      passwordHash: userPassword,
      name: 'Citizen User',
      role: 'USER',
    },
  });

  console.log('Seed completed successfully:', {
    admin: adminUser.username,
    operator: operator.username,
    citizen: citizen.username,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
