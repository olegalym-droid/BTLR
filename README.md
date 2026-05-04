# Butler MVP

Рабочий MVP сервиса заказов: пользователь создает заявку, мастер берет заказ, администратор проверяет мастеров, жалобы, выплаты и аккаунты.

## Структура

- `backend/` - FastAPI API, SQLite база, загрузки файлов, auth, кабинеты и админка.
- `frontend/` - Next.js интерфейс для пользователя, мастера и администратора.
- `docs/` - дополнительные материалы проекта.

## Быстрый старт

### 1. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload
```

Backend будет доступен на `http://127.0.0.1:8000`.

### 2. Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Frontend будет доступен на `http://localhost:3000`.

## Переменные backend

- `ADMIN_LOGIN` - логин администратора.
- `ADMIN_PASSWORD` - пароль администратора.
- `AUTH_SECRET_KEY` - секрет для подписи токенов. В проде обязательно заменить.
- `ALLOWED_ORIGINS` - список разрешенных CORS origins через запятую.
- `DATABASE_URL` - строка подключения SQLAlchemy. Если не указана, используется `backend/app.db`.

Пример есть в `backend/.env.example`.

## Переменные frontend

- `NEXT_PUBLIC_API_BASE_URL` - адрес backend API.

Пример есть в `frontend/.env.example`.

## Auth

После входа backend возвращает Bearer-токен. Frontend отправляет его в `Authorization`, а backend сам определяет аккаунт и роль. `user_id` и `master_id` не должны передаваться с клиента для защищенных пользовательских и мастерских API.

Админка также получает Bearer-токен после `/admin/login`.

## База и файлы

По умолчанию используется SQLite-файл `backend/app.db`. Таблицы создаются при старте приложения. Загруженные изображения сохраняются в `backend/uploads/` и раздаются как static files.

## Проверка

```powershell
cd backend
.\venv\Scripts\python.exe -m compileall . -q

cd ..\frontend
npm run lint
npm run build
```

## Основные URL

- `/` - вход и выбор роли.
- `/user/services`, `/user/orders`, `/user/chats`, `/user/profile` - кабинет пользователя.
- `/master/profile`, `/master/schedule`, `/master/orders`, `/master/wallet`, `/master/chats` - кабинет мастера.
- `/admin/masters`, `/admin/complaints`, `/admin/withdrawals`, `/admin/accounts`, `/admin/chats` - админка.
- `/user/orders/:id`, `/master/orders/:id`, `/admin/orders/:id` - прямые страницы заказов.
