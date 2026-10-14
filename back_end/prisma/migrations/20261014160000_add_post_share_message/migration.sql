-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'post';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "post_id" TEXT;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

