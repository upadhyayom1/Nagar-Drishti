const bcrypt = require('bcryptjs');
const { prisma } = require('../../lib/prisma');
const config = require('./config');
const { setSeed, random, randomRange, randomWeighted } = require('./utils');
const { generateVehicles } = require('./vehicleGenerator');
const { RouteGenerator } = require('./routeGenerator');
const { getDailyTrips } = require('./behaviorProfiles');
const { generateTripDetections } = require('./detectionGenerator');
const { seedPrayagrajNetwork } = require('../seedPrayagrajNetwork');
const { processDetectionForBlacklist } = require('../../modules/blacklist/blacklist.service');
const { exportCsv } = require('./exportCsv');

function buildTripDate(day, hour) {
  const date = new Date(day);
  date.setHours(Math.floor(hour), Math.floor((hour % 1) * 60), Math.floor(random() * 60), Math.floor(random() * 1000));
  return date;
}

function chooseDestination(routeGenerator, startNode, tripType, vehicleProfile) {
  if (!startNode) return null;

  const options = {
    LONG_HAUL: { minMeters: 5000 },
    RANDOM_TRIP: vehicleProfile === 'DELIVERY' || vehicleProfile === 'COMMERCIAL'
      ? { minMeters: 800, maxMeters: 8000 }
      : { minMeters: 500, maxMeters: 6000 },
  };

  const destination = routeGenerator.getRandomDestination(startNode, options[tripType] || options.RANDOM_TRIP);
  return destination || routeGenerator.getRandomDestination(startNode, { minMeters: 100 });
}

function createCameraAvailability(cameras) {
  const availability = new Map();
  for (const camera of cameras) {
    availability.set(camera.id, random() >= config.cameraOfflineRate);
  }
  return availability;
}

async function ensureUsers() {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || (isProduction ? null : 'admin123');
  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD || (isProduction ? null : adminPassword);
  const userPassword = process.env.SEED_USER_PASSWORD || (isProduction ? null : 'user123');

  if (!adminPassword || !operatorPassword || !userPassword) {
    throw new Error('Set SEED_ADMIN_PASSWORD, SEED_OPERATOR_PASSWORD and SEED_USER_PASSWORD before generating production data.');
  }

  const [adminHash, operatorHash, userHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(operatorPassword, 12),
    bcrypt.hash(userPassword, 12),
  ]);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminHash, role: 'ADMIN' },
    create: { username: 'admin', passwordHash: adminHash, name: 'Central Admin', role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { username: 'operator.krishnan' },
    update: { passwordHash: operatorHash, role: 'ADMIN' },
    create: { username: 'operator.krishnan', passwordHash: operatorHash, name: 'Officer Krishnan', role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { username: 'citizen.user' },
    update: { passwordHash: userHash, role: 'USER' },
    create: { username: 'citizen.user', passwordHash: userHash, name: 'Citizen User', role: 'USER' },
  });
}

async function clearGeneratedData() {
  // Keep application users intact; historical generation owns all synthetic telemetry.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Complaint", "Incident", "VehicleIncident", "Alert", "AnomalyEvent",
      "Prediction", "Trajectory", "CameraTransition", "BlacklistAlert",
      "BlacklistedVehicle", "TrafficEvent", "TrafficAggregate", "CameraHealth",
      "Detection", "Vehicle", "Camera", "Road", "Zone"
    CASCADE;
  `);
}

async function createTrafficEvents(cameras, startDate, endDate) {
  if (!cameras.length || endDate <= startDate) return;

  const types = ['ACCIDENT', 'ROAD_BLOCK', 'CONGESTION', 'VEHICLE_BREAKDOWN'];
  const events = [];
  const range = endDate.getTime() - startDate.getTime();

  for (let i = 0; i < 20; i++) {
    const startedAt = new Date(startDate.getTime() + random() * range);
    const durationMinutes = randomRange(20, 150);
    const resolvedAt = new Date(Math.min(endDate.getTime(), startedAt.getTime() + durationMinutes * 60000));
    const camera = cameras[Math.floor(random() * cameras.length)];

    events.push({
      type: types[Math.floor(random() * types.length)],
      severity: random() < 0.08 ? 'CRITICAL' : random() < 0.35 ? 'HIGH' : 'MEDIUM',
      description: 'Simulated operational traffic event',
      cameraId: camera.id,
      roadId: camera.roadId,
      zoneId: camera.zoneId,
      latitude: camera.latitude,
      longitude: camera.longitude,
      startedAt,
      resolvedAt,
      status: 'RESOLVED',
    });
  }

  await prisma.trafficEvent.createMany({ data: events });
}

async function createTrafficAggregates() {
  await prisma.$executeRawUnsafe(`
    INSERT INTO "TrafficAggregate"
      ("id", "cameraId", "zoneId", "timeBucket", "vehicleCount", "trafficDensity", "createdAt")
    SELECT
      md5(
        x."cameraId" ||
        x."timeBucket"::text
      ) AS "id",
      x."cameraId",
      x."zoneId",
      x."timeBucket",
      COUNT(DISTINCT x."vehicleId")::integer AS "vehicleCount",
      LEAST(
        COUNT(DISTINCT x."vehicleId") / 25.0,
        1.0
      ) AS "trafficDensity",
      CURRENT_TIMESTAMP
    FROM (
      SELECT
        d."cameraId",
        c."zoneId",
        d."vehicleId",
        date_trunc('hour', d."timestamp")
          + (
              FLOOR(
                EXTRACT(MINUTE FROM d."timestamp") / 15
              ) * INTERVAL '15 minutes'
            ) AS "timeBucket"
      FROM "Detection" d
      INNER JOIN "Camera" c
        ON c."id" = d."cameraId"
    ) x
    GROUP BY
      x."cameraId",
      x."zoneId",
      x."timeBucket"
    ON CONFLICT ("id") DO NOTHING;
  `);
}
async function createCurrentCongestionAlerts(endDate) {
  const from = new Date(endDate.getTime() - 60 * 60 * 1000);
  const cameraCounts = await prisma.detection.groupBy({
    by: ['cameraId'],
    where: { timestamp: { gte: from, lte: endDate } },
    _count: { vehicleId: true },
  });

  const ranked = cameraCounts
    .filter((item) => item._count.vehicleId >= config.congestionAlertVehicleThreshold)
    .sort((a, b) => b._count.vehicleId - a._count.vehicleId)
    .slice(0, 5);

  for (const item of ranked) {
    const camera = await prisma.camera.findUnique({ where: { id: item.cameraId } });
    if (!camera) continue;
    const count = item._count.vehicleId;
    await prisma.alert.create({
      data: {
        type: 'CONGESTION',
        severity: count >= config.criticalCongestionVehicleThreshold ? 'CRITICAL' : 'HIGH',
        cameraId: camera.id,
        message: `Traffic congestion detected at ${camera.name} with ${count} vehicle detections in the last hour.`,
        status: 'ACTIVE',
        createdAt: endDate,
      },
    });
  }
}

async function main() {
  console.log('--- Nagar-Drishti Historical Data Generator ---');
  setSeed(config.seed);

  const endDate = config.endDate ? new Date(config.endDate) : new Date();
  if (Number.isNaN(endDate.getTime())) throw new Error('HISTORICAL_END_DATE must be a valid ISO date.');

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (config.historicalDays - 1));
  startDate.setHours(0, 0, 0, 0);

  console.log(`Generating ${config.historicalDays} days: ${startDate.toISOString()} -> ${endDate.toISOString()}`);

  await clearGeneratedData();
  await ensureUsers();

  // IMPORTANT: this is the existing curated network generator. Do not alter its nodes,
  // roads, camera coordinates, zones, or camera/road assignments here.
  const { cameras: dbCameras, roads: dbRoads } = await seedPrayagrajNetwork(prisma);
  console.log(`Network ready: ${dbRoads.length} roads, ${dbCameras.length} cameras.`);

  const routeGenerator = new RouteGenerator(dbRoads);
  if (!routeGenerator.nodesList.length) throw new Error('No routable nodes were produced from the existing road dataset.');

  const vehiclesData = generateVehicles({ nodeKeys: routeGenerator.nodesList });
  const createdVehicles = [];

  for (let i = 0; i < vehiclesData.length; i += 2000) {
    const chunk = vehiclesData.slice(i, i + 2000);
    await prisma.vehicle.createMany({
      data: chunk.map((vehicle) => ({
        plateNumber: vehicle.plateNumber,
        vehicleType: vehicle.vehicleType,
        status: vehicle.status,
      })),
    });
  }

  const dbVehicles = await prisma.vehicle.findMany();
  const dbVehiclesMap = new Map(dbVehicles.map((vehicle) => [vehicle.plateNumber, vehicle]));

  for (const vehicle of vehiclesData) {
    const dbVehicle = dbVehiclesMap.get(vehicle.plateNumber);
    if (!dbVehicle) continue;
    createdVehicles.push({ ...dbVehicle, ...vehicle, currentLocation: vehicle.homeNode });
  }

  if (!createdVehicles.length) throw new Error('No vehicles were created.');

  // Seed one health record per camera per simulated day, not with real-world timestamps.
  const healthBatch = [];
  const eventCameras = dbCameras;
  for (let day = 0; day < config.historicalDays; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + day);
    for (const camera of dbCameras) {
      const recordedAt = new Date(dayDate);
      recordedAt.setHours(0, 5, 0, 0);
      healthBatch.push({
        cameraId: camera.id,
        status: random() >= config.cameraOfflineRate ? 'ONLINE' : 'OFFLINE',
        recordedAt,
        responseMs: Math.floor(randomRange(12, 80)),
        errorMessage: null,
      });
    }
  }
  for (let i = 0; i < healthBatch.length; i += 5000) {
    await prisma.cameraHealth.createMany({ data: healthBatch.slice(i, i + 5000) });
  }

  await createTrafficEvents(eventCameras, startDate, endDate);

  let totalDetections = 0;
  let totalTransitions = 0;
  const detectionBatch = [];
  const transitionBatch = [];

  const flush = async () => {
    if (detectionBatch.length) {
      await prisma.detection.createMany({ data: detectionBatch.splice(0, detectionBatch.length) });
    }
    if (transitionBatch.length) {
      await prisma.cameraTransition.createMany({ data: transitionBatch.splice(0, transitionBatch.length) });
    }
  };

  for (let dayIndex = 0; dayIndex < config.historicalDays; dayIndex++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + dayIndex);
    const dayEnd = new Date(currentDay);
    dayEnd.setHours(23, 59, 59, 999);
    if (dayEnd > endDate) dayEnd.setTime(endDate.getTime());

    const dayOfWeek = currentDay.getDay();
    const cameraAvailability = createCameraAvailability(dbCameras);

    for (const vehicle of createdVehicles) {
      if (random() > config.dailyActiveVehicleRate) continue;

      const trips = getDailyTrips(vehicle.profile, dayOfWeek);
      let availableAt = new Date(currentDay);

      for (const trip of trips) {
        let tripStart = buildTripDate(currentDay, trip.hour);
        if (tripStart < availableAt) {
          tripStart = new Date(availableAt);
        }

        if (tripStart > dayEnd) continue;

        let destinationNode;
        if (trip.type === 'COMMUTE_TO_WORK') {
          destinationNode = vehicle.workNode;
        } else if (trip.type === 'COMMUTE_TO_HOME') {
          destinationNode = vehicle.homeNode;
        } else {
          destinationNode = chooseDestination(routeGenerator, vehicle.currentLocation, trip.type, vehicle.profile);
        }

        if (!destinationNode || destinationNode === vehicle.currentLocation) continue;

        const route = routeGenerator.calculateRoute(vehicle.currentLocation, destinationNode);
        if (!route.length) {
          // No route means no trip. Never teleport and never mutate currentLocation.
          continue;
        }

        const generated = generateTripDetections(
          vehicle,
          route,
          dbCameras,
          tripStart.toISOString(),
          { cameraAvailability, cameraMatchRadiusMeters: 45 },
        );

        const tripEnd = new Date(tripStart.getTime() + generated.durationMs);
        if (tripEnd > dayEnd) continue;

        for (let index = 1; index < generated.detections.length; index++) {
          const source = generated.detections[index - 1];
          const destination = generated.detections[index];
          if (source.cameraId === destination.cameraId) continue;

          const travelTimeSeconds = Math.max(1, Math.round((destination.timestamp - source.timestamp) / 1000));
          const distanceMeters = require('@turf/turf').distance(
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
          totalTransitions++;
        }

        for (const detection of generated.detections) {
          if (detection.timestamp > endDate) continue;
          detectionBatch.push(detection);
          totalDetections++;
        }

        // The vehicle physically reaches the destination even if no camera saw it.
        vehicle.currentLocation = destinationNode;
        vehicle.lastSimulatedAt = tripEnd;
        availableAt = new Date(tripEnd.getTime() + randomRange(5, 25) * 60000);

        if (detectionBatch.length >= config.batchSize || transitionBatch.length >= config.batchSize) {
          await flush();
        }
      }
    }

    if (dayIndex % 10 === 0 || dayIndex === config.historicalDays - 1) {
      await flush();
      console.log(`Day ${dayIndex + 1}/${config.historicalDays}: ${totalDetections} detections, ${totalTransitions} transitions.`);
    }
  }

  await flush();

  await prisma.$executeRawUnsafe(`
    UPDATE "Vehicle" v
    SET "firstSeen" = d.min_ts, "lastSeen" = d.max_ts
    FROM (
      SELECT "vehicleId", MIN("timestamp") AS min_ts, MAX("timestamp") AS max_ts
      FROM "Detection"
      GROUP BY "vehicleId"
    ) d
    WHERE v.id = d."vehicleId";
  `);

  // Generate operational blacklist entries from real vehicles with real detections.
  const blacklistCandidates = await prisma.vehicle.findMany({
    where: { detections: { some: {} } },
    orderBy: { lastSeen: 'desc' },
    take: config.blacklistedVehicleCount,
  });

  const reasons = [
    ['CRITICAL', 'High-priority investigative watchlist'],
    ['HIGH', 'Repeated route-anomaly review'],
    ['MEDIUM', 'Operator verification required'],
  ];

  for (let index = 0; index < blacklistCandidates.length; index++) {
    const vehicle = blacklistCandidates[index];
    const [severity, reason] = reasons[index % reasons.length];
    await prisma.blacklistedVehicle.create({
      data: { plateNumber: vehicle.plateNumber, severity, reason, status: 'ACTIVE' },
    });
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: 'BLACKLISTED' },
    });

    const latestDetection = await prisma.detection.findFirst({
      where: { vehicleId: vehicle.id },
      orderBy: { timestamp: 'desc' },
    });
    if (latestDetection) await processDetectionForBlacklist(latestDetection);
  }

  await createTrafficAggregates();
  await createCurrentCongestionAlerts(endDate);

  console.log('\n================================');
  console.log(' HISTORICAL GENERATION COMPLETE');
  console.log('================================');
  console.log(`Vehicles: ${createdVehicles.length}`);
  console.log(`Cameras: ${dbCameras.length}`);
  console.log(`Roads: ${dbRoads.length}`);
  console.log(`Detections: ${totalDetections}`);
  console.log(`Transitions: ${totalTransitions}`);
  console.log(`Window: ${startDate.toISOString()} -> ${endDate.toISOString()}`);
  console.log('Telemetry continuity: enforced');
  console.log('Network dataset: existing Prayagraj dataset preserved');
  console.log('Exporting the same database snapshot for the ML service...');
  await exportCsv();
  console.log('ML data export complete.');
}

main()
  .catch((error) => {
    console.error('Historical generation failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
