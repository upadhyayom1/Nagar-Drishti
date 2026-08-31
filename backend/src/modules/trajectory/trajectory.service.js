/**
 * Canonical vehicle trajectory service.
 *
 * This is the ONLY place trajectories are built from historical database
 * detections. vehicle.controller.js, analytics endpoints, or any future
 * consumer should call buildVehicleTrajectory() rather than recomputing
 * distance/time/speed themselves.
 *
 * Pipeline:
 *   raw detections
 *     -> sort by timestamp
 *     -> remove invalid observations
 *     -> collapse repeated camera observations
 *     -> validate camera-to-camera movement
 *     -> match CameraTransition where available
 *     -> calculate missing values (network route, then geographic fallback)
 *     -> trajectory { points, segments }
 *
 * Live simulation state (current vehicle position / current camera) is a
 * separate concern handled by simulation/engine.js — this module only
 * reconstructs history from the database.
 */

const { prisma } = require('../../lib/prisma');
const roadNetworkService = require('../network/roadNetwork.service');
const {
  DISTANCE_SOURCE,
  DEFAULT_MAX_PLAUSIBLE_SPEED_KMH,
  sortAndFilterDetections,
  collapseConsecutiveCameraObservations,
  matchStoredTransition,
  haversineDistanceMeters,
  computeTravelTimeSeconds,
  computeSpeedKmh,
  validateSegment,
} = require('./trajectory.utils');

async function getVehicleDetections(vehicleId, { from, to } = {}) {
  return prisma.detection.findMany({
    where: {
      vehicleId,
      ...(from || to ? { timestamp: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    },
    include: {
      camera: { include: { road: true, zone: true } },
    },
    orderBy: { timestamp: 'asc' },
  });
}

async function getVehicleTransitions(vehicleId, { from, to } = {}) {
  return prisma.cameraTransition.findMany({
    where: {
      vehicleId,
      ...(from || to ? { timestamp: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    },
    orderBy: { timestamp: 'asc' },
  });
}

/**
 * Resolve distance for a segment using the priority order:
 *   1. stored CameraTransition
 *   2. existing road network route
 *   3. straight-line (Haversine) geographic fallback
 *   4. null (not enough information)
 */
async function resolveDistanceMeters({ transition, previous, current }) {
  if (Number.isFinite(transition?.distanceMeters)) {
    return { distanceMeters: transition.distanceMeters, distanceSource: DISTANCE_SOURCE.CAMERA_TRANSITION };
  }

  const networkDistance = await roadNetworkService.getNetworkDistanceMeters(
    { longitude: previous.longitude, latitude: previous.latitude },
    { longitude: current.longitude, latitude: current.latitude }
  ).catch(() => null); // network lookup is a fallback, never fatal to trajectory building

  if (Number.isFinite(networkDistance)) {
    return { distanceMeters: networkDistance, distanceSource: DISTANCE_SOURCE.NETWORK_ROUTE };
  }

  const geoDistance = haversineDistanceMeters(previous, current);
  if (Number.isFinite(geoDistance)) {
    return { distanceMeters: geoDistance, distanceSource: DISTANCE_SOURCE.GEOGRAPHIC_FALLBACK };
  }

  return { distanceMeters: null, distanceSource: DISTANCE_SOURCE.UNKNOWN };
}

function toPoint(detection) {
  return {
    cameraId: detection.cameraId,
    cameraName: detection.camera?.name || detection.camera?.cameraCode || 'Unknown Camera',
    cameraCode: detection.camera?.cameraCode || null,
    timestamp: detection.timestamp,
    latitude: detection.latitude ?? detection.camera?.latitude ?? null,
    longitude: detection.longitude ?? detection.camera?.longitude ?? null,
  };
}

/**
 * Build a trajectory from already-fetched detections + transitions.
 * Kept separate from buildVehicleTrajectory() so it can be exercised in
 * tests without a database.
 */
async function buildTrajectory(detections, transitions, options = {}) {
  const maxPlausibleSpeedKmh = options.maxPlausibleSpeedKmh ?? DEFAULT_MAX_PLAUSIBLE_SPEED_KMH;

  const cleaned = sortAndFilterDetections(detections);
  const collapsed = collapseConsecutiveCameraObservations(cleaned);
  const points = collapsed.map(toPoint);

  const segments = [];
  for (let i = 1; i < collapsed.length; i++) {
    const previous = points[i - 1];
    const current = points[i];

    const transition = matchStoredTransition(transitions, previous, current);
    const travelTimeSeconds = Number.isFinite(transition?.travelTimeSeconds) && transition.travelTimeSeconds > 0
      ? transition.travelTimeSeconds
      : computeTravelTimeSeconds(previous, current);

    const { distanceMeters, distanceSource } = await resolveDistanceMeters({ transition, previous, current });

    const averageSpeedKmh = Number.isFinite(transition?.averageSpeed) && transition.averageSpeed > 0
      ? transition.averageSpeed
      : computeSpeedKmh(distanceMeters, travelTimeSeconds);

    const { valid, reason } = validateSegment({
      previous, current, travelTimeSeconds, distanceMeters, speedKmh: averageSpeedKmh, maxPlausibleSpeedKmh,
    });

    segments.push({
      sourceCameraId: previous.cameraId,
      destinationCameraId: current.cameraId,
      timestamp: current.timestamp,
      distanceMeters: Number.isFinite(distanceMeters) ? Math.round(distanceMeters) : null,
      travelTimeSeconds: Number.isFinite(travelTimeSeconds) ? Math.round(travelTimeSeconds) : null,
      // Never fabricate a speed for missing data — null means "unknown", not "stopped".
      averageSpeedKmh: valid && Number.isFinite(averageSpeedKmh) ? Math.round(averageSpeedKmh * 10) / 10 : null,
      distanceSource,
      valid,
      ...(valid ? {} : { reason }),
    });
  }

  return { points, segments };
}

async function buildVehicleTrajectory(vehicleId, options = {}) {
  const [detections, transitions] = await Promise.all([
    getVehicleDetections(vehicleId, options),
    getVehicleTransitions(vehicleId, options),
  ]);

  return buildTrajectory(detections, transitions, options);
}

module.exports = {
  buildVehicleTrajectory,
  buildTrajectory,
  getVehicleDetections,
  getVehicleTransitions,
  DISTANCE_SOURCE,
};
