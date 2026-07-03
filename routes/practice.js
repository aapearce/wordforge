const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const wordbank = require('../lib/wordbank');
const { gradeSentence, gradeParagraph } = require('../lib/practiceGrader');
const { touchActivity, addPoints, getStats } = require('../lib/gamify');

const router = express.Router();

router.post('/sentence', requireAuth, (req, res) => {
  const { id: userId, ageTier: tier } = req.user;
  const { wordId, text } = req.body || {};
  if (!wordId || !text || !text.trim()) {
    return res.status(400).json({ error: 'wordId and text are required' });
  }
  const word = wordbank.findWord(tier, wordId);
  if (!word) return res.status(404).json({ error: 'Unknown word' });

  const result = gradeSentence(word.word, text);
  db.prepare(
    'INSERT INTO practice_submissions (user_id, practice_type, word_ids, submitted_text, auto_score, max_score) VALUES (?,?,?,?,?,?)'
  ).run(userId, 'sentence', JSON.stringify([wordId]), text, result.score, result.maxScore);

  touchActivity(userId);
  addPoints(userId, result.score);
  res.json({ ...result, pointsAwarded: result.score, stats: getStats(userId) });
});

router.post('/paragraph', requireAuth, (req, res) => {
  const { id: userId, ageTier: tier } = req.user;
  const { wordIds, text } = req.body || {};
  if (!Array.isArray(wordIds) || wordIds.length === 0 || !text || !text.trim()) {
    return res.status(400).json({ error: 'wordIds array and text are required' });
  }
  const words = wordIds.map((id) => wordbank.findWord(tier, id)).filter(Boolean);
  if (words.length === 0) return res.status(404).json({ error: 'No valid words found for this tier' });

  const result = gradeParagraph(words, text);
  db.prepare(
    'INSERT INTO practice_submissions (user_id, practice_type, word_ids, submitted_text, auto_score, max_score) VALUES (?,?,?,?,?,?)'
  ).run(userId, 'paragraph', JSON.stringify(wordIds), text, result.score, result.maxScore);

  touchActivity(userId);
  addPoints(userId, result.score);
  res.json({ ...result, pointsAwarded: result.score, stats: getStats(userId) });
});

module.exports = router;
