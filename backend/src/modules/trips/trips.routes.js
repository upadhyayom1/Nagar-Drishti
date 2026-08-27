const { Router } = require('express');
const tripsController = require('./trips.controller');
const { authenticate } = require('../../middleware/authenticate');

const router = Router();

router.post('/plan', tripsController.plan);

// Protected routes
router.use(authenticate);
router.post('/', tripsController.create);
router.get('/', tripsController.getAll);
router.delete('/:id', tripsController.remove);

module.exports = router;
