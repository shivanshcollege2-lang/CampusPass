CREATE DATABASE IF NOT EXISTS accessflow;
USE accessflow;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  google_id VARCHAR(255) NULL UNIQUE,
  role ENUM('student','admin','security') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pass_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  pass_type ENUM('Entry','Exit') NOT NULL,
  request_date DATE NOT NULL,
  request_time TIME NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  status ENUM('pending','approved','rejected','verified','used','expired') NOT NULL DEFAULT 'pending',
  admin_note VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS passes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL UNIQUE,
  pass_code VARCHAR(80) NOT NULL UNIQUE,
  qr_payload TEXT NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  FOREIGN KEY (request_id) REFERENCES pass_requests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS access_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pass_id INT NOT NULL,
  security_user_id INT NOT NULL,
  action ENUM('entry','exit') NOT NULL,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  remarks VARCHAR(500) NULL,
  FOREIGN KEY (pass_id) REFERENCES passes(id) ON DELETE CASCADE,
  FOREIGN KEY (security_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Demo accounts (passwords are all: AccessFlow@123)
-- Password hash generated with bcryptjs cost factor 10.
INSERT INTO users (name,email,password_hash,role) VALUES
('Demo Student','student@accessflow.local','$2a$10$7Y1x3lq0M8Y9E8d3Xv0qCOVGm.2gJ0R0J2Jb6oG6w0H8Yb0K2jv1e','student'),
('Demo Admin','admin@accessflow.local','$2a$10$7Y1x3lq0M8Y9E8d3Xv0qCOVGm.2gJ0R0J2Jb6oG6w0H8Yb0K2jv1e','admin'),
('Demo Security','security@accessflow.local','$2a$10$7Y1x3lq0M8Y9E8d3Xv0qCOVGm.2gJ0R0J2Jb6oG6w0H8Yb0K2jv1e','security')
ON DUPLICATE KEY UPDATE name=VALUES(name);
