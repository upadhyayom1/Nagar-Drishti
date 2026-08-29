const ocrService =
  require('./ocr.service');


const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );


const recognizePlates = async (
  req,
  res
) => {
  try {
    if (
      !req.files ||
      req.files.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'At least one image is required',
      });
    }


    const {
      cameraId,
      captureTime,
    } = req.body;


    if (!cameraId) {
      return res.status(400).json({
        success: false,
        message:
          'Camera ID is required',
      });
    }


    const timestamp =
      captureTime ||
      new Date().toISOString();


    const finalResults = [];


    for (const file of req.files) {
      if (
        !file.buffer ||
        file.size === 0
      ) {
        continue;
      }


      const detectedPlates =
        await ocrService
          .recognizePlates(
            file.buffer,
            file.originalname,
            file.mimetype
          );


      for (
        const plate of detectedPlates
      ) {
        finalResults.push({
          plateNumber:
            plate.plateNumber,

          confidence:
            plate.confidence,

          cameraId,

          timestamp,
        });
      }


      // Avoid Plate Recognizer 429
      await sleep(1100);
    }


    return res.status(200).json({
      success: true,
      data: finalResults,
    });

  } catch (error) {
    console.error(
      'OCR Controller Error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to process images',
    });
  }
};


module.exports = {
  recognizePlates,
};