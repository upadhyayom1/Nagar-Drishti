const engine = require('/Users/om_upadhyay/OM/workspace/SIH/Nagar-Drishti/backend/src/modules/simulation/engine.js');
const turf = require('@turf/turf');

async function runTests() {
  console.log('--- RUNNING DETECTION STATE MACHINE TESTS ---');
  
  // Setup a mock camera at 0, 0
  engine.cameras = [{
    id: 'test-cam-1',
    status: 'ONLINE',
    longitude: 0,
    latitude: 0,
    direction: 'NORTHBOUND'
  }];
  
  // Reset radius for tests
  engine.detectionRadiusMeters = 45;
  
  // Create a mock vehicle
  const v = {
    id: 'test-veh-1',
    plateNumber: 'TEST-123',
    speed: 10,
    state: 'MOVING',
    coords: [0.001, 0.001], // Far away
    activeCameras: new Set(),
    distanceTravelled: 0
  };
  engine.vehicles = [v]; engine.nodesList = ['0,0']; v.currentNode = '0,0'; v.currentRoute = [{target: '0,0', distance: 100, geometry: [[0,0],[0,0]], roadId: 'test'}];
  
  let detections = [];
  
  // Mock the DB createMany and updateMany just to prevent errors
  const originalCreateMany = require('/Users/om_upadhyay/OM/workspace/SIH/Nagar-Drishti/backend/src/lib/prisma').prisma.detection.createMany;
  require('/Users/om_upadhyay/OM/workspace/SIH/Nagar-Drishti/backend/src/lib/prisma').prisma.detection.createMany = async (args) => {
    detections.push(...args.data);
    return { count: args.data.length };
  };
  require('/Users/om_upadhyay/OM/workspace/SIH/Nagar-Drishti/backend/src/lib/prisma').prisma.vehicle.updateMany = async () => {};
  
  engine.time = new Date();
  engine.lastTickTime = Date.now();
  
  console.log('TEST 1: vehicle outside camera zone => no detection');
  v.coords = [0.01, 0.01]; // ~1.5km away
  await engine.tick();
  console.assert(detections.length === 0, 'Test 1 Failed');
  
  console.log('TEST 2: vehicle moves into camera zone => exactly one detection');
  // Teleport into zone to simulate entering
  v.coords = [0.0001, 0.0001]; // Very close
  await engine.tick();
  console.assert(detections.length === 1, 'Test 2 Failed: Expected 1, got ' + detections.length);
  
  console.log('TEST 3: vehicle remains inside zone => no second detection');
  v.coords = [0.0002, 0.0002]; // Still close
  await engine.tick();
  console.assert(detections.length === 1, 'Test 3 Failed: Expected 1, got ' + detections.length);
  
  console.log('TEST 4: vehicle leaves zone => camera rearmed');
  v.coords = [0.01, 0.01]; // Far away again
  await engine.tick();
  console.assert(v.activeCameras.size === 0, 'Test 4 Failed: Expected 0 active cameras, got ' + v.activeCameras.size);
  
  console.log('TEST 5: vehicle enters again => second detection');
  v.coords = [0.0001, 0.0001]; // Into zone again
  await engine.tick();
  console.assert(detections.length === 2, 'Test 5 Failed: Expected 2, got ' + detections.length);
  
  console.log('TEST 6: offline camera => no detection');
  engine.cameras[0].status = 'OFFLINE';
  v.coords = [0.01, 0.01]; // Leave
  await engine.tick();
  v.coords = [0.0001, 0.0001]; // Enter while offline
  await engine.tick();
  console.assert(detections.length === 2, 'Test 6 Failed: Expected 2, got ' + detections.length);
  engine.cameras[0].status = 'ONLINE'; // Restore
  
  console.log('TEST 7: vehicle crosses camera zone between ticks => detection still occurs');
  v.coords = [0.01, 0.01]; // Start far away
  await engine.tick();
  v.activeCameras.clear();
  detections = []; // Reset for this test
  // Jump from far away to the other side, crossing the 0,0 point
  v.coords = [-0.01, -0.01];
  await engine.tick();
  console.assert(detections.length === 1, 'Test 7 Failed: Expected 1 detection, got ' + detections.length);
  
  console.log('TEST 8: vehicle has invalid coordinates => no crash/no detection');
  v.coords = [null, undefined];
  try {
    await engine.tick();
    console.log('  No crash occurred.');
  } catch (e) {
    console.error('  Test 8 Failed: crashed', e);
  }
  
  console.log('ALL TESTS COMPLETED');
  process.exit(0);
}

runTests().catch(console.error);
