const { prisma } = require('../../lib/prisma');

const STORAGE_LIMITS = {
  MAX_DETECTIONS: 30000,
  TARGET_DETECTIONS: 25000,
  MAX_TRANSITIONS: 25000,
  TARGET_TRANSITIONS: 20000,
  MAX_CAMERA_HEALTH: 2000,
  MAX_INCIDENTS: 1000,
};

/**
 * Prunes older historical data to maintain database size well within the 0.5 GB quota.
 * Guarantees that active blacklists and essential references are preserved.
 */
async function pruneStorage() {
  const results = {
    detectionsPruned: 0,
    transitionsPruned: 0,
    healthPruned: 0,
    duplicateAlertsPruned: 0,
  };

  try {
    // 1. PRUNE DETECTIONS IF OVER LIMIT
    const totalDetections = await prisma.detection.count();
    if (totalDetections > STORAGE_LIMITS.MAX_DETECTIONS) {
      const excess = totalDetections - STORAGE_LIMITS.TARGET_DETECTIONS;
      
      // Find timestamp of the cutoff record (protecting isBlacklisted records)
      const cutoff = await prisma.detection.findMany({
        orderBy: { timestamp: 'desc' },
        skip: STORAGE_LIMITS.TARGET_DETECTIONS,
        take: 1,
        select: { timestamp: true },
      });

      if (cutoff.length > 0) {
        const deleted = await prisma.detection.deleteMany({
          where: {
            timestamp: { lt: cutoff[0].timestamp },
            isBlacklisted: false, // Never delete blacklisted vehicle audit trails
          },
        });
        results.detectionsPruned = deleted.count;
      }
    }

    // 2. PRUNE CAMERA TRANSITIONS IF OVER LIMIT
    const totalTransitions = await prisma.cameraTransition.count();
    if (totalTransitions > STORAGE_LIMITS.MAX_TRANSITIONS) {
      const cutoff = await prisma.cameraTransition.findMany({
        orderBy: { timestamp: 'desc' },
        skip: STORAGE_LIMITS.TARGET_TRANSITIONS,
        take: 1,
        select: { timestamp: true },
      });

      if (cutoff.length > 0) {
        const deleted = await prisma.cameraTransition.deleteMany({
          where: {
            timestamp: { lt: cutoff[0].timestamp },
          },
        });
        results.transitionsPruned = deleted.count;
      }
    }

    // 3. PRUNE CAMERA HEALTH LOGS
    const totalHealth = await prisma.cameraHealth.count();
    if (totalHealth > STORAGE_LIMITS.MAX_CAMERA_HEALTH) {
      const cutoff = await prisma.cameraHealth.findMany({
        orderBy: { recordedAt: 'desc' },
        skip: STORAGE_LIMITS.MAX_CAMERA_HEALTH,
        take: 1,
        select: { recordedAt: true },
      });

      if (cutoff.length > 0) {
        const deleted = await prisma.cameraHealth.deleteMany({
          where: {
            recordedAt: { lt: cutoff[0].recordedAt },
          },
        });
        results.healthPruned = deleted.count;
      }
    }

    // 4. CLEANUP DUPLICATE ALERTS (Keep only the newest active alert per camera/vehicle)
    const activeAlerts = await prisma.alert.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, type: true, cameraId: true, vehicleId: true },
    });

    const seenAlertKeys = new Set();
    const alertIdsToDelete = [];

    for (const a of activeAlerts) {
      const key = a.type === 'CONGESTION' ? `CONGESTION_${a.cameraId}` : `BLACKLIST_${a.vehicleId}`;
      if (seenAlertKeys.has(key)) {
        alertIdsToDelete.push(a.id);
      } else {
        seenAlertKeys.add(key);
      }
    }

    if (alertIdsToDelete.length > 0) {
      // Delete in batches
      const deleted = await prisma.alert.deleteMany({
        where: { id: { in: alertIdsToDelete } },
      });
      results.duplicateAlertsPruned = deleted.count;
    }

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error('Storage pruning failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Returns current table storage metrics
 */
async function getStorageMetrics() {
  const [detections, transitions, alerts, vehicles, cameras] = await Promise.all([
    prisma.detection.count(),
    prisma.cameraTransition.count(),
    prisma.alert.count(),
    prisma.vehicle.count(),
    prisma.camera.count(),
  ]);

  return {
    detections,
    transitions,
    alerts,
    vehicles,
    cameras,
    estimatedDbSizeMb: Math.round(((detections * 400 + transitions * 300) / (1024 * 1024)) + 5),
    quotaLimitMb: 500,
  };
}

module.exports = {
  pruneStorage,
  getStorageMetrics,
  STORAGE_LIMITS,
};
