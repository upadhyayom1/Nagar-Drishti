const config = require('./config');
const { random, randomRange } = require('./utils');
const { getCongestionMultiplier, getBaseSpeedMps } = require('./behaviorProfiles');
const turf = require('@turf/turf');

function generateTripDetections(vehicle, route, cameras, startTimestampStr, options = {}) {
  const detections = [];
  let currentTime = new Date(startTimestampStr).getTime();
  if (!Number.isFinite(currentTime) || !Array.isArray(route) || route.length === 0) {
    return { detections, durationMs: 0, averageSpeedKmh: 0 };
  }

  const startHour = new Date(currentTime).getHours();
  const baseSpeed = getBaseSpeedMps(vehicle.vehicleType);
  const congestion = getCongestionMultiplier(startHour);
  const profileFactor = vehicle.profile === 'LONG_HAUL_TRUCK' ? 0.92 : vehicle.profile === 'RIDE_HAIL' ? 1.02 : 1;
  const actualSpeed = Math.max(4, baseSpeed * profileFactor / congestion);
  const cameraAvailability = options.cameraAvailability || new Map();
  const activeCameras = new Set();

  for (const edge of route) {
    const travelTimeMs = (edge.distance / actualSpeed) * 1000;
    const line = turf.lineString(edge.geometry);

    const edgeCameras = cameras
      .filter((camera) => !activeCameras.has(camera.id) && cameraAvailability.get(camera.id) !== false)
      .map((camera) => {
        const match = turf.nearestPointOnLine(line, [camera.longitude, camera.latitude], { units: 'meters' });
        return { camera, distance: match.properties.dist, location: match.properties.location };
      })
      .filter(({ distance }) => distance <= (options.cameraMatchRadiusMeters || 45))
      .sort((left, right) => left.location - right.location);

    for (const { camera, location } of edgeCameras) {
      activeCameras.add(camera.id);
      if (random() < config.detectionFailureRate) continue;

      const progress = edge.distance > 0 ? Math.min(1, Math.max(0, location / edge.distance)) : 0;
      const detectionTime = new Date(currentTime + progress * travelTimeMs);

      detections.push({
        vehicleId: vehicle.id,
        cameraId: camera.id,
        plateText: vehicle.plateNumber,
        ocrConfidence: randomRange(0.88, 0.995),
        vehicleConfidence: randomRange(0.90, 0.995),
        timestamp: detectionTime,
        latitude: camera.latitude,
        longitude: camera.longitude,
        direction: camera.direction || 'UNKNOWN',
        lane: Math.floor(random() * 3) + 1,
        source: 'SIMULATION',
      });
    }

    currentTime += travelTimeMs;
  }

  return {
    detections,
    durationMs: Math.max(0, currentTime - new Date(startTimestampStr).getTime()),
    averageSpeedKmh: actualSpeed * 3.6,
  };
}

module.exports = { generateTripDetections };
