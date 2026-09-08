-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cover_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HighlightItem" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "highlight_id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,

    CONSTRAINT "HighlightItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HighlightItem_highlight_id_story_id_key" ON "HighlightItem"("highlight_id", "story_id");

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighlightItem" ADD CONSTRAINT "HighlightItem_highlight_id_fkey" FOREIGN KEY ("highlight_id") REFERENCES "Highlight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighlightItem" ADD CONSTRAINT "HighlightItem_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
