import { mockCtx } from '@/tests/mocks/mock'
import { describe, expect, it } from 'vitest'
import { startController } from '@/controllers/start/controller'
import { MessagesConstant } from '@/constants/messages/constant'

describe('startController', () => {
  it('должен отправить приветственное сообщение с inline-клавиатурой', () => {
    const ctx = mockCtx()

    startController(ctx)

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining(MessagesConstant.START(ctx.from?.first_name)),
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.arrayContaining([
            expect.arrayContaining([
              expect.objectContaining({
                text: expect.stringContaining(MessagesConstant.BUTTON_ROOMS),
                callback_data: expect.stringContaining(MessagesConstant.BUTTON_ROOMS_COMMAND),
              }),
              expect.objectContaining({
                text: expect.stringContaining(MessagesConstant.BUTTON_ROOMS_CREATE),
                callback_data: expect.stringContaining(MessagesConstant.BUTTON_ROOMS_CREATE_COMMAND),
              }),
            ]),
          ]),
        }),
      })
    )
  })

})
