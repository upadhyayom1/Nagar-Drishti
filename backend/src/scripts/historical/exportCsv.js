const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const { prisma } = require('../../lib/prisma');

async function exportTableCsv(filePath, header, rows) {
  const writer = createObjectCsvWriter({ path: filePath, header });
  await writer.writeRecords(rows);
}

async function exportCsv() {
  const backendExportDir = path.join(__dirname, '../../../data/exports');
  const mlDataDir = path.join(__dirname, '../../../../ml/vehicle_movement_analysis/data');
  fs.mkdirSync(backendExportDir, { recursive: true });
  if (fs.existsSync(path.join(__dirname, '../../../../ml'))) fs.mkdirSync(mlDataDir, { recursive: true });

  const detections = [];
  const pageSize = 10000;
  let cursor = undefined;

  while (true) {
    const page = await prisma.detection.findMany({
      take: pageSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      include: {
        vehicle: { select: { plateNumber: true, vehicleType: true } },
        camera: { select: { cameraCode: true } },
      },
    });
    if (!page.length) break;

    detections.push(...page.map((detection) => ({
      detectionId: detection.id,
      vehicleId: detection.vehicleId,
      plateText: detection.plateText,
      vehicleType: detection.vehicle?.vehicleType || 'UNKNOWN',
      cameraId: detection.cameraId,
      cameraCode: detection.camera?.cameraCode || 'UNKNOWN',
      timestamp: detection.timestamp.toISOString(),
      latitude: detection.latitude ?? '',
      longitude: detection.longitude ?? '',
      direction: detection.direction || 'UNKNOWN',
      ocrConfidence: detection.ocrConfidence ?? '',
      vehicleConfidence: detection.vehicleConfidence ?? '',
      source: detection.source,
    })));

    cursor = page[page.length - 1].id;
    console.log(`Prepared ${detections.length} detections...`);
  }

  const headers = [
    { id: 'detectionId', title: 'detectionId' },
    { id: 'vehicleId', title: 'vehicleId' },
    { id: 'plateText', title: 'plateText' },
    { id: 'vehicleType', title: 'vehicleType' },
    { id: 'cameraId', title: 'cameraId' },
    { id: 'cameraCode', title: 'cameraCode' },
    { id: 'timestamp', title: 'timestamp' },
    { id: 'latitude', title: 'latitude' },
    { id: 'longitude', title: 'longitude' },
    { id: 'direction', title: 'direction' },
    { id: 'ocrConfidence', title: 'ocrConfidence' },
    { id: 'vehicleConfidence', title: 'vehicleConfidence' },
    { id: 'source', title: 'source' },
  ];

  const paths = [path.join(backendExportDir, 'detections.csv')];
  if (fs.existsSync(path.join(__dirname, '../../../../ml'))) {
    paths.push(path.join(mlDataDir, 'detections.csv'));
  }

  for (const outputPath of paths) {
    await exportTableCsv(outputPath, headers, detections);
    console.log(`Wrote ${detections.length} detections to ${outputPath}`);
  }

  // Keep ML metadata synchronized with the same database snapshot.
  const cameras = await prisma.camera.findMany({ orderBy: { cameraCode: 'asc' } });
  const zones = await prisma.zone.findMany({ orderBy: { zoneCode: 'asc' } });
  const roads = await prisma.road.findMany({ orderBy: { roadCode: 'asc' } });

  const cameraRows = cameras.map((c) => ({
    id: c.id, cameraCode: c.cameraCode, name: c.name, latitude: c.latitude,
    longitude: c.longitude, direction: c.direction || '', roadId: c.roadId || '', zoneId: c.zoneId || '',
  }));
  const zoneRows = zones.map((z) => ({ id: z.id, zoneCode: z.zoneCode, name: z.name }));
  const roadRows = roads.map((r) => ({ id: r.id, roadCode: r.roadCode, name: r.name, speedLimit: r.speedLimit || '', geometry: JSON.stringify(r.geometry || null) }));

  const metadata = [
    ['cameras.csv', [{ id: 'id', title: 'id' }, { id: 'cameraCode', title: 'cameraCode' }, { id: 'name', title: 'name' }, { id: 'latitude', title: 'latitude' }, { id: 'longitude', title: 'longitude' }, { id: 'direction', title: 'direction' }, { id: 'roadId', title: 'roadId' }, { id: 'zoneId', title: 'zoneId' }], cameraRows],
    ['zones.csv', [{ id: 'id', title: 'id' }, { id: 'zoneCode', title: 'zoneCode' }, { id: 'name', title: 'name' }], zoneRows],
    ['roads.csv', [{ id: 'id', title: 'id' }, { id: 'roadCode', title: 'roadCode' }, { id: 'name', title: 'name' }, { id: 'speedLimit', title: 'speedLimit' }, { id: 'geometry', title: 'geometry' }], roadRows],
  ];

  for (const [filename, header, rows] of metadata) {
    await exportTableCsv(path.join(backendExportDir, filename), header, rows);
    if (fs.existsSync(path.join(__dirname, '../../../../ml'))) {
      await exportTableCsv(path.join(mlDataDir, filename), header, rows);
    }
  }

  console.log(`✅ CSV export complete: ${detections.length} detections.`);
  return { total: detections.length };
}

if (require.main === module) {
  exportCsv()
    .catch((error) => { console.error(error); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}

module.exports = { exportCsv };
