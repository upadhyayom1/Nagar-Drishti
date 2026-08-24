const { prisma } = require('../../lib/prisma');

exports.getRecentDetections = async (req, res) => {
  try {
    const detections = await prisma.detection.findMany({
      take: 100,
      orderBy: { timestamp: 'desc' },
      include: {
        camera: { select: { cameraCode: true, name: true } },
        vehicle: { select: { plateNumber: true, vehicleType: true } }
      }
    });
    res.status(200).json({ success: true, data: detections });
  } catch (error) {
    console.error('Error fetching recent detections:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getVehicleDetections = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const detections = await prisma.detection.findMany({
      where: { vehicleId },
      orderBy: { timestamp: 'asc' }, // chronological journey
      include: {
        camera: { select: { cameraCode: true, name: true, latitude: true, longitude: true } }
      }
    });
    res.status(200).json({ success: true, data: detections });
  } catch (error) {
    console.error('Error fetching vehicle detections:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCameraDetections = async (req, res) => {
  try {
    const { cameraId } = req.params;
    const count = await prisma.detection.count({ where: { cameraId } });
    const lastDetection = await prisma.detection.findFirst({
      where: { cameraId },
      orderBy: { timestamp: 'desc' },
      include: { vehicle: { select: { plateNumber: true } } }
    });
    res.status(200).json({ success: true, data: { count, lastDetection } });
  } catch (error) {
    console.error('Error fetching camera detections:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
