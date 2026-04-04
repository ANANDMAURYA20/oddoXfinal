-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "fssaiNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "gstNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "storeAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "storeLogo" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "storePhone" TEXT NOT NULL DEFAULT '';
