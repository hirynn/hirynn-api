/*
  Warnings:

  - You are about to drop the column `attachments` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `posts` table. All the data in the column will be lost.
  - Changed the type of `content` on the `posts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "posts" DROP COLUMN "attachments",
DROP COLUMN "title",
DROP COLUMN "content",
ADD COLUMN     "content" JSONB NOT NULL;
