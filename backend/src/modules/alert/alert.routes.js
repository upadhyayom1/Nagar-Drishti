const { Router } = require('express');
const alertController = require('./alert.controller');

const router = Router();

router.get('/', alertController.getAlerts);
router.get('/active/count', alertController.getActiveAlertCount);
router.patch('/:id', alertController.updateAlertStatus);

module.exports = router;
