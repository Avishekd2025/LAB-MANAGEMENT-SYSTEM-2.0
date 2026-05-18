const pool = require('../config/database');

// Approve Booking
exports.approveBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { comments } = req.body;

    const connection = await pool.getConnection();

    // Check if booking exists
    const [bookings] = await connection.query(
      'SELECT * FROM bookings WHERE booking_id = ?',
      [booking_id]
    );

    if (bookings.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if already approved/rejected
    const [existingApproval] = await connection.query(
      'SELECT * FROM approvals WHERE booking_id = ?',
      [booking_id]
    );

    if (existingApproval.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Booking already has an approval decision' });
    }

    // Create approval record
    await connection.query(
      'INSERT INTO approvals (booking_id, approved_by, decision, comments) VALUES (?, ?, ?, ?)',
      [booking_id, req.user.user_id, 'approved', comments || '']
    );

    // Update booking status
    await connection.query(
      'UPDATE bookings SET status = ? WHERE booking_id = ?',
      ['approved', booking_id]
    );

    // Update equipment status
    await connection.query(
      'UPDATE equipment SET status = ? WHERE equipment_id = ?',
      ['booked', bookings[0].equipment_id]
    );

    // Create notification
    await connection.query(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [bookings[0].user_id, 'Your booking has been approved', 'booking_approved']
    );

    connection.release();
    res.json({ message: 'Booking approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error approving booking', error: error.message });
  }
};

// Reject Booking
exports.rejectBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { comments } = req.body;

    const connection = await pool.getConnection();

    // Check if booking exists
    const [bookings] = await connection.query(
      'SELECT * FROM bookings WHERE booking_id = ?',
      [booking_id]
    );

    if (bookings.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if already approved/rejected
    const [existingApproval] = await connection.query(
      'SELECT * FROM approvals WHERE booking_id = ?',
      [booking_id]
    );

    if (existingApproval.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Booking already has an approval decision' });
    }

    // Create approval record
    await connection.query(
      'INSERT INTO approvals (booking_id, approved_by, decision, comments) VALUES (?, ?, ?, ?)',
      [booking_id, req.user.user_id, 'rejected', comments || '']
    );

    // Update booking status
    await connection.query(
      'UPDATE bookings SET status = ? WHERE booking_id = ?',
      ['rejected', booking_id]
    );

    // Create notification
    await connection.query(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [bookings[0].user_id, 'Your booking has been rejected', 'booking_rejected']
    );

    connection.release();
    res.json({ message: 'Booking rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting booking', error: error.message });
  }
};

// Get All Approvals
exports.getAllApprovals = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [approvals] = await connection.query(
      `SELECT a.*, b.booking_date, b.start_time, b.end_time,
              e.equipment_name, u.name as approved_by_name, u2.name as user_name
       FROM approvals a
       JOIN bookings b ON a.booking_id = b.booking_id
       JOIN equipment e ON b.equipment_id = e.equipment_id
       JOIN users u ON a.approved_by = u.user_id
       JOIN users u2 ON b.user_id = u2.user_id
       ORDER BY a.approval_date DESC`
    );

    connection.release();
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching approvals', error: error.message });
  }
};

// Get Pending Approvals
exports.getPendingApprovals = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [bookings] = await connection.query(
      `SELECT b.*, e.equipment_name, l.lab_name, u.name as user_name
       FROM bookings b
       JOIN equipment e ON b.equipment_id = e.equipment_id
       JOIN labs l ON e.lab_id = l.lab_id
       JOIN users u ON b.user_id = u.user_id
       WHERE b.status = 'pending'
       ORDER BY b.created_at ASC`
    );

    connection.release();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending approvals', error: error.message });
  }
};
