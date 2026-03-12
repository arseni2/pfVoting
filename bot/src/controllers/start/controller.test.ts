import { mockCtx } from '@/tests/mocks/mock'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createStartController } from '@/controllers/start/controller'
import { MessagesConstant } from '@/constants/messages/constant'
import { StartServiceMock } from '@/services/start/service.mock'

describe('startController', () => {
  let mockService: ReturnType<typeof StartServiceMock>

  beforeEach(() => {
    // 👇 Создаём новый мок перед каждым тестом
    mockService = StartServiceMock()
    vi.clearAllMocks()
  })

  it('должен отправить приветственное сообщение с inline-клавиатурой', async () => {
    const ctx = mockCtx()

    const controller = createStartController({ startService: mockService })

    await controller(ctx)

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining(MessagesConstant.START(ctx.from?.first_name)),
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.arrayContaining([
            expect.arrayContaining([
              expect.objectContaining({
                text: expect.stringContaining(MessagesConstant.BUTTON_ROOMS),
                callback_data: expect.stringContaining(
                  MessagesConstant.BUTTON_ROOMS_GET_COMMAND
                ),
              }),
              expect.objectContaining({
                text: expect.stringContaining(
                  MessagesConstant.BUTTON_ROOMS_CREATE
                ),
                callback_data: expect.stringContaining(
                  MessagesConstant.BUTTON_ROOMS_CREATE_COMMAND
                ),
              }),
            ]),
          ]),
        }),
      })
    )
  })
})