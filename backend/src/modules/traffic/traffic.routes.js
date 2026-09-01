const { Router } = require('express');
const trafficController = require('./traffic.controller');

const router = Router();

router.get('/', trafficController.getRoadTrafficData);
router.get('/summary', trafficController.getTrafficSummary);
router.get('/roads/:id', trafficController.getRoadTraffic);

const { authenticate } = require('../../middleware/authenticate');
const { authorizeRoles } = require('../../middleware/authorize');

router.get('/forecast', authenticate, authorizeRoles('ADMIN'), trafficController.getForecast);

module.exports = router;
