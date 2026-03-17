import { Context } from 'telegraf'
import { User } from 'telegraf/types'
import { vi } from 'vitest'

export const mockCtx = (overrides: Partial<Context> = {}) => {
  const ctx: Context = {
    from: { id: 123, first_name: 'Test', is_bot: false } as User,
    chat: { id: 456, type: 'private' },
    botInfo: {
      username: 'PizzaDay123Bot',
    },
    message: {
      text: '',
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
    },
    user: {
      id: 1,
      tg_id: 123,
      username: 'test',
      first_name: 'Test',
    },
    reply: vi.fn().mockResolvedValue(true),
    replyWithHTML: vi.fn().mockResolvedValue(true),
    answerCbQuery: vi.fn().mockResolvedValue(true),
    editMessageText: vi.fn().mockResolvedValue(true),
    ...overrides,
  } as unknown as Context

  return ctx
}
