const { prisma } = require('./src/lib/prisma');
const turf = require('@turf/turf');

function calculateHaversineDistance(lon1, lat1, lon2, lat2) {
  if (![lon1, lat1, lon2, lat2].every(Number.isFinite)) return null;
  return turf.distance([lon1, lat1], [lon2, lat2], { units: 'meters' });
}

async function main() {
  console.log('Fetching vehicles...');
  const vehicles = await prisma.vehicle.findMany({ select: { id: true } });
  console.log(`Found ${vehicles.length} vehicles.`);
  
  let count = 0;
  for (const v of vehicles) {
    const detections = await prisma.detection.findMany({
      where: { vehicleId: v.id },
      orderBy: { timestamp: 'asc' },
      include: { camera: { select: { latitude: true, longitude: true } } }
    });
    
    for (let i = 1; i < detections.length; i++) {
      const prev = detections[i-1];
      const curr = detections[i];
      const prevLat = prev.latitude ?? prev.camera?.latitude;
      const prevLon = prev.longitude ?? prev.camera?.longitude;
      const currLat = curr.latitude ?? curr.camera?.latitude;
      const currLon = curr.longitude ?? curr.camera?.longitude;
      
      if (prevLat && prevLon && currLat && currLon) {
        const dist = calculateHaversineDistance(prevLon, prevLat, currLon, currLat);
        const timeSecs = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000;
        
        if (dist != null && timeSecs > 0) {
          let speed = Math.round((dist / timeSecs) * 3.6 * 10) / 10;
          if (speed > 200) speed = null;
          
          if (speed !== null && speed !== curr.speed) {
            await prisma.detection.update({
              where: { id: curr.id },
              data: { speed }
            });
            count++;
          }
        }
      }
    }
  }
  console.log(`Updated ${count} detection records with realistic physical speeds.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
