import { MessagesConstant } from '@/constants/messages/constant'
import { $Enums } from '@/database'
import { IOrdersService, ordersService } from '@/services/orders/service'
import { IUserService, startService } from '@/services/start/service'
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
    private readonly usersService: IUserService
  ) {}

  async startVoteSession(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)
    try {
      await this.votesSessionService.createSession({
        createdBy: ctx.user.id,
        roomId: roomMember.room.id,
      })
      const data = await this.sendOrdersInRoom(ctx)
      await ctx.reply(MessagesConstant.VOTE_START_SUCCESS)
      await ctx.reply(data.text, {
        reply_markup: data.reply_markup,
      })
      return this.sendOrdersInRoom(ctx)
    } catch (e) {
      await ctx.reply(MessagesConstant.VOTE_ERROR(e))
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
    const activeOrCompletedSession = sessions.find(
      (s) =>
        s.status === $Enums.VoteStatus.ACTIVE ||
        s.status === $Enums.VoteStatus.COMPLETED
    )

    if (!activeOrCompletedSession) {
      await ctx.reply(MessagesConstant.VOTE_NOT_FOUND)
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

        return MessagesConstant.VOTE_RESULTS_ITEM(
          medal,
          index,
          pizza,
          addons,
          comment,
          order.quantity,
          userName,
          votes.for,
          votes.against
        )
      })
      .join('\n\n')

    await ctx.reply(
      `${MessagesConstant.VOTE_RESULTS_TITLE(roomMember.room.name)}\n\n${resultsText}`,
      {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback(
              MessagesConstant.VOTE_BUTTON_REFRESH,
              MessagesConstant.VOTE_RESULTS_REFRESH_ACTION
            ),
          ],
          [
            Markup.button.callback(
              MessagesConstant.VOTE_BUTTON_BACK_TO_ORDERS,
              MessagesConstant.BUTTON_ORDERS_MY_COMMAND
            ),
          ],
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
        await ctx.reply(MessagesConstant.VOTE_ACTIVE_NOT_FOUND)
        return
      }

      await this.votesSessionService.completeSession(activeSession.id)

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
      await ctx.reply(MessagesConstant.VOTE_CANCEL_SUCCESS)
    } catch (e: any) {
      await ctx.reply(MessagesConstant.VOTE_CANCEL_ERROR(e.message))
    }
  }

  async sendOrdersInRoom(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)
    const roomId = roomMember.room_id
    const orders = await this.ordersService.getOrderInRoom(roomId)

    let messageText = MessagesConstant.VOTE_SESSION_TITLE(roomMember.room.name)
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
        Markup.button.callback(
          MessagesConstant.VOTE_BUTTON_FOR,
          MessagesConstant.VOTE_FOR_ACTION(order.id)
        ),
        Markup.button.callback(
          MessagesConstant.VOTE_BUTTON_AGAINST,
          MessagesConstant.VOTE_AGAINST_ACTION(order.id)
        ),
      ]

      if (userVote) {
        row.push(
          Markup.button.callback(
            MessagesConstant.VOTE_BUTTON_CANCEL,
            MessagesConstant.VOTE_CANCEL_ACTION(order.id)
          )
        )
      }

      keyboard.push(row)
    }

    keyboard.push([
      Markup.button.callback(
        MessagesConstant.VOTE_BUTTON_COMPLETE,
        MessagesConstant.VOTE_COMPLETE_ACTION
      ),
    ])
    keyboard.push([
      Markup.button.callback(
        MessagesConstant.VOTE_BUTTON_CANCEL_SESSION,
        MessagesConstant.VOTE_CANCEL_SESSION_ACTION
      ),
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
      await ctx.reply(MessagesConstant.VOTE_NO_ACTIVE_SESSION)
      return
    }

    return this.sendOrdersInRoom(ctx)
  }

  async voteFor(ctx: Context, orderId: number) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)
    try {
      await this.votesService.castVote({
        orderId,
        voterId: ctx.user.id,
        voteType: $Enums.VoteType.FOR,
        roomId: roomMember.room.id,
      })
    } catch (e) {
      await ctx.reply(`Error: ${e}`)
    }
  }

  async voteAgainst(ctx: Context, orderId: number) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)

    try {
      await this.votesService.castVote({
        orderId,
        voterId: ctx.user.id,
        voteType: $Enums.VoteType.AGAINST,
        roomId: roomMember.room.id,
      })
    } catch (e) {
      await ctx.reply(`Error: ${e}`)
    }
  }

  async voteCancel(ctx: Context, orderId: number) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)

    try {
      await this.votesService.revokeVote({
        orderId,
        voterId: ctx.user.id,
        roomId: roomMember.room.id,
      })
    } catch (e) {
      await ctx.reply(`Error: ${e}`)
    }
  }
}

export const votesController = new VotesController(
  votesService,
  votesSessionService,
  ordersService,
  startService
)

export const votesControllerConfig = (bot: Telegraf<Context<Update>>) => {
  bot.command(MessagesConstant.BUTTON_VOTE_START_COMMAND, (ctx) =>
    votesController.startVoteSession(ctx)
  )

  bot.command(MessagesConstant.VOTE_GET_ACTIVE_ACTION, async (ctx) => {
    const data = await votesController.getActiveVoteSession(ctx)
    if(!data?.text) return

    await ctx.reply(data.text, {
      reply_markup: data.reply_markup,
    })
  })

  bot.action(MessagesConstant.BUTTON_VOTE_START_COMMAND, async (ctx) => {
    await ctx.answerCbQuery()
    return votesController.startVoteSession(ctx)
  })
  bot.action(MessagesConstant.VOTE_GET_ACTIVE_ACTION, async (ctx) => {
    await ctx.answerCbQuery()
    const data = await votesController.getActiveVoteSession(ctx)
    if(!data?.text) return
    await ctx.reply(data.text, {
      reply_markup: data.reply_markup,
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

  bot.action(MessagesConstant.VOTE_COMPLETE_ACTION, async (ctx) => {
    await ctx.answerCbQuery()
    await votesController.completeSession(ctx)
  })

  bot.action(MessagesConstant.VOTE_CANCEL_SESSION_ACTION, async (ctx) => {
    await ctx.answerCbQuery()
    await votesController.cancelSession(ctx)
  })
}
