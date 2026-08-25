const { Router } = require('express');
const alertController = require('./alert.controller');

const router = Router();

router.get('/', alertController.getAlerts);
router.get('/active/count', alertController.getActiveAlertCount);

module.exports = router;
