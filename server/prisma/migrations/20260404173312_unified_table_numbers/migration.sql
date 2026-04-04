/*
  Warnings:

  - You are about to drop the column `tableId` on the `CustomerSession` table. All the data in the column will be lost.
  - You are about to drop the column `tableId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `Table` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `tableNumber` to the `CustomerSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CustomerSession" DROP CONSTRAINT "CustomerSession_tableId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_tableId_fkey";

-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_tenantId_fkey";

-- DropIndex
DROP INDEX "CustomerSession_tableId_idx";

-- DropIndex
DROP INDEX "Order_tableId_idx";

-- AlterTable
ALTER TABLE "CustomerSession" DROP COLUMN "tableId",
ADD COLUMN     "tableNumber" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "tableId",
ADD COLUMN     "tableNumber" INTEGER;

-- DropTable
DROP TABLE "Table";

-- DropEnum
DROP TYPE "TableStatus";

-- CreateIndex
CREATE INDEX "CustomerSession_tableNumber_tenantId_idx" ON "CustomerSession"("tableNumber", "tenantId");

-- CreateIndex
CREATE INDEX "Order_tableNumber_idx" ON "Order"("tableNumber");
