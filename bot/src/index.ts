import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import * as dotenv from 'dotenv'

dotenv.config()

const token = process.env.TELEGRAM_BOT_TOKEN

if (!token) {
  console.error('Ошибка: TELEGRAM_BOT_TOKEN не найден в .env файле')
  console.error('Скопируйте .env.example в .env и укажите ваш токен бота')
  process.exit(1)
}

const bot = new Telegraf(token)

// Обработчик команды /start
bot.command('start', async (ctx) => {
  await ctx.reply(
    '👋 Привет! Добро пожаловать в PF Voting Bot!\n\n' +
    'Я помогу вам управлять голосованием в вашей организации.\n\n' +
    'Доступные команды:\n' +
    '/start - Запустить бота\n' +
    '/help - Показать справку\n' +
    '/profile - Мой профиль'
  )
})

// Обработчик команды /help
bot.command('help', async (ctx) => {
  await ctx.reply(
    '📖 **Справка**\n\n' +
    'Этот бот предназначен для организации голосования.\n\n' +
    '**Возможности:**\n' +
    '• Создание опросов\n' +
    '• Участие в голосовании\n' +
    '• Просмотр результатов\n\n' +
    'По всем вопросам обращайтесь к администратору.'
  )
})

// Обработчик команды /profile
bot.command('profile', async (ctx) => {
  await ctx.reply(
    '👤 **Ваш профиль**\n\n' +
    `ID: ${ctx.from.id}\n` +
    `Имя: ${ctx.from.first_name}\n` +
    `Фамилия: ${ctx.from.last_name || 'Не указана'}\n` +
    `Username: @${ctx.from.username || 'Не указан'}`
  )
})

// Обработчик текстовых сообщений
bot.on(message('text'), async (ctx) => {
  await ctx.reply('Я пока не умею отвечать на сообщения. Используйте команды: /start, /help, /profile')
})

// Запуск бота
async function main() {
  console.log('🤖 Запуск бота...')
  
  // Обработка ошибок
  bot.catch((err, ctx) => {
    console.error(`Ошибка в контексте ${ctx.updateType}:`, err)
  })

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Получен сигнал ${signal}. Остановка бота...`)
    await bot.stop('Bot stopped by user')
    process.exit(0)
  }

  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))

  // Запуск
  await bot.launch({ dropPendingUpdates: true })
  console.log('✅ Бот запущен и готов к работе!')
  console.log(`📝 Бот активен: @${bot.botInfo?.username || 'неизвестно'}`)
}

main().catch(console.error)
