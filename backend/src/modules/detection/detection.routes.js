const express = require('express');
const router = express.Router();
const detectionController = require('./detection.controller');

router.get('/', detectionController.getRecentDetections);
router.get('/camera/:cameraId', detectionController.getCameraDetections);
router.get('/:vehicleId', detectionController.getVehicleDetections);

module.exports = router;
