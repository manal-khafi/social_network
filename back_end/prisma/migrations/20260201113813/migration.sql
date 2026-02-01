-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "font_size" INTEGER NOT NULL DEFAULT 16,
    "layout_density" TEXT NOT NULL DEFAULT 'comfortable',
    "language" TEXT NOT NULL DEFAULT 'en',
    "high_contrast" BOOLEAN NOT NULL DEFAULT false,
    "reduced_motion" BOOLEAN NOT NULL DEFAULT false,
    "screen_reader" BOOLEAN NOT NULL DEFAULT false,
    "larger_touch_targets" BOOLEAN NOT NULL DEFAULT false,
    "show_activity_status" BOOLEAN NOT NULL DEFAULT true,
    "allow_story_sharing" BOOLEAN NOT NULL DEFAULT true,
    "who_can_see_posts" TEXT NOT NULL DEFAULT 'followers',
    "who_can_see_stories" TEXT NOT NULL DEFAULT 'followers',
    "tagged_posts_approval" BOOLEAN NOT NULL DEFAULT true,
    "who_can_contact" TEXT NOT NULL DEFAULT 'everyone',
    "comment_filtering" BOOLEAN NOT NULL DEFAULT true,
    "hide_offensive_words" BOOLEAN NOT NULL DEFAULT false,
    "notifications_all" BOOLEAN NOT NULL DEFAULT true,
    "notifications_push" BOOLEAN NOT NULL DEFAULT true,
    "notifications_email" BOOLEAN NOT NULL DEFAULT false,
    "notifications_in_app" BOOLEAN NOT NULL DEFAULT true,
    "notifications_likes" BOOLEAN NOT NULL DEFAULT true,
    "notifications_comments" BOOLEAN NOT NULL DEFAULT true,
    "notifications_follows" BOOLEAN NOT NULL DEFAULT true,
    "notifications_mentions" BOOLEAN NOT NULL DEFAULT true,
    "notifications_reposts" BOOLEAN NOT NULL DEFAULT true,
    "notifications_timing" TEXT NOT NULL DEFAULT 'always',
    "notifications_msg_requests" BOOLEAN NOT NULL DEFAULT true,
    "notifications_group_msgs" BOOLEAN NOT NULL DEFAULT true,
    "notifications_video_calls" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_user_id_key" ON "UserSettings"("user_id");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
