const express = require('express');
const router = express.Router();
const detectionController = require('./detection.controller');

router.get('/', detectionController.getRecentDetections);
router.post('/', detectionController.createDetection);
router.get('/recent', detectionController.getRecentDetections);
router.get('/camera/:cameraId', detectionController.getCameraDetections);
router.get('/vehicle/:plateNumber', detectionController.getVehicleDetections);

module.exports = router;
