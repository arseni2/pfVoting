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
export type RoomMemberWithRoom = Prisma.RoomMemberGetPayload<{
  include: {
    room: true
  }
}>
export interface IRoomsService {
  getAllRooms(): Promise<RoomWithMembers[]>
  createRoom(roomTitle: string, user: User): Promise<Room>
  joinRoom(
    roomId: number,
    user: User
  ): Promise<{ roomDetail: RoomWithMembers; member: RoomMember }>
  softDeleteRoom(roomId: number, user: User): Promise<Room>
  getRoomById(roomId: number): Promise<Room | null>
  leaveRoom(roomId: number, user: User): Promise<RoomMember>
  getUsersInRoom(roomId: number): Promise<User[]>
  // updateRoom(data: RoomUpdateInput): Promise<Room>
}

export class RoomsService implements IRoomsService {
  async getUsersInRoom(roomId: number) {
    const room = await prisma.room.findUnique({
      where: {
        id: roomId,
      },
      include: {
        roomMembers: {
          include: {
            user: true,
          },
        },
      },
    })
    if (!room) throw new Error(`Нет комнаты с id ${roomId}`)

    return room.roomMembers.map((roomMember) => roomMember.user)
  }

  async leaveRoom(roomId: number, user: UserCreateInput): Promise<RoomMember> {
    const userData = await startService.findOrCreateUser({
      tg_id: user.tg_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
    })

    return prisma.roomMember.update({
      where: { room_id_user_id: { room_id: roomId, user_id: userData.id } },
      data: {
        is_active: false,
        left_at: new Date(),
      },
    })
  }
  async getRoomById(roomId: number): Promise<RoomWithMembers | null> {
    const roomDetail = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        roomMembers: {
          include: {
            user: true,
          },
        },
      },
    })

    return roomDetail
  }

  async softDeleteRoom(roomId: number, user: User): Promise<Room> {
    return prisma.room.update({
      where: { id: roomId },
      data: {
        is_active: false,
        deleted_at: new Date(),
        deleted_by: user.id,
      },
    })
  }

  async joinRoom(
    roomId: number,
    user: User
  ): Promise<{ roomDetail: RoomWithMembers; member: RoomMember }> {
    const roomDetail = await this.getRoomById(roomId)

    if (!roomDetail) {
      throw 'Комната не найдена'
    }

    const isMember = roomDetail.roomMembers.some(
      (member) => member.user.tg_id === user.tg_id && member.is_active
    )

    if (isMember) {
      throw 'Ты уже участник этой комнаты'
    }

    await prisma.roomMember.updateMany({
      where: {
        user_id: user.id,
        room_id: { not: roomId },
        is_active: true,
      },
      data: {
        is_active: false,
        left_at: new Date(),
      },
    })

    const member = await prisma.roomMember.upsert({
      where: {
        room_id_user_id: {
          room_id: roomId,
          user_id: user.id,
        },
      },
      update: {
        is_active: true,
        left_at: null,
        joined_at: new Date(),
      },
      create: {
        room_id: roomId,
        user_id: user.id,
        is_active: true,
      },
    })

    return {
      roomDetail,
      member,
    }
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
