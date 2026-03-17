/*
  Warnings:

  - You are about to drop the column `created_by` on the `VoteSession` table. All the data in the column will be lost.
  - Added the required column `user_creator_id` to the `VoteSession` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VoteSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "room_id" INTEGER NOT NULL,
    "user_creator_id" INTEGER NOT NULL,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "participants_snapshot" JSONB NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "VoteSession_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VoteSession_user_creator_id_fkey" FOREIGN KEY ("user_creator_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VoteSession" ("completed_at", "created_at", "id", "is_deleted", "participants_snapshot", "room_id", "started_at", "status", "updated_at") SELECT "completed_at", "created_at", "id", "is_deleted", "participants_snapshot", "room_id", "started_at", "status", "updated_at" FROM "VoteSession";
DROP TABLE "VoteSession";
ALTER TABLE "new_VoteSession" RENAME TO "VoteSession";
CREATE INDEX "VoteSession_room_id_idx" ON "VoteSession"("room_id");
CREATE INDEX "VoteSession_status_idx" ON "VoteSession"("status");
CREATE INDEX "VoteSession_user_creator_id_idx" ON "VoteSession"("user_creator_id");
CREATE INDEX "VoteSession_is_deleted_idx" ON "VoteSession"("is_deleted");
CREATE INDEX "VoteSession_started_at_idx" ON "VoteSession"("started_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
