const pool = require('../config/database');
const moment = require('moment');

// Utility to calculate fine
const calculateFine = (deadline, returnTime = null) => {
  const endTime = returnTime ? moment(returnTime) : moment();
  const deadTime = moment(deadline);
  
  if (endTime.isBefore(deadTime)) return 0;
  
  const diffMinutes = endTime.diff(deadTime, 'minutes');
  // Fine starts after 5 minutes of grace period beyond the deadline
  if (diffMinutes > 5) {
    const extraMinutes = diffMinutes - 5;
    return extraMinutes * 20;
  }
  return 0;
};

// Create a booking
exports.createBooking = async (req, res) => {
  try {
    const { equipment_id } = req.body;
    const user_id = req.user.user_id;
    const department = req.user.department;

    const connection = await pool.getConnection();

    // Check equipment availability
    const [equipment] = await connection.query(
      'SELECT * FROM equipment WHERE equipment_id = ?',
      [equipment_id]
    );

    if (equipment.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Equipment not found' });
    }

    if (equipment[0].status !== 'available') {
      connection.release();
      return res.status(400).json({ message: 'Equipment is not available' });
    }



    const booking_time = moment().format('YYYY-MM-DD HH:mm:ss');
    const deadline = moment().add(2, 'minutes').format('YYYY-MM-DD HH:mm:ss'); // 2 min max duration

    // Create booking
    const [result] = await connection.query(
      'INSERT INTO bookings (user_id, equipment_id, booking_time, deadline, status) VALUES (?, ?, ?, ?, ?)',
      [user_id, equipment_id, booking_time, deadline, 'active']
    );

    // Update equipment status
    await connection.query(
      'UPDATE equipment SET status = "booked" WHERE equipment_id = ?',
      [equipment_id]
    );

    // Get the newly created booking details to emit
    const [newBooking] = await connection.query(
      `SELECT b.*, e.equipment_name, u.name as user_name, u.dept_id 
       FROM bookings b 
       JOIN equipment e ON b.equipment_id = e.equipment_id 
       JOIN users u ON b.user_id = u.user_id 
       WHERE b.booking_id = ?`,
      [result.insertId]
    );

    connection.release();
    
    // Emit real-time event to lab assistants in that equipment's department
    if (req.io) {
        req.io.to(`dept_${equipment[0].department}`).emit('new_booking', newBooking[0]);
    }

    res.status(201).json({ message: 'Equipment booked successfully', data: newBooking[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
};

// Return Equipment (Lab Assistant clicks Yes)
exports.returnEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [bookings] = await connection.query(
      'SELECT * FROM bookings WHERE booking_id = ?',
      [id]
    );

    if (bookings.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookings[0];
    if (booking.status !== 'active' && booking.status !== 'returned_late') {
        connection.release();
        return res.status(400).json({ message: 'Booking already closed' });
    }

    const returnTimeStr = moment().format('YYYY-MM-DD HH:mm:ss');
    const fineAmount = calculateFine(booking.deadline, returnTimeStr);
    
    let newStatus = 'returned_ontime'; // Pink bar
    if (moment().isAfter(moment(booking.deadline))) {
        newStatus = 'returned_late'; // Purple/Pink bar
    }

    const fineStatus = fineAmount > 0 ? 'pending' : 'none';

    await connection.query(
      'UPDATE bookings SET status = ?, return_time = ?, fine_amount = ?, fine_status = ? WHERE booking_id = ?',
      [newStatus, returnTimeStr, fineAmount, fineStatus, id]
    );

    await connection.query(
      'UPDATE equipment SET status = "available" WHERE equipment_id = ?',
      [booking.equipment_id]
    );

    connection.release();

    // Create a notification for the student
    const notifMsg = `Equipment returned successfully. ${fineAmount > 0 ? 'Fine applied: ' + fineAmount + ' TK' : ''}`;
    
    const conn2 = await pool.getConnection();
    await conn2.query(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [booking.user_id, notifMsg, 'return_confirmation']
    );
    conn2.release();

    if (req.io) {
        req.io.to(`user_${booking.user_id}`).emit('notification', { message: notifMsg, type: 'return_confirmation' });
        req.io.to(`dept_${req.user.department}`).emit('booking_updated', { booking_id: id, status: newStatus, fine_amount: fineAmount });
    }

    res.json({ message: 'Equipment returned successfully', status: newStatus, fine: fineAmount });
  } catch (error) {
    res.status(500).json({ message: 'Error returning equipment', error: error.message });
  }
};

// Send Warning (Lab Assistant clicks Red bar)
exports.sendWarning = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();

        const [bookings] = await connection.query(
            'SELECT * FROM bookings WHERE booking_id = ?',
            [id]
        );

        if (bookings.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Booking not found' });
        }

        const booking = bookings[0];
        
        // Ensure it's overdue
        if (moment().isBefore(moment(booking.deadline))) {
            connection.release();
            return res.status(400).json({ message: 'Deadline has not passed yet' });
        }

        const notifMsg = `URGENT: Your booking deadline has passed. Please return the equipment immediately to avoid fines.`;
        
        await connection.query(
            'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
            [booking.user_id, notifMsg, 'warning']
        );
        
        connection.release();

        if (req.io) {
            req.io.to(`user_${booking.user_id}`).emit('notification', { message: notifMsg, type: 'warning' });
        }

        res.json({ message: 'Warning sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending warning', error: error.message });
    }
};

// Get User Bookings
exports.getUserBookings = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [bookings] = await connection.query(
      `SELECT b.*, e.equipment_name, e.department 
       FROM bookings b 
       JOIN equipment e ON b.equipment_id = e.equipment_id 
       WHERE b.user_id = ? ORDER BY b.booking_time DESC`,
      [req.user.user_id]
    );

    // Calculate dynamic fine for active bookings
    const updatedBookings = bookings.map(b => {
      if (b.status === 'active') {
        b.current_fine = calculateFine(b.deadline);
      } else {
        b.current_fine = b.fine_amount;
      }
      return b;
    });

    connection.release();
    res.json(updatedBookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
};

// Get Department Bookings (Lab Assistant Dashboard)
exports.getDepartmentBookings = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [bookings] = await connection.query(
          `SELECT b.*, e.equipment_name, u.name as user_name, u.dept_id 
           FROM bookings b 
           JOIN equipment e ON b.equipment_id = e.equipment_id 
           JOIN users u ON b.user_id = u.user_id 
           WHERE e.department = ? ORDER BY b.booking_time DESC`,
          [req.user.department]
        );
    
        // Calculate dynamic fine for active bookings
        const updatedBookings = bookings.map(b => {
          if (b.status === 'active') {
            b.current_fine = calculateFine(b.deadline);
          } else {
            b.current_fine = b.fine_amount;
          }
          return b;
        });
    
        connection.release();
        res.json(updatedBookings);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error: error.message });
      }
};
