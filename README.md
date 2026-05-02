# ⚡ betton — Ставки на ВСЁ

Моментальные ставки на любые события через Telegram Mini App и TON блокчейн.

## 🔥 Возможности

- **Ставки на что угодно**: Крипто, спорт, погода, новости, личные споры
- **Моментальные расчёты**: Прямо в Telegram
- **Оплата**: USDT (TON конвертируется в USDT при депозите)
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

📖 **Полная инструкция** находится в файле [RENDER_SETUP.md](RENDER_SETUP.md)

### Быстро:
1. Залей код в GitHub (уже готово)
2. На Render создай Web Service → Connect to GitHub репозиторий
3. Build Command: `npm install && npm run build && pip install -r backend/requirements.txt`
4. Start Command: `gunicorn --chdir backend app:app --timeout 120`
5. Добавь переменные окружения (см. [.env.example](.env.example))
6. Deploy!

### Настройка переменных окружения:
```
ADMIN_WALLET=UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0
TREASURY_WALLET=UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0
AUTO_SEND_PAYOUTS=false
AUTO_APPROVE_DEPOSITS=false
PORT=10000
```

---

## 💾 Локальная разработка

### Установка

```bash
# Фронтенд (Node.js)
npm install

# Бэкенд (Python 3.8+)
pip install -r backend/requirements.txt
```

### Запуск

```bash
# В одном терминале — фронтенд (Vite на http://localhost:5173)
npm run dev

# В другом — бэкенд (Flask на http://localhost:5050)
cd backend
python app.py
```

### Конфигурация

Скопируй `.env.example` в `.env` и измени значения:
```bash
cp .env.example .env
```

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

## 🧠 Автоматизация выплат и верификации (Signer & Verifier)

Этот проект поддерживает автоматическую обработку выплат и автоматическую верификацию депозитов через внешние сервисы. Ниже — шаги и примеры для быстрого запуска и для production.

Переменные окружения (Render Secrets):
- `PAYOUT_SIGNER_URL` — URL signer‑сервиса, который подписывает и отправляет транзакции. Метод: `POST { to, amount, payout_id }` → ответ `{ tx_hash }`.
- `DEPOSIT_VERIFIER_URL` — URL сервиса, проверяющего tx_hash. Метод: `POST { tx_hash }` → ответ `{ valid: true|false, to: address, amount: number }`.
- `AUTO_APPROVE_DEPOSITS` — если `true`, заявки на депозиты будут автоматически подтверждаться (небезопасно для production без verifier).
- `AUTO_SEND_PAYOUTS` — если `true` и `PAYOUT_SIGNER_URL` не задан, система оставит заявки на отправку в `pending` (логируется); желательно всегда указывать `PAYOUT_SIGNER_URL`.

Локальный быстрый запуск (mock signer):

1) Запустить mock signer (для тестов):

```bash
cd tools/mock-signer
npm install
npm start
# mock signer будет слушать http://localhost:3001/sign
```

2) Запустить backend окружение с автоматической отправкой на mock signer:

```bash
PAYOUT_SIGNER_URL=http://localhost:3001/sign \
AUTO_SEND_PAYOUTS=true \
.venv/bin/python backend/app.py
```

3) Пример запроса на выплату (автообработка):

```bash
curl -X POST https://bet-ton.onrender.com/api/payouts/request \
  -H 'Content-Type: application/json' \
  -d '{"user_address":"<USER_ADDR>","to_address":"<DEST_ADDR>","amount":1.5}'
```

При удачном ответе mock signer вернёт `{ tx_hash }` и payout пометится как `sent`.

Production рекомендации:
- Разверните signer как отдельный защищённый сервис (Render Web Service, Heroku, VPS). Храните приватный ключ/seed только в Render Secrets или в Vault/HSM.
- Signer должен проверять входящие запросы (подпись, IP allowlist, auth token). Возвращать `{ tx_hash }` или ошибки.
- Для безопасности депозитов используйте `DEPOSIT_VERIFIER_URL`, который опрашивает TON RPC/TonCenter и валидирует `tx_hash` (to == `TREASURY_WALLET` и amount >= заявленной суммы).

Если хотите, могу:
- A) Добавить пример real signer на Node.js с `ton`/`tonweb` (создание и отправка internal message),
- B) Настроить и задеплоить mock signer на Render для быстрого старта, или
- C) Добавить verifier пример (Python script) который вызывает TonCenter API по `tx_hash`.

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
