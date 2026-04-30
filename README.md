# Zetrix Client — Backend Setup

## Требования
- Node.js 18+
- npm

## Установка и запуск

```bash
cd server
npm install
npm start
```

Сервер запустится на **http://localhost:3000**

Сайт будет доступен по тому же адресу — открой в браузере.

## Данные администратора (по умолчанию)
- Логин: `ADMINSYSTEM`
- Пароль: `12345678`

Сменить можно в Админ-панели → Настройки.

## База данных
SQLite файл: `server/zetrix.db`

### Таблицы
| Таблица | Описание |
|---|---|
| `users` | Пользователи (логин, email, пароль, план, срок) |
| `license_keys` | Лицензионные ключи (план, срок, статус) |
| `key_activations` | История активаций ключей |
| `logs` | Журнал событий |
| `settings` | Системные настройки |

## API Endpoints

### Auth
| Метод | URL | Описание |
|---|---|---|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET  | `/api/auth/me` | Текущий пользователь |
| PUT  | `/api/auth/update` | Обновить профиль |
| PUT  | `/api/auth/password` | Сменить пароль |
| DELETE | `/api/auth/delete` | Удалить аккаунт |

### Keys
| Метод | URL | Описание |
|---|---|---|
| POST | `/api/keys/activate` | Активировать ключ |
| GET  | `/api/keys/history` | История активаций |

### Admin (требует токен администратора)
| Метод | URL | Описание |
|---|---|---|
| GET | `/api/admin/stats` | Статистика |
| GET/PUT/DELETE | `/api/admin/users` | Управление пользователями |
| GET/POST/DELETE | `/api/admin/keys` | Управление ключами |
| GET/DELETE | `/api/admin/logs` | Журнал событий |
| PUT | `/api/admin/credentials` | Смена данных админа |
| DELETE | `/api/admin/reset` | Полный сброс |
