import { api } from '../api.js';
import { refreshTopbarStats } from '../app.js';

export async function renderDailyWords(container) {
  container.innerHTML = '<div class="spinner">Fetching today\'s words…</div>';
  const data = await api.get('/api/words/daily');

  if (data.courseComplete) {
    container.innerHTML = `
      <div class="card center">
        <h1>🎉 All caught up!</h1>
        <p class="muted">${data.message}</p>
        <div class="btn-row" style="justify-content:center;margin-top:16px;">
          <a class="btn" href="#/quiz">Take a review quiz instead</a>
        </div>
      </div>`;
    return;
  }

  if (data.completed) {
    container.innerHTML = `
      <div class="card center">
        <h1>✅ Day ${data.dayIndex} done</h1>
        <p class="muted">You've already finished today's 15 words. Come back tomorrow for the next set — in the meantime, quiz or practice what you've learned.</p>
        <div class="btn-row" style="justify-content:center;margin-top:16px;">
          <a class="btn" href="#/quiz">Take a quiz</a>
          <a class="btn secondary" href="#/practice/sentence">Practise a sentence</a>
        </div>
      </div>`;
    return;
  }

  const words = data.words;
  let index = 0;
  let flipped = false;
  let seenIds = new Set();
  let earnedPoints = 0;

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  async function markSeen(word) {
    if (seenIds.has(word.id)) return;
    seenIds.add(word.id);
    const res = await api.post('/api/progress/flip', { wordId: word.id });
    earnedPoints += res.pointsAwarded || 0;
    refreshTopbarStats();
  }

  async function rate(word, knewIt) {
    await api.post('/api/progress/rate', { wordId: word.id, knewIt });
    if (index < words.length - 1) {
      index++;
      flipped = false;
      draw();
    } else {
      await finish();
    }
  }

  async function finish() {
    const res = await api.post('/api/words/complete');
    earnedPoints += res.pointsAwarded || 0;
    refreshTopbarStats();
    container.innerHTML = `
      <div class="card center">
        <h1>🌟 Day ${data.dayIndex} complete!</h1>
        <p class="muted">You reviewed all 15 words and earned <b>${earnedPoints} XP</b>.</p>
        <p class="muted">Current streak: 🔥 ${res.stats.current_streak} day${res.stats.current_streak === 1 ? '' : 's'}</p>
        <div class="btn-row" style="justify-content:center;margin-top:16px;">
          <a class="btn" href="#/quiz">Quiz yourself</a>
          <a class="btn secondary" href="#/dashboard">Back to dashboard</a>
        </div>
      </div>`;
  }

  function draw() {
    const word = words[index];
    const pct = Math.round((index / words.length) * 100);
    container.innerHTML = `
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <p class="muted" style="margin-bottom:10px;">Word ${index + 1} of ${words.length} · Day ${data.dayIndex}</p>
      <div class="flashcard-scene">
        <div class="flashcard ${flipped ? 'flipped' : ''}" id="card">
          <div class="flashcard-face front">
            <div class="card-word">${escapeHtml(word.word)}</div>
            <div class="card-pos">${escapeHtml(word.pos)}</div>
            <div class="card-hint">👆 Tap the card to reveal the meaning</div>
          </div>
          <div class="flashcard-face back">
            <div class="card-word" style="font-size:1.5rem;">${escapeHtml(word.word)}
              <button class="speak-btn" id="speakBtn" title="Hear it" type="button">🔊</button>
            </div>
            <div class="card-def">${escapeHtml(word.definition)}</div>
            <div class="card-row"><b>Synonyms</b><div class="chip-list">${word.synonyms.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join('')}</div></div>
            <div class="card-row"><b>Antonyms</b><div class="chip-list">${word.antonyms.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join('')}</div></div>
            <div class="card-row"><b>Example</b>${escapeHtml(word.example)}</div>
          </div>
        </div>
      </div>
      <div class="rate-row" id="rateRow" style="display:${flipped ? 'grid' : 'none'};">
        <button class="btn secondary" id="stillLearning">Still learning 🌱</button>
        <button class="btn success" id="gotIt">Got it! ✅</button>
      </div>
    `;

    container.querySelector('#card').addEventListener('click', async (e) => {
      if (e.target.closest('#speakBtn')) return;
      if (!flipped) {
        flipped = true;
        await markSeen(word);
        draw();
      }
    });

    const speakBtn = container.querySelector('#speakBtn');
    if (speakBtn) speakBtn.addEventListener('click', () => speak(word.word));

    const stillLearning = container.querySelector('#stillLearning');
    const gotIt = container.querySelector('#gotIt');
    if (stillLearning) stillLearning.addEventListener('click', () => rate(word, false));
    if (gotIt) gotIt.addEventListener('click', () => rate(word, true));
  }

  draw();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
