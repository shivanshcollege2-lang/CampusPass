const db = require('../config/db');
const { hashPassword } = require('./auth');

async function ensureDemoUsers() {
  const demoPassword = await hashPassword('AccessFlow@123');
  const users = [
    ['Demo Student', 'student@accessflow.local', 'student', 'CS2026001', 'B.Tech', 'CSE', 'A', '9876543210'],
    ['Demo Admin', 'admin@accessflow.local', 'admin', null, null, null, null, null],
    ['Demo Security', 'security@accessflow.local', 'security', null, null, null, null, null],
    ['Prof. Sharma (Teacher)', 'teacher@accessflow.local', 'teacher', null, null, null, null, null]
  ];
  for (const [name, email, role, roll, course, branch, section, phone] of users) {
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      await db.query(
        'INSERT INTO users (name, email, password_hash, role, roll_no, course, branch, section, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, demoPassword, role, roll, course, branch, section, phone]
      );
    } else {
      await db.query('UPDATE users SET password_hash = ?, role = ? WHERE email = ?', [demoPassword, role, email]);
    }
  }
}

module.exports = { ensureDemoUsers };
