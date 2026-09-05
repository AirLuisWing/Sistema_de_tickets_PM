/*
  Warnings:

  - Added the required column `descripcion` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ticket` ADD COLUMN `descripcion` TEXT NOT NULL;
