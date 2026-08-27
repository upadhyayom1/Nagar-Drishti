
const turf = require('@turf/turf');
const { prisma } = require('../../lib/prisma');

const normalizePlate = (plate) => String(plate || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
const toVehicleSummary = (vehicle) => ({
  plate: vehicle.plateNumber,
  vehicleType: vehicle.vehicleType || 'UNKNOWN',
  color: vehicle.color || 'Unknown',
  firstSeen: vehicle.firstSeen,
  lastSeen: vehicle.lastSeen,
  totalDetections: vehicle._count?.detections || 0,
  camerasVisited: new Set(vehicle.detections?.map((detection) => detection.cameraId) || []).size,
  status: vehicle.status === 'BLACKLISTED' ? 'blacklist' : 'normal',
});

exports.getVehicles = async (req, res) => {
  try {
    const { limit = '100' } = req.query;
    const vehicles = await prisma.vehicle.findMany({
      take: Math.min(Math.max(Number(limit) || 100, 1), 100),
      orderBy: { lastSeen: 'desc' },
      include: { _count: { select: { detections: true } }, detections: { select: { cameraId: true } } },
    });
    res.status(200).json({ success: true, data: vehicles.map(toVehicleSummary) });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ success: false, message: 'Server error fetching vehicles' });
  }
};

exports.getVehicle = async (req, res) => {
  try {
    const plateNumber = normalizePlate(req.params.plateNumber);
    const vehicle = await prisma.vehicle.findUnique({
      where: { plateNumber },
      include: { _count: { select: { detections: true } }, detections: { select: { cameraId: true } } },
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.status(200).json({ success: true, data: toVehicleSummary(vehicle) });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

exports.searchVehicle = async function searchVehicle(req, res, next) {
  try {
    const plateNumber = req.params.plateNumber || req.query.q || req.query.query;

    if (!plateNumber) {
      return res.status(400).json({
        success: false,
        message: 'Plate number is required'
      });
    }

    const normalized = normalizePlate(plateNumber);
    const vehicles = await prisma.vehicle.findMany({
      where: { plateNumber: { contains: normalized, mode: 'insensitive' } },
      take: 50,
      orderBy: { lastSeen: 'desc' },
      include: { _count: { select: { detections: true } }, detections: { select: { cameraId: true } } },
    });
    return res.status(200).json({ success: true, data: vehicles.map(toVehicleSummary) });
  } catch (error) {
    next(error);
  }
}

exports.getRecentVehicles = async (req, res, next) => {
  req.query.limit = req.query.limit || '8';
  return exports.getVehicles(req, res, next);
};

exports.getVehicleJourney = async (req, res, next) => {
  try {
    const plateNumber = normalizePlate(req.params.plateNumber);
    const vehicle = await prisma.vehicle.findUnique({
      where: { plateNumber },
      select: { id: true, plateNumber: true },
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const detections = await prisma.detection.findMany({
      where: { vehicleId: vehicle.id },
      orderBy: { timestamp: 'asc' },
      include: { camera: { select: { id: true, name: true, cameraCode: true, latitude: true, longitude: true } } },
    });
    const waypoints = detections.map((detection) => ({
      cameraId: detection.cameraId,
      cameraCode: detection.camera?.cameraCode || 'CAM',
      cameraName: detection.camera?.name || detection.camera?.cameraCode || 'Prayagraj Optical Node',
      lat: detection.latitude ?? detection.camera?.latitude,
      lng: detection.longitude ?? detection.camera?.longitude,
      timestamp: detection.timestamp,
      speed: 35,
      direction: detection.direction || 'EASTBOUND',
    })).filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

    let totalDistance = 0;
    for (let index = 1; index < waypoints.length; index++) {
      const previous = waypoints[index - 1];
      const current = waypoints[index];
      const distance = turf.distance([previous.lng, previous.lat], [current.lng, current.lat], { units: 'kilometers' });
      const durationHours = Math.max(0, (new Date(current.timestamp) - new Date(previous.timestamp)) / 3600000);
      totalDistance += distance;
      current.speed = durationHours ? Math.round((distance / durationHours) * 10) / 10 : 0;
    }
    const first = waypoints[0]?.timestamp;
    const last = waypoints.at(-1)?.timestamp;
    const totalDuration = first && last ? Math.max(0, Math.round((new Date(last) - new Date(first)) / 60000)) : 0;
    return res.json({ success: true, data: {
      plate: vehicle.plateNumber,
      waypoints,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalDuration,
      avgSpeed: totalDuration ? Math.round((totalDistance / (totalDuration / 60)) * 10) / 10 : 0,
    }});
  } catch (error) { next(error); }
};
