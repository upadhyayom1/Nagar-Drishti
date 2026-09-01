const { prisma } = require('../../lib/prisma');
const { getRoadTrafficData } = require('../traffic/traffic.service');

function getAnalyticsWindow(query = {}) {
  const now = new Date();
  const from = query.from ? new Date(query.from) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const to = query.to ? new Date(query.to) : now;
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return null;
  return { from, to };
}

const round = (value, digits = 1) => {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

exports.getOverview = async (req, res) => {
  try {
    const window = getAnalyticsWindow(req.query);
    if (!window) return res.status(400).json({ success: false, message: 'Invalid analytics date range' });
    const [totalDetectionsCount, uniqueVehicleRows, activeCameras, activeAlerts, incidentsToday, speedStats] = await Promise.all([
      prisma.detection.count({ where: { timestamp: { gte: window.from, lte: window.to } } }),
      prisma.detection.findMany({
        where: { timestamp: { gte: window.from, lte: window.to } },
        distinct: ['vehicleId'],
        select: { vehicleId: true },
      }),
      prisma.camera.count({ where: { status: 'ONLINE' } }),
      prisma.alert.count({ where: { status: 'ACTIVE' } }),
      prisma.incident.count({ where: { timestamp: { gte: window.from, lte: window.to } } }),
      prisma.cameraTransition.aggregate({
        where: { timestamp: { gte: window.from, lte: window.to }, averageSpeed: { gt: 0 } },
        _avg: { averageSpeed: true },
      }),
    ]);

    // This is deliberately a normalized observation index, not a physical road-capacity claim.
    const durationHours = Math.max((window.to - window.from) / 3600000, 1 / 60);
    const hourlyUniqueVehicleRate = (uniqueVehicleRows.length * 60) / (durationHours * 60);
    const congestionIndex = Math.min(100, Math.round((hourlyUniqueVehicleRate / Math.max(activeCameras, 1)) * 10));

    const engine = global.simulationEngine;
    const running = Boolean(engine?.running);
    const activeVehiclesCount = running ? engine.vehicles.filter(v => v.state !== 'RESTING').length : 0;

    res.status(200).json({
      totalVehiclesToday: uniqueVehicleRows.length,
      activeVehicles: activeVehiclesCount,
      detectionCount: totalDetectionsCount,
      avgSpeed: round(speedStats._avg.averageSpeed),
      activeCameras,
      activeAlerts,
      congestionIndex,
      incidentsToday,
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getHourly = async (req, res) => {
  try {
    const window = getAnalyticsWindow(req.query);
    if (!window) return res.status(400).json({ success: false, message: 'Invalid analytics date range' });
    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        EXTRACT(HOUR FROM (d."timestamp" AT TIME ZONE 'Asia/Kolkata'))::int AS hour,
        COUNT(*)::int AS "detectionCount",
        COUNT(DISTINCT d."vehicleId")::int AS "uniqueVehicleCount",
        AVG(CASE WHEN v."speed" > 0 THEN v."speed" END) AS "avgSpeed"
      FROM "Detection" d
      LEFT JOIN "Vehicle" v ON v.id = d."vehicleId"
      WHERE d."timestamp" >= $1 AND d."timestamp" <= $2
      GROUP BY 1
      ORDER BY 1
    `, window.from, window.to);
    const byHour = new Map(rows.map((row) => [Number(row.hour), row]));
    res.status(200).json(Array.from({ length: 24 }, (_, hour) => {
      const row = byHour.get(hour);
      return {
        hour: `${String(hour).padStart(2, '0')}:00`,
        vehicles: row ? Number(row.uniqueVehicleCount) : 0,
        uniqueVehicleCount: row ? Number(row.uniqueVehicleCount) : 0,
        detectionCount: row ? Number(row.detectionCount) : 0,
        avgSpeed: row?.avgSpeed != null ? round(Number(row.avgSpeed)) : null,
      };
    }));
  } catch (error) {
    console.error('Error fetching hourly analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCameras = async (req, res) => {
  try {
    const window = getAnalyticsWindow(req.query);
    if (!window) return res.status(400).json({ success: false, message: 'Invalid analytics date range' });
    const [cameras, rows] = await Promise.all([
      prisma.camera.findMany(),
      prisma.$queryRawUnsafe(`
        SELECT d."cameraId" AS "cameraId",
               COUNT(*)::int AS "detectionCount",
               COUNT(DISTINCT d."vehicleId")::int AS "vehicleCount",
               AVG(CASE WHEN v."speed" > 0 THEN v."speed" END) AS "avgSpeed"
        FROM "Detection" d
        LEFT JOIN "Vehicle" v ON v.id = d."vehicleId"
        WHERE d."timestamp" >= $1 AND d."timestamp" <= $2
        GROUP BY d."cameraId"
      `, window.from, window.to),
    ]);
    const metrics = new Map(rows.map((r) => [r.cameraId, r]));

    const mapped = cameras.map((camera) => {
      const metric = metrics.get(camera.id);
      const vehicleCount = Number(metric?.vehicleCount || 0);
      const detectionCount = Number(metric?.detectionCount || 0);
      return {
        cameraId: camera.id,
        cameraName: camera.name || camera.cameraCode || camera.id,
        vehicleCount,
        detectionCount,
        avgSpeed: metric?.avgSpeed != null ? round(Number(metric.avgSpeed)) : null,
        congestionLevel: vehicleCount >= 30 ? 'congested' : vehicleCount >= 20 ? 'high' : vehicleCount >= 10 ? 'moderate' : 'low',
      };
    });
    res.status(200).json(mapped);
  } catch (error) {
    console.error('Error fetching camera analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getBusiestRoads = async (req, res) => {
  try {
    const window = getAnalyticsWindow(req.query);
    if (!window) return res.status(400).json({ success: false, message: 'Invalid analytics date range' });
    const roads = await prisma.road.findMany({ select: { id: true, name: true, cameras: { select: { id: true } } } });
    
    const rows = await prisma.$queryRawUnsafe(`
      SELECT c."roadId" AS "roadId",
             COUNT(*)::int AS "detectionCount",
             COUNT(DISTINCT d."vehicleId")::int AS "vehicleCount",
             AVG(CASE WHEN v."speed" > 0 THEN v."speed" END) AS "avgSpeed"
      FROM "Detection" d
      INNER JOIN "Camera" c ON c.id = d."cameraId"
      WHERE d."timestamp" >= $1 AND d."timestamp" <= $2
        AND c."roadId" IS NOT NULL
      GROUP BY c."roadId"
    `, window.from, window.to);
    const byRoad = new Map(rows.map((r) => [r.roadId, r]));
    const mapped = roads.map((road) => {
      const metric = byRoad.get(road.id);
      
      const vehicleCount = Number(metric?.vehicleCount || 0);
      const detectionCount = Number(metric?.detectionCount || 0);
      const avgSpeed = metric?.avgSpeed != null ? round(Number(metric.avgSpeed)) : null;

      const congestionLevel = vehicleCount >= 30 ? 'congested' : vehicleCount >= 20 ? 'high' : vehicleCount >= 10 ? 'moderate' : 'low';

      return {
        id: road.id,
        name: road.name,
        vehicleCount,
        detectionCount,
        avgSpeed,
        congestionLevel,
      };
    }).sort((a, b) => b.vehicleCount - a.vehicleCount).slice(0, 10);
    res.status(200).json(mapped);
  } catch (error) {
    console.error('Error fetching busiest roads:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getNetwork = async (req, res) => {
  try {
    const window = getAnalyticsWindow(req.query);
    if (!window) return res.status(400).json({ success: false, message: 'Invalid analytics date range' });
    const [cameras, rows, uniqueVehicles] = await Promise.all([
      prisma.camera.findMany({ select: { id: true, name: true, cameraCode: true } }),
      prisma.$queryRawUnsafe(`
        SELECT "sourceCameraId", "destinationCameraId",
               COUNT(*)::int AS "transitionCount",
               COUNT(DISTINCT "vehicleId")::int AS "uniqueVehicleCount",
               AVG("travelTimeSeconds") AS "averageTravelSeconds",
               AVG("averageSpeed") AS "averageSpeed"
        FROM "CameraTransition"
        WHERE "timestamp" >= $1 AND "timestamp" <= $2
          AND "sourceCameraId" <> "destinationCameraId"
        GROUP BY "sourceCameraId", "destinationCameraId"
        ORDER BY COUNT(*) DESC
      `, window.from, window.to),
      prisma.cameraTransition.findMany({ where: { timestamp: { gte: window.from, lte: window.to } }, distinct: ['vehicleId'], select: { vehicleId: true } }),
    ]);
    const cameraMap = new Map(cameras.map((camera) => [camera.id, camera]));
    const corridors = rows.map((row) => {
      const origin = cameraMap.get(row.sourceCameraId);
      const destination = cameraMap.get(row.destinationCameraId);
      if (!origin || !destination) return null;
      return {
        origin: { id: origin.id, name: origin.name || 'Unknown', code: origin.cameraCode || 'UNKNOWN' },
        destination: { id: destination.id, name: destination.name || 'Unknown', code: destination.cameraCode || 'UNKNOWN' },
        volume: Number(row.transitionCount),
        uniqueVehicleCount: Number(row.uniqueVehicleCount),
        averageTravelSeconds: row.averageTravelSeconds != null ? Math.round(Number(row.averageTravelSeconds)) : null,
        averageSpeed: row.averageSpeed != null ? Math.round(Number(row.averageSpeed)) : null,
      };
    }).filter(Boolean);
    const totalTransitions = corridors.reduce((sum, c) => sum + c.volume, 0);
    const weightedTravel = corridors.reduce((sum, c) => sum + (c.averageTravelSeconds || 0) * c.volume, 0);
    res.json({
      corridors,
      summary: {
        corridorCount: corridors.length,
        averageTravelSeconds: totalTransitions ? Math.round(weightedTravel / totalTransitions) : null,
        peakVolume: corridors[0]?.volume || 0,
        transitionCount: totalTransitions,
        uniqueVehicleCount: uniqueVehicles.length,
      },
    });
  } catch (error) {
    console.error('Error fetching network analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAnomalies = async (req, res) => {
  try {
    const anomalies = await prisma.anomalyEvent.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: { vehicle: { select: { plateNumber: true } }, camera: { select: { name: true, cameraCode: true } } },
    });
    res.json(anomalies.map((anomaly) => `${anomaly.type.replaceAll('_', ' ')}: ${anomaly.vehicle.plateNumber} at ${anomaly.camera.name || anomaly.camera.cameraCode}`));
  } catch (error) { console.error('Error fetching anomalies:', error); res.status(500).json({ success: false, message: 'Server error' }); }
};

exports.getSystemHealth = async (req, res) => {
  try {
    const [cameras, activeAlerts] = await Promise.all([
      prisma.camera.findMany({
        include: {
          zone: { select: { name: true } },
          cameraHealth: { orderBy: { recordedAt: 'desc' }, take: 1 },
        },
        orderBy: { cameraCode: 'asc' },
      }),
      prisma.alert.count({ where: { status: 'ACTIVE' } }),
    ]);

    const nodes = cameras.map((camera) => {
      const health = camera.cameraHealth[0];
      const status = health?.status || camera.status;
      return {
        id: camera.id,
        cameraCode: camera.cameraCode,
        name: camera.name,
        zone: camera.zone?.name || 'Unassigned',
        status,
        responseMs: health?.responseMs ?? null,
        lastUpdated: health?.recordedAt || camera.updatedAt,
      };
    });
    const online = nodes.filter((node) => node.status === 'ONLINE').length;
    const warning = nodes.filter((node) => node.status === 'MAINTENANCE').length;
    const offline = nodes.filter((node) => node.status === 'OFFLINE').length;

    res.status(200).json({
      summary: { total: nodes.length, online, warning, offline, activeAlerts },
      nodes,
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
