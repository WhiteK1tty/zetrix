// ===== ZETRIX API CLIENT =====
// Connects frontend to the Node.js + SQLite backend

const API_BASE = 'http://localhost:3000/api';

const Api = {

  // ===== TOKEN =====
  getToken() { return localStorage.getItem('zetrix_token'); },
  setToken(t) { localStorage.setItem('zetrix_token', t); },
  removeToken() { localStorage.removeItem('zetrix_token'); },

  // ===== BASE REQUEST =====
  async request(method, path, body = null, auth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Ошибка ${res.status}`);
    }

    return data;
  },

  get(path, auth = false)         { return this.request('GET',    path, null, auth); },
  post(path, body, auth = false)  { return this.request('POST',   path, body, auth); },
  put(path, body, auth = false)   { return this.request('PUT',    path, body, auth); },
  del(path, auth = false)         { return this.request('DELETE', path, null, auth); },

  // ===== AUTH =====
  async login(username, password) {
    const data = await this.post('/auth/login', { username, password });
    this.setToken(data.token);
    localStorage.setItem('zetrix_user', JSON.stringify(data.user));
    return data;
  },

  async register(username, email, password) {
    const data = await this.post('/auth/register', { username, email, password });
    this.setToken(data.token);
    localStorage.setItem('zetrix_user', JSON.stringify(data.user));
    return data;
  },

  async getMe() {
    const data = await this.get('/auth/me', true);
    localStorage.setItem('zetrix_user', JSON.stringify(data));
    return data;
  },

  async updateProfile(username, email) {
    const data = await this.put('/auth/update', { username, email }, true);
    localStorage.setItem('zetrix_user', JSON.stringify(data.user));
    return data;
  },

  async changePassword(current_password, new_password) {
    return this.put('/auth/password', { current_password, new_password }, true);
  },

  async deleteAccount() {
    const data = await this.del('/auth/delete', true);
    this.logout();
    return data;
  },

  logout() {
    this.removeToken();
    localStorage.removeItem('zetrix_user');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem('zetrix_user')); }
    catch { return null; }
  },

  // ===== KEYS =====
  async activateKey(key) {
    return this.post('/keys/activate', { key }, true);
  },

  async getKeyHistory() {
    return this.get('/keys/history', true);
  },

  // ===== ADMIN =====
  async adminStats() {
    return this.get('/admin/stats', true);
  },

  async adminGetUsers(search = '') {
    return this.get(`/admin/users${search ? '?search=' + encodeURIComponent(search) : ''}`, true);
  },

  async adminUpdateUser(id, data) {
    return this.put(`/admin/users/${id}`, data, true);
  },

  async adminDeleteUser(id) {
    return this.del(`/admin/users/${id}`, true);
  },

  async adminDeleteAllUsers() {
    return this.del('/admin/users', true);
  },

  async adminGetKeys(search = '', plan = 'all') {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (plan !== 'all') params.set('plan', plan);
    return this.get(`/admin/keys?${params}`, true);
  },

  async adminCreateKeys(plan, days, count, note) {
    return this.post('/admin/keys', { plan, days, count, note }, true);
  },

  async adminDeleteKey(id) {
    return this.del(`/admin/keys/${id}`, true);
  },

  async adminDeleteAllKeys() {
    return this.del('/admin/keys', true);
  },

  async adminGetLogs(type = 'all', search = '') {
    const params = new URLSearchParams();
    if (type !== 'all') params.set('type', type);
    if (search) params.set('search', search);
    return this.get(`/admin/logs?${params}`, true);
  },

  async adminClearLogs() {
    return this.del('/admin/logs', true);
  },

  async adminUpdateCredentials(new_login, new_password) {
    return this.put('/admin/credentials', { new_login, new_password }, true);
  },

  async adminFullReset() {
    return this.del('/admin/reset', true);
  },
};
