import { prisma } from '@/config/orm/config'
import { Prisma } from '@/database/client'
import { Context } from 'telegraf'
import { RoomMemberWithRoom } from '../rooms/service'

export type UserCreateInput = {
  tg_id: number
  username?: string | null
  first_name?: string | null
  last_name?: string | null
  chat_id?: string | null
}

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
  findOrCreateUser(data: any): Promise<UserWithRoomMembers>
  getRoomIdByUser(ctx: Context): Promise<RoomMemberWithRoom>
}

export class UsersService implements IUserService {
  async findOrCreateUser(data: UserCreateInput): Promise<UserWithRoomMembers> {
    // Сначала пытаемся найти пользователя
    let existingUser = await prisma.user.findFirst({
      where: { tg_id: data.tg_id },
      include: {
        memberships: {
          include: {
            room: true,
          },
        },
      },
    })

    // Если найден — обновляем данные
    if (existingUser) {
      return prisma.user.update({
        where: { id: existingUser.id },
        include: {
          memberships: {
            include: {
              room: true,
            },
          },
        },
        data: {
          username: data.username,
          first_name: data.first_name,
          last_name: data.last_name,
          chat_id: data.chat_id,
        },
      })
    }

    // Если не найден — создаём нового
    return prisma.user.create({
      data: {
        tg_id: data.tg_id,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        chat_id: data.chat_id ?? null,
      },
      include: {
        memberships: {
          include: {
            room: true,
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
