const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const wordbank = require('../lib/wordbank');
const { touchActivity, addPoints, getStats } = require('../lib/gamify');
const { nextDueDate, advanceBox } = require('../lib/leitner');

const router = express.Router();
const FIRST_FLIP_POINTS = 5;

router.post('/flip', requireAuth, (req, res) => {
  const { id: userId, ageTier: tier } = req.user;
  const { wordId } = req.body || {};
  if (!wordId) return res.status(400).json({ error: 'wordId is required' });
  const word = wordbank.findWord(tier, wordId);
  if (!word) return res.status(404).json({ error: 'Unknown word' });

  const existing = db.prepare('SELECT * FROM word_progress WHERE user_id = ? AND word_id = ?').get(userId, wordId);
  let pointsAwarded = 0;
  const now = new Date().toISOString();
  if (!existing) {
    db.prepare(
      `INSERT INTO word_progress (user_id, word_id, tier, leitner_box, times_seen, first_seen_at, last_reviewed_at, next_due_at)
       VALUES (?,?,?,1,1,?,?,?)`
    ).run(userId, wordId, tier, now, now, nextDueDate(1));
    pointsAwarded = FIRST_FLIP_POINTS;
  } else {
    db.prepare('UPDATE word_progress SET times_seen = times_seen + 1 WHERE id = ?').run(existing.id);
  }

  touchActivity(userId);
  if (pointsAwarded) addPoints(userId, pointsAwarded);
  res.json({ ok: true, pointsAwarded, stats: getStats(userId) });
});

router.post('/rate', requireAuth, (req, res) => {
  const { id: userId } = req.user;
  const { wordId, knewIt } = req.body || {};
  if (!wordId || typeof knewIt !== 'boolean') {
    return res.status(400).json({ error: 'wordId and knewIt (boolean) are required' });
  }
  const existing = db.prepare('SELECT * FROM word_progress WHERE user_id = ? AND word_id = ?').get(userId, wordId);
  if (!existing) return res.status(404).json({ error: 'You have not seen this word yet' });

  const newBox = advanceBox(existing.leitner_box, knewIt);
  db.prepare(
    'UPDATE word_progress SET leitner_box = ?, times_correct = times_correct + ?, last_reviewed_at = ?, next_due_at = ? WHERE id = ?'
  ).run(newBox, knewIt ? 1 : 0, new Date().toISOString(), nextDueDate(newBox), existing.id);

  touchActivity(userId);
  res.json({ ok: true, leitnerBox: newBox });
});

module.exports = router;
