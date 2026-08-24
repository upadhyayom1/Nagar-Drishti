const ocrService = require('./ocr.service');

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

    const results = [];

for (const file of req.files) {
  const result = await ocrService.recognizePlate(
    file.buffer,
    file.originalname,
    file.mimetype
  );

  results.push({
    plateNumber: result.plateNumber,
    confidence: result.confidence,
    cameraId,
    timestamp,
  });

  // Avoid Plate Recognizer rate limiting
  await new Promise(resolve => setTimeout(resolve, 1100));
}

    return res.status(200).json({
      success: true,
      data: results,
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
  recognizePlates,
};