module.exports = {
  // Database volume
  vehicleCount: 10000,
  cameraCount: 40,
  historicalDays: 180,

  // Temporal range
  startDate: '2026-01-01T00:00:00.000Z',
  
  // Realism factors
  detectionFailureRate: 0.03, // 3% of all detections fail
  cameraOfflineRate: 0.005,   // 0.5% chance per day a camera is offline

  // Population distribution
  profiles: {
    COMMUTER: 0.40,
    RANDOM_DRIVER: 0.20,
    DELIVERY: 0.10,
    TAXI: 0.10,
    COMMERCIAL: 0.10,
    OCCASIONAL_VISITOR: 0.10
  },

  // Vehicle state breakdown
  vehicleTypes: {
    CAR: 0.45,
    MOTORCYCLE: 0.20,
    SCOOTER: 0.15,
    AUTO: 0.08,
    BUS: 0.03,
    TRUCK: 0.04,
    VAN: 0.03,
    TAXI: 0.02
  },

  stateDistribution: {
    'DL': 0.60,
    'UP': 0.15,
    'HR': 0.08,
    'RJ': 0.04,
    'PB': 0.03,
    'BR': 0.02,
    'MH': 0.02,
    'OTHER': 0.06
  },

  // Determinism
  seed: 12345,
  
  // Geography constraints
  minCameraSpacingMeters: 100
};
