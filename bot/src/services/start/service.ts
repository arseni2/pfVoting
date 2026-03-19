import { prisma } from '@/config/orm/config'
import { Prisma } from '@/database/client'
import { UserCreateInput, UserUpdateInput } from '@/database/models'
import { Context } from 'telegraf'
import { RoomMemberWithRoom } from '../rooms/service'

export type UserWithRoomMembers = Prisma.UserGetPayload<{
  include: {
    memberships: {
      include: {
        room: true
      }
    }
  }
}>
export interface IUserService {
  findOrCreateUser(data: UserCreateInput): Promise<UserWithRoomMembers>
  getRoomIdByUser(ctx: Context): Promise<RoomMemberWithRoom>
}

export class UsersService implements IUserService {
  async findOrCreateUser(data: UserCreateInput): Promise<UserWithRoomMembers> {
    const existingUser = await prisma.user.update({
      where: { tg_id: data.tg_id },
      include: {
        memberships: {
          include: {
            room: true,
          },
        },
      },
      data: data
    })

    if (existingUser) {
      return existingUser
    }

    return prisma.user.create({
      data: {
        tg_id: data.tg_id,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
      },
      include: {
        memberships: {
          include: {
            room: true,
            user: true,
          },
        },
      },
    })
  }

  async getRoomIdByUser(ctx: Context): Promise<RoomMemberWithRoom> {
    if (!ctx.user.memberships[0]?.room_id) {
      await ctx.reply('Пользователь не в комнате')
      throw new Error('пользователь не в комнате')
    }
    const roomMember = ctx.user.memberships.find((item) => item.is_active)
    if (!roomMember) {
      await ctx.reply('Пользователь не в комнате')
      throw new Error('пользователь не в комнате')
    }
    return roomMember
  }
}

export const startService = new UsersService()
