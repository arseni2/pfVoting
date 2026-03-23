-- AlterTable
ALTER TABLE "VoteSession" ADD COLUMN "options_snapshot" JSONB;
ALTER TABLE "VoteSession" ADD COLUMN "telegram_chat_id" TEXT;
ALTER TABLE "VoteSession" ADD COLUMN "telegram_poll_id" TEXT;

-- CreateTable
CREATE TABLE "Vote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "option_index" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "VoteSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Vote_session_id_idx" ON "Vote"("session_id");

-- CreateIndex
CREATE INDEX "Vote_user_id_idx" ON "Vote"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_session_id_user_id_option_index_key" ON "Vote"("session_id", "user_id", "option_index");
