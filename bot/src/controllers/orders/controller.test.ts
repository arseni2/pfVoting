import { MessagesConstant } from '@/constants/messages/constant'
import { IOrdersService, OrderWithUser } from '@/services/orders/service'
import { mockCtx } from '@/tests/mocks/mock'
import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest'
import { OrdersController } from './controller'

type MockedOrdersService = {
  getOrderInRoom: MockedFunction<IOrdersService['getOrderInRoom']>
  getOrderByUser: MockedFunction<IOrdersService['getOrderByUser']>
  create: MockedFunction<IOrdersService['create']>
  delete: MockedFunction<IOrdersService['delete']>
  update: MockedFunction<IOrdersService['update']>
}

describe('OrdersController', () => {
  let mockService: MockedOrdersService
  let controller: OrdersController

  const mockUser = {
    id: 1,
    tg_id: 123,
    username: 'test',
    first_name: 'Test',
    last_name: null,
    created_at: new Date(),
    updated_at: new Date(),
    memberships: [
      {
        id: 1,
        room_id: 1,
        user_id: 1,
        joined_at: new Date(),
        left_at: null,
        is_active: true,
        room: {
          id: 1,
          name: 'Пицца пятница',
          creator_id: 1,
          is_active: true,
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      },
    ],
  }

  const mockOrders: OrderWithUser[] = [
    {
      id: 1,
      pizza_name: 'Пепперони',
      addons: 'сырный соус',
      comment: 'без лука',
      quantity: 1,
      room_id: 1,
      user_id: 1,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
      user: {
        id: 1,
        tg_id: 123,
        username: 'test',
        first_name: 'Test',
        last_name: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    },
    {
      id: 2,
      pizza_name: 'Маргарита',
      addons: null,
      comment: null,
      quantity: 2,
      room_id: 1,
      user_id: 1,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
      user: {
        id: 1,
        tg_id: 123,
        username: 'test',
        first_name: 'Test',
        last_name: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    },
  ]

  beforeEach(() => {
    mockService = {
      getOrderInRoom: vi.fn(),
      getOrderByUser: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    }

    controller = new OrdersController(mockService)
    vi.clearAllMocks()
  })

  describe('createOrderHandleData', () => {
    it('должен вернуть если пользователь не в режиме создания', async () => {
      const ctx = mockCtx({
        session: { creatingOrder: false },
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 456,
            type: 'private',
            first_name: 'Test',
            username: 'test',
          },
          from: {
            id: 123,
            first_name: 'Test',
            username: 'test',
            last_name: undefined,
            is_bot: false,
            language_code: 'ru',
          },
          text: 'Пепперони + сырный соус (без лука) [1]',
        },
      })

      await controller.createOrderHandleData(ctx)

      expect(ctx.reply).not.toHaveBeenCalled()
    })

    it('должен показать ошибку если неверный формат', async () => {
      const ctx = mockCtx({
        session: { creatingOrder: true },
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 456,
            type: 'private',
            first_name: 'Test',
            username: 'test',
          },
          from: {
            id: 123,
            first_name: 'Test',
            username: 'test',
            last_name: undefined,
            is_bot: false,
            language_code: 'ru',
          },
          text: 'неверный формат'.repeat(100),
        },
      })

      await controller.createOrderHandleData(ctx)

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ORDER_INVALID_FORMAT,
        expect.anything()
      )
    })

    it('должен создать заказ и показать подтверждение', async () => {
      const mockOrder = {
        id: 999,
        pizza_name: 'Пепперони',
        addons: 'сырный соус',
        comment: 'без лука',
        quantity: 1,
        room_id: 1,
        user_id: 1,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockService.create.mockResolvedValue(mockOrder)

      const ctx = mockCtx({
        session: { creatingOrder: true },
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 456,
            type: 'private',
            first_name: 'Test',
            username: 'test',
          },
          from: {
            id: 123,
            first_name: 'Test',
            username: 'test',
            last_name: undefined,
            is_bot: false,
            language_code: 'ru',
          },
          text: 'Пепперони + сырный соус (без лука) [1]',
        },
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
        user: mockUser,
      })

      await controller.createOrderHandleData(ctx)

      expect(mockService.create).toHaveBeenCalledWith(
        'Пепперони',
        mockUser,
        1,
        'сырный соус',
        'без лука',
        1
      )

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ORDER_CREATED_SUCCESS(
          'Пепперони',
          'сырный соус',
          'без лука'
        ),
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: '📋 Мои заказы',
                  callback_data: MessagesConstant.BUTTON_ORDERS_MY_COMMAND,
                }),
                expect.objectContaining({
                  text: '➕ Ещё заказ',
                  callback_data: MessagesConstant.ORDER_CREATE_ACTION,
                }),
                expect.objectContaining({
                  text: 'Редактировать',
                  callback_data: MessagesConstant.BUTTON_ORDER_UPDATE_COMMAND,
                }),
              ]),
            ]),
          }),
        })
      )
      expect(ctx.session?.creatingOrder).toBe(false)
    })

    it('должен обработать ошибку при создании заказа', async () => {
      mockService.create.mockRejectedValue(new Error('ORDER_TOO_MANY'))

      const ctx = mockCtx({
        session: { creatingOrder: true },
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 456,
            type: 'private',
            first_name: 'Test',
            username: 'test',
          },
          from: {
            id: 123,
            first_name: 'Test',
            username: 'test',
            last_name: undefined,
            is_bot: false,
            language_code: 'ru',
          },
          text: 'Пепперони + сырный соус (без лука) [1]',
        },
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
        user: mockUser,
      })

      await controller.createOrderHandleData(ctx)

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ORDER_CREATED_ERROR
      )
    })
  })

  describe('get', () => {
    it('должен показать сообщение если заказов нет', async () => {
      mockService.getOrderByUser.mockResolvedValue([])

      const ctx = mockCtx({
        user: mockUser,
      })

      await controller.get(ctx)

      expect(mockService.getOrderByUser).toHaveBeenCalledWith(mockUser)
      expect(ctx.reply).toHaveBeenCalledWith('📭 В комнате пока нет заказов')
    })

    it('должен показать список заказов с кнопками', async () => {
      mockService.getOrderByUser.mockResolvedValue(mockOrders)

      const ctx = mockCtx({
        user: mockUser,
      })

      await controller.get(ctx)

      expect(mockService.getOrderByUser).toHaveBeenCalledWith(mockUser)
      expect(ctx.reply).toHaveBeenCalledTimes(1)

      const replyCall = (ctx.reply as any).mock.calls[0]
      const [text, options] = replyCall

      expect(text).toContain('📋 Ваши заказы:')
      expect(text).toContain('Пепперони + сырный соус (без лука) [1]')
      expect(text).toContain('Маргарита')
      expect(text).toContain('[2]')

      expect(options).toEqual(
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: '🗑️ Удалить: Пепперони',
                  callback_data: 'order_delete_1',
                }),
                expect.objectContaining({
                  text: '✏️ Изменить',
                  callback_data: 'order_update_1',
                }),
              ]),
              expect.arrayContaining([
                expect.objectContaining({
                  text: '🗑️ Удалить: Маргарита',
                  callback_data: 'order_delete_2',
                }),
                expect.objectContaining({
                  text: '✏️ Изменить',
                  callback_data: 'order_update_2',
                }),
              ]),
              expect.arrayContaining([
                expect.objectContaining({
                  text: '🗳️ Провести голосование',
                  callback_data: MessagesConstant.BUTTON_VOTE_START_COMMAND,
                }),
              ]),
              expect.arrayContaining([
                expect.objectContaining({
                  text: '📋 Мои заказы',
                  callback_data: MessagesConstant.BUTTON_ORDERS_MY_COMMAND,
                }),
                expect.objectContaining({
                  text: '➕ Добавить заказ',
                  callback_data: MessagesConstant.ORDER_CREATE_ACTION,
                }),
              ]),
            ]),
          }),
        })
      )
    })
  })

  describe('getAllOrdersInRoom', () => {
    it('должен показать ошибку если пользователь не в комнате', async () => {
      const ctx = mockCtx({
        user: {
          ...mockUser,
          memberships: [],
        },
      })

      await controller.getAllOrdersInRoom(ctx)

      expect(ctx.reply).toHaveBeenCalledWith('❌ Вы не в комнате')
      expect(mockService.getOrderInRoom).not.toHaveBeenCalled()
    })

    it('должен показать все заказы в комнате', async () => {
      mockService.getOrderInRoom.mockResolvedValue(mockOrders)

      const ctx = mockCtx({
        user: mockUser,
      })

      await controller.getAllOrdersInRoom(ctx)

      expect(mockService.getOrderInRoom).toHaveBeenCalledWith(1)
      expect(ctx.reply).toHaveBeenCalledTimes(1)

      const replyCall = (ctx.reply as any).mock.calls[0]
      const [text] = replyCall

      expect(text).toContain('🏠 В комнате "Пицца пятница"')
      expect(text).toContain('👤 Test — Пепперони + сырный соус (без лука) [1]')
    })
  })

  describe('delete', () => {
    it('должен удалить заказ и показать подтверждение', async () => {
      const mockOrder = {
        id: 1,
        pizza_name: 'Пепперони',
        addons: 'сырный соус',
        comment: 'без лука',
        quantity: 1,
        room_id: 1,
        user_id: 1,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockService.delete.mockResolvedValue(mockOrder)

      const ctx = mockCtx({
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
        user: mockUser,
      })

      await controller.delete(ctx, 1)

      expect(mockService.delete).toHaveBeenCalledWith(1, 1)

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ORDER_DELETE_SUCCESS('Пепперони'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: '📋 Назад к списку',
                  callback_data: MessagesConstant.BUTTON_ORDERS_MY_COMMAND,
                }),
              ]),
            ]),
          }),
        })
      )
    })

    it('должен обработать ошибку ORDER_NOT_FOUND', async () => {
      mockService.delete.mockRejectedValue(new Error('ORDER_NOT_FOUND'))

      const ctx = mockCtx({
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
        user: mockUser,
      })

      await controller.delete(ctx, 999)

      expect(ctx.reply).toHaveBeenCalledWith(MessagesConstant.ORDER_NOT_FOUND)
    })

    it('должен обработать ошибку ORDER_NOT_YOURS', async () => {
      mockService.delete.mockRejectedValue(new Error('ORDER_NOT_YOURS'))

      const ctx = mockCtx({
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
        user: mockUser,
      })

      await controller.delete(ctx, 1)

      expect(ctx.reply).toHaveBeenCalledWith(MessagesConstant.ORDER_NOT_YOURS)
    })

    it('должен обработать неизвестную ошибку', async () => {
      mockService.delete.mockRejectedValue(new Error('Unknown error'))

      const ctx = mockCtx({
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
        user: mockUser,
      })

      await controller.delete(ctx, 1)

      expect(ctx.reply).toHaveBeenCalledWith('❌ Не удалось удалить заказ')
    })
  })

  describe('update', () => {
    it('должен запросить новые данные заказа с кнопкой "Назад"', async () => {
      const ctx = mockCtx({
        session: {},
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
      })

      await controller.update(ctx, 1)

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ORDER_UPDATE_ENTER_DATA,
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: MessagesConstant.BUTTON_BACK,
                  callback_data:
                    MessagesConstant.BUTTON_ORDER_UPDATE_BACK_COMMAND,
                }),
              ]),
            ]),
          }),
        })
      )
      expect(ctx.session?.updatingOrderId).toBe(1)
    })
  })

  describe('updateOrderHandleData', () => {
    it('должен вернуть если пользователь не в режиме редактирования', async () => {
      const ctx = mockCtx({
        session: { updatingOrderId: undefined },
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 456,
            type: 'private',
            first_name: 'Test',
            username: 'test',
          },
          from: {
            id: 123,
            first_name: 'Test',
            username: 'test',
            last_name: undefined,
            is_bot: false,
            language_code: 'ru',
          },
          text: 'Пепперони + сырный соус (без лука) [1]',
        },
      })

      await controller.updateOrderHandleData(ctx)

      expect(ctx.reply).not.toHaveBeenCalled()
    })

    it('должен показать ошибку если ввод пустой', async () => {
      const ctx = mockCtx({
        session: { updatingOrderId: 1 },
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 456,
            type: 'private',
            first_name: 'Test',
            username: 'test',
          },
          from: {
            id: 123,
            first_name: 'Test',
            username: 'test',
            last_name: undefined,
            is_bot: false,
            language_code: 'ru',
          },
          text: '',
        },
      })

      await controller.updateOrderHandleData(ctx)

      expect(ctx.reply).toHaveBeenCalledWith(MessagesConstant.ORDER_EMPTY_INPUT)
    })

    it('должен показать ошибку если неверный формат', async () => {
      const ctx = mockCtx({
        session: { updatingOrderId: 1 },
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 456,
            type: 'private',
            first_name: 'Test',
            username: 'test',
          },
          from: {
            id: 123,
            first_name: 'Test',
            username: 'test',
            last_name: undefined,
            is_bot: false,
            language_code: 'ru',
          },
          text: 'неверный формат'.repeat(100),
        }
      })

      await controller.updateOrderHandleData(ctx)
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining(MessagesConstant.ORDER_INVALID_FORMAT),
      )
    })

    it('должен обновить заказ и показать подтверждение', async () => {
      const mockOrder = {
        id: 1,
        pizza_name: 'Пепперони',
        addons: 'сырный соус',
        comment: 'без лука',
        quantity: 1,
        room_id: 1,
        user_id: 1,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockService.update.mockResolvedValue(mockOrder)

      const ctx = mockCtx({
        session: { updatingOrderId: 1 },
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 456,
            type: 'private',
            first_name: 'Test',
            username: 'test',
          },
          from: {
            id: 123,
            first_name: 'Test',
            username: 'test',
            last_name: undefined,
            is_bot: false,
            language_code: 'ru',
          },
          text: 'Пепперони + сырный соус (без лука) [1]',
        },
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
        user: mockUser,
      })

      await controller.updateOrderHandleData(ctx)

      expect(mockService.update).toHaveBeenCalledWith(
        mockOrder.id,
        mockUser.id,
        expect.objectContaining({
          pizza_name: 'Пепперони',
          addons: 'сырный соус',
          comment: 'без лука',
          quantity: 1,
        })
      )

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ORDER_UPDATED_SUCCESS(
          'Пепперони',
          'сырный соус',
          'без лука'
        ),
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: '📋 Мои заказы',
                  callback_data: MessagesConstant.BUTTON_ORDERS_MY_COMMAND,
                }),
                expect.objectContaining({
                  text: '➕ Ещё заказ',
                  callback_data: MessagesConstant.ORDER_CREATE_ACTION,
                }),
              ]),
            ]),
          }),
        })
      )
      expect(ctx.session?.updatingOrderId).toBeUndefined()
    })

    it('должен обработать ошибку ORDER_NOT_FOUND', async () => {
      mockService.update.mockRejectedValue(new Error('ORDER_NOT_FOUND'))

      const ctx = mockCtx({
        session: { updatingOrderId: 1 },
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 456,
            type: 'private',
            first_name: 'Test',
            username: 'test',
          },
          from: {
            id: 123,
            first_name: 'Test',
            username: 'test',
            last_name: undefined,
            is_bot: false,
            language_code: 'ru',
          },
          text: 'Пепперони + сырный соус (без лука) [1]',
        },
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
        user: mockUser,
      })

      await controller.updateOrderHandleData(ctx)

      expect(ctx.reply).toHaveBeenCalledWith(MessagesConstant.ORDER_NOT_FOUND)
      expect(ctx.session?.updatingOrderId).toBeUndefined()
    })

    it('должен обработать ошибку ORDER_NOT_YOURS', async () => {
      mockService.update.mockRejectedValue(new Error('ORDER_NOT_YOURS'))

      const ctx = mockCtx({
        session: { updatingOrderId: 1 },
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 456,
            type: 'private',
            first_name: 'Test',
            username: 'test',
          },
          from: {
            id: 123,
            first_name: 'Test',
            username: 'test',
            last_name: undefined,
            is_bot: false,
            language_code: 'ru',
          },
          text: 'Пепперони + сырный соус (без лука) [1]',
        },
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
        user: mockUser,
      })

      await controller.updateOrderHandleData(ctx)

      expect(ctx.reply).toHaveBeenCalledWith(MessagesConstant.ORDER_NOT_YOURS)
      expect(ctx.session?.updatingOrderId).toBeUndefined()
    })

    it('должен обработать неизвестную ошибку', async () => {
      mockService.update.mockRejectedValue(new Error('Unknown error'))

      const ctx = mockCtx({
        session: { updatingOrderId: 1 },
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 456,
            type: 'private',
            first_name: 'Test',
            username: 'test',
          },
          from: {
            id: 123,
            first_name: 'Test',
            username: 'test',
            last_name: undefined,
            is_bot: false,
            language_code: 'ru',
          },
          text: 'Пепперони + сырный соус (без лука) [1]',
        },
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
        user: mockUser,
      })

      await controller.updateOrderHandleData(ctx)

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ORDER_CREATED_ERROR
      )
      expect(ctx.session?.updatingOrderId).toBeUndefined()
    })
  })

  describe('updateCancel', () => {
    it('должен отменить редактирование и показать сообщение', async () => {
      const ctx = mockCtx({
        session: { updatingOrderId: 1 },
      })

      await controller.updateCancel(ctx)

      expect(ctx.session?.updatingOrderId).toBeUndefined()

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ORDER_UPDATE_CANCELLED,
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: '📋 Мои заказы',
                  callback_data: MessagesConstant.BUTTON_ORDERS_MY_COMMAND,
                }),
              ]),
            ]),
          }),
        })
      )
    })
  })

  describe('parseOrderInput', () => {
    it('должен распарсить полный формат заказа', () => {
      const result = (controller as any).parseOrderInput(
        'Пепперони + сырный соус (без лука) [2]'
      )

      expect(result).toEqual({
        pizza_name: 'Пепперони',
        addons: 'сырный соус',
        comment: 'без лука',
        quantity: 2,
      })
    })

    it('должен распарсить только название', () => {
      const result = (controller as any).parseOrderInput('Маргарита')

      expect(result).toEqual({
        pizza_name: 'Маргарита',
        addons: null,
        comment: null,
        quantity: 1,
      })
    })

    it('должен распарсить название с количеством', () => {
      const result = (controller as any).parseOrderInput('Маргарита [3]')

      expect(result).toEqual({
        pizza_name: 'Маргарита',
        addons: null,
        comment: null,
        quantity: 3,
      })
    })

    it('должен распарсить название с добавками', () => {
      const result = (controller as any).parseOrderInput(
        'Гавайская + ананасы, ветчина'
      )

      expect(result).toEqual({
        pizza_name: 'Гавайская',
        addons: 'ананасы, ветчина',
        comment: null,
        quantity: 1,
      })
    })

    it('должен вернуть null если название слишком длинное', () => {
      const result = (controller as any).parseOrderInput(
        'a'.repeat(101) + ' + добавки (комментарий) [1]'
      )

      expect(result).toBeNull()
    })

    it('должен вернуть null если количество больше 10', () => {
      const result = (controller as any).parseOrderInput(
        'Пепперони [11]'
      )

      expect(result).toBeNull()
    })

    it('должен вернуть null если количество меньше 1', () => {
      const result = (controller as any).parseOrderInput(
        'Пепперони [0]'
      )

      expect(result).toBeNull()
    })
  })
})
