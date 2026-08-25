const { prisma } = require('../../lib/prisma');
const { processDetectionForBlacklist } = require('../blacklist/blacklist.service');
const { evaluateCongestionAlert } = require('../traffic/traffic.service');

async function recordDetection(data) {
  const detection = await prisma.detection.create({ data });
  const blacklistResult = await processDetectionForBlacklist(detection);
  const congestionAlert = await evaluateCongestionAlert(detection.cameraId, detection.timestamp);
  return { detection: blacklistResult.updatedDetection, blacklistAlert: blacklistResult.alert || null, congestionAlert };
}

module.exports = { recordDetection };
