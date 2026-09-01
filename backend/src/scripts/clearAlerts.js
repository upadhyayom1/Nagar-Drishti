const { prisma } = require('../lib/prisma');
require('dotenv').config({ path: '../../.env' }); // Just in case, try to load env

async function purgeAlerts() {
  console.log('Starting alert purging job...');
  try {
    const result = await prisma.alert.deleteMany({});
    console.log(`Successfully purged ${result.count} stale alerts!`);
  } catch (error) {
    console.error('Failed to prune alerts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

purgeAlerts();
