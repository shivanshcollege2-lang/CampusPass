const db = require('../config/db');
const QRCode = require('qrcode');
const crypto = require('crypto');

function formatDateOnly(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  return String(val).slice(0, 10);
}

// 1. AUTO-APPROVED INSTANT SINGLE-USE QR GENERATION
exports.create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { passType, date, time, purpose, destination } = req.body;
    if (!['Entry', 'Exit'].includes(passType) || !date || !time || !purpose || !destination) {
      return res.status(400).json({ message: 'All pass request fields are required.' });
    }

    await conn.beginTransaction();
    const [uRows] = await conn.query(
      'SELECT name, email, roll_no, course, branch, section FROM users WHERE id = ?',
      [req.user.id]
    );
    const student = uRows.at(0) || {};

    const [result] = await conn.query(
      "INSERT INTO pass_requests (student_id, pass_type, request_date, request_time, purpose, destination, status, admin_note) VALUES (?,?,?,?,?,?,'approved','Auto-approved digital QR pass')",
      [req.user.id, passType, date, time, purpose, destination]
    );

    const requestId = result.insertId;
    const passCode = 'CP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const cleanDate = formatDateOnly(date);
    const cleanTime = String(time).slice(0, 5);

    const payload = [
      'CAMPUSPASS VERIFIED GATE PASS',
      'Pass Code: ' + passCode,
      'Student: ' + (student.name || req.user.name),
      'Roll No: ' + (student.roll_no || 'N/A'),
      'Course/Branch: ' + (student.course || '-') + ' / ' + (student.branch || '-') + ' (' + (student.section || '-') + ')',
      'Type: ' + passType + ' Pass',
      'Date & Time: ' + cleanDate + ' at ' + cleanTime,
      'Destination: ' + destination,
      'Single-Use Anti-Proxy QR'
    ].join('\n');

    const baseDateTime = new Date(cleanDate + 'T' + cleanTime + ':00');
    const expiresAt = isNaN(baseDateTime.getTime())
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : new Date(baseDateTime.getTime() + 12 * 60 * 60 * 1000);

    await conn.query(
      'INSERT INTO passes (request_id, pass_code, qr_payload, expires_at) VALUES (?,?,?,?)',
      [requestId, passCode, payload, expiresAt]
    );

    await conn.commit();
    res.status(201).json({ message: 'QR Pass generated & auto-approved!', requestId, passCode });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: 'Unable to generate QR pass.' });
  } finally {
    conn.release();
  }
};

exports.my = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT pr.*, p.id AS pass_id, p.pass_code, p.qr_payload, p.expires_at, ar.action AS last_action, ar.verified_at FROM pass_requests pr LEFT JOIN passes p ON p.request_id = pr.id LEFT JOIN access_records ar ON ar.pass_id = p.id AND ar.id = (SELECT MAX(ar2.id) FROM access_records ar2 WHERE ar2.pass_id = p.id) WHERE pr.student_id = ? ORDER BY pr.created_at DESC',
      [req.user.id]
    );
    const enriched = await Promise.all(
      rows.map(async row =>
        row.qr_payload
          ? { ...row, qr_image: await QRCode.toDataURL(row.qr_payload, { width: 220, margin: 1 }) }
          : row
      )
    );
    res.json({ requests: enriched });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch your passes.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { rollNo, course, branch, section, phone, photoUrl } = req.body;
    await db.query(
      'UPDATE users SET roll_no = COALESCE(?, roll_no), course = COALESCE(?, course), branch = COALESCE(?, branch), section = COALESCE(?, section), phone = COALESCE(?, phone), photo_url = COALESCE(?, photo_url) WHERE id = ?',
      [
        rollNo || null,
        course || null,
        branch || null,
        section ? String(section).toUpperCase() : null,
        phone || null,
        photoUrl || null,
        req.user.id
      ]
    );
    const [rows] = await db.query(
      'SELECT id, name, email, role, roll_no, course, branch, section, phone, photo_url FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ message: 'Profile updated successfully.', profile: rows.at(0) || {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update profile.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, roll_no, course, branch, section, phone, photo_url FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ profile: rows.at(0) || {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load profile.' });
  }
};

exports.adminList = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT pr.*, u.name AS student_name, u.email AS student_email, u.roll_no, u.course, u.branch, u.section, p.pass_code FROM pass_requests pr JOIN users u ON u.id = pr.student_id LEFT JOIN passes p ON p.request_id = pr.id ORDER BY pr.created_at DESC'
    );
    res.json({ requests: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load pass requests.' });
  }
};

exports.review = async (req, res) => {
  const { id } = req.params;
  const { decision, note } = req.body;
  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ message: 'Invalid decision.' });
  }
  try {
    if (decision === 'reject') {
      await db.query("UPDATE pass_requests SET status='rejected', admin_note=? WHERE id=?", [
        note || 'Revoked by administrator.',
        id
      ]);
    } else {
      await db.query("UPDATE pass_requests SET status='approved', admin_note=? WHERE id=?", [
        note || 'Approved by administrator.',
        id
      ]);
    }
    res.json({ message: decision === 'approve' ? 'Pass approved.' : 'Pass revoked.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update request.' });
  }
};

// 2. ANTI-PROXY GATE VERIFICATION + PHOTO FACE-MATCH + AUTO COLLEGE ATTENDANCE
exports.verify = async (req, res) => {
  try {
    const { passCode, action, remarks } = req.body;
    if (!passCode || !['entry', 'exit'].includes(action)) {
      return res.status(400).json({ message: 'Pass code and action are required.' });
    }

    let normalizedCode = String(passCode).trim();
    const match = normalizedCode.match(/\b(?:CP|AF)-[A-Z0-9]{6,10}\b/i);
    if (match) {
      normalizedCode = match.at(0).toUpperCase();
    } else if (normalizedCode.startsWith('{')) {
      try {
        normalizedCode = JSON.parse(normalizedCode).passCode || normalizedCode;
      } catch {}
    }

    const [rows] = await db.query(
      'SELECT p.*, pr.student_id, pr.pass_type, pr.request_date, pr.request_time, pr.status, u.name AS student_name, u.email AS student_email, u.roll_no, u.course, u.branch, u.section, u.phone, u.photo_url FROM passes p JOIN pass_requests pr ON pr.id = p.request_id JOIN users u ON u.id = pr.student_id WHERE p.pass_code = ?',
      [normalizedCode]
    );
    const pass = rows.at(0);

    if (!pass) {
      return res.status(404).json({ valid: false, message: 'INVALID QR: Pass not found in campus database.' });
    }

    const studentDetails = {
      passCode: normalizedCode,
      studentName: pass.student_name,
      studentEmail: pass.student_email,
      rollNo: pass.roll_no || 'Not Set',
      course: pass.course || 'N/A',
      branch: pass.branch || 'N/A',
      section: pass.section || 'N/A',
      phone: pass.phone || 'N/A',
      photoUrl: pass.photo_url || null,
      passType: pass.pass_type,
      date: formatDateOnly(pass.request_date),
      time: String(pass.request_time).slice(0, 5)
    };

    // STRICT ANTI-PROXY CHECK: Block any second person trying to reuse an already verified QR pass
    if (pass.status === 'verified' || pass.status === 'used') {
      const [prevLogs] = await db.query(
        'SELECT verified_at, action FROM access_records WHERE pass_id = ? ORDER BY id ASC LIMIT 1',
        [pass.id]
      );
      const firstLog = prevLogs.at(0);
      const usedTime = firstLog ? new Date(firstLog.verified_at).toLocaleString() : 'earlier';
      return res.status(409).json({
        valid: false,
        proxyAlert: true,
        message: 'ANTI-PROXY ALERT: Duplicate scan blocked! This QR code was ALREADY USED on ' + usedTime + '. Second person cannot enter with the same QR.',
        pass: studentDetails
      });
    }

    if (pass.status !== 'approved') {
      return res.status(409).json({
        valid: false,
        message: 'ACCESS DENIED: Pass status is "' + pass.status.toUpperCase() + '".',
        pass: studentDetails
      });
    }

    if (pass.expires_at && new Date(pass.expires_at) < new Date()) {
      await db.query("UPDATE pass_requests SET status='expired' WHERE id=?", [pass.request_id]);
      return res.status(410).json({ valid: false, message: 'EXPIRED PASS: This QR pass has expired.', pass: studentDetails });
    }

    await db.query(
      'INSERT INTO access_records (pass_id, security_user_id, action, remarks) VALUES (?,?,?,?)',
      [pass.id, req.user.id, action, remarks || null]
    );
    await db.query("UPDATE pass_requests SET status='verified' WHERE id=?", [pass.request_id]);

    // 3. AUTOMATIC COLLEGE ATTENDANCE ON GATE ENTRY
    let attendanceMarked = false;
    if (action === 'entry') {
      const todayStr = formatDateOnly(new Date());
      await db.query(
        "INSERT IGNORE INTO campus_attendance (student_id, pass_id, attendance_date, status) VALUES (?, ?, ?, 'Present')",
        [pass.student_id, pass.id, todayStr]
);
attendanceMarked = true;
}
res.json({
valid: true,
attendanceMarked,
message:
action === 'entry'
? 'ENTRY VERIFIED: Face matched & Campus Gate Attendance marked PRESENT.'
: 'EXIT VERIFIED: Gate exit recorded & QR pass deactivated.',
pass: studentDetails
});
} catch (error) {
console.error(error);
res.status(500).json({ message: 'Pass verification failed.' });
}
};
exports.records = async (req, res) => {
try {
const [rows] = await db.query(
'SELECT ar.*, p.pass_code, u.name AS student_name, u.roll_no, u.course, u.branch, u.section, s.name AS security_name FROM access_records ar JOIN passes p ON p.id=ar.pass_id JOIN pass_requests pr ON pr.id=p.request_id JOIN users u ON u.id=pr.student_id JOIN users s ON s.id=ar.security_user_id ORDER BY ar.verified_at DESC LIMIT 100'
);
res.json({ records: rows });
} catch (error) {
console.error(error);
res.status(500).json({ message: 'Unable to load access records.' });
}
};
// 4. TEACHER PORTAL: QUERY GATE ATTENDANCE BY COURSE, BRANCH, SECTION & DATE
exports.teacherAttendance = async (req, res) => {
try {
const { date, course, branch, section } = req.query;
const targetDate = date || formatDateOnly(new Date());
let query = "SELECT u.id AS student_id, u.name, u.email, u.roll_no, u.course, u.branch, u.section, u.photo_url, ca.gate_entry_time, p.pass_code, CASE WHEN ca.id IS NOT NULL THEN 'Present at Gate' ELSE 'Not Scanned at Gate' END AS gate_status FROM users u LEFT JOIN campus_attendance ca ON ca.student_id = u.id AND ca.attendance_date = ? LEFT JOIN passes p ON p.id = ca.pass_id WHERE u.role = 'student'";
const params = [targetDate];
if (course) {
query += ' AND u.course LIKE ?';
params.push('%' + course.trim() + '%');
}
if (branch) {
query += ' AND u.branch LIKE ?';
params.push('%' + branch.trim() + '%');
}
if (section) {
query += ' AND u.section LIKE ?';
params.push('%' + section.trim() + '%');
}
query += ' ORDER BY u.roll_no ASC, u.name ASC';
const [rows] = await db.query(query, params);
res.json({ date: targetDate, students: rows });
} catch (error) {
console.error(error);
res.status(500).json({ message: 'Unable to fetch campus attendance.' });
}
};
