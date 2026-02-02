/*
  Warnings:

  - Added the required column `updated_at` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "read_at" TIMESTAMP(3),
ADD COLUMN     "sender_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Notification_user_id_is_read_created_at_idx" ON "Notification"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "Notification_sender_id_idx" ON "Notification"("sender_id");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Conversation_direct_user_pair_unique" RENAME TO "Conversation_direct_user_a_id_direct_user_b_id_key";
