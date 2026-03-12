import { MessagesConstant } from '@/constants/messages/constant'
import {
  IStartService,
  startService
} from '@/services/start/service'
import { Context, Markup, Telegraf } from 'telegraf'
import { Update } from 'telegraf/types'

export const createStartController = (deps: {
  startService: IStartService
}) => {
  return async (ctx: Context) => {
    await deps.startService.findOrCreateUser({
      tg_id: ctx.from?.id as number,
      username: ctx.from?.username,
      first_name: ctx.from?.first_name,
      last_name: ctx.from?.last_name,
    })

    ctx.reply(MessagesConstant.START(ctx.from?.first_name), {
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback(
            MessagesConstant.BUTTON_ROOMS,
            MessagesConstant.BUTTON_ROOMS_GET_COMMAND
          ),
          Markup.button.callback(
            MessagesConstant.BUTTON_ROOMS_CREATE,
            MessagesConstant.BUTTON_ROOMS_CREATE_COMMAND
          ),
        ],
      ]).reply_markup,
    })
  }
}

export const startControllerConfig = (bot: Telegraf<Context<Update>>) => {
  const controller = createStartController({
    startService: startService,
  })

  bot.start(controller)
}
