/*
  Warnings:

  - You are about to alter the column `tg_id` on the `User` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tg_id" INTEGER NOT NULL,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_User" ("created_at", "first_name", "id", "last_name", "tg_id", "updated_at", "username") SELECT "created_at", "first_name", "id", "last_name", "tg_id", "updated_at", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_tg_id_key" ON "User"("tg_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
