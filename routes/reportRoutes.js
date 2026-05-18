const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Most Used Equipment Report
router.get('/reports/most-used', 
  authMiddleware, 
  roleMiddleware(['admin', 'lab_assistant']), 
  async (req, res) => {
    try {
      const connection = await pool.getConnection();
      
      const [report] = await connection.query(
        `SELECT e.equipment_id, e.equipment_name, l.lab_name,
                COUNT(b.booking_id) as total_bookings
         FROM equipment e
         JOIN labs l ON e.lab_id = l.lab_id
         LEFT JOIN bookings b ON e.equipment_id = b.equipment_id AND b.status = 'completed'
         GROUP BY e.equipment_id, e.equipment_name, l.lab_name
         ORDER BY total_bookings DESC
         LIMIT 20`
      );
      
      connection.release();
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching report', error: error.message });
    }
  }
);

// Lab-wise Usage Report
router.get('/reports/lab-usage', 
  authMiddleware, 
  roleMiddleware(['admin', 'lab_assistant']), 
  async (req, res) => {
    try {
      const connection = await pool.getConnection();
      
      const [report] = await connection.query(
        `SELECT l.lab_id, l.lab_name, l.department,
                COUNT(b.booking_id) as total_bookings,
                COUNT(DISTINCT e.equipment_id) as equipment_count,
                SUM(CASE WHEN e.status = 'available' THEN 1 ELSE 0 END) as available_equipment
         FROM labs l
         LEFT JOIN equipment e ON l.lab_id = e.lab_id
         LEFT JOIN bookings b ON e.equipment_id = b.equipment_id
         GROUP BY l.lab_id, l.lab_name, l.department
         ORDER BY total_bookings DESC`
      );
      
      connection.release();
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching report', error: error.message });
    }
  }
);

// User-wise Booking History
router.get('/reports/user-booking/:user_id', 
  authMiddleware, 
  async (req, res) => {
    try {
      const connection = await pool.getConnection();
      
      const [report] = await connection.query(
        `SELECT b.booking_id, b.booking_date, b.start_time, b.end_time,
                e.equipment_name, b.status, l.lab_name
         FROM bookings b
         JOIN equipment e ON b.equipment_id = e.equipment_id
         JOIN labs l ON e.lab_id = l.lab_id
         WHERE b.user_id = ?
         ORDER BY b.booking_date DESC`,
        [req.params.user_id]
      );
      
      connection.release();
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching report', error: error.message });
    }
  }
);

// Idle Equipment List
router.get('/reports/idle-equipment', 
  authMiddleware, 
  roleMiddleware(['admin', 'lab_assistant']), 
  async (req, res) => {
    try {
      const connection = await pool.getConnection();
      
      const [report] = await connection.query(
        `SELECT e.equipment_id, e.equipment_name, l.lab_name,
                e.purchase_date, e.status,
                MAX(b.booking_date) as last_booking_date,
                DATEDIFF(CURDATE(), MAX(b.booking_date)) as days_idle
         FROM equipment e
         JOIN labs l ON e.lab_id = l.lab_id
         LEFT JOIN bookings b ON e.equipment_id = b.equipment_id
         WHERE e.status = 'available'
         GROUP BY e.equipment_id, e.equipment_name, l.lab_name, e.purchase_date, e.status
         HAVING days_idle > 30 OR last_booking_date IS NULL
         ORDER BY days_idle DESC`
      );
      
      connection.release();
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching report', error: error.message });
    }
  }
);

// Dashboard Statistics
router.get('/reports/dashboard-stats', 
  authMiddleware, 
  roleMiddleware(['admin']), 
  async (req, res) => {
    try {
      const connection = await pool.getConnection();
      
      const [totalUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
      const [totalEquipment] = await connection.query('SELECT COUNT(*) as count FROM equipment');
      const [totalBookings] = await connection.query('SELECT COUNT(*) as count FROM bookings');
      const [pendingBookings] = await connection.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'");
      const [availableEquipment] = await connection.query("SELECT COUNT(*) as count FROM equipment WHERE status = 'available'");
      const [maintenanceEquipment] = await connection.query("SELECT COUNT(*) as count FROM equipment WHERE status = 'under_maintenance'");
      
      connection.release();
      
      res.json({
        total_users: totalUsers[0][0].count,
        total_equipment: totalEquipment[0][0].count,
        total_bookings: totalBookings[0][0].count,
        pending_bookings: pendingBookings[0][0].count,
        available_equipment: availableEquipment[0][0].count,
        maintenance_equipment: maintenanceEquipment[0][0].count
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
  }
);

module.exports = router;
