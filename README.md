# ⚡ TON FlashBet — Ставки на ВСЁ

Моментальные ставки на любые события через Telegram Mini App и TON блокчейн.

## 🔥 Возможности

- **Ставки на что угодно**: Крипто, спорт, погода, новости, личные споры
- **Моментальные расчёты**: Прямо в Telegram
- **Оплата в звёздах**: Telegram Stars
- **Голосование валидаторов**: Proof of Stake система разрешения споров
- **Оракул цен**: Автоматическая проверка через CoinGecko API
- **Админ-панель**: Управление рынками и разрешение ставок
- **Прозрачная казна**: Все транзакции открыты
- **Реферальная система**: Бонусы за приглашённых друзей

## 🛠 Технологии

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Python + Flask + Gunicorn
- **Blockchain**: TON (The Open Network)
- **APIs**: CoinGecko, TON Center
- **Хостинг**: Render.com

## 📱 Скриншоты

Telegram Mini App с тремя вкладками:
- **Рынки** — просмотр и ставки на события
- **Создать** — создание новых рынков
- **Профиль** — кошелёк, статистика, рефералы

---

## 🚀 Деплой на Render.com

### Вариант 1: Через render.yaml (рекомендуется)

1. **Залейте код на GitHub:**
   ```bash
   git init
   git add .
   git commit -m "TON FlashBet initial release"
   git remote add origin https://github.com/YOUR_USERNAME/ton-flashbet.git
   git push -u origin main
   ```

2. **Подключите Render:**
   - Зайдите на [render.com](https://render.com)
   - Нажмите **"New"** → **" Web Service"**
   - Подключите ваш GitHub репозиторий

3. **Настройте Render:**
   - **Runtime**: Python 3
   - **Build Command**:
     ```bash
     pip install -r backend/requirements.txt && npm install && npm run build && cp -r dist backend/dist
     ```
   - **Start Command**:
     ```bash
     cd backend && gunicorn app:app --bind 0.0.0.0:$PORT --workers 2
     ```
   - **Environment Variables**:
     | Key | Value |
     |-----|-------|
     | `ADMIN_WALLET` | `UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0` |

4. **Нажмите "Create Web Service"** и дождитесь деплоя.

### Вариант 2: Через Dashboard вручную

1. **Создайте Web Service** на Render
2. Подключите GitHub репо
3. Установите настройки:
   ```
   Runtime:         Python 3
   Build Command:   pip install -r backend/requirements.txt && npm install && npm run build && cp -r dist backend/dist
   Start Command:   cd backend && gunicorn app:app --bind 0.0.0.0:$PORT --workers 2
   ```
4. Добавьте env var `ADMIN_WALLET`

### После деплоя

Ваше приложение будет доступно по URL вида:
```
https://ton-flashbet.onrender.com
```

---

## 📱 Подключение к Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Установите Web App URL:
   ```
   /setmenubutton → ваш-бот → https://ton-flashbet.onrender.com
   ```
3. Или используйте `WebApp` в inline кнопках:
   ```python
   from telegram import InlineKeyboardButton, WebAppInfo
   
   keyboard = [[InlineKeyboardButton("Открыть FlashBet", web_app=WebAppInfo(url="https://ton-flashbet.onrender.com"))]]
   ```

---

## 🔐 Админ-доступ

Администратор с кошельком `UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0` может:
- Просматривать все рынки в админ-панели
- Разрешать рынки (Да/Нет)
- Видеть голоса валидаторов
- Управлять казной

---

## 📁 Структура проекта

```
ton-flashbet/
├── src/                    # React Frontend (TMA)
│   ├── App.tsx            # Главный компонент
│   ├── data.tsx           # Состояние и моковые данные
│   ├── types.ts           # TypeScript типы
│   └── components/        # UI компоненты
│       ├── Header.tsx
│       ├── TabBar.tsx
│       ├── MarketsTab.tsx
│       ├── MarketCard.tsx
│       ├── MarketDetail.tsx
│       ├── CreateBetTab.tsx
│       ├── ProfileTab.tsx
│       └── AdminPanel.tsx
├── backend/               # Python Backend
│   ├── app.py            # Flask сервер
│   └── requirements.txt  # Python зависимости
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── render.yaml            # Render.com конфигурация
└── README.md
```

## 📄 Лицензия

MIT License
