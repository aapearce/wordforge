import { api } from './api.js';
import { state, setUser } from './state.js';
import { renderLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderDailyWords } from './pages/dailyWords.js';
import { renderQuiz } from './pages/quiz.js';
import { renderSentencePractice } from './pages/sentencePractice.js';
import { renderParagraphPractice } from './pages/paragraphPractice.js';
import { renderStats } from './pages/stats.js';

const appEl = document.getElementById('app');
const topbarEl = document.getElementById('topbar');
const topnavEl = document.getElementById('topnav');
const topbarStatsEl = document.getElementById('topbarStats');

const NAV_LINKS = [
  { hash: '#/dashboard', label: 'Home' },
  { hash: '#/daily', label: 'Daily 15' },
  { hash: '#/quiz', label: 'Quiz' },
  { hash: '#/practice/sentence', label: 'Sentence' },
  { hash: '#/practice/paragraph', label: 'Paragraph' },
  { hash: '#/stats', label: 'Progress' },
];

const ROUTES = {
  '#/daily': renderDailyWords,
  '#/quiz': renderQuiz,
  '#/practice/sentence': renderSentencePractice,
  '#/practice/paragraph': renderParagraphPractice,
  '#/stats': renderStats,
  '#/dashboard': renderDashboard,
};

function renderTopbar() {
  if (!state.user) {
    topbarEl.hidden = true;
    return;
  }
  topbarEl.hidden = false;
  const current = window.location.hash || '#/dashboard';
  topnavEl.innerHTML = NAV_LINKS.map(
    (l) => `<a href="${l.hash}" class="${current === l.hash ? 'active' : ''}">${l.label}</a>`
  ).join('');
  renderTopbarStatsPills();
}

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

  renderTopbar();
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
