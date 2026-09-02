const { Router } = require('express');
const authController = require('./auth.controller');
const { authenticate } = require('../../middleware/authenticate');

const router = Router();

router.post('/login', authController.login);

router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
module.exports = router;
