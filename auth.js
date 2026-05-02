import { ZAuth } from './database.js';

// ===== TOGGLE PASSWORD =====
function togglePassword(inputId, btn) {
  const input   = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type    = isHidden ? 'text' : 'password';
  btn.innerHTML = isHidden ? Icons.eyeOff : Icons.eye;
}
window.togglePassword = togglePassword;

// ===== PASSWORD STRENGTH =====
function checkPasswordStrength(value) {
  const segments = [
    document.getElementById('sf1'),
    document.getElementById('sf2'),
    document.getElementById('sf3'),
    document.getElementById('sf4')
  ];
  const label = document.getElementById('strengthLabel');
  if (!segments[0] || !label) return;

  let strength = 0;
  if (value.length >= 8)          strength++;
  if (/[A-Z]/.test(value))        strength++;
  if (/[0-9]/.test(value))        strength++;
  if (/[^A-Za-z0-9]/.test(value)) strength++;

  const levels = [
    { color: 'transparent', text: 'Введите пароль', glow: 'none' },
    { color: '#ef4444',     text: 'Слабый',         glow: '0 0 8px rgba(239,68,68,0.4)' },
    { color: '#f97316',     text: 'Средний',        glow: '0 0 8px rgba(249,115,22,0.4)' },
    { color: '#eab308',     text: 'Хороший',        glow: '0 0 8px rgba(234,179,8,0.4)' },
    { color: '#22c55e',     text: 'Надёжный',       glow: '0 0 8px rgba(34,197,94,0.4)' },
  ];

  const lvl = value.length === 0 ? levels[0] : levels[strength];

  segments.forEach((seg, i) => {
    if (value.length === 0) {
      seg.style.background = 'var(--glass-08)';
      seg.style.boxShadow = 'none';
      seg.classList.remove('active');
    } else if (i < strength) {
      seg.style.background = lvl.color;
      seg.style.boxShadow = lvl.glow;
      seg.classList.add('active');
    } else {
      seg.style.background = 'var(--glass-08)';
      seg.style.boxShadow = 'none';
      seg.classList.remove('active');
    }
  });

  label.textContent = lvl.text;
  label.style.color = lvl.color;
}
window.checkPasswordStrength = checkPasswordStrength;

// ===== BUTTON LOADING =====
function setButtonLoading(btn, text) {
  btn.disabled  = true;
  btn.classList.add('btn-loading');
  btn.innerHTML = `<span class="btn-spinner"></span>${text}`;
}

// ===== LOGIN =====
async function handleLogin(e) {
  e.preventDefault();
  const btn      = e.target.querySelector('.auth-submit');
  const inputEl  = document.getElementById('loginIdentifier');
  const input    = inputEl ? inputEl.value.trim() : '';
  const password = document.getElementById('loginPassword').value;

  setButtonLoading(btn, 'Входим...');

  try {
    // Check admin credentials first (stored in Firestore settings)
    let isAdmin = false;
    try {
      const { ZAdmin } = await import('./database.js');
      isAdmin = await ZAdmin.checkCredentials(input, password);
    } catch (adminErr) {
      // If admin check fails due to Firestore issues, continue to regular login
      console.warn('Admin check error:', adminErr.message);
    }

    if (isAdmin) {
      sessionStorage.setItem('zetrix_admin_session', 'true');
      sessionStorage.setItem('zetrix_admin_login', input);
      window.location.href = 'admin.html';
      return;
    }

    const user  = await ZAuth.loginByIdentifier(input, password);

    sessionStorage.setItem('zetrix_uid', user.uid);
    window.location.href = 'profile.html';

  } catch (err) {
    btn.disabled  = false;
    btn.classList.remove('btn-loading');
    btn.textContent = 'Войти в аккаунт';

    // Import error translator if available
    let msg = err.message || 'Неверный логин/email или пароль';
    try {
      const { handleFirestoreError } = await import('./database.js');
      msg = handleFirestoreError(err);
    } catch (_) { /* ignore import error */ }

    showAuthError(msg);
  }
}
window.handleLogin = handleLogin;

// ===== REGISTER =====
async function handleRegister(e) {
  e.preventDefault();
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regPasswordConfirm').value;

  if (password !== confirm) { showAuthError('Пароли не совпадают'); return; }

  const btn      = e.target.querySelector('.auth-submit');
  const username = document.getElementById('regUsername').value.trim();
  const emailVal = e.target.querySelector('input[type="email"]').value.trim();

  if (username.toUpperCase() === 'ADMINSYSTEM') {
    showAuthError('Этот логин недоступен'); return;
  }

  setButtonLoading(btn, 'Создаём аккаунт...');

  try {
    const user = await ZAuth.register(username, emailVal, password);
    sessionStorage.setItem('zetrix_uid', user.uid);
    window.location.href = 'profile.html';
  } catch (err) {
    btn.disabled  = false;
    btn.classList.remove('btn-loading');
    btn.textContent = 'Создать аккаунт';
    showAuthError(err.message || 'Ошибка регистрации');
  }
}
window.handleRegister = handleRegister;

// ===== ERROR =====
function showAuthError(msg) {
  let err = document.querySelector('.auth-error');
  if (!err) {
    err = document.createElement('div');
    err.className = 'auth-error';
    document.querySelector('.auth-form').prepend(err);
  }
  err.textContent = msg;
  err.style.display = 'block';
  setTimeout(() => err.style.display = 'none', 4000);
}

// ===== LOGOUT =====
async function logout() {
  await ZAuth.logout();
  sessionStorage.removeItem('zetrix_uid');
  sessionStorage.removeItem('zetrix_admin_session');
}
window.logout = logout;
