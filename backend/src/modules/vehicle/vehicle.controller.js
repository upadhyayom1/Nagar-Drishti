
const { prisma } = require('../../lib/prisma');
const { getVehicleProfile } = require('./vehicle.intelligence.service');

const normalizePlate = (plate) => String(plate || '').trim().toUpperCase().replace(/\s+/g, '');
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
    const { plateNumber } = req.params;

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
    const profile = await getVehicleProfile(req.params.plateNumber);
    if (!profile) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    const waypoints = profile.history.map((detection) => ({
      cameraId: detection.cameraId,
      cameraName: detection.cameraName,
      lat: detection.latitude,
      lng: detection.longitude,
      timestamp: detection.timestamp,
      speed: 0,
      direction: detection.direction || 'UNKNOWN',
    })).filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
    const first = waypoints[0]?.timestamp;
    const last = waypoints.at(-1)?.timestamp;
    const totalDuration = first && last ? Math.max(0, Math.round((new Date(last) - new Date(first)) / 60000)) : 0;
    return res.json({ success: true, data: {
      plate: profile.vehicle.plateNumber,
      waypoints,
      totalDistance: 0,
      totalDuration,
      avgSpeed: 0,
    }});
  } catch (error) { next(error); }
};
