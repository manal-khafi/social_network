-- CreateEnum
CREATE TYPE "CallType" AS ENUM ('audio', 'video');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('ringing', 'accepted', 'rejected', 'missed', 'ended');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MessageType" ADD VALUE 'sticker';
ALTER TYPE "MessageType" ADD VALUE 'audio';
ALTER TYPE "MessageType" ADD VALUE 'location';

-- AlterTable
ALTER TABLE "ConversationParticipant" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_read_at" TIMESTAMP(3),
ADD COLUMN     "muted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deleted_for_all" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payload" JSONB;

-- AlterTable
ALTER TABLE "MessageStatus" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "call_type" "CallType" NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'ringing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "caller_id" TEXT NOT NULL,
    "callee_id" TEXT NOT NULL,
    "conversation_id" TEXT,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallLog_caller_id_idx" ON "CallLog"("caller_id");

-- CreateIndex
CREATE INDEX "CallLog_callee_id_idx" ON "CallLog"("callee_id");

-- CreateIndex
CREATE INDEX "CallLog_conversation_id_idx" ON "CallLog"("conversation_id");

-- CreateIndex
CREATE INDEX "ConversationParticipant_user_id_idx" ON "ConversationParticipant"("user_id");

-- CreateIndex
CREATE INDEX "ConversationParticipant_conversation_id_idx" ON "ConversationParticipant"("conversation_id");

-- CreateIndex
CREATE INDEX "MessageStatus_user_id_idx" ON "MessageStatus"("user_id");

-- CreateIndex
CREATE INDEX "MessageStatus_message_id_idx" ON "MessageStatus"("message_id");

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_caller_id_fkey" FOREIGN KEY ("caller_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_callee_id_fkey" FOREIGN KEY ("callee_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
