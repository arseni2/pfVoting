import { prisma } from '@/config/orm/config'
import { Order, Prisma, User } from '@/database/client'
import { UserWithRoomMembers } from '../start/service'

export type BatchPayload = { count: number }

export type OrderWithUser = Prisma.OrderGetPayload<{
  include: {
    user: true
  }
}>

export interface IOrdersService {
  getOrderInRoom(roomId: number): Promise<OrderWithUser[]>
  getOrderByUser(user: User, roomId: number): Promise<OrderWithUser[]>
  create(
    pizzaName: string,
    user: User,
    roomId: number,
    addons: string | null,
    comment: string | null,
    quantity: number
  ): Promise<Order>
  delete(orderId: number, userId: number): Promise<Order>
  update(
    orderId: number,
    userId: number,
    data: Partial<{ pizza_name: string; addons: string | null; comment: string | null; quantity: number }>
  ): Promise<Order>
  deleteMany(userId: number): Promise<BatchPayload>
}

export class OrdersService implements IOrdersService {
  async deleteMany(userId: number) {
    return prisma.order.deleteMany({
      where: {
        user_id: userId
      }
    })
  }

  async delete(orderId: number, userId: number): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      throw new Error('ORDER_NOT_FOUND')
    }

    if (order.user_id !== userId) {
      throw new Error('ORDER_NOT_YOURS')
    }

    return prisma.order.update({
      where: { id: orderId },
      data: {
        is_deleted: true,
      },
    })
  }

  async getOrderInRoom(roomId: number): Promise<OrderWithUser[]> {
    return prisma.order.findMany({
      where: {
        is_deleted: false,
        room_id: roomId,
      },
      include: {
        user: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    })
  }

  async getOrderByUser(user: UserWithRoomMembers, roomId: number): Promise<OrderWithUser[]> {
    return prisma.order.findMany({
      where: {
        is_deleted: false,
        room_id: roomId,
        user_id: user.id,
      },
      include: {
        user: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    })
  }

  async create(
    pizzaName: string,
    user: User,
    roomId: number,
    addons: string | null,
    comment: string | null,
    quantity: number
  ): Promise<Order> {
    const userOrdersCount = await prisma.order.count({
      where: {
        room_id: roomId,
        user_id: user.id,
        is_deleted: false,
      },
    })

    if (userOrdersCount >= 3) {
      throw new Error('ORDER_TOO_MANY')
    }

    return prisma.order.create({
      data: {
        pizza_name: pizzaName,
        addons: addons ?? null,
        comment: comment ?? null,
        quantity: quantity ?? 1,
        room_id: roomId,
        user_id: user.id,
      },
    })
  }

  async update(
    orderId: number,
    userId: number,
    data: Partial<{ pizza_name: string; addons: string | null; comment: string | null; quantity: number }>
  ): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      throw new Error('ORDER_NOT_FOUND')
    }

    if (order.user_id !== userId) {
      throw new Error('ORDER_NOT_YOURS')
    }

    return prisma.order.update({
      where: { id: orderId },
      data: {
        pizza_name: data.pizza_name,
        addons: data.addons ?? null,
        comment: data.comment ?? null,
        quantity: data.quantity,
        updated_at: new Date(),
      },
    })
  }
}

export const ordersService = new OrdersService()
