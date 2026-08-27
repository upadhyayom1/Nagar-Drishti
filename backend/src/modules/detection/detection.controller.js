const { prisma } = require('../../lib/prisma');
const { recordDetection } = require('./detection.service');

exports.createDetection = async (req, res) => {
  try {
    const { plateNumber, cameraId, timestamp, ocrConfidence, vehicleConfidence, latitude, longitude, direction, imageUrl } = req.body;
    if (!plateNumber || !cameraId) return res.status(400).json({ success: false, message: 'plateNumber and cameraId are required' });
    const normalizedPlate = String(plateNumber).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const camera = await prisma.camera.findFirst({ where: { OR: [{ id: cameraId }, { cameraCode: cameraId }] } });
    if (!camera) return res.status(404).json({ success: false, message: 'Camera not found' });
    const vehicle = await prisma.vehicle.upsert({
      where: { plateNumber: normalizedPlate },
      update: { lastSeen: timestamp ? new Date(timestamp) : new Date() },
      create: { plateNumber: normalizedPlate, firstSeen: timestamp ? new Date(timestamp) : new Date(), lastSeen: timestamp ? new Date(timestamp) : new Date() },
    });
    const result = await recordDetection({
      vehicleId: vehicle.id,
      cameraId: camera.id,
      plateText: normalizedPlate,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      ocrConfidence: Number.isFinite(ocrConfidence) ? ocrConfidence : null,
      vehicleConfidence: Number.isFinite(vehicleConfidence) ? vehicleConfidence : null,
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      direction: direction || null,
      imageUrl: imageUrl || null,
      source: 'AI',
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error recording detection:', error);
    res.status(500).json({ success: false, message: 'Unable to record detection' });
  }
};

exports.getRecentDetections = async (req, res) => {
  try {
    const detections = await prisma.detection.findMany({
      take: Math.min(Math.max(Number(req.query.limit) || 100, 1), 100),
      orderBy: { timestamp: 'desc' },
      include: {
        camera: { select: { cameraCode: true, name: true } },
        vehicle: { select: { plateNumber: true, vehicleType: true, speed: true } }
      }
    });
    res.status(200).json({ success: true, data: detections.map(serializeDetection) });
  } catch (error) {
    console.error('Error fetching recent detections:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getVehicleDetections = async (req, res) => {
  try {
    const plateNumber = String(req.params.plateNumber || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const detections = await prisma.detection.findMany({
      where: { vehicle: { plateNumber } },
      orderBy: { timestamp: 'asc' }, // chronological journey
      include: {
        camera: { select: { cameraCode: true, name: true, latitude: true, longitude: true } },
        vehicle: { select: { plateNumber: true, vehicleType: true, speed: true } },
      }
    });
    res.status(200).json({ success: true, data: detections.map(serializeDetection) });
  } catch (error) {
    console.error('Error fetching vehicle detections:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCameraDetections = async (req, res) => {
  try {
    const { cameraId } = req.params;
    const detections = await prisma.detection.findMany({
      where: { cameraId },
      take: Math.min(Math.max(Number(req.query.limit) || 100, 1), 100),
      orderBy: { timestamp: 'desc' },
      include: { vehicle: { select: { plateNumber: true, vehicleType: true, speed: true } }, camera: { select: { cameraCode: true, name: true } } }
    });
    res.status(200).json({ success: true, data: detections.map(serializeDetection) });
  } catch (error) {
    console.error('Error fetching camera detections:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

function serializeDetection(detection) {
  return {
    id: detection.id,
    vehiclePlate: detection.vehicle?.plateNumber || detection.plateText,
    cameraId: detection.cameraId,
    cameraCode: detection.camera?.cameraCode || 'CAM',
    cameraName: detection.camera?.name || detection.camera?.cameraCode || 'Prayagraj Optical Node',
    timestamp: detection.timestamp,
    confidence: Math.round(((detection.ocrConfidence ?? detection.vehicleConfidence ?? 0.95) * 100) * 10) / 10,
    vehicleType: detection.vehicle?.vehicleType || 'CAR',
    speed: detection.vehicle?.speed ?? 35,
    direction: detection.direction || 'EASTBOUND',
    imageUrl: detection.imageUrl,
  };
}
