const { Router } = require('express');
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/authenticate');

const router = Router();

router.use(authenticate);

router.get('/me', usersController.me);
router.patch('/me', usersController.updateMe);
router.get('/me/trips', usersController.getMyTrips);
router.get('/me/complaints', usersController.getMyComplaints);
router.get('/me/incidents', usersController.getMyIncidents);

module.exports = router;
