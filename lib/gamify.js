const db = require('../db/init');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getStats(userId) {
  let stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);
  if (!stats) {
    db.prepare('INSERT INTO user_stats (user_id) VALUES (?)').run(userId);
    stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);
  }
  return stats;
}

// Increments the streak once per calendar day with any activity; resets it
// if the last active day was earlier than yesterday.
function touchActivity(userId) {
  const stats = getStats(userId);
  const today = todayStr();
  if (stats.last_active_date === today) return stats;
  const newStreak = stats.last_active_date === yesterdayStr() ? stats.current_streak + 1 : 1;
  const newLongest = Math.max(stats.longest_streak, newStreak);
  db.prepare('UPDATE user_stats SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE user_id = ?')
    .run(newStreak, newLongest, today, userId);
  return getStats(userId);
}

function addPoints(userId, points) {
  db.prepare('UPDATE user_stats SET points_total = points_total + ? WHERE user_id = ?').run(points, userId);
  return getStats(userId);
}

function levelFor(points) {
  const POINTS_PER_LEVEL = 200;
  const level = Math.floor(points / POINTS_PER_LEVEL) + 1;
  const pointsIntoLevel = points % POINTS_PER_LEVEL;
  return { level, pointsIntoLevel, pointsForNextLevel: POINTS_PER_LEVEL };
}

module.exports = { getStats, touchActivity, addPoints, levelFor, todayStr };
