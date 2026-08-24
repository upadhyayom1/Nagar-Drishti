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

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Seed completed. Admin user:', adminUser.username);

  // Blacklist Seed Data
  const demoBlacklist = [
    { plateNumber: 'DL8CAC1234', reason: 'Demo stolen vehicle', severity: 'HIGH' },
    { plateNumber: 'HR26DZ9999', reason: 'Demo wanted vehicle', severity: 'CRITICAL' },
    { plateNumber: 'UP14AB0001', reason: 'Demo restricted vehicle', severity: 'MEDIUM' },
  ];

  for (const vehicle of demoBlacklist) {
    await prisma.blacklistedVehicle.upsert({
      where: { plateNumber: vehicle.plateNumber },
      update: {},
      create: {
        plateNumber: vehicle.plateNumber,
        reason: vehicle.reason,
        severity: vehicle.severity,
        status: 'ACTIVE',
      }
    });
  }
  console.log('Seeded demo blacklisted vehicles');
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
