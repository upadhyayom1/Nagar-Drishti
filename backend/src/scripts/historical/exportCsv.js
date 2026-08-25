const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const { prisma } = require('../../lib/prisma');

async function exportCsv() {
  const exportDir = path.join(__dirname, '../../../data/exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const exportPath = path.join(exportDir, 'detections.csv');
  console.log(`Exporting detections to ${exportPath}...`);

  const csvWriter = createObjectCsvWriter({
    path: exportPath,
    header: [
      { id: 'id', title: 'detectionId' },
      { id: 'vehicleId', title: 'vehicleId' },
      { id: 'plateText', title: 'plateText' },
      { id: 'vehicleType', title: 'vehicleType' },
      { id: 'cameraId', title: 'cameraId' },
      { id: 'cameraCode', title: 'cameraCode' },
      { id: 'timestamp', title: 'timestamp' },
      { id: 'ocrConfidence', title: 'ocrConfidence' },
      { id: 'vehicleConfidence', title: 'vehicleConfidence' },
      { id: 'source', title: 'source' },
    ]
  });

  const BATCH_SIZE = 10000;
  let skip = 0;
  let totalExported = 0;

  while (true) {
    const detections = await prisma.detection.findMany({
      skip,
      take: BATCH_SIZE,
      include: {
        vehicle: true,
        camera: true
      }
    });

    if (detections.length === 0) break;

    const records = detections.map(d => ({
      id: d.id,
      vehicleId: d.vehicleId,
      plateText: d.plateText,
      vehicleType: d.vehicle ? d.vehicle.vehicleType : 'UNKNOWN',
      cameraId: d.cameraId,
      cameraCode: d.camera ? d.camera.cameraCode : 'UNKNOWN',
      timestamp: d.timestamp.toISOString(),
      ocrConfidence: d.ocrConfidence ? d.ocrConfidence.toFixed(4) : '',
      vehicleConfidence: d.vehicleConfidence ? d.vehicleConfidence.toFixed(4) : '',
      source: d.source
    }));

    await csvWriter.writeRecords(records);
    
    totalExported += records.length;
    skip += BATCH_SIZE;
    console.log(`Exported ${totalExported} records...`);
  }

  console.log(`✅ CSV Export Complete! Total rows: ${totalExported}`);
  await prisma.$disconnect();
}

exportCsv().catch(e => {
  console.error(e);
  process.exit(1);
});
