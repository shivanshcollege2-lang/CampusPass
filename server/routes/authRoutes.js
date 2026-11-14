const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { googleStart, googleCallback } = require('../services/google');
router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/google', googleStart);
router.get('/google/callback', googleCallback);
module.exports = router;
