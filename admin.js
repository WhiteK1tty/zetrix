import { ZAdmin, addLog } from './database.js';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  if (!isAdminLoggedIn()) { showLoginScreen(); return; }
  showPanel();
});

function isAdminLoggedIn() {
  return sessionStorage.getItem('zetrix_admin_session') === 'true';
}

function getAdminLogin() {
  return sessionStorage.getItem('zetrix_admin_login') || 'Admin';
}

// ===== LOGIN =====
function showLoginScreen() {
  document.getElementById('adminLoginScreen').style.display = 'flex';
  document.getElementById('adminPanelWrap').style.display   = 'none';
}

async function showPanel() {
  document.getElementById('adminLoginScreen').style.display = 'none';
  document.getElementById('adminPanelWrap').style.display   = 'flex';
  document.getElementById('topbarAdminName').textContent    = getAdminLogin();

  await renderDashboard();
  await renderKeysTable();
  await renderUsersTable();
  await renderLogsTable();
  setTimeout(() => initCustomSelects(), 50);

  // Auto-update days field when plan changes
  const planInput = document.getElementById('genPlan');
  if (planInput) {
    planInput.addEventListener('input', (e) => {
      document.getElementById('genDays').value = getDaysFromPlan(e.target.value);
    });
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const login    = document.getElementById('adminLoginInput').value.trim();
  const password = document.getElementById('adminPasswordInput').value;
  const errEl    = document.getElementById('adminLoginError');
  const btn      = e.target.querySelector('.auth-submit');

  btn.disabled  = true;
  btn.innerHTML = `<span class="btn-spinner"></span>Входим...`;

  try {
    const ok = await ZAdmin.checkCredentials(login, password);
    if (ok) {
      sessionStorage.setItem('zetrix_admin_session', 'true');
      sessionStorage.setItem('zetrix_admin_login', login);
      errEl.style.display = 'none';
      await addLog('system', 'Вход в панель администратора', login);
      showPanel();
    } else {
      throw new Error('Неверный логин или пароль');
    }
  } catch (err) {
    errEl.textContent   = err.message;
    errEl.style.display = 'block';
    btn.disabled        = false;
    btn.textContent     = 'Войти';
    const input = document.getElementById('adminPasswordInput');
    input.classList.remove('shake');
    void input.offsetWidth;
    input.classList.add('shake');
    input.addEventListener('animationend', () => input.classList.remove('shake'), { once: true });
  }
}
window.handleAdminLogin = handleAdminLogin;

function adminLogout() {
  sessionStorage.removeItem('zetrix_admin_session');
  sessionStorage.removeItem('zetrix_admin_login');
  showLoginScreen();
}
window.adminLogout = adminLogout;

// ===== TAB SWITCHING =====
function adminTab(tabId, el) {
  const current = document.querySelector('.admin-tab.active');
  const next    = document.getElementById('tab-' + tabId);
  if (!current || current === next) return;

  // Fade out current
  current.style.opacity    = '0';
  current.style.transform  = 'translateY(8px)';
  current.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

  setTimeout(() => {
    current.classList.remove('active');
    current.style.cssText = '';

    // Prepare next tab: render invisible first
    next.classList.add('active');
    next.style.opacity   = '0';
    next.style.transform = 'translateY(12px)';

    // Force reflow so browser registers the starting state
    void next.offsetHeight;

    // Trigger transition to visible
    next.style.transition = 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
    next.style.opacity    = '1';
    next.style.transform  = 'translateY(0)';

    // Clean up inline styles after transition completes
    setTimeout(() => { next.style.cssText = ''; }, 360);
  }, 200);

  document.querySelectorAll('.admin-link').forEach(l => l.classList.remove('active'));
  el.classList.add('active');

  const titles = { dashboard: 'Дашборд', keys: 'Ключи', users: 'Пользователи', logs: 'Логи', settings: 'Настройки' };
  document.getElementById('topbarTitle').textContent = titles[tabId] || tabId;
}
window.adminTab = adminTab;

function toggleSidebar() {
  const sidebar  = document.getElementById('adminSidebar');
  const main     = document.querySelector('.admin-main');
  if (window.innerWidth <= 768) sidebar.classList.toggle('open');
  else { sidebar.classList.toggle('collapsed'); main.classList.toggle('expanded'); }
}
window.toggleSidebar = toggleSidebar;

// ===== DASHBOARD =====
async function renderDashboard() {
  try {
    const stats = await ZAdmin.getStats();
    document.getElementById('statUsers').textContent  = stats.totalUsers;
    document.getElementById('statKeys').textContent   = stats.totalKeys;
    document.getElementById('statActive').textContent = stats.activeKeys;
    document.getElementById('statUsed').textContent   = stats.usedKeys;

    const users = await ZAdmin.getUsers();
    const ul    = document.getElementById('recentUsersList');
    ul.innerHTML = users.slice(0, 5).map(u => `
      <div class="dash-list-item">
        <div>
          <div class="dli-name">${escHtml(u.username)}</div>
          <div class="dli-meta">${escHtml(u.email || 'Нет email')}</div>
        </div>
        <span class="dli-badge ${planClass(u.plan)}">${u.plan || 'Нет'}</span>
      </div>`).join('') || '<div class="table-empty">Нет пользователей</div>';

    const logs = await ZAdmin.getLogs();
    const ll   = document.getElementById('recentLogsList');
    ll.innerHTML = logs.slice(0, 5).map(l => `
      <div class="dash-list-item">
        <div>
          <div class="dli-name">${escHtml(l.event)}</div>
          <div class="dli-meta">${escHtml(l.actor)} · ${formatTs(l.createdAt)}</div>
        </div>
        <span class="log-type ${l.type}">${l.type}</span>
      </div>`).join('') || '<div class="table-empty">Нет событий</div>';
  } catch (err) { console.error(err); }
}

// ===== KEYS =====
let keysFilter = { search: '', plan: 'all' };

async function renderKeysTable(filter = keysFilter) {
  keysFilter = filter;
  const tbody = document.getElementById('keysTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Загрузка...</td></tr>`;
  try {
    const keys = await ZAdmin.getKeys(filter.search, filter.plan);
    if (!keys.length) { tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Ключи не найдены</td></tr>`; return; }
    tbody.innerHTML = keys.map(k => `
      <tr>
        <td><span class="table-key">${escHtml(k.keyValue)}</span></td>
        <td><span class="table-badge ${planClass(k.plan)}">${k.plan}</span></td>
        <td>${k.days > 0 ? k.days + ' дн.' : '∞'}</td>
        <td><span class="table-badge ${k.status}">${statusLabel(k.status)}</span></td>
        <td>${(k.usedCount || 0)} / ${k.maxUses || 1}</td>
        <td>${escHtml(k.note || '—')}</td>
        <td>${formatTs(k.createdAt)}</td>
        <td>
          <div class="table-actions">
            <button class="tbl-btn copy" onclick="copyKey('${escHtml(k.keyValue)}')">${copyIcon()}</button>
            <button class="tbl-btn danger" onclick="deleteKey('${k.id}','${escHtml(k.keyValue)}')">${trashIcon()}</button>
          </div>
        </td>
      </tr>`).join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Ошибка загрузки</td></tr>`; }
}

function filterKeys(val)              { renderKeysTable({ ...keysFilter, search: val }); }
window.filterKeys = filterKeys;

function filterKeysByPlan(plan, btn) {
  document.querySelectorAll('#tab-keys .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderKeysTable({ ...keysFilter, plan });
}
window.filterKeysByPlan = filterKeysByPlan;

function openGenerateKey()  { const c = document.getElementById('generateCard'); c.style.display = 'block'; c.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
function closeGenerateKey() { document.getElementById('generateCard').style.display = 'none'; }
window.openGenerateKey  = openGenerateKey;
window.closeGenerateKey = closeGenerateKey;

function getDaysFromPlan(plan) {
  if (plan === '30 дней') return 30;
  if (plan === '90 дней') return 90;
  if (plan === 'Навсегда') return 0;
  return 30;
}
window.getDaysFromPlan = getDaysFromPlan;

async function generateKeys() {
  const plan  = document.getElementById('genPlan').value;
  const days  = getDaysFromPlan(plan);
  const count = Math.min(parseInt(document.getElementById('genCount').value) || 1, 100);
  const maxUses = parseInt(document.getElementById('genMaxUses').value) || 1;
  const note  = document.getElementById('genNote').value.trim();

  try {
    const created = await ZAdmin.createKeys(plan, days, count, note, maxUses);
    await renderKeysTable();
    await renderDashboard();
    closeGenerateKey();
    ZModal.alert({
      title: `Создано ${count} ${pluralKeys(count)}`,
      text: count === 1 ? `Ключ: <code style="color:#a78bfa;font-family:monospace">${created[0]}</code>` : 'Все ключи добавлены в таблицу',
      type: 'success',
    });
  } catch (err) { showAdminToast(err.message, 'error'); }
}
window.generateKeys = generateKeys;

async function deleteKey(id, keyValue) {
  const ok = await ZModal.confirm({ title: 'Удалить ключ?', text: 'Ключ будет удалён из системы.', confirmText: 'Удалить', danger: true });
  if (!ok) return;
  try {
    await ZAdmin.deleteKey(id, keyValue);
    await renderKeysTable();
    await renderDashboard();
    showAdminToast('Ключ удалён');
  } catch (err) { showAdminToast(err.message, 'error'); }
}
window.deleteKey = deleteKey;

function copyKey(key) {
  navigator.clipboard.writeText(key).then(() => showAdminToast('Ключ скопирован'));
}
window.copyKey = copyKey;

// ===== USERS =====
let usersSearch = '';

async function renderUsersTable(search = usersSearch) {
  usersSearch = search;
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Загрузка...</td></tr>`;
  try {
    const users = await ZAdmin.getUsers(search);
    if (!users.length) { tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Пользователи не найдены</td></tr>`; return; }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.8rem;color:#fff;flex-shrink:0">
              ${escHtml(u.username.charAt(0).toUpperCase())}
            </div>
            <span style="font-weight:600;color:#e2e2e8">${escHtml(u.username)}</span>
          </div>
        </td>
        <td>${escHtml(u.email || '—')}</td>
        <td><span class="table-badge ${planClass(u.plan)}">${u.plan || 'Нет'}</span></td>
        <td>${u.expiry || '—'}</td>
        <td>${u.keysCount || 0}</td>
        <td>
          <div class="table-actions">
            <button class="tbl-btn" onclick="openUserEdit('${u.id}','${escHtml(u.username)}','${escHtml(u.email||'')}','${u.plan||''}','${u.expiry||''}')">${editIcon()}</button>
            <button class="tbl-btn danger" onclick="deleteUser('${u.id}','${escHtml(u.username)}')">${trashIcon()}</button>
          </div>
        </td>
      </tr>`).join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Ошибка загрузки</td></tr>`; }
}

function filterUsers(val) { renderUsersTable(val); }
window.filterUsers = filterUsers;

function openUserEdit(id, username, email, plan, expiry) {
  document.getElementById('editUserId').value   = id;
  document.getElementById('editUsername').value = username;
  document.getElementById('editEmail').value    = email;
  document.getElementById('editExpiry').value   = expiry;
  document.getElementById('editPlan').value     = plan;

  const selectWrap = document.getElementById('editPlanSelect');
  if (selectWrap?._cselectInstance) selectWrap._cselectInstance.setValue(plan);

  const overlay = document.getElementById('userEditOverlay');
  overlay.style.display = 'flex';
  requestAnimationFrame(() => { overlay.classList.add('visible'); initCustomSelects(); });
}
window.openUserEdit = openUserEdit;

function closeUserEdit() {
  const overlay = document.getElementById('userEditOverlay');
  overlay.classList.remove('visible');
  overlay.addEventListener('transitionend', () => { overlay.style.display = 'none'; }, { once: true });
}
window.closeUserEdit = closeUserEdit;

async function saveUserEdit() {
  const id      = document.getElementById('editUserId').value;
  const data    = {
    username: document.getElementById('editUsername').value,
    email:    document.getElementById('editEmail').value,
    plan:     document.getElementById('editPlan').value,
    expiry:   document.getElementById('editExpiry').value,
  };
  try {
    await ZAdmin.updateUser(id, data);
    await renderUsersTable();
    await renderDashboard();
    closeUserEdit();
    showAdminToast('Пользователь обновлён');
  } catch (err) { showAdminToast(err.message, 'error'); }
}
window.saveUserEdit = saveUserEdit;

async function deleteUser(id, username) {
  const ok = await ZModal.confirm({ title: `Удалить ${username}?`, text: 'Аккаунт будет удалён.', confirmText: 'Удалить', danger: true });
  if (!ok) return;
  try {
    await ZAdmin.deleteUser(id, username);
    await renderUsersTable();
    await renderDashboard();
    showAdminToast('Пользователь удалён');
  } catch (err) { showAdminToast(err.message, 'error'); }
}
window.deleteUser = deleteUser;

// ===== LOGS =====
let logsFilter = { search: '', type: 'all' };

async function renderLogsTable(filter = logsFilter) {
  logsFilter = filter;
  const tbody = document.getElementById('logsTableBody');
  tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Загрузка...</td></tr>`;
  try {
    const logs = await ZAdmin.getLogs(filter.type, filter.search);
    if (!logs.length) { tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Логи не найдены</td></tr>`; return; }
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td style="white-space:nowrap;color:#4a4a5a;font-size:0.78rem">${formatTs(l.createdAt)}</td>
        <td><span class="log-type ${l.type}">${l.type}</span></td>
        <td style="color:#e2e2e8">${escHtml(l.event)}</td>
        <td>${escHtml(l.actor)}</td>
        <td style="color:#4a4a5a;font-size:0.8rem">${escHtml(l.details || '—')}</td>
      </tr>`).join('');
  } catch (err) { tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Ошибка загрузки</td></tr>`; }
}

function filterLogs(val)              { renderLogsTable({ ...logsFilter, search: val }); }
window.filterLogs = filterLogs;

function filterLogsByType(type, btn) {
  document.querySelectorAll('#tab-logs .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLogsTable({ ...logsFilter, type });
}
window.filterLogsByType = filterLogsByType;

async function clearLogs() {
  const ok = await ZModal.confirm({ title: 'Очистить все логи?', text: 'Журнал будет очищен.', confirmText: 'Очистить', danger: true });
  if (!ok) return;
  try { await ZAdmin.clearLogs(); await renderLogsTable(); showAdminToast('Логи очищены'); }
  catch (err) { showAdminToast(err.message, 'error'); }
}
window.clearLogs = clearLogs;

// ===== SETTINGS =====
async function saveAdminCreds() {
  const newLogin = document.getElementById('newAdminLogin').value.trim();
  const newPass  = document.getElementById('newAdminPass').value;
  const confirm  = document.getElementById('newAdminPassConfirm').value;

  if (!newLogin || newLogin.length < 3) { showAdminToast('Логин слишком короткий', 'error'); return; }
  if (!newPass  || newPass.length < 6)  { showAdminToast('Пароль слишком короткий', 'error'); return; }
  if (newPass !== confirm)              { showAdminToast('Пароли не совпадают', 'error'); return; }

  try {
    await ZAdmin.updateCredentials(newLogin, newPass);
    sessionStorage.setItem('zetrix_admin_login', newLogin);
    document.getElementById('topbarAdminName').textContent = newLogin;
    document.getElementById('newAdminLogin').value         = '';
    document.getElementById('newAdminPass').value          = '';
    document.getElementById('newAdminPassConfirm').value   = '';
    showAdminToast('Данные сохранены');
  } catch (err) { showAdminToast(err.message, 'error'); }
}
window.saveAdminCreds = saveAdminCreds;

async function resetAllKeys() {
  const ok = await ZModal.confirm({ title: 'Сбросить все ключи?', text: 'Все ключи будут удалены.', confirmText: 'Сбросить', danger: true });
  if (!ok) return;
  try { await ZAdmin.deleteAllKeys(); await renderKeysTable(); await renderDashboard(); showAdminToast('Все ключи удалены'); }
  catch (err) { showAdminToast(err.message, 'error'); }
}
window.resetAllKeys = resetAllKeys;

async function resetAllUsers() {
  const ok = await ZModal.confirm({ title: 'Удалить всех пользователей?', text: 'Все аккаунты будут удалены.', confirmText: 'Удалить', danger: true });
  if (!ok) return;
  try { await ZAdmin.deleteAllUsers(); await renderUsersTable(); await renderDashboard(); showAdminToast('Пользователи удалены'); }
  catch (err) { showAdminToast(err.message, 'error'); }
}
window.resetAllUsers = resetAllUsers;

async function fullReset() {
  const ok = await ZModal.confirm({ title: 'Полный сброс?', text: 'Все данные будут удалены. Необратимо.', confirmText: 'Сбросить всё', danger: true });
  if (!ok) return;
  try { await ZAdmin.fullReset(); await renderDashboard(); await renderKeysTable(); await renderUsersTable(); await renderLogsTable(); showAdminToast('Система сброшена'); }
  catch (err) { showAdminToast(err.message, 'error'); }
}
window.fullReset = fullReset;

// ===== TOAST =====
function showAdminToast(msg, type = 'success') {
  let toast = document.getElementById('adminToast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'adminToast'; toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.className   = 'toast ' + type + ' show';
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== HELPERS =====
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatTs(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('ru-RU');
}
function trashIcon() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`; }
function copyIcon()  { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`; }
function editIcon()  { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`; }
function statusLabel(s) { return { active: 'Активен', used: 'Использован', expired: 'Истёк' }[s] || s; }
function planClass(plan) {
  if (!plan) return '';
  if (plan.includes('30')) return 'basic';
  if (plan.includes('90')) return 'premium';
  if (plan.includes('Навсегда')) return 'vip';
  return plan.toLowerCase();
}
window.planClass = planClass;
function pluralKeys(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'ключ';
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'ключа';
  return 'ключей';
}
