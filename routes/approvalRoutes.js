const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Get pending approvals
router.get('/pending', 
  authMiddleware, 
  roleMiddleware(['admin', 'lab_assistant']), 
  approvalController.getPendingApprovals
);

// Get all approvals
router.get('/', 
  authMiddleware, 
  roleMiddleware(['admin', 'lab_assistant']), 
  approvalController.getAllApprovals
);

// Approve booking
router.post('/:booking_id/approve', 
  authMiddleware, 
  roleMiddleware(['admin', 'lab_assistant']), 
  approvalController.approveBooking
);

// Reject booking
router.post('/:booking_id/reject', 
  authMiddleware, 
  roleMiddleware(['admin', 'lab_assistant']), 
  approvalController.rejectBooking
);

module.exports = router;
