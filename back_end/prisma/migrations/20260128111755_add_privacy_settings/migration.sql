-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allow_comments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_mentions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_activity_status" BOOLEAN NOT NULL DEFAULT true;
