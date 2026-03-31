import { MessagesConstant } from '@/constants/messages/constant'
import { IOrdersService, ordersService } from '@/services/orders/service'
import { IRoomsService, roomsService } from '@/services/rooms/service'
import { IUserService, startService } from '@/services/start/service'
import { Context, Markup, Telegraf } from 'telegraf'
import { Update } from 'telegraf/types'

export class VotesController {
  constructor(
    private readonly ordersService: IOrdersService,
    private readonly usersService: IUserService,
    private readonly roomsService: IRoomsService
  ) {}

  async startVoteSession(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)
    try {
      const orders = await this.ordersService.getOrderInRoom(roomMember.room_id)

      if (orders.length === 0) {
        await ctx.reply('❌ Нет заказов для голосования')
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
        } as any
      )

      await ctx.reply(MessagesConstant.VOTE_START_SUCCESS)

      // Отправляем poll всем пользователям в комнате
      const users = await this.roomsService.getUsersInRoom(roomMember.room.id)
      console.log(`[startVoteSession] пользователей в комнате: ${users.length}`, users.map(u => ({ tg_id: u.tg_id, chat_id: u.chat_id })))
      
      for (const user of users) {                               
        // Пропускаем текущего пользователя (ему уже отправлен poll)
        if (user.id === ctx.user.id) {
          console.log(`[startVoteSession] пропускаем текущего пользователя ${user.tg_id}`)
          continue
        }

        const chatId = user.chat_id
        if (!chatId) {
          console.warn(`[startVoteSession] У пользователя ${user.tg_id} нет chat_id`)
          continue
        }
        try {
          console.log(`[startVoteSession] отправляем poll пользователю ${user.tg_id} в чат ${chatId}`)
          await ctx.telegram.sendPoll(
            chatId,
            `🗳️ Голосование в комнате "${roomMember.room.name}"`,
            pollOptions,
            {
              is_anonymous: false,
              type: 'regular',
              allows_multiple_answers: true,
            } as any
          )
        } catch (e: any) {
          console.error(`Ошибка отправки poll пользователю ${user.tg_id}:`, e.message)
        }
      }
    } catch (e: any) {
      await ctx.reply(MessagesConstant.VOTE_ERROR(e))
    }
  }
}

export const votesController = new VotesController(
  ordersService,
  startService,
  roomsService
)

export const votesControllerConfig = (bot: Telegraf<Context<Update>>) => {
  bot.command(MessagesConstant.BUTTON_VOTE_START_COMMAND, (ctx) =>
    votesController.startVoteSession(ctx)
  )

  bot.action(MessagesConstant.BUTTON_VOTE_START_COMMAND, async (ctx) => {
    await ctx.answerCbQuery()
    return votesController.startVoteSession(ctx)
  })
}
