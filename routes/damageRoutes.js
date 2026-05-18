const express = require('express');
const router = express.Router();
const damageController = require('../controllers/damageController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Report damage
router.post('/', authMiddleware, damageController.reportDamage);

// Get all damage reports
router.get('/', 
  authMiddleware, 
  roleMiddleware(['admin', 'lab_assistant']), 
  damageController.getAllDamageReports
);

// Get equipment damage reports
router.get('/equipment/:equipment_id', 
  authMiddleware, 
  damageController.getEquipmentDamageReports
);

// Update damage report status
router.put('/:report_id/status', 
  authMiddleware, 
  roleMiddleware(['admin', 'lab_assistant']), 
  damageController.updateDamageReportStatus
);

module.exports = router;
