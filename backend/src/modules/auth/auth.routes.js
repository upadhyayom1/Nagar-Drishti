const { Router } = require('express');
const authController = require('./auth.controller');
const { authenticate } = require('../../middleware/authenticate');

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
module.exports = router;
