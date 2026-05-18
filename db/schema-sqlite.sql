-- SQLite Database Schema

CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  dept_id TEXT UNIQUE,
  session TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment (
  equipment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_name TEXT NOT NULL,
  department TEXT NOT NULL,
  serial_no TEXT UNIQUE,
  status TEXT DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  equipment_id INTEGER NOT NULL,
  booking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  deadline DATETIME NOT NULL,
  status TEXT DEFAULT 'active',
  fine_amount INTEGER DEFAULT 0,
  fine_status TEXT DEFAULT 'none',
  return_time DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Initial Data
INSERT OR IGNORE INTO equipment (equipment_id, equipment_name, department, serial_no, status) VALUES
(1, 'Oscilloscope X1', 'Physics', 'PHY-OSC-001', 'available'),
(2, 'Spectrometer V2', 'Physics', 'PHY-SPC-001', 'available'),
(3, 'MacBook Pro M2', 'CSE', 'CSE-MAC-001', 'available'),
(4, 'Arduino Mega Kit', 'CSE', 'CSE-ARD-001', 'available'),
(5, 'Multimeter Pro', 'EEE', 'EEE-MUL-001', 'available'),
(6, 'CNC Router Bit Set', 'Mechanical', 'MEC-CNC-001', 'available'),
(7, 'Gas Chromatograph', 'Chemistry', 'CHE-GAS-001', 'available');
