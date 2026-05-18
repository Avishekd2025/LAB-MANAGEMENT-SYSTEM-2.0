const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const config = require('../config/config');

// Register User
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department, dept_id, session } = req.body;

    if (!name || !email || !password || !role || !department) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (role !== 'student' && role !== 'lab_assistant') {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (role === 'student') {
      if (!dept_id || !session) {
        return res.status(400).json({ message: 'dept_id and session are required for students' });
      }
      
      // Validate dept_id format: 2 numbers, 3 letters, 2 numbers (e.g. 12CSE34)
      const deptIdRegex = /^\d{2}[A-Za-z]{3}\d{2}$/;
      if (!deptIdRegex.test(dept_id)) {
        return res.status(400).json({ message: 'Invalid Department ID format. Expected format: 12CSE34' });
      }
    }

    const connection = await pool.getConnection();

    // Check if user already exists
    const [existingUser] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    if (role === 'student') {
       const [existingDeptId] = await connection.query(
         'SELECT * FROM users WHERE dept_id = ?',
         [dept_id]
       );
       if (existingDeptId.length > 0) {
          connection.release();
          return res.status(400).json({ message: 'Department ID already registered' });
       }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await connection.query(
      'INSERT INTO users (name, email, password_hash, role, department, dept_id, session) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, department, role === 'student' ? dept_id : null, role === 'student' ? session : null]
    );

    connection.release();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      connection.release();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        department: user.department,
        name: user.name
      },
      config.JWT_SECRET || 'fallback_secret',
      { expiresIn: config.JWT_EXPIRY || '7d' }
    );

    connection.release();

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        dept_id: user.dept_id,
        session: user.session
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT user_id, name, email, role, department, dept_id, session, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'User not found' });
    }

    connection.release();
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update User Profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, session } = req.body;
    const connection = await pool.getConnection();
    
    // Allow updating name and session
    await connection.query(
      'UPDATE users SET name = COALESCE(?, name), session = COALESCE(?, session) WHERE user_id = ?',
      [name, session, req.user.user_id]
    );

    connection.release();
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};
