import { MessagesConstant } from '@/constants/messages/constant'
import { IRoomsService, RoomWithMembers } from '@/services/rooms/service'
import { startService, UserWithRoomMembers } from '@/services/start/service'
import { mockCtx } from '@/tests/mocks/mock'
import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest'
import { RoomsController } from './controller'
import { Markup } from 'telegraf'

type MockedRoomsService = {
  getAllRooms: MockedFunction<IRoomsService['getAllRooms']>
  createRoom: MockedFunction<IRoomsService['createRoom']>
  joinRoom: MockedFunction<IRoomsService['joinRoom']>
  leaveRoom: MockedFunction<IRoomsService['leaveRoom']>
  softDeleteRoom: MockedFunction<IRoomsService['softDeleteRoom']>
  getRoomById: MockedFunction<IRoomsService['getRoomById']>
}

describe('RoomsController', () => {
  let mockService: MockedRoomsService
  let controller: RoomsController
  const mockRooms: RoomWithMembers[] = [
    {
      id: 1,
      name: 'Пицца пятница',
      creator_id: 123,
      is_active: true,
      deleted_at: null,
      deleted_by: null,
      created_at: new Date(),
      updated_at: new Date(),
      roomMembers: [
        {
          id: 1,
          room_id: 1,
          user_id: 123,
          joined_at: new Date(),
          left_at: null,
          is_active: true,
          user: {
            id: 123,
            tg_id: 123,
            username: 'user1',
            first_name: 'Иван',
            last_name: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
        {
          id: 2,
          room_id: 1,
          user_id: 456,
          joined_at: new Date(),
          left_at: null,
          is_active: true,
          user: {
            id: 456,
            tg_id: 456,
            username: 'user2',
            first_name: 'Мария',
            last_name: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
      ],
    },
    {
      id: 2,
      name: 'Офис Москва',
      creator_id: 123,
      is_active: true,
      deleted_at: null,
      deleted_by: null,
      created_at: new Date(),
      updated_at: new Date(),
      roomMembers: [
        {
          id: 3,
          room_id: 2,
          user_id: 123,
          joined_at: new Date(),
          left_at: null,
          is_active: true,
          user: {
            id: 123,
            tg_id: 123,
            username: 'user1',
            first_name: 'Иван',
            last_name: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
      ],
    },
  ]

  beforeEach(() => {
    mockService = {
      getAllRooms: vi.fn(),
      createRoom: vi.fn(),
      joinRoom: vi.fn(),
      leaveRoom: vi.fn(),
      softDeleteRoom: vi.fn(),
      getRoomById: vi.fn()
    }

    controller = new RoomsController(mockService)
    vi.clearAllMocks()
  })

  describe('get', () => {
    it(`должен показать сообщение "${MessagesConstant.ROOMS_NO_ROOMS_MESSAGE}" если список пуст`, async () => {
      // Arrange
      mockService.getAllRooms.mockResolvedValue([])
      const ctx = mockCtx()

      // Act
      await controller.get(ctx)

      // Assert
      expect(mockService.getAllRooms).toHaveBeenCalledTimes(1)

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ROOMS_NO_ROOMS_MESSAGE,
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: MessagesConstant.BUTTON_ROOMS_CREATE,
                  callback_data: MessagesConstant.BUTTON_ROOMS_CREATE_COMMAND,
                }),
              ]),
            ]),
          }),
        })
      )
    })

    it('должен показать список комнат с кнопками для каждой', async () => {
      mockService.getAllRooms.mockResolvedValue(mockRooms)
      const ctx = mockCtx()

      // Act
      await controller.get(ctx)

      // Assert
      expect(mockService.getAllRooms).toHaveBeenCalledTimes(1)
      expect(ctx.reply).toHaveBeenCalledTimes(1)

      const replyCall = (ctx.reply as any).mock.calls[0]
      const [text, options] = replyCall

      expect(text).toContain(
        MessagesConstant.ROOMS_LIST_MESSAGE(
          mockRooms[0]?.name ?? "",
          mockRooms[0]?.roomMembers.length ?? 0
        )
      )

      expect(options).toEqual(
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: `🚪 ${mockRooms[0]?.name}`,
                  callback_data: MessagesConstant.ROOMS_JOIN_ROOM_COMMAND(1),
                }),
              ]),

              expect.arrayContaining([
                expect.objectContaining({
                  text: `🚪 ${mockRooms[1]?.name}`,
                  callback_data: MessagesConstant.ROOMS_JOIN_ROOM_COMMAND(2),
                }),
              ]),

              expect.arrayContaining([
                expect.objectContaining({
                  text: MessagesConstant.BUTTON_ROOMS_CREATE,
                  callback_data: MessagesConstant.BUTTON_ROOMS_CREATE_COMMAND,
                }),
              ]),
            ]),
          }),
        })
      )
    })
  })

  describe('create', () => {
    it('должен запросить название комнаты с кнопкой "Назад"', async () => {
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

      await controller.create(ctx)

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ROOMS_ENTER_TTILE,
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: MessagesConstant.BUTTON_BACK,
                  callback_data:
                    MessagesConstant.BUTTON_ROOMS_CREATE_BACK_COMMAND,
                }),
              ]),
            ]),
          }),
        })
      )
      expect(ctx.session?.creatingRoom).toBe(true)
    })

    it('должен вернуть если пользователь не в режиме создания', async () => {
      const ctx = mockCtx({
        session: { creatingRoom: false },
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
          text: 'Тестовая комната',
        },
      })

      await controller.createRoomHandleTitle(ctx)

      expect(ctx.reply).not.toHaveBeenCalled()
    })

    it('должен показать ошибку если название длиннее 50 символов', async () => {
      const ctx = mockCtx({
        session: { creatingRoom: true },
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
          text: 'a'.repeat(51),
        },
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
      })

      await controller.createRoomHandleTitle(ctx)

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ROOMS_TITLE_TOO_LONG
      )
    })

    it('должен показать ошибку если пользователь не найден', async () => {
      const ctx = mockCtx({
        session: { creatingRoom: true },
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
          text: 'Тестовая комната',
        },
        from: undefined,
      })

      await controller.createRoomHandleTitle(ctx)

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ROOMS_USER_NOT_FOUND
      )
    })

    it('должен создать комнату и показать подтверждение', async () => {
      const mockUser: UserWithRoomMembers = {
        id: 1,
        tg_id: 123,
        username: 'test',
        first_name: 'Test',
        last_name: null,
        created_at: new Date(),
        updated_at: new Date(),
        memberships: [],
      }

      const mockRoom = {
        id: 999,
        name: 'Тестовая комната',
        creator_id: 1,
        is_active: true,
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      }

      vi.spyOn(startService, 'findOrCreateUser').mockResolvedValue(mockUser)
      mockService.createRoom.mockResolvedValue(mockRoom)

      const ctx = mockCtx({
        session: { creatingRoom: true },
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
          text: 'Тестовая комната',
        },
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
      })

      await controller.createRoomHandleTitle(ctx)

      expect(startService.findOrCreateUser).toHaveBeenCalledWith({
        tg_id: 123,
        username: 'test',
        first_name: 'Test',
        last_name: null,
      })

      expect(mockService.createRoom).toHaveBeenCalledWith(
        'Тестовая комната',
        mockUser
      )

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ROOMS_CREATED_SUCCESS('Тестовая комната'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: MessagesConstant.ROOMS_JOIN_ROOM,
                  callback_data: MessagesConstant.ROOMS_JOIN_ROOM_COMMAND(999),
                }),
              ]),
            ]),
          }),
        })
      )
      expect(ctx.session?.creatingRoom).toBe(false)
    })

    it('должен обработать ошибку при создании комнаты', async () => {
      vi.spyOn(startService, 'findOrCreateUser').mockResolvedValue({
        id: 1,
        tg_id: 123,
        username: 'test',
        first_name: 'Test',
        last_name: null,
        created_at: new Date(),
        updated_at: new Date(),
        memberships: [],
      })

      mockService.createRoom.mockRejectedValue(new Error('DB error'))

      const ctx = mockCtx({
        session: { creatingRoom: true },
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
          text: 'Тестовая комната',
        },
        from: {
          id: 123,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
      })

      await controller.createRoomHandleTitle(ctx)

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ROOMS_CREATED_ERROR
      )
    })
  })

  describe('joinRoom', () => {
    beforeEach(() => {
      mockService.joinRoom = vi.fn()
    })

    it('должен показать ошибку если пользователь не найден', async () => {
      const ctx = mockCtx({ from: undefined })

      await controller.joinRoom(ctx, 123)

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ROOMS_USER_NOT_FOUND
      )
      expect(mockService.joinRoom).not.toHaveBeenCalled()
    })

    it('должен присоединить пользователя к комнате и показать успех', async () => {
      const mockResult = {
        roomDetail: {
          id: 123,
          name: 'Пицца пятница',
          creator_id: 1,
          is_active: true,
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        alreadyMember: false,
      } as any

      mockService.joinRoom.mockResolvedValue(mockResult)

      const ctx = mockCtx({
        from: {
          id: 456,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
      })

      await controller.joinRoom(ctx, mockResult.roomDetail.id)

      expect(mockService.joinRoom).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          tg_id: 456,
          first_name: 'Test',
        })
      )

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ROOMS_JOINED_SUCCESS(
          mockResult.roomDetail.name,
          ctx.botInfo.username,
          mockResult.roomDetail.id
        ),
        {
          parse_mode: 'HTML',
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.button.callback(
                MessagesConstant.BUTTON_ROOMS_SUCCESS_ORDER,
                MessagesConstant.ORDER_CREATE_ACTION
              ),
            ],
          ]).reply_markup,
        }
      )
    })

    it('должен обработать ошибку при присоединении', async () => {
      mockService.joinRoom.mockRejectedValue('Room not found')

      const ctx = mockCtx({
        from: {
          id: 456,
          first_name: 'Test',
          username: 'test',
          last_name: undefined,
          is_bot: false,
          language_code: 'ru',
        },
      })

      await controller.joinRoom(ctx, 999)

      expect(ctx.reply).toHaveBeenCalledWith(
        MessagesConstant.ROOMS_JOIN_ERROR('Room not found')
      )
    })
  })
})
