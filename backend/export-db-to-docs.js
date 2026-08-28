const fs = require('fs');
const path = require('path');
const { prisma } = require('./src/lib/prisma');

// Helper to escape CSV fields safely
function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Convert array of objects to CSV string
function toCsv(rows, headers) {
  const headerLine = headers.join(',');
  const lines = rows.map(r => headers.map(h => escapeCsv(r[h])).join(','));
  return [headerLine, ...lines].join('\n');
}

async function exportAll() {
  console.log('================================================================');
  console.log(' EXPORTING LIVE DATABASE RECORDS DIRECTLY TO CSV & JSON');
  console.log('================================================================');

  const docsDir = path.join(__dirname, '..', 'docs', 'exports');
  const backendDataDir = path.join(__dirname, 'data', 'exports');
  const mlDataDir = path.join(__dirname, '..', 'ml', 'vehicle_movement_analysis', 'data');

  [docsDir, backendDataDir, mlDataDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // 1. ZONES
  console.log('1. Exporting Zones...');
  const zones = await prisma.zone.findMany({ orderBy: { id: 'asc' } });
  const zoneHeaders = ['id', 'zoneCode', 'name', 'createdAt', 'updatedAt'];
  const zonesCsv = toCsv(zones, zoneHeaders);
  [docsDir, backendDataDir, mlDataDir].forEach(dir => fs.writeFileSync(path.join(dir, 'zones.csv'), zonesCsv, 'utf8'));
  console.log(`   -> Exported ${zones.length} zones.`);

  // 2. ROADS
  console.log('2. Exporting Roads...');
  const roads = await prisma.road.findMany({ orderBy: { id: 'asc' } });
  const roadHeaders = ['id', 'roadCode', 'name', 'speedLimit', 'geometry', 'createdAt', 'updatedAt'];
  const roadsCsv = toCsv(roads, roadHeaders);
  [docsDir, backendDataDir, mlDataDir].forEach(dir => fs.writeFileSync(path.join(dir, 'roads.csv'), roadsCsv, 'utf8'));
  console.log(`   -> Exported ${roads.length} roads.`);

  // 3. CAMERAS
  console.log('3. Exporting Cameras...');
  const cameras = await prisma.camera.findMany({
    orderBy: { cameraCode: 'asc' },
  });
  const cameraHeaders = [
    'id',
    'cameraCode',
    'name',
    'latitude',
    'longitude',
    'direction',
    'roadId',
    'zoneId',
    'status',
    'createdAt',
    'updatedAt',
  ];
  const camerasCsv = toCsv(cameras, cameraHeaders);
  [docsDir, backendDataDir, mlDataDir].forEach(dir => fs.writeFileSync(path.join(dir, 'cameras.csv'), camerasCsv, 'utf8'));
  console.log(`   -> Exported ${cameras.length} cameras.`);

  // 4. VEHICLES
  console.log('4. Exporting Vehicles...');
  const vehicles = await prisma.vehicle.findMany({ orderBy: { id: 'asc' } });
  const vehicleHeaders = [
    'id',
    'plateNumber',
    'vehicleType',
    'color',
    'speed',
    'status',
    'firstSeen',
    'lastSeen',
    'createdAt',
    'updatedAt',
  ];
  const vehiclesCsv = toCsv(vehicles, vehicleHeaders);
  [docsDir, backendDataDir, mlDataDir].forEach(dir => fs.writeFileSync(path.join(dir, 'vehicles.csv'), vehiclesCsv, 'utf8'));
  console.log(`   -> Exported ${vehicles.length} vehicles.`);

  // 5. DETECTIONS (Stream in batches to handle 42,000+ records cleanly)
  console.log('5. Exporting Detections from DB...');
  const detectionHeaders = [
    'id',
    'vehicleId',
    'cameraId',
    'plateText',
    'ocrConfidence',
    'vehicleConfidence',
    'timestamp',
    'latitude',
    'longitude',
    'direction',
    'lane',
    'imageUrl',
    'source',
    'isBlacklisted',
    'blacklistId',
    'createdAt',
  ];

  const docsDetPath = path.join(docsDir, 'detections.csv');
  const backendDetPath = path.join(backendDataDir, 'detections.csv');
  const mlDetPath = path.join(mlDataDir, 'detections.csv');

  const docsStream = fs.createWriteStream(docsDetPath, { flags: 'w' });
  const backendStream = fs.createWriteStream(backendDetPath, { flags: 'w' });
  const mlStream = fs.createWriteStream(mlDetPath, { flags: 'w' });

  const headerStr = detectionHeaders.join(',') + '\n';
  docsStream.write(headerStr);
  backendStream.write(headerStr);
  mlStream.write(headerStr);

  const BATCH_SIZE = 5000;
  let offset = 0;
  let totalDetections = 0;

  while (true) {
    const batch = await prisma.detection.findMany({
      orderBy: { timestamp: 'asc' },
      skip: offset,
      take: BATCH_SIZE,
    });

    if (batch.length === 0) break;

    const chunk = batch.map(d => detectionHeaders.map(h => escapeCsv(d[h])).join(',')).join('\n') + '\n';
    docsStream.write(chunk);
    backendStream.write(chunk);
    mlStream.write(chunk);

    totalDetections += batch.length;
    offset += BATCH_SIZE;
    console.log(`   -> Processed ${totalDetections} detections...`);
  }

  docsStream.end();
  backendStream.end();
  mlStream.end();
  console.log(`   -> Total detections exported: ${totalDetections}`);

  // 6. BLACKLISTED VEHICLES JSON (100% Matching the DB & Cameras.csv)
  console.log('6. Exporting Blacklisted Vehicles JSON with matching camera and vehicle IDs...');
  const activeBlacklist = await prisma.blacklistedVehicle.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });

  const blacklistedCheckpoints = [];

  for (const b of activeBlacklist) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { plateNumber: b.plateNumber },
    });

    if (!vehicle) continue;

    const latestDetection = await prisma.detection.findFirst({
      where: { vehicleId: vehicle.id },
      orderBy: { timestamp: 'desc' },
      include: {
        camera: { select: { id: true, name: true, cameraCode: true } },
      },
    });

    blacklistedCheckpoints.push({
      vehicle_id: vehicle.id,
      plate: vehicle.plateNumber,
      last_seen_timestamp: latestDetection ? latestDetection.timestamp.toISOString() : vehicle.lastSeen.toISOString(),
      current_checkpoint: {
        camera_id: latestDetection?.camera?.id || latestDetection?.cameraId || 'UNKNOWN',
        camera_name: latestDetection?.camera?.name || 'Prayagraj Optical Node',
      },
    });
  }

  const jsonStr = JSON.stringify(blacklistedCheckpoints, null, 2);
  [docsDir, backendDataDir, mlDataDir].forEach(dir => {
    fs.writeFileSync(path.join(dir, 'blacklisted_vehicles.json'), jsonStr, 'utf8');
    fs.writeFileSync(path.join(dir, 'blacklisted_vehicles_checkpoints.json'), jsonStr, 'utf8');
  });

  console.log(`   -> Exported ${blacklistedCheckpoints.length} active blacklisted vehicles.`);

  console.log('\n================================================================');
  console.log(' ALL EXPORTS REPLACED IN DOCS/ & BACKEND WITH EXACT DB DATA!');
  console.log('================================================================\n');
}

exportAll()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
