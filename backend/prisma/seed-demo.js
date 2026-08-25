const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { env } = require('../src/config/env');
const { seedPrayagrajNetwork } = require('../src/scripts/seedPrayagrajNetwork');

const connectionString = env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Demo Data...');

  const network = await seedPrayagrajNetwork(prisma);
  const createdCameras = network.cameras.slice(0, 5);

  for (const camera of createdCameras) {
    await prisma.cameraHealth.create({
      data: {
        cameraId: camera.id,
        status: camera.status,
        responseMs: Math.floor(Math.random() * 50) + 10
      }
    });
  }

  // 3. Create 10 Vehicles
  const vehiclesData = ['UP70AA1111', 'UP70AB2222', 'UP70AC3333', 'UP70AB0001', 'UP32CD4567', 'MP09EF8901', 'BR01GH1234', 'DL01JK9876', 'RJ14LM5555', 'HR26NP6789'];
  const createdVehicles = [];
  
  for (const plate of vehiclesData) {
    const v = await prisma.vehicle.upsert({
      where: { plateNumber: plate },
      update: {},
      create: {
        plateNumber: plate,
        vehicleType: 'CAR',
        color: 'WHITE',
        status: plate === 'UP70AB0001' ? 'BLACKLISTED' : 'ACTIVE',
      }
    });
    createdVehicles.push(v);
  }

  // 4. Create Detections (Randomly assign vehicles to cameras)
  for (let i = 0; i < 50; i++) {
    const v = createdVehicles[Math.floor(Math.random() * createdVehicles.length)];
    const c = createdCameras[Math.floor(Math.random() * createdCameras.length)];
    
    await prisma.detection.create({
      data: {
        vehicleId: v.id,
        cameraId: c.id,
        plateText: v.plateNumber,
        ocrConfidence: 0.95 + Math.random() * 0.04,
        vehicleConfidence: 0.9 + Math.random() * 0.09,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 10000000)),
        direction: 'NORTH'
      }
    });
  }

  // 5. Create Alerts
  const alertTypes = ['BLACKLIST_MATCH', 'ROUTE_ANOMALY', 'CONGESTION'];
  const severities = ['HIGH', 'CRITICAL', 'MEDIUM'];
  
  for (let i = 0; i < 5; i++) {
    const c = createdCameras[i];
    await prisma.alert.create({
      data: {
        type: alertTypes[i % 3],
        severity: severities[i % 3],
        cameraId: c.id,
        message: `System flagged ${alertTypes[i % 3]} at ${c.name}`,
      }
    });
  }

  console.log('Demo data seeded successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
