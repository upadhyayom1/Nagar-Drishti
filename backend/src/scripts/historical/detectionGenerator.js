const config = require('./config');
const { random, randomRange, getDistance } = require('./utils');
const { getCongestionMultiplier, getBaseSpeedMps } = require('./behaviorProfiles');
const turf = require('@turf/turf');

function generateTripDetections(vehicle, route, cameras, startTimestampStr) {
  let detections = [];
  let currentTime = new Date(startTimestampStr).getTime();
  const startHour = new Date(currentTime).getHours();
  
  const baseSpeed = getBaseSpeedMps(vehicle.vehicleType);
  const congestion = getCongestionMultiplier(startHour);
  const actualSpeed = baseSpeed / congestion;

  const activeCameras = new Set();

  for (const edge of route) {
    const travelTimeMs = (edge.distance / actualSpeed) * 1000;
    
    // Simulate passing the road and checking cameras
    for (const cam of cameras) {
      // Is camera offline today?
      if (random() < config.cameraOfflineRate) continue;

      const camPoint = turf.point([cam.longitude, cam.latitude]);
      // Just check the midpoint and endpoints for simplicity in generation, or just iterate coords
      for (const coord of edge.geometry) {
        const dist = getDistance(cam.longitude, cam.latitude, coord[0], coord[1]);
        if (dist <= 25) { // 25m detection radius
          if (!activeCameras.has(cam.cameraCode)) {
            activeCameras.add(cam.cameraCode);
            
            // Random detection failure
            if (random() < config.detectionFailureRate) continue;

            const detectionTime = new Date(currentTime + (random() * travelTimeMs));
            
            detections.push({
              vehicleId: vehicle.id, 
              cameraId: cam.id,
              plateText: vehicle.plateNumber,
              ocrConfidence: randomRange(0.70, 0.99),
              vehicleConfidence: randomRange(0.75, 0.99),
              timestamp: detectionTime,
              latitude: cam.latitude,
              longitude: cam.longitude,
              source: 'SIMULATION'
            });
          }
          break; // Avoid detecting multiple times on same edge
        }
      }
    }
    
    currentTime += travelTimeMs;
  }

  return detections;
}

module.exports = { generateTripDetections };
