const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'vocabquest-dev-secret-change-me';

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.vq_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = { requireAuth, SECRET };
