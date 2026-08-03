-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "organization_id" TEXT;

-- CreateIndex
CREATE INDEX "posts_organization_id_idx" ON "posts"("organization_id");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
