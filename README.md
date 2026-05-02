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

## 🚀 Деплой на Render.com (инструкции)

Процесс автоматического деплоя на Render проще всего настроить через `render.yaml`, который уже присутствует в репозитории. Ниже — пошаговая инструкция и проверки, которые я добавил в репозиторий.

### 1) Автоматический деплой через `render.yaml`

1. Залейте код в GitHub (уже сделано автоматически при создании репозитория ниже).

2. На Render: **New → Web Service → Connect a repository** и выберите `betton1`.

3. Render использует `render.yaml` для конфигурации. В `render.yaml` уже прописаны:
   - `buildCommand`: `pip install -r backend/requirements.txt && cd .. && npm install && npm run build && cp -r dist backend/dist`
   - `startCommand`: `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT --workers 2`
   - `PYTHON_VERSION: "3.11.0"`, `NODE_VERSION: "20.0.0"`

4. В Render Dashboard добавьте секреты/переменные окружения (лучше как Secrets):
   - `ADMIN_WALLET` — ваш админ-кошелёк (рекомендую задать как Secret, а не хранить в `render.yaml`).

5. Включите `Auto Deploy` (Deploy on push) для ветки `main`.

### 2) Ручная настройка через Dashboard (если нужно)

Если хотите настроить Web Service вручную, укажите:

- Build Command:
  ```bash
  pip install -r backend/requirements.txt && npm install && npm run build && cp -r dist backend/dist
  ```
- Start Command:
  ```bash
  cd backend && gunicorn app:app --bind 0.0.0.0:$PORT --workers 2
  ```
- Environment variables / Secrets: добавьте `ADMIN_WALLET` и любые другие секреты.

### 3) После деплоя

URL будет вида: `https://<your-service>.onrender.com`. Проверяйте логи через Render Dashboard → Logs.

---

## 📱 Подключение к Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Установите Web App URL в настройках бота или используйте `WebApp` в inline кнопках, указывая URL вашего развернутого сервиса.

---

## 🔐 Рекомендации по безопасности

- Уберите чувствительные данные из `render.yaml` (если есть) и используйте Secrets в Render Dashboard.
- Проверьте `.gitignore` — он уже исключает `node_modules`, `dist` и `.env`.

## 💸 Интеграция выплат (Payouts)

Архитектура выплат реализована как безопасный рабочий процесс, где сервер хранит внутренние балансы и создаёт заявки на выплату, а подпись и отправка транзакций выполняется отдельным сервисом (рекомендуемый способ).

1) Парадигма работы
- Пользователь накапливает внутренний `balance` (реферальные выплаты и т.д.).
- Запрос на вывод создаёт запись `payout` в `data.json` и резервирует сумму (снимается с внутреннего баланса).
- Админ утверждает заявку: при наличии `PAYOUT_SIGNER_URL` сервер отправит запрос к внешнему signer‑сервису, который подпишет и вышлет транзакцию в TON.
- После успешной отправки запись помечается как `sent` и хэш транзакции сохраняется.

2) Endpoints (backend)
- `POST /api/payouts/request` — запрос на выплату; тело: `{ user_address, to_address?, amount, note? }`.
- `GET /api/payouts` — список заявок; можно фильтровать `?user=<address>`.
- `POST /api/payouts/<id>/approve` — (admin) одобрить выплату; если задан `PAYOUT_SIGNER_URL`, будет вызван внешний signer.
- `POST /api/payouts/<id>/complete` — (admin) пометить выплату завершённой и записать `tx_hash`.
- `POST /api/payouts/<id>/cancel` — (admin) отменить и вернуть баланс пользователю.

3) Настройка Signer (рекомендация)
- Рекомендуемый подход: держать приватный ключ/seed в отдельном сервисе/секрете (HSM, Vault) и запрашивать подпись через HTTPS.
- Signer должен принимать POST JSON: `{ to, amount, payout_id }` и возвращать `{ tx_hash }` при успехе или `{ error }` при ошибке.

Пример контрактного поведения signer (псевдокод):
```
POST /sign
Input: { to, amount, payout_id }
Action: create and sign internal message, broadcast via TON RPC/toncenter, return { tx_hash }
```

4) Переменные окружения
- `PAYOUT_SIGNER_URL` — URL внешнего signer‑сервиса (рекомендуемый). Если не задан — выплаты обрабатываются вручную через `approve/complete`.
- `TREASURY_WALLET` — адрес корпоративной казны (используется для видимости и управления).

5) Безопасность и эксплуатация
- Никогда не храните сид‑фразы в репозитории. Храните их в защищённом секретном хранилище и предоставляйте signer‑сервису доступ только через защищённый канал.
- Используйте rate‑limit и логирование на signer‑сервисе.

Если хотите, могу добавить пример простого signer‑сервиса на Node.js с использованием `tonweb`/`ton` SDK и инструкцией по хранению seed в Render Secrets или HashiCorp Vault.

## 💳 Пополнение баланса (депозиты)

1) Быстрый рабочий процесс (ручной):
- Настройте `TREASURY_WALLET` в окружении (Render Secret). Это адрес, на который пользователи будут отправлять TON для пополнения.
- Пользователь отправляет TON на `TREASURY_WALLET` и получает `tx_hash`.
- В приложении пользователь создаёт заявку на пополнение (`POST /api/deposits/request`) с `user_address`, `amount` и опционально `tx_hash`.
- Админ проверяет транзакцию (через TonScan/TonCenter/эксплорер) и подтверждает заявку `POST /api/deposits/<id>/approve` — это зачислит внутренний баланс пользователя.

2) Автоматическая верификация (опционально):
- Можно настроить автоматическую проверку транзакций через Ton RPC или TonCenter API и автоматически подтверждать депозит при обнаружении валидной транзакции. Для этого понадобится API ключ провайдера и скрипт‑воркер.

3) UI и удобства:
- Во вкладке `Профиль` отображается адрес `TREASURY_WALLET` и форма для создания заявки на пополнение. Это позволяет запустить продукт быстро без необходимости хранить приватных ключей на сервере.

Если хотите, могу добавить пример скрипта для автоматической верификации (worker), или пример signer‑сервиса для отправки выплат.

---

## 📁 Структура проекта

```
ton-flashbet/
├── src/                    # React Frontend (TMA)
├── backend/               # Python Backend
├── index.html
├── package.json
├── vite.config.ts
├── render.yaml            # Render.com конфигурация
└── README.md
```

## 📄 Лицензия

MIT License
