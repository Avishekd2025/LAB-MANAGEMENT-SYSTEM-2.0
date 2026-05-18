const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Get all labs
router.get('/', labController.getAllLabs);

// Get lab by ID
router.get('/:lab_id', labController.getLabById);

// Get equipment by lab
router.get('/:lab_id/equipment', labController.getEquipmentByLab);

// Get equipment status report
router.get('/reports/status', labController.getEquipmentStatusReport);

// Create lab (Admin only)
router.post('/', 
  authMiddleware, 
  roleMiddleware(['admin']), 
  labController.createLab
);

module.exports = router;
