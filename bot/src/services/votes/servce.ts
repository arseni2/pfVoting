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
  roomId: number
  orderId: number
  voterId: number
  voteType: $Enums.VoteType
}
export type OrderVoteResult = {
  order: {
    id: number
    pizza_name: string
    addons: string | null
    comment: string | null
    quantity: number
    user: {
      id: number
      first_name: string | null
      username: string | null
    } | null
  }
  votes: {
    for: number
    against: number
    score: number // for - against
  }
}
export interface IVotesService {
  canUserVote(sessionId: number, userId: number): Promise<boolean>
  castVote(input: CastVoteInput): Promise<Vote>
  getUserVote(sessionId: number, userId: number): Promise<Vote | null>
  revokeVote(input: RevokeVoteInput): Promise<Vote>
  getOrdersSortedByVotes(roomId: number): Promise<OrderVoteResult[]>
}
export type RevokeVoteInput = {
  roomId: number
  orderId: number
  voterId: number
}
export class VotesService implements IVotesService {
  async getOrdersSortedByVotes(roomId: number): Promise<OrderVoteResult[]> {
    const voteSession = await prisma.voteSession.findFirst({
      where: {
        room_id: roomId,
        status: {
          in: [$Enums.VoteStatus.ACTIVE, $Enums.VoteStatus.COMPLETED],
        },
        is_deleted: false,
      },
      orderBy: { started_at: 'desc' },
    })
  
    if (!voteSession) {
      const orders = await prisma.order.findMany({
        where: {
          room_id: roomId,
          is_deleted: false,
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              username: true,
            },
          },
        },
        orderBy: { created_at: 'asc' },
      })
  
      return orders.map((order) => ({
        order: {
          id: order.id,
          pizza_name: order.pizza_name,
          addons: order.addons,
          comment: order.comment,
          quantity: order.quantity,
          user: order.user,
        },
        votes: { for: 0, against: 0, score: 0 },
      }))
    }
  
    const orders = await prisma.order.findMany({
      where: {
        room_id: roomId,
        is_deleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            username: true,
          },
        },
      },
    })
  
    const voteStats = await prisma.vote.groupBy({
      by: ['order_id', 'vote_type'],
      where: {
        vote_session_id: voteSession.id,
      },
      _count: true,
    })
  
    const results: OrderVoteResult[] = orders.map((order) => {
      const stats = voteStats.filter((v) => v.order_id === order.id)
      const forVotes = stats.find((s) => s.vote_type === $Enums.VoteType.FOR)?._count ?? 0
      const againstVotes =
        stats.find((s) => s.vote_type === $Enums.VoteType.AGAINST)?._count ?? 0
  
      return {
        order: {
          id: order.id,
          pizza_name: order.pizza_name,
          addons: order.addons,
          comment: order.comment,
          quantity: order.quantity,
          user: order.user,
        },
        votes: {
          for: forVotes,
          against: againstVotes,
          score: forVotes - againstVotes,
        },
      }
    })
  
    return results.sort((a, b) => {
      if (b.votes.score !== a.votes.score) {
        return b.votes.score - a.votes.score
      }
      return b.votes.for - a.votes.for
    })
  }

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
    const { roomId, orderId, voterId, voteType } = input

    const voteSession = await prisma.voteSession.findFirst({
      where: {
        room_id: roomId,
        status: $Enums.VoteStatus.ACTIVE,
        is_deleted: false,
      },
      orderBy: { started_at: 'desc' },
    })

    if (!voteSession) {
      throw new Error('Голосование не найдено в комнате')
    }

    const session = await prisma.voteSession.findUnique({
      where: { id: voteSession.id },
    })

    if (!session) {
      throw new Error('SESSION_NOT_FOUND')
    }

    if (session.status !== $Enums.VoteStatus.ACTIVE) {
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

    const existingVote = await prisma.vote.findUnique({
      where: {
        vote_session_id_order_id_voter_id: {
          vote_session_id: voteSession.id,
          order_id: orderId,
          voter_id: voterId,
        },
      },
    })

    if (existingVote && existingVote.vote_type !== voteType) {
      await prisma.vote.delete({
        where: {
          vote_session_id_order_id_voter_id: {
            vote_session_id: voteSession.id,
            order_id: orderId,
            voter_id: voterId,
          },
        },
      })
    }

    return prisma.vote.upsert({
      where: {
        vote_session_id_order_id_voter_id: {
          vote_session_id: voteSession.id,
          order_id: orderId,
          voter_id: voterId,
        },
      },
      update: { vote_type: voteType },
      create: {
        vote_session_id: voteSession.id,
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
    const { roomId, orderId, voterId } = input

    const voteSession = await prisma.voteSession.findFirst({
      where: {
        room_id: roomId,
        status: $Enums.VoteStatus.ACTIVE,
        is_deleted: false,
      },
      orderBy: { started_at: 'desc' },
    })
    const sessionId = voteSession?.id
    if (!sessionId) {
      throw new Error('SESSION_NOT_FOUND')
    }
    const session = await prisma.voteSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      throw new Error('SESSION_NOT_FOUND')
    }

    if (session.status !== $Enums.VoteStatus.ACTIVE) {
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

export const votesService = new VotesService()
