-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allow_comment_notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_follow_notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_like_notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_mention_notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_repost_notifications" BOOLEAN NOT NULL DEFAULT true;

