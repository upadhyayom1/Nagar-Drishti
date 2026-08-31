const { prisma } = require('../../lib/prisma');

const DEFAULT_WINDOW_MINUTES = 60;

function parseTrafficWindow({ from, to } = {}) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - DEFAULT_WINDOW_MINUTES * 60 * 1000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return { from: new Date(end.getTime() - DEFAULT_WINDOW_MINUTES * 60 * 1000), to: end, durationMinutes: DEFAULT_WINDOW_MINUTES };
  }
  return { from: start, to: end, durationMinutes: Math.max(1, (end - start) / 60000) };
}

function getTrafficLevel({ detectionCount, vehicleCount, durationMinutes }) {
  const hourlyVehicleRate = (vehicleCount * 60) / durationMinutes;
  
  if (hourlyVehicleRate >= 80) return 'congested';
  if (hourlyVehicleRate >= 35) return 'high';
  if (hourlyVehicleRate >= 12) return 'moderate';
  return 'low';
}

async function getTrafficSnapshot(windowInput = {}, cameraId) {
  let { from, to } = windowInput;

  if (!to) {
    to = new Date();
  }

  const window = parseTrafficWindow({ from, to });
  const where = { timestamp: { gte: window.from, lte: window.to }, ...(cameraId ? { cameraId } : {}) };
  
  const [cameras, windowCounts, vehicleCameraPairs] = await Promise.all([
    prisma.camera.findMany({
      where: cameraId ? { id: cameraId } : undefined,
      include: { zone: { select: { name: true } }, road: { select: { name: true } } },
      orderBy: { cameraCode: 'asc' },
    }),
    prisma.detection.groupBy({
      by: ['cameraId'],
      where,
      _count: { _all: true },
      _max: { timestamp: true },
    }),
    prisma.detection.groupBy({
      by: ['cameraId', 'vehicleId'],
      where,
      _count: { _all: true },
    }),
  ]);
  
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

  return {
    from: window.from,
    to: window.to,
    durationMinutes: window.durationMinutes,
    cameras: cameras.map((camera) => {
      const windowDetectionCount = countByCamera.get(camera.id) || 0;
      const liveVehicles = liveEngineVehiclesByCam.get(camera.id) || 0;
      const vehiclesDetected = simulationRunning ? liveVehicles : (uniqueVehiclesByCamera.get(camera.id) || 0);
      const detectionCount = simulationRunning ? liveVehicles : windowDetectionCount;
      const lastDetectionTime = simulationRunning
        ? (liveVehicles > 0 ? liveSimulationTime : camera.updatedAt)
        : (lastDetectionByCamera.get(camera.id) || camera.updatedAt);

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
}

async function evaluateCongestionAlert(cameraId, timestamp = new Date()) {
  const from = new Date(new Date(timestamp).getTime() - DEFAULT_WINDOW_MINUTES * 60 * 1000);
  const snapshot = await getTrafficSnapshot({ from, to: timestamp }, cameraId);
  const camera = snapshot.cameras[0];
  const existingActiveAlert = await prisma.alert.findFirst({
    where: { type: 'CONGESTION', cameraId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });

  if (!camera || !['high', 'congested'].includes(camera.trafficLevel)) {
    if (existingActiveAlert) {
      return prisma.alert.update({
        where: { id: existingActiveAlert.id },
        data: { status: 'RESOLVED', resolvedAt: new Date(timestamp) },
      });
    }
    return null;
  }

  const severity = camera.trafficLevel === 'congested' ? 'CRITICAL' : 'HIGH';
  const message = `Heavy traffic congestion detected at ${camera.name || camera.cameraCode} with ${camera.vehiclesDetected || camera.vehicleCount} vehicles tracked in the selected window.`;
  if (existingActiveAlert) {
    return prisma.alert.update({
      where: { id: existingActiveAlert.id },
      data: { severity, message, createdAt: new Date(timestamp), resolvedAt: null },
    });
  }
  return prisma.alert.create({
    data: { type: 'CONGESTION', severity, cameraId, message, status: 'ACTIVE', createdAt: new Date(timestamp) },
  });
}

const calculateCongestionLevel = (vehicleCount, averageSpeed) => {
  if (vehicleCount === 0) return 'LOW';
  
  if (vehicleCount > 10 && averageSpeed < 15) return 'SEVERE';
  if (vehicleCount > 5 && averageSpeed < 30) return 'HIGH';
  if (vehicleCount > 2 && averageSpeed < 45) return 'MEDIUM';
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
