const { zones, getRoadRecords, getCameraRecords } = require('../data/prayagraj.network');

async function seedPrayagrajNetwork(client) {
  if (!client) {
    ({ prisma: client } = require('../lib/prisma'));
  }
  await client.zone.createMany({ data: zones, skipDuplicates: true });
  const dbZones = await client.zone.findMany({
    where: { zoneCode: { in: zones.map((zone) => zone.zoneCode) } },
  });
  const zoneByCode = new Map(dbZones.map((zone) => [zone.zoneCode, zone.id]));

  const roads = getRoadRecords();
  await client.road.createMany({ data: roads, skipDuplicates: true });
  const dbRoads = await client.road.findMany({
    where: { roadCode: { in: roads.map((road) => road.roadCode) } },
  });
  const roadByCode = new Map(dbRoads.map((road) => [road.roadCode, road.id]));

  const cameras = getCameraRecords(zoneByCode, roadByCode);
  await client.camera.createMany({ data: cameras, skipDuplicates: true });
  const dbCameras = await client.camera.findMany({
    where: { cameraCode: { in: cameras.map((camera) => camera.cameraCode) } },
    orderBy: { cameraCode: 'asc' },
  });

  return { zones: dbZones, roads: dbRoads, cameras: dbCameras };
}

async function main() {
  const { prisma } = require('../lib/prisma');
  const network = await seedPrayagrajNetwork();
  console.log(`Prayagraj network ready: ${network.zones.length} zones, ${network.roads.length} roads, ${network.cameras.length} cameras.`);
}

if (require.main === module) {
  main()
    .catch((error) => { console.error(error); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}

module.exports = { seedPrayagrajNetwork };
