const { prisma } = require('../../lib/prisma');
const config = require('./config');
const { setSeed, random } = require('./utils');
const { generateVehicles } = require('./vehicleGenerator');
const { RouteGenerator } = require('./routeGenerator');
const { getDailyTrips } = require('./behaviorProfiles');
const { generateTripDetections } = require('./detectionGenerator');
const { seedPrayagrajNetwork } = require('../seedPrayagrajNetwork');
const { processDetectionForBlacklist } = require('../../modules/blacklist/blacklist.service');
const turf = require('@turf/turf');

async function main() {
  console.log('--- Historical Data Generator ---');
  setSeed(config.seed);

  // 1. Wipe DB (since this is an isolated generator, we wipe first or rely on separate clean script)
  console.log('Cleaning old data...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Vehicle", "Detection", "Prediction", "Alert", "AnomalyEvent", "Trajectory", "CameraTransition", "BlacklistAlert", "BlacklistedVehicle", "VehicleIncident", "TrafficEvent", "TrafficAggregate", "CameraHealth", "Camera", "Road", "Zone" CASCADE;');

  // 2. Seed the curated Prayagraj zones, corridors, and camera junctions.
  const { cameras: dbCameras, roads: dbRoads } = await seedPrayagrajNetwork(prisma);
  console.log(`Saved ${dbRoads.length} Prayagraj roads and ${dbCameras.length} cameras.`);

  // 3. Generate Vehicles
  const vehiclesData = generateVehicles();
  const chunkSize = 2000;
  for (let i = 0; i < vehiclesData.length; i += chunkSize) {
    const chunk = vehiclesData.slice(i, i + chunkSize);
    await prisma.vehicle.createMany({
      data: chunk.map(v => ({
        plateNumber: v.plateNumber,
        vehicleType: v.vehicleType,
        status: v.status
      }))
    });
  }
  
  // We need to keep the profile around for generation
  const dbVehiclesMap = await prisma.vehicle.findMany().then(vs => {
     const map = new Map();
     for (const v of vs) map.set(v.plateNumber, v);
     return map;
  });

  const vehiclesWithProfile = vehiclesData
    .map(v => {
      const dbVehicle = dbVehiclesMap.get(v.plateNumber);
      if (!dbVehicle) return null;
      return {
        ...dbVehicle,
        profile: v.profile
      };
    })
    .filter(Boolean);
  
  if (vehiclesWithProfile.length === 0) {
    throw new Error('Failed to map any generated vehicles to database records.');
  }

  console.log(`Saved ${vehiclesWithProfile.length} vehicles.`);

  // 4. Initialize Route Generator
  console.log('Building road graph...');
  const routeGenerator = new RouteGenerator(dbRoads);

  // 4.5 Seed Camera Health
  console.log('Seeding Camera Health...');
  const healthData = dbCameras.map(c => ({
    cameraId: c.id,
    status: Math.random() > 0.05 ? 'ONLINE' : 'OFFLINE',
    recordedAt: new Date(),
    responseMs: Math.floor(Math.random() * 50) + 10,
    errorMessage: null
  }));
  await prisma.cameraHealth.createMany({ data: healthData });

  // 4.6 Seed Traffic Events
  console.log('Seeding Traffic Events...');
  const events = [];
  const eventTypes = ['ACCIDENT', 'ROAD_BLOCK', 'CONGESTION', 'VEHICLE_BREAKDOWN'];
  for (let i = 0; i < 20; i++) {
    const dDate = new Date();
    dDate.setHours(dDate.getHours() - Math.floor(Math.random() * 48));
    const randomCamera = dbCameras[Math.floor(Math.random() * dbCameras.length)];
    events.push({
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      severity: Math.random() > 0.8 ? 'CRITICAL' : 'HIGH',
      description: 'Simulated traffic event ' + i,
      cameraId: randomCamera.id,
      roadId: randomCamera.roadId,
      zoneId: randomCamera.zoneId,
      latitude: randomCamera.latitude,
      longitude: randomCamera.longitude,
      startedAt: dDate,
      status: 'ACTIVE'
    });
  }
  await prisma.trafficEvent.createMany({ data: events });

  // 5. Generate Trips & Detections over days
  console.log(`Simulating ${config.historicalDays} days of traffic...`);
  
  let totalDetections = 0;
  let totalTransitions = 0;
  let batch = [];
  let transitionBatch = [];
  const BATCH_SIZE = 5000;
  
  const endDate = config.endDate ? new Date(config.endDate) : new Date();
  if (Number.isNaN(endDate.getTime())) throw new Error('config.endDate must be a valid ISO date or null');
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (config.historicalDays - 1));
  startDate.setHours(0, 0, 0, 0);

  for (let day = 0; day < config.historicalDays; day++) {
    console.log(`Starting Day ${day}...`);
    const currentDayDate = new Date(startDate);
    currentDayDate.setDate(startDate.getDate() + day);
    const dayOfWeek = currentDayDate.getDay();

    for (const vehicle of vehiclesWithProfile) {
      if (random() > config.dailyActiveVehicleRate) continue;
      const trips = getDailyTrips(vehicle.profile, dayOfWeek);
      
      let lastNode = null;

      for (const trip of trips) {
        const tripHour = trip.hour;
        const tripType = trip.type;
        const tripDate = new Date(currentDayDate);
        tripDate.setHours(Math.floor(tripHour));
        tripDate.setMinutes(Math.floor((tripHour % 1) * 60));
        if (tripDate > endDate) continue;

        let startNode = lastNode;
        let endNode;

        if (tripType === 'COMMUTE_TO_WORK') {
          startNode = startNode || vehicle.homeNode;
          endNode = vehicle.workNode;
        } else if (tripType === 'COMMUTE_TO_HOME') {
          startNode = startNode || vehicle.workNode;
          endNode = vehicle.homeNode;
        } else if (tripType === 'LONG_HAUL') {
          startNode = routeGenerator.getRandomNode();
          endNode = routeGenerator.getRandomNode();
        } else {
          // RANDOM_TRIP
          startNode = startNode || routeGenerator.getRandomNode();
          endNode = routeGenerator.getRandomNode();
        }

        if (startNode === endNode) {
          endNode = routeGenerator.getRandomNode();
        }

        const route = routeGenerator.calculateRoute(startNode, endNode);
        lastNode = endNode;

        const detections = generateTripDetections(vehicle, route, dbCameras, tripDate.toISOString());
        for (let index = 1; index < detections.length; index++) {
          const source = detections[index - 1];
          const destination = detections[index];
          if (source.cameraId === destination.cameraId) continue;
          const travelTimeSeconds = Math.max(1, Math.round((destination.timestamp - source.timestamp) / 1000));
          const distanceMeters = turf.distance(
            [source.longitude, source.latitude],
            [destination.longitude, destination.latitude],
            { units: 'meters' },
          );
          transitionBatch.push({
            sourceCameraId: source.cameraId,
            destinationCameraId: destination.cameraId,
            vehicleId: vehicle.id,
            timestamp: destination.timestamp,
            travelTimeSeconds,
            distanceMeters,
            averageSpeed: (distanceMeters / travelTimeSeconds) * 3.6,
          });
        }
        
        for (const det of detections) {
          batch.push(det);
          if (batch.length >= BATCH_SIZE) {
            // Neon connection pooling can reject a large interactive transaction. These
            // are independent append-only historical batches, so persist them separately.
            await prisma.detection.createMany({ data: batch });
            if (transitionBatch.length) await prisma.cameraTransition.createMany({ data: transitionBatch });
            totalDetections += batch.length;
            totalTransitions += transitionBatch.length;
            batch = [];
            transitionBatch = [];
          }
        }
      }
    }

    if (day % 10 === 0) {
      console.log(`Day ${day} complete. Detections so far: ${totalDetections}`);
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await prisma.detection.createMany({ data: batch });
    if (transitionBatch.length) await prisma.cameraTransition.createMany({ data: transitionBatch });
    totalDetections += batch.length;
    totalTransitions += transitionBatch.length;
  }

  // 6. Update firstSeen / lastSeen for vehicles
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

  // 7. Seed a small, visible operational blacklist from the generated vehicle set.
  // The alerts are linked to actual generated detections, not hardcoded UI examples.
  const blacklistReasons = [
    ['CRITICAL', 'High-priority investigative watchlist'],
    ['HIGH', 'Repeated route-anomaly review'],
    ['MEDIUM', 'Operator verification required'],
  ];
  const blacklistCandidates = await prisma.vehicle.findMany({
    where: { detections: { some: {} } },
    take: config.blacklistedVehicleCount,
    orderBy: { lastSeen: 'desc' },
  });
  for (let index = 0; index < blacklistCandidates.length; index++) {
    const vehicle = blacklistCandidates[index];
    const [severity, reason] = blacklistReasons[index % blacklistReasons.length];
    const blacklist = await prisma.blacklistedVehicle.create({
      data: { plateNumber: vehicle.plateNumber, severity, reason, status: 'ACTIVE' },
    });
    await prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: 'BLACKLISTED' } });
    const latestDetection = await prisma.detection.findFirst({
      where: { vehicleId: vehicle.id },
      orderBy: { timestamp: 'desc' },
    });
    if (latestDetection) await processDetectionForBlacklist(latestDetection);
    console.log(`Blacklisted ${blacklist.plateNumber} (${severity}).`);
  }

  console.log(`\n================================`);
  console.log(` HISTORICAL GENERATION COMPLETE`);
  console.log(`================================`);
  console.log(`Vehicles generated: ${vehiclesData.length}`);
  console.log(`Cameras generated: ${dbCameras.length}`);
  console.log(`Total Detections: ${totalDetections}`);
  console.log(`Camera transitions generated: ${totalTransitions}`);
  console.log(`Days generated: ${config.historicalDays} (${startDate.toISOString()} – ${endDate.toISOString()})`);
  console.log(`Run 'npm run export:detections' to generate CSV.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
