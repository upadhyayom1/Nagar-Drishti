const fs = require('fs');
const path = require('path');
const { prisma } = require('../lib/prisma');
const turf = require('@turf/turf');

const simulationConfig = {
    vehicleCount: 150,
    cameraCount: 30,
    detectionRadiusMeters: 20,
    minimumCameraSpacingMeters: 100
};

const VECHICLE_TYPES = ['CAR', 'BIKE', 'BUS', 'TRUCK', 'AUTO'];
const COLORS = ['WHITE', 'BLACK', 'SILVER', 'RED', 'BLUE'];

function generateIndianPlate() {
  const states = ['DL', 'HR', 'UP', 'MH', 'KA', 'TN', 'GJ', 'RJ'];
  const state = states[Math.floor(Math.random() * states.length)];
  const district = Math.floor(Math.random() * 90 + 10).toString().padStart(2, '0');
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const numbers = Math.floor(Math.random() * 9000 + 1000).toString();
  return `${state}${district}${letters}${numbers}`;
}

async function seed() {
  console.log('Starting DB seed...');

  // 1. Clean up old data
  console.log('Clearing old simulation data...');
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Vehicle", "Detection", "Camera", "Road", "Prediction", "Alert", "AnomalyEvent", "Trajectory", "CameraTransition", "BlacklistAlert", "BlacklistedVehicle", "CameraHealth", "TrafficEvent", "TrafficAggregate" CASCADE;');
  } catch (err) {
    console.error('Error truncating tables:', err);
  }

  // 2. Insert Roads
  console.log('Loading roads.geojson...');
  const roadsGeoJsonPath = path.join(__dirname, '../data/city/roads.geojson');
  if (!fs.existsSync(roadsGeoJsonPath)) {
    console.error('roads.geojson not found!');
    process.exit(1);
  }

  const geojson = JSON.parse(fs.readFileSync(roadsGeoJsonPath, 'utf8'));

  console.log('Inserting roads...');
  const roadsMap = new Map();
  geojson.features.forEach(f => {
    const roadCode = `R-${f.properties.id}`;
    if (!roadsMap.has(roadCode)) {
      let speed = parseInt(f.properties.maxspeed);
      if (isNaN(speed)) speed = 50;
      roadsMap.set(roadCode, {
        roadCode,
        name: f.properties.name || 'Unknown Road',
        speedLimit: speed,
        geometry: f.geometry
      });
    }
  });

  const roadsData = Array.from(roadsMap.values());

  const BATCH_SIZE = 100;
  for (let i = 0; i < roadsData.length; i += BATCH_SIZE) {
    const batch = roadsData.slice(i, i + BATCH_SIZE);
    await prisma.road.createMany({ data: batch, skipDuplicates: true });
  }
  const dbRoads = await prisma.road.findMany();
  console.log(`Inserted ${dbRoads.length} roads.`);

  // 3. Place Cameras Intelligently
  console.log(`Placing ${simulationConfig.cameraCount} cameras with minimum spacing of ${simulationConfig.minimumCameraSpacingMeters}m...`);
  const camerasData = [];
  
  let attempts = 0;
  const maxAttempts = 5000;

  while (camerasData.length < simulationConfig.cameraCount && attempts < maxAttempts) {
    attempts++;
    
    // Pick a random road
    const road = dbRoads[Math.floor(Math.random() * dbRoads.length)];
    if (!road.geometry || !road.geometry.coordinates) continue;

    // Pick a random point on the road
    const line = turf.lineString(road.geometry.coordinates);
    const lineLength = turf.length(line, { units: 'meters' });
    const randomDistance = Math.random() * lineLength;
    const point = turf.along(line, randomDistance, { units: 'meters' });
    const lon = point.geometry.coordinates[0];
    const lat = point.geometry.coordinates[1];
    const candidatePoint = turf.point([lon, lat]);

    // Check distance against existing cameras
    let tooClose = false;
    for (const cam of camerasData) {
      const existingPoint = turf.point([cam.longitude, cam.latitude]);
      const dist = turf.distance(candidatePoint, existingPoint, { units: 'meters' });
      if (dist < simulationConfig.minimumCameraSpacingMeters) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      camerasData.push({
        cameraCode: `C${(camerasData.length + 1).toString().padStart(2, '0')}`,
        name: `Cam ${camerasData.length + 1} (${road.name})`,
        latitude: lat,
        longitude: lon,
        roadId: road.id,
        direction: ['NORTH', 'SOUTH', 'EAST', 'WEST'][Math.floor(Math.random() * 4)],
        status: 'ONLINE'
      });
    }
  }

  if (camerasData.length < simulationConfig.cameraCount) {
    console.warn(`WARNING: Only able to place ${camerasData.length} cameras after ${maxAttempts} attempts due to spacing constraints.`);
  }

  await prisma.camera.createMany({ data: camerasData });
  console.log(`Inserted ${camerasData.length} cameras.`);

  // Validate and Print Camera Network Metrics
  let minSeparation = Infinity;
  let maxSeparation = 0;
  let sumSeparation = 0;
  let pairCount = 0;

  for (let i = 0; i < camerasData.length; i++) {
    for (let j = i + 1; j < camerasData.length; j++) {
      const p1 = turf.point([camerasData[i].longitude, camerasData[i].latitude]);
      const p2 = turf.point([camerasData[j].longitude, camerasData[j].latitude]);
      const dist = turf.distance(p1, p2, { units: 'meters' });
      
      if (dist < minSeparation) minSeparation = dist;
      if (dist > maxSeparation) maxSeparation = dist;
      sumSeparation += dist;
      pairCount++;
    }
  }

  const avgSeparation = pairCount > 0 ? (sumSeparation / pairCount) : 0;

  console.log('\n=======================================');
  console.log('Camera Network Validation');
  console.log('=======================================');
  console.log(`Camera count: ${camerasData.length}`);
  console.log(`Minimum camera separation: ${minSeparation.toFixed(1)} m`);
  console.log(`Average camera separation: ${avgSeparation.toFixed(1)} m`);
  console.log(`Maximum camera separation: ${maxSeparation.toFixed(1)} m`);
  console.log('=======================================\n');

  // 4. Create Vehicles
  console.log(`Creating ${simulationConfig.vehicleCount} simulated vehicles...`);
  const vehiclesData = [];
  for (let i = 1; i <= simulationConfig.vehicleCount; i++) {
    vehiclesData.push({
      plateNumber: generateIndianPlate(),
      vehicleType: VECHICLE_TYPES[Math.floor(Math.random() * VECHICLE_TYPES.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: 30 + Math.random() * 20, // Initial nominal speed, dynamically controlled in engine
      status: 'ACTIVE'
    });
  }

  await prisma.vehicle.createMany({ data: vehiclesData });
  console.log(`Inserted ${simulationConfig.vehicleCount} vehicles.`);

  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
