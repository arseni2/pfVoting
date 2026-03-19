import { Context, Markup, Telegraf } from 'telegraf'
import { Update } from 'telegraf/types'
import { MessagesConstant } from '@/constants/messages/constant'

const helpText = `🤖 <b>Бот для организации пицца-дней</b>

<b>📋 Начало:</b>
/start — Начать 

<b>📋 Доступные команды:</b>

<b>🏠 Комнаты:</b>
/rooms — Список всех комнат
/rooms_create — Создать новую комнату

<b>🍕 Заказы:</b>
/cmd_orders_my — Мои заказы
/cmd_orders_room — Все заказы в комнате
/cmd_orders_create — Создать заказ

<b>🗳️ Голосование:</b>
/cmd_vote_start — Начать голосование
/cmd_vote_get_active — Активное голосование / Результаты

<b>ℹ️ Формат заказа:</b>
<code>название + добавки (комментарий) [кол-во]</code>

Примеры:
<code>Пепперони + сырный соус (без лука) [1]</code>
<code>Маргарита [2]</code>
<code>Гавайская + ананасы, ветчина</code>

<b>📝 Пояснения:</b>
• <b>название пиццы</b> — обязательно
• <b>+ добавки</b> — опционально (после знака +)
• <b>(комментарий)</b> — опционально (в скобках)
• <b>[кол-во]</b> — опционально (в квадратных скобках, по умолчанию 1)

<b>🔹 Кнопки управления:</b>
• 🗑️ Удалить заказ — удаляет конкретный заказ
• ✏️ Изменить — редактирует существующий заказ
• 🗳️ Провести голосование — запускает голосование по заказам
• 🔄 Обновить — обновляет результаты голосования`

export class HelpController {
  async help(ctx: Context) {
    await ctx.reply(helpText, {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback(
            MessagesConstant.BUTTON_ROOMS,
            MessagesConstant.BUTTON_ROOMS_GET_COMMAND
          ),
        ],
        [
          Markup.button.callback(
            MessagesConstant.BUTTON_ORDERS_MY,
            MessagesConstant.BUTTON_ORDERS_MY_COMMAND
          ),
          Markup.button.callback(
            MessagesConstant.BUTTON_ORDER_CREATE,
            MessagesConstant.ORDER_CREATE_ACTION
          ),
        ],
        [
          Markup.button.callback(
            '🗳️ Голосование',
            MessagesConstant.BUTTON_VOTE_START_COMMAND
          ),
        ],
      ]).reply_markup,
    })
  }
}

export const helpController = new HelpController()

export const helpControllerConfig = (bot: Telegraf<Context<Update>>) => {
  bot.command('help', helpController.help)
}
