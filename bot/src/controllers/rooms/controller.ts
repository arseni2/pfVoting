import { MessagesConstant } from '@/constants/messages/constant'
import { IRoomsService, roomsService } from '@/services/rooms/service'
import { startService } from '@/services/start/service'
import { Context, Markup, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { Update } from 'telegraf/types'

export class RoomsController {
  constructor(private readonly roomsService: IRoomsService) {}

  //TODO: make single responsibility
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
            MessagesConstant.BUTTON_ROOMS_CREATE_BACK,
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
        MessagesConstant.ROOMS_LIST_MESSAGE(room.name, room.roomMembers.length)
      )
      .join('\n\n')

    const keyboard = rooms.map((room) => [
      Markup.button.callback(`🚪 ${room.name}`, `room_join_${room.id}`),
    ])

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
}

export const roomsControllerConfig = (bot: Telegraf<Context<Update>>) => {
  const roomsController = new RoomsController(roomsService)

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

  bot.on(message('text'), async (ctx) => {
    await roomsController.createRoomHandleTitle(ctx)
  })
}
