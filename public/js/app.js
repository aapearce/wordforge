import { api } from './api.js?v=2';
import { state, setUser } from './state.js?v=2';
import { renderLogin } from './pages/login.js?v=2';
import { renderDashboard } from './pages/dashboard.js?v=2';
import { renderDailyWords } from './pages/dailyWords.js?v=2';
import { renderQuiz } from './pages/quiz.js?v=2';
import { renderSentencePractice } from './pages/sentencePractice.js?v=2';
import { renderParagraphPractice } from './pages/paragraphPractice.js?v=2';
import { renderStats } from './pages/stats.js?v=2';
import { renderMistakes } from './pages/mistakes.js?v=2';

const appEl = document.getElementById('app');
const topbarEl = document.getElementById('topbar');
const topbarStatsEl = document.getElementById('topbarStats');

const ROUTES = {
  '#/daily': renderDailyWords,
  '#/quiz': (el) => renderQuiz(el, { endpoint: '/api/quiz/today', title: 'Quiz' }),
  '#/mistakes': renderMistakes,
  '#/mistakes/test': (el) =>
    renderQuiz(el, { endpoint: '/api/quiz/mistakes', title: 'Tricky words test', backHash: '#/mistakes' }),
  '#/practice/sentence': renderSentencePractice,
  '#/practice/paragraph': renderParagraphPractice,
  '#/stats': renderStats,
  '#/dashboard': renderDashboard,
};

async function renderTopbarStatsPills() {
  try {
    const data = await api.get('/api/stats');
    state.stats = data;
    topbarStatsEl.innerHTML = `
      <span class="stat-pill streak">🔥 ${data.stats.current_streak}</span>
      <span class="stat-pill">⭐ ${data.stats.points_total}</span>
      <button class="stat-pill logout" id="logoutBtn">Log out</button>
    `;
  } catch (e) {
    // stats fetch failure shouldn't block navigation
  }
}

// Delegated on the stable container (rather than re-attached per render) so a
// click can't be lost to a concurrent stats-pill re-render replacing the button.
topbarStatsEl.addEventListener('click', async (e) => {
  if (!e.target.closest('#logoutBtn')) return;
  await api.post('/api/auth/logout');
  setUser(null);
  window.location.hash = '';
  route();
});

export function refreshTopbarStats() {
  if (state.user) renderTopbarStatsPills();
}

async function route() {
  if (!state.user) {
    topbarEl.hidden = true;
    renderLogin(appEl, {
      onAuthed: () => {
        window.location.hash = '#/dashboard';
        route();
      },
    });
    return;
  }

  topbarEl.hidden = false;
  renderTopbarStatsPills();
  const hash = window.location.hash || '#/dashboard';
  const renderer = ROUTES[hash] || renderDashboard;
  try {
    await renderer(appEl);
  } catch (err) {
    appEl.innerHTML = `<div class="card error-box">${err.message}</div>`;
  }
}

window.addEventListener('hashchange', route);

async function bootstrap() {
  try {
    const data = await api.get('/api/auth/me');
    setUser(data.user);
  } catch (e) {
    setUser(null);
  }
  route();
}

bootstrap();
