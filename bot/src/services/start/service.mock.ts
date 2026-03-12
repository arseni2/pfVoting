import { vi } from 'vitest'
import { IStartService } from './service'
import { UserCreateInput } from '@/database/models'
import { User } from '@/database/client'

export const StartServiceMock = (
  overrides: Partial<IStartService> = {}
): IStartService => ({
  findOrCreateUser: vi.fn().mockImplementation(
    async (data: UserCreateInput): Promise<User> => ({
      id: 1,
      tg_id: data.tg_id,
      username: data.username ?? null,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    })
  ),
  ...overrides,
})