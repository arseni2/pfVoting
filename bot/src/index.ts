import { AppConstant } from '@/constants/env/constant'
import { MessagesConstant } from '@/constants/messages/constant'
import { helpControllerConfig } from '@/controllers/help/controller'
import {
  ordersController,
  ordersControllerConfig,
} from '@/controllers/orders/controller'
import {
  roomsController,
  roomsControllerConfig,
} from '@/controllers/rooms/controller'
import { startControllerConfig } from '@/controllers/start/controller'
import { votesControllerConfig } from '@/controllers/votes/controller'
import { startService, UserWithRoomMembers } from '@/services/start/service'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { session, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'

const agent = new HttpsProxyAgent(AppConstant.PROXY_URL)

const bot = new Telegraf(AppConstant.BOT_TOKEN, {
  telegram: {
    agent,
  },
})

interface SessionData {
  creatingRoom?: boolean
  creatingOrder?: boolean
  updatingOrderId?: number
}

declare module 'telegraf' {
  interface Context {
    session: SessionData
    user: UserWithRoomMembers
  }
}

bot.use(
  session({
    defaultSession: () => ({
      creatingRoom: false,
      creatingOrder: false,
      updatingOrderId: undefined,
    }),
  })
)

bot.use(async (ctx, next) => {
  const userId = ctx.from?.id
  if (!userId) {
    await ctx.reply(MessagesConstant.ROOMS_USER_NOT_FOUND)
    return
  }
  const user = await startService.findOrCreateUser({
    tg_id: userId,
    username: ctx.from?.username ?? null,
    first_name: ctx.from?.first_name ?? null,
    last_name: ctx.from?.last_name ?? null,
  })

  ctx.user = user
  await next()
})

startControllerConfig(bot)
roomsControllerConfig(bot)
ordersControllerConfig(bot)
votesControllerConfig(bot)
helpControllerConfig(bot)

bot.on(message('text'), async (ctx) => {
  if (ctx.session?.updatingOrderId) {
    return ordersController.updateOrderHandleData(ctx)
  }
  if (ctx.session?.creatingOrder) {
    return ordersController.createOrderHandleData(ctx)
  }
  await roomsController.createRoomHandleTitle(ctx)
})

bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
