const { prisma } = require('./src/lib/prisma');
const fs = require('fs');
const path = require('path');

async function main() {
  const cameras = await prisma.camera.findMany();
  
  if (cameras.length === 0) {
    console.log("No cameras found in the database.");
    return;
  }
  
  const headers = ['id', 'cameraCode', 'name', 'latitude', 'longitude', 'direction', 'roadId', 'zoneId', 'status', 'createdAt', 'updatedAt'];
  let csv = headers.join(',') + '\n';
  
  for (const cam of cameras) {
    const row = headers.map(header => {
      let val = cam[header];
      if (val === null || val === undefined) return '';
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
      return val;
    });
    csv += row.join(',') + '\n';
  }
  
  // Create artifact path
  const filePath = '/Users/om_upadhyay/.gemini/antigravity-ide/brain/2e00a917-dbad-46ce-b9d8-79bc2d7a714a/cameras.csv';
  fs.writeFileSync(filePath, csv);
  console.log(`CSV successfully generated at ${filePath}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
