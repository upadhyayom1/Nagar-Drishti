const config = require('./config');
const { random, randomRange } = require('./utils');
const { getCongestionMultiplier, getBaseSpeedMps } = require('./behaviorProfiles');
const turf = require('@turf/turf');

function generateTripDetections(vehicle, route, cameras, startTimestampStr) {
  const detections = [];
  let currentTime = new Date(startTimestampStr).getTime();
  const startHour = new Date(currentTime).getHours();
  
  const baseSpeed = getBaseSpeedMps(vehicle.vehicleType);
  const congestion = getCongestionMultiplier(startHour);
  const actualSpeed = baseSpeed / congestion;

  const activeCameras = new Set();

  for (const edge of route) {
    const travelTimeMs = (edge.distance / actualSpeed) * 1000;
    const line = turf.lineString(edge.geometry);
    const edgeCameras = cameras
      .filter((camera) => !activeCameras.has(camera.cameraCode) && random() >= config.cameraOfflineRate)
      .map((camera) => {
        const match = turf.nearestPointOnLine(line, [camera.longitude, camera.latitude], { units: 'meters' });
        return { camera, distance: match.properties.dist, location: match.properties.location };
      })
      .filter(({ distance }) => distance <= 35)
      .sort((left, right) => left.location - right.location);

    for (const { camera, location } of edgeCameras) {
      activeCameras.add(camera.cameraCode);
      if (random() < config.detectionFailureRate) continue;

      const progress = edge.distance ? location / edge.distance : 0;
      const detectionTime = new Date(currentTime + (progress * travelTimeMs));
      detections.push({
        vehicleId: vehicle.id,
        cameraId: camera.id,
        plateText: vehicle.plateNumber,
        ocrConfidence: randomRange(0.70, 0.99),
        vehicleConfidence: randomRange(0.75, 0.99),
        timestamp: detectionTime,
        latitude: camera.latitude,
        longitude: camera.longitude,
        source: 'SIMULATION',
      });
    }
    
    currentTime += travelTimeMs;
  }

  return detections;
}

module.exports = { generateTripDetections };
