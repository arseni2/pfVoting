import { vi } from 'vitest'
import { IUserService, UserWithRoomMembers } from './service'
import { RoomMemberWithRoom } from '../rooms/service'

export const StartServiceMock = (
  overrides: Partial<IUserService> = {}
): IUserService => ({
  findOrCreateUser: vi.fn().mockImplementation(
    async (data: any): Promise<UserWithRoomMembers> => ({
      id: 1,
      tg_id: data.tg_id,
      username: data.username ?? null,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      chat_id: data.chat_id ?? null,
      created_at: new Date(),
      updated_at: new Date(),
      memberships: [],
    })
  ),
  getRoomIdByUser: vi.fn().mockImplementation(async (): Promise<RoomMemberWithRoom> => ({
    id: 1,
    room_id: 1,
    user_id: 1,
    joined_at: new Date(),
    left_at: null,
    is_active: true,
    room: {
      id: 1,
      name: 'Test Room',
      creator_id: 1,
      is_active: true,
      deleted_at: null,
      deleted_by: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
  })),
  ...overrides,
})
