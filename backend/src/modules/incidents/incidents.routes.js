const { Router } = require('express');
const incidentsController = require('./incidents.controller');

const router = Router();

router.get('/map', incidentsController.getMapIncidents);

module.exports = router;
