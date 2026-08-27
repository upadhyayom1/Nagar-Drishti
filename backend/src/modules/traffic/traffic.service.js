const { prisma } = require('../../lib/prisma');

const DEFAULT_WINDOW_MINUTES = 15;

function parseTrafficWindow({ from, to } = {}) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - DEFAULT_WINDOW_MINUTES * 60 * 1000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    const error = new Error('Provide a valid time window where from is earlier than to');
    error.statusCode = 400;
    throw error;
  }
  return { from: start, to: end, durationMinutes: Math.max(1, (end - start) / 60000) };
}

function getTrafficLevel({ detectionCount, vehicleCount, durationMinutes }) {
  const hourlyVehicleRate = (vehicleCount * 60) / durationMinutes;
  const hourlyDetectionRate = (detectionCount * 60) / durationMinutes;
  
  // Adjusted for realistic city traffic volumes
  if (hourlyVehicleRate >= 1200 || hourlyDetectionRate >= 2400) return 'congested';
  if (hourlyVehicleRate >= 600 || hourlyDetectionRate >= 1200) return 'high';
  if (hourlyVehicleRate >= 200 || hourlyDetectionRate >= 400) return 'moderate';
  return 'low';
}

async function getTrafficSnapshot(windowInput = {}, cameraId) {
  let { from, to } = windowInput;

  // If 'to' is not provided, use the timestamp of the latest detection in the database
  // This ensures the dashboard always shows the "current time" of the simulation
  if (!to) {
    const latest = await prisma.detection.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true }
    });
    to = latest ? latest.timestamp : new Date();
  }

  const window = parseTrafficWindow({ from, to });
  const where = { timestamp: { gte: window.from, lte: window.to }, ...(cameraId ? { cameraId } : {}) };
  
  const [cameras, counts, uniqueVehiclePairs] = await Promise.all([
    prisma.camera.findMany({
      where: cameraId ? { id: cameraId } : undefined,
      include: { zone: { select: { name: true } } },
      orderBy: { cameraCode: 'asc' },
    }),
    prisma.detection.groupBy({ by: ['cameraId'], where, _count: { _all: true } }),
    prisma.detection.findMany({ where, distinct: ['cameraId', 'vehicleId'], select: { cameraId: true, vehicleId: true } }),
  ]);
  
  const countByCamera = new Map(counts.map((item) => [item.cameraId, item._count._all]));
  const uniqueByCamera = new Map();
  uniqueVehiclePairs.forEach(({ cameraId: id }) => uniqueByCamera.set(id, (uniqueByCamera.get(id) || 0) + 1));

  return {
    from: window.from,
    to: window.to,
    durationMinutes: window.durationMinutes,
    cameras: cameras.map((camera) => {
      const detectionCount = countByCamera.get(camera.id) || 0;
      const vehicleCount = uniqueByCamera.get(camera.id) || 0;
      return {
        ...camera,
        vehicleCount,
        detectionCount,
        trafficLevel: getTrafficLevel({ detectionCount, vehicleCount, durationMinutes: window.durationMinutes }),
        zone: camera.zone?.name || null,
      };
    }),
  };
}

async function evaluateCongestionAlert(cameraId, timestamp = new Date()) {
  const from = new Date(new Date(timestamp).getTime() - DEFAULT_WINDOW_MINUTES * 60 * 1000);
  const snapshot = await getTrafficSnapshot({ from, to: timestamp }, cameraId);
  const camera = snapshot.cameras[0];
  if (!camera || !['high', 'congested'].includes(camera.trafficLevel)) return null;

  const severity = camera.trafficLevel === 'congested' ? 'CRITICAL' : 'HIGH';
  const recentAlert = await prisma.alert.findFirst({
    where: { type: 'CONGESTION', cameraId, status: 'ACTIVE', createdAt: { gte: from } },
    orderBy: { createdAt: 'desc' },
  });
  const message = `${camera.vehicleCount} unique vehicles and ${camera.detectionCount} detections recorded at ${camera.name} in the last ${DEFAULT_WINDOW_MINUTES} minutes.`;
  if (recentAlert) return prisma.alert.update({ where: { id: recentAlert.id }, data: { severity, message } });
  return prisma.alert.create({ data: { type: 'CONGESTION', severity, cameraId, message } });
}

const simulationEngine = require('../simulation/engine');

const calculateCongestionLevel = (vehicleCount, averageSpeed) => {
  if (vehicleCount === 0) return 'LOW';
  
  if (vehicleCount > 10 && averageSpeed < 15) return 'SEVERE';
  if (vehicleCount > 5 && averageSpeed < 30) return 'HIGH';
  if (vehicleCount > 2 && averageSpeed < 45) return 'MEDIUM';
  return 'LOW';
};

const getRoadTrafficData = async () => {
  const state = simulationEngine.getState();
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
