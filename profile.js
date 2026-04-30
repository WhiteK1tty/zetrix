import { ZAuth, ZKeys, addLog } from './database.js';
import { auth } from './firebase-config.js';

let currentUser = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  ZAuth.onAuthChange(async (firebaseUser) => {
    if (!firebaseUser) {
      window.location.href = 'login.html';
      return;
    }

    currentUser = await ZAuth.getProfile(firebaseUser.uid);
    if (!currentUser) { window.location.href = 'login.html'; return; }

    renderProfile();
    renderActivity();
    renderKeysHistory();
  });
});

// ===== RENDER PROFILE =====
function renderProfile() {
  const u = currentUser;
  document.getElementById('avatarLetter').textContent    = u.username.charAt(0).toUpperCase();
  document.getElementById('profileUsername').textContent = u.username;
  document.getElementById('profilePlan').innerHTML       = `<span class="plan-dot ${u.plan !== 'Нет' ? 'active' : ''}"></span> ${u.plan}`;
  document.getElementById('ovPlan').textContent          = u.plan;
  document.getElementById('ovExpiry').textContent        = u.expiry || '—';
  document.getElementById('ovKeys').textContent          = u.keysCount || 0;
  document.getElementById('subBadge').textContent        = u.plan;
  document.getElementById('subExpiry').textContent       = u.expiry || '—';
  document.getElementById('settingsUsername').value      = u.username;
  document.getElementById('settingsEmail').value         = u.email || '';

  // Show admin button only for admin
  const adminBtn = document.getElementById('adminNavBtn');
  if (adminBtn && u.isAdmin) adminBtn.style.display = 'inline-flex';
}

// ===== TAB SWITCHING =====
function switchTab(tabId, el) {
  event.preventDefault();
  const current = document.querySelector('.tab-content.active');
  const next    = document.getElementById('tab-' + tabId);
  if (current === next) return;

  current.style.opacity    = '0';
  current.style.transform  = 'translateY(8px)';
  current.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

  setTimeout(() => {
    current.classList.remove('active');
    current.style.cssText = '';
    next.classList.add('active');
  }, 200);

  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  el.classList.add('active');
}
window.switchTab = switchTab;

// ===== KEY ACTIVATION =====
function formatKey(input) {
  let val   = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let parts = [];
  for (let i = 0; i < val.length && i < 20; i += 5) parts.push(val.slice(i, i + 5));
  input.value = parts.join('-');
}
window.formatKey = formatKey;

async function activateKey(e) {
  e.preventDefault();
  const keyInput  = document.getElementById('keyInput');
  const keyResult = document.getElementById('keyResult');
  const key       = keyInput.value.trim().toUpperCase();

  if (!key) { triggerShake(keyInput); showKeyResult('error', 'Введите ключ активации'); return; }

  const btn = e.target.querySelector('.key-submit');
  btn.disabled = true;

  try {
    const result = await ZKeys.activate(key, auth.currentUser.uid);
    currentUser = result.user;

    keyInput.classList.add('success');
    setTimeout(() => keyInput.classList.remove('success'), 700);
    showKeyResult('success', `Ключ активирован. План «${result.plan}» действует до ${result.expiry}`);
    keyInput.value = '';

    // Update UI
    document.getElementById('ovPlan').textContent    = result.plan;
    document.getElementById('ovExpiry').textContent  = result.expiry;
    document.getElementById('ovKeys').textContent    = currentUser.keysCount;
    document.getElementById('profilePlan').innerHTML = `<span class="plan-dot active"></span> ${result.plan}`;
    document.getElementById('subBadge').textContent  = result.plan;
    document.getElementById('subExpiry').textContent = result.expiry;

    renderKeysHistory();

  } catch (err) {
    triggerShake(keyInput);
    showKeyResult('error', err.message);
  } finally {
    btn.disabled = false;
  }
}
window.activateKey = activateKey;

function triggerShake(el) {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

function showKeyResult(type, msg) {
  const el = document.getElementById('keyResult');
  el.textContent   = msg;
  el.className     = 'key-result ' + type;
  el.style.display = 'block';
  if (type === 'error') setTimeout(() => { el.style.display = 'none'; }, 4000);
}

async function renderKeysHistory() {
  const list = document.getElementById('keysHistoryList');
  try {
    const { history } = await ZKeys.getHistory(auth.currentUser.uid);
    if (!history.length) {
      list.innerHTML = '<div class="activity-empty">Нет активированных ключей</div>';
      return;
    }
    list.innerHTML = history.map(item => {
      const date = item.activatedAt?.toDate?.()?.toLocaleDateString('ru-RU') || '—';
      return `
        <div class="key-history-item">
          <div class="kh-left">
            <div class="kh-key">${maskKey(item.keyValue)}</div>
            <div class="kh-meta">${item.plan} · Активирован ${date}</div>
          </div>
          <div class="kh-right">
            <span class="kh-expiry">до ${item.expiry}</span>
            <span class="kh-badge ${item.plan.toLowerCase()}">${item.plan}</span>
          </div>
        </div>`;
    }).join('');
  } catch {
    list.innerHTML = '<div class="activity-empty">Ошибка загрузки</div>';
  }
}

function maskKey(key) {
  const parts = key.split('-');
  return parts.map((p, i) => i === 0 ? p : '•'.repeat(p.length)).join('-');
}

// ===== ACTIVITY =====
async function renderActivity() {
  // Use key history as activity feed
  const list = document.getElementById('activityList');
  try {
    const { history } = await ZKeys.getHistory(auth.currentUser.uid);
    if (!history.length) {
      list.innerHTML = '<div class="activity-empty">Активность пока отсутствует</div>';
      return;
    }
    list.innerHTML = history.slice(0, 5).map(a => {
      const date = a.activatedAt?.toDate?.()?.toLocaleString('ru-RU') || '—';
      return `
        <div class="activity-item">
          <span class="activity-dot"></span>
          <div class="activity-text">Активирован ключ плана «${a.plan}»</div>
          <div class="activity-date">${date}</div>
        </div>`;
    }).join('');
  } catch {
    list.innerHTML = '<div class="activity-empty">Ошибка загрузки</div>';
  }
}

// ===== SETTINGS =====
async function saveSettings(e) {
  e.preventDefault();
  const username = document.getElementById('settingsUsername').value.trim();
  const email    = document.getElementById('settingsEmail').value.trim();

  try {
    await ZAuth.updateProfile(auth.currentUser.uid, { username, email });
    currentUser.username = username;
    document.getElementById('profileUsername').textContent = username;
    document.getElementById('avatarLetter').textContent    = username.charAt(0).toUpperCase();
    showToast('Изменения сохранены', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.saveSettings = saveSettings;

async function changePassword(e) {
  e.preventDefault();
  const current = document.getElementById('currentPass').value;
  const newPass = document.getElementById('newPass').value;
  const confirm = document.getElementById('confirmNewPass').value;

  if (newPass !== confirm) { showToast('Пароли не совпадают', 'error'); return; }
  if (newPass.length < 8)  { showToast('Минимум 8 символов', 'error'); return; }

  try {
    await ZAuth.changePassword(current, newPass);
    showToast('Пароль изменён', 'success');
    e.target.reset();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.changePassword = changePassword;

async function confirmDelete() {
  const ok = await ZModal.confirm({
    title: 'Удалить аккаунт?',
    text: 'Все ваши данные будут удалены. Это действие необратимо.',
    confirmText: 'Удалить',
    danger: true,
  });
  if (!ok) return;

  const password = prompt('Введите пароль для подтверждения:');
  if (!password) return;

  try {
    await ZAuth.deleteAccount(password);
    window.location.href = 'index.html';
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.confirmDelete = confirmDelete;

// ===== TOAST =====
function showToast(msg, type = 'success') {
  let toast = document.getElementById('zetrixToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'zetrixToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className   = 'toast ' + type + ' show';
  setTimeout(() => toast.classList.remove('show'), 3000);
}
