const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Create maintenance record
router.post('/', 
  authMiddleware, 
  roleMiddleware(['admin', 'lab_assistant']), 
  maintenanceController.createMaintenance
);

// Get all maintenance records
router.get('/', 
  authMiddleware, 
  roleMiddleware(['admin', 'lab_assistant']), 
  maintenanceController.getAllMaintenanceRecords
);

// Get equipment maintenance history
router.get('/equipment/:equipment_id', 
  authMiddleware, 
  maintenanceController.getEquipmentMaintenanceHistory
);

// Update maintenance status
router.put('/:maintenance_id/status', 
  authMiddleware, 
  roleMiddleware(['admin', 'lab_assistant']), 
  maintenanceController.updateMaintenanceStatus
);

module.exports = router;
