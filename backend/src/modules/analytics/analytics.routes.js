const { Router } = require('express');
const analyticsController = require('./analytics.controller');

const router = Router();

router.get('/overview', analyticsController.getOverview);
router.get('/hourly', analyticsController.getHourly);
router.get('/cameras', analyticsController.getCameras);
router.get('/busiest-roads', analyticsController.getBusiestRoads);
router.get('/anomalies', analyticsController.getAnomalies);
router.get('/network', analyticsController.getNetwork);

module.exports = router;
