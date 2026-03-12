import { prisma } from '@/config/orm/config'
import { UserCreateInput } from '@/database/models'
import { User } from '@/database/client'


export interface IStartService {
  findOrCreateUser(data: UserCreateInput): Promise<User>
}

export class StartService implements IStartService {
  async findOrCreateUser(data: UserCreateInput): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { tg_id: data.tg_id },
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