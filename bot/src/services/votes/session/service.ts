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
  cancelSession(sessionId: number, userId: number): Promise<VoteSession>
  completeSession(sessionId: number): Promise<VoteSession>
  saveTelegramPollId(sessionId: number, pollId: string): Promise<VoteSession>
  saveTelegramMessageId(sessionId: number, messageId: number): Promise<VoteSession>
  saveTelegramChatId(sessionId: number, chatId: string): Promise<VoteSession>
  getTelegramPollId(sessionId: number): Promise<string | null>
  getTelegramMessageId(sessionId: number): Promise<number | null>
  getTelegramChatId(sessionId: number): Promise<string | null>
}

export class VotesSessionService implements IVotesSessionService {
  async saveTelegramPollId(
    sessionId: number,
    pollId: string
  ): Promise<VoteSession> {
    return prisma.voteSession.update({
      where: { id: sessionId },
      data: { telegram_poll_id: pollId },
    })
  }

  async saveTelegramMessageId(
    sessionId: number,
    messageId: number
  ): Promise<VoteSession> {
    return prisma.voteSession.update({
      where: { id: sessionId },
      data: { telegram_message_id: messageId },
    })
  }

  async saveTelegramChatId(
    sessionId: number,
    chatId: string
  ): Promise<VoteSession> {
    return prisma.voteSession.update({
      where: { id: sessionId },
      data: { telegram_chat_id: chatId },
    })
  }

  async getTelegramPollId(sessionId: number): Promise<string | null> {
    const session = await prisma.voteSession.findUnique({
      where: { id: sessionId },
      select: { telegram_poll_id: true },
    })
    return session?.telegram_poll_id ?? null
  }

  async getTelegramMessageId(sessionId: number): Promise<number | null> {
    const session = await prisma.voteSession.findUnique({
      where: { id: sessionId },
      select: { telegram_message_id: true },
    })
    return session?.telegram_message_id ?? null
  }

  async getTelegramChatId(sessionId: number): Promise<string | null> {
    const session = await prisma.voteSession.findUnique({
      where: { id: sessionId },
      select: { telegram_chat_id: true },
    })
    return session?.telegram_chat_id ?? null
  }

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

  async cancelSession(sessionId: number, userId: number): Promise<VoteSession> {
    const voteSession = await prisma.voteSession.findFirst({
      where: {
        id: sessionId,
        status: $Enums.VoteStatus.ACTIVE
      },
    })

    if (!voteSession) {
      throw new Error(`Голосование не найдено`)
    }
    
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
    return members.map((m) => m.user_id)
  }
}

export const votesSessionService = new VotesSessionService()
