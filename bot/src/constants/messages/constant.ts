export const MessagesConstant = {
  //shared
  BUTTON_BACK: '🔙 Назад',

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
  BUTTON_ROOMS_CREATE_BACK_COMMAND: 'cmd_rooms_create_back',
  ROOMS_CREATE_CANCELLED: '❌ Создание комнаты отменено',
  ROOMS_CREATED_ERROR: '❌ Не удалось создать комнату. Попробуй позже.',
  ROOMS_JOIN_ERROR: (e: string) => `❌ Произошла ошибка: ${e}`,
  ROOMS_ALREADY_JOINED: '❌ Ты уже участник этой комнаты',
  ROOMS_JOINED_SUCCESS: (
    title: string,
    botUsername: string,
    roomId: number
  ) => `🎉 Ты успешно присоединился к комнате ${title}!\n
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

  // Orders
  ORDER_DELETE_SUCCESS: (title: string) => `✅ Заказ "${title}" удалён`,
  ORDER_NOT_FOUND: '❌ Заказ не найден',
  ORDER_NOT_YOURS: '❌ Это не ваш заказ',
  ORDER_CREATE_BACK_COMMAND: 'cmd_orders_create_back',
  ORDER_CREATE_ACTION: 'cmd_orders_create',
  ORDER_ENTER_DATA:
    '🍕 Введите данные заказа в формате:\n\n' +
    '<b>название пиццы + добавки (комментарий) [кол-во]</b>\n\n' +
    'Примеры:\n' +
    '<code>Пепперони + сырный соус (без лука) [1]</code>\n' +
    '<code>Маргарита [2]</code>\n' +
    '<code>Гавайская + ананасы, ветчина</code>\n\n' +
    '❗ Название пиццы обязательно, остальное — по желанию',
  ORDER_EMPTY_INPUT: '❌ Ввод не может быть пустым',
  ORDER_INVALID_FORMAT:
    '❌ Неверный формат заказа.\n\n' +
    'Используйте формат: <b>название + добавки (комментарий) [кол-во]</b>\n\n' +
    'Пример: <code>Пепперони + сырный соус (без лука) [1]</code>',
  ORDER_CREATED_SUCCESS: (
    pizzaName: string,
    addons: string | null,
    comment: string | null
  ) =>
    `✅ Заказ создан!\n\n` +
    `🍕 <b>${pizzaName}</b>\n` +
    (addons ? `➕ Добавки: ${addons}\n` : '') +
    (comment ? `📝 Комментарий: ${comment}\n` : '') +
    `\nТеперь можно добавить ещё один заказ или дождаться голосования`,
  ORDER_CREATED_ERROR: '❌ Не удалось создать заказ. Попробуй позже.',
  ORDER_TOO_MANY: '❌ Слишком много заказов (макс. 3 на человека)',
  ORDER_UPDATE_ENTER_DATA:
    '✏️ Введите новые данные заказа в формате:\n\n' +
    '<b>название пиццы + добавки (комментарий) [кол-во]</b>\n\n' +
    'Примеры:\n' +
    '<code>Пепперони + сырный соус (без лука) [1]</code>\n' +
    '<code>Маргарита [2]</code>\n' +
    '<code>Гавайская + ананасы, ветчина</code>\n\n' +
    '❗ Название пиццы обязательно, остальное — по желанию',
  ORDER_UPDATED_SUCCESS: (
    pizzaName: string,
    addons: string | null,
    comment: string | null
  ) =>
    `✅ Заказ обновлён!\n\n` +
    `🍕 <b>${pizzaName}</b>\n` +
    (addons ? `➕ Добавки: ${addons}\n` : '') +
    (comment ? `📝 Комментарий: ${comment}\n` : '') +
    `\n`,
  ORDER_UPDATE_CANCELLED: '❌ Редактирование заказа отменено',
  BUTTON_ORDER_CREATE: '➕ Сделать заказ',
  BUTTON_ORDER_CREATE_COMMAND: 'cmd_order_create',
  BUTTON_ORDERS_MY: '📋 Мои заказы',
  BUTTON_ORDERS_MY_COMMAND: 'cmd_orders_my',
  BUTTON_ORDERS_ROOM_COMMAND: 'cmd_orders_room',
  BUTTON_ORDER_UPDATE_COMMAND: 'cmd_orders_update',
  BUTTON_ORDER_UPDATE_BACK_COMMAND: 'cmd_orders_update_back',

  BUTTON_VOTE_START_COMMAND: `cmd_vote_start`,
  VOTE_START_SUCCESS: `Голосование успешно начато`,
  VOTE_ORDERS_SUCCESS: `Пиццы для голосования:`,
  VOTE_GET_ACTIVE_ACTION: `cmd_vote_get_active`,

  // Vote errors
  VOTE_ERROR: (e: unknown) => `Error - ${e}`,
  VOTE_NOT_FOUND: '❌ Голосование не найдено',
  VOTE_ACTIVE_NOT_FOUND: '❌ Активное голосование не найдено',
  VOTE_COMPLETE_SUCCESS: '✅ Голосование завершено!',
  VOTE_COMPLETE_ERROR: (e: string) => `Ошибка завершения: ${e}`,
  VOTE_CANCEL_SUCCESS: 'Голосование успешно отменено',
  VOTE_CANCEL_ERROR: (e: string) => `Ошибка отмены голосования: ${e}`,
  VOTE_NO_ACTIVE_SESSION: '❌ В комнате нет активного голосования',
  VOTE_RESULTS_TITLE: (roomName: string) =>
    `🗳️ Результаты голосования в комнате "${roomName}"`,
  VOTE_RESULTS_ITEM: (
    medal: string,
    index: number,
    pizza: string,
    addons: string,
    comment: string,
    quantity: number,
    userName: string,
    votesFor: number,
    votesAgainst: number
  ) =>
    `${medal} ${index + 1}. 🍕 ${pizza} ${addons} ${comment} [${quantity}] — ${userName}\n   👍 ${votesFor} | 👎 ${votesAgainst}`,

  // Vote session
  VOTE_SESSION_TITLE: (roomName: string) =>
    `🗳️ Голосование в комнате "${roomName}"\n\n`,
  VOTE_BUTTON_FOR: '👍 За',
  VOTE_BUTTON_AGAINST: '👎 Против',
  VOTE_BUTTON_CANCEL: '↩️',
  VOTE_BUTTON_COMPLETE: '🗳️ Завершить голосование',
  VOTE_BUTTON_CANCEL_SESSION: '🗳️ Отменить голосование',
  VOTE_BUTTON_REFRESH: '🔄 Обновить',
  VOTE_BUTTON_BACK_TO_ORDERS: '📋 Назад к заказам',

  // Vote actions
  VOTE_FOR_ACTION: (orderId: number) => `vote_for_${orderId}`,
  VOTE_AGAINST_ACTION: (orderId: number) => `vote_against_${orderId}`,
  VOTE_CANCEL_ACTION: (orderId: number) => `vote_cancel_${orderId}`,
  VOTE_COMPLETE_ACTION: 'vote_complete',
  VOTE_CANCEL_SESSION_ACTION: 'vote_cancel_session',
  VOTE_RESULTS_REFRESH_ACTION: 'vote_results_refresh',
  VOTE_STATUS_ACTION: 'vote_status',
} as const
