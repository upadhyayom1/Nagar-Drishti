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
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

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
      passwordHash: adminPassword,
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
