// Minimal theme toggle; bind to a button with [data-action="toggle-theme"]
const KEY = 'theme';
const root = document.documentElement;

function setTheme(t) {
  root.dataset.theme = t;
  try { localStorage.setItem(KEY, t); } catch {}
}
function getTheme() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
(function init() {
  const saved = getTheme();
  setTheme(saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="toggle-theme"]');
    if (!btn) return;
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  });
})();
