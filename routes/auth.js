const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/init');
const { requireAuth, SECRET } = require('../middleware/auth');

const router = express.Router();
const VALID_TIERS = ['9-12', '12-18', '18+'];
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function issueSession(res, user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, displayName: user.displayName, ageTier: user.ageTier },
    SECRET,
    { expiresIn: '30d' }
  );
  res.cookie('vq_token', token, { httpOnly: true, sameSite: 'lax', maxAge: COOKIE_MAX_AGE_MS });
}

router.post('/signup', (req, res) => {
  const { email, password, displayName, ageTier } = req.body || {};
  if (!email || !password || !displayName || !ageTier) {
    return res.status(400).json({ error: 'email, password, displayName, and ageTier are required' });
  }
  if (!VALID_TIERS.includes(ageTier)) {
    return res.status(400).json({ error: 'Invalid age tier' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (email, password_hash, display_name, age_tier) VALUES (?,?,?,?)')
    .run(normalizedEmail, hash, displayName.trim(), ageTier);
  const userId = info.lastInsertRowid;
  db.prepare('INSERT INTO user_stats (user_id) VALUES (?)').run(userId);

  const user = { id: userId, email: normalizedEmail, displayName: displayName.trim(), ageTier };
  issueSession(res, user);
  res.json({ user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  const normalizedEmail = email.trim().toLowerCase();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }
  const user = { id: row.id, email: row.email, displayName: row.display_name, ageTier: row.age_tier };
  issueSession(res, user);
  res.json({ user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('vq_token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id, email, display_name, age_tier FROM users WHERE id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: row.id, email: row.email, displayName: row.display_name, ageTier: row.age_tier } });
});

module.exports = router;
