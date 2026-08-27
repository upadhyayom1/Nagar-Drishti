const { Router } = require('express');
const trafficController = require('./traffic.controller');

const router = Router();

router.get('/', trafficController.getRoadTrafficData);
router.get('/summary', trafficController.getTrafficSummary);
router.get('/roads/:id', trafficController.getRoadTraffic);

module.exports = router;
