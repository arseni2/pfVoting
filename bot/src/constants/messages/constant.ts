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
  ROOMS_NO_ROOMS_MESSAGE: '📭 Нет доступных комнат\n\n Создай свою комнату, чтобы начать сбор пиццы! 🍕',
  ROOMS_LIST_MESSAGE: (title: string, countMembers: number) => `🏠 Комната: ${title} \n👤 Кол-во участников: ${countMembers}`,
  ROOMS_ENTER_TTILE: "🚪 Введите название комнаты",
  ROOMS_CREATED_SUCCESS: (title: string) => `🎉 Комната ${title} успешно создана! Теперь ты можешь присоединиться к ней.`,
  ROOMS_TITLE_TOO_LONG: "❌ Название слишком длинное (макс. 50 символов)",
  ROOMS_USER_NOT_FOUND: "❌ Ошибка: пользователь не найден",
  ROOMS_JOIN_ROOM: "🚪 Войти в комнату",
  ROOMS_JOIN_ROOM_COMMAND: (id: number) => `room_join_${id}`,
  BUTTON_ROOMS_CREATE_BACK: '🔙 Назад',
  BUTTON_ROOMS_CREATE_BACK_COMMAND: 'cmd_rooms_create_back',
  ROOMS_CREATE_CANCELLED: '❌ Создание комнаты отменено',
  ROOMS_CREATED_ERROR: '❌ Не удалось создать комнату. Попробуй позже.',
} as const
