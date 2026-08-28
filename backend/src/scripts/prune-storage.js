const { prisma } = require('../lib/prisma');
const { pruneStorage, getStorageMetrics } = require('../modules/system/storage.service');

async function main() {
  console.log('====================================================');
  console.log(' DATABASE STORAGE PRUNING & DEDUPLICATION (0.5 GB QUOTA)');
  console.log('====================================================');

  const before = await getStorageMetrics();
  console.log('Storage Before Pruning:');
  console.log(`  - Total Detections:        ${before.detections}`);
  console.log(`  - Total Transitions:       ${before.transitions}`);
  console.log(`  - Active Alerts:           ${before.alerts}`);
  console.log(`  - Registered Vehicles:     ${before.vehicles}`);
  console.log(`  - Estimated Storage:       ~${before.estimatedDbSizeMb} MB / ${before.quotaLimitMb} MB\n`);

  console.log('Running automated pruning and alert deduplication...');
  const pruneResult = await pruneStorage();

  if (pruneResult.success) {
    console.log('Pruning Results:');
    console.log(`  - Detections Pruned:       ${pruneResult.results.detectionsPruned}`);
    console.log(`  - Transitions Pruned:      ${pruneResult.results.transitionsPruned}`);
    console.log(`  - Health Logs Pruned:      ${pruneResult.results.healthPruned}`);
    console.log(`  - Duplicate Alerts Pruned: ${pruneResult.results.duplicateAlertsPruned}\n`);
  }

  const after = await getStorageMetrics();
  console.log('Storage After Pruning:');
  console.log(`  - Total Detections:        ${after.detections}`);
  console.log(`  - Total Transitions:       ${after.transitions}`);
  console.log(`  - Active Alerts:           ${after.alerts}`);
  console.log(`  - Estimated Storage:       ~${after.estimatedDbSizeMb} MB / ${after.quotaLimitMb} MB`);
  console.log(`  - Free Quota Available:    ~${after.quotaLimitMb - after.estimatedDbSizeMb} MB (${Math.round(((after.quotaLimitMb - after.estimatedDbSizeMb) / after.quotaLimitMb) * 100)}% free)\n`);

  console.log('====================================================');
  console.log(' PRUNING COMPLETE — DATABASE READY FOR DEPLOYMENT');
  console.log('====================================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
