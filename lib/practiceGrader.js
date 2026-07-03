function normalizeWords(text) {
  return (text.toLowerCase().match(/[a-z']+/g) || []);
}

// Crude but effective stem match so "abandoning"/"abandoned" count as uses
// of "abandon" without needing a full stemming library.
function containsWordForm(text, word) {
  const tokens = normalizeWords(text);
  const w = word.toLowerCase();
  const prefixLen = w.length <= 4 ? w.length : Math.max(5, Math.ceil(w.length * 0.7));
  const prefix = w.slice(0, prefixLen);
  return tokens.some((t) => t.startsWith(prefix));
}

// Rule-based self-check, not true grading: rewards using the target word,
// writing a full sentence, and not just repeating the same word.
function gradeSentence(word, text) {
  const feedback = [];
  let score = 0;
  const tokens = normalizeWords(text);
  const usesWord = containsWordForm(text, word);

  if (usesWord) {
    score += 8;
    feedback.push(`Nice — your sentence uses a form of "${word}".`);
  } else {
    feedback.push(`Your sentence doesn't seem to use "${word}" — try including it.`);
  }

  if (tokens.length >= 6) {
    score += 4;
    feedback.push('Good sentence length.');
  } else {
    feedback.push('Try writing a longer, fuller sentence (at least 6 words).');
  }

  const uniqueTokens = new Set(tokens);
  if (uniqueTokens.size >= Math.min(6, tokens.length) && tokens.length > 0) {
    score += 3;
    feedback.push('Good variety of words.');
  } else {
    feedback.push("Try not to just repeat the same word or phrase.");
  }

  return { score, maxScore: 15, feedback, passed: usesWord && tokens.length >= 6 };
}

function gradeParagraph(words, text) {
  const tokens = normalizeWords(text);
  const used = [];
  const missing = [];
  for (const w of words) {
    if (containsWordForm(text, w.word)) used.push(w.word);
    else missing.push(w.word);
  }
  const coverageScore = Math.round((used.length / words.length) * 20);
  const lengthScore = tokens.length >= 60 ? 5 : Math.round((tokens.length / 60) * 5);
  const score = coverageScore + lengthScore;

  const feedback = [`You used ${used.length} of ${words.length} target words.`];
  if (missing.length) feedback.push(`Try to also include: ${missing.join(', ')}.`);
  if (tokens.length < 60) feedback.push(`Your paragraph is ${tokens.length} words — aim for at least 60 for full marks.`);

  return { score, maxScore: 25, used, missing, feedback };
}

module.exports = { gradeSentence, gradeParagraph, containsWordForm };
