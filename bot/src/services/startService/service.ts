import { prisma } from '@/config/orm/config'
import { UserCreateInput } from '@/database/models'

export const startService = async (data: UserCreateInput) => {
    const user = await prisma.user.findUnique({
        where: {
            tg_id: data.tg_id
        }
    })
    if (user) {
        return user
    }
    return prisma.user.create({
        data: data
    })
}