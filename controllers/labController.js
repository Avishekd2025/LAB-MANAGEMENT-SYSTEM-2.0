const pool = require('../config/database');

// Get All Labs
exports.getAllLabs = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [labs] = await connection.query(
      'SELECT * FROM labs ORDER BY lab_name'
    );

    connection.release();
    res.json(labs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching labs', error: error.message });
  }
};

// Get Lab by ID
exports.getLabById = async (req, res) => {
  try {
    const { lab_id } = req.params;
    const connection = await pool.getConnection();

    const [labs] = await connection.query(
      'SELECT * FROM labs WHERE lab_id = ?',
      [lab_id]
    );

    if (labs.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Lab not found' });
    }

    connection.release();
    res.json(labs[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lab', error: error.message });
  }
};

// Create Lab (Admin Only)
exports.createLab = async (req, res) => {
  try {
    const { lab_name, department, location, capacity } = req.body;

    if (!lab_name || !department) {
      return res.status(400).json({ message: 'Lab name and department are required' });
    }

    const connection = await pool.getConnection();

    await connection.query(
      'INSERT INTO labs (lab_name, department, location, capacity) VALUES (?, ?, ?, ?)',
      [lab_name, department, location || '', capacity || 0]
    );

    connection.release();
    res.status(201).json({ message: 'Lab created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating lab', error: error.message });
  }
};

// Get Equipment by Lab
exports.getEquipmentByLab = async (req, res) => {
  try {
    const { lab_id } = req.params;
    const connection = await pool.getConnection();

    const [equipment] = await connection.query(
      'SELECT e.*, l.lab_name FROM equipment e JOIN labs l ON e.lab_id = l.lab_id WHERE e.lab_id = ? ORDER BY e.equipment_name',
      [lab_id]
    );

    connection.release();
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching equipment', error: error.message });
  }
};

// Get Equipment Status Report
exports.getEquipmentStatusReport = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [report] = await connection.query(
      `SELECT 
        status,
        COUNT(*) as count
      FROM equipment
      GROUP BY status`
    );

    connection.release();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
};
