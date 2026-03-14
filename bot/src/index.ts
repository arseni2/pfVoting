import { AppConstant } from '@/constants/env/constant'
import { roomsControllerConfig } from '@/controllers/rooms/controller'
import { startControllerConfig } from '@/controllers/start/controller'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { session, Telegraf } from 'telegraf'

const agent = new HttpsProxyAgent(AppConstant.PROXY_URL);

const bot = new Telegraf(AppConstant.BOT_TOKEN, {
  telegram: {
    agent,
  },
})

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
