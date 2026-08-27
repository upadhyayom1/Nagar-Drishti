const { prisma } = require('./src/lib/prisma');

async function seedBlacklist() {
  // Pick 5 vehicles that have recent detections
  const candidates = await prisma.vehicle.findMany({
    where: { detections: { some: {} } },
    take: 5,
    orderBy: { lastSeen: 'desc' },
  });

  const reasons = [
    ['CRITICAL', 'Stolen vehicle – reported by Prayagraj Central Police Station'],
    ['HIGH', 'Suspected involvement in hit-and-run case #PYG-2026-0481'],
    ['MEDIUM', 'Expired registration – pending verification'],
    ['HIGH', 'Flagged by inter-state intelligence bureau alert'],
    ['CRITICAL', 'Vehicle linked to ongoing surveillance operation'],
  ];

  for (let i = 0; i < candidates.length; i++) {
    const vehicle = candidates[i];
    const [severity, reason] = reasons[i];

    // Check if already blacklisted
    const existing = await prisma.blacklistedVehicle.findUnique({
      where: { plateNumber: vehicle.plateNumber },
    });
    if (existing) {
      console.log(`Already blacklisted: ${vehicle.plateNumber}`);
      continue;
    }

    await prisma.blacklistedVehicle.create({
      data: {
        plateNumber: vehicle.plateNumber,
        severity,
        reason,
        status: 'ACTIVE',
      },
    });

    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: 'BLACKLISTED' },
    });

    console.log(`Blacklisted: ${vehicle.plateNumber} (${severity}) – ${reason}`);
  }

  console.log('Blacklist seeding complete.');
}

seedBlacklist()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
