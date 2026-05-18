-- Lab Equipment Booking System Database Schema (V2)

CREATE DATABASE IF NOT EXISTS lab_booking_system;
USE lab_booking_system;

-- 1. User Table
CREATE TABLE IF NOT EXISTS users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  role ENUM('student', 'lab_assistant') NOT NULL,
  department VARCHAR(100) NOT NULL,
  dept_id VARCHAR(7) UNIQUE, -- Format: 12CSE34
  session VARCHAR(50),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_department (department)
);

-- 2. Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
  equipment_id INT PRIMARY KEY AUTO_INCREMENT,
  equipment_name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  serial_no VARCHAR(100) UNIQUE,
  status ENUM('available', 'booked', 'under_maintenance', 'damaged') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_department (department)
);

-- 3. Booking Table
CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  equipment_id INT NOT NULL,
  booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deadline TIMESTAMP NOT NULL,
  status ENUM('active', 'returned_ontime', 'returned_late') DEFAULT 'active',
  fine_amount INT DEFAULT 0,
  fine_status ENUM('none', 'pending', 'paid') DEFAULT 'none',
  return_time TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE CASCADE,
  INDEX idx_booking_user_id (user_id),
  INDEX idx_booking_status (status)
);

-- 4. Notification Table
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  message VARCHAR(500) NOT NULL,
  type ENUM('booking_confirmation', 'warning', 'fine_update', 'return_confirmation', 'completion') NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read)
);

-- 5. Seed Initial Equipment Data for Testing
INSERT IGNORE INTO equipment (equipment_id, equipment_name, department, serial_no, status) VALUES
(1, 'Oscilloscope X1', 'Physics', 'PHY-OSC-001', 'available'),
(2, 'Spectrometer V2', 'Physics', 'PHY-SPC-001', 'available'),
(3, 'MacBook Pro M2', 'CSE', 'CSE-MAC-001', 'available'),
(4, 'Arduino Mega Kit', 'CSE', 'CSE-ARD-001', 'available'),
(5, 'Multimeter Pro', 'EEE', 'EEE-MUL-001', 'available');
