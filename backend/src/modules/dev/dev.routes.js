const express = require('express');
const devController = require('./dev.controller');

const router = express.Router();

router.post('/create-user', devController.createUser);
router.post('/simulate-detection', devController.simulateDetection);

module.exports = router;
