const { Router } = require('express');
const multer = require('multer');
const ocrController = require('./ocr.controller');

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 20,
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) return callback(null, true);
    return callback(new Error('Only image and video files can be processed for plate recognition'));
  },
});

router.get('/status', ocrController.getStatus);
router.post(
  '/',
  upload.array('plateImages', 20),
  ocrController.recognizePlates
);

module.exports = router;
