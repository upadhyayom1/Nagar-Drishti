const { prisma } = require('../../lib/prisma');
const { getTrafficSnapshot } = require('../traffic/traffic.service');

exports.getCameras = async (req, res) => {
  try {
    const cameras = await prisma.camera.findMany({
      include: { zone: { select: { name: true } }, road: { select: { name: true } } },
      orderBy: { cameraCode: 'asc' },
    });

    // Check live simulation engine if active
    let liveEngineVehiclesByCam = new Map();
    if (global.simulationEngine && global.simulationEngine.running && Array.isArray(global.simulationEngine.vehicles)) {
      for (const v of global.simulationEngine.vehicles) {
        if (v.activeCameras && v.activeCameras.size > 0) {
          for (const camId of v.activeCameras) {
            liveEngineVehiclesByCam.set(camId, (liveEngineVehiclesByCam.get(camId) || 0) + 1);
          }
        }
      }
    }

    const enriched = cameras.map((camera) => {
      const liveVehicles = liveEngineVehiclesByCam.get(camera.id) || 0;
      return enrichCamera({
        ...camera,
        vehicleCount: liveVehicles > 0 ? liveVehicles : 2,
        vehiclesDetected: liveVehicles > 0 ? liveVehicles : 2,
        detectionCount: liveVehicles > 0 ? liveVehicles * 8 : 15,
        trafficLevel: liveVehicles > 5 ? 'congested' : liveVehicles > 2 ? 'high' : 'low',
        zone: camera.zone?.name || 'Prayagraj Zone',
        road: camera.road?.name || 'Main Corridor',
      });
    });

    res.status(200).json({ success: true, data: enriched });
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
