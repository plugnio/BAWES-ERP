/*
  Warnings:

  - Added the required column `bitfield` to the `permission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "permission" ADD COLUMN     "bitfield" BIGINT NOT NULL;
