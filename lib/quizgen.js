function pickRandom(arr, n, excludeId) {
  const pool = arr.filter((w) => w.id !== excludeId);
  const picked = [];
  const used = new Set();
  while (picked.length < n && picked.length < pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    const w = pool[idx];
    if (!used.has(w.id)) {
      used.add(w.id);
      picked.push(w);
    }
  }
  return picked;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const QUESTION_TYPES = ['meaning', 'synonym', 'antonym'];

function buildQuestion(wordId, tierWords) {
  const word = tierWords.find((w) => w.id === wordId);
  if (!word) return null;
  const type = QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];

  let prompt;
  let correctChoice;
  let distractors;
  if (type === 'meaning') {
    prompt = `Which word means: "${word.definition}"?`;
    correctChoice = word.word;
    distractors = pickRandom(tierWords, 3, word.id).map((w) => w.word);
  } else if (type === 'synonym') {
    prompt = `Which word is closest in meaning to "${word.word}"?`;
    correctChoice = word.synonyms[0];
    distractors = pickRandom(tierWords, 3, word.id).map(
      (w) => w.synonyms[Math.floor(Math.random() * w.synonyms.length)]
    );
  } else {
    prompt = `Which word means the OPPOSITE of "${word.word}"?`;
    correctChoice = word.antonyms[0];
    distractors = pickRandom(tierWords, 3, word.id).map(
      (w) => w.antonyms[Math.floor(Math.random() * w.antonyms.length)]
    );
  }

  const choices = shuffle([correctChoice, ...distractors]);
  return { wordId: word.id, type, prompt, choices };
}

function isCorrect(word, type, chosenText) {
  const norm = (s) => String(s || '').trim().toLowerCase();
  if (type === 'meaning') return norm(chosenText) === norm(word.word);
  if (type === 'synonym') return word.synonyms.some((s) => norm(s) === norm(chosenText));
  if (type === 'antonym') return word.antonyms.some((s) => norm(s) === norm(chosenText));
  return false;
}

function correctAnswerFor(word, type) {
  if (type === 'meaning') return word.word;
  if (type === 'synonym') return word.synonyms[0];
  return word.antonyms[0];
}

module.exports = { buildQuestion, isCorrect, correctAnswerFor };
