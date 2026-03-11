import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(import.meta.dirname, '../../../.env') })

export const AppConstant = {
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN!,
}
