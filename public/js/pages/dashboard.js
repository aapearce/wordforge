import { api } from '../api.js';
import { state } from '../state.js';

const TIER_LABEL = { '9-12': '11+ track', '12-18': 'GCSE / A-level track', '18+': 'Advanced literature track' };

export async function renderDashboard(container) {
  container.innerHTML = '<div class="spinner">Loading your quest…</div>';
  const data = await api.get('/api/stats');
  state.stats = data;

  const { stats, level, wordsSeen, wordsMastered } = data;
  const pct = Math.round((level.pointsIntoLevel / level.pointsForNextLevel) * 100);

  container.innerHTML = `
    <div class="dash-hero">
      <h1>Hi ${escapeHtml(state.user.displayName)} 👋</h1>
      <p>${TIER_LABEL[state.user.ageTier]} · Level ${level.level}</p>
      <div class="level-bar-track"><div class="level-bar-fill" style="width:${pct}%"></div></div>
      <p style="margin-top:6px;font-size:0.85rem;">${level.pointsIntoLevel} / ${level.pointsForNextLevel} XP to next level</p>
      <div class="dash-stats-grid">
        <div class="dash-stat"><span class="num">🔥 ${stats.current_streak}</span><span class="lbl">Day streak</span></div>
        <div class="dash-stat"><span class="num">${wordsSeen}</span><span class="lbl">Words seen</span></div>
        <div class="dash-stat"><span class="num">${wordsMastered}</span><span class="lbl">Mastered</span></div>
      </div>
    </div>

    <div class="action-grid">
      <button class="action-card" data-go="#/daily">
        <span class="icon">📇</span>
        <div class="title">Daily 15</div>
        <div class="desc">Today's flashcards — new words, synonyms &amp; antonyms.</div>
      </button>
      <button class="action-card" data-go="#/quiz">
        <span class="icon">🧠</span>
        <div class="title">Test yourself</div>
        <div class="desc">A quiz drawing on everything you've learned so far.</div>
      </button>
      <button class="action-card" data-go="#/practice/sentence">
        <span class="icon">✍️</span>
        <div class="title">Use it in a sentence</div>
        <div class="desc">Practise one word at a time in your own writing.</div>
      </button>
      <button class="action-card" data-go="#/practice/paragraph">
        <span class="icon">📝</span>
        <div class="title">Paragraph challenge</div>
        <div class="desc">Weave today's 15 words into a short paragraph.</div>
      </button>
    </div>
  `;

  container.querySelectorAll('[data-go]').forEach((el) => {
    el.addEventListener('click', () => {
      window.location.hash = el.dataset.go;
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
