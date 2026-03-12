import { prisma } from '@/config/orm/config'
import { Prisma, Room, RoomMember, User } from '@/database/client'
import { UserCreateInput } from '@/database/models'
import { startService } from '../start/service'

export type RoomWithMembers = Prisma.RoomGetPayload<{
  include: {
    roomMembers: {
      include: {
        user: true
      }
    }
  }
}>
export interface IRoomsService {
  getAllRooms(): Promise<RoomWithMembers[]>
  createRoom(roomTitle: string, user: User): Promise<Room>
  joinRoom(roomId: number, user: UserCreateInput): Promise<RoomMember>
  // deleteRoom(data: RoomDeleteInput): Promise<Room>
  // updateRoom(data: RoomUpdateInput): Promise<Room>
}

export class RoomsService implements IRoomsService {  
  async joinRoom(roomId: number, user: UserCreateInput): Promise<RoomMember> {
    const userData = await startService.findOrCreateUser({
      tg_id: user.tg_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
    })

    return prisma.roomMember.create({
      data: {
        room_id: roomId,
        user_id: userData.id,
      },
    })
  }

  async getAllRooms(): Promise<RoomWithMembers[]> {
    return prisma.room.findMany({
      where: {
        is_active: true,
      },
      include: {
        roomMembers: {
          include: {
            user: true,
          },
        },
      },
    })
  }
  
  async createRoom(roomTitle: string, user: User): Promise<Room> {
    return prisma.room.create({
      data: {
        name: roomTitle,
        creator: { connect: { id: user.id } },
      },
    })
  }
}

export const roomsService = new RoomsService()
