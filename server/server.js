const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const passRoutes = require('./routes/passRoutes');
const { configureGoogle } = require('./services/google');
const { ensureDemoUsers } = require('./services/seed');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '5mb' }));
const googleReady = configureGoogle(app);

app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, service: 'CampusPass API', database: 'connected', googleOAuth: googleReady });
  } catch (err) {
    res.status(503).json({ ok: false, service: 'CampusPass API', database: 'unavailable', message: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/passes', passRoutes);

async function start() {
  try {
    await db.query('SELECT 1');
    await ensureDemoUsers();
    app.listen(PORT, () => {
      console.log(`CampusPass API running at http://localhost:${PORT}`);
      console.log(`Google OAuth enabled: ${googleReady}`);
    });
  } catch (error) {
    console.error('Database connection failed. Check server/.env DB_PASSWORD:', error.message);
    process.exit(1);
  }
}
start();
