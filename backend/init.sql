-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'MOTORCYCLE', 'SCOOTER', 'AUTO', 'BUS', 'TRUCK', 'VAN', 'TAXI');

-- CreateEnum
CREATE TYPE "DetectionSource" AS ENUM ('SIMULATION', 'AI');

-- CreateEnum
CREATE TYPE "CameraStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "AnomalyType" AS ENUM ('ROUTE_ANOMALY', 'UNUSUAL_TRAVEL_TIME', 'UNUSUAL_CAMERA_TRANSITION');

-- CreateEnum
CREATE TYPE "BlacklistSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BlacklistStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('BLACKLIST_MATCH', 'ROUTE_ANOMALY', 'CONGESTION');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "TrafficEventType" AS ENUM ('ACCIDENT', 'ROAD_BLOCK', 'CONGESTION', 'VEHICLE_BREAKDOWN');

-- CreateEnum
CREATE TYPE "TrafficEventStatus" AS ENUM ('ACTIVE', 'RESOLVED');

-- CreateEnum
CREATE TYPE "BlacklistAlertStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "VehicleIncidentType" AS ENUM ('CRASH', 'BREAKDOWN', 'TRAFFIC_VIOLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleIncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "VehicleIncidentStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('POTHOLE', 'ACCIDENT', 'ROAD_DAMAGE', 'TRAFFIC_SIGNAL', 'STREETLIGHT', 'WATERLOGGING', 'ROAD_BLOCKAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('ACCIDENT', 'ROAD_BLOCKAGE', 'CONGESTION', 'VEHICLE_ALERT', 'BLACKLIST_DETECTION', 'HAZARD', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "IncidentSource" AS ENUM ('SIMULATION', 'USER', 'ADMIN', 'AI');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "vehicleType" "VehicleType",
    "color" TEXT,
    "currentRoadId" TEXT,
    "speed" DOUBLE PRECISION,
    "status" TEXT DEFAULT 'ACTIVE',
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camera" (
    "id" TEXT NOT NULL,
    "cameraCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "direction" TEXT,
    "roadId" TEXT,
    "zoneId" TEXT,
    "status" "CameraStatus" NOT NULL DEFAULT 'ONLINE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Camera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Road" (
    "id" TEXT NOT NULL,
    "roadCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "speedLimit" DOUBLE PRECISION,
    "geometry" JSONB,
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

-- CreateTable
CREATE TABLE "Detection" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "plateText" TEXT NOT NULL,
    "ocrConfidence" DOUBLE PRECISION,
    "vehicleConfidence" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "direction" TEXT,
    "lane" INTEGER,
    "imageUrl" TEXT,
    "source" "DetectionSource" NOT NULL DEFAULT 'SIMULATION',
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "blacklistId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Detection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CameraTransition" (
    "id" TEXT NOT NULL,
    "sourceCameraId" TEXT NOT NULL,
    "destinationCameraId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "travelTimeSeconds" INTEGER,
    "distanceMeters" DOUBLE PRECISION,
    "averageSpeed" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CameraTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trajectory" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "startCameraId" TEXT NOT NULL,
    "endCameraId" TEXT NOT NULL,
    "distanceMeters" DOUBLE PRECISION,
    "averageSpeed" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trajectory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "currentCameraId" TEXT NOT NULL,
    "predictedCameraId" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "predictionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnomalyEvent" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "type" "AnomalyType" NOT NULL,
    "score" DOUBLE PRECISION,
    "expectedRoute" JSONB,
    "observedRoute" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnomalyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "vehicleId" TEXT,
    "cameraId" TEXT,
    "anomalyEventId" TEXT,
    "message" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistedVehicle" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" "BlacklistSeverity" NOT NULL,
    "status" "BlacklistStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlacklistedVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrafficAggregate" (
    "id" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "zoneId" TEXT,
    "timeBucket" TIMESTAMP(3) NOT NULL,
    "vehicleCount" INTEGER NOT NULL DEFAULT 0,
    "averageSpeed" DOUBLE PRECISION,
    "trafficDensity" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CameraHealth" (
    "id" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "status" "CameraStatus" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseMs" INTEGER,
    "errorMessage" TEXT,

    CONSTRAINT "CameraHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrafficEvent" (
    "id" TEXT NOT NULL,
    "type" "TrafficEventType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "cameraId" TEXT,
    "roadId" TEXT,
    "zoneId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT,
    "status" "TrafficEventStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMetric" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeCameras" INTEGER NOT NULL DEFAULT 0,
    "activeVehicles" INTEGER NOT NULL DEFAULT 0,
    "totalDetections" INTEGER NOT NULL DEFAULT 0,
    "activeAlerts" INTEGER NOT NULL DEFAULT 0,
    "averageSpeed" DOUBLE PRECISION,
    "trafficDensity" DOUBLE PRECISION,

    CONSTRAINT "SystemMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistAlert" (
    "id" TEXT NOT NULL,
    "detectionEventId" TEXT NOT NULL,
    "blacklistId" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "status" "BlacklistAlertStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleIncident" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "cameraId" TEXT,
    "type" "VehicleIncidentType" NOT NULL,
    "severity" "VehicleIncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "VehicleIncidentStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "ComplaintCategory" NOT NULL,
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'LOW',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "roadId" TEXT,
    "nearestCameraId" TEXT,
    "incidentId" TEXT,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "roadId" TEXT,
    "cameraId" TEXT,
    "vehicleId" TEXT,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "IncidentStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "IncidentSource" NOT NULL DEFAULT 'SIMULATION',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "startLatitude" DOUBLE PRECISION NOT NULL,
    "startLongitude" DOUBLE PRECISION NOT NULL,
    "destinationLatitude" DOUBLE PRECISION NOT NULL,
    "destinationLongitude" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION,
    "estimatedTime" DOUBLE PRECISION,
    "routeGeometry" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Camera_cameraCode_key" ON "Camera"("cameraCode");

-- CreateIndex
CREATE INDEX "Camera_roadId_idx" ON "Camera"("roadId");

-- CreateIndex
CREATE INDEX "Camera_zoneId_idx" ON "Camera"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "Road_roadCode_key" ON "Road"("roadCode");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_zoneCode_key" ON "Zone"("zoneCode");

-- CreateIndex
CREATE INDEX "Detection_vehicleId_timestamp_idx" ON "Detection"("vehicleId", "timestamp");

-- CreateIndex
CREATE INDEX "Detection_cameraId_timestamp_idx" ON "Detection"("cameraId", "timestamp");

-- CreateIndex
CREATE INDEX "Detection_plateText_idx" ON "Detection"("plateText");

-- CreateIndex
CREATE INDEX "Detection_timestamp_idx" ON "Detection"("timestamp");

-- CreateIndex
CREATE INDEX "CameraTransition_vehicleId_timestamp_idx" ON "CameraTransition"("vehicleId", "timestamp");

-- CreateIndex
CREATE INDEX "CameraTransition_sourceCameraId_timestamp_idx" ON "CameraTransition"("sourceCameraId", "timestamp");

-- CreateIndex
CREATE INDEX "CameraTransition_destinationCameraId_timestamp_idx" ON "CameraTransition"("destinationCameraId", "timestamp");

-- CreateIndex
CREATE INDEX "Trajectory_vehicleId_startTime_idx" ON "Trajectory"("vehicleId", "startTime");

-- CreateIndex
CREATE INDEX "Trajectory_startCameraId_startTime_idx" ON "Trajectory"("startCameraId", "startTime");

-- CreateIndex
CREATE INDEX "Trajectory_endCameraId_endTime_idx" ON "Trajectory"("endCameraId", "endTime");

-- CreateIndex
CREATE INDEX "Prediction_vehicleId_predictionTime_idx" ON "Prediction"("vehicleId", "predictionTime");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistedVehicle_plateNumber_key" ON "BlacklistedVehicle"("plateNumber");

-- CreateIndex
CREATE INDEX "BlacklistedVehicle_plateNumber_status_idx" ON "BlacklistedVehicle"("plateNumber", "status");

-- CreateIndex
CREATE INDEX "TrafficAggregate_cameraId_timeBucket_idx" ON "TrafficAggregate"("cameraId", "timeBucket");

-- CreateIndex
CREATE INDEX "TrafficAggregate_zoneId_timeBucket_idx" ON "TrafficAggregate"("zoneId", "timeBucket");

-- CreateIndex
CREATE INDEX "CameraHealth_cameraId_recordedAt_idx" ON "CameraHealth"("cameraId", "recordedAt");

-- CreateIndex
CREATE INDEX "TrafficEvent_cameraId_startedAt_idx" ON "TrafficEvent"("cameraId", "startedAt");

-- CreateIndex
CREATE INDEX "TrafficEvent_roadId_startedAt_idx" ON "TrafficEvent"("roadId", "startedAt");

-- CreateIndex
CREATE INDEX "TrafficEvent_zoneId_startedAt_idx" ON "TrafficEvent"("zoneId", "startedAt");

-- CreateIndex
CREATE INDEX "TrafficEvent_status_idx" ON "TrafficEvent"("status");

-- CreateIndex
CREATE INDEX "BlacklistAlert_plateNumber_timestamp_idx" ON "BlacklistAlert"("plateNumber", "timestamp");

-- CreateIndex
CREATE INDEX "BlacklistAlert_cameraId_timestamp_idx" ON "BlacklistAlert"("cameraId", "timestamp");

-- CreateIndex
CREATE INDEX "BlacklistAlert_blacklistId_idx" ON "BlacklistAlert"("blacklistId");

-- CreateIndex
CREATE INDEX "VehicleIncident_vehicleId_timestamp_idx" ON "VehicleIncident"("vehicleId", "timestamp");

-- CreateIndex
CREATE INDEX "Complaint_userId_idx" ON "Complaint"("userId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_category_idx" ON "Complaint"("category");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_type_idx" ON "Incident"("type");

-- CreateIndex
CREATE INDEX "Incident_timestamp_idx" ON "Incident"("timestamp");

-- CreateIndex
CREATE INDEX "Trip_userId_idx" ON "Trip"("userId");

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_roadId_fkey" FOREIGN KEY ("roadId") REFERENCES "Road"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

