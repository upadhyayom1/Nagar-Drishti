const { prisma } = require('../../lib/prisma');

function getAnalyticsWindow(query = {}) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const from = query.from ? new Date(query.from) : startOfToday;
  const to = query.to ? new Date(query.to) : now;

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return null;
  }

  return { from, to };
}

exports.getOverview = async (req, res) => {
  try {
    const window = getAnalyticsWindow(req.query);
    if (!window) return res.status(400).json({ success: false, message: 'Invalid analytics date range' });
    const [detections, activeCameras, activeAlerts] = await Promise.all([
      prisma.detection.findMany({ where: { timestamp: { gte: window.from, lte: window.to } }, select: { vehicleId: true, vehicle: { select: { speed: true } } } }),
      prisma.camera.count({ where: { status: 'ONLINE' } }),
      prisma.alert.count({ where: { status: 'ACTIVE' } }),
    ]);
    const speeds = detections.map((d) => d.vehicle.speed).filter(Number.isFinite);

    const overview = {
      totalVehiclesToday: new Set(detections.map((d) => d.vehicleId)).size,
      avgSpeed: speeds.length ? Math.round(speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length) : 0,
      activeCameras,
      activeAlerts,
      congestionIndex: activeCameras ? Math.round((detections.length / activeCameras) * 10) : 0,
      incidentsToday: await prisma.vehicleIncident.count({ where: { timestamp: { gte: window.from, lte: window.to } } })
    };

    res.status(200).json(overview);
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getHourly = async (req, res) => {
  try {
    const window = getAnalyticsWindow(req.query);
    if (!window) return res.status(400).json({ success: false, message: 'Invalid analytics date range' });
    const detections = await prisma.detection.findMany({ where: { timestamp: { gte: window.from, lte: window.to } }, select: { timestamp: true, vehicle: { select: { speed: true } } } });
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour: `${String(hour).padStart(2, '0')}:00`, vehicles: 0, speeds: [] }));
    detections.forEach((d) => { const bucket = buckets[d.timestamp.getHours()]; bucket.vehicles += 1; if (Number.isFinite(d.vehicle.speed)) bucket.speeds.push(d.vehicle.speed); });
    const hourly = buckets.map(({ hour, vehicles, speeds }) => ({ hour, vehicles, avgSpeed: speeds.length ? Math.round(speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length) : 0 }));
    res.status(200).json(hourly);
  } catch (error) {
    console.error('Error fetching hourly analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCameras = async (req, res) => {
  try {
    const window = getAnalyticsWindow(req.query);
    if (!window) return res.status(400).json({ success: false, message: 'Invalid analytics date range' });
    const [cameras, detectionCounts, detectedVehicles] = await Promise.all([
      prisma.camera.findMany(),
      prisma.detection.groupBy({ by: ['cameraId'], where: { timestamp: { gte: window.from, lte: window.to } }, _count: { _all: true } }),
      prisma.detection.findMany({ where: { timestamp: { gte: window.from, lte: window.to } }, distinct: ['cameraId', 'vehicleId'], select: { cameraId: true } }),
    ]);
    const countByCamera = new Map(detectionCounts.map((item) => [item.cameraId, item._count._all]));
    const uniqueByCamera = new Map();
    detectedVehicles.forEach(({ cameraId }) => uniqueByCamera.set(cameraId, (uniqueByCamera.get(cameraId) || 0) + 1));
    const mapped = cameras.map(c => ({
      cameraId: c.id,
      cameraName: c.name || c.cameraCode || c.id,
      vehicleCount: uniqueByCamera.get(c.id) || 0,
      detectionCount: countByCamera.get(c.id) || 0,
      avgSpeed: 0,
      congestionLevel: (countByCamera.get(c.id) || 0) > 100 ? 'high' : (countByCamera.get(c.id) || 0) > 30 ? 'moderate' : 'low'
    }));

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
    const [roads, cameraCounts] = await Promise.all([
      prisma.road.findMany({ include: { cameras: { select: { id: true } } } }),
      prisma.detection.groupBy({ by: ['cameraId'], where: { timestamp: { gte: window.from, lte: window.to } }, _count: { _all: true } }),
    ]);
    const countByCamera = new Map(cameraCounts.map((item) => [item.cameraId, item._count._all]));
    const mapped = roads.map((road) => {
      const vehicleCount = road.cameras.reduce((total, camera) => total + (countByCamera.get(camera.id) || 0), 0);
      return { id: road.id, name: road.name, vehicleCount, avgSpeed: 0, congestionLevel: vehicleCount > 100 ? 'congested' : vehicleCount > 30 ? 'high' : 'low' };
    }).sort((a, b) => b.vehicleCount - a.vehicleCount).slice(0, 10);
    res.status(200).json(mapped);
  } catch (error) {
    console.error('Error fetching busiest roads:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getNetwork = async (req, res) => {
  try {
    const transitions = await prisma.cameraTransition.findMany({
      include: { sourceCamera: true, destinationCamera: true },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });
    const groups = new Map();
    transitions.forEach((transition) => {
      const key = `${transition.sourceCameraId}:${transition.destinationCameraId}`;
      const item = groups.get(key) || { origin: transition.sourceCamera, destination: transition.destinationCamera, volume: 0, travelTimes: [], speeds: [] };
      item.volume += 1;
      if (Number.isFinite(transition.travelTimeSeconds)) item.travelTimes.push(transition.travelTimeSeconds);
      if (Number.isFinite(transition.averageSpeed)) item.speeds.push(transition.averageSpeed);
      groups.set(key, item);
    });
    const corridors = [...groups.values()]
      .filter((item) => item.origin && item.destination)
      .map((item) => ({
      origin: { id: item.origin.id, name: item.origin.name || 'Unknown', code: item.origin.cameraCode || 'UNKNOWN' },
      destination: { id: item.destination.id, name: item.destination.name || 'Unknown', code: item.destination.cameraCode || 'UNKNOWN' },
      volume: item.volume,
      averageTravelSeconds: item.travelTimes.length ? Math.round(item.travelTimes.reduce((a, b) => a + b, 0) / item.travelTimes.length) : 0,
      averageSpeed: item.speeds.length ? Math.round(item.speeds.reduce((a, b) => a + b, 0) / item.speeds.length) : 0,
    })).sort((a, b) => b.volume - a.volume);
    res.json({ corridors, summary: { corridorCount: corridors.length, averageTravelSeconds: corridors.length ? Math.round(corridors.reduce((sum, c) => sum + c.averageTravelSeconds, 0) / corridors.length) : 0, peakVolume: corridors[0]?.volume || 0 } });
  } catch (error) { console.error('Error fetching network analytics:', error); res.status(500).json({ success: false, message: 'Server error' }); }
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
