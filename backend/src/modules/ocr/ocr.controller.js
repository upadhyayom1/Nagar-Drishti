const ocrService = require('./ocr.service');
const { prisma } = require('../../lib/prisma');
const { recordDetection } = require('../detection/detection.service');

const getStatus = async (req, res) => {
  const status = await ocrService.getStatus();
  res.status(200).json({
    success: true,
    data: status,
  });
};

const recognizePlates = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one plate image is required',
      });
    }

    const { cameraId, captureTime } = req.body;

    if (!cameraId) {
      return res.status(400).json({
        success: false,
        message: 'Camera ID is required',
      });
    }

    const timestamp = captureTime || new Date().toISOString();
    const camera = await prisma.camera.findFirst({ where: { OR: [{ id: cameraId }, { cameraCode: cameraId }] } });
    if (!camera) return res.status(404).json({ success: false, message: 'Camera not found' });

    const results = [];

    for (const [index, file] of req.files.entries()) {
      try {
        const platesFound = await ocrService.recognizePlate(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        if (!platesFound || platesFound.length === 0) {
          results.push({ sourceFile: file.originalname, detected: false, confidence: 0, error: 'No plates detected.' });
          continue;
        }

        for (const plateResult of platesFound) {
          const plateNumber = String(plateResult.plateNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
          
          if (!plateNumber) continue;

          const vehicle = await prisma.vehicle.upsert({
            where: { plateNumber },
            update: { lastSeen: new Date(timestamp) },
            create: { plateNumber, firstSeen: new Date(timestamp), lastSeen: new Date(timestamp) },
          });
          
          const recorded = await recordDetection({
            vehicleId: vehicle.id,
            cameraId: camera.id,
            plateText: plateNumber,
            timestamp: new Date(timestamp),
            ocrConfidence: plateResult.confidence,
            source: 'AI',
          });
          
          results.push({
            sourceFile: file.originalname,
            detected: true,
            plateNumber,
            confidence: Math.round(plateResult.confidence * 1000) / 10,
            detectionId: recorded.detection.id,
            timestamp: recorded.detection.timestamp,
            isBlacklisted: recorded.detection.isBlacklisted,
          });
        }
      } catch (fileError) {
        results.push({
          sourceFile: file.originalname,
          detected: false,
          confidence: 0,
          error: fileError.message || 'Recognition failed for this image',
        });
      }

      if (index < req.files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    }

    return res.status(200).json({
      success: true,
      data: { results },
    });
  } catch (error) {
    console.error('OCR Controller Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to process plate images',
    });
  }
};

module.exports = {
  getStatus,
  recognizePlates,
};
