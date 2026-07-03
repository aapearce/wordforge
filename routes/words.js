const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const wordbank = require('../lib/wordbank');
const { todayStr, touchActivity, addPoints, getStats } = require('../lib/gamify');

const router = express.Router();
const SESSION_COMPLETE_BONUS = 20;

router.get('/daily', requireAuth, (req, res) => {
  const { id: userId, ageTier: tier } = req.user;
  const today = todayStr();

  const existing = db.prepare('SELECT * FROM daily_sessions WHERE user_id = ? AND calendar_date = ?').get(userId, today);
  if (existing) {
    const wordIds = JSON.parse(existing.word_ids);
    const words = wordIds.map((id) => wordbank.findWord(tier, id)).filter(Boolean);
    return res.json({ dayIndex: existing.day_index, words, completed: !!existing.completed_at, isNew: false });
  }

  const priorCount = db.prepare('SELECT COUNT(*) c FROM daily_sessions WHERE user_id = ?').get(userId).c;
  const dayIndex = priorCount + 1;
  const lastAvailableDay = wordbank.maxDay(tier);
  if (dayIndex > lastAvailableDay) {
    return res.json({
      dayIndex,
      words: [],
      completed: false,
      isNew: false,
      courseComplete: true,
      message: `You've finished every word we've published so far (through Day ${lastAvailableDay}). More days are coming soon!`,
    });
  }

  const words = wordbank.wordsForDay(tier, dayIndex);
  db.prepare('INSERT INTO daily_sessions (user_id, tier, calendar_date, day_index, word_ids) VALUES (?,?,?,?,?)').run(
    userId,
    tier,
    today,
    dayIndex,
    JSON.stringify(words.map((w) => w.id))
  );
  res.json({ dayIndex, words, completed: false, isNew: true });
});

router.post('/complete', requireAuth, (req, res) => {
  const { id: userId } = req.user;
  const today = todayStr();
  const session = db.prepare('SELECT * FROM daily_sessions WHERE user_id = ? AND calendar_date = ?').get(userId, today);
  if (!session) return res.status(404).json({ error: 'No daily session started for today yet' });

  if (!session.completed_at) {
    db.prepare('UPDATE daily_sessions SET completed_at = ? WHERE id = ?').run(new Date().toISOString(), session.id);
    touchActivity(userId);
    addPoints(userId, SESSION_COMPLETE_BONUS);
  }
  res.json({ ok: true, pointsAwarded: session.completed_at ? 0 : SESSION_COMPLETE_BONUS, stats: getStats(userId) });
});

module.exports = router;
