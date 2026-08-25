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
  if (hourlyVehicleRate >= 120 || hourlyDetectionRate >= 240) return 'congested';
  if (hourlyVehicleRate >= 60 || hourlyDetectionRate >= 120) return 'high';
  if (hourlyVehicleRate >= 20 || hourlyDetectionRate >= 40) return 'moderate';
  return 'low';
}

async function getTrafficSnapshot(windowInput = {}, cameraId) {
  const window = parseTrafficWindow(windowInput);
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

module.exports = { parseTrafficWindow, getTrafficLevel, getTrafficSnapshot, evaluateCongestionAlert };
