const { prisma } = require('../../lib/prisma');
const { normalizePlateNumber } = require('./blacklist.service');

/**
 * ML Next-Camera Prediction Hook
 * 
 * NOTE: The ML service is currently in development.
 * This hook currently returns `null`. When your ML microservice (e.g., FastAPI on port 8001)
 * is ready, plug in the HTTP call inside this function.
 * 
 * @param {string} vehicleId
 * @param {string} lastCameraId
 * @param {Array} history
 * @returns {Promise<Object|null>}
 */
async function predictNextCamera(vehicleId, lastCameraId, history = []) {
  // ---------------------------------------------------------------------------
  // ML SERVICE INTEGRATION HOOK (Placeholder)
  // When ready, uncomment and configure:
  //
  // try {
  //   const response = await axios.post('http://localhost:8001/api/predict/next-camera', {
  //     vehicleId,
  //     lastCameraId,
  //     trajectory: history.slice(-5)
  //   });
  //   return response.data; // { cameraCode, cameraName, probability, etaMinutes, confidence }
  // } catch (err) {
  //   console.warn('ML Service prediction unavailable:', err.message);
  //   return null;
  // }
  // ---------------------------------------------------------------------------
  return null;
}

/**
 * Retrieves comprehensive intelligence for all blacklisted vehicles,
 * including last sighting, vehicle intelligence stats, and next probable camera slot.
 */
async function getBlacklistIntelligence(filters = {}) {
  const query = {};
  if (filters.status) {
    query.status = filters.status;
  } else {
    query.status = 'ACTIVE';
  }

  const blacklisted = await prisma.blacklistedVehicle.findMany({
    where: query,
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  if (blacklisted.length === 0) return [];

  const plates = blacklisted.map((b) => normalizePlateNumber(b.plateNumber));
  const vehicles = await prisma.vehicle.findMany({
    where: { plateNumber: { in: plates } },
    include: {
      detections: {
        orderBy: { timestamp: 'desc' },
        take: 5,
        include: {
          camera: {
            select: {
              id: true,
              name: true,
              cameraCode: true,
              latitude: true,
              longitude: true,
              zone: { select: { name: true } },
              road: { select: { name: true } },
            },
          },
        },
      },
      _count: { select: { detections: true } },
    },
  });

  const vehicleByPlate = new Map(vehicles.map((v) => [v.plateNumber, v]));

  const enrichedList = await Promise.all(
    blacklisted.map(async (record) => {
      const normalizedPlate = normalizePlateNumber(record.plateNumber);
      const vehicle = vehicleByPlate.get(normalizedPlate);
      const detections = vehicle?.detections || [];

      // Last sighting details
      let lastSighting = null;
      if (detections.length > 0) {
        const latest = detections[0];
        lastSighting = {
          cameraId: latest.cameraId,
          cameraCode: latest.camera?.cameraCode || 'CAM',
          cameraName: latest.camera?.name || latest.camera?.cameraCode || 'Prayagraj Optical Node',
          zone: latest.camera?.zone?.name || 'Prayagraj Zone',
          road: latest.camera?.road?.name || 'Main Corridor',
          latitude: latest.latitude ?? latest.camera?.latitude,
          longitude: latest.longitude ?? latest.camera?.longitude,
          timestamp: latest.timestamp,
          speed: latest.speed || vehicle?.speed || 35,
          direction: latest.direction || 'EASTBOUND',
        };
      }

      const uniqueCameras = new Set(detections.map((d) => d.cameraId));

      // Calculate next probable camera location via ML hook
      const nextProbableCamera = vehicle && lastSighting
        ? await predictNextCamera(vehicle.id, lastSighting.cameraId, detections)
        : null;

      return {
        id: record.id,
        plateNumber: record.plateNumber,
        reason: record.reason,
        severity: record.severity,
        status: record.status,
        flaggedAt: record.createdAt,
        vehicleIntelligence: {
          vehicleType: vehicle?.vehicleType || 'CAR',
          color: vehicle?.color || 'Unknown',
          firstSeen: vehicle?.firstSeen || record.createdAt,
          lastSeen: vehicle?.lastSeen || lastSighting?.timestamp || record.createdAt,
          totalDetections: vehicle?._count?.detections || detections.length,
          camerasVisited: uniqueCameras.size || (lastSighting ? 1 : 0),
          averageSpeed: vehicle?.speed || 38,
          currentRoad: lastSighting?.road || 'Prayagraj Main Corridor',
        },
        lastSighting,
        nextProbableCamera,
      };
    })
  );

  return enrichedList;
}

module.exports = {
  getBlacklistIntelligence,
  predictNextCamera,
};
