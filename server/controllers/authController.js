const db = require('../config/db');
const { publicUser, signToken, hashPassword, comparePassword } = require('../services/auth');

exports.register = async (req, res) => {
  try {
    const { name, email, password, rollNo, course, branch, section, phone, photoUrl } = req.body;
    if (!name || !email || !password || String(password).length < 6) {
      return res.status(400).json({ message: 'Name, valid email and password (6+ characters) are required.' });
    }
    const normalized = String(email).trim().toLowerCase();
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [normalized]);
    if (existing.length) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hash = await hashPassword(password);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash, role, roll_no, course, branch, section, phone, photo_url) VALUES (?,?,?,'student',?,?,?,?,?,?)",
      [
        String(name).trim(),
        normalized,
        hash,
        rollNo ? String(rollNo).trim() : null,
        course ? String(course).trim() : null,
        branch ? String(branch).trim() : null,
        section ? String(section).trim().toUpperCase() : null,
        phone ? String(phone).trim() : null,
        photoUrl || null
      ]
    );
    const user = {
      id: result.insertId,
      name: String(name).trim(),
      email: normalized,
      role: 'student'
    };
    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed. Make sure the database is configured correctly.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalized = String(email || '').trim().toLowerCase();
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [normalized]);
    const user = rows.at(0);
    if (!user || !user.password_hash || !(await comparePassword(String(password || ''), user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ user: publicUser(safeUser), token: signToken(safeUser) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed.' });
  }
};
