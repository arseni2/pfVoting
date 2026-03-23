import { prisma } from '@/config/orm/config'

export interface IVoteService {
  saveVote(sessionId: number, userTgId: number, optionIndexes: number[]): Promise<void>
  getUserVote(sessionId: number, userTgId: number): Promise<number | null>
  getVotesBySession(sessionId: number): Promise<{ option_index: number; count: number }[]>
}

export class VoteService implements IVoteService {
  async saveVote(sessionId: number, userTgId: number, optionIndexes: number[]): Promise<void> {
    // Находим пользователя по tg_id
    const user = await prisma.user.findFirst({
      where: { tg_id: userTgId },
      select: { id: true },
    })

    if (!user) {
      console.warn(`[VoteService] пользователь с tg_id ${userTgId} не найден`)
      return
    }

    // Сначала удалим предыдущие голоса пользователя в этой сессии
    await prisma.vote.deleteMany({
      where: {
        session_id: sessionId,
        user_id: user.id,
      },
    })

    // Сохраняем все выбранные голоса
    await prisma.vote.createMany({
      data: optionIndexes.map((optionIndex) => ({
        session_id: sessionId,
        user_id: user.id,
        option_index: optionIndex,
      })),
    })
  }

  async getUserVote(sessionId: number, userTgId: number): Promise<number | null> {
    const user = await prisma.user.findFirst({
      where: { tg_id: userTgId },
      select: { id: true },
    })

    if (!user) {
      return null
    }

    const vote = await prisma.vote.findFirst({
      where: {
        session_id: sessionId,
        user_id: user.id,
      },
      select: {
        option_index: true,
      },
    })
    return vote?.option_index ?? null
  }

  async getVotesBySession(sessionId: number): Promise<{ option_index: number; count: number }[]> {
    const result = await prisma.vote.groupBy({
      by: ['option_index'],
      where: {
        session_id: sessionId,
      },
      _count: {
        option_index: true,
      },
    })

    return result.map((r) => ({
      option_index: r.option_index,
      count: r._count.option_index,
    }))
  }
}

export const voteService = new VoteService()
