/**
 * Run with: node src/modules/trajectory/__tests__/trajectory.test.js
 *
 * No Jest/Mocha dependency is installed in this project, so this is a plain
 * Node assertion script in the same style as backend/test-integration.js.
 * It covers the eight scenarios called out in the Phase 4 spec plus the
 * pure collapse/validate helpers, all against trajectory.utils.js (no DB)
 * and buildTrajectory() with a stubbed network module (no DB, no network).
 */

const assert = require('assert');
const Module = require('module');

// buildTrajectory() imports the network service, which imports Prisma. Stub
// both out before requiring trajectory.service so these tests never touch a
// real database or the road-network graph.
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.endsWith('lib/prisma')) {
    return require.resolve('./__stubs__/prisma.stub.js');
  }
  return originalResolve.call(this, request, ...rest);
};

const {
  collapseConsecutiveCameraObservations,
  matchStoredTransition,
  computeTravelTimeSeconds,
  computeSpeedKmh,
  validateSegment,
  sortAndFilterDetections,
} = require('../trajectory.utils');
const { buildTrajectory } = require('../trajectory.service');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    console.error(`       ${error.message}`);
    process.exitCode = 1;
  }
}

function det(cameraId, timestamp, extra = {}) {
  return { cameraId, timestamp: new Date(timestamp), latitude: 25.45, longitude: 81.84, ...extra };
}

// Test 1 — chronological: A 10:00, B 10:05, C 10:12 stays A -> B -> C
test('Test 1 — chronological order is preserved', () => {
  const detections = [det('C', '2026-01-01T10:12:00Z'), det('A', '2026-01-01T10:00:00Z'), det('B', '2026-01-01T10:05:00Z')];
  const sorted = sortAndFilterDetections(detections);
  assert.deepStrictEqual(sorted.map((d) => d.cameraId), ['A', 'B', 'C']);
});

// Test 2 — duplicate camera: A 10:00, A 10:01, B 10:05 -> A -> B
test('Test 2 — duplicate camera observations collapse', () => {
  const detections = [det('A', '2026-01-01T10:00:00Z'), det('A', '2026-01-01T10:01:00Z'), det('B', '2026-01-01T10:05:00Z')];
  const collapsed = collapseConsecutiveCameraObservations(detections);
  assert.deepStrictEqual(collapsed.map((d) => d.cameraId), ['A', 'B']);
});

// Test 3 — travel time: 10:00 -> 10:05 equals 300 seconds
test('Test 3 — travel time is computed from timestamps', () => {
  const previous = { timestamp: new Date('2026-01-01T10:00:00Z') };
  const current = { timestamp: new Date('2026-01-01T10:05:00Z') };
  assert.strictEqual(computeTravelTimeSeconds(previous, current), 300);
});

// Test 4 — speed: 1000m / 200s equals 18 km/h
test('Test 4 — speed is computed from distance and time', () => {
  assert.strictEqual(computeSpeedKmh(1000, 200), 18);
});

// Test 5 — invalid timestamp: A 10:05, B 10:00 must not produce a valid segment
test('Test 5 — non-chronological pair is invalid', () => {
  const previous = { cameraId: 'A', timestamp: new Date('2026-01-01T10:05:00Z') };
  const current = { cameraId: 'B', timestamp: new Date('2026-01-01T10:00:00Z') };
  const travelTimeSeconds = computeTravelTimeSeconds(previous, current);
  const { valid, reason } = validateSegment({
    previous, current, travelTimeSeconds, distanceMeters: 500, speedKmh: 10, maxPlausibleSpeedKmh: 160,
  });
  assert.strictEqual(valid, false);
  assert.strictEqual(reason, 'NON_POSITIVE_TRAVEL_TIME');
});

// Test 8 — same camera: A -> A doesn't become a movement segment
test('Test 8 — same source and destination camera is invalid', () => {
  const previous = { cameraId: 'A', timestamp: new Date('2026-01-01T10:00:00Z') };
  const current = { cameraId: 'A', timestamp: new Date('2026-01-01T10:05:00Z') };
  const { valid, reason } = validateSegment({
    previous, current, travelTimeSeconds: 300, distanceMeters: 0, speedKmh: 0, maxPlausibleSpeedKmh: 160,
  });
  assert.strictEqual(valid, false);
  assert.strictEqual(reason, 'SAME_CAMERA');
});

test('Implausible speed is marked invalid, not silently accepted', () => {
  const previous = { cameraId: 'A', timestamp: new Date('2026-01-01T10:00:00Z') };
  const current = { cameraId: 'B', timestamp: new Date('2026-01-01T10:00:05Z') };
  const { valid, reason } = validateSegment({
    previous, current, travelTimeSeconds: 5, distanceMeters: 5000, speedKmh: 3600, maxPlausibleSpeedKmh: 160,
  });
  assert.strictEqual(valid, false);
  assert.strictEqual(reason, 'IMPLAUSIBLE_SPEED');
});

test('Missing speed is null, never fabricated as 0', () => {
  const speed = computeSpeedKmh(null, 300);
  assert.strictEqual(speed, null);
});

test('Stored CameraTransition is matched and preferred', () => {
  const transitions = [
    { sourceCameraId: 'A', destinationCameraId: 'B', timestamp: new Date('2026-01-01T10:05:00Z'), distanceMeters: 1450, travelTimeSeconds: 210, averageSpeed: 24.86 },
  ];
  const previous = { cameraId: 'A', timestamp: new Date('2026-01-01T10:00:00Z') };
  const current = { cameraId: 'B', timestamp: new Date('2026-01-01T10:05:00Z') };
  const match = matchStoredTransition(transitions, previous, current);
  assert.ok(match);
  assert.strictEqual(match.distanceMeters, 1450);
});

// Integration-style: buildTrajectory end-to-end with stubbed network module
// (Test 6 — missing transition falls back to network distance;
//  Test 7 — missing network path falls back to geographic distance)
(async () => {
  await (async () => {
    // Mutate the already-loaded network module in place (do not delete the
    // require cache — trajectory.service.js captured this exact module
    // object at its own require time).
    const networkService = require('../../network/roadNetwork.service');

    // Force the network fallback to "no route available" so this scenario
    // exercises the geographic (Haversine) fallback deterministically.
    networkService.getNetworkDistanceMeters = async () => null;

    const detections = [
      det('A', '2026-01-01T10:00:00Z', { longitude: 81.8300, latitude: 25.4500 }),
      det('B', '2026-01-01T10:07:00Z', { longitude: 81.8400, latitude: 25.4600 }),
    ];

    const { segments } = await buildTrajectory(detections, [] /* no stored transitions */, {});

    test('Test 7 — missing transition and missing network route uses geographic fallback', () => {
      assert.strictEqual(segments.length, 1);
      assert.strictEqual(segments[0].distanceSource, 'GEOGRAPHIC_FALLBACK');
      assert.ok(segments[0].distanceMeters > 0);
      assert.strictEqual(segments[0].valid, true);
    });

    // Test 6 — missing transition, network distance available -> use it.
    networkService.getNetworkDistanceMeters = async () => 1234;
    const { segments: networkSegments } = await buildTrajectory(detections, [], {});
    test('Test 6 — missing transition uses network distance when available', () => {
      assert.strictEqual(networkSegments[0].distanceSource, 'NETWORK_ROUTE');
      assert.strictEqual(networkSegments[0].distanceMeters, 1234);
    });
  })();

  console.log(`\n${passed} test(s) passed.`);
  if (process.exitCode) {
    console.error('Some tests FAILED.');
    process.exit(1);
  }
})();
