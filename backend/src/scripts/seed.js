const { prisma } = require('../lib/prisma');
const { seedPrayagrajNetwork } = require('./seedPrayagrajNetwork');

async function main() {
  const network = await seedPrayagrajNetwork(prisma);
  console.log(`Prayagraj network ready: ${network.zones.length} zones, ${network.roads.length} roads, ${network.cameras.length} cameras.`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
