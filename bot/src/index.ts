import { session, Telegraf } from 'telegraf'
import { AppConstant } from '@/constants/env/constant'
import { startControllerConfig } from '@/controllers/start/controller'
import { roomsControllerConfig } from '@/controllers/rooms/controller'

const bot = new Telegraf(AppConstant.BOT_TOKEN)

interface SessionData {
  creatingRoom?: boolean
}

declare module 'telegraf' {
  interface Context {
    session: SessionData
  }
}

bot.use(
  session({
    defaultSession: () => ({ creatingRoom: false }),
  })
)

startControllerConfig(bot)
roomsControllerConfig(bot)

bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
