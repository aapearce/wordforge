import { api } from '../api.js?v=2';
import { refreshTopbarStats } from '../app.js?v=2';

export async function renderDailyWords(container) {
  container.innerHTML = '<div class="spinner">Fetching today\'s words…</div>';
  const data = await api.get('/api/words/daily');

  if (data.courseComplete) {
    container.innerHTML = `
      <a class="back-link" href="#/dashboard">← Home</a>
      <div class="card center">
        <h1>🎉 All caught up!</h1>
        <p class="muted">${data.message}</p>
        <div class="btn-row" style="justify-content:center;margin-top:16px;">
          <a class="btn" href="#/quiz">Take a review quiz instead</a>
        </div>
      </div>`;
    return;
  }

  const words = data.words;
  const seen = new Set(words.filter((w) => w.seen).map((w) => w.id));
  const rated = new Map(); // wordId -> true (got it) / false (still learning), this session
  let completed = data.completed;
  let earnedPoints = 0;

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  async function markSeen(word) {
    const isFirst = !seen.has(word.id);
    seen.add(word.id);
    const res = await api.post('/api/progress/flip', { wordId: word.id });
    if (isFirst && res.pointsAwarded) {
      earnedPoints += res.pointsAwarded;
      refreshTopbarStats();
    }
  }

  async function rate(word, knewIt) {
    await api.post('/api/progress/rate', { wordId: word.id, knewIt });
    rated.set(word.id, knewIt);
    closeDetail();
    draw();
  }

  async function finishDay() {
    const res = await api.post('/api/words/complete');
    earnedPoints += res.pointsAwarded || 0;
    completed = true;
    refreshTopbarStats();
    container.innerHTML = `
      <a class="back-link" href="#/dashboard">← Home</a>
      <div class="card center">
        <h1>🌟 Day ${data.dayIndex} complete!</h1>
        <p class="muted">You worked through all 15 words and earned <b>${earnedPoints} XP</b> this session.</p>
        <p class="muted">Current streak: 🔥 ${res.stats.current_streak} day${res.stats.current_streak === 1 ? '' : 's'}</p>
        <div class="btn-row" style="justify-content:center;margin-top:16px;">
          <a class="btn" href="#/quiz">Quiz yourself</a>
          <a class="btn secondary" href="#/dashboard">Back to home</a>
        </div>
      </div>`;
  }

  function closeDetail() {
    const overlay = document.getElementById('wordDetailOverlay');
    if (overlay) overlay.remove();
  }

  function openDetail(word) {
    closeDetail();
    const readOnly = completed;
    const overlay = document.createElement('div');
    overlay.id = 'wordDetailOverlay';
    overlay.className = 'detail-overlay';
    overlay.innerHTML = `
      <div class="detail-card">
        <button class="detail-close" id="detailClose" type="button">✕</button>
        <div class="card-word" style="font-size:1.6rem;">${escapeHtml(word.word)}
          <button class="speak-btn" id="speakBtn" title="Hear it" type="button">🔊</button>
        </div>
        <div class="card-pos">${escapeHtml(word.pos)}</div>
        <div class="card-def">${escapeHtml(word.definition)}</div>
        <div class="card-row"><b>Synonyms</b><div class="chip-list">${word.synonyms.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join('')}</div></div>
        <div class="card-row"><b>Antonyms</b><div class="chip-list">${word.antonyms.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join('')}</div></div>
        <div class="card-row"><b>Example</b>${escapeHtml(word.example)}</div>
        ${readOnly ? '' : `
        <div class="rate-row" style="margin-top:16px;">
          <button class="btn secondary" id="stillLearning">Still learning 🌱</button>
          <button class="btn success" id="gotIt">Got it! ✅</button>
        </div>`}
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDetail();
    });
    overlay.querySelector('#detailClose').addEventListener('click', closeDetail);
    overlay.querySelector('#speakBtn').addEventListener('click', () => speak(word.word));
    if (!readOnly) {
      overlay.querySelector('#stillLearning').addEventListener('click', () => rate(word, false));
      overlay.querySelector('#gotIt').addEventListener('click', () => rate(word, true));
    }
  }

  function tileStateClass(word) {
    if (rated.has(word.id)) return rated.get(word.id) ? 'done-good' : 'done-learn';
    if (seen.has(word.id)) return 'seen';
    return '';
  }

  function tileBadge(word) {
    if (rated.has(word.id)) return rated.get(word.id) ? '✅' : '🌱';
    if (seen.has(word.id)) return '👀';
    return '❔';
  }

  function draw() {
    const ratedCount = rated.size;
    const allSeen = words.every((w) => seen.has(w.id));
    const pct = Math.round((ratedCount / words.length) * 100);

    container.innerHTML = `
      <a class="back-link" href="#/dashboard">← Home</a>
      <div class="card" style="padding:20px;">
        <h1 style="font-size:1.3rem;">Day ${data.dayIndex} · Daily 15</h1>
        ${completed
          ? '<p class="muted">✅ Today\'s set is complete — tap any tile to review its meaning. New words tomorrow!</p>'
          : `<p class="muted">Tap a tile to reveal the meaning, then mark it <b>Got it</b> or <b>Still learning</b>. ${ratedCount}/15 done.</p>
             <div class="progress-track" style="margin-bottom:0;"><div class="progress-fill" style="width:${pct}%"></div></div>`}
      </div>
      <div class="tile-grid">
        ${words.map((w, i) => `
          <button class="word-tile ${tileStateClass(w)}" data-idx="${i}" type="button">
            <span class="tile-badge">${tileBadge(w)}</span>
            <span class="tile-word">${escapeHtml(w.word)}</span>
            <span class="tile-pos">${escapeHtml(w.pos)}</span>
          </button>
        `).join('')}
      </div>
      ${!completed ? `
      <div class="btn-row" style="margin-top:20px;">
        <button class="btn block" id="finishBtn" ${ratedCount === words.length || allSeen ? '' : 'disabled'}>
          ${ratedCount === words.length ? 'Finish Day ' + data.dayIndex + ' 🌟' : allSeen ? 'Finish Day ' + data.dayIndex + ' 🌟' : 'Reveal and rate all 15 to finish'}
        </button>
      </div>` : ''}
    `;

    container.querySelectorAll('.word-tile').forEach((tile) => {
      tile.addEventListener('click', async () => {
        const word = words[Number(tile.dataset.idx)];
        if (!completed) await markSeen(word);
        openDetail(word);
        draw();
        // re-open detail after redraw removed it? detail lives on body, unaffected by container redraw
      });
    });

    const finishBtn = container.querySelector('#finishBtn');
    if (finishBtn) finishBtn.addEventListener('click', finishDay);
  }

  draw();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
