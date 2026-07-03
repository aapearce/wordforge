import { api } from '../api.js';
import { setUser } from '../state.js';

const TIERS = [
  { value: '9-12', title: 'Ages 9-12', sub: 'Building toward 11+ entrance exams' },
  { value: '12-18', title: 'Ages 12-18', sub: 'GCSE and A-level vocabulary' },
  { value: '18+', title: '18+', sub: 'Advanced literature & analysis' },
];

export function renderLogin(container, { onAuthed }) {
  let mode = 'login';
  let selectedTier = '9-12';

  function draw() {
    container.innerHTML = `
      <div class="card" style="max-width:440px;margin:40px auto 0;">
        <h1 style="text-align:center;">WordForge</h1>
        <p class="muted center" style="margin-bottom:22px;">Your daily vocabulary training quest.</p>
        <div id="errorSlot"></div>
        <form id="authForm">
          ${mode === 'signup' ? `
            <div class="field">
              <label for="displayName">Your name</label>
              <input type="text" id="displayName" required maxlength="40" placeholder="What should we call you?">
            </div>` : ''}
          <div class="field">
            <label for="email">Email</label>
            <input type="email" id="email" required placeholder="you@example.com">
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input type="password" id="password" required minlength="6" placeholder="At least 6 characters">
          </div>
          ${mode === 'signup' ? `
            <div class="field">
              <label>Age group</label>
              <div class="tier-options" id="tierOptions">
                ${TIERS.map((t) => `
                  <label class="tier-option ${t.value === selectedTier ? 'selected' : ''}" data-tier="${t.value}">
                    <input type="radio" name="tier" value="${t.value}" ${t.value === selectedTier ? 'checked' : ''}>
                    <div class="tt">${t.title}</div>
                    <div class="ts">${t.sub}</div>
                  </label>
                `).join('')}
              </div>
            </div>` : ''}
          <button type="submit" class="btn block" id="submitBtn">${mode === 'signup' ? 'Create account' : 'Log in'}</button>
        </form>
        <div class="auth-toggle">
          ${mode === 'signup'
            ? `Already have an account? <button id="toggleMode">Log in</button>`
            : `New here? <button id="toggleMode">Create an account</button>`}
        </div>
      </div>
    `;

    container.querySelector('#toggleMode').addEventListener('click', () => {
      mode = mode === 'signup' ? 'login' : 'signup';
      draw();
    });

    if (mode === 'signup') {
      container.querySelectorAll('.tier-option').forEach((el) => {
        el.addEventListener('click', () => {
          selectedTier = el.dataset.tier;
          container.querySelectorAll('.tier-option').forEach((o) => o.classList.remove('selected'));
          el.classList.add('selected');
        });
      });
    }

    container.querySelector('#authForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorSlot = container.querySelector('#errorSlot');
      errorSlot.innerHTML = '';
      const submitBtn = container.querySelector('#submitBtn');
      submitBtn.disabled = true;
      try {
        const email = container.querySelector('#email').value.trim();
        const password = container.querySelector('#password').value;
        let result;
        if (mode === 'signup') {
          const displayName = container.querySelector('#displayName').value.trim();
          result = await api.post('/api/auth/signup', { email, password, displayName, ageTier: selectedTier });
        } else {
          result = await api.post('/api/auth/login', { email, password });
        }
        setUser(result.user);
        onAuthed(result.user);
      } catch (err) {
        errorSlot.innerHTML = `<div class="error-box">${err.message}</div>`;
        submitBtn.disabled = false;
      }
    });
  }

  draw();
}
