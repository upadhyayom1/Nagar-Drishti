const { Router } = require('express');
const complaintsController = require('./complaints.controller');
const { authenticate } = require('../../middleware/authenticate');

const router = Router();

router.use(authenticate);

router.post('/', complaintsController.create);
router.get('/my', complaintsController.getMyComplaints);
router.get('/map', complaintsController.getMapComplaints);
router.get('/', complaintsController.getAll);
router.patch('/:id', complaintsController.update);

module.exports = router;
