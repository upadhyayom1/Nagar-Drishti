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

const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, cameraId, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (cameraId) where.cameraId = cameraId;
    if (search) where.plateNumber = { contains: search, mode: 'insensitive' };

    const [total, history] = await Promise.all([
      prisma.plateDetectionHistory.count({ where }),
      prisma.plateDetectionHistory.findMany({
        where,
        include: {
          camera: { select: { name: true, cameraCode: true } },
          user: { select: { username: true, name: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items: history,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    console.error('OCR History Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch detection history' });
  }
};

const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await prisma.plateDetectionHistory.findUnique({
      where: { id },
      include: {
        camera: true,
        user: { select: { id: true, username: true, name: true } },
      },
    });

    if (!history) return res.status(404).json({ success: false, message: 'History record not found' });

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error('OCR History Detail Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch detection details' });
  }
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
          
          const sourceType = file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
          const historyRecord = await prisma.plateDetectionHistory.create({
            data: {
              plateNumber,
              confidenceScore: Math.round(plateResult.confidence * 1000) / 10,
              cameraId: camera.id,
              timestamp: new Date(timestamp),
              sourceType,
              userId: req.user?.id || null,
            }
          });
          
          results.push({
            sourceFile: file.originalname,
            detected: true,
            plateNumber,
            confidence: Math.round(plateResult.confidence * 1000) / 10,
            status: plateResult.status || (plateResult.confidence >= 0.85 ? 'VERIFIED' : 'UNCERTAIN'),
            framesUsed: plateResult.framesUsed || 1,
            reason: plateResult.reason || null,
            detectionId: recorded.detection.id,
            historyId: historyRecord.id,
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
  getHistory,
  getHistoryById,
};
