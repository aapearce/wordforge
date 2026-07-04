const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'vocabquest.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');
db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));

// Migration for databases created before mistake tracking existed.
const wordProgressCols = db.prepare('PRAGMA table_info(word_progress)').all();
if (!wordProgressCols.some((c) => c.name === 'times_wrong')) {
  db.exec('ALTER TABLE word_progress ADD COLUMN times_wrong INTEGER NOT NULL DEFAULT 0');
}

module.exports = db;
