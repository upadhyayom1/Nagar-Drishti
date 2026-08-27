const { prisma } = require('./src/lib/prisma');
const { generateVehicles } = require('./src/scripts/historical/vehicleGenerator');

async function seed() {
  console.log('Generating vehicles...');
  const vehiclesData = generateVehicles().slice(0, 500); // 500 vehicles
  console.log('Inserting into DB...');
  await prisma.vehicle.createMany({
    data: vehiclesData.map(v => ({
      plateNumber: v.plateNumber,
      vehicleType: v.vehicleType,
      status: v.status
    })),
    skipDuplicates: true
  });
  console.log('Done!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
