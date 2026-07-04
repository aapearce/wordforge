import { api } from '../api.js?v=2';

export async function renderMistakes(container) {
  container.innerHTML = '<div class="spinner">Gathering your tricky words…</div>';
  const data = await api.get('/api/progress/mistakes');
  const words = data.words;

  if (!words.length) {
    container.innerHTML = `
      <a class="back-link" href="#/dashboard">← Home</a>
      <div class="card center">
        <h1>🎯 Nothing to fix!</h1>
        <p class="muted">You have no tricky words right now. Words land here when you answer them wrong in a quiz or mark them "Still learning" — and they leave once you get them right again.</p>
        <a class="btn" href="#/quiz" style="margin-top:12px;">Take a quiz</a>
      </div>`;
    return;
  }

  function closeDetail() {
    const overlay = document.getElementById('wordDetailOverlay');
    if (overlay) overlay.remove();
  }

  function openDetail(word) {
    closeDetail();
    const overlay = document.createElement('div');
    overlay.id = 'wordDetailOverlay';
    overlay.className = 'detail-overlay';
    overlay.innerHTML = `
      <div class="detail-card">
        <button class="detail-close" id="detailClose" type="button">✕</button>
        <div class="card-word" style="font-size:1.6rem;">${escapeHtml(word.word)}</div>
        <div class="card-pos">${escapeHtml(word.pos)}</div>
        <div class="card-def">${escapeHtml(word.definition)}</div>
        <div class="card-row"><b>Synonyms</b><div class="chip-list">${word.synonyms.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join('')}</div></div>
        <div class="card-row"><b>Antonyms</b><div class="chip-list">${word.antonyms.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join('')}</div></div>
        <div class="card-row"><b>Example</b>${escapeHtml(word.example)}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDetail();
    });
    overlay.querySelector('#detailClose').addEventListener('click', closeDetail);
  }

  container.innerHTML = `
    <a class="back-link" href="#/dashboard">← Home</a>
    <div class="card" style="padding:20px;">
      <h1 style="font-size:1.3rem;">🔁 Tricky words</h1>
      <p class="muted">These are the words you've answered wrong in quizzes or marked "Still learning". Tap a tile to revise it, then test yourself — get one right and it drops off this list.</p>
      <button class="btn" id="testBtn" style="margin-top:8px;">Test me on these (${Math.min(words.length, 10)} questions)</button>
    </div>
    <div class="tile-grid">
      ${words.map((w, i) => `
        <button class="word-tile done-learn" data-idx="${i}" type="button">
          <span class="tile-badge">✖ ${w.timesWrong}</span>
          <span class="tile-word">${escapeHtml(w.word)}</span>
          <span class="tile-pos">${escapeHtml(w.pos)}</span>
        </button>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.word-tile').forEach((tile) => {
    tile.addEventListener('click', () => openDetail(words[Number(tile.dataset.idx)]));
  });

  container.querySelector('#testBtn').addEventListener('click', () => {
    window.location.hash = '#/mistakes/test';
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
