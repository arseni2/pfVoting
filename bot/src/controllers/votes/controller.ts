import { MessagesConstant } from '@/constants/messages/constant'
import { $Enums } from '@/database'
import { IOrdersService, ordersService } from '@/services/orders/service'
import { IRoomsService, roomsService } from '@/services/rooms/service'
import { IUserService, startService } from '@/services/start/service'
import { IVotesSessionService, votesSessionService } from '@/services/votes/session/service'
import { Context, Markup, Telegraf } from 'telegraf'
import { Update } from 'telegraf/types'

export class VotesController {
  constructor(
    private readonly votesSessionService: IVotesSessionService,
    private readonly ordersService: IOrdersService,
    private readonly usersService: IUserService,
    private readonly roomsService: IRoomsService
  ) {}

  async startVoteSession(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)
    try {
      const session = await this.votesSessionService.createSession({
        createdBy: ctx.user.id,
        roomId: roomMember.room.id,
      })

      const orders = await this.ordersService.getOrderInRoom(roomMember.room_id)

      if (orders.length === 0) {
        await ctx.reply('❌ Нет заказов для голосования')
        await this.votesSessionService.cancelSession(session.id, ctx.user.id)
        return
      }

      const pollOptions = orders.map((order) => {
        const userName = order.user?.first_name ?? 'Аноним'
        return MessagesConstant.VOTE_POLL_QUESTION(
          order.pizza_name,
          order.addons,
          order.comment,
          order.quantity,
          userName
        )
      })

      const poll = await ctx.replyWithPoll(
        `🗳️ Голосование в комнате "${roomMember.room.name}"`,
        pollOptions,
        {
          is_anonymous: false,
          type: 'regular',
          allows_multiple_answers: true,
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.button.callback(
                MessagesConstant.VOTE_BUTTON_COMPLETE,
                MessagesConstant.VOTE_COMPLETE_ACTION
              ),
            ],
            [
              Markup.button.callback(
                MessagesConstant.VOTE_BUTTON_CANCEL_SESSION,
                MessagesConstant.VOTE_CANCEL_SESSION_ACTION
              ),
            ],
          ]).reply_markup,
        } as any
      )

      // Сохраняем и poll.id, и message_id, и chat_id, и snapshot опций
      await this.votesSessionService.saveTelegramPollId(
        session.id,
        poll.poll.id
      )
      await this.votesSessionService.saveTelegramMessageId(
        session.id,
        poll.message_id
      )
      if (ctx.chat) {
        await this.votesSessionService.saveTelegramChatId(
          session.id,
          String(ctx.chat.id)
        )
      }

      await ctx.reply(MessagesConstant.VOTE_START_SUCCESS)

      // Отправляем poll всем пользователям в комнате
      const users = await this.roomsService.getUsersInRoom(roomMember.room.id)
      for (const user of users) {
        // Пропускаем текущего пользователя (ему уже отправлен poll)
        if (user.id === ctx.user.id) continue

        const chatId = user.chat_id
        if (!chatId) {
          console.warn(`У пользователя ${user.tg_id} нет chat_id`)
          continue
        }
        try {
          const userPoll = await ctx.telegram.sendPoll(
            chatId,
            `🗳️ Голосование в комнате "${roomMember.room.name}"`,
            pollOptions,
            {
              is_anonymous: false,
              type: 'regular',
              allows_multiple_answers: true,
              reply_markup: Markup.inlineKeyboard([
                [
                  Markup.button.callback(
                    MessagesConstant.VOTE_BUTTON_COMPLETE,
                    MessagesConstant.VOTE_COMPLETE_ACTION
                  ),
                ],
                [
                  Markup.button.callback(
                    MessagesConstant.VOTE_BUTTON_CANCEL_SESSION,
                    MessagesConstant.VOTE_CANCEL_SESSION_ACTION
                  ),
                ],
              ]).reply_markup,
            } as any
          )
          // Сохраняем message_id для этого пользователя (опционально)
          console.log(`Poll отправлен пользователю ${user.tg_id}, message_id: ${userPoll.message_id}`)
        } catch (e: any) {
          console.error(`Ошибка отправки poll пользователю ${user.tg_id}:`, e.message)
        }
      }
    } catch (e: any) {
      await ctx.reply(MessagesConstant.VOTE_ERROR(e))
    }
  }

  async resultSession(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)
    const sessions = await this.votesSessionService.getSessionsByRoom(
      roomMember.room.id
    )
    const activeOrCompletedSession = sessions.find(
      (s) =>
        s.status === $Enums.VoteStatus.ACTIVE ||
        s.status === $Enums.VoteStatus.COMPLETED
    )

    if (!activeOrCompletedSession) {
      await ctx.reply(MessagesConstant.VOTE_NOT_FOUND)
      return
    }

    const telegramMessageId = activeOrCompletedSession.telegram_message_id
    const telegramChatId = activeOrCompletedSession.telegram_chat_id
    
    if (!telegramMessageId || !telegramChatId) {
      await ctx.reply('❌ Poll не найден')
      return
    }

    try {
      // Получаем сообщение с poll через callApi
      const message: any = await (ctx.telegram as any).callApi('getMessage', {
        chat_id: telegramChatId,
        message_id: telegramMessageId,
      })
      
      const poll = message?.poll
      if (!poll) {
        await ctx.reply('❌ Poll не найден в сообщении')
        return
      }

      const orders = await this.ordersService.getOrderInRoom(roomMember.room_id)

      const results = poll.options.map((option: any, index: number) => {
        const order = orders[index]
        const userName = order?.user?.first_name ?? 'Аноним'
        const pizza = order?.pizza_name ?? 'Неизвестно'
        const addons = order?.addons ? `+ ${order.addons}` : ''
        const comment = order?.comment ? `(${order.comment})` : ''
        const quantity = order?.quantity ?? 0

        const medal =
          index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  '

        return MessagesConstant.VOTE_RESULTS_ITEM(
          medal,
          index,
          pizza,
          addons,
          comment,
          quantity,
          userName,
          option.voter_count,
          0
        )
      })

      const resultsText = results.join('\n\n')

      const users = await this.roomsService.getUsersInRoom(roomMember.room.id)
      for (const user of users) {
        if (user.id === ctx.user.id) continue

        const userChatId = user.chat_id
        if (!userChatId) continue
        try {
          await ctx.telegram.sendMessage(
            userChatId,
            `${MessagesConstant.VOTE_RESULTS_TITLE(roomMember.room.name)}\n\n${resultsText}`,
            {
              parse_mode: 'HTML',
              reply_markup: Markup.inlineKeyboard([
                [
                  Markup.button.callback(
                    MessagesConstant.VOTE_BUTTON_BACK_TO_ORDERS,
                    MessagesConstant.BUTTON_ORDERS_MY_COMMAND
                  ),
                ],
              ]).reply_markup,
            }
          )
        } catch (e: any) {
          console.error(`Ошибка отправки результатов пользователю ${user.tg_id}:`, e.message)
        }
      }

      await ctx.reply(
        `${MessagesConstant.VOTE_RESULTS_TITLE(roomMember.room.name)}\n\n${resultsText}`,
        {
          parse_mode: 'HTML',
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.button.callback(
                MessagesConstant.VOTE_BUTTON_BACK_TO_ORDERS,
                MessagesConstant.BUTTON_ORDERS_MY_COMMAND
              ),
            ],
          ]).reply_markup,
        }
      )
    } catch (e: any) {
      await ctx.reply(`Ошибка получения результатов: ${e.message}`)
    }
  }

  async completeSession(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)

    try {
      const sessions = await this.votesSessionService.getSessionsByRoom(
        roomMember.room.id
      )
      const activeSession = sessions.find((s) => s.status === 'ACTIVE')

      if (!activeSession) {
        await ctx.reply(MessagesConstant.VOTE_ACTIVE_NOT_FOUND)
        return
      }

      await this.votesSessionService.completeSession(activeSession.id)

      const telegramMessageId = activeSession.telegram_message_id
      const telegramChatId = activeSession.telegram_chat_id
      
      if (telegramMessageId && telegramChatId) {
        try {
          await ctx.telegram.stopPoll(
            telegramChatId,
            telegramMessageId
          )
        } catch (e: any) {
          console.error('Ошибка остановки poll:', e.message)
        }
      }

      await ctx.reply(MessagesConstant.VOTE_COMPLETE_SUCCESS)

      return this.resultSession(ctx)
    } catch (e: any) {
      await ctx.reply(MessagesConstant.VOTE_COMPLETE_ERROR(e.message))
    }
  }

  async cancelSession(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)

    try {
      const sessions = await this.votesSessionService.getSessionsByRoom(
        roomMember.room.id
      )
      const activeSession = sessions.find((s) => s.status === 'ACTIVE')

      if (!activeSession) {
        await ctx.reply(MessagesConstant.VOTE_ACTIVE_NOT_FOUND)
        return
      }

      await this.votesSessionService.cancelSession(
        activeSession.id,
        ctx.user.id
      )

      const telegramMessageId = activeSession.telegram_message_id
      const telegramChatId = activeSession.telegram_chat_id
      
      if (telegramMessageId && telegramChatId) {
        try {
          await ctx.telegram.stopPoll(
            telegramChatId,
            telegramMessageId
          )
        } catch (e: any) {
          console.error('Ошибка остановки poll:', e.message)
        }
      }

      await ctx.reply(MessagesConstant.VOTE_CANCEL_SUCCESS)
    } catch (e: any) {
      await ctx.reply(MessagesConstant.VOTE_CANCEL_ERROR(e.message))
    }
  }

  async getActiveVoteSession(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)

    const sessions = await this.votesSessionService.getSessionsByRoom(
      roomMember.room.id
    )
    
    const activeSession = sessions.find((s) => s.status === $Enums.VoteStatus.ACTIVE)

    if (!activeSession) {
      await ctx.reply(MessagesConstant.VOTE_NO_ACTIVE_SESSION)
      return
    }

    const telegramMessageId = activeSession.telegram_message_id
    const telegramChatId = activeSession.telegram_chat_id
    
    if (!telegramMessageId || !telegramChatId) {
      await ctx.reply('❌ Poll не найден')
      return
    }

    try {
      // Получаем сообщение с poll через callApi
      const message: any = await (ctx.telegram as any).callApi('getMessage', {
        chat_id: telegramChatId,
        message_id: telegramMessageId,
      })
      
      const poll = message?.poll
      if (!poll) {
        await ctx.reply('❌ Poll не найден в сообщении')
        return
      }

      // Формируем сообщение с текущими результатами
      const orders = await this.ordersService.getOrderInRoom(roomMember.room_id)

      const resultsText = poll.options.map((option: any, index: number) => {
        const order = orders[index]
        const userName = order?.user?.first_name ?? 'Аноним'
        const pizza = order?.pizza_name ?? 'Неизвестно'
        const addons = order?.addons ? `+ ${order.addons}` : ''
        const comment = order?.comment ? `(${order.comment})` : ''
        const quantity = order?.quantity ?? 0

        return `🍕 ${pizza} ${addons} ${comment} [${quantity}] — ${userName}\n   👍 ${option.voter_count}`
      }).join('\n\n')

      await ctx.reply(
        `🗳️ Активное голосование в комнате "${roomMember.room.name}"\n\n${resultsText}`,
        {
          parse_mode: 'HTML',
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.button.callback(
                MessagesConstant.VOTE_BUTTON_COMPLETE,
                MessagesConstant.VOTE_COMPLETE_ACTION
              ),
            ],
            [
              Markup.button.callback(
                MessagesConstant.VOTE_BUTTON_CANCEL_SESSION,
                MessagesConstant.VOTE_CANCEL_SESSION_ACTION
              ),
            ],
          ]).reply_markup,
        }
      )
    } catch (e: any) {
      await ctx.reply(`Ошибка: ${e.message}`)
    }
  }
}

export const votesController = new VotesController(
  votesSessionService,
  ordersService,
  startService,
  roomsService
)

export const votesControllerConfig = (bot: Telegraf<Context<Update>>) => {
  bot.command(MessagesConstant.BUTTON_VOTE_START_COMMAND, (ctx) =>
    votesController.startVoteSession(ctx)
  )

  bot.command(MessagesConstant.VOTE_GET_ACTIVE_ACTION, async (ctx) => {
    return votesController.getActiveVoteSession(ctx)
  })

  bot.action(MessagesConstant.VOTE_GET_ACTIVE_ACTION, async (ctx) => {
    await ctx.answerCbQuery()
    return votesController.getActiveVoteSession(ctx)
  })

  bot.action(MessagesConstant.BUTTON_VOTE_START_COMMAND, async (ctx) => {
    await ctx.answerCbQuery()
    return votesController.startVoteSession(ctx)
  })

  bot.action(MessagesConstant.VOTE_COMPLETE_ACTION, async (ctx) => {
    await ctx.answerCbQuery()
    await votesController.completeSession(ctx)
  })

  bot.action(MessagesConstant.VOTE_CANCEL_SESSION_ACTION, async (ctx) => {
    await ctx.answerCbQuery()
    await votesController.cancelSession(ctx)
  })
}
