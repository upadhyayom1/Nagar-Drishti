const { prisma } = require('../../lib/prisma');
const { normalizePlateNumber } = require('./blacklist.service');
const axios = require('axios');
const { env } = require('../../config/env');

async function predictNextCamera(vehicleId, lastCameraId, history = [], predictionData = null) {
  if (!predictionData?.sourceCameras.get(lastCameraId)) return null;
  const serializeTransition = (transition) => ({
    sourceCameraId: transition.sourceCameraId,
    destinationCameraId: transition.destinationCameraId,
    destinationCameraCode: transition.destinationCamera.cameraCode,
    destinationCameraName: transition.destinationCamera.name,
    destinationZone: transition.destinationCamera.zone?.name,
    destinationRoad: transition.destinationCamera.road?.name,
    travelTimeSeconds: transition.travelTimeSeconds,
    vehicleId: transition.vehicleId,
  });
  try {
    const networkTransitions = predictionData.networkTransitionsBySource.get(lastCameraId) || [];
    const vehicleTransitions = predictionData.vehicleTransitionsByKey.get(`${vehicleId}:${lastCameraId}`) || [];
    const response = await axios.post(`${env.ML_SERVICE_URL}/api/blacklisted/predict-next`, {
      vehicleId,
      lastCameraId,
      transitions: networkTransitions.map(serializeTransition),
      vehicleTransitions: vehicleTransitions.map(serializeTransition),
    }, { timeout: 5000 });
    const prediction = response.data?.prediction;
    return prediction ? { ...prediction, alternativeCameras: response.data.alternatives || [] } : null;
  } catch (error) {
    console.warn(`ML next-camera prediction unavailable for ${vehicleId}:`, error.message);
    return null;
  }
}

/**
 * Retrieves comprehensive intelligence for all blacklisted vehicles,
 * including last sighting, vehicle intelligence stats, and next probable camera slot.
 */
async function getBlacklistIntelligence(filters = {}) {
  const query = {};
  if (filters.status && filters.status !== 'ALL') {
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
  const predictionInputs = vehicles
    .map((vehicle) => ({ vehicleId: vehicle.id, lastCameraId: vehicle.detections[0]?.cameraId }))
    .filter((input) => input.lastCameraId);
  const lastCameraIds = [...new Set(predictionInputs.map((input) => input.lastCameraId))];
  const vehicleIds = [...new Set(predictionInputs.map((input) => input.vehicleId))];
  const transitionInclude = { destinationCamera: { include: { road: { select: { name: true } }, zone: { select: { name: true } } } } };
  const [sourceCameras, networkTransitions, vehicleTransitions, onlineCameras] = await Promise.all([
    lastCameraIds.length ? prisma.camera.findMany({ where: { id: { in: lastCameraIds } }, include: { road: { select: { id: true, name: true } }, zone: { select: { id: true, name: true } } } }) : [],
    lastCameraIds.length ? prisma.cameraTransition.findMany({ where: { sourceCameraId: { in: lastCameraIds } }, orderBy: { timestamp: 'desc' }, take: 2000, include: transitionInclude }) : [],
    vehicleIds.length ? prisma.cameraTransition.findMany({ where: { vehicleId: { in: vehicleIds }, sourceCameraId: { in: lastCameraIds } }, orderBy: { timestamp: 'desc' }, take: 1000, include: transitionInclude }) : [],
    prisma.camera.findMany({ where: { status: 'ONLINE' }, include: { road: { select: { name: true } }, zone: { select: { name: true } } } }),
  ]);
  const predictionData = {
    sourceCameras: new Map(sourceCameras.map((camera) => [camera.id, camera])),
    networkTransitionsBySource: new Map(),
    vehicleTransitionsByKey: new Map(),
    onlineCameras,
  };
  for (const transition of networkTransitions) {
    const transitions = predictionData.networkTransitionsBySource.get(transition.sourceCameraId) || [];
    transitions.push(transition);
    predictionData.networkTransitionsBySource.set(transition.sourceCameraId, transitions);
  }
  for (const transition of vehicleTransitions) {
    const key = `${transition.vehicleId}:${transition.sourceCameraId}`;
    const transitions = predictionData.vehicleTransitionsByKey.get(key) || [];
    transitions.push(transition);
    predictionData.vehicleTransitionsByKey.set(key, transitions);
  }

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
          speed: latest.speed ?? vehicle?.speed ?? null,
          direction: latest.direction || 'UNKNOWN',
        };
      }

      const uniqueCameras = new Set(detections.map((d) => d.cameraId));

      // Calculate next probable camera location via ML hook
      const nextProbableCamera = vehicle && lastSighting
        ? await predictNextCamera(vehicle.id, lastSighting.cameraId, detections, predictionData)
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
          averageSpeed: vehicle?.speed ?? null,
          currentRoad: lastSighting?.road || null,
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
