/**
 * Pure trajectory-building helpers.
 *
 * Deliberately dependency-free (no Prisma, no network calls) so the core
 * logic — cleaning, collapsing, matching, validating — can be unit tested
 * in isolation. Anything that needs the database or the road network lives
 * in trajectory.service.js instead.
 */

const turf = require('@turf/turf');

const DISTANCE_SOURCE = Object.freeze({
  CAMERA_TRANSITION: 'CAMERA_TRANSITION',
  NETWORK_ROUTE: 'NETWORK_ROUTE',
  GEOGRAPHIC_FALLBACK: 'GEOGRAPHIC_FALLBACK',
  UNKNOWN: 'UNKNOWN',
});

// No project-wide "realistic speed" constant exists yet, so this is a
// conservative, documented default rather than a silent magic number.
// Callers can override it via options.maxPlausibleSpeedKmh.
const DEFAULT_MAX_PLAUSIBLE_SPEED_KMH = 160;

/**
 * Sort raw detections chronologically and drop ones without usable
 * coordinates/timestamp. Nothing is deleted from the database — this only
 * decides what participates in the trajectory *representation*.
 */
function sortAndFilterDetections(detections) {
  return detections
    .filter((detection) => {
      const timestamp = new Date(detection.timestamp).getTime();
      return Number.isFinite(timestamp) && detection.cameraId;
    })
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Collapse consecutive observations from the same camera into a single
 * point (the latest one). A vehicle lingering in one camera's detection
 * radius is not a sequence of route legs.
 */
function collapseConsecutiveCameraObservations(detections) {
  const result = [];

  for (const detection of detections) {
    const previous = result[result.length - 1];

    if (previous && previous.cameraId === detection.cameraId) {
      if (new Date(detection.timestamp).getTime() > new Date(previous.timestamp).getTime()) {
        result[result.length - 1] = detection;
      }
      continue;
    }

    result.push(detection);
  }

  return result;
}

/**
 * Find the stored CameraTransition (if any) for a source -> destination
 * pair, matched to the destination's arrival timestamp. This is generated
 * by the same simulation/historical logic that produced the detections, so
 * it takes priority over anything recalculated here.
 */
function matchStoredTransition(transitions, previous, current, toleranceMs = 5 * 60 * 1000) {
  const currentTime = new Date(current.timestamp).getTime();
  let best = null;
  let bestDelta = Infinity;

  for (const transition of transitions) {
    if (transition.sourceCameraId !== previous.cameraId) continue;
    if (transition.destinationCameraId !== current.cameraId) continue;
    const transitionTime = new Date(transition.timestamp).getTime();
    const delta = Math.abs(transitionTime - currentTime);
    if (delta <= toleranceMs && delta < bestDelta) {
      best = transition;
      bestDelta = delta;
    }
  }

  return best;
}

function haversineDistanceMeters(previous, current) {
  if (![previous.longitude, previous.latitude, current.longitude, current.latitude].every(Number.isFinite)) {
    return null;
  }
  return turf.distance(
    [previous.longitude, previous.latitude],
    [current.longitude, current.latitude],
    { units: 'meters' }
  );
}

function computeTravelTimeSeconds(previous, current) {
  const seconds = (new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()) / 1000;
  return seconds;
}

function computeSpeedKmh(distanceMeters, travelTimeSeconds) {
  if (!Number.isFinite(distanceMeters) || !Number.isFinite(travelTimeSeconds) || travelTimeSeconds <= 0) {
    return null;
  }
  return (distanceMeters / travelTimeSeconds) * 3.6;
}

/**
 * Validate a single A -> B segment. Returns { valid, reason }.
 * Never throws and never silently "fixes" bad data — invalid segments are
 * kept (marked invalid) rather than dropped, so downstream analytics can
 * still see them.
 */
function validateSegment({ previous, current, travelTimeSeconds, distanceMeters, speedKmh, maxPlausibleSpeedKmh }) {
  if (previous.cameraId === current.cameraId) {
    return { valid: false, reason: 'SAME_CAMERA' };
  }
  if (!Number.isFinite(travelTimeSeconds) || travelTimeSeconds <= 0) {
    return { valid: false, reason: 'NON_POSITIVE_TRAVEL_TIME' };
  }
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    return { valid: false, reason: 'MISSING_DISTANCE' };
  }
  if (speedKmh != null && (speedKmh < 0 || speedKmh > maxPlausibleSpeedKmh)) {
    return { valid: false, reason: 'IMPLAUSIBLE_SPEED' };
  }
  return { valid: true, reason: null };
}

module.exports = {
  DISTANCE_SOURCE,
  DEFAULT_MAX_PLAUSIBLE_SPEED_KMH,
  sortAndFilterDetections,
  collapseConsecutiveCameraObservations,
  matchStoredTransition,
  haversineDistanceMeters,
  computeTravelTimeSeconds,
  computeSpeedKmh,
  validateSegment,
};
