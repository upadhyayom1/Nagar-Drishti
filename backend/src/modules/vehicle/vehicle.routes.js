const express = require('express');

const vehicleController = require('./vehicle.controller');

const router = express.Router();

router.get('/', vehicleController.getVehicles);
router.get('/search', vehicleController.searchVehicle);
router.get('/search/:plateNumber', vehicleController.searchVehicle);
router.get('/recent', vehicleController.getRecentVehicles);
router.get('/journey/:plateNumber', vehicleController.getVehicleJourney);
router.get('/:plateNumber', vehicleController.getVehicle);


module.exports = router;
