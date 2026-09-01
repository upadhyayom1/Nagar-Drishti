function positiveIntegerFromEnv(variableName, fallback) {
  const rawValue = process.env[variableName];
  if (rawValue === undefined) return fallback;

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${variableName} must be a positive integer`);
  }
  return value;
}

module.exports = {
  // Database volume
  vehicleCount: 2000,
  cameraCount: 52,
  historicalDays: positiveIntegerFromEnv('HISTORICAL_DAYS', 90),

  // Temporal range: endDate null means generate up to the current local date.
  endDate: process.env.HISTORICAL_END_DATE || null,
  
  // Realism factors
  detectionFailureRate: 0.03, // 3% of all detections fail
  cameraOfflineRate: 0.005,   // 0.5% chance per day a camera is offline

  // Population distribution
  profiles: {
    COMMUTER: 0.35,
    RANDOM_DRIVER: 0.20,
    DELIVERY: 0.10,
    RIDE_HAIL: 0.15,
    COMMERCIAL: 0.10,
    LONG_HAUL_TRUCK: 0.05,
    OCCASIONAL_VISITOR: 0.05
  },

  // Vehicle state breakdown
  vehicleTypes: {
    CAR: 0.40,
    MOTORCYCLE: 0.20,
    SCOOTER: 0.15,
    AUTO: 0.10,
    BUS: 0.03,
    TRUCK: 0.07,
    VAN: 0.03,
    TAXI: 0.02
  },

  stateDistribution: {
    'UP': 0.72,
    'MP': 0.08,
    'BR': 0.06,
    'DL': 0.05,
    'RJ': 0.03,
    'HR': 0.02,
    'OTHER': 0.04
  },

  // Determinism
  seed: 12345,
  
  // Geography constraints
  minCameraSpacingMeters: 100,
  dailyActiveVehicleRate: 0.08,
  blacklistedVehicleCount: 8,
  batchSize: 5000,
  congestionAlertVehicleThreshold: 5,
  criticalCongestionVehicleThreshold: 10,
};
