-- Add per-user conversation soft-delete
ALTER TABLE "ConversationParticipant" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ConversationParticipant" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- Add per-user message hide (delete for me)
ALTER TABLE "MessageStatus" ADD COLUMN "is_hidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MessageStatus" ADD COLUMN "hidden_at" TIMESTAMP(3);
