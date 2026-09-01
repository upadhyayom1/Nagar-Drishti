// Test-only stand-in for backend/src/lib/prisma.js. These tests exercise
// buildTrajectory() directly with in-memory detections/transitions and stub
// out the network module, so no query here is ever expected to actually run.
const unexpectedCall = (name) => async () => {
  throw new Error(`prisma.${name} should not be called in trajectory unit tests`);
};

const prisma = {
  detection: { findMany: unexpectedCall('detection.findMany') },
  cameraTransition: { findMany: unexpectedCall('cameraTransition.findMany') },
  road: { findMany: unexpectedCall('road.findMany') },
};

module.exports = { prisma };
