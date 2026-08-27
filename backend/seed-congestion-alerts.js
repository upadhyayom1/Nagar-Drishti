const { prisma } = require('./src/lib/prisma');

async function seedCongestionAlerts() {
  console.log('Seeding realistic congestion alerts for high-density junctions...');
  
  // Find key busy junction cameras in Prayagraj
  const cameras = await prisma.camera.findMany({
    where: {
      cameraCode: { in: ['PRY-CAM-001', 'PRY-CAM-005', 'PRY-CAM-006', 'PRY-CAM-012', 'PRY-CAM-018'] }
    },
    include: { zone: true, road: true }
  });

  const alertsData = [
    {
      code: 'PRY-CAM-001',
      severity: 'CRITICAL',
      msg: 'Severe traffic bottleneck detected at High Court — MG Marg. Volume: 142 vehicles/hr exceeds sector threshold by 180%.'
    },
    {
      code: 'PRY-CAM-005',
      severity: 'HIGH',
      msg: 'High congestion spike at Prayagraj Junction Entry. Inbound transit velocity dropped to 14 km/h.'
    },
    {
      code: 'PRY-CAM-006',
      severity: 'HIGH',
      msg: 'Vehicle density accumulation at Zero Road Junction. Elevated wait times on Northbound corridor.'
    },
    {
      code: 'PRY-CAM-018',
      severity: 'CRITICAL',
      msg: 'Corridor gridlock at Bairhana Junction. Sector density index 92/100 requiring automated light redistribution.'
    }
  ];

  for (const item of alertsData) {
    const cam = cameras.find(c => c.cameraCode === item.code);
    if (!cam) continue;

    await prisma.alert.create({
      data: {
        type: 'CONGESTION',
        severity: item.severity,
        cameraId: cam.id,
        message: item.msg,
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
      }
    });
    console.log(`Created congestion alert for ${cam.name} (${item.code})`);
  }

  console.log('Congestion alerts seeded successfully.');
}

seedCongestionAlerts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
