export const MessagesConstant = {
  START: (username?: string) => `
    👋 Привет, ${username || ''}! Я — бот для организации пицца-дней 🍕
💡  После выбора комнаты ты сможешь заказывать пиццу и участвовать в голосованиях

    Чтобы начать, укажи комнату:
    `,
  BUTTON_ROOMS: '📋 Список комнат',
  BUTTON_ROOMS_GET_COMMAND: 'cmd_rooms',
  BUTTON_ROOMS_CREATE: '➕ Создать комнату',
  BUTTON_ROOMS_CREATE_COMMAND: 'cmd_rooms_create',

  ROOMS_GET_ACTION: 'rooms',
  ROOMS_CREATE_ACTION: 'rooms_create',
  ROOM_TTILE: (title: string) => `🚪 ${title}`,
  ROOM_DELETE: () => `❌ Удалить`,
  ROOM_EDIT: () => `🔧 Редактировать`,
  ROOM_DELETE_COMMAND: (id: number) => `room_delete_${id}`,
  ROOM_EDIT_COMMAND: (id: number) => `room_edit_${id}`,
  ROOM_JOIN_COMMAND: (id: number) => `room_join_${id}`,
  ROOMS_NO_ROOMS_MESSAGE:
    '📭 Нет доступных комнат\n\n Создай свою комнату, чтобы начать сбор пиццы! 🍕',
  ROOMS_LIST_MESSAGE: (title: string, countMembers: number) =>
    `🏠 Комната: ${title} \n👤 Кол-во участников: ${countMembers}`,
  ROOMS_ENTER_TTILE: '🚪 Введите название комнаты',
  ROOMS_CREATED_SUCCESS: (title: string) =>
    `🎉 Комната ${title} успешно создана! Теперь ты можешь присоединиться к ней.`,
  ROOMS_TITLE_TOO_LONG: '❌ Название слишком длинное (макс. 50 символов)',
  ROOMS_USER_NOT_FOUND: '❌ Ошибка: пользователь не найден',
  ROOMS_JOIN_ROOM: '🚪 Войти в комнату',
  ROOMS_JOIN_ROOM_COMMAND: (id: number) => `room_join_${id}`,
  BUTTON_ROOMS_CREATE_BACK: '🔙 Назад',
  BUTTON_ROOMS_CREATE_BACK_COMMAND: 'cmd_rooms_create_back',
  ROOMS_CREATE_CANCELLED: '❌ Создание комнаты отменено',
  ROOMS_CREATED_ERROR: '❌ Не удалось создать комнату. Попробуй позже.',
  ROOMS_JOIN_ERROR: (e: string) => `❌ Произошла ошибка: ${e}`,
  ROOMS_ALREADY_JOINED: '❌ Ты уже участник этой комнаты',
  ROOMS_JOINED_SUCCESS: (title: string, botUsername: string, roomId: number) =>`🎉 Ты успешно присоединился к комнате ${title}!\n 
  🔗 Ссылка-приглашение:\n 
  <code>https://t.me/${botUsername}?start=room_join_${roomId}</code>\n
  💡 <i>Нажми на ссылку выше, чтобы скопировать</i>`,
  ROOMS_DELETED_SUCCESS: (title: string) =>
    `🎉 Комната ${title} успешно удалена!`,
  ROOMS_LEAVE: '🚪 Покинуть',
  ROOMS_LEAVE_SUCCESS: `🎉 Ты успешно покинул комнату!`,
  ROOMS_LEAVE_ERROR: (e: string) => `❌ Произошла ошибка: ${e}`,
  ROOMS_LEAVE_COMMAND: (id: number) => `room_leave_${id}`,
  BUTTON_ROOMS_SUCCESS_ORDER: 'Выбрать пиццу',
  BUTTON_ROOMS_SUCCESS_ORDER_COMMAND: 'order_create',
} as const
