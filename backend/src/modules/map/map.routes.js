const { Router } = require('express');
const mapController = require('./map.controller');

const router = Router();

router.get('/overview', mapController.getMapOverview);

module.exports = router;
