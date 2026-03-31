import { AppConstant } from '@/constants/env/constant'
import {
  ICreateOrderApi,
  ordersController,
  ordersControllerConfig,
} from '@/controllers/orders/controller'
import {
  roomsController,
  roomsControllerConfig,
} from '@/controllers/rooms/controller'
import { startControllerConfig } from '@/controllers/start/controller'
import { votesControllerConfig } from '@/controllers/votes/controller'
import { prisma } from '@/config/orm/config'
import { startService, UserWithRoomMembers } from '@/services/start/service'
import { voteService } from '@/services/votes/service'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { session, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { helpControllerConfig } from '@/controllers/help/controller'

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

// Обработчик голосов в опросах - должен быть ДО middleware с ctx.user
bot.on('poll_answer', async (ctx) => {
  const { poll_id, option_ids } = ctx.pollAnswer
  const userId = ctx.from?.id

  console.log(
    `[poll_answer] poll_id: ${poll_id}, option_ids: ${option_ids}, from:`,
    ctx.from
  )

  if (!userId) {
    console.warn('[poll_answer] no user in context')
    return
  }

  try {
    // Находим сессию по poll_id
    const session = await prisma.voteSession.findFirst({
      where: { telegram_poll_id: poll_id },
    })

    console.log(
      `[poll_answer] session:`,
      session ? `found (id: ${session.id})` : 'not found'
    )

    if (!session) {
      console.warn(`[poll_answer] session not found for poll_id: ${poll_id}`)
      return
    }

    // Сохраняем все выбранные голоса (option_ids - это массив индексов выбранных опций)
    console.log(
      `[poll_answer] saving votes: session=${session.id}, user=${userId}, options=${option_ids}`
    )
    await voteService.saveVote(session.id, userId, option_ids)
    console.log(`[poll_answer] votes saved successfully`)
  } catch (e) {
    console.error('Ошибка сохранения голоса:', e)
  }
})

bot.use(async (ctx, next) => {
  // Пропускаем обновления без пользователя (poll, poll_answer и т.д.)
  // Но poll_answer уже обработан выше
  if (!ctx.from && ctx.updateType !== 'poll_answer') {
    return next()
  }

  const userId = ctx.from?.id
  if (!userId) {
    return next()
  }

  const userData: any = {
    tg_id: userId,
    username: ctx.from.username ?? null,
    first_name: ctx.from.first_name ?? null,
    last_name: ctx.from.last_name ?? null,
  }

  // Получаем chat_id из сообщения или callback query
  if ('message' in ctx.update && ctx.update.message?.chat?.id) {
    userData.chat_id = String(ctx.update.message.chat.id)
  } else if (
    'callback_query' in ctx.update &&
    ctx.update.callback_query?.message?.chat?.id
  ) {
    userData.chat_id = String(ctx.update.callback_query.message.chat.id)
  }

  const user = await startService.findOrCreateUser(userData)

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

const app = express()
const port = 3000

// Parse JSON bodies
app.use(express.json())

// Enable CORS
app.use(cors({
  origin: "*",
  credentials: true,
  methods: "*",
  allowedHeaders: "*",
}))

interface OrderRequestBody {
  products: ICreateOrderApi[]
  user: { tg_id: string }
}

app.post(
  '/orders',
  (req: Request<never, never, OrderRequestBody>, res: Response) => {
    return ordersController.createOrdersAPI(
      req.body.products,
      req.body.user,
      res
    )
  }
)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})