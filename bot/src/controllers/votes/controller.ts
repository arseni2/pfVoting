import { MessagesConstant } from '@/constants/messages/constant'
import { $Enums } from '@/database'
import { IOrdersService, ordersService } from '@/services/orders/service'
import { IStartService, startService } from '@/services/start/service'
import { IVotesService, votesService } from '@/services/votes/servce'
import {
  IVotesSessionService,
  votesSessionService,
} from '@/services/votes/session/service'
import { Context, Markup, Telegraf } from 'telegraf'
import { Update } from 'telegraf/types'

export class VotesController {
  constructor(
    private readonly votesService: IVotesService,
    private readonly votesSessionService: IVotesSessionService,
    private readonly ordersService: IOrdersService,
    private readonly usersService: IStartService
  ) {}

  async startVoteSession(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)
    try {
      await this.votesSessionService.createSession({
        createdBy: ctx.user.id,
        roomId: roomMember.room.id,
      })

      await ctx.reply(MessagesConstant.VOTE_START_SUCCESS)
      return this.sendOrdersInRoom(ctx)
    } catch (e) {
      await ctx.reply(`Error - ${e}`)
      const data = await this.sendOrdersInRoom(ctx)
      await ctx.reply(data.text, {
        reply_markup: data.reply_markup,
      })
    }
  }

  async resultSession(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)

    const sessions = await this.votesSessionService.getSessionsByRoom(
      roomMember.room.id
    )
    console.log("sessions = ", sessions)
    const activeOrCompletedSession = sessions.find(
      (s) => s.status === $Enums.VoteStatus.ACTIVE || s.status === $Enums.VoteStatus.COMPLETED
    )

    console.log("activeOrCompletedSession = ", activeOrCompletedSession)
    if (!activeOrCompletedSession) {
      await ctx.reply('❌ Голосование не найдено')
      return
    }

    const results = await this.votesService.getOrdersSortedByVotes(
      roomMember.room.id
    )

    const resultsText = results
      .map((item, index) => {
        const { order, votes } = item
        const userName = order.user?.first_name ?? 'Аноним'
        const pizza = order.pizza_name
        const addons = order.addons ? `+ ${order.addons}` : ''
        const comment = order.comment ? `(${order.comment})` : ''

        const medal =
          index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  '

        return `${medal} ${index + 1}. 🍕 ${pizza} ${addons} ${comment} [${order.quantity}] — ${userName}\n   👍 ${votes.for} | 👎 ${votes.against}`
      })
      .join('\n\n')
      console.log("resultsText = ", resultsText)
    await ctx.reply(
      `🗳️ Результаты голосования в комнате "${roomMember.room.name}"\n\n${resultsText}`,
      {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Обновить', 'vote_results_refresh')],
          [Markup.button.callback('📋 Назад к заказам', 'vote_status')],
        ]).reply_markup,
      }
    )
  }

  async completeSession(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)

    try {
      const sessions = await this.votesSessionService.getSessionsByRoom(
        roomMember.room.id
      )
      const activeSession = sessions.find((s) => s.status === 'ACTIVE')

      if (!activeSession) {
        await ctx.reply('❌ Активное голосование не найдено')
        return
      }

      await this.votesSessionService.completeSession(activeSession.id)

      await ctx.reply('✅ Голосование завершено!')

      return this.resultSession(ctx)
    } catch (e: any) {
      await ctx.reply(`Ошибка завершения: ${e.message}`)
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
        await ctx.reply('❌ Активное голосование не найдено')
        return
      }

      await this.votesSessionService.cancelSession(
        activeSession.id,
        ctx.user.id
      )
      await ctx.reply('Голосование успешно отменено')
    } catch (e: any) {
      await ctx.reply(`Ошибка отмены голосования: ${e.message}`)
    }
  }

  async sendOrdersInRoom(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)
    const roomId = roomMember.room_id
    const orders = await this.ordersService.getOrderInRoom(roomId)

    let messageText = `🗳️ Голосование в комнате "${roomMember.room.name}"\n\n`
    const keyboard: any[][] = []

    for (const order of orders) {
      const userName = order.user?.first_name ?? 'Аноним'
      const addons = order.addons ? `+ ${order.addons}` : ''
      const comment = order.comment ? `(${order.comment})` : ''

      messageText += `🍕 ${order.pizza_name} ${addons} ${comment} [${order.quantity}] — ${userName}\n`

      const userVote = order.votes?.find(
        (vote) => vote.voter_id === ctx.user.id
      )

      const row = [
        Markup.button.callback('👍 За', `vote_for_${order.id}`),
        Markup.button.callback('👎 Против', `vote_against_${order.id}`),
      ]

      if (userVote) {
        row.push(Markup.button.callback('↩️', `vote_cancel_${order.id}`))
      }

      keyboard.push(row)
    }

    keyboard.push([
      Markup.button.callback('🗳️ Завершить голосование', 'vote_complete'),
    ])
    keyboard.push([
      Markup.button.callback('🗳️ Отменить голосование', 'vote_cancel_session'),
    ])

    return {
      text: messageText,
      reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
    }
  }

  async getActiveVoteSession(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)

    const sessions = await this.votesSessionService.getSessionsByRoom(
      roomMember.room.id
    )

    const activeSession = sessions.find((s) => s.status === 'ACTIVE')

    if (!activeSession) {
      await ctx.reply('❌ В комнате нет активного голосования')
      return
    }

    return this.sendOrdersInRoom(ctx)
  }

  async voteFor(ctx: Context, orderId: number) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)

    await this.votesService.castVote({
      orderId,
      voterId: ctx.user.id,
      voteType: $Enums.VoteType.FOR,
      roomId: roomMember.room.id,
    })
  }

  async voteAgainst(ctx: Context, orderId: number) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)

    await this.votesService.castVote({
      orderId,
      voterId: ctx.user.id,
      voteType: $Enums.VoteType.AGAINST,
      roomId: roomMember.room.id,
    })
  }

  async voteCancel(ctx: Context, orderId: number) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)

    await this.votesService.revokeVote({
      orderId,
      voterId: ctx.user.id,
      roomId: roomMember.room.id,
    })
  }
}

export const votesController = new VotesController(
  votesService,
  votesSessionService,
  ordersService,
  startService
)

export const votesControllerConfig = (bot: Telegraf<Context<Update>>) => {
  bot.command(
    MessagesConstant.BUTTON_VOTE_START_COMMAND,
    votesController.startVoteSession
  )

  bot.action(MessagesConstant.BUTTON_VOTE_START_COMMAND, async (ctx) => {
    await ctx.answerCbQuery()
    return votesController.startVoteSession(ctx)
  })
  bot.action(MessagesConstant.VOTE_GET_ACTIVE_ACTION, async (ctx) => {
    await ctx.answerCbQuery()
    const data = await votesController.getActiveVoteSession(ctx)
    await ctx.reply(data?.text ?? '', {
      reply_markup: data?.reply_markup,
    })
  })

  bot.action(/^vote_for_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery()
    const orderId = parseInt(ctx.match![1], 10)

    try {
      await votesController.voteFor(ctx, orderId)

      const updated = await votesController.sendOrdersInRoom(ctx)

      await ctx.editMessageText(updated.text, {
        parse_mode: 'HTML',
        reply_markup: updated.reply_markup,
      })
    } catch (e: any) {
      await ctx.answerCbQuery(e.message, { show_alert: true })
    }
  })

  bot.action(/^vote_against_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery()
    const orderId = parseInt(ctx.match![1], 10)

    try {
      await votesController.voteAgainst(ctx, orderId)

      const updated = await votesController.sendOrdersInRoom(ctx)

      await ctx.editMessageText(updated.text, {
        parse_mode: 'HTML',
        reply_markup: updated.reply_markup,
      })
    } catch (e: any) {
      await ctx.answerCbQuery(e.message, { show_alert: true })
    }
  })

  bot.action(/^vote_cancel_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery()
    const orderId = parseInt(ctx.match![1], 10)

    try {
      await votesController.voteCancel(ctx, orderId)

      const updated = await votesController.sendOrdersInRoom(ctx)

      await ctx.editMessageText(updated.text, {
        parse_mode: 'HTML',
        reply_markup: updated.reply_markup,
      })
    } catch (e: any) {
      await ctx.answerCbQuery(e.message, { show_alert: true })
    }
  })

  bot.action('vote_complete', async (ctx) => {
    await ctx.answerCbQuery()
    await votesController.completeSession(ctx)
  })

  bot.action('vote_cancel_session', async (ctx) => {
    await ctx.answerCbQuery()
    await votesController.cancelSession(ctx)
  })
}
