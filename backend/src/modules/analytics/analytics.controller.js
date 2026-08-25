const { prisma } = require('../../lib/prisma');

exports.getOverview = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [detections, activeCameras, activeAlerts] = await Promise.all([
      prisma.detection.findMany({ where: { timestamp: { gte: today } }, select: { vehicleId: true, vehicle: { select: { speed: true } } } }),
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
      incidentsToday: await prisma.vehicleIncident.count({ where: { timestamp: { gte: today } } })
    };

    res.status(200).json(overview);
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getHourly = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const detections = await prisma.detection.findMany({ where: { timestamp: { gte: start } }, select: { timestamp: true, vehicle: { select: { speed: true } } } });
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
    const cameras = await prisma.camera.findMany({ include: { _count: { select: { detections: true } } } });
    const mapped = cameras.map(c => ({
      cameraId: c.id,
      cameraName: c.name || c.cameraCode || c.id,
      vehicleCount: c._count.detections,
      avgSpeed: 0,
      congestionLevel: c._count.detections > 100 ? 'high' : c._count.detections > 30 ? 'moderate' : 'low'
    }));

    res.status(200).json(mapped);
  } catch (error) {
    console.error('Error fetching camera analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getBusiestRoads = async (req, res) => {
  try {
    const roads = await prisma.road.findMany({ include: { cameras: { include: { _count: { select: { detections: true } } } } } });
    const mapped = roads.map((road) => {
      const vehicleCount = road.cameras.reduce((total, camera) => total + camera._count.detections, 0);
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
    const corridors = [...groups.values()].map((item) => ({
      origin: { id: item.origin.id, name: item.origin.name, code: item.origin.cameraCode },
      destination: { id: item.destination.id, name: item.destination.name, code: item.destination.cameraCode },
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
