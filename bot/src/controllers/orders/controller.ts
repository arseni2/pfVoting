import { MessagesConstant } from '@/constants/messages/constant'
import {
  IOrdersService,
  ordersService,
  OrderWithUser,
} from '@/services/orders/service'
import { IStartService, startService } from '@/services/start/service'
import { Context, Markup, Telegraf } from 'telegraf'
import { Update } from 'telegraf/types'

export class OrdersController {
  constructor(
    private readonly ordersService: IOrdersService,
    private readonly usersService: IStartService
  ) {}

  private async sendOrders(
    ctx: Context,
    orders: OrderWithUser[],
    roomName?: string
  ) {
    if (orders.length === 0) {
      await ctx.reply('📭 В комнате пока нет заказов')
      return
    }

    const header = roomName
      ? `🏠 В комнате "${roomName}"\n\n`
      : '📋 Ваши заказы:\n\n'

    const ordersText = orders
      .map((order) => {
        const userName = order.user?.first_name ?? 'Аноним'
        const pizza = order.pizza_name
        const addons = order.addons
        const comment = order.comment
        const quantity = order.quantity ?? 1
        return !roomName
          ? `${pizza} ${addons ? `+ ${addons}` : ""} ${comment ? `(${comment})` : ""} [${quantity}]`
          : `👤 ${userName} — ${pizza} ${addons ? `+ ${addons}` : ""} ${comment ? `(${comment})` : ""} [${quantity}]`
      })
      .join('\n')

    const text = `${header}${ordersText}`

    const keyboard: any[][] = [
      ...orders.map((order) => [
        Markup.button.callback(
          `🗑️ Удалить: ${order.pizza_name}`,
          `order_delete_${order.id}`
        ),
        Markup.button.callback(
          `✏️ Изменить`,
          `order_update_${order.id}`
        ),
      ]),
      [
        Markup.button.callback(
          '🗳️ Провести голосование',
          MessagesConstant.BUTTON_VOTE_START_COMMAND
        ),
      ],
      [
        Markup.button.callback(
          '➕ Добавить заказ',
          MessagesConstant.ORDER_CREATE_ACTION
        ),
        Markup.button.callback(
          '📋 Мои заказы',
          MessagesConstant.BUTTON_ORDERS_MY_COMMAND
        ),
      ],
      [
        Markup.button.callback(
          'Активное голосование',
          MessagesConstant.VOTE_GET_ACTIVE_ACTION
        ),
      ]
    ]

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
    })
  }

  private parseOrderInput(text: string): {
    pizza_name: string
    quantity: number
    addons: string | null
    comment: string | null
  } | null {
    const regex =
      /^([^+(]+?)\s*(?:\+\s*([^()]+?))?\s*(?:\(([^)]+)\))?\s*(?:\[(\d+)\])?$/i

    const match = text.match(regex)

    if (!match) {
      return null
    }

    const [, pizzaNameRaw, addonsRaw, commentRaw, quantityRaw] = match

    const pizza_name = pizzaNameRaw?.trim()
    if (!pizza_name || pizza_name.length > 100) {
      return null
    }

    const addons = addonsRaw ? addonsRaw.trim() : null

    const comment = commentRaw ? commentRaw.trim() : null

    const quantity = quantityRaw ? parseInt(quantityRaw, 10) : 1
    if (quantity < 1 || quantity > 10) {
      return null
    }

    return {
      pizza_name,
      addons,
      comment,
      quantity,
    }
  }

  async createOrderHandleData(ctx: Context) {
    const text = ctx.message?.text?.trim()

    if (!ctx.session?.creatingOrder) {
      return
    }

    if (!text) {
      await ctx.reply(MessagesConstant.ORDER_EMPTY_INPUT)
      return
    }

    try {
      const parsed = this.parseOrderInput(text)

      if (!parsed) {
        await ctx.reply(MessagesConstant.ORDER_INVALID_FORMAT, {
          parse_mode: "HTML"
        })
        return
      }
      const userId = ctx.from?.id
      const roomMember = await this.usersService.getRoomIdByUser(ctx)
      const roomId = roomMember.room_id

      if (!userId || !roomId) {
        await ctx.reply(MessagesConstant.ROOMS_USER_NOT_FOUND)
        return
      }

      const order = await this.ordersService.create(
        parsed.pizza_name,
        ctx.user,
        roomId,
        parsed.addons,
        parsed.comment,
        parsed.quantity
      )

      await ctx.reply(
        MessagesConstant.ORDER_CREATED_SUCCESS(
          order.pizza_name,
          order.addons,
          order.comment
        ),
        {
          parse_mode: 'HTML',
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.button.callback(
                '📋 Мои заказы',
                MessagesConstant.BUTTON_ORDERS_MY_COMMAND
              ),
              Markup.button.callback(
                '➕ Ещё заказ',
                MessagesConstant.ORDER_CREATE_ACTION
              ),
              Markup.button.callback(
                'Редактировать',
                MessagesConstant.BUTTON_ORDER_UPDATE_COMMAND
              ),
            ],
          ]).reply_markup,
        }
      )
    } catch (error) {
      console.error('Error creating order:', error)
      await ctx.reply(MessagesConstant.ORDER_CREATED_ERROR)
    }

    ctx.session.creatingOrder = false
  }

  async create(ctx: Context) {
    await ctx.reply(MessagesConstant.ORDER_ENTER_DATA, {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback(
            MessagesConstant.BUTTON_BACK,
            MessagesConstant.ORDER_CREATE_BACK_COMMAND
          ),
        ],
      ]).reply_markup,
    })
    ctx.session.creatingOrder = true
  }

  async get(ctx: Context) {
    const roomMember = await this.usersService.getRoomIdByUser(ctx)
    const roomId = roomMember.room_id
    const orders = await this.ordersService.getOrderByUser(ctx.user, roomId)

    return this.sendOrders(ctx, orders)
  }

  async getAllOrdersInRoom(ctx: Context) {
    const membership = ctx.user.memberships.at(0)
    if (!membership?.room_id) {
      await ctx.reply('❌ Вы не в комнате')
      return
    }
    const orders = await this.ordersService.getOrderInRoom(membership.room_id)
    const roomName = membership.room?.name
    return this.sendOrders(ctx, orders, roomName)
  }

  async delete(ctx: Context, orderId: number) {
    const userId = ctx.user.id

    if (!userId) {
      await ctx.reply(MessagesConstant.ROOMS_USER_NOT_FOUND)
      return
    }

    try {
      const order = await this.ordersService.delete(orderId, userId)

      await ctx.reply(MessagesConstant.ORDER_DELETE_SUCCESS(order.pizza_name), {
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback(
              '📋 Назад к списку',
              MessagesConstant.BUTTON_ORDERS_MY_COMMAND
            ),
          ],
        ]).reply_markup,
      })
    } catch (error: any) {
      console.error('Error deleting order:', error)

      if (error.message === 'ORDER_NOT_FOUND') {
        await ctx.reply(MessagesConstant.ORDER_NOT_FOUND)
      } else if (error.message === 'ORDER_NOT_YOURS') {
        await ctx.reply(MessagesConstant.ORDER_NOT_YOURS)
      } else {
        await ctx.reply('❌ Не удалось удалить заказ')
      }
    }
  }

  async update(ctx: Context, orderId: number) {
    await ctx.reply(MessagesConstant.ORDER_UPDATE_ENTER_DATA, {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback(
            MessagesConstant.BUTTON_BACK,
            MessagesConstant.BUTTON_ORDER_UPDATE_BACK_COMMAND
          ),
        ],
      ]).reply_markup,
    })
    ctx.session.updatingOrderId = orderId
  }

  async updateOrderHandleData(ctx: Context) {
    const text = ctx.message?.text?.trim()
 
    if (!ctx.session?.updatingOrderId) {
      return
    }

    if (!text) {
      await ctx.reply(MessagesConstant.ORDER_EMPTY_INPUT)
      return
    }

    try {
      const parsed = this.parseOrderInput(text)

      if (!parsed) {
        await ctx.reply(MessagesConstant.ORDER_INVALID_FORMAT)
        return
      }
      const userId = ctx.user.id
      const roomId = ctx.user.memberships.at(0)?.room_id

      if (!userId || !roomId) {
        await ctx.reply(MessagesConstant.ROOMS_USER_NOT_FOUND)
        return
      }

      const order = await this.ordersService.update(
        ctx.session.updatingOrderId,
        userId,
        {
          pizza_name: parsed.pizza_name,
          addons: parsed.addons,
          comment: parsed.comment,
          quantity: parsed.quantity,
        }
      )

      await ctx.reply(
        MessagesConstant.ORDER_UPDATED_SUCCESS(
          order.pizza_name,
          order.addons,
          order.comment
        ),
        {
          parse_mode: 'HTML',
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.button.callback(
                '📋 Мои заказы',
                MessagesConstant.BUTTON_ORDERS_MY_COMMAND
              ),
              Markup.button.callback(
                '➕ Ещё заказ',
                MessagesConstant.ORDER_CREATE_ACTION
              ),
            ],
          ]).reply_markup,
        }
      )
    } catch (error: any) {
      console.error('Error updating order:', error)

      if (error.message === 'ORDER_NOT_FOUND') {
        await ctx.reply(MessagesConstant.ORDER_NOT_FOUND)
      } else if (error.message === 'ORDER_NOT_YOURS') {
        await ctx.reply(MessagesConstant.ORDER_NOT_YOURS)
      } else {
        await ctx.reply(MessagesConstant.ORDER_CREATED_ERROR)
      }
    }

    ctx.session.updatingOrderId = undefined
  }

  async updateCancel(ctx: Context) {
    ctx.session.updatingOrderId = undefined
    await ctx.reply(MessagesConstant.ORDER_UPDATE_CANCELLED, {
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback(
            '📋 Мои заказы',
            MessagesConstant.BUTTON_ORDERS_MY_COMMAND
          ),
        ],
      ]).reply_markup,
    })
  }
}

export const ordersController = new OrdersController(ordersService, startService)

export const ordersControllerConfig = (bot: Telegraf<Context<Update>>) => {
  bot.command(MessagesConstant.BUTTON_ORDERS_MY_COMMAND, ordersController.get)
  bot.command(
    MessagesConstant.BUTTON_ORDERS_ROOM_COMMAND,
    ordersController.getAllOrdersInRoom
  )
  bot.command(MessagesConstant.ORDER_CREATE_ACTION, ordersController.create)

  bot.action(MessagesConstant.ORDER_CREATE_ACTION, async (ctx) => {
    await ctx.answerCbQuery()
    return ordersController.create(ctx)
  })
  bot.action(MessagesConstant.BUTTON_ORDERS_MY_COMMAND, async (ctx) => {
    await ctx.answerCbQuery()
    return ordersController.get(ctx)
  })
  bot.action(MessagesConstant.ORDER_CREATE_BACK_COMMAND, async (ctx) => {
    await ctx.answerCbQuery()
    ctx.session.creatingOrder = false
    return ordersController.get(ctx)
  })
  bot.action(MessagesConstant.BUTTON_ORDER_UPDATE_BACK_COMMAND, async (ctx) => {
    await ctx.answerCbQuery()
    return ordersController.updateCancel(ctx)
  })

  bot.action(/^order_delete_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery()
    const orderId = parseInt(ctx.match![1], 10)
    return ordersController.delete(ctx, orderId)
  })

  bot.action(/^order_update_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery()
    const orderId = parseInt(ctx.match![1], 10)
    return ordersController.update(ctx, orderId)
  })
}
