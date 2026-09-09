-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'call';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ConversationParticipant" ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_read_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "call_meta" JSONB;
