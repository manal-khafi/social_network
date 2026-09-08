-- CreateTable
CREATE TABLE "StoryQuestionResponse" (
    "id" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "story_id" TEXT NOT NULL,
    "overlay_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "StoryQuestionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoryQuestionResponse_story_id_overlay_id_idx" ON "StoryQuestionResponse"("story_id", "overlay_id");

-- AddForeignKey
ALTER TABLE "StoryQuestionResponse" ADD CONSTRAINT "StoryQuestionResponse_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryQuestionResponse" ADD CONSTRAINT "StoryQuestionResponse_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
