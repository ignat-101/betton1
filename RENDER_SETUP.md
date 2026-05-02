# betton — Настройка на Render.com

## Обзор

**betton** — это децентрализованная платформа для ставок на вероятности, построенная на TON blockchain с поддержкой TonConnect.

## Быстрый старт на Render

### 1. Подготовка GitHub репозитория

Убедитесь, что ваш репозиторий содержит:
- `package.json` (с фронтенд зависимостями)
- `vite.config.ts` (конфиг для сборки React + Vite)
- `backend/app.py` (Flask API)
- `backend/requirements.txt` (Python зависимости)
- `.env.example` (шаблон переменных окружения)

### 2. Развертывание на Render

#### Шаг 1: Создать веб-сервис на Render
1. Перейти на [render.com](https://render.com)
2. Нажать **New** → **Web Service**
3. Выбрать ваш GitHub репозиторий (авторизуйте Render)
4. Настроить:
   - **Name**: `bet-ton` (или любое другое имя)
   - **Runtime**: `Python 3`
   - **Build Command**: 
     ```
     npm install && npm run build && pip install -r backend/requirements.txt
     ```
   - **Start Command**:
     ```
     gunicorn --chdir backend app:app --timeout 120
     ```
   - **Plan**: Free (или выше для production)

#### Шаг 2: Добавить переменные окружения

На странице Web Service в разделе **Environment**:

```
PORT=10000
ADMIN_WALLET=UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0
TREASURY_WALLET=UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0
AUTO_SEND_PAYOUTS=false
AUTO_APPROVE_DEPOSITS=false
PAYOUT_SIGNER_URL=https://your-signer.onrender.com/sign
DEPOSIT_VERIFIER_URL=https://your-verifier.onrender.com/verify
```

**Важно**:
- `PORT` должен быть >= 10000 на Render (по умолчанию переменная окружения)
- Измените `ADMIN_WALLET` и `TREASURY_WALLET` на свои адреса
- Обновите `PAYOUT_SIGNER_URL` и `DEPOSIT_VERIFIER_URL` на свои сервисы

#### Шаг 3: Запустить развертывание

1. Нажать **Create Web Service**
2. Render автоматически начнет сборку
3. Ждать завершения (обычно 5-10 минут)
4. Проверить URL вашего сервиса: `https://bet-ton.onrender.com`

### 3. Структура проекта на Render

```
/
├── index.html              # Точка входа фронтенда
├── src/                    # React компоненты
├── package.json            # npm зависимости
├── vite.config.ts          # Vite конфиг
├── tsconfig.json
├── backend/
│   ├── app.py              # Flask API
│   ├── requirements.txt     # Python зависимости
│   └── data.json           # Данные (создается при первом запуске)
└── .env.example            # Шаблон переменных
```

### 4. Файл Render конфигурации (опционально)

Создайте `render.yaml` в корне репозитория:

```yaml
services:
  - type: web
    name: bet-ton
    env: python
    buildCommand: npm install && npm run build && pip install -r backend/requirements.txt
    startCommand: gunicorn --chdir backend app:app --timeout 120
    envVars:
      - key: PORT
        value: 10000
      - key: ADMIN_WALLET
        value: UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0
      - key: AUTO_SEND_PAYOUTS
        value: false
      - key: AUTO_APPROVE_DEPOSITS
        value: false
```

### 5. Проверка после развертывания

После успешного развертывания проверьте:

```bash
# Проверить API
curl https://bet-ton.onrender.com/api/status

# Проверить фронтенд
curl -I https://bet-ton.onrender.com/
```

## Переменные окружения

| Переменная | Описание | Пример |
|-----------|---------|--------|
| `PORT` | Порт для сервера (обязателен для Render) | `10000` |
| `ADMIN_WALLET` | Адрес админа для управления платформой | `UQC...` |
| `TREASURY_WALLET` | Адрес кошелька для депозитов | `UQC...` |
| `AUTO_SEND_PAYOUTS` | Автоматическая отправка выплат | `false` |
| `AUTO_APPROVE_DEPOSITS` | Автоматическая верификация депозитов | `false` |
| `PAYOUT_SIGNER_URL` | URL сервиса подписания платежей | `https://...` |
| `DEPOSIT_VERIFIER_URL` | URL сервиса верификации депозитов | `https://...` |

## Фичи платформы

✅ **TonConnect** — встроенная интеграция с кошельками TON  
✅ **Вероятностные рынки** — интерактивные графики вероятностей  
✅ **USDT депозиты** — конвертация TON → USDT через CoinGecko API  
✅ **Упрощенные споры** — быстрое разрешение конфликтов  
✅ **Горячие рынки** — автоматические 5-минутные рынки с оракулом  
✅ **Полная аналитика** — история ставок и статистика  

## Обслуживание

### Просмотр логов
На странице Web Service → **Logs**

### Перезагрузить сервис
Web Service → **Manual Deploy** → **Deploy latest**

### Остановить/Удалить
Web Service → **Settings** → **Delete Web Service**

## Безопасность

⚠️ **ВАЖНО**:
- Никогда не публикуйте приватные ключи в коде
- Используйте переменные окружения для всех секретов
- Включите HTTPS (Render автоматически)
- Регулярно проверяйте логи на ошибки

## Поддержка

Если возникли проблемы:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные окружения установлены
3. Проверьте, что `build` и `start` команды корректны
4. Попробуйте ручной перезапуск (Manual Deploy)

---

**betton v1.0** — Децентрализованные ставки на TON
