import { prisma } from '@/config/orm/config'
import { Vote } from '@/database'
import { Prisma } from '@/database/client'
import { $Enums } from '@/database'

export type RoomWithMembers = Prisma.RoomGetPayload<{
  include: {
    roomMembers: {
      include: {
        user: true
      }
    }
  }
}>
export type CastVoteInput = {
  sessionId: number
  orderId: number
  voterId: number
  voteType: $Enums.VoteType
}

export interface IVotesService {
  canUserVote(sessionId: number, userId: number): Promise<boolean>
  castVote(input: CastVoteInput): Promise<Vote>
  getUserVote(sessionId: number, userId: number): Promise<Vote | null>
  revokeVote(input: RevokeVoteInput): Promise<Vote>
}
export type RevokeVoteInput = {
  sessionId: number
  orderId: number
  voterId: number
}
export class VotesService implements IVotesService {
  async canUserVote(sessionId: number, userId: number): Promise<boolean> {
    const session = await prisma.voteSession.findUnique({
      where: { id: sessionId },
    })

    if (!session || session.status !== 'ACTIVE' || session.is_deleted) {
      return false
    }

    const participants = session.participants_snapshot as number[]
    return participants.includes(userId)
  }

  async castVote(input: CastVoteInput): Promise<Vote> {
    const { sessionId, orderId, voterId, voteType } = input

    const session = await prisma.voteSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      throw new Error('SESSION_NOT_FOUND')
    }

    if (session.status !== 'ACTIVE') {
      throw new Error('SESSION_NOT_ACTIVE')
    }

    if (session.is_deleted) {
      throw new Error('SESSION_DELETED')
    }

    const participants = session.participants_snapshot as number[]
    if (!participants.includes(voterId)) {
      throw new Error('USER_NOT_PARTICIPANT')
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId, is_deleted: false },
    })

    if (!order || order.room_id !== session.room_id) {
      throw new Error('ORDER_NOT_FOUND')
    }

    return prisma.vote.upsert({
      where: {
        vote_session_id_order_id_voter_id: {
          vote_session_id: sessionId,
          order_id: orderId,
          voter_id: voterId,
        },
      },
      update: { vote_type: voteType },
      create: {
        vote_session_id: sessionId,
        order_id: orderId,
        voter_id: voterId,
        vote_type: voteType,
      },
    })
  }

  async getUserVote(sessionId: number, userId: number): Promise<Vote | null> {
    return prisma.vote.findFirst({
      where: {
        vote_session_id: sessionId,
        voter_id: userId,
      },
    })
  }

  async revokeVote(input: RevokeVoteInput): Promise<Vote> {
    const { sessionId, orderId, voterId } = input

    const session = await prisma.voteSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      throw new Error('SESSION_NOT_FOUND')
    }

    if (session.status !== 'ACTIVE') {
      throw new Error('SESSION_NOT_ACTIVE')
    }

    if (session.is_deleted) {
      throw new Error('SESSION_DELETED')
    }

    const participants = session.participants_snapshot as number[]
    if (!participants.includes(voterId)) {
      throw new Error('USER_NOT_PARTICIPANT')
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        vote_session_id_order_id_voter_id: {
          vote_session_id: sessionId,
          order_id: orderId,
          voter_id: voterId,
        },
      },
    })

    if (!existingVote) {
      throw new Error('VOTE_NOT_FOUND')
    }

    return prisma.vote.delete({
      where: {
        vote_session_id_order_id_voter_id: {
          vote_session_id: sessionId,
          order_id: orderId,
          voter_id: voterId,
        },
      },
    })
  }
}

export const votessService = new VotesService()
