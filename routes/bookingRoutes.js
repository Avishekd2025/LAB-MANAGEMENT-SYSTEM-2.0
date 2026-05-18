const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Student Routes
router.post('/', roleMiddleware(['student']), bookingController.createBooking);
router.get('/user/my-bookings', roleMiddleware(['student']), bookingController.getUserBookings);

// Lab Assistant Routes
router.get('/department', roleMiddleware(['lab_assistant']), bookingController.getDepartmentBookings);
router.put('/:id/return', roleMiddleware(['lab_assistant']), bookingController.returnEquipment);
router.post('/:id/warn', roleMiddleware(['lab_assistant']), bookingController.sendWarning);

module.exports = router;
