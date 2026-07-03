export const state = {
  user: null,
  stats: null,
};

export function setUser(user) {
  state.user = user;
  document.body.dataset.tier = user ? user.ageTier : '';
}

export function setStats(payload) {
  state.stats = payload;
}
