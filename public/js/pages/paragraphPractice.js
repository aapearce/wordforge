import { api } from '../api.js?v=2';
import { refreshTopbarStats } from '../app.js?v=2';

export async function renderParagraphPractice(container) {
  container.innerHTML = '<div class="spinner">Loading today\'s words…</div>';
  const data = await api.get('/api/words/daily');
  const words = data.words || [];

  if (!words.length) {
    container.innerHTML = `
      <a class="back-link" href="#/dashboard">← Home</a>
      <div class="card center">
        <h1>No words yet</h1>
        <p class="muted">Do today's Daily 15 first, then come back for the paragraph challenge.</p>
        <a class="btn" href="#/daily" style="margin-top:12px;">Go to Daily 15</a>
      </div>`;
    return;
  }

  function draw() {
    container.innerHTML = `
      <a class="back-link" href="#/dashboard">← Home</a>
      <div class="card">
        <h1>Paragraph challenge</h1>
        <p class="muted" style="margin-bottom:14px;">Write a short paragraph (aim for 60+ words) that uses as many of today's 15 words as you can. This is an automatic self-check for word usage, not full writing feedback.</p>
        <div class="word-target-list" id="targetList">
          ${words.map((w) => `<span class="word-target" data-word="${escapeHtml(w.word.toLowerCase())}">${escapeHtml(w.word)}</span>`).join('')}
        </div>
        <div class="field">
          <label for="paraInput">Your paragraph</label>
          <textarea id="paraInput" rows="8" placeholder="Write your paragraph here…"></textarea>
        </div>
        <div id="feedbackSlot"></div>
        <div class="btn-row">
          <button class="btn" id="submitBtn">Check my paragraph</button>
        </div>
      </div>
    `;

    container.querySelector('#submitBtn').addEventListener('click', async () => {
      const text = container.querySelector('#paraInput').value.trim();
      if (!text) return;
      const btn = container.querySelector('#submitBtn');
      btn.disabled = true;
      const res = await api.post('/api/practice/paragraph', { wordIds: words.map((w) => w.id), text });
      refreshTopbarStats();

      const usedLower = new Set(res.used.map((w) => w.toLowerCase()));
      container.querySelectorAll('.word-target').forEach((el) => {
        if (usedLower.has(el.dataset.word)) el.classList.add('used');
      });

      container.querySelector('#feedbackSlot').innerHTML = `
        <div class="success-box">
          <div class="score-badge" style="font-size:1.2rem;">${res.score}<span class="of">/ ${res.maxScore}</span></div>
          <ul class="feedback-list">${res.feedback.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
        </div>
      `;
      btn.disabled = false;
    });
  }

  draw();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
