// ===== ZETRIX DATABASE =====
// Firebase Firestore — работает на GitHub Pages

import { db, auth } from './firebase-config.js';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, addDoc, getDocs, query, where, orderBy, limit,
  serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser as firebaseDeleteUser
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ============================================================
// КОЛЛЕКЦИИ:
//   users/         — профили пользователей
//   license_keys/  — лицензионные ключи
//   activations/   — история активаций
//   logs/          — журнал событий
//   settings/      — системные настройки (admin creds и тд)
// ============================================================

// ===== LOGS =====
export async function addLog(type, event, actor = 'System', details = '') {
  try {
    await addDoc(collection(db, 'logs'), {
      type, event, actor, details,
      createdAt: serverTimestamp()
    });
  } catch (e) { console.warn('Log error:', e); }
}

// ===== AUTH =====
export const ZAuth = {

  // Регистрация
  async register(username, email, password) {
    // Проверка уникальности username
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snap = await getDocs(q);
    if (!snap.empty) throw new Error('Пользователь с таким логином уже существует');

    // Создаём аккаунт в Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;

    // Сохраняем профиль в Firestore
    await setDoc(doc(db, 'users', uid), {
      uid,
      username,
      email,
      plan:      'Нет',
      expiry:    null,
      isAdmin:   false,
      keysCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await addLog('user', `Регистрация: ${username}`, username);
    return { uid, username, email, plan: 'Нет', expiry: null, isAdmin: false };
  },

  // Вход
  async login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) throw new Error('Профиль не найден');

    const user = snap.data();
    await addLog('user', `Вход: ${user.username}`, user.username);
    return user;
  },

  // Выход
  async logout() {
    await signOut(auth);
  },

  // Текущий пользователь из Firestore
  async getProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data();
  },

  // Обновить профиль
  async updateProfile(uid, data) {
    await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
    await addLog('user', `Профиль обновлён`, data.username || '');
  },

  // Сменить пароль
  async changePassword(currentPassword, newPassword) {
    const user = auth.currentUser;
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);
    await addLog('user', 'Пароль изменён', user.email);
  },

  // Удалить аккаунт
  async deleteAccount(password) {
    const user = auth.currentUser;
    const cred = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, cred);
    await deleteDoc(doc(db, 'users', user.uid));
    await firebaseDeleteUser(user);
  },

  // Слушатель состояния авторизации
  onAuthChange(callback) {
    return auth.onAuthStateChanged(callback);
  }
};

// ===== KEYS =====
export const ZKeys = {

  // Активировать ключ
  async activate(keyValue, uid) {
    const key = keyValue.trim().toUpperCase();

    // Найти ключ
    const q    = query(collection(db, 'license_keys'), where('keyValue', '==', key));
    const snap = await getDocs(q);

    if (snap.empty) throw new Error('Неверный ключ. Проверьте правильность ввода');

    const keyDoc  = snap.docs[0];
    const keyData = keyDoc.data();

    if (keyData.status !== 'active') throw new Error('Этот ключ уже был использован или истёк');

    // Вычислить дату окончания
    let expiry = 'Навсегда';
    if (keyData.days > 0) {
      const d = new Date();
      d.setDate(d.getDate() + keyData.days);
      expiry = d.toLocaleDateString('ru-RU');
    }

    // Транзакция: обновить ключ + пользователя + добавить активацию
    const batch = writeBatch(db);

    batch.update(doc(db, 'license_keys', keyDoc.id), {
      status:   'used',
      usedBy:   uid,
      usedAt:   serverTimestamp()
    });

    batch.update(doc(db, 'users', uid), {
      plan:      keyData.plan,
      expiry,
      keysCount: (await getDoc(doc(db, 'users', uid))).data().keysCount + 1,
      updatedAt: serverTimestamp()
    });

    const actRef = doc(collection(db, 'activations'));
    batch.set(actRef, {
      userId:      uid,
      keyId:       keyDoc.id,
      keyValue:    key,
      plan:        keyData.plan,
      expiry,
      activatedAt: serverTimestamp()
    });

    await batch.commit();

    const userSnap = await getDoc(doc(db, 'users', uid));
    await addLog('key', `Ключ активирован: ${key}`, userSnap.data().username, `${keyData.plan} / ${expiry}`);

    return { plan: keyData.plan, expiry, user: userSnap.data() };
  },

  // История активаций пользователя
  async getHistory(uid) {
    const q    = query(collection(db, 'activations'), where('userId', '==', uid), orderBy('activatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  }
};

// ===== ADMIN =====
export const ZAdmin = {

  // Проверить пароль администратора
  async checkCredentials(login, password) {
    const snap = await getDoc(doc(db, 'settings', 'admin'));
    const creds = snap.exists()
      ? snap.data()
      : { login: 'ADMINSYSTEM', password: '12345678' };

    return creds.login === login && creds.password === password;
  },

  // Сменить данные администратора
  async updateCredentials(newLogin, newPassword) {
    await setDoc(doc(db, 'settings', 'admin'), { login: newLogin, password: newPassword });
    await addLog('system', `Данные администратора изменены → ${newLogin}`, 'Admin');
  },

  // Статистика
  async getStats() {
    const [usersSnap, keysSnap, activeSnap, usedSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'license_keys')),
      getDocs(query(collection(db, 'license_keys'), where('status', '==', 'active'))),
      getDocs(query(collection(db, 'license_keys'), where('status', '==', 'used'))),
    ]);
    return {
      totalUsers:  usersSnap.size,
      totalKeys:   keysSnap.size,
      activeKeys:  activeSnap.size,
      usedKeys:    usedSnap.size,
    };
  },

  // Пользователи
  async getUsers(search = '') {
    const snap  = await getDocs(collection(db, 'users'));
    let users   = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (search) {
      const s = search.toLowerCase();
      users = users.filter(u => u.username?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
    }
    return users;
  },

  async updateUser(uid, data) {
    await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
    await addLog('user', `Пользователь обновлён: ${data.username || uid}`, 'Admin');
  },

  async deleteUser(uid, username) {
    await deleteDoc(doc(db, 'users', uid));
    await addLog('user', `Пользователь удалён: ${username}`, 'Admin');
  },

  async deleteAllUsers() {
    const snap  = await getDocs(collection(db, 'users'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    await addLog('system', 'Все пользователи удалены', 'Admin');
  },

  // Ключи
  async getKeys(search = '', plan = 'all') {
    let q = collection(db, 'license_keys');
    const snap = await getDocs(q);
    let keys = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (plan !== 'all') keys = keys.filter(k => k.plan === plan);
    if (search) {
      const s = search.toLowerCase();
      keys = keys.filter(k => k.keyValue?.toLowerCase().includes(s) || k.note?.toLowerCase().includes(s));
    }
    return keys.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  },

  async createKeys(plan, days, count, note) {
    const batch   = writeBatch(db);
    const created = [];
    for (let i = 0; i < Math.min(count, 100); i++) {
      const key = generateKey(plan);
      const ref = doc(collection(db, 'license_keys'));
      batch.set(ref, {
        keyValue:  key,
        plan,
        days,
        status:    'active',
        note:      note || null,
        usedBy:    null,
        usedAt:    null,
        createdBy: 'Admin',
        createdAt: serverTimestamp()
      });
      created.push(key);
    }
    await batch.commit();
    await addLog('key', `Создано ключей: ${count}`, 'Admin', `${plan} / ${days} дней`);
    return created;
  },

  async deleteKey(id, keyValue) {
    await deleteDoc(doc(db, 'license_keys', id));
    await addLog('key', `Ключ удалён: ${keyValue}`, 'Admin');
  },

  async deleteAllKeys() {
    const snap  = await getDocs(collection(db, 'license_keys'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    await addLog('system', 'Все ключи удалены', 'Admin');
  },

  // Логи
  async getLogs(type = 'all', search = '') {
    const q    = query(collection(db, 'logs'), orderBy('createdAt', 'desc'), limit(200));
    const snap = await getDocs(q);
    let logs   = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (type !== 'all') logs = logs.filter(l => l.type === type);
    if (search) {
      const s = search.toLowerCase();
      logs = logs.filter(l => l.event?.toLowerCase().includes(s) || l.actor?.toLowerCase().includes(s));
    }
    return logs;
  },

  async clearLogs() {
    const snap  = await getDocs(collection(db, 'logs'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    await addLog('system', 'Логи очищены', 'Admin');
  },

  // Полный сброс
  async fullReset() {
    const colls = ['license_keys', 'users', 'activations', 'logs'];
    for (const name of colls) {
      const snap  = await getDocs(collection(db, name));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    await addLog('system', 'Полный сброс системы', 'Admin');
  }
};

// ===== KEY GENERATOR =====
function generateKey(plan) {
  const prefix = plan === 'Навсегда' ? 'VIP00'
               : plan === '3 Месяца' ? 'PREMI'
               : 'BASIC';
  const rand = () => Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ZETRIX-${prefix}-${rand()}-${rand()}`;
}
