const { Router } = require('express');
const mlController = require('./ml.controller');

const router = Router();

router.get('/analyze/:identifier', mlController.analyzeVehicle);

module.exports = router;