const { prisma } = require('./src/lib/prisma');
const fs = require('fs');
const path = require('path');

async function exportRoads() {
  const roads = await prisma.road.findMany();
  
  if (roads.length === 0) {
    console.log("No roads found in the database.");
    return;
  }
  
  const headers = ['id', 'roadCode', 'name', 'speedLimit', 'geometry', 'createdAt', 'updatedAt'];
  let csv = headers.join(',') + '\n';
  
  for (const road of roads) {
    const row = headers.map(header => {
      let val = road[header];
      if (val === null || val === undefined) return '';
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
      return val;
    });
    csv += row.join(',') + '\n';
  }
  
  const filePath = '/Users/om_upadhyay/.gemini/antigravity-ide/brain/2e00a917-dbad-46ce-b9d8-79bc2d7a714a/roads.csv';
  fs.writeFileSync(filePath, csv);
  console.log(`Roads CSV successfully generated at ${filePath}`);
}

async function exportZones() {
  const zones = await prisma.zone.findMany();
  
  if (zones.length === 0) {
    console.log("No zones found in the database.");
    return;
  }
  
  const headers = ['id', 'zoneCode', 'name', 'createdAt', 'updatedAt'];
  let csv = headers.join(',') + '\n';
  
  for (const zone of zones) {
    const row = headers.map(header => {
      let val = zone[header];
      if (val === null || val === undefined) return '';
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
      return val;
    });
    csv += row.join(',') + '\n';
  }
  
  const filePath = '/Users/om_upadhyay/.gemini/antigravity-ide/brain/2e00a917-dbad-46ce-b9d8-79bc2d7a714a/zones.csv';
  fs.writeFileSync(filePath, csv);
  console.log(`Zones CSV successfully generated at ${filePath}`);
}

async function main() {
  await exportRoads();
  await exportZones();
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
