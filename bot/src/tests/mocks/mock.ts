import { vi } from 'vitest'
import { Context } from 'telegraf'
import { Message, User } from 'telegraf/types'

export const mockCtx = (overrides: Partial<Context> = {}) => {
  const ctx = {
    from: { id: 123, first_name: 'Test', is_bot: false } as User,
    chat: { id: 456, type: 'private' },
    message: { text: '' } as Message,
    reply: vi.fn().mockResolvedValue(true),
    replyWithHTML: vi.fn().mockResolvedValue(true),
    answerCbQuery: vi.fn().mockResolvedValue(true),
    editMessageText: vi.fn().mockResolvedValue(true),
    ...overrides,
  } as unknown as Context

  return ctx
}
