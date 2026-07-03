const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const { getStats, levelFor } = require('../lib/gamify');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const { id: userId } = req.user;
  const stats = getStats(userId);
  const level = levelFor(stats.points_total);
  const wordsSeen = db.prepare('SELECT COUNT(*) c FROM word_progress WHERE user_id = ?').get(userId).c;
  const wordsMastered = db.prepare('SELECT COUNT(*) c FROM word_progress WHERE user_id = ? AND leitner_box = 5').get(userId).c;
  const recentQuizzes = db
    .prepare('SELECT id, tier, taken_at, score, total FROM quiz_attempts WHERE user_id = ? ORDER BY taken_at DESC LIMIT 5')
    .all(userId);
  const recentPractice = db
    .prepare(
      'SELECT id, practice_type, auto_score, max_score, created_at FROM practice_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5'
    )
    .all(userId);

  res.json({ stats, level, wordsSeen, wordsMastered, recentQuizzes, recentPractice });
});

module.exports = router;
