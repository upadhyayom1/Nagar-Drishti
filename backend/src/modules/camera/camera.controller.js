const { prisma } = require('../../lib/prisma');
const { getTrafficSnapshot } = require('../traffic/traffic.service');

exports.getCameras = async (req, res) => {
  try {
    const snapshot = await getTrafficSnapshot(req.query);
    res.status(200).json({ success: true, data: snapshot.cameras.map(enrichCamera) });
  } catch (error) {
    console.error('Error fetching cameras:', error);
    res.status(500).json({ success: false, message: 'Server error fetching cameras' });
  }
};

exports.getCamera = async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await getTrafficSnapshot(req.query, id);
    const camera = snapshot.cameras[0];
    if (!camera) return res.status(404).json({ success: false, message: 'Camera not found' });
    res.status(200).json({ success: true, data: enrichCamera(camera) });
  } catch (error) {
    console.error('Error fetching camera:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTraffic = async (req, res) => {
  try {
    const snapshot = await getTrafficSnapshot(req.query);
    res.status(200).json({ success: true, data: { ...snapshot, cameras: snapshot.cameras.map(enrichCamera) } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Unable to fetch camera traffic' });
  }
};

function enrichCamera(camera) {
  return {
    ...camera,
    lat: camera.latitude,
    lng: camera.longitude,
    vehiclesDetected: camera.vehicleCount,
    detectionCount: camera.detectionCount,
    fps: null,
    lastUpdated: camera.updatedAt,
    zone: typeof camera.zone === 'string' ? camera.zone : camera.zone?.name || null,
  };
}
