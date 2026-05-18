const pool = require('../config/database');

// Report Damage
exports.reportDamage = async (req, res) => {
  try {
    const { equipment_id, description } = req.body;

    if (!equipment_id || !description) {
      return res.status(400).json({ message: 'Equipment ID and description are required' });
    }

    const connection = await pool.getConnection();

    // Create damage report
    await connection.query(
      'INSERT INTO damage_reports (equipment_id, reported_by, description, status) VALUES (?, ?, ?, ?)',
      [equipment_id, req.user.user_id, description, 'pending']
    );

    // Update equipment status
    await connection.query(
      'UPDATE equipment SET status = ? WHERE equipment_id = ?',
      ['damaged', equipment_id]
    );

    connection.release();
    res.status(201).json({ message: 'Damage report created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error reporting damage', error: error.message });
  }
};

// Get All Damage Reports
exports.getAllDamageReports = async (req, res) => {
  try {
    const { status, equipment_id } = req.query;
    const connection = await pool.getConnection();

    let query = `SELECT d.*, e.equipment_name, l.lab_name, u.name as reported_by_name
                 FROM damage_reports d
                 JOIN equipment e ON d.equipment_id = e.equipment_id
                 JOIN labs l ON e.lab_id = l.lab_id
                 JOIN users u ON d.reported_by = u.user_id
                 WHERE 1=1`;
    let params = [];

    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }

    if (equipment_id) {
      query += ' AND d.equipment_id = ?';
      params.push(equipment_id);
    }

    query += ' ORDER BY d.report_date DESC';

    const [reports] = await connection.query(query, params);

    connection.release();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching damage reports', error: error.message });
  }
};

// Update Damage Report Status
exports.updateDamageReportStatus = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const connection = await pool.getConnection();

    // Get damage report
    const [reports] = await connection.query(
      'SELECT * FROM damage_reports WHERE report_id = ?',
      [report_id]
    );

    if (reports.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Damage report not found' });
    }

    // Update damage report status
    await connection.query(
      'UPDATE damage_reports SET status = ? WHERE report_id = ?',
      [status, report_id]
    );

    connection.release();
    res.json({ message: 'Damage report status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating damage report status', error: error.message });
  }
};

// Get Equipment Damage Reports
exports.getEquipmentDamageReports = async (req, res) => {
  try {
    const { equipment_id } = req.params;
    const connection = await pool.getConnection();

    const [reports] = await connection.query(
      `SELECT d.*, u.name as reported_by_name
       FROM damage_reports d
       JOIN users u ON d.reported_by = u.user_id
       WHERE d.equipment_id = ?
       ORDER BY d.report_date DESC`,
      [equipment_id]
    );

    connection.release();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching damage reports', error: error.message });
  }
};
