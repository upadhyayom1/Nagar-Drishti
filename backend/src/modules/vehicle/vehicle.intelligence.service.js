const { prisma } = require('../../lib/prisma');
const { normalizePlateNumber } = require('../blacklist/blacklist.service');

async function getVehicleProfile(plateNumber) {
  const normalizedPlate = normalizePlateNumber(plateNumber);

  if (!normalizedPlate) {
    throw new Error('Invalid plate number');
  }

  // 1. Find Vehicle
  const vehicle = await prisma.vehicle.findUnique({
    where: { plateNumber: normalizedPlate },
  });

  if (!vehicle) {
    return null;
  }

  // 2. Fetch Detections
  const detections = await prisma.detection.findMany({
    where: { vehicleId: vehicle.id },
    orderBy: { timestamp: 'asc' },
    include: {
      camera: true,
    }
  });

  // 3. Determine Last Seen
  let lastSeen = null;
  if (detections.length > 0) {
    const latestDetection = detections[detections.length - 1];
    lastSeen = {
      cameraId: latestDetection.camera.id,
      cameraName: latestDetection.camera.name,
      roadId: latestDetection.camera.roadId,
      latitude: latestDetection.latitude || latestDetection.camera.latitude,
      longitude: latestDetection.longitude || latestDetection.camera.longitude,
      timestamp: latestDetection.timestamp,
      direction: latestDetection.direction || latestDetection.camera.direction,
    };
  }

  // 4. Movement History
  const history = detections.map(d => ({
    cameraId: d.camera.id,
    cameraName: d.camera.name,
    timestamp: d.timestamp,
    latitude: d.latitude || d.camera.latitude,
    longitude: d.longitude || d.camera.longitude,
    direction: d.direction || d.camera.direction,
    isBlacklisted: d.isBlacklisted
  }));

  // 5. Blacklist Status
  const blacklistedVehicle = await prisma.blacklistedVehicle.findUnique({
    where: { plateNumber: normalizedPlate },
  });
  
  const isCurrentlyBlacklisted = blacklistedVehicle && blacklistedVehicle.status === 'ACTIVE';
  
  const blacklist = blacklistedVehicle ? {
    isBlacklisted: isCurrentlyBlacklisted,
    id: blacklistedVehicle.id,
    reason: blacklistedVehicle.reason,
    active: blacklistedVehicle.status === 'ACTIVE'
  } : {
    isBlacklisted: false,
    active: false
  };

  // 6. Blacklist Alerts
  const alerts = await prisma.blacklistAlert.findMany({
    where: { plateNumber: normalizedPlate },
    orderBy: { timestamp: 'desc' }
  });

  // 7. Incidents
  const incidents = await prisma.incident.findMany({
    where: { vehicleId: vehicle.id },
    orderBy: { timestamp: 'desc' },
    include: {
      camera: true
    }
  });

  // 8. Calculate Current Status
  let currentStatusLabel = 'NORMAL';
  let statusReason = '';

  const openIncidents = incidents.filter(i => i.status === 'OPEN');
  
  if (isCurrentlyBlacklisted) {
    currentStatusLabel = 'BLACKLISTED';
    statusReason = blacklistedVehicle.reason;
  } else if (openIncidents.length > 0) {
    currentStatusLabel = 'INCIDENT_REPORTED';
    statusReason = 'Active incident reported';
  } else if (detections.length === 0) {
    currentStatusLabel = 'UNKNOWN';
    statusReason = 'No detections recorded';
  } else {
    currentStatusLabel = 'NORMAL';
    statusReason = 'Operating normally';
  }

  const currentStatus = {
    label: currentStatusLabel,
    isBlacklisted: isCurrentlyBlacklisted,
    reason: statusReason
  };

  // 9. Analytics
  const uniqueCameras = new Set(detections.map(d => d.cameraId));
  let observedDurationMinutes = 0;
  
  if (detections.length > 1) {
    const firstTime = new Date(detections[0].timestamp).getTime();
    const lastTime = new Date(detections[detections.length - 1].timestamp).getTime();
    observedDurationMinutes = Math.round((lastTime - firstTime) / 60000);
  }

  const analytics = {
    totalDetections: detections.length,
    camerasVisited: uniqueCameras.size,
    firstSeen: detections.length > 0 ? detections[0].timestamp : vehicle.createdAt,
    lastSeen: lastSeen ? lastSeen.timestamp : vehicle.updatedAt,
    totalObservedDurationMinutes: observedDurationMinutes,
    blacklistAlertCount: alerts.length,
    incidentCount: incidents.length
  };

  // 10. Compile and return Profile
  return {
    vehicle: {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      vehicleType: vehicle.vehicleType || 'UNKNOWN',
      color: vehicle.color || 'UNKNOWN',
      status: vehicle.status || 'ACTIVE'
    },
    currentStatus,
    lastSeen,
    history,
    blacklist,
    alerts,
    incidents,
    analytics
  };
}

module.exports = {
  getVehicleProfile
};
