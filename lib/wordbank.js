const fs = require('fs');
const path = require('path');

const FILE_MAP = {
  '9-12': 'tier-9-12.json',
  '12-18': 'tier-12-18.json',
  '18+': 'tier-18-plus.json',
};

const PREFIX_TO_TIER = { t1: '9-12', t2: '12-18', t3: '18+' };

const cache = {};

function loadTier(tier) {
  if (!FILE_MAP[tier]) throw new Error(`Unknown tier: ${tier}`);
  if (!cache[tier]) {
    const filePath = path.join(__dirname, '..', 'data', 'words', FILE_MAP[tier]);
    cache[tier] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return cache[tier];
}

function wordsForDay(tier, day) {
  return loadTier(tier).words.filter((w) => w.day === day);
}

function maxDay(tier) {
  return Math.max(...loadTier(tier).words.map((w) => w.day));
}

function findWord(tier, wordId) {
  return loadTier(tier).words.find((w) => w.id === wordId);
}

function tierForWordId(wordId) {
  const prefix = wordId.split('-')[0];
  return PREFIX_TO_TIER[prefix] || null;
}

module.exports = { loadTier, wordsForDay, maxDay, findWord, tierForWordId, TIERS: Object.keys(FILE_MAP) };
