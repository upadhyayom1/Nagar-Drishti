const express = require('express');
<<<<<<< HEAD
const vehicleController = require('./vehicle.controller');

const router = express.Router();

router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicle);
=======
const { searchVehicle } = require('./vehicle.controller');
const router = express.Router();

router.get('/search/:plateNumber', searchVehicle);
>>>>>>> 5a4e8c3 (Update backend files)

module.exports = router;
