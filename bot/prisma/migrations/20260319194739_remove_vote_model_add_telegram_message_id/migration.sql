/*
  Warnings:

  - You are about to drop the `Vote` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "VoteSession" ADD COLUMN "telegram_message_id" INTEGER;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Vote";
PRAGMA foreign_keys=on;
