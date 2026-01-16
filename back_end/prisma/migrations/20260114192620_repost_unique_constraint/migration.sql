/*
  Warnings:

  - A unique constraint covering the columns `[user_id,original_post_id]` on the table `Repost` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Repost_user_id_original_post_id_key" ON "Repost"("user_id", "original_post_id");
