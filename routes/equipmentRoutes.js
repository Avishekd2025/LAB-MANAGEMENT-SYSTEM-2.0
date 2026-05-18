const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/available', equipmentController.getAvailableEquipment);
router.get('/department', equipmentController.getDepartmentEquipment);

module.exports = router;
