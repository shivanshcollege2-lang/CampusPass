const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../config/db');
const { signToken } = require('./auth');

function isConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function configureGoogle(app) {
  if (!isConfigured()) return false;
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      const name = profile.displayName || email || 'Google User';
      const googleId = profile.id;
      if (!email) return done(new Error('Google account did not provide an email address.'));
      const [rows] = await db.query('SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email]);
      if (rows[0]) return done(null, rows[0]);
      const [result] = await db.query('INSERT INTO users (name,email,google_id,role) VALUES (?,?,?,\'student\')', [name, email, googleId]);
      done(null, { id: result.insertId, name, email, role: 'student' });
    } catch (e) { done(e); }
  }));
  app.use(passport.initialize());
  return true;
}

function googleStart(req, res, next) {
  if (!isConfigured()) return res.status(503).json({ message: 'Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to server/.env.' });
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
}

function googleCallback(req, res, next) {
  if (!isConfigured()) return res.status(503).send('Google OAuth is not configured.');
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google`);
    const token = signToken(user);
    const params = new URLSearchParams({ token, role: user.role, name: user.name, email: user.email });
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth-callback?${params.toString()}`);
  })(req, res, next);
}

module.exports = { configureGoogle, googleStart, googleCallback };
