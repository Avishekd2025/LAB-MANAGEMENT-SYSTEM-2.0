const pool = require('../config/database');

// Create Maintenance Record
exports.createMaintenance = async (req, res) => {
  try {
    const { equipment_id, issue } = req.body;

    if (!equipment_id || !issue) {
      return res.status(400).json({ message: 'Equipment ID and issue are required' });
    }

    const connection = await pool.getConnection();

    // Create maintenance record
    await connection.query(
      'INSERT INTO maintenance (equipment_id, issue, status) VALUES (?, ?, ?)',
      [equipment_id, issue, 'pending']
    );

    // Update equipment status
    await connection.query(
      'UPDATE equipment SET status = ? WHERE equipment_id = ?',
      ['under_maintenance', equipment_id]
    );

    connection.release();
    res.status(201).json({ message: 'Maintenance record created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating maintenance record', error: error.message });
  }
};

// Get All Maintenance Records
exports.getAllMaintenanceRecords = async (req, res) => {
  try {
    const { status, equipment_id } = req.query;
    const connection = await pool.getConnection();

    let query = `SELECT m.*, e.equipment_name, l.lab_name
                 FROM maintenance m
                 JOIN equipment e ON m.equipment_id = e.equipment_id
                 JOIN labs l ON e.lab_id = l.lab_id
                 WHERE 1=1`;
    let params = [];

    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }

    if (equipment_id) {
      query += ' AND m.equipment_id = ?';
      params.push(equipment_id);
    }

    query += ' ORDER BY m.start_date DESC';

    const [records] = await connection.query(query, params);

    connection.release();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance records', error: error.message });
  }
};

// Update Maintenance Status
exports.updateMaintenanceStatus = async (req, res) => {
  try {
    const { maintenance_id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const connection = await pool.getConnection();

    // Get maintenance record
    const [records] = await connection.query(
      'SELECT * FROM maintenance WHERE maintenance_id = ?',
      [maintenance_id]
    );

    if (records.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    // Update maintenance status
    const endDate = status === 'completed' ? new Date() : null;
    await connection.query(
      'UPDATE maintenance SET status = ?, end_date = ? WHERE maintenance_id = ?',
      [status, endDate, maintenance_id]
    );

    // If maintenance is completed, update equipment status to available
    if (status === 'completed') {
      await connection.query(
        'UPDATE equipment SET status = ? WHERE equipment_id = ?',
        ['available', records[0].equipment_id]
      );
    }

    connection.release();
    res.json({ message: 'Maintenance status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating maintenance status', error: error.message });
  }
};

// Get Equipment Maintenance History
exports.getEquipmentMaintenanceHistory = async (req, res) => {
  try {
    const { equipment_id } = req.params;
    const connection = await pool.getConnection();

    const [records] = await connection.query(
      `SELECT m.* FROM maintenance m
       WHERE m.equipment_id = ?
       ORDER BY m.start_date DESC`,
      [equipment_id]
    );

    connection.release();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance history', error: error.message });
  }
};
