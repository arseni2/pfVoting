import { prisma } from '@/config/orm/config'
import { Prisma } from '@/database/client'
import { UserCreateInput } from '@/database/models'

export type UserWithRoomMembers = Prisma.UserGetPayload<{
  include: {
    memberships: {
      include: {
        room: true
      }
    }
  }
}>
export interface IStartService {
  findOrCreateUser(data: UserCreateInput): Promise<UserWithRoomMembers>
}

export class StartService implements IStartService {
  async findOrCreateUser(data: UserCreateInput): Promise<UserWithRoomMembers> {
    const existingUser = await prisma.user.findUnique({
      where: { tg_id: data.tg_id },
      include: {
        memberships: {
          include: {
            room: true
          }
        }
      }
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
    })
  }
}

export const startService = new StartService()