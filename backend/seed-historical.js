const fs = require('fs');
const path = require('path');
const { prisma } = require('./src/lib/prisma');

const CSV_PATH = path.join(__dirname, 'data', 'exports', 'detections.csv');
const BATCH_SIZE = 2000;

function parseLine(line) {
  const parts = line.split(',');
  if (parts.length < 10) return null;
  return {
    detectionId: parts[0],
    vehicleId: parts[1],
    plateText: parts[2].trim().toUpperCase(),
    vehicleType: parts[3].trim(),
    cameraId: parts[4],
    cameraCode: parts[5].trim(),
    timestamp: parts[6].trim(),
    ocrConfidence: parseFloat(parts[7]),
    vehicleConfidence: parseFloat(parts[8]),
    source: parts[9].trim(),
  };
}

async function main() {
  console.log('=== Fast Historical Detections & Transitions Seed ===');
  console.log(`Reading: ${CSV_PATH}`);

  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = raw.split('\n').filter(Boolean);
  const dataLines = lines.slice(1);
  console.log(`Found ${dataLines.length} detection rows in CSV.`);

  // 1. Build camera lookup: cameraCode -> current DB id
  console.log('Building camera lookup from database...');
  const cameras = await prisma.camera.findMany({ select: { id: true, cameraCode: true } });
  const cameraByCode = new Map(cameras.map(c => [c.cameraCode, c.id]));
  console.log(`  ${cameraByCode.size} cameras mapped.`);

  // 2. Parse all rows and group by plateText in-memory
  console.log('Parsing CSV & organizing in memory...');
  const rows = [];
  const uniquePlates = new Map(); // plateText -> vehicleType
  const detectionsByPlate = new Map();
  let skippedCamera = 0;

  for (const line of dataLines) {
    const row = parseLine(line);
    if (!row) continue;
    
    const currentCameraId = cameraByCode.get(row.cameraCode);
    if (!currentCameraId) {
      skippedCamera++;
      continue;
    }
    row._resolvedCameraId = currentCameraId;
    rows.push(row);

    if (!uniquePlates.has(row.plateText)) {
      uniquePlates.set(row.plateText, row.vehicleType);
    }
    if (!detectionsByPlate.has(row.plateText)) {
      detectionsByPlate.set(row.plateText, []);
    }
    detectionsByPlate.get(row.plateText).push(row);
  }
  console.log(`  ${rows.length} valid detection records (${skippedCamera} skipped due to unmapped camera).`);
  console.log(`  ${uniquePlates.size} unique vehicles identified.`);

  // 3. Upsert vehicles: ensure all unique plates exist in DB
  console.log('Synchronizing vehicles with database...');
  const existingVehicles = await prisma.vehicle.findMany({
    where: { plateNumber: { in: [...uniquePlates.keys()] } },
    select: { id: true, plateNumber: true },
  });
  const vehicleMap = new Map(existingVehicles.map(v => [v.plateNumber, v.id]));
  
  const missingPlates = [...uniquePlates.entries()].filter(([plate]) => !vehicleMap.has(plate));
  if (missingPlates.length > 0) {
    console.log(`  Creating ${missingPlates.length} new vehicle records...`);
    for (let i = 0; i < missingPlates.length; i += BATCH_SIZE) {
      const chunk = missingPlates.slice(i, i + BATCH_SIZE);
      await prisma.vehicle.createMany({
        data: chunk.map(([plateNumber, vehicleType]) => ({
          plateNumber,
          vehicleType: ['CAR','MOTORCYCLE','SCOOTER','AUTO','BUS','TRUCK','VAN','TAXI'].includes(vehicleType) ? vehicleType : undefined,
          status: 'ACTIVE',
        })),
        skipDuplicates: true,
      });
    }
    // Re-fetch all created vehicles
    const allVehicles = await prisma.vehicle.findMany({
      where: { plateNumber: { in: [...uniquePlates.keys()] } },
      select: { id: true, plateNumber: true },
    });
    allVehicles.forEach(v => vehicleMap.set(v.plateNumber, v.id));
  }
  console.log(`  All ${vehicleMap.size} vehicles synced.`);

  // 4. Compute camera transitions entirely in-memory
  console.log('Computing camera transitions in memory...');
  const allTransitions = [];
  for (const [plate, dets] of detectionsByPlate.entries()) {
    const vId = vehicleMap.get(plate);
    if (!vId) continue;
    
    // Sort chronological
    dets.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (let i = 1; i < dets.length; i++) {
      const src = dets[i - 1];
      const dst = dets[i];
      if (src._resolvedCameraId === dst._resolvedCameraId) continue;

      const tSrc = new Date(src.timestamp).getTime();
      const tDst = new Date(dst.timestamp).getTime();
      const travelTimeSeconds = Math.max(1, Math.round((tDst - tSrc) / 1000));
      if (travelTimeSeconds > 7200) continue; // Skip gaps > 2 hours

      allTransitions.push({
        sourceCameraId: src._resolvedCameraId,
        destinationCameraId: dst._resolvedCameraId,
        vehicleId: vId,
        timestamp: new Date(dst.timestamp),
        travelTimeSeconds,
      });
    }
  }
  console.log(`  Calculated ${allTransitions.length} valid transitions.`);

  // 5. Clean old detection & transition tables
  console.log('Clearing old detections, alerts, and transitions...');
  await prisma.blacklistAlert.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.cameraTransition.deleteMany({});
  await prisma.detection.deleteMany({});
  console.log('  Cleaned.');

  // 6. Batch insert detections
  console.log(`Inserting ${rows.length} detections in batches of ${BATCH_SIZE}...`);
  let insertedDetections = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const data = batch
      .map(row => {
        const vehicleId = vehicleMap.get(row.plateText);
        if (!vehicleId) return null;
        return {
          vehicleId,
          cameraId: row._resolvedCameraId,
          plateText: row.plateText,
          timestamp: new Date(row.timestamp),
          ocrConfidence: Number.isFinite(row.ocrConfidence) ? row.ocrConfidence : null,
          vehicleConfidence: Number.isFinite(row.vehicleConfidence) ? row.vehicleConfidence : null,
          source: row.source === 'AI' ? 'AI' : 'SIMULATION',
        };
      })
      .filter(Boolean);

    if (data.length > 0) {
      await prisma.detection.createMany({ data });
      insertedDetections += data.length;
    }
    console.log(`  Detections: ${insertedDetections}/${rows.length}`);
  }

  // 7. Batch insert camera transitions
  console.log(`Inserting ${allTransitions.length} transitions in batches of ${BATCH_SIZE}...`);
  let insertedTransitions = 0;
  for (let i = 0; i < allTransitions.length; i += BATCH_SIZE) {
    const batch = allTransitions.slice(i, i + BATCH_SIZE);
    await prisma.cameraTransition.createMany({ data: batch });
    insertedTransitions += batch.length;
    console.log(`  Transitions: ${insertedTransitions}/${allTransitions.length}`);
  }

  // 8. Update vehicle firstSeen / lastSeen via SQL
  console.log('Updating vehicle firstSeen / lastSeen timestamps...');
  await prisma.$executeRawUnsafe(`
    UPDATE "Vehicle"
    SET 
      "firstSeen" = d.min_ts,
      "lastSeen" = d.max_ts
    FROM (
      SELECT "vehicleId", MIN(timestamp) as min_ts, MAX(timestamp) as max_ts
      FROM "Detection"
      GROUP BY "vehicleId"
    ) AS d
    WHERE "Vehicle".id = d."vehicleId";
  `);

  // 9. Re-link blacklist alerts
  console.log('Processing blacklist alerts for active blacklisted vehicles...');
  const blacklisted = await prisma.blacklistedVehicle.findMany({ where: { status: 'ACTIVE' } });
  let alertsCreated = 0;
  for (const bl of blacklisted) {
    const matchingDetections = await prisma.detection.findMany({
      where: { plateText: bl.plateNumber },
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: { camera: { select: { name: true, cameraCode: true } } },
    });

    if (matchingDetections.length > 0) {
      await prisma.detection.updateMany({
        where: { plateText: bl.plateNumber },
        data: { isBlacklisted: true, blacklistId: bl.id },
      });
      await prisma.vehicle.updateMany({
        where: { plateNumber: bl.plateNumber },
        data: { status: 'BLACKLISTED' },
      });

      for (const det of matchingDetections) {
        await prisma.alert.create({
          data: {
            type: 'BLACKLIST_MATCH',
            severity: bl.severity,
            vehicleId: det.vehicleId,
            cameraId: det.cameraId,
            message: `Blacklisted vehicle ${bl.plateNumber} detected at ${det.camera?.name || det.camera?.cameraCode || 'Camera'}. Reason: ${bl.reason}`,
            createdAt: det.timestamp,
          },
        });
        alertsCreated++;
      }
    }
  }
  console.log(`  Created ${alertsCreated} blacklist alerts.`);

  // Final summary
  const finalCounts = {
    detections: await prisma.detection.count(),
    vehicles: await prisma.vehicle.count(),
    transitions: await prisma.cameraTransition.count(),
    alerts: await prisma.alert.count({ where: { status: 'ACTIVE' } }),
    blacklisted: await prisma.blacklistedVehicle.count({ where: { status: 'ACTIVE' } }),
  };

  console.log('\n========================================');
  console.log(' HISTORICAL SEED COMPLETED SUCCESSFULLY');
  console.log('========================================');
  console.log(`Detections:    ${finalCounts.detections}`);
  console.log(`Vehicles:      ${finalCounts.vehicles}`);
  console.log(`Transitions:   ${finalCounts.transitions}`);
  console.log(`Active Alerts: ${finalCounts.alerts}`);
  console.log(`Blacklisted:   ${finalCounts.blacklisted}`);
}

main()
  .catch(e => { console.error('SEED ERROR:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
