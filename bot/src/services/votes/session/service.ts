import { prisma } from '@/config/orm/config'
import { Prisma, VoteSession, $Enums } from '@/database'

export type VoteSessionWithDetails = Prisma.VoteSessionGetPayload<{
  include: {
    room: true
    creator: true
  }
}>

export type CreateVoteSessionInput = {
  roomId: number
  createdBy: number
  participantIds?: number[]
}

export interface IVotesSessionService {
  createSession(input: CreateVoteSessionInput): Promise<VoteSession>
  getSessionById(id: number): Promise<VoteSessionWithDetails | null>
  getSessionsByRoom(roomId: number): Promise<VoteSession[]>
  cancelSession(roomId: number, userId: number): Promise<VoteSession>
  completeSession(sessionId: number): Promise<VoteSession>
  //   getRoomActiveMembers(roomId: number): Promise<number[]>
}

export class VotesSessionService implements IVotesSessionService {
  async completeSession(
    sessionId: number,
  ): Promise<VoteSession> {
    const session = await prisma.voteSession.findUnique({
      where: { id: sessionId },
      include: { room: true },
    })

    if (!session) {
      throw new Error('SESSION_NOT_FOUND')
    }

    return prisma.voteSession.update({
      where: { id: sessionId },
      data: {
        status: $Enums.VoteStatus.COMPLETED,
        completed_at: new Date(),
      },
    })
  }

  async createSession(input: CreateVoteSessionInput): Promise<VoteSession> {
    const { roomId, createdBy, participantIds } = input

    const voteSession = await prisma.voteSession.findFirst({
      where: {
        room_id: roomId,
      },
    })
    if (voteSession?.status == $Enums.VoteStatus.ACTIVE) {
      throw new Error('Уже ведется голосование')
    }
    const participants =
      participantIds ?? (await this.getRoomActiveMembers(roomId))

    return prisma.voteSession.create({
      data: {
        room_id: roomId,
        user_creator_id: createdBy,
        participants_snapshot: participants,
        status: $Enums.VoteStatus.ACTIVE,
      },
    })
  }

  async getSessionById(id: number): Promise<VoteSessionWithDetails | null> {
    return prisma.voteSession.findUnique({
      where: { id, is_deleted: false },
      include: {
        room: true,
        creator: true,
      },
    })
  }

  async getSessionsByRoom(roomId: number): Promise<VoteSession[]> {
    return prisma.voteSession.findMany({
      where: {
        room_id: roomId,
        is_deleted: false,
      },
      orderBy: { started_at: 'desc' },
    })
  }

  async cancelSession(roomId: number, userId: number): Promise<VoteSession> {
    const voteSession = await prisma.voteSession.findFirst({
      where: {
        room_id: roomId,
        status: $Enums.VoteStatus.ACTIVE
      },
    })
    if (voteSession?.status != $Enums.VoteStatus.ACTIVE) {
      throw new Error(`Голосование не активно, статус ${voteSession?.status}`)
    }
    const sessionId = voteSession.id
    const session = await prisma.voteSession.findUnique({
      where: { id: sessionId },
      include: { room: true },
    })

    if (!session) {
      throw new Error('SESSION_NOT_FOUND')
    }

    if (
      session.user_creator_id !== userId &&
      session.room.creator_id !== userId
    ) {
      throw new Error('SESSION_NOT_YOURS')
    }

    return prisma.voteSession.update({
      where: { id: sessionId },
      data: {
        status: $Enums.VoteStatus.CANCELLED,
        completed_at: new Date(),
      },
    })
  }

  private async getRoomActiveMembers(roomId: number): Promise<number[]> {
    const members = await prisma.roomMember.findMany({
      where: {
        room_id: roomId,
        is_active: true,
      }
    })
    console.log(members)
    return members.map((m) => m.user_id)
  }
}

export const votesSessionService = new VotesSessionService()
