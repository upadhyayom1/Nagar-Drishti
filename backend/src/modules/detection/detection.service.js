const { prisma } = require('../../lib/prisma');
const { processDetectionForBlacklist } = require('../blacklist/blacklist.service');
const { evaluateCongestionAlert } = require('../traffic/traffic.service');
const turf = require('@turf/turf');

function calculateHaversineDistance(lon1, lat1, lon2, lat2) {
  if (![lon1, lat1, lon2, lat2].every(Number.isFinite)) return null;
  return turf.distance([lon1, lat1], [lon2, lat2], { units: 'meters' });
}

async function recordDetection(data, { evaluateCongestion = true } = {}) {
  const { speed: providedSpeed, ...detectionData } = data;
  const timestamp = detectionData.timestamp ? new Date(detectionData.timestamp) : new Date();
  
  let calculatedSpeed = Number.isFinite(providedSpeed) && providedSpeed > 0 ? providedSpeed : null;

  let distMeters = null;
  let timeSeconds = null;
  let previousDetection = null;

  try {
    const currentCamera = await prisma.camera.findUnique({
      where: { id: detectionData.cameraId },
      select: { latitude: true, longitude: true }
    });
    
    const currentLat = detectionData.latitude ?? currentCamera?.latitude;
    const currentLon = detectionData.longitude ?? currentCamera?.longitude;

    previousDetection = await prisma.detection.findFirst({
      where: { vehicleId: detectionData.vehicleId, timestamp: { lt: timestamp } },
      orderBy: { timestamp: 'desc' },
      include: { camera: { select: { latitude: true, longitude: true } } }
    });

    if (previousDetection && Number.isFinite(currentLat) && Number.isFinite(currentLon)) {
      const prevLat = previousDetection.latitude ?? previousDetection.camera?.latitude;
      const prevLon = previousDetection.longitude ?? previousDetection.camera?.longitude;
      
      if (Number.isFinite(prevLat) && Number.isFinite(prevLon)) {
        distMeters = calculateHaversineDistance(prevLon, prevLat, currentLon, currentLat);
        timeSeconds = (timestamp.getTime() - previousDetection.timestamp.getTime()) / 1000;
        
        if (!calculatedSpeed && distMeters != null && timeSeconds > 0) {
          const speedMs = distMeters / timeSeconds;
          calculatedSpeed = Math.round(speedMs * 3.6 * 10) / 10;
          // Cap at 200 km/h to prevent anomalies if timestamps are too close or GPS glitches
          if (calculatedSpeed > 200) calculatedSpeed = null;
        }
      }
    }
  } catch (e) {
    console.warn("Failed to calculate dynamic speed or fetch previous detection", e);
  }

  const detection = await prisma.detection.create({ 
    data: { 
      ...detectionData, 
      timestamp,
    } 
  });

  if (previousDetection && previousDetection.cameraId !== detectionData.cameraId) {
    try {
      await prisma.cameraTransition.create({
        data: {
          vehicleId: detectionData.vehicleId,
          sourceCameraId: previousDetection.cameraId,
          destinationCameraId: detectionData.cameraId,
          timestamp: timestamp,
          travelTimeSeconds: timeSeconds !== null ? Math.round(timeSeconds) : null,
          distanceMeters: distMeters !== null ? distMeters : null,
          averageSpeed: calculatedSpeed,
        }
      });
    } catch (e) {
      console.warn("Failed to create camera transition", e);
    }
  }

  await prisma.vehicle.updateMany({
    where: { id: detectionData.vehicleId },
    data: {
      lastSeen: timestamp,
      ...(calculatedSpeed != null ? { speed: calculatedSpeed } : {}),
    },
  });

  const blacklistResult = await processDetectionForBlacklist(detection);
  const congestionAlert = evaluateCongestion ? await evaluateCongestionAlert(detection.cameraId, detection.timestamp) : null;
  return { detection: blacklistResult.updatedDetection, blacklistAlert: blacklistResult.alert || null, congestionAlert };
}

module.exports = { recordDetection };
