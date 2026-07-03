import { api } from '../api.js';

export async function renderStats(container) {
  container.innerHTML = '<div class="spinner">Loading your progress…</div>';
  const data = await api.get('/api/stats');
  const { stats, level, wordsSeen, wordsMastered, recentQuizzes, recentPractice } = data;

  container.innerHTML = `
    <div class="card">
      <h1>Your progress</h1>
      <div class="dash-stats-grid" style="margin-top:10px;">
        <div class="dash-stat" style="background:var(--tier-color-light);color:var(--text);">
          <span class="num">${stats.points_total}</span><span class="lbl">Total XP</span>
        </div>
        <div class="dash-stat" style="background:var(--tier-color-light);color:var(--text);">
          <span class="num">🔥 ${stats.longest_streak}</span><span class="lbl">Longest streak</span>
        </div>
        <div class="dash-stat" style="background:var(--tier-color-light);color:var(--text);">
          <span class="num">Lvl ${level.level}</span><span class="lbl">Current level</span>
        </div>
      </div>
      <p class="muted" style="margin-top:16px;">${wordsSeen} words seen so far · ${wordsMastered} fully mastered</p>
    </div>

    <div class="card">
      <h2>Recent quizzes</h2>
      ${recentQuizzes.length ? `
        <table class="stats-table">
          <thead><tr><th>Date</th><th>Tier</th><th>Score</th></tr></thead>
          <tbody>
            ${recentQuizzes.map((q) => `<tr><td>${formatDate(q.taken_at)}</td><td>${escapeHtml(q.tier)}</td><td>${q.score}/${q.total}</td></tr>`).join('')}
          </tbody>
        </table>
      ` : '<p class="muted">No quizzes taken yet.</p>'}
    </div>

    <div class="card">
      <h2>Recent practice</h2>
      ${recentPractice.length ? `
        <table class="stats-table">
          <thead><tr><th>Date</th><th>Type</th><th>Score</th></tr></thead>
          <tbody>
            ${recentPractice.map((p) => `<tr><td>${formatDate(p.created_at)}</td><td>${escapeHtml(p.practice_type)}</td><td>${p.auto_score}/${p.max_score}</td></tr>`).join('')}
          </tbody>
        </table>
      ` : '<p class="muted">No practice submissions yet.</p>'}
    </div>
  `;
}

function formatDate(iso) {
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
