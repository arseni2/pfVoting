-- CreateTable
CREATE TABLE "Room" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" DATETIME,
    "deleted_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Room_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoomMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "room_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "RoomMember_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Room_is_active_idx" ON "Room"("is_active");

-- CreateIndex
CREATE INDEX "Room_is_deleted_idx" ON "Room"("is_deleted");

-- CreateIndex
CREATE INDEX "Room_creator_id_idx" ON "Room"("creator_id");

-- CreateIndex
CREATE INDEX "Room_created_at_idx" ON "Room"("created_at");

-- CreateIndex
CREATE INDEX "RoomMember_room_id_idx" ON "RoomMember"("room_id");

-- CreateIndex
CREATE INDEX "RoomMember_user_id_idx" ON "RoomMember"("user_id");

-- CreateIndex
CREATE INDEX "RoomMember_is_active_idx" ON "RoomMember"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "RoomMember_room_id_user_id_key" ON "RoomMember"("room_id", "user_id");

-- CreateIndex
CREATE INDEX "User_tg_id_idx" ON "User"("tg_id");
