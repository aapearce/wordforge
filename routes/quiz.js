const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const wordbank = require('../lib/wordbank');
const { buildQuestion, isCorrect, correctAnswerFor } = require('../lib/quizgen');
const { touchActivity, addPoints, getStats } = require('../lib/gamify');
const { nextDueDate, advanceBox } = require('../lib/leitner');

const router = express.Router();
const POINTS_PER_CORRECT = 10;
const QUIZ_LENGTH = 10;
const MIN_WORDS_SEEN = 5;

router.get('/today', requireAuth, (req, res) => {
  const { id: userId, ageTier: tier } = req.user;
  const nowIso = new Date().toISOString();

  let candidates = db
    .prepare(
      `SELECT * FROM word_progress WHERE user_id = ? AND tier = ? AND (next_due_at IS NULL OR next_due_at <= ?)
       ORDER BY next_due_at ASC LIMIT ?`
    )
    .all(userId, tier, nowIso, QUIZ_LENGTH);

  if (candidates.length < MIN_WORDS_SEEN) {
    candidates = db
      .prepare('SELECT * FROM word_progress WHERE user_id = ? AND tier = ? ORDER BY last_reviewed_at ASC LIMIT ?')
      .all(userId, tier, QUIZ_LENGTH);
  }

  if (candidates.length < MIN_WORDS_SEEN) {
    return res.json({
      questions: [],
      message: 'Learn a few more words with Daily 15 before your first quiz — come back once you have seen at least 5 words.',
    });
  }

  const tierWords = wordbank.loadTier(tier).words;
  const questions = candidates.map((row) => buildQuestion(row.word_id, tierWords)).filter(Boolean);
  res.json({ questions });
});

router.get('/mistakes', requireAuth, (req, res) => {
  const { id: userId, ageTier: tier } = req.user;
  const rows = db
    .prepare(
      'SELECT word_id FROM word_progress WHERE user_id = ? AND tier = ? AND times_wrong > 0 ORDER BY times_wrong DESC, last_reviewed_at ASC LIMIT ?'
    )
    .all(userId, tier, QUIZ_LENGTH);

  if (rows.length === 0) {
    return res.json({ questions: [], message: 'No tricky words right now — every mistake has been cleared. Great work!' });
  }

  const tierWords = wordbank.loadTier(tier).words;
  const questions = rows.map((r) => buildQuestion(r.word_id, tierWords)).filter(Boolean);
  res.json({ questions });
});

router.post('/submit', requireAuth, (req, res) => {
  const { id: userId, ageTier: tier } = req.user;
  const { answers } = req.body || {};
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers array is required' });
  }

  const tierWords = wordbank.loadTier(tier).words;
  let score = 0;
  const results = [];
  const now = new Date().toISOString();

  for (const a of answers) {
    const word = tierWords.find((w) => w.id === a.wordId);
    if (!word) continue;
    const correct = isCorrect(word, a.type, a.choiceText);
    if (correct) score++;
    results.push({ wordId: word.id, word: word.word, correct, correctAnswer: correctAnswerFor(word, a.type) });

    const existing = db.prepare('SELECT * FROM word_progress WHERE user_id = ? AND word_id = ?').get(userId, word.id);
    if (existing) {
      const newBox = advanceBox(existing.leitner_box, correct);
      const newWrong = correct ? Math.max(existing.times_wrong - 1, 0) : existing.times_wrong + 1;
      db.prepare(
        'UPDATE word_progress SET leitner_box = ?, times_correct = times_correct + ?, times_wrong = ?, last_reviewed_at = ?, next_due_at = ? WHERE id = ?'
      ).run(newBox, correct ? 1 : 0, newWrong, now, nextDueDate(newBox), existing.id);
    }
  }

  const total = answers.length;
  db.prepare('INSERT INTO quiz_attempts (user_id, tier, score, total, detail_json) VALUES (?,?,?,?,?)').run(
    userId,
    tier,
    score,
    total,
    JSON.stringify(results)
  );

  touchActivity(userId);
  addPoints(userId, score * POINTS_PER_CORRECT);
  res.json({ score, total, results, stats: getStats(userId) });
});

module.exports = router;
