const { prisma } = require('../../lib/prisma');
const { getJson, publishRealtime, setJson } = require('../../realtime/realtime');

const DEFAULT_WINDOW_MINUTES = 5;

function parseTrafficWindow({ from, to } = {}) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - DEFAULT_WINDOW_MINUTES * 60 * 1000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return { from: new Date(end.getTime() - DEFAULT_WINDOW_MINUTES * 60 * 1000), to: end, durationMinutes: DEFAULT_WINDOW_MINUTES };
  }
  return { from: start, to: end, durationMinutes: Math.max(1, (end - start) / 60000) };
}

function getTrafficLevel({ detectionCount, vehicleCount, durationMinutes }) {
  const scale = Math.max(1, (durationMinutes || 5) / 5);
  if (vehicleCount >= 30 * scale) return 'congested';
  if (vehicleCount >= 20 * scale) return 'high';
  if (vehicleCount >= 10 * scale) return 'moderate';
  return 'low';
}

async function getTrafficSnapshot(windowInput = {}, cameraIdentifier) {
  let { from, to } = windowInput;

  if (!to) {
    to = new Date();
  }

  const window = parseTrafficWindow({ from, to });

  // Cache short-lived live snapshots. The API can still serve historical data
  // from PostgreSQL, while repeated dashboard reads within the same 5-second
  // bucket avoid duplicate aggregation queries.
  const cacheBucket = Math.floor(window.to.getTime() / 5000);
  const cacheKey = `nagardrishti:traffic:snapshot:${cameraIdentifier || 'all'}:${cacheBucket}:${Math.round(window.durationMinutes * 10)}`;
  const cachedSnapshot = await getJson(cacheKey);
  if (cachedSnapshot) return cachedSnapshot;

  // Resolve camera identifier to internal ID if provided
  let resolvedCameraId = undefined;
  if (cameraIdentifier) {
    const cam = await prisma.camera.findFirst({
      where: {
        OR: [
          { id: cameraIdentifier },
          { cameraCode: cameraIdentifier },
          { name: { equals: cameraIdentifier, mode: 'insensitive' } }
        ]
      }
    });
    if (cam) {
      resolvedCameraId = cam.id;
    } else {
      // If not found, fallback to just passing it (will likely result in 0 traffic)
      resolvedCameraId = cameraIdentifier;
    }
  }

  const where = { timestamp: { gte: window.from, lte: window.to }, ...(resolvedCameraId ? { cameraId: resolvedCameraId } : {}) };

  const cameras = await prisma.camera.findMany({
    where: resolvedCameraId ? { id: resolvedCameraId } : undefined,
    include: { zone: { select: { name: true } }, road: { select: { name: true } } },
    orderBy: { cameraCode: 'asc' },
  });

  const windowCounts = await prisma.detection.groupBy({
    by: ['cameraId'],
    where,
    _count: { _all: true },
    _max: { timestamp: true },
  });

  const vehicleCameraPairs = await prisma.detection.groupBy({
    by: ['cameraId', 'vehicleId'],
    where,
    _count: { _all: true },
  });

  const countByCamera = new Map(windowCounts.map((item) => [item.cameraId, item._count._all]));
  const lastDetectionByCamera = new Map(windowCounts.map((item) => [item.cameraId, item._max.timestamp]));
  const uniqueVehiclesByCamera = new Map();
  for (const item of vehicleCameraPairs) {
    uniqueVehiclesByCamera.set(item.cameraId, (uniqueVehiclesByCamera.get(item.cameraId) || 0) + 1);
  }

  // Check live simulation engine if active
  const engine = global.simulationEngine;
  const simulationRunning = Boolean(engine?.running);
  const liveEngineVehiclesByCam = simulationRunning
    ? engine.getLiveCameraCounts()
    : new Map();
  const liveSimulationTime = simulationRunning ? engine.getState().simulationTime : null;

  const result = {
    from: window.from,
    to: window.to,
    durationMinutes: window.durationMinutes,
    cameras: cameras.map((camera) => {
      const windowDetectionCount = countByCamera.get(camera.id) || 0;
      const liveVehicles = liveEngineVehiclesByCam.get(camera.id) || 0;
      const vehiclesDetected = uniqueVehiclesByCamera.get(camera.id) || 0;
      // The simulation count represents currently tracked vehicles, not database detections.
      // Keep historical detectionCount separate so the API never relabels vehicles as detections.
      const detectionCount = windowDetectionCount;
      const lastDetectionTime = lastDetectionByCamera.get(camera.id) || camera.updatedAt;

      return {
        ...camera,
        vehicleCount: vehiclesDetected,
        vehiclesDetected,
        detectionCount,
        updatedAt: lastDetectionTime,
        trafficLevel: getTrafficLevel({ detectionCount: windowDetectionCount, vehicleCount: vehiclesDetected, durationMinutes: window.durationMinutes }),
        zone: camera.zone?.name || null,
        road: camera.road?.name || null,
      };
    }),
  };

  void setJson(cacheKey, result, 5);
  return result;
}

async function evaluateCongestionAlert(cameraId, timestamp = new Date()) {
  const from = new Date(new Date(timestamp).getTime() - DEFAULT_WINDOW_MINUTES * 60 * 1000);
  const snapshot = await getTrafficSnapshot({ from, to: timestamp }, cameraId);
  const camera = snapshot.cameras[0];
  const existingActiveAlert = await prisma.alert.findFirst({
    where: { type: 'CONGESTION', cameraId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });

  // Thresholds: 20 vehicles = HIGH, 30 vehicles = CRITICAL in the 5-minute window
  const vehicleCount = camera ? camera.vehicleCount : 0;
  
  // Hysteresis: Only resolve the alert if traffic drops significantly below the threshold (e.g. < 10)
  if (!camera || vehicleCount < 10) {
    if (existingActiveAlert) {
      const resolved = await prisma.alert.update({
        where: { id: existingActiveAlert.id },
        data: { status: 'RESOLVED', resolvedAt: new Date(timestamp) },
      });
      void publishRealtime('alert:changed', { action: 'resolved', alertId: resolved.id });
      return resolved;
    }
    return null;
  }

  // If no alert exists and we haven't hit the threshold yet, do nothing
  if (!existingActiveAlert && vehicleCount < 20) {
    return null;
  }

  const severity = vehicleCount >= 30 ? 'CRITICAL' : 'HIGH';
  const message = `Heavy traffic congestion detected at ${camera.name || camera.cameraCode} with ${vehicleCount} vehicles tracked in the last 5 minutes.`;
  
  if (existingActiveAlert) {
    // Only update if severity changed or to bump the timestamp
    const updated = await prisma.alert.update({
      where: { id: existingActiveAlert.id },
      data: { severity, message, createdAt: new Date(timestamp), resolvedAt: null },
    });
    void publishRealtime('alert:changed', { action: 'updated', alertId: updated.id });
    return updated;
  }
  const created = await prisma.alert.create({
    data: { type: 'CONGESTION', severity, cameraId, message, status: 'ACTIVE', createdAt: new Date(timestamp) },
  });
  void publishRealtime('alert:changed', { action: 'created', alertId: created.id });
  return created;
}

const calculateCongestionLevel = (vehicleCount, averageSpeed) => {
  if (vehicleCount === 0) return 'LOW';

  if (vehicleCount >= 30) return 'SEVERE';
  if (vehicleCount >= 20) return 'HIGH';
  if (vehicleCount >= 10) return 'MEDIUM';
  return 'LOW';
};

const getRoadTrafficData = async () => {
  const engine = global.simulationEngine;
  const state = engine && typeof engine.getState === 'function' ? engine.getState() : { vehicles: [] };
  const vehicles = state.vehicles || [];

  const roadStats = {};

  for (const v of vehicles) {
    if (!v.roadId) continue;

    if (!roadStats[v.roadId]) {
      roadStats[v.roadId] = { count: 0, totalSpeed: 0 };
    }

    roadStats[v.roadId].count++;
    roadStats[v.roadId].totalSpeed += v.speed || 0;
  }

  const trafficByRoad = [];

  for (const roadId of Object.keys(roadStats)) {
    const stats = roadStats[roadId];
    const avgSpeed = stats.count > 0 ? stats.totalSpeed / stats.count : 0;

    trafficByRoad.push({
      roadId,
      vehicleCount: stats.count,
      averageSpeed: Math.round(avgSpeed),
      congestionLevel: calculateCongestionLevel(stats.count, avgSpeed),
      timestamp: state.simulationTime || new Date(),
    });
  }

  return trafficByRoad;
};

const getRoadTraffic = async (roadId) => {
  const traffic = await getRoadTrafficData();
  return traffic.find(t => t.roadId === roadId) || {
    roadId,
    vehicleCount: 0,
    averageSpeed: 0,
    congestionLevel: 'LOW',
    timestamp: new Date(),
  };
};

const getTrafficSummary = async () => {
  const traffic = await getRoadTrafficData();

  const summary = {
    totalRoads: traffic.length,
    lowCongestion: 0,
    mediumCongestion: 0,
    highCongestion: 0,
    severeCongestion: 0,
  };

  for (const t of traffic) {
    if (t.congestionLevel === 'LOW') summary.lowCongestion++;
    else if (t.congestionLevel === 'MEDIUM') summary.mediumCongestion++;
    else if (t.congestionLevel === 'HIGH') summary.highCongestion++;
    else if (t.congestionLevel === 'SEVERE') summary.severeCongestion++;
  }

  return summary;
};

module.exports = {
  parseTrafficWindow,
  getTrafficLevel,
  getTrafficSnapshot,
  evaluateCongestionAlert,
  getRoadTrafficData,
  getRoadTraffic,
  getTrafficSummary,
};
