const { prisma } = require('../../lib/prisma');
const { recordDetection } = require('./detection.service');

function parseOptionalNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

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
      ocrConfidence: parseOptionalNumber(ocrConfidence),
      vehicleConfidence: parseOptionalNumber(vehicleConfidence),
      latitude: parseOptionalNumber(latitude),
      longitude: parseOptionalNumber(longitude),
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
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    
    const query = {
      where: { vehicle: { plateNumber } },
      take: limit + 1, // Fetch one extra to determine if there's a next page
      orderBy: { timestamp: 'desc' },
      include: {
        camera: { select: { cameraCode: true, name: true, latitude: true, longitude: true } },
        vehicle: { select: { plateNumber: true, vehicleType: true, speed: true } },
      }
    };
    
    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }
    
    const detections = await prisma.detection.findMany(query);
    
    let nextCursor = null;
    if (detections.length > limit) {
      const nextItem = detections.pop(); // Remove the extra item
      nextCursor = nextItem.id;
    }
    
    res.status(200).json({ 
      success: true, 
      data: {
        items: detections.map(serializeDetection),
        nextCursor
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle detections:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getVehicleHeatmap = async (req, res) => {
  try {
    const plateNumber = String(req.params.plateNumber || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const vehicle = await prisma.vehicle.findUnique({ where: { plateNumber } });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    // Calculate 28-day heatmap natively
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 27);
    startDate.setHours(0, 0, 0, 0);

    const detections = await prisma.detection.findMany({
      where: {
        vehicleId: vehicle.id,
        timestamp: { gte: startDate, lte: today }
      },
      select: { timestamp: true }
    });

    const activityDays = Array(28).fill(0);
    for (const d of detections) {
      const daysDiff = Math.floor((today.getTime() - d.timestamp.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 28) {
        activityDays[27 - daysDiff]++;
      }
    }

    res.status(200).json({ success: true, data: activityDays });
  } catch (error) {
    console.error('Error fetching vehicle heatmap:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCameraDetections = async (req, res) => {
  try {
    const { cameraId } = req.params;
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 100);
    const live = String(req.query.live || '').toLowerCase() === 'true' || req.query.live === '1';
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    
    const engine = global.simulationEngine;
    const running = Boolean(engine?.running);
    const currentTime = running ? engine.getState().simulationTime : new Date();

    const windowMinutes = Math.min(Math.max(Number(req.query.windowMinutes) || 2, 1), 60);
    const where = { cameraId };
    if (live) {
      where.timestamp = { gte: new Date(currentTime.getTime() - windowMinutes * 60 * 1000), lte: currentTime };
    }
    
    const query = {
      where,
      take: limit + 1, // Fetch one extra for nextCursor
      orderBy: { timestamp: 'desc' },
      include: { vehicle: { select: { plateNumber: true, vehicleType: true, speed: true } }, camera: { select: { cameraCode: true, name: true } } }
    };
    
    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }
    
    const detections = await prisma.detection.findMany(query);
    
    let nextCursor = null;
    if (detections.length > limit) {
      const nextItem = detections.pop();
      nextCursor = nextItem.id;
    }
    
    res.status(200).json({ 
      success: true, 
      data: {
        items: detections.map(serializeDetection),
        nextCursor
      } 
    });
  } catch (error) {
    console.error('Error fetching camera detections:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message, stack: error.stack });
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
    confidence: Math.round(((detection.ocrConfidence ?? detection.vehicleConfidence ?? 0) * 100) * 10) / 10,
    vehicleType: detection.vehicle?.vehicleType || 'CAR',
    speed: detection.vehicle?.speed ?? null,
    direction: detection.direction || 'UNKNOWN',
    imageUrl: detection.imageUrl,
  };
}
