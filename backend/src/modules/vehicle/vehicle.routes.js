const express = require('express');
const vehicleController = require('./vehicle.controller');

const router = express.Router();

router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicle);

module.exports = router;
