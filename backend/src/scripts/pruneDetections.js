const { prisma } = require('../lib/prisma');

async function pruneDetections() {
  console.log('Starting detection pruning job...');
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const result = await prisma.detection.deleteMany({
      where: {
        timestamp: {
          lt: sixtyDaysAgo
        }
      }
    });

    console.log(`Successfully pruned ${result.count} old detections from before ${sixtyDaysAgo.toISOString()}`);
  } catch (error) {
    console.error('Failed to prune detections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Allow running directly
if (require.main === module) {
  pruneDetections();
}

module.exports = { pruneDetections };
