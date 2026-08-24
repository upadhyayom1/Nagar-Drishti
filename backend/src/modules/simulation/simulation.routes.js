const express = require('express');
const simController = require('./simulation.controller');

const router = express.Router();

router.get('/state', simController.getState);
router.post('/start', simController.start);
router.post('/pause', simController.pause);
router.post('/reset', simController.reset);
router.post('/speed', simController.setSpeed);

module.exports = router;
