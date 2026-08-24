const express = require('express');
const blacklistController = require('./blacklist.controller');

const router = express.Router();

router.get('/', blacklistController.getBlacklistedVehicles);
router.post('/', blacklistController.addBlacklistedVehicle);
router.patch('/:id/deactivate', blacklistController.deactivateBlacklistedVehicle);
router.delete('/:id', blacklistController.deactivateBlacklistedVehicle);

router.get('/alerts', blacklistController.getAlerts);
router.get('/check/:plateNumber', blacklistController.checkPlate);

module.exports = router;
