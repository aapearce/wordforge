CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  age_tier TEXT NOT NULL CHECK (age_tier IN ('9-12', '12-18', '18+')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS word_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  word_id TEXT NOT NULL,
  tier TEXT NOT NULL,
  leitner_box INTEGER NOT NULL DEFAULT 1,
  times_seen INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  times_wrong INTEGER NOT NULL DEFAULT 0,
  first_seen_at TEXT,
  last_reviewed_at TEXT,
  next_due_at TEXT,
  UNIQUE(user_id, word_id)
);
CREATE INDEX IF NOT EXISTS idx_word_progress_user ON word_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_word_progress_due ON word_progress(user_id, next_due_at);

CREATE TABLE IF NOT EXISTS daily_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  tier TEXT NOT NULL,
  calendar_date TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  word_ids TEXT NOT NULL,
  completed_at TEXT,
  UNIQUE(user_id, calendar_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_sessions_user ON daily_sessions(user_id);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  points_total INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  tier TEXT NOT NULL,
  taken_at TEXT NOT NULL DEFAULT (datetime('now')),
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  detail_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);

CREATE TABLE IF NOT EXISTS practice_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  practice_type TEXT NOT NULL CHECK (practice_type IN ('sentence', 'paragraph')),
  word_ids TEXT NOT NULL,
  submitted_text TEXT NOT NULL,
  auto_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_practice_submissions_user ON practice_submissions(user_id);
