export const MessagesConstant = {
  START: (username?: string) => `
    👋 Привет, ${username || ''}! Я — бот для организации пицца-дней 🍕
💡  После выбора комнаты ты сможешь заказывать пиццу и участвовать в голосованиях

    Чтобы начать, укажи комнату:
    `,
  BUTTON_ROOMS: '📋 Список комнат',
  BUTTON_ROOMS_COMMAND: 'cmd_rooms',
  BUTTON_ROOMS_CREATE: '➕ Создать комнату',
  BUTTON_ROOMS_CREATE_COMMAND: 'cmd_rooms_create',
} as const
