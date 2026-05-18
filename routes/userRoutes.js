const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public Routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected Routes
router.get('/profile', authMiddleware, userController.getUserProfile);
router.put('/profile', authMiddleware, userController.updateUserProfile);


module.exports = router;
