// ===== ZETRIX THEME SYSTEM =====
// Handles dark/light theme toggling with localStorage persistence

(function() {
  const STORAGE_KEY = 'zetrix_theme';
  const DEFAULT_THEME = 'dark';

  function getSavedTheme() {
    try { return localStorage.getItem(STORAGE_KEY); }
    catch (e) { return null; }
  }

  function saveTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); }
    catch (e) {}
  }

  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateToggleIcon(theme);
  }

  function initTheme() {
    const saved = getSavedTheme();
    const theme = saved || getSystemTheme() || DEFAULT_THEME;
    applyTheme(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
  }

  function updateToggleIcon(theme) {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    const isLight = theme === 'light';
    btn.innerHTML = isLight
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    btn.title = isLight ? 'Switch to dark theme' : 'Switch to light theme';
    btn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
  }

  function createThemeToggle(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.onclick = toggleTheme;
    container.appendChild(btn);

    const current = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
    updateToggleIcon(current);
  }

  // Init immediately to prevent flash
  initTheme();

  // Expose globally
  window.ZetrixTheme = {
    toggle: toggleTheme,
    apply: applyTheme,
    createToggle: createThemeToggle,
    getCurrent: () => document.documentElement.getAttribute('data-theme') || DEFAULT_THEME,
  };

  // Auto-create toggle in common navbar locations
  document.addEventListener('DOMContentLoaded', () => {
    // If a button with id="themeToggle" already exists in HTML, just wire it up
    const existing = document.getElementById('themeToggle');
    if (existing) {
      existing.onclick = toggleTheme;
      updateToggleIcon(window.ZetrixTheme.getCurrent());
    }
  });
})();
