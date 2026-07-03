import { api } from '../api.js';
import { refreshTopbarStats } from '../app.js';

export async function renderSentencePractice(container) {
  container.innerHTML = '<div class="spinner">Loading practice words…</div>';
  const data = await api.get('/api/words/daily');
  const words = data.words || [];

  if (!words.length) {
    container.innerHTML = `
      <div class="card center">
        <h1>No words yet</h1>
        <p class="muted">Do today's Daily 15 first, then come back to practise sentences.</p>
        <a class="btn" href="#/daily" style="margin-top:12px;">Go to Daily 15</a>
      </div>`;
    return;
  }

  let word = words[Math.floor(Math.random() * words.length)];

  function draw() {
    container.innerHTML = `
      <div class="card">
        <h1>Use it in a sentence</h1>
        <p class="muted" style="margin-bottom:18px;">Write your own sentence that clearly uses the word below. This is a quick self-check, not formal grading — use it to build confidence.</p>
        <div class="card-row"><b>Word</b><span class="card-word" style="font-size:1.4rem;">${escapeHtml(word.word)}</span></div>
        <div class="card-row"><b>Meaning</b>${escapeHtml(word.definition)}</div>
        <div class="field" style="margin-top:16px;">
          <label for="sentenceInput">Your sentence</label>
          <textarea id="sentenceInput" placeholder="Write a full sentence using '${escapeHtml(word.word)}'…"></textarea>
        </div>
        <div id="feedbackSlot"></div>
        <div class="btn-row">
          <button class="btn" id="submitBtn">Check my sentence</button>
          <button class="btn secondary" id="shuffleBtn" type="button">Try a different word</button>
        </div>
      </div>
    `;

    container.querySelector('#shuffleBtn').addEventListener('click', () => {
      word = words[Math.floor(Math.random() * words.length)];
      draw();
    });

    container.querySelector('#submitBtn').addEventListener('click', async () => {
      const text = container.querySelector('#sentenceInput').value.trim();
      if (!text) return;
      const btn = container.querySelector('#submitBtn');
      btn.disabled = true;
      const res = await api.post('/api/practice/sentence', { wordId: word.id, text });
      refreshTopbarStats();
      container.querySelector('#feedbackSlot').innerHTML = `
        <div class="${res.passed ? 'success-box' : 'error-box'}">
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
