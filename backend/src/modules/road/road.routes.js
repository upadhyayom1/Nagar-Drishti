const express = require('express');
const roadController = require('./road.controller');

const router = express.Router();

router.get('/', roadController.getRoads);

module.exports = router;
