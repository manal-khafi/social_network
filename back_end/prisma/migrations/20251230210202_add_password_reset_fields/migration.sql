/*
  Warnings:

  - A unique constraint covering the columns `[reset_token]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expiry" TIMESTAMP(3),
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_reset_token_key" ON "User"("reset_token");
