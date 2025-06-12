/*
  Warnings:

  - A unique constraint covering the columns `[anx_name,created_by]` on the table `anxiety_source` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "anxiety_source_anx_name_key";

-- AlterTable
ALTER TABLE "anxiety_source" ADD COLUMN     "created_by" VARCHAR(255),
ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "anxiety_source_anx_name_created_by_key" ON "anxiety_source"("anx_name", "created_by");

-- AddForeignKey
ALTER TABLE "anxiety_source" ADD CONSTRAINT "anxiety_source_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("firebase_uid") ON DELETE SET NULL ON UPDATE CASCADE;
