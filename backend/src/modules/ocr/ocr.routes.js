const { Router } = require('express');
const multer = require('multer');
const ocrController = require('./ocr.controller');

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  '/',
  upload.array('plateImages', 20),
  ocrController.recognizePlates
);

module.exports = router;