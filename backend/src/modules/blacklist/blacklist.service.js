const { prisma } = require('../../lib/prisma');

function normalizePlateNumber(plateNumber) {
  if (!plateNumber) return '';
  return plateNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function addBlacklistedVehicle(data) {
  const normalizedPlate = normalizePlateNumber(data.plateNumber);
  const severity = String(data.severity || 'MEDIUM').toUpperCase();
  const validSeverities = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
  
  if (!normalizedPlate) {
    throw new Error('Invalid plate number');
  }
  if (!validSeverities.has(severity)) {
    throw new Error('Invalid blacklist severity');
  }

  const existing = await prisma.blacklistedVehicle.findUnique({
    where: { plateNumber: normalizedPlate },
  });

  if (existing) {
    throw new Error('Vehicle already in blacklist');
  }

  const record = await prisma.blacklistedVehicle.create({
    data: {
      plateNumber: normalizedPlate,
      reason: data.reason || 'Not specified',
      severity,
      status: 'ACTIVE',
    },
  });
  await prisma.vehicle.upsert({
    where: { plateNumber: normalizedPlate },
    update: { status: 'BLACKLISTED' },
    create: {
      plateNumber: normalizedPlate,
      status: 'BLACKLISTED',
    },
  });
  return record;
}

async function deactivateBlacklistedVehicle(id) {
  const record = await prisma.blacklistedVehicle.update({
    where: { id },
    data: { status: 'INACTIVE' },
  });
  await prisma.vehicle.updateMany({ where: { plateNumber: record.plateNumber }, data: { status: 'ACTIVE' } });
  return record;
}

async function getBlacklistedVehicles(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  
  return await prisma.blacklistedVehicle.findMany({
    where: query,
    orderBy: { createdAt: 'desc' },
  });
}

async function checkPlate(plateNumber) {
  const normalizedPlate = normalizePlateNumber(plateNumber);
  
  const record = await prisma.blacklistedVehicle.findUnique({
    where: { plateNumber: normalizedPlate },
  });

  if (record && record.status === 'ACTIVE') {
    return {
      plateNumber: normalizedPlate,
      blacklisted: true,
      record,
    };
  }

  return {
    plateNumber: normalizedPlate,
    blacklisted: false,
  };
}

async function processDetectionForBlacklist(detection) {
  const checkResult = await checkPlate(detection.plateText);
  
  if (checkResult.blacklisted) {
    const updatedDetection = await prisma.detection.update({
      where: { id: detection.id },
      data: {
        isBlacklisted: true,
        blacklistId: checkResult.record.id,
      },
    });

    const existingAlert = await prisma.blacklistAlert.findFirst({ where: { detectionEventId: detection.id } });
    const alert = existingAlert || await prisma.blacklistAlert.create({
      data: {
        detectionEventId: detection.id,
        blacklistId: checkResult.record.id,
        cameraId: detection.cameraId,
        vehicleId: detection.vehicleId,
        plateNumber: checkResult.plateNumber,
        timestamp: detection.timestamp,
        status: 'NEW',
      }
    });

    let cameraName = detection.cameraId;
    if (detection.camera && detection.camera.name) {
      cameraName = detection.camera.name;
    } else {
      const cam = await prisma.camera.findUnique({ where: { id: detection.cameraId }});
      if (cam) cameraName = cam.name + (cam.location ? ` (${cam.location})` : '');
    }

    const alertMessage = `Blacklisted vehicle ${checkResult.plateNumber} detected by ${cameraName}. Reason: ${checkResult.record.reason}`;

    // Find any existing ACTIVE alert for this vehicle to update, preventing duplicate notifications
    const existingActiveAlert = await prisma.alert.findFirst({
      where: {
        type: 'BLACKLIST_MATCH',
        vehicleId: detection.vehicleId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingActiveAlert) {
      await prisma.alert.update({
        where: { id: existingActiveAlert.id },
        data: {
          cameraId: detection.cameraId,
          severity: checkResult.record.severity,
          message: alertMessage,
          createdAt: detection.timestamp || new Date(),
        },
      });
    } else {
      await prisma.alert.create({
        data: {
          type: 'BLACKLIST_MATCH',
          severity: checkResult.record.severity,
          vehicleId: detection.vehicleId,
          cameraId: detection.cameraId,
          message: alertMessage,
          status: 'ACTIVE',
          createdAt: detection.timestamp || new Date(),
        },
      });
    }

    if (!existingAlert) {
      // Also record an Incident for the incident log
      await prisma.incident.create({
        data: {
          type: 'BLACKLIST_DETECTION',
          title: `Blacklisted Vehicle Detected: ${checkResult.plateNumber}`,
          description: `Reason: ${checkResult.record.reason}`,
          severity: checkResult.record.severity,
          source: detection.source === 'AI' ? 'AI' : 'SIMULATION',
          latitude: detection.latitude || 0,
          longitude: detection.longitude || 0,
          cameraId: detection.cameraId,
          vehicleId: detection.vehicleId,
          timestamp: detection.timestamp,
        },
      });
    }

    return {
      updatedDetection,
      alert,
      isBlacklisted: true,
    };
  }
  
  return {
    updatedDetection: detection,
    isBlacklisted: false,
  };
}

async function getAlerts() {
  return await prisma.blacklistAlert.findMany({
    orderBy: { timestamp: 'desc' },
    include: {
      blacklist: true,
    }
  });
}

module.exports = {
  normalizePlateNumber,
  addBlacklistedVehicle,
  deactivateBlacklistedVehicle,
  getBlacklistedVehicles,
  checkPlate,
  processDetectionForBlacklist,
  getAlerts
};
