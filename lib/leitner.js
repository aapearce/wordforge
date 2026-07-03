// Simple 5-box Leitner spaced-repetition schedule. Box 1 = just seen /
// just missed, box 5 = considered mastered.
const BOX_INTERVAL_DAYS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };

function nextDueDate(box) {
  const days = BOX_INTERVAL_DAYS[box] || 30;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function advanceBox(currentBox, correct) {
  return correct ? Math.min(currentBox + 1, 5) : 1;
}

module.exports = { nextDueDate, advanceBox };
