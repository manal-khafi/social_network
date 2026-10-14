-- CreateIndex
CREATE INDEX "Follow_followed_id_status_idx" ON "Follow"("followed_id", "status");

-- CreateIndex
CREATE INDEX "Post_user_id_created_at_idx" ON "Post"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "Post_created_at_idx" ON "Post"("created_at");

-- CreateIndex
CREATE INDEX "Comment_post_id_created_at_idx" ON "Comment"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "Comment_user_id_idx" ON "Comment"("user_id");

-- CreateIndex
CREATE INDEX "Message_conversation_id_created_at_idx" ON "Message"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "Message_sender_id_idx" ON "Message"("sender_id");

-- CreateIndex
CREATE INDEX "Notification_user_id_created_at_idx" ON "Notification"("user_id", "created_at");

