const { prisma } = require('../../lib/prisma');
const { processDetectionForBlacklist } = require('../blacklist/blacklist.service');
const { evaluateCongestionAlert } = require('../traffic/traffic.service');

async function recordDetection(data, { evaluateCongestion = true } = {}) {
  const { speed, ...detectionData } = data;
  const timestamp = detectionData.timestamp ? new Date(detectionData.timestamp) : new Date();
  const detection = await prisma.detection.create({ data: { ...detectionData, timestamp } });
  await prisma.vehicle.updateMany({
    where: { id: detectionData.vehicleId },
    data: {
      lastSeen: timestamp,
      ...(Number.isFinite(speed) && speed > 0 ? { speed } : {}),
    },
  });
  const blacklistResult = await processDetectionForBlacklist(detection);
  const congestionAlert = evaluateCongestion ? await evaluateCongestionAlert(detection.cameraId, detection.timestamp) : null;
  return { detection: blacklistResult.updatedDetection, blacklistAlert: blacklistResult.alert || null, congestionAlert };
}

module.exports = { recordDetection };
