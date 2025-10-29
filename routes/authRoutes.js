const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login route
router.post('/login', authController.login);

// Logout route
router.post('/logout', authController.logout);

// Get current user route
router.get('/me', authController.getCurrentUser);
router.get('/current-user', authController.getCurrentUser);

module.exports = router;
