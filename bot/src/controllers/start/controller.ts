import { MessagesConstant } from '@/constants/messages/constant'
import { Context, Markup, Telegraf } from 'telegraf'
import { Update } from 'telegraf/types'
import { roomsCreateController } from '@/controllers/rooms/create'
import { roomsController } from '@/controllers/rooms/get'

export const startController = (ctx: Context) => {
  ctx.reply(MessagesConstant.START(ctx.from?.first_name), {
    reply_markup: Markup.inlineKeyboard([
      [
        Markup.button.callback(
          MessagesConstant.BUTTON_ROOMS,
          MessagesConstant.BUTTON_ROOMS_COMMAND
        ),
        Markup.button.callback(
          MessagesConstant.BUTTON_ROOMS_CREATE,
          MessagesConstant.BUTTON_ROOMS_CREATE_COMMAND
        ),
      ],
    ]).reply_markup,
  })
}

export const startControllerConfig = (bot: Telegraf<Context<Update>>) => {
  bot.start(startController)

  bot.action(MessagesConstant.BUTTON_ROOMS_COMMAND, async (ctx) => {
    await ctx.answerCbQuery()
    return roomsController(ctx)
  })

  bot.action(MessagesConstant.BUTTON_ROOMS_CREATE_COMMAND, async (ctx) => {
    await ctx.answerCbQuery()
    return roomsCreateController(ctx)
  })
}
