const fs = require('fs');
const path = require('path');
const { prisma } = require('./src/lib/prisma');

// Curated high-priority target plates with realistic law-enforcement surveillance reasons
const TARGET_BLACKLIST = [
  {
    plate: 'UP36HM2338',
    severity: 'CRITICAL',
    reason: 'Vehicle linked to ongoing surveillance operation — Special Task Force (STF) flag',
  },
  {
    plate: 'MP27NI4123',
    severity: 'CRITICAL',
    reason: 'Stolen luxury SUV – reported by Prayagraj Central Police Station (Warrant #PYG-2026-0819)',
  },
  {
    plate: 'BR56FX4000',
    severity: 'CRITICAL',
    reason: 'Red-corner notice: Inter-state intelligence bureau surveillance flag',
  },
  {
    plate: 'UP17SY6516',
    severity: 'HIGH',
    reason: 'Fatal hit-and-run collision suspect #PYG-2026-0481 at Civil Lines junction',
  },
  {
    plate: 'CG54QS6309',
    severity: 'HIGH',
    reason: 'Vehicle flagged for illicit contraband transport — State Excise Dept trigger',
  },
  {
    plate: 'UP70DK8231',
    severity: 'HIGH',
    reason: 'Cloned/duplicated license plate detected by ANPR neural OCR unit',
  },
  {
    plate: 'UP70EX7525',
    severity: 'MEDIUM',
    reason: 'Multiple excessive speeding violations (>12 automated e-challans pending)',
  },
  {
    plate: 'UP65AB9921',
    severity: 'MEDIUM',
    reason: 'Expired commercial fitness & registration certificate (>180 days)',
  },
  {
    plate: 'UP78HI9549',
    severity: 'LOW',
    reason: 'Defective High Security Registration Plate (HSRP) — Traffic inspection notice',
  },
];

async function run() {
  console.log('=== Step 1: Curating & Lowering Blacklisted Vehicles in Database ===');

  // 1. First, deactivate all other blacklisted vehicles
  await prisma.blacklistedVehicle.updateMany({
    data: { status: 'INACTIVE' },
  });
  await prisma.vehicle.updateMany({
    data: { status: 'ACTIVE' },
  });

  // 2. Activate or create only the curated targets
  const activeRecords = [];

  for (const target of TARGET_BLACKLIST) {
    // Find or create vehicle
    let vehicle = await prisma.vehicle.findUnique({
      where: { plateNumber: target.plate },
    });

    if (!vehicle) {
      // Find a vehicle with detections if this specific plate doesn't exist
      const randomCandidate = await prisma.vehicle.findFirst({
        where: {
          status: 'ACTIVE',
          detections: { some: {} },
        },
        include: { detections: { take: 1 } },
      });
      if (randomCandidate) {
        vehicle = await prisma.vehicle.update({
          where: { id: randomCandidate.id },
          data: { plateNumber: target.plate, status: 'BLACKLISTED' },
        });
      }
    } else {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { status: 'BLACKLISTED' },
      });
    }

    if (!vehicle) continue;

    // Create or update BlacklistedVehicle
    let bRecord = await prisma.blacklistedVehicle.findUnique({
      where: { plateNumber: target.plate },
    });

    if (!bRecord) {
      bRecord = await prisma.blacklistedVehicle.create({
        data: {
          plateNumber: target.plate,
          reason: target.reason,
          severity: target.severity,
          status: 'ACTIVE',
        },
      });
    } else {
      bRecord = await prisma.blacklistedVehicle.update({
        where: { id: bRecord.id },
        data: {
          reason: target.reason,
          severity: target.severity,
          status: 'ACTIVE',
        },
      });
    }

    // Link vehicle detections to this blacklist record
    await prisma.detection.updateMany({
      where: { vehicleId: vehicle.id },
      data: { isBlacklisted: true, blacklistId: bRecord.id },
    });

    activeRecords.push({ vehicle, bRecord });
  }

  console.log(`Active blacklisted vehicles count updated to: ${activeRecords.length}`);

  // ── Step 2: Extract Full Chronological Movement Data ──────────────────────
  console.log('=== Step 2: Extracting Complete Movement History & Vectors ===');

  const exportData = [];

  for (const { vehicle, bRecord } of activeRecords) {
    // Fetch all chronological detections with camera and zone data
    const detections = await prisma.detection.findMany({
      where: { vehicleId: vehicle.id },
      orderBy: { timestamp: 'asc' },
      include: {
        camera: {
          select: {
            id: true,
            cameraCode: true,
            name: true,
            latitude: true,
            longitude: true,
            direction: true,
            zone: { select: { id: true, name: true } },
            road: { select: { id: true, name: true, roadCode: true } },
          },
        },
      },
    });

    // Fetch camera transitions
    const transitions = await prisma.cameraTransition.findMany({
      where: { vehicleId: vehicle.id },
      orderBy: { timestamp: 'asc' },
      include: {
        sourceCamera: { select: { id: true, cameraCode: true, name: true } },
        destinationCamera: { select: { id: true, cameraCode: true, name: true } },
      },
    });

    // Determine current checkpoint / last seen
    const latestDet = detections.length > 0 ? detections[detections.length - 1] : null;
    const firstDet = detections.length > 0 ? detections[0] : null;

    const currentCheckpoint = latestDet
      ? {
          camera_id: latestDet.camera?.id || latestDet.cameraId,
          camera_code: latestDet.camera?.cameraCode || 'UNKNOWN',
          camera_name: latestDet.camera?.name || 'Optical Node',
          zone: latestDet.camera?.zone?.name || 'Prayagraj Sector',
          road: latestDet.camera?.road?.name || 'Corridor',
          latitude: latestDet.latitude ?? latestDet.camera?.latitude,
          longitude: latestDet.longitude ?? latestDet.camera?.longitude,
          speed_kmh: latestDet.speed || vehicle.speed || 35.0,
          direction: latestDet.direction || latestDet.camera?.direction || 'NORTHBOUND',
        }
      : null;

    // Format full movement chronology
    const movementHistory = detections.map((d, index) => ({
      sequence_index: index + 1,
      detection_id: d.id,
      timestamp: d.timestamp.toISOString(),
      camera_id: d.camera?.id || d.cameraId,
      camera_code: d.camera?.cameraCode || 'UNKNOWN',
      camera_name: d.camera?.name || 'Optical Node',
      latitude: d.latitude ?? d.camera?.latitude,
      longitude: d.longitude ?? d.camera?.longitude,
      speed_kmh: d.speed || 0.0,
      direction: d.direction || d.camera?.direction || 'UNKNOWN',
      lane: d.lane || 1,
      zone: d.camera?.zone?.name || 'Prayagraj Sector',
      road: d.camera?.road?.name || 'Corridor',
      ocr_confidence: d.ocrConfidence ?? 0.95,
      source: d.source || 'SIMULATION',
    }));

    // Format transitions
    const formattedTransitions = transitions.map((t) => ({
      transition_id: t.id,
      from_camera_id: t.sourceCameraId,
      from_camera_code: t.sourceCamera?.cameraCode || 'UNKNOWN',
      from_camera_name: t.sourceCamera?.name || 'Source Node',
      to_camera_id: t.destinationCameraId,
      to_camera_code: t.destinationCamera?.cameraCode || 'UNKNOWN',
      to_camera_name: t.destinationCamera?.name || 'Destination Node',
      timestamp: t.timestamp.toISOString(),
      travel_time_seconds: t.travelTimeSeconds || 0,
      distance_km: t.distanceMeters ? parseFloat((t.distanceMeters / 1000).toFixed(3)) : 0.0,
      speed_kmh: t.averageSpeed || 0.0,
    }));

    // Speeds summary
    const speeds = detections.map((d) => d.speed).filter((s) => s && s > 0);
    const avgSpeed = speeds.length > 0 ? (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1) : 0;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds).toFixed(1) : 0;

    const uniqueCameras = new Set(detections.map((d) => d.camera?.cameraCode || d.cameraId));

    exportData.push({
      vehicle_id: vehicle.id,
      plate: vehicle.plateNumber,
      vehicle_type: vehicle.vehicleType || 'CAR',
      color: vehicle.color || 'Unknown',
      status: bRecord.status,
      threat_profile: {
        severity: bRecord.severity,
        reason: bRecord.reason,
        flagged_at: bRecord.createdAt.toISOString(),
      },
      last_seen_timestamp: latestDet ? latestDet.timestamp.toISOString() : vehicle.lastSeen.toISOString(),
      current_checkpoint: currentCheckpoint,
      movement_summary: {
        total_detections: detections.length,
        unique_cameras_visited: uniqueCameras.size,
        total_transitions_logged: transitions.length,
        first_seen_timestamp: firstDet ? firstDet.timestamp.toISOString() : vehicle.firstSeen.toISOString(),
        last_seen_timestamp: latestDet ? latestDet.timestamp.toISOString() : vehicle.lastSeen.toISOString(),
        average_speed_kmh: parseFloat(avgSpeed),
        max_speed_kmh: parseFloat(maxSpeed),
      },
      movement_history: movementHistory,
      camera_transitions: formattedTransitions,
    });
  }

  // ── Step 3: Write Output JSON Files ───────────────────────────────────────
  const outputDirs = [
    path.join(__dirname, 'data', 'exports'),
    path.join(__dirname, '..', 'docs', 'exports'),
    path.join(__dirname, '..', 'ml', 'vehicle_movement_analysis', 'data'),
  ];

  for (const dir of outputDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, 'blacklisted_vehicles_movement.json');
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    console.log(`Saved JSON export to: ${filePath}`);
  }

  console.log('\n======================================================');
  console.log(' BLACKLISTED MOVEMENT DATA EXPORT COMPLETE');
  console.log('======================================================');
  console.log(`Total Blacklisted Vehicles Exported: ${exportData.length}`);
  exportData.forEach((v, i) => {
    console.log(
      `${i + 1}. Plate: ${v.plate.padEnd(12)} | Severity: ${v.threat_profile.severity.padEnd(8)} | Detections: ${String(
        v.movement_summary.total_detections
      ).padStart(3)} | Current Checkpoint: ${v.current_checkpoint?.camera_name || 'N/A'}`
    );
  });
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
