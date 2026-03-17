-- CreateTable
CREATE TABLE "VoteSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "room_id" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "participants_snapshot" JSONB NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "VoteSession_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VoteSession_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vote_session_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "voter_id" INTEGER NOT NULL,
    "vote_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Vote_vote_session_id_fkey" FOREIGN KEY ("vote_session_id") REFERENCES "VoteSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "room_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "pizza_name" TEXT NOT NULL,
    "addons" TEXT,
    "comment" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Order_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("addons", "comment", "created_at", "id", "is_deleted", "pizza_name", "quantity", "room_id", "updated_at", "user_id") SELECT "addons", "comment", "created_at", "id", "is_deleted", "pizza_name", coalesce("quantity", 1) AS "quantity", "room_id", "updated_at", "user_id" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_room_id_idx" ON "Order"("room_id");
CREATE INDEX "Order_user_id_idx" ON "Order"("user_id");
CREATE INDEX "Order_is_deleted_idx" ON "Order"("is_deleted");
CREATE INDEX "Order_created_at_idx" ON "Order"("created_at");
CREATE INDEX "Order_room_id_is_deleted_idx" ON "Order"("room_id", "is_deleted");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "VoteSession_room_id_idx" ON "VoteSession"("room_id");

-- CreateIndex
CREATE INDEX "VoteSession_status_idx" ON "VoteSession"("status");

-- CreateIndex
CREATE INDEX "VoteSession_created_by_idx" ON "VoteSession"("created_by");

-- CreateIndex
CREATE INDEX "VoteSession_is_deleted_idx" ON "VoteSession"("is_deleted");

-- CreateIndex
CREATE INDEX "VoteSession_started_at_idx" ON "VoteSession"("started_at");

-- CreateIndex
CREATE INDEX "Vote_vote_session_id_idx" ON "Vote"("vote_session_id");

-- CreateIndex
CREATE INDEX "Vote_order_id_idx" ON "Vote"("order_id");

-- CreateIndex
CREATE INDEX "Vote_voter_id_idx" ON "Vote"("voter_id");

-- CreateIndex
CREATE INDEX "Vote_vote_type_idx" ON "Vote"("vote_type");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_vote_session_id_order_id_voter_id_key" ON "Vote"("vote_session_id", "order_id", "voter_id");
