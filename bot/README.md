# Telegram Bot (pfVoting)

Telegram бот для системы голосования PF Voting.

## Требования

- Node.js 18+
- Токен Telegram бота (получить у [@BotFather](https://t.me/BotFather))

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Скопируйте `.env.example` в `.env` и укажите ваш токен:
```bash
cp .env.example .env
```

3. Отредактируйте `.env` файл и вставьте ваш токен бота.

## Запуск

### Режим разработки (hot reload)
```bash
npm run dev
```

### Продакшен
```bash
npm run build
npm start
```

## Команды бота

- `/start` - Запустить бота, приветственное сообщение
- `/help` - Показать справку
- `/profile` - Показать информацию о пользователе

## Структура проекта

```
bot/
├── src/
│   └── index.ts      # Основной файл бота
├── .env              # Переменные окружения (не в git)
├── .env.example      # Шаблон переменных окружения
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Разработка

Проект использует:
- **Telegraf** - фреймворк для Telegram ботов
- **TypeScript** - типизация
- **tsx** - запуск TypeScript с hot reload

Для добавления новых команд редактируйте `src/index.ts`.
