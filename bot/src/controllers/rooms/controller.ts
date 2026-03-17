import { MessagesConstant } from '@/constants/messages/constant'
import {
  IRoomsService,
  roomsService,
  RoomWithMembers,
} from '@/services/rooms/service'
import { startService } from '@/services/start/service'
import { Context, Markup, Telegraf } from 'telegraf'
import { Update } from 'telegraf/types'

export class RoomsController {
  constructor(private readonly roomsService: IRoomsService) {}

  async createRoomHandleTitle(ctx: Context) {
    const roomName = ctx.message?.text?.trim()

    if (!ctx.session.creatingRoom) {
      return
    }
    //TODO: check text length in button
    if (roomName.length > 50) {
      await ctx.reply(MessagesConstant.ROOMS_TITLE_TOO_LONG)
      return
    }

    const userId = ctx.from?.id

    if (!userId) {
      await ctx.reply(MessagesConstant.ROOMS_USER_NOT_FOUND)
      return
    }

    try {
      const userData = await startService.findOrCreateUser({
        tg_id: userId,
        username: ctx.from?.username ?? null,
        first_name: ctx.from?.first_name ?? null,
        last_name: ctx.from?.last_name ?? null,
      })

      const room = await this.roomsService.createRoom(roomName, userData)

      await ctx.reply(MessagesConstant.ROOMS_CREATED_SUCCESS(room.name), {
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback(
              MessagesConstant.ROOMS_JOIN_ROOM,
              MessagesConstant.ROOMS_JOIN_ROOM_COMMAND(room.id)
            ),
          ],
        ]).reply_markup,
      })
    } catch (error) {
      await ctx.reply(MessagesConstant.ROOMS_CREATED_ERROR)
    }

    ctx.session.creatingRoom = false
  }

  async create(ctx: Context) {
    await ctx.reply(MessagesConstant.ROOMS_ENTER_TTILE, {
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback(
            MessagesConstant.BUTTON_BACK,
            MessagesConstant.BUTTON_ROOMS_CREATE_BACK_COMMAND
          ),
        ],
      ]).reply_markup,
    })
    ctx.session.creatingRoom = true
  }

  async get(ctx: Context) {
    const rooms = await this.roomsService.getAllRooms()

    if (rooms.length === 0) {
      await ctx.reply(MessagesConstant.ROOMS_NO_ROOMS_MESSAGE, {
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback(
              MessagesConstant.BUTTON_ROOMS_CREATE,
              MessagesConstant.BUTTON_ROOMS_CREATE_COMMAND
            ),
          ],
        ]).reply_markup,
      })
      return
    }

    const roomsListText = rooms
      .map((room) =>
        MessagesConstant.ROOMS_LIST_MESSAGE(
          room.name,
          room.roomMembers.filter((member) => member.is_active).length
        )
      )
      .join('\n\n')

    const keyboard: any[] = []
    const isMember = (room: RoomWithMembers) =>
      room.roomMembers.find((member) => member.user.tg_id === ctx.from?.id)
        ?.is_active
    rooms.forEach((room) => {
      keyboard.push([
        Markup.button.callback(
          MessagesConstant.ROOM_TTILE(room.name),
          MessagesConstant.ROOM_JOIN_COMMAND(room.id)
        ),
      ])

      keyboard.push(
        [
          Markup.button.callback(
            MessagesConstant.ROOM_DELETE(),
            MessagesConstant.ROOM_DELETE_COMMAND(room.id)
          ),
          Markup.button.callback(
            MessagesConstant.ROOM_EDIT(),
            MessagesConstant.ROOM_EDIT_COMMAND(room.id)
          ),
          isMember(room)
            ? Markup.button.callback(
                MessagesConstant.ROOMS_LEAVE,
                MessagesConstant.ROOMS_LEAVE_COMMAND(room.id)
              )
            : null,
        ].filter((btn) => btn !== null)
      )
    })

    keyboard.push([
      Markup.button.callback(
        MessagesConstant.BUTTON_ROOMS_CREATE,
        MessagesConstant.BUTTON_ROOMS_CREATE_COMMAND
      ),
    ])

    await ctx.reply(roomsListText, {
      reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
    })
  }

  async joinRoom(ctx: Context, roomId: number) {
    const userId = ctx.from?.id
    if (!userId) {
      await ctx.reply(MessagesConstant.ROOMS_USER_NOT_FOUND)
      return
    }

    try {
      const result = await this.roomsService.joinRoom(roomId, {
        tg_id: userId,
        username: ctx.from?.username ?? null,
        first_name: ctx.from?.first_name ?? null,
        last_name: ctx.from?.last_name ?? null,
      })

      await ctx.reply(
        MessagesConstant.ROOMS_JOINED_SUCCESS(
          result.roomDetail.name,
          ctx.botInfo.username,
          result.roomDetail.id
        ),
        {
          parse_mode: 'HTML',
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.button.callback(
                MessagesConstant.BUTTON_ROOMS_SUCCESS_ORDER,
                MessagesConstant.ORDER_CREATE_ACTION
              )
            ],
          ]).reply_markup,
        }
      )
    } catch (error) {
      const errorMessage = error as string
      await ctx.reply(MessagesConstant.ROOMS_JOIN_ERROR(errorMessage))
    }
  }

  async leaveRoom(ctx: Context, roomId: number) {
    const userId = ctx.from?.id
    if (!userId) {
      await ctx.reply(MessagesConstant.ROOMS_USER_NOT_FOUND)
      return
    }
    await this.roomsService.leaveRoom(roomId, {
      tg_id: userId,
    })
    await ctx.reply(MessagesConstant.ROOMS_LEAVE_SUCCESS)
    return this.get(ctx)
  }

  async deleteRoom(ctx: Context, roomId: number) {
    const room = await this.roomsService.softDeleteRoom(roomId, {
      tg_id: ctx.from?.id ?? 0,
      username: ctx.from?.username ?? null,
      first_name: ctx.from?.first_name ?? null,
      last_name: ctx.from?.last_name ?? null,
    })
    ctx.reply(MessagesConstant.ROOMS_DELETED_SUCCESS(room.name))
    return this.get(ctx)
  }

  // async updateRoom(ctx: Context, roomId: number) {}
}

export const roomsController = new RoomsController(roomsService)

export const roomsControllerConfig = (bot: Telegraf<Context<Update>>) => {
  bot.command(MessagesConstant.ROOMS_GET_ACTION, roomsController.get)
  bot.command(MessagesConstant.ROOMS_CREATE_ACTION, roomsController.create)

  bot.action(MessagesConstant.BUTTON_ROOMS_GET_COMMAND, async (ctx) => {
    await ctx.answerCbQuery()
    return roomsController.get(ctx)
  })
  bot.action(MessagesConstant.BUTTON_ROOMS_CREATE_COMMAND, async (ctx) => {
    await ctx.answerCbQuery()
    return roomsController.create(ctx)
  })
  bot.action(MessagesConstant.BUTTON_ROOMS_CREATE_BACK_COMMAND, async (ctx) => {
    await ctx.answerCbQuery()
    ctx.session.creatingRoom = false
    return roomsController.get(ctx)
  })
  bot.action(/^room_join_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery()
    const roomId = parseInt(ctx.match![1], 10)
    return roomsController.joinRoom(ctx, roomId)
  })
  bot.action(/^room_edit_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery()
    // const roomId = parseInt(ctx.match![1], 10)
    // return roomsController.updateRoom(ctx, roomId)
  })
  bot.action(/^room_delete_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery()
    const roomId = parseInt(ctx.match![1], 10)
    return roomsController.deleteRoom(ctx, roomId)
  })
  bot.action(/^room_leave_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery()
    const roomId = parseInt(ctx.match![1], 10)
    return roomsController.leaveRoom(ctx, roomId)
  })
}
