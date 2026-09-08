-- CreateTable
CREATE TABLE "StoryPollVote" (
    "id" TEXT NOT NULL,
    "option_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "story_id" TEXT NOT NULL,
    "overlay_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "StoryPollVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoryPollVote_story_id_overlay_id_user_id_key" ON "StoryPollVote"("story_id", "overlay_id", "user_id");

-- AddForeignKey
ALTER TABLE "StoryPollVote" ADD CONSTRAINT "StoryPollVote_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPollVote" ADD CONSTRAINT "StoryPollVote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
