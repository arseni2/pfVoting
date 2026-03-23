import { prisma } from '@/config/orm/config'

async function main() {
  // Создаём тестового пользователя
  const user = await prisma.user.upsert({
    where: { tg_id: 780586038 },
    update: {
      username: 'Arsenii73',
      first_name: 'Арсений',
    },
    create: {
      tg_id: 780586038,
      username: 'Arsenii73',
      first_name: 'Арсений',
      chat_id: '780586038',
    },
  })

  console.log('Пользователь создан:', user)

  // Создаём тестовую комнату
  const room = await prisma.room.upsert({
    where: { id: 1 },
    update: {
      name: 'test',
      is_active: true,
    },
    create: {
      name: 'test',
      creator_id: user.id,
      is_active: true,
    },
  })

  console.log('Комната создана:', room)

  // Добавляем пользователя в комнату
  const membership = await prisma.roomMember.upsert({
    where: {
      room_id_user_id: {
        room_id: room.id,
        user_id: user.id,
      },
    },
    update: {
      is_active: true,
      left_at: null,
    },
    create: {
      room_id: room.id,
      user_id: user.id,
      is_active: true,
    },
  })

  console.log('Пользователь добавлен в комнату:', membership)

  // Создаём тестовые заказы
  const order1 = await prisma.order.create({
    data: {
      room_id: room.id,
      user_id: user.id,
      pizza_name: 'Пепперони',
      addons: 'сырный соус',
      comment: 'без лука',
      quantity: 1,
    },
  })

  const order2 = await prisma.order.create({
    data: {
      room_id: room.id,
      user_id: user.id,
      pizza_name: 'Маргарита',
      quantity: 2,
    },
  })

  console.log('Заказы созданы:', order1, order2)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
