-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "bg_color" TEXT,
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "duration_sec" INTEGER,
ADD COLUMN     "music_artist" TEXT,
ADD COLUMN     "music_cover_url" TEXT,
ADD COLUMN     "music_preview_url" TEXT,
ADD COLUMN     "music_start_sec" INTEGER DEFAULT 0,
ADD COLUMN     "music_title" TEXT,
ADD COLUMN     "music_track_id" TEXT,
ADD COLUMN     "overlays" JSONB,
ADD COLUMN     "shared_post_id" TEXT,
ADD COLUMN     "shared_story_id" TEXT,
ADD COLUMN     "thumbnail_url" TEXT;

-- CreateTable
CREATE TABLE "StoryReaction" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,

    CONSTRAINT "StoryReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoryReaction_user_id_story_id_key" ON "StoryReaction"("user_id", "story_id");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_shared_post_id_fkey" FOREIGN KEY ("shared_post_id") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_shared_story_id_fkey" FOREIGN KEY ("shared_story_id") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryReaction" ADD CONSTRAINT "StoryReaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryReaction" ADD CONSTRAINT "StoryReaction_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
