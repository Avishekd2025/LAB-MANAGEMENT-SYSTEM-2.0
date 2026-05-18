const pool = require('../config/database');

exports.getAvailableEquipment = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [equipment] = await connection.query(
      'SELECT * FROM equipment WHERE status = "available" ORDER BY department, equipment_name'
    );
    connection.release();
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching equipment', error: error.message });
  }
};

exports.getDepartmentEquipment = async (req, res) => {
    try {
      const department = req.user.department;
      const connection = await pool.getConnection();
      const [equipment] = await connection.query(
        'SELECT * FROM equipment WHERE department = ?',
        [department]
      );
      connection.release();
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching equipment', error: error.message });
    }
  };
