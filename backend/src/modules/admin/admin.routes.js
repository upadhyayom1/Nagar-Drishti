const { Router } = require('express');
const adminController = require('./admin.controller');
const { authenticate } = require('../../middleware/authenticate');

const router = Router();

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
  }
};

router.use(authenticate);
router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/complaints', adminController.getComplaints);
router.patch('/complaints/:id/status', adminController.updateComplaintStatus);
router.patch('/complaints/:id/priority', adminController.updateComplaintPriority);
router.get('/incidents', adminController.getIncidents);

module.exports = router;
