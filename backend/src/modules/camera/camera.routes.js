const express = require('express');
const cameraController = require('./camera.controller');

const router = express.Router();

router.get('/', cameraController.getCameras);
router.get('/traffic', cameraController.getTraffic);
router.get('/:id', cameraController.getCamera);

module.exports = router;
