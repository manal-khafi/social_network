-- CreateEnum
CREATE TYPE "CommunityType" AS ENUM ('tech', 'health', 'education', 'sports', 'entertainment', 'business', 'arts', 'travel', 'food', 'lifestyle', 'other');

-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "type" "CommunityType" NOT NULL DEFAULT 'other';
