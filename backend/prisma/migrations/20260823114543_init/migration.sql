/*
  Warnings:

  - The `status` column on the `BlacklistedVehicle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `zone` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `zone` on the `TrafficAggregate` table. All the data in the column will be lost.
  - Changed the type of `severity` on the `BlacklistedVehicle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BlacklistSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BlacklistStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- DropIndex
DROP INDEX "BlacklistedVehicle_plateNumber_idx";

-- AlterTable
ALTER TABLE "BlacklistedVehicle" DROP COLUMN "severity",
ADD COLUMN     "severity" "BlacklistSeverity" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "BlacklistStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Camera" DROP COLUMN "zone",
ADD COLUMN     "roadId" TEXT,
ADD COLUMN     "zoneId" TEXT;

-- AlterTable
ALTER TABLE "Prediction" ADD COLUMN     "predictionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TrafficAggregate" DROP COLUMN "zone",
ADD COLUMN     "zoneId" TEXT;

-- CreateTable
CREATE TABLE "Road" (
    "id" TEXT NOT NULL,
    "roadCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "speedLimit" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Road_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "zoneCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Road_roadCode_key" ON "Road"("roadCode");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_zoneCode_key" ON "Zone"("zoneCode");

-- CreateIndex
CREATE INDEX "BlacklistedVehicle_plateNumber_status_idx" ON "BlacklistedVehicle"("plateNumber", "status");

-- CreateIndex
CREATE INDEX "Camera_roadId_idx" ON "Camera"("roadId");

-- CreateIndex
CREATE INDEX "Camera_zoneId_idx" ON "Camera"("zoneId");

-- CreateIndex
CREATE INDEX "CameraTransition_vehicleId_timestamp_idx" ON "CameraTransition"("vehicleId", "timestamp");

-- CreateIndex
CREATE INDEX "CameraTransition_sourceCameraId_timestamp_idx" ON "CameraTransition"("sourceCameraId", "timestamp");

-- CreateIndex
CREATE INDEX "CameraTransition_destinationCameraId_timestamp_idx" ON "CameraTransition"("destinationCameraId", "timestamp");

-- CreateIndex
CREATE INDEX "Prediction_vehicleId_predictionTime_idx" ON "Prediction"("vehicleId", "predictionTime");

-- CreateIndex
CREATE INDEX "TrafficAggregate_zoneId_timeBucket_idx" ON "TrafficAggregate"("zoneId", "timeBucket");

-- CreateIndex
CREATE INDEX "Trajectory_vehicleId_startTime_idx" ON "Trajectory"("vehicleId", "startTime");

-- CreateIndex
CREATE INDEX "Trajectory_startCameraId_startTime_idx" ON "Trajectory"("startCameraId", "startTime");

-- CreateIndex
CREATE INDEX "Trajectory_endCameraId_endTime_idx" ON "Trajectory"("endCameraId", "endTime");

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_roadId_fkey" FOREIGN KEY ("roadId") REFERENCES "Road"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_predictedCameraId_fkey" FOREIGN KEY ("predictedCameraId") REFERENCES "Camera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrafficAggregate" ADD CONSTRAINT "TrafficAggregate_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
