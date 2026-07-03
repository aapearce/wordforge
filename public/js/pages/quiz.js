import { api } from '../api.js';
import { refreshTopbarStats } from '../app.js';

export async function renderQuiz(container) {
  container.innerHTML = '<div class="spinner">Building your quiz…</div>';
  const data = await api.get('/api/quiz/today');

  if (!data.questions.length) {
    container.innerHTML = `
      <div class="card center">
        <h1>Not quite yet</h1>
        <p class="muted">${data.message}</p>
        <a class="btn" href="#/daily" style="margin-top:12px;">Go to Daily 15</a>
      </div>`;
    return;
  }

  const questions = data.questions;
  let index = 0;
  const answers = [];
  let selectedChoice = null;

  function draw() {
    const q = questions[index];
    container.innerHTML = `
      <div class="card">
        <p class="quiz-progress">Question ${index + 1} of ${questions.length}</p>
        <div class="progress-track"><div class="progress-fill" style="width:${(index / questions.length) * 100}%"></div></div>
        <p class="quiz-prompt" style="margin-top:16px;">${escapeHtml(q.prompt)}</p>
        <div class="quiz-choices" id="choices">
          ${q.choices.map((c, i) => `<button class="quiz-choice" data-idx="${i}">${escapeHtml(c)}</button>`).join('')}
        </div>
        <div class="btn-row" style="margin-top:20px;">
          <button class="btn block" id="nextBtn" disabled>${index === questions.length - 1 ? 'Finish quiz' : 'Next question'}</button>
        </div>
      </div>
    `;

    container.querySelectorAll('.quiz-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedChoice = q.choices[Number(btn.dataset.idx)];
        container.querySelectorAll('.quiz-choice').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        container.querySelector('#nextBtn').disabled = false;
      });
    });

    container.querySelector('#nextBtn').addEventListener('click', () => {
      answers.push({ wordId: q.wordId, type: q.type, choiceText: selectedChoice });
      selectedChoice = null;
      if (index < questions.length - 1) {
        index++;
        draw();
      } else {
        submit();
      }
    });
  }

  async function submit() {
    container.innerHTML = '<div class="spinner">Grading your quiz…</div>';
    const res = await api.post('/api/quiz/submit', { answers });
    refreshTopbarStats();
    container.innerHTML = `
      <div class="card">
        <div class="score-badge">${res.score}<span class="of">/ ${res.total} correct</span></div>
        <p class="muted">Nice work — that's +${res.score * 10} XP.</p>
        <div class="result-list">
          ${res.results.map((r) => `
            <div class="result-row ${r.correct ? 'correct' : 'incorrect'}">
              <span>${escapeHtml(r.word)}</span>
              <span>${r.correct ? '✅ Correct' : `❌ Answer: ${escapeHtml(r.correctAnswer)}`}</span>
            </div>
          `).join('')}
        </div>
        <div class="btn-row">
          <a class="btn" href="#/dashboard">Back to dashboard</a>
        </div>
      </div>
    `;
  }

  draw();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
