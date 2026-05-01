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
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!fill || !label) return;

  let strength = 0;
  if (value.length >= 8)          strength++;
  if (/[A-Z]/.test(value))        strength++;
  if (/[0-9]/.test(value))        strength++;
  if (/[^A-Za-z0-9]/.test(value)) strength++;

  const levels = [
    { pct: '0%',   color: 'transparent', text: 'Введите пароль' },
    { pct: '25%',  color: '#ef4444',     text: 'Слабый' },
    { pct: '50%',  color: '#f97316',     text: 'Средний' },
    { pct: '75%',  color: '#eab308',     text: 'Хороший' },
    { pct: '100%', color: '#22c55e',     text: 'Надёжный' },
  ];

  const lvl = value.length === 0 ? levels[0] : levels[strength];
  fill.style.width      = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent     = lvl.text;
  label.style.color     = lvl.color;
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
    const { ZAdmin } = await import('./database.js');
    const isAdmin = await ZAdmin.checkCredentials(input, password);

    if (isAdmin) {
      sessionStorage.setItem('zetrix_admin_session', 'true');
      sessionStorage.setItem('zetrix_admin_login', input);
      window.location.href = 'admin.html';
      return;
    }

    // Regular user — need email!
    // Проверяем что ввели: если есть @ - это email, иначе - ошибка
    if (!input.includes('@')) {
      btn.disabled  = false;
      btn.classList.remove('btn-loading');
      btn.textContent = 'Войти в аккаунт';
      showAuthError('Введите Email, который вы указали при регистрации');
      return;
    }

    const user  = await ZAuth.login(input, password);

    sessionStorage.setItem('zetrix_uid', user.uid);
    window.location.href = 'profile.html';

  } catch (err) {
    btn.disabled  = false;
    btn.classList.remove('btn-loading');
    btn.textContent = 'Войти в аккаунт';
    showAuthError(err.message || 'Неверный Email или пароль');
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
