const { prisma } = require('../../lib/prisma');

function normalizePlateNumber(plateNumber) {
  if (!plateNumber) return '';
  return plateNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function addBlacklistedVehicle(data) {
  const normalizedPlate = normalizePlateNumber(data.plateNumber);
  
  if (!normalizedPlate) {
    throw new Error('Invalid plate number');
  }

  const existing = await prisma.blacklistedVehicle.findUnique({
    where: { plateNumber: normalizedPlate },
  });

  if (existing) {
    throw new Error('Vehicle already in blacklist');
  }

  return await prisma.blacklistedVehicle.create({
    data: {
      plateNumber: normalizedPlate,
      reason: data.reason || 'Not specified',
      severity: data.severity || 'MEDIUM',
      status: 'ACTIVE',
    },
  });
}

async function deactivateBlacklistedVehicle(id) {
  return await prisma.blacklistedVehicle.update({
    where: { id },
    data: { status: 'INACTIVE' },
  });
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

    const alert = await prisma.blacklistAlert.create({
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
