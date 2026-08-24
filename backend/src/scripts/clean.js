const { prisma } = require('../lib/prisma');

async function clean() {
  console.log('Clearing vehicles and detections...');
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Vehicle", "Detection", "Prediction", "Alert", "AnomalyEvent", "Trajectory", "CameraTransition", "BlacklistAlert", "BlacklistedVehicle" CASCADE;');
    console.log('Successfully deleted all vehicles and detections.');
  } catch (err) {
    console.error('Error truncating tables:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
