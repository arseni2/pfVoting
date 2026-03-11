import { Context, Telegraf } from "telegraf"
import { Update } from "telegraf/types"
import { roomsCreateController } from "@/controllers/rooms/create"
import { roomsController } from "@/controllers/rooms/get"

export const roomsControllerConfig = (bot: Telegraf<Context<Update>>) => {
    bot.command('rooms', roomsController)
    bot.command('rooms_create', roomsCreateController)
}