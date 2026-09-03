
const { prisma } = require('../../lib/prisma');
const { buildVehicleTrajectory } = require('../trajectory/trajectory.service');

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
      include: { _count: { select: { detections: true } }, detections: { select: { cameraId: true }, take: 10 } },
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
      include: { _count: { select: { detections: true } }, detections: { select: { cameraId: true }, take: 25 } },
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.status(200).json({ success: true, data: toVehicleSummary(vehicle) });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

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

// Trajectory reconstruction itself lives in trajectory.service.js — this is the
// only place that adapts the canonical { points, segments } shape to the
// vehicle-history API response. Do not recompute distance/time/speed here.
exports.getVehicleJourney = async (req, res, next) => {
  try {
    const plateNumber = normalizePlate(req.params.plateNumber);
    const vehicle = await prisma.vehicle.findUnique({
      where: { plateNumber },
      select: { id: true, plateNumber: true },
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const { from, to } = req.query;
    const { points, segments } = await buildVehicleTrajectory(vehicle.id, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });

    // segmentInto[i] is the segment that arrives at points[i] (i.e. segments[i-1]).
    const segmentInto = [null, ...segments];

    const waypoints = points
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
      .map((point, index) => {
        const segment = segmentInto[index];
        return {
          cameraId: point.cameraId,
          cameraCode: point.cameraCode || 'CAM',
          cameraName: point.cameraName,
          lat: point.latitude,
          lng: point.longitude,
          timestamp: point.timestamp,
          // Speed of the leg that arrived at this waypoint. Never fabricated:
          // null means unknown/invalid, not "vehicle stopped".
          speed: segment?.valid ? segment.averageSpeedKmh : null,
          direction: 'UNKNOWN',
          distanceFromPrevKm: segment ? (segment.distanceMeters != null ? Math.round(segment.distanceMeters) / 1000 : null) : null,
          travelTimeFromPrevSeconds: segment?.travelTimeSeconds ?? null,
          distanceSource: segment?.distanceSource ?? null,
          segmentValid: segment?.valid ?? null,
        };
      });

    const validSegments = segments.filter((segment) => segment.valid);
    const totalDistanceMeters = validSegments.reduce((sum, segment) => sum + (segment.distanceMeters || 0), 0);
    const totalTravelSeconds = validSegments.reduce((sum, segment) => sum + (segment.travelTimeSeconds || 0), 0);
    const weightedSpeedDistance = validSegments.reduce(
      (sum, segment) => sum + (segment.averageSpeedKmh || 0) * (segment.distanceMeters || 0), 0
    );
    const avgSpeed = totalDistanceMeters > 0 ? weightedSpeedDistance / totalDistanceMeters : null;

    const first = waypoints[0]?.timestamp;
    const last = waypoints.at(-1)?.timestamp;
    const totalDuration = first && last ? Math.max(0, Math.round((new Date(last) - new Date(first)) / 60000)) : 0;

    return res.json({ success: true, data: {
      plate: vehicle.plateNumber,
      waypoints,
      segments,
      totalDistance: Math.round((totalDistanceMeters / 1000) * 100) / 100,
      totalTravelSeconds: Math.round(totalTravelSeconds),
      totalDuration,
      avgSpeed: avgSpeed != null ? Math.round(avgSpeed * 10) / 10 : null,
    }});
  } catch (error) { next(error); }
};
