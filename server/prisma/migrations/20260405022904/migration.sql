-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'COMPLETED');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "status" "OrderItemStatus" NOT NULL DEFAULT 'PENDING';
